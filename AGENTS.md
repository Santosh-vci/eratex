# Eratex Agent Guide

This repository implements the Eratex Planning and Scheduling Platform. Follow the Eratex Operating Spine in `docs/25_Common_Documentation_Spine_and_Phasewise_Build_Plan.md`.

## Phase Boundary

Current implemented boundary:

- Phase 0: repository, Docker, backend/frontend skeleton, CI.
- Phase 1: common platform foundation only.
- Phase 2: controlled master data and technical product foundation only.
- Phase 3: orders, procurement readiness, fabric QC, and PCD release-gate readiness only.

Do not add planning algorithms, daily release execution, cutting output, bundles, production output, WIP movement, sewing execution, wash execution, shipment workflow, full exception management, imports, or offline/mobile behavior while working inside Phase 3.

## Backend Rules

- Use Django apps under `backend/apps`.
- Keep business rules in services, not views or serializers.
- Use explicit API endpoints and the standard envelope: `{ "data": ..., "meta": {}, "errors": [] }`.
- Use Django Admin for master correction, user/role administration, and seed/admin correction.
- Frontend owns operational Phase 3 updates for PCD items, ETA updates, fabric QC inspection capture, conditional release, and release-to-cutting.
- Keep approved BOM, operation bulletin, and wash route versions immutable; clone to a new draft for changes.
- Release-to-cutting must update only PCD/order lifecycle state and audit. Do not create cutting execution, WIP, bundles, sewing, wash, or production output records.
- Keep audit events business-readable and append-only.
- Run backend checks before handoff:

```powershell
cd backend
..\.venv\Scripts\python -m ruff check .
..\.venv\Scripts\python manage.py makemigrations --check --dry-run
..\.venv\Scripts\python manage.py check
..\.venv\Scripts\python -m pytest
```

## Frontend Rules

- Treat the UI as an operational app, not a landing page.
- Follow the Industrial Logic design system in `docs/frontend_ui/DESIGN.md`.
- Keep layouts dense, calm, and role-aware.
- Use semantic risk/status colors only for operational state.
- Use lucide icons for navigation/actions where an icon is useful.
- Do not create decorative dashboard card mosaics.
- Run frontend checks before handoff:

```powershell
cd frontend
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

## Docker Commands

```powershell
docker compose config
docker compose up --build
docker compose down
```

After starting the stack, seed Phase 1 data:

```powershell
docker compose exec backend python manage.py seed_phase1
```

Seed Phase 2 master and technical data:

```powershell
docker compose exec backend python manage.py seed_phase2
```

Seed Phase 3 order readiness scenarios:

```powershell
docker compose exec backend python manage.py seed_phase3
```

## Git Handoff

- Work on `dev`.
- Pull latest `origin/dev` before staging.
- Stage only intended files.
- Commit with a clear phase-scoped message.
- Push only to `origin dev` when the user explicitly requests a handoff.
