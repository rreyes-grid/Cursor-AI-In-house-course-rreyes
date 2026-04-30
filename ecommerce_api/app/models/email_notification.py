from app.extensions import db


class EmailNotification(db.Model):
    __tablename__ = "eco_email_notifications"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("eco_users.id"), nullable=False, index=True)
    order_id = db.Column(db.Integer, db.ForeignKey("eco_orders.id"), nullable=True)

    notification_type = db.Column(db.String(64), nullable=False)  # order_confirmation
    subject = db.Column(db.String(255), nullable=False)
    body_text = db.Column(db.Text, nullable=False)
    smtp_attempted = db.Column(db.Boolean, nullable=False, default=False)

    created_at = db.Column(db.DateTime, server_default=db.func.now())

    user = db.relationship("User", back_populates="emails")
