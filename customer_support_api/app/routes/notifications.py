from flask import Blueprint, g, jsonify

from app.decorators import jwt_user_required
from app.errors import ApiError
from app.extensions import db
from app.models import InAppNotification
from app.serializers import notification_row

bp = Blueprint("notifications", __name__, url_prefix="/api/notifications")


@bp.route("", methods=["GET"])
@jwt_user_required
def list_notifications():
    items = (
        InAppNotification.query.filter_by(user_id=g.current_user.id)
        .order_by(InAppNotification.created_at.desc())
        .limit(100)
        .all()
    )
    return jsonify(
        {
            "status": "success",
            "notifications": [notification_row(n) for n in items],
        }
    )


@bp.route("/<int:nid>/read", methods=["POST"])
@jwt_user_required
def mark_read(nid: int):
    n = InAppNotification.query.get_or_404(nid)
    if n.user_id != g.current_user.id:
        raise ApiError("Forbidden", 403, "FORBIDDEN")
    n.read = True
    db.session.commit()
    return jsonify({"status": "success"})
