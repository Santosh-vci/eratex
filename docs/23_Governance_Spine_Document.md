# 23. Governance Spine Document  
# Eratex End-to-End Planning & Scheduling Platform

**Company:** Eratex  
**Product:** Planning & Scheduling Tool for Denim Bottoms + Chinos Manufacturing  
**Document Type:** Governance Spine Document  
**Version:** 2.0  
**Date:** 2026-05-26  
**Backend Stack:** Django + Django REST Framework + PostgreSQL + Redis + Celery  
**Frontend Stack:** Next.js / React + TypeScript + PWA  
**Deployment Baseline:** Dockerized stack  

**Related Specification Pack:**  
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
- 13 Frontend Implementation Specification  
- 14 Analytics and Reporting Specification  
- 15 Integration Specification  
- 16 Security, Roles, and Permissions Specification  
- 17 Audit, Compliance, and Traceability Specification  
- 18 Deployment and DevOps Specification  
- 19 Testing and QA Strategy  
- 20 Seed Data and Simulation Scenarios  
- 21 Phase-wise Backend Build Plan  
- 22 Phase-wise Frontend Build Plan  

---

## 1. Purpose

This document is the governance spine for the Eratex Planning & Scheduling Platform.

It defines the non-negotiable rules that must govern design, build, extension, testing, deployment, and future change.

The purpose is to prevent the system from becoming:

```text
another loose planning screen
another disconnected Excel replacement
another generic ERP CRUD layer
another tool where users still depend on manual follow-up
```

The product must instead become a governed operating system for garment production planning and execution.

---

## 2. Governance Thesis

The platform should be governed by one central operating principle:

```text
The system must convert confirmed demand into controlled production execution with live WIP truth, governed releases, exception ownership, recovery control, and shipment readiness discipline.
```

Every module must support this operating loop:

```text
Order
→ Readiness
→ Plan
→ Release
→ Execute
→ Capture Actuals
→ Update WIP
→ Detect Exception
→ Recover
→ Ship
→ Analyze
→ Improve
```

Any feature that does not strengthen this loop should be challenged.

---

## 3. Why Governance Is Required

Eratex-scale garment manufacturing has operational complexity across:

```text
customer approvals
sample cycles
nominated vendor procurement
20–30 day material lead times
fabric QC before PCD
cutting
sewing
line balancing
wash and rewash
dry and wet processes
finishing
packing
shipment readiness
```

A planning tool can fail if:

```text
data is stale
WIP is not trusted
capacity assumptions are manual
wash is under-modeled
exceptions are not owned
shopfloor actuals are late
roles can bypass controls
analytics hides firefighting behind high OTIF
```

Governance ensures that every build decision reinforces operational truth.

---

## 4. Scope of Governance

This governance spine applies to:

```text
backend models
backend services
APIs
state transitions
frontend screens
mobile/PWA capture
permissions
audit
integrations
analytics
deployment
testing
seed data
future enhancements
```

It applies to:

```text
developers
frontend engineers
backend engineers
QA
product owners
implementation consultants
AI coding agents
business admins
deployment owners
```

---

# Part A: Product Governance

---

## 5. Product Identity

This product is:

```text
a garment manufacturing planning and scheduling operating layer
```

It is not merely:

```text
a reporting dashboard
a generic ERP
a sewing line tracker
a WIP register
a wash board
an Excel upload utility
```

It must integrate all of those capabilities into one operating model.

---

## 6. MVP Product Boundary

The MVP must focus on the ten critical surfaces already defined:

```text
1. Order Lifecycle and Risk Surface
2. PCD Readiness and Release Gate Surface
3. Weekly/Monthly Planning Workbench
4. Daily Production Release Surface
5. Workcenter Load and Constraint Monitor
6. Sewing Line Loading and Output Surface
7. Wash Planning and Rewash Control Surface
8. WIP Pipeline and Reconciliation Surface
9. Exception, Alert, and Recovery Surface
10. Shipment Readiness Surface
```

Additional surfaces are important for maturity, but MVP must not lose focus.

---

## 7. Mature-State Product Boundary

The mature product may include:

```text
operation bulletin management
line routing
line realignment
line balance
handheld shopfloor capture
advanced analytics
integration monitoring
audit search
approval inbox
seed simulation tools
advanced mobile offline sync
QR/barcode scanning
```

Mature features should not weaken MVP governance.

---

## 8. Product Decision Rule

Before adding any feature, ask:

```text
Does this improve order readiness, planning quality, WIP truth, capacity control, exception recovery, shipment readiness, or analytics learning?
```

If not, the feature should be deferred or redesigned.

---

# Part B: Architecture Governance

---

## 9. Architecture Principle

The architecture must preserve separation of responsibilities:

```text
PostgreSQL = system of record
Django services = business rule authority
DRF APIs = controlled action interface
React/Next.js = operational workbench
Celery = background intelligence
Audit = traceability layer
```

---

## 10. Backend Authority

Backend owns:

```text
business calculations
state transitions
permission enforcement
audit creation
risk calculation
readiness calculation
capacity calculation
WIP reconciliation
shipment readiness
exception severity
analytics KPIs
```

Frontend may display and preview, but backend is the final authority.

---

## 11. Frontend Authority

Frontend owns:

```text
interaction design
workbench layout
filtering UI
drawer behavior
local mobile/offline queue
visual status display
confirmation flows
```

Frontend must not redefine official business logic.

---

## 12. Database Authority

Database stores:

```text
approved master data
orders
plans
releases
WIP
movements
quality records
wash batches
exceptions
recovery actions
shipment readiness
audit
snapshots
```

Database should not be bypassed through uncontrolled spreadsheets after go-live.

---

## 13. Celery Authority

Celery owns scheduled/background operations such as:

```text
exception scans
WIP ageing recalculation
data freshness checks
integration syncs
analytics snapshots
export generation
notification digests
```

Celery jobs must be idempotent where practical.

---

## 14. Architecture Anti-Patterns

Avoid:

```text
business logic inside frontend only
critical status updates by generic PATCH
silent WIP overwrites from Excel
uncontrolled direct database edits
multiple definitions of OTIF
multiple definitions of WIP stages
free-text statuses
unversioned approved master data
```

---

# Part C: Domain Governance

---

## 15. Order Governance

An order must have a controlled lifecycle.

Minimum lifecycle:

```text
ENQUIRY / CONFIRMED
→ TECHNICAL_READY
→ PCD_READY
→ RELEASED_TO_CUTTING
→ IN_PRODUCTION
→ WASH
→ FINISHING_PACKING
→ SHIPMENT_READY
→ DISPATCHED
```

Rules:

```text
order quantity must not be changed below produced/shipped quantity
style change after planning must require approval
shipment date changes must update risk
order cancellation must close or reverse dependent work safely
```

---

## 16. PCD Governance

PCD readiness is a release gate, not an informational checklist.

Rules:

```text
cutting release is blocked unless PCD is READY or valid CONDITIONAL
fabric QC failure blocks PCD
mandatory checklist items cannot be bypassed silently
conditional release requires approval, reason, and expiry
expired conditional release cannot be reused
```

---

## 17. Planning Governance

Planning must be versioned and controlled.

Rules:

```text
weekly/monthly plan can be edited before freeze
frozen plan cannot be changed directly
changes after freeze require change request
capacity impact must be visible before approval
plan changes must be audited
```

---

## 18. Daily Release Governance

Daily release must validate real readiness.

Release validation must check:

```text
PCD readiness
available WIP/input
QC holds
capacity/load
line/workcenter availability
material blockers
shipment risk
```

Blocked release override requires approval.

---

## 19. Workcenter Governance

Every workcenter must have:

```text
capacity calendar
planned load
actual load
queue/WIP visibility
constraint status
owner
```

Constraint logic should consider:

```text
utilization
queue ageing
shipment-risk WIP
exception count
throughput shortfall
```

---

## 20. Sewing Governance

Sewing output must distinguish:

```text
gross output
defect quantity
rework quantity
net-good output
```

Rules:

```text
line efficiency uses net-good output
output must link to order and line
active release required for output capture
line shortfall should trigger exception
operation bulletin should drive SMV
```

---

## 21. Operation Bulletin Governance

Operation bulletin is the official technical routing and SMV source.

Rules:

```text
line loading requires approved operation bulletin or approved exception
approved bulletin is immutable
changes require clone/new version
active orders retain bulletin version used for planning
SMV must come from operation bulletin
```

---

## 22. Line Realignment Governance

Line realignment must be controlled.

Approval required when:

```text
machine movement required
operator movement required
target output changes
critical operation split changes
skill gap mitigation required
```

Realignment must show expected output before/after.

---

## 23. Wash Governance

Wash is a production constraint and must be modeled as such.

Rules:

```text
no wash batch without approved wash route
wash batch quantity cannot exceed available WIP
shade lot must be preserved
post-wash QC gates release to finishing
rewash consumes wash capacity
rewash updates WIP and shipment risk
multiple rewash cycles must be traceable
```

---

## 24. WIP Governance

WIP is the operational truth layer.

Rules:

```text
WIP must be order-linked
WIP must be stage-wise
WIP movement must preserve quantity integrity
held WIP cannot move without release/waiver
manual adjustment requires permission and audit
rework WIP must be visible separately
WIP ageing thresholds must be stage-specific
```

---

## 25. Quality Governance

Quality holds must govern movement.

Rules:

```text
QC hold blocks relevant movement/release
QC hold release requires authorized user
critical QC waiver requires reason and audit
AQL must gate shipment readiness where applicable
defects must be linked to stage/order/workcenter
```

---

## 26. Exception Governance

Exceptions must be owned actions, not passive alerts.

Rules:

```text
RED/BLACK exceptions require owner and due date
duplicates must be deduplicated
overdue exceptions must escalate
closure requires note
critical closure requires permission
shipment-impacting exceptions must be highlighted
```

---

## 27. Recovery Governance

Recovery actions must be linked to exceptions.

Rules:

```text
recovery action must have owner
impact preview should be shown where practical
approval required for cost/risk actions
completion must capture actual impact
recovery-protected OTIF must be visible
```

---

## 28. Shipment Governance

Shipment readiness is a gate.

Rules:

```text
shipment ready cannot be marked if mandatory checklist is incomplete
packed quantity short must block or require split approval
AQL pending blocks readiness
documentation pending blocks readiness
shipment ready marking must be audited
dispatch confirmation feeds OTIF
```

---

# Part D: Data Governance

---

## 29. Source-of-Truth Governance

Every data object must have a defined source of truth.

Examples:

```text
orders may come from ERP/import
planning platform owns weekly plan
planning platform owns daily release
shopfloor capture owns actual output
planning platform owns WIP after go-live
ERP/shipment may own dispatch confirmation
```

No domain should have two uncontrolled masters.

---

## 30. Master Data Governance

Approved master data must be governed.

Version-controlled masters:

```text
BOM
operation bulletin
wash route
line balance plan
planning thresholds
```

Rules:

```text
approved version cannot be edited directly
new version requires approval
active production must reference specific version
obsolete versions remain historically visible
```

---

## 31. Enum Governance

Statuses must use controlled enums.

Examples:

```text
WIPStage
WIPStatus
OrderStage
PCDStatus
ReleaseStatus
ExceptionSeverity
ExceptionStatus
WashBatchStatus
ShipmentReadinessStatus
ApprovalStatus
```

Avoid free-text status fields.

---

## 32. Quantity Governance

Quantity fields must preserve physical integrity.

Rules:

```text
no negative WIP
movement quantity cannot exceed available source quantity
shipment-ready cannot exceed packed quantity
dispatch cannot exceed shipment-ready quantity
packed cannot exceed finished net-good quantity
sewn-to-wash cannot exceed sewn net-good quantity
```

---

## 33. Time Governance

Time must be explicit.

Rules:

```text
store timestamps with timezone awareness
shopfloor offline events preserve original timestamp
analytics snapshots use configured operational day close
date filters must be clear and consistent
```

---

## 34. Data Freshness Governance

Stale data is an operational risk.

Create alerts/exceptions when:

```text
active line has no output update beyond threshold
integration sync is stale
offline events remain unsynced beyond threshold
shipment readiness is not updated near due date
daily snapshot fails
```

---

## 35. Data Import Governance

Imports must follow:

```text
upload
→ dry-run validation
→ error report
→ approval
→ apply
→ audit
```

Rules:

```text
no blind overwrite
critical imports should be all-or-nothing
opening WIP is controlled one-time import
operation bulletin import creates draft, not approved, unless explicitly authorized
```

---

# Part E: API Governance

---

## 36. API Pattern Governance

Use explicit action APIs for critical operations.

Good:

```text
POST /api/v1/orders/{id}/release-to-cutting
POST /api/v1/planning/weekly/{id}/freeze
POST /api/v1/wash/batches/{id}/rewash
POST /api/v1/exceptions/{id}/close
POST /api/v1/shipments/{id}/mark-ready
```

Avoid:

```text
PATCH /api/v1/orders/{id} {"status": "RELEASED"}
```

---

## 37. API Response Governance

All APIs must use standard response envelope:

```json
{
  "data": {},
  "meta": {},
  "errors": []
}
```

Errors must be structured:

```json
{
  "code": "PCD_NOT_READY",
  "message": "Order cannot be released because PCD readiness is blocked.",
  "field": null,
  "details": {}
}
```

---

## 38. API Permission Governance

Every write API must check:

```text
authentication
active user
permission action
scope
state validity
```

Every read API must apply user scope.

---

## 39. API Idempotency Governance

Required for:

```text
shopfloor mobile events
offline sync
integration retries
import apply
sewing output submission
wash event submission
handover submission
```

Use:

```text
clientEventId
deviceId
userId
externalRecordId
importBatchId
```

as applicable.

---

## 40. API Documentation Governance

OpenAPI must be generated and maintained.

Rules:

```text
new endpoint must be documented
request/response schema must be typed
enum values must be documented
action endpoints must define permission
```

---

# Part F: Frontend Governance

---

## 41. Frontend Screen Governance

Every operational screen must expose:

```text
status
risk
blocker
owner
next action
last updated
```

Screens should not be passive tables.

---

## 42. Workbench Governance

Dense workbenches should use:

```text
header KPI cards
filter bar
main grid/board
right drawer
action panel
exception panel
audit access
```

---

## 43. Drawer Governance

Use drawers to preserve context.

Drawer should show:

```text
summary
state
risk
blockers
timeline
actions
audit
linked entities
```

---

## 44. Disabled Action Governance

If action is blocked, show why.

Example:

```text
Release to Cutting disabled: Fabric QC is pending.
```

Do not hide important blocked actions if users need to understand why they cannot proceed.

---

## 45. Mobile Governance

Shopfloor mobile UI must be:

```text
task-first
large-touch
minimal typing
offline-safe
role-scoped
sync-visible
```

Mobile events must never silently disappear.

---

## 46. Frontend Calculation Governance

Frontend may calculate local display helpers such as:

```text
form subtotal
net-good preview before submit
UI progress percentage if supplied values are backend-owned
```

Frontend must not own official calculations such as:

```text
PCD readiness
capacity status
WIP ageing
shipment readiness
exception severity
analytics KPIs
```

---

# Part G: Security and Permission Governance

---

## 47. Role Governance

Roles must be mapped to operational responsibilities.

Recommended role families:

```text
system/admin
management
planning
production
quality
procurement
shipment
technical/IE
shopfloor
integration
audit
```

---

## 48. Permission Governance

Permissions must be action-level.

Examples:

```text
pcd.approve_conditional_release
planning.freeze_weekly_plan
wip.adjust
wash.approve_rewash
shipment.mark_ready
exception.close_critical
integration.approve_import
```

Module-level access alone is insufficient.

---

## 49. Scope Governance

User action must respect scope:

```text
factory
department
workcenter
line
customer, if configured
```

Examples:

```text
line supervisor cannot submit output for another line
wash supervisor cannot act on non-assigned workcenter
factory user cannot edit another factory
```

---

## 50. Superuser Governance

Django superuser accounts must not be used for routine business operations.

Use business roles instead.

---

## 51. Critical Action Governance

Critical actions require explicit permission and audit.

Examples:

```text
WIP adjustment
QC hold release
shipment ready
release override
plan freeze
import apply
critical exception closure
```

---

# Part H: Audit and Traceability Governance

---

## 52. Audit Governance Principle

No critical state change without audit.

Audit must capture:

```text
who
what
when
why
old value
new value
source
device, where applicable
correlation ID
```

---

## 53. Mandatory Audit Actions

Audit required for:

```text
PCD conditional release
release to cutting
weekly plan freeze
plan change approval
blocked release override
operation bulletin approval
line realignment approval
wash rewash
QC hold release
WIP adjustment
shipment ready
critical exception closure
import apply
role/permission change
master data approval
```

---

## 54. Traceability Governance

The system must support traceability for:

```text
order
WIP
wash batch
exception
recovery action
shipment
import batch
master data version
```

Order trace must show end-to-end lifecycle.

---

## 55. Evidence Governance

Evidence may include:

```text
QC images
fabric inspection files
shipment documents
import files
exception closure notes
approval references
```

Rules:

```text
evidence must link to entity
evidence visibility must be permission-controlled
deleted/replaced evidence must be audited
```

---

# Part I: Analytics Governance

---

## 56. KPI Governance

Official KPI formulas must be documented and backend-owned.

Core KPIs:

```text
OTIF
cost-protected OTIF
resource utilization
net-good efficiency
line efficiency
wash rewash rate
WIP ageing
exception SLA adherence
shipment readiness
planning adherence
```

---

## 57. OTIF Governance

OTIF must distinguish:

```text
normal OTIF
cost-protected OTIF
late
short
```

High OTIF must not hide firefighting.

---

## 58. Efficiency Governance

Efficiency must use:

```text
net-good output
```

not only gross output.

---

## 59. Utilization Governance

Utilization and efficiency are different and must be reported separately.

```text
utilization = capacity loaded/used
efficiency = good output from available productive time
```

---

## 60. Snapshot Governance

Analytics snapshots must be:

```text
idempotent
time-stamped
filterable
reproducible
traceable to source period
```

---

# Part J: Integration Governance

---

## 61. Integration Ownership

Every integration must define:

```text
source system
direction
frequency
owner
data domain
error handling
stale threshold
```

---

## 62. FastReact Governance

If FastReact data is used:

```text
import as external plan input
validate against platform capacity/risk rules
convert into platform plan version
do not blindly treat as frozen truth
```

The platform must own execution, WIP, exceptions, and recovery after adoption.

---

## 63. Excel Governance

Excel may be used for:

```text
initial import
controlled data migration
temporary transition uploads
```

Excel must not remain the uncontrolled operating source after go-live.

---

## 64. Integration Failure Governance

Integration failures must be visible through:

```text
integration run status
error report
stale data alert
system exception if critical
```

---

# Part K: Testing Governance

---

## 65. Test Governance Principle

Testing must prove operational behavior, not just screen rendering.

Critical tests must cover:

```text
business calculations
state transitions
permissions
WIP integrity
wash rework
shipment readiness
audit
integration validation
analytics formulas
```

---

## 66. Required Automated Tests

Every critical module must include:

```text
unit tests
service tests
API tests
permission tests
audit tests
```

Critical flows must have E2E tests.

---

## 67. No-Go Test Conditions

Do not release if:

```text
WIP can become negative
shipment ready can bypass gates
users can act outside scope
critical actions lack audit
rewash does not affect capacity/WIP
imports can overwrite live data uncontrolled
```

---

## 68. Seed Data Governance

Seed data must be:

```text
scenario-based
idempotent
role-aware
date-relative
validation-checked
```

Seed data must support the MVP surfaces and exception cases.

---

# Part L: Deployment and DevOps Governance

---

## 69. Environment Governance

Required environments:

```text
local
development
staging
production
```

Production must not use development settings.

---

## 70. Secrets Governance

Rules:

```text
no secrets committed to repo
environment variables for config
restricted access to production .env
rotate credentials if exposed
```

---

## 71. Migration Governance

Before production migration:

```text
backup database
test migration in staging
review destructive changes
prepare rollback/forward-fix plan
```

---

## 72. Backup Governance

Production must have:

```text
automated database backup
media backup if attachments used
restore test before go-live
backup monitoring
```

---

## 73. Release Governance

Production release requires:

```text
CI pass
staging deployment
UAT/sign-off where required
backup
migration review
release notes
rollback plan
smoke tests
monitoring
```

---

## 74. Monitoring Governance

Monitor:

```text
API health
database health
Redis health
Celery workers
Celery beat
snapshot jobs
integration jobs
backup jobs
error rate
disk usage
```

---

# Part M: Change Governance

---

## 75. Change Request Rule

Any change to core rules must update the relevant specification.

Examples:

```text
changing OTIF formula
changing PCD release gate
adding WIP stage
changing wash rewash logic
changing permission matrix
changing shipment readiness checklist
```

---

## 76. Change Impact Checklist

Before changing any module, assess impact on:

```text
data model
services
APIs
frontend screens
permissions
audit
analytics
integrations
tests
seed data
documentation
```

---

## 77. Versioning Rule

Version-controlled artifacts include:

```text
BOM
operation bulletin
wash route
line balance plan
planning thresholds
API contracts
specification documents
```

---

## 78. Documentation Governance

Specification documents must remain aligned with code.

When code changes:

```text
update relevant MD spec
update API contract
update tests
update seed scenarios if needed
```

---

# Part N: AI Coding Agent Governance

---

## 79. Agent Build Rule

AI coding agents must not make broad uncontrolled changes.

Every coding task should define:

```text
files to read
scope
target module
expected output
tests to run
files not to change
```

---

## 80. Agent Chunking Rule

Use small chunks.

Good chunk:

```text
Implement WIP movement service with tests and audit.
```

Bad chunk:

```text
Build the whole WIP module.
```

---

## 81. Agent Validation Rule

Every agent change must include:

```text
tests added/updated
validation command
summary of changed files
known limitations
```

---

## 82. Agent Safety Rule

Agents must not:

```text
remove audit checks
bypass permissions
hardcode business formulas in frontend
silently change enum values
rewrite unrelated modules
weaken validation to pass tests
```

---

# Part O: Review Governance

---

## 83. Pull Request Review Checklist

Every PR should check:

```text
Does this change follow service-layer pattern?
Are permissions enforced?
Are audit events created?
Are state transitions valid?
Are tests included?
Are API contracts updated?
Are frontend types updated?
Are seed scenarios impacted?
Are docs impacted?
```

---

## 84. Business Review Checklist

For workflow changes, business reviewer should confirm:

```text
does this match factory process?
does this prevent unsafe release?
does this preserve WIP truth?
does this expose exceptions early?
does this support recovery action?
does this improve shipment readiness?
```

---

## 85. QA Review Checklist

QA should verify:

```text
happy path
blocked path
permission denied path
audit path
integration/seed data impact
analytics impact
```

---

# Part P: Governance Matrix

---

## 86. Governance Owner Matrix

| Area | Primary Owner | Secondary Owner |
|---|---|---|
| Product scope | Product owner | Business sponsor |
| Backend services | Backend lead | Architect |
| Frontend workbenches | Frontend lead | Product owner |
| WIP logic | Planning/Product owner | Production/WIP owner |
| Wash logic | Wash process owner | Planning owner |
| Quality gates | QC owner | Production owner |
| Shipment readiness | Shipment owner | Planning owner |
| Permissions | Business admin | System admin |
| Audit | Governance owner | System admin |
| Integrations | Integration owner | Data owner |
| Analytics formulas | Product owner | Business owner |
| Deployment | DevOps owner | Backend lead |
| Testing | QA owner | Product owner |

---

# Part Q: Non-Negotiable Governance Rules

---

## 87. System-Wide Non-Negotiables

```text
1. Backend owns official business calculations.
2. Critical state changes must go through service-layer actions.
3. Write APIs must enforce permission and scope.
4. Critical actions must write audit events.
5. WIP movement must preserve quantity integrity.
6. Held WIP cannot move without release or approved waiver.
7. PCD must gate cutting release.
8. Rewash must update WIP, capacity, exceptions, and shipment risk.
9. Shipment readiness must be gate-controlled.
10. Imports must use dry-run validation before apply.
11. Frontend must show blocked action reasons.
12. Mobile offline events must be idempotent and traceable.
13. Analytics must distinguish normal OTIF from cost-protected OTIF.
14. Approved technical masters must be version-controlled.
15. No uncontrolled Excel overwrite after go-live.
```

---

## 88. Backend Non-Negotiables

```text
1. No direct PATCH for critical status changes.
2. No business logic only inside views.
3. No unaudited critical action.
4. No unscoped read/write access.
5. No negative WIP.
6. No shipment-ready beyond packed quantity.
7. No dispatch beyond shipment-ready quantity.
8. No rewash without parent trace.
9. No import apply without permission.
10. No stale integration failure hidden only in logs.
```

---

## 89. Frontend Non-Negotiables

```text
1. Do not calculate official business truth in frontend.
2. Do not hide blocked operational reasons.
3. Do not build dense desktop screens for mobile shopfloor users.
4. Do not lose offline mobile entries.
5. Do not allow critical actions without confirmation.
6. Do not ignore backend availableActions.
7. Do not show gross output as performance truth without net-good.
8. Do not show WIP without status/risk/ageing context.
9. Do not show shipment readiness without blockers.
10. Do not ship screens without loading/error/empty states.
```

---

## 90. QA Non-Negotiables

```text
1. WIP integrity must be tested.
2. Shipment readiness gates must be tested.
3. Permissions must be tested.
4. Audit must be tested.
5. Wash rework must be tested.
6. PCD blocked and conditional release must be tested.
7. Imports must be tested for invalid rows.
8. Offline sync must be tested if included.
9. Analytics formulas must be tested.
10. Critical E2E flows must pass before release.
```

---

# Part R: Open Governance Decisions

---

## 91. Decisions Required

Before build execution, confirm:

1. Who is final product governance owner?
2. Which ten MVP surfaces are absolutely mandatory for pilot?
3. Which roles will exist in pilot?
4. Who approves PCD conditional release?
5. Who approves WIP adjustment?
6. Who approves QC hold release?
7. Who approves split shipment?
8. What is official OTIF measurement grain?
9. What is official operational day close time?
10. What is official WIP tracking grain for MVP?
11. Which integrations are source-of-truth at go-live?
12. Is FastReact replaced, coexisted, or imported from?
13. Which Excel files are allowed only as transition inputs?
14. What audit retention policy is required?
15. What is production deployment ownership?

---

## 92. Governance Review Cadence

Recommended cadence:

```text
weekly build governance review during implementation
phase-end architecture review
phase-end QA review
pre-UAT governance review
pre-production release review
post-go-live stabilization review
```

Each review should check:

```text
scope drift
rule drift
data integrity
permission coverage
audit coverage
test coverage
documentation alignment
```

---

# Part S: Summary

This governance spine defines how the Eratex Planning & Scheduling Platform must be designed, built, extended, tested, deployed, and governed.

The core goal is to create a live operating layer for denim bottoms and chinos garment manufacturing.

The system must govern:

```text
order readiness
PCD release
planning
daily release
capacity
sewing
wash
WIP
quality
exceptions
recovery
shipment
analytics
integrations
audit
```

The most important governance principle is:

```text
The platform must make operational truth visible, make unsafe actions difficult, make exceptions owned, make recovery traceable, and make shipment readiness trustworthy.
```

If this spine is followed, the product will not become another disconnected tool. It will become a governed planning and execution system capable of reducing Excel dependency, improving resource utilization, exposing hidden firefighting, and protecting shipment commitments with discipline.

## Scheduling Behaviour Rulebook Alignment

The governance spine now treats scheduling disruptions as owned, auditable boundary cases. The system recommends and previews first; planners or approvers commit. FastReact and Excel are coexistence inputs only and must pass validation before becoming draft platform plans.

## Phase 5 / EOS-05 Execution Governance

The execution bridge connects planning truth to shopfloor truth without opening later-phase scope:

- Cutting jobs must come from governed production releases.
- Sewing line loading requires approved operation bulletin or approved governed exception.
- Realignment is previewed before request, approved when governed, and then applied with audit.
- Sewing output is captured as gross, defect, rework, and net-good quantity.
- Net-good quantity is the controlled quantity that updates execution WIP and line efficiency.
- Shortfall creates or links to a boundary case until the full exception lifecycle is implemented.

The UI remains prototype-governed from `docs/frontend_ui`. Execution surfaces must map to cutting room management, sewing line loading, line realignment, operation bulletin routing, and sewing output capture prototypes.

## Prototype Parity Governance Gate

The prototype folders under `docs/frontend_ui` are executable UI contracts for any route that maps to them. A route is not ready merely because it renders, passes generic e2e navigation, or has a screenshot.

Before a prototype-backed route may be marked verified:

1. The implementation must preserve the prototype's primary layout, workbench density, action placement, drawer or fixed-panel behavior, and operational copy structure.
2. The e2e test must assert structural landmarks from the prototype: KPI names/count, table columns, row density behavior, detail drawer sections, action labels, and any chart/swimlane/fixed-panel regions.
3. Screenshot evidence must be captured from the running app after those assertions pass.
4. Seed data must exercise the same operating shape as the prototype. Multi-line, multi-order, multi-state workbenches cannot be proven with one happy-path record.
5. API or seed payload gaps must be documented before UI build. Missing fields must not be hidden by substituting cards, generic panels, or invented copy.
6. Readiness notes must distinguish `Backend verified`, `Frontend rendered`, and `Prototype parity verified`; these statuses are not interchangeable.

If any of these checks fail, the surface must be marked `Blocked by prototype drift` and excluded from handoff readiness until corrected.
