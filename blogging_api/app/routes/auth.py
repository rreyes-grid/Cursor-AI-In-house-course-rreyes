from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required

from app.errors import ApiError
from app.extensions import db
from app.models import User
from app.schemas import UserLoginSchema, UserRegisterSchema, UserSchema

bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@bp.route("/register", methods=["POST"])
def register():
    """
    Register a new user; returns JWT access token.
    ---
    tags:
      - Auth
    consumes:
      - application/json
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required: [email, username, password]
          properties:
            email: { type: string, format: email }
            username: { type: string }
            password: { type: string, format: password }
    responses:
      201:
        description: Created
      409:
        description: Email or username already in use
      422:
        description: Validation error
    """
    data = UserRegisterSchema().load(request.get_json(force=True, silent=True) or {})
    if User.query.filter_by(email=data["email"]).first():
        raise ApiError("Email already registered", 409)
    if User.query.filter_by(username=data["username"]).first():
        raise ApiError("Username already taken", 409)
    user = User(email=data["email"], username=data["username"])
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
    """
    Login; returns JWT access token.
    ---
    tags:
      - Auth
    consumes:
      - application/json
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required: [email, password]
          properties:
            email: { type: string, format: email }
            password: { type: string, format: password }
    responses:
      200:
        description: OK
      401:
        description: Invalid credentials
      422:
        description: Validation error
    """
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
    """
    Current user (requires Authorization Bearer token).
    ---
    tags:
      - Auth
    security:
      - Bearer: []
    responses:
      200:
        description: OK
      401:
        description: Unauthorized
    """
    uid = int(get_jwt_identity())
    user = User.query.get_or_404(uid)
    return jsonify(UserSchema().dump(user))
