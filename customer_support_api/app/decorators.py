from functools import wraps

from flask import g
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.errors import ApiError
from app.models import User


def jwt_user_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapped(*args, **kwargs):
        uid = int(get_jwt_identity())
        user = User.query.get(uid)
        if not user:
            raise ApiError("User not found", 401, "UNAUTHORIZED")
        g.current_user = user
        return fn(*args, **kwargs)

    return wrapped


def roles_required(*roles: str):
    def decorator(fn):
        @wraps(fn)
        @jwt_user_required
        def wrapped(*args, **kwargs):
            if g.current_user.role not in roles:
                raise ApiError("Insufficient permissions", 403, "FORBIDDEN")
            return fn(*args, **kwargs)

        return wrapped

    return decorator
