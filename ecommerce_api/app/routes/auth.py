from flask import Blueprint, g, jsonify, request
from flask_jwt_extended import create_access_token, jwt_required

from app.decorators import jwt_user_required
from app.errors import ApiError
from app.extensions import db, limiter
from app.models.user import User
from app.schemas import LoginSchema, RegisterSchema
from app.serializers import user_public

bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@bp.route("/register", methods=["POST"])
@limiter.limit("20 per minute")
def register():
    """
    Create a shopper account; returns JWT Bearer token.
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
          required: [name, email, password]
          properties:
            name: { type: string }
            email: { type: string, format: email }
            password: { type: string, minLength: 8, maxLength: 128 }
    responses:
      201:
        description: Created; body includes access_token and user
      409:
        description: Email already registered
      400:
        description: Validation error
      429:
        description: Too many requests (rate limit)
    """
    data = RegisterSchema().load(request.get_json(force=True, silent=True) or {})
    normalized = data["email"].strip().lower()
    if User.query.filter_by(email=normalized).first():
        raise ApiError("Email already registered", 409, "CONFLICT")
    from flask import current_app

    user = User(name=data["name"].strip(), email=normalized)
    user.set_password(
        data["password"],
        rounds=current_app.config.get("BCRYPT_ROUNDS", 12),
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
    """
    Exchange email and password for JWT access token.
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
            password: { type: string }
    responses:
      200:
        description: OK; access_token issued
      401:
        description: Invalid credentials
      429:
        description: Rate limit
    """
    data = LoginSchema().load(request.get_json(force=True, silent=True) or {})
    normalized = data["email"].strip().lower()
    user = User.query.filter_by(email=normalized).first()
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


@bp.route("/me", methods=["GET"])
@jwt_user_required
def me():
    """
    Return the authenticated shopper profile.
    ---
    tags:
      - Auth
    security:
      - Bearer: []
    responses:
      200:
        description: Current user payload
      401:
        description: Missing or invalid JWT
    """
    return jsonify({"status": "success", "user": user_public(g.current_user)})


@bp.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    """
    Stateless logout hook (drop the client token); no server session.
    ---
    tags:
      - Auth
    security:
      - Bearer: []
    responses:
      204:
        description: No content
      401:
        description: Unauthorized
    """
    return "", 204
