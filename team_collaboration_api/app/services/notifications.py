"""Create notifications and push to Socket.IO rooms."""

import logging

from flask import current_app

from app.extensions import db, socketio
from app.models import Notification

_log = logging.getLogger("collab.celery")


def user_room(user_id: int) -> str:
    return f"user_{user_id}"


def emit_notification(user_id: int, payload: dict) -> None:
    """Push real-time event to the user's Socket.IO room."""
    socketio.emit("notification", payload, room=user_room(user_id))


def create_notification(
    user_id: int,
    title: str,
    body: str,
    type_: str = "info",
    related_project_id=None,
    related_task_id=None,
    push_realtime: bool = True,
    *,
    force_sync: bool = False,
) -> Notification | None:
    """Persist notification. Returns ``None`` when enqueued on Celery (see ``USE_ASYNC_NOTIFICATIONS``).

    ``force_sync=True`` is used by the Celery worker so we do not enqueue a nested task.
    """
    app = current_app._get_current_object()
    use_async = (
        app.config.get("USE_ASYNC_NOTIFICATIONS")
        and not app.config.get("TESTING", False)
        and not force_sync
    )

    if use_async:
        try:
            from app.worker_tasks import create_notification_task

            async_result = create_notification_task.delay(
                user_id,
                title,
                body,
                type_,
                related_project_id=related_project_id,
                related_task_id=related_task_id,
                push_realtime=push_realtime,
            )
            if async_result is None:
                raise RuntimeError("Celery delay() returned None (broker misconfigured?)")
            _log.info(
                "Notification Celery enqueue: task=collab.create_notification "
                "celery_task_id=%s eager=%s user_id=%s type=%s",
                async_result.id,
                app.config.get("CELERY_TASK_ALWAYS_EAGER", False),
                user_id,
                type_,
            )
            return None
        except Exception as exc:
            _log.warning(
                "Celery enqueue failed (%s); persisting notification in the API process.",
                exc,
            )

    n = Notification(
        user_id=user_id,
        title=title,
        body=body,
        type=type_,
        related_project_id=related_project_id,
        related_task_id=related_task_id,
    )
    db.session.add(n)
    db.session.flush()
    if push_realtime:
        emit_notification(
            user_id,
            {
                "id": n.id,
                "title": title,
                "body": body,
                "type": type_,
                "related_project_id": related_project_id,
                "related_task_id": related_task_id,
            },
        )
    # Persist after prior route commit(); without this, teardown can roll back the INSERT.
    db.session.commit()
    return n


def notify_project_members_except(
    project, title: str, body: str, type_, exclude_user_id=None
):
    """Notify all project members (owner + members)."""
    seen = set()
    users_to_notify = [project.owner_id] + [m.id for m in project.members]
    for uid in users_to_notify:
        if uid in seen or uid == exclude_user_id:
            continue
        seen.add(uid)
        create_notification(uid, title, body, type_, related_project_id=project.id)
