from app.extensions import db


class Assignment(db.Model):
    __tablename__ = "support_assignments"

    id = db.Column(db.Integer, primary_key=True)
    ticket_id = db.Column(db.Integer, db.ForeignKey("support_tickets.id"), nullable=False, index=True)
    assigned_to_id = db.Column(db.Integer, db.ForeignKey("support_users.id"), nullable=False)
    assigned_by_id = db.Column(db.Integer, db.ForeignKey("support_users.id"), nullable=True)
    assigned_at = db.Column(db.DateTime, server_default=db.func.now(), index=True)

    ticket = db.relationship("Ticket", back_populates="assignments")
    assignee = db.relationship("User", foreign_keys=[assigned_to_id])
    assigner = db.relationship("User", foreign_keys=[assigned_by_id])
