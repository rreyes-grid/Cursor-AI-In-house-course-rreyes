from app.extensions import db


class Task(db.Model):
    __tablename__ = "tasks"
    __table_args__ = (
        db.Index("ix_tasks_project_id", "project_id"),
        db.Index("ix_tasks_project_status", "project_id", "status"),
        db.Index("ix_tasks_assignee_id", "assignee_id"),
        db.Index("ix_tasks_updated_at", "updated_at"),
    )

    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey("projects.id"), nullable=False)
    title = db.Column(db.String(300), nullable=False)
    description = db.Column(db.Text, nullable=True)
    status = db.Column(
        db.String(40), nullable=False, default="todo"
    )  # todo, in_progress, in_review, done
    priority = db.Column(
        db.String(20), nullable=False, default="medium"
    )  # low, medium, high, urgent
    due_date = db.Column(db.Date, nullable=True)
    assignee_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    created_by_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(
        db.DateTime, server_default=db.func.now(), onupdate=db.func.now()
    )

    project = db.relationship("Project", back_populates="tasks")
    assignee = db.relationship(
        "User", back_populates="tasks_assigned", foreign_keys=[assignee_id]
    )
    creator = db.relationship(
        "User", back_populates="tasks_created", foreign_keys=[created_by_id]
    )
