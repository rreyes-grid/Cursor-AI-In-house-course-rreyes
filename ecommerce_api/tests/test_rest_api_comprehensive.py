"""
Breadth-first REST coverage for shoppers: auth/session, catalog reads, cart
mutations (GET/POST/PATCH/DELETE-style routes), notifications, authorization,
validation shapes, Flask-Limiter throttling (optional app), and coarse latency
checks.

Concrete checkout scenarios live in ``test_checkout_flow.py``.
Registration collisions are in ``test_auth_registration``.

The storefront API does **not** expose DELETE for products or shopper accounts:
DELETE coverage targets cart lines and persisted discount removals only.
"""

from __future__ import annotations

import time

import pytest

from tests import test_data_generators as gen


PERF_BUDGET_S = 0.5


def _timed_get(client, path: str) -> tuple[float, object]:
    t0 = time.perf_counter()
    response = client.get(path)
    return time.perf_counter() - t0, response


class TestSystemAndCatalog:
    def test_health_get_success(self, client):
        res = client.get("/health")
        assert res.status_code == 200
        body = res.get_json()
        assert body.get("status") == "ok"
        assert body.get("service") == "ecommerce-api"

    def test_products_list_get_active_only(self, client, seed_catalog):
        res = client.get("/api/products")
        assert res.status_code == 200
        ids = {p["id"] for p in res.get_json()["products"]}
        assert seed_catalog.mug_id in ids
        assert seed_catalog.tote_id in ids
        assert seed_catalog.inactive_id not in ids

    def test_products_list_query_param_filters(self, client, seed_catalog):
        res = client.get("/api/products", query_string={"q": "mug"})
        assert res.status_code == 200
        titles = {p["title"] for p in res.get_json()["products"]}
        assert titles

    def test_product_detail_get_success(self, client, seed_catalog):
        res = client.get(f"/api/products/{seed_catalog.mug_id}")
        assert res.status_code == 200
        assert res.get_json()["product"]["sku"]

    def test_product_detail_get_inactive_returns_404(self, client, seed_catalog):
        res = client.get(f"/api/products/{seed_catalog.inactive_id}")
        assert res.status_code == 404

    def test_product_detail_get_unknown_returns_404(self, client, seed_catalog):
        res = client.get("/api/products/999999")
        assert res.status_code == 404


class TestAuthAndSession:
    def test_register_post_success_shape(self, client, seed_catalog):
        payload = gen.register_payload(name="API Broad Test")
        res = client.post("/api/auth/register", json=payload)
        assert res.status_code == 201
        body = res.get_json()
        assert body["status"] == "success"
        assert body["token_type"] == "Bearer"
        assert body["access_token"]
        assert body["user"]["email"] == payload["email"].lower()

    def test_register_post_validation_missing_password(self, client, seed_catalog):
        res = client.post(
            "/api/auth/register",
            json={"email": gen.unique_email("nopw"), "name": "X"},
        )
        assert res.status_code == 400
        assert res.get_json()["code"] == "VALIDATION_ERROR"

    def test_register_post_validation_short_password(self, client, seed_catalog):
        res = client.post(
            "/api/auth/register",
            json={
                "email": gen.unique_email("shortpw"),
                "name": "X",
                "password": "short",
            },
        )
        assert res.status_code == 400

    def test_register_post_validation_bad_email(self, client, seed_catalog):
        res = client.post(
            "/api/auth/register",
            json={"email": "not-email", "name": "X", "password": "LongEnough1!"},
        )
        assert res.status_code == 400

    def test_login_post_success(self, client, seed_catalog):
        payload = gen.register_payload(prefix="loginok")
        assert client.post("/api/auth/register", json=payload).status_code == 201
        res = client.post(
            "/api/auth/login",
            json={"email": payload["email"], "password": payload["password"]},
        )
        assert res.status_code == 200
        assert res.get_json()["access_token"]

    def test_login_post_invalid_credentials_returns_401(self, client, seed_catalog):
        res = client.post(
            "/api/auth/login",
            json={"email": "ghost@example.test", "password": "NoSuchUserxx1"},
        )
        assert res.status_code == 401
        assert res.get_json()["code"] == "UNAUTHORIZED"

    def test_login_post_validation_missing_email(self, client, seed_catalog):
        res = client.post("/api/auth/login", json={"password": "x"})
        assert res.status_code == 400

    def test_me_get_requires_bearer(self, client):
        assert client.get("/api/auth/me").status_code == 401

    def test_me_get_success_authenticated(self, buyer):
        res = buyer.get("/api/auth/me")
        assert res.status_code == 200
        assert res.get_json()["user"]["id"]

    def test_logout_post_requires_valid_jwt_shape(self, client):
        res = client.post(
            "/api/auth/logout",
            headers={"Authorization": "Bearer not-a-real-jwt"},
        )
        assert res.status_code == 422

    def test_logout_post_success(self, buyer):
        res = buyer.post("/api/auth/logout")
        assert res.status_code == 204


class TestUserProfileMutations:
    def test_users_me_put_requires_auth(self, client):
        res = client.put("/api/users/me", json={"name": "solo"})
        assert res.status_code == 401

    def test_users_me_put_updates_name(self, buyer):
        res = buyer.put("/api/users/me", json={"name": "Rename Flow"})
        assert res.status_code == 200
        assert res.get_json()["user"]["name"] == "Rename Flow"

    def test_users_me_put_empty_body_noop(self, buyer):
        me = buyer.get("/api/auth/me").get_json()["user"]
        res = buyer.put("/api/users/me", json={})
        assert res.status_code == 200
        assert res.get_json()["user"]["name"] == me["name"]

    def test_users_me_put_validation_name_too_long(self, buyer):
        res = buyer.put("/api/users/me", json={"name": "n" * 161})
        assert res.status_code == 400


class TestCartCrud:
    def test_cart_get_requires_auth(self, client):
        assert client.get("/api/cart").status_code == 401

    def test_cart_get_empty_initially(self, buyer):
        res = buyer.get("/api/cart")
        assert res.status_code == 200
        assert res.get_json()["lines"] == []

    def test_cart_post_add_item_success(self, buyer, seed_catalog):
        res = buyer.post(
            "/api/cart/items",
            json={"product_id": seed_catalog.mug_id, "quantity": 1},
        )
        assert res.status_code == 201
        assert res.get_json()["subtotal_cents"] == seed_catalog.mug_price_cents

    def test_cart_post_validation_invalid_quantity(self, buyer, seed_catalog):
        res = buyer.post(
            "/api/cart/items",
            json={"product_id": seed_catalog.mug_id, "quantity": 0},
        )
        assert res.status_code == 400

    def test_cart_patch_updates_quantity(self, buyer, seed_catalog):
        buyer.post(
            "/api/cart/items",
            json={"product_id": seed_catalog.mug_id, "quantity": 1},
        )
        line_id = buyer.get("/api/cart").get_json()["lines"][0]["cart_item_id"]
        res = buyer.patch(f"/api/cart/items/{line_id}", json={"quantity": 3})
        assert res.status_code == 200
        assert res.get_json()["lines"][0]["quantity"] == 3

    def test_cart_patch_unknown_line_returns_404(self, buyer):
        res = buyer.patch("/api/cart/items/999999", json={"quantity": 2})
        assert res.status_code == 404

    def test_cart_delete_line_removes_row(self, buyer, seed_catalog):
        buyer.post(
            "/api/cart/items",
            json={"product_id": seed_catalog.mug_id, "quantity": 1},
        )
        line_id = buyer.get("/api/cart").get_json()["lines"][0]["cart_item_id"]
        res = buyer.delete(f"/api/cart/items/{line_id}")
        assert res.status_code == 200
        assert res.get_json()["lines"] == []

    def test_cart_discount_post_apply_and_delete(self, buyer, seed_catalog):
        buyer.post(
            "/api/cart/items",
            json={"product_id": seed_catalog.mug_id, "quantity": 1},
        )
        res = buyer.post("/api/cart/discount", json={"code": "SAVE10"})
        assert res.status_code == 200
        assert res.get_json()["discount_code"] == "SAVE10"

        cleared = buyer.delete("/api/cart/discount")
        assert cleared.status_code == 200
        assert cleared.get_json()["discount_cents"] == 0


class TestOrdersAndNotificationsAuthorization:
    def test_orders_list_requires_auth(self, client):
        assert client.get("/api/orders").status_code == 401

    def test_orders_list_get_empty_ok(self, buyer):
        res = buyer.get("/api/orders")
        assert res.status_code == 200
        assert res.get_json()["orders"] == []

    def test_orders_checkout_requires_auth(self, client, seed_catalog):
        res = client.post(
            "/api/orders/checkout",
            json={"payment_token": "tok_charge_success"},
        )
        assert res.status_code == 401

    def test_notifications_email_requires_auth(self, client):
        assert client.get("/api/notifications/email").status_code == 401

    def test_notifications_email_get_success(self, buyer):
        res = buyer.get("/api/notifications/email")
        assert res.status_code == 200
        assert "notifications" in res.get_json()


class TestRateLimiting:
    def test_default_limiter_triggers_429_under_global_quota(self, client_rate_limited):
        """Blueprint routes consume the global Flask-Limiter default (tight quota in fixture)."""
        stats: dict[int, int] = {}
        for _ in range(5):
            res = client_rate_limited.get("/api/products")
            stats[res.status_code] = stats.get(res.status_code, 0) + 1
        assert stats[200] == 4
        assert stats[429] == 1
        err = client_rate_limited.get("/api/products")
        assert err.status_code == 429
        body = err.get_json()
        assert body.get("status") == "error"
        assert body.get("code") == "RATE_LIMIT_EXCEEDED"


class TestLatencyBudget:
    """Local SQLite + in-process client should answer well under half a second."""

    @pytest.mark.parametrize("path", ["/health", "/api/products"])
    def test_public_reads_under_budget(self, client, seed_catalog, path):
        elapsed, res = _timed_get(client, path)
        assert res.status_code == 200
        assert elapsed < PERF_BUDGET_S

    def test_authenticated_cart_get_under_budget(self, buyer, seed_catalog):
        t0 = time.perf_counter()
        res = buyer.get("/api/cart")
        elapsed = time.perf_counter() - t0
        assert res.status_code == 200
        assert elapsed < PERF_BUDGET_S
