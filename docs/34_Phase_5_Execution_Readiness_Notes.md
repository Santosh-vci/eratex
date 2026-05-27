# Phase 5 / EOS-05 Execution Readiness Notes

## Scope Boundary

Phase 5 / EOS-05 implements the production-execution bridge from governed release into cutting, sewing line loading, realignment, net-good sewing output, and minimal execution WIP movement.

Included:

- Cutting jobs from governed production releases.
- Cutting output, cut bundles, and cutting handover to sewing.
- Minimal WIP lots and movements for `CUTTING`, `CUT_PANEL`, `SEWING_ACTIVE`, and `SEWN_WAITING_WASH`.
- Sewing line loading and active release-to-line assignment.
- Operation-bulletin gated loading with approved exception support.
- Line realignment preview, request, approval, and application.
- Desktop/tablet sewing output capture for gross, defect, rework, and net-good output.
- Line efficiency and shortfall boundary-case creation.

Excluded:

- Full WIP reconciliation and ageing control.
- Wash batch execution.
- Shipment workflow.
- Full exception recovery lifecycle.
- Mature analytics snapshots.
- Mobile offline capture and sync.
- Imports, mature simulation, and optimizer behavior.

## Owner Readiness

| Owner | Responsibility | Status |
|---|---|---|
| Product Owner | Confirm EOS-05 scope, non-goals, and operator-facing workflow language. | Verified for implementation boundary |
| Tech Lead | Confirm domain app naming, service-layer rules, and Phase 4A rulebook consumption. | Verified |
| Backend Lead | Confirm models, APIs, permissions, seed scenarios, audit, and tests. | Verified |
| Frontend Lead | Confirm prototype-first execution workbenches and browser screenshot evidence. | Verified for `/sewing/line-loading` salvage after route-specific landmark assertions |
| DevOps Lead | Confirm Docker-first build, validation, and stack-left-running workflow. | Verified |
| QA Lead | Confirm automated backend, frontend, e2e, and seed validation coverage. | Verified for current Phase 5 salvage scope |

## UI Prototype Mapping

| App Route | Source Prototype | Evidence |
|---|---|---|
| `/cutting/room` | `docs/frontend_ui/cutting_room_management_dashboard` | `frontend/test-results/ui-parity/cutting-room.png` |
| `/sewing/line-loading` | `docs/frontend_ui/sewing_line_loading_dashboard` | `frontend/test-results/ui-parity/sewing-line-loading-board.png` proves the dense board with no action drawer open; `frontend/test-results/ui-parity/sewing-line-loading-action-drawer.png` proves the drawer opens only after row click and the recovery action returns API feedback |
| `/sewing/line-realignment` | `docs/frontend_ui/line_realignment_workbench` | `frontend/test-results/ui-parity/sewing-line-realignment.png` |
| `/sewing/output` | `docs/frontend_ui/sewing_output_capture` | `frontend/test-results/ui-parity/sewing-output.png` |
| `/technical/operation-bulletins` | `docs/frontend_ui/operation_bulletin_master_dashboard` | `frontend/test-results/ui-parity/technical-operation-bulletins.png` |
| `/technical/operation-bulletins/{id}/routing` | `docs/frontend_ui/operation_bulletin_detail_routing_builder` | `frontend/test-results/ui-parity/routing-builder.png` |

Allowed shell normalization remains: shared Eratex shell, expandable/collapsible left rail, navigable breadcrumb, and dense operational workbench bodies. No phase labels, duplicate breadcrumbs, or implementation commentary are allowed in the route bodies.

## Prototype Drift Finding

`/sewing/line-loading` was not ready for handoff before the salvage pass. The canonical prototype requires a dense multi-line operating board with KPI strip, fixed right analysis drawer, hourly output chart, bottleneck operation, operator allocation, recovery action, and table columns for line, PO, style, SMV, target, actual, efficiency, defect, net good, manpower planned/available, status, and risk.

The salvage pass replaced the card-based single-line workbench with a prototype-shaped board, added the `GET /api/v1/sewing/line-loading-board` read payload, seeded 17 active line rows, and added e2e assertions for the canonical line-loading landmarks before screenshot capture. A follow-up correction made the drawer hidden by default, made every board row clickable, and connected `Approve Reassignment` to the real `POST /api/v1/sewing/line-realignment` endpoint.

## Seed Scenarios

`seed_execution_flow` extends the deterministic EOS-04 seed pack with:

- SCN-024: cutting job creation from production release.
- SCN-025: cutting output, cut-panel WIP, and bundles.
- SCN-026: operation-bulletin gated line loading.
- SCN-027: governed exception loading.
- SCN-028: capability mismatch.
- SCN-029: realignment approval and application.
- SCN-030: net-good sewing output and efficiency update.
- SCN-031: correction and idempotency.
- SCN-032: line shortfall boundary event.
- SCN-033: sewing-to-wash queue handover.

## Verification Evidence

Verified in Docker:

```powershell
docker compose build backend
docker compose run --rm backend python -m ruff check .
docker compose run --rm backend python manage.py makemigrations --check --dry-run
docker compose run --rm backend python manage.py check
docker compose run --rm backend python -m pytest
docker compose build frontend
docker compose run --rm --no-deps frontend npm run lint
docker compose run --rm --no-deps frontend npm run typecheck
docker compose run --rm --no-deps frontend npm run test
docker compose run --rm --no-deps frontend npm run build
docker compose up --build -d backend frontend
docker compose --profile test run --rm frontend_e2e
docker compose config
docker compose exec -T backend python manage.py seed_eos04
docker compose exec -T backend python manage.py seed_execution_flow
docker compose exec -T backend python manage.py validate_seed_scenarios
```

Live checks verified after seeding:

- `GET /health`: OK for database and Redis.
- `GET /api/v1/cutting/jobs`: returns seeded cutting job for `cutting_user`.
- `GET /api/v1/sewing/line-loadings`: returns seeded active line loading for `line_supervisor`.
- `GET /api/v1/sewing/line-loading-board`: covered by backend API tests and returns 17 board rows with `LINE 08` as highest risk.
- `POST /api/v1/sewing/line-realignment`: covered by e2e interaction and live API probe from the row-selected `lineLoadingId`.
- `GET /api/v1/sewing/output`: returns seeded sewing output for `line_supervisor`.
- `/cutting/room`, `/sewing/line-loading`, `/sewing/line-realignment`, and `/sewing/output`: HTTP 200 from the running frontend.

Docker stack was left running after validation.

The `/sewing/line-loading` screenshots are valid evidence only because they are captured after route-specific assertions pass for the prototype KPI strip, table columns, board density, line states, hidden-by-default drawer, row-click drawer opening, analysis sections, recovery action, API POST, and row-click update behavior.
