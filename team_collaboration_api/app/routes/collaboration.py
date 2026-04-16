"""Team collaboration: activity summary and broadcast helpers."""

from flask import Blueprint, current_app, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.cache_service import activity_key, cache_backend_name
from app.extensions import cache, socketio
from app.errors import ApiError
from app.models import Project, Task, User

bp = Blueprint("collaboration", __name__, url_prefix="/api/v1/collaboration")


def _uid() -> int:
    return int(get_jwt_identity())


def _can_access_project(user_id: int, project: Project) -> bool:
    if project.owner_id == user_id:
        return True
    return any(m.id == user_id for m in project.members)


@bp.route("/projects/<int:project_id>/activity", methods=["GET"])
@jwt_required()
def project_activity(project_id: int):
    """Recent task changes for a project (collaboration feed)."""
    user_id = _uid()
    project = Project.query.get_or_404(project_id)
    current_app.logger.info(
        "collab activity DB query (load project for access) project_id=%s backend=%s",
        project_id,
        cache_backend_name(),
    )
    if not _can_access_project(user_id, project):
        raise ApiError("Forbidden", 403)
    ck = activity_key(project_id)
    cached = cache.get(ck)
    if cached is not None:
        current_app.logger.info(
            "collab activity feed cache HIT key=%s project_id=%s backend=%s",
            ck,
            project_id,
            cache_backend_name(),
        )
        return jsonify(cached)
    current_app.logger.info(
        "collab activity feed cache MISS -> DB query tasks project_id=%s backend=%s",
        project_id,
        cache_backend_name(),
    )
    tasks = (
        Task.query.filter_by(project_id=project_id)
        .order_by(Task.updated_at.desc())
        .limit(50)
        .all()
    )
    activity = []
    for t in tasks:
        assignee_name = t.assignee.name if t.assignee else None
        activity.append(
            {
                "type": "task",
                "task_id": t.id,
                "title": t.title,
                "status": t.status,
                "updated_at": t.updated_at.isoformat() if t.updated_at else None,
                "assignee": assignee_name,
            }
        )
    payload = {"project_id": project_id, "activity": activity}
    cache.set(ck, payload, timeout=min(15, current_app.config.get("CACHE_DEFAULT_TIMEOUT", 60)))
    return jsonify(payload)


@bp.route("/projects/<int:project_id>/presence", methods=["POST"])
@jwt_required()
def ping_presence(project_id: int):
    """Optional: broadcast presence to project room (real-time)."""
    user_id = _uid()
    project = Project.query.get_or_404(project_id)
    if not _can_access_project(user_id, project):
        raise ApiError("Forbidden", 403)
    user = User.query.get(user_id)
    socketio.emit(
        "presence",
        {"user_id": user_id, "name": user.name if user else str(user_id)},
        room=f"project_{project_id}",
    )
    return jsonify({"ok": True})
