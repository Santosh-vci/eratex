# Eratex Agent Guide

This repository implements the Eratex Planning and Scheduling Platform. Follow the Eratex Operating Spine in `docs/25_Common_Documentation_Spine_and_Phasewise_Build_Plan.md`.

## Phase Boundary

Current implemented boundary:

- Phase 0: repository, Docker, backend/frontend skeleton, CI.
- Phase 1: common platform foundation only.
- Phase 2: controlled master data and technical product foundation only.
- Phase 3: orders, procurement readiness, fabric QC, and PCD release-gate readiness only.
- Phase 4 / EOS-04: planning, capacity visibility, workcenter load, plan freeze/change governance, and daily production release control only.
- Scheduling behaviour rulebook alignment: boundary cases, planning zones, workcenter capacity definitions, order change previews, shipment pull-in previews, wash repeat governance metadata, and external-plan validation-as-draft.
- Phase 5 / EOS-05: cutting execution bridge, sewing line loading, governed line realignment, desktop/tablet sewing output capture, and minimal execution WIP movement from cutting through sewing-to-wash queue.

Inside Phase 5 / EOS-05, WIP is limited to execution lots and movements needed for cutting, sewing active work, and sewn waiting wash. Do not add full WIP reconciliation, wash execution, shipment workflow, analytics/control-tower maturity, what-if simulation workbench, multi-unit capacity simulation, full exception lifecycle, imports, or offline/mobile behavior.

## Backend Rules

- Use Django apps under `backend/apps`.
- Keep business rules in services, not views or serializers.
- Use explicit API endpoints and the standard envelope: `{ "data": ..., "meta": {}, "errors": [] }`.
- Use Django Admin for master correction, user/role administration, and seed/admin correction.
- Frontend owns operational Phase 3 updates for PCD items, ETA updates, fabric QC inspection capture, conditional release, and release-to-cutting.
- Frontend owns operational EOS-04 updates for planning assignment, impact preview, plan freeze/change requests, release validation, release override, and release completion.
- Frontend owns operational EOS-05 updates for cutting output capture, sewing line loading, realignment request/approval/application, and sewing output capture.
- Keep approved BOM, operation bulletin, and wash route versions immutable; clone to a new draft for changes.
- Release-to-cutting must update only PCD/order lifecycle state and audit. Do not create cutting execution, WIP, bundles, sewing, wash, or production output records.
- Daily release control must not create cutting execution, WIP, bundles, sewing, wash, shipment, or production output records.
- Cutting jobs must originate from governed production releases, and sewing output must require an active sewing line loading.
- Operation bulletin validation gates line loading unless there is an approved governed exception.
- Net-good output is gross minus defect and rework, and it is the only sewing output quantity that updates execution WIP and efficiency.
- Boundary cases are governed scheduling events. Preview impact first, require approval when configured, then apply through service-layer functions with audit.
- FastReact, Excel, or other external plans are draft inputs only. They must be validated into a draft platform plan and never become committed schedule truth directly.
- Do not name backend code artifacts using phase nomenclature. Use domain names such as `boundary_cases`, `external_plans`, `PlanningZoneConfiguration`, and `WorkcenterCapacityDefinition`.
- Keep audit events business-readable and append-only.
- Run backend checks before handoff inside Docker only:

```powershell
docker compose build backend
docker compose run --rm backend python -m ruff check .
docker compose run --rm backend python manage.py makemigrations --check --dry-run
docker compose run --rm backend python manage.py check
docker compose run --rm backend python -m pytest
```

## Frontend Rules

- Treat the UI as an operational app, not a landing page.
- Treat `docs/frontend_ui` as the canonical UI contract, not inspiration.
- When a route has a matching prototype folder, implement from that folder's `code.html`, `screen.png`, and local design notes. Do not invent a different layout, dashboard pattern, navigation model, copy structure, or action flow.
- A screenshot is not parity proof by itself. Parity proof requires automated assertions for the prototype's structural landmarks: primary layout, KPI names/count, table/card/grid columns, drawer sections, action labels, density-critical row behavior, and any fixed side panels or swimlanes.
- If the backend/API/seed data cannot supply fields required by the prototype, stop and document the payload gap before implementing the UI. Do not replace a missing prototype field with a different invented UI pattern.
- Seeds must support the prototype's operating density. If a prototype shows a multi-row operating board, seed and e2e data must include enough rows and states to prove that board; a single happy-path record is not sufficient.
- Do not mark a surface verified, ready, or parity-aligned unless the running app screenshot and the e2e landmark assertions both match the mapped prototype.
- If drift is found after a surface was marked verified, immediately update the readiness note to mark that surface `Blocked by prototype drift` until corrected.
- Follow the Industrial Logic design system in `docs/frontend_ui/DESIGN.md` and `docs/frontend_ui/industrial_logic/DESIGN.md`.
- If a required surface has no prototype, stop and record a UI governance gap before building. Use the closest approved prototype only when the Product Owner/Tech Lead decision is documented in the phase readiness note.
- Each implemented UI surface must keep a traceable mapping to its source prototype folder and have screenshot evidence from the running app before handoff.
- Do not add phase labels, implementation commentary, duplicate breadcrumbs, explanatory banners, decorative cards, or UI artifacts that are absent from the source prototype.
- Keep layouts dense, calm, and role-aware.
- Use semantic risk/status colors only for operational state.
- Use lucide icons for navigation/actions where an icon is useful.
- Do not create decorative dashboard card mosaics.
- For Phase 4 / EOS-04, the only approved UI sources are:
  - `docs/frontend_ui/weekly_planning_workbench`
  - `docs/frontend_ui/calendar_gantt_planning_dashboard`
  - `docs/frontend_ui/workcenter_load_monitor`
  - `docs/frontend_ui/daily_production_release_dashboard`
- The Phase 4 weekly planning route must preserve the prototype's backlog column, time/day swimlane planner, fixed impact preview, and click-drag drop-target behavior.
- For Phase 5 / EOS-05, the approved UI sources are:
  - `docs/frontend_ui/cutting_room_management_dashboard`
  - `docs/frontend_ui/sewing_line_loading_dashboard`
  - `docs/frontend_ui/line_realignment_workbench`
  - `docs/frontend_ui/operation_bulletin_master_dashboard`
  - `docs/frontend_ui/operation_bulletin_detail_routing_builder`
  - `docs/frontend_ui/sewing_output_capture`
- Run frontend checks before handoff inside Docker only:

```powershell
docker compose build frontend
docker compose run --rm --no-deps frontend npm run lint
docker compose run --rm --no-deps frontend npm run typecheck
docker compose run --rm --no-deps frontend npm run test
docker compose run --rm --no-deps frontend npm run build
docker compose up --build -d backend frontend
docker compose --profile test run --rm frontend_e2e
```

## Docker Commands

```powershell
docker compose config
docker compose up --build -d
```

Leave the local Docker stack running after validation and git handoff. Use cleanup only when explicitly requested, when resetting state, or in CI:

```powershell
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

Seed EOS-04 planning and release scenarios:

```powershell
docker compose exec backend python manage.py seed_eos04
```

Validate scheduling rulebook scenarios:

```powershell
docker compose exec backend python manage.py validate_seed_scenarios
```

Seed EOS-05 execution scenarios:

```powershell
docker compose exec backend python manage.py seed_execution_flow
docker compose exec backend python manage.py validate_seed_scenarios
```

## Git Handoff

- Work on `dev`.
- Pull latest `origin/dev` before staging.
- Stage only intended files.
- Commit with a clear phase-scoped message.
- Push only to `origin dev` when the user explicitly requests a handoff.
- Do not stop the local Docker stack during or after handoff unless explicitly requested.
