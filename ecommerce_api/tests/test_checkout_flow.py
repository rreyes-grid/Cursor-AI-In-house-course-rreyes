"""Checkout journey coverage: catalog → cart → discount → PSP → confirmation → email audit."""

from __future__ import annotations

from urllib.parse import quote

import pytest

from app import create_app
from app.extensions import db
from app.models.discount import DiscountCode
from app.models.email_notification import EmailNotification
from app.models.order import Order
from app.models.product import Product

from tests import test_data_generators as gen


def _count_notifications(application) -> int:
    with application.app_context():
        return EmailNotification.query.count()


def _product_stock(application, pid: int) -> int:
    with application.app_context():
        row = db.session.get(Product, pid)
        assert row is not None
        return row.stock_qty


def test_cart_positive_merge_quantity_then_multi_sku_totals(buyer, seed_catalog):
    """CART-P01 / CART-P02 — merge duplicates and tally mixed catalog lines."""

    mug_id, mug_price = seed_catalog.mug_id, seed_catalog.mug_price_cents
    tote_id, tote_price = seed_catalog.tote_id, seed_catalog.tote_price_cents

    buyer.post("/api/cart/items", json={"product_id": mug_id, "quantity": 2})
    buyer.post("/api/cart/items", json={"product_id": mug_id, "quantity": 3})

    merged = buyer.post("/api/cart/items", json={"product_id": tote_id, "quantity": 1}).get_json()

    expected_subtotal = 5 * mug_price + tote_price
    assert merged["subtotal_cents"] == expected_subtotal
    assert len(merged["lines"]) == 2


def test_cart_negative_requires_auth(client, seed_catalog):
    res = client.post(
        "/api/cart/items",
        json={"product_id": seed_catalog.mug_id, "quantity": 1},
    )
    assert res.status_code == 401


def test_cart_negative_unknown_product_returns_404(buyer, seed_catalog):
    phantom_id = seed_catalog.inactive_id + 99_999
    res = buyer.post("/api/cart/items", json={"product_id": phantom_id, "quantity": 1})
    assert res.status_code == 404


def test_cart_negative_inactive_catalog_not_addable(buyer, seed_catalog):
    res = buyer.post("/api/cart/items", json={"product_id": seed_catalog.inactive_id, "quantity": 1})
    assert res.status_code == 404


def test_cart_negative_out_of_stock(buyer, seed_catalog):
    cap = seed_catalog.tote_stock_qty
    res = buyer.post(
        "/api/cart/items",
        json={"product_id": seed_catalog.tote_id, "quantity": cap + 1},
    )
    assert res.status_code == 422


def test_cart_edge_patch_qty_respects_stock_ceiling(buyer, seed_catalog):
    cap = seed_catalog.tote_stock_qty
    buyer.post("/api/cart/items", json={"product_id": seed_catalog.tote_id, "quantity": cap})
    line_id = buyer.get("/api/cart").get_json()["lines"][0]["cart_item_id"]

    forbidden = buyer.patch(f"/api/cart/items/{line_id}", json={"quantity": cap + 1})
    assert forbidden.status_code == 422


def test_discount_positive_save10_met(buyer, seed_catalog):
    buyer.post("/api/cart/items", json={"product_id": seed_catalog.mug_id, "quantity": 1})

    disc = buyer.post("/api/cart/discount", json={"code": seed_catalog.save10_code})
    assert disc.status_code == 200
    totals = disc.get_json()
    pct = 10
    assert totals["discount_cents"] == totals["subtotal_cents"] * pct // 100


def test_discount_negative_below_minimum_subtotal(buyer, seed_catalog):
    buyer.post("/api/cart/items", json={"product_id": seed_catalog.low_mug_id, "quantity": 1})

    res = buyer.post("/api/cart/discount", json={"code": "SAVE10"})
    assert res.status_code == 422


def test_discount_negative_expired_coupon_returns_422(buyer, seed_catalog):
    buyer.post("/api/cart/items", json={"product_id": seed_catalog.mug_id, "quantity": 2})

    res = buyer.post("/api/cart/discount", json={"code": seed_catalog.expired88_code})
    assert res.status_code == 422


def test_discount_negative_unknown_code_returns_404(buyer, seed_catalog):
    buyer.post("/api/cart/items", json={"product_id": seed_catalog.mug_id, "quantity": 1})

    missing = buyer.post("/api/cart/discount", json={"code": "MAGIC999"})
    assert missing.status_code == 404


def test_discount_remove_resets_projection(buyer, seed_catalog):
    buyer.post("/api/cart/items", json={"product_id": seed_catalog.mug_id, "quantity": 1})
    buyer.post("/api/cart/discount", json={"code": "SAVE10"})
    stripped = buyer.delete("/api/cart/discount").get_json()
    assert stripped["discount_cents"] == 0
    assert stripped["discount_code"] is None


@pytest.mark.parametrize("token", ["tok_charge_success", "tok_charge_success_customsuffix"])
def test_checkout_positive_full_flow_confirmation_inventory_email(token, buyer, app, seed_catalog):
    """CHK-P01 — capture payment, decrement stock, purge cart, queue notification."""

    tote_id = seed_catalog.tote_id
    tote_price = seed_catalog.tote_price_cents
    qty = 2
    before_notifications = _count_notifications(app)

    buyer.post("/api/cart/items", json={"product_id": tote_id, "quantity": qty})

    checkout = buyer.post("/api/orders/checkout", json={"payment_token": token})

    assert checkout.status_code == 201
    payload = checkout.get_json()
    confirmation = payload["order"]
    assert confirmation["payment_status"] == "succeeded"
    assert confirmation["confirmation_number"]

    computed_total = qty * tote_price
    assert confirmation["total_cents"] == computed_total

    starting_stock = seed_catalog.tote_stock_qty
    assert _product_stock(app, tote_id) == starting_stock - qty

    cart_cleared = buyer.get("/api/cart").get_json()
    assert cart_cleared["lines"] == []

    assert _count_notifications(app) == before_notifications + 1

    with app.app_context():
        note = EmailNotification.query.order_by(EmailNotification.id.desc()).first()
        assert note.notification_type == "order_confirmation"
        assert confirmation["confirmation_number"] in note.body_text
        assert note.smtp_attempted is False


def test_checkout_edge_empty_cart_returns_422(buyer):
    res = buyer.post("/api/orders/checkout", json={"payment_token": "tok_charge_success"})
    assert res.status_code == 422


def test_checkout_negative_payment_declined_preserves_inventory(buyer, app, seed_catalog):
    tote_id = seed_catalog.tote_id
    qty = 3

    notifications_before = _count_notifications(app)
    initial_stock = _product_stock(app, tote_id)

    buyer.post("/api/cart/items", json={"product_id": tote_id, "quantity": qty})

    res = buyer.post("/api/orders/checkout", json={"payment_token": "tok_charge_declined"})
    assert res.status_code == 402
    body = res.get_json()
    assert body["code"] == "PAYMENT_DECLINED"
    assert "cart" in body

    assert _product_stock(app, tote_id) == initial_stock

    restored = buyer.get("/api/cart").get_json()
    assert restored["subtotal_cents"] == qty * seed_catalog.tote_price_cents

    assert _count_notifications(app) == notifications_before


@pytest.mark.parametrize("bad_token", list(gen.oversized_payment_tokens()))
def test_checkout_negative_invalid_psp_tokens_or_schema(bad_token, buyer, seed_catalog):
    buyer.post("/api/cart/items", json={"product_id": seed_catalog.mug_id, "quantity": 1})
    resp = buyer.post("/api/orders/checkout", json={"payment_token": bad_token})
    assert resp.status_code in {400, 402}


def test_checkout_negative_payment_field_length_validation(buyer, seed_catalog):
    buyer.post("/api/cart/items", json={"product_id": seed_catalog.mug_id, "quantity": 1})

    tiny = buyer.post("/api/orders/checkout", json={"payment_token": "ab"})
    assert tiny.status_code == 400

    oversized = buyer.post("/api/orders/checkout", json={"payment_token": "x" * 129})
    assert oversized.status_code == 400


def test_checkout_negative_missing_payment_token_field(buyer, seed_catalog):
    buyer.post("/api/cart/items", json={"product_id": seed_catalog.mug_id, "quantity": 1})

    malformed = buyer.post("/api/orders/checkout", json={})
    assert malformed.status_code == 400


def test_checkout_negative_service_flag_disables_mock_psp(tmp_path):
    uri = f"sqlite:///{tmp_path.joinpath('gateway_off.db').resolve()}"
    guarded = create_app("testing", SQLALCHEMY_DATABASE_URI=uri, MOCK_PAYMENT_ENABLED=False)
    cli = guarded.test_client()

    with guarded.app_context():
        db.create_all()
        hero = Product(
            sku="GATE-OFF",
            title="Ghost SKU",
            description="fixture",
            price_cents=1000,
            stock_qty=3,
            active=True,
        )
        db.session.add(hero)
        db.session.commit()
        sku_id = hero.id

    reg = cli.post(
        "/api/auth/register",
        json=gen.register_payload(email="fixture.gateway@pytest.local"),
    )
    tok = reg.get_json()["access_token"]

    hdr = {"Authorization": f"Bearer {tok}"}
    cli.post("/api/cart/items", headers=hdr, json={"product_id": sku_id, "quantity": 1})

    out = cli.post("/api/orders/checkout", headers=hdr, json={"payment_token": "tok_charge_success"})
    assert out.status_code == 503


def test_checkout_positive_discount_increments_uses_after_success(buyer, app, seed_catalog):
    with app.app_context():
        baseline = DiscountCode.query.filter_by(code="SAVE10").one().uses_count

    buyer.post("/api/cart/items", json={"product_id": seed_catalog.mug_id, "quantity": 3})
    buyer.post("/api/cart/discount", json={"code": "SAVE10"})
    checkout = buyer.post("/api/orders/checkout", json={"payment_token": "tok_charge_success"})
    assert checkout.status_code == 201

    with app.app_context():
        dc = DiscountCode.query.filter_by(code="SAVE10").one()
        assert dc.uses_count == baseline + 1


def test_checkout_negative_discount_not_incremented_on_declined_psp(buyer, app, seed_catalog):
    buyer.post("/api/cart/items", json={"product_id": seed_catalog.mug_id, "quantity": 2})
    buyer.post("/api/cart/discount", json={"code": "SAVE10"})
    with app.app_context():
        baseline = DiscountCode.query.filter_by(code="SAVE10").one().uses_count

    buyer.post("/api/orders/checkout", json={"payment_token": "tok_charge_declined"})

    with app.app_context():
        assert DiscountCode.query.filter_by(code="SAVE10").one().uses_count == baseline


@pytest.mark.parametrize("squib", tuple(gen.malicious_search_strings()))
def test_catalog_search_sql_injection_payloads_yield_ok_response(client, squib):
    quoted = quote(squib, safe="")
    res = client.get(f"/api/products?q={quoted}")
    assert res.status_code == 200


def test_mass_assignment_unknown_checkout_fields_rejected(app, buyer, seed_catalog):
    """SEC-EXTRA — marshmallow rejects unknown JSON keys rather than trusting them blindly."""

    mug = seed_catalog.mug_id
    buyer.post("/api/cart/items", json={"product_id": mug, "quantity": 1})
    spoof = buyer.post(
        "/api/orders/checkout",
        json={
            "payment_token": "tok_charge_success",
            "role": "admin",
            "total_cents_override": 1,
        },
    )
    assert spoof.status_code == 400
    message = spoof.get_json().get("message", "").lower()
    assert "validation" in message


def test_checkout_positive_ignores_order_total_spoof_with_schema_only_known_fields(app, buyer, seed_catalog):
    """SEC-CONTROL — benign payload succeeds; totals come from server reconciliation."""

    buyer.post("/api/cart/items", json={"product_id": seed_catalog.mug_id, "quantity": 1})
    spoof = buyer.post("/api/orders/checkout", json={"payment_token": "tok_charge_success"})
    assert spoof.status_code == 201
    with app.app_context():
        od = Order.query.order_by(Order.id.desc()).first()
        assert od.total_cents == seed_catalog.mug_price_cents


def test_order_history_scoped_between_shoppers(buyer, other_buyer, seed_catalog):
    tote = seed_catalog.tote_id
    buyer.post("/api/cart/items", json={"product_id": tote, "quantity": 1})
    mine = buyer.post("/api/orders/checkout", json={"payment_token": "tok_charge_success"}).get_json()["order"]

    voyeur = other_buyer.get(f"/api/orders/{mine['id']}")
    assert voyeur.status_code == 404


def test_checkout_negative_missing_jwt(client):
    guarded = client.post(
        "/api/orders/checkout",
        json={"payment_token": "tok_charge_success"},
    )
    assert guarded.status_code == 401


def test_notifications_email_audit_endpoint_lists_rows(buyer, app, seed_catalog):
    before = buyer.get("/api/notifications/email").get_json()
    qty_before = len(before["notifications"])

    buyer.post("/api/cart/items", json={"product_id": seed_catalog.mug_id, "quantity": 1})
    buyer.post("/api/orders/checkout", json={"payment_token": "tok_charge_success"})

    after = buyer.get("/api/notifications/email").get_json()
    assert len(after["notifications"]) == qty_before + 1
