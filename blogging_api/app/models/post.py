from sqlalchemy import Index

from app.extensions import db


class Post(db.Model):
    __tablename__ = "posts"
    __table_args__ = (
        # Speeds up ORDER BY created_at DESC, id for stable pagination
        Index("ix_posts_created_at_id", "created_at", "id"),
    )

    id = db.Column(db.Integer, primary_key=True)
    author_id = db.Column(
        db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    category_id = db.Column(
        db.Integer,
        db.ForeignKey("categories.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    title = db.Column(db.String(255), nullable=False, index=True)
    slug = db.Column(db.String(300), unique=True, nullable=False, index=True)
    body = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(
        db.DateTime, server_default=db.func.now(), onupdate=db.func.now()
    )

    author = db.relationship("User", back_populates="posts", foreign_keys=[author_id])
    category = db.relationship("Category", back_populates="posts")
    comments = db.relationship(
        "Comment",
        back_populates="post",
        cascade="all, delete-orphan",
    )
