import os
from datetime import timedelta

_env_redis = os.environ.get("REDIS_URL", "").strip()


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-change-me")
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URI", "sqlite:///blogging.db"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
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
    )
    POSTS_PER_PAGE = 20

    # Redis-backed cache when REDIS_URL is set; otherwise in-process SimpleCache
    REDIS_URL = _env_redis
    CACHE_TYPE = os.environ.get("CACHE_TYPE") or (
        "RedisCache" if _env_redis else "SimpleCache"
    )
    CACHE_DEFAULT_TIMEOUT = int(os.environ.get("CACHE_DEFAULT_TIMEOUT", "120"))
    CACHE_KEY_PREFIX = os.environ.get("CACHE_KEY_PREFIX", "blog:")
    CACHE_REDIS_URL = _env_redis or None
    CACHE_VERSION_TTL = int(os.environ.get("CACHE_VERSION_TTL", str(86400 * 365)))


class DevelopmentConfig(Config):
    DEBUG = True


class ProductionConfig(Config):
    DEBUG = False


class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    REDIS_URL = ""
    CACHE_TYPE = "SimpleCache"
    CACHE_DEFAULT_TIMEOUT = 300
    CACHE_REDIS_URL = None


config_by_name = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "testing": TestingConfig,
    "default": DevelopmentConfig,
}
