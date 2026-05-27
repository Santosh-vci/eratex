# 31. Phase 4 Operator Manual
# Live Planning, Capacity Impact, Workcenter Load, and Daily Release

**Product:** Eratex Planning and Scheduling Tool
**Audience:** Production Planner, Planning Head, Capacity Manager, Release Coordinator
**Scope:** Phase 4 / EOS-04 live planning and release-control workbenches
**Source of phase numbering:** `docs/25_Common_Documentation_Spine_and_Phasewise_Build_Plan.md`

---

## 1. What Phase 4 Delivers For Operators

Phase 4 gives operators a live planning control loop before execution starts:

```text
ready order backlog
weekly plan board
drag-to-plan assignment workflow
no-write capacity impact preview
plan freeze control
post-freeze change request path
workcenter load and current constraint visibility
workcenter queue detail
daily release validation
release override request/approval
release completion control record
```

Phase 4 does not create cutting bundles, production output, WIP movement, sewing output, wash execution, shipment workflow, mature what-if simulation, or multi-unit capacity simulation.

---

## 2. Operator Roles

| Role | Primary Phase 4 Work |
|---|---|
| Production Planner | Load weekly planning, drag ready orders to lanes, preview impact, assign work, request changes |
| Planning Head | Freeze plans, approve post-freeze plan changes, approve release overrides |
| Capacity Manager | Review overload/current constraint, queue ageing, and capacity action state |
| Release Coordinator | Validate daily releases, request overrides, issue/complete release-control records |

Seeded local users:

```text
planner / planning123
planning_head / planning123
capacity_manager / planning123
release_coordinator / planning123
```

---

## 3. Start The Live Workbench

Use Docker only:

```powershell
docker compose up --build -d backend frontend
docker compose exec -T backend python manage.py seed_eos04
```

Open:

```text
http://localhost:3000/login
```

Sign in as:

```text
planner / planning123
```

### Prototype Sources Used By Operators

The Phase 4 workbenches are not invented screens. They are governed by these source prototypes:

| Operator Surface | Prototype Folder |
|---|---|
| Weekly planning, time/day swimlanes, and click-drag plan lanes | `docs/frontend_ui/weekly_planning_workbench` |
| Compact planning timeline cues | `docs/frontend_ui/calendar_gantt_planning_dashboard` |
| Workcenter load and queue detail | `docs/frontend_ui/workcenter_load_monitor` |
| Daily release validation and action drawer | `docs/frontend_ui/daily_production_release_dashboard` |

---

## 4. Click-Drag Planning Track

### Goal

Move a PCD-ready order from backlog into a time/day swimlane and inspect capacity impact before committing the assignment.

### Steps

1. Open `Planning` from the left rail.
2. Confirm the page title is `Weekly Planning`.
3. In `Ready Backlog`, find a ready order such as `ORD-PLAN-001`.
4. Click and drag the order row into a day swimlane, for example `MON 25`.
5. Release the mouse over the dashed `Drop here` zone in that swimlane.
6. Confirm the swimlane is marked as the drop target.
7. Review `Impact Preview`.
8. Confirm the impact drawer/panel shows:
   - before utilization
   - after utilization
   - added minutes
   - `Write applied: NO`
9. Click `Assign Selected`.
10. Confirm the success message says the backlog order was assigned.

### Operator Meaning

Dragging does not immediately write a plan change. The time/day swimlane is the planning target, workcenter load is shown on the planned cards and load profile, and the write happens only after `Assign Selected`.

---

## 5. Freeze And Change Control Track

### Goal

Lock an acceptable plan and route later edits through governance.

### Steps

1. Open `Planning`.
2. Review `Blocked Load` and capacity overlays.
3. Click `Freeze`.
4. Confirm the freeze dialog.
5. Open a planned item.
6. If the plan is frozen, use `Request Change` instead of direct editing.

### Operator Meaning

A frozen plan is controlled. Post-freeze changes require an approved change request rather than direct lane edits.

---

## 6. Workcenter Load Track

### Goal

Find the current constraint and inspect queue risk before release.

### Steps

1. Open `Workcenters` from the left rail.
2. Confirm the page title is `Workcenter Load`.
3. Review KPI strip:
   - workcenters
   - highest overload
   - critical count
   - queue quantity
4. Review the grid:
   - workcenter
   - utilization
   - load minutes
   - capacity minutes
   - queue quantity
   - affected order
   - constraint state
5. In `Current Constraint`, click `Open Queue`.
6. Confirm the queue page lists affected orders and next actions.

### Operator Meaning

Capacity and queue state are visible before release. Operators can see whether a workcenter is normal, watch, overloaded, or critical.

---

## 7. Daily Release Track

### Goal

Validate and govern release-control records without creating execution output.

### Steps

1. Open `Daily Release`.
2. Review KPI strip:
   - planned releases
   - ready
   - blocked
   - released
3. Select a release row.
4. Click `Validate`.
5. Review validation checks:
   - PCD ready
   - material ready
   - fabric QC clear
   - capacity visible
   - constraint acceptable
   - previous gate clear
6. If blocked, click `Request Override`.
7. Planning Head reviews and clicks `Approve Override`.
8. Release Coordinator clicks `Complete` when the release-control record is complete.

### Operator Meaning

Daily release is a governed control record. Phase 4 does not create cutting output, bundles, WIP, sewing, wash, shipment, or production output records.

---

## 8. Operator Test Script

Run this after seeding EOS-04 data:

```text
1. Sign in as planner.
2. Open /planning/weekly.
3. Drag ORD-PLAN-001 from Ready Backlog into the MON 25 swimlane.
4. Confirm impact preview is visible and says Write applied: NO.
5. Click Assign Selected.
6. Open /workcenters/load.
7. Confirm WASH-WC appears as current/highest constraint when overloaded.
8. Open the queue from Current Constraint.
9. Open /releases/daily.
10. Select a release and click Validate.
11. Confirm validation checks and blockers render in the right drawer.
```

Expected result:

```text
The planner can preview impact before assignment, assign a ready order, inspect load/queue, and validate daily release controls without creating execution records.
```

---

## 9. Evidence Pack

Evidence generated from the Docker stack is stored under:

```text
frontend/test-results/operator-manual/
frontend/test-results/ui-parity/
```

Use these screenshots to confirm the app behavior:

```text
frontend/test-results/operator-manual/01-weekly-planning-backlog.png
frontend/test-results/operator-manual/02-drag-impact-preview.png
frontend/test-results/operator-manual/03-assign-confirmation.png
frontend/test-results/operator-manual/04-workcenter-load.png
frontend/test-results/operator-manual/05-daily-release-validation.png
frontend/test-results/ui-parity/weekly-planning.png
frontend/test-results/ui-parity/workcenter-load.png
frontend/test-results/ui-parity/daily-release.png
```

Evidence checks:

```text
Docker stack healthy
EOS-04 seed command completed
Weekly planning route renders
Drag-to-plan impact preview works
Workcenter load route renders
Daily release validation drawer works
No mature what-if or multi-unit simulation UI appears in Phase 4
```
