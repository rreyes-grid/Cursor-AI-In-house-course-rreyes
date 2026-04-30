"""Unit assertions for PSP simulation."""

from app.payment_mock import process_mock_payment


def test_payment_mock_positive_success_variants():
    ok, ref = process_mock_payment(4242, "tok_charge_success")
    assert ok and ref.startswith("pi_mock_")

    ok2, _ = process_mock_payment(1, "tok_charge_success_acmeissuer")
    assert ok2


def test_payment_mock_decline_known_token():
    ok, slug = process_mock_payment(5000, "tok_charge_declined")
    assert not ok
    assert slug == "card_declined"


def test_payment_mock_negative_unknown_gateway_token():
    ok, slug = process_mock_payment(5000, "tok_random")
    assert not ok
    assert slug == "invalid_payment_token"
