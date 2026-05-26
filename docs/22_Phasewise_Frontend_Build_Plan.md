# 22. Phase-wise Frontend Build Plan  
# Eratex End-to-End Planning & Scheduling Platform

**Company:** Eratex  
**Product:** Planning & Scheduling Tool for Denim Bottoms + Chinos Manufacturing  
**Document Type:** Phase-wise Frontend Build Plan  
**Version:** 2.0  
**Date:** 2026-05-26  
**Recommended Frontend Stack:** Next.js / React + TypeScript + TanStack Query + AG Grid or TanStack Table + Tailwind CSS + PWA  
**Backend Dependency:** Django REST Framework APIs under `/api/v1/`  
**Related Documents:**  
- 06 API and Data Contracts Specification  
- 08 WIP Inventory and Reconciliation Specification  
- 09 Line Routing and Operation Bulletin Specification  
- 10 Wash Planning and Execution Specification  
- 11 Exception, Alert, and Recovery Specification  
- 12 Handheld Shopfloor Capture Technical Specification  
- 13 Frontend Implementation Specification  
- 14 Analytics and Reporting Specification  
- 16 Security, Roles, and Permissions Specification  
- 19 Testing and QA Strategy  
- 20 Seed Data and Simulation Scenarios  
- 21 Phase-wise Backend Build Plan  

---

## 1. Purpose

This document defines the phase-wise frontend build plan for the Eratex Planning & Scheduling Platform.

The frontend must support two different but connected operating realities:

```text
1. Dense desktop planning and control workbenches
2. Mobile/PWA shopfloor capture screens
```

The frontend should not become a generic CRUD interface. It should become an operational control surface that helps users understand:

```text
what is planned
what is actually happening
what is blocked
what is at risk
what action is needed next
```

This build plan converts the frontend specification into sequential implementation phases and build chunks.

---

## 2. Frontend Build Thesis

The frontend should be built around operational decision surfaces, not database tables.

The key principle is:

```text
Every major screen must show status, risk, blocker, owner, and next action.
```

The frontend should help users move from:

```text
manual Excel follow-up
→ live operational visibility
→ controlled action
→ recovery tracking
→ shipment commitment protection
```

The frontend must consume backend-owned business truth. It should not duplicate core calculations such as:

```text
PCD readiness
WIP ageing
capacity utilization
shipment risk
exception severity
line efficiency
OTIF
```

---

## 3. Frontend Build Strategy

## 3.1 Build Foundation First

Before building business screens, create:

```text
application shell
auth/me integration
API client
query client
permission handling
design tokens
shared components
grid wrapper
drawer pattern
routing
error handling
```

This prevents inconsistent screens later.

## 3.2 Build Workbenches in Vertical Slices

Each module should be built as a vertical slice:

```text
route
API hook
grid/board
filters
drawer
actions
error states
tests
```

## 3.3 Build Desktop and Mobile Separately, but Share Contracts

Desktop planning screens and mobile shopfloor screens should share:

```text
API client
types
auth
permissions
status badges
error handling
offline event contracts, where applicable
```

But they should not share cramped desktop layouts.

## 3.4 Avoid Premature Visual Complexity

Build functional control first:

```text
data visibility
filters
drawer details
action buttons
state feedback
```

Then improve:

```text
drag/drop
timeline visuals
advanced charts
saved views
visual polish
```

---

## 4. Recommended Frontend Phases

```text
Phase 0: Frontend project foundation
Phase 1: App shell, auth, permissions, API client, shared components
Phase 2: Core order, PCD, and release surfaces
Phase 3: Planning and workcenter load workbenches
Phase 4: WIP pipeline and reconciliation surfaces
Phase 5: Sewing, line loading, operation bulletin, line realignment
Phase 6: Wash planning and execution surfaces
Phase 7: Exceptions, recovery, quality, and shipment readiness
Phase 8: Mobile/PWA shopfloor capture
Phase 9: Analytics and reporting dashboards
Phase 10: Integration, import, audit, and admin support surfaces
Phase 11: UX hardening, performance, testing, and release readiness
```

---

## 5. Frontend Module Structure

Recommended:

```text
src/
  app/
  modules/
    orders/
    pcd-readiness/
    planning/
    releases/
    workcenters/
    wip/
    sewing/
    wash/
    quality/
    exceptions/
    recovery/
    shipment/
    technical/
    analytics/
    integrations/
    audit/
    shopfloor-mobile/
  components/
    ui/
    layout/
    data-grid/
    status/
    forms/
    drawers/
    charts/
    mobile/
  services/
    api/
    auth/
    permissions/
    offline/
    query-keys/
  types/
    api/
    domain/
  hooks/
  utils/
```

Each module:

```text
routes/
components/
hooks/
api.ts
types.ts
constants.ts
utils.ts
tests/
```

---

# Phase 0: Frontend Project Foundation

---

## 6. Phase 0 Objective

Create the frontend project skeleton and establish the basic toolchain.

---

## 7. Phase 0 Deliverables

```text
Next.js or React/Vite project initialized
TypeScript configured
Tailwind configured
linting configured
test framework configured
routing convention established
environment variables configured
basic Dockerfile created
frontend README created
```

---

## 8. Phase 0 Stack Setup

Preferred:

```text
Next.js
React
TypeScript
Tailwind CSS
TanStack Query
React Hook Form
Zod
AG Grid or TanStack Table
Recharts
lucide-react
Playwright
Vitest/Jest
```

---

## 9. Phase 0 Environment Variables

```text
NEXT_PUBLIC_API_BASE_URL
NEXT_PUBLIC_APP_ENV
NEXT_PUBLIC_APP_VERSION
NEXT_PUBLIC_ENABLE_PWA
```

---

## 10. Phase 0 Routes

Create placeholder routes:

```text
/
 /dashboard/control-tower
 /orders
 /pcd-readiness
 /planning/weekly
 /releases/daily
 /workcenters/load
 /wip/pipeline
 /sewing/line-loading
 /wash/planning
 /exceptions/control-tower
 /shipment/readiness
 /mobile/home
```

---

## 11. Phase 0 Tests

Required:

```text
frontend build passes
typecheck passes
lint passes
test runner works
home route renders
Docker image builds
```

---

## 12. Phase 0 Exit Criteria

Complete when:

```text
developer can run frontend locally
frontend can be built in Docker
basic route shell works
test command works
```

---

# Phase 1: App Shell, Auth, Permissions, API Client, Shared Components

---

## 13. Phase 1 Objective

Build the shared frontend foundation used by all workbenches.

---

## 14. Phase 1 Deliverables

```text
AppShell
desktop layout
mobile layout baseline
left navigation
top header
breadcrumbs
API client
TanStack Query provider
auth/me integration
permission provider
error handling
toast system
shared badge components
data grid wrapper
right drawer framework
confirmation dialog
empty/loading/error states
```

---

## 15. Phase 1 Components

Create shared components:

```text
AppShell
DesktopSidebar
TopHeader
Breadcrumbs
ModuleHeader
FilterBar
DataGrid
KpiCard
StatusBadge
RiskBadge
SeverityBadge
OwnerBadge
RightDrawer
ActionButton
PermissionGate
ConfirmDialog
AuditTrailPanel
Timeline
EmptyState
LoadingState
ErrorState
StaleDataBadge
SyncStatusBadge
```

---

## 16. Phase 1 API Client

Create:

```text
services/api/client.ts
services/api/errors.ts
services/query-keys/index.ts
```

Responsibilities:

```text
base URL
auth headers/session handling
API response envelope parsing
error normalization
request cancellation
common query parameter handling
```

Common response type:

```typescript
export interface ApiResponse<T> {
  data: T;
  meta: Record<string, unknown>;
  errors: ApiError[];
}
```

---

## 17. Phase 1 Auth and Permission

APIs:

```text
GET /api/v1/me
```

Expected frontend state:

```text
current user
roles
permissions
scopes
feature flags
```

Create:

```text
AuthProvider
PermissionProvider
useCurrentUser()
usePermission()
PermissionGate
```

---

## 18. Phase 1 Navigation

Build role-aware navigation groups:

```text
Control Tower
Orders
PCD Readiness
Planning
Daily Release
Workcenters
Sewing
Wash
WIP Inventory
Quality
Exceptions
Shipment
Technical Masters
Analytics
Integrations
Audit
Mobile
Admin
```

---

## 19. Phase 1 Shared Data Grid

The grid wrapper must support:

```text
server-side pagination
sorting
filtering
row click drawer
column visibility
sticky header
loading state
empty state
error state
export button placeholder
```

Advanced saved views can come later.

---

## 20. Phase 1 Tests

Required tests:

```text
AppShell renders
navigation hides modules without permission
PermissionGate hides/disables actions
API client parses success and error responses
DataGrid renders rows and empty state
RiskBadge and StatusBadge render correct labels
RightDrawer opens and closes
```

---

## 21. Phase 1 Exit Criteria

Complete when:

```text
all later module screens can use shared shell/components
auth and permission state available
API client stable
common error patterns implemented
```

---

# Phase 2: Core Order, PCD, and Release Surfaces

---

## 22. Phase 2 Objective

Build the first operational screens that connect order readiness to controlled release.

---

## 23. Phase 2 Screens

```text
/orders
/orders/:orderId
/orders/:orderId/trace, placeholder or basic
/pcd-readiness
/releases/daily
```

---

## 24. Orders List Screen

Route:

```text
/orders
```

Components:

```text
OrderListPage
OrderGrid
OrderFilterBar
OrderDrawer
OrderLifecycleTimeline
OrderRiskSummary
```

Grid columns:

```text
order no
PO
customer
buyer
style
product type
order qty
committed shipment date
current stage
PCD status
sewing status
wash status
shipment readiness
risk
owner
open exceptions
next action
last updated
```

Actions:

```text
open drawer
open trace
open PCD
open WIP
open shipment
```

---

## 25. Order Drawer

Sections:

```text
summary
lifecycle
quantities
PCD readiness
material status
WIP position
exceptions
shipment readiness
audit timeline
```

Use lazy loading for heavier sections.

---

## 26. PCD Readiness Screen

Route:

```text
/pcd-readiness
```

Components:

```text
PcdReadinessPage
PcdGrid
PcdFilterBar
PcdDrawer
PcdChecklist
ConditionalReleasePanel
```

Header KPIs:

```text
PCD due this week
Ready
Blocked
Escalated
Conditional releases
Fabric QC blockers
Trim blockers
```

Actions:

```text
update checklist item
request conditional release
approve conditional release
release to cutting
open blockers
```

---

## 27. Daily Release Screen

Route:

```text
/releases/daily
```

Sections:

```text
Ready to Release
Blocked
Released Today
Exception Approval Pending
```

Actions:

```text
validate release
create release
request override
approve override
complete release
```

---

## 28. Phase 2 API Hooks

Create hooks for:

```text
useOrders()
useOrderDetail()
useOrderTrace()
usePcdReadiness()
usePcdDetail()
useUpdatePcdItem()
useRequestConditionalRelease()
useApproveConditionalRelease()
useReleaseToCutting()
useDailyReleases()
useValidateRelease()
useCreateRelease()
```

---

## 29. Phase 2 Business UX Rules

```text
Release to Cutting button disabled if backend says unavailable.
Disabled actions must show backend reason.
Conditional release approval requires confirmation dialog.
Release action must refresh orders, PCD, WIP, release screens.
Blocked release must show blocking items, not generic error.
```

---

## 30. Phase 2 Tests

Required:

```text
orders grid renders and filters
order drawer loads detail
PCD grid shows blocked/ready status
release to cutting disabled with reason
conditional release request form validates
release action success refreshes data
blocked release error displayed clearly
```

---

## 31. Phase 2 Exit Criteria

Complete when:

```text
user can view orders
user can manage PCD readiness
user can attempt controlled release
blocked actions show reasons
release success updates relevant screens
```

---

# Phase 3: Planning and Workcenter Load Workbenches

---

## 32. Phase 3 Objective

Build the core planner desktop workbenches for weekly planning, impact preview, workcenter load, and daily operational capacity visibility.

---

## 33. Phase 3 Screens

```text
/planning/weekly
/workcenters/load
/workcenters/:workcenterId/queue
```

---

## 34. Weekly Planning Workbench

Route:

```text
/planning/weekly
```

Layout:

```text
Top: plan header and horizon controls
Left: backlog and eligible orders
Center: planning grid/timeline
Right: capacity impact panel
Bottom: warnings/exceptions
```

Components:

```text
WeeklyPlanningPage
PlanningBacklogPanel
PlanningTimelineGrid
PlanWorkItemCard
CapacityImpactPanel
PlanWarningsPanel
PlanActionBar
PlanChangeDrawer
```

Actions:

```text
create plan
assign order/work item
edit planned dates
preview impact
freeze plan
request plan change
approve plan change
```

---

## 35. Planning MVP Interaction

Start with grid-based planning, not complex drag/drop.

MVP:

```text
select order
assign workcenter/line
set planned start/end
preview impact
save planned work item
freeze plan
```

Later:

```text
drag/drop timeline
scenario comparison
visual Gantt
```

---

## 36. Workcenter Load Monitor

Route:

```text
/workcenters/load
```

Components:

```text
WorkcenterLoadPage
WorkcenterLoadGrid
WorkcenterKpiCards
ConstraintBadge
WorkcenterDrawer
WorkcenterQueuePanel
CapacityTrendPanel
```

Header KPIs:

```text
current constraint
overloaded workcenters
queue ageing
available capacity
planned load
actual load
```

Grid columns:

```text
workcenter
type
available capacity
planned load
actual load
utilization
queue qty
oldest WIP age
constraint status
affected orders
suggested action
```

---

## 37. Phase 3 API Hooks

```text
useWeeklyPlan()
useCreatePlan()
useAssignWorkItem()
usePlanImpactPreview()
useFreezePlan()
usePlanChangeRequests()
useApprovePlanChange()
useWorkcenterLoad()
useWorkcenterQueue()
useCurrentConstraint()
```

---

## 38. Phase 3 UX Rules

```text
Impact preview must show before/after capacity.
Freeze plan must require confirmation.
Frozen plan must be visually locked.
Plan changes after freeze must route through change request.
Overloaded workcenters must expose affected orders.
Current constraint should be obvious.
```

---

## 39. Phase 3 Tests

Required:

```text
weekly plan loads
backlog filters work
assign work item form validates
impact preview renders utilization before/after
freeze confirmation works
frozen plan disables direct edit
workcenter load grid shows constraint status
workcenter drawer lists affected orders
```

---

## 40. Phase 3 Exit Criteria

Complete when:

```text
planner can create/inspect weekly plan
planner can preview capacity impact
plan freeze workflow works
workcenter load and constraint monitor works
```

---

# Phase 4: WIP Pipeline and Reconciliation Surfaces

---

## 41. Phase 4 Objective

Build the frontend surfaces that show live manufacturing inventory across the pipeline and detect quantity integrity issues.

---

## 42. Phase 4 Screens

```text
/wip/pipeline
/wip/pipeline/:stage
/wip/reconciliation
/orders/:orderId/reconciliation
```

---

## 43. WIP Pipeline Dashboard

Route:

```text
/wip/pipeline
```

Components:

```text
WipPipelinePage
WipSummaryCards
WipPipelineMap
WipStageCard
WipFilterBar
WipStageDrawer
WipActionDrawer
```

Header KPIs:

```text
total pipeline WIP
blocked WIP
ageing WIP
rework WIP
WIP before current constraint
shipment-risk WIP
shipment-ready qty
```

Pipeline:

```text
Fabric → Cutting → Sewing → Wash → Finishing → Packing → Shipment
```

Stage cards show:

```text
quantity
blocked quantity
ageing quantity
oldest age
risk status
top affected order
```

---

## 44. WIP Stage Drilldown

Route:

```text
/wip/pipeline/:stage
```

Grid columns:

```text
order
customer
style
quantity
status
ageing
hold reason
owner
next process
shipment date
shipment risk
batch/bundle
shade lot
```

Actions:

```text
open order
hold WIP
release hold
move WIP
view reconciliation
create exception
```

---

## 45. WIP Reconciliation Screen

Route:

```text
/wip/reconciliation
/orders/:orderId/reconciliation
```

Components:

```text
WipReconciliationPage
QuantityChain
ReconciliationGapPanel
KnownLossPanel
WipAdjustmentRequestForm
AuditTrailPanel
```

Visual chain:

```text
Order Qty
→ Fabric Equivalent
→ Cut
→ Issued to Sewing
→ Sewn Net Good
→ Sent to Wash
→ Washed
→ Finished
→ Packed
→ Shipment Ready
→ Dispatched
```

---

## 46. Phase 4 API Hooks

```text
useWipPipeline()
useWipStageDrilldown()
useMoveWip()
useHoldWip()
useReleaseWipHold()
useWipReconciliation()
useAdjustWip()
useOrderWipTrace()
```

---

## 47. Phase 4 UX Rules

```text
Held WIP actions must show hold reason.
Move WIP form must show source/target stage and quantity.
Manual adjustment must require reason and confirmation.
Reconciliation gaps must be visually prominent.
Order-linked WIP trace must be accessible.
```

---

## 48. Phase 4 Tests

Required:

```text
WIP pipeline summary renders
stage cards route to drilldown
stage filters work
hold WIP form validates
move WIP form blocks invalid quantity client-side
reconciliation chain renders gaps
manual adjustment requires reason
```

---

## 49. Phase 4 Exit Criteria

Complete when:

```text
users can see holistic WIP
users can drill into ageing/blocked WIP
users can view reconciliation gaps
WIP actions are controlled and linked to backend validation
```

---

# Phase 5: Sewing, Line Loading, Operation Bulletin, and Line Realignment

---

## 50. Phase 5 Objective

Build sewing execution and technical line-planning frontend surfaces.

---

## 51. Phase 5 Screens

```text
/sewing/line-loading
/sewing/line-realignment
/sewing/line-balance
/technical/operation-bulletins
/technical/operation-bulletins/:id/routing
/analytics/operation-bulletin-performance, basic placeholder if analytics later
```

---

## 52. Sewing Line Loading Screen

Route:

```text
/sewing/line-loading
```

Header KPIs:

```text
active lines
underperforming lines
net-good output
efficiency
defect rate
downtime
lines needing realignment
```

Grid columns:

```text
line
order
style
SMV
daily target
gross output
defects
rework
net-good output
efficiency
required run rate
risk
next action
```

Actions:

```text
open line detail
record output fallback
open line balance
preview realignment
create downtime
raise exception
```

---

## 53. Operation Bulletin Dashboard

Route:

```text
/technical/operation-bulletins
```

Grid columns:

```text
style
customer
version
status
total SMV
operation count
critical operations
machine types required
approval status
used in active orders
last updated
```

Actions:

```text
create draft
open routing builder
clone version
submit for approval
approve
obsolete
```

---

## 54. Operation Bulletin Routing Builder

Route:

```text
/technical/operation-bulletins/:id/routing
```

Layout:

```text
Left: operation list
Center: sequence/routing grid
Right: operation detail drawer
Bottom: machine and skill summary
```

Actions:

```text
add operation
edit SMV
reorder
mark predecessor
mark parallel
set machine type
set skill
mark QC checkpoint
mark critical operation
approve bulletin
clone version
```

---

## 55. Line Realignment Workbench

Route:

```text
/sewing/line-realignment
```

Layout:

```text
Select line and style
Current setup
Required setup
Machine gap
Skill gap
Expected output before/after
Recommendations
```

Actions:

```text
preview realignment
submit for approval
approve
apply
reject
```

---

## 56. Line Balance Board

Route:

```text
/sewing/line-balance
```

MVP:

```text
workstation table
operation allocation
load percentage
bottleneck highlight
target output
balance efficiency
```

Later:

```text
drag/drop operation cards
visual workstation board
```

---

## 57. Phase 5 API Hooks

```text
useSewingLineLoading()
useRecordSewingOutput()
useCreateDowntime()
useResolveDowntime()
useOperationBulletins()
useOperationBulletinDetail()
useUpdateBulletinLine()
useApproveBulletin()
useCloneBulletin()
useLineRealignmentPreview()
useCreateLineRealignment()
useApproveLineRealignment()
useApplyLineRealignment()
useLineBalance()
useApproveLineBalance()
```

---

## 58. Phase 5 UX Rules

```text
Net-good output must be shown separately from gross output.
Line efficiency must display backend value.
Line realignment preview must show machine/skill gaps.
Approved bulletin should be read-only.
Editing approved bulletin should require clone new version.
Line balance bottleneck should be visually highlighted.
```

---

## 59. Phase 5 Tests

Required:

```text
line loading grid renders net-good and efficiency
output fallback form calculates net-good preview
bulletin dashboard filters by status
routing builder validates SMV inputs
approved bulletin read-only
realignment preview shows gap panels
line balance identifies bottleneck row
```

---

## 60. Phase 5 Exit Criteria

Complete when:

```text
sewing performance is visible
operation bulletin can be managed
line realignment can be previewed
line balance can be reviewed and approved
```

---

# Phase 6: Wash Planning and Execution Surfaces

---

## 61. Phase 6 Objective

Build wash as a complete planning and execution frontend surface, including rewash loops.

---

## 62. Phase 6 Screens

```text
/wash/planning
/wash/batches/:batchId
/wash/capacity
```

---

## 63. Wash Planning Board

Route:

```text
/wash/planning
```

Columns:

```text
Waiting for Wash
Dry Process
Wet Wash
Drying
Post-Wash QC
Rewash
Released to Finishing
```

Header KPIs:

```text
Sewn WIP Waiting for Wash
Wash Capacity Today
Planned Wash Load
Wash Utilization %
Ageing Wash Queue
Rewash WIP
Shipment-Risk Wash WIP
Dryer Load
Post-Wash QC Pending
```

Batch card fields:

```text
batch no
order no
style
customer
wash route
shade lot
quantity
current step
planned start/end
ageing
shipment date
shipment risk
status
priority rank
```

---

## 64. Wash Batch Drawer / Detail

Sections:

```text
batch summary
route steps
current status
WIP movement
post-wash QC
rewash cycles
events timeline
exceptions
audit
```

Actions:

```text
start step
complete step
hold batch
mark rewash
release to finishing
cancel batch, if permitted
```

---

## 65. Create Wash Batch Flow

Form fields:

```text
order
wash route
shade lot
quantity
planned start/end
machine/workcenter
remarks
```

UX rules:

```text
show available WIP
block qty above available
show capacity impact
show shipment risk
```

---

## 66. Mark Rewash Flow

Form fields:

```text
reason
affected quantity
rewash route
expected extra time
remarks
evidence/photo placeholder
```

Result should show:

```text
additional load
new rewash batch ID
shipment risk after
exception ID
```

---

## 67. Phase 6 API Hooks

```text
useWashQueue()
useWashBoard()
useWashBatchDetail()
useCreateWashBatch()
useRecordWashEvent()
useMarkRewash()
useReleaseWashToFinishing()
useWashCapacity()
```

---

## 68. Phase 6 UX Rules

```text
Rewash must be visible as separate WIP/load.
Post-wash QC pending should block release to finishing.
Priority reason should be visible on queue cards.
Wash capacity overload must be prominent.
Repeated rewash cycles must be shown in batch history.
```

---

## 69. Phase 6 Tests

Required:

```text
wash board columns render
batch cards display priority/risk
create batch validates quantity
step completion updates state
mark rewash form validates reason/qty
rewash result updates board
release to finishing blocked when QC pending
```

---

## 70. Phase 6 Exit Criteria

Complete when:

```text
wash board supports planning visibility
wash batch execution is controllable
rewash loop is visible and actionable
wash capacity and shipment risk are clear
```

---

# Phase 7: Exceptions, Recovery, Quality, and Shipment Readiness

---

## 71. Phase 7 Objective

Build the frontend surfaces that convert operational problems into owned recovery actions and shipment gate control.

---

## 72. Phase 7 Screens

```text
/exceptions/control-tower
/recovery/actions
/quality/inspections
/quality/holds
/shipment/readiness
/approvals, basic if approval engine exists
```

---

## 73. Exception Control Tower

Route:

```text
/exceptions/control-tower
```

Header KPIs:

```text
Open Exceptions
RED/BLACK Exceptions
Shipment-Impacting Exceptions
Overdue Exceptions
Unassigned Exceptions
Recovery Actions Due Today
Repeated Exceptions
```

Grid columns:

```text
exception no
severity
category
order
stage/workcenter
description
owner
due date
ageing
status
shipment impact
suggested action
recovery action count
```

Actions:

```text
assign owner
start progress
create recovery action
escalate
mark resolved
close
reopen
open linked entity
```

---

## 74. Recovery Action Board

Route:

```text
/recovery/actions
```

Board columns:

```text
Open
Assigned
In Progress
Approval Pending
Completed
Failed
```

Card fields:

```text
action type
linked exception
owner
target date
capacity impact
shipment impact
approval status
```

Actions:

```text
create action
preview impact
approve
complete
mark failed
cancel
```

---

## 75. Quality Screens

Routes:

```text
/quality/inspections
/quality/holds
```

MVP views:

```text
inspection list
hold list
defect summary
hold detail drawer
release hold action
```

---

## 76. Shipment Readiness Screen

Route:

```text
/shipment/readiness
```

Header KPIs:

```text
shipments due this week
ready
blocked
AQL pending
documentation pending
short quantity
RED/BLACK shipment risk
```

Grid columns:

```text
order
customer
style
shipment date
order qty
finished qty
packed qty
short qty
final QC
AQL
documents
forwarder
readiness
risk
next action
```

Actions:

```text
update checklist
mark ready
block shipment
approve split shipment
open order
```

---

## 77. Approval Inbox

Route:

```text
/approvals
```

Cards:

```text
approval type
entity
requested by
reason
impact summary
expiry
approve/reject
```

This can be basic in MVP and expanded later.

---

## 78. Phase 7 API Hooks

```text
useExceptions()
useExceptionDetail()
useAssignException()
useEscalateException()
useCloseException()
useRecoveryActions()
useCreateRecoveryAction()
useRecoveryImpactPreview()
useCompleteRecoveryAction()
useQualityInspections()
useQualityHolds()
useReleaseQualityHold()
useShipmentReadiness()
useUpdateShipmentChecklist()
useMarkShipmentReady()
useApproveSplitShipment()
useApprovals()
useApproveRequest()
useRejectRequest()
```

---

## 79. Phase 7 UX Rules

```text
RED/BLACK exceptions must stand out.
Exception closure must require note.
Recovery impact preview must be shown before approval where available.
Shipment mark-ready should show blocked checklist items.
Split shipment approval must show short qty and impact.
Quality hold release must require resolution note.
```

---

## 80. Phase 7 Tests

Required:

```text
exception grid filters severity/status/owner
exception drawer shows timeline
close exception requires note
create recovery action validates owner/action type
impact preview renders before/after
shipment mark-ready blocked reason shown
quality hold release form validates note
approval card approve/reject works
```

---

## 81. Phase 7 Exit Criteria

Complete when:

```text
users can manage exceptions
users can create and close recovery actions
quality holds are visible
shipment readiness gates are actionable
```

---

# Phase 8: Mobile/PWA Shopfloor Capture

---

## 82. Phase 8 Objective

Build the mobile-first shopfloor capture interface, including offline event queue.

---

## 83. Phase 8 Screens

```text
/mobile/home
/mobile/sewing/output
/mobile/wash
/mobile/wash/batches/:batchId
/mobile/qc/inspection
/mobile/handover/submit
/mobile/handover/pending
/mobile/downtime
/mobile/andon
/mobile/wip/hold
/mobile/shift-closure
/mobile/sync
```

---

## 84. Mobile App Shell

Mobile layout:

```text
top user/shift context
task list/cards
bottom action navigation
sync status indicator
large buttons
minimal typing
```

Do not reuse desktop sidebar.

---

## 85. Mobile Home

Shows:

```text
assigned tasks
assigned line/workcenter
shift
open issues
pending sync count
last sync time
```

Actions:

```text
open task
sync now
raise issue
```

---

## 86. Sewing Output Capture

Fields:

```text
line
order
time slot
gross qty
defect qty
rework qty
net-good auto
remarks
```

UX:

```text
large numeric keypad
default current line/order
save offline if no network
submit with clientEventId
```

---

## 87. Wash Mobile

Shows assigned wash batches.

Actions:

```text
start step
complete step
hold batch
mark rewash
release to finishing
```

---

## 88. QC Mobile

Fields:

```text
order
stage
checked qty
passed qty
defect qty
status
defect codes
photo/evidence optional
remarks
```

---

## 89. Handover Mobile

Flows:

```text
submit handover
accept handover
reject handover
accept partial
```

---

## 90. Downtime and Andon

Downtime:

```text
start downtime
resolve downtime
```

Andon:

```text
raise urgent issue
attach photo optional
assign urgency
```

---

## 91. Shift Closure

Confirm:

```text
output confirmed
defects confirmed
WIP handover confirmed
downtime confirmed
open issues
next shift instructions
```

Warn for:

```text
pending sync
open downtime
missing output
pending handover
```

---

## 92. Offline Sync

Implement:

```text
IndexedDB queue
clientEventId
PENDING_SYNC status
SYNCED status
SYNC_FAILED status
CONFLICT status
sync now action
automatic retry on online
conflict screen
```

---

## 93. Phase 8 API Hooks and Services

```text
useShopfloorHome()
useSubmitSewingOutputMobile()
useWashMobileTasks()
useSubmitWashEventMobile()
useSubmitQcInspectionMobile()
useSubmitHandover()
useAcceptHandover()
useSubmitDowntime()
useResolveDowntime()
useRaiseAndon()
useCloseShift()
offlineQueueService
syncOfflineEntries()
```

---

## 94. Phase 8 UX Rules

```text
mobile screens must be usable one-handed where possible.
show sync status always.
do not lose entered data on network failure.
do not show dense grids.
offline entries must preserve original timestamp.
conflicts must be visible and resolvable.
```

---

## 95. Phase 8 Tests

Required:

```text
mobile home renders assigned tasks
sewing output saves offline
sync succeeds
duplicate clientEventId not duplicated in UI state
sync conflict shown
wash step action submits
QC form validates
handover accept/reject works
shift closure warnings shown
```

---

## 96. Phase 8 Exit Criteria

Complete when:

```text
shopfloor users can capture key events
offline queue works
sync state is visible
mobile actions update backend dashboards
```

---

# Phase 9: Analytics and Reporting Dashboards

---

## 97. Phase 9 Objective

Build management and operational analytics surfaces.

---

## 98. Phase 9 Screens

```text
/analytics/executive
/analytics/otif
/analytics/utilization
/analytics/workcenter-constraints
/analytics/line-efficiency
/analytics/operation-bulletin-performance
/analytics/wash
/analytics/wip
/analytics/quality
/analytics/exceptions
/analytics/recovery
/analytics/shipment
/analytics/planning-adherence
/analytics/master-data-readiness
/analytics/data-freshness
```

MVP may combine some into fewer pages.

---

## 99. Executive Analytics

Header KPIs:

```text
orders at risk
shipments due
shipment ready %
OTIF
cost-protected OTIF
resource utilization
net-good efficiency
current constraint
ageing WIP
RED/BLACK exceptions
wash rework rate
```

Panels:

```text
top at-risk orders
current constraint
shipment readiness by week
WIP ageing
wash queue risk
line underperformance
exception ageing
recovery due today
```

---

## 100. OTIF Analytics

Show:

```text
OTIF %
Normal OTIF %
Cost-Protected OTIF %
Late %
Short %
Recovery action breakdown
Failure reason breakdown
Trend
```

---

## 101. Utilization and Efficiency

Show:

```text
planned utilization
actual utilization
net-good utilization
line efficiency
workcenter constraint trend
```

---

## 102. Wash Analytics

Show:

```text
wash queue qty
ageing queue
utilization
rewash rate
cycle time
post-wash QC pending
shipment-risk wash WIP
wash route performance
```

---

## 103. WIP Analytics

Show:

```text
total WIP
WIP by stage
blocked WIP
ageing WIP
rework WIP
WIP before constraint
shipment-risk WIP
```

---

## 104. Phase 9 API Hooks

```text
useExecutiveAnalytics()
useOtifAnalytics()
useUtilizationAnalytics()
useLineEfficiencyAnalytics()
useWashAnalytics()
useWipAnalytics()
useQualityAnalytics()
useExceptionAnalytics()
useRecoveryAnalytics()
useShipmentAnalytics()
usePlanningAdherenceAnalytics()
useMasterDataReadinessAnalytics()
```

---

## 105. Phase 9 UX Rules

```text
every KPI should have drilldown path
show last calculated timestamp
avoid chart clutter
use consistent filters
do not calculate official KPI formulas on frontend
```

---

## 106. Phase 9 Tests

Required:

```text
executive dashboard renders KPI cards
filters trigger API calls
OTIF chart renders normal vs protected
utilization chart renders
wash analytics renders rewash rate
WIP analytics drilldown link works
empty states work when no data
```

---

## 107. Phase 9 Exit Criteria

Complete when:

```text
management can see operational health
OTIF and cost-protected OTIF are visible
key production analytics are filterable and drillable
```

---

# Phase 10: Integration, Import, Audit, and Admin Support Surfaces

---

## 108. Phase 10 Objective

Build support surfaces for data imports, integration monitoring, audit trace, and governed approvals.

---

## 109. Phase 10 Screens

```text
/integrations/status
/integrations/imports
/integrations/imports/:batchId
/audit/search
/orders/:orderId/trace
/approvals
/admin/configuration, optional custom shell
```

---

## 110. Integration Status Screen

Header KPIs:

```text
active integrations
failed integrations
stale integrations
last successful order sync
pending import batches
rows with errors
```

Grid columns:

```text
source
type
direction
status
last run
records processed
error count
owner
next scheduled run
last error
```

Actions:

```text
run now
view run log
upload file
download error report
apply import
cancel import
```

---

## 111. Import Batch Detail

Sections:

```text
batch summary
valid/error row counts
row error table
normalized preview
apply/cancel actions
audit
```

---

## 112. Audit Search

Filters:

```text
entity type
entity ID
event code
order
user
source
date range
```

Grid:

```text
timestamp
event code
entity
action
user
source
reason
```

Drawer:

```text
old value
new value
metadata
correlation ID
evidence
```

---

## 113. Order Trace

Route:

```text
/orders/:orderId/trace
```

Timeline groups:

```text
Order Setup
Material/Fabric
PCD
Planning
Release
Production
Wash
Quality
WIP
Exceptions
Shipment
Audit
```

---

## 114. Phase 10 API Hooks

```text
useIntegrationStatus()
useTriggerIntegrationRun()
useImportBatches()
useImportBatchDetail()
useUploadImport()
useApplyImport()
useAuditSearch()
useEntityAudit()
useOrderTrace()
useApprovals()
```

---

## 115. Phase 10 UX Rules

```text
import apply must require confirmation
row errors must be readable and exportable
stale integration status must be visible
audit old/new values should be readable
trace timeline should group events by business area
```

---

## 116. Phase 10 Tests

Required:

```text
integration grid renders failed/stale status
upload import handles validation result
row errors render
apply import confirmation works
audit search filters
order trace groups events
approval inbox approve/reject works
```

---

## 117. Phase 10 Exit Criteria

Complete when:

```text
imports are operationally supportable
integration health is visible
audit trace is searchable
order trace is usable
```

---

# Phase 11: UX Hardening, Performance, Testing, and Release Readiness

---

## 118. Phase 11 Objective

Harden the frontend for real pilot or production use.

---

## 119. Phase 11 Work Areas

```text
navigation polish
error handling consistency
loading skeletons
empty states
grid performance
accessibility
responsive behavior
mobile usability
offline sync reliability
test coverage
E2E critical flows
release smoke tests
```

---

## 120. Performance Hardening

Apply:

```text
server-side pagination everywhere
virtualized grids
debounced filters
lazy drawer data
route-level code splitting
memoized heavy cells
avoid unnecessary polling
```

---

## 121. UX Hardening

Ensure:

```text
all disabled actions explain why
all critical actions confirm before submit
success/error feedback is visible
stale data badge available
last refreshed timestamp shown
filters persist in URL
drawer does not lose context
```

---

## 122. Accessibility

Minimum:

```text
keyboard navigation
visible focus states
input labels
sufficient contrast
screen-readable status text
```

---

## 123. Regression E2E Flows

Automate key flows:

```text
PCD release blocked and then released
weekly plan freeze
sewing output capture
wash rewash
WIP reconciliation gap
shipment readiness blocked and resolved
exception recovery action
mobile offline sync
```

---

## 124. Phase 11 Tests

Required:

```text
frontend build
typecheck
lint
component tests
critical integration tests
Playwright E2E
mobile viewport tests
permission UI tests
offline sync tests
```

---

## 125. Phase 11 Exit Criteria

Complete when:

```text
frontend passes release regression
core screens are performant
mobile flows are usable
permissions are respected
critical E2E journeys pass
```

---

# Part B: Frontend Build Chunking for AI Coding Agent

---

## 126. Chunk Size Guidance

Frontend build chunks should be small and verifiable.

Avoid:

```text
Build the wash module
```

Prefer:

```text
Create WashBoardPage with columns from GET /api/v1/wash/board and render batch cards with status/risk badges.
```

---

## 127. Standard Frontend Chunk Template

Each chunk should specify:

```text
Context
Files to read
Goal
Route/component/hook to create
API endpoint
Expected UI behavior
Permissions
States to handle
Tests
Validation commands
Do not change
```

---

## 128. Example Chunk: API Client

```text
Goal:
Create shared API client and response envelope handling.

Tasks:
1. Create services/api/client.ts.
2. Support base URL from NEXT_PUBLIC_API_BASE_URL.
3. Normalize ApiResponse<T>.
4. Normalize ApiError.
5. Add tests for success/error responses.

Do not:
- Build domain screens.
```

---

## 129. Example Chunk: WIP Pipeline

```text
Goal:
Create WIP Pipeline dashboard.

API:
GET /api/v1/wip/pipeline

Tasks:
1. Create WipPipelinePage.
2. Create WipSummaryCards.
3. Create WipPipelineMap.
4. Render stage cards.
5. Clicking stage routes to /wip/pipeline/:stage.
6. Add loading, error, empty states.
7. Add component tests.

Do not:
- Implement WIP movement forms in this chunk.
```

---

## 130. Example Chunk: Mobile Offline Queue

```text
Goal:
Implement offline queue foundation for shopfloor mobile.

Tasks:
1. Create offlineQueueService using IndexedDB/Dexie.
2. Add enqueue, list, markSynced, markFailed, markConflict.
3. Add SyncStatusBadge.
4. Add tests for queue state transitions.

Do not:
- Build all mobile forms in this chunk.
```

---

# Part C: Frontend Dependencies on Backend Phases

---

## 131. Dependency Map

| Frontend Phase | Backend Dependency |
|---|---|
| Phase 1 | `/api/v1/me`, auth, permissions |
| Phase 2 | orders, PCD, release APIs |
| Phase 3 | planning, workcenter APIs |
| Phase 4 | WIP APIs |
| Phase 5 | sewing, operation bulletin, line realignment APIs |
| Phase 6 | wash APIs |
| Phase 7 | exceptions, recovery, quality, shipment APIs |
| Phase 8 | shopfloor/mobile APIs |
| Phase 9 | analytics APIs |
| Phase 10 | integrations, audit, approvals APIs |

---

## 132. Mocking Strategy

If backend APIs are not ready:

```text
use MSW or fixture-based API mocks
```

But:

```text
replace mocks with real contract tests as soon as backend endpoint exists
```

Do not let frontend drift from backend contract.

---

## 133. API Contract Governance

For each screen, maintain:

```text
API endpoint
request params
response type
loading state
empty state
error state
permission requirement
```

Frontend types must align with Document 06.

---

# Part D: Testing Plan by Phase

---

## 134. Minimum Tests by Phase

| Phase | Required Tests |
|---|---|
| Phase 0 | build/typecheck |
| Phase 1 | shell, API client, permissions, shared components |
| Phase 2 | orders, PCD, release actions |
| Phase 3 | planning impact preview, workcenter load |
| Phase 4 | WIP pipeline, reconciliation |
| Phase 5 | sewing, bulletin, realignment |
| Phase 6 | wash board, rewash |
| Phase 7 | exceptions, recovery, shipment |
| Phase 8 | mobile, offline sync |
| Phase 9 | analytics dashboards |
| Phase 10 | import, audit, trace |
| Phase 11 | E2E regression |

---

## 135. Required Validation Commands

```text
npm run lint
npm run typecheck
npm run test
npm run build
npx playwright test
```

If using pnpm:

```text
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm playwright test
```

---

# Part E: Frontend No-Go Conditions

---

## 136. No-Go Conditions for Pilot

Do not pilot if:

```text
critical actions can be clicked without permission handling
blocked backend actions show generic/unreadable errors
release buttons do not show disabled reasons
WIP screens do not distinguish held/rework/ageing
wash rewash is not visible
mobile output can be lost during weak network
shipment ready blocker reasons are unclear
frontend uses hardcoded KPI formulas inconsistent with backend
```

---

## 137. MVP Cut Scope Guidance

If timeline is tight, do not cut:

```text
orders
PCD readiness
daily release
workcenter load
WIP pipeline
sewing output visibility
wash board
exceptions
shipment readiness
mobile output capture
permissions
```

Can defer:

```text
advanced drag/drop Gantt
advanced operation-level routing visualization
advanced charting
saved grid views
QR scanning
PDF reporting
full visual polish
```

---

# Part F: Open Decisions

---

## 138. Decisions Required

Before frontend build begins, confirm:

1. Final frontend framework: Next.js or Vite React?
2. Grid library: AG Grid or TanStack Table?
3. Default theme: dark, light, or both?
4. Which screens are mandatory for MVP pilot?
5. Is mobile offline required from first pilot?
6. Are QR/barcode flows in MVP?
7. Should routing use Next.js App Router?
8. Should API types be generated from OpenAPI?
9. Which user roles need custom landing pages?
10. What screen density is acceptable for factory planners?
11. What browser/device matrix must be supported?
12. What polling frequency is acceptable for live boards?
13. Is local language support required in phase 1?
14. Should exports be available in MVP frontend?

---

## 139. Non-Negotiable Frontend Rules

```text
1. Frontend must not duplicate backend business calculations.
2. Critical write actions must call explicit action APIs.
3. Disabled actions must show reasons.
4. Permission checks must be visible in UI but enforced by backend.
5. Grids must use server-side pagination/filtering.
6. Drawer pattern must preserve workbench context.
7. WIP must clearly distinguish held, ageing, rework, and shipment-risk quantity.
8. Wash rework must be visible as capacity and shipment-risk impact.
9. Mobile shopfloor capture must not lose offline entries.
10. Frontend must pass typecheck/build before release.
```

---

## 140. Summary

This document defines the phase-wise frontend build plan for the Eratex Planning & Scheduling Platform.

The frontend build sequence should be:

```text
foundation
→ orders/PCD/release
→ planning/workcenters
→ WIP
→ sewing/technical
→ wash
→ exceptions/recovery/shipment
→ mobile shopfloor
→ analytics
→ integration/audit
→ hardening
```

The frontend must become a live operating cockpit, not a static reporting interface.

The guiding implementation principle is:

```text
Build every surface around operational action: status, risk, blocker, owner, and next step.
```
