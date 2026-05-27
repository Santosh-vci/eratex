# Eratex Planning and Scheduling Platform

Phase 0 bootstraps the Eratex monorepo into a runnable full-stack foundation. Phase 1 adds the common platform layer, Phase 2 adds controlled master data and technical product foundations, Phase 3 adds order readiness control, and Phase 4 / EOS-04 adds planning, capacity, workcenter load, and daily release control.

## Stack

- Backend: Django, Django REST Framework, PostgreSQL, Redis, Celery
- Frontend: Next.js, React, TypeScript, Tailwind CSS, npm
- DevOps: Docker Compose, GitHub Actions

## Docker Setup

The repository is Docker-first. Do not install backend or frontend dependencies on the host for normal development, validation, or CI. Copy the sample environment file before running the stack:

```powershell
Copy-Item .env.example .env
```

Start the full stack in Docker:

```powershell
docker compose up --build -d
```

Seed Phase 3 data, which idempotently validates/loads the Phase 1 and Phase 2 foundations first:

```powershell
docker compose exec backend python manage.py seed_phase3
```

Seed EOS-04 planning and release data, which idempotently loads the earlier foundations first:

```powershell
docker compose exec backend python manage.py seed_eos04
```

Primary local endpoints:

- Frontend: http://localhost:3000
- Backend health: http://localhost:8000/health
- Backend ping: http://localhost:8000/api/v1/ping

## Backend Commands

```powershell
docker compose build backend
docker compose run --rm backend python -m ruff check .
docker compose run --rm backend python manage.py makemigrations --check --dry-run
docker compose run --rm backend python manage.py check
docker compose run --rm backend python -m pytest
```

## Frontend Commands

```powershell
docker compose build frontend
docker compose run --rm --no-deps frontend npm run lint
docker compose run --rm --no-deps frontend npm run typecheck
docker compose run --rm --no-deps frontend npm run test
docker compose run --rm --no-deps frontend npm run build
docker compose up --build -d backend frontend
docker compose --profile test run --rm frontend_e2e
```

The local stack is intentionally left running after validation and handoff. Clean up only when you want to stop local services or reset the environment:

```powershell
docker compose down
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

## Phase 3 Baseline

Phase 3 adds confirmed production orders, order lifecycle trace, procurement ETA and material readiness, fabric lot/roll QC state, PCD readiness gates, conditional release, release-to-cutting validation, Phase 3 APIs, and pre-production frontend workbenches.

Additional local seeded users:

| Username | Password | Role |
|---|---|---|
| `merchandiser` | `planning123` | Merchandiser |
| `procurement_user` | `planning123` | Procurement User |
| `fabric_qc_user` | `planning123` | Fabric QC User |
| `planning_head` | `planning123` | Planning Head |

Seeded Phase 3 orders:

```text
ORD-HP-001
ORD-PCD-001
ORD-FABQC-001
ORD-MAT-001
ORD-MDATA-001
```

Phase 3 local validation:

```powershell
docker compose config
docker compose up --build -d
docker compose exec -T backend python manage.py seed_phase3
docker compose run --rm backend python -m pytest
docker compose run --rm --no-deps frontend npm run test
docker compose --profile test run --rm frontend_e2e
```

Leave the stack running after this validation flow. Use `docker compose down` only as an explicit cleanup step.

Phase 3 intentionally excludes planning algorithms, daily release execution, cutting output, WIP movement, sewing/wash execution, shipment workflow, full exception management, imports, and offline/mobile behavior.

## Phase 4 / EOS-04 Baseline

Phase 4 / EOS-04 adds weekly planning, plan versions, planned work items, plan freeze/change governance, workcenter capacity/load snapshots, queue visibility, current constraint reporting, daily production release validation, override approval, release completion control, and operations workbenches for weekly planning, workcenter load, queue, and daily release.

Additional local seeded users:

| Username | Password | Role |
|---|---|---|
| `capacity_manager` | `planning123` | Capacity Manager |
| `release_coordinator` | `planning123` | Release Coordinator |

EOS-04 local validation:

```powershell
docker compose config
docker compose up --build -d
docker compose exec -T backend python manage.py seed_eos04
docker compose run --rm backend python -m pytest
docker compose run --rm --no-deps frontend npm run test
docker compose --profile test run --rm frontend_e2e
```

Phase 4 / EOS-04 intentionally excludes WIP inventory/reconciliation, cutting execution, sewing output, wash execution, shipment workflow, analytics/control-tower maturity, what-if simulation workbench, multi-unit capacity simulation, imports, and offline/mobile behavior.
