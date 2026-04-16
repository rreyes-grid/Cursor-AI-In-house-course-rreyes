"""Redis unreachable → SimpleCache + no Socket.IO message_queue."""

from app.extensions import _fallback_if_redis_unreachable


def test_fallback_if_redis_unreachable_clears_config(monkeypatch, app):
    class BadRedis:
        def ping(self):
            raise OSError(61, "Connection refused")

    monkeypatch.setattr("redis.from_url", lambda *a, **k: BadRedis())

    app.config["REDIS_URL"] = "redis://127.0.0.1:6379/0"
    app.config["CACHE_TYPE"] = "RedisCache"
    app.config["CACHE_REDIS_URL"] = "redis://127.0.0.1:6379/0"

    with app.app_context():
        _fallback_if_redis_unreachable(app)

    assert app.config["REDIS_URL"] == ""
    assert app.config["CACHE_TYPE"] == "SimpleCache"
    assert app.config["CACHE_REDIS_URL"] is None


def test_fallback_skips_when_no_redis_url(app):
    app.config["REDIS_URL"] = ""
    with app.app_context():
        _fallback_if_redis_unreachable(app)
    assert app.config["REDIS_URL"] == ""
