def test_register_login_me(client, auth_headers):
    r = client.get("/api/v1/auth/me", headers=auth_headers)
    assert r.status_code == 200
    body = r.get_json()
    assert body["email"] == "user1@test.local"
    assert "id" in body


def test_register_duplicate_email(client):
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "dup@test.local",
            "password": "password123",
            "name": "A",
            "username": "a1",
        },
    )
    r = client.post(
        "/api/v1/auth/register",
        json={
            "email": "dup@test.local",
            "password": "password123",
            "name": "B",
            "username": "b2",
        },
    )
    assert r.status_code == 409


def test_login_bad_password(client):
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "good@test.local",
            "password": "password123",
            "name": "G",
            "username": "goodu",
        },
    )
    r = client.post(
        "/api/v1/auth/login",
        json={"email": "good@test.local", "password": "wrong"},
    )
    assert r.status_code == 401
