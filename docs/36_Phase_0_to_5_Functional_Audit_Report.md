# Phase 0 to Phase 5 Functional Audit Report

Date: 2026-05-27

Scope: landed implementation through Phase 5/EOS-05. This includes Phase 0 repository and Docker foundation, Phase 1 common platform foundation, Phase 2 master and technical foundation, Phase 3 order/procurement/fabric QC/PCD readiness, EOS-04 planning and daily release control, and EOS-05 cutting through sewing-to-wash-queue execution.

Boundary: Phase 5 WIP is limited to execution lots and movements for cutting, sewing active work, and sewn waiting wash. The seed includes future lifecycle labels for washing, finishing, packing, and shipment-ready orders only as downstream testing references. It does not create wash execution, finishing, packing, shipment, full WIP reconciliation, control tower maturity, what-if simulation, import execution truth, offline/mobile behavior, or full exception lifecycle beyond the documented current scope.

## Governance Basis

Reviewed operating guidance and specifications:

- `AGENTS.md`
- `docs/23_Governance_Spine_Document.md`
- `docs/25_Common_Documentation_Spine_and_Phasewise_Build_Plan.md`
- `docs/19_Testing_QA_Strategy.md`
- `docs/34_Phase_5_Execution_Readiness_Notes.md`
- `docs/35_Phase_5_UI_Prototype_Alignment_Salvage_Plan.md`
- Phase-specific backend, frontend, and e2e tests already present in the repo

The validation target was not only Phase 5 screens. The validation pass covers the whole landed operating chain from system access and seed foundations through customer order, readiness, planning, release, cutting, sewing line loading, line realignment, and sewing output capture.

## Changes Made During Audit

Seed and validation additions:

- Added `seed_operational_factory`, a dense operational seed command layered on top of the deterministic Phase 5 seed.
- Added `validate_operational_factory_seed`, a validation command that checks dataset density, lifecycle stage coverage, board states, net-good math, WIP boundaries, and conditional release coverage.
- Added `test_operational_factory_seed.py`, including a double-run seed idempotency test.

Hardening fixes discovered while validating:

- Fixed PCD readiness recalculation so it cannot regress orders that have already moved into execution or later lifecycle states.
- Fixed `seed_execution_flow` so it targets the deterministic base execution scenario instead of whichever ready release sorts first after operational data already exists.
- Fixed the operational seed so reruns do not restart cutting jobs that are already completed or handed over.
- Fixed duplicate React keys on workcenter load cards, weekly load strips, and shared timeline rows after live CTA testing exposed repeated snapshot/event identities.
- Wired the order detail `Release to Cutting` CTA to the governed backend release endpoint.
- Added permission-aware daily release and line realignment controls so lower-permission roles cannot click endpoints they cannot call.
- Made operation bulletin clone versions unique across repeat CTA runs.
- Adjusted the operational planning seed so the current draft plan supports preview, assignment, freeze, and change-request validation while exceptions remain represented by release and boundary-case data.
- Added `frontend/scripts/phase0_5_cta_probe.mjs`, a reusable live CTA/API reachability probe.

## Seed Dataset Storyline

The operational seed now represents a busy garment factory state suitable for Phase 0-5 validation and reusable for later phases.

### Operating Cast

Customers and order volume:

| Customer | Orders | Quantity |
|---|---:|---:|
| Global Denim Buyer A | 11 | 113,100 |
| Mid-Market Buyer B | 6 | 58,300 |
| Chino Retailer C | 5 | 60,300 |
| Fashion Wash Buyer D | 4 | 43,800 |
| European Denim Programs | 7 | 83,400 |
| Outdoor Workwear Group | 3 | 31,725 |
| Marketplace Private Label | 3 | 32,850 |
| Premium Chino House | 3 | 33,975 |

Styles in play:

- 11 styles
- 10 approved BOMs
- 10 approved operation bulletins
- 8 approved wash routes
- 4 product types

Vendor and material base:

- 9 vendors
- 17 materials
- 248 purchase orders
- 248 material requirements
- 232 fabric rolls across 40 fabric lots

### Order Population

Total order book:

- 42 active orders
- 36 operational seed orders prefixed `OPS-ORD`
- 457,450 total ordered units

Lifecycle stage distribution after validation:

| Stage | Orders |
|---|---:|
| PCD pending | 13 |
| PCD ready | 20 |
| Cutting | 1 |
| Sewing | 4 |
| Washing reference | 1 |
| Finishing reference | 1 |
| Packing reference | 1 |
| Shipment-ready reference | 1 |

Risk distribution:

| Risk | Orders |
|---|---:|
| On track | 21 |
| Watch | 8 |
| Action | 5 |
| Critical | 8 |

### Readiness and Supply State

Material readiness:

- 228 requirements ready
- 10 delayed
- 10 short

Purchase order state:

- 212 received
- 26 acknowledged
- 10 delayed

Fabric QC state:

- 223 rolls passed
- 5 failed
- 4 on hold
- 232 inspections recorded

PCD readiness state:

- 19 ready
- 7 conditionally ready
- 6 blocked
- 10 escalated
- 15 conditional release records
- 14 approved conditional releases

### Planning and Release State

Planning and governance:

- 2 plan versions
- 23 active current-plan work items after the live CTA run
- 18 on-track current-plan work items
- 5 watch current-plan work items
- 0 action/critical current-plan work items, keeping the freeze/change-control journey testable
- 28 boundary cases after live CTA testing, including applied cases from the validation pass
- 1 external plan import batch validated as draft input
- 11 active capacity definitions

Daily production releases after live CTA testing:

- 33 production releases
- 6 ready
- 7 released
- 6 completed
- 3 blocked
- 6 override requested
- 5 override approved
- 68 release validation result rows from seed/test interactions

### Execution State

Cutting:

- 7 cutting jobs after the focused PCD-to-cutting proof
- 4 handed over
- 1 in progress
- 2 released
- 4 cutting output entries
- 24 cut bundles

Sewing:

- 20 sewing line loadings after clean reset seed
- 20 line-board snapshots
- 20 live line-board rows
- 2 overloaded lines
- Average net-good efficiency: 71.92 percent
- Highest risk line: LINE 08 at 46.25 percent efficiency and 4.2 percent defect
- 3 line realignment requests
- Realignment states represented across requested, approved, and applied scenarios

Output and WIP:

- 3 sewing output entries after clean reset seed
- Gross output: 463
- Defects: 19
- Rework: 18
- Net-good: 426
- Output corrections: 3
- WIP movements: 14

WIP is confined to Phase 5-supported stages:

| WIP Stage | Lots | Quantity | Available |
|---|---:|---:|---:|
| Cutting | 7 | 23,665 | 21,440 |
| Cut panel | 4 | 2,225 | 0 |
| Sewing active | 4 | 2,225 | 1,799 |
| Sewn waiting wash | 6 | 426 | 426 |

## Operator Journeys Validated

### Scenario 1: Platform Access and Common Foundation

Actor: production planner

1. Open the frontend at `http://localhost:3000/login`.
2. Sign in with seeded credentials.
3. Land on the operational shell with role-aware navigation.
4. Confirm backend `/health` reports database and Redis healthy.
5. Confirm API responses use the standard envelope through backend tests.
6. Confirm unauthorized user access is denied by RBAC tests.

Validated outcome: Phase 0/1 platform foundation works, including Docker stack health, login, role profile loading, API envelope, and permission denial.

Evidence: `audit_evidence/phase5_operational_seed/01_order_lifecycle_explorer.png`

### Scenario 2: Controlled Master and Technical Foundation

Actor: industrial engineering or master-data user

1. Seed customers, buyers, product types, vendors, materials, lines, workcenters, capacity definitions, styles, BOMs, operation bulletins, and wash routes.
2. Validate approved BOM and operation bulletin coverage for seeded production styles.
3. Validate wash route references exist for future downstream routing, while no wash execution is created.
4. Run style and technical service/API tests.
5. Confirm line loading uses approved operation bulletin data.

Validated outcome: Phase 2 controlled master and technical foundations are present and usable by later readiness, planning, and execution services.

Evidence: backend tests `apps/style_technical/tests/test_phase2_services_api.py`, `apps/workcenters/tests/test_phase2_workcenters.py`

### Scenario 3: Customer Order Lifecycle and Trace

Actor: merchandiser or planner

1. Open the order lifecycle explorer.
2. Review the active order book and risk/stage distribution.
3. Select a seeded operational order.
4. Inspect order quantity, customer, style, committed ship date, current stage, PCD status, and owner next action.
5. Open the order detail and timeline.
6. Confirm lifecycle events are append-only and business-readable.

Validated outcome: Phase 3 order lifecycle surfaces load dense operational data and expose traceable order status without creating execution records prematurely.

Evidence:

- `audit_evidence/phase5_operational_seed/01_order_lifecycle_explorer.png`
- `audit_evidence/phase5_operational_seed/02_order_detail_trace_gate.png`

### Scenario 4: Procurement and Vendor Follow-Up

Actor: procurement user

1. Open procurement vendor follow-up.
2. Review all open vendor POs and PCD-impact indicators.
3. Select delayed or acknowledged POs.
4. Review PO timeline, affected orders, and communication log.
5. Save a revised ETA through the service/API path in tests.
6. Confirm delayed ETAs update material readiness and downstream PCD risk.

Validated outcome: Phase 3 procurement readiness and ETA update logic works and feeds PCD readiness.

Evidence: `audit_evidence/phase5_operational_seed/03_procurement_vendor_follow_up.png`

### Scenario 5: Fabric Inward and QC

Actor: fabric QC user

1. Open the fabric inward and QC monitor.
2. Review received lots and roll-level QC status.
3. Inspect roll technical details, width, GSM, shade, and 4-point result.
4. Confirm pass, hold, and failed roll states are represented.
5. Confirm failed fabric QC contributes to PCD blocker/escalation scenarios.

Validated outcome: Phase 3 fabric QC inspection proof is represented with dense roll data and affects readiness gates.

Evidence: `audit_evidence/phase5_operational_seed/04_fabric_inward_qc_monitor.png`

### Scenario 6: PCD Gate, Conditional Release, and Release-to-Cutting

Actor: planning head or planner

1. Open the PCD readiness gate.
2. Select priority order from the left rail.
3. Review mandatory checklist sections, blockers, and readiness percentage.
4. Request conditional release where mandatory items are open but release is allowed under governance.
5. Approve conditional release with expiry and risk note.
6. Release to cutting only after backend gate validation allows it.
7. Confirm release-to-cutting updates PCD/order lifecycle and audit.
8. Confirm release-to-cutting creates a governed `ProductionRelease`.
9. Confirm the governed cutting release creates a `CuttingJob` and initial cutting WIP lot.
10. Open the cutting room management surface and confirm the released order is visible in the cutting grid.

Validated outcome: Phase 3 readiness gates work, including conditional release and release-to-cutting. A regression where readiness recalculation could move later-stage orders backward was found and fixed. A second defect was found where `OPS-ORD-015` could show PCD status `RELEASED` without a downstream `ProductionRelease` or `CuttingJob`; that was corrected so the same UI flow now sends the order to the cutting room grid.

Evidence: `audit_evidence/phase5_operational_seed/05_pcd_readiness_gate.png`, `audit_evidence/pcd_cta_proof/pcd_cta_proof_summary.txt`, and `audit_evidence/pcd_cta_proof/06_cutting_grid_contains_released_order.png`

### Scenario 7: Weekly Planning, Assignment Preview, and Plan Governance

Actor: planner

1. Open weekly planning workbench.
2. Review ready backlog.
3. Select or drag an order into a day/workcenter lane.
4. Review the fixed impact preview panel.
5. Confirm order readiness checklist, capacity utilization, zone, shift, and load minutes are shown.
6. Assign selected backlog through the service path.
7. Freeze plan through governance tests.
8. Validate change requests are required when configured by planning zone rules.

Validated outcome: EOS-04 weekly planning, impact preview, capacity visibility, and freeze/change governance are implemented through service tests and visible in the operational UI.

Evidence: `audit_evidence/phase5_operational_seed/06_weekly_planning_workbench.png`

### Scenario 8: Workcenter Load and Constraint Visibility

Actor: planner or planning head

1. Open workcenter load monitor.
2. Review current constraint, highest overload, longest ageing queue, and active workcenter count.
3. Select a workcenter card.
4. Inspect capacity definition, available capacity, queue quantity, and impact preview.
5. Confirm queue detail is accessible from the monitor.

Validated outcome: EOS-04 workcenter capacity visibility and queue detail work against seeded capacity definitions and workcenter load snapshots.

Evidence: `audit_evidence/phase5_operational_seed/07_workcenter_load_monitor.png`

### Scenario 9: Daily Production Release Control

Actor: planner or planning head

1. Open daily production release dashboard.
2. Review planned releases, ready releases, blocked releases, released count, and open boundary cases.
3. Select a release.
4. Run backend validation for gate readiness.
5. Request override for blocked release where configured.
6. Approve override through governance.
7. Release to floor or complete release control record.
8. Confirm daily release control does not create cutting execution, WIP, bundles, sewing, wash, shipment, or output records by itself.

Validated outcome: EOS-04 daily release validation, override, and completion paths are implemented and visible. Cutting jobs remain governed by explicit execution services.

Evidence: `audit_evidence/phase5_operational_seed/08_daily_production_release.png`

### Scenario 10: Boundary Cases and External Plan Draft Validation

Actor: planner

1. Seed scheduling boundary scenarios.
2. Validate planning zones and capacity definitions.
3. Validate boundary case event coverage for scheduling rulebook scenarios.
4. Validate external plan import batch exists only as a draft input.
5. Confirm external plan conflicts are written as validation records.
6. Confirm external plan import does not become committed schedule truth directly.

Validated outcome: EOS-04 scheduling rulebook behavior is covered by backend services and seed validation.

Evidence: `validate_seed_scenarios` passed.

### Scenario 11: Cutting Execution Bridge

Actor: cutting user or cutting supervisor

1. Open cutting room management.
2. Review released, in-progress, and handed-over cutting jobs.
3. Create cutting job from governed production release.
4. Start released cutting job.
5. Record cutting output.
6. Validate net-cut quantity as gross minus defect and rework.
7. Create cut bundles from net-cut quantity.
8. Hand over cut panels to sewing only when cut-panel WIP exists.

Validated outcome: EOS-05 cutting jobs originate from governed releases, cutting output creates WIP and bundles, and handover quantities are constrained by available cut panels.

Evidence: `audit_evidence/phase5_operational_seed/09_cutting_room_management.png`

### Scenario 12: Sewing Line Loading and OB Gate

Actor: line supervisor

1. Open sewing line loading board.
2. Review active line KPIs, overload, underload, average net-good efficiency, and highest risk line.
3. Inspect line rows by PO, style, SMV, target, actual, efficiency, defect percent, net-good, manpower, status, and risk.
4. Load a line only from a governed release.
5. Gate line loading by approved operation bulletin unless an approved governed exception exists.
6. Activate line loading.
7. Confirm line board shows running, changeover, and down statuses.

Validated outcome: EOS-05 line loading works with approved OB data, dense line board rows, and live risk/efficiency summary.

Evidence: `audit_evidence/phase5_operational_seed/10_sewing_line_loading_board.png`

### Scenario 13: Governed Line Realignment

Actor: line supervisor or sewing manager

1. Open line realignment workbench.
2. Select an active line loading.
3. Preview current line setup against OB-required setup.
4. Review expected output before and after, changeover minutes, machine gaps, skill gaps, fit status, and approval requirement.
5. Request realignment.
6. Approve realignment.
7. Apply realignment to the active loading.
8. Confirm audit events and line realignment status changes are recorded.

Validated outcome: EOS-05 realignment preview and governed application path work. API permission enforcement is correct, and approve/apply actions are now disabled for roles that do not own those endpoints.

Evidence:

- `audit_evidence/phase5_operational_seed/11_line_realignment_workbench.png`
- `audit_evidence/phase5_operational_seed/12_line_realignment_preview.png`

### Scenario 14: Sewing Output Capture and Minimal WIP Movement

Actor: line supervisor

1. Open sewing output capture.
2. Confirm an active line task is selected.
3. Enter gross output.
4. Enter defect quantity.
5. Enter rework quantity.
6. Verify net-good is calculated as gross minus defect minus rework.
7. Submit output.
8. Confirm the backend requires an active line loading.
9. Confirm output consumes sewing-active WIP and creates sewn-waiting-wash WIP only for net-good quantity.
10. Confirm low efficiency can create a line shortfall boundary case.
11. Confirm correction creates correction record and WIP delta movement where applicable.

Validated outcome: EOS-05 output capture works from live UI and service tests. Net-good quantity is the only quantity updating execution WIP and efficiency.

Evidence:

- `audit_evidence/phase5_operational_seed/13_sewing_output_capture_before.png`
- `audit_evidence/phase5_operational_seed/14_sewing_output_submitted.png`

## Evidence Screenshots

| Evidence | File |
|---|---|
| Order lifecycle explorer | `docs/audit_evidence/phase5_operational_seed/01_order_lifecycle_explorer.png` |
| Order detail and trace gate | `docs/audit_evidence/phase5_operational_seed/02_order_detail_trace_gate.png` |
| Procurement vendor follow-up | `docs/audit_evidence/phase5_operational_seed/03_procurement_vendor_follow_up.png` |
| Fabric inward and QC monitor | `docs/audit_evidence/phase5_operational_seed/04_fabric_inward_qc_monitor.png` |
| PCD readiness gate | `docs/audit_evidence/phase5_operational_seed/05_pcd_readiness_gate.png` |
| Weekly planning workbench | `docs/audit_evidence/phase5_operational_seed/06_weekly_planning_workbench.png` |
| Workcenter load monitor | `docs/audit_evidence/phase5_operational_seed/07_workcenter_load_monitor.png` |
| Daily production release | `docs/audit_evidence/phase5_operational_seed/08_daily_production_release.png` |
| Cutting room management | `docs/audit_evidence/phase5_operational_seed/09_cutting_room_management.png` |
| Sewing line loading board | `docs/audit_evidence/phase5_operational_seed/10_sewing_line_loading_board.png` |
| Line realignment workbench | `docs/audit_evidence/phase5_operational_seed/11_line_realignment_workbench.png` |
| Line realignment preview | `docs/audit_evidence/phase5_operational_seed/12_line_realignment_preview.png` |
| Sewing output capture before submit | `docs/audit_evidence/phase5_operational_seed/13_sewing_output_capture_before.png` |
| Sewing output submitted | `docs/audit_evidence/phase5_operational_seed/14_sewing_output_submitted.png` |

## CTA/API Reachability Evidence

The deep CTA pass is documented separately in `docs/37_Phase_0_to_5_CTA_Functional_Test_Report.md`.

Final CTA result:

- 53 CTA checks executed against the live Docker stack.
- 31 API-backed CTAs passed.
- 20 prototype-visible CTAs were confirmed inert and are listed as hardening backlog.
- 2 realignment approve/apply CTAs are RBAC-gated for `line_supervisor` and pass with `sewing_mgr`.
- 0 console/runtime issues in the final pass.

CTA evidence files:

| Evidence | File |
|---|---|
| Raw CTA result JSON | `docs/audit_evidence/phase5_cta_validation/cta_results.json` |
| CTA summary | `docs/audit_evidence/phase5_cta_validation/cta_summary.txt` |
| Technical style detail | `docs/audit_evidence/phase5_cta_validation/cta_technical_style_detail.png` |
| Routing builder | `docs/audit_evidence/phase5_cta_validation/cta_routing_builder.png` |
| Order detail | `docs/audit_evidence/phase5_cta_validation/cta_order_detail.png` |
| Weekly impact preview | `docs/audit_evidence/phase5_cta_validation/cta_weekly_impact_preview.png` |
| Workcenter queue | `docs/audit_evidence/phase5_cta_validation/cta_workcenter_load_queue.png` |
| Daily release validation | `docs/audit_evidence/phase5_cta_validation/cta_daily_release_validation.png` |
| Boundary impact preview | `docs/audit_evidence/phase5_cta_validation/cta_boundary_impact_preview.png` |
| Line realignment preview | `docs/audit_evidence/phase5_cta_validation/cta_line_realignment_preview.png` |
| Sewing output submit | `docs/audit_evidence/phase5_cta_validation/cta_sewing_output_submit.png` |

## Validation Commands Run

Backend:

```powershell
docker compose build backend
docker compose run --rm backend python -m ruff check .
docker compose run --rm backend python manage.py makemigrations --check --dry-run
docker compose run --rm backend python manage.py check
docker compose run --rm backend python -m pytest
```

Result: 50 tests passed, 15 warnings. Warnings are the existing Django staticfiles directory warning during tests.

Frontend:

```powershell
docker compose build frontend
docker compose run --rm --no-deps frontend npm run lint
docker compose run --rm --no-deps frontend npm run typecheck
docker compose run --rm --no-deps frontend npm run test
docker compose run --rm --no-deps frontend npm run build
docker compose --profile test run --rm frontend_e2e
```

Result:

- Lint passed.
- Typecheck passed.
- Unit tests passed: 9 files, 17 tests.
- Build passed.
- Playwright e2e passed: 6 tests.

Live stack and seed:

```powershell
docker compose up --build -d backend frontend
docker compose exec -T backend python manage.py flush --noinput
docker compose exec -T backend python manage.py seed_operational_factory
docker compose exec -T backend python manage.py validate_seed_scenarios
docker compose exec -T backend python manage.py validate_operational_factory_seed
curl.exe -s http://localhost:8000/health
```

Result:

- Stack left running.
- Backend healthy.
- Frontend healthy.
- `validate_seed_scenarios` passed.
- `validate_operational_factory_seed` passed with 42 orders, 11 releases, 20 line-board rows, and 14 WIP movements after clean reset seed plus the focused PCD-to-cutting proof.

Live CTA probe:

```powershell
node frontend\scripts\phase0_5_cta_probe.mjs
```

Result: 53 CTA checks; 31 passed API-backed checks, 20 confirmed inert controls, 2 RBAC-gated controls, and 0 console/runtime issues.

## Deviations Found

### Corrected During This Pass

1. PCD readiness recalculation could regress an order already in cutting, sewing, or later lifecycle reference stages back to PCD status when readiness APIs were viewed.
   - Fix: PCD readiness now only writes order lifecycle while the order is under PCD control, or when making an explicit release-to-cutting transition.
   - Regression test added.

2. Base Phase 5 execution seed could select the wrong ready release after operational releases already existed.
   - Fix: deterministic selection of the base `ORD-HP-001` release.
   - Double-run seed test added.

3. Operational seed rerun could attempt to restart cutting jobs that were already completed or handed over.
   - Fix: only start cutting jobs whose status is still startable.
   - Double-run seed test added.

4. Workcenter load and timeline surfaces emitted duplicate React keys under dense live data.
   - Fix: use snapshot identity for workcenter load rows and include row index in static timeline keys.

5. Order detail showed an enabled `Release to Cutting` CTA without wiring the release handler.
   - Fix: order detail now uses the governed release mutation and confirmation flow.

6. Daily release and line realignment action visibility did not fully reflect endpoint permissions.
   - Fix: approve/complete/apply controls are disabled for roles that do not own the matching endpoint.

7. Operation bulletin clone used a fixed next-version string and failed after a draft already existed.
   - Fix: clone uses a unique draft version suffix.

8. The current operational planning draft could be made unfreezeable by stale concentrated seed items.
   - Fix: seed now deactivates stale operational plan rows and spreads current-plan rows across the week.

9. PCD `Release to Cutting` reached the backend but did not propagate the released order into the cutting room grid.
   - Defect: `release_to_cutting` updated PCD/order lifecycle and audit but did not create the business-spec `ProductionRelease`, `CuttingJob`, or initial cutting WIP lot.
   - Fix: release-to-cutting now creates or reuses the governed cutting release, creates the cutting job through the execution service, writes release/job metadata to lifecycle and audit, and refreshes cutting-grid query data.
   - Proof: `OPS-ORD-015` was requested, approved, released, and shown in `/cutting/room` as `CUT-REL-OPS-ORD-015-20260528`.

10. EOS-04 rulebook seed data had date-sensitive wash overload placement.
   - Fix: the overloaded wash work item and its blocked release now use the current local date, so capacity-loss and release-validation tests remain stable after midnight in the backend time zone.

### Remaining Hardening Items

1. Live backend-connected e2e coverage should be added for every Phase 0-5 operator journey. Current frontend e2e tests pass and cover UI flows, but they use controlled fixtures for repeatability. The live screenshot pass and backend validators close part of the gap, but a true live e2e profile should be added.

2. Prototype parity assertions should be expanded to run against the live seeded stack for each implemented surface. Screenshots were captured, and e2e landmarks pass in the existing suite, but formal live prototype assertions are not yet comprehensive for every route.

3. The `WIP Pipeline` route is still a placeholder-style surface. This is acceptable for the Phase 5 boundary because full WIP reconciliation and WIP control-tower behavior are out of scope, but it should not be represented as a verified operational WIP surface until a future phase explicitly implements it.

4. The operational seed has enough output records to validate net-good, WIP movement, corrections, and efficiency, but a later hardening pass should add shift/hour output density across more lines once production-output analytics become in scope.

5. Twenty prototype-visible CTAs are confirmed inert in the current phase. They are listed in `docs/37_Phase_0_to_5_CTA_Functional_Test_Report.md` and should either be implemented, hidden until supported, or explicitly accepted as non-functional prototype controls.

## Final Status

Functional validation through Phase 5 is passing for all implemented API-backed CTAs after the corrections above.

The system now has a repeatable operational seed with dense order, material, fabric QC, PCD, planning, release, cutting, sewing loading, realignment, output, and WIP data. The current Docker stack is running, seeded, and validated. The remaining items are hardening work, primarily inert prototype CTAs and broader live e2e/parity automation.
