# 08. WIP Inventory and Reconciliation Specification  
# Eratex End-to-End Planning & Scheduling Platform

**Company:** Eratex  
**Product:** Planning & Scheduling Tool for Denim Bottoms + Chinos Manufacturing  
**Document Type:** WIP Inventory and Quantity Reconciliation Specification  
**Version:** 2.0  
**Date:** 2026-05-26  
**Backend Stack:** Django + Django REST Framework + PostgreSQL + Celery  
**Frontend Stack Context:** React/Next.js Planning Workbenches + PWA Shopfloor Capture  
**Related Documents:**  
- 02 Data Model and Table Schema Specification  
- 04 Planning Logic and Calculation Flows  
- 05 Backend Domain Module Specification  
- 06 API and Data Contracts Specification  
- 07 Event and State Transition Specification  

---

## 1. Purpose

This document defines the **WIP inventory and quantity reconciliation model** for the Eratex Planning & Scheduling Platform.

In denim bottoms and chinos manufacturing, WIP is not a simple single number. It exists across a long manufacturing pipeline:

```text
fabric ordered
→ fabric in transit
→ fabric received
→ fabric QC
→ cutting
→ cut panels
→ sewing
→ sewn goods
→ wash queue
→ wash / rewash
→ finishing
→ final QC
→ packing
→ shipment-ready goods
→ dispatch
```

The system must provide a live, holistic, order-linked, stage-wise inventory view that answers:

```text
Where is the inventory?
How much is available?
How much is blocked?
How much is ageing?
How much is rework?
How much is before the current constraint?
How much is shipment-ready?
Where is the quantity mismatch?
What is the shipment impact?
```

This document should guide:

- backend WIP model design
- WIP movement services
- handheld handover flows
- planning workbench queues
- wash queue logic
- shipment readiness
- quantity reconciliation
- WIP dashboards
- exception generation
- audit and QA tests

---

## 2. Core WIP Thesis

WIP must be treated as a **pipeline inventory control layer**, not just a department-wise queue.

Earlier planning screens may show workcenter queues, but the platform needs a deeper WIP layer that represents the complete physical and logical position of inventory.

The WIP system must support:

```text
1. Stage-wise inventory visibility
2. Order-wise quantity traceability
3. Movement between departments
4. Handover accountability
5. Hold and release control
6. Ageing alerts
7. Rework segregation
8. Quantity reconciliation
9. Shipment risk linkage
10. Current constraint visibility
```

Without this layer, the planning system will not know whether a production delay is caused by:

```text
no input available
input stuck before QC
input held for rework
input waiting before wash
output not handed over
quantity mismatch
shipment documents pending
```

---

## 3. WIP Scope

The WIP model covers inventory from procurement-related manufacturing visibility through dispatch.

It includes:

```text
fabric-level WIP
cut panel WIP
sewing WIP
wash WIP
rework WIP
finishing WIP
packing WIP
shipment-ready inventory
```

It does not replace a full financial inventory ledger in MVP. However, it must preserve quantity integrity and operational traceability.

---

## 4. WIP Granularity

### 4.1 Required Granularity for MVP

Minimum WIP grain:

```text
Order × Stage × Quantity × Status
```

Recommended MVP grain:

```text
Order × Style × Stage × Batch/Bundle/Shade Lot × Quantity × Status
```

### 4.2 Mature Granularity

For mature deployment:

```text
Order × Style × Color × Size × Shade Lot × Bundle/Batch × Stage × Quantity × Status
```

### 4.3 Why Granularity Matters

Denim/chinos manufacturing requires tracking:

```text
shade lots
wash batches
cut bundles
sewing line output
rewash lots
shipment-ready quantities
short quantities
```

If the grain is too coarse, reconciliation becomes unreliable.

---

## 5. WIP Stage Model

## 5.1 Full Pipeline Stages

The system should support the following WIP stages.

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
DRYING_WIP
POST_WASH_QC
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

### 5.2 Stage Grouping

For UI and analytics, stages should be grouped.

| Group | Stages |
|---|---|
| Fabric | FABRIC_ON_ORDER, FABRIC_IN_TRANSIT, FABRIC_RECEIVED_NOT_QC, FABRIC_QC_HOLD, FABRIC_CLEARED, FABRIC_ALLOCATED |
| Cutting | CUTTING_WIP, CUT_PANELS_WAITING_SEWING |
| Sewing | SEWING_WIP, SEWN_WAITING_WASH |
| Wash | DRY_PROCESS_WIP, WET_WASH_WIP, DRYING_WIP, POST_WASH_QC, REWASH_WIP, WASHED_WAITING_FINISHING |
| Finishing | FINISHING_WIP, FINISHED_WAITING_FINAL_QC, FINAL_QC_HOLD |
| Packing | PACKED_GOODS, PACKED_WAITING_INSPECTION |
| Shipment | SHIPMENT_READY, DISPATCHED |

### 5.3 Stage Sequencing

Recommended normal flow:

```text
FABRIC_ON_ORDER
→ FABRIC_IN_TRANSIT
→ FABRIC_RECEIVED_NOT_QC
→ FABRIC_CLEARED
→ FABRIC_ALLOCATED
→ CUTTING_WIP
→ CUT_PANELS_WAITING_SEWING
→ SEWING_WIP
→ SEWN_WAITING_WASH
→ DRY_PROCESS_WIP, if route requires dry process
→ WET_WASH_WIP
→ DRYING_WIP
→ POST_WASH_QC
→ WASHED_WAITING_FINISHING
→ FINISHING_WIP
→ FINISHED_WAITING_FINAL_QC
→ PACKED_GOODS
→ PACKED_WAITING_INSPECTION
→ SHIPMENT_READY
→ DISPATCHED
```

Exception flow:

```text
POST_WASH_QC
→ REWASH_WIP
→ WET_WASH_WIP / DRYING_WIP
→ POST_WASH_QC
```

Hold flow:

```text
Any stage
→ HELD status with hold reason
→ release back to previous active/waiting state
```

---

## 6. WIP Status Model

## 6.1 WIP Status Values

```text
WAITING
IN_PROCESS
HELD
REWORK
READY_TO_MOVE
MOVED
CLOSED
ADJUSTED
SCRAPPED
```

### 6.2 Status Meaning

| Status | Meaning |
|---|---|
| WAITING | Quantity is waiting at stage |
| IN_PROCESS | Quantity is actively being processed |
| HELD | Quantity blocked by issue |
| REWORK | Quantity segregated for correction |
| READY_TO_MOVE | Process complete and ready for handover |
| MOVED | Quantity moved to next stage |
| CLOSED | Source WIP record closed |
| ADJUSTED | Quantity adjusted manually |
| SCRAPPED | Quantity rejected/scrapped |

### 6.3 Status Rules

```text
HELD quantity cannot move unless hold is released or waived.
REWORK quantity must have rework order or reason.
ADJUSTED quantity must have adjustment reason and permission.
SCRAPPED quantity must have approved scrap reason.
```

---

## 7. WIP Item Data Contract

## 7.1 Core Fields

```text
wip_item_id
order_id
style_id
stage
quantity
status
hold_reason
owner_id
entered_stage_at
next_process
batch_or_bundle_ref
shade_lot
color
size
shipment_risk
created_at
updated_at
```

### 7.2 Recommended API Shape

```json
{
  "wipItemId": "uuid",
  "orderId": "uuid",
  "orderNo": "ORD-1001",
  "styleId": "uuid",
  "styleCode": "STY-5001",
  "customerName": "Customer A",
  "stage": "SEWN_WAITING_WASH",
  "stageLabel": "Sewn Goods Waiting for Wash",
  "qty": 1400,
  "status": "WAITING",
  "holdReason": null,
  "owner": {
    "id": 78,
    "displayName": "Washing Manager"
  },
  "enteredStageAt": "2026-06-04T06:00:00+07:00",
  "ageingHours": 32.5,
  "ageingStatus": "RED",
  "nextProcess": "WET_WASH",
  "batchOrBundleRef": "BND-1001",
  "shadeLot": "SH-A",
  "shipmentDate": "2026-07-15",
  "shipmentRisk": "RED"
}
```

---

## 8. WIP Movement Data Contract

## 8.1 Movement Fields

```text
movement_id
wip_item_id
order_id
from_stage
to_stage
quantity
moved_at
moved_by
movement_reason
batch_or_bundle_ref
remarks
source
```

## 8.2 API Shape

```json
{
  "movementId": "uuid",
  "wipItemId": "uuid",
  "orderId": "uuid",
  "fromStage": "SEWN_WAITING_WASH",
  "toStage": "WASH_QUEUE",
  "qty": 500,
  "movedAt": "2026-06-05T13:00:00+07:00",
  "movedBy": {
    "id": 101,
    "displayName": "Sewing Supervisor"
  },
  "movementReason": "Department handover",
  "batchOrBundleRef": "WB-1001",
  "source": "HANDHELD"
}
```

---

# Part A: WIP Creation and Movement Rules

---

## 9. WIP Creation Rules

WIP is created when a quantity enters a manufacturing stage.

### 9.1 Fabric-Related WIP

Fabric WIP may be created by:

```text
material PO created
fabric in transit update
fabric receipt
fabric QC hold/pass
fabric allocation to order
```

### 9.2 Cutting WIP

Cutting WIP created by:

```text
release to cutting
cutting start
fabric issued to cutting
```

### 9.3 Cut Panel WIP

Created by:

```text
cutting output recorded
bundles created
cut QC passed
```

### 9.4 Sewing WIP

Created by:

```text
cut panels issued to line
sewing release
bundle start on line
```

### 9.5 Sewn Waiting Wash

Created by:

```text
sewing output recorded
sewing handover to wash
end-line QC passed
```

### 9.6 Wash WIP

Created by:

```text
wash batch creation
wash batch start
dry process start
wet wash start
```

### 9.7 Rewash WIP

Created by:

```text
post-wash QC failure
shade/hand-feel/measurement issue
rewash required decision
```

### 9.8 Finishing and Packing WIP

Created by:

```text
wash released to finishing
finishing output recorded
final QC pending
packing output recorded
```

### 9.9 Shipment-Ready WIP

Created by:

```text
shipment readiness checklist passed
packed quantity allocated to shipment
```

---

## 10. WIP Movement Rules

A WIP movement moves quantity from one stage to another.

### 10.1 Required Validations

Before movement:

```text
source stage has sufficient available quantity
quantity is positive
target stage is valid
target stage follows allowed route or approved exception exists
source WIP is not HELD
QC status allows movement
handover rule is satisfied
user has permission
```

### 10.2 Quantity Validation

```text
movement_qty <= available_qty_at_source_stage
```

Where:

```text
available_qty = source_stage_qty - held_qty - already_moved_qty
```

### 10.3 Handover Validation

If movement is department-to-department:

```text
handover record required
sender required
receiver or acceptance rule required
QC status required if configured
```

### 10.4 Hold Validation

If WIP item status is HELD:

```text
movement is blocked
```

unless:

```text
authorized waiver exists
or movement is to rework/scrap stage
```

### 10.5 Audit Requirement

Audit is required for:

```text
manual WIP adjustment
movement bypassing normal sequence
movement of held WIP
quantity correction
scrap
rework release
```

---

## 11. Allowed Stage Transitions

## 11.1 Normal Manufacturing Transitions

| From Stage | To Stage |
|---|---|
| FABRIC_ON_ORDER | FABRIC_IN_TRANSIT |
| FABRIC_IN_TRANSIT | FABRIC_RECEIVED_NOT_QC |
| FABRIC_RECEIVED_NOT_QC | FABRIC_CLEARED |
| FABRIC_RECEIVED_NOT_QC | FABRIC_QC_HOLD |
| FABRIC_QC_HOLD | FABRIC_CLEARED |
| FABRIC_CLEARED | FABRIC_ALLOCATED |
| FABRIC_ALLOCATED | CUTTING_WIP |
| CUTTING_WIP | CUT_PANELS_WAITING_SEWING |
| CUT_PANELS_WAITING_SEWING | SEWING_WIP |
| SEWING_WIP | SEWN_WAITING_WASH |
| SEWN_WAITING_WASH | DRY_PROCESS_WIP |
| SEWN_WAITING_WASH | WET_WASH_WIP |
| DRY_PROCESS_WIP | WET_WASH_WIP |
| WET_WASH_WIP | DRYING_WIP |
| DRYING_WIP | POST_WASH_QC |
| POST_WASH_QC | WASHED_WAITING_FINISHING |
| POST_WASH_QC | REWASH_WIP |
| REWASH_WIP | WET_WASH_WIP |
| WASHED_WAITING_FINISHING | FINISHING_WIP |
| FINISHING_WIP | FINISHED_WAITING_FINAL_QC |
| FINISHED_WAITING_FINAL_QC | PACKED_GOODS |
| FINISHED_WAITING_FINAL_QC | FINAL_QC_HOLD |
| FINAL_QC_HOLD | PACKED_GOODS |
| PACKED_GOODS | PACKED_WAITING_INSPECTION |
| PACKED_WAITING_INSPECTION | SHIPMENT_READY |
| SHIPMENT_READY | DISPATCHED |

### 11.2 Conditional/Exception Transitions

Allowed with approval/audit:

```text
FABRIC_QC_HOLD → CUTTING_WIP, only if waived and approved
POST_WASH_QC → WASHED_WAITING_FINISHING, if waived
FINAL_QC_HOLD → SHIPMENT_READY, if authorized waiver
Any stage → SCRAPPED, with approval
Any stage → ADJUSTED, with approval
```

---

## 12. WIP Hold and Release

## 12.1 Hold Creation

WIP hold may be created by:

```text
QC failure
quantity mismatch
shade mismatch
material issue
wash issue
buyer hold
documentation issue
manual supervisor hold
```

### Required Fields

```text
wip item
hold reason
affected quantity
owner
expected resolution
severity
created by
created at
```

### Hold Effects

```text
blocks movement
updates WIP dashboard
may create exception
may update order risk
may update shipment risk
```

## 12.2 Hold Release

Release requires:

```text
authorized user
resolution note
QC evidence if required
released quantity
audit event
```

---

## 13. Rework WIP

## 13.1 Rework Triggers

```text
sewing defect
wash shade issue
measurement issue
finishing defect
packing correction
AQL failure
```

## 13.2 Rework WIP Rules

When rework is created:

```text
move affected quantity to REWORK status or REWORK stage
create rework order
assign owner
calculate capacity impact
update shipment risk
```

## 13.3 Rework Completion

When rework is completed:

```text
QC pass required if configured
move quantity back to appropriate stage
close rework order
update WIP reconciliation
```

---

# Part B: WIP Ageing and Risk Logic

---

## 14. WIP Ageing Calculation

WIP ageing measures how long quantity has stayed in a stage.

```text
wip_age_hours = current_timestamp - entered_stage_at
```

Ageing resets when quantity moves to a new stage.

---

## 15. Stage-Specific Ageing Thresholds

Thresholds should be configurable by stage.

Example default thresholds:

| Stage | Yellow | Red | Black |
|---|---:|---:|---:|
| FABRIC_RECEIVED_NOT_QC | 24h | 48h | 72h |
| FABRIC_QC_HOLD | 12h | 36h | 60h |
| CUT_PANELS_WAITING_SEWING | 24h | 48h | 72h |
| SEWN_WAITING_WASH | 24h | 48h | 72h |
| POST_WASH_QC | 8h | 24h | 48h |
| REWASH_WIP | 12h | 24h | 48h |
| WASHED_WAITING_FINISHING | 12h | 36h | 60h |
| FINISHED_WAITING_FINAL_QC | 12h | 24h | 48h |
| PACKED_WAITING_INSPECTION | 24h | 48h | 72h |

---

## 16. WIP Ageing Status

```text
GREEN = within normal threshold
YELLOW = watch
RED = action required
BLACK = critical ageing
```

Logic:

```text
If age < yellow threshold → GREEN
If yellow threshold <= age < red threshold → YELLOW
If red threshold <= age < black threshold → RED
If age >= black threshold → BLACK
```

---

## 17. WIP Shipment Risk Linkage

WIP risk should be linked to shipment risk.

Inputs:

```text
current WIP stage
ageing
remaining process stages
remaining processing time
committed shipment date
open holds
workcenter constraints
```

Risk example:

```text
Sewn goods waiting for wash for 48h
+ wet wash is current constraint
+ shipment due in 5 days
= RED shipment risk
```

---

## 18. WIP Before Constraint

A key planning metric is WIP before the current constraint.

Example:

If current constraint is wet wash:

```text
WIP before constraint =
SEWN_WAITING_WASH
+ DRY_PROCESS_WIP if dry process is before wet wash
```

If current constraint is sewing:

```text
WIP before constraint =
CUT_PANELS_WAITING_SEWING
```

If current constraint is finishing:

```text
WIP before constraint =
WASHED_WAITING_FINISHING
```

This helps identify whether the constraint is starved or overloaded.

---

# Part C: Pipeline WIP Dashboard Logic

---

## 19. Pipeline WIP Summary Metrics

The WIP dashboard should calculate:

```text
total_pipeline_wip_qty
blocked_wip_qty
ageing_wip_qty
critical_ageing_wip_qty
rework_wip_qty
wip_before_current_constraint_qty
shipment_risk_wip_qty
shipment_ready_qty
dispatched_qty
```

### 19.1 Total Pipeline WIP

```text
total_pipeline_wip_qty =
sum(qty for active WIP stages excluding DISPATCHED)
```

### 19.2 Blocked WIP

```text
blocked_wip_qty =
sum(qty where status = HELD or hold_reason is not null)
```

### 19.3 Ageing WIP

```text
ageing_wip_qty =
sum(qty where ageing_status in RED or BLACK)
```

### 19.4 Rework WIP

```text
rework_wip_qty =
sum(qty where status = REWORK or stage = REWORK_WIP)
```

### 19.5 Shipment Risk WIP

```text
shipment_risk_wip_qty =
sum(qty where shipment_risk in RED or BLACK)
```

---

## 20. Stage Summary Calculation

For every stage:

```text
stage_total_qty
stage_waiting_qty
stage_in_process_qty
stage_held_qty
stage_rework_qty
stage_oldest_age_hours
stage_risk_status
stage_top_affected_order
```

Stage risk:

```text
If any BLACK WIP exists → BLACK
Else if any RED WIP exists → RED
Else if any YELLOW WIP exists → YELLOW
Else GREEN
```

---

## 21. Dashboard Filters

The WIP dashboard should support:

```text
factory
customer
buyer
order
style
product type
stage
stage group
ageing bucket
risk status
owner
shipment week
blocked only
rework only
current constraint only
shade lot
wash route
```

---

## 22. Pipeline Visualization

Frontend should show a horizontal manufacturing pipeline:

```text
Fabric → Cutting → Sewing → Wash → Finishing → Packing → Shipment
```

Each stage card should show:

```text
quantity
blocked quantity
ageing status
oldest age
shipment-risk quantity
```

Example:

```text
Sewn Waiting Wash
Qty: 14,000
Ageing: RED
Oldest: 52h
Shipment Risk: 8,400
```

---

# Part D: Quantity Reconciliation

---

## 23. Reconciliation Thesis

Quantity reconciliation ensures that physical flow remains logically consistent.

The system should detect impossible or unexplained quantity situations such as:

```text
sewn quantity greater than issued cut panels
washed quantity greater than sent-to-wash quantity
packed quantity greater than finished quantity
shipment-ready quantity greater than packed quantity
```

These issues may indicate:

```text
manual entry error
handover mismatch
bundle mismatch
unrecorded rejection
unrecorded rework
unrecorded adjustment
wrong order mapping
duplicate output entry
```

---

## 24. Reconciliation Grain

Minimum reconciliation grain:

```text
Order
```

Recommended grain:

```text
Order × Color × Size × Shade Lot
```

Mature grain:

```text
Order × Color × Size × Shade Lot × Bundle/Batch
```

---

## 25. Reconciliation Quantity Chain

For each order:

```text
order_qty
fabric_equivalent_qty
fabric_allocated_qty
cut_qty
issued_to_sewing_qty
sewn_gross_qty
sewing_defect_qty
sewing_rework_open_qty
sewn_net_good_qty
sent_to_wash_qty
washed_qty
rewash_qty
wash_reject_qty
finished_qty
final_qc_hold_qty
packed_qty
shipment_ready_qty
dispatched_qty
scrapped_qty
adjusted_qty
```

---

## 26. Garment Equivalent Logic

Fabric is tracked in meters/yards/rolls but planning needs garment-equivalent quantity.

### 26.1 Basic Formula

```text
fabric_garment_equivalent_qty =
available_fabric_qty / fabric_consumption_per_piece
```

### 26.2 Wastage-Adjusted Formula

```text
fabric_garment_equivalent_qty =
available_fabric_qty / (fabric_consumption_per_piece × (1 + wastage_percent / 100))
```

### 26.3 Shrinkage-Adjusted Formula

If shrinkage separately modeled:

```text
fabric_garment_equivalent_qty =
available_fabric_qty /
(fabric_consumption_per_piece × (1 + wastage_percent / 100) × (1 + shrinkage_percent / 100))
```

### 26.4 Notes

The actual formula should be configurable based on how fabric consumption is defined:

```text
pre-shrinkage consumption
post-shrinkage consumption
marker consumption
actual cut consumption
```

---

## 27. Net-Good Quantity Logic

### 27.1 Sewing Net-Good

```text
sewn_net_good_qty =
sewing_gross_output - sewing_defect_qty - open_sewing_rework_qty
```

### 27.2 Wash Net-Good

```text
wash_net_good_qty =
washed_qty - wash_reject_qty - rewash_pending_qty
```

### 27.3 Finishing Net-Good

```text
finishing_net_good_qty =
finished_qty - final_qc_hold_qty - finishing_rework_pending_qty
```

Shipment readiness should use packed and quality-cleared quantity, not gross production output.

---

## 28. Core Reconciliation Rules

### 28.1 Fabric Allocation Rule

```text
cut_qty <= fabric_allocated_garment_equivalent_qty + approved_overcut_tolerance
```

### 28.2 Cutting-to-Sewing Rule

```text
issued_to_sewing_qty <= cut_qty
```

### 28.3 Sewing Rule

```text
sewn_gross_qty <= issued_to_sewing_qty + approved_tolerance
```

### 28.4 Wash Send Rule

```text
sent_to_wash_qty <= sewn_net_good_qty + approved_tolerance
```

### 28.5 Wash Output Rule

```text
washed_qty <= sent_to_wash_qty + rewash_return_qty + approved_tolerance
```

### 28.6 Finishing Rule

```text
finished_qty <= wash_net_good_qty + approved_tolerance
```

### 28.7 Packing Rule

```text
packed_qty <= finished_net_good_qty + approved_tolerance
```

### 28.8 Shipment-Ready Rule

```text
shipment_ready_qty <= packed_qty
```

### 28.9 Dispatch Rule

```text
dispatched_qty <= shipment_ready_qty
```

---

## 29. Loss and Gain Accounting

The reconciliation model should explain differences between stages.

### 29.1 Loss Buckets

```text
cutting loss
sewing rejection
wash rejection
finishing rejection
packing rejection
scrap
sample/destructive test
unexplained loss
```

### 29.2 Gain Buckets

```text
overcut
extra received
recovered rework
manual adjustment
wrong previous entry correction
```

### 29.3 Unexplained Loss

```text
unexplained_loss =
previous_stage_qty - current_stage_qty - known_loss_qty - known_rework_qty - known_hold_qty
```

If unexplained loss exceeds threshold:

```text
create reconciliation exception
```

---

## 30. Reconciliation Result Contract

```json
{
  "orderId": "uuid",
  "orderNo": "ORD-1001",
  "orderQty": 12000,
  "fabricEquivalentQty": 12500,
  "fabricAllocatedQty": 12200,
  "cutQty": 12100,
  "issuedToSewingQty": 12000,
  "sewnGrossQty": 11850,
  "sewingDefectQty": 200,
  "sewingReworkOpenQty": 100,
  "sewnNetGoodQty": 11550,
  "sentToWashQty": 11200,
  "washedQty": 10900,
  "rewashQty": 300,
  "finishedQty": 10400,
  "packedQty": 9800,
  "shipmentReadyQty": 9600,
  "dispatchedQty": 0,
  "gaps": [
    {
      "code": "PACKED_SHORT_VS_ORDER",
      "severity": "RED",
      "message": "Packed quantity is short by 2,200 pieces against order quantity.",
      "qtyImpact": 2200
    }
  ]
}
```

---

## 31. Reconciliation Exception Types

Recommended exception codes:

```text
CUT_EXCEEDS_FABRIC_EQUIVALENT
ISSUED_TO_SEWING_EXCEEDS_CUT
SEWN_EXCEEDS_ISSUED
SENT_TO_WASH_EXCEEDS_SEWN_NET_GOOD
WASHED_EXCEEDS_SENT_TO_WASH
FINISHED_EXCEEDS_WASHED
PACKED_EXCEEDS_FINISHED
SHIPMENT_READY_EXCEEDS_PACKED
DISPATCHED_EXCEEDS_SHIPMENT_READY
UNEXPLAINED_LOSS_ABOVE_THRESHOLD
PACKED_SHORT_VS_ORDER
SHIPMENT_SHORT_RISK
```

---

## 32. Reconciliation Severity

Severity should consider:

```text
quantity impact
shipment date proximity
customer priority
stage
whether issue blocks movement
whether issue affects shipment
```

Example:

```text
Small mismatch far before shipment → YELLOW
Large mismatch before shipment → RED
Impossible quantity at shipment stage → BLACK
```

---

# Part E: WIP and Workcenter Queue Link

---

## 33. Stage-to-Workcenter Mapping

WIP stages should map to next workcenter.

| WIP Stage | Next Workcenter |
|---|---|
| FABRIC_RECEIVED_NOT_QC | Fabric QC |
| FABRIC_CLEARED | Cutting |
| CUT_PANELS_WAITING_SEWING | Sewing |
| SEWN_WAITING_WASH | Wash |
| DRY_PROCESS_WIP | Dry Process |
| WET_WASH_WIP | Wet Wash |
| WASHED_WAITING_FINISHING | Finishing |
| FINISHED_WAITING_FINAL_QC | Final QC |
| PACKED_GOODS | Shipment Inspection / Docs |

### 33.1 Workcenter Queue Quantity

```text
workcenter_queue_qty =
sum(wip.qty where next_process maps to workcenter and status in WAITING/READY_TO_MOVE)
```

### 33.2 Oldest WIP Age

```text
oldest_wip_age =
max(current_time - entered_stage_at for WIP in workcenter queue)
```

### 33.3 Workcenter Queue Risk

```text
queue_risk =
max(risk status of WIP items in queue)
```

---

## 34. Constraint Linkage

The current constraint should use WIP data.

A workcenter is likely constrained if:

```text
high queue quantity
high oldest WIP age
high planned load
low output rate
many shipment-risk WIP items
```

Constraint score example:

```text
constraint_score =
utilization_score
+ queue_qty_score
+ ageing_score
+ shipment_risk_score
+ exception_score
```

---

# Part F: APIs

---

## 35. Pipeline WIP Dashboard API

### 35.1 GET /api/v1/wip/pipeline

Query parameters:

```text
factoryId
customerId
buyerId
orderId
styleId
stage
stageGroup
riskStatus
ageingBucket
blockedOnly
reworkOnly
shipmentWeek
currentConstraintOnly
shadeLot
washRouteId
page
pageSize
```

### Response

```json
{
  "data": {
    "summary": {
      "totalPipelineWipQty": 86500,
      "blockedWipQty": 7400,
      "ageingWipQty": 18500,
      "criticalAgeingWipQty": 4200,
      "reworkWipQty": 2800,
      "wipBeforeCurrentConstraintQty": 14000,
      "shipmentRiskWipQty": 22600,
      "shipmentReadyQty": 7500,
      "dispatchedQty": 18000
    },
    "currentConstraint": {
      "workcenterId": "uuid",
      "workcenterCode": "WET_WASH",
      "workcenterName": "Wet Wash"
    },
    "stages": [
      {
        "stage": "SEWN_WAITING_WASH",
        "label": "Sewn Goods Waiting for Wash",
        "stageGroup": "WASH",
        "qty": 14000,
        "waitingQty": 12000,
        "heldQty": 0,
        "reworkQty": 0,
        "ageingQty": 8400,
        "oldestAgeHours": 52.0,
        "riskStatus": "RED",
        "topAffectedOrder": {
          "id": "uuid",
          "orderNo": "ORD-1001"
        }
      }
    ]
  },
  "meta": {},
  "errors": []
}
```

---

## 36. WIP Stage Drilldown API

### 36.1 GET /api/v1/wip/pipeline/{stage}

Response item:

```json
{
  "wipItemId": "uuid",
  "orderId": "uuid",
  "orderNo": "ORD-1001",
  "customerName": "Customer A",
  "styleCode": "STY-5001",
  "productType": "DENIM_BOTTOM",
  "qty": 1400,
  "status": "WAITING",
  "holdReason": null,
  "enteredStageAt": "2026-06-04T06:00:00+07:00",
  "ageingHours": 32.5,
  "ageingStatus": "RED",
  "nextProcess": "WET_WASH",
  "owner": {
    "id": 78,
    "displayName": "Washing Manager"
  },
  "shipmentDate": "2026-07-15",
  "shipmentRisk": "RED",
  "batchOrBundleRef": "BND-1001",
  "shadeLot": "SH-A"
}
```

---

## 37. Move WIP API

### 37.1 POST /api/v1/wip/move

Request:

```json
{
  "orderId": "uuid",
  "fromStage": "SEWN_WAITING_WASH",
  "toStage": "WASH_QUEUE",
  "qty": 500,
  "batchOrBundleRef": "WB-1001",
  "movementReason": "Department handover",
  "remarks": "Moved to wash queue"
}
```

Response:

```json
{
  "data": {
    "movementId": "uuid",
    "orderId": "uuid",
    "fromStage": "SEWN_WAITING_WASH",
    "toStage": "WASH_QUEUE",
    "qty": 500,
    "movedAt": "2026-06-05T13:00:00+07:00",
    "updatedSourceQty": 900,
    "updatedTargetQty": 500
  },
  "meta": {},
  "errors": []
}
```

---

## 38. Hold WIP API

### 38.1 POST /api/v1/wip/{wipItemId}/hold

Request:

```json
{
  "holdReason": "POST_WASH_SHADE_VARIATION",
  "affectedQty": 300,
  "ownerId": 78,
  "expectedResolutionAt": "2026-06-06T12:00:00+07:00",
  "remarks": "Shade variation under review"
}
```

Response:

```json
{
  "data": {
    "wipItemId": "uuid",
    "status": "HELD",
    "holdReason": "POST_WASH_SHADE_VARIATION",
    "exceptionId": "uuid"
  },
  "meta": {},
  "errors": []
}
```

---

## 39. Release WIP Hold API

### 39.1 POST /api/v1/wip/{wipItemId}/release-hold

Request:

```json
{
  "releasedQty": 300,
  "resolutionNote": "QC approved after shade review",
  "evidenceUrl": null
}
```

---

## 40. WIP Reconciliation API

### 40.1 GET /api/v1/wip/reconciliation/{orderId}

Response:

```json
{
  "data": {
    "orderId": "uuid",
    "orderNo": "ORD-1001",
    "orderQty": 12000,
    "quantities": {
      "fabricEquivalentQty": 12500,
      "fabricAllocatedQty": 12200,
      "cutQty": 12100,
      "issuedToSewingQty": 12000,
      "sewnGrossQty": 11850,
      "sewingDefectQty": 200,
      "sewingReworkOpenQty": 100,
      "sewnNetGoodQty": 11550,
      "sentToWashQty": 11200,
      "washedQty": 10900,
      "rewashQty": 300,
      "finishedQty": 10400,
      "finalQcHoldQty": 200,
      "packedQty": 9800,
      "shipmentReadyQty": 9600,
      "dispatchedQty": 0
    },
    "gaps": [
      {
        "code": "PACKED_SHORT_VS_ORDER",
        "severity": "RED",
        "message": "Packed quantity is short by 2,200 pieces against order quantity.",
        "qtyImpact": 2200,
        "suggestedAction": "Review finishing and final QC holds"
      }
    ],
    "lastCalculatedAt": "2026-06-05T14:00:00+07:00"
  },
  "meta": {},
  "errors": []
}
```

---

## 41. WIP Adjustment API

### 41.1 POST /api/v1/wip/adjust

Manual adjustment must be controlled.

Request:

```json
{
  "orderId": "uuid",
  "stage": "PACKED_GOODS",
  "adjustmentQty": -50,
  "reason": "Duplicate packing entry correction",
  "approvalReference": "APP-1001"
}
```

Permission:

```text
wip.adjust
```

Response:

```json
{
  "data": {
    "adjustmentId": "uuid",
    "orderId": "uuid",
    "stage": "PACKED_GOODS",
    "adjustmentQty": -50,
    "newStageQty": 9750,
    "auditEventId": "uuid"
  },
  "meta": {},
  "errors": []
}
```

---

# Part G: Backend Services

---

## 42. Recommended Service Modules

```text
wip_inventory/services/pipeline.py
wip_inventory/services/movement.py
wip_inventory/services/ageing.py
wip_inventory/services/reconciliation.py
wip_inventory/services/holds.py
wip_inventory/services/adjustments.py
wip_inventory/selectors/dashboard.py
wip_inventory/selectors/drilldown.py
```

---

## 43. Core Service Functions

### 43.1 create_wip_item

```python
create_wip_item(
    order,
    stage,
    qty,
    status="WAITING",
    batch_or_bundle_ref=None,
    shade_lot=None,
    owner=None,
    source=None
)
```

### 43.2 move_wip

```python
move_wip(
    order,
    from_stage,
    to_stage,
    qty,
    moved_by,
    movement_reason,
    batch_or_bundle_ref=None,
    allow_exception=False
)
```

### 43.3 hold_wip

```python
hold_wip(
    wip_item,
    affected_qty,
    hold_reason,
    owner,
    created_by
)
```

### 43.4 release_wip_hold

```python
release_wip_hold(
    wip_item,
    released_qty,
    resolution_note,
    released_by
)
```

### 43.5 calculate_wip_ageing

```python
calculate_wip_ageing(factory=None, stage=None)
```

### 43.6 reconcile_order_quantities

```python
reconcile_order_quantities(order)
```

### 43.7 get_pipeline_summary

```python
get_pipeline_summary(filters)
```

---

## 44. Transaction Safety

WIP movement must run inside a database transaction.

```python
with transaction.atomic():
    validate_source_qty()
    decrement_source()
    increment_or_create_target()
    create_movement()
    write_audit_if_required()
    trigger_recalculation()
```

This prevents partial movement or quantity mismatch.

---

## 45. Idempotency

For shopfloor/mobile movements, use client event ID.

Example:

```json
{
  "clientEventId": "device-local-uuid"
}
```

If same event is submitted twice:

```text
return previous server result
do not duplicate movement
```

---

# Part H: Frontend Surfaces

---

## 46. Manufacturing Pipeline WIP Dashboard

Route:

```text
/inventory/pipeline-wip
```

### 46.1 Required UI Sections

```text
summary cards
horizontal pipeline map
stage cards
stage drilldown grid
filters
right-side detail drawer
exception/action drawer
```

### 46.2 Header Cards

```text
Total Pipeline WIP
Blocked WIP
Ageing WIP
Rework WIP
WIP Before Current Constraint
Shipment-Risk WIP
Shipment-Ready Quantity
```

### 46.3 Stage Card Fields

```text
stage name
quantity
blocked quantity
ageing quantity
oldest age
risk badge
top affected order
```

---

## 47. WIP Drilldown Screen

Route:

```text
/inventory/pipeline-wip/:stage
```

Grid columns:

```text
Order
Customer
Style
Quantity
Status
Ageing
Hold Reason
Owner
Next Process
Shipment Date
Shipment Risk
Batch/Bundle
Shade Lot
```

Actions:

```text
Open Order
Create Exception
Hold WIP
Release WIP
Move WIP
View Reconciliation
```

---

## 48. WIP Reconciliation Screen

Route:

```text
/inventory/reconciliation
/orders/:orderId/reconciliation
```

### 48.1 UI Sections

```text
quantity chain
stage-wise quantities
known loss/rework/scrap
reconciliation gaps
audit history
suggested actions
```

### 48.2 Visual Model

Recommended:

```text
Order Qty
→ Fabric Equivalent
→ Cut
→ Issued to Sewing
→ Sewn Net Good
→ Sent to Wash
→ Washed
→ Finished
→ Packed
→ Shipment Ready
→ Dispatched
```

Show gaps between each step.

---

# Part I: Exception and Alert Logic

---

## 49. WIP Exceptions

Auto-create or suggest exceptions for:

```text
WIP ageing above threshold
WIP held beyond threshold
quantity reconciliation gap
WIP before current constraint too high
WIP starving current constraint
shipment-risk WIP not moving
rework WIP ageing
manual adjustment above threshold
```

---

## 50. Exception Payload Example

```json
{
  "category": "WIP",
  "severity": "RED",
  "orderId": "uuid",
  "stage": "SEWN_WAITING_WASH",
  "description": "Sewn WIP ageing above 48 hours before wet wash.",
  "ownerId": 78,
  "dueDate": "2026-06-06",
  "suggestedAction": "Create wash batch and prioritize this order."
}
```

---

# Part J: Analytics and Snapshots

---

## 51. Daily WIP Snapshot

The system should create daily WIP snapshots.

Fields:

```text
snapshot_date
factory
stage
order
style
customer
quantity
held quantity
rework quantity
ageing hours
risk status
shipment week
```

### 51.1 Uses

```text
WIP trend
WIP ageing trend
stage bottleneck trend
shipment-risk WIP trend
rework WIP trend
```

---

## 52. WIP KPIs

Recommended KPIs:

```text
total WIP
WIP by stage
WIP ageing by stage
blocked WIP
rework WIP
WIP before constraint
WIP turn time
average stage ageing
shipment-risk WIP
WIP reconciliation gaps
```

---

## 53. WIP Turn Time

```text
stage_turn_time =
moved_out_at - entered_stage_at
```

Average by:

```text
stage
order
style
customer
factory
workcenter
```

---

# Part K: Integration and Initial Data Migration

---

## 54. Initial WIP Upload

During go-live, existing WIP may need to be imported from Excel/manual count.

Required import fields:

```text
order number
style code
stage
quantity
status
shade lot
bundle/batch reference
entered stage date/time if known
owner
hold reason if any
```

### 54.1 Import Validation

Validate:

```text
order exists
style matches order
stage valid
quantity positive
status valid
duplicate batch/bundle warning
```

### 54.2 Unknown Ageing

If entered stage timestamp is unknown:

```text
use import timestamp
or allow approximate date with flag
```

Mark:

```text
ageing_confidence = LOW
```

---

## 55. WIP Source of Truth During Transition

During transition:

```text
existing Excel may provide opening WIP
after go-live, handheld/system movements become source of truth
manual WIP adjustment requires permission and audit
```

Do not allow uncontrolled repeated Excel overwrite after go-live.

---

# Part L: Security and Permissions

---

## 56. WIP Permissions

Recommended permission actions:

```text
wip.view
wip.view_pipeline
wip.move
wip.hold
wip.release_hold
wip.adjust
wip.scrap
wip.view_reconciliation
wip.export
```

### 56.1 Permission Rules

| Action | Permission |
|---|---|
| View WIP | wip.view |
| Move WIP | wip.move |
| Hold WIP | wip.hold |
| Release hold | wip.release_hold |
| Manual adjustment | wip.adjust |
| Scrap quantity | wip.scrap |
| View reconciliation | wip.view_reconciliation |

---

## 57. Audit Requirements

Audit mandatory for:

```text
manual WIP adjustment
scrap
movement out of sequence
movement of held WIP
hold release
reconciliation override
opening WIP import
bulk WIP import
```

Audit should include:

```text
old stage
new stage
old quantity
new quantity
reason
user
timestamp
source
```

---

# Part M: Testing Requirements

---

## 58. Unit Tests

Required tests:

```text
WIP movement decreases source and increases target
movement blocked if source insufficient
movement blocked if WIP held
held WIP cannot move without release
ageing status calculated by threshold
stage summary aggregates correctly
pipeline summary aggregates correctly
rework WIP counted separately
shipment-risk WIP calculated correctly
```

---

## 59. Reconciliation Tests

Required tests:

```text
issued to sewing cannot exceed cut quantity
sewn gross cannot exceed issued quantity beyond tolerance
sent to wash cannot exceed sewn net-good
washed cannot exceed sent-to-wash plus rewash return
packed cannot exceed finished net-good
shipment ready cannot exceed packed
dispatched cannot exceed shipment-ready
unexplained loss creates exception
```

---

## 60. API Tests

Required API tests:

```text
pipeline dashboard returns summary and stages
stage drilldown filters by risk and owner
move WIP validates permissions
hold WIP creates exception
release hold updates status
reconciliation API returns gaps
manual adjustment requires permission and audit
```

---

## 61. E2E Scenarios

### 61.1 Sewing to Wash Handover

```text
Sewing output entered
→ WIP created at SEWN_WAITING_WASH
→ handover to wash
→ WIP moves to wash queue
→ workcenter queue updates
```

### 61.2 Wash Rework

```text
Wash QC fails
→ quantity moves to REWASH_WIP
→ rework order created
→ wash load increases
→ shipment risk recalculated
```

### 61.3 Quantity Gap

```text
Packed quantity entered greater than finished quantity
→ reconciliation detects impossible quantity
→ WIP exception created
```

### 61.4 Held WIP

```text
QC hold created at final QC
→ WIP status HELD
→ shipment readiness blocked
→ hold released
→ WIP moves to packed goods
```

---

# Part N: Implementation Phasing

---

## 62. Phase 1: Basic WIP Foundation

Build:

```text
WIP item
WIP movement
basic stage list
manual movement API
pipeline summary API
stage drilldown API
```

---

## 63. Phase 2: Production Integration

Integrate WIP with:

```text
cutting release
sewing output
wash batch
finishing output
packing output
shipment readiness
```

---

## 64. Phase 3: Ageing and Exceptions

Build:

```text
stage-specific ageing thresholds
WIP ageing job
WIP exception generation
blocked/rework WIP tracking
```

---

## 65. Phase 4: Reconciliation

Build:

```text
order quantity chain
reconciliation API
gap detection
manual adjustment workflow
audit
```

---

## 66. Phase 5: Advanced Pipeline Control

Build:

```text
WIP before current constraint
constraint starvation/overload
turn time analytics
WIP trend snapshots
size/color/shade-level tracking
```

---

# Part O: Open Decisions

---

## 67. Decisions Required

Before implementation, confirm:

1. Is WIP tracked at order level in MVP or order × color × size?
2. Are bundle IDs available from cutting?
3. Are wash batch IDs currently maintained?
4. Is shade lot mandatory at sewing-to-wash handover?
5. Should fabric garment-equivalent be calculated by marker consumption or BOM consumption?
6. What tolerance is allowed for stage quantity mismatch?
7. Who can approve WIP adjustment?
8. Should scrap be tracked separately in MVP?
9. Should handheld handover require receiver acceptance?
10. Should opening WIP be imported once or regularly during transition?

---

## 68. Non-Negotiable Rules

```text
1. WIP must be order-linked.
2. WIP movement must preserve quantity integrity.
3. Held WIP must not move without release/waiver.
4. Rework WIP must be visible separately.
5. WIP ageing must be stage-specific.
6. Shipment-risk WIP must be highlighted.
7. Manual adjustment must require permission and audit.
8. WIP must update workcenter queues.
9. Reconciliation gaps must create or suggest exceptions.
10. WIP must not remain an Excel-only layer after go-live.
```

---

## 69. Summary

This document defines the WIP inventory and reconciliation spine for the Eratex Planning & Scheduling Platform.

The platform must provide a complete, live pipeline view of manufacturing inventory:

```text
Fabric
→ Cutting
→ Sewing
→ Wash
→ Rewash
→ Finishing
→ Packing
→ Shipment
```

It must also ensure quantity integrity across the chain:

```text
order quantity
→ fabric equivalent
→ cut
→ sewn
→ washed
→ finished
→ packed
→ shipment-ready
→ dispatched
```

This WIP layer is essential because it connects the planning board with physical reality. Without it, Eratex will continue to depend on manual Excel trackers for the true shopfloor position.

The WIP module must therefore be treated as a central control layer, not as a secondary report.
