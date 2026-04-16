import os
from datetime import timedelta

_env_redis = os.environ.get("REDIS_URL", "").strip()


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-change-me")
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URI", "sqlite:///team_collab.db"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    # Connection pooling / resilience (NFR-023)
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_recycle": 3600,
    }
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "jwt-dev-secret-change-me")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    JWT_TOKEN_LOCATION = ("headers",)
    JWT_HEADER_NAME = "Authorization"
    JWT_HEADER_TYPE = "Bearer"
    CORS_ORIGINS = os.environ.get(
        "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
    ).split(",")

    # Redis (cache + Celery broker + Socket.IO message queue)
    REDIS_URL = _env_redis

    # Flask-Caching (Redis when REDIS_URL set, else in-process SimpleCache)
    CACHE_TYPE = os.environ.get("CACHE_TYPE") or ("RedisCache" if _env_redis else "SimpleCache")
    CACHE_DEFAULT_TIMEOUT = int(os.environ.get("CACHE_DEFAULT_TIMEOUT", "60"))
    CACHE_KEY_PREFIX = "collab:"
    CACHE_REDIS_URL = _env_redis or None

    # Celery
    CELERY_BROKER_URL = os.environ.get(
        "CELERY_BROKER_URL", _env_redis or "redis://127.0.0.1:6379/1"
    )
    CELERY_RESULT_BACKEND = os.environ.get(
        "CELERY_RESULT_BACKEND",
        _env_redis.replace("/0", "/2") if _env_redis and "/0" in _env_redis else "redis://127.0.0.1:6379/2",
    )
    CELERY_TASK_ALWAYS_EAGER = os.environ.get("CELERY_TASK_ALWAYS_EAGER", "false").lower() == "true"
    # Queue notification creation + Socket.IO emit in background when True
    USE_ASYNC_NOTIFICATIONS = os.environ.get("USE_ASYNC_NOTIFICATIONS", "false").lower() == "true"


class DevelopmentConfig(Config):
    DEBUG = True


class ProductionConfig(Config):
    DEBUG = False


class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    CACHE_TYPE = "SimpleCache"
    CACHE_DEFAULT_TIMEOUT = 300
    CACHE_REDIS_URL = None
    CELERY_TASK_ALWAYS_EAGER = True
    CELERY_BROKER_URL = "memory://"
    CELERY_RESULT_BACKEND = "cache+memory://"
    USE_ASYNC_NOTIFICATIONS = False
    REDIS_URL = ""


config_by_name = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "testing": TestingConfig,
    "default": DevelopmentConfig,
}
