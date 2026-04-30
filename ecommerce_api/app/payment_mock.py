"""Simulated PSP: use tok_charge_success or tok_charge_declined from the client."""

import secrets
from typing import Tuple


def process_mock_payment(amount_cents: int, payment_token: str) -> Tuple[bool, str]:
    """
    Returns (success, payment_reference_or_error_slug).
    """
    if payment_token == "tok_charge_declined":
        return False, "card_declined"
    if payment_token == "tok_charge_success":
        return True, "pi_mock_" + secrets.token_hex(12)
    if payment_token and payment_token.startswith("tok_charge_success_"):
        return True, "pi_mock_" + secrets.token_hex(12)
    return False, "invalid_payment_token"

