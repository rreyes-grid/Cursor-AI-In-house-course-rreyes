# Team Collaboration API

Flask REST API for the team collaboration module: **JWT authentication**, **project** and **task** CRUD, **teams**, **notifications**, and **real-time** updates via **Socket.IO**.

## Stack

| Layer | Technology |
|-------|------------|
| Framework | Flask 3 |
| ORM | SQLAlchemy (Flask-SQLAlchemy) |
| Serialization / validation | Marshmallow |
| Auth | Flask-JWT-Extended (Bearer tokens) |
| Real-time | Flask-SocketIO (eventlet) |
| API docs | Flasgger (Swagger UI) |
| CORS | Flask-Cors |
| Cache | Flask-Caching (Redis or SimpleCache) |
| Background jobs | Celery 5 (Redis broker) |
| Tests | pytest, pytest-cov (≥90% line coverage on `app/`) |

## Performance & infrastructure

- **HTTP caching**: Project list (`GET /api/v1/projects`), project detail JSON (`GET /api/v1/projects/:id` after access checks), and collaboration activity (`GET /api/v1/collaboration/projects/:id/activity`) use response caching (TTL from `CACHE_DEFAULT_TIMEOUT`, default 60s). Set **`REDIS_URL`** to use **Redis**; otherwise **SimpleCache** (in-process) is used.
- **Cache vs DB logging**: At **INFO**, look for `collab projects list cache HIT|MISS`, `collab project detail serialized payload cache HIT|MISS`, and `collab activity feed cache HIT|MISS`. Each line includes `backend=RedisCache` or `backend=SimpleCache`. **Project detail** and **activity** still run a **DB query to load the project row for authorization** before the cache check; a payload **HIT** skips re-serializing / the activity tasks query.
- **Database**: Composite indexes on hot paths (`tasks.project_id` + `status`, `notifications.user_id` + `read`, `projects.owner_id`, etc.). SQLAlchemy **`pool_pre_ping`** / **`pool_recycle`** for connection health.
- **Celery**: Optional async tasks (`app/worker_tasks.py`) — e.g. notification persistence and cache invalidation. Run a worker: `celery -A celery_worker.celery worker --loglevel=info`. With **`REDIS_URL`**, Socket.IO can use the same Redis as **`message_queue`** so emits from workers reach clients.
- **Celery logging**: Logger **`collab.celery`** emits **INFO** when the Flask app configures Celery (`broker`, `result_backend`, **`task_always_eager`**). On a **real worker**, you also get **`worker_init`**, **`worker_ready`**, and per-task **`Celery task START` / `END`** (for tasks whose name starts with `collab.`). Task bodies log e.g. `create_notification_task body:` and `invalidate_project_cache_task`.
- **Notifications and Celery**: By default **`USE_ASYNC_NOTIFICATIONS=false`**, so **`create_notification()`** runs **inside the API process** — **no** `collab.create_notification` task runs, so you will **not** see task **START/END** in the worker. Set **`USE_ASYNC_NOTIFICATIONS=true`** in `.env`, ensure **Redis** + **`CELERY_BROKER_URL`** work (or use **`CELERY_TASK_ALWAYS_EAGER=true`** to run tasks **in the API process** and still see **START/END** in the same logs), and run **`celery -A celery_worker.celery worker`** when not using eager. When async is on, the API logs **`Notification Celery enqueue: task=collab.create_notification ...`** for each notification.
- **Tests**: `cd team_collaboration_api && pytest` — uses in-memory SQLite, eager Celery, and SimpleCache. Coverage gate: **90%** on `app/` (see `.coveragerc`; `socket_events.py` omitted).

## Prerequisites

- Python 3.10+ recommended
- pip / venv

## Setup

```bash
cd team_collaboration_api
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env        # optional: edit secrets
export FLASK_APP=run.py
flask init-db
python run.py
```

The API listens on **http://127.0.0.1:5001** by default (see *Troubleshooting* if you change `PORT`).

### Running tests

```bash
cd team_collaboration_api
source .venv/bin/activate
pip install -r requirements.txt
pytest
```

### Caching
To initiate redis server:
/usr/local/opt/redis/bin/redis-server /usr/local/etc/redis.conf

### Running a Celery worker (optional)

Requires Redis if not using eager mode (tests use eager mode).

```bash
cd team_collaboration_api
source .venv/bin/activate
celery -A celery_worker.celery worker --loglevel=info
```

`celery_worker.py` configures **stdout logging** so you see **`collab.celery`** lines: **`Celery worker process starting`**, **`worker ready to consume tasks`**, then for each **`collab.*`** task **`Celery task START`** / **`END`** plus the task-specific **`create_notification_task`** / **`invalidate_project_cache_task`** lines.

When you start the **Flask** app, **`init_celery`** logs one line with **`broker`**, **`result_backend`**, and **`task_always_eager`** (true in tests; false in normal `.env` so tasks go to the broker when enqueued).

**Note:** With **`USE_ASYNC_NOTIFICATIONS=false`** (default), notifications are saved in the API process only. Set **`USE_ASYNC_NOTIFICATIONS=true`** to enqueue **`collab.create_notification`** on Celery (see Performance & infrastructure above).

## API documentation (Swagger UI)

Open **http://127.0.0.1:5001/apidocs/** after starting the server (use your `PORT` if different).

If **Try it out** shows `NetworkError` / failed fetch, you were likely hitting a **localhost vs 127.0.0.1** mismatch (they are different browser origins). The spec no longer pins `host`; reload `/apidocs/` and try again. Alternatively, use the same hostname in the address bar as in any bookmarked API URL.

## Troubleshooting

### `Error 61` / `Connection refused` to `127.0.0.1:6379`

Redis is not running, but **`.env`** sets **`REDIS_URL`** (and/or Celery URLs). **`POST /api/v1/projects`** and other routes call **`socketio.emit`**; with a Redis **`message_queue`**, that tries to talk to Redis and fails.

**Fix:** Start Redis (`brew services start redis`, or Docker `docker run -p 6379:6379 redis`), **or** remove / comment out **`REDIS_URL`** in `.env` so the app uses **SimpleCache** and **Socket.IO without a message queue**.

On startup, if **`REDIS_URL`** is set but the server does not respond, the app **logs a warning** and **falls back** automatically (SimpleCache + no `message_queue`). Explicit **`CELERY_BROKER_URL`** still pointing at Redis can break **`celery worker`** until Redis is up.

### `bad interpreter: .../backend/.venv/bin/python3: no such file or directory`

The project folder was renamed from `backend` to `team_collaboration_api`. An old `.venv` still points at the previous path. Recreate the virtual environment:

```bash
cd team_collaboration_api
rm -rf .venv
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### `OSError: [Errno 48] Address already in use`

Something else is already bound to the port you chose (often **5000** on macOS, where **AirPlay Receiver** uses it).

**Option A — use another port (recommended):** the server defaults to **5001**, or set explicitly:

```bash
PORT=5002 python run.py
```

You can add `PORT=5001` to your `.env` (see `.env.example`).

**Option B — free the port:** find and stop the process (example for port 5000 on macOS/Linux):

```bash
lsof -i :5000
kill <PID>
```

Or disable “AirPlay Receiver” under *System Settings → General → AirDrop & Handoff* if you need port 5000 specifically.

## Endpoints (summary)

| Area | Method | Path |
|------|--------|------|
| Health | GET | `/health` |
| Register | POST | `/api/v1/auth/register` |
| Login | POST | `/api/v1/auth/login` |
| Current user | GET | `/api/v1/auth/me` (JWT) |
| Projects | GET, POST | `/api/v1/projects` |
| Project | GET, PATCH, DELETE | `/api/v1/projects/<id>` |
| Project members | POST, DELETE | `/api/v1/projects/<id>/members` |
| Tasks | GET, POST | `/api/v1/projects/<id>/tasks` |
| Task | GET, PATCH, DELETE | `/api/v1/tasks/<id>` |
| Teams | GET, POST | `/api/v1/teams` |
| Team member | POST | `/api/v1/teams/<id>/members` |
| Notifications | GET | `/api/v1/notifications?unread_only=true` |
| Mark read | POST | `/api/v1/notifications/<id>/read` |
| Collaboration activity | GET | `/api/v1/collaboration/projects/<id>/activity` |

### Tasks and project membership

You can set **`assignee_id`** to a user who is **not** in **`project.members`**. Those users can still **`GET` / `PATCH` `/api/v1/tasks/<id>`** and list **their assigned** tasks via **`GET /api/v1/projects/<project_id>/tasks`**. They cannot **`POST`** new tasks on the project (still requires owner/member). **`DELETE`** remains limited to project owner or task creator.

### Task notifications (who gets notified)

Notifications are created by the server when relevant events occur (not via a separate “create notification” API). For **status → `done`** on `PATCH /api/v1/tasks/<id>`:

- **Creator** is notified when **someone else** marks the task done (e.g. assignee or another member).
- **Assignee** is notified when **someone other than the assignee** marks the task done (e.g. the creator marks it complete for them). Assignee is **not** notified if they are also the creator (same user).
- **No notification** if **you** mark **your own** task done when you are both creator and assignee (nothing to notify yourself). Use **`status`**: `done` (not `completed`).

| Presence ping | POST | `/api/v1/collaboration/projects/<id>/presence` |

Send JWT as: `Authorization: Bearer <access_token>`.

## Socket.IO (real-time)

Connect to the same host/port (default Socket.IO path). After connect, emit **`authenticate`** with `{ "token": "<JWT>" }` to join your user room (`user_<id>`). Notifications are pushed as event **`notification`**.

Optional: **`join_project`** / **`leave_project`** with `{ "project_id": <id> }` for project-scoped events (`project_<id>`).

## Error responses

JSON shape:

```json
{
  "error": true,
  "message": "Human readable message"
}
```

Validation errors (422) include an `errors` object from Marshmallow.

## Database

Default: SQLite file `team_collab.db` in the current working directory. Override with `DATABASE_URI` in `.env` (e.g. PostgreSQL).
