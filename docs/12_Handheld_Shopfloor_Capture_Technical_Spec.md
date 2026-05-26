# 12. Handheld Shopfloor Capture Technical Specification  
# Eratex End-to-End Planning & Scheduling Platform

**Company:** Eratex  
**Product:** Planning & Scheduling Tool for Denim Bottoms + Chinos Manufacturing  
**Document Type:** Handheld / Shopfloor Capture Technical Specification  
**Version:** 2.0  
**Date:** 2026-05-26  
**Backend Stack:** Django + Django REST Framework + PostgreSQL + Celery + Redis  
**Frontend Stack Context:** React/Next.js PWA + TypeScript + Mobile-first UI  
**Primary Users:** Line Supervisors, Wash Supervisors, QC Inspectors, Finishing/Packing Supervisors, Shipment Floor Users, Production Managers  
**Related Documents:**  
- 04 Planning Logic and Calculation Flows  
- 06 API and Data Contracts Specification  
- 07 Event and State Transition Specification  
- 08 WIP Inventory and Reconciliation Specification  
- 09 Line Routing and Operation Bulletin Specification  
- 10 Wash Planning and Execution Specification  
- 11 Exception, Alert, and Recovery Specification  

---

## 1. Purpose

This document defines the technical and functional specification for handheld / shopfloor capture screens for the Eratex Planning & Scheduling Platform.

The planning system will fail if shopfloor actuals are captured late, manually, or only through end-of-day Excel updates. The platform must capture live or near-live production events from the floor so that planning boards, WIP dashboards, exception logic, and shipment risk calculations remain current.

This document specifies:

```text
handheld/PWA architecture
shopfloor user roles
mobile navigation model
screen specifications
event capture model
offline sync
validation rules
device/session control
QR/barcode readiness
APIs
security
audit
testing
implementation phases
```

---

## 2. Core Thesis

The planning tool must not be only a planner desktop cockpit. It must include a shopfloor capture layer.

The operating loop is:

```text
Planner creates plan
→ daily release is issued
→ supervisor executes work
→ shopfloor actuals are captured
→ WIP updates
→ capacity updates
→ exceptions trigger
→ planner sees live reality
→ recovery action is taken
```

Without handheld capture:

```text
line output is delayed
wash status is stale
QC holds are discovered late
WIP ageing is unreliable
shipment risk is understated
Excel remains the true operating layer
```

Therefore, handheld capture is not optional. It is a core control layer.

---

## 3. Recommended Technical Approach

## 3.1 PWA / Responsive Web

Recommended implementation:

```text
React/Next.js mobile-responsive PWA
```

Reasons:

```text
works on handheld devices, tablets, and shopfloor kiosks
does not require separate native app for MVP
can share frontend codebase and API contracts
supports offline draft storage
supports progressive enhancement
easier deployment and updates
```

## 3.2 Device Types

Supported devices:

```text
Android handheld device
Android tablet
iPad/tablet browser
rugged industrial handheld browser
shopfloor kiosk browser
desktop fallback screen
```

## 3.3 Browser Requirements

Recommended:

```text
Chrome on Android
Edge/Chrome on Windows tablets
Safari supported later if required
```

## 3.4 Offline Support

The PWA should support:

```text
local draft entries
pending sync queue
sync retry
conflict detection
original timestamp preservation
```

Offline support is important because factory floor connectivity may be inconsistent.

---

## 4. Shopfloor Capture Scope

The handheld layer should capture:

```text
daily assigned work
sewing output
sewing defects
line downtime
cutting output, if included
wash step start/complete
rewash marking
post-wash QC result
QC inspection and defects
department handover
WIP hold/release
finishing output
packing output
shipment floor status
andon issue
shift closure
```

Not all screens must be built in MVP, but the architecture should support them.

---

## 5. User Roles

## 5.1 Shopfloor Roles

Recommended shopfloor roles:

```text
LINE_SUPERVISOR
CUTTING_SUPERVISOR
WASH_SUPERVISOR
QC_INSPECTOR
FINISHING_SUPERVISOR
PACKING_SUPERVISOR
SHIPMENT_FLOOR_USER
MAINTENANCE_USER
PRODUCTION_MANAGER
SHOPFLOOR_ADMIN
```

## 5.2 Role-Based Access

Each user should see only assigned scope.

Examples:

```text
Line Supervisor sees assigned sewing line(s).
Wash Supervisor sees assigned wash batches/workcenters.
QC Inspector sees QC tasks and inspection capture.
Packing Supervisor sees finishing/packing tasks.
Shipment User sees shipment readiness and packing handover tasks.
```

## 5.3 Permission Examples

```text
shopfloor.view_home
shopfloor.capture_output
shopfloor.capture_qc
shopfloor.capture_downtime
shopfloor.create_handover
shopfloor.accept_handover
shopfloor.raise_andon
shopfloor.close_shift
wash.execute_step
wash.mark_rewash
quality.create_hold
wip.move
wip.hold
```

---

## 6. Mobile UX Principles

## 6.1 Design Priorities

The handheld UI must be:

```text
fast
large touch target
minimal typing
role-specific
action-first
low cognitive load
usable with gloves if needed
usable in noisy factory environment
```

## 6.2 Avoid

```text
dense desktop grids
long forms
multi-level menus
small buttons
excess typing
unnecessary filters
technical jargon
```

## 6.3 Prefer

```text
task cards
scan/select order
numeric keypad
quick status buttons
large submit actions
save draft
sync indicator
offline badge
photo attachment where needed
```

## 6.4 Recommended Screen Layout

```text
Top: shift/date/user/line or workcenter
Middle: current tasks/cards
Bottom: primary action buttons
Persistent: sync status and alerts
```

---

# Part A: Architecture and Data Flow

---

## 7. Shopfloor Data Flow

```text
User opens mobile PWA
→ backend returns assigned tasks
→ user captures event
→ local validation
→ API submission
→ backend validation
→ event saved
→ WIP/capacity/order risk recalculated
→ exception generated if needed
→ planner dashboard updates
```

---

## 8. Event Capture Architecture

Every shopfloor action should create a structured event.

Examples:

```text
sewing.output_recorded
qc.inspection_created
wash.step_completed
wip.moved
downtime.started
handover.submitted
andon.raised
shift.closed
```

Each event should include:

```text
event type
entity references
quantity
timestamp
user
source
device ID
original timestamp
sync timestamp
remarks
```

---

## 9. Source Values

```text
HANDHELD
TABLET
KIOSK
DESKTOP_FALLBACK
IMPORT
SYSTEM
```

---

## 10. Common Event Payload

```json
{
  "clientEventId": "device-local-uuid",
  "eventType": "sewing.output_recorded",
  "source": "HANDHELD",
  "deviceId": "DEVICE-001",
  "originalTimestamp": "2026-06-05T14:00:00+07:00",
  "payload": {
    "orderId": "uuid",
    "lineId": "uuid",
    "grossQty": 320,
    "defectQty": 18,
    "reworkQty": 12
  }
}
```

---

## 11. Idempotency

All shopfloor submission APIs must support idempotency.

### 11.1 Why

Shopfloor devices may resubmit due to:

```text
network retry
user double tap
offline sync retry
browser refresh
```

### 11.2 Rule

Use:

```text
clientEventId + userId + deviceId
```

as idempotency key.

If duplicate event is received:

```text
return existing server result
do not duplicate production output
do not duplicate WIP movement
do not duplicate exception
```

---

## 12. Offline Sync Model

## 12.1 Offline Entry States

```text
LOCAL_DRAFT
PENDING_SYNC
SYNCED
SYNC_FAILED
CONFLICT
DISCARDED
```

## 12.2 Offline Flow

```text
user creates entry
→ entry saved locally
→ entry marked PENDING_SYNC
→ when network available, sync API called
→ backend validates
→ entry marked SYNCED or CONFLICT/FAILED
```

## 12.3 Conflict Cases

```text
order no longer assigned to line
batch already closed
WIP quantity already moved
QC hold blocks movement
same time-slot output already submitted
release cancelled
```

## 12.4 Conflict Handling

For conflict:

```text
show conflict screen
show reason
allow supervisor to discard, correct, or request override
```

---

# Part B: Mobile Home and Navigation

---

## 13. Shopfloor Home Screen

Route:

```text
/mobile
/mobile/home
```

### 13.1 Purpose

Role-based landing page showing tasks assigned to the user.

### 13.2 Data Display

```text
user name
role
factory
department
line/workcenter assignment
shift
sync status
today's tasks
open issues
pending sync entries
```

### 13.3 Task Cards

Examples:

```text
Capture Sewing Output - Line 05
Complete Wash Step - Batch WB-1001
QC Inspection Pending - Post Wash
Accept Handover - Sewing to Wash
Close Shift - Line 05
```

### 13.4 Actions

```text
open task
scan QR/barcode
sync now
view pending entries
raise issue
```

---

## 14. Assigned Tasks API

### 14.1 GET /api/v1/shopfloor/home

Query params:

```text
factoryId
date
shift
```

Response:

```json
{
  "data": {
    "user": {
      "id": 101,
      "displayName": "Line Supervisor 05"
    },
    "role": "LINE_SUPERVISOR",
    "assignedScopes": [
      {
        "scopeType": "LINE",
        "id": "uuid",
        "code": "LINE-05",
        "name": "Sewing Line 05"
      }
    ],
    "shift": {
      "date": "2026-06-05",
      "name": "A",
      "startTime": "08:00",
      "endTime": "17:00"
    },
    "sync": {
      "pendingEntries": 2,
      "lastSyncedAt": "2026-06-05T13:55:00+07:00"
    },
    "tasks": [
      {
        "taskId": "uuid",
        "taskType": "SEWING_OUTPUT",
        "title": "Capture output for Line 05",
        "orderId": "uuid",
        "orderNo": "ORD-1001",
        "styleCode": "STY-5001",
        "targetQty": 700,
        "actualQty": 420,
        "status": "IN_PROGRESS",
        "priority": "RED"
      }
    ],
    "openIssues": []
  },
  "meta": {},
  "errors": []
}
```

---

# Part C: Sewing Output Capture

---

## 15. Sewing Output Capture Screen

Route:

```text
/mobile/sewing/output
/mobile/lines/:lineId/output
```

### 15.1 Purpose

Capture line-wise output during shift.

### 15.2 Required Fields

```text
line
order
time slot
gross quantity
defect quantity
rework quantity
net-good quantity
remarks
```

### 15.3 Optional Fields

```text
operation group
bundle reference
operator count
photo
defect reason
```

### 15.4 UX Rules

```text
preselect assigned line
preselect active order
default current time slot
large numeric keypad
auto-calculate net-good quantity
show daily target vs actual
warn if output seems abnormal
```

### 15.5 Validation

```text
gross_qty >= 0
defect_qty >= 0
rework_qty >= 0
defect_qty + rework_qty <= gross_qty
net_good_qty = gross_qty - defect_qty - rework_qty
line must be active
order must be loaded/released on line
time slot must not duplicate unless correction mode
```

### 15.6 Submit API

```text
POST /api/v1/sewing/output
```

Request:

```json
{
  "clientEventId": "local-uuid-001",
  "orderId": "uuid",
  "lineId": "uuid",
  "entryTime": "2026-06-05T14:00:00+07:00",
  "timeSlot": "14:00-15:00",
  "grossQty": 320,
  "defectQty": 18,
  "reworkQty": 12,
  "source": "HANDHELD",
  "deviceId": "DEVICE-001",
  "remarks": "Hourly output"
}
```

Response:

```json
{
  "data": {
    "entryId": "uuid",
    "netGoodQty": 290,
    "lineSummary": {
      "dailyTarget": 700,
      "netGoodOutputToday": 520,
      "remainingQty": 180,
      "requiredRunRate": 60.0,
      "currentRunRate": 52.0,
      "riskStatus": "YELLOW"
    },
    "wipUpdated": true,
    "exceptionCreated": false
  },
  "meta": {},
  "errors": []
}
```

---

## 16. Sewing Defect Quick Capture

Can be part of sewing output or a separate screen.

### 16.1 Fields

```text
order
line
defect code
quantity
severity
responsible operation, optional
photo, optional
remarks
```

### 16.2 API

```text
POST /api/v1/qc/defects/quick-capture
```

---

# Part D: Downtime and Andon

---

## 17. Downtime Capture Screen

Route:

```text
/mobile/downtime
/mobile/lines/:lineId/downtime
```

### 17.1 Purpose

Capture stoppages affecting capacity.

### 17.2 Downtime Types

```text
MACHINE_BREAKDOWN
OPERATOR_ABSENT
MATERIAL_SHORTAGE
TRIM_SHORTAGE
QUALITY_HOLD
POWER_ISSUE
NO_INPUT_WIP
CHANGEOVER_DELAY
WASH_MACHINE_DELAY
OTHER
```

### 17.3 Required Fields

```text
workcenter/line
order, if applicable
event type
start time
expected duration
capacity impact quantity, optional
owner
remarks
```

### 17.4 Start Downtime API

```text
POST /api/v1/shopfloor/downtime
```

Request:

```json
{
  "clientEventId": "local-uuid-002",
  "workcenterId": "uuid",
  "lineId": "uuid",
  "orderId": "uuid",
  "eventType": "MACHINE_BREAKDOWN",
  "startTime": "2026-06-05T11:15:00+07:00",
  "expectedDurationMinutes": 90,
  "capacityImpactQty": 600,
  "ownerId": 91,
  "source": "HANDHELD",
  "deviceId": "DEVICE-001",
  "remarks": "Bartack machine down"
}
```

### 17.5 Resolve Downtime API

```text
POST /api/v1/shopfloor/downtime/{downtimeId}/resolve
```

Request:

```json
{
  "resolvedAt": "2026-06-05T12:20:00+07:00",
  "actualDurationMinutes": 65,
  "resolutionNote": "Maintenance replaced part"
}
```

---

## 18. Andon Issue Screen

Route:

```text
/mobile/andon
```

### 18.1 Purpose

Raise urgent shopfloor help requests.

### 18.2 Issue Types

```text
NEED_QC
NEED_MAINTENANCE
NEED_MATERIAL
NEED_SUPERVISOR
QUALITY_ISSUE
SAFETY_ISSUE
WIP_MISMATCH
SYSTEM_ISSUE
OTHER
```

### 18.3 API

```text
POST /api/v1/shopfloor/andon
```

Request:

```json
{
  "clientEventId": "local-uuid-003",
  "workcenterId": "uuid",
  "lineId": "uuid",
  "orderId": "uuid",
  "issueType": "NEED_QC",
  "urgency": "RED",
  "description": "End-line QC required urgently",
  "photoUrl": null,
  "source": "HANDHELD",
  "deviceId": "DEVICE-001"
}
```

---

# Part E: Wash Execution Capture

---

## 19. Wash Mobile Board

Route:

```text
/mobile/wash
```

### 19.1 Purpose

Show assigned wash batches and next required action.

### 19.2 Batch Card Fields

```text
batch no
order no
style
wash route
shade lot
quantity
current step
status
priority
shipment risk
next action
```

### 19.3 Actions

```text
start step
complete step
hold batch
mark rewash
release to finishing
raise issue
```

---

## 20. Start Wash Step Screen

Route:

```text
/mobile/wash/batches/:batchId/start-step
```

Fields:

```text
batch
step
machine
quantity
start time
remarks
```

API:

```text
POST /api/v1/wash/batches/{batchId}/events
```

Request:

```json
{
  "clientEventId": "local-uuid-004",
  "stepId": "uuid",
  "eventType": "STEP_STARTED",
  "eventTime": "2026-06-05T10:10:00+07:00",
  "qty": 500,
  "machineId": "uuid",
  "source": "HANDHELD",
  "deviceId": "DEVICE-002",
  "remarks": "Started enzyme wash"
}
```

---

## 21. Complete Wash Step Screen

Fields:

```text
batch
step
quantity completed
result status
end time
remarks
photo if needed
```

Request:

```json
{
  "clientEventId": "local-uuid-005",
  "stepId": "uuid",
  "eventType": "STEP_COMPLETED",
  "eventTime": "2026-06-05T12:45:00+07:00",
  "qty": 500,
  "resultStatus": "PASSED",
  "source": "HANDHELD",
  "deviceId": "DEVICE-002",
  "remarks": "Step completed"
}
```

---

## 22. Mark Rewash Required Screen

Route:

```text
/mobile/wash/batches/:batchId/rewash
```

Fields:

```text
affected quantity
reason
rewash route
expected extra time
photo/evidence
remarks
```

API:

```text
POST /api/v1/wash/batches/{batchId}/rewash
```

Request:

```json
{
  "clientEventId": "local-uuid-006",
  "reason": "SHADE_TOO_DARK",
  "qty": 300,
  "rewashRouteId": "uuid",
  "expectedExtraMinutes": 180,
  "remarks": "Shade darker than standard",
  "source": "HANDHELD",
  "deviceId": "DEVICE-002"
}
```

---

## 23. Release Wash Batch to Finishing

Route:

```text
/mobile/wash/batches/:batchId/release-to-finishing
```

Fields:

```text
quantity released
post-wash QC status
handover department
remarks
```

API:

```text
POST /api/v1/wash/batches/{batchId}/release-to-finishing
```

---

# Part F: QC Capture

---

## 24. QC Inspection Capture Screen

Route:

```text
/mobile/qc/inspection
```

### 24.1 Purpose

Capture QC result at different stages.

Stages:

```text
FABRIC_QC
CUT_PANEL_QC
INLINE_QC
END_LINE_QC
PRE_WASH_QC
POST_WASH_QC
FINISHING_QC
FINAL_QC
AQL
```

### 24.2 Required Fields

```text
order
stage
workcenter/line
checked quantity
passed quantity
defect quantity
status
defects
remarks
```

### 24.3 QC Status Values

```text
PASSED
FAILED
HOLD
REWORK_REQUIRED
WAIVED
```

### 24.4 API

```text
POST /api/v1/qc/inspections
```

Request:

```json
{
  "clientEventId": "local-uuid-007",
  "orderId": "uuid",
  "stage": "POST_WASH_QC",
  "workcenterId": "uuid",
  "checkedQty": 500,
  "passedQty": 460,
  "defectQty": 40,
  "status": "HOLD",
  "source": "HANDHELD",
  "deviceId": "DEVICE-003",
  "defects": [
    {
      "defectCodeId": "uuid",
      "defectDescription": "Shade variation",
      "severity": "RED",
      "qty": 40,
      "responsibleProcess": "WASH",
      "photoUrl": null
    }
  ],
  "remarks": "Shade variation observed"
}
```

---

## 25. QC Hold Release Screen

Route:

```text
/mobile/qc/holds/:holdId/release
```

Fields:

```text
released quantity
resolution note
evidence photo
approval confirmation
```

Permission:

```text
quality.release_hold
```

---

# Part G: Department Handover

---

## 26. Handover Submit Screen

Route:

```text
/mobile/handover/submit
```

### 26.1 Handover Points

```text
Cutting → Sewing
Sewing → Wash
Wash → Finishing
Finishing → Packing
Packing → Shipment
```

### 26.2 Required Fields

```text
order
from stage
to stage
from department
to department
quantity
batch/bundle references
QC status
open issues
remarks
```

### 26.3 API

```text
POST /api/v1/shopfloor/handover
```

Request:

```json
{
  "clientEventId": "local-uuid-008",
  "orderId": "uuid",
  "fromStage": "SEWING_WIP",
  "toStage": "SEWN_WAITING_WASH",
  "fromDepartmentId": "uuid",
  "toDepartmentId": "uuid",
  "qty": 800,
  "batchOrBundleRefs": ["BND-1001", "BND-1002"],
  "qcStatus": "PASSED",
  "openIssues": null,
  "source": "HANDHELD",
  "deviceId": "DEVICE-001",
  "remarks": "Ready for wash"
}
```

### 26.4 Backend Effects

```text
create handover record
move WIP if auto-accept configured
or create pending acceptance
update workcenter queue
audit if exception movement
```

---

## 27. Handover Acceptance Screen

Route:

```text
/mobile/handover/pending
```

Actions:

```text
accept
reject
accept partial
raise issue
```

Reject requires reason.

---

# Part H: WIP Hold, Movement, and Adjustment

---

## 28. WIP Quick Movement Screen

Route:

```text
/mobile/wip/move
```

Used where explicit handover is not required.

Fields:

```text
order
from stage
to stage
quantity
batch/bundle reference
remarks
```

Permission:

```text
wip.move
```

---

## 29. WIP Hold Screen

Route:

```text
/mobile/wip/hold
```

Fields:

```text
order
stage
quantity
hold reason
owner
expected resolution
remarks
photo
```

API:

```text
POST /api/v1/wip/{wipItemId}/hold
```

---

## 30. WIP Release Hold Screen

Route:

```text
/mobile/wip/release-hold
```

Fields:

```text
released quantity
resolution note
evidence
```

---

# Part I: Finishing, Packing, and Shipment Floor Capture

---

## 31. Finishing Output Capture

Route:

```text
/mobile/finishing/output
```

Fields:

```text
order
quantity finished
defect quantity
rework quantity
net-good quantity
remarks
```

Backend effects:

```text
update WIP to FINISHED_WAITING_FINAL_QC
update order stage
check shipment risk
```

---

## 32. Packing Output Capture

Route:

```text
/mobile/packing/output
```

Fields:

```text
order
packed quantity
carton count
barcode status
packing issue
remarks
```

Backend effects:

```text
update PACKED_GOODS
update shipment readiness
calculate short quantity
```

---

## 33. Shipment Floor Status Capture

Route:

```text
/mobile/shipment/status
```

Fields:

```text
order
cartons ready
packing list ready
invoice ready
forwarder status
dispatch status
remarks
```

Backend effects:

```text
update shipment checklist
recalculate shipment readiness
```

---

# Part J: Shift Closure

---

## 34. Shift Closure Screen

Route:

```text
/mobile/shift-closure
```

### 34.1 Purpose

Supervisor confirms that output, defects, WIP, downtime, and open issues are complete for the shift.

### 34.2 Required Fields

```text
factory
department/workcenter/line
shift date
shift name
output confirmed
defects confirmed
WIP handover confirmed
downtime confirmed
open issues
next shift instructions
```

### 34.3 API

```text
POST /api/v1/shopfloor/shift-closure
```

Request:

```json
{
  "clientEventId": "local-uuid-009",
  "workcenterId": "uuid",
  "lineId": "uuid",
  "shiftDate": "2026-06-05",
  "shiftName": "A",
  "outputConfirmed": true,
  "defectsConfirmed": true,
  "wipHandoverConfirmed": true,
  "downtimeConfirmed": true,
  "openIssues": [
    "Bartack machine pending maintenance"
  ],
  "nextShiftInstructions": "Prioritize remaining waistband operations.",
  "source": "HANDHELD",
  "deviceId": "DEVICE-001"
}
```

### 34.4 Validation

Warn if:

```text
no output recorded for active line
open downtime not resolved
WIP handover pending
open RED exception exists
pending sync entries exist
```

---

# Part K: QR / Barcode Readiness

---

## 35. QR/Barcode Use Cases

Not mandatory in MVP, but architecture should support:

```text
scan order
scan bundle
scan wash batch
scan carton
scan machine
scan operator badge
```

### 35.1 Benefits

```text
reduces typing
reduces wrong order selection
improves bundle traceability
supports faster handover
```

### 35.2 QR Payload Recommendation

For internal QR codes:

```json
{
  "entityType": "WASH_BATCH",
  "entityId": "uuid",
  "displayCode": "WB-1001"
}
```

Do not rely only on display code if UUID is available.

---

# Part L: Offline Sync API

---

## 36. Offline Sync Endpoint

```text
POST /api/v1/shopfloor/offline-sync
```

### 36.1 Request

```json
{
  "deviceId": "DEVICE-001",
  "userId": 101,
  "entries": [
    {
      "localId": "local-uuid-1",
      "clientEventId": "local-uuid-1",
      "entryType": "SEWING_OUTPUT",
      "originalTimestamp": "2026-06-05T14:00:00+07:00",
      "payload": {
        "orderId": "uuid",
        "lineId": "uuid",
        "grossQty": 300,
        "defectQty": 12,
        "reworkQty": 8
      }
    }
  ]
}
```

### 36.2 Response

```json
{
  "data": {
    "synced": [
      {
        "localId": "local-uuid-1",
        "serverId": "uuid",
        "status": "SYNCED"
      }
    ],
    "conflicts": [
      {
        "localId": "local-uuid-2",
        "status": "CONFLICT",
        "reason": "Wash batch already closed"
      }
    ],
    "failed": [
      {
        "localId": "local-uuid-3",
        "status": "FAILED",
        "reason": "Invalid order ID"
      }
    ]
  },
  "meta": {},
  "errors": []
}
```

---

## 37. Local Storage Requirements

Frontend should store locally:

```text
pending entries
draft forms
last assigned task list
user/device identity
last sync timestamp
```

Avoid storing sensitive data beyond operational need.

---

# Part M: Device and Session Control

---

## 38. Device Registration

Recommended fields:

```text
device_id
device_name
device_type
assigned_factory
assigned_department
active_status
last_seen_at
app_version
browser_info
```

MVP may skip formal device registration but should still send device ID from local app storage.

---

## 39. Session Rules

```text
shopfloor session should timeout after configured period
user must re-login after timeout
device should not store password
sync should fail if user session invalid
```

---

## 40. App Version Control

Mobile API should return:

```text
minimum supported app version
current frontend build version
force refresh flag if needed
```

This avoids old cached PWA code causing invalid submissions.

---

# Part N: Security

---

## 41. Authentication

Use same backend authentication as web app.

Options:

```text
session auth for same-domain web
JWT/token auth for mobile/PWA
```

## 42. Authorization

All submit APIs must check:

```text
user role
assigned line/workcenter
action permission
factory scope
```

Example:

```text
Line Supervisor for Line 05 cannot submit output for Line 09 unless authorized.
```

## 43. Audit

Audit required for:

```text
manual WIP movement
hold release
rewash marking
downtime closure
shift closure
quantity correction
offline conflict override
```

## 44. Data Protection

Avoid displaying unnecessary sensitive data on shopfloor devices.

Shopfloor screens should show:

```text
order number
style code
quantity
stage
task
```

They should not show:

```text
financial data
customer commercial terms
system administration data
```

---

# Part O: Backend Services

---

## 45. Recommended Backend Modules

```text
shopfloor
sewing
washing
quality
wip_inventory
exceptions
shipment
audit_governance
identity_access
```

## 46. Recommended Shopfloor App Structure

```text
shopfloor/
  models.py
  serializers.py
  views.py
  urls.py
  services.py
  selectors.py
  tasks.py
  permissions.py
  tests/
```

Possible models:

```text
ShopfloorDevice
ShopfloorTask
OfflineSyncBatch
OfflineSyncEntry
ShiftClosure
AndonIssue
DowntimeEvent
DepartmentHandover
```

Some models may reside in domain apps. Keep ownership clear.

---

## 47. Service Functions

```python
get_shopfloor_home(user, date)
create_shopfloor_event(payload, user)
sync_offline_entries(device, entries, user)
record_downtime(payload, user)
resolve_downtime(downtime, payload, user)
raise_andon_issue(payload, user)
submit_handover(payload, user)
accept_handover(handover, user)
close_shift(payload, user)
```

---

# Part P: Frontend Implementation Notes

---

## 48. Mobile Route Structure

Recommended:

```text
/mobile
/mobile/home
/mobile/sewing/output
/mobile/wash
/mobile/wash/batches/:id
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

## 49. PWA Requirements

```text
installable app manifest
offline fallback page
service worker for caching shell
local storage / IndexedDB for pending events
sync retry
visible sync status
network status indicator
```

## 50. Form UX

```text
large buttons
numeric input pads
default current time
preselected task context
minimal mandatory typing
confirm before submit
success haptic/visual feedback where possible
```

## 51. Error UX

Errors should be actionable.

Example:

```text
Cannot submit output. This order is no longer active on Line 05. Refresh tasks.
```

Not:

```text
Validation failed.
```

---

# Part Q: Analytics and Monitoring

---

## 52. Shopfloor Capture KPIs

Track:

```text
output capture timeliness
missing output slots
offline sync failures
pending sync count
handover acceptance delay
downtime reporting delay
QC capture delay
shift closure completion
stale line data
```

## 53. Data Freshness

A line/workcenter should be marked stale if:

```text
active shift
active release
no output/event captured beyond threshold
```

Example:

```text
Line 05 has no output update for 90 minutes.
```

This should create:

```text
SYSTEM_DATA or SHOPFLOOR_DATA_STALE exception
```

---

# Part R: Testing Requirements

---

## 54. Unit Tests

Required tests:

```text
net-good output calculation
idempotency duplicate prevention
offline sync classification
assigned scope validation
handover quantity validation
downtime status transition
shift closure validation
```

## 55. API Tests

Required tests:

```text
shopfloor home returns assigned tasks
line supervisor cannot submit other line output
sewing output updates WIP
wash step completion updates batch state
QC hold creates exception
handover moves WIP or creates pending acceptance
offline sync handles success/conflict/failure
shift closure blocks if required confirmations missing
```

## 56. E2E Tests

### 56.1 Sewing Output to Planner Dashboard

```text
supervisor submits output
→ WIP updates
→ line dashboard updates
→ risk recalculates
```

### 56.2 Wash Rewash from Mobile

```text
wash supervisor marks rewash
→ batch status changes
→ WIP moves to REWASH_WIP
→ exception created
→ shipment risk recalculates
```

### 56.3 Offline Sync

```text
device offline
→ output saved locally
→ network returns
→ sync succeeds
→ duplicate retry does not duplicate output
```

---

# Part S: Implementation Phasing

---

## 57. Phase 1: Mobile Foundation

Build:

```text
PWA shell
mobile login/session
shopfloor home
assigned tasks API
sync status
device ID
```

## 58. Phase 2: Sewing Output and Downtime

Build:

```text
sewing output capture
defect quick capture
downtime start/resolve
line summary update
```

## 59. Phase 3: Wash Execution

Build:

```text
wash mobile board
start/complete wash step
mark rewash
release to finishing
```

## 60. Phase 4: QC and Handover

Build:

```text
QC inspection capture
QC hold/release
handover submit/accept
WIP hold/release
```

## 61. Phase 5: Offline Sync and Shift Closure

Build:

```text
offline queue
sync endpoint
conflict screen
shift closure
data freshness alerts
```

## 62. Phase 6: QR/Barcode and Advanced Controls

Build:

```text
QR scan
bundle scan
batch scan
carton scan
device registration
push notifications
```

---

# Part T: Open Decisions

---

## 63. Decisions Required

Before build, confirm:

1. Which shopfloor devices will be used?
2. Is factory Wi-Fi reliable enough for online-first capture?
3. Is offline support required from phase 1?
4. Will supervisors capture hourly output or shift-level output first?
5. Will QC inspectors use handheld devices from MVP?
6. Are bundle IDs and wash batch IDs physically tagged today?
7. Should handover require receiver acceptance?
8. Who can correct a mistaken shopfloor entry?
9. Should photos be mandatory for certain defects/holds?
10. Which screens must work in local language if required?
11. Should QR/barcode be part of MVP or later?
12. What is the acceptable stale-data threshold by workcenter?

---

## 64. Non-Negotiable Rules

```text
1. Shopfloor actuals must feed planning state.
2. Every mobile event must include user, timestamp, source, and device.
3. Duplicate mobile submissions must not duplicate output.
4. Offline entries must preserve original timestamp.
5. Shopfloor user can act only within assigned scope.
6. WIP movement must validate quantity and hold status.
7. Rewash and QC holds must update WIP and exceptions.
8. Shift closure must flag missing output/handover/downtime.
9. Stale shopfloor data must be visible.
10. Handheld UI must be action-first and minimal typing.
```

---

## 65. Summary

This document defines the handheld / shopfloor capture technical spine for the Eratex Planning & Scheduling Platform.

The handheld layer must capture live operational reality:

```text
sewing output
wash execution
QC defects
WIP movement
handover
downtime
andon issues
packing/shipment updates
shift closure
```

It must integrate tightly with:

```text
WIP inventory
workcenter load
exceptions
shipment readiness
planning boards
analytics
```

The key design principle is:

```text
The planning board is only as accurate as the shopfloor capture layer.
```

Therefore, handheld/PWA capture must be treated as a core MVP capability, not a later reporting add-on.
