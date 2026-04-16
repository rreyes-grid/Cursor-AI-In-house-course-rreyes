from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import insert, or_
from sqlalchemy.orm import selectinload

from app.cache_service import (
    cache_backend_name,
    invalidate_project_caches,
    invalidate_user_project_list,
    project_detail_key,
    project_list_key,
)
from app.extensions import cache, db, socketio
from app.errors import ApiError
from app.models import Project, User
from app.schemas import ProjectSchema, ProjectCreateSchema, ProjectUpdateSchema
from app.services.notifications import create_notification, notify_project_members_except

bp = Blueprint("projects", __name__, url_prefix="/api/v1/projects")


def _current_user_id() -> int:
    return int(get_jwt_identity())


def _project_or_404(project_id: int) -> Project:
    p = Project.query.options(selectinload(Project.members)).get(project_id)
    if not p:
        raise ApiError("Project not found", 404)
    return p


def _can_access_project(user_id: int, project: Project) -> bool:
    if project.owner_id == user_id:
        return True
    return any(m.id == user_id for m in project.members)


@bp.route("", methods=["GET"])
@jwt_required()
def list_projects():
    uid = _current_user_id()
    key = project_list_key(uid)
    cached = cache.get(key)
    if cached is not None:
        current_app.logger.info(
            "collab projects list cache HIT key=%s user_id=%s backend=%s",
            key,
            uid,
            cache_backend_name(),
        )
        return jsonify(cached)
    current_app.logger.info(
        "collab projects list cache MISS -> DB query user_id=%s backend=%s",
        uid,
        cache_backend_name(),
    )
    projects = (
        Project.query.options(selectinload(Project.members))
        .filter(or_(Project.owner_id == uid, Project.members.any(User.id == uid)))
        .distinct()
        .all()
    )
    payload = {"projects": [_dump_project(p) for p in projects]}
    cache.set(
        key,
        payload,
        timeout=current_app.config.get("CACHE_DEFAULT_TIMEOUT", 60),
    )
    return jsonify(payload)


@bp.route("", methods=["POST"])
@jwt_required()
def create_project():
    uid = _current_user_id()
    data = ProjectCreateSchema().load(request.get_json(force=True, silent=True) or {})
    project = Project(
        name=data["name"],
        description=data.get("description"),
        due_date=data.get("due_date"),
        status=data.get("status", "active"),
        progress_trend=data.get("progress_trend"),
        owner_id=uid,
    )
    db.session.add(project)
    db.session.flush()
    owner = User.query.get(uid)
    if owner and owner not in project.members:
        project.members.append(owner)
    db.session.commit()
    invalidate_user_project_list(uid)
    socketio.emit(
        "project_created",
        {"project_id": project.id, "name": project.name},
        room=f"project_{project.id}",
    )
    return jsonify(_dump_project(project)), 201


@bp.route("/<int:project_id>", methods=["GET"])
@jwt_required()
def get_project(project_id: int):
    uid = _current_user_id()
    project = _project_or_404(project_id)
    current_app.logger.info(
        "collab project detail DB query (load for access) project_id=%s backend=%s",
        project_id,
        cache_backend_name(),
    )
    if not _can_access_project(uid, project):
        raise ApiError("Forbidden", 403)
    ck = project_detail_key(project_id)
    cached = cache.get(ck)
    if cached is not None:
        current_app.logger.info(
            "collab project detail serialized payload cache HIT key=%s project_id=%s backend=%s",
            ck,
            project_id,
            cache_backend_name(),
        )
        return jsonify(cached)
    current_app.logger.info(
        "collab project detail serialized payload cache MISS -> serialize from ORM project_id=%s backend=%s",
        project_id,
        cache_backend_name(),
    )
    data = _dump_project(project)
    cache.set(ck, data, timeout=30)
    return jsonify(data)


@bp.route("/<int:project_id>", methods=["PATCH"])
@jwt_required()
def update_project(project_id: int):
    uid = _current_user_id()
    project = _project_or_404(project_id)
    if project.owner_id != uid:
        raise ApiError("Only the project owner can update", 403)
    data = ProjectUpdateSchema().load(request.get_json(force=True, silent=True) or {}, partial=True)
    for key, val in data.items():
        setattr(project, key, val)
    db.session.commit()
    notify_project_members_except(
        project,
        "Project updated",
        f'Project "{project.name}" was updated.',
        "project_update",
        exclude_user_id=uid,
    )
    db.session.commit()
    db.session.refresh(project)
    invalidate_project_caches(project)
    return jsonify(_dump_project(project))


@bp.route("/<int:project_id>", methods=["DELETE"])
@jwt_required()
def delete_project(project_id: int):
    uid = _current_user_id()
    project = _project_or_404(project_id)
    if project.owner_id != uid:
        raise ApiError("Only the project owner can delete", 403)
    invalidate_project_caches(project)
    db.session.delete(project)
    db.session.commit()
    return "", 204


@bp.route("/<int:project_id>/members", methods=["POST"])
@jwt_required()
def add_member(project_id: int):
    uid = _current_user_id()
    project = _project_or_404(project_id)
    if project.owner_id != uid:
        raise ApiError("Only the project owner can add members", 403)
    body = request.get_json(force=True, silent=True) or {}
    user_id = body.get("user_id")
    role = body.get("role", "member")
    if not user_id:
        raise ApiError("user_id required", 400)
    user = User.query.get(user_id)
    if not user:
        raise ApiError("User not found", 404)
    if user in project.members:
        raise ApiError("User already a member", 409)
    from app.models.project import project_members

    db.session.execute(
        insert(project_members).values(
            user_id=user.id, project_id=project.id, role=role
        )
    )
    db.session.commit()
    create_notification(
        user.id,
        "Added to project",
        f'You were added to "{project.name}"',
        "project_update",
        related_project_id=project.id,
    )
    db.session.refresh(project)
    invalidate_project_caches(project)
    return jsonify({"message": "Member added", "user_id": user.id}), 201


@bp.route("/<int:project_id>/members/<int:user_id>", methods=["DELETE"])
@jwt_required()
def remove_member(project_id: int, user_id: int):
    uid = _current_user_id()
    project = _project_or_404(project_id)
    if project.owner_id != uid and uid != user_id:
        raise ApiError("Forbidden", 403)
    user = User.query.get_or_404(user_id)
    if user in project.members:
        project.members.remove(user)
        db.session.commit()
        db.session.refresh(project)
        invalidate_project_caches(project)
    return "", 204


def _dump_project(p: Project) -> dict:
    d = ProjectSchema().dump(p)
    d["member_ids"] = [m.id for m in p.members]
    return d
