from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity

from app.extensions import db
from app.errors import ApiError
from app.models import User
from app.schemas import UserRegisterSchema, UserLoginSchema, UserSchema

bp = Blueprint("auth", __name__, url_prefix="/api/v1/auth")


@bp.route("/register", methods=["POST"])
def register():
    """Register a new user; returns JWT access token."""
    data = UserRegisterSchema().load(request.get_json(force=True, silent=True) or {})
    if User.query.filter_by(email=data["email"]).first():
        raise ApiError("Email already registered", 409)
    if User.query.filter_by(username=data["username"]).first():
        raise ApiError("Username already taken", 409)
    user = User(
        email=data["email"],
        name=data["name"],
        username=data["username"],
        avatar_url=data.get("avatar_url"),
    )
    user.set_password(data["password"])
    db.session.add(user)
    db.session.commit()
    token = create_access_token(identity=str(user.id))
    return (
        jsonify(
            {
                "access_token": token,
                "token_type": "Bearer",
                "user": UserSchema().dump(user),
            }
        ),
        201,
    )


@bp.route("/login", methods=["POST"])
def login():
    data = UserLoginSchema().load(request.get_json(force=True, silent=True) or {})
    user = User.query.filter_by(email=data["email"]).first()
    if not user or not user.check_password(data["password"]):
        raise ApiError("Invalid email or password", 401)
    token = create_access_token(identity=str(user.id))
    return jsonify(
        {
            "access_token": token,
            "token_type": "Bearer",
            "user": UserSchema().dump(user),
        }
    )


@bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    uid = int(get_jwt_identity())
    user = User.query.get_or_404(uid)
    return jsonify(UserSchema().dump(user))
