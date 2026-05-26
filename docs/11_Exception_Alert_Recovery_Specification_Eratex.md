# 11. Exception, Alert, and Recovery Specification  
# Eratex End-to-End Planning & Scheduling Platform

**Company:** Eratex  
**Product:** Planning & Scheduling Tool for Denim Bottoms + Chinos Manufacturing  
**Document Type:** Exception, Alert, and Recovery Specification  
**Version:** 2.0  
**Date:** 2026-05-26  
**Backend Stack:** Django + Django REST Framework + PostgreSQL + Celery  
**Frontend Stack Context:** React/Next.js Planning Workbenches + PWA Shopfloor Capture  
**Related Documents:**  
- 04 Planning Logic and Calculation Flows  
- 05 Backend Domain Module Specification  
- 06 API and Data Contracts Specification  
- 07 Event and State Transition Specification  
- 08 WIP Inventory and Reconciliation Specification  
- 10 Wash Planning and Execution Specification  

---

## 1. Purpose

This document defines the exception, alert, escalation, and recovery model for the Eratex Planning & Scheduling Platform.

The platform must not only show plans and dashboards. It must help users control execution by identifying problems early, assigning ownership, recommending recovery, tracking closure, and protecting shipment commitments.

This document defines:

```text
exception categories
alert rules
severity logic
exception lifecycle
ownership and SLA
auto-generation rules
manual exception creation
recovery action model
recovery impact preview
escalation rules
notification requirements
frontend surfaces
backend services
APIs
audit requirements
testing requirements
implementation phases
```

---

## 2. Core Thesis

The platform must convert operational variance into controlled action.

The core loop is:

```text
Detect variance
→ classify exception
→ assign severity
→ assign owner
→ recommend recovery
→ track action
→ escalate if delayed
→ close with evidence
→ learn from recurrence
```

Without this loop, the system becomes another reporting layer. Users will still depend on meetings, WhatsApp, calls, and Excel follow-up to recover the plan.

---

## 3. Business Context

Eratex-scale garment manufacturing has many sources of operational variance:

```text
fabric delay
fabric QC failure
PCD blockers
cutting delay
sewing line underperformance
skill gap
machine breakdown
WIP ageing
wash overload
rewash
post-wash QC failure
final QC hold
packing delay
shipment documentation delay
```

A factory may still maintain OTIF above 95%, but only by incurring extra operating expense:

```text
overtime
extra shifts
premium freight
split shipments
manual expediting
last-minute line reshuffling
high management follow-up
```

Therefore, the system must show not only whether shipment is saved, but how much recovery stress was required.

---

## 4. Scope

This specification covers:

```text
1. Exception master and categories
2. Alert rules
3. Severity calculation
4. Exception lifecycle
5. Owner assignment
6. Escalation
7. Recovery actions
8. Recovery impact preview
9. Notification rules
10. Exception dashboards
11. Role-specific action inbox
12. Exception linkage to order, WIP, workcenter, wash batch, QC, shipment
13. Audit and closure evidence
14. Analytics and recurrence
15. APIs
16. Testing
```

---

## 5. Definitions

### 5.1 Alert

An alert is an early signal that something may need attention.

Example:

```text
Wet wash utilization is 92%.
```

### 5.2 Exception

An exception is a condition requiring ownership and action.

Example:

```text
Wet wash utilization is 130% and affects RED shipment orders.
```

### 5.3 Recovery Action

A recovery action is a defined intervention to resolve or reduce the impact of an exception.

Example:

```text
Add 2 hours overtime in wet wash today.
```

### 5.4 Escalation

Escalation is a state where the issue needs higher-level attention due to severity, ageing, or missed closure commitment.

Example:

```text
RED wash exception is still open after due date.
```

---

# Part A: Exception Model

---

## 6. Exception Categories

Recommended exception categories:

```text
APPROVAL
MATERIAL
FABRIC_QC
PCD
CAPACITY
CUTTING
SEWING
WASH
QUALITY
WIP
REWORK
SHIPMENT
SYSTEM_DATA
INTEGRATION
MAINTENANCE
```

### 6.1 Category Usage

| Category | Typical Use |
|---|---|
| APPROVAL | buyer/technical/internal approval delays |
| MATERIAL | fabric/trim/packing shortage or vendor delay |
| FABRIC_QC | fabric inspection failure/hold |
| PCD | pre-cut date readiness blocker |
| CAPACITY | overloaded workcenter or line |
| CUTTING | cutting delay, cutting QC issue |
| SEWING | line shortfall, absenteeism, imbalance |
| WASH | wash queue, rewash, post-wash issue |
| QUALITY | defects, holds, AQL issue |
| WIP | ageing, blocked WIP, reconciliation gap |
| REWORK | rework ageing or capacity impact |
| SHIPMENT | shipment readiness blocker |
| SYSTEM_DATA | missing or stale data |
| INTEGRATION | import/sync failure |
| MAINTENANCE | machine breakdown |

---

## 7. Severity Model

Severity values:

```text
GREEN
YELLOW
RED
BLACK
```

### 7.1 Meaning

| Severity | Meaning |
|---|---|
| GREEN | Informational or resolved-normal |
| YELLOW | Watch condition; intervention may be needed |
| RED | Action required; plan/shipment at risk |
| BLACK | Critical; shipment miss or severe disruption likely |

### 7.2 Severity Should Consider

```text
time remaining to shipment
quantity affected
workcenter criticality
customer priority
order value or strategic importance
current stage
open blockers
recovery feasibility
recurrence
```

### 7.3 Severity Governance

Severity should not be decorative. It must determine:

```text
owner requirement
due date requirement
escalation rule
notification urgency
dashboard ranking
closure approval requirement
```

---

## 8. Exception Record

### 8.1 Required Fields

```text
exception_id
exception_no
category
severity
status
description
order_id, optional
style_id, optional
workcenter_id, optional
line_id, optional
wash_batch_id, optional
wip_item_id, optional
qc_inspection_id, optional
shipment_readiness_id, optional
owner_id
due_date
suggested_action
escalation_level
created_by
created_at
updated_at
closed_by
closed_at
closure_note
```

### 8.2 Optional Fields

```text
root_cause_code
impact_quantity
impact_minutes
impact_cost
shipment_impact_flag
source_event
auto_generated_flag
recurrence_count
linked_recovery_action_ids
evidence_url
```

### 8.3 Exception API Shape

```json
{
  "id": "uuid",
  "exceptionNo": "EXC-1001",
  "category": "WASH",
  "severity": "RED",
  "status": "OPEN",
  "description": "Wet wash queue exceeds available capacity.",
  "order": {
    "id": "uuid",
    "orderNo": "ORD-1001",
    "styleCode": "STY-5001"
  },
  "workcenter": {
    "id": "uuid",
    "name": "Wet Wash"
  },
  "owner": {
    "id": 78,
    "displayName": "Washing Manager"
  },
  "dueDate": "2026-06-06",
  "shipmentImpacting": true,
  "suggestedAction": "Add wash shift or resequence low-risk batches",
  "createdAt": "2026-06-05T10:00:00+07:00"
}
```

---

# Part B: Exception Lifecycle

---

## 9. Exception Status Values

```text
OPEN
ASSIGNED
IN_PROGRESS
ESCALATED
RESOLVED
CLOSED
REOPENED
CANCELLED
```

### 9.1 Status Meaning

| Status | Meaning |
|---|---|
| OPEN | Exception created but not actively worked |
| ASSIGNED | Owner assigned |
| IN_PROGRESS | Owner working on resolution |
| ESCALATED | Higher-level attention required |
| RESOLVED | Action completed; awaiting confirmation/closure |
| CLOSED | Officially closed |
| REOPENED | Issue recurred after closure |
| CANCELLED | Duplicate or invalid exception |

---

## 10. Exception Transitions

| From | To | Trigger |
|---|---|---|
| OPEN | ASSIGNED | owner assigned |
| ASSIGNED | IN_PROGRESS | work started |
| OPEN/ASSIGNED/IN_PROGRESS | ESCALATED | severity/time rule |
| IN_PROGRESS | RESOLVED | owner marks resolved |
| RESOLVED | CLOSED | authorized closure |
| CLOSED | REOPENED | issue reappears |
| OPEN | CANCELLED | duplicate/invalid |

### 10.1 Transition Rules

```text
RED/BLACK exception must have owner.
RED/BLACK exception must have due date.
Closure requires closure note.
Critical exception closure may require higher permission.
Reopen requires reopen reason.
Cancellation requires duplicate/invalid reason.
```

---

## 11. Exception Ownership

### 11.1 Owner Assignment Logic

Owner can be:

```text
manually assigned by planner/manager
auto-suggested from category
auto-suggested from workcenter owner
auto-suggested from order owner
auto-suggested from department
```

### 11.2 Default Owner by Category

| Category | Suggested Owner |
|---|---|
| MATERIAL | Procurement owner |
| FABRIC_QC | Fabric QC lead |
| PCD | Production planner / merchandising owner |
| CAPACITY | Planning head / workcenter owner |
| SEWING | Sewing manager / line supervisor |
| WASH | Washing manager |
| QUALITY | QC manager |
| WIP | Department owner of current stage |
| SHIPMENT | Shipment/logistics owner |
| SYSTEM_DATA | System admin / data owner |
| INTEGRATION | Integration owner |
| MAINTENANCE | Maintenance lead |

---

## 12. Due Date and SLA Logic

### 12.1 Due Date Defaults

Default due date should depend on severity.

```text
YELLOW: 2–3 days or before next planning review
RED: same day or next working day
BLACK: immediate / within current shift
```

### 12.2 SLA Fields

```text
created_at
due_date
first_response_at
resolved_at
closed_at
sla_status
```

### 12.3 SLA Status

```text
ON_TIME
DUE_SOON
OVERDUE
BREACHED
```

---

# Part C: Alert Rules and Exception Generation

---

## 13. Alert vs Exception Conversion

Not every alert should create an exception.

Example:

```text
Workcenter utilization at 92% = alert
Workcenter utilization at 130% with shipment-risk orders = exception
```

### 13.1 Alert Levels

```text
INFO
WATCH
ACTION
CRITICAL
```

### 13.2 Conversion Rule

Convert alert to exception when:

```text
threshold crosses RED/BLACK
or shipment impact exists
or owner action is required
or condition persists beyond time threshold
```

---

## 14. Auto-Generated Exception Rules

## 14.1 PCD Exception

Trigger:

```text
planned PCD date within escalation threshold
and PCD readiness not READY/CONDITIONALLY_READY
```

Exception:

```text
category = PCD
severity = RED or BLACK based on days remaining
owner = order owner or planning owner
```

Suggested actions:

```text
complete blocker checklist
request conditional release
escalate material/fabric approval
revise cutting plan
```

---

## 14.2 Material Delay Exception

Trigger:

```text
material ETA > required date
or material shortage unresolved
```

Exception:

```text
category = MATERIAL
severity based on PCD/shipment impact
```

Suggested actions:

```text
vendor escalation
alternate vendor
partial production approval
revise PCD
split shipment
```

---

## 14.3 Fabric QC Exception

Trigger:

```text
fabric QC failed
fabric QC hold open
rolls pending close to PCD
```

Exception:

```text
category = FABRIC_QC
owner = fabric QC lead
```

Suggested actions:

```text
complete inspection
segregate failed rolls
approve waiver
request replacement fabric
revise marker/shade plan
```

---

## 14.4 Workcenter Capacity Exception

Trigger:

```text
workcenter utilization > red threshold
or queue ageing > red threshold
```

Exception:

```text
category = CAPACITY
workcenter linked
severity based on overload and shipment impact
```

Suggested actions:

```text
add shift/overtime
resequencing
move lower-risk orders
use alternate workcenter
approve outsourcing if allowed
```

---

## 14.5 Sewing Shortfall Exception

Trigger:

```text
projected end-of-day net-good output < daily target by threshold
```

Inputs:

```text
daily target
actual net-good output
elapsed time
remaining time
achievable run rate
```

Suggested actions:

```text
line rebalance
add skilled operator
fix bottleneck operation
move machine
add overtime
reduce next release
```

---

## 14.6 Wash Queue Exception

Trigger:

```text
SEWN_WAITING_WASH ageing > threshold
or wash queue quantity exceeds capacity
```

Suggested actions:

```text
create priority wash batch
add wet wash shift
use alternate machine
split urgent batch
move non-urgent batch later
```

---

## 14.7 Rewash Exception

Trigger:

```text
post-wash QC result = REWASH_REQUIRED
or rewash qty > threshold
or rewash cycle count exceeds threshold
```

Suggested actions:

```text
create rewash batch
assign touch-up team
escalate wash standard review
approve split shipment
```

---

## 14.8 WIP Ageing Exception

Trigger:

```text
WIP age > red/black threshold for stage
```

Suggested actions:

```text
release to next process
resolve hold
assign owner
prioritize current stage
create recovery action
```

---

## 14.9 WIP Reconciliation Exception

Trigger:

```text
impossible quantity chain
or unexplained loss above threshold
```

Suggested actions:

```text
verify output entries
review handover records
perform physical count
create adjustment with approval
```

---

## 14.10 Quality Hold Exception

Trigger:

```text
QC hold created
or defect rate above threshold
or AQL failure
```

Suggested actions:

```text
segregate defective quantity
create rework order
release passed quantity
escalate to QC manager
review operation/bulletin
```

---

## 14.11 Shipment Readiness Exception

Trigger:

```text
shipment due within threshold
and readiness not READY
```

Blockers may include:

```text
packed qty short
AQL pending
final QC hold
documents pending
forwarder booking pending
barcode mismatch
```

Suggested actions:

```text
complete packing
expedite AQL
assign documentation owner
approve split shipment
escalate shipment risk
```

---

## 14.12 System Data Exception

Trigger:

```text
style missing approved operation bulletin
line missing shift calendar
vendor missing lead time
stale shopfloor output
integration failure
missing wash route
```

Suggested actions:

```text
complete master data
assign data owner
block planning until fixed
use approved temporary assumption
```

---

# Part D: Severity Calculation

---

## 15. Severity Inputs

Severity should consider:

```text
time_to_commitment
shipment impact
quantity affected
capacity impact
workcenter criticality
customer priority
open blocker type
recovery feasibility
exception age
recurrence
```

---

## 16. Suggested Severity Score

```text
severity_score =
time_urgency_score
+ shipment_impact_score
+ quantity_impact_score
+ capacity_impact_score
+ customer_priority_score
+ recurrence_score
- recovery_feasibility_score
```

Map:

```text
0–30 = GREEN/INFO
31–55 = YELLOW
56–80 = RED
81+ = BLACK
```

These thresholds should be configurable.

---

## 17. Severity Override

Authorized managers should be allowed to override severity, but must provide:

```text
reason
old severity
new severity
user
timestamp
audit event
```

---

# Part E: Recovery Action Model

---

## 18. Recovery Action Definition

A recovery action is a planned intervention to reduce or remove the impact of an exception.

Examples:

```text
add overtime
add extra shift
move order to another line
split order
resequencing wash
move skilled operator
move machine
expedite material
approve conditional release
approve split shipment
release QC hold
create rework batch
```

---

## 19. Recovery Action Fields

```text
recovery_action_id
exception_id
order_id
action_type
description
owner_id
target_date
status
capacity_impact
shipment_impact
cost_impact
approval_required
approved_by
approved_at
completed_at
closure_note
created_at
updated_at
```

---

## 20. Recovery Action Types

Recommended action types:

```text
ADD_OVERTIME
ADD_SHIFT
MOVE_ORDER_TO_ALTERNATE_LINE
SPLIT_ORDER
RESEQUENCE_PLAN
RESEQUENCE_WASH
MOVE_MACHINE
MOVE_OPERATOR
EXPEDITE_MATERIAL
APPROVE_CONDITIONAL_PCD
APPROVE_RELEASE_OVERRIDE
CREATE_REWORK_BATCH
RELEASE_QC_HOLD
APPROVE_SPLIT_SHIPMENT
OUTSOURCE_PROCESS
REVISE_SHIPMENT_COMMITMENT
MASTER_DATA_CORRECTION
```

---

## 21. Recovery Action Status

```text
OPEN
ASSIGNED
IN_PROGRESS
APPROVAL_PENDING
APPROVED
REJECTED
COMPLETED
FAILED
CANCELLED
```

### 21.1 Transitions

| From | To | Trigger |
|---|---|---|
| OPEN | ASSIGNED | owner assigned |
| ASSIGNED | IN_PROGRESS | work starts |
| OPEN/ASSIGNED | APPROVAL_PENDING | approval required |
| APPROVAL_PENDING | APPROVED | approval granted |
| APPROVAL_PENDING | REJECTED | approval rejected |
| IN_PROGRESS/APPROVED | COMPLETED | action completed |
| IN_PROGRESS | FAILED | action failed |
| OPEN/ASSIGNED | CANCELLED | no longer required |

---

## 22. Recovery Impact Preview

Before applying recovery, the system should show impact.

### 22.1 Inputs

```text
current plan
affected order
affected workcenter
capacity load
shipment risk
WIP position
cost proxy if available
```

### 22.2 Output

```text
capacity before/after
shipment risk before/after
other orders affected
additional cost indicator
approval requirement
recommended action
```

### 22.3 Example

```json
{
  "actionType": "ADD_OVERTIME",
  "capacityImpact": {
    "workcenter": "Wet Wash",
    "additionalMinutes": 240,
    "utilizationBefore": 130.0,
    "utilizationAfter": 108.0
  },
  "shipmentImpact": {
    "orderNo": "ORD-1001",
    "riskBefore": "RED",
    "riskAfter": "YELLOW"
  },
  "costImpact": {
    "costType": "OVERTIME",
    "estimateAvailable": false
  },
  "approvalRequired": true
}
```

---

## 23. Recovery Recommendation Rules

## 23.1 PCD Blocker

If PCD blocked by non-critical pending item:

```text
recommend conditional release if downstream risk acceptable
```

If PCD blocked by fabric QC fail:

```text
recommend segregate passed rolls or request fabric replacement
```

---

## 23.2 Sewing Shortfall

If shortfall due to bottleneck operation:

```text
recommend line balance review
```

If shortfall due to absenteeism:

```text
recommend add operator or reduce target
```

If shortfall due to machine issue:

```text
recommend maintenance or move machine
```

---

## 23.3 Wash Constraint

If wash overloaded:

```text
recommend resequence by shipment risk
recommend overtime/extra shift
recommend split urgent batch
recommend move lower-risk batch
```

If rewash high:

```text
recommend QC review and wash standard review
```

---

## 23.4 Shipment Readiness

If documents pending:

```text
assign documentation owner
```

If packed short:

```text
prioritize finishing/packing
```

If AQL pending:

```text
schedule inspection
```

If production cannot complete:

```text
recommend split shipment approval
```

---

# Part F: Escalation Model

---

## 24. Escalation Triggers

Escalate when:

```text
exception severity = BLACK
due date missed
owner not assigned within threshold
RED exception remains open beyond threshold
shipment risk worsens
recovery action fails
same exception recurs repeatedly
```

---

## 25. Escalation Levels

```text
LEVEL_0 = owner
LEVEL_1 = department manager
LEVEL_2 = planning head / production head
LEVEL_3 = factory management
LEVEL_4 = executive escalation
```

---

## 26. Escalation Routing

| Category | Level 1 | Level 2 | Level 3 |
|---|---|---|---|
| MATERIAL | Procurement Manager | Planning Head | Factory Head |
| PCD | Planning Head | Production Head | Factory Head |
| SEWING | Sewing Manager | Production Head | Factory Head |
| WASH | Washing Manager | Production Head | Factory Head |
| QUALITY | QC Manager | Factory Quality Head | Factory Head |
| SHIPMENT | Shipment Manager | Planning Head | Factory Head |
| SYSTEM_DATA | System Admin | Tech/Product Owner | Management |

---

## 27. Escalation Event Payload

```json
{
  "eventType": "exception.escalated",
  "exceptionId": "uuid",
  "exceptionNo": "EXC-1001",
  "oldEscalationLevel": "LEVEL_0",
  "newEscalationLevel": "LEVEL_1",
  "reason": "Due date missed",
  "escalatedAt": "2026-06-06T09:00:00+07:00",
  "escalatedToRole": "WASHING_MANAGER"
}
```

---

# Part G: Notification Model

---

## 28. Notification Channels

MVP:

```text
in-app notification
dashboard badge
action inbox
email optional
```

Mature state:

```text
SMS/WhatsApp integration optional
push notification for PWA
role-based escalation digest
```

---

## 29. Notification Rules

Notify when:

```text
exception assigned
exception escalated
recovery action assigned
recovery action overdue
shipment risk becomes RED/BLACK
PCD blocker escalated
wash rewash marked
critical WIP ageing detected
```

---

## 30. Notification Throttling

Avoid alert fatigue.

Rules:

```text
do not create duplicate active exception for same rule/context
group similar alerts
suppress repeated notifications within configured window
escalate instead of spamming same owner
```

---

# Part H: Frontend Surfaces

---

## 31. Exception Control Tower

Route:

```text
/exceptions/control-tower
```

### 31.1 Header Cards

```text
Open Exceptions
RED/BLACK Exceptions
Shipment-Impacting Exceptions
Overdue Exceptions
Unassigned Exceptions
Recovery Actions Due Today
Repeated Exceptions
```

### 31.2 Filters

```text
factory
category
severity
status
owner
customer
order
shipment week
workcenter
line
stage
overdue only
shipment-impacting only
unassigned only
```

### 31.3 Grid Columns

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

### 31.4 Actions

```text
assign owner
start progress
add recovery action
escalate
mark resolved
close
reopen
open linked order
open linked WIP
open linked plan
```

---

## 32. Role-Based Action Inbox

Route:

```text
/my-actions
```

Purpose:

```text
show exceptions and recovery actions assigned to current user
```

Sections:

```text
due now
overdue
shipment impacting
waiting for my approval
recovery actions
informational alerts
```

---

## 33. Exception Detail Drawer

Should show:

```text
exception summary
linked order/workcenter/WIP/wash batch
timeline
owner and SLA
suggested recovery actions
comments
audit trail
closure form
```

---

## 34. Recovery Action Board

Route:

```text
/recovery/actions
```

Columns:

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

---

## 35. Alerts Panel

A lighter panel for alerts that are not yet exceptions.

Examples:

```text
Wet wash utilization at 92%
Line 05 no output update for 90 minutes
Packing documents pending for shipment in 5 days
```

User actions:

```text
acknowledge
convert to exception
assign owner
dismiss if allowed
```

---

# Part I: APIs

---

## 36. Exception List API

### 36.1 GET /api/v1/exceptions

Query params:

```text
factoryId
category
severity
status
ownerId
orderId
workcenterId
lineId
shipmentImpactingOnly
overdueOnly
unassignedOnly
dateFrom
dateTo
search
page
pageSize
```

Response item:

```json
{
  "id": "uuid",
  "exceptionNo": "EXC-1001",
  "category": "WASH",
  "severity": "RED",
  "status": "OPEN",
  "description": "Wet wash queue exceeds available capacity.",
  "order": {
    "id": "uuid",
    "orderNo": "ORD-1001",
    "styleCode": "STY-5001"
  },
  "workcenter": {
    "id": "uuid",
    "name": "Wet Wash"
  },
  "owner": {
    "id": 78,
    "displayName": "Washing Manager"
  },
  "dueDate": "2026-06-06",
  "ageingHours": 14.5,
  "shipmentImpacting": true,
  "suggestedAction": "Add wash shift or resequence low-risk batches",
  "recoveryActionCount": 2
}
```

---

## 37. Exception Detail API

### 37.1 GET /api/v1/exceptions/{exceptionId}

Response:

```json
{
  "data": {
    "id": "uuid",
    "exceptionNo": "EXC-1001",
    "category": "WASH",
    "severity": "RED",
    "status": "OPEN",
    "description": "Wet wash queue exceeds available capacity.",
    "linkedEntities": {
      "orderId": "uuid",
      "workcenterId": "uuid",
      "wipItemId": "uuid",
      "washBatchId": null
    },
    "owner": {
      "id": 78,
      "displayName": "Washing Manager"
    },
    "dueDate": "2026-06-06",
    "suggestedActions": [
      "Add wash shift",
      "Resequence low-risk batches"
    ],
    "timeline": [
      {
        "eventType": "exception.created",
        "createdAt": "2026-06-05T10:00:00+07:00",
        "message": "Exception created by system"
      }
    ],
    "comments": [],
    "recoveryActions": []
  },
  "meta": {},
  "errors": []
}
```

---

## 38. Create Exception API

### 38.1 POST /api/v1/exceptions

Request:

```json
{
  "category": "WIP",
  "severity": "RED",
  "orderId": "uuid",
  "stage": "SEWN_WAITING_WASH",
  "description": "Sewn WIP ageing above threshold.",
  "ownerId": 78,
  "dueDate": "2026-06-06",
  "suggestedAction": "Prioritize wash batch creation."
}
```

Response:

```json
{
  "data": {
    "exceptionId": "uuid",
    "exceptionNo": "EXC-1002",
    "status": "OPEN"
  },
  "meta": {},
  "errors": []
}
```

---

## 39. Assign Exception API

### 39.1 POST /api/v1/exceptions/{exceptionId}/assign

Request:

```json
{
  "ownerId": 78,
  "dueDate": "2026-06-06",
  "remarks": "Assigned to washing manager"
}
```

---

## 40. Escalate Exception API

### 40.1 POST /api/v1/exceptions/{exceptionId}/escalate

Request:

```json
{
  "escalationLevel": "LEVEL_1",
  "reason": "Due date missed"
}
```

---

## 41. Close Exception API

### 41.1 POST /api/v1/exceptions/{exceptionId}/close

Request:

```json
{
  "closureNote": "Additional wash shift completed and queue cleared.",
  "evidenceUrl": null
}
```

Response:

```json
{
  "data": {
    "exceptionId": "uuid",
    "status": "CLOSED",
    "closedAt": "2026-06-06T15:00:00+07:00"
  },
  "meta": {},
  "errors": []
}
```

---

## 42. Recovery Action APIs

### 42.1 GET /api/v1/recovery-actions

Query params:

```text
exceptionId
orderId
ownerId
status
actionType
dueToday
overdueOnly
```

### 42.2 POST /api/v1/recovery-actions

Request:

```json
{
  "exceptionId": "uuid",
  "orderId": "uuid",
  "actionType": "ADD_OVERTIME",
  "description": "Add 2 hours overtime in wet wash.",
  "ownerId": 78,
  "targetDate": "2026-06-05",
  "capacityImpact": {
    "additionalMinutes": 240
  },
  "shipmentImpact": {
    "riskAfter": "YELLOW"
  },
  "approvalRequired": true
}
```

### 42.3 POST /api/v1/recovery-actions/{actionId}/complete

Request:

```json
{
  "closureNote": "Overtime completed. 1,200 pcs washed.",
  "actualImpact": {
    "additionalQtyProcessed": 1200
  }
}
```

---

## 43. Recovery Impact Preview API

### 43.1 POST /api/v1/recovery-actions/impact-preview

Request:

```json
{
  "exceptionId": "uuid",
  "actionType": "ADD_OVERTIME",
  "parameters": {
    "workcenterId": "uuid",
    "additionalMinutes": 240,
    "date": "2026-06-05"
  }
}
```

Response:

```json
{
  "data": {
    "canApply": true,
    "approvalRequired": true,
    "capacityImpact": {
      "utilizationBefore": 130.0,
      "utilizationAfter": 108.0
    },
    "shipmentImpact": [
      {
        "orderId": "uuid",
        "orderNo": "ORD-1001",
        "riskBefore": "RED",
        "riskAfter": "YELLOW"
      }
    ],
    "affectedOrders": [],
    "warnings": []
  },
  "meta": {},
  "errors": []
}
```

---

# Part J: Backend Services

---

## 44. Recommended Service Modules

```text
exceptions/services/generator.py
exceptions/services/severity.py
exceptions/services/lifecycle.py
exceptions/services/escalation.py
exceptions/services/notifications.py
rework_recovery/services/recovery_actions.py
rework_recovery/services/impact_preview.py
exceptions/selectors/dashboard.py
exceptions/selectors/inbox.py
```

---

## 45. Core Service Functions

```python
create_exception(...)
auto_generate_exception(rule_code, context)
calculate_exception_severity(context)
assign_exception(exception, owner, due_date, user)
start_exception(exception, user)
resolve_exception(exception, note, user)
close_exception(exception, closure_note, user)
reopen_exception(exception, reason, user)
escalate_exception(exception, reason)
dedupe_exception(rule_code, context)
create_recovery_action(...)
preview_recovery_impact(...)
complete_recovery_action(...)
```

---

## 46. Duplicate Prevention

The system should avoid creating duplicate active exceptions.

Duplicate key can be:

```text
rule_code + order_id + stage
rule_code + workcenter_id + date
rule_code + wash_batch_id
rule_code + shipment_readiness_id
```

If duplicate exists:

```text
update existing exception
append timeline event
increase recurrence count
do not create new exception
```

---

## 47. Scheduled Jobs

Recommended Celery jobs:

```text
hourly_exception_rule_scan
hourly_exception_escalation
daily_exception_digest
daily_recovery_action_overdue_scan
daily_exception_snapshot
```

---

# Part K: Audit Requirements

---

## 48. Mandatory Audit Events

Audit required for:

```text
manual exception creation
severity override
owner assignment
due date change
escalation
closure
reopen
recovery action approval
recovery action completion
exception cancellation
```

---

## 49. Audit Payload Example

```json
{
  "entityType": "ExceptionRecord",
  "entityId": "uuid",
  "action": "EXCEPTION_CLOSED",
  "oldValue": {
    "status": "RESOLVED"
  },
  "newValue": {
    "status": "CLOSED",
    "closureNote": "Wash overtime completed"
  },
  "performedBy": 78,
  "performedAt": "2026-06-06T15:00:00+07:00",
  "reason": "Issue resolved"
}
```

---

# Part L: Analytics

---

## 50. Exception KPIs

Recommended KPIs:

```text
open exceptions
RED/BLACK exceptions
shipment-impacting exceptions
overdue exceptions
unassigned exceptions
average closure time
exception recurrence
exceptions by category
exceptions by owner
exceptions by workcenter
exceptions by customer
recovery action completion rate
cost-protected OTIF count
```

---

## 51. Closure Time

```text
closure_time_hours =
closed_at - created_at
```

---

## 52. SLA Adherence

```text
sla_adherence =
exceptions closed on or before due date / total closed exceptions × 100
```

---

## 53. Recurrence

```text
recurrence_count =
number of exceptions with same rule/context in period
```

Use recurrence to identify systemic problems:

```text
same wash route repeatedly rewashed
same line repeatedly misses output
same vendor repeatedly delays fabric
same operation repeatedly causes defects
```

---

## 54. Cost-Protected OTIF Tracking

Because OTIF may be maintained by extra expense, track recovery actions that protect OTIF.

Examples:

```text
overtime used
premium freight used
split shipment used
extra shift used
outsourcing used
```

Metric:

```text
OTIF protected by recovery =
shipments on time that had recovery actions / total on-time shipments
```

This helps distinguish stable performance from firefighting.

---

# Part M: Permissions

---

## 55. Permission Actions

Recommended permissions:

```text
exception.view
exception.create
exception.assign
exception.change_due_date
exception.change_severity
exception.escalate
exception.resolve
exception.close
exception.close_critical
exception.reopen
exception.cancel
recovery.view
recovery.create
recovery.assign
recovery.approve
recovery.complete
recovery.cancel
alert.view
alert.convert_to_exception
```

---

## 56. Permission Rules

```text
Only authorized users can close RED/BLACK exceptions.
Only authorized users can override severity.
Only authorized users can approve recovery actions involving overtime, outsourcing, or split shipment.
Shopfloor users can raise issues but should not close critical exceptions.
```

---

# Part N: Testing Requirements

---

## 57. Unit Tests

Required tests:

```text
severity calculation
duplicate exception prevention
owner assignment defaulting
SLA status calculation
escalation trigger
recovery impact preview
exception closure validation
```

---

## 58. API Tests

Required tests:

```text
exception list filters by severity/status/owner
manual exception creation validates required fields
RED exception requires owner and due date
closure requires note
critical closure requires permission
recovery action creation links to exception
impact preview returns before/after
```

---

## 59. E2E Scenarios

### 59.1 PCD Blocker

```text
PCD blocked close to planned date
→ system creates PCD exception
→ owner assigned
→ conditional release requested
→ approved
→ exception closed
```

### 59.2 Wash Constraint

```text
Wet wash utilization crosses red threshold
→ wash exception created
→ recovery action add overtime
→ impact preview improves risk
→ action completed
→ exception closed
```

### 59.3 Sewing Shortfall

```text
Line output below target
→ sewing exception created
→ line balance action assigned
→ output improves
→ exception resolved
```

### 59.4 Shipment Readiness

```text
Shipment due in 2 days, AQL pending
→ shipment exception created
→ QC owner assigned
→ AQL completed
→ shipment marked ready
→ exception closed
```

---

# Part O: Implementation Phasing

---

## 60. Phase 1: Exception Foundation

Build:

```text
exception model
categories
severity
status lifecycle
manual creation
list/detail APIs
basic control tower
```

---

## 61. Phase 2: Auto Exception Rules

Build rules for:

```text
PCD blockers
material delay
workcenter overload
WIP ageing
wash queue ageing
shipment readiness
system data gaps
```

---

## 62. Phase 3: Recovery Actions

Build:

```text
recovery action model
impact preview
action board
approval workflow
completion tracking
```

---

## 63. Phase 4: Escalation and Notifications

Build:

```text
SLA
escalation jobs
in-app notifications
role-based inbox
daily digest
```

---

## 64. Phase 5: Analytics and Learning

Build:

```text
exception trends
recurrence analysis
cost-protected OTIF
owner closure performance
category root-cause analytics
```

---

# Part P: Open Decisions

---

## 65. Decisions Required

Before implementation, confirm:

1. What are official escalation levels at Eratex?
2. Who owns each category?
3. What are RED/BLACK threshold values by module?
4. Should notifications be in-app only for MVP?
5. Who can close critical exceptions?
6. Should recovery cost be captured manually in MVP?
7. Should WhatsApp/email integration be included later?
8. Which exceptions should block release automatically?
9. Should exception closure require evidence attachment?
10. What is the daily exception review meeting structure?

---

## 66. Non-Negotiable Rules

```text
1. RED/BLACK exceptions must have owner and due date.
2. Critical exceptions cannot be silently dismissed.
3. Duplicate alerts must not spam users.
4. Recovery action must be linked to exception.
5. Recovery impact should be visible before approval where possible.
6. Exception closure must require note.
7. Critical closure must be audited.
8. Shipment-impacting exceptions must be highlighted.
9. Stale data must be treated as an exception.
10. OTIF protected by extra operating expense must be visible.
```

---

## 67. Summary

This document defines the exception, alert, escalation, and recovery spine for the Eratex Planning & Scheduling Platform.

The system must transform operational problems into governed action:

```text
alert
→ exception
→ owner
→ recovery
→ escalation
→ closure
→ learning
```

This is essential for Eratex because high OTIF can otherwise hide inefficient firefighting and extra operating expense.

The exception and recovery layer must therefore be tightly connected to:

```text
PCD readiness
material procurement
fabric QC
planning
capacity
sewing
wash
WIP
quality
shipment readiness
analytics
```

The success of the platform depends on making exceptions visible early, assigning clear accountability, and enabling fast recovery before shipment commitments are threatened.
