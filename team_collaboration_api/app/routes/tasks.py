from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.cache_service import (
    invalidate_activity_for_project,
    invalidate_project_detail,
    invalidate_tasks_for_project,
)
from app.extensions import db
from app.errors import ApiError
from app.models import Project, Task, User
from app.schemas import TaskSchema, TaskCreateSchema, TaskUpdateSchema
from app.services.notifications import create_notification

bp = Blueprint("tasks", __name__, url_prefix="/api/v1")


def _uid() -> int:
    return int(get_jwt_identity())


def _can_access_project(user_id: int, project: Project) -> bool:
    if project.owner_id == user_id:
        return True
    return any(m.id == user_id for m in project.members)


def _can_access_task(user_id: int, task: Task) -> bool:
    """Project members/owner, or the task assignee, may read/update a task."""
    if _can_access_project(user_id, task.project):
        return True
    return task.assignee_id is not None and task.assignee_id == user_id


@bp.route("/projects/<int:project_id>/tasks", methods=["GET"])
@jwt_required()
def list_tasks(project_id: int):
    user_id = _uid()
    project = Project.query.get_or_404(project_id)
    if _can_access_project(user_id, project):
        tasks = (
            Task.query.filter_by(project_id=project_id)
            .order_by(Task.created_at.desc())
            .all()
        )
    elif Task.query.filter_by(project_id=project_id, assignee_id=user_id).first():
        tasks = (
            Task.query.filter_by(project_id=project_id, assignee_id=user_id)
            .order_by(Task.created_at.desc())
            .all()
        )
    else:
        raise ApiError("Forbidden", 403)
    return jsonify({"tasks": [TaskSchema().dump(t) for t in tasks]})


@bp.route("/projects/<int:project_id>/tasks", methods=["POST"])
@jwt_required()
def create_task(project_id: int):
    user_id = _uid()
    project = Project.query.get_or_404(project_id)
    if not _can_access_project(user_id, project):
        raise ApiError("Forbidden", 403)
    data = TaskCreateSchema().load(request.get_json(force=True, silent=True) or {})
    task = Task(
        project_id=project_id,
        title=data["title"],
        description=data.get("description"),
        status=data.get("status", "todo"),
        priority=data.get("priority", "medium"),
        due_date=data.get("due_date"),
        assignee_id=data.get("assignee_id"),
        created_by_id=user_id,
    )
    db.session.add(task)
    db.session.commit()
    invalidate_tasks_for_project(project_id)
    invalidate_activity_for_project(project_id)
    invalidate_project_detail(project_id)
    if task.assignee_id and task.assignee_id != user_id:
        create_notification(
            task.assignee_id,
            "Task assigned",
            f'You were assigned: "{task.title}"',
            "task_assigned",
            related_project_id=project_id,
            related_task_id=task.id,
        )
    return jsonify(TaskSchema().dump(task)), 201


@bp.route("/tasks/<int:task_id>", methods=["GET"])
@jwt_required()
def get_task(task_id: int):
    user_id = _uid()
    task = Task.query.get_or_404(task_id)
    if not _can_access_task(user_id, task):
        raise ApiError("Forbidden", 403)
    return jsonify(TaskSchema().dump(task))


@bp.route("/tasks/<int:task_id>", methods=["PATCH"])
@jwt_required()
def update_task(task_id: int):
    user_id = _uid()
    task = Task.query.get_or_404(task_id)
    if not _can_access_task(user_id, task):
        raise ApiError("Forbidden", 403)
    data = TaskUpdateSchema().load(request.get_json(force=True, silent=True) or {}, partial=True)
    old_assignee = task.assignee_id
    old_status = task.status
    for key, val in data.items():
        setattr(task, key, val)
    db.session.commit()
    invalidate_tasks_for_project(task.project_id)
    invalidate_activity_for_project(task.project_id)
    invalidate_project_detail(task.project_id)
    if task.assignee_id and task.assignee_id != old_assignee and task.assignee_id != user_id:
        create_notification(
            task.assignee_id,
            "Task assigned",
            f'You were assigned: "{task.title}"',
            "task_assigned",
            related_project_id=task.project_id,
            related_task_id=task.id,
        )
    # Notify on transition to "done" only (not if already done).
    marked_done = task.status == "done" and old_status != "done"
    if marked_done:
        # Someone other than the creator marked it done → notify creator.
        if task.created_by_id != user_id:
            create_notification(
                task.created_by_id,
                "Task completed",
                f'"{task.title}" was marked done.',
                "task_completed",
                related_project_id=task.project_id,
                related_task_id=task.id,
            )
        # Creator (or another member) marked it done → notify assignee if they did not click Done.
        if (
            task.assignee_id
            and task.assignee_id != user_id
            and task.assignee_id != task.created_by_id
        ):
            create_notification(
                task.assignee_id,
                "Task marked done",
                f'"{task.title}" was marked done.',
                "task_completed",
                related_project_id=task.project_id,
                related_task_id=task.id,
            )
    return jsonify(TaskSchema().dump(task))


@bp.route("/tasks/<int:task_id>", methods=["DELETE"])
@jwt_required()
def delete_task(task_id: int):
    user_id = _uid()
    task = Task.query.get_or_404(task_id)
    if not _can_access_task(user_id, task):
        raise ApiError("Forbidden", 403)
    if task.project.owner_id != user_id and task.created_by_id != user_id:
        raise ApiError("Only owner or task creator can delete", 403)
    pid = task.project_id
    db.session.delete(task)
    db.session.commit()
    invalidate_tasks_for_project(pid)
    invalidate_activity_for_project(pid)
    invalidate_project_detail(pid)
    return "", 204
