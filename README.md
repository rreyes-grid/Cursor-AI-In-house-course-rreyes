# Cursor AI Practice V1

A React application built with TypeScript, Vite, and Tailwind CSS.

## Prerequisites

- [Node.js](https://nodejs.org/) **`^20.19.0` or `>=22.12.0`** — required by Vite 7 (see `package.json` **`engines`**). Using **Node 22** is easiest; an **`.nvmrc`** pins `22` for [`nvm`](https://github.com/nvm-sh/nvm) users.

Older runtimes fail `npm run build` because TypeScript/Vite ship modern syntax (e.g. `??`) that breaks on legacy Node shells; `npm run build` prints a clearer error after `scripts/require-node.mjs`.

If you use nvm, run:

```bash
nvm use
```

### Still seeing Node / build errors?

1. **`scripts/require-node.mjs` prints an old Node** — Run `which node`, `which npm`, and `node -v` in the **same** shell where you invoke `npm run build`. Both binaries should normally live under `~/.nvm/versions/node/<version>/bin/` once `nvm use` succeeds.  
   Global installs under `/usr/local/bin` sometimes win unless you run `hash -r` after switching or set `nvm alias default 22`.
2. **`.npmrc`** in this repo sets **`scripts-prepend-node-path=true`**, which tells npm to prefer the Node that launched `npm` when running lifecycle scripts—this avoids many PATH collisions on macOS.
3. **`tsc`/TS2322/`unknown` failures** — With a supported Node, `npm run build` runs `tsc -b` before Vite; if it still fails, copy the **`tsc` error lines**—those are genuine type issues in the codebase (recent fixes landed in Customer Support typing and the storefront import list).

## Getting Started

1. **Install dependencies**

```bash
npm install
```

2. **Start the development server**

```bash
npm run dev
```

The app will be available at [http://localhost:5173](http://localhost:5173).

## Available Scripts

| Command              | Description                                  |
| -------------------- | -------------------------------------------- |
| `npm run dev`        | Start the Vite development server            |
| `npm run build`      | Type-check with TypeScript and build for production |
| `npm run preview`    | Preview the production build locally         |
| `npm run lint`       | Run ESLint                                   |
| `npm run test:e2e`   | Run Playwright end-to-end tests              |
| `npm run test:e2e:ui`| Open Playwright interactive UI mode          |
| `npm run qa:run`     | Full local QA pipeline (see `scripts/qa/run-all.sh`; includes optional k6 when enabled) |

## Running Tests

The project uses [Playwright](https://playwright.dev/) for end-to-end testing against the task management dashboard.

### Run all tests

```bash
npm run test:e2e
```

This builds the app, starts a local preview server, and runs the full test suite.

### Interactive UI mode

```bash
npm run test:e2e:ui
```

Opens the Playwright Test Runner UI where you can browse, run, and debug individual tests with a visual timeline.

### Generate an HTML report

After running the tests, generate and open the report with:

```bash
npx playwright show-report
```

The report is saved to `playwright-report/` and includes pass/fail status, timing, screenshots, and traces for failed tests.

### Run a specific test file

```bash
npx playwright test tests/task-workflow.spec.ts
```

### Run tests in headed mode (visible browser)

```bash
npx playwright test --headed
```

### Debug a single test

```bash
npx playwright test --debug -g "cycles a task from To Do"
```

### k6 performance tests

Load and performance checks live in **`k6/scripts/ecommerce-smoke.js`**. They hit **`GET /api/products`** on the **ecommerce API** (not the Vite app).

1. **Install k6** — [Install k6](https://grafana.com/docs/k6/latest/set-up/install-k6/) for your OS (e.g. macOS: `brew install k6`).

2. **Run the API** the script will call — by default **`http://127.0.0.1:5004`**. From the repo root:

   ```bash
   cd ecommerce_api
   python3 -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   cp .env.example .env    # if you have not already
   flask init-db && flask seed-shop
   python run.py           # listens on PORT, default 5004
   ```

   See [ecommerce_api/README.md](ecommerce_api/README.md) for details.

3. **Run k6** — in another terminal, from the repo root:

   ```bash
   k6 run k6/scripts/ecommerce-smoke.js
   ```

   **Optional:** point at another base URL (scheme + host + port, no trailing path):

   ```bash
   K6_TARGET=https://your-api.example.com k6 run k6/scripts/ecommerce-smoke.js
   ```

   A JSON summary for the QA dashboard can be written with:

   ```bash
   mkdir -p qa-reports/raw
   k6 run k6/scripts/ecommerce-smoke.js --summary-export=qa-reports/raw/k6-summary.json
   ```

   **Heavier load (optional):** the default script stays under the API’s **100 requests/minute** Flask-Limiter cap. To replay the old 5-VU burst (only if you raise or disable that limit), run:

   ```bash
   K6_AGGRESSIVE=1 k6 run k6/scripts/ecommerce-smoke.js
   ```

4. **Via the full QA script** — `scripts/qa/run-all.sh` runs k6 only when **`k6` is on your PATH** and **`RUN_K6` is set** (e.g. `export RUN_K6=1`). With the API up and `K6_TARGET` set if needed:

   ```bash
   export RUN_K6=1
   npm run qa:run
   ```

   Thresholds in the script aim for **p(95) < 500 ms** and **HTTP error rate < 1%**; adjust them in **`k6/scripts/ecommerce-smoke.js`** if your environment differs.

#### If k6 reports `thresholds on metrics 'http_req_failed' have been crossed`

- **429 responses:** the API applies a **default rate limit** (`RATELIMIT_DEFAULT`, **100/min**). Sending too many requests per second (many VUs and short sleeps) trips the limit; non-2xx responses count as failures. **Fix:** use the default script pacing (no `K6_AGGRESSIVE`), or temporarily raise the limit in **`ecommerce_api/.env`** (e.g. `RATELIMIT_DEFAULT=1000 per minute`), or disable the limiter for local load tests only (`RATELIMIT_ENABLED=0` — **not** for production).
- **Connection errors:** ensure the API is running on **`K6_TARGET`** (default **`http://127.0.0.1:5004`**) and that **`flask init-db`** / **`flask seed-shop`** have been run so **`GET /api/products`** returns **200**.

### OWASP ZAP baseline scan (optional)

Requires **Docker** and a running target (often the ecommerce API).

```bash
# API on host machine, default port — script rewrites loopback for the ZAP container
export ZAP_TARGET=http://127.0.0.1:5004
bash scripts/qa/zap-baseline.sh
```

Reports: **`qa-reports/zap/`** (`zap-report.json`, `zap-report.xml`). With the full QA script: **`RUN_ZAP=1`** plus **`ZAP_TARGET`** before **`npm run qa:run`**.

#### Spider / connection refused with `127.0.0.1`

Inside Docker, **`127.0.0.1` is the ZAP container**, not your laptop, so the spider cannot reach a server you started on the host. **`scripts/qa/zap-baseline.sh`** rewrites **`127.0.0.1`** / **`localhost`** to **`host.docker.internal`** and runs Docker with **`--add-host=host.docker.internal:host-gateway`** so the container can reach the host (Docker Desktop macOS/Windows; most Linux Docker installs too).

Still failing? Confirm **`python run.py`** (or your server) listens on **`0.0.0.0:5004`**, not only **`127.0.0.1`**, so the forwarded host port accepts connections.

## Project Structure

```
team_collaboration_api/  # Flask API on port 5001 by default (team collaboration): JWT, projects, tasks, Socket.IO, Swagger
customer_support_api/    # Flask API on port 5002 (customer support tickets; optional)
blogging_api/            # Flask API on port 5003 (blogging: JWT, posts, comments, categories, search, Swagger)
src/
├── assets/            # Static assets (images, SVGs)
├── components/
│   ├── ui/            # Reusable UI primitives (buttons, inputs, modals)
│   ├── layout/        # Layout components (header, footer, sidebar)
│   └── features/      # Feature-specific components
├── hooks/             # Custom React hooks
├── lib/               # Utility functions and helpers
├── types/             # Shared TypeScript type definitions
├── App.tsx            # Root application component
├── main.tsx           # Entry point
└── index.css          # Tailwind CSS import
k6/scripts/               # k6 performance script (ecommerce API /api/products smoke)
tests/
├── fixtures/          # Playwright fixtures (page-object wiring)
├── pages/             # Playwright Page Object Models
├── dashboard-rendering.spec.ts     # Navigation & rendering tests
├── task-workflow.spec.ts           # Task status lifecycle tests
├── dashboard-accessibility.spec.ts # Accessibility & keyboard tests
├── dashboard-darkmode-edge.spec.ts # Dark mode & edge case tests
└── dashboard-responsive.spec.ts    # Responsive design tests
```

## Backend (Team Collaboration API)

A Flask API lives under **`team_collaboration_api/`**: JWT auth, projects, tasks, teams, notifications, Socket.IO real-time events, and Swagger UI (default **http://127.0.0.1:5001**; override with `PORT`). See [team_collaboration_api/README.md](team_collaboration_api/README.md) for setup and endpoints. The **customer support** API is in **`customer_support_api/`** (default port **5002**); see [customer_support_api/README.md](customer_support_api/README.md). The **blogging platform** API is in **`blogging_api/`** (default port **5003**); see [blogging_api/README.md](blogging_api/README.md).

To point the Vite app at that API when you wire up requests, copy [`.env.example`](.env.example) to `.env` and adjust **`VITE_API_URL`** if your API runs on a different host or port.

## Tech Stack

- **React 19** — UI library
- **TypeScript 5.9** — Type safety
- **Vite 7** — Build tool and dev server
- **Tailwind CSS 4** — Utility-first CSS framework
- **ESLint** — Linting
- **Playwright** — End-to-end testing
- **k6** — Load / performance tests against HTTP APIs (optional; see **Running Tests → k6**)
- **OWASP ZAP** — Docker baseline scans (optional; see **Running Tests → OWASP ZAP**)
