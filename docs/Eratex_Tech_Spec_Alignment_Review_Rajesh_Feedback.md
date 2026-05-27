# Technical Specification Alignment Review  
## Rajesh Consultant Feedback vs Eratex 24-Document Build Pack

**Context:** Eratex denim bottoms + chinos planning and scheduling platform  
**Input inspected:** `docs.zip` project folder  
**Core reviewed set:** `01` to `24` technical/build documents  
**BRD refinement sources reviewed:**  
- `docs/brd/02_Rajesh_Eratex_Challenges_Solution_Direction_Synthesis.md`
- `docs/brd/03_Reconciliation_Rajesh_Feedback_vs_Eratex_BRD_EOS_Direction.md`
- `docs/brd/04_Diff_Eratex_BRD_Refinement_From_Rajesh_Inputs.md`
- `docs/brd/Eratex_Planning_Scheduling_Tool_BRD.md`

---

## 1. Executive Conclusion

The 24-document technical pack is directionally strong and already covers the major Eratex operating spine:

```text
order
→ readiness
→ planning
→ release
→ production
→ wash
→ WIP
→ exception
→ recovery
→ shipment
→ analytics
```

Rajesh’s feedback does **not** require a reversal of the architecture. It requires a **course correction in emphasis and build sequencing**.

The most important correction is this:

```text
Do not move directly from BRD to planning-engine build.

First create a Scheduling Behaviour Rulebook and Simulation Validation phase
that defines exactly how the system reacts when factory reality changes.
```

The current technical pack already covers wash, WIP, exceptions, recovery, RBAC, audit, frontend, analytics, and deployment. However, after Rajesh’s input, the following areas need to be tightened:

```text
1. Scheduling grain must be explicitly locked.
2. Boundary-case behavior must become a formal system layer.
3. Wash/laundry must be modeled as value-creation + quality-risk + capacity constraint.
4. Upstream enquiry / quotation / sampling milestones must be minimally visible.
5. Capacity definitions must be workcenter-specific, not generic.
6. Automation boundaries must be explicit: recommend and preview first, auto-reschedule later only if validated.
7. Phase 0A must be added before deep planning-engine implementation.
```

---

## 2. What Rajesh’s Feedback Changes

### 2.1 Previous Orientation

The original 24-document pack already assumed:

```text
FastReact / planning tool exists
Excel still drives real planning
OTIF is protected through extra operating expense
resource utilization is around 70%
Eratex needs end-to-end planning/scheduling control
```

This is still valid.

### 2.2 Refined Orientation

Rajesh’s feedback sharpens the root cause:

```text
The issue is not just tool underuse.
The issue is that denim garmenting requires a live operating spine that understands
wash-driven value creation, quality-risk loops, capacity changes, cancellations,
rewash cycles, and shipment-risk reactions.
```

### 2.3 Key Product Reframe

The product should be framed as:

```text
A live, denim-aware, wash-aware, capacity-aware, WIP-trusted,
exception-owned operating spine that can react when factory reality changes.
```

---

## 3. Highest-Priority Technical Corrections

## 3.1 Add Phase 0A: Scheduling Behaviour Rulebook and Simulation Validation

### Current gap

Documents `21_Phasewise_Backend_Build_Plan.md`, `22_Phasewise_Frontend_Build_Plan.md`, and `24_Implementation_Readiness_Checklist.md` start with technical foundation and then proceed into build phases. They do not yet force a **pre-build scheduling behavior workshop/gate**.

### Required correction

Add a new phase before backend/frontend Phase 1:

```text
Phase 0A: Scheduling Behaviour Rulebook and Simulation Validation
```

### Phase 0A must produce

```text
1. MVP scheduling grain decision
2. Capacity definition matrix
3. Order cancellation matrix
4. Quantity/date change reaction matrix
5. Capacity loss/addition reaction matrix
6. Wash/rewash behavior matrix
7. Shipment pull-in reaction matrix
8. Frozen-zone and firm-zone change rules
9. Planner-control vs system-control boundary
10. Boundary-case seed scenario pack
11. BRD-to-build traceability matrix
```

### Documents to update

| Document | Required update |
|---|---|
| `21_Phasewise_Backend_Build_Plan.md` | Insert Phase 0A before Phase 0/1; block planning-engine build until rulebook is approved. |
| `22_Phasewise_Frontend_Build_Plan.md` | Add simulation/prototype screens in early phase before full planning UI. |
| `24_Implementation_Readiness_Checklist.md` | Add a Phase 0A gate and no-go condition. |
| `23_Governance_Spine_Document.md` | Add rule that scheduling behavior changes require rulebook update. |
| `19_Testing_QA_Strategy.md` | Add boundary-case validation suite before UAT. |
| `20_Seed_Data_Simulation_Scenarios.md` | Add cancellation/capacity-change/shipment pull-in scenario pack. |

---

## 3.2 Lock the MVP Scheduling Grain

### Current gap

The technical pack talks about planning, workcenter load, WIP, wash, and line loading, but the exact MVP scheduling grain is not consistently locked across all documents.

### Required correction

Add this exact grain across the build pack:

```text
MVP scheduling grain =
order × style × color/shade-lot × production stage × workcenter/line × date/shift

Wash grain =
wash batch

Operation-level detail =
technical validation, SMV, line balance, and operation bulletin performance,
not full operation-by-operation finite scheduling in MVP unless validated later.
```

### Why this matters

Without a locked grain, frontend, backend, and business teams may assume different scheduling levels:

```text
order-level
PO-level
style/color-level
batch-level
line-level
operation-level
shipment-level
```

This will cause planning-engine ambiguity.

### Documents to update

| Document | Required update |
|---|---|
| `02_Data_Model_Table_Schemas_Eratex.md` | Add grain fields to PlannedWorkItem, WIPItem, WashBatch, LineLoading, PlanSnapshot. |
| `04_Planning_Logic_Calculation_Flows_Eratex.md` | Add explicit planning-grain section before calculations. |
| `06_API_Data_Contracts_Eratex.md` | Add grain fields to planning, release, WIP, wash APIs. |
| `07_Event_State_Transition_Specification_Eratex.md` | Add state transition grain context. |
| `13_Frontend_Implementation_Specification.md` | Show grain in planning filters and work item cards. |
| `21_Phasewise_Backend_Build_Plan.md` | Make grain validation part of Phase 0A exit criteria. |
| `22_Phasewise_Frontend_Build_Plan.md` | Build planning workbench around this grain. |

---

## 3.3 Create a Boundary-Case Event Layer

### Current gap

The current pack covers exceptions and state transitions, but boundary cases are distributed across documents. They need to become a formal system concept.

### Required correction

Add a new domain concept:

```text
BoundaryCaseEvent
```

This should cover:

```text
order cancellation
quantity change
delivery date change
shipment pull-in
capacity loss
capacity addition
machine breakdown
absenteeism
wash repeat cycle
QC failure
frozen plan change request
customer priority change
```

### New model proposal

```text
BoundaryCaseEvent
- id
- event_type
- linked_order_id
- linked_plan_id
- linked_workcenter_id
- linked_wash_batch_id
- event_stage
- trigger_source
- old_value_json
- new_value_json
- affected_quantity
- affected_capacity_minutes
- affected_shipment_date
- risk_before
- risk_after
- recommended_action
- approval_required
- owner_id
- status
- created_by
- created_at
```

### Event types

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
```

### Documents to update

| Document | Required update |
|---|---|
| `02_Data_Model_Table_Schemas_Eratex.md` | Add BoundaryCaseEvent and BoundaryImpactPreview tables. |
| `05_Backend_Domain_Module_Specification_Eratex.md` | Add `boundary_cases` or fold into `planning/exceptions` with clear ownership. |
| `06_API_Data_Contracts_Eratex.md` | Add boundary-case APIs and impact-preview responses. |
| `07_Event_State_Transition_Specification_Eratex.md` | Add boundary event state transitions. |
| `11_Exception_Alert_Recovery_Specification_Eratex.md` | BoundaryCaseEvent may create exception/recovery action. |
| `17_Audit_Compliance_Traceability_Specification.md` | Audit all boundary-case decisions. |
| `20_Seed_Data_Simulation_Scenarios.md` | Add boundary-case seed scenarios. |
| `23_Governance_Spine_Document.md` | Make boundary cases governed events, not informal planner notes. |

---

## 3.4 Add Order Cancellation and Order Change Logic

### Current gap

Order cancellation exists as a status in some documents, but there is no full cancellation behavior matrix by production stage.

### Required correction

Add cancellation behavior by stage.

| Cancellation stage | Required system reaction |
|---|---|
| Before procurement | Release planning capacity; cancel procurement intent; audit cancellation. |
| After procurement | Flag material liability; check material reallocation; update planning risk. |
| After fabric receipt | Reclassify fabric stock; check customer/style usability; update WIP/material exposure. |
| After cutting | Freeze or reclassify cut panels; require management decision. |
| During sewing | Stop further release; update WIP; release line capacity; replan affected orders. |
| During wash | Identify semi-finished/washed WIP; decide reallocation, hold, or scrap. |
| After finishing/packing | Trigger shipment/customer decision; finished goods disposition required. |

### Documents to update

| Document | Required update |
|---|---|
| `04_Planning_Logic_Calculation_Flows_Eratex.md` | Add order change/cancellation logic flow. |
| `06_API_Data_Contracts_Eratex.md` | Add `POST /api/v1/orders/{id}/change-request` and cancellation impact preview. |
| `07_Event_State_Transition_Specification_Eratex.md` | Add cancellation transitions by stage. |
| `08_WIP_Inventory_Reconciliation_Specification_Eratex.md` | Add WIP disposition rules for cancelled orders. |
| `11_Exception_Alert_Recovery_Specification_Eratex.md` | Add cancellation exceptions and recovery actions. |
| `14_Analytics_Reporting_Specification.md` | Track cancellation after procurement/cutting/wash as planning volatility metric. |

---

## 3.5 Add Capacity Definition Matrix by Workcenter

### Current gap

Capacity logic exists, but Rajesh’s input requires capacity to be defined operationally and differently by workcenter.

### Required correction

Add a capacity definition matrix for every workcenter.

| Field | Meaning |
|---|---|
| Capacity unit | Pieces/day, SMV minutes, batch minutes, machine hours, operator hours, line-days. |
| Planning bucket | Shift, day, week, or batch. |
| Primary constraint resource | The main limiting factor. |
| Secondary constraint resource | Supporting bottleneck. |
| Normal capacity | Baseline capacity. |
| Approved overtime capacity | Additional committed capacity. |
| Capacity loss triggers | Absenteeism, breakdown, quality hold, rework, input shortage. |
| Recovery levers | Overtime, resequence, split batch, alternate line, outsource, defer. |

### Required examples

| Workcenter | Capacity unit | Primary constraint | Secondary constraint | Recovery levers |
|---|---|---|---|---|
| Sewing line | SMV minutes + net-good pieces/day | Manpower and line balance | Skill mix, machines, absenteeism | Add helpers, line change, overtime, split order |
| Wet wash | Batch minutes + pieces/day | Washer machine time | Dryer and post-wash QC | Resequence, split batch, overtime, defer low-risk batch |
| Dry process | Operator-hours + style complexity | Skilled manual effect operators | Standard approval and quality inspection | Add skilled workers, resequence, outsource |
| Drying | Dryer minutes/batches | Dryer machine time | Post-wash QC | Extend shift, re-sequence batches |
| Packing | Pieces/cartons/day | Packing manpower | Documentation/AQL readiness | Add manpower, prioritize shipment orders |

### Documents to update

| Document | Required update |
|---|---|
| `03_Master_Data_Specification_Eratex.md` | Add capacity unit, bucket, primary/secondary constraint, recovery levers. |
| `04_Planning_Logic_Calculation_Flows_Eratex.md` | Add capacity calculation by workcenter type. |
| `05_Backend_Domain_Module_Specification_Eratex.md` | Add capacity service per workcenter type. |
| `06_API_Data_Contracts_Eratex.md` | Add capacity matrix API contract. |
| `13_Frontend_Implementation_Specification.md` | Workcenter load drawer should show capacity definition. |
| `14_Analytics_Reporting_Specification.md` | Utilization analytics should use correct unit by workcenter. |
| `20_Seed_Data_Simulation_Scenarios.md` | Add seed capacity definitions. |

---

## 3.6 Reframe Wash as Value-Creation + Quality-Risk + Capacity Domain

### Current gap

The wash specification is already detailed, but Rajesh’s input requires a stronger conceptual and technical framing.

### Required correction

Change the wash objective from:

```text
Wash is a production constraint.
```

to:

```text
Wash/laundry is a denim value-creation, quality-risk, and capacity-constraining
production domain where product effect, customer acceptance, WIP ageing,
rework, and shipment risk converge.
```

### Add required master fields

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

### Add required execution fields

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

### Documents to update

| Document | Required update |
|---|---|
| `02_Data_Model_Table_Schemas_Eratex.md` | Add wash complexity/effect fields to Style, Order, WashRoute, WashBatch. |
| `03_Master_Data_Specification_Eratex.md` | Add wash complexity and fashion-effect standards. |
| `04_Planning_Logic_Calculation_Flows_Eratex.md` | Add wash value/risk logic, not only capacity math. |
| `10_Wash_Planning_Execution_Specification_Eratex.md` | Reframe purpose and add customer effect approval + repeat probability. |
| `13_Frontend_Implementation_Specification.md` | Wash board should show complexity/effect approval status. |
| `14_Analytics_Reporting_Specification.md` | Add wash route performance, effect failure rate, repeat-cycle rate. |
| `20_Seed_Data_Simulation_Scenarios.md` | Add fashion-effect rejection and repeated wash seed scenario. |

---

## 3.7 Add Upstream Enquiry, Quotation, Sampling, and Approval Milestones

### Current gap

The BRD originally includes enquiry/sampling in the broad process, but the technical documents do not consistently model these as upstream order lifecycle milestones.

### Required correction

Keep full costing outside MVP unless confirmed as immediate pain, but add minimal upstream lifecycle visibility.

### Add order lifecycle milestones

```text
ENQUIRY_RECEIVED
QUOTATION_SENT
SAMPLE_REQUESTED
PROTO_SAMPLE_SUBMITTED
FIT_SAMPLE_APPROVED
WASH_STANDARD_APPROVED
PP_SAMPLE_APPROVED
ORDER_CONFIRMED
```

### Add fields

```text
quotation_status
sample_status
wash_standard_approval_status
pp_sample_status
order_confirmation_status
```

### Documents to update

| Document | Required update |
|---|---|
| `01_Technical_Architecture_Spine_Eratex.md` | Add upstream milestone visibility as part of Order Lifecycle. |
| `02_Data_Model_Table_Schemas_Eratex.md` | Add OrderMilestone / SampleApproval fields. |
| `03_Master_Data_Specification_Eratex.md` | Add approval milestone master. |
| `06_API_Data_Contracts_Eratex.md` | Add order milestone APIs. |
| `13_Frontend_Implementation_Specification.md` | Order lifecycle surface should show upstream milestone strip. |
| `20_Seed_Data_Simulation_Scenarios.md` | Add seed orders with sample/wash-standard pending. |
| `21_Phasewise_Backend_Build_Plan.md` | Include minimal upstream milestone model in orders phase. |
| `22_Phasewise_Frontend_Build_Plan.md` | Include upstream milestone display in Order surface. |

---

## 3.8 Add Frozen-Zone and Firm-Zone Planning Controls

### Current gap

Plan freeze exists, but the Rajesh diff needs more nuanced scheduling control.

### Required correction

Add planning zones:

```text
FROZEN_ZONE
FIRM_ZONE
FLEXIBLE_ZONE
```

### Governance

| Zone | Meaning | Allowed behavior |
|---|---|---|
| Frozen zone | Already committed / near execution | No automatic reschedule; approval required. |
| Firm zone | Short horizon, constrained | Impact preview and approval for significant change. |
| Flexible zone | Longer horizon | Planner can adjust within rules. |

### Documents to update

| Document | Required update |
|---|---|
| `02_Data_Model_Table_Schemas_Eratex.md` | Add planning zone fields to PlanVersion/PlannedWorkItem. |
| `04_Planning_Logic_Calculation_Flows_Eratex.md` | Add zone-based rescheduling rules. |
| `06_API_Data_Contracts_Eratex.md` | Add zone in plan APIs and impact previews. |
| `07_Event_State_Transition_Specification_Eratex.md` | Add transitions for frozen/firm/flexible. |
| `13_Frontend_Implementation_Specification.md` | Show frozen/firm zones visually in weekly planning. |
| `21_Phasewise_Backend_Build_Plan.md` | Add in planning phase. |
| `22_Phasewise_Frontend_Build_Plan.md` | Add visual planning-zone controls. |

---

## 3.9 Define Automation Boundary: Recommend, Preview, Approve

### Current gap

The current docs discuss recommendations and recovery, but the automation boundary needs to be made explicit.

### Required correction

MVP behavior should be:

```text
The system recommends recovery and previews impact.
The planner or authorized approver commits schedule changes.
The system must not automatically change frozen/firm plans without approval.
```

### Automation levels

| Level | Meaning | MVP status |
|---|---|---|
| Level 0 | Alert only | Supported |
| Level 1 | Recommend action | Supported |
| Level 2 | Preview impact | Supported |
| Level 3 | Apply after approval | Supported selectively |
| Level 4 | Auto-reschedule | Outside MVP unless validated |

### Documents to update

| Document | Required update |
|---|---|
| `04_Planning_Logic_Calculation_Flows_Eratex.md` | Add automation boundary section. |
| `11_Exception_Alert_Recovery_Specification_Eratex.md` | Recovery recommendations must show reason and impact. |
| `13_Frontend_Implementation_Specification.md` | Action UI should differentiate recommend vs apply. |
| `16_Security_Roles_Permissions_Specification.md` | Add permissions for applying recommended changes. |
| `23_Governance_Spine_Document.md` | Add automation boundary as non-negotiable rule. |
| `24_Implementation_Readiness_Checklist.md` | Add no-go if auto-commit behavior is unclear. |

---

## 3.10 Strengthen FastReact / Excel Coexistence in Integration Specs

### Current gap

The integration spec already handles FastReact, but Rajesh’s feedback implies a stronger validation approach.

### Required correction

FastReact output should be treated as:

```text
external plan input
not committed schedule truth
```

### Required behavior

```text
Import FastReact plan
→ validate against EOS capacity, WIP, wash, and shipment-risk rules
→ create draft platform plan version
→ show conflicts
→ planner reviews
→ platform owns release/execution/WIP/recovery
```

### Documents to update

| Document | Required update |
|---|---|
| `15_Integration_Specification.md` | Strengthen FastReact import-as-draft rule. |
| `04_Planning_Logic_Calculation_Flows_Eratex.md` | Add imported-plan validation logic. |
| `06_API_Data_Contracts_Eratex.md` | Add external plan import validation result. |
| `21_Phasewise_Backend_Build_Plan.md` | Treat FastReact import after rulebook, not before. |
| `20_Seed_Data_Simulation_Scenarios.md` | Add FastReact imported plan with conflicts scenario. |

---

## 4. Document-by-Document Change Register

## 4.1 `01_Technical_Architecture_Spine_Eratex.md`

Add:

```text
- Phase 0A as architecture precondition.
- BoundaryCaseEvent as cross-domain concept.
- Upstream order milestone visibility.
- Automation boundary: recommend/preview/approve.
```

## 4.2 `02_Data_Model_Table_Schemas_Eratex.md`

Add/modify:

```text
- ProductComplexityClass
- WashComplexityClass
- OrderMilestone / SampleApproval fields
- BoundaryCaseEvent
- BoundaryImpactPreview
- CapacityDefinitionMatrix
- PlanningZone on PlanVersion/PlannedWorkItem
- OrderChangeRequest / CancellationImpact
- Wash effect standard fields
- Rewash cycle and effect QC fields
```

## 4.3 `03_Master_Data_Specification_Eratex.md`

Add:

```text
- Product complexity master
- Wash complexity master
- Fashion-effect standard master
- Capacity unit master
- Recovery lever master by workcenter
- Planning-zone configuration
- Boundary-case rule master
```

## 4.4 `04_Planning_Logic_Calculation_Flows_Eratex.md`

Add:

```text
- MVP scheduling grain
- Planning-zone logic
- Boundary-case reaction flows
- Cancellation impact flow
- Capacity loss/addition recalculation
- Shipment pull-in flow
- Automation boundary logic
- Imported-plan validation flow
```

## 4.5 `05_Backend_Domain_Module_Specification_Eratex.md`

Add:

```text
- boundary_cases domain/module or service group
- planning.services.boundary_impact
- workcenters.services.capacity_matrix
- washing.services.effect_quality
- orders.services.order_change
```

## 4.6 `06_API_Data_Contracts_Eratex.md`

Add endpoints:

```text
POST /api/v1/orders/{id}/change-request
POST /api/v1/orders/{id}/cancel-impact-preview
POST /api/v1/planning/impact-preview/boundary-case
GET  /api/v1/workcenters/capacity-definition
POST /api/v1/capacity-events
GET  /api/v1/boundary-cases
POST /api/v1/boundary-cases/{id}/approve-action
POST /api/v1/external-plans/{id}/validate
```

## 4.7 `07_Event_State_Transition_Specification_Eratex.md`

Add transitions for:

```text
order cancellation by stage
quantity/date change
capacity loss/addition
shipment pull-in
frozen-zone change
boundary case → exception
boundary case → recovery action
boundary case → approved plan change
```

## 4.8 `08_WIP_Inventory_Reconciliation_Specification_Eratex.md`

Add:

```text
- cancellation-stage WIP disposition
- shade-lot/batch preservation for wash-heavy WIP
- WIP freeze/reclassify state
- boundary-case linked WIP movement
```

## 4.9 `09_Line_Routing_Operation_Bulletin_Specification_Eratex.md`

Add:

```text
- product complexity and wash complexity link to bulletin assumptions
- learning curve as capacity modifier
- line-style fit impact on planning
- boundary cases for absenteeism/machine gap/style complexity change
```

## 4.10 `10_Wash_Planning_Execution_Specification_Eratex.md`

Add:

```text
- wash as value-creation domain framing
- fashion-effect standard approval
- wash-standard approval linkage to sampling/PCD
- dry vs wet process planning separation
- repeat probability and max repeat cycles
- post-wash effect QC
- capacity impact of repeated cycle
```

## 4.11 `11_Exception_Alert_Recovery_Specification_Eratex.md`

Add exception categories/rules for:

```text
ORDER_CANCELLED_AFTER_CUTTING
CAPACITY_LOSS
CAPACITY_ADDITION_APPROVAL_REQUIRED
SHIPMENT_PULL_IN_OVERLOAD
FROZEN_PLAN_CHANGE_REQUESTED
WASH_EFFECT_REJECTED
REWASH_REPEAT_EXCEEDED
```

## 4.12 `12_Handheld_Shopfloor_Capture_Technical_Spec.md`

Add mobile capture for:

```text
capacity loss event
machine breakdown
operator absenteeism impact
order hold/cancellation notice acknowledgement
wash effect QC photo/evidence
boundary-case issue capture
```

## 4.13 `13_Frontend_Implementation_Specification.md`

Add screens/panels:

```text
- Boundary Case Control Panel
- Planning impact preview drawer
- Capacity definition drawer
- Order change/cancellation impact drawer
- Upstream milestone strip on order lifecycle
- Wash complexity/effect status on wash board
```

## 4.14 `14_Analytics_Reporting_Specification.md`

Add KPIs:

```text
schedule volatility
boundary events by type
frozen-zone changes
cancellation after procurement/cutting/wash
capacity loss hours
capacity added by overtime
rewash repeat-cycle rate
wash effect rejection rate
cost-protected OTIF by recovery lever
```

## 4.15 `15_Integration_Specification.md`

Add:

```text
- FastReact import-as-draft governance
- imported plan validation results
- Excel transition status tracking
- external plan conflict report
```

## 4.16 `16_Security_Roles_Permissions_Specification.md`

Add permissions:

```text
boundary_case.view
boundary_case.create
boundary_case.approve_recovery
planning.apply_boundary_replan
planning.override_frozen_zone
capacity.approve_addition
orders.approve_cancellation_disposition
wash.approve_repeat_cycle
```

## 4.17 `17_Audit_Compliance_Traceability_Specification.md`

Add audit events:

```text
BOUNDARY_CASE_CREATED
CANCELLATION_IMPACT_PREVIEWED
CAPACITY_LOSS_RECORDED
CAPACITY_ADDITION_APPROVED
SHIPMENT_PULL_IN_REVIEWED
FROZEN_ZONE_CHANGE_APPROVED
WASH_EFFECT_REJECTED
REPEAT_WASH_APPROVED
```

## 4.18 `18_Deployment_DevOps_Specification.md`

Minor update:

```text
- Add Phase 0A artifacts as required deploy/build documentation inputs.
- Add seed validation and boundary-case simulation checks to staging readiness.
```

## 4.19 `19_Testing_QA_Strategy.md`

Add mandatory tests:

```text
- cancellation before procurement
- cancellation after cutting
- cancellation during wash
- capacity loss in sewing
- capacity loss in wash
- capacity addition requiring approval
- shipment pull-in causing overload
- frozen-zone change requiring approval
- repeated wash beyond threshold
- imported FastReact plan conflict
```

## 4.20 `20_Seed_Data_Simulation_Scenarios.md`

Add new scenarios:

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

## 4.21 `21_Phasewise_Backend_Build_Plan.md`

Add:

```text
- Phase 0A before implementation.
- boundary_cases app/services.
- capacity definition matrix before workcenter load build.
- order change/cancellation APIs before full planning.
- rulebook approval as gate before Phase 4 planning.
```

## 4.22 `22_Phasewise_Frontend_Build_Plan.md`

Add:

```text
- Boundary-case simulation prototype in early phase.
- Impact-preview drawer components before full weekly planning.
- Upstream milestone strip in order lifecycle surface.
- Workcenter capacity definition panel.
- Wash effect/complexity indicators.
```

## 4.23 `23_Governance_Spine_Document.md`

Add non-negotiables:

```text
- No deep planning-engine build before Scheduling Behaviour Rulebook.
- MVP uses recommendation/impact preview, not autonomous frozen-plan rescheduling.
- Boundary-case events must be visible, owned, and auditable.
- Capacity definitions must be workcenter-specific.
```

## 4.24 `24_Implementation_Readiness_Checklist.md`

Add new gate:

```text
Gate 0A: Scheduling Behaviour Rulebook Readiness
```

Checklist items:

```text
- MVP scheduling grain confirmed
- capacity definition matrix approved
- cancellation matrix approved
- capacity change matrix approved
- wash/rewash behavior matrix approved
- shipment pull-in behavior approved
- automation boundary approved
- boundary-case seed scenarios defined
- prototype validation scope approved
```

---

## 5. Recommended Build Alignment Sequence

The build should now follow this revised sequence:

```text
0. Governance and BRD alignment
0A. Scheduling Behaviour Rulebook and Simulation Validation
1. Technical foundation: Django, RBAC, audit, API envelope
2. Master data: style, bulletin, wash route, capacity definitions
3. Order lifecycle with upstream milestones
4. PCD readiness and release gates
5. Boundary-case event and impact-preview services
6. Planning and workcenter load
7. WIP pipeline and reconciliation
8. Sewing output and line loading
9. Wash planning, effect QC, and rewash loop
10. Exceptions and recovery
11. Shipment readiness
12. Shopfloor mobile capture
13. Integrations and FastReact/Excel migration
14. Analytics and cost-protected OTIF
15. Hardening, UAT, pilot
```

---

## 6. Course-Correction Summary

| Course correction | Why it matters | Build impact |
|---|---|---|
| Add Phase 0A rulebook | Avoid ambiguous scheduling engine build | Changes backend/frontend phase plans |
| Lock MVP scheduling grain | Prevent cross-team assumptions | Changes data model/API/UI |
| Formalize boundary cases | Rajesh explicitly raised “what happens when…” behavior | Adds models, APIs, scenarios, tests |
| Reframe wash | Denim value is created in wash, not merely finished there | Strengthens wash, PCD, quality, analytics |
| Add upstream milestones | Sampling/wash standard can affect production readiness | Expands order lifecycle and PCD |
| Define capacity by workcenter | Generic capacity logic will fail | Changes master data and planning math |
| Add planning zones | Frozen/firm/flexible behavior needed | Changes planning data model and UI |
| Define automation boundary | Avoid unsafe auto-rescheduling | Changes governance and recovery UX |
| Add FastReact validation | Imported plan cannot be trusted blindly | Changes integration and planning import |
| Add boundary-case tests | Must prove confidence before committed build | Changes QA and seed plan |

---

## 7. Immediate Next Actions

### Action 1: Update the BRD

Apply the diff already prepared in:

```text
docs/brd/04_Diff_Eratex_BRD_Refinement_From_Rajesh_Inputs.md
```

### Action 2: Create Scheduling Behaviour Rulebook

This should become a new document:

```text
25_Scheduling_Behaviour_Rulebook.md
```

Minimum sections:

```text
1. MVP scheduling grain
2. Capacity definition matrix
3. Order cancellation matrix
4. Quantity/date change matrix
5. Capacity loss/addition matrix
6. Wash/rewash behavior matrix
7. Shipment pull-in reaction matrix
8. Frozen/firm/flexible zone rules
9. System recommendation vs planner approval boundary
10. Boundary-case simulation scenarios
```

### Action 3: Patch the 24-document technical pack

Patch the following first:

```text
02 Data Model
04 Planning Logic
06 API Contracts
07 State Transitions
10 Wash
11 Exception/Recovery
13 Frontend
19 Testing
20 Seed Data
21 Backend Build Plan
22 Frontend Build Plan
23 Governance
24 Readiness Checklist
```

### Action 4: Conduct Rajesh/Business Workshop

Use the question set from the BRD diff to validate:

```text
planning grain
capacity definitions
wash route families
rewash behavior
cancellation behavior
approval boundaries
minimum prototype confidence
```

### Action 5: Build a Prototype Simulation Before Full Build

Recommended first prototype:

```text
Order + PCD + Workcenter Capacity + Wash Board + Boundary Case Impact Preview
```

This is the smallest prototype that can prove whether the core EOS planning logic is correct.

---

## 8. Final Recommendation

The technical pack is fundamentally sound. The required adjustment is not to restart the documentation. The required adjustment is to **insert a rulebook/prototype validation gate** before detailed planning-engine implementation and then patch specific documents for:

```text
scheduling grain
boundary cases
capacity definitions
wash value/quality complexity
upstream milestones
automation boundary
FastReact/Excel coexistence
boundary-case seed/testing
```

This will align the build with Rajesh’s field feedback and reduce the risk of building a visually rich tool that still fails to handle the real-world “what happens when...” scheduling questions that matter most in Eratex’s factory operation.
