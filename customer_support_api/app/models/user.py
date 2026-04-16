import bcrypt

from app.extensions import db


class User(db.Model):
    __tablename__ = "support_users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(160), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(
        db.String(32), nullable=False, default="customer"
    )  # customer, agent, admin
    availability_status = db.Column(
        db.String(32), nullable=False, default="offline"
    )  # available, busy, offline
    expertise_areas = db.Column(db.JSON, nullable=False, default=list)
    notification_email = db.Column(db.Boolean, nullable=False, default=True)
    notification_in_app = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    tickets_created = db.relationship(
        "Ticket",
        back_populates="customer",
        foreign_keys="Ticket.customer_id",
    )
    tickets_assigned = db.relationship(
        "Ticket",
        back_populates="assignee",
        foreign_keys="Ticket.assigned_to_id",
    )

    @staticmethod
    def hash_password(password: str, rounds: int = 12) -> str:
        return bcrypt.hashpw(
            password.encode("utf-8"),
            bcrypt.gensalt(rounds=rounds),
        ).decode("utf-8")

    def set_password(self, password: str, rounds: int = 12) -> None:
        self.password_hash = self.hash_password(password, rounds=rounds)

    def check_password(self, password: str) -> bool:
        return bcrypt.checkpw(
            password.encode("utf-8"),
            self.password_hash.encode("utf-8"),
        )
