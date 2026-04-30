from flask import Blueprint, g, jsonify

from app.decorators import jwt_user_required
from app.models.email_notification import EmailNotification
from app.serializers import email_notification_public

bp = Blueprint("notifications", __name__, url_prefix="/api/notifications")


@bp.route("/email", methods=["GET"])
@jwt_user_required
def list_emails():
    """
    Fetch last 50 transactional email bodies saved for shopper (confirmation mail when SMTP disabled).
    ---
    tags:
      - Notifications
    security:
      - Bearer: []
    responses:
      200:
        description: Stored notification rows
      401:
        description: Unauthorized
    """
    rows = (
        EmailNotification.query.filter_by(user_id=g.current_user.id)
        .order_by(EmailNotification.created_at.desc())
        .limit(50)
        .all()
    )
    return jsonify(
        {
            "status": "success",
            "notifications": [email_notification_public(n) for n in rows],
        }
    )
