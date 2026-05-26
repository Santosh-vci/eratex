# Front-End UI Addendum Specification  
# Handheld Shopfloor Input Screens and Live Planning Workbenches  
# Eratex Planning & Scheduling Tool

**Company:** Eratex  
**Product:** End-to-End Planning & Scheduling Tool  
**Document Type:** Front-End UI Addendum + Handoff-Level Implementation Specification  
**Related Document:** Eratex Front-End UI Thesis & Implementation Specification  
**Manufacturing Scope:** Denim Bottoms + Chinos  
**Version:** 1.0  
**Date:** 2026-05-26  

---

## 1. Purpose of This Addendum

This addendum extends the earlier front-end UI thesis by adding a missing but critical requirement: **handheld / tablet shopfloor input screens** and additional **live planning workbench screens**.

The earlier MVP surfaces focus on planning, readiness, workcenter load, WIP, wash planning, exceptions, and shipment readiness. However, these surfaces can only remain accurate if live production inputs are captured from the shop floor.

Without handheld or low-friction shopfloor input screens, the system will face the same problem as the current planning environment:

```text
The planning board will exist in the system,
but actual execution truth will continue to live in Excel,
WhatsApp, paper slips, verbal updates, and end-of-day manual entries.
```

Therefore, shopfloor live capture should not be treated as a distant future feature. It should be considered **MVP-adjacent** and should be introduced either in MVP Phase 2 or immediately after MVP core planning screens.

---

## 2. Core Addendum Thesis

The planning system is only as good as the freshness of its actuals.

For Eratex-scale denim and chinos manufacturing, the front end must support two layers:

```text
1. Planner-facing workbenches
   Used for planning, release, constraint management, and recovery.

2. Shopfloor-facing handheld screens
   Used for live output, WIP movement, defects, holds, downtime, handover, and issue capture.
```

The desktop UI tells the planner what should happen.

The handheld UI tells the system what is actually happening.

Both are mandatory for a live planning system.

---

## 3. Why Handheld Screens Are Necessary

### 3.1 Planning Without Live Actuals Becomes Stale

If production actuals are entered only at end of day, then the planning system cannot detect problems early.

Example:

```text
Morning plan: Line 5 should produce 700 pcs.
Actual by 2 PM: only 280 pcs.
If the system knows this at 2 PM, recovery is possible.
If the system knows this tomorrow morning, the recovery window is lost.
```

### 3.2 Shopfloor Reality Changes Hourly

Live events that affect planning include:

- operator absenteeism
- machine breakdown
- line output shortfall
- bundle shortage
- trim shortage
- QC hold
- wash machine delay
- rewash requirement
- finishing pile-up
- packing shortage
- inspection hold
- shipment documentation blocker

These cannot be captured properly through only desktop planning screens.

### 3.3 Excel Dependency Will Continue Without Live Capture

If supervisors still have to maintain Excel and then someone updates the planning system later, users will continue treating Excel as the real execution layer.

The tool must replace the daily update loop, not add another layer.

---

## 4. Addendum Scope

This addendum specifies the following additional front-end surfaces:

```text
1. Handheld Shopfloor Home
2. Line Supervisor Output Capture
3. Operation / Bundle Progress Capture
4. QC Defect and Hold Capture
5. Wash Batch Execution Capture
6. Finishing and Packing Output Capture
7. Downtime and Constraint Event Capture
8. Department Handover Capture
9. Shopfloor Issue / Andon Screen
10. Live Production Control Board
11. Live Constraint Recovery Workbench
12. Live Plan vs Actual Command Screen
13. Supervisor Shift Closure Screen
14. Offline / Poor Network Capture Pattern
```

These screens extend the earlier MVP by closing the loop between plan and actual.

---

# Part A: Handheld / Tablet Shopfloor Screens

---

## 5. Surface 1: Handheld Shopfloor Home

### 5.1 Purpose

Provide each supervisor with a simple, role-specific daily action screen.

### 5.2 Primary Users

- cutting supervisor
- sewing line supervisor
- washing supervisor
- finishing supervisor
- packing supervisor
- QC supervisor
- floor manager

### 5.3 Route

```text
/mobile/home
```

or responsive route:

```text
/shopfloor
```

### 5.4 Screen Layout

Handheld screen should show:

```text
My department
My assigned line / workcenter
Today’s active orders
Pending updates
Open issues
Output capture button
Defect capture button
Handover button
Shift closure button
```

### 5.5 UI Design Rules

- large touch targets
- minimal typing
- barcode / QR scan support
- quick quantity entry
- voice note or photo optional
- offline-safe draft mode
- no dense table layout
- single-hand usage where possible
- most actions within 2 taps

### 5.6 Acceptance Criteria

- Supervisor can open today’s assigned work within one tap.
- Supervisor can update output without navigating through desktop-style grids.
- Open issues assigned to the supervisor are visible immediately.

---

## 6. Surface 2: Line Supervisor Output Capture

### 6.1 Purpose

Capture live sewing output by line, order, operation block, hour, and shift.

### 6.2 Primary Users

- sewing line supervisor
- floor IE
- production controller

### 6.3 Route

```text
/mobile/sewing-output
```

### 6.4 Required Inputs

```text
Line
Order
Style
Operation group or checkpoint
Hour / time slot
Gross output quantity
Rejected / defect quantity
Rework quantity
Net good quantity
Remarks
```

### 6.5 Preferred Capture Methods

```text
Scan bundle ticket
Select active order
Enter quantity
Select defect if any
Submit
```

### 6.6 UI Fields

| Field | Input Type |
|---|---|
| Line | preselected from user profile |
| Active order | card selection |
| Time slot | auto-detected, editable |
| Output qty | numeric keypad |
| Defect qty | numeric keypad |
| Rework qty | numeric keypad |
| Defect type | quick buttons |
| Remark | optional text / voice note |

### 6.7 Validation Rules

- Output cannot exceed issued bundle quantity unless override is approved.
- Net good quantity should be calculated.
- Defect quantity should create QC visibility.
- Rework quantity should feed rework capacity.
- Output entry should update line target vs actual in near real time.

### 6.8 Acceptance Criteria

- Supervisor can enter hourly output in less than 30 seconds.
- Line loading surface reflects output update.
- Net-good output updates separately from gross output.

---

## 7. Surface 3: Operation / Bundle Progress Capture

### 7.1 Purpose

Track bundle or operation-level progress where granular WIP visibility is needed.

### 7.2 Primary Users

- sewing supervisor
- IE team
- production controller
- QC

### 7.3 Route

```text
/mobile/bundle-progress
```

### 7.4 Capture Options

```text
Scan bundle
Select operation group
Mark started
Mark completed
Enter quantity
Report hold
Report shortage
```

### 7.5 Key Use Cases

- cut bundle issued to line
- bundle started in sewing
- front prep completed
- back prep completed
- assembly completed
- end-line completed
- bundle sent to wash

### 7.6 UI States

```text
Not started
In progress
Partially completed
Held
Completed
Transferred
```

### 7.7 Acceptance Criteria

- Bundle movement updates WIP stage.
- Held bundle creates exception option.
- Completed bundle becomes eligible for next department handover.

---

## 8. Surface 4: QC Defect and Hold Capture

### 8.1 Purpose

Allow QC users to capture defects and holds at source.

### 8.2 Primary Users

- inline QC
- end-line QC
- wash QC
- final QC
- QC manager

### 8.3 Route

```text
/mobile/qc-capture
```

### 8.4 QC Stages

```text
Fabric QC
Cut panel QC
Inline sewing QC
End-line QC
Pre-wash QC
Post-wash QC
Finishing QC
Final QC
AQL inspection
```

### 8.5 Required Inputs

```text
Order
Style
Line / workcenter
Inspection stage
Checked quantity
Passed quantity
Defect quantity
Defect type
Severity
Hold decision
Photo evidence
Responsible process
```

### 8.6 Defect Capture UI

Use quick defect buttons:

```text
Open seam
Broken stitch
Oil stain
Wrong trim
Measurement issue
Shade issue
Wash effect issue
Hand feel issue
Damage
Packing issue
Other
```

### 8.7 Hold Logic

If hold is selected, user must enter:

```text
Hold reason
Affected quantity
Owner
Expected resolution time
```

### 8.8 Acceptance Criteria

- QC hold immediately appears on WIP and exception screens.
- Defects feed quality-adjusted capacity.
- Photo evidence can be attached where required.

---

## 9. Surface 5: Wash Batch Execution Capture

### 9.1 Purpose

Capture actual wash execution and rewash decisions from the wash floor.

### 9.2 Primary Users

- washing supervisor
- wash machine operator
- wash QC
- production planner

### 9.3 Route

```text
/mobile/wash-execution
```

### 9.4 Required Inputs

```text
Batch ID
Machine
Wash route step
Start time
End time
Quantity processed
Result
Shade status
Hand-feel status
Measurement status
Rewash required
Hold reason
```

### 9.5 Wash Step Actions

```text
Start step
Pause step
Complete step
Mark issue
Mark rewash required
Send to post-wash QC
Release to finishing
```

### 9.6 Rewash Logic

When rewash is selected, capture:

```text
Reason: shade / hand feel / measurement / effect / stain / other
Quantity affected
Suggested route
Expected extra time
Approval required flag
```

### 9.7 Acceptance Criteria

- Wash planning board updates batch status live.
- Rewash creates capacity load.
- Post-wash QC status controls release to finishing.

---

## 10. Surface 6: Finishing and Packing Output Capture

### 10.1 Purpose

Capture finishing, checking, pressing, packing, and carton progress.

### 10.2 Primary Users

- finishing supervisor
- packing supervisor
- QC
- shipment team

### 10.3 Route

```text
/mobile/finishing-packing
```

### 10.4 Required Inputs

```text
Order
Style
Finished quantity
Pressed quantity
Packed quantity
Rejected quantity
Cartons closed
Cartons pending
Packing material issue
Label / barcode issue
```

### 10.5 Key Actions

```text
Update finishing output
Update packing output
Report packing shortage
Report label issue
Mark carton closed
Send to shipment readiness
```

### 10.6 Acceptance Criteria

- Shipment readiness surface updates finished and packed quantity.
- Packing blockers create shipment exceptions.
- Short quantity risk is visible before dispatch date.

---

## 11. Surface 7: Downtime and Constraint Event Capture

### 11.1 Purpose

Capture events that reduce capacity in real time.

### 11.2 Primary Users

- line supervisor
- workcenter supervisor
- maintenance user
- production controller

### 11.3 Route

```text
/mobile/downtime
```

### 11.4 Event Types

```text
Machine breakdown
Operator absenteeism
Material shortage
Trim shortage
Quality hold
Power issue
Wash machine delay
Chemical shortage
No input WIP
Changeover delay
Supervisor escalation
Other
```

### 11.5 Required Inputs

```text
Workcenter
Order affected
Start time
Expected duration
Actual duration
Capacity impact
Owner
Recovery action
```

### 11.6 Acceptance Criteria

- Downtime event reduces available capacity.
- Workcenter load monitor reflects capacity loss.
- Critical downtime creates exception automatically.

---

## 12. Surface 8: Department Handover Capture

### 12.1 Purpose

Formalize live handover between departments.

### 12.2 Primary Users

- department supervisors
- QC
- production controller

### 12.3 Route

```text
/mobile/handover
```

### 12.4 Handover Points

```text
Fabric warehouse → cutting
Cutting → sewing
Sewing → wash
Wash → finishing
Finishing → packing
Packing → shipment
```

### 12.5 Handover Fields

```text
From department
To department
Order
Style
Quantity
Bundle / batch IDs
QC status
Open issues
Accepted by
Timestamp
Photo / remarks
```

### 12.6 Acceptance Criteria

- Next department cannot unknowingly accept incomplete work.
- Handover updates WIP stage.
- Quantity mismatch creates exception.

---

## 13. Surface 9: Shopfloor Issue / Andon Screen

### 13.1 Purpose

Allow supervisors to raise urgent issues quickly.

### 13.2 Route

```text
/mobile/andon
```

### 13.3 Issue Types

```text
Need material
Need mechanic
Need QC
Need supervisor
Need trims
Need wash decision
Need planning decision
Need maintenance
Need shipment decision
```

### 13.4 UI Behavior

The screen should use large buttons.

Example:

```text
RED: Line stopped
YELLOW: Risk of delay
BLUE: Need support
GREEN: Resolved
```

### 13.5 Required Inputs

```text
Issue type
Order / line / workcenter
Description
Photo optional
Urgency
```

### 13.6 Acceptance Criteria

- Critical issue appears in exception board immediately.
- Owner is auto-suggested based on issue type.
- Resolution time is tracked.

---

# Part B: Additional Live Planning Workbench Screens

---

## 14. Surface 10: Live Production Control Board

### 14.1 Purpose

Give production control a real-time view of plan vs actual across departments.

### 14.2 Primary Users

- production controller
- planner
- production head
- department managers

### 14.3 Route

```text
/live-control
```

### 14.4 Layout

```text
Top: Shift-level KPI cards
Middle: Department plan vs actual
Bottom: exceptions and recovery actions
Right drawer: selected order/workcenter detail
```

### 14.5 KPI Cards

```text
Today planned quantity
Today actual quantity
Net good output
Plan adherence %
Critical blockers
Shipments affected today
Current constraint
```

### 14.6 Department Rows

```text
Cutting
Sewing
Dry process
Wet wash
Finishing
Packing
Final QC
Shipment
```

### 14.7 Columns

```text
Planned today
Actual till now
Variance
Expected end-of-day
WIP waiting
Oldest WIP age
Risk
Required recovery
```

### 14.8 Acceptance Criteria

- Production controller can see live plan vs actual in one screen.
- Variance updates from handheld entries.
- End-of-day risk is visible before shift ends.

---

## 15. Surface 11: Live Constraint Recovery Workbench

### 15.1 Purpose

Help planners respond when the constraint shifts during the day.

### 15.2 Route

```text
/live-recovery
```

### 15.3 Trigger Conditions

This workbench should be used when:

```text
Workcenter utilization crosses threshold
Queue ageing crosses threshold
Line output falls below target
Wash batch delayed
Critical shipment risk worsens
High rework appears
```

### 15.4 Required Sections

```text
Current constraint
Affected orders
Affected shipments
Root cause candidates
Available recovery options
Capacity impact preview
Owner assignment
Recovery action tracking
```

### 15.5 Recovery Options

Examples:

```text
Add overtime
Move order to alternate line
Split order across lines
Resequence wash batches
Prioritize high-risk shipment
Move skilled operators
Escalate vendor/material issue
Outsource wash, if allowed
Add finishing manpower
Pull forward packing
```

### 15.6 Acceptance Criteria

- User can see why the constraint is critical.
- User can compare recovery actions.
- Recovery action updates exception board and plan.

---

## 16. Surface 12: Live Plan vs Actual Command Screen

### 16.1 Purpose

Show whether the day’s plan will still be achieved.

### 16.2 Route

```text
/plan-vs-actual/live
```

### 16.3 Key Views

```text
By order
By line
By workcenter
By department
By shipment
```

### 16.4 Fields

```text
Planned quantity
Actual quantity
Variance
Remaining quantity
Hours remaining
Required run rate
Current run rate
Projected end-of-day output
Risk
```

### 16.5 Acceptance Criteria

- User can identify whether a line/workcenter/order will miss today’s target.
- Required run rate is visible.
- Shortfall can trigger recovery action.

---

## 17. Surface 13: Supervisor Shift Closure Screen

### 17.1 Purpose

Ensure shift-end actuals, blockers, and handovers are complete.

### 17.2 Route

```text
/mobile/shift-closure
```

### 17.3 Required Closure Checklist

```text
Output entered
Defects entered
WIP handed over
Open issues listed
Downtime entered
Rework identified
Pending material issues recorded
Next shift instruction added
Supervisor confirmation
```

### 17.4 Acceptance Criteria

- Supervisor cannot close shift with missing mandatory updates.
- Next shift sees pending issues and handover notes.
- Daily performance report uses shift closure data.

---

## 18. Surface 14: Offline / Poor Network Capture Pattern

### 18.1 Purpose

Support shopfloor usage where network is unstable.

### 18.2 UI Behavior

Handheld screens should support:

```text
Save draft locally
Show unsynced badge
Retry sync
Conflict warning
Supervisor confirmation before overwrite
Timestamp retained from original entry
```

### 18.3 Required Status Labels

```text
Synced
Unsynced
Sync failed
Conflict
Submitted
```

### 18.4 Acceptance Criteria

- User can capture output during poor connectivity.
- Unsynced entries are visible.
- System prevents silent data loss.

---

# Part C: Integration with Existing MVP Screens

---

## 19. How Handheld Inputs Update MVP Surfaces

| Handheld Input | Updates MVP Surface |
|---|---|
| Sewing output | Sewing Line Loading, Workcenter Load, Order Lifecycle |
| Defect capture | Exceptions, WIP, Sewing, Quality |
| Wash step completion | Wash Planning, WIP, Order Lifecycle |
| Rewash required | Wash Planning, Workcenter Load, Exceptions |
| Finishing output | Shipment Readiness, WIP |
| Packing output | Shipment Readiness |
| Downtime | Workcenter Load, Exceptions |
| Handover | WIP and Queue Monitoring |
| Shift closure | Live Control Board, Daily Review |

---

## 20. Recommended Reclassification of Scope

The earlier document treated mobile/shopfloor updates as mature-state. This addendum recommends reclassifying it as follows:

| Surface | Scope Recommendation |
|---|---|
| Handheld Shopfloor Home | MVP-adjacent / Phase 2 |
| Sewing Output Capture | MVP-adjacent / Phase 2 |
| Wash Execution Capture | MVP-adjacent / Phase 2 |
| QC Defect and Hold Capture | MVP-adjacent / Phase 2 |
| WIP/Handover Capture | MVP-adjacent / Phase 2 |
| Downtime Capture | Phase 3 |
| Finishing/Packing Capture | Phase 3 |
| Andon Issue Capture | Phase 3 |
| Live Production Control Board | Phase 3 |
| Live Constraint Recovery Workbench | Phase 4 |
| Live Plan vs Actual Command Screen | Phase 3 |
| Shift Closure | Phase 3 |
| Offline Capture | Phase 3, but architecture should allow it from start |

---

# Part D: API and Data Requirements

---

## 21. Output Capture Payload

```json
{
  "entryId": "OUT-1001",
  "timestamp": "2026-05-26T14:00:00+05:30",
  "factoryId": "F01",
  "workcenterId": "SEWING_LINE_05",
  "orderId": "ORD-1001",
  "styleCode": "STY-5001",
  "processStage": "SEWING",
  "grossQty": 320,
  "defectQty": 18,
  "reworkQty": 12,
  "netGoodQty": 290,
  "enteredBy": "SUP-001",
  "source": "HANDHELD"
}
```

## 22. Downtime Event Payload

```json
{
  "eventId": "DT-9001",
  "timestamp": "2026-05-26T11:30:00+05:30",
  "workcenterId": "WET_WASH",
  "orderId": "ORD-1001",
  "eventType": "MACHINE_BREAKDOWN",
  "startTime": "2026-05-26T11:15:00+05:30",
  "expectedDurationMinutes": 90,
  "actualDurationMinutes": null,
  "capacityImpactQty": 600,
  "owner": "Maintenance",
  "status": "OPEN"
}
```

## 23. Handover Payload

```json
{
  "handoverId": "HND-1001",
  "fromDepartment": "SEWING",
  "toDepartment": "WASH",
  "orderId": "ORD-1001",
  "batchOrBundleIds": ["BND-1", "BND-2"],
  "quantity": 800,
  "qcStatus": "PASSED",
  "openIssues": [],
  "acceptedBy": "WASH-SUP-01",
  "timestamp": "2026-05-26T16:20:00+05:30"
}
```

## 24. QC Capture Payload

```json
{
  "inspectionId": "QC-1001",
  "orderId": "ORD-1001",
  "stage": "POST_WASH_QC",
  "checkedQty": 500,
  "passedQty": 460,
  "defectQty": 40,
  "defectType": "SHADE_VARIATION",
  "severity": "RED",
  "holdRequired": true,
  "responsibleProcess": "WASH",
  "photoUrl": null,
  "enteredBy": "QC-USER-01"
}
```

---

# Part E: Front-End Implementation Notes

---

## 25. Device and Form Factor Requirements

### 25.1 Handheld

Target:

```text
Android handheld device
mobile browser or PWA
portrait orientation
touch-first UI
```

### 25.2 Tablet

Target:

```text
10-inch tablet
supervisor dashboard
line-level and workcenter-level views
portrait and landscape
```

### 25.3 Desktop

Target:

```text
planner workbench
control room
management review
large grids
multi-panel views
```

---

## 26. PWA Recommendation

The handheld layer should preferably be implemented as a PWA or responsive web app.

Required PWA capabilities:

```text
home-screen shortcut
session persistence
offline draft storage
background sync, if feasible
camera access for photo evidence
barcode / QR scanning support
```

---

## 27. Mobile UI Standards

### 27.1 Touch Targets

Minimum touch target should be large enough for shopfloor usage.

Recommended:

```text
Primary buttons: 48 px height or more
Numeric fields: large keypad interaction
Status actions: large selectable cards
```

### 27.2 Input Minimization

Avoid typing.

Prefer:

```text
scan
tap
select
numeric keypad
quick defect buttons
pre-filled line/order
```

### 27.3 Error Prevention

Use:

```text
confirmation for high-impact actions
inline validation
quantity range validation
duplicate entry warning
unsynced data warning
```

---

## 28. Suggested Front-End Modules

```text
modules/
  shopfloor-home/
  mobile-output-capture/
  mobile-qc-capture/
  mobile-wash-execution/
  mobile-handover/
  mobile-downtime/
  mobile-andon/
  live-control-board/
  live-recovery/
  live-plan-actual/
  shift-closure/
```

Shared components:

```text
MobileActionCard
NumericQtyInput
ScanInput
PhotoEvidenceInput
OfflineSyncBadge
SupervisorTaskCard
QuickDefectPicker
HandoverChecklist
ShiftClosureChecklist
```

---

# Part F: QA Scenarios

---

## 29. QA Scenario: Hourly Sewing Output

Given a sewing supervisor enters gross output, defect quantity, and rework quantity from a handheld screen, the sewing line loading surface must update gross output and net-good output.

## 30. QA Scenario: Wash Rework

Given a wash supervisor marks a batch as requiring rewash, the wash planning board must move the batch to rewash and workcenter load must reflect additional capacity demand.

## 31. QA Scenario: WIP Handover

Given sewing hands over 800 pieces to wash, WIP should move from “sewn waiting for wash” to the wash queue, and the wash manager should see it.

## 32. QA Scenario: QC Hold

Given QC marks 40 pieces as held due to shade variation, an exception must be created or suggested, and the affected quantity must not proceed to finishing.

## 33. QA Scenario: Downtime

Given wet wash machine breakdown is entered, available wash capacity should reduce and affected orders should appear in the live recovery workbench.

## 34. QA Scenario: Shift Closure

Given a supervisor tries to close shift without entering downtime or WIP handover, the system should show missing closure items.

## 35. QA Scenario: Offline Entry

Given a handheld device loses network, user should still save output as unsynced. When network returns, the entry should sync with original timestamp.

---

# 36. Updated MVP Recommendation

The original 10 MVP surfaces remain valid. However, to prevent the tool from becoming stale, the following should be added as **MVP-adjacent live capture surfaces**:

```text
1. Handheld Shopfloor Home
2. Sewing Output Capture
3. Wash Batch Execution Capture
4. QC Defect and Hold Capture
5. Department Handover Capture
6. Live Production Control Board
```

These do not need to be as functionally deep as mature-state modules in the first build, but their basic capture capability should exist early.

Without these, the planning screens will depend on manual update discipline and will not replace Excel.

---

# 37. Final Addendum Summary

Yes, handheld shopfloor screens are required.

For Eratex-scale garment manufacturing, the planning tool must not only plan work but also capture live execution data. The desktop planning UI and the handheld shopfloor UI must function as one closed loop:

```text
Plan
→ release
→ execute
→ capture actuals
→ detect variance
→ trigger recovery
→ protect shipment
```

The earlier MVP surfaces define the planning brain.  
This addendum defines the live execution nervous system.

Both are necessary for the product to become the real operating system of the factory.
