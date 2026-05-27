# 17. Audit, Compliance, and Traceability Specification  
# Eratex End-to-End Planning & Scheduling Platform

**Company:** Eratex  
**Product:** Planning & Scheduling Tool for Denim Bottoms + Chinos Manufacturing  
**Document Type:** Audit, Compliance, and Traceability Specification  
**Version:** 2.0  
**Date:** 2026-05-26  
**Backend Stack:** Django + Django REST Framework + PostgreSQL + Celery + Redis  
**Frontend Stack Context:** React/Next.js + TypeScript + PWA Shopfloor Capture  
**Deployment Context:** Dockerized application stack  
**Related Documents:**  
- 04 Planning Logic and Calculation Flows  
- 05 Backend Domain Module Specification  
- 06 API and Data Contracts Specification  
- 07 Event and State Transition Specification  
- 08 WIP Inventory and Reconciliation Specification  
- 11 Exception, Alert, and Recovery Specification  
- 15 Integration Specification  
- 16 Security, Roles, and Permissions Specification  

---

## 1. Purpose

This document defines the audit, compliance, and traceability specification for the Eratex Planning & Scheduling Platform.

The platform will control critical production decisions, including:

```text
PCD conditional release
release to cutting
weekly plan freeze
daily release override
line realignment
operation bulletin approval
wash rewash decision
QC hold release
WIP movement and adjustment
shipment readiness
exception closure
integration import approval
master data changes
```

These actions must be traceable.

The system must clearly answer:

```text
Who changed what?
When did it change?
Why did it change?
What was the previous state?
What is the new state?
Was approval required?
Was approval granted?
What evidence was attached?
What downstream impact did it create?
```

---

## 2. Audit Thesis

The planning platform must not allow silent operational changes.

The audit principle is:

```text
Every critical operational state change must leave a durable, queryable, user-linked audit trail.
```

Audit should not be limited to technical logs. It must be business-readable and operationally useful.

A production manager, auditor, planner, or management user should be able to trace:

```text
order lifecycle
PCD readiness
plan changes
release overrides
WIP movement
wash rework
QC holds
shipment readiness
exceptions and recovery
import batches
master data changes
```

---

## 3. Compliance Context

This platform is not necessarily a statutory compliance system in MVP, but it must support operational compliance and governance.

Operational compliance means:

```text
approved process was followed
critical overrides were authorized
quality holds were not bypassed silently
shipment readiness was not falsely marked
WIP adjustments were justified
imported data was validated
master data changes were controlled
```

This is especially important because high OTIF can hide operational firefighting. Audit allows the business to distinguish normal execution from exception-driven execution.

---

## 4. Scope

This specification covers:

```text
1. Audit event model
2. State transition trace
3. Approval traceability
4. WIP traceability
5. Order lifecycle traceability
6. PCD and release audit
7. Planning audit
8. Wash and rewash audit
9. Quality and hold audit
10. Shipment readiness audit
11. Exception and recovery audit
12. Integration/import audit
13. Master data audit
14. Shopfloor/mobile audit
15. Evidence and attachment traceability
16. Audit APIs
17. Audit frontend surfaces
18. Retention and archival
19. Security and access
20. Testing and implementation phases
```

---

# Part A: Audit Architecture

---

## 5. Audit Event

An audit event is a durable record of a meaningful business or system action.

Examples:

```text
PCD conditional release approved
weekly plan frozen
wash batch marked rewash
WIP adjusted
QC hold released
shipment marked ready
critical exception closed
operation bulletin approved
import batch applied
```

---

## 6. Audit Event Model

### 6.1 Required Fields

```text
audit_event_id
event_code
entity_type
entity_id
entity_display_code
action
old_value_json
new_value_json
reason
performed_by
performed_at
source
ip_address
device_id
correlation_id
request_id
created_at
```

### 6.2 Optional Fields

```text
factory_id
department_id
workcenter_id
line_id
order_id
approval_id
exception_id
recovery_action_id
import_batch_id
evidence_url
severity
risk_before
risk_after
metadata_json
```

---

## 7. Audit Event Example

```json
{
  "auditEventId": "uuid",
  "eventCode": "PCD_CONDITIONAL_RELEASE_APPROVED",
  "entityType": "PCDReadiness",
  "entityId": "uuid",
  "entityDisplayCode": "ORD-1001",
  "action": "Approve conditional PCD release",
  "oldValue": {
    "readinessStatus": "BLOCKED"
  },
  "newValue": {
    "readinessStatus": "CONDITIONALLY_READY",
    "openItems": ["TRIMS_AVAILABLE"]
  },
  "reason": "Trim arrival confirmed before sewing start",
  "performedBy": {
    "id": 12,
    "displayName": "Production Head"
  },
  "performedAt": "2026-06-05T12:05:00+07:00",
  "source": "WEB",
  "ipAddress": "10.10.1.25",
  "deviceId": null,
  "correlationId": "uuid",
  "metadata": {
    "expiryDate": "2026-06-08",
    "riskNote": "Sewing will be blocked if trims slip"
  }
}
```

---

## 8. Source Values

```text
WEB
HANDHELD
TABLET
KIOSK
ADMIN
IMPORT
INTEGRATION
SYSTEM_JOB
API
```

---

## 9. Correlation ID

A correlation ID links multiple audit events caused by a single user or system action.

Example:

```text
User marks wash rewash required
→ wash batch status changes
→ WIP moves to REWASH_WIP
→ wash load recalculates
→ exception created
```

All related audit/events should share:

```text
correlation_id
```

This enables traceability of downstream impact.

---

## 10. Request ID

Request ID tracks a single API request.

Useful for:

```text
debugging
support
API trace
event grouping
```

---

## 11. Audit vs Event vs Log

### 11.1 Audit Event

Business-readable trace of governed action.

### 11.2 Domain Event

Internal operational event that may trigger downstream processing.

### 11.3 Technical Log

Developer/system log for debugging.

The audit table should not be polluted with low-level technical logs.

---

# Part B: Mandatory Audit Events

---

## 12. Critical Actions Requiring Audit

Mandatory audit for:

```text
PCD conditional release approval
PCD release to cutting
blocked release override
weekly plan freeze
plan change approval/rejection
operation bulletin approval
operation bulletin version creation
line realignment approval/application
line balance approval
wash rewash decision
wash batch cancellation
QC hold release
QC waiver
WIP manual adjustment
WIP scrap
WIP movement out of normal route
shipment marked ready
split shipment approval
critical exception closure
exception severity override
recovery action approval/completion
import batch application
master data approval
role/permission change
user activation/deactivation
integration configuration change
```

---

## 13. Recommended Audit Event Codes

```text
PCD_ITEM_UPDATED
PCD_READY
PCD_BLOCKED
PCD_CONDITIONAL_RELEASE_APPROVED
PCD_RELEASED_TO_CUTTING

PLAN_CREATED
PLAN_WORK_ITEM_ADDED
PLAN_WORK_ITEM_MOVED
PLAN_FROZEN
PLAN_CHANGE_REQUESTED
PLAN_CHANGE_APPROVED
PLAN_CHANGE_REJECTED

RELEASE_VALIDATED
RELEASE_BLOCKED
RELEASE_CREATED
RELEASE_OVERRIDE_APPROVED
RELEASE_COMPLETED

BULLETIN_CREATED
BULLETIN_CLONED
BULLETIN_APPROVED
BULLETIN_OBSOLETED

LINE_REALIGNMENT_PROPOSED
LINE_REALIGNMENT_APPROVED
LINE_REALIGNMENT_APPLIED
LINE_BALANCE_APPROVED

SEWING_OUTPUT_RECORDED
DOWNTIME_STARTED
DOWNTIME_RESOLVED

WASH_BATCH_CREATED
WASH_STEP_STARTED
WASH_STEP_COMPLETED
WASH_REWASH_REQUIRED
WASH_RELEASED_TO_FINISHING

WIP_MOVED
WIP_HELD
WIP_HOLD_RELEASED
WIP_ADJUSTED
WIP_SCRAPPED

QC_INSPECTION_CREATED
QC_HOLD_CREATED
QC_HOLD_RELEASED
QC_WAIVED

EXCEPTION_CREATED
EXCEPTION_ASSIGNED
EXCEPTION_ESCALATED
EXCEPTION_CLOSED
EXCEPTION_REOPENED
EXCEPTION_SEVERITY_OVERRIDDEN

RECOVERY_ACTION_CREATED
RECOVERY_ACTION_APPROVED
RECOVERY_ACTION_COMPLETED
RECOVERY_ACTION_FAILED

SHIPMENT_CHECKLIST_UPDATED
SHIPMENT_READY_MARKED
SHIPMENT_SPLIT_APPROVED
SHIPMENT_DISPATCH_CONFIRMED

IMPORT_BATCH_UPLOADED
IMPORT_BATCH_VALIDATED
IMPORT_BATCH_APPLIED
IMPORT_BATCH_FAILED

MASTER_DATA_CREATED
MASTER_DATA_UPDATED
MASTER_DATA_APPROVED
MASTER_DATA_OBSOLETED

ROLE_PERMISSION_CHANGED
USER_ROLE_ASSIGNED
USER_DEACTIVATED
INTEGRATION_CONFIG_CHANGED
```

---

# Part C: State Transition Traceability

---

## 14. State Transition Audit

Every controlled state transition should record:

```text
entity
from_state
to_state
trigger
user/system
reason
timestamp
validation result
approval reference if any
```

Example:

```text
Wash Batch WB-1001
POST_WASH_QC → REWASH_REQUIRED
Reason: Shade too dark
User: Wash Supervisor
Approval Required: Yes
Exception: EXC-1001
```

---

## 15. State Transition Log

A separate `state_transition_log` table may be useful in mature phases.

### 15.1 Fields

```text
transition_id
entity_type
entity_id
from_state
to_state
transition_code
performed_by
performed_at
reason
approval_id
audit_event_id
metadata_json
```

### 15.2 MVP Recommendation

For MVP:

```text
audit_event can include state transition fields
```

For maturity:

```text
add dedicated state_transition_log if needed
```

---

## 16. Invalid Transition Attempts

The system may also log invalid attempts for critical actions.

Examples:

```text
unauthorized user tried to adjust WIP
user tried to mark shipment ready with AQL pending
line supervisor tried to submit output for unassigned line
```

These can be stored as security/audit events if required.

Recommended event codes:

```text
ACTION_DENIED_PERMISSION
ACTION_DENIED_STATE
ACTION_DENIED_SCOPE
```

---

# Part D: Approval Traceability

---

## 17. Approval Record

Approval is required when a user requests permission to perform a controlled override or high-impact action.

Examples:

```text
conditional PCD release
blocked release override
line realignment
QC hold release
WIP adjustment
split shipment
import apply
```

---

## 18. Approval Model

### 18.1 Required Fields

```text
approval_id
approval_type
entity_type
entity_id
requested_by
requested_at
request_reason
impact_summary_json
status
approved_by
approved_at
rejected_by
rejected_at
decision_reason
expiry_date
audit_event_id
```

### 18.2 Status Values

```text
REQUESTED
APPROVED
REJECTED
EXPIRED
CANCELLED
```

---

## 19. Approval Types

```text
PCD_CONDITIONAL_RELEASE
RELEASE_OVERRIDE
PLAN_CHANGE
LINE_REALIGNMENT
LINE_BALANCE_APPROVAL
OPERATION_BULLETIN_APPROVAL
WASH_REWASH_APPROVAL
QC_HOLD_RELEASE
WIP_ADJUSTMENT
SPLIT_SHIPMENT
IMPORT_APPLY
MASTER_DATA_APPROVAL
```

---

## 20. Approval Audit

Every approval decision must create audit event:

```text
approval requested
approval approved
approval rejected
approval expired
```

Audit must capture:

```text
impact
reason
approver
expiry
linked entity
```

---

# Part E: Order Traceability

---

## 21. Order Traceability View

The system must provide a full order trace.

For any order, users should see:

```text
customer/order details
PCD readiness history
material readiness
fabric QC
planning assignments
release history
cutting/sewing/wash/finishing/packing movement
WIP history
QC holds
exceptions
recovery actions
shipment readiness
dispatch
audit timeline
```

---

## 22. Order Trace Timeline

Recommended timeline groups:

```text
Order Setup
Material and Fabric
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

## 23. Order Trace API

```text
GET /api/v1/orders/{orderId}/trace
```

Response concept:

```json
{
  "data": {
    "orderId": "uuid",
    "orderNo": "ORD-1001",
    "timeline": [
      {
        "timestamp": "2026-06-05T12:05:00+07:00",
        "group": "PCD",
        "eventCode": "PCD_CONDITIONAL_RELEASE_APPROVED",
        "title": "Conditional PCD release approved",
        "performedBy": "Production Head",
        "reason": "Trim arrival confirmed before sewing start"
      }
    ]
  },
  "meta": {},
  "errors": []
}
```

---

# Part F: WIP Traceability

---

## 24. WIP Traceability Requirement

For every WIP quantity, the system should trace:

```text
stage entry
stage exit
movement quantity
holder
handover
QC status
hold/release
rework
scrap/adjustment
linked batch/bundle
```

---

## 25. WIP Movement Audit

Mandatory for:

```text
manual movement
movement between departments
movement of held WIP
movement out of sequence
adjustment
scrap
rework movement
```

---

## 26. WIP Trace API

```text
GET /api/v1/wip/{wipItemId}/trace
GET /api/v1/orders/{orderId}/wip-trace
```

Response should include:

```text
WIP item
movement timeline
holds
rework
adjustments
linked QC inspections
linked exceptions
audit events
```

---

## 27. Quantity Adjustment Trace

Manual adjustment must show:

```text
old quantity
adjustment quantity
new quantity
reason
approval reference
user
timestamp
evidence
```

No silent quantity correction.

---

# Part G: PCD, Planning, and Release Traceability

---

## 28. PCD Audit Requirements

Audit:

```text
checklist item update
fabric QC blocker update
mandatory item waiver
conditional release request
conditional release approval
conditional release expiry
release to cutting
```

Each audit must capture:

```text
old status
new status
item code
reason
user
evidence
```

---

## 29. Planning Audit Requirements

Audit:

```text
plan creation
work item addition
work item movement
capacity overload approval
plan freeze
plan change request
plan change approval
plan change application
plan cancellation
```

Impact audit should capture:

```text
affected orders
capacity before/after
shipment risk before/after
approval reason
```

---

## 30. Daily Release Audit Requirements

Audit:

```text
release validation
release blocked
release created
exception release requested
exception release approved
release completed
release cancelled
```

For override:

```text
blocking reason
override reason
approver
expiry/condition
```

---

# Part H: Wash, QC, and Shipment Traceability

---

## 31. Wash Audit Requirements

Audit:

```text
wash batch creation
batch quantity change
shade lot mix approval
step start/complete
batch hold
hold release
rewash required
rewash cycle start/complete
post-wash QC result
release to finishing
batch cancellation
```

Rewash audit must capture:

```text
parent batch
rewash quantity
reason
route
cycle number
capacity impact
shipment risk before/after
```

---

## 32. QC Audit Requirements

Audit:

```text
QC inspection creation
defect recording
QC hold creation
QC hold release
QC waiver
AQL status update
final QC clearance
```

QC hold release must include:

```text
resolution note
released quantity
approver
evidence if available
```

---

## 33. Shipment Audit Requirements

Audit:

```text
shipment checklist update
packed quantity update
AQL status update
documentation update
shipment blocked
split shipment approval
mark shipment ready
dispatch confirmation
```

Shipment ready audit must capture:

```text
packed quantity
short quantity
checklist status
user
timestamp
evidence/reference
```

---

# Part I: Exception and Recovery Traceability

---

## 34. Exception Audit Requirements

Audit:

```text
exception created
owner assigned
due date changed
severity changed
exception escalated
resolution submitted
exception closed
exception reopened
exception cancelled
```

Severity override requires:

```text
old severity
new severity
reason
authorized user
```

---

## 35. Recovery Action Audit Requirements

Audit:

```text
recovery action created
recovery action assigned
approval requested
approval approved/rejected
action completed
action failed
action cancelled
```

Completion should include:

```text
actual impact
closure note
linked exception
shipment risk after action
```

---

## 36. Cost-Protected OTIF Trace

For OTIF achieved with recovery, trace should show:

```text
linked recovery actions
overtime/extra shift/split shipment/premium freight
approval if applicable
orders protected
shipment outcome
```

---

# Part J: Integration and Import Traceability

---

## 37. Import Audit Requirements

Audit:

```text
file uploaded
dry-run validation completed
import errors generated
import applied
import partially applied
import failed
import cancelled
```

Applied import audit must capture:

```text
batch ID
import type
file name
records created
records updated
records skipped
records rejected
applied by
applied at
```

---

## 38. Row-Level Traceability

For critical imports:

```text
orders
BOM
operation bulletins
opening WIP
material POs
shipment status
```

the system should preserve row-level staging data and errors for traceability.

---

## 39. Integration Run Trace

Each integration run should record:

```text
source
start time
end time
status
records received
records valid
records invalid
records applied
errors
triggered by
```

If integration failure affects operations:

```text
create system/integration exception
```

---

# Part K: Master Data Traceability

---

## 40. Master Data Audit Scope

Audit changes to:

```text
customer
buyer
style
BOM
operation bulletin
operation master
wash route
machine master
line master
skill matrix
vendor
planning thresholds
WIP stage thresholds
shift calendars
roles and permissions
integration configuration
```

---

## 41. Version-Controlled Masters

The following should be version-controlled:

```text
BOM
operation bulletin
wash route
planning thresholds
line balance plan
```

Approved versions should be immutable.

Change flow:

```text
clone/create draft
edit draft
submit approval
approve
activate
obsolete previous if needed
```

---

## 42. Master Data Approval Audit

Audit should include:

```text
version
approver
effective date
reason
previous active version
new active version
```

---

# Part L: Shopfloor and Mobile Traceability

---

## 43. Mobile Event Trace

Every mobile event must include:

```text
user
device ID
source
original timestamp
sync timestamp
client event ID
server event ID
offline/online indicator
```

---

## 44. Offline Sync Audit

Audit or sync log should capture:

```text
offline entry created
entry synced
entry failed
entry conflicted
conflict resolved
entry discarded
```

Do not allow offline events to silently disappear.

---

## 45. Shift Closure Trace

Shift closure must trace:

```text
output confirmed
defects confirmed
WIP handover confirmed
downtime confirmed
open issues
next shift instructions
closed by
closed at
```

---

# Part M: Evidence and Attachments

---

## 46. Evidence Use Cases

Evidence may be attached for:

```text
fabric QC result
QC defect photo
post-wash shade issue
WIP hold
QC hold release
shipment documentation
import files
approval evidence
exception closure
```

---

## 47. Attachment Metadata

Fields:

```text
attachment_id
entity_type
entity_id
file_name
file_type
file_size
uploaded_by
uploaded_at
storage_path
description
visibility
```

---

## 48. Evidence Governance

Rules:

```text
attachments must be linked to entity
sensitive files require restricted visibility
deleted/replaced evidence must retain audit record
file type and size must be controlled
```

---

# Part N: Audit APIs

---

## 49. Entity Audit API

```text
GET /api/v1/audit/{entityType}/{entityId}
```

Query params:

```text
eventCode
performedBy
dateFrom
dateTo
source
```

Response item:

```json
{
  "id": "uuid",
  "eventCode": "WIP_ADJUSTED",
  "action": "WIP quantity adjusted",
  "performedBy": {
    "id": 45,
    "displayName": "Planner A"
  },
  "performedAt": "2026-06-05T15:00:00+07:00",
  "source": "WEB",
  "oldValue": {
    "qty": 9800
  },
  "newValue": {
    "qty": 9750
  },
  "reason": "Duplicate packing entry correction",
  "evidenceUrl": null
}
```

---

## 50. Audit Search API

```text
GET /api/v1/audit/search
```

Filters:

```text
entityType
entityId
eventCode
orderId
factoryId
performedBy
source
dateFrom
dateTo
riskBefore
riskAfter
```

---

## 51. Order Trace API

```text
GET /api/v1/orders/{orderId}/trace
```

---

## 52. WIP Trace API

```text
GET /api/v1/orders/{orderId}/wip-trace
GET /api/v1/wip/{wipItemId}/trace
```

---

## 53. Approval Trace API

```text
GET /api/v1/approvals
GET /api/v1/approvals/{approvalId}
```

---

## 54. Import Trace API

```text
GET /api/v1/imports/{batchId}/trace
```

---

# Part O: Frontend Audit Surfaces

---

## 55. Audit Trail Drawer

Reusable component:

```text
AuditTrailPanel
```

Use in:

```text
order drawer
PCD drawer
plan drawer
WIP drawer
wash batch drawer
exception drawer
shipment drawer
master data detail
```

Fields:

```text
timestamp
action
user
old value
new value
reason
source
evidence
```

---

## 56. Order Trace Screen

Route:

```text
/orders/:orderId/trace
```

Sections:

```text
order setup
material/fabric
PCD
planning
release
production
wash
quality
WIP
exceptions
shipment
audit
```

---

## 57. Audit Search Screen

Route:

```text
/audit/search
```

Allowed only to audit/management/admin users.

Features:

```text
filters
event list
entity drilldown
export if permitted
```

---

## 58. Approval Inbox

Route:

```text
/approvals
```

Sections:

```text
pending my approval
approved
rejected
expired
```

Cards should show:

```text
approval type
entity
impact
requested by
requested at
reason
expiry
approve/reject action
```

---

# Part P: Retention and Archival

---

## 59. Retention Requirements

Recommended minimum:

```text
audit events: retain for full operational history or defined company policy
import files: retain for configured period
technical logs: shorter retention
attachments: retain according to entity policy
```

Exact retention policy should be decided by Eratex.

---

## 60. Archival

Mature state may archive older audit events to:

```text
cold storage
audit warehouse
compressed archive table
```

But audit must remain retrievable for agreed period.

---

## 61. Immutability

Audit records should not be editable by normal users.

If correction is needed:

```text
create correction audit event
do not overwrite original audit event
```

---

# Part Q: Security and Access

---

## 62. Audit Access Permissions

Recommended permissions:

```text
audit.view
audit.search
audit.export
audit.view_sensitive
approval.view
approval.approve
approval.reject
```

---

## 63. Audit Visibility Rules

General users can see audit related to entities they can access.

Sensitive audit events require higher permission:

```text
role/permission changes
security denials
integration credentials
commercial data changes, if any
```

---

## 64. Export Governance

Audit exports must be controlled.

Export log should capture:

```text
who exported
filters used
timestamp
row count
file reference
```

---

# Part R: Monitoring and Compliance KPIs

---

## 65. Compliance KPIs

Recommended KPIs:

```text
critical actions without audit = should be zero
pending approvals
expired approvals
overdue approvals
WIP adjustments count
QC waivers count
release overrides count
shipment-ready overrides count
role/permission changes
import batches applied
audit export count
```

---

## 66. Governance Risk Indicators

Examples:

```text
too many WIP adjustments
frequent release overrides
frequent QC waivers
high number of manual plan changes after freeze
repeated import corrections
high number of permission denials
```

These should be visible to management/admin.

---

# Part S: Backend Implementation Guidance

---

## 67. Recommended Modules

```text
audit_governance
approvals
attachments
```

or consolidated:

```text
audit_governance
```

Submodules:

```text
audit_governance/services/audit.py
audit_governance/services/approvals.py
audit_governance/services/trace.py
audit_governance/selectors/audit_search.py
audit_governance/selectors/order_trace.py
audit_governance/models.py
```

---

## 68. Audit Service Function

```python
write_audit_event(
    *,
    event_code,
    entity_type,
    entity_id,
    action,
    performed_by,
    old_value=None,
    new_value=None,
    reason=None,
    source="WEB",
    order_id=None,
    factory_id=None,
    correlation_id=None,
    request_id=None,
    metadata=None,
)
```

---

## 69. Audit Helper Rules

Use helper service instead of manually creating audit events in random modules.

Benefits:

```text
consistent fields
consistent source handling
consistent correlation ID
consistent metadata structure
testability
```

---

## 70. Transaction Safety

Critical action and audit should be in same database transaction where possible.

Example:

```python
with transaction.atomic():
    update_wip()
    write_audit_event()
```

If audit fails:

```text
critical state change should fail unless policy says otherwise
```

---

## 71. Audit Middleware

Optional middleware can capture:

```text
request ID
IP address
user
source
device ID
```

Then services can consume request context.

---

# Part T: Testing Requirements

---

## 72. Audit Unit Tests

Required tests:

```text
audit event created for critical action
old/new values stored correctly
reason required where configured
correlation ID reused across linked actions
audit immutable after creation
```

---

## 73. Approval Tests

Required tests:

```text
approval request created
approval approval writes audit
approval rejection writes audit
expired approval cannot be used
unauthorized user cannot approve
```

---

## 74. Traceability Tests

Required tests:

```text
order trace includes PCD, WIP, wash, QC, shipment events
WIP trace shows movements and adjustments
import trace shows validation and apply records
exception trace shows escalation and closure
```

---

## 75. API Tests

Required tests:

```text
entity audit API enforces permission
audit search filters correctly
audit export requires permission
order trace respects factory/customer scope
approval inbox returns pending approvals
```

---

## 76. E2E Compliance Scenarios

### 76.1 WIP Adjustment

```text
User requests WIP adjustment
→ approval required
→ approved
→ WIP changed
→ audit created with old/new quantity
```

### 76.2 QC Hold Release

```text
QC hold created
→ release requested
→ QC Manager approves
→ WIP released
→ audit and trace updated
```

### 76.3 Shipment Ready

```text
Shipment marked ready
→ checklist state captured
→ user captured
→ audit visible in order trace
```

### 76.4 Import Apply

```text
Order import uploaded
→ validated
→ applied
→ import trace shows created/updated rows
→ audit event created
```

---

# Part U: Implementation Phasing

---

## 77. Phase 1: Audit Foundation

Build:

```text
AuditEvent model
audit service
critical event codes
entity audit API
basic audit drawer
```

---

## 78. Phase 2: Critical Workflow Audit

Apply audit to:

```text
PCD
planning
release
WIP
wash
QC
shipment
exceptions
imports
```

---

## 79. Phase 3: Approval Model

Build:

```text
Approval model
approval inbox
approval APIs
approval audit
expiry handling
```

---

## 80. Phase 4: Traceability Views

Build:

```text
order trace
WIP trace
import trace
exception trace
shipment trace
```

---

## 81. Phase 5: Compliance Analytics

Build:

```text
override count
waiver count
adjustment count
approval ageing
critical actions without audit check
audit export log
```

---

# Part V: Open Decisions

---

## 82. Decisions Required

Before implementation, confirm:

1. Which audit events are mandatory for MVP?
2. Should invalid/denied action attempts be audited?
3. What is the audit retention policy?
4. Who can export audit data?
5. Should approval be a generic engine from MVP or module-specific first?
6. Which actions require approval versus direct permission?
7. Should evidence attachment be mandatory for QC hold release?
8. Should old/new values store full object snapshots or changed fields only?
9. Is immutable audit storage required beyond database write protection?
10. Should audit be exposed to business users or admin only?
11. What level of row-level import trace is required?
12. Should audit events be archived to external storage later?

---

## 83. Non-Negotiable Rules

```text
1. Critical state changes must create audit events.
2. Audit records must not be edited by normal users.
3. WIP adjustment must capture old quantity, new quantity, reason, and user.
4. QC hold release must capture approver and resolution note.
5. Shipment ready marking must be traceable.
6. Import apply must be traceable to file, batch, and user.
7. Approved master data changes must be versioned or auditable.
8. Mobile/offline events must retain original timestamp and device ID.
9. Audit visibility must be permission-controlled.
10. Traceability must support order-level end-to-end review.
```

---

## 84. Summary

This document defines the audit, compliance, and traceability spine for the Eratex Planning & Scheduling Platform.

The system must support end-to-end traceability across:

```text
orders
PCD
planning
release
WIP
sewing
wash
quality
exceptions
recovery
shipment
integration
master data
security
```

The audit layer must make the platform trustworthy.

The guiding principle is:

```text
No critical operational decision should happen without a visible, durable, business-readable trace.
```

## Phase 5 / EOS-05 Execution Audit Events

Execution actions must write business-readable audit events for cutting job creation, cutting output, bundle creation, cutting-to-sewing handover, line loading preview and activation, line realignment request/approval/application/rejection, sewing output capture, output correction, WIP movement, and line shortfall detection.

Audit is append-only. Output correction must not overwrite the original capture; it records the reversal and replacement context.
