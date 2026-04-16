from app.extensions import db

team_members = db.Table(
    "team_members",
    db.Column("user_id", db.Integer, db.ForeignKey("users.id"), primary_key=True),
    db.Column("team_id", db.Integer, db.ForeignKey("teams.id"), primary_key=True),
    db.Column("role", db.String(40), nullable=False, default="member"),
)


class Team(db.Model):
    __tablename__ = "teams"
    __table_args__ = (db.Index("ix_teams_created_by_id", "created_by_id"),)

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(160), nullable=False)
    slug = db.Column(db.String(120), unique=True, nullable=False, index=True)
    description = db.Column(db.Text, nullable=True)
    created_by_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    creator = db.relationship("User", foreign_keys=[created_by_id])
    members = db.relationship(
        "User",
        secondary=team_members,
        backref=db.backref("teams", lazy="dynamic"),
    )
