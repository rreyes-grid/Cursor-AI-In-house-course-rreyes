import json

from app.extensions import db
from app.models import Category, Post, User


def _auth_header(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.get_json()["service"] == "blogging-api"


def test_register_login_flow(client):
    r = client.post(
        "/api/auth/register",
        data=json.dumps(
            {
                "email": "writer@example.com",
                "username": "writer",
                "password": "secretpass1",
            }
        ),
        content_type="application/json",
    )
    assert r.status_code == 201
    data = r.get_json()
    assert "access_token" in data
    token = data["access_token"]

    r2 = client.post(
        "/api/auth/login",
        data=json.dumps(
            {"email": "writer@example.com", "password": "secretpass1"}
        ),
        content_type="application/json",
    )
    assert r2.status_code == 200
    assert r2.get_json()["access_token"]

    me = client.get("/api/auth/me", headers=_auth_header(token))
    assert me.status_code == 200
    assert me.get_json()["username"] == "writer"


def test_posts_crud_and_comments(client, app):
    with app.app_context():
        u = User(email="a@b.com", username="author")
        u.set_password("password12")
        db.session.add(u)
        db.session.commit()
        uid = u.id

    from flask_jwt_extended import create_access_token

    with app.app_context():
        token = create_access_token(identity=str(uid))

    r = client.post(
        "/api/posts",
        data=json.dumps(
            {"title": "Hello", "body": "World content here", "category_id": None}
        ),
        content_type="application/json",
        headers=_auth_header(token),
    )
    assert r.status_code == 201
    pid = r.get_json()["id"]

    lst = client.get("/api/posts")
    assert lst.status_code == 200
    body = lst.get_json()
    assert body["per_page"] == 20
    assert len(body["items"]) == 1

    one = client.get(f"/api/posts/{pid}")
    assert one.status_code == 200
    assert one.get_json()["title"] == "Hello"

    c = client.post(
        f"/api/posts/{pid}/comments",
        data=json.dumps({"body": "Nice post"}),
        content_type="application/json",
        headers=_auth_header(token),
    )
    assert c.status_code == 201
    cid = c.get_json()["id"]

    comments = client.get(f"/api/posts/{pid}/comments")
    assert comments.status_code == 200
    assert len(comments.get_json()) == 1

    d = client.delete(
        f"/api/posts/{pid}/comments/{cid}",
        headers=_auth_header(token),
    )
    assert d.status_code == 204


def test_search_and_categories(client, app):
    with app.app_context():
        u = User(email="s@b.com", username="searcher")
        u.set_password("password12")
        cat = Category(name="Tech", slug="tech")
        db.session.add_all([u, cat])
        db.session.commit()
        uid, cat_id = u.id, cat.id
        p = Post(
            author_id=uid,
            category_id=cat_id,
            title="Python tips",
            slug="python-tips",
            body="Learn Python today",
        )
        db.session.add(p)
        db.session.commit()

    r = client.get("/api/search?q=Python")
    assert r.status_code == 200
    assert r.get_json()["total"] >= 1

    cats = client.get("/api/categories")
    assert cats.status_code == 200
    assert any(c["slug"] == "tech" for c in cats.get_json())
