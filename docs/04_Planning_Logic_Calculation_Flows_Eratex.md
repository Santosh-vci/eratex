# 04. Planning Logic and Calculation Flow Specification  
# Eratex End-to-End Planning & Scheduling Platform

**Company:** Eratex  
**Product:** Planning & Scheduling Tool for Denim Bottoms + Chinos Manufacturing  
**Document Type:** Planning Logic and Calculation Flow Specification  
**Version:** 2.0  
**Date:** 2026-05-26  
**Backend Stack Context:** Django + Django REST Framework + PostgreSQL + Celery  
**Frontend Context:** React/Next.js Planning Workbenches + PWA Shopfloor Capture  

---

## 1. Purpose

This document defines the planning calculations, status derivations, validation rules, risk logic, and decision flows required for the Eratex Planning & Scheduling Platform.

The platform is intended to convert a large, complex garment order book into a realistic and executable production plan.

This requires formal calculation logic for:

```text
order lifecycle status
PCD readiness
material readiness
fabric QC impact
weekly planning load
daily production release
workcenter capacity
sewing line loading
line balancing
net-good output
wash planning
rewash capacity
WIP ageing
pipeline WIP reconciliation
quality-adjusted capacity
shipment readiness
shipment risk
exception generation
recovery suggestions
```

This document should guide:

- backend service implementation
- calculation test cases
- API result fields
- frontend status display
- planning workflow validation
- analytics snapshot design
- QA and UAT scenarios

---

## 2. Core Planning Thesis

The system must not merely store production data. It must continuously convert data into planning decisions.

The platform must answer:

```text
Can this order be cut?
Can this order be released today?
Is this line realistically capable?
Where is the constraint?
What is ageing?
What is the projected shipment risk?
What recovery action is possible?
```

The calculation layer is therefore the heart of the system.

---

## 3. Backend Ownership of Calculation Logic

All critical planning calculations must live in backend domain services.

Frontend should only render:

```text
status
risk
reason
owner
next action
impact
history
```

Frontend must not independently calculate:

```text
PCD readiness
shipment risk
workcenter constraint
line capacity
WIP ageing severity
exception severity
plan impact
```

### 3.1 Recommended Backend Service Pattern

```text
API request
→ serializer validation
→ permission check
→ domain service
→ calculation service
→ database write/read
→ audit event
→ optional async recalculation
→ response
```

Example:

```text
POST /api/v1/sewing/output
→ validate quantity
→ save sewing output entry
→ update WIP
→ calculate net-good output
→ update line efficiency snapshot
→ check WIP/line exceptions
→ return updated line status
```

---

## 4. Calculation Execution Modes

Different calculations should run at different moments.

| Calculation Type | Execution Mode |
|---|---|
| PCD readiness | event-driven and on-demand |
| Daily release validation | synchronous during release |
| Workcenter load | on-demand + scheduled snapshot |
| Line efficiency | event-driven from output |
| WIP ageing | scheduled + on-demand |
| Shipment risk | event-driven + scheduled |
| Exception generation | event-driven + scheduled |
| Analytics snapshots | scheduled Celery job |
| What-if simulation | synchronous preview, no committed write |

### 4.1 Event-Driven Examples

```text
fabric QC status changes → recalculate PCD readiness
daily release created → update order status
sewing output entered → update line output and WIP
wash batch delayed → update workcenter load and shipment risk
QC hold created → update WIP, exception, shipment risk
shipment checklist completed → recalculate shipment readiness
```

### 4.2 Scheduled Jobs

Recommended Celery jobs:

```text
hourly_wip_ageing_recalculation
hourly_shipment_risk_recalculation
daily_workcenter_load_snapshot
daily_line_efficiency_snapshot
daily_wip_pipeline_snapshot
daily_exception_escalation
daily_planning_health_snapshot
```

---

# Part A: Order Lifecycle Logic

---

## 5. Order Lifecycle Status

### 5.1 Purpose

Derive the current stage of each order based on planning, execution, WIP, QC, and shipment records.

### 5.2 Inputs

```text
production_order
order_milestone
pcd_readiness
production_release
planned_work_item
sewing_output_entry
wash_batch
wip_item
qc_inspection
shipment_readiness
exception_record
```

### 5.3 Recommended Lifecycle Stages

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
```

### 5.4 Stage Derivation Logic

Suggested priority order:

```text
If dispatched quantity >= shipment quantity → SHIPPED
Else if shipment readiness = READY → SHIPMENT_READY
Else if packed_qty > 0 or packed WIP exists → PACKING
Else if finishing WIP exists or finished qty exists → FINISHING
Else if wash batch active or washed WIP exists → WASHING
Else if sewing output exists or sewing WIP exists → SEWING
Else if cutting release/output exists → CUTTING
Else if PCD readiness = READY or CONDITIONALLY_READY → PCD_READY
Else if PCD readiness exists but not ready → PCD_PENDING
Else if order confirmed but pre-production pending → PRE_PRODUCTION
Else → CREATED
```

### 5.5 Hold Override Logic

If there is an open critical hold:

```text
QC hold
material hold
PCD blocked
shipment block
capacity block
```

then the order lifecycle display should show:

```text
current_stage = actual operational stage
lifecycle_status = ON_HOLD
hold_reason = active hold reason
```

Example:

```json
{
  "currentStage": "WASHING",
  "lifecycleStatus": "ON_HOLD",
  "holdReason": "Post-wash shade variation"
}
```

---

## 6. Order Risk Status

### 6.1 Purpose

Show risk of missing shipment or execution commitment.

### 6.2 Risk Levels

```text
GREEN = on track
YELLOW = watch
RED = action required
BLACK = critical / likely miss
```

### 6.3 Inputs

```text
committed shipment date
current stage
remaining process time
open exceptions
WIP ageing
workcenter overload
quality holds
shipment readiness blockers
material/PCD blockers
```

### 6.4 Risk Derivation Concept

```text
projected_ready_datetime = current_datetime + estimated_remaining_processing_time
remaining_buffer = committed_ship_datetime - projected_ready_datetime
```

Risk:

```text
If critical blocker exists and no recovery exists → BLACK
Else if remaining_buffer < 0 → RED/BLACK depending severity
Else if remaining_buffer below red threshold → RED
Else if remaining_buffer below yellow threshold → YELLOW
Else → GREEN
```

### 6.5 Example Risk Thresholds

```text
GREEN: buffer > 5 days
YELLOW: buffer 3–5 days
RED: buffer 1–3 days or open major blocker
BLACK: buffer < 1 day or impossible without intervention
```

Thresholds must be configurable.

---

# Part B: Material and Procurement Logic

---

## 7. Material Requirement Calculation

### 7.1 Purpose

Calculate required materials from order quantity and BOM.

### 7.2 Inputs

```text
order quantity
size/color breakup
BOM consumption
wastage percent
UOM
fabric width
shrinkage allowance
minimum order quantity if applicable
```

### 7.3 Formula

For non-fabric material:

```text
required_qty =
order_qty × consumption_per_piece × (1 + wastage_percent / 100)
```

For fabric:

```text
base_fabric_required =
order_qty × fabric_consumption_per_piece
```

```text
fabric_required_with_wastage =
base_fabric_required × (1 + wastage_percent / 100)
```

If shrinkage allowance is separately modeled:

```text
final_fabric_required =
fabric_required_with_wastage × (1 + shrinkage_allowance_percent / 100)
```

### 7.4 Output Fields

```text
material
required_qty
ordered_qty
received_qty
shortage_qty
required_date
risk_status
```

---

## 8. Material Readiness Status

### 8.1 Purpose

Determine whether materials are ready for production stage.

### 8.2 Inputs

```text
required_qty
ordered_qty
received_qty
QC status
required stage
planned release date
vendor ETA
```

### 8.3 Status Values

```text
NOT_REQUIRED
NOT_ORDERED
ORDERED
PARTIALLY_RECEIVED
RECEIVED
QC_PENDING
READY
SHORT
DELAYED
BLOCKED
```

### 8.4 Logic

```text
If material not required → NOT_REQUIRED
If required but no PO → NOT_ORDERED
If PO exists and no receipt → ORDERED
If received_qty < required_qty → PARTIALLY_RECEIVED
If received_qty >= required_qty and QC not required → READY
If received_qty >= required_qty and QC pending → QC_PENDING
If received_qty < required_qty and required date passed → SHORT
If ETA > required date → DELAYED
If QC failed → BLOCKED
```

---

## 9. Vendor Delay Risk

### 9.1 Inputs

```text
vendor standard lead time
PO date
expected arrival date
revised ETA
required date
PCD date
shipment date
```

### 9.2 Logic

```text
If revised ETA > required date → material delay risk
If revised ETA > planned PCD date → PCD blocker
If revised ETA causes remaining buffer below threshold → shipment risk
```

### 9.3 Exception Generation

Create exception when:

```text
fabric ETA exceeds PCD date
trim ETA exceeds sewing requirement date
vendor not acknowledged within threshold
material shortage unresolved within threshold
```

---

# Part C: Fabric QC and PCD Readiness Logic

---

## 10. Fabric QC Pass/Fail Logic

### 10.1 Inputs

```text
4-point inspection score
width
GSM
shrinkage
skewing
bowing
stretch recovery
colorfastness
crocking
shade evaluation
```

### 10.2 Status Values

```text
PENDING
PASSED
FAILED
HOLD
WAIVED
```

### 10.3 Logic

```text
If mandatory test missing → PENDING
If any critical parameter outside tolerance → FAILED
If parameter requires review → HOLD
If all mandatory tests pass → PASSED
If authorized override → WAIVED
```

### 10.4 PCD Impact

```text
Fabric QC PASSED → PCD item FABRIC_QC_PASSED = PASSED
Fabric QC FAILED → PCD blocked
Fabric QC HOLD → PCD blocked/escalated
Fabric QC WAIVED → PCD conditionally ready if approved
```

---

## 11. PCD Readiness Calculation

### 11.1 Required Checklist

```text
PO_CONFIRMED
BOM_FROZEN
FABRIC_RECEIVED
FABRIC_QC_PASSED
SHADE_LOTS_MAPPED
SHRINKAGE_AVAILABLE
TRIMS_AVAILABLE
PATTERN_APPROVED
MARKER_READY
PP_SAMPLE_APPROVED
WASH_STANDARD_APPROVED
LINE_ALLOCATED
WASH_CAPACITY_BOOKED
QC_FILE_READY
```

### 11.2 Checklist Item Status

```text
PENDING
PASSED
FAILED
WAIVED
NOT_APPLICABLE
```

### 11.3 PCD Readiness Status

```text
IN_REVIEW
READY
CONDITIONALLY_READY
BLOCKED
ESCALATED
RELEASED
```

### 11.4 Calculation Logic

```text
mandatory_failed = any mandatory item status = FAILED
mandatory_pending = any mandatory item status = PENDING
mandatory_waived = any mandatory item status = WAIVED
noncritical_pending = any non-mandatory item status = PENDING
```

Rules:

```text
If mandatory_failed → BLOCKED
Else if mandatory_pending → BLOCKED
Else if mandatory_waived and approved waiver exists → CONDITIONALLY_READY
Else if all mandatory passed and noncritical pending exists → CONDITIONALLY_READY or READY depending configuration
Else if all mandatory passed → READY
```

### 11.5 Escalation Logic

If PCD date is near and blocked:

```text
days_to_pcd = planned_pcd_date - today
```

If:

```text
days_to_pcd <= PCD_BLOCKER_ESCALATION_DAYS
and readiness_status = BLOCKED
```

then:

```text
readiness_status = ESCALATED
create exception category PCD
```

---

## 12. Release to Cutting Validation

### 12.1 Normal Release

Allowed when:

```text
PCD readiness = READY
release permission exists
planned PCD date valid
cutting workcenter not critically blocked
```

### 12.2 Conditional Release

Allowed when:

```text
PCD readiness = CONDITIONALLY_READY
approved conditional release exists
conditional release expiry not passed
authorized approver exists
risk note captured
```

### 12.3 Block Release

Block when:

```text
mandatory item pending/failed
fabric QC failed
PP sample not approved
wash standard missing for washed style
line or wash capacity not booked
```

---

# Part D: Capacity and Workcenter Load Logic

---

## 13. Workcenter Capacity Calculation

### 13.1 Inputs

```text
workcenter
calendar
shift working minutes
resource count
machine count
manpower count
efficiency factor
planned downtime
approved overtime
```

### 13.2 Generic Capacity Formula

```text
available_capacity_minutes =
working_minutes × resource_count × efficiency_factor
- planned_downtime_minutes
+ approved_overtime_minutes
```

### 13.3 Quantity-Based Capacity

```text
available_qty =
available_capacity_minutes / standard_minutes_per_piece
```

### 13.4 Batch-Based Capacity

For wash:

```text
available_batches =
available_machine_minutes / standard_batch_minutes
```

---

## 14. Planned Load Calculation

### 14.1 Sewing/Cutting/Finishing Load

```text
planned_load_minutes =
planned_quantity × standard_minutes_per_piece
```

### 14.2 Wash Load

```text
planned_wash_load_minutes =
sum(batch_route_step_minutes for all planned batches)
```

### 14.3 QC Load

```text
qc_load_minutes =
inspection_quantity × standard_inspection_minutes_per_piece
```

---

## 15. Workcenter Utilization

```text
utilization_percent =
planned_load_minutes / available_capacity_minutes × 100
```

### 15.1 Constraint Status

Default thresholds:

```text
0–85% = NORMAL
86–100% = WATCH
101–115% = OVERLOADED
116–130% = CONSTRAINT
>130% = CRITICAL_CONSTRAINT
```

Thresholds should be configurable by workcenter type.

### 15.2 Constraint Shift Logic

A workcenter becomes current constraint if:

```text
utilization above threshold
or queue ageing critical
or throughput below required rate
or downstream shipment risk tied to this workcenter
```

### 15.3 Ranking Constraint Candidates

Suggested score:

```text
constraint_score =
utilization_score
+ queue_ageing_score
+ shipment_impact_score
+ exception_score
+ throughput_shortfall_score
```

Highest score becomes active constraint.

---

# Part E: Weekly Planning Logic

---

## 16. Weekly Plan Eligibility

An order should be eligible for weekly planning if:

```text
order is active
style approved
BOM approved or materially ready
PCD status known
material readiness is adequate for planned stage
no unresolved critical hold
```

For cutting allocation:

```text
PCD readiness must be READY or CONDITIONALLY_READY
```

For sewing allocation:

```text
cutting release/output must be available or planned before sewing start
trims must be available by sewing start
line must be capable
```

For wash allocation:

```text
sewing output or planned sewing completion must exist
wash route approved
wash capacity available
```

---

## 17. Weekly Plan Load Check

When a planned work item is added:

```text
new_total_load = existing_load + proposed_load
```

If:

```text
new_total_load > available_capacity
```

then show overload.

If overload exceeds critical threshold:

```text
block plan freeze or require approval
```

---

## 18. Plan Freeze Logic

Plan can be frozen if:

```text
all planned work items have valid workcenter
no unresolved critical capacity overload unless approved
all cutting items have PCD readiness
all planned wash items have wash route
all shipment-critical exceptions reviewed
```

Freeze should create audit event.

---

## 19. Plan Change Impact

For each proposed change, calculate:

```text
affected order
affected workcenter
new capacity utilization
previous capacity utilization
shipment risk change
other orders displaced
new exceptions required
approval requirement
```

---

# Part F: Daily Production Release Logic

---

## 20. Daily Release Eligibility

Daily release is stricter than weekly plan.

A work item can be released today only if:

```text
planned for today or approved pull-forward
previous process completed
input quantity available
QC clear
required material/trims available
machine/workcenter available
manpower available
no unresolved hold
next process capacity visible
```

---

## 21. Release Validation Items

For cutting:

```text
PCD ready
fabric available
fabric QC passed
shade lots mapped
marker ready
cutting capacity available
```

For sewing:

```text
cut panels available
trims available
line allocated
machines available
operators available
QC file ready
```

For wash:

```text
sewn goods available
wash route approved
shade lots identified
wash machine available
chemicals available if tracked
post-wash QC available
```

For finishing/packing:

```text
washed goods released
QC pass
packing materials available
shipment checklist visible
```

---

## 22. Release Status

```text
READY_TO_RELEASE
BLOCKED
RELEASED
EXCEPTION_RELEASE_PENDING
COMPLETED
```

### 22.1 Exception Release

If release blocked but override requested:

Required:

```text
reason
open item
approver
expiry or review date
risk acknowledgement
affected order
```

---

# Part G: Sewing Line Loading and Efficiency Logic

---

## 23. Sewing Capacity Calculation

### 23.1 Inputs

```text
line manpower
working minutes
style SMV
target efficiency
learning curve factor
absenteeism factor
expected defect rate
machine availability
```

### 23.2 Gross Capacity

```text
gross_capacity_pieces =
(line_manpower × working_minutes × target_efficiency)
÷ style_smv
```

Where:

```text
target_efficiency = baseline_efficiency / 100
```

### 23.3 Adjusted Capacity

```text
adjusted_capacity =
gross_capacity_pieces
× learning_curve_factor
× absenteeism_factor
× machine_availability_factor
```

### 23.4 Net-Good Capacity

```text
net_good_capacity =
adjusted_capacity × (1 - expected_defect_rate)
```

### 23.5 Example

```text
line manpower = 40
working minutes = 480
target efficiency = 65% = 0.65
style SMV = 32
learning factor = 0.90
absenteeism factor = 0.95
expected defect rate = 5%
```

```text
gross_capacity = 40 × 480 × 0.65 / 32 = 390 pcs
adjusted_capacity = 390 × 0.90 × 0.95 = 333 pcs
net_good_capacity = 333 × 0.95 = 316 pcs
```

---

## 24. Net-Good Output Calculation

```text
net_good_output =
gross_output - defect_qty - open_rework_qty
```

If rework is later cleared:

```text
net_good_output_adjusted =
net_good_output + cleared_rework_qty
```

Planning should use net-good output, not gross output.

---

## 25. Required Run Rate

Used during live production control.

```text
remaining_qty = daily_target - actual_net_good_qty
remaining_time = shift_end_time - current_time
required_run_rate = remaining_qty / remaining_time
```

Compare:

```text
current_run_rate = actual_net_good_qty / elapsed_time
```

If:

```text
required_run_rate > achievable_run_rate_threshold
```

then create warning or exception.

---

## 26. Line Balance Logic

### 26.1 Takt Time

```text
takt_time =
available_minutes_per_operator / required_output_per_operator_equivalent
```

Simpler planning version:

```text
takt_time =
available_line_minutes / target_output
```

### 26.2 Workstation Load

```text
workstation_load_percent =
assigned_operation_smv / takt_time × 100
```

### 26.3 Bottleneck Operation

Operation with:

```text
highest load percent
or actual WIP build-up
or repeated output shortfall
```

### 26.4 Line Balance Efficiency

```text
line_balance_efficiency =
total_style_smv /
(number_of_workstations × bottleneck_cycle_time)
× 100
```

### 26.5 Balance Loss

```text
balance_loss_percent =
100 - line_balance_efficiency
```

---

## 27. Line Realignment Logic

### 27.1 Inputs

```text
target style operation bulletin
current line machines
current line operators
operator skill matrix
target output
available shift time
```

### 27.2 Gap Analysis

Calculate:

```text
required machine count by type
available machine count by type
machine gap
required skill count by operation
available skill count
skill gap
expected bottleneck operation
expected output before realignment
expected output after realignment
```

### 27.3 Recommendation Types

```text
add machine
move machine
move operator
add helper
split operation
combine operation
reduce target
add overtime
select alternate line
```

---

# Part H: Wash Planning Logic

---

## 28. Wash Batch Eligibility

A wash batch can be created when:

```text
sewn goods available
pre-wash QC passed
wash route approved
shade lot known
batch quantity within machine capacity
wash workcenter available
```

---

## 29. Wash Batch Load Calculation

```text
batch_load_minutes =
sum(standard_minutes for each route step)
+ loading_unloading_minutes
+ QC_minutes_if_required
```

If multiple batches:

```text
total_wash_load = batch_load_minutes × number_of_batches
```

---

## 30. Wash Queue Priority

Priority score may include:

```text
shipment urgency
WIP ageing
customer priority
wash complexity
available machine fit
shade lot grouping
rework risk
```

Suggested score:

```text
priority_score =
shipment_urgency_score
+ ageing_score
+ customer_priority_score
+ risk_score
- changeover_penalty
```

---

## 31. Rewash Logic

### 31.1 Rewash Triggers

```text
shade too dark
shade too light
hand feel issue
measurement issue
wash effect mismatch
stain
buyer standard mismatch
```

### 31.2 Rewash Capacity

```text
rewash_load_minutes =
rewash_batch_count × rewash_route_standard_minutes
```

or:

```text
rewash_load_minutes =
rewash_qty × rewash_standard_minutes_per_piece
```

### 31.3 Impact

Rewash should:

```text
move WIP to REWASH_WIP
increase wash load
reduce shipment buffer
create or update exception
update order risk
```

---

# Part I: WIP and Pipeline Inventory Logic

---

## 32. WIP Movement Logic

Each WIP movement must validate:

```text
source stage has sufficient quantity
target stage is valid
quality hold does not block movement
handover requirement satisfied
user has permission
```

Movement creates:

```text
wip_movement record
updated source WIP quantity
updated target WIP quantity
audit event if adjustment/override
```

---

## 33. WIP Ageing Calculation

```text
wip_age_hours =
current_timestamp - entered_stage_at
```

### 33.1 Stage-Specific Thresholds

Example:

| Stage | Yellow | Red | Black |
|---|---:|---:|---:|
| CUT_PANELS_WAITING_SEWING | 24h | 48h | 72h |
| SEWN_WAITING_WASH | 24h | 48h | 72h |
| WASHED_WAITING_FINISHING | 12h | 36h | 60h |
| PACKED_WAITING_INSPECTION | 24h | 48h | 72h |

### 33.2 WIP Risk

```text
If wip_age < yellow threshold → GREEN
If yellow <= age < red → YELLOW
If red <= age < black → RED
If age >= black → BLACK
```

---

## 34. Pipeline WIP Inventory

The system should calculate WIP across:

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

### 34.1 Stage Quantity

```text
stage_qty =
sum(wip_item.qty where stage = selected_stage and status active)
```

### 34.2 Blocked WIP

```text
blocked_wip =
sum(qty where status = HELD or hold_reason is not null)
```

### 34.3 WIP Before Constraint

If current constraint is wet wash:

```text
WIP before constraint =
SEWN_WAITING_WASH + DRY_PROCESS_WIP if route requires dry process
```

---

## 35. Quantity Reconciliation Logic

For each order:

```text
order_qty
fabric_equivalent_qty
cut_qty
issued_to_sewing_qty
sewn_qty
sent_to_wash_qty
washed_qty
rewash_qty
finished_qty
packed_qty
shipment_ready_qty
dispatched_qty
```

### 35.1 Reconciliation Checks

Create exception if:

```text
cut_qty > fabric_allocated_equivalent_qty
issued_to_sewing_qty > cut_qty
sewn_qty > issued_to_sewing_qty
sent_to_wash_qty > sewn_qty
washed_qty > sent_to_wash_qty + rewash_return_qty
finished_qty > washed_qty
packed_qty > finished_qty
shipment_ready_qty > packed_qty
dispatched_qty > shipment_ready_qty
unexplained_loss_qty > threshold
```

---

# Part J: Quality and Rework Logic

---

## 36. QC Result Logic

QC inspection status:

```text
PASSED
FAILED
HOLD
REWORK_REQUIRED
WAIVED
```

Logic:

```text
If defect_qty = 0 or within acceptable limit → PASSED
If defect severity critical → HOLD or FAILED
If defects repairable → REWORK_REQUIRED
If authorized override → WAIVED
```

---

## 37. Defect Rate

```text
defect_rate =
defect_qty / checked_qty × 100
```

### 37.1 Quality Alert

If:

```text
defect_rate > configured threshold
```

then:

```text
create quality exception
update line quality performance
reduce net-good capacity assumption if persistent
```

---

## 38. Rework Capacity Logic

Rework must consume capacity.

```text
rework_load_minutes =
rework_qty × standard_rework_minutes_per_piece
```

If standard is unknown, use configured default by rework type.

Rework affects:

```text
WIP
workcenter load
shipment risk
line efficiency
quality analytics
```

---

# Part K: Shipment Readiness and OTIF Logic

---

## 39. Shipment Readiness Calculation

### 39.1 Required Checklist

```text
FINAL_QC_PASSED
AQL_PASSED
PACKING_COMPLETE
CARTONS_CLOSED
BARCODE_LABEL_CORRECT
PACKING_LIST_READY
INVOICE_READY
FORWARDER_BOOKED
SHIPMENT_DATE_CONFIRMED
```

### 39.2 Readiness Status

```text
NOT_STARTED
IN_PROGRESS
BLOCKED
READY
DISPATCHED
CLOSED
```

### 39.3 Calculation

```text
If dispatched → DISPATCHED
Else if any mandatory item failed/blocking → BLOCKED
Else if all mandatory items passed and packed_qty >= required_qty → READY
Else if some items complete → IN_PROGRESS
Else → NOT_STARTED
```

### 39.4 Short Quantity

```text
short_qty =
order_qty - packed_qty
```

or shipment-specific:

```text
short_qty =
shipment_required_qty - packed_qty_allocated_to_shipment
```

---

## 40. OTIF Calculation

```text
OTIF =
orders shipped on or before committed date with required quantity
/
total orders due
× 100
```

### 40.1 On-Time

```text
actual_dispatch_date <= committed_ship_date
```

### 40.2 In-Full

```text
dispatched_qty >= committed_ship_qty
```

### 40.3 Cost-Adjusted OTIF

Because Eratex may maintain OTIF through extra expense, track:

```text
OTIF achieved with overtime
OTIF achieved with premium freight
OTIF achieved with split shipment
OTIF achieved with rework acceleration
```

This allows:

```text
true operational stability assessment
```

---

# Part L: Exception Generation Logic

---

## 41. Exception Categories

```text
APPROVAL
MATERIAL
FABRIC_QC
PCD
CAPACITY
SEWING
WASH
QUALITY
WIP
SHIPMENT
SYSTEM_DATA
```

---

## 42. Auto Exception Rules

### 42.1 PCD Exception

```text
If PCD due within threshold and readiness not READY
→ create PCD exception
```

### 42.2 Workcenter Capacity Exception

```text
If utilization_percent > red threshold
→ create capacity exception
```

### 42.3 WIP Ageing Exception

```text
If WIP age > red threshold
→ create WIP exception
```

### 42.4 Sewing Shortfall Exception

```text
If projected end-of-day output < daily target by threshold
→ create sewing exception
```

### 42.5 Wash Rework Exception

```text
If rewash_qty > threshold or rewash causes shipment risk
→ create wash exception
```

### 42.6 Shipment Exception

```text
If shipment due within threshold and readiness not READY
→ create shipment exception
```

### 42.7 Data Exception

```text
If style missing approved bulletin but planning attempted
→ create system/data exception
```

---

## 43. Exception Severity

Severity may be calculated by:

```text
time impact
shipment impact
capacity impact
quantity affected
customer priority
recurrence
```

Suggested rule:

```text
BLACK = shipment miss likely or critical blocker
RED = action required within defined time
YELLOW = watch / early warning
GREEN = informational
```

---

# Part M: Recovery Suggestion Logic

---

## 44. Recovery Suggestion Framework

The system should provide rule-based recovery suggestions. It should not require AI in MVP.

### 44.1 Sewing Constraint

If sewing overloaded:

```text
suggest split order across lines
suggest overtime
suggest alternate line
suggest line rebalance
suggest move skilled operator
```

### 44.2 Wash Constraint

If wash overloaded:

```text
suggest add wash shift
suggest resequence by shipment risk
suggest group similar wash routes
suggest outsource wash if allowed
suggest prioritize rewash-critical orders
```

### 44.3 Material Constraint

If material delayed:

```text
suggest vendor escalation
suggest partial cutting if approved
suggest revise PCD
suggest split shipment
```

### 44.4 WIP Ageing

If WIP ageing before workcenter:

```text
suggest release to next process
suggest clear QC hold
suggest prioritize stage
suggest assign owner
```

### 44.5 Shipment Constraint

If shipment readiness blocked:

```text
suggest expedite inspection
suggest assign documentation owner
suggest split shipment approval
suggest management escalation
```

---

## 45. Recovery Impact Preview

Before applying recovery, show:

```text
capacity impact
shipment impact
other orders affected
cost impact if available
approval required
```

---

# Part N: Analytics Calculations

---

## 46. Resource Utilization

```text
resource_utilization =
actual productive load / available capacity × 100
```

Separate:

```text
gross utilization
net-good utilization
constraint utilization
```

---

## 47. Line Efficiency

```text
earned_minutes =
net_good_output × style_smv
```

```text
line_efficiency =
earned_minutes / available_line_minutes × 100
```

---

## 48. Plan Adherence

```text
plan_adherence =
completed_planned_work / planned_work × 100
```

Can be measured by:

```text
quantity
work item count
minutes
shipment milestone
```

---

## 49. Wash Rework Rate

```text
wash_rework_rate =
rewash_qty / washed_qty × 100
```

---

## 50. Exception Closure Time

```text
closure_time =
closed_at - created_at
```

---

## 51. WIP Turn Time

```text
stage_turn_time =
moved_out_at - entered_stage_at
```

---

# Part O: What-If Simulation Logic

---

## 52. Simulation Principles

What-if simulations should not write to committed planning tables unless approved.

Use temporary calculation structures.

### 52.1 Common Scenarios

```text
fabric arrives 5 days late
split order across two lines
add overtime
wash requires rewash
line efficiency drops to 60%
shipment pulled forward
operator absenteeism increases
```

### 52.2 Simulation Output

```text
new projected shipment readiness
workcenter utilization
affected orders
capacity gap
recovery cost if configured
approval requirement
```

---

# Part P: Data Freshness and Staleness Logic

---

## 53. Stale Data Detection

A planning view should show stale data when:

```text
last actual update older than threshold
integration sync failed
shopfloor shift closure missing
workcenter output not updated
```

Example:

```text
Sewing Line 5 has no output update for 3 hours during active shift.
```

Create system/data exception if threshold exceeded.

---

# Part Q: Test Case Requirements

---

## 54. Calculation Test Coverage

Each calculation must have unit tests.

Required test categories:

```text
PCD ready / blocked / conditional
material ready / short / delayed
fabric QC pass / fail / hold
workcenter utilization thresholds
sewing capacity with absenteeism and defect rate
net-good output
wash rework load
WIP ageing severity
quantity reconciliation
shipment readiness
shipment risk
exception generation
line balance
```

---

## 55. Example Test Case: PCD Blocked

Input:

```text
fabric received = yes
fabric QC = pending
all other items = passed
planned PCD = tomorrow
```

Expected:

```text
readiness_status = ESCALATED
can_release_to_cutting = false
exception category = PCD
```

---

## 56. Example Test Case: Wash Rework

Input:

```text
wash batch qty = 500
rewash required = yes
rewash route time = 180 minutes
shipment buffer = 1 day
```

Expected:

```text
additional wash load = 180 minutes
WIP stage = REWASH_WIP
shipment risk increases
wash exception created
```

---

## 57. Example Test Case: Net-Good Output

Input:

```text
gross output = 500
defect qty = 40
open rework qty = 20
```

Expected:

```text
net_good_output = 440
```

---

# 58. Implementation Notes

## 58.1 Recommended Django Service Modules

```text
orders/services/status.py
pcd_readiness/services/readiness.py
planning/services/capacity.py
planning/services/impact.py
sewing/services/capacity.py
sewing/services/output.py
washing/services/load.py
wip_inventory/services/pipeline.py
wip_inventory/services/reconciliation.py
exceptions/services/generator.py
shipment/services/readiness.py
analytics/services/snapshots.py
```

## 58.2 Avoid

```text
calculation logic inside serializers
calculation logic inside frontend
uncontrolled Django signals
hardcoded thresholds
free-text statuses
```

## 58.3 Prefer

```text
service functions
explicit events
configurable thresholds
testable pure functions
audit on state changes
```

---

## 59. Summary

This document defines the calculation spine of the Eratex Planning & Scheduling Platform.

The platform must calculate and continuously update:

```text
order lifecycle
PCD readiness
material readiness
capacity and load
line output and efficiency
wash load and rewash
WIP inventory and ageing
quality/rework impact
shipment readiness
risk and exceptions
recovery options
```

The backend must own these calculations. The frontend should render the calculated state and guide user action.

This logic layer is what transforms the system from a static planning board into a live operational control platform.

## Scheduling Behaviour Rulebook Alignment

Planning logic must preview before it writes. Frozen-zone changes require approval, firm-zone changes require impact preview, and flexible-zone changes may be adjusted within configured rules. Capacity loss/addition, order cancellation/change, shipment pull-in, repeat wash risk, and external-plan conflicts are governed through boundary-case impact preview before any committed schedule action.
