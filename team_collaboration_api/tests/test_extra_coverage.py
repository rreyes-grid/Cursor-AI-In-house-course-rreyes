"""Additional tests to cover branches and edge paths for 90%+ coverage."""

import json


def test_creator_marking_done_notifies_assignee(
    client, auth_headers, second_user_headers, project_id
):
    """When creator marks a task done, the assignee gets a notification."""
    import json

    from app.models import User

    with client.application.app_context():
        uid2 = User.query.filter_by(email="user2@test.local").first().id

    r = client.post(
        f"/api/v1/projects/{project_id}/tasks",
        data=json.dumps({"title": "Work item", "assignee_id": uid2}),
        content_type="application/json",
        headers=auth_headers,
    )
    assert r.status_code == 201
    tid = r.get_json()["id"]

    r2 = client.patch(
        f"/api/v1/tasks/{tid}",
        data=json.dumps({"status": "done"}),
        content_type="application/json",
        headers=auth_headers,
    )
    assert r2.status_code == 200

    r3 = client.get("/api/v1/notifications", headers=second_user_headers)
    assert r3.status_code == 200
    notes = r3.get_json()["notifications"]
    assert any(n.get("type") == "task_completed" for n in notes)


def test_task_assignee_notification(client, auth_headers, second_user_headers, project_id):
    from app.models import User

    with client.application.app_context():
        uid2 = User.query.filter_by(email="user2@test.local").first().id

    client.post(
        f"/api/v1/projects/{project_id}/members",
        data=json.dumps({"user_id": uid2}),
        headers={**auth_headers, "Content-Type": "application/json"},
    )

    r = client.post(
        f"/api/v1/projects/{project_id}/tasks",
        data=json.dumps(
            {
                "title": "For user2",
                "description": "x" * 25,
                "assignee_id": uid2,
            }
        ),
        headers={**auth_headers, "Content-Type": "application/json"},
    )
    assert r.status_code == 201

    r2 = client.get("/api/v1/notifications", headers=second_user_headers)
    assert r2.status_code == 200
    notes = r2.get_json()["notifications"]
    assert len(notes) >= 1
    nid = notes[0]["id"]

    r3 = client.post(
        f"/api/v1/notifications/{nid}/read",
        headers=second_user_headers,
    )
    assert r3.status_code == 200

    r4 = client.post(
        "/api/v1/notifications/read-all",
        headers=second_user_headers,
    )
    assert r4.status_code == 200


def test_delete_project(client, auth_headers):
    r = client.post(
        "/api/v1/projects",
        data=json.dumps({"name": "ToDelete", "description": "d"}),
        headers={**auth_headers, "Content-Type": "application/json"},
    )
    pid = r.get_json()["id"]
    r2 = client.delete(f"/api/v1/projects/{pid}", headers=auth_headers)
    assert r2.status_code == 204


def test_team_duplicate_slug(client, auth_headers):
    client.post(
        "/api/v1/teams",
        data=json.dumps({"name": "X", "slug": "unique-slug-xyz"}),
        headers={**auth_headers, "Content-Type": "application/json"},
    )
    r = client.post(
        "/api/v1/teams",
        data=json.dumps({"name": "Y", "slug": "unique-slug-xyz"}),
        headers={**auth_headers, "Content-Type": "application/json"},
    )
    assert r.status_code == 409


def test_team_get_forbidden(client, auth_headers, second_user_headers):
    r = client.post(
        "/api/v1/teams",
        data=json.dumps({"name": "Priv", "slug": "priv-team-slug"}),
        headers={**auth_headers, "Content-Type": "application/json"},
    )
    tid = r.get_json()["id"]
    r2 = client.get(f"/api/v1/teams/{tid}", headers=second_user_headers)
    assert r2.status_code == 403


def test_register_validation_error(client):
    r = client.post(
        "/api/v1/auth/register",
        json={
            "email": "not-an-email",
            "password": "password123",
            "name": "A",
            "username": "u1",
        },
    )
    assert r.status_code == 422


def test_celery_invalidate_missing_project(app):
    from app.worker_tasks import invalidate_project_cache_task

    res = invalidate_project_cache_task.apply(args=[999999])
    assert res.successful()


def test_notify_project_members_except_branch(client, auth_headers, project_id, token_user2):
    """update_project triggers notify_project_members_except (owner excluded)."""
    import json

    from app.models import User

    with client.application.app_context():
        uid2 = User.query.filter_by(email="user2@test.local").first().id

    client.post(
        f"/api/v1/projects/{project_id}/members",
        data=json.dumps({"user_id": uid2}),
        headers={**auth_headers, "Content-Type": "application/json"},
    )

    r = client.patch(
        f"/api/v1/projects/{project_id}",
        data=json.dumps({"description": "updated desc"}),
        headers={**auth_headers, "Content-Type": "application/json"},
    )
    assert r.status_code == 200
