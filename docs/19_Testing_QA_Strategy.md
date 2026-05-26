# 19. Testing and QA Strategy  
# Eratex End-to-End Planning & Scheduling Platform

**Company:** Eratex  
**Product:** Planning & Scheduling Tool for Denim Bottoms + Chinos Manufacturing  
**Document Type:** Testing and QA Strategy  
**Version:** 2.0  
**Date:** 2026-05-26  
**Backend Stack:** Django + Django REST Framework + PostgreSQL + Celery + Redis  
**Frontend Stack:** Next.js / React + TypeScript + PWA  
**Deployment Baseline:** Dockerized stack  
**Related Documents:**  
- 01 Technical Architecture Spine  
- 02 Data Model and Table Schema Specification  
- 04 Planning Logic and Calculation Flows  
- 06 API and Data Contracts Specification  
- 07 Event and State Transition Specification  
- 08 WIP Inventory and Reconciliation Specification  
- 10 Wash Planning and Execution Specification  
- 11 Exception, Alert, and Recovery Specification  
- 12 Handheld Shopfloor Capture Technical Specification  
- 13 Frontend Implementation Specification  
- 14 Analytics and Reporting Specification  
- 15 Integration Specification  
- 16 Security, Roles, and Permissions Specification  
- 17 Audit, Compliance, and Traceability Specification  
- 18 Deployment and DevOps Specification  

---

## 1. Purpose

This document defines the testing and QA strategy for the Eratex Planning & Scheduling Platform.

The system will support mission-critical garment manufacturing planning and execution across:

```text
customer order lifecycle
sampling and approval readiness
PCD readiness
material and fabric QC
weekly planning
daily release
line loading
sewing output
wash planning and execution
rewash loops
WIP inventory
quality holds
exceptions and recovery
shipment readiness
analytics
shopfloor handheld capture
integration imports
audit and permissions
```

Testing must therefore validate not only whether screens and APIs work, but whether the operational system behaves reliably under real factory conditions.

---

## 2. QA Thesis

The QA principle is:

```text
Test the business flow, not only the code path.
```

The platform must be tested against the real operational questions:

```text
Can an order move from enquiry/confirmed order to shipment?
Can PCD prevent unsafe cutting release?
Can daily release be blocked and overridden correctly?
Can WIP remain reconciled across departments?
Can wash rework consume capacity and change shipment risk?
Can line shortfall trigger recovery?
Can shopfloor mobile entries update planning reality?
Can users act only within permission and scope?
Can analytics distinguish stable OTIF from recovery-protected OTIF?
```

The QA strategy must protect against a common failure mode:

```text
system appears functional screen-by-screen,
but planning still depends on Excel because end-to-end operational truth is unreliable.
```

---

## 3. Testing Objectives

The testing program must ensure:

```text
1. Business logic is correct.
2. State transitions are controlled.
3. Quantity integrity is preserved.
4. WIP reconciliation works.
5. Planning calculations are reliable.
6. APIs match frontend contracts.
7. Frontend workbenches support real user actions.
8. Handheld capture works under weak network conditions.
9. Permissions prevent unauthorized actions.
10. Audit records are created for critical actions.
11. Integration imports are validated and traceable.
12. Analytics KPIs are formula-correct.
13. Deployment is reproducible.
14. Regression suite protects future changes.
```

---

## 4. Testing Scope

Testing scope includes:

```text
unit testing
service-layer testing
calculation testing
API testing
contract testing
frontend component testing
frontend integration testing
end-to-end testing
mobile/PWA testing
offline sync testing
integration/import testing
security and permission testing
audit testing
analytics KPI testing
performance testing
data migration testing
UAT
regression testing
release smoke testing
```

---

## 5. Testing Pyramid

Recommended test distribution:

```text
many unit/service tests
moderate API/integration tests
focused E2E tests for critical flows
manual UAT for operational acceptance
```

Avoid relying only on browser E2E tests because they are slower and brittle.

---

## 6. Test Environments

### 6.1 Local

Purpose:

```text
developer tests
unit tests
API tests
seed data verification
```

### 6.2 Development

Purpose:

```text
shared QA for active features
integration of multiple modules
```

### 6.3 Staging

Purpose:

```text
production-like UAT
release candidate validation
migration tests
performance smoke tests
```

### 6.4 Production

Purpose:

```text
post-deployment smoke tests only
monitoring
no destructive testing
```

---

# Part A: Backend Testing Strategy

---

## 7. Backend Test Types

Backend testing must include:

```text
model tests
service tests
selector/query tests
serializer tests
API view tests
permission tests
Celery task tests
integration import tests
audit tests
```

---

## 8. Unit Tests

Unit tests should cover deterministic functions and small business rules.

Examples:

```text
line capacity calculation
WIP ageing status
OTIF calculation
rewash rate
exception severity score
PCD readiness aggregation
shipment readiness aggregation
net-good output calculation
```

Unit tests should be fast and run on every CI build.

---

## 9. Service Layer Tests

Business logic should live in services, and services should have strong tests.

Service tests should cover:

```text
release to cutting
freeze weekly plan
create production release
record sewing output
create wash batch
mark rewash required
move WIP
hold/release WIP
close exception
mark shipment ready
apply import batch
```

### 9.1 Service Test Rule

Every critical state transition must have a service test.

---

## 10. Selector / Query Tests

Selectors power dashboards and workbenches.

Test:

```text
order list filters
PCD readiness list
workcenter load summary
wash queue
WIP pipeline
exception control tower
shipment readiness
analytics drilldowns
```

Selectors should return correct filtered and aggregated results.

---

## 11. API Tests

API tests should validate:

```text
status code
response envelope
required fields
permission enforcement
business validation
pagination
filtering
sorting
audit creation
state transition result
```

### 11.1 Standard API Test Assertions

Every important API test should check:

```text
response schema
database state changed correctly
related downstream state updated
audit event created where required
```

---

## 12. Celery Task Tests

Test scheduled/background jobs:

```text
daily snapshots
exception scans
escalation scans
data freshness scans
integration sync
import apply
export generation
```

Tests must ensure jobs are:

```text
idempotent
safe to rerun
visible on failure
```

---

# Part B: Calculation and Business Logic Tests

---

## 13. Planning Calculation Tests

Required tests:

```text
planned load calculation
available capacity calculation
utilization status
constraint status
impact preview
shipment risk change
weekly plan freeze validation
daily release validation
```

Example:

```text
Given wet wash available capacity = 8,000 minutes
And planned load = 10,400 minutes
Then utilization = 130%
And constraint status = CRITICAL_CONSTRAINT
```

---

## 14. PCD Readiness Tests

Required tests:

```text
all mandatory checklist passed → READY
mandatory blocker pending → BLOCKED
blocked close to PCD → ESCALATED
conditional release requires approver/reason/expiry
expired conditional release returns blocked
release to cutting blocked if fabric QC pending
```

---

## 15. WIP Quantity Tests

Required tests:

```text
movement decreases source and increases target
movement cannot exceed available quantity
held WIP cannot move
rework WIP counted separately
WIP ageing calculated by stage threshold
manual adjustment requires permission and audit
```

---

## 16. WIP Reconciliation Tests

Required tests:

```text
issued to sewing cannot exceed cut quantity
sewn output cannot exceed issued quantity beyond tolerance
sent to wash cannot exceed sewn net-good
washed cannot exceed sent-to-wash plus rewash return
finished cannot exceed wash net-good
packed cannot exceed finished net-good
shipment ready cannot exceed packed
dispatched cannot exceed shipment-ready
unexplained loss creates reconciliation exception
```

---

## 17. Wash Logic Tests

Required tests:

```text
wash route cannot be approved without steps
wash batch cannot be created without approved route
batch quantity cannot exceed available sewn WIP
shade lot mix requires approval
step completion advances batch state
rewash creates child/rewash WIP
rewash consumes additional capacity
release to finishing blocked if post-wash QC pending
multiple rewash cycles tracked correctly
```

---

## 18. Sewing and Line Tests

Required tests:

```text
net-good output = gross - defect - rework
line efficiency uses net-good output
required run rate calculated correctly
line shortfall triggers exception
line realignment detects machine gap
line realignment detects skill gap
line balance identifies bottleneck operation
```

---

## 19. Shipment Tests

Required tests:

```text
shipment ready blocked if AQL pending
shipment ready blocked if documents pending
shipment ready blocked if packed qty short unless split approved
split shipment approval audited
dispatch confirmation updates OTIF status
```

---

## 20. Exception and Recovery Tests

Required tests:

```text
duplicate exception prevention
RED/BLACK exception requires owner and due date
exception escalation when overdue
closure requires closure note
critical closure requires permission
recovery action impact preview returns before/after
recovery completion updates linked exception
```

---

## 21. Analytics KPI Tests

Required tests:

```text
OTIF calculation
cost-protected OTIF calculation
resource utilization
net-good efficiency
line efficiency
wash rewash rate
WIP ageing quantity
exception SLA adherence
shipment readiness percentage
plan adherence
```

---

# Part C: API Contract Testing

---

## 22. Contract Test Purpose

Frontend and backend must agree on:

```text
field names
enum values
response envelope
error format
pagination metadata
available actions
date formats
```

Contract drift will break workbench screens.

---

## 23. OpenAPI Contract

Use:

```text
drf-spectacular
```

Generate OpenAPI schema and validate:

```text
all endpoints documented
request/response schemas defined
enum values consistent
critical action APIs present
```

---

## 24. Frontend Type Contract

Frontend TypeScript types should be generated or manually aligned from the API specification.

Test that API fixtures match frontend expected types.

---

## 25. Contract Test Examples

```text
GET /api/v1/orders returns OrderListItem shape
GET /api/v1/wip/pipeline returns summary and stages
POST /api/v1/wash/batches/{id}/rewash returns rewashBatchId and additionalLoadMinutes
POST /api/v1/orders/{id}/mark-shipment-ready returns blocked reason if validation fails
```

---

# Part D: Frontend Testing Strategy

---

## 26. Frontend Test Types

Frontend tests should include:

```text
component tests
hook tests
form validation tests
integration tests
E2E tests
visual regression checks for critical screens
mobile viewport tests
offline behavior tests
```

---

## 27. Component Tests

Test reusable components:

```text
RiskBadge
StatusBadge
SeverityBadge
PermissionGate
DataGrid wrapper
FilterBar
RightDrawer
KpiCard
Timeline
AuditTrailPanel
SyncStatusBadge
ConfirmDialog
```

---

## 28. Form Tests

Test forms for:

```text
PCD checklist update
release creation
wash batch creation
rewash marking
WIP movement
WIP hold
exception closure
shipment checklist update
shopfloor output capture
```

Validation should be both frontend and backend.

---

## 29. Workbench Tests

Frontend integration tests should cover:

```text
order list filter and drawer
PCD readiness action
weekly planning impact preview
daily release blocked flow
workcenter load drilldown
sewing line loading view
wash board batch movement
WIP pipeline drilldown
exception control tower
shipment readiness update
```

---

## 30. Mobile/PWA Tests

Test mobile screens at realistic viewport sizes:

```text
360 × 640
390 × 844
768 × 1024
```

Test:

```text
large touch targets
form usability
offline indicator
pending sync count
task cards
minimal typing flow
```

---

# Part E: End-to-End Testing

---

## 31. E2E Test Tool

Recommended:

```text
Playwright
```

E2E tests should run against a seeded test database.

---

## 32. E2E Test Design

E2E should validate full business journeys, not every edge case.

Each E2E test should define:

```text
seed data
user role
steps
expected backend state
expected UI state
audit/exception expectations
```

---

## 33. Critical E2E Journey 1: PCD to Cutting Release

Flow:

```text
order exists
PCD checklist incomplete
fabric QC pending
release to cutting blocked
fabric QC passed
PCD becomes ready
release to cutting created
WIP moves to cutting
audit created
```

Expected:

```text
blocked action returns reason
release only succeeds after readiness
audit event visible
```

---

## 34. Critical E2E Journey 2: Weekly Plan Freeze

Flow:

```text
planner opens weekly workbench
assigns order to line/workcenter
impact preview shown
capacity overload warning shown
planning head freezes plan
daily release backlog updated
```

Expected:

```text
plan status = FROZEN
audit event created
work items locked
```

---

## 35. Critical E2E Journey 3: Sewing Output and WIP

Flow:

```text
line supervisor opens mobile screen
submits hourly sewing output
net-good calculated
WIP updates to SEWN_WAITING_WASH
line dashboard refreshes
required run rate recalculates
```

Expected:

```text
output visible in sewing line loading screen
WIP pipeline updates
no duplicate on retry
```

---

## 36. Critical E2E Journey 4: Wash Rewash

Flow:

```text
wash batch created
wash steps completed
post-wash QC fails
rewash required marked
rewash WIP created
additional wash load added
exception created
shipment risk recalculated
```

Expected:

```text
wash board shows rewash
workcenter load increases
exception visible
audit trace complete
```

---

## 37. Critical E2E Journey 5: WIP Reconciliation Gap

Flow:

```text
packed quantity entered greater than finished quantity
reconciliation detects impossible quantity
exception created
adjustment requires approval
audit created
```

Expected:

```text
gap visible in reconciliation screen
manual correction controlled
```

---

## 38. Critical E2E Journey 6: Shipment Readiness

Flow:

```text
shipment due soon
AQL pending
mark-ready blocked
AQL completed
documents completed
shipment marked ready
dispatch confirmed
OTIF updated
```

Expected:

```text
readiness gate works
audit trace visible
analytics updates
```

---

## 39. Critical E2E Journey 7: Exception Recovery

Flow:

```text
wet wash overload creates exception
planner creates recovery action add overtime
impact preview improves risk
manager approves
action completed
exception closed
```

Expected:

```text
recovery action board updates
cost-protected OTIF marker available if shipment saved
```

---

## 40. Critical E2E Journey 8: Offline Mobile Sync

Flow:

```text
device goes offline
line supervisor records output
entry pending sync
network returns
sync succeeds
duplicate retry ignored
planner dashboard updates
```

Expected:

```text
idempotency works
original timestamp preserved
sync status accurate
```

---

# Part F: Security and Permission Testing

---

## 41. Permission Test Matrix

Every critical action must test:

```text
authorized user succeeds
unauthorized user receives 403
scoped user cannot act outside scope
inactive user cannot act
backend denies even if frontend route called directly
```

---

## 42. Critical Permission Tests

Required:

```text
PCD conditional release approval
release to cutting
weekly plan freeze
blocked release override
line realignment approval
operation bulletin approval
wash rewash approval
QC hold release
WIP adjustment
shipment mark ready
critical exception close
import apply
role permission change
```

---

## 43. Scope Tests

Required:

```text
line supervisor cannot submit output for another line
wash supervisor cannot execute non-assigned workcenter batch
factory-scoped user cannot edit another factory
shipment user cannot mark ready without permission
data import user cannot apply import
```

---

## 44. Frontend Permission Tests

Required:

```text
modules hidden if no permission
buttons disabled if state/action unavailable
disabled reason displayed
direct URL access handled
availableActions respected
```

---

# Part G: Integration and Import Testing

---

## 45. Import Testing Principles

Every import must test:

```text
valid file
invalid file
missing required fields
invalid references
duplicate records
dry-run
apply
partial success if allowed
audit
error report
idempotency
```

---

## 46. Required Import Test Cases

```text
order import
style import
BOM import
operation bulletin import
line master import
machine master import
operator skill matrix import
opening WIP import
material PO import
fabric QC import
FastReact plan import, if used
shipment status import
```

---

## 47. Integration Failure Tests

Required:

```text
integration connection fails
file format invalid
partial row failure
stale integration detected
repeated failure creates exception
retry does not duplicate records
```

---

# Part H: Audit and Compliance Testing

---

## 48. Audit Test Rules

For every mandatory audit action, test:

```text
audit event created
correct event code
correct entity ID
old/new values captured
user captured
timestamp captured
reason captured where required
source/device captured for mobile
```

---

## 49. Approval Test Rules

Test:

```text
approval requested
approval approved
approval rejected
approval expired
unauthorized approval denied
approved action applies only once
approval visible in trace
```

---

## 50. Traceability Tests

Required:

```text
order trace includes PCD, planning, WIP, wash, QC, shipment, exceptions
WIP trace shows movement and adjustment history
wash batch trace shows steps and rewash cycle
import trace shows validation and apply history
```

---

# Part I: Performance Testing

---

## 51. Performance Test Objectives

Validate that common screens and APIs are usable at expected data volume.

Focus on:

```text
order list
PCD readiness
weekly planning board
workcenter load
WIP pipeline
wash board
exception control tower
shipment readiness
analytics dashboard
```

---

## 52. Initial Performance Targets

Suggested MVP targets:

```text
common list APIs under 2 seconds for typical filters
heavy dashboard APIs under 3–5 seconds
critical action APIs under 3 seconds unless async
frontend grid usable with server-side pagination
mobile submit under 2 seconds on stable network
```

---

## 53. Load Test Scenarios

Test:

```text
100 concurrent users
500 concurrent API requests over short burst
shopfloor output submissions from multiple lines
wash event submissions
exception dashboard refresh
WIP pipeline calculation
analytics snapshot job
```

Adjust targets after actual sizing.

---

## 54. Data Volume Test

Seed realistic volumes:

```text
thousands of orders
many styles
dozens/hundreds of lines
many WIP items
large audit table
large output event table
daily snapshots
```

Performance must be tested with data beyond demo size.

---

# Part J: Data Quality Testing

---

## 55. Master Data Readiness Tests

Test that planning blocks/warns when:

```text
style missing operation bulletin
style missing wash route
line missing machine data
workcenter missing calendar
vendor missing lead time
threshold missing
order missing shipment date
```

---

## 56. Data Freshness Tests

Test:

```text
line with no output update becomes stale
integration stale creates exception
shopfloor pending sync visible
daily snapshot failure visible
```

---

## 57. Quantity Integrity Tests

Test:

```text
no negative WIP
no movement beyond available qty
no duplicate mobile output
no shipment-ready beyond packed qty
no dispatch beyond shipment-ready qty
```

---

# Part K: UAT Strategy

---

## 58. UAT Objective

UAT should validate whether the system supports real Eratex planning operations.

UAT should not be limited to screen acceptance.

It should validate:

```text
planning discipline
release discipline
shopfloor capture
WIP truth
wash execution
exception recovery
shipment readiness
analytics trust
```

---

## 59. UAT Participants

Recommended:

```text
planning head
production planner
line supervisor
wash manager
QC manager
shipment manager
procurement/material user
IE user
factory manager
system admin
```

---

## 60. UAT Scenario Groups

```text
order readiness and PCD
weekly plan and daily release
sewing execution
wash and rewash
WIP and handover
quality hold and release
exception and recovery
shipment readiness
analytics review
mobile capture
integration import
```

---

## 61. UAT Acceptance Criteria

A UAT scenario is accepted when:

```text
user can complete intended workflow
business rule prevents unsafe action
exception/recovery visible where needed
audit is created for critical action
data appears correctly in downstream dashboard
user confirms screen supports real work
```

---

# Part L: Regression Strategy

---

## 62. Regression Suite

Regression should include:

```text
unit tests for core calculations
API tests for critical endpoints
permission tests
E2E critical flows
import tests
audit tests
smoke tests
```

---

## 63. Regression Trigger

Run regression on:

```text
pull request
merge to main
staging deployment
production release candidate
hotfix
database migration
major integration change
```

---

## 64. Regression Prioritization

Critical regression first:

```text
PCD release
planning freeze
daily release
sewing output
wash rewash
WIP movement
shipment ready
exceptions
permissions
audit
```

---

# Part M: Defect Management

---

## 65. Defect Severity

Recommended defect severities:

```text
S1 Critical
S2 High
S3 Medium
S4 Low
```

### 65.1 S1 Critical

Examples:

```text
data loss
wrong WIP quantity
unauthorized critical action allowed
shipment ready incorrectly allowed
major system unavailable
```

### 65.2 S2 High

Examples:

```text
incorrect planning calculation
critical screen unusable
audit missing for critical action
integration apply corrupts data
```

### 65.3 S3 Medium

Examples:

```text
filter issue
minor calculation display problem
non-critical action issue
```

### 65.4 S4 Low

Examples:

```text
cosmetic issue
copy issue
minor layout issue
```

---

## 66. Defect Lifecycle

```text
NEW
TRIAGED
IN_PROGRESS
READY_FOR_QA
QA_PASSED
QA_FAILED
CLOSED
REOPENED
```

---

## 67. Defect Report Fields

```text
title
module
environment
steps to reproduce
expected result
actual result
severity
screenshot/video
test data
user role
browser/device
logs if available
```

---

# Part N: Release Quality Gates

---

## 68. Pull Request Gate

Before merge:

```text
unit tests pass
API tests pass for touched module
frontend build passes
lint/typecheck pass
migrations checked
code review complete
```

---

## 69. Staging Release Gate

Before UAT:

```text
deployment successful
migrations successful
smoke tests pass
seed/import data loaded
core regression pass
known issues documented
```

---

## 70. Production Release Gate

Before production:

```text
UAT sign-off
critical regression pass
backup completed
rollback plan ready
release notes ready
monitoring active
support owner assigned
```

---

## 71. No-Go Conditions

Do not release if:

```text
critical permission bug exists
WIP quantity corruption exists
shipment readiness gate bug exists
critical audit missing
migration not tested
backup not completed
login broken
core planning/release flow broken
```

---

# Part O: Test Data Strategy

---

## 72. Seed Data Requirements

Test data must include:

```text
customers
buyers
styles
BOM
operation bulletins
wash routes
lines
machines
operators
orders
materials
fabric lots
WIP
exceptions
shipment readiness
users and roles
```

---

## 73. Scenario-Based Seed Packs

Create seed packs for:

```text
happy path order
PCD blocked order
fabric QC failed order
sewing shortfall order
wash rewash order
WIP reconciliation gap order
shipment blocked order
overloaded workcenter
underutilized line
permission test users
```

---

## 74. Test Data Reset

QA environments need reset capability:

```text
reset database
load base seed
load scenario seed
```

Avoid manual data recreation.

---

# Part P: Tooling

---

## 75. Backend Tools

Recommended:

```text
pytest
pytest-django
factory_boy
coverage.py
ruff or flake8
mypy optional
drf-spectacular
```

---

## 76. Frontend Tools

Recommended:

```text
Vitest or Jest
React Testing Library
Playwright
ESLint
TypeScript
Testing Library user-event
MSW for API mocks
```

---

## 77. API Testing Tools

Options:

```text
pytest API tests
Postman/Newman
Schemathesis for OpenAPI testing, optional
```

---

## 78. Performance Tools

Options:

```text
k6
Locust
JMeter
Django Debug Toolbar for local
database query logging
```

---

# Part Q: QA Documentation

---

## 79. Required QA Artifacts

Maintain:

```text
test strategy
test case catalog
UAT scenarios
regression suite list
test data guide
defect log
release test report
performance test report
security test checklist
```

---

## 80. Test Case Format

Each test case should include:

```text
test ID
module
scenario
preconditions
role/user
steps
expected result
data required
priority
automation status
```

---

# Part R: Implementation Phasing

---

## 81. Phase 1: Test Foundation

Build:

```text
pytest setup
frontend test setup
Playwright setup
seed data framework
CI test runner
basic smoke tests
```

---

## 82. Phase 2: Core Backend Tests

Build tests for:

```text
PCD
planning
daily release
WIP
wash
exceptions
shipment
permissions
audit
```

---

## 83. Phase 3: Frontend and E2E Tests

Build:

```text
component tests
workbench tests
critical E2E journeys
mobile viewport tests
```

---

## 84. Phase 4: Integration and Performance Tests

Build:

```text
import tests
integration stale tests
load tests
snapshot tests
data volume tests
```

---

## 85. Phase 5: UAT and Release Governance

Build:

```text
UAT scenario pack
release test checklist
defect process
regression suite dashboard
```

---

# Part S: Open Decisions

---

## 86. Decisions Required

Before implementation, confirm:

1. Who owns QA: dedicated QA, product owner, or shared team?
2. Which modules are mandatory for MVP UAT?
3. What data volume should performance tests simulate?
4. Which browser/device combinations are required?
5. Is offline mobile sync mandatory in MVP?
6. What is acceptable API response time for planning boards?
7. What are no-go quality gates for production?
8. Who signs off UAT?
9. Is automated regression required before every deploy?
10. Should test data be anonymized production data or synthetic?
11. Which reports need formula validation by business?
12. How much manual test evidence is required?

---

## 87. Non-Negotiable Rules

```text
1. Critical business calculations must have automated tests.
2. Critical state transitions must have permission and audit tests.
3. WIP quantity movements must be tested for integrity.
4. Shipment ready cannot be released without gate tests.
5. Wash rewash must be tested for capacity and WIP impact.
6. Offline sync must be idempotency-tested if included.
7. Imports must support dry-run and error tests.
8. Release cannot proceed if critical regression fails.
9. UAT must validate end-to-end operational flows.
10. Testing must include realistic scale data, not only demo records.
```

---

## 88. Summary

This document defines the testing and QA strategy for the Eratex Planning & Scheduling Platform.

Testing must cover:

```text
business logic
state transitions
WIP integrity
wash and rewash
shopfloor capture
permissions
audit
integration
analytics
frontend workbenches
mobile/PWA
deployment readiness
```

The key QA principle is:

```text
The system is only ready when it can control the real manufacturing flow end-to-end, not merely display screens successfully.
```

A strong automated and UAT-driven QA discipline is essential to ensure the platform can replace manual Excel dependency and become a trusted operating layer for Eratex.
