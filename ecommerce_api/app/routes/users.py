from flask import Blueprint, g, jsonify, request

from app.decorators import jwt_user_required
from app.extensions import db
from app.schemas import UserUpdateSchema
from app.serializers import user_public

bp = Blueprint("users", __name__, url_prefix="/api/users")


@bp.route("/me", methods=["PUT"])
@jwt_user_required
def update_me():
    """
    Patch the signed-in shopper (`name` optional / partial body).
    ---
    tags:
      - Users
    security:
      - Bearer: []
    consumes:
      - application/json
    parameters:
      - in: body
        name: body
        schema:
          type: object
          properties:
            name: { type: string, minLength: 1, maxLength: 160 }
    responses:
      200:
        description: Updated user
      401:
        description: Unauthorized
    """
    data = UserUpdateSchema().load(request.get_json(force=True, silent=True) or {}, partial=True)
    if not data:
        return jsonify({"status": "success", "user": user_public(g.current_user)})
    if "name" in data:
        g.current_user.name = data["name"].strip()
    db.session.commit()
    return jsonify({"status": "success", "user": user_public(g.current_user)})
