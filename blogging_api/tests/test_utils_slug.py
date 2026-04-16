"""Slug helpers (unique titles / categories)."""

from app.extensions import db
from app.models import Post, User
from app.utils import unique_category_slug, unique_post_slug


def test_unique_post_slug_appends_suffix_on_collision(app):
    with app.app_context():
        u = User(email="slug@x.com", username="slugger")
        u.set_password("password12")
        db.session.add(u)
        db.session.commit()
        p1 = Post(author_id=u.id, title="Same", slug="same", body="a")
        db.session.add(p1)
        db.session.commit()
        s = unique_post_slug("Same")
        assert s == "same-2"


def test_unique_category_slug_collision(app):
    with app.app_context():
        from app.models import Category

        c = Category(name="A", slug="dup")
        db.session.add(c)
        db.session.commit()
        s = unique_category_slug("dup")
        assert s.startswith("dup")
