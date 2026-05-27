# 30. Phase 4 Implementation Readiness Notes
# Planning, Capacity, Workcenter Load, and Daily Release

**Company:** Eratex
**Product:** Planning and Scheduling Tool for Denim Bottoms + Chinos Manufacturing
**Phase:** Phase 4 / EOS-04
**Branch:** `dev`
**Status:** Implemented and locally verified

---

## 1. Purpose

This note records Phase 4 / EOS-04 readiness ownership for planning and production release control. Phase numbering is grounded only to `docs/25_Common_Documentation_Spine_and_Phasewise_Build_Plan.md`; backend and frontend do not carry separate phase numbering.

Phase 4 / EOS-04 adds:

```text
weekly planning horizon and plan versions
planned work items and plan freeze governance
plan impact preview and post-freeze change requests
workcenter load snapshots and queue snapshots
current constraint visibility
daily release validation, override request/approval, and completion control
operations workbenches for weekly planning, workcenter load, queue, and daily release
```

---

## 2. Ownership

| Readiness Area | Owner Role | EOS-04 Evidence |
|---|---|---|
| Integrated phase boundary and EOS-04 scope | Product Owner | Phase 4 / EOS-04 scope and non-goals recorded in the operating spine, `AGENTS.md`, `README.md`, and this note |
| App boundaries and API envelope | Tech Lead | `planning`, `production_release`, and extended `workcenters` APIs use the standard `/api/v1` envelope |
| Planning governance | Backend Lead | Planning horizon, plan version, planned work item, freeze, impact preview, and change-request services |
| Capacity and constraint visibility | Backend Lead | Workcenter load snapshots, queue snapshots, capacity adjustments, current constraint service |
| Daily release governance | Backend Lead | Release validation, blockers, override approval, completion, and audit events |
| EOS-04 reference UI parity | Frontend Lead | Weekly planning, workcenter load, queue, and daily release routes follow only the approved `docs/frontend_ui` EOS-04 references |
| Docker-first repeatability | DevOps Lead | Docker Compose stack plus `seed_eos04` command |
| Verification evidence | QA Lead | Backend, frontend, Playwright, UI screenshots, API checks, and full-stack verification listed below after pass |

---

## 2.1 Prototype Parity Gate

Phase 4 / EOS-04 UI readiness is governed by the prototype folders, not by invented screens.

| Route | Approved Source Prototype | Required Parity Evidence |
|---|---|---|
| `/planning/weekly` | `docs/frontend_ui/weekly_planning_workbench`; compact planning cues from `docs/frontend_ui/calendar_gantt_planning_dashboard` | Screenshot showing ready backlog, time/day swimlanes, swimlane drop target, fixed impact preview, capacity overlay, no-write impact preview, freeze/change actions |
| `/workcenters/load` | `docs/frontend_ui/workcenter_load_monitor` | Screenshot showing current constraint, utilization/load, queue quantity, affected order, queue navigation |
| `/workcenters/{id}/queue` | `docs/frontend_ui/workcenter_load_monitor` | Screenshot or Playwright assertion showing queue detail tied to the selected workcenter |
| `/releases/daily` | `docs/frontend_ui/daily_production_release_dashboard` | Screenshot showing daily release grid/drawer, validation checks, blocker/override/release actions |

Disallowed without a recorded governance gap:

```text
alternate dashboard layouts
workcenter tile boards replacing the time/day swimlane planner
decorative card mosaics
phase labels or implementation commentary in the UI
duplicate page breadcrumbs
marketing or explanatory copy
mature what-if simulation workbench
multi-unit capacity simulation
```

## 3. Verification Commands

Actual local verification on 2026-05-27:

```text
Backend:
- docker compose build backend -> passed
- docker compose run --rm backend python -m ruff check . -> passed
- docker compose run --rm backend python manage.py makemigrations --check --dry-run -> passed, no changes detected
- docker compose run --rm backend python manage.py check -> passed, no issues
- docker compose run --rm backend python -m pytest -> passed, 38 tests

Frontend:
- docker compose build frontend -> passed
- docker compose run --rm --no-deps frontend npm run lint -> passed
- docker compose run --rm --no-deps frontend npm run typecheck -> passed
- docker compose run --rm --no-deps frontend npm run test -> passed, 9 files / 17 tests
- docker compose run --rm --no-deps frontend npm run build -> passed
- docker compose --profile test run --rm frontend_e2e -> passed, 5 Chromium smoke tests

Full stack:
- docker compose config -> passed
- docker compose up --build -d backend frontend -> passed
- docker compose exec -T backend python manage.py seed_eos04 -> Phase 1, Phase 2, Phase 3, and EOS-04 seed data loaded
- GET /health -> status ok, database ok, redis ok
- GET /api/v1/ping -> status ok
- Authenticated GET /api/v1/planning/weekly as planner -> 200, horizon/plan/backlog/workItems/workcenterLoads/changeRequests payload returned
- Authenticated GET /api/v1/workcenters/load as planner -> 200, 4 load rows returned
- Authenticated GET /api/v1/workcenters/current-constraint as planner -> 200, current constraint payload returned
- Authenticated GET /api/v1/releases/daily as planner -> 200, 2 releases returned
- Frontend /planning/weekly, /workcenters/load, /releases/daily -> HTTP 200
- Playwright screenshots saved:
  - `frontend/test-results/ui-parity/weekly-planning.png`
  - `frontend/test-results/ui-parity/workcenter-load.png`
  - `frontend/test-results/ui-parity/daily-release.png`
- UI text scan and source scan -> no what-if simulation workbench or multi-unit capacity simulation UI implemented in Phase 4 / EOS-04
- Local handoff default -> Docker stack left running after validation
```

---

## 4. Seed Scenarios

`seed_eos04` includes:

```text
draft and frozen weekly plans
ready planned work item
ready backlog order for click-drag planning practice
blocked planned work items
overloaded workcenter constraint
queue ageing snapshot
ready daily release
blocked override-request release
capacity manager and release coordinator users
```

---

## 5. Phase 4 / EOS-04 Non-Goals

The following remain deferred:

```text
WIP inventory and reconciliation
cutting execution, bundles, and output
sewing production output
wash production execution
shipment workflow
analytics/control tower maturity
what-if simulation workbench
multi-unit capacity simulation
imports and exports beyond deterministic seed commands
offline/mobile behavior
```
