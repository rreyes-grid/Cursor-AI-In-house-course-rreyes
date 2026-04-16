"""Redis / in-process cache keys and invalidation for hot read paths."""

from flask import current_app

from app.extensions import cache
from app.models import Project


def _prefix() -> str:
    return current_app.config.get("CACHE_KEY_PREFIX", "collab:")


def cache_backend_name() -> str:
    """Flask-Caching backend (e.g. RedisCache, SimpleCache) for log lines."""
    return current_app.config.get("CACHE_TYPE", "unknown")


def project_list_key(user_id: int) -> str:
    return f"{_prefix()}v1:projects:list:{user_id}"


def project_detail_key(project_id: int) -> str:
    return f"{_prefix()}v1:project:{project_id}"


def tasks_list_key(project_id: int) -> str:
    return f"{_prefix()}v1:tasks:list:{project_id}"


def activity_key(project_id: int) -> str:
    return f"{_prefix()}v1:activity:{project_id}"


def invalidate_user_project_list(user_id: int) -> None:
    cache.delete(project_list_key(user_id))


def invalidate_project_detail(project_id: int) -> None:
    cache.delete(project_detail_key(project_id))


def invalidate_tasks_for_project(project_id: int) -> None:
    cache.delete(tasks_list_key(project_id))


def invalidate_activity_for_project(project_id: int) -> None:
    cache.delete(activity_key(project_id))


def invalidate_project_caches(project: Project) -> None:
    """Invalidate project detail, task list, activity, and all participant project lists."""
    invalidate_project_detail(project.id)
    invalidate_tasks_for_project(project.id)
    invalidate_activity_for_project(project.id)
    user_ids = {project.owner_id}
    user_ids.update(m.id for m in project.members)
    for uid in user_ids:
        invalidate_user_project_list(uid)
