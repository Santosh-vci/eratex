# 25. Common Documentation Spine and Phase-wise Build Plan
# Eratex Planning and Scheduling Platform

**Company:** Eratex  
**Product:** Planning and Scheduling Tool for Denim Bottoms + Chinos Manufacturing  
**Document Type:** Common Documentation Spine + Integrated Build Plan  
**Date:** 2026-05-27  
**Source Stack Reviewed:** BRD, numbered docs 01-24, and `docs/frontend_ui` screen prototypes  

---

## 1. Purpose

This document consolidates the existing Eratex documentation stack into one common reference spine and converts it into an integrated phase-wise build plan.

It does not replace the detailed specifications. It provides the shared map that implementation teams should use when turning the documentation pack into actual backend, frontend, data, QA, integration, and rollout work.

The spine should be used for:

- backlog structure
- sprint planning
- API and UI traceability
- implementation ownership
- QA coverage
- readiness gates
- pilot and rollout sequencing

---

## 2. Stocktake Summary

The documentation stack is already broad and coherent. It contains:

- A BRD under `docs/brd`
- 24 numbered Markdown specifications under `docs`
- backend, frontend, data, governance, QA, deployment, analytics, integration, security, audit, and seed-data documents
- existing backend and frontend phase-wise plans
- a governance spine and implementation readiness checklist
- a UI prototype pack under `docs/frontend_ui`
- 39 UI prototype folders with `code.html` and/or `screen.png`
- UI thesis, design system, ecosystem handoff, line-routing/WIP addendum, and handheld/live-capture addendum

The core product thesis is consistent across the stack:

```text
Order
-> Readiness
-> Plan
-> Release
-> Execute
-> Capture actuals
-> Update WIP
-> Detect exception
-> Recover
-> Ship
-> Analyze
-> Improve
```

The build must treat this loop as the operating backbone of the product.

---

## 3. Common Spine Name

Use the following common spine name for the full documentation and implementation stack:

```text
Eratex Operating Spine
```

Short reference:

```text
EOS
```

Definition:

```text
The Eratex Operating Spine is the governed product, data, workflow, UI, and delivery model that converts confirmed demand into executable production control with live WIP truth, controlled releases, exception ownership, recovery action, shipment readiness, and analytics learning.
```

Every feature, API, screen, import, calculation, report, permission, and test should map back to one or more EOS nodes.

---

## 4. EOS Reference Nodes

Use these nodes when writing backlog items, implementation tickets, QA cases, and release notes.

| EOS Node | Name | Main Responsibility | Primary Source Docs |
|---|---|---|---|
| EOS-00 | Product thesis and governance | Business problem, MVP boundary, operating rules | BRD, 01, 23, 24 |
| EOS-01 | Technical foundation | Architecture, stack, repository, API envelope, DevOps baseline | 01, 05, 06, 18, 21, 22 |
| EOS-02 | Master and technical data | Customers, styles, BOM, materials, workcenters, lines, machines, OB, wash routes | 02, 03, 09, 10 |
| EOS-03 | Order and pre-production readiness | Orders, material readiness, fabric QC, PCD gate, procurement blockers | BRD, 02, 04, 05, 06 |
| EOS-04 | Planning and production release | Weekly planning, capacity, workcenter load, daily release, plan freeze | 04, 06, 07, 13 |
| EOS-05 | Production execution | Cutting, sewing, line loading, routing, line realignment, net-good output | 08, 09, 12 |
| EOS-06 | Wash and WIP truth | Wash planning, wash execution, rewash, WIP movement, reconciliation, ageing | 08, 10, 12 |
| EOS-07 | Quality, exceptions, recovery, shipment | QC holds, defects, exception ownership, recovery actions, shipment readiness | 11, 14, 17 |
| EOS-08 | Shopfloor live capture | Mobile/PWA actuals, handover, downtime, offline sync, shift closure | 12, UI handheld addendum |
| EOS-09 | Analytics and management control | Snapshots, OTIF, utilization, efficiency, control tower, simulations | 14, 20 |
| EOS-10 | Integration and migration | ERP/FastReact/Excel imports, staging, dry-run, source-of-truth rules | 15, 18 |
| EOS-11 | Security, audit, compliance | RBAC, action permissions, audit event trail, approvals, traceability | 16, 17, 23 |
| EOS-12 | QA, readiness, rollout | Seed data, test strategy, readiness gates, UAT, pilot, production hardening | 19, 20, 24 |

Recommended ticket label format:

```text
EOS-04 / planning / weekly-plan-freeze
EOS-06 / wip / stage-reconciliation
EOS-08 / mobile / offline-output-sync
```

---

## 5. Documentation Stack Map

### 5.1 Business and Governance Layer

Use this layer to decide whether a feature should exist and how it must be governed.

| Document | Role |
|---|---|
| `docs/brd/Eratex_Planning_Scheduling_Tool_BRD.md` | Business objectives, pain points, MVP and mature scope |
| `docs/01_Technical_Architecture_Spine_Eratex.md` | Architecture thesis and high-level build architecture |
| `docs/23_Governance_Spine_Document.md` | Non-negotiable product, data, API, domain, and release rules |
| `docs/24_Implementation_Readiness_Checklist.md` | Gate-based implementation readiness scoring |

### 5.2 Data, Domain, API, and Event Layer

Use this layer to define persistence, services, APIs, state transitions, calculations, and cross-module behavior.

| Document | Role |
|---|---|
| `docs/02_Data_Model_Table_Schemas_Eratex.md` | Core schema direction and quantity discipline |
| `docs/03_Master_Data_Specification_Eratex.md` | Master data ownership, validation, approval, and usage |
| `docs/04_Planning_Logic_Calculation_Flows_Eratex.md` | Backend-owned calculations and planning rules |
| `docs/05_Backend_Domain_Module_Specification_Eratex.md` | Django app boundaries, services, selectors, modules |
| `docs/06_API_Data_Contracts_Eratex.md` | REST API envelope, actions, filters, payloads, errors |
| `docs/07_Event_State_Transition_Specification_Eratex.md` | State transitions, audit/event payloads, recalculation triggers |

### 5.3 Operational Domain Layer

Use this layer to build the factory process itself.

| Document | Role |
|---|---|
| `docs/08_WIP_Inventory_Reconciliation_Specification_Eratex.md` | WIP stages, movements, reconciliation, ageing |
| `docs/09_Line_Routing_Operation_Bulletin_Specification_Eratex.md` | Operation bulletin, routing, line balancing, realignment |
| `docs/10_Wash_Planning_Execution_Specification_Eratex.md` | Wash route, batch execution, rewash, wash constraints |
| `docs/11_Exception_Alert_Recovery_Specification_Eratex.md` | Exception lifecycle, owner, severity, escalation, recovery |
| `docs/12_Handheld_Shopfloor_Capture_Technical_Spec.md` | PWA/mobile capture, offline sync, shopfloor events |

### 5.4 Experience, Intelligence, Integration, and Operations Layer

Use this layer to build the workbench, reporting, integration, deployment, and test system around the domain model.

| Document | Role |
|---|---|
| `docs/13_Frontend_Implementation_Specification.md` | Frontend architecture, workbench patterns, PWA rules |
| `docs/14_Analytics_Reporting_Specification.md` | KPIs, snapshots, dashboards, drilldowns |
| `docs/15_Integration_Specification.md` | Source-of-truth rules, staging imports, FastReact/Excel/ERP coexistence |
| `docs/16_Security_Roles_Permissions_Specification.md` | Authentication, RBAC, action permissions, scope |
| `docs/17_Audit_Compliance_Traceability_Specification.md` | Audit events, evidence, traceability, retention |
| `docs/18_Deployment_DevOps_Specification.md` | Docker, environments, CI/CD, observability, backup |
| `docs/19_Testing_QA_Strategy.md` | Test pyramid, business-flow testing, UAT strategy |
| `docs/20_Seed_Data_Simulation_Scenarios.md` | Realistic factory seed scenarios and demo data |

### 5.5 Delivery Layer

Use this layer to manage implementation sequence and chunking.

| Document | Role |
|---|---|
| `docs/21_Phasewise_Backend_Build_Plan.md` | Backend phases, Django apps, APIs, services, tests |
| `docs/22_Phasewise_Frontend_Build_Plan.md` | Frontend phases, modules, screens, hooks, tests |
| `docs/25_Common_Documentation_Spine_and_Phasewise_Build_Plan.md` | Integrated implementation spine across the full stack |

---

## 6. Frontend UI Stack Map

The UI folder is not just visual reference. It is an implementation-grade surface catalogue. Treat each prototype as a target surface that must be backed by API contracts, permissions, audit, seed data, and tests.

### 6.1 MVP Operating Surfaces

These are the ten MVP surfaces confirmed by governance.

| MVP Surface | Prototype Folder | EOS Node |
|---|---|---|
| Order lifecycle and risk | `docs/frontend_ui/order_lifecycle_explorer` | EOS-03 |
| PCD readiness and release gate | `docs/frontend_ui/pcd_readiness_gate` | EOS-03 |
| Weekly/monthly planning workbench | `docs/frontend_ui/weekly_planning_workbench` | EOS-04 |
| Daily production release | `docs/frontend_ui/daily_production_release_dashboard` | EOS-04 |
| Workcenter load and constraint monitor | `docs/frontend_ui/workcenter_load_monitor` | EOS-04 |
| Sewing line loading and output | `docs/frontend_ui/sewing_line_loading_dashboard` | EOS-05 |
| Wash planning and rewash control | `docs/frontend_ui/wash_planning_dashboard` | EOS-06 |
| WIP and queue monitoring | `docs/frontend_ui/wip_queue_monitoring_dashboard` | EOS-06 |
| Exception, alert, and recovery | `docs/frontend_ui/exceptions_alerts_management` | EOS-07 |
| Shipment readiness | `docs/frontend_ui/shipment_readiness_dashboard` | EOS-07 |

### 6.2 MVP-Adjacent Surfaces

These surfaces should be planned with the MVP because they provide the data or live execution loop that keeps the MVP trustworthy.

| Surface | Prototype Folder | EOS Node |
|---|---|---|
| Style technical file | `docs/frontend_ui/style_technical_file` | EOS-02 |
| BOM and material planning | `docs/frontend_ui/bom_material_planning_dashboard` | EOS-02 / EOS-03 |
| Procurement and vendor follow-up | `docs/frontend_ui/procurement_vendor_follow_up` | EOS-03 / EOS-10 |
| Fabric inward and fabric QC | `docs/frontend_ui/fabric_inward_fabric_qc_dashboard` | EOS-03 |
| Operation bulletin master | `docs/frontend_ui/operation_bulletin_master_dashboard` | EOS-02 / EOS-05 |
| Operation bulletin routing builder | `docs/frontend_ui/operation_bulletin_detail_routing_builder` | EOS-02 / EOS-05 |
| Cutting room management | `docs/frontend_ui/cutting_room_management_dashboard` | EOS-05 |
| Line realignment workbench | `docs/frontend_ui/line_realignment_workbench` | EOS-05 |
| Operator skill and capacity | `docs/frontend_ui/operator_skill_capacity_dashboard` | EOS-02 / EOS-05 |
| Wash recipe and batch execution | `docs/frontend_ui/wash_recipe_batch_execution` | EOS-06 |
| Manufacturing pipeline WIP inventory | `docs/frontend_ui/manufacturing_pipeline_wip_inventory_dashboard` | EOS-06 |
| Inventory reconciliation | `docs/frontend_ui/inventory_reconciliation_quantity_integrity` | EOS-06 |
| Quality management | `docs/frontend_ui/quality_management_dashboard` | EOS-07 |
| QC defect and hold capture | `docs/frontend_ui/qc_defect_hold_capture` | EOS-07 / EOS-08 |
| Rework and recovery | `docs/frontend_ui/rework_recovery_dashboard` | EOS-07 |
| Handheld shopfloor home | `docs/frontend_ui/handheld_shopfloor_home` | EOS-08 |
| Sewing output capture | `docs/frontend_ui/sewing_output_capture` | EOS-08 |
| Department handover capture | `docs/frontend_ui/department_handover_capture` | EOS-08 |
| Shopfloor Andon issue capture | `docs/frontend_ui/shopfloor_andon_issue_capture` | EOS-08 |
| Supervisor shift closure | `docs/frontend_ui/supervisor_shift_closure` | EOS-08 |
| Mobile shopfloor update | `docs/frontend_ui/mobile_shopfloor_update` | EOS-08 |

### 6.3 Mature-State Surfaces

These are valuable for a full-fledged build but should not crowd the first MVP release unless explicitly prioritized.

| Surface | Prototype Folder | EOS Node |
|---|---|---|
| Executive control tower | `docs/frontend_ui/executive_control_tower` | EOS-09 |
| Performance analytics | `docs/frontend_ui/performance_analytics_dashboard` | EOS-09 |
| What-if simulation | `docs/frontend_ui/what_if_simulation_workbench` | EOS-09 |
| Multi-unit capacity simulation | `docs/frontend_ui/multi_unit_capacity_simulation` | EOS-09 |
| Calendar/Gantt planning | `docs/frontend_ui/calendar_gantt_planning_dashboard` | EOS-04 / EOS-09 |
| Enquiry and costing | `docs/frontend_ui/enquiry_costing_dashboard` | EOS-03 / EOS-09 |
| Sampling and approval tracker | `docs/frontend_ui/sampling_approval_tracker` | EOS-03 |
| Master data governance | `docs/frontend_ui/master_data_governance` | EOS-02 / EOS-11 |

### 6.4 UI System Rule

All surfaces should follow the `Industrial Logic` design system:

- dense operation cockpit
- compact grids
- sticky headers and sticky first columns
- right action drawer for detail/action flows
- role-aware navigation
- semantic risk badges
- stale data visibility
- desktop workbench layouts separate from mobile capture layouts

---

## 7. Non-Negotiable Build Rules

Apply these rules in every phase.

1. Backend owns official business truth.
2. Frontend renders status, risk, reason, impact, history, and available actions.
3. Critical status changes use explicit action APIs, not generic status patches.
4. Every critical write checks permission, validates state, writes audit, and triggers recalculation where needed.
5. WIP movement must preserve quantity integrity.
6. PCD, daily release, wash, QC, and shipment readiness are gates, not passive checklists.
7. Seed data must be scenario-driven, deterministic, and resettable.
8. Every phase must have service tests, API tests, frontend tests, and at least one end-to-end business-flow test where risk warrants it.
9. Excel imports are transition tools, not the long-term operating layer.
10. The MVP must protect the ten critical surfaces before expanding too far into mature-state screens.

---

## 8. Integrated Phase-wise Build Plan

The existing backend plan has 13 backend phases and the existing frontend plan has 12 frontend phases. The integrated plan below merges them into one product delivery sequence.

Backend and frontend can overlap, but a phase is not considered complete until its backend services, APIs, UI surfaces, permissions, audit events, seed data, and tests all work as a vertical slice.

---

# Phase 0: Build-Start Readiness and Repository Foundation

## Objective

Create the delivery foundation before domain work begins.

## Primary EOS Nodes

EOS-00, EOS-01, EOS-12

## Primary Documents

BRD, 01, 18, 19, 20, 21, 22, 23, 24

## Build Scope

- Confirm product scope, MVP boundary, and mature-state deferral rules.
- Decide monorepo or multi-repo structure.
- Create backend, frontend, docs, deployment, and seed-data folders.
- Initialize Docker Compose for backend, frontend, PostgreSQL, Redis, Celery worker, and Celery beat.
- Establish local/dev/staging/prod environment strategy.
- Add linting, formatting, test runners, CI skeleton, and developer README.
- Create health and ping endpoints.
- Create frontend project shell and empty route skeleton.
- Create OpenAPI generation path.

## UI Surfaces

- No business surface yet.
- App shell placeholder only.

## Exit Gate

- `docker compose up` starts all baseline services.
- Backend health check works.
- Frontend shell loads.
- Empty migrations and test suites run.
- Readiness Gate 0 and Gate 1 items from doc 24 are assigned owners.

---

# Phase 1: Common Platform Foundation

## Objective

Build the shared backend and frontend foundations that all later modules depend on.

## Primary EOS Nodes

EOS-01, EOS-11, EOS-12

## Primary Documents

01, 05, 06, 13, 16, 17, 18, 19, 21, 22, 23

## Backend/Data Scope

- `common`, `identity_access`, `organization`, `audit_governance` apps.
- Base model fields, enums, response envelope, error shape, pagination, filters.
- Django Auth extension with UserProfile, Role, PermissionAction, UserRole, RolePermission, and scope model.
- Permission helper and action-level permission seed data.
- Audit event base model and audit service.
- `/api/v1/me`, `/api/v1/ping`, auth/session/token baseline.
- OpenAPI documentation baseline.

## Frontend Scope

- App shell with top header, left navigation, main work area, right action drawer.
- Auth state, current user, role/scope display, permission gate.
- API client, TanStack Query, error handling, toast/notification base.
- Shared status badge, risk badge, readiness checklist, data grid wrapper, empty/loading/error states.
- Design tokens from `docs/frontend_ui/DESIGN.md`.

## UI Surfaces

- Shell, navigation, auth/me view, shared component sandbox.

## Exit Gate

- Role-based user can log in and see permitted navigation.
- Backend denies unauthorized write action even if frontend calls it directly.
- Audit service can record a test critical action.
- API envelope and error shape are implemented consistently.

---

# Phase 2: Master Data and Technical Product Foundation

## Objective

Create the controlled reference data needed before orders, planning, and production can be trusted.

## Primary EOS Nodes

EOS-02, EOS-11, EOS-12

## Primary Documents

02, 03, 09, 10, 16, 17, 20, 23

## Backend/Data Scope

- Factory, department, workcenter, line, shift calendar, machine, machine type.
- Customer, buyer, vendor, material, fabric, product type.
- Style master, style complexity, BOM header and BOM lines.
- Operation master, operation bulletin header, operation bulletin lines, routing sequence.
- Wash route, wash route steps, wash machine/workcenter masters.
- Defect code, hold reason, exception category, planning threshold masters.
- Admin configuration, imports where needed, approval/version model for controlled masters.
- Seed commands for core masters and realistic demo values.

## Frontend Scope

- Master Data Governance surface.
- Style Technical File.
- BOM and Material Planning.
- Operation Bulletin Master.
- Operation Bulletin Routing Builder.
- Operator Skill and Capacity baseline.

## UI Surfaces

- `master_data_governance`
- `style_technical_file`
- `bom_material_planning_dashboard`
- `operation_bulletin_master_dashboard`
- `operation_bulletin_detail_routing_builder`
- `operator_skill_capacity_dashboard`

## Exit Gate

- A style can be created with BOM, approved operation bulletin, workcenter/line capability, and wash route.
- Approved versioned masters cannot be edited directly.
- Active production records can reference specific approved versions.
- Seed data can reset and recreate a known technical foundation.

---

# Phase 3: Orders, Procurement, Fabric QC, and PCD Readiness

## Objective

Build the pre-production control layer that decides whether an order can safely enter production.

## Primary EOS Nodes

EOS-03, EOS-11, EOS-12

## Primary Documents

02, 04, 05, 06, 07, 15, 16, 17, 19, 20, 23

## Backend/Data Scope

- Production order, order lines, milestones, shipment commitments.
- Order lifecycle status derivation.
- Procurement/material readiness records.
- Fabric inward and fabric QC records.
- PCD readiness checklist, blockers, conditional release, expiry, approval.
- Readiness recalculation service and event triggers.
- Action APIs for PCD review, conditional release, and readiness validation.
- Audit events for PCD release, conditional release, fabric QC changes, and blocker overrides.

## Frontend Scope

- Order Lifecycle Explorer.
- Procurement and Vendor Follow-Up.
- Fabric Inward and Fabric QC.
- PCD Readiness Gate.
- Sampling and Approval Tracker if business wants pre-production critical path in the same wave.

## UI Surfaces

- `order_lifecycle_explorer`
- `procurement_vendor_follow_up`
- `fabric_inward_fabric_qc_dashboard`
- `pcd_readiness_gate`
- `sampling_approval_tracker`

## Exit Gate

- Order lifecycle can show ready, blocked, risk, owner, next action, and history.
- Fabric QC failure blocks PCD readiness.
- Cutting release is blocked unless PCD is ready or valid conditional release exists.
- Conditional release requires permission, reason, expiry, audit, and visible risk.

---

# Phase 4: Planning, Capacity, Workcenter Load, and Daily Release

## Objective

Create executable planning: weekly/monthly plan, capacity visibility, plan freeze, and daily release control.

## Primary EOS Nodes

EOS-04, EOS-11, EOS-12

## Primary Documents

04, 05, 06, 07, 13, 16, 17, 19, 20, 23

## Backend/Data Scope

- Planning horizon, plan version, planned work item, plan freeze.
- Workcenter capacity calendar and load calculation.
- Constraint status calculation.
- Daily production release model and release validation.
- Plan impact preview service.
- Action APIs for create plan, move/assign work, freeze plan, request change, approve change, validate release, issue release.
- Celery snapshot for workcenter load if needed.

## Frontend Scope

- Weekly Planning Workbench.
- Calendar/Gantt Planning.
- Workcenter Load Monitor.
- Daily Production Release Dashboard.
- Plan impact drawer and capacity overlay.

## UI Surfaces

- `weekly_planning_workbench`
- `calendar_gantt_planning_dashboard`
- `workcenter_load_monitor`
- `daily_production_release_dashboard`

## Exit Gate

- Planner can create a plan from ready orders and see load impact.
- Frozen plan cannot be changed without governed change flow.
- Daily release checks PCD, available input/WIP, capacity, QC holds, and blockers.
- Overloaded workcenter and release-blocking constraints are visible before commit.

---

# Phase 5: Cutting, Sewing, Line Loading, Routing, and Line Realignment

## Objective

Connect technical method design to production execution and capture net-good sewing output.

## Primary EOS Nodes

EOS-05, EOS-08, EOS-11, EOS-12

## Primary Documents

08, 09, 12, 16, 17, 19, 20, 23

## Backend/Data Scope

- Cutting release and cutting output if included in initial execution scope.
- Sewing line loading, line assignment, active release-to-line relationship.
- Operation bulletin validation for line loading.
- Line capability, machine/skill fit, line realignment request and approval.
- Sewing output entries with gross, defect, rework, and net-good quantities.
- Line efficiency and shortfall calculation.
- WIP movement from cutting to sewing and sewing to wash queue.
- Audit events for line loading, realignment, output correction, and shortfall override.

## Frontend Scope

- Cutting Room Management.
- Sewing Line Loading.
- Line Realignment Workbench.
- Operation Bulletin performance visibility.
- Sewing Output Capture can start here as desktop/tablet or be finalized in Phase 8 mobile.

## UI Surfaces

- `cutting_room_management_dashboard`
- `sewing_line_loading_dashboard`
- `line_realignment_workbench`
- `operation_bulletin_master_dashboard`
- `operation_bulletin_detail_routing_builder`
- `sewing_output_capture`

## Exit Gate

- Line loading requires approved operation bulletin or approved exception.
- Sewing output cannot be captured without an active release and line assignment.
- Net-good output updates WIP and line efficiency.
- Shortfall can trigger an exception with owner and due date.
- Line realignment shows before/after expected capacity and requires approval where governed.

---

# Phase 6: Wash Planning, Wash Execution, WIP Pipeline, and Reconciliation

## Objective

Make wash a first-class production constraint and make WIP the trusted operational truth layer.

## Primary EOS Nodes

EOS-06, EOS-07, EOS-08, EOS-11, EOS-12

## Primary Documents

08, 10, 11, 12, 16, 17, 19, 20, 23

## Backend/Data Scope

- WIP item, WIP stage, WIP movement, WIP hold, WIP adjustment.
- WIP ageing calculation and reconciliation logic.
- Wash queue, wash batch, route steps, dry/wet process statuses, post-wash QC gate.
- Rewash/touch-up loop with capacity consumption.
- Quantity integrity service preventing negative or impossible movement.
- Wash load and bottleneck calculation.
- WIP mismatch and ageing exception generation.
- Audit events for WIP adjustment, wash batch changes, rewash decisions, and reconciliation.

## Frontend Scope

- Wash Planning Dashboard.
- Wash Recipe and Batch Execution.
- WIP and Queue Monitoring.
- Manufacturing Pipeline WIP Inventory.
- Inventory Reconciliation and Quantity Integrity.

## UI Surfaces

- `wash_planning_dashboard`
- `wash_recipe_batch_execution`
- `wip_queue_monitoring_dashboard`
- `manufacturing_pipeline_wip_inventory_dashboard`
- `inventory_reconciliation_quantity_integrity`

## Exit Gate

- Wash batch cannot exceed available wash-eligible WIP.
- No wash batch without approved wash route.
- Rewash consumes capacity, updates WIP, and affects shipment risk.
- WIP movement preserves source/destination quantity integrity.
- Ageing or mismatch can create governed exceptions.

---

# Phase 7: Quality, Exceptions, Recovery, and Shipment Readiness

## Objective

Close the MVP operating loop by controlling QC holds, recovery action, exception ownership, and shipment readiness.

## Primary EOS Nodes

EOS-07, EOS-09, EOS-11, EOS-12

## Primary Documents

11, 14, 16, 17, 19, 20, 23

## Backend/Data Scope

- QC inspection, defect, hold, hold release, waiver where applicable.
- Exception record, severity, owner, SLA, escalation, duplicate detection.
- Recovery action model with owner, approval, expected impact, actual impact.
- Shipment readiness checklist, packed quantity, AQL/documentation/shortage blockers.
- Shipment risk calculation and dispatch readiness.
- Notification events and escalation jobs.
- Audit events for QC hold release, exception closure, recovery approval, shipment readiness.

## Frontend Scope

- Quality Management Dashboard.
- QC Defect and Hold Capture.
- Exceptions and Alerts Management.
- Rework and Recovery Dashboard.
- Shipment Readiness Dashboard.

## UI Surfaces

- `quality_management_dashboard`
- `qc_defect_hold_capture`
- `exceptions_alerts_management`
- `rework_recovery_dashboard`
- `shipment_readiness_dashboard`

## Exit Gate

- QC hold blocks governed movement until release/waiver.
- RED/BLACK exception cannot exist without owner and due date.
- Exception closure requires note and permission where critical.
- Shipment readiness cannot be marked if mandatory checklist is incomplete without approved split/waiver.
- MVP ten critical surfaces are now usable end to end with seed scenarios.

---

# Phase 8: Mobile/PWA Shopfloor Live Capture and Offline Sync

## Objective

Make shopfloor actuals live or near-live so planning does not fall back to Excel, WhatsApp, paper, and end-of-day entry.

## Primary EOS Nodes

EOS-08, EOS-05, EOS-06, EOS-07, EOS-11, EOS-12

## Primary Documents

12, 13, 16, 17, 19, 20, UI handheld addendum, 23

## Backend/Data Scope

- Shopfloor session/device model if required.
- Mobile event capture APIs for sewing output, QC defect, handover, downtime, wash step, issue/Andon, shift closure.
- Offline event queue and idempotent sync processing.
- Conflict detection and original timestamp preservation.
- Mobile permission scopes by department, line, workcenter, and role.
- Audit events for mobile capture, sync correction, handover, and shift closure.

## Frontend Scope

- Mobile app shell.
- Handheld Shopfloor Home.
- Sewing Output Capture.
- Department Handover Capture.
- QC Defect and Hold Capture.
- Shopfloor Andon Issue Capture.
- Supervisor Shift Closure.
- Mobile Shopfloor Update.
- Offline draft and pending sync UI.

## UI Surfaces

- `handheld_shopfloor_home`
- `sewing_output_capture`
- `department_handover_capture`
- `qc_defect_hold_capture`
- `shopfloor_andon_issue_capture`
- `supervisor_shift_closure`
- `mobile_shopfloor_update`

## Exit Gate

- Supervisor can capture output in a few taps.
- Offline event sync updates WIP, exceptions, and planning dashboards after reconnection.
- Duplicate sync does not double-count output.
- Stale or unsynced data is visible to planners.
- Mobile role cannot act outside assigned scope.

---

# Phase 9: Integration, Imports, Migration, and Source-of-Truth Control

## Objective

Connect the platform to existing operating data while preventing uncontrolled duplicate truth.

## Primary EOS Nodes

EOS-10, EOS-11, EOS-12

## Primary Documents

15, 16, 17, 18, 19, 20, 23

## Backend/Data Scope

- Integration source registry and source-of-truth matrix.
- Import batch, staging tables, validation result, apply/rollback metadata.
- Dry-run validation before apply.
- Excel import support for transition domains.
- ERP/order import.
- FastReact plan import or coexistence path if required.
- Opening WIP import.
- Master data import governance.
- Integration monitoring and stale-sync alerts.

## Frontend Scope

- Integration status view.
- Import upload, dry-run result, error report, approval, and apply flow.
- Audit search and order trace support where needed.

## UI Surfaces

- Admin/integration views can be implemented inside the application shell.
- Use Django Admin for low-volume admin where appropriate.
- Extend Master Data Governance and Audit Search when mature.

## Exit Gate

- No bulk import applies directly to core tables without validation.
- Import apply is permissioned and audited.
- Duplicate source-of-truth decisions are documented.
- Opening WIP import can be reconciled against operational WIP stages.

---

# Phase 10: Analytics, Control Tower, and Simulation

## Objective

Turn operational data into management visibility and planning learning.

## Primary EOS Nodes

EOS-09, EOS-04, EOS-06, EOS-07, EOS-12

## Primary Documents

04, 09, 10, 11, 14, 19, 20, 23

## Backend/Data Scope

- Daily planning health snapshot.
- Workcenter load snapshot.
- Line efficiency snapshot.
- WIP pipeline snapshot.
- Exception and recovery snapshot.
- Shipment readiness and OTIF snapshot.
- Cost-protected OTIF model where recovery expense/effort is captured.
- What-if simulation services for plan moves, overtime, split shipment, reallocation, and wash recovery.

## Frontend Scope

- Executive Control Tower.
- Performance Analytics Dashboard.
- What-if Simulation Workbench.
- Multi-unit Capacity Simulation.
- Analytics drilldowns from summary to order/workcenter/line/detail.

## UI Surfaces

- `executive_control_tower`
- `performance_analytics_dashboard`
- `what_if_simulation_workbench`
- `multi_unit_capacity_simulation`

## Exit Gate

- Backend owns KPI formulas.
- Analytics snapshots are stable and reproducible.
- Drilldowns reconcile to operational records.
- Simulation previews do not commit writes until user confirms governed action.
- Management can distinguish normal OTIF from recovery-protected OTIF.

---

# Phase 11: Security, Audit, Performance, DevOps, and Release Hardening

## Objective

Harden the system for pilot and production operation.

## Primary EOS Nodes

EOS-11, EOS-12, EOS-01

## Primary Documents

16, 17, 18, 19, 23, 24

## Backend/Data Scope

- Full permission coverage for every write/action endpoint.
- Audit coverage for every governed transition.
- Performance tuning for list APIs, planning queries, WIP dashboards, and analytics.
- Index review and query optimization.
- Celery idempotency and scheduled job monitoring.
- Backup and restore testing.
- Environment-specific security hardening.
- Logging and observability.

## Frontend Scope

- Accessibility pass for desktop and mobile.
- Performance pass for dense grids.
- Error state, empty state, stale data, and offline sync hardening.
- Route protection and action visibility by role.
- End-to-end regression suite for core flows.

## Exit Gate

- Pilot no-go conditions from docs 21, 22, and 24 are cleared or explicitly accepted.
- Permission and audit coverage reports are reviewed.
- Backup/restore drill is proven.
- Core E2E flows pass in staging.
- Production deployment and rollback runbooks exist.

---

# Phase 12: UAT, Pilot, Rollout, and Stabilization

## Objective

Move from built software to adopted operating system.

## Primary EOS Nodes

EOS-00, EOS-09, EOS-10, EOS-11, EOS-12

## Primary Documents

19, 20, 23, 24, BRD

## Business Scope

- Run scenario-based UAT using seed scenarios and real factory examples.
- Validate owners for planning, production, wash, QC, shipment, procurement, IE, and IT.
- Train planners, supervisors, managers, and admins.
- Load opening master data and opening WIP.
- Run controlled parallel operation with Excel for a defined transition period.
- Compare system truth with legacy/manual truth.
- Cut over domain by domain, starting with a scoped pilot unit/line/workcenter set.
- Stabilize daily operating cadence, issue triage, support, and change governance.

## Exit Gate

- UAT sign-off is complete for MVP flows.
- Pilot users use the system as the operating source for selected processes.
- WIP, output, exceptions, and shipment readiness are trusted in pilot scope.
- Excel fallback is reduced to transition evidence, not the primary control mechanism.
- Post-go-live stabilization metrics are reviewed daily.

---

## 9. MVP Cut Recommendation

For a disciplined first production release, cut the MVP after Phase 7 only if the following are true:

- Phase 0-1 foundations are complete.
- Master data needed by MVP surfaces is available and governed.
- Orders, PCD readiness, planning, daily release, workcenter load, sewing, wash, WIP, exceptions, and shipment readiness work end to end.
- At least one realistic seed scenario covers each major risk: PCD block, material delay, fabric QC failure, sewing shortfall, wash bottleneck, rewash, WIP ageing, QC hold, shipment readiness blocker.
- Handheld capture is either included in MVP or scheduled immediately after MVP with a hard date, because stale actuals will weaken planning trust.

The MVP should not include all mature analytics and simulation features unless the core operating loop is already stable.

---

## 10. Backlog Chunk Template

Every implementation ticket should include:

```text
EOS node:
Source docs:
UI surface:
Backend apps:
API endpoints:
State transitions:
Permissions:
Audit events:
Seed scenario:
Tests:
Exit criteria:
```

Example:

```text
EOS node: EOS-06
Source docs: 08, 10, 11, 17, 19, 20
UI surface: wash_planning_dashboard
Backend apps: washing, wip_inventory, exceptions, audit_governance
API endpoints: POST /api/v1/wash/batches, POST /api/v1/wash/batches/{id}/rewash
State transitions: QUEUED -> IN_WASH -> POST_WASH_QC -> REWASH_REQUIRED -> RELEASED_TO_FINISHING
Permissions: wash.create_batch, wash.mark_rewash, quality.release_post_wash
Audit events: wash.batch_created, wash.rewash_required, wip.moved_to_rewash
Seed scenario: ORD-DEN-RED-001 wash bottleneck and rewash recovery
Tests: service, API, permission, audit, WIP quantity, UI action, E2E rewash flow
Exit criteria: rewash consumes capacity and updates shipment risk
```

---

## 11. Recommended Delivery Cadence

Use vertical slices rather than building all models first and all screens later.

Recommended cadence per phase:

```text
1. Confirm source docs and EOS nodes.
2. Write API contract or update OpenAPI.
3. Build models/migrations/admin.
4. Build service and selector layer.
5. Add permissions and audit events.
6. Add seed scenario.
7. Build frontend route, hooks, grid/board, drawer, actions, states.
8. Add service/API/frontend tests.
9. Run end-to-end business-flow test.
10. Update readiness checklist and release notes.
```

---

## 12. Final Build Position

The Eratex documentation stack is ready to drive a serious implementation if the team keeps one discipline:

```text
Do not build disconnected screens.
Build the governed operating loop.
```

The Eratex Operating Spine is the shared reference for that loop. It lets every implementation decision be traced back to a business purpose, source specification, API contract, UI surface, permission, audit event, seed scenario, and exit gate.

