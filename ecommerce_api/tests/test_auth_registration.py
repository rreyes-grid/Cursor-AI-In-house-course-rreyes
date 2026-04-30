"""Lightweight regression coverage complementary to checkout flows."""

from tests import test_data_generators as gen


def test_duplicate_registration_conflict_returns_409(client):
    payload = gen.register_payload()
    claim = client.post("/api/auth/register", json=payload)
    assert claim.status_code == 201

    repeat = client.post("/api/auth/register", json=payload)
    assert repeat.status_code == 409
