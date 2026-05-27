# Phase 4A: Scheduling Behaviour Rulebook + Phase 1–4 Alignment Patch

## Eratex Planning & Scheduling Platform

**Document Type:** Codex Implementation Handoff Specification  
**Company:** Eratex  
**Product Context:** Denim Bottoms + Chinos Garment Manufacturing Planning and Scheduling Platform  
**Phase:** Phase 4A  
**Version:** 1.1  
**Date:** 2026-05-27  
**Primary Purpose:** Course-correct completed Phase 1–4 implementation and define direction-change guidance for all future MVP and mature build phases.

---

# 1. Executive Intent

Phase 4A is not only a corrective patch for what has already been built up to Phase 4.

It is a **dual-purpose alignment phase**:

```text
1. Backward correction:
   Patch and harden the completed Phase 1–4 foundation.

2. Forward guidance:
   Define non-negotiable direction rules for Phase 5 onward,
   including WIP, sewing, wash, exceptions, recovery, shopfloor,
   integration, analytics, and mature-state surfaces.
```

The immediate implementation must prevent future phases from being built on incomplete assumptions about:

```text
scheduling grain
capacity definition
order changes
cancellation behavior
shipment pull-in
wash/repeat wash
frozen-zone changes
FastReact/Excel coexistence
planner approval vs system automation
```

The system must not merely show a schedule. It must define how the schedule behaves when factory reality changes.

---

# 2. Required Repo Documentation References

Codex must inspect and align with these documents before implementation.

## 2.1 Primary Alignment Reference

```text
docs/Eratex_Tech_Spec_Alignment_Review_Rajesh_Feedback.md
```

## 2.2 Consultant / BRD Alignment References

```text
docs/brd/02_Rajesh_Eratex_Challenges_Solution_Direction_Synthesis.md
docs/brd/03_Reconciliation_Rajesh_Feedback_vs_Eratex_BRD_EOS_Direction.md
docs/brd/04_Diff_Eratex_BRD_Refinement_From_Rajesh_Inputs.md
docs/brd/Eratex_Planning_Scheduling_Tool_BRD.md
```

## 2.3 Core Technical Pack References

```text
docs/01_Technical_Architecture_Spine_Eratex.md
docs/02_Data_Model_Table_Schemas_Eratex.md
docs/03_Master_Data_Specification_Eratex.md
docs/04_Planning_Logic_Calculation_Flows_Eratex.md
docs/05_Backend_Domain_Module_Specification_Eratex.md
docs/06_API_Data_Contracts_Eratex.md
docs/07_Event_State_Transition_Specification_Eratex.md
docs/08_WIP_Inventory_Reconciliation_Specification_Eratex.md
docs/09_Line_Routing_Operation_Bulletin_Specification_Eratex.md
docs/10_Wash_Planning_Execution_Specification_Eratex.md
docs/11_Exception_Alert_Recovery_Specification_Eratex.md
docs/12_Handheld_Shopfloor_Capture_Technical_Spec.md
docs/13_Frontend_Implementation_Specification.md
docs/14_Analytics_Reporting_Specification.md
docs/15_Integration_Specification.md
docs/16_Security_Roles_Permissions_Specification.md
docs/17_Audit_Compliance_Traceability_Specification.md
docs/18_Deployment_DevOps_Specification.md
docs/19_Testing_QA_Strategy.md
docs/20_Seed_Data_Simulation_Scenarios.md
docs/21_Phasewise_Backend_Build_Plan.md
docs/22_Phasewise_Frontend_Build_Plan.md
docs/23_Governance_Spine_Document.md
docs/24_Implementation_Readiness_Checklist.md
```

---

# 3. Phase 4A Decision

The implementation decision is:

```text
Do not restart Phase 1–4.
Do not continue blindly to Phase 5 onward.
Do not postpone Rajesh-alignment changes until after MVP.
Insert Phase 4A now.
Patch completed foundations.
Use Phase 4A rules as direction guardrails for future phases.
```

Phase 4A must become the bridge between:

```text
completed foundation build
and
future MVP execution build
```

---

# 4. Phase 4A Scope

Phase 4A must deliver:

```text
1. Lock MVP scheduling grain.
2. Add planning-zone governance: Frozen / Firm / Flexible.
3. Add workcenter-specific capacity definition matrix.
4. Add BoundaryCaseEvent domain concept.
5. Add boundary impact-preview service.
6. Add order change and cancellation impact-preview flow.
7. Add capacity loss/addition event flow.
8. Add shipment pull-in impact-preview flow.
9. Add wash complexity and repeat-cycle governance fields.
10. Add FastReact/external-plan validation-as-draft rule.
11. Add required RBAC permissions.
12. Add required audit event codes.
13. Add boundary-case seed scenarios.
14. Add tests proving boundary behavior.
15. Patch implementation readiness gates.
```

---

# 5. Forward-Guidance Scope

Every future phase must consume the Phase 4A rules.

Phase 4A must guide:

```text
Phase 5: WIP
Phase 6: Sewing / line loading / operation bulletin
Phase 7: Wash / rewash / effect QC
Phase 8: Exceptions / recovery / shipment readiness
Phase 9: Shopfloor mobile / handheld capture
Phase 10: Integrations / FastReact / Excel migration
Phase 11: Analytics / reporting / OTIF
Phase 12: Audit hardening / performance / production readiness
Mature surfaces beyond MVP
```

Codex must not treat Phase 4A entities as isolated utilities. They are cross-cutting design primitives.

---

# 6. Out of Scope

Do not build these in Phase 4A unless they already exist and only need small alignment patches:

```text
advanced drag/drop Gantt
operation-by-operation finite scheduler
full autonomous optimizer
full QR/barcode scanning
full bidirectional FastReact integration
full costing/quotation engine
advanced PDF reporting
full mature audit search
AI-based auto-rescheduling
```

---

# 7. Non-Negotiable Phase 4A Rules

```text
1. MVP scheduling grain must be explicit in code, API, seed data, and docs.
2. Frozen-zone plan changes must not auto-apply.
3. Boundary cases must be visible, owned, stateful, and auditable.
4. Capacity must be workcenter-specific.
5. Wash must be modeled as value-creation + quality-risk + capacity constraint.
6. Rewash/repeat wash must consume capacity and affect shipment risk.
7. Order cancellation/change must produce impact preview before committed change.
8. System recommends and previews first; planner/approver commits.
9. FastReact/external plans are draft inputs, not committed truth.
10. Tests and seed scenarios must prove “what happens when...” behaviours.
```

---

# 8. MVP Scheduling Grain

## 8.1 Required Grain

The MVP scheduling grain is:

```text
order × style × color/shade-lot × production stage × workcenter/line × date/shift
```

## 8.2 Wash Grain

Wash execution grain is:

```text
wash batch
```

Wash batch must preserve:

```text
order
style
color/shade lot
wash route
quantity
current wash step
cycle number
root/parent batch for repeat wash
```

## 8.3 Operation-Level Detail

Operation-level detail is used for:

```text
operation bulletin
SMV
line balance
technical validation
line-style fit
operation bulletin performance
```

It is **not** full operation-by-operation finite scheduling in MVP.

## 8.4 Implementation Instruction

Codex must inspect existing models and ensure the following are present or derivable:

```text
order_id
style_id
color_code or color reference
shade_lot
production_stage
workcenter_id
line_id where applicable
planned_date
planned_shift
quantity
```

Prefer minimal additive migrations. Do not destructively rename working fields without need.

---

# 9. Planning Zones

## 9.1 Required Zones

```text
FROZEN_ZONE
FIRM_ZONE
FLEXIBLE_ZONE
```

## 9.2 Meaning

| Zone | Meaning | Allowed Behaviour |
|---|---|---|
| FROZEN_ZONE | Near execution or already committed | No automatic reschedule. Approval required. |
| FIRM_ZONE | Short-horizon constrained window | Impact preview required; approval for significant change. |
| FLEXIBLE_ZONE | Longer-horizon planning window | Planner may adjust within configured rules. |

## 9.3 Required Configuration Model

Add or extend configuration with:

```text
PlanningZoneConfiguration
```

Minimum fields:

```text
zone_code
zone_name
horizon_start_days
horizon_end_days
requires_approval_for_change
auto_reschedule_allowed
active_status
created_at
updated_at
```

## 9.4 Required Planning Work Item Field

Add to relevant planning work item model:

```text
planning_zone
```

## 9.5 Behaviour Rules

```text
1. FROZEN_ZONE work items cannot be directly changed.
2. FROZEN_ZONE changes create BoundaryCaseEvent or PlanChangeRequest.
3. FIRM_ZONE changes require impact preview.
4. FLEXIBLE_ZONE changes may be directly edited if user has permission.
5. No system job can auto-change FROZEN_ZONE plan without approval.
```

---

# 10. Workcenter-Specific Capacity Definition Matrix

## 10.1 Required Model

Add:

```text
WorkcenterCapacityDefinition
```

Minimum fields:

```text
id
workcenter_type
capacity_unit
planning_bucket
primary_constraint_resource
secondary_constraint_resource
normal_capacity_value
normal_capacity_unit
overtime_allowed
approved_overtime_capacity_value
capacity_loss_triggers_json
recovery_levers_json
active_status
created_at
updated_at
```

## 10.2 Required Enums

### capacity_unit

```text
PIECES_PER_DAY
SMV_MINUTES
BATCH_MINUTES
MACHINE_HOURS
OPERATOR_HOURS
LINE_DAYS
CARTONS_PER_DAY
```

### planning_bucket

```text
SHIFT
DAY
WEEK
BATCH
```

### primary_constraint_resource examples

```text
MANPOWER
LINE_BALANCE
MACHINE_TIME
WASHER_TIME
DRYER_TIME
SKILLED_OPERATOR
QC_CAPACITY
PACKING_MANPOWER
DOCUMENTATION
```

## 10.3 Required Seed Definitions

| Workcenter Type | Capacity Unit | Planning Bucket | Primary Constraint |
|---|---|---|---|
| SEWING | SMV_MINUTES | SHIFT/DAY | MANPOWER + LINE_BALANCE |
| WET_WASH | BATCH_MINUTES | BATCH/DAY | WASHER_TIME |
| DRY_PROCESS | OPERATOR_HOURS | SHIFT/DAY | SKILLED_OPERATOR |
| DRYING | BATCH_MINUTES | BATCH/DAY | DRYER_TIME |
| FINISHING | PIECES_PER_DAY | DAY | MANPOWER |
| PACKING | CARTONS_PER_DAY | DAY | PACKING_MANPOWER |

## 10.4 Required Services

Add or extend:

```text
workcenters.services.capacity.get_capacity_definition(workcenter)
workcenters.services.capacity.calculate_available_capacity(workcenter, date, shift=None)
workcenters.services.capacity.apply_capacity_event(...)
```

---

# 11. BoundaryCaseEvent Domain

## 11.1 Purpose

BoundaryCaseEvent formalizes business or factory events that disturb the plan.

It must support:

```text
visibility
impact preview
ownership
approval
application
audit
recovery linkage
```

## 11.2 Required Model

Add:

```text
BoundaryCaseEvent
```

Minimum fields:

```text
id
event_no
event_type
status
severity
linked_order_id nullable
linked_plan_id nullable
linked_work_item_id nullable
linked_workcenter_id nullable
linked_line_id nullable
linked_wash_batch_id nullable
event_stage
trigger_source
old_value_json
new_value_json
affected_quantity
affected_capacity_minutes
affected_shipment_date
risk_before
risk_after
recommended_action
approval_required
owner_id nullable
created_by
created_at
updated_at
resolved_at nullable
closed_at nullable
metadata_json
```

## 11.3 Status Values

```text
OPEN
IMPACT_PREVIEWED
ACTION_PROPOSED
APPROVAL_REQUIRED
APPROVED
REJECTED
APPLIED
RESOLVED
CLOSED
CANCELLED
```

## 11.4 Event Types

```text
ORDER_CANCELLED
ORDER_QTY_CHANGED
DELIVERY_DATE_CHANGED
SHIPMENT_PULL_IN
CAPACITY_LOSS
CAPACITY_ADDITION
MACHINE_BREAKDOWN
ABSENTEEISM_SPIKE
QC_FAILURE
REWASH_REQUIRED
REWASH_REPEAT_EXCEEDED
FROZEN_PLAN_CHANGE_REQUESTED
EXTERNAL_PLAN_CONFLICT
```

## 11.5 Trigger Sources

```text
USER
SYSTEM
SHOPFLOOR
IMPORT
INTEGRATION
FASTREACT_IMPORT
EXCEL_IMPORT
```

---

# 12. Boundary Impact Preview

## 12.1 Required Service

Add:

```text
boundary_cases.services.preview.calculate_boundary_impact(event_type, payload, user)
```

## 12.2 Required Output

```text
can_apply
approval_required
risk_before
risk_after
affected_orders
affected_workcenters
affected_wip
affected_shipments
capacity_impact
recommended_actions
warnings
blocking_reasons
```

## 12.3 Optional Persistence Model

If persisted previews are needed, add:

```text
BoundaryImpactPreview
```

Fields:

```text
id
boundary_case_event_id
preview_type
affected_orders_json
affected_workcenters_json
affected_wip_json
affected_shipments_json
capacity_before_json
capacity_after_json
risk_before
risk_after
recommended_actions_json
approval_required
created_by
created_at
```

---

# 13. Order Change and Cancellation Logic

## 13.1 Required Flows

Support impact preview for:

```text
order cancellation
order quantity change
delivery date change
shipment pull-in
```

## 13.2 Cancellation Behaviour Matrix

| Stage | Required Behaviour |
|---|---|
| Before procurement | Release planning capacity; cancel procurement intent if present; audit. |
| After procurement | Flag material liability; check material reallocation; create material exposure. |
| After fabric receipt | Reclassify fabric stock; evaluate alternate order/style usability. |
| After cutting | Freeze or reclassify cut panels; require management decision. |
| During sewing | Stop further release; update WIP; release future line capacity. |
| During wash | Identify washed/semi-washed WIP; decide hold, reallocation, rewash, or scrap. |
| After finishing/packing | Finished-goods disposition and shipment/customer decision required. |

## 13.3 Required APIs

Add or extend:

```text
POST /api/v1/orders/{orderId}/change-impact-preview
POST /api/v1/orders/{orderId}/change-request
POST /api/v1/orders/{orderId}/cancel-impact-preview
POST /api/v1/orders/{orderId}/cancel-request
POST /api/v1/orders/change-requests/{requestId}/approve
POST /api/v1/orders/change-requests/{requestId}/apply
```

Reuse existing PlanChangeRequest/Approval models where appropriate.

## 13.4 Required Validations

```text
1. Quantity cannot be reduced below shipped quantity.
2. Quantity cannot be reduced below irreversible WIP without disposition.
3. Cancellation after cutting requires WIP disposition.
4. Cancellation during wash requires wash batch disposition.
5. Shipment pull-in must check capacity and WIP feasibility.
6. FROZEN_ZONE changes require approval.
```

---

# 14. Capacity Loss and Addition Events

## 14.1 Required Event Types

```text
CAPACITY_LOSS
CAPACITY_ADDITION
MACHINE_BREAKDOWN
ABSENTEEISM_SPIKE
```

## 14.2 Required APIs

```text
POST /api/v1/capacity-events/impact-preview
POST /api/v1/capacity-events
POST /api/v1/capacity-events/{eventId}/approve
POST /api/v1/capacity-events/{eventId}/apply
```

## 14.3 Capacity Loss Behaviour

```text
1. Reduce available capacity for affected bucket.
2. Recalculate workcenter utilization.
3. Identify affected orders.
4. Create or update BoundaryCaseEvent.
5. Create exception if risk becomes RED/BLACK.
6. Recommend recovery options.
```

## 14.4 Capacity Addition Behaviour

```text
1. Add proposed additional capacity.
2. Check approval requirement.
3. Preview risk improvement.
4. Apply only after approval if required.
5. Audit approved capacity addition.
```

---

# 15. Shipment Pull-In Logic

## 15.1 Required APIs

These may reuse order change APIs if cleanly modeled.

```text
POST /api/v1/orders/{orderId}/shipment-pull-in-preview
POST /api/v1/orders/{orderId}/shipment-pull-in-request
POST /api/v1/orders/{orderId}/shipment-pull-in-approve
POST /api/v1/orders/{orderId}/shipment-pull-in-apply
```

## 15.2 Required Preview Output

```text
old_shipment_date
new_requested_shipment_date
days_lost
affected_wip_stage
remaining_processes
capacity_gap_by_workcenter
wash_risk
sewing_risk
packing_risk
shipment_readiness_risk
recommended_recovery_actions
approval_required
```

---

# 16. Wash Complexity and Repeat-Cycle Governance

## 16.1 Required Reframe

Wash/laundry must be treated as:

```text
value-creation
quality-risk
capacity constraint
shipment-risk amplifier
```

## 16.2 Required Fields

Add or verify on Style / Order / WashRoute / WashBatch:

```text
wash_complexity_class
fashion_effect_required
approved_wash_standard_reference
dry_process_required
wet_process_required
repeat_cycle_allowed
repeat_cycle_probability
max_repeat_cycles
post_wash_qc_criteria
shade_effect_tolerance
customer_effect_approval_status
```

## 16.3 Required WashBatch / Rewash Fields

```text
wash_cycle_no
root_wash_batch_id
parent_wash_batch_id
rewash_reason
effect_qc_result
shade_qc_result
handfeel_qc_result
capacity_minutes_consumed
shipment_risk_before
shipment_risk_after
```

## 16.4 Required Behaviour

```text
1. Repeat wash consumes capacity.
2. Repeat wash updates WIP.
3. Repeat wash updates shipment risk.
4. Repeat wash beyond max_repeat_cycles requires approval.
5. Effect/shade failure creates quality/wash exception.
6. Wash-standard approval is visible as upstream readiness milestone.
```

---

# 17. FastReact / External Plan Validation-as-Draft

## 17.1 Required Rule

FastReact or any external planning file must be treated as:

```text
external plan input
```

not:

```text
committed schedule truth
```

## 17.2 Required Flow

```text
Import external plan
→ create external plan import batch
→ validate against EOS capacity, WIP, wash, shipment-risk rules
→ create DRAFT platform plan version
→ show conflicts
→ planner reviews
→ planner freezes or changes plan inside EOS
```

## 17.3 Required Conflict Types

```text
ORDER_NOT_FOUND
STYLE_NOT_READY
LINE_NOT_FOUND
WORKCENTER_NOT_FOUND
CAPACITY_OVERLOAD
PCD_NOT_READY
WIP_NOT_AVAILABLE
WASH_ROUTE_MISSING
SHIPMENT_RISK
FROZEN_ZONE_CONFLICT
```

## 17.4 Required APIs

```text
POST /api/v1/external-plans/import
GET /api/v1/external-plans/{importId}/validation
POST /api/v1/external-plans/{importId}/create-draft-plan
POST /api/v1/external-plans/{importId}/reject
```

If import framework exists, implement these as import types:

```text
fastreact_plan
external_plan
```

---

# 18. Required Permissions

Add if missing:

```text
boundary_case.view
boundary_case.create
boundary_case.preview_impact
boundary_case.approve_recovery
boundary_case.apply_action

planning.apply_boundary_replan
planning.override_frozen_zone
planning.approve_firm_zone_change

capacity.view_events
capacity.create_loss_event
capacity.create_addition_event
capacity.approve_addition
capacity.apply_event

orders.request_change
orders.approve_change
orders.cancel_preview
orders.request_cancellation
orders.approve_cancellation_disposition

wash.approve_repeat_cycle
wash.approve_effect_waiver

external_plan.import
external_plan.validate
external_plan.create_draft_plan
```

Seed these permissions and add permission tests.

---

# 19. Required Audit Events

Add if missing:

```text
BOUNDARY_CASE_CREATED
BOUNDARY_IMPACT_PREVIEWED
BOUNDARY_ACTION_APPROVED
BOUNDARY_ACTION_APPLIED
BOUNDARY_CASE_CLOSED

ORDER_CHANGE_PREVIEWED
ORDER_CHANGE_REQUESTED
ORDER_CHANGE_APPROVED
ORDER_CHANGE_APPLIED

ORDER_CANCELLATION_PREVIEWED
ORDER_CANCELLATION_REQUESTED
ORDER_CANCELLATION_APPROVED
ORDER_CANCELLATION_APPLIED

CAPACITY_LOSS_RECORDED
CAPACITY_ADDITION_REQUESTED
CAPACITY_ADDITION_APPROVED
CAPACITY_EVENT_APPLIED

SHIPMENT_PULL_IN_PREVIEWED
SHIPMENT_PULL_IN_REQUESTED
SHIPMENT_PULL_IN_APPROVED
SHIPMENT_PULL_IN_APPLIED

FROZEN_ZONE_CHANGE_REQUESTED
FROZEN_ZONE_CHANGE_APPROVED
FROZEN_ZONE_CHANGE_APPLIED

WASH_EFFECT_REJECTED
REPEAT_WASH_APPROVAL_REQUIRED
REPEAT_WASH_APPROVED

EXTERNAL_PLAN_IMPORTED
EXTERNAL_PLAN_VALIDATED
EXTERNAL_PLAN_CONFLICT_FOUND
EXTERNAL_PLAN_DRAFT_CREATED
```

---

# 20. API Contract Additions

## 20.1 Boundary Cases

```text
GET  /api/v1/boundary-cases
GET  /api/v1/boundary-cases/{id}
POST /api/v1/boundary-cases
POST /api/v1/boundary-cases/impact-preview
POST /api/v1/boundary-cases/{id}/approve-action
POST /api/v1/boundary-cases/{id}/apply-action
```

## 20.2 Capacity Events

```text
POST /api/v1/capacity-events/impact-preview
POST /api/v1/capacity-events
POST /api/v1/capacity-events/{eventId}/approve
POST /api/v1/capacity-events/{eventId}/apply
```

## 20.3 Order Changes

```text
POST /api/v1/orders/{orderId}/change-impact-preview
POST /api/v1/orders/{orderId}/change-request
POST /api/v1/orders/{orderId}/cancel-impact-preview
POST /api/v1/orders/{orderId}/cancel-request
POST /api/v1/orders/change-requests/{requestId}/approve
POST /api/v1/orders/change-requests/{requestId}/apply
```

## 20.4 Shipment Pull-In

```text
POST /api/v1/orders/{orderId}/shipment-pull-in-preview
POST /api/v1/orders/{orderId}/shipment-pull-in-request
POST /api/v1/orders/{orderId}/shipment-pull-in-approve
POST /api/v1/orders/{orderId}/shipment-pull-in-apply
```

## 20.5 External Plans

```text
POST /api/v1/external-plans/import
GET  /api/v1/external-plans/{importId}/validation
POST /api/v1/external-plans/{importId}/create-draft-plan
POST /api/v1/external-plans/{importId}/reject
```

---

# 21. Frontend Direction Additions

Phase 4A frontend can be minimal, but future phases must consume these rules.

## 21.1 Immediate Phase 4A UI

Add one or both:

```text
/boundary-cases
```

and reusable:

```text
BoundaryImpactPreviewDrawer
```

Minimum display:

```text
boundary event list
severity
status
linked order/workcenter
owner
recommended action
approval requirement
impact preview
```

## 21.2 Future Phase Guidance

Future screens must incorporate Phase 4A logic:

| Future Surface | Required Phase 4A Influence |
|---|---|
| WIP Pipeline | Show cancellation/freeze/reclassify impacts. |
| Sewing Line Loading | Show capacity loss, absenteeism, machine breakdown. |
| Wash Board | Show wash complexity, repeat wash, effect QC. |
| Exceptions | Boundary events create/relate to exceptions. |
| Recovery | Recovery actions come from boundary impact preview. |
| Shipment Readiness | Pull-in and split-shipment impacts visible. |
| Mobile Capture | Capture capacity-loss and wash-effect evidence. |
| Analytics | Track schedule volatility, capacity loss, repeat wash, cost-protected OTIF. |
| Integrations | External plans import as draft and conflict report. |

---

# 22. Seed Scenarios Required

Add these seed scenarios to `20_Seed_Data_Simulation_Scenarios.md` implementation:

```text
SCN-014 Order cancellation before procurement
SCN-015 Order cancellation after cutting
SCN-016 Order cancellation during wash
SCN-017 Sewing capacity loss
SCN-018 Wash capacity loss
SCN-019 Capacity addition through overtime
SCN-020 Shipment pull-in
SCN-021 Frozen plan change request
SCN-022 FastReact imported plan conflict
SCN-023 Wash effect rejection after customer standard mismatch
```

Seed validation must verify each scenario exists and triggers expected rule behaviour.

---

# 23. Test Requirements

## 23.1 Backend Service Tests

Add tests for:

```text
scheduling grain fields present or derivable
planning zone assignment
frozen zone change blocked
firm zone change requires preview/approval
capacity definition lookup by workcenter type
capacity loss impact preview
capacity addition approval requirement
boundary case creation
boundary impact preview response
order cancellation by stage
shipment pull-in preview
repeat wash beyond max cycles requiring approval
external plan conflict validation
```

## 23.2 API Tests

Add tests for:

```text
GET /api/v1/boundary-cases
POST /api/v1/boundary-cases
POST /api/v1/boundary-cases/impact-preview
POST /api/v1/orders/{id}/cancel-impact-preview
POST /api/v1/capacity-events/impact-preview
POST /api/v1/external-plans/import
GET /api/v1/external-plans/{id}/validation
```

## 23.3 Permission Tests

Add tests for:

```text
user without boundary_case.create cannot create event
user without planning.override_frozen_zone cannot approve frozen change
line supervisor cannot apply capacity addition
planner can preview but not approve overtime if permission missing
integration user can import external plan but not freeze it
```

## 23.4 Audit Tests

Verify audit events for:

```text
boundary case creation
capacity loss recorded
capacity addition approved
order cancellation requested
frozen-zone change approved
external plan conflict validation
repeat wash approval
```

## 23.5 Seed Validation Tests

Extend:

```text
python manage.py validate_seed_scenarios
```

to validate SCN-014 to SCN-023.

---

# 24. Codex Build Chunks

Codex must implement Phase 4A in small chunks.

## Chunk 1: Implementation Map

**Goal:** Read docs and current code. Produce a brief implementation map before changing code.

Read:

```text
docs/Eratex_Tech_Spec_Alignment_Review_Rajesh_Feedback.md
docs/02_Data_Model_Table_Schemas_Eratex.md
docs/04_Planning_Logic_Calculation_Flows_Eratex.md
docs/06_API_Data_Contracts_Eratex.md
docs/07_Event_State_Transition_Specification_Eratex.md
docs/10_Wash_Planning_Execution_Specification_Eratex.md
docs/21_Phasewise_Backend_Build_Plan.md
docs/22_Phasewise_Frontend_Build_Plan.md
docs/23_Governance_Spine_Document.md
```

Output:

```text
existing apps/models found
missing models
candidate files to change
migration plan
test plan
risks
```

Do not change code in Chunk 1 unless explicitly instructed.

---

## Chunk 2: Enums, Permissions, Audit Codes

**Goal:** Add foundational enums, permissions, and audit event constants.

Implement:

```text
planning zones
boundary event types
boundary statuses
capacity units
planning buckets
permissions
audit event codes
seed permission updates
tests
```

Validation:

```text
python manage.py check
pytest identity/access/audit related tests
```

---

## Chunk 3: Capacity Definition Matrix

**Goal:** Add workcenter-specific capacity definition model and seed data.

Implement:

```text
WorkcenterCapacityDefinition
capacity service lookup
seed defaults for sewing/wet wash/dry process/drying/finishing/packing
admin registration
tests
```

Validation:

```text
python manage.py makemigrations --check --dry-run
pytest workcenters tests
```

---

## Chunk 4: Planning Zones

**Goal:** Add frozen/firm/flexible zone support.

Implement:

```text
PlanningZoneConfiguration
planning_zone on planned work items
zone assignment helper
frozen-zone direct change blocker
tests
```

Validation:

```text
pytest planning tests
```

---

## Chunk 5: BoundaryCaseEvent and Impact Preview Service

**Goal:** Add boundary case domain model and preview service shell.

Implement:

```text
BoundaryCaseEvent
BoundaryImpactPreview if needed
preview service
list/detail/create APIs
impact-preview API
permissions
audit
tests
```

Validation:

```text
pytest boundary_cases tests
pytest api tests for boundary cases
```

---

## Chunk 6: Order Change / Cancellation / Shipment Pull-In

**Goal:** Add impact-preview flows for order changes.

Implement:

```text
change-impact-preview
cancel-impact-preview
shipment-pull-in-preview
approval/request flow if existing approval model supports it
stage-specific cancellation matrix
tests
```

Validation:

```text
pytest orders tests
pytest planning boundary tests
```

---

## Chunk 7: Capacity Loss / Addition Events

**Goal:** Add capacity event APIs and impact preview.

Implement:

```text
capacity event preview
capacity event create
approve/apply flow
workcenter utilization recalculation hooks
exception creation when risk RED/BLACK
tests
```

Validation:

```text
pytest workcenters tests
pytest exceptions tests
```

---

## Chunk 8: Wash Complexity and Repeat-Cycle Governance

**Goal:** Patch wash and style/wash route models.

Implement:

```text
wash complexity fields
wash effect approval fields
repeat cycle fields
max repeat cycle approval rule
capacity minutes consumed by repeat wash
shipment risk before/after fields
tests
```

Validation:

```text
pytest washing tests
```

---

## Chunk 9: External Plan Validation-as-Draft

**Goal:** Add external/FastReact plan validation logic.

Implement:

```text
external plan import type
validation result
conflict types
draft plan creation
reject import
tests
```

Validation:

```text
pytest integrations tests
pytest planning tests
```

---

## Chunk 10: Seed Scenarios and Validation

**Goal:** Add SCN-014 to SCN-023.

Implement:

```text
seed scenario records
validate_seed_scenarios updates
tests or smoke validation
```

Validation:

```text
python manage.py seed_demo_all
python manage.py validate_seed_scenarios
```

---

## Chunk 11: Minimal Frontend Hooks / Surface

**Goal:** Add basic boundary-case frontend visibility.

Implement:

```text
BoundaryCaseListPage
BoundaryImpactPreviewDrawer
API hooks
planning zone badge
workcenter capacity drawer, if feasible
tests
```

Validation:

```text
npm run typecheck
npm run test
npm run build
```

---

## Chunk 12: Documentation Patch

**Goal:** Patch docs to align future phases.

Update at minimum:

```text
docs/02_Data_Model_Table_Schemas_Eratex.md
docs/04_Planning_Logic_Calculation_Flows_Eratex.md
docs/06_API_Data_Contracts_Eratex.md
docs/07_Event_State_Transition_Specification_Eratex.md
docs/10_Wash_Planning_Execution_Specification_Eratex.md
docs/11_Exception_Alert_Recovery_Specification_Eratex.md
docs/13_Frontend_Implementation_Specification.md
docs/19_Testing_QA_Strategy.md
docs/20_Seed_Data_Simulation_Scenarios.md
docs/21_Phasewise_Backend_Build_Plan.md
docs/22_Phasewise_Frontend_Build_Plan.md
docs/23_Governance_Spine_Document.md
docs/24_Implementation_Readiness_Checklist.md
```

Also add this document to repo:

```text
docs/25_Phase_4A_Scheduling_Behaviour_Rulebook_Alignment_Patch.md
```

---

# 25. Phase 4A Exit Criteria

Phase 4A is complete only when:

```text
1. MVP scheduling grain is represented in code/API/docs.
2. Planning zones exist and frozen-zone change is blocked without approval.
3. Workcenter capacity definition matrix exists and is seeded.
4. BoundaryCaseEvent exists and has APIs.
5. Boundary impact preview exists for at least capacity loss, order cancellation, and shipment pull-in.
6. Wash complexity and repeat-cycle governance fields exist.
7. External plan validation-as-draft exists or is clearly stubbed with tests.
8. Required permissions are seeded.
9. Required audit events are emitted for implemented flows.
10. SCN-014 to SCN-023 seed scenarios are defined and validated.
11. Tests pass.
12. Docs are patched for future-phase guidance.
```

---

# 26. Future Phase Consumption Rules

## Phase 5: WIP

Must consume:

```text
order cancellation disposition
boundary-linked WIP movement
frozen/reclassified WIP status
shade-lot and wash-batch traceability
```

## Phase 6: Sewing

Must consume:

```text
capacity loss
machine breakdown
absenteeism spike
line shortfall impact preview
planning-zone-aware recovery
```

## Phase 7: Wash

Must consume:

```text
wash complexity
effect approval
repeat wash cycles
max repeat cycle approval
capacity impact
shipment risk before/after
```

## Phase 8: Exceptions / Recovery / Shipment

Must consume:

```text
boundary cases as exception/recovery sources
shipment pull-in events
frozen-plan change approvals
cost-protected OTIF markers
```

## Phase 9: Mobile

Must consume:

```text
capacity-loss capture
machine breakdown capture
wash effect QC evidence
offline-safe boundary event creation where applicable
```

## Phase 10: Integrations

Must consume:

```text
FastReact/external plan validation-as-draft
Excel transition conflict reports
no uncontrolled imported plan truth
```

## Phase 11: Analytics

Must consume:

```text
schedule volatility
boundary events by type
capacity loss hours
capacity added by overtime
repeat wash rate
wash effect rejection rate
cost-protected OTIF by recovery lever
```

---

# 27. Final Instruction to Codex

Implement Phase 4A as a controlled alignment patch.

Do not overbuild mature-state capabilities.

Do not weaken existing working Phase 1–4 flows.

Do not bypass RBAC, audit, or service-layer rules.

The final result should make the already-built foundation boundary-case aware and make all future phases directionally aligned with Rajesh’s field feedback.

The core outcome is:

```text
Before building deeper MVP surfaces, the platform must know how the schedule behaves
when real factory conditions change.
```
