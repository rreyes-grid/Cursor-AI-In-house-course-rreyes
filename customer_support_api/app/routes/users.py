from flask import Blueprint, g, jsonify, request

from app.decorators import jwt_user_required, roles_required
from app.errors import ApiError
from app.extensions import db
from app.models import User
from app.schemas import UserUpdateSchema
from app.serializers import user_public

bp = Blueprint("users", __name__, url_prefix="/api/users")


@bp.route("", methods=["GET"])
@roles_required("admin")
def list_users():
    users = User.query.order_by(User.id).all()
    return jsonify({"status": "success", "users": [user_public(u) for u in users]})


@bp.route("/<int:user_id>", methods=["GET"])
@jwt_user_required
def get_user(user_id: int):
    if g.current_user.role != "admin" and g.current_user.id != user_id:
        raise ApiError("Forbidden", 403, "FORBIDDEN")
    u = User.query.get_or_404(user_id)
    return jsonify({"status": "success", "user": user_public(u)})


@bp.route("/<int:user_id>", methods=["PUT"])
@jwt_user_required
def update_user(user_id: int):
    if g.current_user.role != "admin" and g.current_user.id != user_id:
        raise ApiError("Forbidden", 403, "FORBIDDEN")
    u = User.query.get_or_404(user_id)
    data = UserUpdateSchema().load(request.get_json(force=True, silent=True) or {}, partial=True)
    if "name" in data:
        u.name = data["name"]
    if "availability_status" in data and u.role in ("agent", "admin"):
        u.availability_status = data["availability_status"]
    if "expertise_areas" in data and u.role in ("agent", "admin"):
        u.expertise_areas = data["expertise_areas"] or []
    if "notification_email" in data:
        u.notification_email = data["notification_email"]
    if "notification_in_app" in data:
        u.notification_in_app = data["notification_in_app"]
    db.session.commit()
    return jsonify({"status": "success", "user": user_public(u)})
