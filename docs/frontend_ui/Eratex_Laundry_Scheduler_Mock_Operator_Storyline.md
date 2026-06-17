# Laundry Scheduler Mock UI Operator Storyline

Source mock route: `/wash/scheduler`  
Audience: laundry scheduler, washing supervisor, finishing coordinator, planning lead, QA lead  
Purpose: guide an operator through the mock UI end to end and explain what each visible action is intended to prove.

This document is written for trying the frontend mock only. The screen uses static frontend scenario data and local UI state. It does not persist changes, create backend records, or update a real production plan.

## 1. Current Assumed Operating State

Laundry is operating as the dependent chain after sewing and before finishing.

1. Sewing has released WIP into the washing queue.
2. The washing workspace must decide what can be washed, dried, checked, rewashed, and released without starving or overloading downstream steps.
3. Finishing is waiting for clean, shade-approved output from laundry. Finishing is not the current bottleneck in this scenario.
4. The active operational constraint is Dryer capacity, not the washing machine itself.
5. Wet Wash has more release pressure than Dryer can absorb, so the correct operator response is not simply to start more wash. The operator must protect dryer capacity, preview moves, approve governed exceptions, and avoid pushing wet output into a downstream choke point.

The mock starts at:

- Unit: `Unit 01`
- Horizon: `18-19 Jun`
- Current shift view: `Shift B`
- Planning zone: `Firm`
- Mock event time used by the screen: `12:24`
- Chain shown on screen: `Sewn Waiting Wash -> Dry Process -> Laser / PP Spray -> Wet Wash -> Hydro -> Dryer -> Shade QC -> Rewash / Touch-up -> Released to Finishing`

The operational story is:

Sewing has produced enough WIP to run laundry, but some sewn lots are late or not ready. Wet Wash has overload pressure. Hydro still has spare capacity. Dryer is the active CCR because heavy wash, rewash, and downtime converge in Shift B. Shade QC has watch-level pressure, rewash reserve is protected, and finishing can currently absorb released output.

## 2. Visible Seed Data Aligned To The State

The mock screen shows the following scenario records so the operator can understand why each next action appears.

### KPI Strip

| KPI | Value | Meaning in the current state |
| --- | --- | --- |
| Active CCR | Dryer, `118% Shift B load` | Dryer is the current constraint. Wet release must be controlled before more wash is started. |
| Planned utilisation | `104%` | The combined wet and dry plan is above a clean capacity fit. |
| Actual utilisation | `88%` | Actual machine usage is below plan because one washer is down and Dryer 02 waited for hydro. |
| Idle hours | `6.5h` | Idle time comes from no-lot windows, downtime, and waiting between process steps. |
| Plan adherence | `76%` | Machine, sequence, and start-time adherence have drifted due to breakdown and urgent changes. |
| Rewash load | `72%` | Rewash reserve exists but must remain protected for confirmed QC failures. |
| Shipment risk | `5 orders` | Two orders are due inside 48 hours and are exposed by dryer overload or missing recipe approval. |

### Flow Map

| Flow stage | WIP | Load | State shown | Operator interpretation |
| --- | ---: | ---: | --- | --- |
| Sewn Waiting Wash | `11.8k pcs` | `94%` | Watch | Enough input exists, but 3 not-ready lots hold 1.6k pcs. |
| Dry Process | `5.2k pcs` | `86%` | On track | Pre-wash feed is stable for now. |
| Laser / PP Spray | `3.4k pcs` | `111%` | Watch | Could become the next CCR if Dryer recovery succeeds. |
| Wet Wash | `8.4k pcs` | `128%` | Action | Wash load is too high, and Dryer cannot absorb all output. |
| Hydro | `2.2k pcs` | `72%` | On track | Hydro has spare capacity. |
| Dryer | `7.1k pcs` | `118%` | Critical | Active CCR, with 4 blocked items and 5 risk items. |
| Shade QC | `1.8k pcs` | `96%` | Watch | Near capacity for shade-sensitive work. |
| Rewash / Touch-up | `0.9k pcs` | `72%` | Watch | Reserve is protected and should not be used for normal production. |
| Released to Finishing | `6.5k pcs` | `81%` | On track | Finishing is not blocking laundry release. |

### Active Batches

| Batch | Order | Customer | Current step | Risk | Why it matters |
| --- | --- | --- | --- | --- | --- |
| W-204 | ORD-1088 | Northstar Retail | Wet Wash on Tonello 125-1 | Action | Dryer Shift B overload and preferred-machine conflict require a preview before moving. |
| W-211 | ORD-1092 | Blue Harbor | Dryer 02 | Critical | Shipment is due inside 48 hours and dryer slot is overloaded. |
| W-214 | ORD-1098 | Hale Outfitters | Wet Wash on Tonello 125-2 | Watch | Breakdown created sequence delay. |
| W-219 | ORD-1101 | Aster Goods | Sewn Waiting Wash | Action | Late sewn WIP, heavy dryer load, and recipe governance create release risk. |

### Unbatched Demand

| Demand | Customer | Wash | Readiness | Risk | Operator reading |
| --- | --- | --- | --- | --- | --- |
| ORD-1088 | Northstar Retail | ENZ-STN | READY | Action | Ready, but must be placed without worsening dryer overload. |
| ORD-1092 | Blue Harbor | ACID-LT | READY | Critical | Urgent and dryer exposed. |
| ORD-1098 | Hale Outfitters | RNS-DK | NOT_READY | Watch | Needs readiness resolution before normal scheduling. |
| ORD-1101 | Aster Goods | HEAVY-BLK | HOLD | Action | Held by recipe and readiness governance. |
| ORD-1106 | Northstar Retail | ENZ-STN | READY | On track | Compatible with ORD-1088 by shade and wash family. |
| ORD-1110 | Lumen Co | RNS-LT | READY | On track | Later-start demand with no immediate red risk. |

### Exception Queue

| Exception | Type | Status | Approval owner | Operator interpretation |
| --- | --- | --- | --- | --- |
| EX-501 | Machine breakdown | Approval required | Washing manager | Tonello 125-2 downtime reduced wet capacity and requires resequence approval. |
| EX-506 | Dryer overload | Previewed | Planning head | Dryer overload must be resolved before wet release continues. |
| EX-512 | Rewash required | Previewed | QC lead | Child batch should only be created after QC confirmation. |
| EX-518 | Recipe missing | Approval required | Master data owner | HEAVY-BLK cannot be released without recipe correction. |

## 3. Behind-The-Scenes Frontend Logic

The mock is purely frontend. The screen is designed to show the decisions and flow the real workspace would support, without implementing backend persistence.

### What Is Static

- KPI values, stage loads, batches, machine slots, demand rows, rules, and exceptions are static scenario records in the mock component.
- Status colors are driven by each record's state, such as `ON_TRACK`, `WATCH`, `ACTION`, or `CRITICAL`.
- The active CCR is visually represented by Dryer having the highest critical downstream load.
- The screen assumes laundry is downstream of sewing and upstream of finishing. It does not create sewing output, finishing output, shipment records, or backend WIP records.

### What Changes Locally While The Operator Clicks

- `Recalculate` toggles the actual overlay state and shows the message: `Schedule recalculated from mock machine events at 12:24.`
- `Actual overlay on` / `Planned only` switches the visible planned-vs-actual mode.
- Planning zone selection changes the move behavior:
  - `Firm`: drag moves require an impact preview and approval.
  - `Volatile`: drag moves can be staged directly.
  - `Future`: drag moves can be staged directly.
- Search filters the demand queue by order, style, wash, shade, and related row text.
- Selecting a flow node, batch, capacity cell, demand row, machine, or exception updates the right-side inspector.
- Adding and removing demand changes only the local batch composition panel.
- Approving an exception changes the status for that exception in local screen state.
- Creating a child rewash batch shows confirmation feedback, but does not create a persistent record.
- Approving a firm-zone move applies the moved batch visually to the timeline through local state.

### Why The Screen Recommends The Next Action

The mock follows these operator rules:

1. Do not release more wet wash when Dryer is already critical.
2. Treat Dryer as the active CCR when dryer load exceeds wet or hydro capacity pressure.
3. Use impact preview before changing firm-zone sequence, machine, or batch placement.
4. Use protected rewash capacity only for QC-confirmed rewash work.
5. Treat missing recipes and not-ready sewn WIP as blockers, not as schedulable demand.
6. Read downstream impact before acting on upstream capacity.
7. Keep finishing release visible, but do not make finishing the constraint unless laundry output exceeds finishing capacity.

## 4. Operator Click-Through Storyline

Use this sequence to test the mock as an end-to-end operator journey.

### Step 1 - Open The Workspace

Open `/wash/scheduler`.

Expected screen:

- The heading shows `Laundry Scheduler`.
- The route opens without redirecting to login.
- The KPI strip appears.
- The `Laundry flow map` appears.
- The right-side inspector starts on selected batch `W-204 / ORD-1088`.

Operator understanding:

You are looking at the laundry control point after sewing and before finishing. The goal is to decide what to release, move, hold, approve, or investigate next.

### Step 2 - Read The Current State From The KPIs

Click `Active CCR`.

Expected result:

- A KPI drill modal opens.
- It explains that Dryer is overloaded because heavy wash and rewash converge after wet wash.
- Affected records include `W-204`, `W-211`, `ORD-1088`, and `ORD-1092`.
- Suggested actions include holding `W-211` wet release and moving `W-204`.

Close the modal.

Click `Idle hours`.

Expected result:

- The drill shows Dryer 02 and Tonello 125-2 as idle or down contributors.
- It points to capture idle reason and resequencing after repair clearance.

Operator understanding:

The problem is not only load. The screen is showing the difference between planned work and actual execution events.

### Step 3 - Confirm The Chain Constraint In The Flow Map

Click the `Dryer` node in the flow map.

Expected result:

- The right-side inspector changes to the Dryer stage.
- It shows WIP, oldest age, planned load, capacity, machines, and risk count.
- The next valid action says to hold wet wash release before Dryer 03 opens.

Click the `Wet Wash` node.

Expected result:

- The inspector shows Wet Wash at `128%`.
- The reasoning says wet release exceeds dryer capacity.

Operator understanding:

Wet Wash is loaded, but the downstream Dryer is the control point. The operator should not solve a Wet Wash pressure by releasing more wet output into a constrained Dryer.

### Step 4 - Use Live Flow For The First Recovery Preview

Stay on `Live Flow`.

Click `Preview dryer recovery`.

Expected result:

- A recovery impact preview opens.
- Before state shows Dryer Shift B load at `118%`.
- After state shows Dryer Shift B load at `96%`.
- Late-risk batches improve from `3 red / 2 amber` to `1 red / 2 amber`.
- Approval requirements mention preferred-machine exception, affected orders, and append-only audit.

Click `Approve and apply`.

Expected result:

- The modal closes.
- A status message confirms the selected recovery action was accepted.

Operator understanding:

The mock demonstrates the decision pattern: preview first, then approve. It does not silently mutate the plan without showing the impact.

### Step 5 - Drill Into A Specific Batch

In `Live Flow`, click `W-211 / ORD-1092` in Late and blocked batches.

Expected result:

- Batch detail opens.
- The route shows `Laser / PP Spray -> Wet Wash -> Hydro -> Dryer -> Shade QC`.
- Current step is Dryer.
- Risk explains that the shipment is due inside 48 hours and the dryer slot is overloaded.

Close the modal.

Operator understanding:

The shipment risk KPI is tied to real visible batch and order rows. `W-211` is urgent because its order is close to due date and it is in the constrained Dryer step.

### Step 6 - Review Capacity Board

Click the `Capacity Board` tab.

Click the `Dryer / 18 Jun B` critical cell.

Expected result:

- The right-side inspector changes to capacity context.
- The capacity drill opens if the cell is clicked.
- Planned load is `118%`.
- Available capacity is `1260 min`.
- The cell note says `220 min overload: 4 heavy-wash batches, 1 rewash child`.
- Recovery action says `Move W-204, hold W-211, approve 2.5h overtime`.

Operator understanding:

The capacity board turns the red KPI into shift-bucket evidence. The operator can see the exact date, shift, machine group, overload, reserve, and suggested action.

### Step 7 - Build Or Review A Wash Batch

Click the `Batch Builder` tab.

Expected starting state:

- The demand queue shows six demand rows.
- `ORD-1088` and `ORD-1106` are already in the batch composition.
- The batch composition total is `2,200 pcs / 124kg`.
- Rule validation shows route compatibility and shade compatibility passing, while dryer capacity remains an action item.

Click the checkbox for `ORD-1092`, then click `Add selected demand`.

Expected result:

- The local batch composition adds selected demand if it is not already present.
- A status message confirms how many rows were added.
- If the selected row is already present, the screen warns that it is already in the proposed batch.

Click `Remove` on a composition row.

Expected result:

- The row is removed from the proposed batch.
- A status message confirms demand was removed.

Click `Preview batch creation`.

Expected result:

- An impact preview opens.
- It shows before/after impact for dryer load, late risk, and changeover.

Operator understanding:

Batch composition is not only grouping by order. The operator must check route, recipe, machine group, load minimum, shade lot compatibility, dryer capacity, and rewash reserve before treating a proposed batch as feasible.

### Step 8 - Test Timeline Moves And Planning Zones

Click the `Machine Timeline` tab.

Expected screen:

- Machines are shown as rows.
- Time buckets are shown as columns: `08:00`, `10:00`, `12:00`, `14:00`, `16:00`, `18:00`.
- Batch blocks are draggable.
- Idle, down, setup, overload, open, and reserve slots use different visual states.

With planning zone set to `Firm`, drag `W-204` from Tonello 125-1 at `10:00` to an open slot.

Expected result:

- The move does not apply immediately.
- A firm-zone change impact preview opens.
- The status message says the move is blocked until impact preview is approved.

Click `Approve and apply`.

Expected result:

- The moved batch appears in the target slot.
- The original slot is shown as open.
- A status message confirms the move.

Switch the planning zone to `Volatile`.

Drag another batch into an open slot.

Expected result:

- The move is staged directly without approval.
- A status message confirms the batch was staged in the volatile zone.

Click the Dryer 02 `Idle` slot at `12:00`.

Expected result:

- An idle reason modal opens.
- `Waiting prior process` is preselected.
- Other choices include no lot available, machine breakdown, dryer not available, operator unavailable, and recipe missing.

Click `Capture reason`.

Expected result:

- The modal closes.
- A status message confirms the idle reason was captured.

Click the Dryer 02 `Over` block at `14:00`.

Expected result:

- An overload impact preview opens.

Operator understanding:

The same drag action behaves differently depending on the planning zone. Firm-zone changes need approval. Volatile and future changes can be staged. Idle reason capture explains why actual utilisation can be lower than planned utilisation.

### Step 9 - Work Through Exceptions

Click the `Exceptions` tab.

Click `Preview` for `EX-501`.

Expected result:

- The exception approval modal opens.
- It explains the Tonello 125-2 breakdown.
- It shows affected batches, capacity impact, approval owner, status, and suggested recovery.

Click `Approve exception`.

Expected result:

- The exception status becomes approved in the local screen state.
- The right-side inspector changes to the exception.
- A status message says the recovery action is ready for application.

Repeat preview for:

- `EX-506` to understand dryer overload.
- `EX-512` to understand rewash child creation.
- `EX-518` to understand recipe missing governance.

Operator understanding:

The exception tab separates "this is visible as a problem" from "this is approved to act on." The operator should preview impact before approving the exception.

### Step 10 - Review Adherence

Click the `Adherence` tab.

Click `Open adherence drill`.

Expected result:

- A KPI drill opens for Plan adherence.
- It explains machine, sequence, and start-time adherence.
- It names affected batches such as `W-202`, `W-204`, `W-214`, and `W-219`.

Operator understanding:

The mock shows that a plan can look capacity-feasible but still fail operationally when sequence, start time, and machine adherence drift.

### Step 11 - Review Masters And Rules

Click the `Masters & Rules` tab.

Expected result:

- Machine eligibility is visible by machine group, recipe family, min/max load, customer restrictions, stages, and governance.
- Planning-zone governance explains:
  - Future zone: tentative resource-group load and batch suggestions.
  - Volatile zone: rebatch and resequence with downstream impact and reason capture.
  - Firm zone: specific machine, shift, sequence, and batch are frozen.

Operator understanding:

The mock is showing why not every technically open machine slot is valid. Recipes, customer restrictions, load limits, and planning zones govern the next allowed action.

### Step 12 - Use The Right-Side Inspector

Throughout the journey, use the right-side inspector tabs:

- `Summary`: next valid action and current selected item.
- `Route`: route position for selected batch.
- `Capacity`: before and after impact metrics.
- `Quality`: QC status, rewash reserve, and shade family.
- `Exceptions`: top related exceptions.
- `Audit`: recent local mock audit events.

When a batch is selected:

- Click `Open detail` to see route, quantity, recipe, machine, risk, compatible alternates, and available actions.
- Click `Preview move` when QC is pending.
- Click `Create rewash` when the selected batch is eligible for rewash child creation.

When a stage, machine, capacity cell, exception, or demand row is selected:

- Click `Impact preview` or `Preview action` to open before/after impact.

Operator understanding:

The inspector is the context panel. It turns whatever the operator clicked into operational meaning and a next valid action.

## 5. CTA Reference Matrix

| CTA or interaction | Where it appears | Expected mock behavior |
| --- | --- | --- |
| Unit selector | Header | View-only selector in the mock. No state change. |
| Date horizon selector | Header | View-only selector in the mock. No state change. |
| Recalculate | Header | Toggles actual overlay and shows schedule recalculated feedback. |
| Planning zone buttons | Header | Changes zone and updates move-governance behavior. |
| Search demand | Header | Filters demand rows locally. |
| Actual overlay on / Planned only | Header | Toggles planned-vs-actual display mode. |
| Preview action | Header or inspector | Opens an impact preview modal. |
| KPI cards | KPI strip | Open KPI explanation, affected records, and suggested actions. |
| Flow map nodes | Flow map | Change selected inspector context to that flow stage. |
| Late batch rows | Live Flow | Open batch detail and select the batch in the inspector. |
| Preview dryer recovery | Live Flow | Opens before/after impact preview for dryer recovery. |
| Capacity cells | Capacity Board | Select capacity context and open capacity drill. |
| Add selected demand | Batch Builder | Adds checked demand to local batch composition. |
| Demand order link | Batch Builder | Selects demand in the inspector. |
| Suggested compatible group | Batch Builder | Opens impact preview. |
| Remove | Batch composition | Removes demand from local composition. |
| Preview batch creation | Batch composition | Opens impact preview for the proposed batch. |
| Machine row label | Machine Timeline | Opens machine utilisation drill. |
| Batch slot | Machine Timeline | Opens batch detail. Dragging starts a possible move. |
| Open slot drop | Machine Timeline | Accepts dropped batch according to zone rules. |
| Idle slot | Machine Timeline | Opens idle reason capture. |
| Overload slot | Machine Timeline | Opens impact preview. |
| Preview | Exceptions | Opens exception approval modal. |
| Approve exception | Exception modal | Updates exception status locally and shows feedback. |
| Open adherence drill | Adherence | Opens Plan adherence KPI drill. |
| Open detail | Inspector | Opens selected batch detail. |
| Preview move | Inspector | Opens impact preview for selected batch. |
| Create rewash | Inspector or modal | Opens rewash modal and then shows child-batch feedback. |
| Close / Esc | Any modal | Closes the modal. |

## 6. E2E Testing Story Acceptance

Use this as the operator-facing acceptance story:

1. Operator opens `/wash/scheduler` and is not sent to login.
2. Operator reads that Dryer is the active CCR and understands that Wet Wash output depends on downstream Dryer capacity.
3. Operator drills into KPI, flow map, batch, capacity, machine, exception, adherence, and inspector views without leaving the workspace.
4. Operator uses every major CTA and receives visible feedback, a modal, a selection change, or a local state change.
5. Operator can preview impact before approving a recovery action.
6. Operator can approve an exception and see local status feedback.
7. Operator can capture an idle reason and understand why actual utilisation differs from plan.
8. Operator can build a proposed wash batch and see rule validation before previewing batch creation.
9. Operator can drag a batch in Firm zone and see approval required before the move applies.
10. Operator can switch to Volatile or Future zone and stage a move directly.
11. Operator can explain how washing output will be released to finishing only after route, capacity, QC, and exception checks are acceptable.

## 7. Demo Guidance For Operators

When trying the mock, read the screen in this order:

1. KPI strip: identifies the highest risk.
2. Flow map: confirms whether the issue is upstream, current step, or downstream.
3. Live Flow: shows the immediate operational action.
4. Capacity Board: proves the action at machine-group and shift level.
5. Batch Builder: checks whether demand can be grouped safely.
6. Machine Timeline: tests exact sequence and machine placement.
7. Exceptions: governs actions that need approval.
8. Adherence: explains plan drift.
9. Masters & Rules: explains why a move is allowed, blocked, or requires governance.
10. Inspector: keeps the selected item, next valid action, quality status, exceptions, and audit trail visible.

Status colors should be read semantically:

- On track: no immediate intervention.
- Watch: monitor or prepare action.
- Action: operator or manager action is needed.
- Critical: current plan creates red risk or capacity failure.

The most important operator lesson is:

Do not treat washing as an isolated machine schedule. Laundry decisions must respect sewn WIP readiness before washing and finishing readiness after washing. In this mock state, Dryer recovery is the governing decision before more Wet Wash release should proceed.

## 8. Mock Limitations

- Changes reset on page refresh.
- No backend records are created.
- Approval, audit, and exception state are simulated in the browser.
- Unit and date selector buttons are visual only in this mock.
- Values are scenario fixtures, not live production data.
- The route is intended as a public mock preview for operator testing.

