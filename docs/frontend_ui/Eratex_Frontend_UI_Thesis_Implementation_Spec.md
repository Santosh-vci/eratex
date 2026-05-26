# Front-End UI Thesis & Implementation Specification
# Eratex Planning & Scheduling Tool for Denim Bottoms + Chinos

**Company:** Eratex  
**Document Type:** Front-End UI Thesis + Implementation-Level Handoff Specification  
**Product:** End-to-End Garment Planning and Scheduling Tool  
**Manufacturing Scope:** Denim Bottoms + Chinos  
**Version:** 1.0  
**Date:** 2026-05-26  

---

## 1. Purpose

This document defines the front-end UI thesis and implementation specification for the Eratex Planning & Scheduling Tool.

It is intended to guide:

- UI/UX design
- front-end engineering
- back-end API contract discussions
- QA test-case preparation
- implementation phasing
- deployment planning
- stakeholder review

The document is written as a handoff-grade build specification. It translates the BRD into concrete UI surfaces, layout patterns, components, routes, user actions, states, and acceptance criteria.

---

## 2. Product Context

Eratex operates large-scale denim bottoms and chinos manufacturing. The operating flow is not limited to cutting and sewing. It includes:

```text
Customer order / PO
→ material readiness
→ fabric QC
→ PCD readiness
→ cutting
→ sewing
→ washing
→ rewash / rework
→ finishing
→ final QC
→ packing
→ shipment
```

The current business concern is that even with a planning tool such as FastReact, actual planning may still depend heavily on manual Excel files. OTIF may be above 95%, but this is being maintained through additional operating expense, while resource utilization is around 70%.

This implies that the front-end cannot be designed as a passive reporting dashboard. It must become the daily operating cockpit that helps planners and production teams make executable decisions.

---

## 3. Core UI Thesis

The UI must behave like an **operations control cockpit**, not a generic ERP module.

It must help the user answer these questions quickly:

```text
Which orders are ready?
Which orders are blocked?
Which workcenter is overloaded?
Where is WIP ageing?
Which shipment is at risk?
What can be released today?
Who owns the next action?
What recovery action is possible?
```

The UI must enforce operating discipline:

```text
No cutting without PCD readiness.
No production release without actual readiness.
No line loading without capacity visibility.
No denim planning without wash planning.
No WIP without ageing visibility.
No exception without owner and due date.
No shipment without readiness proof.
```

---

## 4. Design Principles

### 4.1 Exception-first, not list-first

The default experience should highlight risk, blockers, overload, ageing, and shipment exposure. Routine orders should be visible but should not dominate the user’s attention.

### 4.2 Readiness over schedule

A planned order is not automatically ready. The UI must distinguish:

| State | Meaning |
|---|---|
| Planned | Appears in plan |
| Ready | Required inputs are available |
| Released | Authorized for execution |
| In Progress | Work has started |
| Held | Blocked by issue |
| Completed | Process output completed |
| Shipment Ready | Dispatch conditions cleared |

### 4.3 Dense but readable

Eratex-scale operations require compact, high-density screens. Recommended style:

- compact grids
- sticky headers
- sticky first column
- collapsible filters
- right-side detail drawer
- row-level actions
- clear badges
- minimal decorative UI

### 4.4 Action-oriented

Every surface must show the next action, owner, and risk. The UI should not merely display information; it should drive action.

### 4.5 Constraint-aware

The planner must see the effect of changes on load, WIP, bottlenecks, and shipment risk before confirming changes.

---

## 5. Primary Roles

| Role | Primary UI Need |
|---|---|
| Management | Risk, bottleneck, OTIF exposure, recovery cost |
| Production Planner | Weekly plan, daily release, capacity, recovery |
| Merchandiser | Order lifecycle, approvals, customer blockers |
| Procurement | Material ETA, shortages, vendor delays |
| Fabric QC | Inspection queue, pass/fail/hold, PCD blockers |
| Cutting Manager | Ready-to-cut orders, cut output, bundle status |
| Sewing Manager | Line load, target vs actual, WIP, bottlenecks |
| Washing Manager | Wash queue, batch plan, rewash, machine load |
| Finishing Manager | Finishing queue, packing readiness |
| QC Manager | Holds, defects, rework, inspection risk |
| Shipment Team | Dispatch readiness, documents, inspection, short quantity |
| Shopfloor Supervisor | Output update, issue reporting, handover confirmation |

---

## 6. Information Architecture

### 6.1 MVP Navigation

```text
1. Orders
2. PCD Readiness
3. Weekly Planning
4. Daily Release
5. Workcenter Load
6. Sewing Line Loading
7. Wash Planning
8. WIP & Queues
9. Exceptions
10. Shipment Readiness
```

### 6.2 Mature Navigation

```text
1. Control Tower
2. Enquiry & Costing
3. Sampling & Approvals
4. Orders
5. Style Technical File
6. BOM & Materials
7. Procurement
8. Fabric Inward & QC
9. PCD Readiness
10. Weekly Planning
11. Daily Release
12. Workcenter Load
13. Cutting
14. Sewing
15. Washing
16. Quality
17. WIP & Queues
18. Rework & Recovery
19. Shipment
20. Master Data
21. Analytics
22. Administration
```

---

## 7. Global Application Layout

### 7.1 Application Shell

Every screen should use the same shell:

```text
Top Header
Left Navigation
Main Work Area
Right Action Drawer
```

### 7.2 Top Header

Required elements:

| Element | Purpose |
|---|---|
| Factory / unit selector | Multi-unit visibility |
| Date / horizon selector | Today, this week, next 4 weeks, custom |
| Global search | Search PO, order, style, customer, shipment |
| Alerts icon | Critical open exceptions |
| Last sync timestamp | Data freshness |
| User profile | Role and permissions |

### 7.3 Left Navigation

Requirements:

- collapsible
- role-based visibility
- badge counts for exceptions
- active route highlight
- grouped modules

### 7.4 Right Action Drawer

The right drawer is the primary detail and action pattern.

Used for:

- order summary
- PCD checklist
- release validation
- workcenter queue
- exception details
- wash batch details
- shipment checklist
- plan impact preview

Drawer sections:

```text
Summary
Status
Actions
History
Comments
Audit
```

---

## 8. Global Components

### 8.1 Status Badge

Values:

```text
Planned
Ready
Released
In Progress
Held
Completed
Shipment Ready
Late
```

### 8.2 Risk Badge

Values:

```text
Green = on track
Yellow = watch
Red = action required
Black = critical / likely miss
```

Risk badge must be used only for operational severity.

### 8.3 Readiness Checklist

Reusable component for PCD, daily release, shipment readiness, and handover.

Checklist item fields:

```text
Label
Status: passed / pending / failed / waived
Owner
Due date
Evidence
Notes
Action
```

### 8.4 Order Row

Minimum fields:

```text
Order ID
Customer
Style
Quantity
Delivery date
Current stage
Readiness status
Risk
Owner
Next action
```

### 8.5 Workcenter Load Card

Fields:

```text
Workcenter
Available capacity
Planned load
Utilization %
Queue quantity
Oldest WIP age
Constraint status
Top affected order
Recovery action
```

### 8.6 Exception Card

Fields:

```text
Exception type
Severity
Affected order
Owner
Due date
Ageing
Suggested action
Status
```

### 8.7 Timeline

Used in order lifecycle.

Must show:

```text
Planned date
Actual date
Delay
Current stage
Blocker
Owner
```

### 8.8 Empty State

Examples:

- No PCD blockers.
- No wash queue ageing.
- No shipment risks in selected week.
- No exceptions assigned to you.

### 8.9 Stale Data Indicator

All operational screens must show last updated time. If data is stale, the UI must warn the user.

---

# 9. MVP Surface Specifications

---

## 9.1 Surface 1: Order Lifecycle

### Purpose

Provide one digital thread for every order.

### Route

```text
/orders
/orders/:orderId
```

### Primary View

Dense grid with filters, risk summary cards, and order detail drawer.

### Header Cards

```text
Active orders
At-risk orders
Blocked orders
This-week shipments
PCD pending
```

### Filters

```text
Customer
Buyer
Style
Product type
Order stage
Risk
Owner
Delivery date
Factory/unit
PCD status
Shipment week
```

### Grid Columns

```text
Order ID
Customer
Style
Product Type
Quantity
Delivery Date
Current Stage
PCD Status
Production Status
Wash Status
Shipment Risk
Owner
Next Action
```

### Detail Sections

```text
Order summary
Lifecycle timeline
Material status
PCD readiness
Production plan
Sewing status
Wash status
WIP status
Quality status
Shipment readiness
Exceptions
Audit history
```

### Actions

```text
Open order
View blockers
Assign owner
Create exception
Go to PCD
Go to shipment readiness
```

### Acceptance Criteria

- User can identify current stage, owner, risk, and next action from the grid.
- User can open complete order history within two clicks.
- Order lifecycle becomes the central navigation object across the tool.

---

## 9.2 Surface 2: PCD Readiness

### Purpose

Prevent premature cutting.

### Route

```text
/pcd-readiness
/orders/:orderId/pcd
```

### Header Cards

```text
Ready for PCD
Blocked
Conditional
PCD due this week
Fabric QC pending
```

### Checklist

```text
PO confirmed
BOM frozen
Fabric received
Fabric QC passed
Shade lots mapped
Shrinkage available
Trims available
Pattern approved
Marker ready
PP sample approved
Wash standard approved
Line allocated
Wash capacity booked
QC file ready
```

### Status Values

```text
Ready
Conditionally ready
Blocked
Escalated
```

### Actions

```text
Mark item complete
Assign blocker owner
Approve conditional release
Reject release
Create exception
Release to cutting
```

### Conditional Release Must Capture

```text
Open item
Reason
Approver
Risk note
Expiry date
Affected order
```

### Acceptance Criteria

- Normal cutting release cannot happen without readiness status.
- Blocked orders show reason and owner.
- Conditional release is auditable.

---

## 9.3 Surface 3: Weekly Planning Workbench

### Purpose

Convert order book into an executable weekly cross-functional plan.

### Route

```text
/planning/weekly
```

### Layout

```text
Left panel: backlog / ready orders
Center: weekly plan board
Right drawer: capacity and impact preview
```

### Views

```text
By week
By department
By workcenter
By sewing line
By customer
By shipment week
```

### Planning Actions

```text
Add order to plan
Assign workcenter
Assign sewing line
Assign wash window
Move order
Freeze plan
Request plan change
View impact
Create recovery action
```

### Required Capacity Overlay

The board must show overload directly.

Example:

```text
Wet Wash: 132% loaded on Wednesday
Sewing Line 5: 116% loaded
Finishing: 92% loaded
```

### Acceptance Criteria

- User can build weekly plan using readiness-filtered orders.
- Capacity overload is visible before plan freeze.
- Moving an order triggers impact preview.

---

## 9.4 Surface 4: Daily Production Release

### Purpose

Release only executable work for today.

### Route

```text
/release/daily
```

### Sections

```text
Today’s planned releases
Ready to release
Blocked releases
Released today
Exceptions created today
```

### Release Types

```text
Release to cutting
Release to sewing
Release to wash
Release to finishing
Release to packing
```

### Release Validation

```text
Previous process completed
Input available
Machine/workcenter available
Manpower available
QC clearance
No unresolved hold
Next process capacity visible
```

### Actions

```text
Release
Hold
Block
Assign issue
Approve exception release
Notify department
```

### Acceptance Criteria

- User can see what is executable today.
- Blocked release has reason and owner.
- Release creates an auditable event.

---

## 9.5 Surface 5: Workcenter Load Monitor

### Purpose

Expose capacity, queue, overload, and shifting constraints.

### Route

```text
/workcenters/load
```

### Workcenters

```text
Fabric QC
Cutting
Sewing lines
Dry process
Wet wash
Drying
Finishing
Packing
Final QC
Shipment documentation
```

### Header Cards

```text
Current constraint
Highest overload
Longest ageing queue
Orders affected by bottleneck
Recovery actions open
```

### Grid Columns

```text
Workcenter
Available Capacity
Planned Load
Actual Output
Utilization %
Queue Qty
Oldest WIP Age
Constraint Status
Top Affected Order
Suggested Action
```

### Constraint Status

```text
Normal
Watch
Overloaded
Constraint
Critical constraint
```

### Actions

```text
Open queue
Open affected orders
Create recovery action
Reassign load
Simulate overtime
```

### Acceptance Criteria

- Current bottleneck is visible in one screen.
- Overload shows affected orders.
- Constraint shift is visible when queue/utilization changes.

---

## 9.6 Surface 6: Sewing Line Loading

### Purpose

Plan and monitor sewing line execution using realistic capacity.

### Route

```text
/sewing/line-loading
/sewing/lines/:lineId
```

### Header Cards

```text
Active lines
Overloaded lines
Underloaded lines
Average net-good output
Highest-risk line
```

### Grid Columns

```text
Line
Current Order
Style
SMV
Target Qty
Actual Qty
Efficiency %
Defect %
Net Good Output
Manpower
Machine Issues
Risk
```

### Line Detail Sections

```text
Today’s plan
Hourly output
Operation bulletin
Operator allocation
Machine allocation
WIP by operation
Bottleneck operation
Quality defects
Recovery actions
```

### Acceptance Criteria

- UI separates gross output from net-good output.
- Underperforming lines show likely reason.
- Line loading reflects SMV, manpower, efficiency, and quality loss.

---

## 9.7 Surface 7: Wash Planning

### Purpose

Treat washing as a core production constraint.

### Route

```text
/wash/planning
/wash/batches/:batchId
```

### Board Columns

```text
Wash queue
Dry process
Wet wash
Drying
Post-wash QC
Rewash / touch-up
Released to finishing
```

### Batch Card Fields

```text
Batch ID
Order
Style
Quantity
Shade lot
Wash route
Current step
Machine
Planned start
Planned end
Risk
Rewash flag
```

### Actions

```text
Create batch
Assign machine
Start batch
Complete step
Hold batch
Mark rewash required
Release to finishing
Create quality exception
```

### Acceptance Criteria

- Wash queue is visible by ageing and shipment risk.
- Rewash consumes visible capacity.
- Wash batch links to order and shade lot.

---

## 9.8 Surface 8: WIP and Queue Monitoring

### Purpose

Expose hidden waiting time between processes.

### Route

```text
/wip
```

### WIP Points

```text
Fabric waiting for QC
Fabric cleared but not cut
Cut panels waiting for sewing
Sewn garments waiting for wash
Washed garments waiting for finishing
Finished garments waiting for packing
Packed cartons waiting for inspection
```

### Grid Columns

```text
WIP Stage
Order
Style
Quantity Waiting
Ageing
Hold Reason
Next Process
Owner
Shipment Date
Risk
```

### Header Cards

```text
Total ageing WIP
Oldest WIP
Highest-risk WIP
WIP before current constraint
Orders blocked by WIP
```

### Actions

```text
Open order
Assign owner
Create exception
Move to next process
Hold WIP
Escalate ageing WIP
```

### Acceptance Criteria

- User can identify oldest WIP by stage.
- WIP ageing beyond threshold triggers alert.
- WIP links to shipment risk.

---

## 9.9 Surface 9: Exceptions and Alerts

### Purpose

Create structured exception management.

### Route

```text
/exceptions
/exceptions/:exceptionId
```

### Categories

```text
Approval
Material
Fabric QC
PCD
Capacity
Sewing
Wash
Quality
WIP
Shipment
System / data
```

### Board Views

```text
By severity
By owner
By department
By due date
By affected shipment
By open age
```

### Required Fields

```text
Exception ID
Type
Severity
Order
Stage
Description
Owner
Due date
Suggested action
Status
Ageing
Escalation level
```

### Actions

```text
Create
Assign owner
Change severity
Add comment
Add recovery action
Escalate
Close
Reopen
```

### Acceptance Criteria

- Critical exception cannot be saved without owner and due date.
- Exceptions can be filtered by shipment impact.
- Closure retains history.

---

## 9.10 Surface 10: Shipment Readiness

### Purpose

Distinguish production completion from actual dispatch readiness.

### Route

```text
/shipment/readiness
/orders/:orderId/shipment
```

### Header Cards

```text
Shipments due this week
Shipment-ready orders
At-risk shipments
Short quantity risk
Inspection pending
Documentation pending
```

### Grid Columns

```text
Order
Customer
Style
Shipment Date
Order Qty
Finished Qty
Packed Qty
Short Qty
Final QC
AQL / Buyer Inspection
Carton Status
Documentation
Forwarder Booking
Shipment Readiness
Risk
```

### Shipment Checklist

```text
Final QC passed
AQL passed
Packing complete
Cartons closed
Barcode / label correct
Packing list ready
Invoice ready
Forwarder booked
Shipment date confirmed
```

### Actions

```text
Mark checklist item complete
Create shipment blocker
Approve split shipment
Mark shipment ready
Hold shipment
Close shipment
```

### Acceptance Criteria

- Production complete does not automatically mean shipment ready.
- Missing dispatch blockers are visible before shipment date.
- Shipment readiness has checklist proof.

---

# 10. Mature-State UI Surfaces

The following surfaces are required after the MVP to support a full mature deployment.

## 10.1 Executive Control Tower

Management dashboard showing:

```text
Shipment risk
Factory utilization
Current constraint
OTIF exposure
Overtime and recovery cost
Customer-wise risk
Top exceptions
Bottleneck history
```

## 10.2 Enquiry and Costing

Pre-order feasibility surface showing:

```text
Tech pack summary
Estimated quantity
Target shipment date
Fabric lead time
Wash complexity
Capacity feasibility
Costing estimate
Promise-date risk
```

## 10.3 Sampling and Approval Tracker

Tracks:

```text
Proto sample
Fit sample
Wash sample
Size set
PP sample
Buyer comments
Resubmission count
Approval ageing
Impact on PCD
```

## 10.4 Style Technical File

Maintains:

```text
Style master
Tech pack
BOM
Operation bulletin
SMV
Machine requirement
Skill requirement
Wash route
Complexity rating
Quality checkpoints
```

## 10.5 BOM and Material Planning

Tracks:

```text
Required quantity
Consumption
Wastage
Ordered quantity
Received quantity
Short quantity
Material ETA
PCD impact
```

## 10.6 Procurement and Vendor Follow-Up

Tracks:

```text
Vendor PO
Acknowledgement
Standard lead time
Promised ETA
Actual ETA
Delay status
Affected orders
Escalation actions
```

## 10.7 Fabric Inward and Fabric QC

Tracks roll-wise inspection:

```text
Roll number
Shade lot
Width
GSM
Shrinkage
Skewing / bowing
Stretch recovery
4-point result
Pass / fail / hold
```

## 10.8 Operator Skill and Capacity

Maintains:

```text
Operator
Operation capability
Skill level
Efficiency
Quality rating
Absenteeism
Learning curve
Training need
Recommended allocation
```

## 10.9 Cutting Room

Controls:

```text
Cutting plan
Fabric relaxation
Marker
Spreading
Cut quantity
Bundle number
Cut QC
Issue to sewing
```

## 10.10 Wash Recipe and Batch Execution

Tracks actual wash execution:

```text
Recipe steps
Machine
Start/end time
Chemical/process parameters
Shade result
Measurement impact
Rewash decision
Approval status
```

## 10.11 Quality Management

Covers:

```text
Fabric QC
Cut panel QC
Inline QC
End-line QC
Pre-wash QC
Post-wash QC
Final QC
AQL
Defect codes
Root cause
```

## 10.12 Rework and Recovery

Tracks:

```text
Rework type
Quantity affected
Responsible process
Capacity required
Recovery owner
Expected completion
Shipment impact
Closure status
```

## 10.13 Calendar / Gantt Planning

Visualizes:

```text
Order Gantt
Line Gantt
Workcenter Gantt
Wash Gantt
Shipment calendar
Approval calendar
Procurement calendar
```

## 10.14 What-If Simulation

Allows scenarios:

```text
Fabric delay
Line split
Wash rework
Overtime
Shift extension
Shipment pull-forward
Capacity impact
Cost impact
Other order impact
```

## 10.15 Plan Change and Approval

Controls:

```text
Change request
Reason code
Impacted orders
Impacted capacity
Approver
Approval status
Audit trail
```

## 10.16 Department Handover

Formalizes:

```text
Warehouse to cutting
Cutting to sewing
Sewing to wash
Wash to finishing
Finishing to packing
Packing to shipment
```

## 10.17 Master Data Governance

Controls planning data:

```text
Style master completeness
BOM completeness
SMV version
Workcenter capacity
Machine master
Shift calendar
Wash recipe
Vendor lead time
Quality parameters
```

## 10.18 Performance Analytics

Tracks:

```text
OTIF
Utilization
Plan adherence
Line efficiency
Net-good output
Wash rework rate
WIP ageing
Overtime exposure
Planning accuracy
```

## 10.19 Mobile / Shopfloor Update

Supports:

```text
Today’s work
Start / stop
Output update
Defect update
Issue report
Photo capture
Handover confirmation
Recovery closure
```

## 10.20 Role-Based Home Surfaces

Each role should see:

```text
My pending actions
My exceptions
My due today items
My delayed items
My approvals
My performance summary
```

---

# 11. Cross-Surface Interaction Rules

## 11.1 Order-Centric Navigation

Every entity should route back to the order:

```text
PCD blocker → order detail
Wash batch → order detail
WIP item → order detail
Shipment blocker → order detail
Exception → order detail
```

## 11.2 Exception Creation from Any Surface

Any screen should allow issue creation:

```text
Detect issue
→ create exception
→ assign owner
→ set due date
→ link affected order
→ track closure
```

## 11.3 Readiness Gate Reuse

Same checklist component should be reused for:

```text
PCD readiness
Daily release
Shipment readiness
Department handover
Conditional release
```

## 11.4 Plan Impact Preview

Before significant changes, show:

```text
Affected order
Affected workcenter
Capacity impact
Shipment impact
Other orders affected
Required approval
```

## 11.5 Audit Pattern

Audit must be shown for:

```text
Conditional PCD release
Daily release
Plan change
Exception closure
Shipment readiness
Rework closure
Manual override
```

---

# 12. Front-End Data Contracts

## 12.1 Order Object

```json
{
  "id": "ORD-1001",
  "customer": "Customer A",
  "styleCode": "STY-5001",
  "productType": "DENIM_BOTTOM",
  "quantity": 12000,
  "deliveryDate": "2026-07-15",
  "currentStage": "SEWING",
  "riskStatus": "RED",
  "owner": "Planner A",
  "nextAction": "Resolve wash capacity overload"
}
```

## 12.2 Readiness Item

```json
{
  "key": "fabric_qc",
  "label": "Fabric QC Passed",
  "status": "PASSED",
  "owner": "Fabric QC",
  "dueDate": "2026-06-03",
  "waiverRequired": false,
  "notes": ""
}
```

## 12.3 Workcenter Load

```json
{
  "workcenterId": "WET_WASH",
  "name": "Wet Wash",
  "availableCapacity": 8000,
  "plannedLoad": 10400,
  "utilizationPercent": 130,
  "queueQuantity": 5600,
  "oldestWipAgeHours": 38,
  "constraintStatus": "CRITICAL",
  "topAffectedOrder": "ORD-1001"
}
```

## 12.4 Exception

```json
{
  "id": "EXC-9001",
  "type": "WASH_CAPACITY",
  "severity": "RED",
  "orderId": "ORD-1001",
  "description": "Wet wash load exceeds available capacity",
  "owner": "Washing Manager",
  "dueDate": "2026-06-05",
  "status": "OPEN",
  "suggestedAction": "Add wash shift or resequence low-risk batches"
}
```

## 12.5 Shipment Readiness

```json
{
  "orderId": "ORD-1001",
  "shipmentDate": "2026-07-15",
  "finishedQty": 11800,
  "packedQty": 10200,
  "shortQty": 200,
  "finalQcStatus": "PASSED",
  "aqlStatus": "PENDING",
  "documentationStatus": "PENDING",
  "readinessStatus": "AT_RISK"
}
```

---

# 13. Implementation Architecture Guidelines

## 13.1 Recommended Front-End Stack

```text
React or Next.js
TypeScript
TanStack Query for server state
TanStack Table / AG Grid for dense grids
Component library or internal design system
Recharts for charts
Role-based routing
Token-based theme system
```

## 13.2 Suggested Folder Structure

```text
src/
  app/
    layout/
    routes/
  modules/
    orders/
    pcd-readiness/
    weekly-planning/
    daily-release/
    workcenters/
    sewing/
    wash/
    wip/
    exceptions/
    shipment/
    master-data/
    analytics/
  components/
    ui/
    data-grid/
    status-badge/
    risk-badge/
    readiness-checklist/
    order-drawer/
    exception-card/
    workcenter-card/
    timeline/
  services/
    api/
    query-keys/
  types/
    order.ts
    readiness.ts
    workcenter.ts
    exception.ts
    shipment.ts
  utils/
    dates.ts
    formatting.ts
    permissions.ts
```

## 13.3 Route Priority

```text
1. /orders
2. /pcd-readiness
3. /planning/weekly
4. /release/daily
5. /workcenters/load
6. /sewing/line-loading
7. /wash/planning
8. /wip
9. /exceptions
10. /shipment/readiness
```

## 13.4 Server vs Client Logic

Backend should calculate:

```text
Readiness status
Risk status
Capacity load
Constraint flag
Shipment risk
Suggested recovery category
WIP ageing
Plan impact
```

Frontend should render:

```text
Status
Reason
Action
Owner
Impact
History
```

Do not hardcode planning logic in the frontend.

---

# 14. Grid Standards

All major grids should support:

```text
Column resize
Column pinning
Sorting
Filtering
Global search
Pagination or virtualization
Row selection
Row-level actions
Sticky header
Status/risk badge rendering
Export if role permits
```

Virtualization is recommended for Eratex-scale data.

---

# 15. Permissions and Role-Based Actions

Examples:

| Action | Allowed Roles |
|---|---|
| Approve conditional PCD | Production Head / Authorized Planner |
| Release to cutting | Planner / Cutting Manager |
| Freeze weekly plan | Planning Head / Production Planner |
| Close critical exception | Owner / Manager |
| Mark shipment ready | Shipment Team / Authorized QC |
| Override blocked release | Authorized manager only |

The frontend should hide or disable unauthorized actions, but backend must enforce permissions.

---

# 16. Notification Rules

Notify users for:

```text
Assigned exception
Critical risk change
PCD blocked near due date
Daily release blocked
Workcenter becomes critical constraint
Shipment readiness turns red/black
Plan change requires approval
```

Avoid excessive notifications for routine updates.

---

# 17. QA Scenarios for MVP

## 17.1 Order Lifecycle

Given an active order, user can view current stage, planned vs actual dates, blockers, owner, and shipment risk.

## 17.2 PCD Block

Given fabric QC is pending, order shows PCD blocked and normal release to cutting is unavailable.

## 17.3 Conditional PCD Release

Authorized user can approve conditional release with reason, owner, expiry, and audit history.

## 17.4 Weekly Plan Overload

If wet wash capacity is exceeded, weekly plan shows overload before freeze.

## 17.5 Daily Release Validation

If trims are unavailable, daily release shows blocked status and option to create exception.

## 17.6 Sewing Net-Good Output

Sewing line view shows gross output, defect rate, and net-good output separately.

## 17.7 Wash Rework

If wash batch fails shade check, user can mark rewash required and capacity reflects rewash load.

## 17.8 WIP Ageing

If sewn garments wait before wash beyond threshold, WIP surface flags ageing and affected shipment.

## 17.9 Exception Ownership

Exception cannot be saved without owner and due date.

## 17.10 Shipment Readiness

If final QC is passed but documents are pending, order must not show shipment ready.

---

# 18. Definition of Done for MVP UI

The MVP front-end is complete when:

```text
All 10 MVP routes exist.
Common shell is implemented.
Order lifecycle is navigable from every surface.
PCD readiness gate works.
Conditional release is auditable.
Weekly plan shows capacity overload.
Daily release validates readiness.
Workcenter load shows constraint status.
Sewing line loading shows net-good output.
Wash planning shows queue, batch, and rewash.
WIP surface shows ageing by stage.
Exception surface supports owner, due date, severity, and closure.
Shipment readiness uses checklist proof.
Role-based action visibility is implemented.
Major grids support sorting, filtering, and row actions.
Audit-visible actions are represented in UI.
```

---

# 19. Implementation Phases

## Phase 1: UI Foundation and Order Backbone

Build:

```text
Application shell
Navigation
Role model placeholder
Order lifecycle grid
Order detail drawer
Status and risk badges
Global filters
```

## Phase 2: Readiness and Release

Build:

```text
PCD readiness
Readiness checklist
Conditional release
Daily production release
Release validation drawer
```

## Phase 3: Planning and Capacity

Build:

```text
Weekly planning workbench
Workcenter load monitor
Capacity cards
Overload indicators
Impact preview placeholder
```

## Phase 4: Sewing and Wash

Build:

```text
Sewing line loading
Line detail view
Wash planning board
Wash batch drawer
Rewash flow
```

## Phase 5: WIP, Exceptions, Shipment

Build:

```text
WIP and queue surface
Exception management
Shipment readiness
Shipment checklist
Escalation indicators
```

## Phase 6: Mature-State Expansion

Build:

```text
Control tower
Sampling
Procurement
Fabric QC
BOM
Operator skill
Cutting
Quality
Rework
Gantt
What-if simulation
Plan change approval
Master data governance
Analytics
Mobile shopfloor
Role-based homes
```

---

# 20. Key UI Risks and Mitigation

| Risk | Mitigation |
|---|---|
| UI becomes a reporting layer | Every surface must include action, owner, next step |
| Users continue Excel | Replace daily Excel routines first |
| Too many alerts | Alert only readiness, capacity, WIP, quality, shipment risks |
| Dense UI becomes confusing | Use hierarchy, sticky columns, filters, drawers |
| Frontend hardcodes planning logic | Backend calculates status, risk, load, constraint |
| Wash is underrepresented | Include wash planning in MVP |
| Data is not trusted | Show last update, source, and audit history |
| Permission confusion | Use visible role-based actions with backend enforcement |

---

# 21. Final UI Thesis Summary

The Eratex Planning & Scheduling Tool must be designed as the daily operating cockpit for garment planning.

It should move Eratex from:

```text
Excel-based follow-up
→ system-led action

department-wise visibility
→ end-to-end order flow

nominal capacity
→ realistic net-good capacity

late firefighting
→ early exception management

sewing-centric planning
→ sewing + wash + finishing + shipment planning

production completion
→ verified shipment readiness
```

The guiding design principle is:

```text
The UI should not merely show what happened.
It should help the user decide what to do next.
```
