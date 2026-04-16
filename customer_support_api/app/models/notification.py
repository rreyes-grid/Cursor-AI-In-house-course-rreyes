from app.extensions import db


class InAppNotification(db.Model):
    __tablename__ = "support_in_app_notifications"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("support_users.id"), nullable=False, index=True)
    message = db.Column(db.String(512), nullable=False)
    read = db.Column(db.Boolean, nullable=False, default=False)
    ticket_id = db.Column(db.Integer, db.ForeignKey("support_tickets.id"), nullable=True)
    created_at = db.Column(db.DateTime, server_default=db.func.now(), index=True)

    user = db.relationship("User", backref="support_notifications")
    ticket = db.relationship("Ticket", back_populates="in_app_notifications")
