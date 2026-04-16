from werkzeug.security import check_password_hash, generate_password_hash

from app.extensions import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(120), nullable=False)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    avatar_url = db.Column(db.String(512), nullable=True)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    owned_projects = db.relationship(
        "Project", back_populates="owner", foreign_keys="Project.owner_id"
    )
    tasks_assigned = db.relationship(
        "Task", back_populates="assignee", foreign_keys="Task.assignee_id"
    )
    tasks_created = db.relationship(
        "Task", back_populates="creator", foreign_keys="Task.created_by_id"
    )

    def set_password(self, password: str) -> None:
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)
