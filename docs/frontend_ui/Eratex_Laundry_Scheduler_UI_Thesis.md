# Eratex Laundry Scheduler UI Thesis

**Document type:** Front-end UI thesis and workspace specification  
**Surface:** Laundry scheduling and wash capacity control  
**Primary route proposal:** `/wash/scheduler`  
**Design stance:** Greenfield scheduler workspace created afresh; not derived from existing prototype folders  
**Date:** 2026-06-16  

---

## 1. Purpose

This document defines the UI thesis for a production-grade Eratex laundry scheduler. The surface should help planners, washing managers, and production leadership control laundry as a finite-capacity manufacturing domain rather than as a final finishing queue.

The scheduler must make visible:

- machine utilisation and idle time
- plan adherence and machine sequence adherence
- wash demand readiness
- batch quality and rewash load
- dynamic bottlenecks across dry process, wet wash, hydro, drying, QC, and rewash
- shipment risk created by laundry delay
- exceptions that require approval before changing a frozen plan

This is a UI thesis, not an implementation claim. It intentionally starts from a fresh scheduler concept so the laundry operating model can be designed around machine utilisation, dynamic constraints, planning zones, exception governance, and shift-level action.

---

## 2. Visual Thesis

The laundry scheduler should feel like a dense industrial control room: compact, sharp, low-padding, data-first, and designed for shift-level decisions under capacity pressure.

The UI should avoid:

- large hero headers
- decorative dashboard cards
- marketing copy
- oversized typography
- padded empty states
- explanatory banners that consume operating space

The UI should prefer:

- compact toolbars
- tabbed workspaces
- fixed grid dimensions
- thin dividers
- sharp typography
- sticky headers
- right-side inspectors
- click-to-open drill modals
- graphical load strips and machine swimlanes
- semantic risk color only for operational state

---

## 3. Content Plan

The first screen should not introduce the product. It should immediately show the operating condition of laundry.

Primary first-screen content:

```text
Global filters
KPI strip
Laundry flow map
Tabbed scheduler workspace
Machine/resource load board
Selected batch inspector
```

The user should be able to answer within one scan:

```text
What is the current bottleneck?
Which laundry stage is overloaded?
Which machines are idle?
Which batches are late or blocked?
Which lots are not ready?
Which frozen-plan changes need approval?
What action should be taken now?
```

---

## 4. Interaction Thesis

The interaction model should be calm but immediate.

1. **Click opens depth, not navigation.** Batch cards, machine slots, KPI cells, and exception rows open drill modals or the right inspector without leaving the scheduler.
2. **Drag is allowed only where governance allows it.** Future and volatile zones may support drag/drop scheduling. Firm-zone changes open an impact preview and approval flow.
3. **Every change previews impact.** Rescheduling, rebatching, machine reassignment, rewash creation, or capacity loss must show before/after load, shipment risk, and affected orders before confirmation.

Motion should be restrained:

- drawer slide for selected batch or machine details
- modal fade/scale for drill detail
- subtle transition when moving from planned load to actual load
- no animated decoration

---

## 5. Workspace Structure

The scheduler should be a multi-tab operational workspace.

```text
Laundry Scheduler
├─ Live Flow
├─ Capacity Board
├─ Batch Builder
├─ Machine Timeline
├─ Exceptions
├─ Adherence
└─ Masters & Rules
```

### 5.1 Live Flow

Primary view for washing manager and planner.

Shows:

- end-to-end laundry flow map
- active WIP by stage
- live machine state
- currently active bottleneck
- late batches
- not-ready lots
- rewash loop load
- due-date risk

### 5.2 Capacity Board

Planner view for finite-capacity scheduling.

Shows:

- machine-group load by shift/day
- available capacity
- planned load
- actual consumed load
- reserved rewash capacity
- downtime
- overload and idle gaps
- zone-specific editability

### 5.3 Batch Builder

Workspace for forming wash batches from demand.

Shows:

- unbatched wash demand
- compatible route groups
- shade-lot constraints
- min/max load fit
- customer machine preference
- latest safe wash completion
- suggested batch composition

### 5.4 Machine Timeline

Detailed machine-wise sequence view.

Shows:

- machine swimlanes
- shift partitions
- setup/changeover blocks
- planned batches
- actual start/end overlay
- breakdown/downtime blocks
- underloaded runs
- idle windows

### 5.5 Exceptions

Governed handling of disruptions.

Shows:

- machine breakdown
- late sewn WIP
- rewash required
- shipment pull-in
- customer machine restriction conflict
- dryer overload
- underloaded urgent batch
- recipe or route missing

### 5.6 Adherence

Plan versus actual performance.

Shows:

- plan adherence by shift
- machine adherence
- sequence adherence
- utilisation by machine group
- idle time by reason
- changeover loss
- rewash rate
- late completion trend

### 5.7 Masters & Rules

Read-only operational visibility into planning rules.

Shows:

- machine capability matrix
- route/recipe availability
- min/max load rules
- customer preferred/restricted machines
- setup families
- rewash reserve rules
- planning-zone governance rules

---

## 6. Shell And Density Rules

The scheduler should use the existing Industrial Logic design system.

Recommended dimensions:

| Area | Rule |
|---|---|
| Global header | 48px fixed height |
| Left navigation | 64px collapsed by default |
| Page title row | 36px maximum |
| Toolbar | 32px controls |
| KPI strip | 52px to 64px high |
| Grid row | 28px to 32px |
| Machine timeline row | 36px to 44px |
| Batch card | 44px to 64px depending on mode |
| Right inspector | 400px desktop |
| Drill modal | 720px to 960px wide depending on detail |

Typography:

- `Inter` for all UI labels and data tables.
- `JetBrains Mono` only for batch IDs, machine IDs, timestamps, and recipe versions.
- Page-level heading should be compact, not hero scale.
- Use 12px to 14px for most operational text.
- Letter spacing should remain normal except label caps already defined in the design system.

Spacing:

- 8px to 12px page gutters.
- 4px to 8px internal component padding.
- 1px grid borders.
- Minimal shadows.
- Tabs should be text labels with compact active underline or filled active state.

---

## 7. First Screen Composition

Recommended first viewport:

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Header: Unit | Date horizon | Zone | Search | Sync | Alerts                  │
├──────┬───────────────────────────────────────────────────────────────────────┤
│ Nav  │ Laundry Scheduler | tabs | filters | actions                          │
│      ├───────────────────────────────────────────────────────────────────────┤
│      │ KPI strip: Bottleneck | Utilisation | Idle | Adherence | Rewash | Risk│
│      ├───────────────────────────────────────────────────────────────────────┤
│      │ Laundry flow map: Queue > Dry > Wet > Hydro > Dryer > QC > Finish     │
│      ├─────────────────────────────────────────────┬─────────────────────────┤
│      │ Main tab workspace                           │ Right inspector         │
│      │ Machine/resource board or batch grid         │ Selected batch/CCR      │
│      │                                               │ Impact preview          │
└──────┴─────────────────────────────────────────────┴─────────────────────────┘
```

The visual hierarchy should be:

1. current bottleneck and risk KPIs
2. full laundry flow status
3. machine capacity/work-in-action board
4. selected batch or machine detail
5. actions and approvals

---

## 8. KPI Strip

The KPI strip should be a compact operational band, not separate decorative cards.

Recommended KPIs:

| KPI | Purpose |
|---|---|
| Active CCR | Shows current bottleneck resource |
| Planned utilisation | Shows load against available capacity |
| Actual utilisation | Shows real consumed capacity |
| Idle hours | Shows unused machine time |
| Plan adherence | Shows planned versus actual execution |
| Sequence adherence | Shows whether machine sequence followed plan |
| Not-ready lots | Shows demand that cannot enter laundry |
| Rewash load | Shows reserve and consumed rewash capacity |
| Dryer pressure | Shows downstream wet-to-dry imbalance |
| Shipment risk | Shows affected orders within due-date horizon |

Each KPI should be clickable.

Click behavior:

- open drill modal with trend, affected machines, affected batches, and suggested action
- preserve current filter context
- allow jump to impacted tab

Example KPI drill:

```text
KPI: Idle hours
Modal sections:
- Idle hours by machine group
- Idle reason split: no lot, breakdown, waiting dryer, changeover, operator unavailable
- Top affected shifts
- Preventive action suggestions
- Linked batches/orders
```

---

## 9. Graphical Laundry Flow Map

The scheduler needs one graphical representation of laundry as a whole. This should be a horizontal process strip with capacity, WIP, and risk at every step.

Recommended stages:

```text
Sewn Waiting Wash
→ Dry Process
→ Laser / PP Spray
→ Wet Wash
→ Hydro
→ Dryer
→ Shade QC
→ Rewash / Touch-up
→ Released to Finishing
```

Each stage node should show:

- current WIP quantity
- oldest WIP age
- planned load
- available capacity
- utilisation percentage
- active machine count
- blocked batch count
- shipment-risk count

Node states:

| State | UI treatment |
|---|---|
| Normal | neutral line and low-intensity fill |
| Watch | amber top rule or mini marker |
| Overloaded | red load bar and red count |
| Critical | black status marker and forced attention |
| Idle | blue/neutral idle marker with reason |
| Blocked | red lock or stop icon |

The flow map should also show imbalances:

- wet wash releasing faster than dryer capacity
- dry process backlog starving wet wash
- QC backlog blocking release to finishing
- rewash loop consuming reserved capacity

Example compact node:

```text
┌───────────────┐
│ Wet Wash      │
│ WIP 8.4k pcs  │
│ Load 128%     │
│ 3 late batches│
└───────────────┘
```

The flow map is not decorative. It is the fastest way to explain why a laundry plan that looks feasible at washer level may still fail at dryer, dry process, QC, or rewash level.

---

## 10. Capacity Board UI

The Capacity Board should expose multi-CCR planning.

Layout:

```text
Rows: machine groups or specific machines
Columns: day / shift / hour bucket
Cells: load, available capacity, batch count, state
```

Recommended row groups:

```text
Dry Process
Laser
PP Spray
Wet Wash - Tonello 125 kg
Wet Wash - Tonello 150 kg
Wet Wash - Tolkar
Hydro
Dryer
Shade QC
Rewash Reserve
```

Cell contents:

- planned load percentage
- booked batch count
- open idle capacity
- overload amount
- reserved capacity
- exception marker

Cell click opens a capacity drill modal:

```text
Machine group: Dryer
Date/shift: 2026-06-18 / Shift B
Available: 1,260 min
Planned: 1,480 min
Overload: 220 min
Cause: 4 heavy-wash batches, 1 rewash child batch
Suggested actions:
- move Batch W-204 to Shift C
- hold wet-wash release for Batch W-211
- approve overtime 2.5h
Affected shipments:
- ORD-1088, ORD-1092
```

---

## 11. Machine Timeline UI

The timeline should show how work is actually flowing through machines.

Structure:

```text
┌──────────────┬───────┬───────┬───────┬───────┬───────┐
│ Machine      │ 08:00 │ 10:00 │ 12:00 │ 14:00 │ 16:00 │
├──────────────┼───────┼───────┼───────┼───────┼───────┤
│ Tonello 125-1│ W-201 │ W-204 │ Setup │ W-208 │ Idle  │
│ Tonello 125-2│ Down  │ Down  │ W-214 │ W-214 │ W-219 │
│ Dryer 01     │ W-197 │ W-197 │ W-202 │ Over  │ W-210 │
└──────────────┴───────┴───────┴───────┴───────┴───────┘
```

Visual states:

- planned batch block
- actual progress overlay
- setup block
- downtime block
- idle block
- overload block
- late-risk border
- customer restriction marker
- underloaded run marker

Batch blocks should show only essential data:

```text
W-204 | ORD-1088 | 72kg | enzyme | due D-1
```

Click behavior:

- click batch block: open batch detail modal
- click machine row header: open machine utilisation modal
- click idle block: open idle reason capture modal
- click downtime block: open exception detail
- click overload block: open impact preview

---

## 12. Batch Builder UI

Batch Builder converts wash demand into executable machine batches.

Layout:

```text
Left: unbatched demand queue
Center: suggested compatible groups
Right: batch composition and rule validation
Bottom: capacity impact preview
```

Demand queue columns:

```text
Order
Customer
Style
Wash code
Qty / kg
Shade lot
Due date
Readiness
Latest wash start
Risk
```

Rule validation panel:

```text
Route compatible
Recipe approved
Machine group eligible
Within min/max load
Shade lot compatible
Customer restriction cleared
Dryer capacity available
Rewash reserve available
```

Batch suggestion states:

| State | Meaning |
|---|---|
| Good fit | Batch meets compatibility and load-efficiency rules |
| Underloaded | Allowed only with approval or urgent shipment reason |
| Overloaded | Blocked unless quantity split |
| Incompatible | Machine/route/customer restriction blocks batch |
| Risky | Feasible but creates downstream capacity or shipment risk |

---

## 13. Drill Modals

Drill modals should be used when the user needs a deeper operating explanation without losing the board.

Recommended modals:

| Modal | Opens from | Purpose |
|---|---|---|
| Batch detail | Batch card/block | Route, progress, recipe, capacity impact, QC, actions |
| Machine utilisation | Machine row/KPI | Utilisation, idle, downtime, current queue, next slots |
| Capacity cell detail | Capacity board cell | Load contributors and recovery actions |
| Bottleneck explanation | Active CCR KPI | Why this CCR is the constraint now |
| Impact preview | drag/drop or move action | Before/after capacity, dates, affected orders |
| Rewash creation | QC failure action | Child batch, reason, capacity impact |
| Exception approval | firm-zone change | Approval path, reason, audit |
| Plan adherence detail | adherence KPI | Planned vs actual machine/sequence deviation |

Modal behavior:

- close with `Esc`
- retain selected board state
- primary action fixed at bottom
- no route change for routine drill
- deep link optional for audit-heavy records

---

## 14. Right Inspector

The right inspector should remain open on desktop when a batch, machine, or exception is selected.

Inspector tabs:

```text
Summary
Route
Capacity
Quality
Exceptions
Audit
```

For selected batch, show:

- order and PO
- customer
- wash route
- quantity and kg
- shade lot
- current step
- planned start/end
- actual start/end
- assigned machine
- compatible alternate machines
- shipment due date
- risk reason
- next valid action

For selected machine, show:

- current state
- active batch
- next batch
- shift capacity
- planned load
- actual load
- idle time
- downtime
- sequence adherence
- queue
- setup family

---

## 15. Planning Zone Behavior

The UI must make planning zones visible because the same action has different governance depending on zone.

Recommended zone selector:

```text
Future | Volatile | Firm
```

### 15.1 Future Zone

Purpose:

- rough-cut laundry capacity
- due-date quotation
- weekly resource feasibility

UI behavior:

- show resource-group load, not final machine sequence
- allow flexible movement
- allow tentative batch suggestions
- show overload by week/day
- no approval for normal moves
- warn when promise date exceeds capacity

### 15.2 Volatile Zone

Purpose:

- convert demand into tentative batches
- assign machine groups and planned slots
- manage readiness, WIP, and near-term risk

UI behavior:

- allow rebatching and resequencing
- show downstream impact
- require reason for major changes
- flag customer-machine restriction conflicts
- allow planner to commit selected batches into firm zone

### 15.3 Firm Zone

Purpose:

- protect released shift plan
- enforce governance for changes
- preserve audit

UI behavior:

- specific machine, shift, sequence, and batch are frozen
- drag/drop opens impact preview
- changes require reason and approval when configured
- late WIP, breakdown, rewash, or shipment pull-in become governed exceptions
- plan-vs-actual adherence is measured here

Firm-zone interaction example:

```text
User drags Batch W-204 from Tonello 125-1 Shift A to Tonello 150-2 Shift B.
System blocks direct move and opens impact preview.
Preview shows:
- customer preferred-machine rule violated
- dryer load improves by 8%
- shipment risk for ORD-1088 improves from red to amber
- one lower-priority batch moves by 4 hours
User must submit change for approval.
```

---

## 16. Multi-CCR And Dynamic CCR UI

Laundry should be visible as multiple CCRs, not a single wash bucket.

The UI should always show:

```text
Route CCRs
Current active CCR
Next likely CCR
Downstream blocked CCR
Reserved rewash CCR
```

Dynamic CCR examples:

| Scenario | UI should show |
|---|---|
| Heavy dry-process denim mix | Laser/PP spray becomes active CCR |
| Bulk wet wash orders | Tonello or wet wash group becomes active CCR |
| Thick fabric or high moisture | Dryer becomes active CCR even if washer is free |
| Shade-sensitive customer | Shade QC becomes active CCR |
| High rewash day | Rewash reserve becomes active CCR |
| Customer-restricted machine | Eligible machine subset becomes active CCR |

The active CCR calculation should be displayed in user language:

```text
Active CCR: Dryer
Reason: planned drying load is 118% of Shift B capacity.
Contributors: 3 heavy-wash batches, 1 rewash batch, 90 min downtime.
Shipment exposure: 2 orders due within 48 hours.
```

---

## 17. Exception Case UI

Exception handling must be operational and governed.

| Exception | UI trigger | Required UI response |
|---|---|---|
| Machine breakdown | Machine marked down | Remove capacity, show affected batches, suggest alternate machines |
| Late sewn WIP | Demand readiness fails | Mark lot not ready, show idle risk, resequence candidate batches |
| Rewash required | QC failure | Create child batch, consume capacity, recalculate shipment risk |
| Shipment pull-in | Due date changes | Recalculate latest safe wash start, show displaced batches |
| Customer machine restriction | Assignment conflict | Block incompatible machine or require exception approval |
| Underloaded urgent batch | Batch below min load | Show efficiency loss and require approval if configured |
| Dryer overload | Wet wash exceeds dryer capacity | Warn before wet release and suggest resequence/hold |
| Recipe missing | Demand lacks approved route | Block scheduling and route to master correction |

Exception modal should include:

- current issue
- affected machines
- affected batches
- affected shipments
- suggested recovery actions
- efficiency/utilisation impact
- approval requirement
- audit trail

---

## 18. Value Visibility

The scheduler should show value directly inside the UI. It should not require a separate management presentation to explain benefits.

Recommended value surfaces:

### 18.1 Shift Value Strip

```text
Idle avoided: 4.5h
Overload removed: 220 min
Late-risk batches improved: 3
Changeover saved: 70 min
Rewash reserve protected: 85%
```

### 18.2 Before/After Impact Preview

Used when planner applies a suggested action.

```text
Before:
Dryer Shift B load 118%
3 batches late risk
2.5h expected idle on Tonello 125-2

After:
Dryer Shift B load 96%
1 batch late risk
0.5h idle on Tonello 125-2
Changeover +20 min
```

### 18.3 Plan Adherence Panel

Shows:

- planned batches
- executed as planned
- machine changed
- sequence changed
- delayed start
- delayed completion
- reason distribution

### 18.4 Idle Reason Panel

Shows:

- no lot available
- waiting for prior process
- machine breakdown
- dryer not available
- QC hold
- operator unavailable
- changeover delay
- recipe/master missing

The goal is to help users see not only that utilisation changed, but why it changed.

---

## 19. Recommended Actions

The scheduler should provide action suggestions, but the user remains in control.

Recommended action types:

- fill idle capacity
- split overloaded batch
- move batch to compatible machine
- hold wet wash until dryer is available
- reserve rewash capacity
- approve underloaded urgent batch
- extend shift or add overtime
- release lower-risk batch later
- escalate not-ready sewn WIP
- correct missing route or recipe master

Each suggestion must show:

- expected capacity impact
- shipment impact
- rule impact
- approval requirement
- affected orders

---

## 20. Data Freshness And Trust

Every operating area should show data freshness.

Required timestamps:

- last ERP/Datatex sync
- last sewing WIP update
- last machine actual update
- last QC update
- last schedule recalculation

If source data is stale, the UI should make this explicit:

```text
Sewn WIP last updated 3h ago. Batch readiness may be inaccurate.
```

The scheduler must not imply live precision when it only has delayed data.

---

## 21. Route And Component Proposal

Suggested routes:

```text
/wash/scheduler
/wash/scheduler/live
/wash/scheduler/capacity
/wash/scheduler/batches
/wash/scheduler/timeline
/wash/scheduler/exceptions
/wash/scheduler/adherence
/wash/scheduler/rules
```

Suggested components:

```text
LaundrySchedulerShell
SchedulerTabBar
SchedulerFilterBar
LaundryKpiStrip
LaundryFlowMap
CapacityBoard
MachineTimeline
BatchBuilder
BatchCard
CapacityCell
RightInspector
DrillModal
ImpactPreview
ExceptionApprovalModal
PlanAdherencePanel
IdleReasonPanel
MachineCompatibilityMatrix
```

Frontend should render state and impact returned by backend services. It should not own scheduling truth or finite-capacity calculations.

---

## 22. Backend Data Needed For UI

The scheduler UI requires structured data from backend APIs.

Minimum payload families:

- wash demand
- batch candidates
- confirmed batches
- route steps
- recipe versions
- machine groups
- machine capability
- machine calendars
- shift capacity
- planned load
- actual machine events
- downtime
- QC status
- rewash child batches
- plan-zone state
- exception approval state
- plan-vs-actual adherence

If these fields are not available, the UI must show a payload gap rather than inventing a simplified pattern.

---

## 23. Acceptance Criteria

The laundry scheduler UI is acceptable when:

- the first screen shows current laundry bottleneck without scrolling
- laundry is visible as multiple CCRs, not one generic capacity bucket
- user can see work-in-action across dry, wet, hydro, dryer, QC, rewash, and finishing release
- user can identify machine idle time and idle reason
- user can identify overload and affected shipments
- user can form or review batches against machine compatibility and load rules
- user can see the difference between planned, actual, and reserved capacity
- firm-zone changes open impact preview and approval flow
- rewash creates visible capacity impact
- plan adherence and sequence adherence are visible by shift
- all drill details open without losing board context
- UI uses compact typography, minimal padding, thin borders, and semantic colors only for operational state

---

## 24. Final UI Thesis

The laundry scheduler should be the place where Eratex sees whether laundry can actually execute the plan.

It should move laundry planning from:

```text
manual shift plan and after-the-fact follow-up
to finite-capacity scheduling with visible bottlenecks

single laundry bucket
to route-step CCR visibility

machine idle time without reason
to explainable idle loss

hidden rewash impact
to reserved and consumed rewash capacity

plan changes by phone or Excel
to governed impact preview and approval

shipment risk discovered late
to early visibility at batch, machine, and route level
```

The scheduler succeeds when a washing manager can open one screen and immediately understand what must run next, what cannot run, which machine is the constraint, and what action will protect shipment without wasting machine capacity.
