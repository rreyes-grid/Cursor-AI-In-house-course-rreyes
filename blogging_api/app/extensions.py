from flask_caching import Cache
from flask_jwt_extended import JWTManager
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()
jwt = JWTManager()
cache = Cache()


def _fallback_to_simple_cache_if_redis_unreachable(app) -> None:
    """Avoid hard failures when REDIS_URL is set but no server is listening (e.g. Error 61)."""
    if app.config.get("CACHE_TYPE") != "RedisCache":
        return
    url = app.config.get("CACHE_REDIS_URL") or app.config.get("REDIS_URL")
    if not url:
        app.config["CACHE_TYPE"] = "SimpleCache"
        return
    try:
        import redis

        r = redis.from_url(url, socket_connect_timeout=1.0, socket_timeout=1.0)
        r.ping()
    except Exception as exc:  # ConnectionError, TimeoutError, OSError, etc.
        app.logger.warning(
            "Redis unreachable (%s); falling back to SimpleCache. %s",
            url,
            exc,
        )
        app.config["CACHE_TYPE"] = "SimpleCache"
        app.config["CACHE_REDIS_URL"] = None


def register_extensions(app):
    db.init_app(app)
    jwt.init_app(app)
    _fallback_to_simple_cache_if_redis_unreachable(app)
    cache.init_app(app)
