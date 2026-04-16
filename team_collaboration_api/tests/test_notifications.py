import json


def test_notifications_list_and_read(client, auth_headers, project_id):
    client.post(
        f"/api/v1/projects/{project_id}/tasks",
        data=json.dumps(
            {
                "title": "Assign me",
                "description": "x" * 20,
                "assignee_id": None,
            }
        ),
        headers={**auth_headers, "Content-Type": "application/json"},
    )

    r = client.get("/api/v1/notifications", headers=auth_headers)
    assert r.status_code == 200
    notes = r.get_json()["notifications"]
    if not notes:
        return
    nid = notes[0]["id"]
    r2 = client.post(f"/api/v1/notifications/{nid}/read", headers=auth_headers)
    assert r2.status_code == 200

    r3 = client.post("/api/v1/notifications/read-all", headers=auth_headers)
    assert r3.status_code == 200


def test_notifications_unread_filter(client, auth_headers):
    r = client.get("/api/v1/notifications?unread_only=true", headers=auth_headers)
    assert r.status_code == 200


def test_create_notification_force_sync_skips_celery_enqueue(app, token_user1):
    """Worker uses force_sync=True so nested enqueue is skipped even if USE_ASYNC_NOTIFICATIONS."""
    from app.models import Notification, User
    from app.services.notifications import create_notification

    prev_async = app.config["USE_ASYNC_NOTIFICATIONS"]
    prev_testing = app.config["TESTING"]
    try:
        app.config["USE_ASYNC_NOTIFICATIONS"] = True
        app.config["TESTING"] = False
        with app.app_context():
            uid = User.query.filter_by(email="user1@test.local").first().id
            before = Notification.query.count()
            n = create_notification(uid, "Sync", "Body", "info", force_sync=True)
            assert n is not None
            assert Notification.query.count() == before + 1
    finally:
        app.config["USE_ASYNC_NOTIFICATIONS"] = prev_async
        app.config["TESTING"] = prev_testing


def test_create_notification_async_eager_persists_via_worker(app, token_user1):
    """Async enqueue returns None from the API; eager Celery runs the worker in-process."""
    from app.models import Notification, User
    from app.services.notifications import create_notification

    assert app.config.get("CELERY_TASK_ALWAYS_EAGER") is True

    prev_async = app.config["USE_ASYNC_NOTIFICATIONS"]
    prev_testing = app.config["TESTING"]
    try:
        app.config["USE_ASYNC_NOTIFICATIONS"] = True
        app.config["TESTING"] = False
        with app.app_context():
            uid = User.query.filter_by(email="user1@test.local").first().id
            before = Notification.query.count()
            n = create_notification(uid, "Async", "Body", "info")
            assert n is None
            assert Notification.query.count() == before + 1
            row = (
                Notification.query.filter_by(user_id=uid, title="Async").first()
            )
            assert row is not None
    finally:
        app.config["USE_ASYNC_NOTIFICATIONS"] = prev_async
        app.config["TESTING"] = prev_testing
