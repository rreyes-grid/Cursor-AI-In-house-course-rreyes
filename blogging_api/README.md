# Blogging Platform API

Flask REST API for a blogging platform: **JWT authentication**, **SQLAlchemy** models, **Marshmallow** validation, **Flasgger** Swagger UI, centralized error handling, paginated listing/search, and **Redis-backed caching** (with in-process fallback) for hot read paths.

## Setup

```bash
cd blogging_api
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env        # optional: secrets, DATABASE_URI, REDIS_URL
export FLASK_APP=run.py
flask init-db
python run.py
```

Default URL: **http://127.0.0.1:5003** (override with `PORT`).

- **Swagger UI**: [http://127.0.0.1:5003/apidocs](http://127.0.0.1:5003/apidocs) — use **Authorize** with `Bearer <access_token>` after login or register.
- **OpenAPI JSON**: `/apispec_1.json`
- **Health**: `GET /health`

## Caching (Redis)

To initiate redis server:
/usr/local/opt/redis/bin/redis-server /usr/local/etc/redis.conf

When **`REDIS_URL`** is set (e.g. `redis://127.0.0.1:6379/0`), **Flask-Caching** uses **Redis** for shared, low-latency response caches across workers. If `REDIS_URL` is unset, the app uses **SimpleCache** (in-process only—fine for local dev and tests).

| Cached | Invalidation |
|--------|----------------|
| `GET /api/posts` (per `page` + `POSTS_PER_PAGE`) | Version token bumped on any post create/update/delete, and when categories change posts that reference them |
| `GET /api/posts/<id>` | Key dropped when that post is updated or deleted; list version bumped on post writes |

Environment variables (see `.env.example`): `REDIS_URL`, optional `CACHE_TYPE`, `CACHE_DEFAULT_TIMEOUT` (seconds), `CACHE_KEY_PREFIX`, `CACHE_VERSION_TTL`.

**Observing cache vs DB:** at **INFO**, `GET /api/posts` and `GET /api/posts/<id>` log **`cache HIT`** (response served from the cache backend—Redis or SimpleCache) vs **`cache MISS -> DB query`** before hitting SQLAlchemy. The log line includes `backend=RedisCache` or `backend=SimpleCache`. Other routes (e.g. `POST` posts) always touch the database for writes.

## Database indexes

Composite indexes support common queries:

- **`posts`**: `(created_at, id)` for newest-first listing with stable ordering
- **`comments`**: `(post_id, created_at)` for comments per post

## Performance notes

Caching repeated **GET** responses for post lists and details typically **cuts latency** on hot paths (often well beyond 50% versus uncached DB + serialization on every request), and **Redis** lets multiple app processes share one cache and handle high read concurrency. **3× concurrent read throughput** is plausible when the workload is cache-friendly; validate with your own load tests (e.g. `locust`, `wrk`) against realistic mixes of reads and writes.

## Authentication

Send `Authorization: Bearer <access_token>` for protected routes.

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/auth/register` | Register (returns JWT + user) |
| `POST` | `/api/auth/login` | Login (returns JWT + user) |
| `GET` | `/api/auth/me` | Current user (JWT) |

## Posts (20 per page)

| Method | Path | Auth |
|--------|------|------|
| `GET` | `/api/posts?page=1` | No — list posts (newest first) |
| `POST` | `/api/posts` | Yes — create (`title`, `body`, optional `category_id`, optional `slug`) |
| `GET` | `/api/posts/<id>` | No — single post |
| `PUT` | `/api/posts/<id>` | Yes — author only |
| `DELETE` | `/api/posts/<id>` | Yes — author only |

## Comments

| Method | Path | Auth |
|--------|------|------|
| `GET` | `/api/posts/<id>/comments` | No |
| `POST` | `/api/posts/<id>/comments` | Yes — body: `{ "body": "..." }` |
| `DELETE` | `/api/posts/<post_id>/comments/<comment_id>` | Yes — comment author or post author |

## Categories

| Method | Path | Auth |
|--------|------|------|
| `GET` | `/api/categories` | No |
| `POST` | `/api/categories` | Yes — `{ "name": "..." }` |
| `PUT` | `/api/categories/<id>` | Yes |
| `DELETE` | `/api/categories/<id>` | Yes — posts become uncategorized (`category_id` null) |

## Search

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/search?q=keyword&page=1` | Search title/body (case-insensitive), same pagination as posts |

## Responses

- Success payloads use JSON; list endpoints return `items`, `page`, `per_page`, `total`, `pages` (and search includes `q`).
- Errors: `{ "error": true, "message": "..." }` (and `422` validation: `errors` from Marshmallow).

## Tests

```bash
pytest
```

The suite enforces **≥85%** line coverage on `app/` (`pytest.ini`). As of the caching work it includes **26+** tests covering auth, validation, posts, comments, categories, search, slug helpers, and cache hit/invalidation behavior.

## Troubleshooting

### `Error 61` / `Connection refused` to `127.0.0.1:6379`

Redis is not running, but **`REDIS_URL`** points at local Redis. Options:

1. **Start Redis** (e.g. macOS: `brew services start redis`, or Docker: `docker run -p 6379:6379 redis`).
2. **Or** remove or comment out **`REDIS_URL`** in `.env` so the app uses **SimpleCache** only.
3. If **`REDIS_URL`** is set and Redis is down, the app **falls back to SimpleCache** at startup (check logs for `Redis unreachable … falling back to SimpleCache`).

### Bad interpreter / broken venv after moving the repo

If you moved or renamed the project folder and see **bad interpreter** for `flask` or `python` in `.venv`, delete `.venv`, recreate it, and `pip install -r requirements.txt` again.
