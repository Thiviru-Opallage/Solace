# Solace

**Insurance, quietly handled.** Solace is an insurance management application for customers, agents, and claims adjusters. It pairs a Next.js interface with an Express API and supports policy management, claim processing, payments, and analytics.

## What it includes

| Role | Main capabilities |
| --- | --- |
| Customer | View policies, submit and track claims, upload supporting documents, and manage a profile. |
| Agent | Manage customer policies and view portfolio analytics. |
| Adjuster | Review claims, record decisions and notes, manage payouts, and view analytics. |

The API includes role-based permissions, policy sharing controls, claim classification and clearance checks, session management, and live claim updates through Server-Sent Events.

## Tech stack

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend:** Node.js, Express 5, TypeScript
- **Data:** In-memory repositories for development and tests, or MongoDB for persistent storage
- **Tests:** Vitest and Supertest for the API

## Run locally

Install Node.js and npm. The frontend and backend are separate npm projects, so install dependencies in both directories.

```powershell
npm ci
cd server
npm ci
Copy-Item .env.example .env
```

Edit `server/.env` and replace the example values for `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `COOKIE_SECRET`, `CSRF_SECRET`, and `FIELD_ENCRYPTION_KEY` with your own random values. The backend validates its required secrets at startup. The default `REPO_MODE=memory` lets you run the app without MongoDB; data in this mode is lost when the server stops. To use MongoDB, set `REPO_MODE=mongo` and configure `MONGODB_URI`.

Start the API from `server`:

```powershell
npm run dev
```

In a second terminal, start the frontend from the repository root:

```powershell
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The API listens on port 5000 by default, with a health check at [http://localhost:5000/health](http://localhost:5000/health). The frontend's `/api` requests are proxied to that port through `next.config.ts`.

For a local mock-data experience, set `NEXT_PUBLIC_USE_MOCK=true` in a root `.env.local` file before starting the frontend. The backend is still needed for the normal API-backed workflow.

## Common commands

| Location | Command | Purpose |
| --- | --- | --- |
| Repository root | `npm run dev` | Start the frontend |
| Repository root | `npm run build` | Build the frontend |
| Repository root | `npm run lint` | Lint the frontend |
| `server` | `npm run dev` | Start the API with file watching |
| `server` | `npm test` | Run API tests |
| `server` | `npm run build` | Compile the API |
| `server` | `npm run lint` | Lint API source |

The `server` project also has an `npm run seed` command. In MongoDB mode, it clears existing application collections before adding demo data, so use it only with a database intended for that purpose.

## Project structure

```text
src/app/           Frontend routes and pages
src/components/    Shared interface components
src/lib/           API client, configuration, and mock data
server/src/        Express API, authorization, and repositories
server/tests/      API integration tests
server/docs/       API, data model, security, query, and testing guides
```

## Documentation

- [API reference](server/docs/API.md)
- [Data model](server/docs/DATA_MODEL.md)
- [Query guide](server/docs/QUERY_GUIDE.md)
- [Security documentation](server/docs/SECURITY.md)
- [Testing guide](server/docs/TESTING.md)

Local environment files and generated output are excluded from Git. Use [`server/.env.example`](server/.env.example) as the starting point for backend configuration.
