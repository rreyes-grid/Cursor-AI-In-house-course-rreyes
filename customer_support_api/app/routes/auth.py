from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required

from app.decorators import jwt_user_required
from app.errors import ApiError
from app.extensions import db, limiter
from app.models import User
from app.schemas import LoginSchema, RegisterSchema
from app.serializers import user_public

bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@bp.route("/register", methods=["POST"])
@limiter.limit("20 per minute")
def register():
    data = RegisterSchema().load(request.get_json(force=True, silent=True) or {})
    if User.query.filter_by(email=data["email"].lower()).first():
        raise ApiError("Email already registered", 409, "CONFLICT")
    from flask import current_app

    user = User(
        name=data["name"],
        email=data["email"].lower(),
        role="customer",
        expertise_areas=[],
    )
    user.set_password(
        data["password"], rounds=current_app.config.get("BCRYPT_ROUNDS", 12)
    )
    db.session.add(user)
    db.session.commit()
    token = create_access_token(identity=str(user.id))
    return (
        jsonify(
            {
                "status": "success",
                "access_token": token,
                "token_type": "Bearer",
                "user": user_public(user),
            }
        ),
        201,
    )


@bp.route("/login", methods=["POST"])
@limiter.limit("30 per minute")
def login():
    data = LoginSchema().load(request.get_json(force=True, silent=True) or {})
    user = User.query.filter_by(email=data["email"].lower()).first()
    if not user or not user.check_password(data["password"]):
        raise ApiError("Invalid email or password", 401, "UNAUTHORIZED")
    token = create_access_token(identity=str(user.id))
    return jsonify(
        {
            "status": "success",
            "access_token": token,
            "token_type": "Bearer",
            "user": user_public(user),
        }
    )


@bp.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    return "", 204


@bp.route("/me", methods=["GET"])
@jwt_user_required
def me():
    from flask import g

    return jsonify({"status": "success", "user": user_public(g.current_user)})
