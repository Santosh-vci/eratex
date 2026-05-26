# 05. Backend Domain Module Specification  
# Eratex End-to-End Planning & Scheduling Platform

**Company:** Eratex  
**Product:** Planning & Scheduling Tool for Denim Bottoms + Chinos Manufacturing  
**Document Type:** Backend Domain Module Specification  
**Version:** 2.0  
**Date:** 2026-05-26  
**Backend Stack:** Django + Django REST Framework + PostgreSQL + Celery + Redis  
**Admin/RBAC:** Django Admin + Django Auth + Custom Role/Action Permissions  
**Deployment Context:** Dockerized application stack  

---

## 1. Purpose

This document defines the backend domain modules for the Eratex Planning & Scheduling Platform.

It specifies:

- recommended Django app/module structure
- responsibility boundaries
- owned models/tables
- service-layer responsibilities
- API exposure
- admin configuration
- permissions
- domain events
- integration points
- tests required by module

The goal is to ensure that the backend is not built as a single monolithic collection of views and models. Instead, it should be built as a modular domain-oriented system that supports the full planning and execution loop.

---

## 2. Backend Architecture Principle

The backend should follow a **domain-module + service-layer architecture**.

Recommended pattern:

```text
Django app/module
→ models
→ serializers
→ permissions
→ selectors
→ services
→ views/viewsets
→ admin
→ tests
```

### 2.1 Why This Pattern

The platform contains many workflow-heavy domains:

```text
PCD readiness
weekly planning
daily release
sewing line loading
wash execution
WIP inventory
QC holds
exceptions
shipment readiness
```

If business logic is placed directly in API views or serializers, the build will become difficult to test and govern.

Therefore:

```text
Views should orchestrate.
Serializers should validate shape.
Services should own business logic.
Selectors should own query/read logic.
Models should represent persistence.
```

---

## 3. Recommended Backend App Structure

Recommended Django apps:

```text
identity_access
organization
master_data
orders
style_technical
materials_procurement
fabric_qc
pcd_readiness
planning
production_release
workcenters
cutting
sewing
washing
quality
wip_inventory
rework_recovery
exceptions
shipment
analytics
audit_governance
integrations
common
```

`common` should contain shared utilities:

```text
base models
enums
date/time helpers
pagination utilities
audit helpers
exception classes
response helpers
```

---

## 4. Cross-Cutting Backend Rules

### 4.1 Business Logic Rule

Business logic must live in service modules, not in:

```text
views
serializers
frontend
admin actions, except where admin action calls service
model save methods, unless unavoidable
```

### 4.2 Status Transition Rule

All state transitions must go through service functions.

Example:

```text
pcd_readiness.services.approve_conditional_release()
shipment.services.mark_ready()
exceptions.services.close_exception()
washing.services.mark_rewash_required()
```

### 4.3 Audit Rule

Critical actions must write audit events.

Examples:

```text
plan freeze
PCD conditional release
release override
operation bulletin approval
line realignment approval
QC hold release
rewash decision
WIP manual adjustment
shipment marked ready
exception closed
```

### 4.4 Permission Rule

Every write action must check action-level permission.

Examples:

```text
pcd.approve_conditional_release
planning.freeze_weekly_plan
release.override_blocked_release
quality.release_hold
shipment.mark_ready
bulletin.approve
line.approve_realignment
exception.close_critical
```

### 4.5 Calculation Rule

Backend services must calculate:

```text
readiness status
risk status
capacity load
constraint flag
WIP ageing
shipment risk
exception severity
```

Frontend must not duplicate these calculations.

---

# Part A: Core Foundation Modules

---

## 5. common Module

### 5.1 Purpose

Provides shared utilities, base classes, enums, and common infrastructure.

### 5.2 Responsibilities

```text
base model classes
shared enums
custom exceptions
API response helpers
pagination defaults
date/time helpers
audit helper wrapper
permission helper wrapper
service result objects
```

### 5.3 Suggested Files

```text
common/
  models.py
  enums.py
  exceptions.py
  permissions.py
  responses.py
  pagination.py
  dates.py
  services.py
  tests/
```

### 5.4 Key Classes

```text
TimeStampedModel
ActiveModel
AuditedServiceMixin
ServiceResult
DomainValidationError
PermissionDeniedForAction
```

### 5.5 Ownership

Technical architecture / backend platform team.

---

## 6. identity_access Module

### 6.1 Purpose

Handles user profiles, roles, permissions, and action-level access control.

Django auth remains the authentication base. This module extends it for operational RBAC.

### 6.2 Owned Tables / Models

```text
UserProfile
Role
PermissionAction
UserRole
RolePermission
```

### 6.3 Responsibilities

```text
user profile management
role assignment
action-level permission checking
factory/department-scoped access
shopfloor user flag
current user context
```

### 6.4 Services

```text
get_user_profile(user)
get_user_roles(user)
user_has_action_permission(user, action_code, factory=None, department=None)
assign_role_to_user(user, role, scope)
remove_role_from_user(user, role, scope)
```

### 6.5 APIs

```text
GET /api/v1/me
GET /api/v1/me/permissions
GET /api/v1/roles
GET /api/v1/permission-actions
```

Write APIs can be limited or admin-only in MVP.

### 6.6 Django Admin

Admin screens required for:

```text
UserProfile
Role
PermissionAction
UserRole
RolePermission
```

### 6.7 Permissions Managed

This module does not only expose permissions; it is the permission-checking foundation for all other modules.

### 6.8 Tests

```text
user with role can perform allowed action
user without role cannot perform restricted action
factory-scoped role cannot act outside factory
inactive user cannot act
shopfloor user sees limited actions
```

---

## 7. organization Module

### 7.1 Purpose

Owns organizational hierarchy and factory/workcenter structure.

### 7.2 Owned Models

```text
Factory
Department
Workcenter
ShiftCalendar
ShiftCalendarDay
FactoryHoliday
```

### 7.3 Responsibilities

```text
factory master
department master
workcenter master
shift calendar
holiday calendar
capacity calendar source
```

### 7.4 Services

```text
get_factory_calendar(factory, date_range)
get_workcenter_calendar(workcenter, date)
calculate_working_minutes(calendar, date)
is_working_day(factory, date)
```

### 7.5 APIs

```text
GET /api/v1/organization/factories
GET /api/v1/organization/departments
GET /api/v1/organization/workcenters
GET /api/v1/organization/calendars
```

### 7.6 Django Admin

Required for all organization masters.

### 7.7 Dependencies

Used by:

```text
planning
workcenters
production_release
sewing
washing
analytics
```

### 7.8 Tests

```text
factory calendar returns correct working days
holiday overrides shift calendar
inactive workcenter cannot be planned
workcenter capacity unit required
```

---

## 8. master_data Module

### 8.1 Purpose

Provides shared reference/master data that does not fit into more specific modules.

### 8.2 Owned Models

```text
PlanningThreshold
StageMaster
HandoverRule
SeverityMaster
StatusLookup
AttachmentMaster
MachineTypeMaster
```

Some master data may be owned by domain-specific apps. This module should not become a dumping ground. Only cross-domain reference data belongs here.

### 8.3 Responsibilities

```text
planning thresholds
global severity definitions
stage definitions
handover rules
global status lookup where configurable
```

### 8.4 Services

```text
get_threshold(code)
get_stage_config(stage_code)
get_handover_rule(from_stage, to_stage)
```

### 8.5 APIs

```text
GET /api/v1/master/thresholds
GET /api/v1/master/stages
GET /api/v1/master/handover-rules
```

### 8.6 Admin

Django Admin is primary UI.

### 8.7 Tests

```text
threshold lookup returns active value
missing threshold fails safe
inactive stage cannot be used
handover rule correctly validates source/target
```

---

# Part B: Order, Style, Material, and Fabric Modules

---

## 9. orders Module

### 9.1 Purpose

Owns customer orders, order lifecycle, milestones, size/color breakup, and order status.

### 9.2 Owned Models

```text
Customer
Buyer
ProductionOrder
OrderSizeColorBreakup
OrderMilestone
```

### 9.3 Responsibilities

```text
customer and buyer reference
order master
PO details
order quantity
shipment date
current lifecycle stage
risk status
owner assignment
milestone tracking
```

### 9.4 Services

```text
create_order()
update_order()
calculate_order_lifecycle_status(order)
calculate_order_risk_status(order)
update_order_stage(order, stage, reason)
assign_order_owner(order, user)
get_order_timeline(order)
```

### 9.5 Selectors

```text
list_active_orders(filters)
get_order_detail(order_id)
get_orders_at_risk()
get_orders_by_shipment_week()
get_order_dependencies(order)
```

### 9.6 APIs

```text
GET /api/v1/orders
POST /api/v1/orders
GET /api/v1/orders/{id}
PATCH /api/v1/orders/{id}
GET /api/v1/orders/{id}/timeline
GET /api/v1/orders/{id}/dependencies
PATCH /api/v1/orders/{id}/owner
```

### 9.7 Events Emitted

```text
order.created
order.updated
order.stage_changed
order.risk_changed
order.owner_changed
```

### 9.8 Consumed By

```text
pcd_readiness
planning
production_release
sewing
washing
wip_inventory
shipment
analytics
exceptions
```

### 9.9 Permissions

```text
orders.view
orders.create
orders.edit
orders.assign_owner
orders.change_stage
```

### 9.10 Admin

Django Admin should allow order reference review but planning operations should happen in frontend.

### 9.11 Tests

```text
order lifecycle calculated from downstream records
order risk updates when shipment buffer changes
order owner assignment respects permission
milestone actual date updates delay status
```

---

## 10. style_technical Module

### 10.1 Purpose

Owns style master, BOM, operation bulletin, routing, and style-level production method.

### 10.2 Owned Models

```text
Style
StyleVersion
MaterialMaster
BOMHeader
BOMLine
OperationMaster
OperationBulletin
OperationBulletinLine
```

### 10.3 Responsibilities

```text
style technical master
BOM versioning
operation master
operation bulletin versioning
SMV calculation
routing sequence
machine and skill requirements
style complexity
technical approval state
```

### 10.4 Services

```text
create_style()
approve_style()
create_bom_version()
approve_bom()
create_operation_bulletin()
calculate_total_smv(bulletin)
approve_operation_bulletin()
clone_bulletin_from_style()
get_style_planning_readiness(style)
```

### 10.5 Selectors

```text
list_styles()
get_style_detail()
get_approved_bom(style)
get_approved_operation_bulletin(style)
get_operation_bulletin_lines(bulletin)
get_style_complexity(style)
```

### 10.6 APIs

```text
GET /api/v1/styles
GET /api/v1/styles/{id}
GET /api/v1/styles/{id}/planning-readiness
GET /api/v1/operation-bulletins
POST /api/v1/operation-bulletins
GET /api/v1/operation-bulletins/{id}
POST /api/v1/operation-bulletins/{id}/approve
POST /api/v1/operation-bulletins/{id}/clone
GET /api/v1/boms
GET /api/v1/boms/{id}
POST /api/v1/boms/{id}/approve
```

### 10.7 Events Emitted

```text
style.approved
bom.approved
operation_bulletin.approved
operation_bulletin.version_created
```

### 10.8 Consumed By

```text
orders
materials_procurement
pcd_readiness
planning
sewing
washing
quality
analytics
```

### 10.9 Permissions

```text
style.view
style.edit
style.approve
bom.edit
bom.approve
bulletin.edit
bulletin.approve
```

### 10.10 Django Admin

Admin must support:

```text
Style
BOM header with BOM line inline
Operation master
Operation bulletin with operation line inline
```

Approved bulletins should be read-only. Changes should create new version.

### 10.11 Tests

```text
total SMV equals sum of operation lines
approved bulletin cannot be edited directly
style cannot be marked planning-ready without approved BOM and bulletin
operation sequence uniqueness enforced
```

---

## 11. materials_procurement Module

### 11.1 Purpose

Owns material requirements, procurement status, vendor ETA, shortage, and material readiness.

### 11.2 Owned Models

```text
Vendor
MaterialRequirement
MaterialPO
```

MaterialMaster may be owned by style_technical or a shared materials submodule. If separated later, keep ownership explicit.

### 11.3 Responsibilities

```text
material requirement calculation
vendor PO tracking
lead time and ETA
shortage calculation
procurement delay risk
material readiness by order/stage
```

### 11.4 Services

```text
calculate_material_requirements(order)
create_material_requirements_from_bom(order)
update_material_po_eta(po, eta)
calculate_material_readiness(order)
calculate_material_shortage(order)
detect_vendor_delay_risk(order)
```

### 11.5 Selectors

```text
get_material_status_by_order(order)
list_material_shortages(filters)
list_vendor_delays(filters)
get_materials_affecting_pcd(order)
```

### 11.6 APIs

```text
GET /api/v1/material-requirements
GET /api/v1/orders/{id}/material-status
POST /api/v1/orders/{id}/calculate-materials
GET /api/v1/material-pos
PATCH /api/v1/material-pos/{id}/eta
GET /api/v1/procurement/shortages
GET /api/v1/procurement/vendor-delays
```

### 11.7 Events Emitted

```text
material_requirement.created
material_po.eta_changed
material.shortage_detected
material.ready
material.delayed
```

### 11.8 Consumed By

```text
pcd_readiness
planning
production_release
exceptions
analytics
```

### 11.9 Permissions

```text
materials.view
materials.calculate
procurement.edit_po
procurement.update_eta
procurement.close_shortage
```

### 11.10 Tests

```text
material requirement calculated from BOM and wastage
shortage qty calculated correctly
ETA after PCD creates risk
material readiness updates PCD checklist
```

---

## 12. fabric_qc Module

### 12.1 Purpose

Owns fabric inward, fabric roll inspection, fabric QC status, and fabric QC impact on PCD.

### 12.2 Owned Models

```text
FabricLot
FabricRoll
FabricQCInspection
FabricQCParameter
```

### 12.3 Responsibilities

```text
fabric lot receipt
roll-wise fabric data
4-point inspection
width/GSM/shrinkage/skew/stretch/crocking checks
pass/fail/hold status
shade lot mapping
fabric QC blockers
```

### 12.4 Services

```text
record_fabric_lot_receipt()
record_fabric_roll()
submit_fabric_qc_inspection()
calculate_fabric_roll_qc_status()
calculate_fabric_lot_status()
update_pcd_fabric_qc_item(order)
```

### 12.5 Selectors

```text
list_fabric_lots_by_order(order)
get_fabric_qc_status(order)
get_pending_fabric_qc()
get_failed_fabric_rolls()
```

### 12.6 APIs

```text
GET /api/v1/fabric/lots
POST /api/v1/fabric/lots
GET /api/v1/fabric/rolls
POST /api/v1/fabric/rolls
POST /api/v1/fabric/qc-inspections
GET /api/v1/orders/{id}/fabric-qc-status
```

### 12.7 Events Emitted

```text
fabric.received
fabric_qc.passed
fabric_qc.failed
fabric_qc.hold
fabric_qc.waived
```

### 12.8 Consumed By

```text
pcd_readiness
wip_inventory
quality
exceptions
analytics
```

### 12.9 Permissions

```text
fabric.view
fabric.receive
fabric_qc.inspect
fabric_qc.approve
fabric_qc.waive
```

### 12.10 Tests

```text
failed QC blocks PCD
passed QC clears fabric QC PCD item
shade lot required before cutting
mandatory QC parameters enforced
```

---

# Part C: Planning and Release Modules

---

## 13. pcd_readiness Module

### 13.1 Purpose

Owns PCD readiness checklist, readiness status, conditional release, and release-to-cutting gate.

### 13.2 Owned Models

```text
PCDReadiness
PCDReadinessItem
```

### 13.3 Responsibilities

```text
build readiness checklist
calculate readiness status
block premature cutting
conditional release approval
PCD escalation
release-to-cutting validation
```

### 13.4 Services

```text
initialize_pcd_readiness(order)
build_default_checklist(order)
calculate_pcd_readiness(order)
update_checklist_item(order, item_code, status)
approve_conditional_release(order, reason, user)
release_to_cutting(order, user)
escalate_blocked_pcd_orders()
```

### 13.5 Selectors

```text
list_pcd_readiness(filters)
get_order_pcd_readiness(order)
get_blocked_pcd_orders()
get_pcd_due_this_week()
```

### 13.6 APIs

```text
GET /api/v1/pcd-readiness
GET /api/v1/orders/{id}/pcd-readiness
PATCH /api/v1/orders/{id}/pcd-readiness/items/{item_code}
POST /api/v1/orders/{id}/pcd-conditional-release
POST /api/v1/orders/{id}/release-to-cutting
```

### 13.7 Events Emitted

```text
pcd.initialized
pcd.item_updated
pcd.ready
pcd.blocked
pcd.escalated
pcd.conditional_release_approved
pcd.released_to_cutting
```

### 13.8 Consumed By

```text
planning
production_release
cutting
exceptions
analytics
```

### 13.9 Permissions

```text
pcd.view
pcd.update_item
pcd.approve_conditional_release
pcd.release_to_cutting
```

### 13.10 Tests

```text
all mandatory passed results in READY
mandatory pending results in BLOCKED
approved waiver results in CONDITIONALLY_READY
cutting release blocked if PCD not ready
```

---

## 14. planning Module

### 14.1 Purpose

Owns master/weekly planning, plan versions, planned work items, plan freeze, and plan impact previews.

### 14.2 Owned Models

```text
PlanVersion
PlannedWorkItem
PlanChangeRequest
```

### 14.3 Responsibilities

```text
weekly plan creation
work item assignment
capacity check
plan freeze
plan change control
impact preview
planning horizon management
```

### 14.4 Services

```text
create_plan_version(factory, horizon)
add_work_item_to_plan(plan, order, workcenter, dates, qty)
move_work_item(work_item, new_dates, new_workcenter)
calculate_plan_load(plan)
preview_plan_impact(change)
freeze_plan(plan, user)
request_plan_change(plan, change_payload)
approve_plan_change(change_request, user)
```

### 14.5 Selectors

```text
get_active_weekly_plan(factory, date_range)
get_planning_backlog(filters)
get_plan_work_items(plan)
get_overloaded_workcenters(plan)
get_orders_affected_by_plan_change(change)
```

### 14.6 APIs

```text
GET /api/v1/planning/weekly
POST /api/v1/planning/weekly
POST /api/v1/planning/weekly/assign
PATCH /api/v1/planning/work-items/{id}
POST /api/v1/planning/weekly/impact-preview
POST /api/v1/planning/weekly/{plan_id}/freeze
POST /api/v1/planning/change-requests
POST /api/v1/planning/change-requests/{id}/approve
```

### 14.7 Events Emitted

```text
plan.created
plan.work_item_added
plan.work_item_moved
plan.impact_previewed
plan.frozen
plan.change_requested
plan.change_approved
```

### 14.8 Dependencies

```text
orders
pcd_readiness
workcenters
sewing
washing
shipment
```

### 14.9 Permissions

```text
planning.view
planning.create
planning.edit
planning.freeze_weekly_plan
planning.request_change
planning.approve_change
```

### 14.10 Tests

```text
plan freeze fails with critical overload
work item load updates workcenter utilization
impact preview identifies affected shipments
frozen plan requires change request for modification
```

---

## 15. production_release Module

### 15.1 Purpose

Owns daily release logic and executable production release events.

### 15.2 Owned Models

```text
ProductionRelease
ReleaseValidationItem
```

### 15.3 Responsibilities

```text
daily release validation
release creation
release blocking
exception release
release audit
release status tracking
```

### 15.4 Services

```text
get_daily_release_candidates(date, factory)
validate_release(order, release_type)
create_release(order, release_type, qty, user)
block_release(order, reason, owner)
approve_exception_release(release, reason, user)
complete_release(release, user)
```

### 15.5 Selectors

```text
list_today_releases(filters)
get_ready_to_release()
get_blocked_releases()
get_released_today()
```

### 15.6 APIs

```text
GET /api/v1/releases/daily
GET /api/v1/releases/{id}
POST /api/v1/releases
PATCH /api/v1/releases/{id}/hold
POST /api/v1/releases/{id}/approve-exception
POST /api/v1/releases/{id}/complete
```

### 15.7 Events Emitted

```text
release.validated
release.blocked
release.created
release.exception_approved
release.completed
```

### 15.8 Dependencies

```text
orders
pcd_readiness
planning
workcenters
wip_inventory
quality
exceptions
```

### 15.9 Permissions

```text
release.view
release.create
release.block
release.override_blocked_release
release.complete
```

### 15.10 Tests

```text
release blocked if previous process incomplete
release blocked if QC hold open
exception release requires authorized permission
release updates order stage
```

---

## 16. workcenters Module

### 16.1 Purpose

Owns load, capacity, utilization, queues, and constraint detection across workcenters.

### 16.2 Owned Models

```text
WorkcenterCapacityDay
```

Primary workcenter master is owned by organization, but this module owns operational capacity calculations and snapshots.

### 16.3 Responsibilities

```text
capacity calculation
planned load
actual load
queue quantity
WIP ageing by workcenter
constraint status
constraint ranking
affected order detection
```

### 16.4 Services

```text
calculate_workcenter_capacity(workcenter, date)
calculate_workcenter_load(workcenter, date_range)
calculate_constraint_status(workcenter, date)
identify_current_constraint(factory, date)
recalculate_capacity_snapshot(date)
```

### 16.5 Selectors

```text
get_workcenter_load_dashboard(filters)
get_workcenter_queue(workcenter)
get_affected_orders(workcenter)
get_current_constraint(factory)
```

### 16.6 APIs

```text
GET /api/v1/workcenters/load
GET /api/v1/workcenters/{id}/queue
GET /api/v1/workcenters/{id}/affected-orders
GET /api/v1/workcenters/current-constraint
```

### 16.7 Events Emitted

```text
workcenter.overloaded
workcenter.constraint_changed
workcenter.capacity_recalculated
```

### 16.8 Dependencies

```text
organization
planning
production_release
wip_inventory
sewing
washing
quality
```

### 16.9 Permissions

```text
workcenter.view_load
workcenter.view_queue
workcenter.update_capacity
```

### 16.10 Tests

```text
utilization thresholds calculate correctly
queue maps from WIP stages
current constraint changes when wash load exceeds threshold
capacity reduced by downtime
```

---

# Part D: Production Execution Modules

---

## 17. cutting Module

### 17.1 Purpose

Owns cutting execution, cut bundles, cut panel QC, and issue-to-sewing flow.

### 17.2 Owned Models

Recommended future models:

```text
CuttingOrder
CuttingBundle
CuttingOutput
CutPanelQC
```

MVP may use production_release + WIP movement until full cutting module is built.

### 17.3 Responsibilities

```text
cutting release consumption
cut quantity capture
bundle creation
shade-lot discipline
cut QC status
issue to sewing
```

### 17.4 Services

```text
create_cutting_order_from_release(release)
record_cutting_output(order, qty, user)
create_cut_bundles(order, bundle_payload)
issue_bundles_to_sewing(order, qty, user)
```

### 17.5 APIs

```text
GET /api/v1/cutting/orders
POST /api/v1/cutting/output
POST /api/v1/cutting/bundles
POST /api/v1/cutting/issue-to-sewing
```

### 17.6 Events Emitted

```text
cutting.started
cutting.output_recorded
bundle.created
cut_panels.issued_to_sewing
```

### 17.7 Dependencies

```text
pcd_readiness
production_release
wip_inventory
quality
```

### 17.8 Permissions

```text
cutting.view
cutting.record_output
cutting.issue_to_sewing
```

### 17.9 Tests

```text
cut output cannot exceed fabric allocation without override
issue to sewing updates WIP
shade lot retained in bundle reference
```

---

## 18. sewing Module

### 18.1 Purpose

Owns sewing line loading, sewing execution, output capture, line realignment, line balance, and sewing efficiency.

### 18.2 Owned Models

```text
ProductionLine
Machine
LineMachineAssignment
OperatorSkill
SewingLineLoading
SewingOutputEntry
LineRealignment
LineBalancePlan
LineBalanceOperation
```

Some master tables may be placed in organization/master_data but logically consumed by this module.

### 18.3 Responsibilities

```text
line loading
sewing capacity calculation
line target calculation
hourly output capture
net-good output calculation
line balance
line realignment
operator/machine gap analysis
sewing WIP updates
```

### 18.4 Services

```text
create_line_loading(order, line, bulletin)
calculate_line_capacity(line, style, date)
record_sewing_output(payload, user)
calculate_net_good_output(entry)
get_line_hourly_performance(line, date)
preview_line_realignment(line, bulletin)
approve_line_realignment(realignment, user)
calculate_line_balance(plan)
```

### 18.5 Selectors

```text
list_line_loading(filters)
get_line_detail(line)
get_line_output(line, date)
get_line_bottleneck(line, order)
get_line_efficiency(line, period)
```

### 18.6 APIs

```text
GET /api/v1/sewing/line-loading
GET /api/v1/sewing/lines/{id}
GET /api/v1/sewing/lines/{id}/hourly-output
POST /api/v1/sewing/output
POST /api/v1/sewing/line-realignment/preview
POST /api/v1/sewing/line-realignment/{id}/approve
GET /api/v1/sewing/line-balance/{id}
POST /api/v1/sewing/line-balance
```

### 18.7 Events Emitted

```text
sewing.line_loaded
sewing.output_recorded
sewing.shortfall_detected
sewing.line_rebalanced
sewing.realignment_approved
```

### 18.8 Dependencies

```text
orders
style_technical
planning
production_release
workcenters
wip_inventory
quality
exceptions
analytics
```

### 18.9 Permissions

```text
sewing.view
sewing.load_line
sewing.record_output
sewing.realign_line
sewing.approve_realignment
sewing.view_efficiency
```

### 18.10 Tests

```text
net-good output calculated correctly
line capacity uses SMV and manpower
output updates WIP
underperformance creates exception
realignment detects machine and skill gap
```

---

## 19. washing Module

### 19.1 Purpose

Owns wash route, wash planning, wash batch execution, rewash, and release to finishing.

### 19.2 Owned Models

```text
WashRoute
WashRouteStep
WashBatch
WashBatchEvent
```

### 19.3 Responsibilities

```text
wash route master
wash batch creation
wash queue
wash step execution
dry/wet process tracking
rewash decision
wash capacity load
post-wash QC linkage
release to finishing
```

### 19.4 Services

```text
create_wash_batch(order, qty, route, shade_lot)
assign_wash_machine(batch, machine)
start_wash_step(batch, step, user)
complete_wash_step(batch, step, user)
mark_rewash_required(batch, reason, qty, user)
release_batch_to_finishing(batch, user)
calculate_wash_load(date_range)
```

### 19.5 Selectors

```text
get_wash_queue(filters)
get_wash_batch_detail(batch)
get_wash_board(date_range)
get_rewash_batches()
get_wash_capacity_impact()
```

### 19.6 APIs

```text
GET /api/v1/wash/queue
GET /api/v1/wash/batches
POST /api/v1/wash/batches
GET /api/v1/wash/batches/{id}
POST /api/v1/wash/batches/{id}/events
POST /api/v1/wash/batches/{id}/rewash
POST /api/v1/wash/batches/{id}/release-to-finishing
```

### 19.7 Events Emitted

```text
wash.batch_created
wash.step_started
wash.step_completed
wash.batch_held
wash.rewash_required
wash.released_to_finishing
```

### 19.8 Dependencies

```text
orders
style_technical
production_release
workcenters
wip_inventory
quality
exceptions
shipment
```

### 19.9 Permissions

```text
wash.view
wash.create_batch
wash.execute_step
wash.mark_rewash
wash.release_to_finishing
```

### 19.10 Tests

```text
wash batch cannot exceed available sewn WIP
rewash creates additional load
release to finishing requires post-wash QC if configured
shade lot retained in batch
```

---

## 20. quality Module

### 20.1 Purpose

Owns QC inspections, defects, quality holds, and quality release.

### 20.2 Owned Models

```text
DefectCode
QCInspection
QCDefect
QualityHold
```

If QualityHold is not separate in the first schema, it can be represented through QCInspection + WIP hold + exception. A separate table is recommended for maturity.

### 20.3 Responsibilities

```text
QC inspection capture
defect capture
QC hold
QC release
defect categorization
quality impact on WIP and shipment
quality-adjusted capacity
```

### 20.4 Services

```text
create_qc_inspection(payload, user)
record_defect(inspection, defect)
create_quality_hold(order, stage, reason)
release_quality_hold(hold, user)
calculate_defect_rate(order_or_line)
```

### 20.5 Selectors

```text
list_qc_inspections(filters)
get_quality_holds(order)
get_defects_by_stage(order)
get_quality_dashboard(filters)
```

### 20.6 APIs

```text
POST /api/v1/qc/inspections
GET /api/v1/qc/inspections
POST /api/v1/qc/holds
POST /api/v1/qc/holds/{id}/release
GET /api/v1/qc/defects
```

### 20.7 Events Emitted

```text
qc.inspection_created
qc.defect_recorded
qc.hold_created
qc.hold_released
qc.rework_required
```

### 20.8 Dependencies

```text
orders
sewing
washing
wip_inventory
rework_recovery
exceptions
shipment
analytics
```

### 20.9 Permissions

```text
quality.view
quality.inspect
quality.create_hold
quality.release_hold
quality.override
```

### 20.10 Tests

```text
critical defect creates hold
hold blocks WIP movement
hold release updates WIP
defect rate triggers quality exception
```

---

## 21. wip_inventory Module

### 21.1 Purpose

Owns holistic pipeline WIP, WIP movement, WIP ageing, and quantity reconciliation.

### 21.2 Owned Models

```text
WIPItem
WIPMovement
```

### 21.3 Responsibilities

```text
pipeline WIP inventory
stage-wise quantity
WIP ageing
blocked WIP
WIP before constraint
WIP movement validation
quantity reconciliation
WIP shipment risk
```

### 21.4 Services

```text
create_wip_item(order, stage, qty)
move_wip(order, from_stage, to_stage, qty, user)
hold_wip(wip_item, reason, owner)
release_wip(wip_item, user)
calculate_wip_ageing()
get_pipeline_wip(filters)
reconcile_order_quantities(order)
```

### 21.5 Selectors

```text
get_wip_by_stage(stage)
get_pipeline_dashboard(filters)
get_ageing_wip(filters)
get_wip_before_workcenter(workcenter)
get_order_wip(order)
get_reconciliation(order)
```

### 21.6 APIs

```text
GET /api/v1/wip
GET /api/v1/wip/pipeline
GET /api/v1/wip/pipeline/{stage}
POST /api/v1/wip/move
POST /api/v1/wip/hold
POST /api/v1/wip/release
GET /api/v1/wip/reconciliation/{order_id}
```

### 21.7 Events Emitted

```text
wip.created
wip.moved
wip.held
wip.released
wip.ageing_detected
wip.reconciliation_gap_detected
```

### 21.8 Dependencies

```text
orders
production_release
cutting
sewing
washing
quality
shipment
exceptions
```

### 21.9 Permissions

```text
wip.view
wip.move
wip.hold
wip.release
wip.adjust
wip.view_reconciliation
```

### 21.10 Tests

```text
movement blocked if source qty insufficient
WIP ageing severity calculated correctly
reconciliation detects impossible quantity
WIP before current constraint calculated correctly
```

---

## 22. rework_recovery Module

### 22.1 Purpose

Owns rework orders and recovery actions tied to exceptions, QC, wash, sewing, and shipment risks.

### 22.2 Owned Models

```text
ReworkOrder
RecoveryAction
```

### 22.3 Responsibilities

```text
rework creation
rework capacity impact
rework assignment
rework closure
recovery action tracking
recovery impact summary
```

### 22.4 Services

```text
create_rework_order(order, type, qty, source)
assign_rework(rework, owner)
complete_rework(rework, user)
create_recovery_action(exception, action_type, owner)
update_recovery_action(action, status)
calculate_rework_capacity_impact(rework)
```

### 22.5 APIs

```text
GET /api/v1/rework
POST /api/v1/rework
PATCH /api/v1/rework/{id}
POST /api/v1/rework/{id}/complete
GET /api/v1/recovery-actions
POST /api/v1/recovery-actions
PATCH /api/v1/recovery-actions/{id}
```

### 22.6 Events Emitted

```text
rework.created
rework.assigned
rework.completed
recovery_action.created
recovery_action.completed
```

### 22.7 Dependencies

```text
quality
washing
sewing
wip_inventory
exceptions
shipment
```

### 22.8 Permissions

```text
rework.view
rework.create
rework.assign
rework.complete
recovery.create
recovery.complete
```

### 22.9 Tests

```text
rework consumes capacity
rework completion updates WIP
recovery action links to exception
overdue recovery action escalates exception
```

---

# Part E: Exception, Shipment, Analytics, Audit

---

## 23. exceptions Module

### 23.1 Purpose

Owns exception creation, auto-alerts, assignment, escalation, closure, and notification triggers.

### 23.2 Owned Models

```text
ExceptionRecord
ExceptionComment
```

RecoveryAction may be owned here or rework_recovery. Keep ownership clear. Recommended: exceptions owns exception lifecycle; rework_recovery owns recovery actions.

### 23.3 Responsibilities

```text
manual exception creation
auto exception generation
severity calculation
owner assignment
due date
escalation
closure
comments
notification trigger
```

### 23.4 Services

```text
create_exception(category, severity, order, description)
auto_generate_exception(rule_code, context)
assign_exception(exception, owner)
escalate_exception(exception)
close_exception(exception, note, user)
reopen_exception(exception, reason, user)
run_exception_rules()
```

### 23.5 Selectors

```text
list_exceptions(filters)
get_exception_detail(exception)
get_exceptions_by_owner(user)
get_shipment_impacting_exceptions()
get_overdue_exceptions()
```

### 23.6 APIs

```text
GET /api/v1/exceptions
POST /api/v1/exceptions
GET /api/v1/exceptions/{id}
PATCH /api/v1/exceptions/{id}
POST /api/v1/exceptions/{id}/comments
POST /api/v1/exceptions/{id}/escalate
POST /api/v1/exceptions/{id}/close
POST /api/v1/exceptions/{id}/reopen
```

### 23.7 Events Emitted

```text
exception.created
exception.assigned
exception.escalated
exception.closed
exception.reopened
```

### 23.8 Dependencies

Consumed by almost all modules.

### 23.9 Permissions

```text
exception.view
exception.create
exception.assign
exception.escalate
exception.close
exception.close_critical
exception.reopen
```

### 23.10 Tests

```text
critical exception requires owner and due date
closed exception requires closure note
overdue exception escalates
duplicate auto-exceptions are not spammed
```

---

## 24. shipment Module

### 24.1 Purpose

Owns shipment readiness, shipment checklist, dispatch readiness, short shipment, and shipment status.

### 24.2 Owned Models

```text
ShipmentReadiness
ShipmentReadinessItem
```

Future:

```text
Shipment
ShipmentLine
ShipmentDocument
```

### 24.3 Responsibilities

```text
shipment readiness checklist
final QC/AQL status
packed quantity
short quantity
documentation status
forwarder booking
mark shipment ready
dispatch status
split shipment decision
```

### 24.4 Services

```text
initialize_shipment_readiness(order)
calculate_shipment_readiness(order)
update_shipment_checklist_item(order, item_code, status)
mark_shipment_ready(order, user)
block_shipment(order, reason)
approve_split_shipment(order, qty, user)
calculate_short_qty(order)
```

### 24.5 Selectors

```text
list_shipment_readiness(filters)
get_order_shipment_readiness(order)
get_shipments_due_this_week()
get_at_risk_shipments()
```

### 24.6 APIs

```text
GET /api/v1/shipments/readiness
GET /api/v1/orders/{id}/shipment-readiness
PATCH /api/v1/orders/{id}/shipment-checklist
POST /api/v1/orders/{id}/mark-shipment-ready
POST /api/v1/orders/{id}/split-shipment
POST /api/v1/orders/{id}/shipment-block
```

### 24.7 Events Emitted

```text
shipment.readiness_initialized
shipment.checklist_updated
shipment.blocked
shipment.ready
shipment.dispatched
shipment.split_approved
```

### 24.8 Dependencies

```text
orders
wip_inventory
quality
exceptions
analytics
```

### 24.9 Permissions

```text
shipment.view
shipment.update_checklist
shipment.mark_ready
shipment.approve_split
shipment.block
```

### 24.10 Tests

```text
production complete does not equal shipment ready
documents pending blocks readiness
packed short qty creates risk
mark ready requires all mandatory checklist items
```

---

## 25. analytics Module

### 25.1 Purpose

Owns analytical snapshots, KPI calculations, and performance reporting.

### 25.2 Owned Models

```text
DailyOrderStatusSnapshot
DailyWorkcenterLoadSnapshot
DailyLineEfficiencySnapshot
DailyWIPPipelineSnapshot
DailyExceptionSnapshot
```

### 25.3 Responsibilities

```text
daily snapshots
OTIF
utilization
line efficiency
plan adherence
WIP ageing
wash rework
exception ageing
operation bulletin performance
vendor delay analytics
```

### 25.4 Services

```text
create_daily_order_snapshot(date)
create_workcenter_load_snapshot(date)
create_line_efficiency_snapshot(date)
create_wip_snapshot(date)
calculate_otif(filters)
calculate_resource_utilization(filters)
calculate_operation_bulletin_performance(filters)
```

### 25.5 APIs

```text
GET /api/v1/analytics/otif
GET /api/v1/analytics/utilization
GET /api/v1/analytics/line-efficiency
GET /api/v1/analytics/wip-ageing
GET /api/v1/analytics/wash-rework
GET /api/v1/analytics/exceptions
GET /api/v1/analytics/operation-bulletin-performance
```

### 25.6 Events

Primarily Celery scheduled jobs.

### 25.7 Permissions

```text
analytics.view
analytics.export
analytics.management_view
```

### 25.8 Tests

```text
OTIF calculation correct
net-good efficiency calculation correct
snapshot job idempotent
analytics filters return expected data
```

---

## 26. audit_governance Module

### 26.1 Purpose

Owns audit events and governance traceability.

### 26.2 Owned Models

```text
AuditEvent
```

Future:

```text
StateTransitionLog
ApprovalLog
```

### 26.3 Responsibilities

```text
audit event creation
audit selectors
entity history
critical action traceability
before/after capture
```

### 26.4 Services

```text
write_audit_event(entity, action, old_value, new_value, user, reason)
get_entity_audit(entity_type, entity_id)
```

### 26.5 APIs

```text
GET /api/v1/audit/{entity_type}/{entity_id}
```

### 26.6 Permissions

```text
audit.view
audit.export
```

### 26.7 Tests

```text
critical actions create audit
audit stores old/new values
unauthorized user cannot view restricted audit
```

---

## 27. integrations Module

### 27.1 Purpose

Owns integration with ERP, FastReact, Excel imports, HR, shipment/logistics, and external systems.

### 27.2 Owned Models

Recommended:

```text
IntegrationSource
IntegrationRun
IntegrationError
ImportBatch
ImportRowError
```

### 27.3 Responsibilities

```text
Excel import
ERP sync
FastReact mapping
HR attendance import
shipment status import/export
import validation
sync failure handling
stale data detection
```

### 27.4 Services

```text
run_excel_import(import_type, file)
validate_import_batch(batch)
apply_import_batch(batch)
run_erp_order_sync()
run_fastreact_sync()
log_integration_error()
detect_stale_integration(source)
```

### 27.5 APIs

```text
POST /api/v1/imports/{import_type}
GET /api/v1/imports/{batch_id}
GET /api/v1/integrations/status
POST /api/v1/integrations/{source}/run
```

### 27.6 Permissions

```text
integration.view
integration.run
integration.import
integration.approve_import
```

### 27.7 Tests

```text
invalid import rows rejected
import audit created
failed sync creates system exception
duplicate order import handled safely
```

---

# Part F: Async Jobs and Event Handling

---

## 28. Celery Job Ownership

### 28.1 Scheduled Jobs

| Job | Owning Module |
|---|---|
| hourly WIP ageing recalculation | wip_inventory |
| hourly shipment risk recalculation | shipment / orders |
| daily workcenter load snapshot | workcenters / analytics |
| daily line efficiency snapshot | sewing / analytics |
| daily WIP snapshot | wip_inventory / analytics |
| exception escalation job | exceptions |
| integration sync jobs | integrations |
| stale data detection | integrations / exceptions |

### 28.2 Job Design Rules

```text
jobs must be idempotent
jobs must log start/end/failure
jobs must not silently fail
jobs should create system exception on repeated failure
long jobs should be chunked
```

---

## 29. Domain Event Handling

Avoid uncontrolled Django signals for core flows. Use explicit service calls.

Example:

```python
def record_sewing_output(payload, user):
    entry = create_output_entry(payload, user)
    wip_inventory.services.update_from_sewing_output(entry)
    sewing.services.recalculate_line_metrics(entry.line, entry.entry_time.date())
    exceptions.services.check_sewing_shortfall(entry.line)
    audit_governance.services.write_audit_event(...)
    return entry
```

This is easier to test and govern than hidden signal chains.

---

# Part G: Module Dependency Map

---

## 30. Dependency Principles

Dependencies should flow from stable foundations to execution modules.

Recommended low-level modules:

```text
common
identity_access
organization
master_data
audit_governance
```

Domain modules should depend on these but not vice versa.

### 30.1 Simplified Dependency Flow

```text
identity_access
organization
master_data
style_technical
orders
materials_procurement
fabric_qc
pcd_readiness
planning
production_release
cutting/sewing/washing/quality
wip_inventory
exceptions
shipment
analytics
integrations
```

### 30.2 Avoid Circular Dependencies

Example problem:

```text
exceptions imports shipment
shipment imports exceptions
```

Solution:

```text
use service interfaces
or dependency inversion through event/notification services
```

---

# Part H: Backend Folder Standards

---

## 31. Recommended App File Structure

Each app should follow:

```text
app_name/
  __init__.py
  apps.py
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
    test_models.py
    test_services.py
    test_api.py
```

For larger modules:

```text
services/
  readiness.py
  calculations.py
  transitions.py
selectors/
  dashboard.py
  detail.py
```

---

## 32. Serializer Rules

Serializers should handle:

```text
request validation
response shape
field conversion
```

Serializers should not:

```text
calculate capacity
change lifecycle state
create audit events
apply business transitions
```

---

## 33. Selector Rules

Selectors should handle read/query logic.

Examples:

```text
get_order_detail(order_id)
list_pcd_blocked_orders(filters)
get_workcenter_load(filters)
get_pipeline_wip(filters)
```

Selectors should avoid side effects.

---

## 34. Service Rules

Services own:

```text
business actions
state transitions
calculations
audit creation
exception triggers
WIP movements
```

Services should be unit-testable.

---

# Part I: API Routing Structure

---

## 35. Recommended URL Organization

```text
/api/v1/auth/
/api/v1/me/
/api/v1/orders/
/api/v1/styles/
/api/v1/materials/
/api/v1/fabric/
/api/v1/pcd-readiness/
/api/v1/planning/
/api/v1/releases/
/api/v1/workcenters/
/api/v1/cutting/
/api/v1/sewing/
/api/v1/wash/
/api/v1/qc/
/api/v1/wip/
/api/v1/rework/
/api/v1/exceptions/
/api/v1/shipments/
/api/v1/analytics/
/api/v1/integrations/
/api/v1/audit/
```

---

# Part J: Testing Obligations by Module

---

## 36. Minimum Test Types

Every module should have:

```text
model tests
service tests
API tests
permission tests for critical actions
```

Calculation-heavy modules require:

```text
calculation unit tests
edge-case tests
```

Workflow-heavy modules require:

```text
state transition tests
audit tests
```

---

## 37. Critical Module Test Requirements

| Module | Must Test |
|---|---|
| pcd_readiness | blocked/ready/conditional/release |
| planning | load, freeze, impact preview |
| production_release | validation and exception release |
| sewing | capacity, net-good output, realignment |
| washing | batch, step, rewash, release |
| wip_inventory | movement, ageing, reconciliation |
| exceptions | generation, escalation, closure |
| shipment | readiness checklist, short qty |
| identity_access | permission enforcement |
| audit_governance | audit for critical actions |

---

# Part K: Implementation Phasing by Backend Module

---

## 38. Phase 1: Foundation

Modules:

```text
common
identity_access
organization
master_data
audit_governance basic
```

Deliverables:

```text
Django project
Docker backend
PostgreSQL
Django Admin
RBAC
factory/workcenter/calendar
audit helper
OpenAPI
```

---

## 39. Phase 2: Orders and Technical Masters

Modules:

```text
orders
style_technical
materials_procurement basic
```

Deliverables:

```text
order lifecycle
customer/buyer/style
BOM
operation master
operation bulletin
material requirement placeholder
```

---

## 40. Phase 3: PCD and Fabric

Modules:

```text
fabric_qc
pcd_readiness
production_release basic
```

Deliverables:

```text
fabric inward/QC
PCD checklist
PCD readiness
release to cutting
```

---

## 41. Phase 4: Planning and Capacity

Modules:

```text
planning
workcenters
production_release full
```

Deliverables:

```text
weekly planning
plan freeze
workcenter load
daily release validation
```

---

## 42. Phase 5: Sewing and Line Routing

Modules:

```text
sewing
style_technical extended
```

Deliverables:

```text
line loading
sewing output
operation bulletin performance
line realignment
line balance
```

---

## 43. Phase 6: Wash and WIP

Modules:

```text
washing
wip_inventory
```

Deliverables:

```text
wash route
wash batch
rewash
pipeline WIP
WIP movement
reconciliation
```

---

## 44. Phase 7: Quality, Exceptions, Shipment

Modules:

```text
quality
rework_recovery
exceptions
shipment
```

Deliverables:

```text
QC defects
holds
rework
exception board
shipment readiness
```

---

## 45. Phase 8: Shopfloor and Analytics

Modules:

```text
integrations
analytics
mobile APIs in sewing/washing/quality/wip
```

Deliverables:

```text
handheld capture APIs
snapshots
analytics
integration imports
stale data detection
```

---

# Part L: Risks and Design Warnings

---

## 46. Backend Risks

### 46.1 God Module Risk

Risk:

```text
putting all logic into planning module
```

Mitigation:

```text
clear module ownership
services per domain
shared calculation helpers only when truly generic
```

### 46.2 Serializer Logic Risk

Risk:

```text
business logic inside DRF serializers
```

Mitigation:

```text
serializers validate shape only
services execute logic
```

### 46.3 Signal Spaghetti Risk

Risk:

```text
uncontrolled Django signals triggering hidden logic
```

Mitigation:

```text
explicit service orchestration
```

### 46.4 Excel Persistence Risk

Risk:

```text
backend APIs do not support the real operational workflow, so users keep Excel
```

Mitigation:

```text
build daily release, WIP, shopfloor capture, and exceptions early
```

### 46.5 Weak Audit Risk

Risk:

```text
overrides happen without traceability
```

Mitigation:

```text
audit service mandatory for critical transitions
```

---

## 47. Non-Negotiable Backend Rules

```text
1. Django Admin is for RBAC and master data, not planner workflow.
2. Business logic belongs in services.
3. Every critical transition must be permission-checked.
4. Every critical transition must be audited.
5. Calculations must be testable.
6. Status values must be controlled enums/lookups.
7. PCD readiness must gate cutting release.
8. Rewash must consume capacity.
9. WIP movement must preserve quantity integrity.
10. Shipment readiness must not be inferred from production completion alone.
```

---

## 48. Summary

The backend should be built as a modular Django platform with clear domain ownership.

The most important backend modules are:

```text
orders
style_technical
pcd_readiness
planning
production_release
workcenters
sewing
washing
wip_inventory
quality
exceptions
shipment
analytics
audit_governance
identity_access
```

Each module must include models, services, selectors, APIs, permissions, admin configuration, events, and tests.

The success of the backend depends on disciplined separation of concerns:

```text
Models persist data.
Selectors read data.
Services execute business logic.
Views expose APIs.
Admin manages configuration.
Celery runs async jobs.
Audit records critical actions.
```

This structure will allow the Eratex platform to grow from MVP into a mature planning and execution control system without becoming an ungoverned ERP-style codebase.
