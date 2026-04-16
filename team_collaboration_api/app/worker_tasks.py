"""Celery background tasks (notifications, cache invalidation)."""

import logging

from celery.signals import (
    task_failure,
    task_postrun,
    task_prerun,
    worker_init,
    worker_ready,
)

from app.extensions import celery

logger = logging.getLogger("collab.celery")


def _collab_task_name(task) -> str | None:
    if task is None:
        return None
    return getattr(task, "name", None) or getattr(task, "__name__", None)


def _is_collab_task(task) -> bool:
    name = _collab_task_name(task)
    return bool(name and str(name).startswith("collab."))


@worker_init.connect
def _on_worker_init(**kwargs):
    logger.info("Celery worker process starting (worker_init)")


@worker_ready.connect
def _on_worker_ready(**kwargs):
    logger.info(
        "Celery worker ready to consume tasks — watch for task_prerun/task_postrun on collab.* tasks"
    )


@task_prerun.connect
def _log_task_prerun(
    sender=None, task_id=None, task=None, args=None, kwargs=None, **kwds
):
    if not _is_collab_task(task):
        return
    logger.info(
        "Celery task START name=%s id=%s args=%s kwargs=%s",
        _collab_task_name(task),
        task_id,
        args,
        kwargs,
    )


@task_postrun.connect
def _log_task_postrun(
    sender=None, task_id=None, task=None, args=None, kwargs=None, retval=None, **kwds
):
    if not _is_collab_task(task):
        return
    logger.info(
        "Celery task END name=%s id=%s return=%s",
        _collab_task_name(task),
        task_id,
        retval,
    )


@task_failure.connect
def _log_task_failure(
    sender=None, task_id=None, exception=None, einfo=None, **kwds
):
    if sender is None or not _is_collab_task(sender):
        return
    logger.exception(
        "Celery task FAILED name=%s id=%s: %s",
        _collab_task_name(sender),
        task_id,
        exception,
    )


@celery.task(name="collab.create_notification")
def create_notification_task(
    user_id: int,
    title: str,
    body: str,
    type_: str,
    related_project_id: int | None = None,
    related_task_id: int | None = None,
    push_realtime: bool = True,
):
    """Persist notification and optionally emit Socket.IO (requires Redis message_queue)."""
    logger.info(
        "create_notification_task body: user_id=%s title=%r type=%s",
        user_id,
        title,
        type_,
    )
    from app.services.notifications import create_notification

    n = create_notification(
        user_id,
        title,
        body,
        type_,
        related_project_id=related_project_id,
        related_task_id=related_task_id,
        push_realtime=push_realtime,
        force_sync=True,
    )
    if n is None:
        raise RuntimeError("create_notification returned None despite force_sync=True")
    logger.info("create_notification_task done notification_id=%s", n.id)
    return n.id


@celery.task(name="collab.invalidate_project_cache")
def invalidate_project_cache_task(project_id: int) -> None:
    """Invalidate cached project / task / activity entries after mutations."""
    logger.info("invalidate_project_cache_task project_id=%s", project_id)
    from app.models import Project

    from app.cache_service import invalidate_project_caches

    p = Project.query.get(project_id)
    if p:
        invalidate_project_caches(p)
        logger.info(
            "invalidate_project_cache_task finished project_id=%s", project_id
        )
    else:
        logger.warning(
            "invalidate_project_cache_task skipped — project_id=%s not found",
            project_id,
        )
