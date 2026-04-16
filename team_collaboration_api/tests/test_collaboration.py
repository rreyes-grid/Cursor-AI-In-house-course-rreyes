def test_activity_and_presence(client, auth_headers, project_id):
    r = client.get(
        f"/api/v1/collaboration/projects/{project_id}/activity",
        headers=auth_headers,
    )
    assert r.status_code == 200
    assert "activity" in r.get_json()

    r2 = client.post(
        f"/api/v1/collaboration/projects/{project_id}/presence",
        headers=auth_headers,
    )
    assert r2.status_code == 200
    assert r2.get_json().get("ok") is True


def test_activity_cache_hit(client, auth_headers, project_id):
    client.get(
        f"/api/v1/collaboration/projects/{project_id}/activity",
        headers=auth_headers,
    )
    r = client.get(
        f"/api/v1/collaboration/projects/{project_id}/activity",
        headers=auth_headers,
    )
    assert r.status_code == 200
