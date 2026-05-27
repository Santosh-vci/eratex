# 13. Frontend Implementation Specification  
# Eratex End-to-End Planning & Scheduling Platform

**Company:** Eratex  
**Product:** Planning & Scheduling Tool for Denim Bottoms + Chinos Manufacturing  
**Document Type:** Frontend Implementation Specification  
**Version:** 2.0  
**Date:** 2026-05-26  
**Recommended Frontend Stack:** Next.js / React + TypeScript + TanStack Query + AG Grid or TanStack Table + shadcn/ui + PWA  
**Backend Contract:** Django REST Framework APIs under `/api/v1/`  
**Related Documents:**  
- 01 Technical Architecture Spine  
- 04 Planning Logic and Calculation Flows  
- 06 API and Data Contracts Specification  
- 08 WIP Inventory and Reconciliation Specification  
- 09 Line Routing and Operation Bulletin Specification  
- 10 Wash Planning and Execution Specification  
- 11 Exception, Alert, and Recovery Specification  
- 12 Handheld Shopfloor Capture Technical Specification  

---

## 1. Purpose

This document defines the frontend implementation specification for the Eratex Planning & Scheduling Platform.

It is intended to be a handoff-grade document for frontend engineers, UI developers, QA, product owners, and implementation teams.

The frontend must support two operating modes:

```text
1. Dense desktop planning and control workbenches
2. Mobile/PWA shopfloor capture screens
```

The frontend is not a generic ERP screen set. It is an operational control cockpit for managing denim bottoms and chinos garment production from order readiness to shipment.

---

## 2. Frontend Product Thesis

The frontend should help the user answer:

```text
What must I act on now?
Which orders are at risk?
Which workcenter is constrained?
Which line is underperforming?
Which WIP is ageing?
Which wash batch is blocked or needs rewash?
Which shipment is not ready?
What recovery action should be taken?
```

The system must not become a passive database UI. It must continuously translate backend state into clear operational decisions.

The frontend principle is:

```text
Show the plan.
Show the live reality.
Show the variance.
Show the next action.
```

---

## 3. Recommended Frontend Stack

## 3.1 Framework

Recommended:

```text
Next.js + React + TypeScript
```

Alternative acceptable:

```text
React + Vite + TypeScript
```

Next.js is preferred if the team wants:

```text
structured routing
layout nesting
route-level code splitting
future server-side rendering if needed
better app organization
```

## 3.2 Core Libraries

| Need | Recommended Library |
|---|---|
| Language | TypeScript |
| API data cache | TanStack Query |
| Dense grids | AG Grid Enterprise/Community or TanStack Table |
| Forms | React Hook Form |
| Validation | Zod |
| UI components | shadcn/ui or internal design system |
| Charts | Recharts |
| Date/time | date-fns or Luxon |
| Drag/drop | dnd-kit |
| State for local UI | Zustand or React context |
| PWA/offline | Service worker + IndexedDB |
| Icons | lucide-react |
| Testing | Vitest/Jest + React Testing Library + Playwright |

## 3.3 Styling

Recommended:

```text
Tailwind CSS
```

Design preference:

```text
dense
compact
dark-theme compatible
minimal padding
sticky headers
status badges
right drawers
high information density
```

---

## 4. Frontend Architecture

## 4.1 Recommended Folder Structure

```text
frontend/
  src/
    app/
      layout.tsx
      routes/
    modules/
      orders/
      pcd-readiness/
      planning/
      releases/
      workcenters/
      sewing/
      wash/
      wip/
      quality/
      exceptions/
      shipment/
      technical/
      analytics/
      shopfloor-mobile/
      admin/
    components/
      ui/
      layout/
      data-grid/
      status/
      forms/
      charts/
      drawers/
      timeline/
      mobile/
    services/
      api/
      query-keys/
      auth/
      permissions/
      offline/
    types/
      api/
      domain/
    hooks/
    utils/
    constants/
    tests/
```

## 4.2 Module Structure

Each module should follow:

```text
modules/<module-name>/
  routes/
  components/
  hooks/
  api.ts
  types.ts
  constants.ts
  utils.ts
  tests/
```

Example:

```text
modules/wip/
  routes/PipelineWipPage.tsx
  routes/ReconciliationPage.tsx
  components/WipStageCard.tsx
  components/WipPipelineMap.tsx
  components/WipDetailDrawer.tsx
  hooks/useWipPipeline.ts
  api.ts
  types.ts
```

---

## 5. Frontend Design Principles

## 5.1 Workbench-First Design

Planning users need operational workbenches, not isolated forms.

A workbench screen should usually contain:

```text
header KPIs
filters
main grid/board
side drawer
action buttons
exception panel
audit/history access
```

## 5.2 Drawer-Based Details

Use right-side drawers for:

```text
order detail
WIP item detail
exception detail
wash batch detail
line detail
shipment readiness detail
```

This avoids losing context.

## 5.3 Status-Driven UI

Every operational entity should show:

```text
status
risk
owner
next action
last update
```

## 5.4 Role-Aware UI

Frontend should hide or disable actions based on permissions returned by `/api/v1/me`.

However, backend remains final authority.

## 5.5 Backend-Owned Calculations

Frontend must not calculate business truth such as:

```text
PCD readiness
shipment risk
constraint status
line capacity
WIP ageing
exception severity
```

Frontend renders backend-calculated fields.

## 5.6 Dense But Readable

For planner screens:

```text
compact rows
sticky headers
pinned columns
badges
bulk selection
keyboard-friendly navigation
horizontal scrolling where needed
```

For mobile:

```text
large buttons
few fields
task cards
minimal typing
```

---

# Part A: Global Application Shell

---

## 6. Application Layout

## 6.1 Desktop Layout

Recommended layout:

```text
Top header
Left collapsible navigation
Main content area
Optional right insight/action panel
```

### Header Should Include

```text
current module
breadcrumb
factory selector
date/horizon selector
global search
notifications
user menu
sync/status indicator
```

### Left Navigation Groups

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
Shopfloor Mobile
Admin / Configuration
```

## 6.2 Mobile Layout

For shopfloor:

```text
top user/shift context
task cards
bottom action bar
sync indicator
```

Avoid desktop sidebar on handheld.

---

## 7. Routing Specification

Recommended route map:

```text
/
  dashboard/control-tower
  orders
  orders/:orderId
  pcd-readiness
  planning/weekly
  releases/daily
  workcenters/load
  sewing/line-loading
  sewing/line-realignment
  sewing/line-balance
  wash/planning
  wash/batches/:batchId
  wip/pipeline
  wip/pipeline/:stage
  wip/reconciliation
  orders/:orderId/reconciliation
  quality/inspections
  exceptions/control-tower
  recovery/actions
  shipment/readiness
  technical/operation-bulletins
  technical/operation-bulletins/:id/routing
  analytics/efficiency-review
  analytics/operation-bulletin-performance
  mobile
  mobile/home
  mobile/sewing/output
  mobile/wash
  mobile/qc/inspection
  mobile/handover/submit
  mobile/downtime
  mobile/andon
  mobile/shift-closure
```

---

## 8. Navigation Rules

## 8.1 Role-Based Navigation

Only show modules available to user role.

Example:

```text
Shopfloor supervisor should not see finance/management analytics.
QC user should see QC capture and holds.
Planning head should see planning, exceptions, workcenter load, shipment risk.
```

## 8.2 Deep Links

Every major entity should be deep-linkable:

```text
/order/:id
/exception/:id
/wash/batch/:id
/wip/item/:id
/line/:id
```

## 8.3 Breadcrumbs

Example:

```text
Wash > Batch WB-1001 > Rewash
```

---

# Part B: Shared Components

---

## 9. Core Shared Components

Required component library:

```text
AppShell
ModuleHeader
Breadcrumbs
FilterBar
DataGrid
StatusBadge
RiskBadge
SeverityBadge
OwnerBadge
KpiCard
ProgressBar
Timeline
RightDrawer
ActionButton
PermissionGate
ConfirmDialog
AuditTrailPanel
ExceptionMiniPanel
NextActionCard
EmptyState
LoadingState
ErrorState
StaleDataBadge
SyncStatusBadge
```

---

## 10. Status Badge Rules

Status badges should use consistent labels and visual treatment.

Examples:

```text
READY
BLOCKED
ESCALATED
IN_PROGRESS
HELD
REWORK_REQUIRED
SHIPMENT_READY
```

## 10.1 Risk Badge

Risk values:

```text
GREEN
YELLOW
RED
BLACK
```

Rules:

```text
RED and BLACK should visually stand out.
Severity color should represent operational risk only.
Do not use risk colors for arbitrary decoration.
```

---

## 11. Data Grid Component

The platform needs a reusable dense grid wrapper.

### 11.1 Required Features

```text
server-side pagination
server-side sorting
server-side filtering
column pinning
column resizing
column visibility
saved view presets
row selection
bulk action support
CSV export where permitted
sticky header
risk/status cell renderers
drawer row click
```

### 11.2 Grid Standards

All grid pages should implement:

```text
filter state in URL query
default page size 50
refresh button
last updated timestamp
empty state
export permission check
```

---

## 12. Filter Bar Component

Common filters:

```text
factory
date range
shipment week
customer
buyer
style
order
workcenter
line
owner
status
risk
stage
category
```

Filter state should be serializable into URL query parameters.

---

## 13. Right Drawer Pattern

Use drawers for details without leaving the grid.

### 13.1 Drawer Types

```text
OrderDrawer
PcdReadinessDrawer
WipItemDrawer
ExceptionDrawer
WashBatchDrawer
LineDrawer
ShipmentDrawer
AuditDrawer
```

### 13.2 Drawer Sections

```text
summary
status/risk
key quantities
blockers
timeline
actions
audit
linked entities
```

---

## 14. Action Availability Component

API may return available actions.

Example:

```json
{
  "availableActions": [
    {
      "action": "RELEASE_TO_CUTTING",
      "enabled": false,
      "reason": "Fabric QC pending"
    }
  ]
}
```

Frontend should render:

```text
enabled action buttons
disabled buttons with reason tooltip
request approval action if allowed
```

---

# Part C: API Client and State Management

---

## 15. API Client

Create a central API client.

```text
services/api/client.ts
```

Responsibilities:

```text
base URL handling
auth headers
CSRF/token handling
request/response envelope handling
error normalization
retry policy
request cancellation
```

## 15.1 Response Type

```typescript
export interface ApiResponse<T> {
  data: T;
  meta: Record<string, unknown>;
  errors: ApiError[];
}
```

## 15.2 Error Type

```typescript
export interface ApiError {
  code: string;
  message: string;
  field?: string;
  details?: Record<string, unknown>;
}
```

---

## 16. TanStack Query Standards

### 16.1 Query Key Structure

```typescript
["orders", filters]
["pcd-readiness", filters]
["weekly-plan", planId, filters]
["wip-pipeline", filters]
["exceptions", filters]
["wash-board", filters]
```

### 16.2 Mutation Pattern

For state-changing actions:

```text
call mutation
show optimistic pending state only if safe
invalidate affected queries
show success/error toast
open updated drawer if needed
```

### 16.3 Staleness

High-frequency pages:

```text
sewing output
workcenter load
wash board
exceptions
```

should refresh more often or provide manual refresh.

Avoid excessive polling on all screens.

---

## 17. Local UI State

Use local state or Zustand for:

```text
sidebar collapsed
active filters
drawer open/close
selected rows
saved grid views
mobile offline queue status
```

Do not store server truth in Zustand if TanStack Query owns it.

---

## 18. Permission Handling

Create:

```text
services/permissions/PermissionGate.tsx
```

Usage:

```tsx
<PermissionGate permission="planning.freeze_weekly_plan">
  <Button>Freeze Plan</Button>
</PermissionGate>
```

Also support disabled reason:

```text
permission missing
business action disabled
state conflict
```

---

# Part D: Core Desktop Screens

---

## 19. Control Tower Dashboard

Route:

```text
/dashboard/control-tower
```

### Purpose

Executive and planning overview of operational health.

### Header KPIs

```text
Orders at RED/BLACK risk
PCD blocked
Workcenter constraints
Ageing WIP
Wash rework
Shipment readiness blockers
Open RED/BLACK exceptions
OTIF protected by recovery
```

### Panels

```text
Today’s operating risk
Top constrained workcenters
Shipments due this week
Exception ageing
WIP before current constraint
Wash queue risk
Line underperformance
```

### Actions

```text
open exception
open order
open workcenter load
open wash board
open shipment readiness
```

---

## 20. Order Lifecycle Screen

Route:

```text
/orders
```

### Purpose

Show complete order lifecycle and risk.

### Grid Columns

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

### Drawer

Order detail drawer should include:

```text
lifecycle timeline
quantities
PCD readiness
material status
WIP position
exceptions
shipment readiness
audit
```

---

## 21. PCD Readiness Screen

Route:

```text
/pcd-readiness
```

### Header KPIs

```text
PCD due this week
Ready
Blocked
Escalated
Conditional releases
Fabric QC blockers
Trim blockers
```

### Grid Columns

```text
order
style
customer
planned PCD
readiness status
blocking items
owner
risk
can release
next action
```

### Actions

```text
update checklist
request conditional release
approve conditional release
release to cutting
open blockers
```

---

## 22. Weekly Planning Workbench

Route:

```text
/planning/weekly
```

### Layout

```text
Left: planning backlog
Center: timeline/grid board
Right: capacity and impact panel
Bottom: exceptions/constraints
```

### Required Capabilities

```text
view order backlog
filter eligible orders
assign order to workcenter/line
drag or edit planned dates
view capacity impact
run impact preview
freeze plan
create plan change request
```

### Planning Grid Fields

```text
order
style
quantity
workcenter
line
planned start
planned end
planned load
risk
PCD status
shipment date
```

### Impact Panel

Show:

```text
workcenter utilization before/after
shipment risk impact
affected orders
warnings
approval required
```

---

## 23. Daily Release Screen

Route:

```text
/releases/daily
```

### Sections

```text
Ready to Release
Blocked
Released Today
Exception Release Pending
```

### Release Types

```text
CUTTING
SEWING
WASH
FINISHING
PACKING
SHIPMENT
```

### Actions

```text
validate release
create release
request exception release
approve exception release
complete release
```

---

## 24. Workcenter Load Monitor

Route:

```text
/workcenters/load
```

### Header KPIs

```text
current constraint
overloaded workcenters
queue ageing
available capacity
planned load
actual load
```

### Grid Columns

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

### Drawer

Workcenter detail:

```text
load trend
queue
orders affected
capacity calendar
downtime
exceptions
recovery actions
```

---

## 25. Sewing Line Loading Screen

Route:

```text
/sewing/line-loading
```

### Header KPIs

```text
active lines
underperforming lines
net-good output
efficiency
defect rate
downtime
lines needing realignment
```

### Grid Columns

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

### Actions

```text
open line detail
record output fallback
open line balance
preview realignment
create downtime
raise exception
```

---

## 26. Line Realignment Workbench

Route:

```text
/sewing/line-realignment
```

### Layout

```text
Select line and style
Current setup panel
Required setup panel
Machine gap panel
Skill gap panel
Expected output panel
Recommendations panel
```

### Actions

```text
preview realignment
submit for approval
approve
apply
reject
```

---

## 27. Line Balance Board

Route:

```text
/sewing/line-balance
```

### Visualization

```text
workstation cards
operation cards
load percentage bars
bottleneck highlight
operator/machine assignments
```

### Actions

```text
move operation
split operation
assign operator
assign machine
calculate balance
approve balance
activate balance
```

---

## 28. Wash Planning Board

Route:

```text
/wash/planning
```

### Columns

```text
Waiting for Wash
Dry Process
Wet Wash
Drying
Post-Wash QC
Rewash
Released to Finishing
```

### Header KPIs

```text
waiting wash qty
wash utilization
dryer utilization
rewash WIP
post-wash QC pending
shipment-risk wash WIP
```

### Actions

```text
create batch
split batch
start/complete step
mark rewash
hold batch
release to finishing
open batch drawer
```

---

## 29. WIP Pipeline Dashboard

Route:

```text
/wip/pipeline
```

### Header KPIs

```text
total WIP
blocked WIP
ageing WIP
rework WIP
WIP before current constraint
shipment-risk WIP
shipment-ready qty
```

### Visualization

```text
Fabric → Cutting → Sewing → Wash → Finishing → Packing → Shipment
```

Each stage card:

```text
qty
blocked qty
oldest age
risk
top affected order
```

### Actions

```text
open stage drilldown
hold WIP
move WIP
view reconciliation
create exception
```

---

## 30. WIP Reconciliation Screen

Route:

```text
/wip/reconciliation
/orders/:orderId/reconciliation
```

### Display

```text
quantity chain
known losses
rework quantities
stage gaps
reconciliation exceptions
audit
```

### Actions

```text
create adjustment
open physical count task
create exception
export reconciliation
```

---

## 31. Exception Control Tower

Route:

```text
/exceptions/control-tower
```

### Header KPIs

```text
open exceptions
RED/BLACK exceptions
shipment impacting
overdue
unassigned
recovery actions due
```

### Grid Columns

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
suggested action
```

### Actions

```text
assign
start progress
create recovery action
escalate
resolve
close
reopen
```

---

## 32. Recovery Action Board

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
exception
owner
target date
capacity impact
shipment impact
approval status
```

---

## 33. Shipment Readiness Screen

Route:

```text
/shipment/readiness
```

### Header KPIs

```text
shipments due this week
ready
blocked
AQL pending
documentation pending
short quantity
RED/BLACK shipment risk
```

### Grid Columns

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

### Actions

```text
update checklist
mark ready
block shipment
approve split shipment
open order
```

---

## 34. Operation Bulletin Screens

Routes:

```text
/technical/operation-bulletins
/technical/operation-bulletins/:id/routing
```

### Bulletin Dashboard

Columns:

```text
style
customer
version
status
total SMV
operation count
critical operations
approved date
used in active orders
performance deviation
```

### Routing Builder

Features:

```text
operation sequence editor
SMV editor
machine/skill selector
parallel/predecessor flags
QC checkpoint flag
critical operation flag
approval workflow
version clone
```

---

## 35. Analytics Screens

Routes:

```text
/analytics/efficiency-review
/analytics/operation-bulletin-performance
```

### Efficiency Review

Filters:

```text
factory
line
style
customer
date range
supervisor
```

Metrics:

```text
utilization
efficiency
net-good output
defect loss
rework loss
downtime
balance loss
```

### Operation Bulletin Performance

Metrics:

```text
planned SMV
actual equivalent SMV
efficiency gap
bottleneck operations
line-style fit
review recommendation
```

---

# Part E: Mobile / PWA Screens

---

## 36. Mobile Home

Route:

```text
/mobile/home
```

Cards:

```text
assigned tasks
open issues
pending sync
shift status
```

---

## 37. Mobile Sewing Output

Route:

```text
/mobile/sewing/output
```

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

---

## 38. Mobile Wash Board

Route:

```text
/mobile/wash
```

Actions:

```text
start step
complete step
mark rewash
release to finishing
hold batch
```

---

## 39. Mobile QC Capture

Route:

```text
/mobile/qc/inspection
```

Fields:

```text
order
stage
checked qty
passed qty
defect qty
defect codes
status
photo
remarks
```

---

## 40. Mobile Handover

Route:

```text
/mobile/handover/submit
/mobile/handover/pending
```

Actions:

```text
submit handover
accept handover
reject handover
accept partial
```

---

## 41. Mobile Downtime and Andon

Routes:

```text
/mobile/downtime
/mobile/andon
```

Actions:

```text
start downtime
resolve downtime
raise issue
attach photo
```

---

## 42. Mobile Shift Closure

Route:

```text
/mobile/shift-closure
```

Confirmations:

```text
output confirmed
defects confirmed
WIP handover confirmed
downtime confirmed
open issues noted
next shift instructions
```

---

## 43. Mobile Offline Sync

Route:

```text
/mobile/sync
```

Show:

```text
pending entries
synced entries
failed entries
conflicts
last sync time
sync now action
```

---

# Part F: Frontend API Contracts

---

## 44. TypeScript Domain Types

Create domain type folders:

```text
types/api/common.ts
types/api/orders.ts
types/api/pcd.ts
types/api/planning.ts
types/api/wip.ts
types/api/wash.ts
types/api/exceptions.ts
types/api/sewing.ts
types/api/shipment.ts
types/api/shopfloor.ts
```

### 44.1 Shared Types

```typescript
export type RiskStatus = "GREEN" | "YELLOW" | "RED" | "BLACK";

export interface EntityRef {
  id: string;
  code?: string;
  name: string;
}

export interface UserRef {
  id: number;
  displayName: string;
}

export interface ApiError {
  code: string;
  message: string;
  field?: string;
  details?: Record<string, unknown>;
}

export interface ApiResponse<T> {
  data: T;
  meta: Record<string, unknown>;
  errors: ApiError[];
}
```

---

## 45. API Module Pattern

Example:

```typescript
// modules/orders/api.ts

export async function getOrders(filters: OrderFilters) {
  return apiClient.get<ApiResponse<Paginated<OrderListItem>>>("/orders", {
    params: filters,
  });
}
```

---

## 46. Query Hook Pattern

Example:

```typescript
export function useOrders(filters: OrderFilters) {
  return useQuery({
    queryKey: ["orders", filters],
    queryFn: () => getOrders(filters),
  });
}
```

---

## 47. Mutation Hook Pattern

Example:

```typescript
export function useReleaseToCutting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: releaseToCutting,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["pcd-readiness"] });
      queryClient.invalidateQueries({ queryKey: ["wip-pipeline"] });
    },
  });
}
```

---

# Part G: Offline PWA Implementation

---

## 48. Offline Storage

Use IndexedDB for:

```text
pending shopfloor events
draft forms
last assigned tasks
sync logs
device ID
```

Recommended library:

```text
Dexie.js
```

## 49. Offline Queue Item

```typescript
interface OfflineQueueItem {
  localId: string;
  clientEventId: string;
  entryType: string;
  originalTimestamp: string;
  payload: Record<string, unknown>;
  status: "LOCAL_DRAFT" | "PENDING_SYNC" | "SYNCED" | "SYNC_FAILED" | "CONFLICT";
  retryCount: number;
  lastError?: string;
}
```

## 50. Sync Logic

```text
detect network online
submit pending entries
handle synced/conflict/failed
update local state
notify user
```

## 51. Offline UX

Always show:

```text
online/offline status
pending sync count
last sync timestamp
failed/conflict count
```

---

# Part H: Error Handling

---

## 52. Error Types

Frontend should distinguish:

```text
validation error
permission error
business rule block
state conflict
network error
server error
offline sync conflict
```

## 53. Business Rule Error

Example:

```text
Release blocked because Fabric QC is pending.
```

UI should show:

```text
reason
blocking item
owner
next possible action
```

## 54. State Conflict

If backend returns state conflict:

```text
refresh entity
show conflict message
do not retry automatically
```

## 55. Error Display Rules

```text
inline field errors for form validation
toast for action success/failure
drawer alert for business blockers
full-page error only for unrecoverable page load failure
```

---

# Part I: Performance Requirements

---

## 56. Grid Performance

Required:

```text
server-side pagination
virtualized rows
avoid loading all orders
debounced filters
memoized cell renderers
lazy drawer data loading
```

## 57. Refresh Strategy

High-frequency screens:

```text
workcenter load
sewing line loading
wash board
exceptions
```

Use:

```text
manual refresh
short polling if required
stale-data indicator
```

Do not poll everything continuously.

## 58. Bundle Performance

Use:

```text
route-level code splitting
lazy-load heavy charts
avoid importing full icon packs
optimize AG Grid usage
```

---

# Part J: Security and Access Control

---

## 59. Frontend Security

Frontend must:

```text
not expose hidden admin routes without auth
not rely only on UI hiding for security
not store sensitive data unnecessarily
clear local offline data on logout
respect factory/role scope
```

## 60. Permission Checks

Use:

```text
PermissionGate
usePermission()
availableActions from API
```

Disabled action should explain:

```text
missing permission
blocked by state
blocked by validation
```

---

# Part K: QA and Testing

---

## 61. Component Tests

Test:

```text
status badges
risk badges
data grid filters
drawer open/close
permission-gated buttons
form validation
offline queue indicators
```

## 62. Integration Tests

Test:

```text
order list loads filters
PCD release blocked flow
weekly plan impact preview
sewing output mutation refreshes line summary
wash rewash flow
WIP movement flow
exception closure flow
shipment mark-ready blocked flow
```

## 63. E2E Tests

Use Playwright.

Critical E2E journeys:

```text
PCD readiness to release to cutting
weekly plan assignment and freeze
daily release blocked and override
sewing output capture updates WIP
wash batch rewash creates exception
WIP reconciliation gap
shipment readiness blocked and resolved
mobile offline sync
```

---

# Part L: Accessibility and Usability

---

## 64. Accessibility

Minimum:

```text
keyboard navigation for desktop grids
visible focus states
labels for inputs
sufficient contrast
screen-readable status text
```

## 65. Shopfloor Usability

Mobile must support:

```text
large tap targets
minimal typing
clear success feedback
offline indicator
simple recovery from errors
```

---

# Part M: Implementation Phasing

---

## 66. Phase 1: Frontend Foundation

Build:

```text
app shell
auth/me
permission handling
API client
query setup
layout
shared components
theme
routing
```

## 67. Phase 2: Core Control Screens

Build:

```text
order lifecycle
PCD readiness
daily release
exception control tower
```

## 68. Phase 3: Planning and Capacity

Build:

```text
weekly planning workbench
workcenter load monitor
impact preview
plan freeze/change
```

## 69. Phase 4: Sewing, WIP, and Wash

Build:

```text
sewing line loading
line realignment
WIP pipeline
WIP reconciliation
wash planning board
```

## 70. Phase 5: Shipment and Analytics

Build:

```text
shipment readiness
efficiency review
operation bulletin performance
control tower
```

## 71. Phase 6: Mobile/PWA

Build:

```text
mobile home
sewing output
wash execution
QC capture
handover
downtime
offline sync
shift closure
```

---

# Part N: Frontend Governance

---

## 72. Non-Negotiable Frontend Rules

```text
1. Frontend must not duplicate backend business calculations.
2. All write actions must use explicit API action endpoints.
3. All critical actions must show confirmation and result.
4. All grids must use server-side pagination/filtering.
5. Filters must be URL-shareable where practical.
6. Drawer details must not force user away from workbench context.
7. Status and risk badges must be consistent across modules.
8. Mobile screens must be task-first and minimal typing.
9. Offline submissions must be idempotent.
10. Permission hiding is not a substitute for backend authorization.
```

---

## 73. Open Decisions

Before implementation, confirm:

1. Next.js or Vite React final choice?
2. AG Grid or TanStack Table?
3. Dark theme as default or optional?
4. Is PWA offline required from first mobile phase?
5. Which screens need local language support?
6. Which roles need custom home pages?
7. What is acceptable polling frequency for live boards?
8. Is QR/barcode scanning in MVP?
9. Is export allowed for all planning grids?
10. Will Django Admin be embedded/linked or separate URL?

---

## 74. Summary

The frontend for Eratex must be a dense operational control system, not a simple CRUD interface.

It must support:

```text
planner desktop workbenches
manager control tower
line and wash planning boards
WIP pipeline visibility
exception and recovery management
shipment readiness
operation bulletin and line balance tools
mobile shopfloor capture
offline sync
```

The frontend should make operational reality visible and actionable.

The guiding principle is:

```text
The user should always know what is planned, what is actually happening, what is at risk, and what action is needed next.
```

## Scheduling Behaviour Rulebook Alignment

Frontend surfaces must expose planning zones, capacity definitions, boundary-case blockers, and no-write impact previews where scheduling decisions are made. `/boundary-cases` has no dedicated prototype at this point; until one exists it must reuse the approved operational table and right-drawer pattern from EOS-04 workcenter load and daily release.
