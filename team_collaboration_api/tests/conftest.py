"""Pytest fixtures: in-memory DB, HTTP client, JWT auth helpers."""

import pytest

from app import create_app
from app.extensions import db


@pytest.fixture
def app():
    application = create_app("testing")
    with application.app_context():
        db.create_all()
        yield application
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


def _register(client, suffix: str = "1"):
    email = f"user{suffix}@test.local"
    r = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": "password123",
            "name": f"User {suffix}",
            "username": f"user{suffix}",
        },
    )
    assert r.status_code == 201, r.get_json()
    return r.get_json()["access_token"], email


@pytest.fixture
def token_user1(client):
    t, _ = _register(client, "1")
    return t


@pytest.fixture
def token_user2(client):
    t, _ = _register(client, "2")
    return t


@pytest.fixture
def auth_headers(token_user1):
    return {"Authorization": f"Bearer {token_user1}"}


@pytest.fixture
def second_user_headers(token_user2):
    return {"Authorization": f"Bearer {token_user2}"}


@pytest.fixture
def project_id(client, auth_headers):
    r = client.post(
        "/api/v1/projects",
        json={"name": "P1", "description": "Desc"},
        headers={**auth_headers, "Content-Type": "application/json"},
    )
    assert r.status_code == 201
    return r.get_json()["id"]
