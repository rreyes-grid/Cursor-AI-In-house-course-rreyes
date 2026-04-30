from functools import wraps

from flask import g
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.errors import ApiError
from app.models.user import User


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
