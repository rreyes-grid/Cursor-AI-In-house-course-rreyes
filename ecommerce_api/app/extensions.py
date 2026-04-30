from flask import request
from flask_jwt_extended import decode_token
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager

db = SQLAlchemy()
jwt = JWTManager()


def rate_limit_key():
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        try:
            t = decode_token(auth[7:])
            sub = t.get("sub")
            if sub is not None:
                return f"u:{sub}"
        except Exception:
            pass
    return get_remote_address()


limiter = Limiter(key_func=rate_limit_key)


def register_extensions(app):
    db.init_app(app)
    jwt.init_app(app)
    limiter.init_app(app)
