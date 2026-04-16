import pytest

from app import create_app
from app.extensions import cache, db


@pytest.fixture
def app():
    application = create_app("testing")
    with application.app_context():
        db.create_all()
    yield application
    with application.app_context():
        cache.clear()
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture(autouse=True)
def clear_cache_before_test(app):
    with app.app_context():
        cache.clear()
    yield
