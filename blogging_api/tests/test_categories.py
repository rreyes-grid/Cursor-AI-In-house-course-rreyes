"""Category CRUD (JWT) and cache invalidation."""

import json

from app.extensions import cache, db
from app.models import Category


def _register(client, email: str, username: str) -> str:
    r = client.post(
        "/api/auth/register",
        data=json.dumps(
            {
                "email": email,
                "username": username,
                "password": "password12",
            }
        ),
        content_type="application/json",
    )
    assert r.status_code == 201
    return r.get_json()["access_token"]


def test_create_update_delete_category(client, app):
    t = _register(client, "cat@x.com", "catowner")
    h = {"Authorization": f"Bearer {t}"}
    r = client.post(
        "/api/categories",
        data=json.dumps({"name": "News"}),
        content_type="application/json",
        headers=h,
    )
    assert r.status_code == 201
    cid = r.get_json()["id"]
    assert r.get_json()["slug"]

    r2 = client.put(
        f"/api/categories/{cid}",
        data=json.dumps({"name": "Breaking News"}),
        content_type="application/json",
        headers=h,
    )
    assert r2.status_code == 200
    assert r2.get_json()["name"] == "Breaking News"

    r3 = client.delete(f"/api/categories/{cid}", headers=h)
    assert r3.status_code == 204
    assert client.get("/api/categories").get_json() == []


def test_create_category_duplicate_name_409(client):
    t = _register(client, "d1@x.com", "d1")
    h = {"Authorization": f"Bearer {t}"}
    client.post(
        "/api/categories",
        data=json.dumps({"name": "Unique"}),
        content_type="application/json",
        headers=h,
    )
    r = client.post(
        "/api/categories",
        data=json.dumps({"name": "unique"}),
        content_type="application/json",
        headers=h,
    )
    assert r.status_code == 409


def test_category_change_invalidates_post_cache(client, app):
    t = _register(client, "e1@x.com", "e1")
    h = {"Authorization": f"Bearer {t}"}
    cr = client.post(
        "/api/categories",
        data=json.dumps({"name": "Section"}),
        content_type="application/json",
        headers=h,
    )
    cat_id = cr.get_json()["id"]
    pr = client.post(
        "/api/posts",
        data=json.dumps(
            {"title": "In section", "body": "Text", "category_id": cat_id}
        ),
        content_type="application/json",
        headers=h,
    )
    pid = pr.get_json()["id"]
    client.get("/api/posts")
    client.get(f"/api/posts/{pid}")
    with app.app_context():
        from app.post_cache import post_detail_key

        assert cache.get(post_detail_key(pid)) is not None
    client.put(
        f"/api/categories/{cat_id}",
        data=json.dumps({"name": "Renamed"}),
        content_type="application/json",
        headers=h,
    )
    with app.app_context():
        from app.post_cache import post_detail_key

        assert cache.get(post_detail_key(pid)) is None


def test_delete_category_requires_auth(client, app):
    with app.app_context():
        c = Category(name="X", slug="x")
        db.session.add(c)
        db.session.commit()
        cid = c.id
    r = client.delete(f"/api/categories/{cid}")
    assert r.status_code == 401
