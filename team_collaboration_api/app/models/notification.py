from app.extensions import db


class Notification(db.Model):
    __tablename__ = "notifications"
    __table_args__ = (
        db.Index("ix_notifications_user_read", "user_id", "read"),
        db.Index("ix_notifications_created_at", "created_at"),
    )

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    body = db.Column(db.Text, nullable=False)
    type = db.Column(
        db.String(40), nullable=False, default="info"
    )  # task_assigned, project_update, mention, team_invite, etc.
    read = db.Column(db.Boolean, nullable=False, default=False)
    related_project_id = db.Column(db.Integer, db.ForeignKey("projects.id"), nullable=True)
    related_task_id = db.Column(db.Integer, db.ForeignKey("tasks.id"), nullable=True)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    user = db.relationship("User", backref=db.backref("notifications", lazy="dynamic"))
