def test_list_projects_cached_twice(client, auth_headers, project_id):
    r1 = client.get("/api/v1/projects", headers=auth_headers)
    r2 = client.get("/api/v1/projects", headers=auth_headers)
    assert r1.status_code == 200 and r2.status_code == 200
    assert r1.get_json() == r2.get_json()
    assert any(p["id"] == project_id for p in r1.get_json()["projects"])


def test_get_project(client, auth_headers, project_id):
    r = client.get(f"/api/v1/projects/{project_id}", headers=auth_headers)
    assert r.status_code == 200
    assert r.get_json()["name"] == "P1"


def test_update_project_invalidates_cache(client, auth_headers, project_id):
    client.get(f"/api/v1/projects/{project_id}", headers=auth_headers)
    r = client.patch(
        f"/api/v1/projects/{project_id}",
        json={"name": "Renamed"},
        headers={**auth_headers, "Content-Type": "application/json"},
    )
    assert r.status_code == 200
    assert r.get_json()["name"] == "Renamed"
    r2 = client.get(f"/api/v1/projects/{project_id}", headers=auth_headers)
    assert r2.get_json()["name"] == "Renamed"


def test_project_forbidden_for_other_user(client, second_user_headers, project_id):
    r = client.get(f"/api/v1/projects/{project_id}", headers=second_user_headers)
    assert r.status_code == 403


def test_add_remove_member(client, auth_headers, second_user_headers, project_id):
    import json

    from app.models import User

    with client.application.app_context():
        uid2 = User.query.filter_by(email="user2@test.local").first().id

    r = client.post(
        f"/api/v1/projects/{project_id}/members",
        data=json.dumps({"user_id": uid2}),
        headers={**auth_headers, "Content-Type": "application/json"},
    )
    assert r.status_code == 201

    r2 = client.get(f"/api/v1/projects/{project_id}", headers=second_user_headers)
    assert r2.status_code == 200

    r3 = client.delete(
        f"/api/v1/projects/{project_id}/members/{uid2}",
        headers=auth_headers,
    )
    assert r3.status_code == 204
