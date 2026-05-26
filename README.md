# Eratex Planning and Scheduling Platform

Phase 0 bootstraps the Eratex monorepo into a runnable full-stack foundation.

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

Seed Phase 1 platform data:

```powershell
docker compose exec backend python manage.py seed_phase1
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
