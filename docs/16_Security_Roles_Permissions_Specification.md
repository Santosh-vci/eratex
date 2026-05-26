# 16. Security, Roles, and Permissions Specification  
# Eratex End-to-End Planning & Scheduling Platform

**Company:** Eratex  
**Product:** Planning & Scheduling Tool for Denim Bottoms + Chinos Manufacturing  
**Document Type:** Security, Roles, and Permissions Specification  
**Version:** 2.0  
**Date:** 2026-05-26  
**Backend Stack:** Django + Django REST Framework + PostgreSQL + Redis + Celery  
**Frontend Stack Context:** React/Next.js + TypeScript + PWA Shopfloor Capture  
**Deployment Context:** Dockerized application stack  
**Primary Security Control Layer:** Django Auth + Django Admin + Custom Role/Action Permission Model  

---

## 1. Purpose

This document defines the security, role, access-control, approval, audit, and permission-governance specification for the Eratex Planning & Scheduling Platform.

The platform will control critical production actions such as:

```text
PCD readiness approval
conditional release
release to cutting
weekly plan freeze
daily release override
line realignment approval
wash rewash decision
QC hold release
WIP movement and adjustment
shipment readiness
exception closure
integration import approval
master data approval
```

Therefore, security must not be treated only as login/logout. It must control **who can see**, **who can act**, **who can approve**, and **who is accountable** for every critical state transition.

---

## 2. Security Thesis

The platform should follow this principle:

```text
Every critical operational action must be permission-checked, state-validated, and auditable.
```

The system must prevent:

```text
unauthorized release
uncontrolled plan changes
silent WIP adjustment
unapproved QC hold release
untraceable shipment readiness marking
uncontrolled import overwrite
master data changes without governance
```

Frontend hiding of buttons is helpful, but not sufficient. Backend must enforce all permissions.

---

## 3. Security Scope

This document covers:

```text
1. Authentication
2. User profile model
3. Role model
4. Permission action model
5. Role-permission matrix
6. Factory/department/line/workcenter scope
7. Shopfloor/mobile user access
8. Approval authority
9. Master data governance access
10. API authorization
11. Django Admin access
12. Audit requirements
13. Data visibility rules
14. Sensitive data handling
15. Integration security
16. Session and device control
17. Testing requirements
18. Implementation phasing
```

---

## 4. Security Architecture

## 4.1 Recommended Authentication Base

Use:

```text
Django Auth
```

Extend through:

```text
UserProfile
Role
PermissionAction
UserRole
RolePermission
```

## 4.2 Authorization Model

Recommended model:

```text
role-based access control
+ action-level permissions
+ operational scope
```

Meaning:

```text
User has role.
Role has permission actions.
Permission may be scoped to factory, department, workcenter, line, or global.
```

## 4.3 Why Action-Level Permissions Are Required

Module-level access is not enough.

Example:

```text
A user may view PCD readiness but not approve conditional release.
A user may view shipment readiness but not mark shipment ready.
A line supervisor may capture output but not adjust WIP.
A QC inspector may create hold but not release critical hold.
```

Therefore, permissions must be action-specific.

---

# Part A: User and Identity Model

---

## 5. User Account

Use Django’s base user or custom user.

Minimum user fields:

```text
username
email
password hash
first name
last name
active status
staff status
superuser status
last login
```

Recommendation:

```text
Do not use superuser accounts for daily operations.
```

Superuser should be limited to system administration only.

---

## 6. User Profile

### 6.1 Purpose

UserProfile extends Django user with operational identity.

### 6.2 Required Fields

```text
user_id
employee_code
display_name
factory_id
department_id
default_role
is_shopfloor_user
active_status
created_at
updated_at
```

### 6.3 Optional Fields

```text
phone
designation
default_line_id
default_workcenter_id
supervisor_user_id
language_preference
timezone
```

### 6.4 Business Rules

```text
inactive user cannot login
inactive user cannot own new exceptions
shopfloor user receives mobile-first navigation
user must have at least one role for operational access
```

---

## 7. Operational Scope

User access may be scoped by:

```text
factory
department
workcenter
line
customer, if needed
role
```

### 7.1 Scope Examples

```text
Line Supervisor can act only on assigned line.
Wash Supervisor can act only on wash workcenters.
Factory Manager can see all factory operations.
Management can see all factories.
QC Inspector can capture QC for assigned department/stage.
```

---

# Part B: Role Model

---

## 8. Role Master

### 8.1 Purpose

Role defines a set of responsibilities and permission actions.

### 8.2 Required Fields

```text
role_id
role_code
role_name
description
role_type
active_status
```

### 8.3 Role Types

```text
SYSTEM
MANAGEMENT
PLANNING
PRODUCTION
QUALITY
PROCUREMENT
SHIPMENT
TECHNICAL
SHOPFLOOR
AUDIT
INTEGRATION
```

---

## 9. Recommended Roles

Recommended starting role list:

```text
SYSTEM_ADMIN
BUSINESS_ADMIN
MANAGEMENT_VIEWER
FACTORY_MANAGER
PLANNING_HEAD
PRODUCTION_PLANNER
MERCHANDISER
PROCUREMENT_USER
FABRIC_QC_USER
IE_USER
CUTTING_MANAGER
CUTTING_SUPERVISOR
SEWING_MANAGER
LINE_SUPERVISOR
WASHING_MANAGER
WASH_SUPERVISOR
FINISHING_MANAGER
PACKING_MANAGER
QC_MANAGER
QC_INSPECTOR
SHIPMENT_MANAGER
SHIPMENT_USER
MAINTENANCE_USER
SHOPFLOOR_USER
INTEGRATION_ADMIN
DATA_IMPORT_USER
READ_ONLY_AUDITOR
```

---

## 10. Role Definitions

## 10.1 SYSTEM_ADMIN

Purpose:

```text
technical system administration
```

Allowed:

```text
manage users
manage roles
manage system configuration
access Django Admin
view audit
```

Not intended for daily production planning.

---

## 10.2 BUSINESS_ADMIN

Purpose:

```text
business configuration administration
```

Allowed:

```text
maintain master data
configure thresholds
configure calendars
manage non-technical setup
```

---

## 10.3 MANAGEMENT_VIEWER

Purpose:

```text
management visibility without operational edits
```

Allowed:

```text
view dashboards
view analytics
view orders
view exceptions
view shipment risk
```

Restricted:

```text
cannot approve releases
cannot change plans
cannot edit WIP
```

---

## 10.4 FACTORY_MANAGER

Purpose:

```text
factory-wide operational authority
```

Allowed:

```text
view all factory operations
approve critical recovery
approve escalation closure
view analytics
review exceptions
```

---

## 10.5 PLANNING_HEAD

Purpose:

```text
own planning governance
```

Allowed:

```text
freeze weekly plan
approve plan changes
approve capacity exceptions
approve release overrides where configured
view all planning dashboards
```

---

## 10.6 PRODUCTION_PLANNER

Purpose:

```text
day-to-day planning and release execution
```

Allowed:

```text
create weekly plan
assign work items
validate daily release
create releases
view capacity
create exceptions
```

Restricted:

```text
cannot freeze plan unless granted
cannot approve critical overrides unless granted
```

---

## 10.7 MERCHANDISER

Purpose:

```text
customer/order coordination and approval follow-up
```

Allowed:

```text
view orders
update approval milestones
view PCD blockers
comment on exceptions
track buyer approvals
```

---

## 10.8 PROCUREMENT_USER

Purpose:

```text
material and vendor readiness updates
```

Allowed:

```text
update vendor ETA
view material shortages
close procurement actions
create material exceptions
```

---

## 10.9 FABRIC_QC_USER

Purpose:

```text
fabric inspection and QC status
```

Allowed:

```text
capture fabric QC
hold fabric
release fabric QC within authority
update PCD fabric QC item
```

---

## 10.10 IE_USER

Purpose:

```text
operation bulletin, SMV, line balance, skill matrix
```

Allowed:

```text
create/edit operation bulletin drafts
prepare line balance
review efficiency
update skill matrix if authorized
```

Approval may require IE head or production head.

---

## 10.11 CUTTING_MANAGER / CUTTING_SUPERVISOR

Purpose:

```text
cutting execution and handover
```

Allowed:

```text
view cutting releases
record cutting output
handover cut panels
raise cutting issues
```

---

## 10.12 SEWING_MANAGER

Purpose:

```text
sewing execution control
```

Allowed:

```text
view all sewing lines
approve line realignment, if configured
review line efficiency
manage sewing exceptions
```

---

## 10.13 LINE_SUPERVISOR

Purpose:

```text
line-level shopfloor capture
```

Allowed:

```text
capture sewing output
capture downtime
raise andon issue
submit handover
close shift
```

Restricted:

```text
cannot adjust WIP
cannot approve critical release
cannot close critical exceptions
```

---

## 10.14 WASHING_MANAGER / WASH_SUPERVISOR

Purpose:

```text
wash planning and execution
```

Washing Manager allowed:

```text
view wash board
approve rewash if configured
release wash holds
manage wash exceptions
```

Wash Supervisor allowed:

```text
start/complete wash steps
mark rewash required
submit wash handover
raise wash issue
```

---

## 10.15 QC_MANAGER / QC_INSPECTOR

Purpose:

```text
quality inspection and hold governance
```

QC Inspector allowed:

```text
capture QC inspection
create hold
record defects
```

QC Manager allowed:

```text
release QC hold
waive QC result where permitted
close quality exceptions
```

---

## 10.16 SHIPMENT_MANAGER / SHIPMENT_USER

Purpose:

```text
shipment readiness and dispatch coordination
```

Shipment User allowed:

```text
update shipment checklist
update documentation status
update forwarder status
```

Shipment Manager allowed:

```text
mark shipment ready
approve split shipment
close shipment exceptions
```

---

## 10.17 INTEGRATION_ADMIN / DATA_IMPORT_USER

Purpose:

```text
integration and import handling
```

Data Import User:

```text
upload import
run dry validation
view row errors
```

Integration Admin:

```text
apply import
configure integration
trigger sync
resolve integration errors
```

---

## 10.18 READ_ONLY_AUDITOR

Purpose:

```text
audit and compliance review
```

Allowed:

```text
view audit logs
view operational history
export audit reports if allowed
```

Restricted:

```text
no operational writes
```

---

# Part C: Permission Action Model

---

## 11. PermissionAction

### 11.1 Purpose

Defines exact actions that can be granted to roles.

### 11.2 Required Fields

```text
permission_action_id
action_code
action_name
module
description
risk_level
active_status
```

### 11.3 Risk Levels

```text
LOW
MEDIUM
HIGH
CRITICAL
```

### 11.4 Example

```json
{
  "actionCode": "pcd.approve_conditional_release",
  "actionName": "Approve PCD Conditional Release",
  "module": "PCD",
  "riskLevel": "CRITICAL"
}
```

---

## 12. Permission Naming Convention

Use:

```text
module.action
```

Examples:

```text
orders.view
planning.freeze_weekly_plan
release.override_blocked_release
wip.adjust
quality.release_hold
shipment.mark_ready
```

---

# Part D: Permission Catalog

---

## 13. Common Permissions

```text
common.view
common.export
common.comment
common.view_audit
```

---

## 14. Order Permissions

```text
orders.view
orders.create
orders.edit
orders.assign_owner
orders.change_stage
orders.cancel
orders.view_timeline
```

---

## 15. PCD Permissions

```text
pcd.view
pcd.update_item
pcd.initialize
pcd.approve_conditional_release
pcd.release_to_cutting
pcd.override_blocker
pcd.view_audit
```

---

## 16. Planning Permissions

```text
planning.view
planning.create
planning.edit
planning.assign_work_item
planning.preview_impact
planning.freeze_weekly_plan
planning.request_change
planning.approve_change
planning.cancel_plan
planning.export
```

---

## 17. Daily Release Permissions

```text
release.view
release.validate
release.create
release.block
release.request_exception_release
release.override_blocked_release
release.complete
release.cancel
```

---

## 18. Workcenter Permissions

```text
workcenter.view
workcenter.view_load
workcenter.view_queue
workcenter.update_capacity
workcenter.approve_overtime_capacity
workcenter.view_constraint
```

---

## 19. Sewing Permissions

```text
sewing.view
sewing.load_line
sewing.record_output
sewing.edit_output
sewing.capture_downtime
sewing.realign_line
sewing.approve_realignment
sewing.apply_realignment
sewing.view_efficiency
```

---

## 20. Operation Bulletin and IE Permissions

```text
bulletin.view
bulletin.create
bulletin.edit
bulletin.clone
bulletin.submit_for_approval
bulletin.approve
bulletin.obsolete
line_balance.view
line_balance.edit
line_balance.approve
line_balance.activate
skill_matrix.view
skill_matrix.edit
```

---

## 21. Wash Permissions

```text
wash.view
wash.view_queue
wash.create_batch
wash.edit_batch
wash.execute_step
wash.hold_batch
wash.release_hold
wash.mark_rewash
wash.approve_rewash
wash.release_to_finishing
wash.adjust_batch
wash.view_capacity
wash.export
```

---

## 22. WIP Permissions

```text
wip.view
wip.view_pipeline
wip.move
wip.hold
wip.release_hold
wip.adjust
wip.scrap
wip.view_reconciliation
wip.override_movement
wip.export
```

---

## 23. Quality Permissions

```text
quality.view
quality.inspect
quality.create_hold
quality.release_hold
quality.waive
quality.record_defect
quality.close_inspection
quality.view_aql
quality.approve_aql
```

---

## 24. Exception and Recovery Permissions

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
```

---

## 25. Shipment Permissions

```text
shipment.view
shipment.update_checklist
shipment.block
shipment.mark_ready
shipment.approve_split
shipment.confirm_dispatch
shipment.export
```

---

## 26. Analytics Permissions

```text
analytics.view
analytics.management_view
analytics.export
analytics.otif
analytics.utilization
analytics.line_efficiency
analytics.wash
analytics.wip
analytics.quality
analytics.exceptions
analytics.recovery
analytics.shipment
analytics.master_data
```

---

## 27. Integration Permissions

```text
integration.view
integration.run
integration.import
integration.approve_import
integration.cancel_import
integration.view_errors
integration.export
integration.configure
```

---

## 28. Master Data Permissions

```text
master_data.view
master_data.create
master_data.edit
master_data.approve
master_data.obsolete
master_data.import
master_data.export
```

---

## 29. Shopfloor Permissions

```text
shopfloor.view_home
shopfloor.capture_output
shopfloor.capture_qc
shopfloor.capture_downtime
shopfloor.resolve_downtime
shopfloor.create_handover
shopfloor.accept_handover
shopfloor.raise_andon
shopfloor.close_shift
shopfloor.offline_sync
```

---

## 30. Audit Permissions

```text
audit.view
audit.export
audit.view_sensitive
```

---

# Part E: Role-Permission Matrix

---

## 31. MVP Permission Matrix

The following is the recommended starting matrix. The actual system should store this in the database and allow admin configuration.

| Role | Key Permissions |
|---|---|
| SYSTEM_ADMIN | all technical/admin permissions |
| BUSINESS_ADMIN | master_data.*, threshold/calendar setup, user non-technical setup |
| MANAGEMENT_VIEWER | analytics.management_view, orders.view, exception.view, shipment.view |
| FACTORY_MANAGER | management dashboards, critical exception closure, recovery approval |
| PLANNING_HEAD | planning.*, release override, exception management, shipment view |
| PRODUCTION_PLANNER | orders.view, planning.edit, release.create, pcd.view, workcenter.view |
| MERCHANDISER | orders.view, approval milestone update, pcd.view |
| PROCUREMENT_USER | materials/procurement updates, material exceptions |
| FABRIC_QC_USER | fabric QC inspect, fabric hold, PCD fabric item update |
| IE_USER | bulletin edit, line balance edit, efficiency view |
| SEWING_MANAGER | sewing.view, line realignment, sewing exceptions |
| LINE_SUPERVISOR | shopfloor output, downtime, handover, shift closure |
| WASHING_MANAGER | wash board, rewash approval, wash exceptions |
| WASH_SUPERVISOR | wash step execution, mark rewash, handover |
| QC_MANAGER | quality release hold, AQL approval, quality exceptions |
| QC_INSPECTOR | QC inspection, defect capture, create hold |
| SHIPMENT_MANAGER | shipment mark ready, split shipment, shipment exceptions |
| SHIPMENT_USER | shipment checklist update |
| INTEGRATION_ADMIN | integration configure/run/import/apply |
| DATA_IMPORT_USER | upload and dry-run import |
| READ_ONLY_AUDITOR | audit view, read-only operational view |

---

## 32. Critical Permission Matrix

Critical actions requiring controlled permission:

| Action | Permission |
|---|---|
| Approve PCD conditional release | pcd.approve_conditional_release |
| Release to cutting | pcd.release_to_cutting |
| Freeze weekly plan | planning.freeze_weekly_plan |
| Approve plan change | planning.approve_change |
| Override blocked release | release.override_blocked_release |
| Approve overtime capacity | workcenter.approve_overtime_capacity |
| Approve line realignment | sewing.approve_realignment |
| Approve operation bulletin | bulletin.approve |
| Mark rewash required | wash.mark_rewash |
| Approve rewash | wash.approve_rewash |
| Release QC hold | quality.release_hold |
| Adjust WIP | wip.adjust |
| Scrap WIP | wip.scrap |
| Mark shipment ready | shipment.mark_ready |
| Approve split shipment | shipment.approve_split |
| Close critical exception | exception.close_critical |
| Apply import batch | integration.approve_import |
| Approve master data | master_data.approve |

---

# Part F: Scope-Based Access

---

## 33. Factory Scope

Users may be limited to one or more factories.

Example:

```text
Factory A planner cannot edit Factory B plan.
```

## 34. Department Scope

Department users should see their own department by default.

Example:

```text
Washing users see wash queues, wash exceptions, wash WIP.
```

## 35. Line Scope

Line supervisors should be restricted by line.

Rule:

```text
User can capture output only for assigned line unless broader permission exists.
```

## 36. Workcenter Scope

Workcenter users should be restricted by assigned workcenter.

Example:

```text
Wash supervisor can execute assigned wash batches only.
```

## 37. Customer Scope

Optional.

May be used if merchandisers or account teams are customer-specific.

---

# Part G: Approval Authority

---

## 38. Approval Model

Some actions require approval because they affect shipment, cost, WIP, or quality risk.

Approval should capture:

```text
requested by
requested at
approved/rejected by
approved/rejected at
reason
impact
audit event
```

---

## 39. Approval Categories

```text
PCD conditional release
blocked release override
plan change after freeze
line realignment
operation bulletin approval
QC hold release
rewash approval
WIP adjustment
split shipment
import apply
master data approval
```

---

## 40. Approval Status

```text
NOT_REQUIRED
REQUESTED
APPROVED
REJECTED
EXPIRED
CANCELLED
```

---

## 41. Approval Expiry

Conditional approvals should have expiry where appropriate.

Example:

```text
PCD conditional release valid until trims arrive or until expiry date.
```

Expired approvals should revert to blocked or require review.

---

# Part H: Django Admin Security

---

## 42. Django Admin Role

Django Admin should be used for:

```text
user setup
role setup
permission action setup
master data maintenance
configuration
integration source setup
audit review
```

It should not be the primary operational UI for planners.

---

## 43. Admin Access Rules

Only roles with explicit admin access can use Django Admin.

Recommended admin roles:

```text
SYSTEM_ADMIN
BUSINESS_ADMIN
INTEGRATION_ADMIN, limited
READ_ONLY_AUDITOR, read-only admin if needed
```

---

## 44. Admin Object-Level Controls

Admin should restrict:

```text
approved records read-only
inactive records not editable by normal users
critical config editable only by Business Admin/System Admin
```

---

## 45. Admin Audit

Changes through Django Admin must create audit events for critical records:

```text
roles
permissions
master data
thresholds
calendars
operation bulletins
wash routes
planning thresholds
integration configuration
```

---

# Part I: API Authorization

---

## 46. API Permission Enforcement

Every write API must check:

```text
authentication
active user
permission action
scope
state validity
```

Example:

```text
POST /api/v1/orders/{id}/mark-shipment-ready
requires shipment.mark_ready
```

## 47. Read API Enforcement

Read APIs must apply scope filters.

Example:

```text
Line supervisor sees only assigned line tasks.
Factory manager sees all factory data.
Management sees all factories if granted.
```

## 48. Permission Error Response

Return:

```json
{
  "data": null,
  "meta": {},
  "errors": [
    {
      "code": "PERMISSION_DENIED",
      "message": "You do not have permission to approve PCD conditional release."
    }
  ]
}
```

Use HTTP:

```text
403 Forbidden
```

---

# Part J: Frontend Permission Behavior

---

## 49. Frontend Permission Rules

Frontend should:

```text
hide unavailable modules
disable unavailable actions
show reason when action disabled
respect availableActions from backend
refresh permission state after login
```

But:

```text
frontend must never be trusted as security boundary
```

---

## 50. PermissionGate Component

Example:

```tsx
<PermissionGate permission="planning.freeze_weekly_plan">
  <Button>Freeze Plan</Button>
</PermissionGate>
```

---

## 51. Disabled Action Reason

If backend says action is unavailable due to state:

```text
show disabled button with tooltip
```

Example:

```text
Release to Cutting disabled: Fabric QC pending.
```

---

# Part K: Shopfloor and Device Security

---

## 52. Shopfloor Access Rules

Shopfloor users should be limited to:

```text
assigned tasks
assigned line/workcenter
current shift
allowed capture actions
```

---

## 53. Device Identity

Each PWA/device should send:

```text
device_id
source
app version
```

Optional device registration:

```text
device name
device type
factory
department
active status
last seen
```

---

## 54. Offline Data Security

Offline storage should:

```text
store only operational task data
clear on logout
avoid sensitive commercial data
sync securely
```

---

## 55. Offline Submission Security

Offline events must be validated again on server.

A locally stored event is not automatically trusted.

Server must check:

```text
permission
scope
current state
quantity validity
idempotency
```

---

# Part L: Audit and Traceability

---

## 56. Audit Event Requirements

Audit required for critical actions:

```text
PCD conditional release
release to cutting
blocked release override
weekly plan freeze
plan change approval
operation bulletin approval
line realignment approval
line balance approval
wash rewash
QC hold release
WIP adjustment
WIP scrap
shipment mark ready
split shipment approval
critical exception closure
import apply
role/permission change
```

---

## 57. Audit Fields

```text
audit_event_id
entity_type
entity_id
action
old_value
new_value
reason
performed_by
performed_at
source
ip_address
device_id
```

---

## 58. Audit Visibility

Audit can be viewed by:

```text
SYSTEM_ADMIN
BUSINESS_ADMIN
READ_ONLY_AUDITOR
FACTORY_MANAGER, scoped
MANAGEMENT_VIEWER, if allowed
```

---

# Part M: Session, Password, and Authentication Policy

---

## 59. Password Policy

Recommended minimum:

```text
minimum password length
complexity
password reset process
account lockout after repeated failures
```

If SSO is available later, integrate.

---

## 60. Session Timeout

Recommended:

```text
desktop session timeout based on company policy
shopfloor session timeout shorter or shift-based
logout clears local sensitive data
```

---

## 61. Account Locking

Lock or disable account after:

```text
employee leaves
role changes
security incident
repeated failed login attempts
```

---

# Part N: Data Visibility and Sensitive Data

---

## 62. Data Classification

Data categories:

```text
public internal
operational
commercial sensitive
security sensitive
audit sensitive
personal employee data
```

---

## 63. Operational Data

Visible to relevant operations users:

```text
orders
style
quantities
WIP
workcenter load
exceptions
shipment readiness
```

---

## 64. Commercial Sensitive Data

If added later:

```text
prices
costs
customer commercial terms
margin
```

Should be restricted to authorized management/finance roles.

---

## 65. Personal Data

Minimize personal employee data.

For planning, only use:

```text
employee code
display name
role
department
skill/attendance as operational need
```

Avoid unnecessary personal attributes.

---

# Part O: Integration Security

---

## 66. Import Security

Import requires:

```text
authenticated user
permission integration.import
dry-run validation
permission integration.approve_import to apply
audit
```

---

## 67. External API Security

If external systems connect:

```text
use service accounts
token authentication
IP allowlist if needed
rate limiting
audit integration runs
```

---

## 68. File Upload Security

Uploaded files should be:

```text
type-validated
size-limited
stored securely
linked to import batch
not publicly exposed
```

---

# Part P: Deployment Security

---

## 69. Docker and Environment Security

Rules:

```text
do not commit secrets
use environment variables
separate dev/stage/prod settings
use strong database credentials
restrict exposed ports
use HTTPS in production
```

---

## 70. Database Security

Rules:

```text
least privilege DB user
regular backups
restricted admin access
audit sensitive changes
migration review
```

---

## 71. API Security

Recommended:

```text
CSRF protection if session auth
JWT expiry if token auth
rate limiting for login
CORS restricted to allowed frontend domains
request size limits
```

---

# Part Q: Testing Requirements

---

## 72. Permission Tests

Required tests:

```text
user without permission cannot perform action
user with permission can perform action
factory-scoped user cannot act outside factory
line supervisor cannot submit other line output
shopfloor user cannot approve critical release
```

---

## 73. Critical Action Tests

Test permission and audit for:

```text
PCD conditional release
release to cutting
plan freeze
release override
line realignment approval
wash rewash approval
QC hold release
WIP adjustment
shipment ready
critical exception closure
import apply
```

---

## 74. API Security Tests

Required:

```text
unauthenticated requests rejected
inactive user rejected
permission missing returns 403
scope violation returns 403
write action creates audit
read filters by scope
```

---

## 75. Frontend Permission Tests

Required:

```text
module hidden if permission missing
button disabled if action not available
permission gate works
availableActions respected
disabled reason displayed
```

---

# Part R: Implementation Phasing

---

## 76. Phase 1: Identity and RBAC Foundation

Build:

```text
UserProfile
Role
PermissionAction
UserRole
RolePermission
Django Admin setup
/api/v1/me
permission middleware/helper
```

---

## 77. Phase 2: Core Permission Enforcement

Apply permission checks to:

```text
orders
PCD
planning
release
WIP
exceptions
shipment
```

---

## 78. Phase 3: Scope Enforcement

Build:

```text
factory scope
department scope
line scope
workcenter scope
shopfloor assignment rules
```

---

## 79. Phase 4: Approval and Audit

Build:

```text
approval records
critical action audit
audit trail API
admin audit views
```

---

## 80. Phase 5: Security Hardening

Build:

```text
session policy
device tracking
offline event validation
integration security
export governance
```

---

# Part S: Open Decisions

---

## 81. Decisions Required

Before implementation, confirm:

1. Will the system use Django session auth, JWT, or SSO?
2. What is the official role list for pilot?
3. How many factories should scope support at MVP?
4. Should users be scoped by line/workcenter from day one?
5. Who can approve PCD conditional release?
6. Who can approve blocked release override?
7. Who can approve WIP adjustment?
8. Who can close BLACK exceptions?
9. Who can apply import batches?
10. Should Django Admin be accessible to business users?
11. Is mobile device registration mandatory?
12. What is session timeout policy?
13. What export restrictions are required?
14. Is audit export required in MVP?

---

## 82. Non-Negotiable Rules

```text
1. Backend must enforce every critical permission.
2. Frontend permission hiding is not security.
3. Critical actions must be audited.
4. RED/BLACK exception closure must be controlled.
5. WIP adjustment must require explicit permission.
6. Shipment ready marking must require permission.
7. Import apply must require approval permission.
8. Approved master data must not be casually edited.
9. Shopfloor users must be scoped to assigned work areas.
10. Inactive users must not access the system.
```

---

## 83. Summary

This document defines the security, role, permission, scope, approval, and audit spine for the Eratex Planning & Scheduling Platform.

The platform controls high-impact operational actions across:

```text
planning
PCD
daily release
sewing
wash
WIP
quality
shipment
exceptions
analytics
integration
master data
shopfloor capture
```

Security must therefore be embedded into the business workflow, not added later.

The core governance principle is:

```text
The right user may take the right action, on the right entity, in the right state, with a traceable audit record.
```
