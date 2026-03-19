# Cursor AI Practice V1

A React application built with TypeScript, Vite, and Tailwind CSS.

## Prerequisites

- [Node.js](https://nodejs.org/) v22 or later (an `.nvmrc` file is included)

If you use [nvm](https://github.com/nvm-sh/nvm), run:

```bash
nvm use
```

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

## Tech Stack

- **React 19** — UI library
- **TypeScript 5.9** — Type safety
- **Vite 7** — Build tool and dev server
- **Tailwind CSS 4** — Utility-first CSS framework
- **ESLint** — Linting
- **Playwright** — End-to-end testing
