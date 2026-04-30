# E-commerce API

Flask REST API aligned with **`customer_support_api`** and **`blogging_api`**: Flask 3, SQLAlchemy, JWT, Flask-Limiter, Marshmallow, bcrypt, Flask-CORS, and **Flasgger** Swagger UI.

## Swagger / OpenAPI

With the API running (default **`http://127.0.0.1:5004`**):

- **Swagger UI**: [`http://127.0.0.1:5004/apidocs/`](http://127.0.0.1:5004/apidocs/) (Flask redirects bare `/apidocs` to add the trailing slash)
- **Raw spec**: [`http://127.0.0.1:5004/apispec_1.json`](http://127.0.0.1:5004/apispec_1.json) (Flasgger default)

Use **Authorize** with `Bearer <access_token>` from **register** or **login**. Paths are assembled from **`---` YAML** blocks in Flask view docstrings (`app/swagger/template.yaml` supplies shared meta).

## Features

| Area | Endpoints |
|------|-----------|
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` |
| User profile | `GET /api/auth/me`, `PUT /api/users/me` |
| Catalog | `GET /api/products`, `GET /api/products/<id>` |
| Cart | `GET /api/cart`, `POST /api/cart/items`, `PATCH/DELETE /api/cart/items/<id>`, `POST/DELETE /api/cart/discount` |
| Orders & checkout | `GET /api/orders`, `GET /api/orders/<id>`, `POST /api/orders/checkout` |
| Email audit | `GET /api/notifications/email` |

- **Discount codes**: `SAVE10` (10% off, min subtotal \$20), `WELCOME5` (\$5 off fixed, min \$15), plus an expired demo code.
- **Payments**: mocked processor (`MOCK_PAYMENT_ENABLED=1`). Client sends **`payment_token`** **`tok_charge_success`** or **`tok_charge_declined`**.
- **Email**: each successful checkout records an **`order_confirmation`** row and logs payload; configure SMTP env vars (`MAIL_*`) to attempt real SMTP.

## Setup

```bash
cd ecommerce_api
python -m venv .venv && source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
export FLASK_APP=run.py
flask init-db
flask seed-shop
python run.py   # listens on PORT (default 5004)
```

Set **`DATABASE_URI`** to use another SQLite path or Postgres.  
Set **`CORS_ORIGINS`** to include your Vite dev origin if it changes.

See **`../ecommerce_frontend/README.md`** for the matching React storefront demo.

## Tests

```bash
pip install -r requirements-dev.txt
pytest tests/ -q
```

Broad REST coverage (verbs, auth/authz, validation errors, rate limiting, ~500 ms smoke): **`tests/test_rest_api_comprehensive.py`**.  
Checkout depth: **`tests/test_checkout_flow.py`**. Strategy for fixtures and data: **`tests/TEST_DATA_STRATEGY.md`**.
