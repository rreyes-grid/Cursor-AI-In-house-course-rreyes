import json


def test_team_create_list_get(client, auth_headers):
    r = client.post(
        "/api/v1/teams",
        data=json.dumps(
            {
                "name": "Team A",
                "slug": "team-a",
                "description": "d",
            }
        ),
        headers={**auth_headers, "Content-Type": "application/json"},
    )
    assert r.status_code == 201
    tid = r.get_json()["id"]

    r2 = client.get("/api/v1/teams", headers=auth_headers)
    assert r2.status_code == 200
    assert any(t["id"] == tid for t in r2.get_json()["teams"])

    r3 = client.get(f"/api/v1/teams/{tid}", headers=auth_headers)
    assert r3.status_code == 200


def test_team_add_member(client, auth_headers, second_user_headers):
    import json

    from app.models import User

    with client.application.app_context():
        uid2 = User.query.filter_by(email="user2@test.local").first().id

    r = client.post(
        "/api/v1/teams",
        data=json.dumps({"name": "T2", "slug": "team-b"}),
        headers={**auth_headers, "Content-Type": "application/json"},
    )
    tid = r.get_json()["id"]

    r2 = client.post(
        f"/api/v1/teams/{tid}/members",
        data=json.dumps({"user_id": uid2}),
        headers={**auth_headers, "Content-Type": "application/json"},
    )
    assert r2.status_code == 201
