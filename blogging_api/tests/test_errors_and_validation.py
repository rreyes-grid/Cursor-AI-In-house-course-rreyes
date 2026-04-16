"""Auth, validation, and error responses."""

import json

from app.extensions import db
from app.models import Post, User


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def _token(app, uid: int) -> str:
    from flask_jwt_extended import create_access_token

    with app.app_context():
        return create_access_token(identity=str(uid))


def test_register_duplicate_email_409(client):
    client.post(
        "/api/auth/register",
        data=json.dumps(
            {
                "email": "dup@x.com",
                "username": "u1",
                "password": "password12",
            }
        ),
        content_type="application/json",
    )
    r = client.post(
        "/api/auth/register",
        data=json.dumps(
            {
                "email": "dup@x.com",
                "username": "u2",
                "password": "password12",
            }
        ),
        content_type="application/json",
    )
    assert r.status_code == 409
    assert r.get_json()["error"] is True


def test_register_short_password_422(client):
    r = client.post(
        "/api/auth/register",
        data=json.dumps(
            {
                "email": "short@x.com",
                "username": "short",
                "password": "short",
            }
        ),
        content_type="application/json",
    )
    assert r.status_code == 422


def test_login_invalid_password_401(client):
    client.post(
        "/api/auth/register",
        data=json.dumps(
            {
                "email": "log@x.com",
                "username": "log",
                "password": "password12",
            }
        ),
        content_type="application/json",
    )
    r = client.post(
        "/api/auth/login",
        data=json.dumps({"email": "log@x.com", "password": "wrongpassword"}),
        content_type="application/json",
    )
    assert r.status_code == 401


def test_create_post_requires_auth_401(client):
    r = client.post(
        "/api/posts",
        data=json.dumps({"title": "T", "body": "B"}),
        content_type="application/json",
    )
    assert r.status_code == 401


def test_cannot_edit_other_users_post_403(client, app):
    with app.app_context():
        a = User(email="a@x.com", username="a")
        a.set_password("password12")
        b = User(email="b@x.com", username="b")
        b.set_password("password12")
        db.session.add_all([a, b])
        db.session.commit()
        p = Post(author_id=a.id, title="P", slug="p", body="b")
        db.session.add(p)
        db.session.commit()
        aid, bid, pid = a.id, b.id, p.id
    tb = _token(app, bid)
    r = client.put(
        f"/api/posts/{pid}",
        data=json.dumps({"body": "hacked"}),
        content_type="application/json",
        headers=_auth(tb),
    )
    assert r.status_code == 403


def test_get_post_404_json(client):
    r = client.get("/api/posts/99999")
    assert r.status_code == 404
    body = r.get_json()
    assert body["error"] is True


def test_list_posts_invalid_page_400(client):
    r = client.get("/api/posts?page=0")
    assert r.status_code == 400


def test_search_missing_q_400(client):
    r = client.get("/api/search")
    assert r.status_code == 400


def test_search_invalid_page_400(client):
    r = client.get("/api/search?q=test&page=0")
    assert r.status_code == 400


def test_api_error_payload(client):
    """Duplicate username returns 409 with message."""
    client.post(
        "/api/auth/register",
        data=json.dumps(
            {
                "email": "e1@x.com",
                "username": "sameuser",
                "password": "password12",
            }
        ),
        content_type="application/json",
    )
    r = client.post(
        "/api/auth/register",
        data=json.dumps(
            {
                "email": "e2@x.com",
                "username": "sameuser",
                "password": "password12",
            }
        ),
        content_type="application/json",
    )
    assert r.status_code == 409
    assert "username" in r.get_json()["message"].lower()
