import re

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import or_

from app.extensions import db
from app.errors import ApiError
from app.models import Team, User
from app.schemas import TeamSchema, TeamCreateSchema
from app.services.notifications import create_notification

bp = Blueprint("teams", __name__, url_prefix="/api/v1/teams")


def _uid() -> int:
    return int(get_jwt_identity())


@bp.route("", methods=["GET"])
@jwt_required()
def list_teams():
    uid = _uid()
    teams = (
        Team.query.filter(
            or_(Team.created_by_id == uid, Team.members.any(User.id == uid))
        )
        .distinct()
        .all()
    )
    return jsonify({"teams": [_dump_team(t) for t in teams]})


@bp.route("", methods=["POST"])
@jwt_required()
def create_team():
    uid = _uid()
    data = TeamCreateSchema().load(request.get_json(force=True, silent=True) or {})
    slug = data["slug"].lower().strip()
    if not re.match(r"^[a-z0-9][a-z0-9-]{1,118}$", slug):
        raise ApiError("Invalid slug format", 400)
    if Team.query.filter_by(slug=slug).first():
        raise ApiError("Team slug already exists", 409)
    team = Team(
        name=data["name"],
        slug=slug,
        description=data.get("description"),
        created_by_id=uid,
    )
    db.session.add(team)
    db.session.flush()
    creator = User.query.get(uid)
    if creator:
        team.members.append(creator)
    db.session.commit()
    return jsonify(_dump_team(team)), 201


@bp.route("/<int:team_id>", methods=["GET"])
@jwt_required()
def get_team(team_id: int):
    uid = _uid()
    team = Team.query.get_or_404(team_id)
    if uid not in [m.id for m in team.members] and team.created_by_id != uid:
        raise ApiError("Forbidden", 403)
    return jsonify(_dump_team(team))


@bp.route("/<int:team_id>/members", methods=["POST"])
@jwt_required()
def add_team_member(team_id: int):
    uid = _uid()
    team = Team.query.get_or_404(team_id)
    if team.created_by_id != uid:
        raise ApiError("Only team creator can add members", 403)
    body = request.get_json(force=True, silent=True) or {}
    user_id = body.get("user_id")
    if not user_id:
        raise ApiError("user_id required", 400)
    user = User.query.get_or_404(user_id)
    if user in team.members:
        raise ApiError("Already a member", 409)
    team.members.append(user)
    db.session.commit()
    create_notification(
        user.id,
        "Team invitation",
        f'You were added to team "{team.name}"',
        "team_invite",
    )
    return jsonify({"message": "Member added"}), 201


def _dump_team(t: Team) -> dict:
    d = TeamSchema().dump(t)
    d["member_ids"] = [m.id for m in t.members]
    return d
