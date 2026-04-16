"""Post list/detail caching and invalidation."""

import json

from app.extensions import cache, db
from app.models import Category, Post, User
from app.post_cache import (
    get_post_list_version,
    invalidate_after_post_write,
    invalidate_for_category_change,
    post_detail_key,
    post_list_payload_key,
)


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def _token(app, uid: int) -> str:
    from flask_jwt_extended import create_access_token

    with app.app_context():
        return create_access_token(identity=str(uid))


def test_post_list_payload_cached_after_first_get(client, app):
    assert client.get("/api/posts").status_code == 200
    with app.app_context():
        k = post_list_payload_key(1, 20)
        assert cache.get(k) is not None
        assert "items" in cache.get(k)


def test_post_list_cache_invalidates_after_post_create(client, app):
    with app.app_context():
        u = User(email="c1@x.com", username="c1")
        u.set_password("password12")
        db.session.add(u)
        db.session.commit()
        uid = u.id
    t = _token(app, uid)
    v0 = get_post_list_version()
    client.get("/api/posts")
    with app.app_context():
        k0 = post_list_payload_key(1, 20)
        assert cache.get(k0) is not None
    r = client.post(
        "/api/posts",
        data=json.dumps({"title": "New", "body": "Body"}),
        content_type="application/json",
        headers=_auth(t),
    )
    assert r.status_code == 201
    v1 = get_post_list_version()
    assert v1 > v0
    with app.app_context():
        k1 = post_list_payload_key(1, 20)
        assert k1 != k0


def test_post_detail_cached_then_invalidated_on_update(client, app):
    with app.app_context():
        u = User(email="c2@x.com", username="c2")
        u.set_password("password12")
        db.session.add(u)
        db.session.commit()
        uid = u.id
        p = Post(author_id=uid, title="T", slug="t", body="B")
        db.session.add(p)
        db.session.commit()
        pid = p.id
    t = _token(app, uid)
    client.get(f"/api/posts/{pid}")
    with app.app_context():
        assert cache.get(post_detail_key(pid)) is not None
    r = client.put(
        f"/api/posts/{pid}",
        data=json.dumps({"title": "T2", "body": "B2"}),
        content_type="application/json",
        headers=_auth(t),
    )
    assert r.status_code == 200
    assert r.get_json()["title"] == "T2"
    with app.app_context():
        assert cache.get(post_detail_key(pid)) is None


def test_post_detail_cache_cleared_on_delete(client, app):
    with app.app_context():
        u = User(email="c3@x.com", username="c3")
        u.set_password("password12")
        db.session.add(u)
        db.session.commit()
        uid = u.id
        p = Post(author_id=uid, title="Del", slug="del", body="X")
        db.session.add(p)
        db.session.commit()
        pid = p.id
    t = _token(app, uid)
    client.get(f"/api/posts/{pid}")
    with app.app_context():
        assert cache.get(post_detail_key(pid)) is not None
    d = client.delete(f"/api/posts/{pid}", headers=_auth(t))
    assert d.status_code == 204
    with app.app_context():
        assert cache.get(post_detail_key(pid)) is None


def test_invalidate_after_post_write_helpers(app):
    with app.app_context():
        u = User(email="h@x.com", username="hx")
        u.set_password("password12")
        db.session.add(u)
        db.session.commit()
        uid = u.id
        p = Post(author_id=uid, title="H", slug="h", body="b")
        db.session.add(p)
        db.session.commit()
        pid = p.id
        cache.set(post_detail_key(pid), {"id": pid}, timeout=60)
        v0 = get_post_list_version()
        invalidate_after_post_write(pid)
        assert cache.get(post_detail_key(pid)) is None
        assert get_post_list_version() > v0


def test_invalidate_for_category_change(app):
    with app.app_context():
        cat = Category(name="Cat", slug="cat")
        u = User(email="cat@x.com", username="catu")
        u.set_password("password12")
        db.session.add_all([cat, u])
        db.session.commit()
        p = Post(
            author_id=u.id,
            category_id=cat.id,
            title="C",
            slug="c-post",
            body="b",
        )
        db.session.add(p)
        db.session.commit()
        pid = p.id
        cache.set(post_detail_key(pid), {"id": pid}, timeout=60)
        v0 = get_post_list_version()
        invalidate_for_category_change(cat.id)
        assert get_post_list_version() > v0
        assert cache.get(post_detail_key(pid)) is None

