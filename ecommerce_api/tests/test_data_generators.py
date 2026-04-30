"""Reusable deterministic builders / identifiers for ecommerce checkout tests."""

from __future__ import annotations

from typing import Iterator, Optional

_counter = {"n": 0}


def reset_serial() -> None:
    _counter["n"] = 0


def _next_serial() -> int:
    _counter["n"] += 1
    return _counter["n"]


def unique_email(prefix: str = "shopper") -> str:
    return f"{prefix}+{_next_serial()}@example.test"


def unique_sku(prefix: str = "SKU") -> str:
    return f"{prefix}-{_next_serial():05d}"


def register_payload(
    *,
    email: Optional[str] = None,
    password: str = "CheckoutTest!",
    name: str = "Pytest Buyer",
    prefix: str = "shopper",
) -> dict:
    return {
        "email": email or unique_email(prefix),
        "password": password,
        "name": name,
    }


def malicious_search_strings() -> Iterator[str]:
    """Strings used to fuzz query parameters for injection-style resilience checks."""
    yield from (
        "' OR '1'='1",
        "1'; DROP TABLE eco_products--",
        "%BF' OR 1=1 --",
        "中文'; DELETE FROM eco_users WHERE 'a'='a",
    )


def oversized_payment_tokens() -> Iterator[str]:
    yield from ("x", "no_such_gateway_token", "a" * 129)
