from app.extensions import db


class Category(db.Model):
    __tablename__ = "categories"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    slug = db.Column(db.String(160), unique=True, nullable=False, index=True)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    posts = db.relationship("Post", back_populates="category")
