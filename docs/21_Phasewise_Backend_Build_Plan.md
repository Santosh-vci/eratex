# 21. Phase-wise Backend Build Plan  
# Eratex End-to-End Planning & Scheduling Platform

**Company:** Eratex  
**Product:** Planning & Scheduling Tool for Denim Bottoms + Chinos Manufacturing  
**Document Type:** Phase-wise Backend Build Plan  
**Version:** 2.0  
**Date:** 2026-05-26  
**Backend Stack:** Django + Django REST Framework + PostgreSQL + Redis + Celery  
**Deployment Baseline:** Dockerized application stack  
**Frontend Dependency:** React/Next.js frontend consuming `/api/v1/` contracts  
**Related Documents:**  
- 01 Technical Architecture Spine  
- 02 Data Model and Table Schema Specification  
- 03 Master Data Specification  
- 04 Planning Logic and Calculation Flows  
- 05 Backend Domain Module Specification  
- 06 API and Data Contracts Specification  
- 07 Event and State Transition Specification  
- 08 WIP Inventory and Reconciliation Specification  
- 09 Line Routing and Operation Bulletin Specification  
- 10 Wash Planning and Execution Specification  
- 11 Exception, Alert, and Recovery Specification  
- 12 Handheld Shopfloor Capture Technical Specification  
- 14 Analytics and Reporting Specification  
- 15 Integration Specification  
- 16 Security, Roles, and Permissions Specification  
- 17 Audit, Compliance, and Traceability Specification  
- 18 Deployment and DevOps Specification  
- 19 Testing and QA Strategy  
- 20 Seed Data and Simulation Scenarios  

---

## 1. Purpose

This document defines the phase-wise backend build plan for the Eratex Planning & Scheduling Platform.

The backend must support the complete operational spine for denim bottoms and chinos garment manufacturing:

```text
order intake
→ style and technical readiness
→ material and fabric readiness
→ PCD readiness
→ weekly planning
→ daily release
→ cutting/sewing/wash execution
→ WIP movement
→ quality holds
→ exceptions and recovery
→ shipment readiness
→ analytics and audit
```

This document converts the technical specification pack into an implementation sequence that can be executed by a backend engineering team or AI coding agent.

---

## 2. Backend Build Thesis

The backend should be built as a governed operational system, not as a collection of CRUD tables.

The implementation principle is:

```text
Models define the structure.
Services enforce business rules.
APIs expose controlled actions.
Events and audit preserve traceability.
Celery keeps background intelligence alive.
Tests protect operational correctness.
```

The backend should avoid this anti-pattern:

```text
generic PATCH updates critical statuses directly
```

The preferred pattern is:

```text
POST /api/v1/.../specific-action
→ service validation
→ state transition
→ audit
→ downstream recalculation
→ response with available actions
```

---

## 3. Build Strategy

## 3.1 Build in Vertical Slices

The system should be built in vertical slices, not only app-by-app.

A useful vertical slice includes:

```text
models
migrations
admin
seed data
services
selectors
serializers
APIs
permissions
audit
tests
```

This keeps each domain usable and testable.

## 3.2 Start with Foundation Before Operations

Do not start with planning screens before core foundations are ready.

Required foundations:

```text
identity and RBAC
master data
orders
style technical
audit
common API envelope
seed data
```

## 3.3 Backend Owns Business Calculations

Frontend should not calculate official planning truth.

Backend must own:

```text
PCD readiness
capacity load
line efficiency
WIP ageing
shipment risk
exception severity
OTIF
cost-protected OTIF
```

## 3.4 Fail Closed

If required data is missing, the backend should fail closed.

Example:

```text
No approved operation bulletin → do not allow line loading.
No approved wash route → do not allow wash batch.
Fabric QC failed → do not allow cutting release unless waiver.
```

---

## 4. Backend App Structure

Recommended Django app structure:

```text
apps/
  common/
  identity_access/
  organization/
  master_data/
  orders/
  style_technical/
  materials_procurement/
  fabric_qc/
  pcd_readiness/
  planning/
  production_release/
  workcenters/
  sewing/
  washing/
  wip_inventory/
  quality/
  exceptions/
  shipment/
  analytics/
  integrations/
  audit_governance/
  shopfloor/
  demo_seed/
```

---

## 5. Backend Coding Pattern

Each app should use this internal structure where practical:

```text
models.py
admin.py
serializers.py
views.py
urls.py
permissions.py
selectors.py
services.py
tasks.py
tests/
```

For larger modules:

```text
services/
  lifecycle.py
  calculations.py
  validation.py
  actions.py

selectors/
  dashboards.py
  lists.py
  detail.py
```

---

## 6. Common Backend Rules

### 6.1 Service Layer Rule

Business logic must live in services, not directly in views.

### 6.2 Selector Rule

Complex read queries and dashboard aggregations should live in selectors.

### 6.3 API Envelope Rule

All APIs should use common response shape:

```json
{
  "data": {},
  "meta": {},
  "errors": []
}
```

### 6.4 Audit Rule

Critical services must write audit events.

### 6.5 Permission Rule

Every write API must check permission and scope.

### 6.6 Transaction Rule

Critical workflows must use `transaction.atomic()`.

---

# Part A: Build Phases

---

## 7. Phase Overview

Recommended phases:

```text
Phase 0: Project and DevOps foundation
Phase 1: Identity, RBAC, organization, common framework
Phase 2: Master data and technical product foundation
Phase 3: Orders, material, fabric QC, and PCD readiness
Phase 4: Planning, workcenter capacity, and daily release
Phase 5: WIP inventory and reconciliation
Phase 6: Sewing execution, line routing, and operation bulletin
Phase 7: Wash planning and execution
Phase 8: Quality, exceptions, recovery, and shipment readiness
Phase 9: Shopfloor handheld APIs and offline sync
Phase 10: Integrations and import framework
Phase 11: Analytics, snapshots, and reporting APIs
Phase 12: Audit hardening, performance, and production readiness
```

---

# Phase 0: Project and DevOps Foundation

---

## 8. Phase 0 Objective

Create the backend project skeleton and local Dockerized environment.

---

## 9. Phase 0 Deliverables

```text
Django project initialized
Dockerfile for backend
docker-compose with PostgreSQL, Redis, backend, Celery worker, Celery beat
base settings split by environment
requirements management
health check endpoint
pytest setup
linting setup
initial README
```

---

## 10. Phase 0 Django Setup

Create:

```text
backend/manage.py
backend/config/settings/base.py
backend/config/settings/local.py
backend/config/settings/staging.py
backend/config/settings/production.py
backend/config/urls.py
backend/config/celery.py
```

---

## 11. Phase 0 Docker Services

Create compose services:

```text
backend
postgres
redis
celery_worker
celery_beat
```

Optional:

```text
flower
```

---

## 12. Phase 0 Environment Variables

Minimum:

```text
DJANGO_SECRET_KEY
DJANGO_DEBUG
DJANGO_ALLOWED_HOSTS
DATABASE_URL
REDIS_URL
CELERY_BROKER_URL
CELERY_RESULT_BACKEND
TIME_ZONE
```

---

## 13. Phase 0 APIs

Create:

```text
GET /health
GET /api/v1/ping
```

---

## 14. Phase 0 Tests

Tests:

```text
Django app starts
database connection works
Redis connection works
health endpoint returns OK
Celery app loads
```

---

## 15. Phase 0 Exit Criteria

Phase is complete when:

```text
developer can run docker compose up
backend starts
migrations run
health check works
pytest runs
Celery worker starts
```

---

# Phase 1: Identity, RBAC, Organization, and Common Framework

---

## 16. Phase 1 Objective

Build the security, organization, API, audit, and permission foundation used by all later modules.

---

## 17. Phase 1 Apps

```text
common
identity_access
organization
audit_governance
demo_seed
```

---

## 18. Phase 1 Models

### identity_access

```text
UserProfile
Role
PermissionAction
UserRole
RolePermission
UserScope
```

### organization

```text
Factory
Department
Workcenter
Line
ShiftCalendar
HolidayCalendar
```

### audit_governance

```text
AuditEvent
ApprovalRequest, optional later but skeleton now
```

### common

```text
BaseModel
TimeStampedModel
Status/Risk enums
```

---

## 19. Phase 1 Services

```text
identity_access.services.permissions.user_has_permission()
identity_access.services.scopes.get_user_scope()
audit_governance.services.audit.write_audit_event()
organization.services.calendar.get_working_minutes()
```

---

## 20. Phase 1 APIs

```text
GET /api/v1/me
GET /api/v1/permissions
GET /api/v1/organization/factories
GET /api/v1/organization/departments
GET /api/v1/organization/workcenters
GET /api/v1/organization/lines
GET /api/v1/audit/{entityType}/{entityId}
```

Write APIs for roles/users can be Django Admin first.

---

## 21. Phase 1 Admin

Configure Django Admin for:

```text
users
profiles
roles
permissions
role permissions
factories
departments
workcenters
lines
shift calendars
audit events read-only
```

---

## 22. Phase 1 Seed Data

Seed:

```text
roles
permission actions
factory
departments
workcenters
lines
shift calendar
users
```

---

## 23. Phase 1 Tests

Required tests:

```text
permission check works
scope check works
/api/v1/me returns roles and permissions
inactive user blocked
audit event created by service
factory-scoped user cannot access other factory data
```

---

## 24. Phase 1 Exit Criteria

Complete when:

```text
RBAC foundation works
Django Admin usable
core users and roles seeded
frontend can call /api/v1/me
permission helpers usable by other apps
```

---

# Phase 2: Master Data and Technical Product Foundation

---

## 25. Phase 2 Objective

Create the master and technical foundation required before planning can function.

---

## 26. Phase 2 Apps

```text
master_data
style_technical
workcenters
```

---

## 27. Phase 2 Models

### master_data

```text
Customer
Buyer
Vendor
Material
MachineType
Machine
DefectCode
AttachmentFolder
SkillLevel
```

### style_technical

```text
Style
StyleBOMHeader
StyleBOMLine
OperationMaster
OperationBulletin
OperationBulletinLine
WashRoute
WashRouteStep
```

### workcenters

```text
WorkcenterCapacityDay
MachineAssignment
```

---

## 28. Phase 2 Services

```text
style_technical.services.bom.validate_bom()
style_technical.services.operation_bulletins.calculate_total_smv()
style_technical.services.operation_bulletins.approve_bulletin()
style_technical.services.wash_routes.approve_wash_route()
workcenters.services.capacity.calculate_available_capacity()
```

---

## 29. Phase 2 APIs

```text
GET /api/v1/master/customers
GET /api/v1/master/buyers
GET /api/v1/master/vendors
GET /api/v1/master/materials
GET /api/v1/master/machines
GET /api/v1/styles
GET /api/v1/styles/{id}
GET /api/v1/operation-bulletins
POST /api/v1/operation-bulletins
GET /api/v1/operation-bulletins/{id}
POST /api/v1/operation-bulletins/{id}/approve
POST /api/v1/operation-bulletins/{id}/clone
GET /api/v1/wash-routes
POST /api/v1/wash-routes/{id}/approve
```

Most master writes can initially be via Django Admin.

---

## 30. Phase 2 Admin

Admin support for:

```text
customer/buyer/vendor/material
machine types/machines
styles
BOM
operation master
operation bulletin
wash route
wash route steps
```

---

## 31. Phase 2 Seed Data

Seed:

```text
customers
buyers
vendors
materials
machines
styles
BOMs
operation masters
operation bulletins
wash routes
```

Use scenarios from Document 20.

---

## 32. Phase 2 Tests

Required tests:

```text
operation bulletin total SMV calculation
operation bulletin approval validation
approved bulletin immutable
wash route cannot approve without steps
BOM validation
machine assignment validation
style technical readiness check
```

---

## 33. Phase 2 Exit Criteria

Complete when:

```text
styles can be made planning-ready
operation bulletin approval works
wash route approval works
core technical masters exist
frontend can list technical readiness
```

---

# Phase 3: Orders, Material, Fabric QC, and PCD Readiness

---

## 34. Phase 3 Objective

Build the order readiness spine from confirmed order to PCD release eligibility.

---

## 35. Phase 3 Apps

```text
orders
materials_procurement
fabric_qc
pcd_readiness
```

---

## 36. Phase 3 Models

### orders

```text
ProductionOrder
OrderLine
OrderMilestone
OrderLifecycleEvent
```

### materials_procurement

```text
MaterialRequirement
MaterialPurchaseOrder
MaterialETAUpdate
```

### fabric_qc

```text
FabricLot
FabricRoll
FabricQCInspection
FabricQCParameterResult
```

### pcd_readiness

```text
PCDChecklistTemplate
PCDChecklistItem
PCDReadiness
PCDReadinessItem
ConditionalRelease
```

---

## 37. Phase 3 Services

```text
orders.services.lifecycle.initialize_order_lifecycle()
materials_procurement.services.readiness.calculate_material_readiness()
fabric_qc.services.inspection.record_fabric_qc()
pcd_readiness.services.calculate_readiness()
pcd_readiness.services.request_conditional_release()
pcd_readiness.services.approve_conditional_release()
pcd_readiness.services.release_to_cutting()
```

---

## 38. Phase 3 APIs

```text
GET /api/v1/orders
POST /api/v1/orders
GET /api/v1/orders/{id}
GET /api/v1/orders/{id}/timeline
GET /api/v1/material-readiness
GET /api/v1/fabric-qc
POST /api/v1/fabric-qc/inspections
GET /api/v1/pcd-readiness
GET /api/v1/pcd-readiness/{id}
PATCH /api/v1/pcd-readiness/{id}/items/{itemId}
POST /api/v1/pcd-readiness/{id}/request-conditional-release
POST /api/v1/pcd-readiness/{id}/approve-conditional-release
POST /api/v1/orders/{id}/release-to-cutting
```

---

## 39. Phase 3 Business Rules

```text
order must have approved style technical data for planning readiness
fabric QC failed blocks PCD
material delay affects PCD readiness
conditional release requires approver, reason, expiry
release to cutting only allowed if PCD READY or valid CONDITIONAL
```

---

## 40. Phase 3 Audit Events

```text
ORDER_CREATED
FABRIC_QC_INSPECTION_CREATED
FABRIC_QC_FAILED
PCD_ITEM_UPDATED
PCD_READY
PCD_BLOCKED
PCD_CONDITIONAL_RELEASE_APPROVED
PCD_RELEASED_TO_CUTTING
```

---

## 41. Phase 3 Tests

Required tests:

```text
PCD ready when all mandatory items pass
PCD blocked when fabric QC fails
conditional release approval works
expired conditional release blocks release
release to cutting creates lifecycle event and audit
release to cutting blocked if readiness incomplete
```

---

## 42. Phase 3 Exit Criteria

Complete when:

```text
confirmed orders can be created/imported
PCD readiness calculated
fabric QC affects readiness
conditional release works
release-to-cutting gate works
```

---

# Phase 4: Planning, Workcenter Capacity, and Daily Release

---

## 43. Phase 4 Objective

Build the planning engine and release control layer.

---

## 44. Phase 4 Apps

```text
planning
production_release
workcenters
```

---

## 45. Phase 4 Models

### planning

```text
PlanVersion
PlannedWorkItem
PlanChangeRequest
PlanningHorizon
```

### production_release

```text
ProductionRelease
ReleaseValidationResult
ReleaseBlocker
```

### workcenters

```text
WorkcenterLoadSnapshot
WorkcenterQueueSnapshot
CapacityAdjustment
```

---

## 46. Phase 4 Services

```text
planning.services.create_plan_version()
planning.services.assign_work_item()
planning.services.calculate_plan_impact()
planning.services.freeze_plan()
planning.services.request_plan_change()
planning.services.approve_plan_change()

workcenters.services.calculate_load()
workcenters.services.calculate_constraint_status()
workcenters.services.get_current_constraint()

production_release.services.validate_release()
production_release.services.create_release()
production_release.services.request_exception_release()
production_release.services.approve_release_override()
production_release.services.complete_release()
```

---

## 47. Phase 4 APIs

```text
GET /api/v1/planning/weekly
POST /api/v1/planning/weekly
POST /api/v1/planning/weekly/{planId}/assign-item
POST /api/v1/planning/weekly/{planId}/impact-preview
POST /api/v1/planning/weekly/{planId}/freeze
POST /api/v1/planning/change-requests
POST /api/v1/planning/change-requests/{id}/approve

GET /api/v1/workcenters/load
GET /api/v1/workcenters/{id}/queue
GET /api/v1/workcenters/current-constraint

GET /api/v1/releases/daily
POST /api/v1/releases/validate
POST /api/v1/releases
POST /api/v1/releases/{id}/request-override
POST /api/v1/releases/{id}/approve-override
POST /api/v1/releases/{id}/complete
```

---

## 48. Phase 4 Business Rules

```text
only eligible orders can be planned
plan freeze blocks direct editing
plan change request required after freeze
release validation must check PCD/WIP/QC/capacity gates
blocked release override requires approval
capacity overload affects risk and exceptions
```

---

## 49. Phase 4 Tests

Required tests:

```text
workcenter load calculation
utilization status calculation
plan freeze validation
frozen plan cannot be edited directly
plan change approval modifies plan
release validation blocks missing PCD
override creates audit
constraint status calculated correctly
```

---

## 50. Phase 4 Exit Criteria

Complete when:

```text
weekly plan can be created and frozen
daily release can be validated and created
workcenter load visible
capacity constraint calculation works
blocked release governance works
```

---

# Phase 5: WIP Inventory and Reconciliation

---

## 51. Phase 5 Objective

Build the WIP control layer that connects planning to physical production reality.

---

## 52. Phase 5 Apps

```text
wip_inventory
```

---

## 53. Phase 5 Models

```text
WIPItem
WIPMovement
WIPHold
WIPAdjustment
WIPStageThreshold
WIPReconciliationResult
WIPReconciliationGap
```

---

## 54. Phase 5 Services

```text
wip_inventory.services.create_wip_item()
wip_inventory.services.move_wip()
wip_inventory.services.hold_wip()
wip_inventory.services.release_wip_hold()
wip_inventory.services.adjust_wip()
wip_inventory.services.calculate_wip_ageing()
wip_inventory.services.reconcile_order_quantities()
wip_inventory.services.get_pipeline_summary()
```

---

## 55. Phase 5 APIs

```text
GET /api/v1/wip/pipeline
GET /api/v1/wip/pipeline/{stage}
POST /api/v1/wip/move
POST /api/v1/wip/{wipItemId}/hold
POST /api/v1/wip/{wipItemId}/release-hold
POST /api/v1/wip/adjust
GET /api/v1/wip/reconciliation/{orderId}
GET /api/v1/orders/{orderId}/wip-trace
```

---

## 56. Phase 5 Business Rules

```text
WIP movement cannot exceed available quantity
held WIP cannot move unless released/waived
manual adjustment requires permission and audit
stage transitions must be valid or approved
rework WIP is visible separately
reconciliation gaps generate exceptions
```

---

## 57. Phase 5 Celery Jobs

```text
hourly_wip_ageing_recalculation
daily_wip_snapshot
wip_reconciliation_scan
```

---

## 58. Phase 5 Tests

Required tests:

```text
WIP movement source/target update
held WIP movement blocked
manual adjustment audited
ageing status by threshold
pipeline aggregation
reconciliation gap detection
quantity impossible chain creates exception
```

---

## 59. Phase 5 Exit Criteria

Complete when:

```text
WIP pipeline works
stage drilldown works
WIP movement is controlled
WIP ageing works
reconciliation detects gaps
WIP audit works
```

---

# Phase 6: Sewing Execution, Line Routing, and Operation Bulletin

---

## 60. Phase 6 Objective

Build sewing execution, line capacity, line realignment, and operation bulletin performance foundation.

---

## 61. Phase 6 Apps

```text
sewing
style_technical
workcenters
```

---

## 62. Phase 6 Models

### sewing

```text
SewingLineLoading
SewingOutputEntry
SewingDefectEntry
DowntimeEvent
LineRealignment
LineBalancePlan
LineBalanceOperation
```

### style_technical already contains

```text
OperationBulletin
OperationBulletinLine
OperationMaster
```

---

## 63. Phase 6 Services

```text
sewing.services.calculate_line_capacity()
sewing.services.record_output()
sewing.services.calculate_line_efficiency()
sewing.services.detect_shortfall()
sewing.services.preview_line_realignment()
sewing.services.approve_line_realignment()
sewing.services.apply_line_realignment()
sewing.services.calculate_line_balance()
```

---

## 64. Phase 6 APIs

```text
GET /api/v1/sewing/line-loading
POST /api/v1/sewing/output
POST /api/v1/sewing/downtime
POST /api/v1/sewing/downtime/{id}/resolve
GET /api/v1/sewing/lines/{lineId}/efficiency
POST /api/v1/sewing/line-realignment/preview
POST /api/v1/sewing/line-realignment
POST /api/v1/sewing/line-realignment/{id}/approve
POST /api/v1/sewing/line-realignment/{id}/apply
GET /api/v1/sewing/line-balance
POST /api/v1/sewing/line-balance
POST /api/v1/sewing/line-balance/{id}/approve
```

---

## 65. Phase 6 Business Rules

```text
sewing output must be tied to active release/line
net-good = gross - defects - rework
line efficiency uses net-good output
line realignment requires machine/skill gap analysis
approved operation bulletin required for line loading
line balance approval feeds production target
```

---

## 66. Phase 6 Tests

Required tests:

```text
output capture updates WIP
duplicate output idempotency
line efficiency calculation
shortfall exception creation
machine gap detection
skill gap detection
line balance bottleneck calculation
downtime capacity impact
```

---

## 67. Phase 6 Exit Criteria

Complete when:

```text
sewing output can be captured
line efficiency visible
sewing shortfall detected
line realignment preview works
operation bulletin connects to line loading
```

---

# Phase 7: Wash Planning and Execution

---

## 68. Phase 7 Objective

Build wash as a first-class planning and execution domain.

---

## 69. Phase 7 Apps

```text
washing
wip_inventory
quality
workcenters
```

---

## 70. Phase 7 Models

```text
WashBatch
WashBatchEvent
WashBatchStepStatus
WashQueuePriority
RewashCycle
```

Wash route master already created in `style_technical`.

---

## 71. Phase 7 Services

```text
washing.services.get_wash_queue()
washing.services.calculate_priority_score()
washing.services.create_wash_batch()
washing.services.start_wash_step()
washing.services.complete_wash_step()
washing.services.hold_wash_batch()
washing.services.release_wash_hold()
washing.services.mark_rewash_required()
washing.services.release_to_finishing()
washing.services.calculate_wash_capacity()
```

---

## 72. Phase 7 APIs

```text
GET /api/v1/wash/queue
GET /api/v1/wash/board
POST /api/v1/wash/batches
GET /api/v1/wash/batches/{batchId}
POST /api/v1/wash/batches/{batchId}/events
POST /api/v1/wash/batches/{batchId}/rewash
POST /api/v1/wash/batches/{batchId}/release-to-finishing
GET /api/v1/wash/capacity
```

---

## 73. Phase 7 Business Rules

```text
no wash batch without approved route
batch qty cannot exceed available WIP
shade lot must be preserved
post-wash QC gates finishing release
rewash consumes capacity and creates WIP
multiple rewash cycles supported
rewash updates shipment risk and exceptions
```

---

## 74. Phase 7 Tests

Required tests:

```text
wash batch creation validates route and WIP
step event advances state
rewash creates additional load and WIP
release to finishing blocked if QC pending
shade lot mix requires approval
wash utilization calculation
wash queue priority calculation
```

---

## 75. Phase 7 Exit Criteria

Complete when:

```text
wash board works
batch execution works
rewash loop works
wash capacity updates
WIP moves through wash
wash exceptions generated
```

---

# Phase 8: Quality, Exceptions, Recovery, and Shipment Readiness

---

## 76. Phase 8 Objective

Build the exception/recovery operating layer and shipment gate.

---

## 77. Phase 8 Apps

```text
quality
exceptions
shipment
```

---

## 78. Phase 8 Models

### quality

```text
QCInspection
QCInspectionResult
QCDefect
QualityHold
ReworkOrder
```

### exceptions

```text
ExceptionRecord
ExceptionTimelineEvent
RecoveryAction
AlertRecord
```

### shipment

```text
ShipmentReadiness
ShipmentReadinessItem
ShipmentEvent
SplitShipmentApproval
```

---

## 79. Phase 8 Services

```text
quality.services.create_inspection()
quality.services.create_hold()
quality.services.release_hold()
quality.services.create_rework_order()

exceptions.services.create_exception()
exceptions.services.auto_generate_exception()
exceptions.services.calculate_severity()
exceptions.services.assign_exception()
exceptions.services.escalate_exception()
exceptions.services.close_exception()
exceptions.services.create_recovery_action()
exceptions.services.preview_recovery_impact()
exceptions.services.complete_recovery_action()

shipment.services.calculate_readiness()
shipment.services.update_checklist()
shipment.services.mark_ready()
shipment.services.approve_split_shipment()
shipment.services.confirm_dispatch()
```

---

## 80. Phase 8 APIs

```text
POST /api/v1/qc/inspections
POST /api/v1/qc/holds/{id}/release
GET /api/v1/exceptions
POST /api/v1/exceptions
GET /api/v1/exceptions/{id}
POST /api/v1/exceptions/{id}/assign
POST /api/v1/exceptions/{id}/escalate
POST /api/v1/exceptions/{id}/close
GET /api/v1/recovery-actions
POST /api/v1/recovery-actions
POST /api/v1/recovery-actions/impact-preview
POST /api/v1/recovery-actions/{id}/complete
GET /api/v1/shipments/readiness
POST /api/v1/shipments/{id}/update-checklist
POST /api/v1/orders/{id}/mark-shipment-ready
POST /api/v1/shipments/{id}/approve-split
POST /api/v1/shipments/{id}/confirm-dispatch
```

---

## 81. Phase 8 Business Rules

```text
QC hold blocks WIP movement/release
critical hold release requires permission
exceptions deduplicated by rule/context
RED/BLACK exceptions require owner and due date
shipment ready blocked unless all mandatory checklist items pass
split shipment requires approval
dispatch updates OTIF analytics inputs
```

---

## 82. Phase 8 Celery Jobs

```text
hourly_exception_scan
hourly_exception_escalation
hourly_shipment_readiness_scan
daily_exception_snapshot
```

---

## 83. Phase 8 Tests

Required tests:

```text
QC hold blocks movement
QC hold release audited
exception duplicate prevention
exception escalation
recovery impact preview
shipment ready blocked by AQL
split shipment approval
dispatch confirmation
```

---

## 84. Phase 8 Exit Criteria

Complete when:

```text
exception control tower backend works
recovery actions work
quality holds work
shipment readiness gates work
dispatch and OTIF inputs exist
```

---

# Phase 9: Shopfloor Handheld APIs and Offline Sync

---

## 85. Phase 9 Objective

Build mobile/PWA backend APIs for live shopfloor capture.

---

## 86. Phase 9 Apps

```text
shopfloor
sewing
washing
quality
wip_inventory
```

---

## 87. Phase 9 Models

```text
ShopfloorDevice
ShopfloorTask
OfflineSyncBatch
OfflineSyncEntry
DepartmentHandover
AndonIssue
ShiftClosure
```

Downtime may remain in `sewing` or `shopfloor`.

---

## 88. Phase 9 Services

```text
shopfloor.services.get_home()
shopfloor.services.create_task()
shopfloor.services.sync_offline_entries()
shopfloor.services.submit_handover()
shopfloor.services.accept_handover()
shopfloor.services.raise_andon()
shopfloor.services.close_shift()
shopfloor.services.validate_assigned_scope()
```

---

## 89. Phase 9 APIs

```text
GET /api/v1/shopfloor/home
POST /api/v1/shopfloor/offline-sync
POST /api/v1/shopfloor/handover
GET /api/v1/shopfloor/handover/pending
POST /api/v1/shopfloor/handover/{id}/accept
POST /api/v1/shopfloor/handover/{id}/reject
POST /api/v1/shopfloor/andon
POST /api/v1/shopfloor/shift-closure
```

Mobile also uses:

```text
POST /api/v1/sewing/output
POST /api/v1/wash/batches/{id}/events
POST /api/v1/qc/inspections
POST /api/v1/wip/{id}/hold
```

---

## 90. Phase 9 Business Rules

```text
shopfloor users act only on assigned scope
offline events must be idempotent
server validates offline events again
original timestamp preserved
handover may require receiver acceptance
shift closure warns on missing output/open downtime/pending handover
```

---

## 91. Phase 9 Tests

Required tests:

```text
shopfloor home returns assigned tasks
line supervisor cannot act on other line
offline sync success/conflict/failure
duplicate clientEventId does not duplicate output
handover submit/accept moves WIP
shift closure validation
andon issue creates exception if critical
```

---

## 92. Phase 9 Exit Criteria

Complete when:

```text
mobile app can get assigned tasks
sewing/wash/QC events can be submitted
offline sync is safe
handover and shift closure work
shopfloor scope security works
```

---

# Phase 10: Integrations and Import Framework

---

## 93. Phase 10 Objective

Build the integration layer for Excel, ERP, FastReact, HR, shipment, and opening WIP imports.

---

## 94. Phase 10 Apps

```text
integrations
```

---

## 95. Phase 10 Models

```text
IntegrationSource
IntegrationRun
ImportBatch
ImportStagingRow
ImportRowError
ExportJob
```

---

## 96. Phase 10 Services

```text
integrations.services.upload_import()
integrations.services.validate_import_batch()
integrations.services.apply_import_batch()
integrations.services.generate_error_report()
integrations.services.run_integration()
integrations.services.detect_stale_sources()
integrations.services.export_data()
```

---

## 97. Phase 10 APIs

```text
GET /api/v1/integrations/status
POST /api/v1/integrations/{sourceCode}/run
GET /api/v1/integrations/runs/{runId}
POST /api/v1/imports/{importType}
GET /api/v1/imports/{batchId}
POST /api/v1/imports/{batchId}/apply
GET /api/v1/imports/{batchId}/errors
POST /api/v1/exports/{exportType}
```

---

## 98. Phase 10 Import Types

Prioritize:

```text
orders
styles
BOM
operation_bulletins
wash_routes
line_master
machine_master
opening_wip
material_pos
fabric_qc
shipment_status
fastreact_plan, if required
```

---

## 99. Phase 10 Business Rules

```text
all imports dry-run first
apply requires permission
critical imports all-or-nothing
operation bulletin imports as draft
opening WIP import audited
stale integrations create exceptions
duplicate imports idempotent
```

---

## 100. Phase 10 Tests

Required tests:

```text
valid import validates
invalid import returns row errors
apply creates/updates records
apply requires permission
import audit created
opening WIP import creates WIP records
FastReact plan import creates draft plan
stale integration creates exception
```

---

## 101. Phase 10 Exit Criteria

Complete when:

```text
core imports work
integration status visible
import errors visible
opening WIP migration controlled
integration audit works
```

---

# Phase 11: Analytics, Snapshots, and Reporting APIs

---

## 102. Phase 11 Objective

Build analytics snapshots and reporting APIs for management and operational dashboards.

---

## 103. Phase 11 Apps

```text
analytics
```

---

## 104. Phase 11 Models

```text
DailyOrderStatusSnapshot
DailyWorkcenterLoadSnapshot
DailyLineEfficiencySnapshot
DailyWIPPipelineSnapshot
DailyExceptionSnapshot
DailyShipmentReadinessSnapshot
DailyWashSnapshot
DailyQualitySnapshot
DailyRecoveryActionSnapshot
DailyMasterDataReadinessSnapshot
```

---

## 105. Phase 11 Services

```text
analytics.services.snapshot_orders()
analytics.services.snapshot_workcenters()
analytics.services.snapshot_line_efficiency()
analytics.services.snapshot_wip()
analytics.services.snapshot_exceptions()
analytics.services.snapshot_shipments()
analytics.services.calculate_otif()
analytics.services.calculate_cost_protected_otif()
analytics.services.calculate_utilization()
analytics.services.calculate_line_efficiency()
analytics.services.calculate_wash_metrics()
```

---

## 106. Phase 11 APIs

```text
GET /api/v1/analytics/executive
GET /api/v1/analytics/otif
GET /api/v1/analytics/utilization
GET /api/v1/analytics/workcenter-constraints
GET /api/v1/analytics/line-efficiency
GET /api/v1/analytics/operation-bulletin-performance
GET /api/v1/analytics/wash
GET /api/v1/analytics/wip
GET /api/v1/analytics/quality
GET /api/v1/analytics/exceptions
GET /api/v1/analytics/recovery
GET /api/v1/analytics/shipment
GET /api/v1/analytics/planning-adherence
GET /api/v1/analytics/master-data-readiness
```

---

## 107. Phase 11 Celery Jobs

```text
daily_order_status_snapshot
daily_workcenter_load_snapshot
daily_line_efficiency_snapshot
daily_wip_pipeline_snapshot
daily_exception_snapshot
daily_shipment_snapshot
daily_wash_snapshot
daily_quality_snapshot
daily_recovery_snapshot
```

---

## 108. Phase 11 Business Rules

```text
OTIF must separate normal and recovery-protected OTIF
line efficiency uses net-good output
utilization and efficiency are separate metrics
snapshots are idempotent
analytics APIs respect permissions
drilldown counts match summary counts
```

---

## 109. Phase 11 Tests

Required tests:

```text
OTIF calculation
cost-protected OTIF calculation
utilization calculation
line efficiency calculation
rewash rate calculation
WIP ageing aggregation
snapshot idempotency
analytics filter correctness
```

---

## 110. Phase 11 Exit Criteria

Complete when:

```text
executive analytics available
OTIF/cost-protected OTIF available
WIP/wash/line/exception analytics available
snapshots run successfully
analytics permissions enforced
```

---

# Phase 12: Audit Hardening, Performance, and Production Readiness

---

## 111. Phase 12 Objective

Harden the backend for reliable staging/production deployment.

---

## 112. Phase 12 Work Areas

```text
audit completeness
permission coverage
query performance
database indexes
Celery monitoring
backup/restore scripts
seed validation
OpenAPI documentation
regression test suite
deployment smoke tests
```

---

## 113. Phase 12 Tasks

```text
review all critical state transitions for audit
review all write APIs for permission checks
add missing indexes
optimize heavy selectors
add pagination to all list APIs
add OpenAPI schema generation
add import/export logs
add health checks for DB/Redis/Celery
add backup commands
add seed validation command
add smoke test command
```

---

## 114. Phase 12 Performance Targets

Initial targets:

```text
common list APIs < 2 seconds for typical filters
dashboard APIs < 3–5 seconds for typical filters
critical write APIs < 3 seconds unless async
snapshot jobs complete within configured window
imports handle expected file sizes
```

---

## 115. Phase 12 Tests

Required tests:

```text
all critical regression tests pass
permission matrix tests pass
audit tests pass
API schema generation works
migration check passes
seed validation passes
staging smoke tests pass
backup/restore tested
```

---

## 116. Phase 12 Exit Criteria

Complete when:

```text
backend is deployable to staging
seed data validates
critical E2E backend flows pass
OpenAPI available
monitoring hooks exist
backup/restore runbook tested
```

---

# Part B: Cross-Phase Implementation Standards

---

## 117. API Standards

All APIs should follow:

```text
/api/v1/<domain>/<resource>
```

Action endpoints should be explicit:

```text
POST /api/v1/orders/{id}/release-to-cutting
POST /api/v1/planning/weekly/{id}/freeze
POST /api/v1/wash/batches/{id}/rewash
POST /api/v1/exceptions/{id}/close
```

Avoid:

```text
PATCH status directly for critical workflows
```

---

## 118. Error Standards

Use structured errors:

```json
{
  "code": "PCD_NOT_READY",
  "message": "Order cannot be released to cutting because PCD readiness is blocked.",
  "field": null,
  "details": {
    "blockingItems": ["FABRIC_QC"]
  }
}
```

---

## 119. Enum Governance

Enums should be centralized where practical.

Examples:

```text
RiskStatus
LifecycleStage
WIPStage
WIPStatus
ExceptionSeverity
ExceptionStatus
ShipmentReadinessStatus
WashBatchStatus
```

Do not allow random free-text statuses.

---

## 120. Audit Coverage Checklist

Every critical service should answer:

```text
Does this action need audit?
What old value is captured?
What new value is captured?
Who performed it?
Why?
What linked order/entity?
Is correlation ID set?
```

---

## 121. Permission Coverage Checklist

Every write API should answer:

```text
What permission is required?
Is factory/department/line scope checked?
Can inactive user perform action?
Can shopfloor user act outside assignment?
Is frontend availableAction backed by backend validation?
```

---

## 122. Transaction Coverage Checklist

Use transactions for:

```text
WIP movement
release creation
wash rewash
QC hold release
shipment ready
import apply
plan freeze
plan change apply
```

---

## 123. Idempotency Checklist

Required for:

```text
mobile shopfloor submissions
offline sync
import apply
external integration retries
sewing output submission
wash event submission
handover submission
```

---

# Part C: Build Chunking for AI Coding Agent

---

## 124. Chunk Size Guidance

Each build chunk should be small enough to:

```text
implement
test
review
commit
```

Avoid large vague prompts like:

```text
build planning module
```

Prefer:

```text
create WorkcenterCapacityDay model, admin, migration, seed data, and tests
```

---

## 125. Standard Chunk Template

Each coding chunk should state:

```text
Context
Files to read
Goal
Models/services/APIs to create
Business rules
Tests to add
Validation commands
Do not change
Expected output
```

---

## 126. Example Chunk: PCD Readiness Calculation

```text
Goal:
Implement PCD readiness calculation service.

Files to read:
- apps/pcd_readiness/models.py
- apps/fabric_qc/models.py
- apps/materials_procurement/models.py
- docs/04_Planning_Logic_Calculation_Flows.md
- docs/07_Event_State_Transition_Specification.md

Tasks:
1. Create calculate_readiness(order) service.
2. Evaluate mandatory checklist items.
3. Return READY/BLOCKED/ESCALATED/CONDITIONALLY_READY.
4. Write unit tests.

Do not:
- Add frontend code.
- Directly update unrelated models.
```

---

## 127. Example Chunk: WIP Movement

```text
Goal:
Implement WIP movement service with quantity validation and audit.

Tasks:
1. Create move_wip service.
2. Validate source available qty.
3. Validate stage transition.
4. Block HELD WIP.
5. Create WIPMovement.
6. Update source/target WIP.
7. Write audit event.
8. Add tests.
```

---

# Part D: Backend Test Progression

---

## 128. Tests Required by Phase

| Phase | Minimum Test Coverage |
|---|---|
| Phase 0 | health, DB, Celery |
| Phase 1 | RBAC, scope, audit |
| Phase 2 | master validation, bulletin, wash route |
| Phase 3 | PCD, fabric QC, release-to-cutting |
| Phase 4 | planning, capacity, release |
| Phase 5 | WIP movement, reconciliation |
| Phase 6 | sewing output, line efficiency |
| Phase 7 | wash batch, rewash |
| Phase 8 | exceptions, shipment readiness |
| Phase 9 | shopfloor sync, handover |
| Phase 10 | imports/integrations |
| Phase 11 | analytics snapshots |
| Phase 12 | regression, performance smoke |

---

## 129. Validation Commands

Recommended commands:

```text
python manage.py check
python manage.py makemigrations --check --dry-run
pytest
pytest apps/pcd_readiness/tests
pytest apps/wip_inventory/tests
pytest apps/washing/tests
python manage.py seed_demo_all
python manage.py validate_seed_scenarios
```

---

# Part E: Dependency Map

---

## 130. Critical Dependencies

```text
Planning depends on orders, style technical, workcenters.
Daily release depends on PCD, planning, WIP, QC.
WIP depends on orders and production stages.
Sewing depends on operation bulletin, line, release, WIP.
Wash depends on wash route, WIP, QC.
Shipment readiness depends on WIP, QC, packing, documents.
Analytics depends on all operational modules.
```

---

## 131. Do Not Build Too Early

Avoid building too early:

```text
advanced analytics before base events exist
full mobile offline before basic shopfloor APIs exist
complex optimizer before capacity and WIP truth exist
bidirectional ERP integration before source-of-truth settled
operation-level live tracking before line-level output is stable
```

---

# Part F: Go-Live Backend Readiness

---

## 132. Backend Go-Live Minimum

For first controlled pilot, backend should have:

```text
identity/RBAC
orders
style technical readiness
PCD readiness
planning
daily release
WIP pipeline
sewing output
wash execution
exceptions
shipment readiness
basic analytics
audit
seed/import support
```

---

## 133. Pilot Backend Cut Scope

If scope must be reduced, do not cut:

```text
RBAC
audit
PCD gate
WIP movement
sewing output
wash rewash
exception ownership
shipment readiness gate
```

Better cut:

```text
advanced analytics
advanced line balance
full FastReact integration
complex QR scanning
advanced object storage
```

---

## 134. Backend No-Go Conditions

Do not pilot if:

```text
WIP quantity can go negative
shipment ready can bypass AQL/doc gates
users can act outside scope
critical actions lack audit
daily release can bypass PCD silently
rewash does not affect WIP/capacity
imports can overwrite live WIP uncontrolled
```

---

# Part G: Open Decisions

---

## 135. Decisions Required

Before backend build begins, confirm:

1. Should custom Django user be used or Django default User + UserProfile?
2. Which modules are mandatory for pilot?
3. Are operation bulletins available at go-live?
4. Is WIP tracked order-level or order × size/color in MVP?
5. Should shopfloor output be hourly or shift-wise in MVP?
6. Is post-wash QC inside platform from MVP?
7. Which integrations are mandatory for first pilot?
8. Will dispatch confirmation come from ERP or platform capture?
9. What is the official analytics day close time?
10. Should approvals be generic engine from early phase or module-specific first?
11. Is object storage required for attachments in MVP?
12. Should OpenAPI generation be mandatory from Phase 1?

---

## 136. Non-Negotiable Backend Rules

```text
1. Critical statuses must change through services, not direct field patches.
2. Backend must own business calculations.
3. Every write API must enforce permission and scope.
4. Critical state changes must write audit events.
5. WIP movement must preserve quantity integrity.
6. Rewash must update WIP, capacity, and shipment risk.
7. Shipment ready must be gate-controlled.
8. Imports must support dry-run validation.
9. Celery jobs must be idempotent where practical.
10. Tests must cover critical business logic before phase exit.
```

---

## 137. Summary

This document defines the phase-wise backend build plan for the Eratex Planning & Scheduling Platform.

The recommended backend build sequence is:

```text
foundation
→ master data
→ orders and readiness
→ planning and release
→ WIP
→ sewing
→ wash
→ quality/exceptions/shipment
→ shopfloor
→ integrations
→ analytics
→ hardening
```

The backend must become the governed operational spine of the platform.

The most important implementation principle is:

```text
Build controlled business actions first, then expose them through APIs, then connect frontend workbenches and shopfloor capture.
```

This ensures the system does not become another loose data-entry application, but a reliable production planning and execution control layer for Eratex.
