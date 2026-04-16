from app.extensions import db
from app.models import InAppNotification, User


def notify_user(user_id: int, message: str, ticket_id: int | None = None) -> None:
    u = User.query.get(user_id)
    if not u or not u.notification_in_app:
        return
    n = InAppNotification(user_id=user_id, message=message, ticket_id=ticket_id)
    db.session.add(n)
