import bcrypt

from app.extensions import db


class User(db.Model):
    __tablename__ = "eco_users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(160), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    cart = db.relationship("Cart", back_populates="user", uselist=False)
    orders = db.relationship("Order", back_populates="user")
    emails = db.relationship("EmailNotification", back_populates="user")

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
