from app.extensions import db

project_members = db.Table(
    "project_members",
    db.Column("user_id", db.Integer, db.ForeignKey("users.id"), primary_key=True),
    db.Column("project_id", db.Integer, db.ForeignKey("projects.id"), primary_key=True),
    db.Column("role", db.String(40), nullable=False, default="member"),
)


class Project(db.Model):
    __tablename__ = "projects"
    __table_args__ = (
        db.Index("ix_projects_owner_id", "owner_id"),
        db.Index("ix_projects_status", "status"),
    )

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    due_date = db.Column(db.Date, nullable=True)
    status = db.Column(
        db.String(40), nullable=False, default="active"
    )  # active, archived, on_hold
    progress_trend = db.Column(db.Integer, nullable=True)  # e.g. +12 vs last week
    owner_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(
        db.DateTime, server_default=db.func.now(), onupdate=db.func.now()
    )

    owner = db.relationship("User", back_populates="owned_projects", foreign_keys=[owner_id])
    members = db.relationship(
        "User",
        secondary=project_members,
        backref=db.backref("projects", lazy="dynamic"),
    )
    tasks = db.relationship(
        "Task", back_populates="project", cascade="all, delete-orphan"
    )
