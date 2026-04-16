from app.extensions import db


class Attachment(db.Model):
    __tablename__ = "support_attachments"

    id = db.Column(db.Integer, primary_key=True)
    ticket_id = db.Column(db.Integer, db.ForeignKey("support_tickets.id"), nullable=False, index=True)
    comment_id = db.Column(db.Integer, db.ForeignKey("support_comments.id"), nullable=True)
    filename = db.Column(db.String(255), nullable=False)
    stored_path = db.Column(db.String(512), nullable=False)
    file_size = db.Column(db.Integer, nullable=False)
    file_type = db.Column(db.String(128), nullable=False)
    uploaded_at = db.Column(db.DateTime, server_default=db.func.now())

    ticket = db.relationship("Ticket", back_populates="attachments")
    comment = db.relationship("Comment", backref="attachments")
