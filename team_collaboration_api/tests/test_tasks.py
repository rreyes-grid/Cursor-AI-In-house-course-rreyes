import json


def test_task_crud(client, auth_headers, project_id):
    r = client.post(
        f"/api/v1/projects/{project_id}/tasks",
        data=json.dumps(
            {
                "title": "T1",
                "description": "Task description here long enough",
                "status": "todo",
            }
        ),
        headers={**auth_headers, "Content-Type": "application/json"},
    )
    assert r.status_code == 201
    tid = r.get_json()["id"]

    r2 = client.get(f"/api/v1/projects/{project_id}/tasks", headers=auth_headers)
    assert r2.status_code == 200
    assert any(t["id"] == tid for t in r2.get_json()["tasks"])

    r3 = client.get(f"/api/v1/tasks/{tid}", headers=auth_headers)
    assert r3.status_code == 200

    r4 = client.patch(
        f"/api/v1/tasks/{tid}",
        data=json.dumps({"status": "done"}),
        headers={**auth_headers, "Content-Type": "application/json"},
    )
    assert r4.status_code == 200
    assert r4.get_json()["status"] == "done"

    r5 = client.delete(f"/api/v1/tasks/{tid}", headers=auth_headers)
    assert r5.status_code == 204


def test_assignee_can_update_task_without_project_membership(
    client, auth_headers, second_user_headers, project_id
):
    """Assignee need not be in project.members; they can still PATCH the task."""
    from app.models import User

    with client.application.app_context():
        uid2 = User.query.filter_by(email="user2@test.local").first().id

    r = client.post(
        f"/api/v1/projects/{project_id}/tasks",
        data=json.dumps(
            {
                "title": "For assignee only",
                "description": "x" * 25,
                "assignee_id": uid2,
            }
        ),
        headers={**auth_headers, "Content-Type": "application/json"},
    )
    assert r.status_code == 201
    tid = r.get_json()["id"]

    r2 = client.patch(
        f"/api/v1/tasks/{tid}",
        data=json.dumps({"status": "in_progress"}),
        headers={**second_user_headers, "Content-Type": "application/json"},
    )
    assert r2.status_code == 200, r2.get_json()
    assert r2.get_json()["status"] == "in_progress"

    r3 = client.get(f"/api/v1/projects/{project_id}/tasks", headers=second_user_headers)
    assert r3.status_code == 200
    tasks = r3.get_json()["tasks"]
    assert len(tasks) == 1
    assert tasks[0]["id"] == tid


def test_tasks_list_cache(client, auth_headers, project_id):
    client.get(f"/api/v1/projects/{project_id}/tasks", headers=auth_headers)
    r = client.get(f"/api/v1/projects/{project_id}/tasks", headers=auth_headers)
    assert r.status_code == 200
