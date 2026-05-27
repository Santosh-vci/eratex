# 07. Event and State Transition Specification  
# Eratex End-to-End Planning & Scheduling Platform

**Company:** Eratex  
**Product:** Planning & Scheduling Tool for Denim Bottoms + Chinos Manufacturing  
**Document Type:** Event and State Transition Specification  
**Version:** 2.0  
**Date:** 2026-05-26  
**Backend Stack:** Django + Django REST Framework + PostgreSQL + Celery + Redis  
**Frontend Stack Context:** React/Next.js Planning Workbenches + PWA Shopfloor Capture  

---

## 1. Purpose

This document defines the event and state-transition model for the Eratex Planning & Scheduling Platform.

The platform is workflow-heavy. Orders, readiness gates, production releases, line loading, wash batches, WIP, QC holds, exceptions, and shipment readiness all move through states. These states must be controlled, validated, auditable, and visible to users.

This document specifies:

- core event architecture
- state machine principles
- entity-specific states
- allowed transitions
- transition validations
- event payloads
- audit requirements
- recalculation triggers
- frontend implications
- backend service requirements
- testing requirements

---

## 2. Core Event Thesis

The system should not only store the latest status. It should know:

```text
what changed
when it changed
who changed it
why it changed
what the previous state was
what downstream impact it caused
```

A planning and scheduling platform cannot be reliable if statuses are directly overwritten without traceability.

The core event discipline is:

```text
Action
→ validation
→ state transition
→ audit event
→ downstream recalculation
→ exception/recovery update
→ frontend refresh
```

---

## 3. Why State Transitions Matter

The Eratex process includes many gates and handovers:

```text
PCD readiness
release to cutting
cutting to sewing
sewing to wash
wash to finishing
finishing to packing
packing to shipment
shipment readiness
```

If these are implemented as loose status fields, users can bypass discipline. Therefore, the system must enforce allowed transitions.

Examples:

```text
A blocked PCD cannot directly become released unless authorized.
A wash batch cannot be released to finishing before post-wash QC if QC is mandatory.
A shipment cannot be marked ready if AQL is pending.
A critical exception cannot be closed without a resolution note.
A frozen plan cannot be edited without a plan change request.
```

---

## 4. Architecture Principle

State transitions must be implemented through backend services.

Do not allow the frontend or API clients to directly set critical statuses through generic PATCH calls.

Preferred pattern:

```text
POST /api/v1/orders/{id}/release-to-cutting
POST /api/v1/planning/weekly/{id}/freeze
POST /api/v1/wash/batches/{id}/rewash
POST /api/v1/exceptions/{id}/close
POST /api/v1/orders/{id}/mark-shipment-ready
```

Not preferred:

```text
PATCH /api/v1/orders/{id} { "status": "SHIPPED" }
PATCH /api/v1/wash/batches/{id} { "status": "RELEASED_TO_FINISHING" }
```

Generic PATCH may be used for non-critical descriptive fields but not for governed transitions.

---

## 5. Event Types

The platform should distinguish between different event categories.

| Event Type | Description |
|---|---|
| Business event | Operational action, such as PCD released or wash batch completed |
| State transition event | Entity status changed from one state to another |
| Audit event | Traceability record of a critical change |
| Calculation event | Trigger to recalculate risk/load/readiness |
| Integration event | Import/sync completed or failed |
| Notification event | Alert to user/role |
| Snapshot event | Scheduled capture of daily state |

---

## 6. Event Handling Strategy

### 6.1 MVP Recommendation

For MVP, use explicit service orchestration rather than a complex event bus.

Example:

```python
def mark_rewash_required(batch, payload, user):
    validate_permission(user, "wash.mark_rewash")
    validate_batch_can_be_rewashed(batch)
    old_state = batch.status
    batch.status = "REWASH_REQUIRED"
    batch.save()

    wip_inventory.services.move_to_rewash_wip(batch)
    workcenters.services.recalculate_wash_load(batch)
    exceptions.services.create_or_update_wash_exception(batch)
    audit_governance.services.write_audit_event(...)

    return batch
```

### 6.2 Future Recommendation

Once stable, introduce an internal domain event dispatcher for decoupling.

Example:

```text
DomainEvent: wash.rewash_required
Subscribers:
- wip_inventory
- workcenters
- exceptions
- shipment
- analytics
```

Do not introduce an event bus prematurely if the team is not ready to govern it.

---

## 7. Standard Event Record Structure

A generic internal event or audit payload should contain:

```json
{
  "eventId": "uuid",
  "eventType": "pcd.released_to_cutting",
  "entityType": "PCDReadiness",
  "entityId": "uuid",
  "orderId": "uuid",
  "previousState": "READY",
  "newState": "RELEASED",
  "performedBy": 45,
  "performedAt": "2026-06-05T10:30:00+07:00",
  "reason": "All PCD checklist items passed",
  "source": "WEB",
  "metadata": {
    "releaseQty": 5000
  }
}
```

---

## 8. State Transition Implementation Rules

### 8.1 Allowed Transition Rule

Each domain must define allowed state transitions.

### 8.2 Validation Rule

Before transition, validate:

```text
current state
required inputs
user permission
business rules
dependencies
open blockers
quantity constraints
```

### 8.3 Audit Rule

Critical transitions must write audit event.

### 8.4 Recalculation Rule

Transitions that affect planning must trigger recalculation.

### 8.5 Idempotency Rule

Critical action APIs should be idempotent where practical.

Example:

```text
If release-to-cutting was already done, repeated call should not create duplicate release.
```

### 8.6 Conflict Rule

If entity state changed after frontend loaded the page, action should return conflict.

Example:

```json
{
  "errors": [
    {
      "code": "STATE_CONFLICT",
      "message": "This order was updated by another user. Please refresh before releasing."
    }
  ]
}
```

---

# Part A: Order Lifecycle State Machine

---

## 9. Order Lifecycle States

Recommended order lifecycle stages:

```text
CREATED
PRE_PRODUCTION
PCD_PENDING
PCD_READY
CUTTING
SEWING
WASHING
FINISHING
PACKING
SHIPMENT_READY
SHIPPED
ON_HOLD
CANCELLED
```

### 9.1 Meaning of Each State

| State | Meaning |
|---|---|
| CREATED | Order exists but pre-production setup not complete |
| PRE_PRODUCTION | Technical/material preparation is in progress |
| PCD_PENDING | PCD readiness checklist exists but not ready |
| PCD_READY | PCD readiness is cleared |
| CUTTING | Cutting is released or active |
| SEWING | Sewing is released or active |
| WASHING | Wash batch/queue exists or wash active |
| FINISHING | Washed goods are in finishing |
| PACKING | Finished goods are being packed |
| SHIPMENT_READY | Shipment checklist passed |
| SHIPPED | Order/dispatch completed |
| ON_HOLD | Order has a critical hold but actual stage is preserved |
| CANCELLED | Order cancelled |

---

## 10. Order Lifecycle Transitions

### 10.1 Allowed Main Flow

```text
CREATED
→ PRE_PRODUCTION
→ PCD_PENDING
→ PCD_READY
→ CUTTING
→ SEWING
→ WASHING
→ FINISHING
→ PACKING
→ SHIPMENT_READY
→ SHIPPED
```

### 10.2 Hold Overlay

`ON_HOLD` should preferably be a lifecycle status overlay rather than replacing the operational stage.

Example:

```json
{
  "currentStage": "WASHING",
  "lifecycleStatus": "ON_HOLD",
  "holdReason": "Post-wash QC hold"
}
```

### 10.3 Valid Transitions Table

| From | To | Trigger |
|---|---|---|
| CREATED | PRE_PRODUCTION | order confirmed / style preparation starts |
| PRE_PRODUCTION | PCD_PENDING | PCD checklist initialized |
| PCD_PENDING | PCD_READY | PCD readiness calculation passes |
| PCD_READY | CUTTING | release to cutting |
| CUTTING | SEWING | cut panels issued to sewing |
| SEWING | WASHING | sewn goods handed to wash / wash batch created |
| WASHING | FINISHING | wash batch released to finishing |
| FINISHING | PACKING | finishing output ready for packing |
| PACKING | SHIPMENT_READY | shipment readiness checklist passed |
| SHIPMENT_READY | SHIPPED | dispatch confirmed |
| Any active state | ON_HOLD | critical hold created |
| ON_HOLD | previous active state | hold released |
| Any non-shipped state | CANCELLED | authorized cancellation |

### 10.4 Transition Validations

#### PCD_READY → CUTTING

Requires:

```text
PCD readiness = READY or CONDITIONALLY_READY
release quantity valid
user has pcd.release_to_cutting or release.create
no critical fabric QC block
```

#### CUTTING → SEWING

Requires:

```text
cut panels available
cut QC clear if applicable
bundle/handover quantity valid
sewing line assigned or release created
```

#### SEWING → WASHING

Requires:

```text
sewn goods available
pre-wash QC clear if configured
wash route approved
wash batch or wash queue entry created
```

#### WASHING → FINISHING

Requires:

```text
wash batch complete
post-wash QC passed or waived
rewash not pending
quantity validated
```

#### PACKING → SHIPMENT_READY

Requires:

```text
final QC passed
AQL passed if required
packing complete
documents complete
forwarder booking complete
```

---

# Part B: PCD Readiness State Machine

---

## 11. PCD Readiness States

```text
NOT_STARTED
IN_REVIEW
BLOCKED
ESCALATED
CONDITIONALLY_READY
READY
RELEASED
EXPIRED_CONDITIONAL
```

### 11.1 State Meaning

| State | Meaning |
|---|---|
| NOT_STARTED | Checklist not initialized |
| IN_REVIEW | Checklist is being completed |
| BLOCKED | One or more mandatory items pending/failed |
| ESCALATED | Blocked close to PCD date |
| CONDITIONALLY_READY | Released by waiver for defined open items |
| READY | All mandatory items passed |
| RELEASED | Released to cutting |
| EXPIRED_CONDITIONAL | Conditional approval expired before closure |

---

## 12. PCD Transitions

| From | To | Trigger |
|---|---|---|
| NOT_STARTED | IN_REVIEW | checklist initialized |
| IN_REVIEW | BLOCKED | mandatory pending/failed |
| IN_REVIEW | READY | all mandatory passed |
| BLOCKED | ESCALATED | PCD date within escalation threshold |
| BLOCKED | CONDITIONALLY_READY | authorized waiver |
| ESCALATED | CONDITIONALLY_READY | authorized waiver |
| CONDITIONALLY_READY | READY | open waived items completed |
| CONDITIONALLY_READY | EXPIRED_CONDITIONAL | expiry date passed |
| READY | RELEASED | release to cutting |
| CONDITIONALLY_READY | RELEASED | release to cutting within waiver validity |
| EXPIRED_CONDITIONAL | BLOCKED | system recalculation |

### 12.1 Transition Validations

#### BLOCKED → CONDITIONALLY_READY

Requires:

```text
authorized approver
reason
open item list
expiry date
risk note
audit event
```

#### READY → RELEASED

Requires:

```text
all mandatory checklist items passed
release quantity valid
cutting workcenter available or exception approved
```

#### CONDITIONALLY_READY → RELEASED

Requires:

```text
conditional release not expired
release within approved scope
user has release permission
```

---

## 13. PCD Events

```text
pcd.checklist_initialized
pcd.item_updated
pcd.blocked
pcd.escalated
pcd.conditional_release_approved
pcd.conditional_expired
pcd.ready
pcd.released_to_cutting
```

### 13.1 PCD Conditional Release Event Payload

```json
{
  "eventType": "pcd.conditional_release_approved",
  "orderId": "uuid",
  "pcdReadinessId": "uuid",
  "openItems": ["TRIMS_AVAILABLE"],
  "reason": "Trim arrival confirmed before sewing start",
  "expiryDate": "2026-06-08",
  "riskNote": "Sewing will be blocked if trims slip",
  "approvedBy": 12,
  "approvedAt": "2026-06-05T12:05:00+07:00"
}
```

---

# Part C: Plan Version and Plan Change State Machine

---

## 14. Plan Version States

```text
DRAFT
UNDER_REVIEW
FROZEN
ACTIVE
SUPERSEDED
ARCHIVED
CANCELLED
```

### 14.1 State Meaning

| State | Meaning |
|---|---|
| DRAFT | Plan is editable |
| UNDER_REVIEW | Plan being reviewed before freeze |
| FROZEN | Plan locked for execution |
| ACTIVE | Current execution plan |
| SUPERSEDED | Replaced by later plan |
| ARCHIVED | Historical plan |
| CANCELLED | Plan abandoned |

---

## 15. Plan Version Transitions

| From | To | Trigger |
|---|---|---|
| DRAFT | UNDER_REVIEW | submit for review |
| DRAFT | FROZEN | freeze directly if allowed |
| UNDER_REVIEW | FROZEN | approved freeze |
| FROZEN | ACTIVE | plan horizon starts / activated |
| ACTIVE | SUPERSEDED | new active plan replaces it |
| SUPERSEDED | ARCHIVED | archive job |
| DRAFT | CANCELLED | cancel draft |

### 15.1 Freeze Validation

Plan can be frozen only if:

```text
critical overloads resolved or approved
all cutting items have PCD status
all wash items have route
line assignments valid
no missing workcenter for planned item
```

### 15.2 Freeze Event

```text
plan.frozen
```

Payload:

```json
{
  "eventType": "plan.frozen",
  "planVersionId": "uuid",
  "horizonStart": "2026-06-01",
  "horizonEnd": "2026-06-28",
  "frozenBy": 12,
  "frozenAt": "2026-05-30T16:00:00+07:00",
  "openApprovedOverloads": [
    {
      "workcenter": "WET_WASH",
      "utilizationPercent": 118
    }
  ]
}
```

---

## 16. Plan Change Request States

```text
REQUESTED
IMPACT_CALCULATED
APPROVAL_PENDING
APPROVED
REJECTED
APPLIED
CANCELLED
```

### 16.1 Transitions

| From | To | Trigger |
|---|---|---|
| REQUESTED | IMPACT_CALCULATED | impact preview completed |
| IMPACT_CALCULATED | APPROVAL_PENDING | approval required |
| IMPACT_CALCULATED | APPROVED | no approval required |
| APPROVAL_PENDING | APPROVED | authorized approval |
| APPROVAL_PENDING | REJECTED | authorized rejection |
| APPROVED | APPLIED | change applied |
| REQUESTED | CANCELLED | requester cancels |

### 16.2 Required Impact Fields

```text
affected orders
affected workcenters
capacity before/after
shipment risk before/after
approval requirement
reason
```

---

# Part D: Planned Work Item State Machine

---

## 17. Planned Work Item States

```text
DRAFT
PLANNED
FROZEN
RELEASE_READY
RELEASED
IN_PROGRESS
COMPLETED
RESCHEDULED
CANCELLED
```

### 17.1 Transitions

| From | To | Trigger |
|---|---|---|
| DRAFT | PLANNED | item added to plan |
| PLANNED | FROZEN | plan frozen |
| FROZEN | RELEASE_READY | release validation passes |
| RELEASE_READY | RELEASED | daily release created |
| RELEASED | IN_PROGRESS | actual work starts |
| IN_PROGRESS | COMPLETED | output/close event |
| PLANNED/FROZEN | RESCHEDULED | approved plan change |
| Any pre-completed | CANCELLED | authorized cancellation |

### 17.2 Validation Examples

`FROZEN → RELEASE_READY` requires:

```text
previous process complete
input available
no QC hold
workcenter available
```

---

# Part E: Daily Production Release State Machine

---

## 18. Production Release States

```text
DRAFT
VALIDATED
BLOCKED
EXCEPTION_APPROVAL_PENDING
RELEASED
IN_PROGRESS
HELD
COMPLETED
CANCELLED
```

### 18.1 Transitions

| From | To | Trigger |
|---|---|---|
| DRAFT | VALIDATED | validation passes |
| DRAFT | BLOCKED | validation fails |
| BLOCKED | EXCEPTION_APPROVAL_PENDING | override requested |
| EXCEPTION_APPROVAL_PENDING | RELEASED | override approved |
| VALIDATED | RELEASED | release created |
| RELEASED | IN_PROGRESS | execution starts |
| IN_PROGRESS | HELD | issue/hold reported |
| HELD | IN_PROGRESS | hold released |
| IN_PROGRESS | COMPLETED | release completed |
| Any pre-completed | CANCELLED | authorized cancellation |

### 18.2 Release Types

```text
CUTTING
SEWING
WASH
FINISHING
PACKING
SHIPMENT
```

### 18.3 Release Validation Events

```text
release.validated
release.blocked
release.exception_requested
release.exception_approved
release.released
release.started
release.held
release.completed
```

### 18.4 Blocked Release Event Payload

```json
{
  "eventType": "release.blocked",
  "releaseType": "WASH",
  "orderId": "uuid",
  "blockedItems": [
    {
      "code": "PRE_WASH_QC_CLEAR",
      "message": "Pre-wash QC pending for 200 pcs"
    }
  ],
  "blockedAt": "2026-06-05T08:00:00+07:00",
  "ownerId": 88
}
```

---

# Part F: Cutting State Machine

---

## 19. Cutting States

Cutting may be a full module later. For MVP, cutting can be represented through release and WIP. For maturity, use explicit cutting states.

```text
NOT_RELEASED
RELEASED
FABRIC_RELAXING
SPREADING
CUTTING_IN_PROGRESS
CUT_QC
BUNDLING
ISSUED_TO_SEWING
HELD
COMPLETED
```

### 19.1 Transitions

| From | To | Trigger |
|---|---|---|
| NOT_RELEASED | RELEASED | release to cutting |
| RELEASED | FABRIC_RELAXING | fabric relaxation starts |
| FABRIC_RELAXING | SPREADING | spreading starts |
| SPREADING | CUTTING_IN_PROGRESS | cutting starts |
| CUTTING_IN_PROGRESS | CUT_QC | cutting completed |
| CUT_QC | BUNDLING | QC passed |
| BUNDLING | ISSUED_TO_SEWING | bundles issued |
| Any active | HELD | issue reported |
| ISSUED_TO_SEWING | COMPLETED | full issued qty completed |

### 19.2 Validation Rules

```text
fabric lot and shade lot must be known
fabric QC must be passed/waived
cut qty cannot exceed fabric allocation without override
bundle IDs must be unique
```

---

# Part G: Sewing State Machine

---

## 20. Sewing Line Loading States

```text
PLANNED
LOADED
RUNNING
HELD
CHANGEOVER
COMPLETED
CLOSED
```

### 20.1 State Meaning

| State | Meaning |
|---|---|
| PLANNED | Order assigned to line in plan |
| LOADED | Order released and line setup ready |
| RUNNING | Production started |
| HELD | Line/order blocked |
| CHANGEOVER | Style change/line setup in progress |
| COMPLETED | Planned qty completed |
| CLOSED | Supervisor/manager has closed execution |

### 20.2 Transitions

| From | To | Trigger |
|---|---|---|
| PLANNED | LOADED | daily release to sewing |
| LOADED | RUNNING | first output/start event |
| RUNNING | HELD | line issue/QC/material stop |
| HELD | RUNNING | hold resolved |
| RUNNING | CHANGEOVER | style change begins |
| CHANGEOVER | RUNNING | changeover complete |
| RUNNING | COMPLETED | target qty achieved |
| COMPLETED | CLOSED | supervisor closure |

---

## 21. Sewing Output Events

Events:

```text
sewing.output_recorded
sewing.defect_recorded
sewing.rework_recorded
sewing.shortfall_detected
sewing.target_achieved
```

### 21.1 Output Event Payload

```json
{
  "eventType": "sewing.output_recorded",
  "orderId": "uuid",
  "lineId": "uuid",
  "entryTime": "2026-06-05T14:00:00+07:00",
  "grossQty": 320,
  "defectQty": 18,
  "reworkQty": 12,
  "netGoodQty": 290,
  "enteredBy": 101,
  "source": "HANDHELD"
}
```

### 21.2 Downstream Effects

```text
update line actual output
update net-good output
update WIP
check required run rate
check sewing shortfall exception
update order lifecycle
update line efficiency snapshot
```

---

# Part H: Line Realignment and Line Balance State Machines

---

## 22. Line Realignment States

```text
PROPOSED
UNDER_REVIEW
APPROVED
APPLIED
REJECTED
CANCELLED
```

### 22.1 Transitions

| From | To | Trigger |
|---|---|---|
| PROPOSED | UNDER_REVIEW | submitted |
| UNDER_REVIEW | APPROVED | authorized approval |
| UNDER_REVIEW | REJECTED | rejected |
| APPROVED | APPLIED | setup applied to line |
| PROPOSED | CANCELLED | proposer cancels |

### 22.2 Approval Validation

Requires:

```text
machine gap analysis
skill gap analysis
expected output before/after
changeover time
approver permission
```

### 22.3 Events

```text
line_realignment.proposed
line_realignment.approved
line_realignment.applied
line_realignment.rejected
```

---

## 23. Line Balance Plan States

```text
DRAFT
UNDER_REVIEW
APPROVED
ACTIVE
SUPERSEDED
OBSOLETE
```

### 23.1 Transition Rules

Approved line balance must link to:

```text
line
style/order
operation bulletin version
target output
```

If operation bulletin version changes, active line balance should be reviewed.

---

# Part I: Wash Batch State Machine

---

## 24. Wash Batch States

```text
CREATED
QUEUED
DRY_PROCESS
WET_WASH
DRYING
POST_WASH_QC
REWASH_REQUIRED
REWASH_IN_PROGRESS
HELD
RELEASED_TO_FINISHING
CLOSED
CANCELLED
```

### 24.1 State Meaning

| State | Meaning |
|---|---|
| CREATED | Batch created but not queued |
| QUEUED | Waiting for wash execution |
| DRY_PROCESS | Dry process active |
| WET_WASH | Wet wash active |
| DRYING | Drying active |
| POST_WASH_QC | Awaiting/under post-wash QC |
| REWASH_REQUIRED | Rewash decision made |
| REWASH_IN_PROGRESS | Rewash execution active |
| HELD | Batch blocked |
| RELEASED_TO_FINISHING | Approved for finishing |
| CLOSED | Batch complete |
| CANCELLED | Batch cancelled |

### 24.2 Main Transitions

| From | To | Trigger |
|---|---|---|
| CREATED | QUEUED | batch queued |
| QUEUED | DRY_PROCESS | dry process starts |
| QUEUED | WET_WASH | wet wash starts if no dry process |
| DRY_PROCESS | WET_WASH | dry process completed |
| WET_WASH | DRYING | wet wash completed |
| DRYING | POST_WASH_QC | drying completed |
| POST_WASH_QC | RELEASED_TO_FINISHING | QC passed |
| POST_WASH_QC | REWASH_REQUIRED | QC failed and rewash needed |
| REWASH_REQUIRED | REWASH_IN_PROGRESS | rewash starts |
| REWASH_IN_PROGRESS | POST_WASH_QC | rewash completed |
| Any active | HELD | issue reported |
| HELD | previous active state | issue resolved |
| RELEASED_TO_FINISHING | CLOSED | handover accepted |

### 24.3 Rewash Validation

Requires:

```text
reason
affected quantity
approval if required
additional load calculation
WIP movement to REWASH_WIP
exception if shipment risk increases
```

### 24.4 Events

```text
wash.batch_created
wash.batch_queued
wash.step_started
wash.step_completed
wash.held
wash.rewash_required
wash.rewash_started
wash.rewash_completed
wash.released_to_finishing
wash.closed
```

---

# Part J: WIP State Machine

---

## 25. WIP Item States

```text
WAITING
IN_PROCESS
HELD
REWORK
READY_TO_MOVE
MOVED
CLOSED
ADJUSTED
```

### 25.1 WIP Movement Stages

WIP stages include:

```text
FABRIC_ON_ORDER
FABRIC_IN_TRANSIT
FABRIC_RECEIVED_NOT_QC
FABRIC_QC_HOLD
FABRIC_CLEARED
FABRIC_ALLOCATED
CUTTING_WIP
CUT_PANELS_WAITING_SEWING
SEWING_WIP
SEWN_WAITING_WASH
DRY_PROCESS_WIP
WET_WASH_WIP
REWASH_WIP
WASHED_WAITING_FINISHING
FINISHING_WIP
FINISHED_WAITING_FINAL_QC
FINAL_QC_HOLD
PACKED_GOODS
PACKED_WAITING_INSPECTION
SHIPMENT_READY
DISPATCHED
```

### 25.2 WIP State Transitions

| From | To | Trigger |
|---|---|---|
| WAITING | IN_PROCESS | process starts |
| IN_PROCESS | READY_TO_MOVE | process output complete |
| READY_TO_MOVE | MOVED | handover/movement completed |
| WAITING/IN_PROCESS | HELD | hold created |
| HELD | WAITING/IN_PROCESS | hold released |
| Any active | REWORK | rework required |
| REWORK | READY_TO_MOVE | rework completed |
| MOVED | CLOSED | source WIP closed |
| Any active | ADJUSTED | manual adjustment |

### 25.3 Movement Validation

Before movement:

```text
source stage has enough quantity
target stage is valid
no blocking QC hold
handover rules satisfied
user has permission
quantity mismatch within tolerance
```

### 25.4 WIP Movement Event Payload

```json
{
  "eventType": "wip.moved",
  "orderId": "uuid",
  "fromStage": "SEWN_WAITING_WASH",
  "toStage": "WASH_QUEUE",
  "qty": 500,
  "batchOrBundleRef": "WB-1001",
  "movedBy": 101,
  "movedAt": "2026-06-05T13:00:00+07:00"
}
```

---

# Part K: Department Handover State Machine

---

## 26. Department Handover States

```text
DRAFT
PENDING_ACCEPTANCE
ACCEPTED
REJECTED
CANCELLED
```

### 26.1 Handover Points

```text
Fabric warehouse → Cutting
Cutting → Sewing
Sewing → Wash
Wash → Finishing
Finishing → Packing
Packing → Shipment
```

### 26.2 Transitions

| From | To | Trigger |
|---|---|---|
| DRAFT | PENDING_ACCEPTANCE | handover submitted |
| PENDING_ACCEPTANCE | ACCEPTED | receiver accepts |
| PENDING_ACCEPTANCE | REJECTED | receiver rejects |
| DRAFT | CANCELLED | creator cancels |

### 26.3 Validation

Requires:

```text
quantity
from stage
to stage
QC status
sender
receiver/acceptor
open issue declaration
```

If rejected:

```text
reason required
exception may be created
WIP remains with source department
```

---

# Part L: QC Hold and Rework State Machines

---

## 27. QC Inspection States

```text
DRAFT
SUBMITTED
PASSED
FAILED
HOLD
REWORK_REQUIRED
WAIVED
CLOSED
```

### 27.1 Transitions

| From | To | Trigger |
|---|---|---|
| DRAFT | SUBMITTED | inspection submitted |
| SUBMITTED | PASSED | checks pass |
| SUBMITTED | FAILED | critical fail |
| SUBMITTED | HOLD | hold decision |
| HOLD | REWORK_REQUIRED | rework needed |
| HOLD | WAIVED | authorized waiver |
| REWORK_REQUIRED | CLOSED | rework completed and accepted |
| PASSED | CLOSED | inspection closed |

---

## 28. Quality Hold States

```text
OPEN
UNDER_REVIEW
REWORK_REQUIRED
RELEASED
REJECTED
CLOSED
```

### 28.1 Transition Rules

| From | To | Trigger |
|---|---|---|
| OPEN | UNDER_REVIEW | QC manager reviews |
| UNDER_REVIEW | REWORK_REQUIRED | rework decision |
| UNDER_REVIEW | RELEASED | hold released |
| UNDER_REVIEW | REJECTED | reject decision |
| REWORK_REQUIRED | RELEASED | rework passed |
| RELEASED | CLOSED | closure |
| REJECTED | CLOSED | closure |

### 28.2 Release Validation

Requires:

```text
QC manager permission
release reason
inspection evidence
affected WIP update
audit event
```

---

## 29. Rework Order States

```text
CREATED
ASSIGNED
IN_PROGRESS
COMPLETED
QC_PENDING
ACCEPTED
REJECTED
CLOSED
CANCELLED
```

### 29.1 Transitions

| From | To | Trigger |
|---|---|---|
| CREATED | ASSIGNED | owner assigned |
| ASSIGNED | IN_PROGRESS | work starts |
| IN_PROGRESS | COMPLETED | rework completed |
| COMPLETED | QC_PENDING | QC required |
| QC_PENDING | ACCEPTED | QC passed |
| QC_PENDING | REJECTED | QC failed |
| ACCEPTED | CLOSED | close |
| REJECTED | IN_PROGRESS | rework again |
| Any pre-closed | CANCELLED | authorized cancellation |

---

# Part M: Exception State Machine

---

## 30. Exception States

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

### 30.1 State Meaning

| State | Meaning |
|---|---|
| OPEN | Exception created but not yet actively worked |
| ASSIGNED | Owner assigned |
| IN_PROGRESS | Owner working on issue |
| ESCALATED | Higher-level attention required |
| RESOLVED | Resolution done, awaiting closure/confirmation |
| CLOSED | Officially closed |
| REOPENED | Reopened after closure |
| CANCELLED | Created in error / duplicate |

### 30.2 Transitions

| From | To | Trigger |
|---|---|---|
| OPEN | ASSIGNED | owner assigned |
| ASSIGNED | IN_PROGRESS | owner starts action |
| OPEN/ASSIGNED/IN_PROGRESS | ESCALATED | escalation condition |
| IN_PROGRESS | RESOLVED | resolution submitted |
| RESOLVED | CLOSED | closure confirmed |
| CLOSED | REOPENED | issue reappears |
| OPEN | CANCELLED | duplicate/invalid |

### 30.3 Required Fields

For RED/BLACK exceptions:

```text
owner
due date
category
description
affected order/stage if applicable
```

For closure:

```text
closure note
closed by
closed at
```

For reopen:

```text
reopen reason
```

### 30.4 Escalation Triggers

```text
due date missed
severity = BLACK
shipment risk worsens
owner missing beyond threshold
exception open beyond threshold
```

### 30.5 Events

```text
exception.created
exception.assigned
exception.in_progress
exception.escalated
exception.resolved
exception.closed
exception.reopened
exception.cancelled
```

---

# Part N: Recovery Action State Machine

---

## 31. Recovery Action States

```text
OPEN
ASSIGNED
IN_PROGRESS
COMPLETED
FAILED
CANCELLED
```

### 31.1 Examples of Recovery Actions

```text
ADD_OVERTIME
SPLIT_ORDER
MOVE_TO_ALTERNATE_LINE
RESEQUENCE_WASH
EXPEDITE_MATERIAL
RELEASE_QC_HOLD
ADD_MANPOWER
APPROVE_SPLIT_SHIPMENT
```

### 31.2 Transitions

| From | To | Trigger |
|---|---|---|
| OPEN | ASSIGNED | owner assigned |
| ASSIGNED | IN_PROGRESS | action starts |
| IN_PROGRESS | COMPLETED | action completed |
| IN_PROGRESS | FAILED | action failed |
| OPEN/ASSIGNED | CANCELLED | no longer needed |

### 31.3 Completion Validation

Requires:

```text
completion note
actual impact if known
linked exception update
audit event
```

---

# Part O: Shipment Readiness State Machine

---

## 32. Shipment Readiness States

```text
NOT_STARTED
IN_PROGRESS
BLOCKED
READY
DISPATCHED
CLOSED
```

### 32.1 Transitions

| From | To | Trigger |
|---|---|---|
| NOT_STARTED | IN_PROGRESS | checklist initialized |
| IN_PROGRESS | BLOCKED | mandatory item failed/pending near due date |
| BLOCKED | IN_PROGRESS | blocker resolved |
| IN_PROGRESS | READY | all mandatory items passed |
| READY | DISPATCHED | dispatch confirmed |
| DISPATCHED | CLOSED | shipment closed |

### 32.2 Ready Validation

Requires:

```text
final QC passed
AQL passed if required
packing complete
cartons closed
barcode/label correct
packing list ready
invoice ready
forwarder booked
shipment date confirmed
packed qty sufficient or split shipment approved
```

### 32.3 Mark Ready Event Payload

```json
{
  "eventType": "shipment.ready",
  "orderId": "uuid",
  "shipmentReadinessId": "uuid",
  "packedQty": 12000,
  "shortQty": 0,
  "markedReadyBy": 55,
  "markedReadyAt": "2026-07-14T10:00:00+07:00"
}
```

---

# Part P: Shopfloor Mobile Event Model

---

## 33. Shopfloor Event Types

```text
shopfloor.output_recorded
shopfloor.defect_recorded
shopfloor.downtime_started
shopfloor.downtime_resolved
shopfloor.handover_submitted
shopfloor.handover_accepted
shopfloor.andon_raised
shopfloor.shift_closed
shopfloor.offline_sync_received
```

### 33.1 Source Values

```text
WEB
HANDHELD
TABLET
ADMIN
IMPORT
SYSTEM_JOB
```

### 33.2 Offline Event Requirements

Offline-synced events must preserve:

```text
local ID
device ID
original timestamp
sync timestamp
user ID
conflict status
```

### 33.3 Offline Sync States

```text
LOCAL_DRAFT
PENDING_SYNC
SYNCED
SYNC_FAILED
CONFLICT
DISCARDED
```

---

# Part Q: Integration and Import State Machines

---

## 34. Import Batch States

```text
UPLOADED
VALIDATING
VALIDATED
VALIDATION_FAILED
APPLYING
APPLIED
PARTIALLY_APPLIED
FAILED
CANCELLED
```

### 34.1 Transitions

| From | To | Trigger |
|---|---|---|
| UPLOADED | VALIDATING | validation starts |
| VALIDATING | VALIDATED | no blocking errors |
| VALIDATING | VALIDATION_FAILED | errors found |
| VALIDATED | APPLYING | user applies import |
| APPLYING | APPLIED | all rows applied |
| APPLYING | PARTIALLY_APPLIED | some rows applied |
| APPLYING | FAILED | system failure |
| Any pre-applied | CANCELLED | user cancels |

### 34.2 Import Validation

Dry-run import must not write domain records except import logs.

---

## 35. Integration Run States

```text
SCHEDULED
RUNNING
SUCCESS
PARTIAL_SUCCESS
FAILED
STALE
DISABLED
```

### 35.1 Failure Handling

If integration fails:

```text
log error
retain last good data
create system exception if repeated
show stale data warning
```

---

# Part R: Audit Requirements by Transition

---

## 36. Mandatory Audit Transitions

The following must always create audit events:

```text
PCD conditional release approved
PCD released to cutting
blocked release override approved
plan frozen
plan change approved/rejected
operation bulletin approved
line realignment approved/applied
line balance approved
QC hold released
wash rewash required
WIP manual adjustment
exception closed/reopened
shipment marked ready
shipment dispatched
master data approval
import applied
```

### 36.1 Audit Event Fields

```text
entity type
entity ID
action
old state
new state
old values
new values
reason
performed by
performed at
source
```

---

# Part S: Downstream Recalculation Matrix

---

## 37. Recalculation Trigger Matrix

| Event | Recalculate |
|---|---|
| fabric_qc.passed | PCD readiness, order risk |
| fabric_qc.failed | PCD readiness, exception, order risk |
| pcd.ready | planning eligibility |
| pcd.released_to_cutting | order lifecycle, cutting WIP |
| release.created | order lifecycle, workcenter load |
| sewing.output_recorded | line efficiency, WIP, required run rate, order risk |
| sewing.shortfall_detected | exception, recovery action |
| wash.batch_created | wash load, WIP |
| wash.rewash_required | wash load, WIP, shipment risk, exception |
| wip.moved | pipeline WIP, workcenter queue, order lifecycle |
| qc.hold_created | WIP hold, exception, shipment risk |
| qc.hold_released | WIP release, order risk |
| exception.closed | order risk, dashboard counters |
| shipment.checklist_updated | shipment readiness, order risk |
| shipment.ready | order lifecycle, OTIF projection |
| downtime.started | workcenter capacity, exception |
| plan.frozen | workcenter load snapshot |
| import.applied | relevant domain recalculation |

---

# Part T: Frontend Implications

---

## 38. UI Must Respect State Machines

Frontend should not show invalid actions.

Examples:

```text
Do not show "Release to Cutting" if PCD is BLOCKED unless user can request override.
Do not show "Mark Shipment Ready" if checklist is incomplete.
Do not show "Release to Finishing" if post-wash QC is pending.
Do not allow editing frozen plan without change request.
```

### 38.1 Action Availability Contract

APIs should include action availability where useful.

Example:

```json
{
  "availableActions": [
    {
      "action": "REQUEST_CONDITIONAL_RELEASE",
      "enabled": true,
      "reason": null
    },
    {
      "action": "RELEASE_TO_CUTTING",
      "enabled": false,
      "reason": "Fabric QC pending"
    }
  ]
}
```

### 38.2 Conflict Handling

If user attempts an action on stale data, backend should return:

```text
409 STATE_CONFLICT
```

Frontend should refresh entity and show message.

---

# Part U: Backend Implementation Guidance

---

## 39. Recommended Service Naming

```text
orders.services.transition_order_stage()
pcd_readiness.services.calculate_readiness()
pcd_readiness.services.approve_conditional_release()
planning.services.freeze_plan()
planning.services.apply_plan_change()
production_release.services.create_release()
sewing.services.record_output()
washing.services.mark_rewash_required()
wip_inventory.services.move_wip()
quality.services.release_hold()
exceptions.services.close_exception()
shipment.services.mark_ready()
```

---

## 40. State Machine Implementation Options

### Option 1: Simple Service-Based Transition Maps

Recommended for MVP.

```python
ALLOWED_TRANSITIONS = {
    "BLOCKED": ["CONDITIONALLY_READY", "ESCALATED"],
    "CONDITIONALLY_READY": ["READY", "RELEASED", "EXPIRED_CONDITIONAL"],
}
```

### Option 2: Django FSM Library

Could be considered later, but only if the team is comfortable with the abstraction.

### Option 3: Custom State Transition Table

Useful if business users need configurable transitions, but likely over-engineering for MVP.

Recommended:

```text
Use explicit service transition maps in code for MVP.
```

---

## 41. Transaction Safety

Critical transitions must run in database transactions.

Example:

```python
with transaction.atomic():
    update_status()
    create_release()
    move_wip()
    write_audit()
```

This prevents partial state updates.

---

## 42. Idempotency

For mobile/offline and action APIs, include idempotency keys where duplicate submissions are possible.

Example:

```text
Idempotency-Key: device-local-uuid
```

or payload field:

```json
{
  "clientEventId": "local-uuid-1"
}
```

Important for:

```text
sewing output
handover
downtime
offline sync
wash events
```

---

# Part V: Testing Requirements

---

## 43. State Transition Tests

Each state machine must have tests for:

```text
valid transition succeeds
invalid transition fails
permission required
audit event created
downstream recalculation triggered
duplicate action does not duplicate data
stale state conflict handled
```

---

## 44. Critical Test Scenarios

### 44.1 PCD Conditional Release

```text
Given PCD is BLOCKED
When authorized user approves conditional release
Then state becomes CONDITIONALLY_READY
And audit event is written
And release to cutting is allowed only before expiry
```

### 44.2 Frozen Plan Change

```text
Given plan is FROZEN
When user tries to directly move work item
Then API rejects
When change request is approved
Then work item can be rescheduled
```

### 44.3 Wash Rewash

```text
Given wash batch is POST_WASH_QC
When rewash required is marked
Then state becomes REWASH_REQUIRED
And WIP moves to REWASH_WIP
And wash load increases
And exception may be created
```

### 44.4 Shipment Ready Block

```text
Given AQL is pending
When mark shipment ready is called
Then transition is rejected
And reason is returned
```

### 44.5 Exception Closure

```text
Given exception is RED
When user closes without note
Then API rejects
When closure note provided by authorized user
Then state becomes CLOSED and audit is written
```

---

## 45. Summary

This document defines the state-transition and event model for the Eratex Planning & Scheduling Platform.

The system must enforce controlled workflows across:

```text
orders
PCD readiness
plans
daily release
cutting
sewing
line realignment
wash batches
WIP
handover
QC holds
rework
exceptions
shipment readiness
shopfloor events
imports
integrations
```

The key architecture rule is:

```text
Statuses should not be casually overwritten.
They should change through governed, validated, auditable transitions.
```

This discipline is essential if the platform is to replace Excel-driven follow-up with a true live operating system for Eratex garment manufacturing.

## Scheduling Behaviour Rulebook Alignment

Boundary cases are now formal stateful events with `OPEN`, `IMPACT_PREVIEWED`, `APPROVAL_REQUIRED`, `APPROVED`, `APPLIED`, `RESOLVED`, and `CLOSED` style transitions. Future exception, WIP, sewing, wash, shipment, and integration flows must link disruption handling back to these governed events.
