def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.get_json()["status"] == "ok"


def test_not_found_project(client, auth_headers):
    r = client.get("/api/v1/projects/99999", headers=auth_headers)
    assert r.status_code == 404
