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
tests/
├── fixtures/          # Page Object Models and test helpers
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
