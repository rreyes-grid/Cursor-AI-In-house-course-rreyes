from app.extensions import db


class TicketHistory(db.Model):
    __tablename__ = "support_ticket_history"

    id = db.Column(db.Integer, primary_key=True)
    ticket_id = db.Column(db.Integer, db.ForeignKey("support_tickets.id"), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("support_users.id"), nullable=True)
    action = db.Column(db.String(64), nullable=False)
    from_value = db.Column(db.String(255), nullable=True)
    to_value = db.Column(db.String(255), nullable=True)
    note = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, server_default=db.func.now(), index=True)

    ticket = db.relationship("Ticket", back_populates="history")
    user = db.relationship("User")
