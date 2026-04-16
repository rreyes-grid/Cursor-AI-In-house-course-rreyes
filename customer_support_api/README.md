# Customer Support Ticket API

Flask + SQLAlchemy implementation of the Customer Support Ticket System PRD (ticket lifecycle, RBAC, SLA, reporting): tickets, RBAC (customer / agent / admin), assignment with history, status transitions, priority changes with reason, SLA timestamps, comments (public + internal), attachments, in-app notifications (email is logged only), admin dashboard and CSV export, rate limiting (100 req/min per JWT or IP), bcrypt passwords (cost 12), JWT (24h).

## Quick start

```bash
cd customer_support_api
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
export FLASK_APP=run.py
flask init-db
flask seed-support
python run.py
```

API default: **http://127.0.0.1:5002** (`PORT` in `.env`).

## Seeded demo users

Password for all: **`Demo12345!`**

| Email | Role |
|-------|------|
| `admin@support.local` | admin |
| `agent1@support.local` | agent |
| `agent2@support.local` | agent |
| `customer@support.local` | customer |

## Frontend

From the repo root, set `VITE_SUPPORT_API_URL=http://127.0.0.1:5002` in `.env` and run `npm run dev`. Open **Customer Support** under Complete Interfaces.

## Key endpoints

- `POST /api/auth/register` — customers only (role forced to `customer`)
- `POST /api/auth/login` · `GET /api/auth/me`
- `GET|POST /api/tickets` — list (filters: `q`, `status`, `priority`, `category`, `page`, `per_page`, …) · create
- `GET|PUT|DELETE /api/tickets/:id`
- `GET|POST /api/tickets/:id/comments`
- `PUT /api/tickets/:id/status` · `PUT /api/tickets/:id/priority` · `POST /api/tickets/:id/assign`
- `GET /api/tickets/:id/history`
- `POST /api/tickets/:id/attachments` — multipart field `file` (`.pdf`, `.jpg`, `.jpeg`, `.png`, `.doc`, `.docx`, max 5MB, max 3 per ticket)
- `GET /api/users` (admin) · `GET|PUT /api/users/:id`
- `GET /api/agents` · `GET /api/agents/:id/tickets` · `PUT /api/agents/:id/availability`
- `GET /api/admin/dashboard` · `GET /api/admin/reports/*` · `GET /api/admin/reports/export?type=tickets`
- `GET /api/notifications` · `POST /api/notifications/:id/read`

Errors use PRD-style JSON: `status`, `message`, `code`, optional `errors`.

## Troubleshooting

### `bad interpreter: .../support_backend/.venv/bin/python3: no such file or directory`

The app folder was renamed from `support_backend` to `customer_support_api`. An old `.venv` still points at the previous interpreter path. Recreate the virtual environment:

```bash
cd customer_support_api
rm -rf .venv
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
export FLASK_APP=run.py
flask init-db
```

## Health

`GET /health`
