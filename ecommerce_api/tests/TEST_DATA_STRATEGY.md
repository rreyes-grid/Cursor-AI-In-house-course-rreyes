# Test data generation strategy — e-commerce checkout (pytest)

## Goals

1. **Isolation**: Each test function gets its own SQLite file under `tmp_path` so catalogs, carts, orders, and notification rows never leak between examples.
2. **Deterministic math**: Fixtures use predictable **price cents** (`2999`) and **SAVE10 min subtotal `$20.00`** so discount expectations are stable without floating-point ambiguity.
3. **Minimize randomness**: `unique_email()` builds addresses like `shopper+12@example.test` (RFC-friendly) and `unique_sku()` uses a monotonic counter so parallel pytest workers stay safe (each worker has its own temp DB); avoid unseeded `random` in assertions.
4. **Layered builders**:
   - **`test_data_generators.py`** — pure helpers (emails, payloads, row factories).
   - **`conftest.py`** — wiring (`app`, `client`, `seed_catalog`, `auth_headers`).
   - **`test_checkout_flow.py`** — scenarios that read like acceptance criteria IDs (`CHK-P01`, `SEC-02`, …).
5. **Security payloads**: Reuse a shared list of SQL-injection / delimiter strings and assert **HTTP safety** (no 5xx, ORM still returns structured JSON) rather than assuming specific match counts.
6. **Payment surface**: Mock PSP accepts only `tok_charge_success`, `tok_charge_success_*`, or declines on `tok_charge_declined`; everything else should surface as a **402** decline path (current API contract) — tests lock that in.
7. **Email audit**: With `MAIL_SERVER` unset, notifications are **persisted only** (`smtp_attempted=False`); assertions target ORM rows, not SMTP.

## How to extend

| Need | Approach |
|------|-----------|
| New SKU | Append via `product_row()` helper with `unique_sku("PREFIX")`. |
| New coupon | Instantiate `DiscountCode` in `seed_catalog` fixture or a bespoke fixture. |
| Heavy load sketch | Prefer factory loops inside a single test marking `@pytest.mark.slow` (not included by default). |

## Commands

```bash
cd ecommerce_api
pip install -r requirements-dev.txt
pytest tests/ -q
pytest tests/test_checkout_flow.py -q --cov=app --cov-report=term-missing
```

## Scenario map (representative)

| Area | Examples implemented in `test_checkout_flow.py` / companions |
|------|----------------------------------------------------------------|
| Cart + | Merge lines, multi-SKU subtotal |
| Cart − | Anonymous 401, phantom SKU, inactive SKU, over-capacity add/patch |
| Discount + | Percent `SAVE10`, remove code |
| Discount − | Minimum subtotal breach, expired coupon, unknown code |
| Checkout + | `tok_charge_success` (+ vendor suffix), stock decrement, cart cleared, persisted email body |
| Checkout − | Declined PSP (402 retains cart echo), malformed PSP inputs (400 vs 402) |
| Checkout edge | Empty cart checkout (422), mock gateway switched off (503) |
| Email | Notification row count bump + plaintext confirmation match |
| Security | JWT missing, shopper order isolation, marshmallow rejects unknown PSP keys (extra fields), benign-only payload totals, fuzzed `/products?q=` |
| PSP unit | Deterministic branching in `test_payment_mock.py` |
| Auth auxiliary | Duplicate email `409` in `test_auth_registration.py` |

