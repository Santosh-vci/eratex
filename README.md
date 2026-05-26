# Eratex Planning and Scheduling Platform

Phase 0 bootstraps the Eratex monorepo into a runnable full-stack foundation. Phase 1 adds the common platform layer, and Phase 2 adds controlled master data and technical product foundations.

## Stack

- Backend: Django, Django REST Framework, PostgreSQL, Redis, Celery
- Frontend: Next.js, React, TypeScript, Tailwind CSS, npm
- DevOps: Docker Compose, GitHub Actions

## Local Setup

Copy the sample environment file before running the stack:

```powershell
Copy-Item .env.example .env
```

Start the full stack:

```powershell
docker compose up --build
```

Seed Phase 2 data, which idempotently validates/loads the Phase 1 foundation first:

```powershell
docker compose exec backend python manage.py seed_phase2
```

Primary local endpoints:

- Frontend: http://localhost:3000
- Backend health: http://localhost:8000/health
- Backend ping: http://localhost:8000/api/v1/ping

## Backend Commands

```powershell
cd backend
python -m pip install -r requirements/local.txt
python manage.py migrate
pytest
ruff check .
```

## Frontend Commands

```powershell
cd frontend
npm ci
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

## Phase 0 Boundary

This phase creates the repository foundation only. It intentionally excludes auth/RBAC, domain models, master data workflows, business dashboards, seed scenarios, and real PWA offline behavior.

## Phase 1 Baseline

Phase 1 adds session auth, RBAC, organization scope, audit events, shared frontend providers, role-aware navigation, and shared UI primitives.

Local seeded users:

| Username | Password | Role |
|---|---|---|
| `planner` | `planning123` | Production Planner |
| `supervisor` | `planning123` | Line Supervisor |

## Phase 2 Baseline

Phase 2 adds governed master data, versioned style technical records, BOMs, operation bulletins, wash routes, line/machine capability, readiness services, technical workbenches, and seed scenarios.

Additional local seeded users:

| Username | Password | Role |
|---|---|---|
| `ie_user` | `planning123` | Industrial Engineering |
| `business_admin` | `planning123` | Business Admin |

Phase 2 intentionally excludes order lifecycle, procurement transactions, fabric QC execution, PCD execution, planning algorithms, production output, WIP behavior, shipment workflow, and offline/mobile behavior.
