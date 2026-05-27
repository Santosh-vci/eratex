# Phase 5 UI Prototype Alignment Salvage Plan

## Purpose

Correct Phase 5 frontend drift without scrapping the validated backend execution foundation. The backend cutting, sewing, WIP, audit, permissions, and seed execution flow can remain as the functional substrate. The salvage work must replace prototype-drifted route bodies and add the read payloads, seed density, and e2e assertions needed to prove canonical UI parity.

## Non-Negotiable Rule

`docs/frontend_ui/*/code.html` is the UI contract. Shared shell normalization is allowed, but route bodies must preserve prototype layout, density, operational copy structure, drawer/fixed-panel behavior, and action placement.

Screenshots are not proof unless captured after route-specific prototype landmark assertions pass.

## Current Drift Assessment

| Route | Prototype | Status | Reason |
|---|---|---|---|
| `/sewing/line-loading` | `docs/frontend_ui/sewing_line_loading_dashboard` | Fixed in salvage pass | Replaced the single-line card layout with dense multi-line grid plus fixed analysis panel and e2e landmark proof. |
| `/cutting/room` | `docs/frontend_ui/cutting_room_management_dashboard` | Needs audit | Functional route exists; must be rechecked for prototype landmarks before handoff. |
| `/sewing/line-realignment` | `docs/frontend_ui/line_realignment_workbench` | Needs audit | Functional route exists; must prove current/required/recommended layout and approval flow. |
| `/sewing/output` | `docs/frontend_ui/sewing_output_capture` | Needs audit | Functional route exists; must prove numeric capture layout and tablet ergonomics against prototype. |
| `/technical/operation-bulletins` | `docs/frontend_ui/operation_bulletin_master_dashboard` | Needs Phase 5 re-audit | OB performance additions must not disturb master-dashboard parity. |
| `/technical/operation-bulletins/{id}/routing` | `docs/frontend_ui/operation_bulletin_detail_routing_builder` | Needs Phase 5 re-audit | Routing view must keep prototype operation detail and performance visibility without invented layout. |

## Root Cause To Prevent

The drift came from building a domain-backed React surface first and treating existing shared components as acceptable substitutes for prototype structure. The implementation proved backend flow and route rendering, but it did not prove UI contract parity.

Specific failure modes:

- card layout substituted for prototype table layout;
- one seeded active line substituted for a multi-line operating board;
- missing API fields were hidden by simplified UI;
- e2e tests asserted headings and screenshots rather than prototype landmarks;
- readiness notes marked frontend evidence as verified too early.

## Salvage Workstream 1: Canonical Landmark Matrix

Create or update a route-level matrix before touching UI code.

For `/sewing/line-loading`, required landmarks are:

- KPI strip with `Active Lines`, `Overloaded Lines`, `Underloaded`, `Avg. Net-Good Eff.`, `Highest Risk`.
- Dense table with columns `LINE ID`, `PO#`, `STYLE`, `SMV`, `TARGET`, `ACTUAL`, `EFF %`, `DEFECT %`, `NET GOOD`, `MANPOWER (P/A)`, `STATUS`, `RISK`.
- At least one critical/down row, one running row, one warning/changeover row, and repeated normal rows.
- Fixed right analysis panel or shell-normalized right drawer that remains visible for selected line analysis.
- Analysis sections: `Today's Hourly Output`, `Bottleneck Operation`, `Operator Allocation`, `Recovery Action`.
- Action copy: `Approve Reassignment` where recovery action is available.
- Row click opens or refreshes the analysis context.

Acceptance artifact:

- Update `docs/32_Frontend_UI_Prototype_Drift_Audit_And_Fix_Plan.md` with these landmarks and corrected evidence path.

## Salvage Workstream 2: Read Payload And Seed Density

Add a prototype-shaped read model without disrupting existing execution commands.

Preferred backend API option:

- Add `GET /api/v1/sewing/line-loading-board`.
- Keep existing CRUD/action endpoints intact.
- Return a board DTO shaped for the prototype:
  - summary: active lines, overloaded lines, underloaded lines, average net-good efficiency, highest-risk line;
  - lines: line id/code, PO/order number, style, SMV, target, actual, efficiency percent, defect percent, net good, planned manpower, actual manpower, status, risk;
  - selected line analysis: hourly target/actual buckets, bottleneck operation, WIP accumulation quantity, operator allocation, absence impact, recovery recommendation, recovery action label.

Seed changes:

- Extend `seed_execution_flow` to create enough line-load board data for at least 12 rows.
- Include statuses: `DOWN`, `RUNNING`, `CHANGEOVER`.
- Include risk states: critical/action, watch, on track.
- Include operator allocations with present/absent examples.
- Include one high-risk bottleneck and one recovery recommendation.

Validation:

- `validate_seed_scenarios` must verify the line-loading board has multi-row density and the required states.

## Salvage Workstream 3: UI Rewrite

Replace the `/sewing/line-loading` route body with a direct React translation of the prototype workbench.

Implementation constraints:

- Keep shared Eratex shell.
- Do not use generic card rows for the primary line board.
- Use a dense table with sticky first column and 32px rows.
- Keep KPI strip visually and semantically aligned to the prototype.
- Keep the analysis panel persistently visible on desktop; on smaller screens it may collapse to the existing drawer pattern, but labels/sections must remain identical.
- Use prototype operational copy. Do not add explanatory banners or implementation commentary.
- Use semantic color only for risk/status.

Frontend type/service changes:

- Add `SewingLineLoadingBoard`, `SewingLineBoardRow`, `SewingLineAnalysis`, `HourlyOutputBucket`, `OperatorAllocation`, and `RecoveryAction` types.
- Add `getSewingLineLoadingBoard()` API service.
- Keep existing `getSewingLineLoadings()` for action workflows.

## Salvage Workstream 4: E2E And Evidence

Replace screenshot-only proof with route-specific assertions.

Required Playwright assertions for `/sewing/line-loading`:

- heading/title includes `Sewing Line Loading`;
- KPI labels include all five canonical KPI names;
- table headers include every canonical column;
- table contains at least 10 line rows;
- there is at least one `DOWN`, one `RUNNING`, and one `CHANGEOVER` state;
- fixed analysis section includes `Today's Hourly Output`, `Bottleneck Operation`, `Operator Allocation`, and `Recovery Action`;
- `Approve Reassignment` is visible when selected high-risk line is active;
- row click updates the analysis panel.

Evidence:

- Capture `frontend/test-results/ui-parity/sewing-line-loading.png` only after these assertions pass.
- Readiness note remains blocked until this e2e test passes in Docker.

## Salvage Workstream 5: Re-Audit Other Phase 5 Routes

After line loading is fixed, audit the remaining Phase 5 routes against their prototype landmarks:

- `/cutting/room`: cutting job board, marker detail, bundle status, handover controls.
- `/sewing/line-realignment`: current vs required vs recommended setup, machine/skill gaps, before/after capacity, approval actions.
- `/sewing/output`: large numeric capture, active assignment, net-good calculation, invalid quantity blocking, latest output.
- `/technical/operation-bulletins`: OB master metrics, active production usage, bottleneck/performance visibility.
- `/technical/operation-bulletins/{id}/routing`: operation sequence, routing detail, machine/skill context, performance deviation.

Any surface that fails landmark parity must be marked blocked in `docs/34_Phase_5_Execution_Readiness_Notes.md`.

## Docker Validation Plan

Run in Docker only:

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
docker compose exec -T backend python manage.py seed_eos04
docker compose exec -T backend python manage.py seed_execution_flow
docker compose exec -T backend python manage.py validate_seed_scenarios
docker compose --profile test run --rm frontend_e2e
```

Leave Docker running after validation.

## Handoff Gate

Do not perform git handoff until:

- `/sewing/line-loading` has a prototype-shaped board payload;
- seeded line-loading data proves multi-line density;
- UI route body matches canonical layout;
- route-specific e2e landmark assertions pass;
- screenshot evidence is recaptured after assertions pass;
- `docs/34_Phase_5_Execution_Readiness_Notes.md` is updated from blocked to verified with exact command evidence.

## Implementation Result

Implemented for `/sewing/line-loading`:

- Added prototype-shaped `GET /api/v1/sewing/line-loading-board`.
- Extended execution seed data to 17 active line rows with `DOWN`, `RUNNING`, and `CHANGEOVER` states.
- Replaced the card route body with the canonical KPI strip, dense line board, click-triggered action drawer, hourly output, bottleneck, operator allocation, and recovery action.
- Added persisted `SewingLineBoardSnapshot` data so the board API reads database-backed line metrics instead of hardcoded UI values.
- Connected `Approve Reassignment` to `POST /api/v1/sewing/line-realignment`.
- Added Playwright landmark/action assertions before screenshot capture.
- Captured evidence at `frontend/test-results/ui-parity/sewing-line-loading-board.png` and `frontend/test-results/ui-parity/sewing-line-loading-action-drawer.png` after assertions passed.
