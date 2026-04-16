from app.extensions import db


class PriorityChange(db.Model):
    __tablename__ = "support_priority_changes"

    id = db.Column(db.Integer, primary_key=True)
    ticket_id = db.Column(db.Integer, db.ForeignKey("support_tickets.id"), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("support_users.id"), nullable=False)
    from_priority = db.Column(db.String(16), nullable=False)
    to_priority = db.Column(db.String(16), nullable=False)
    reason = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    ticket = db.relationship("Ticket", back_populates="priority_changes")
    user = db.relationship("User")
