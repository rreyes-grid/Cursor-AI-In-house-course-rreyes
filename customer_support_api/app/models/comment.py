from app.extensions import db


class Comment(db.Model):
    __tablename__ = "support_comments"

    id = db.Column(db.Integer, primary_key=True)
    ticket_id = db.Column(db.Integer, db.ForeignKey("support_tickets.id"), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("support_users.id"), nullable=False)
    content = db.Column(db.Text, nullable=False)
    is_internal = db.Column(db.Boolean, nullable=False, default=False)
    mentions = db.Column(db.JSON, nullable=False, default=list)  # user ids notified
    created_at = db.Column(db.DateTime, server_default=db.func.now(), index=True)

    ticket = db.relationship("Ticket", back_populates="comments")
    user = db.relationship("User")
