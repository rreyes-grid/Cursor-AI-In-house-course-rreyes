"""Shared pytest fixtures backed by ephemeral SQLite databases."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta

import pytest

from app import create_app
from app.extensions import db
from app.models.discount import DiscountCode
from app.models.product import Product

from tests import test_data_generators as generators


@dataclass
class SeedCatalog:
    """Committed primary keys / pricing snapshot (avoid detached ORM entities)."""

    mug_id: int
    mug_price_cents: int
    low_mug_id: int
    low_mug_price_cents: int
    tote_id: int
    tote_price_cents: int
    tote_stock_qty: int
    inactive_id: int
    save10_code: str
    expired88_code: str


@pytest.fixture(autouse=True)
def _serial_reset():
    generators.reset_serial()
    yield


@pytest.fixture
def app(tmp_path):
    db_uri = f"sqlite:///{tmp_path.joinpath('checkout_test.db').resolve()}"
    application = create_app("testing", SQLALCHEMY_DATABASE_URI=db_uri)
    with application.app_context():
        db.create_all()
    yield application
    with application.app_context():
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def app_rate_limited(tmp_path):
    """App with Flask-Limiter enabled and a modest global quota for throttle tests."""

    db_uri = f"sqlite:///{tmp_path.joinpath('rate_limit.db').resolve()}"
    application = create_app(
        "testing",
        SQLALCHEMY_DATABASE_URI=db_uri,
        RATELIMIT_ENABLED_IN_TESTS=True,
        RATELIMIT_DEFAULT="4 per minute",
    )
    with application.app_context():
        db.create_all()
    yield application
    with application.app_context():
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client_rate_limited(app_rate_limited):
    return app_rate_limited.test_client()


@pytest.fixture
def seed_catalog(app) -> SeedCatalog:
    """Minimum catalog for checkout scenarios."""

    with app.app_context():
        mug = Product(
            sku=generators.unique_sku("MUG"),
            title="Test Mug",
            description="pytest catalog",
            price_cents=2999,
            stock_qty=100,
            active=True,
        )
        low_mug = Product(
            sku=generators.unique_sku("LOW"),
            title="Low Price Mug",
            description="below SAVE10 minimum alone",
            price_cents=1000,
            stock_qty=50,
            active=True,
        )
        tote = Product(
            sku=generators.unique_sku("TOTE"),
            title="Test Tote",
            description="pytest catalog",
            price_cents=2499,
            stock_qty=5,
            active=True,
        )
        inactive = Product(
            sku=generators.unique_sku("OFF"),
            title="Retired SKU",
            description="inactive",
            price_cents=5000,
            stock_qty=0,
            active=False,
        )
        save10 = DiscountCode(
            code="SAVE10",
            percent_off=10,
            amount_off_cents=None,
            min_subtotal_cents=2000,
        )
        welcome5 = DiscountCode(
            code="WELCOME5",
            percent_off=None,
            amount_off_cents=500,
            min_subtotal_cents=1500,
        )
        expired88 = DiscountCode(
            code="EXPIRED88",
            percent_off=15,
            amount_off_cents=None,
            min_subtotal_cents=0,
            valid_until=datetime.utcnow() - timedelta(days=1),
        )
        db.session.add_all([mug, low_mug, tote, inactive, save10, welcome5, expired88])
        db.session.commit()

        return SeedCatalog(
            mug_id=mug.id,
            mug_price_cents=mug.price_cents,
            low_mug_id=low_mug.id,
            low_mug_price_cents=low_mug.price_cents,
            tote_id=tote.id,
            tote_price_cents=tote.price_cents,
            tote_stock_qty=tote.stock_qty,
            inactive_id=inactive.id,
            save10_code=save10.code,
            expired88_code=expired88.code,
        )


@pytest.fixture
def auth_token(client, seed_catalog):
    payload = generators.register_payload()
    res = client.post("/api/auth/register", json=payload)
    assert res.status_code == 201, res.get_data(as_text=True)
    token = res.get_json()["access_token"]
    assert token
    return token


def authorized(client, token: str):
    class Proxy:
        def get(self, path, **kw):
            h = dict(kw.pop("headers", {}))
            h["Authorization"] = f"Bearer {token}"
            return client.get(path, headers=h, **kw)

        def post(self, path, **kw):
            h = dict(kw.pop("headers", {}))
            h["Authorization"] = f"Bearer {token}"
            return client.post(path, headers=h, **kw)

        def patch(self, path, **kw):
            h = dict(kw.pop("headers", {}))
            h["Authorization"] = f"Bearer {token}"
            return client.patch(path, headers=h, **kw)

        def put(self, path, **kw):
            h = dict(kw.pop("headers", {}))
            h["Authorization"] = f"Bearer {token}"
            return client.put(path, headers=h, **kw)

        def delete(self, path, **kw):
            h = dict(kw.pop("headers", {}))
            h["Authorization"] = f"Bearer {token}"
            return client.delete(path, headers=h, **kw)

    return Proxy()


@pytest.fixture
def buyer(client, auth_token):
    return authorized(client, auth_token)


@pytest.fixture
def other_buyer(client, seed_catalog):
    payload = generators.register_payload(prefix="rival")
    res = client.post("/api/auth/register", json=payload)
    assert res.status_code == 201
    return authorized(client, res.get_json()["access_token"])
