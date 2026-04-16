from sqlalchemy import Index

from app.extensions import db


class Comment(db.Model):
    __tablename__ = "comments"
    __table_args__ = (
        Index("ix_comments_post_id_created_at", "post_id", "created_at"),
    )

    id = db.Column(db.Integer, primary_key=True)
    post_id = db.Column(
        db.Integer, db.ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id = db.Column(
        db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    body = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    post = db.relationship("Post", back_populates="comments")
    author = db.relationship("User", back_populates="comments")
