from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.extensions import db
from app.models import Notification
from app.schemas import NotificationSchema

bp = Blueprint("notifications", __name__, url_prefix="/api/v1/notifications")


def _uid() -> int:
    return int(get_jwt_identity())


@bp.route("", methods=["GET"])
@jwt_required()
def list_notifications():
    uid = _uid()
    unread_only = request.args.get("unread_only", "false").lower() == "true"
    q = Notification.query.filter_by(user_id=uid).order_by(Notification.created_at.desc())
    if unread_only:
        q = q.filter_by(read=False)
    items = q.limit(100).all()
    return jsonify({"notifications": [NotificationSchema().dump(n) for n in items]})


@bp.route("/<int:notification_id>/read", methods=["POST"])
@jwt_required()
def mark_read(notification_id: int):
    uid = _uid()
    n = Notification.query.filter_by(id=notification_id, user_id=uid).first_or_404()
    n.read = True
    db.session.commit()
    return jsonify(NotificationSchema().dump(n))


@bp.route("/read-all", methods=["POST"])
@jwt_required()
def mark_all_read():
    uid = _uid()
    Notification.query.filter_by(user_id=uid, read=False).update({"read": True})
    db.session.commit()
    return jsonify({"message": "All notifications marked read"})
