# 10. Wash Planning and Execution Specification  
# Eratex End-to-End Planning & Scheduling Platform

**Company:** Eratex  
**Product:** Planning & Scheduling Tool for Denim Bottoms + Chinos Manufacturing  
**Document Type:** Wash Planning and Execution Specification  
**Version:** 2.0  
**Date:** 2026-05-26  
**Backend Stack:** Django + Django REST Framework + PostgreSQL + Celery  
**Frontend Stack Context:** React/Next.js Planning Workbenches + PWA Shopfloor Capture  
**Related Documents:**  
- 02 Data Model and Table Schema Specification  
- 03 Master Data Specification  
- 04 Planning Logic and Calculation Flows  
- 05 Backend Domain Module Specification  
- 06 API and Data Contracts Specification  
- 07 Event and State Transition Specification  
- 08 WIP Inventory and Reconciliation Specification  
- 09 Line Routing and Operation Bulletin Specification  

---

## 1. Purpose

This document defines the wash planning and wash execution specification for the Eratex Planning & Scheduling Platform.

For denim bottoms and chinos, washing is not a simple finishing step. It can be a major production constraint and quality-risk point. Wash delays, rewash loops, shade variation, hand-feel mismatch, drying bottlenecks, and post-wash QC failures can directly affect OTIF, WIP ageing, rework load, operating expense, and shipment readiness.

The system must therefore treat washing as a **core production planning and execution domain**.

This document defines:

```text
wash route master
wash route steps
dry process and wet wash flow
wash batch creation
wash capacity planning
wash queue prioritization
wash execution tracking
rewash loop
post-wash QC
WIP movement through wash
wash-related exceptions
wash dashboard
handheld wash capture
APIs
audit
analytics
testing
implementation phasing
```

---

## 2. Core Wash Thesis

The platform must model wash as a controlled production process:

```text
sewn goods availability
→ pre-wash QC
→ wash route selection
→ batch creation
→ dry process, if applicable
→ wet wash
→ drying
→ post-wash QC
→ rewash/touch-up if needed
→ release to finishing
```

The planning system must know:

```text
what is waiting for wash
what route it needs
which shade lot it belongs to
which machine/process is required
what capacity it consumes
whether rewash is required
how much WIP is ageing
which shipments are at risk
```

If wash is under-modeled, the system may show sewing as complete while shipment is still at serious risk.

---

## 3. Business Context for Denim and Chino Wash

### 3.1 Denim Wash Complexity

Denim wash can include:

```text
dry process
whiskers
hand scraping
grinding
destroy/rip repair
enzyme wash
stone wash
bleach
ozone
tinting
softener
neutralization
hydro extraction
drying
post-wash shade and measurement QC
```

Some wash results may require repeat processing.

### 3.2 Chino Wash Complexity

Chinos may involve:

```text
garment wash
enzyme wash
softener
tinting
pressing sensitivity
measurement control
colorfastness checks
```

Chinos may be simpler than heavy denim fashion wash, but still require controlled routing and QC.

### 3.3 Wash Failure Modes

Common wash-related planning problems:

```text
shade too dark
shade too light
hand feel not approved
measurement shrinkage issue
wash effect mismatch
damage during wash
dry process delay
dryer bottleneck
machine breakdown
chemical shortage
batch mixing issue
rewash capacity consumption
post-wash QC hold
```

---

## 4. Scope

This document covers:

```text
1. Wash route master
2. Wash route step master
3. Wash machine/workcenter capacity
4. Wash queue
5. Wash batch creation
6. Shade-lot aware batching
7. Dry process execution
8. Wet wash execution
9. Drying execution
10. Post-wash QC
11. Rewash and touch-up
12. Wash WIP movement
13. Wash load and capacity calculation
14. Wash prioritization
15. Wash-related exception generation
16. Wash planning board
17. Handheld wash execution capture
18. Wash analytics
19. APIs
20. Audit and test rules
```

---

## 5. Out of Scope for MVP

The following may be deferred:

```text
chemical inventory auto-consumption
IoT machine integration
real-time PLC capture
advanced recipe parameter tracking at machine level
full costing of wash chemicals and energy
automatic shade matching by image processing
AI-based wash recipe optimization
```

However, the data model should not block these in future phases.

---

# Part A: Wash Master Data

---

## 6. Wash Route Master

### 6.1 Purpose

Wash route master defines the standard process route a style or order must follow in washing.

Examples:

```text
RINSE_WASH
ENZYME_WASH
STONE_WASH
BLEACH_WASH
OZONE_WASH
HEAVY_FASHION_WASH
GARMENT_WASH
SOFTENER_WASH
DRY_PROCESS_PLUS_WET_WASH
```

### 6.2 Required Header Fields

```text
wash_route_id
route_code
route_name
description
product_type_applicability
complexity_rating
rewash_allowed
default_rewash_route_id
status
active_status
created_at
updated_at
```

### 6.3 Optional Header Fields

```text
customer_applicability
fabric_category_applicability
default_batch_size
default_machine_type
expected_rework_percent
expected_shrinkage_percent
special_handling_notes
buyer_standard_reference
```

### 6.4 Status Values

```text
DRAFT
UNDER_REVIEW
APPROVED
SUSPENDED
OBSOLETE
```

### 6.5 Business Rules

```text
Only approved wash route can be used for active production planning.
Approved wash route cannot be edited directly.
Changes should create new version or revised route.
Route must have at least one route step.
Route must indicate whether rewash is allowed.
```

---

## 7. Wash Route Step Master

### 7.1 Purpose

Wash route steps define the detailed process steps inside a wash route.

### 7.2 Required Fields

```text
wash_route_step_id
wash_route_id
sequence_no
step_type
step_name
standard_minutes
machine_type
requires_qc
requires_operator_confirmation
active_status
remarks
```

### 7.3 Step Types

```text
DRY_PROCESS
WHISKER
HAND_SCRAPE
GRINDING
DESTROY
DESIZE
ENZYME
STONE
BLEACH
OZONE
NEUTRALIZE
TINT
SOFTENER
HYDRO_EXTRACT
DRYING
POST_WASH_QC
TOUCH_UP
REWASH
HOLD_REVIEW
```

### 7.4 Example Route: Heavy Denim Fashion Wash

```text
1. Whisker marking
2. Hand scraping
3. Grinding
4. Desize
5. Enzyme wash
6. Stone wash
7. Neutralize
8. Softener
9. Hydro extraction
10. Drying
11. Post-wash QC
12. Touch-up / rewash if required
```

### 7.5 Example Route: Simple Chino Garment Wash

```text
1. Garment wash
2. Softener
3. Hydro extraction
4. Drying
5. Post-wash QC
```

---

## 8. Wash Machine Master

### 8.1 Purpose

Defines wash-specific machines and their planning capacity.

### 8.2 Required Fields

```text
machine_id
machine_code
machine_type
factory_id
workcenter_id
capacity_pieces_per_batch
standard_cycle_minutes
status
active_status
```

### 8.3 Optional Fields

```text
brand
model
min_batch_qty
max_batch_qty
fabric_weight_limit
supported_wash_types
maintenance_status
last_service_date
next_service_date
```

### 8.4 Machine Types

```text
WASHER
DRYER
HYDRO_EXTRACTOR
OZONE_MACHINE
LASER_MACHINE
SPRAY_BOOTH
TUMBLE_DRYER
MANUAL_DRY_PROCESS_TABLE
```

### 8.5 Status Values

```text
AVAILABLE
ASSIGNED
UNDER_MAINTENANCE
BREAKDOWN
INACTIVE
```

---

## 9. Wash Workcenter Master

Wash may include multiple workcenters:

```text
DRY_PROCESS
WET_WASH
DRYING
POST_WASH_QC
REWASH
```

Each workcenter should have:

```text
capacity unit
calendar
resource count
shift plan
constraint candidate flag
```

---

## 10. Wash QC Parameter Master

### 10.1 Purpose

Defines post-wash quality checks.

### 10.2 Recommended Parameters

```text
shade match
wash effect
hand feel
measurement after wash
damage
stain
colorfastness
crocking
stretch recovery
twist/skew
trim impact
```

### 10.3 Status Values

```text
PENDING
PASSED
FAILED
HOLD
REWORK_REQUIRED
WAIVED
```

---

# Part B: Wash Order and Batch Model

---

## 11. Wash Batch

### 11.1 Purpose

A wash batch is the executable unit of wash planning and execution.

### 11.2 Required Fields

```text
wash_batch_id
batch_no
order_id
style_id
wash_route_id
shade_lot
quantity
current_step_id
status
planned_start
planned_end
actual_start
actual_end
created_at
updated_at
```

### 11.3 Optional Fields

```text
color
size_group
machine_id
workcenter_id
priority_score
shipment_risk
batch_type
parent_batch_id
rewash_reason
remarks
```

### 11.4 Batch Types

```text
NORMAL
REWASH
TOUCH_UP
SAMPLE
PILOT
```

### 11.5 Batch Status Values

```text
CREATED
QUEUED
DRY_PROCESS
WET_WASH
DRYING
POST_WASH_QC
REWASH_REQUIRED
REWASH_IN_PROGRESS
HELD
RELEASED_TO_FINISHING
CLOSED
CANCELLED
```

---

## 12. Wash Batch Event

### 12.1 Purpose

Tracks each execution event for a batch.

### 12.2 Event Types

```text
BATCH_CREATED
BATCH_QUEUED
STEP_STARTED
STEP_COMPLETED
STEP_PAUSED
STEP_RESUMED
BATCH_HELD
HOLD_RELEASED
QC_STARTED
QC_COMPLETED
REWASH_REQUIRED
REWASH_STARTED
REWASH_COMPLETED
RELEASED_TO_FINISHING
BATCH_CLOSED
BATCH_CANCELLED
```

### 12.3 Required Fields

```text
wash_batch_event_id
wash_batch_id
step_id
event_type
event_time
quantity
result_status
reason
remarks
entered_by
source
created_at
```

### 12.4 Example Event Payload

```json
{
  "washBatchId": "uuid",
  "stepId": "uuid",
  "eventType": "STEP_COMPLETED",
  "eventTime": "2026-06-05T12:45:00+07:00",
  "qty": 500,
  "resultStatus": "PASSED",
  "remarks": "Enzyme step completed",
  "enteredBy": 101,
  "source": "HANDHELD"
}
```

---

## 13. Shade Lot and Batch Discipline

### 13.1 Why Shade Lot Matters

In denim and garment washing, shade variation is a major quality risk. The system should track shade lot during batching.

### 13.2 Business Rules

```text
Do not mix shade lots in a batch unless approved.
Batch should preserve shade lot reference from fabric/cutting/sewing.
Rewash should retain original shade lot reference.
Post-wash QC should be linked to shade lot.
```

### 13.3 Exception

If shade lots are mixed:

```text
approval required
audit required
risk note required
```

---

# Part C: Wash Planning Logic

---

## 14. Wash Batch Eligibility

A batch can be created when:

```text
sewn goods are available
sewn goods are quality-cleared for wash
wash route is approved
shade lot is known
quantity is available at SEWN_WAITING_WASH or DRY_PROCESS-ready stage
machine/workcenter capacity exists
shipment risk is known
```

### 14.1 Block Batch Creation If

```text
sewn WIP is insufficient
pre-wash QC hold exists
wash route missing or not approved
shade lot missing where mandatory
target batch qty exceeds available WIP
wash workcenter is closed
```

---

## 15. Wash Load Calculation

### 15.1 Batch Step Load

```text
step_load_minutes = standard_minutes for step
```

### 15.2 Total Batch Load

```text
batch_load_minutes =
sum(step_load_minutes for all route steps)
+ loading_unloading_minutes
+ QC_minutes_if_required
```

### 15.3 Total Workcenter Load

```text
workcenter_wash_load =
sum(batch load minutes assigned to workcenter/date)
```

### 15.4 Machine Capacity

```text
available_machine_minutes =
working_minutes × machine_count × efficiency_factor
- planned_downtime_minutes
+ approved_overtime_minutes
```

### 15.5 Batch Capacity

```text
available_batches =
available_machine_minutes / standard_batch_cycle_minutes
```

---

## 16. Wash Utilization

```text
wash_utilization_percent =
planned_wash_load_minutes / available_wash_capacity_minutes × 100
```

Default thresholds:

```text
0–85% = NORMAL
86–100% = WATCH
101–115% = OVERLOADED
116–130% = CONSTRAINT
>130% = CRITICAL_CONSTRAINT
```

Thresholds must be configurable.

---

## 17. Wash Queue Priority Logic

### 17.1 Purpose

The wash queue must not be processed only by arrival order. It should consider shipment protection and process efficiency.

### 17.2 Priority Inputs

```text
shipment date
current shipment risk
WIP ageing
customer priority
wash route complexity
shade lot grouping
machine availability
rewash risk
batch size efficiency
downstream finishing capacity
```

### 17.3 Priority Score

Suggested rule-based score:

```text
priority_score =
shipment_urgency_score
+ wip_ageing_score
+ customer_priority_score
+ risk_score
+ rework_penalty_score
+ batch_efficiency_score
- changeover_penalty
```

### 17.4 Priority Output

```text
priority rank
recommended batch sequence
reason for priority
shipment impact
```

Example:

```json
{
  "orderNo": "ORD-1001",
  "priorityRank": 1,
  "priorityReason": "Shipment risk RED and WIP ageing 52 hours",
  "recommendedAction": "Create wet wash batch today"
}
```

---

## 18. Batch Sizing Logic

### 18.1 Inputs

```text
available WIP quantity
machine min capacity
machine max capacity
shade lot
order priority
wash route
shipment urgency
```

### 18.2 Rule

```text
batch_qty <= available WIP qty
batch_qty <= machine max batch qty
batch_qty >= machine min batch qty unless exception approved
```

### 18.3 Split Batch

Split batch when:

```text
available WIP exceeds machine capacity
shade lots differ
urgent shipment needs partial priority
wash route differs
quality hold affects partial quantity
```

---

# Part D: Wash Execution Flow

---

## 19. Standard Wash Execution Flow

```text
1. Sewn WIP available
2. Wash batch created
3. Batch queued
4. Dry process starts, if applicable
5. Dry process completes
6. Wet wash starts
7. Wet wash completes
8. Hydro extraction / drying
9. Post-wash QC
10. Release to finishing, or rewash/touch-up
```

---

## 20. Dry Process Execution

Dry process may include:

```text
whisker
hand scrape
grinding
destroy
spray
laser
manual touch effect
```

### 20.1 Required Capture

```text
batch
step
start time
end time
operator/supervisor
quantity
result status
remarks
photo if required
```

### 20.2 Dry Process Issues

Possible hold reasons:

```text
effect mismatch
operator shortage
machine issue
style standard unavailable
buyer standard mismatch
```

---

## 21. Wet Wash Execution

Wet wash may include:

```text
desize
enzyme
stone
bleach
ozone
neutralize
tint
softener
```

### 21.1 Required Capture

```text
batch
machine
route step
start time
end time
quantity
result status
operator/supervisor
remarks
```

### 21.2 Optional Future Capture

```text
recipe parameters
chemical quantity
temperature
water level
cycle speed
pH
machine program number
```

These may be deferred beyond MVP.

---

## 22. Drying Execution

Drying can become a bottleneck.

### 22.1 Required Capture

```text
batch
dryer/machine
start time
end time
quantity
result status
remarks
```

### 22.2 Drying Issues

```text
machine breakdown
insufficient dryer capacity
overdrying
hand-feel issue
measurement shrinkage issue
```

---

## 23. Post-Wash QC

### 23.1 QC Checks

```text
shade
wash effect
hand feel
measurement
damage
stain
trim damage
colorfastness if required
crocking if required
```

### 23.2 QC Outcomes

```text
PASSED
HOLD
REWORK_REQUIRED
REWASH_REQUIRED
REJECTED
WAIVED
```

### 23.3 Post-Wash QC Result Effects

| Result | System Action |
|---|---|
| PASSED | move WIP to WASHED_WAITING_FINISHING |
| HOLD | hold WIP and create exception |
| REWASH_REQUIRED | move WIP to REWASH_WIP |
| REWORK_REQUIRED | create rework order |
| REJECTED | mark rejected/scrap or management review |
| WAIVED | allow release with audit |

---

# Part E: Rewash and Touch-Up Logic

---

## 24. Rewash Definition

Rewash is a repeat or corrective wash process applied to a batch or partial batch.

It may repeat:

```text
same wash type
partial route
softener
tint correction
neutralization
hand-feel correction
shade correction
```

The user specifically noted that wash may repeat the same type of wash. The system must support repeated wash cycles.

---

## 25. Rewash Triggers

```text
shade too dark
shade too light
hand feel issue
wash effect mismatch
measurement issue
stain
buyer standard mismatch
chemical effect issue
batch unevenness
```

---

## 26. Rewash Rules

### 26.1 Required Fields

```text
parent wash batch
rewash quantity
rewash reason
rewash route
expected additional minutes
approval status if required
owner
target completion time
```

### 26.2 Capacity Impact

Rewash must consume wash capacity.

```text
additional_wash_load =
rewash_route_standard_minutes × number_of_rewash_batches
```

or:

```text
additional_wash_load =
rewash_qty × rewash_standard_minutes_per_piece
```

Use route/batch-based calculation for MVP.

### 26.3 WIP Impact

When rewash required:

```text
move affected qty to REWASH_WIP
create rewash batch or child batch
retain parent batch reference
retain shade lot
update shipment risk
```

### 26.4 Shipment Impact

Rewash should trigger shipment risk recalculation.

If rewash consumes buffer:

```text
shipment risk may move GREEN → YELLOW → RED → BLACK
```

---

## 27. Rewash Loop

The system must allow multiple rewash cycles.

Example:

```text
Normal wash batch
→ post-wash QC
→ rewash required
→ rewash cycle 1
→ post-wash QC
→ rewash required again
→ rewash cycle 2
→ post-wash QC
→ passed
→ release to finishing
```

### 27.1 Rewash Cycle Counter

Track:

```text
rewash_cycle_no
parent_batch_id
root_batch_id
```

### 27.2 Rewash Limit

Configurable threshold:

```text
max_rewash_cycles
```

If exceeded:

```text
management approval required
quality exception escalated
shipment risk recalculated
```

---

## 28. Touch-Up

Touch-up may be smaller than full rewash.

Examples:

```text
manual dry touch-up
spot cleaning
localized effect correction
minor tint correction
```

Touch-up should be represented either as:

```text
wash batch type = TOUCH_UP
or rework order type = DRY_PROCESS_TOUCHUP
```

Decision depends on whether it consumes wash workcenter capacity.

---

# Part F: WIP Movement Through Wash

---

## 29. Wash WIP Stages

Wash-related stages:

```text
SEWN_WAITING_WASH
DRY_PROCESS_WIP
WET_WASH_WIP
DRYING_WIP
POST_WASH_QC
REWASH_WIP
WASHED_WAITING_FINISHING
```

### 29.1 Normal Flow

```text
SEWN_WAITING_WASH
→ DRY_PROCESS_WIP, if route has dry process
→ WET_WASH_WIP
→ DRYING_WIP
→ POST_WASH_QC
→ WASHED_WAITING_FINISHING
```

### 29.2 Rewash Flow

```text
POST_WASH_QC
→ REWASH_WIP
→ WET_WASH_WIP or DRY_PROCESS_WIP depending route
→ DRYING_WIP
→ POST_WASH_QC
```

### 29.3 Release to Finishing

```text
WASHED_WAITING_FINISHING
→ FINISHING_WIP
```

Requires:

```text
post-wash QC passed or waived
quantity validation
handover acceptance if configured
```

---

## 30. Wash Quantity Rules

### 30.1 Batch Creation

```text
wash_batch_qty <= available SEWN_WAITING_WASH qty
```

### 30.2 Step Completion

```text
completed_step_qty <= batch_qty
```

### 30.3 Rewash

```text
rewash_qty <= post_wash_qc_failed_qty or held_qty
```

### 30.4 Release to Finishing

```text
released_to_finishing_qty <= post_wash_qc_passed_qty
```

---

## 31. Wash Reconciliation

For each wash batch:

```text
batch_qty
dry_process_qty
wet_wash_qty
drying_qty
post_wash_qc_qty
passed_qty
rewash_qty
rejected_qty
released_to_finishing_qty
```

Checks:

```text
wet_wash_qty <= batch_qty
post_wash_qc_qty <= drying_qty
passed_qty + rewash_qty + rejected_qty <= post_wash_qc_qty
released_to_finishing_qty <= passed_qty + waived_qty
```

---

# Part G: Wash Exceptions

---

## 32. Wash Exception Types

Recommended exception codes:

```text
WASH_QUEUE_AGED
WASH_CAPACITY_OVERLOAD
WASH_BATCH_DELAYED
DRY_PROCESS_DELAYED
WET_WASH_DELAYED
DRYING_DELAYED
POST_WASH_QC_FAILED
REWASH_REQUIRED
REWASH_CYCLE_EXCEEDED
SHADE_VARIATION
HAND_FEEL_FAILED
MEASUREMENT_AFTER_WASH_FAILED
WASH_MACHINE_BREAKDOWN
CHEMICAL_SHORTAGE
SHADE_LOT_MIX_APPROVAL_REQUIRED
RELEASE_TO_FINISHING_BLOCKED
```

---

## 33. Exception Generation Rules

### 33.1 Wash Queue Ageing

If:

```text
SEWN_WAITING_WASH age > threshold
```

then:

```text
create WASH_QUEUE_AGED exception
```

### 33.2 Wash Capacity Overload

If:

```text
wash utilization > red threshold
```

then:

```text
create WASH_CAPACITY_OVERLOAD exception
```

### 33.3 Rewash Required

If:

```text
post-wash QC result = REWASH_REQUIRED
```

then:

```text
create or update REWASH_REQUIRED exception
```

### 33.4 Shipment Impact

If wash delay changes shipment risk to RED or BLACK:

```text
create shipment-impacting wash exception
```

---

## 34. Suggested Recovery Actions

For wash exceptions, suggestions may include:

```text
add wash shift
add dryer shift
prioritize RED shipment batches
split batch
combine similar wash route batches
move non-urgent batch later
outsource wash if approved
use alternate machine
expedite post-wash QC
assign touch-up team
approve split shipment
```

---

# Part H: Wash Planning Board UI

---

## 35. Wash Planning Board

Route:

```text
/wash/planning
```

### 35.1 Purpose

The wash planning board should show the full wash pipeline:

```text
Waiting for Wash
Dry Process
Wet Wash
Drying
Post-Wash QC
Rewash / Touch-Up
Released to Finishing
```

### 35.2 Header Cards

```text
Sewn WIP Waiting for Wash
Wash Capacity Today
Planned Wash Load
Wash Utilization %
Ageing Wash Queue
Rewash WIP
Shipment-Risk Wash WIP
Dryer Load
Post-Wash QC Pending
```

### 35.3 Board Columns

```text
Waiting for Wash
Dry Process
Wet Wash
Drying
Post-Wash QC
Rewash
Released to Finishing
```

### 35.4 Batch Card Fields

```text
batch no
order no
style code
customer
wash route
shade lot
quantity
current step
planned start/end
ageing
shipment date
shipment risk
status
priority rank
```

### 35.5 User Actions

```text
create batch
split batch
merge compatible batch, if allowed
start step
complete step
hold batch
mark rewash
release to finishing
open order
open WIP
create exception
```

---

## 36. Wash Queue Prioritization UI

The board should show why a batch is prioritized.

Example:

```text
Priority 1: Shipment RED + WIP ageing 52h
Priority 2: Same route as current machine setup
Priority 3: Customer high priority
```

---

## 37. Wash Capacity View

The UI should show:

```text
available machine minutes
planned batch minutes
actual consumed minutes
remaining capacity
overload
machine breakdown impact
rework capacity impact
```

---

# Part I: Handheld Wash Execution Screens

---

## 38. Mobile Wash Home

Route:

```text
/mobile/wash
```

Shows:

```text
assigned wash batches
current step
next action
open holds
priority batches
```

---

## 39. Start Wash Step Screen

Fields:

```text
batch no
step name
machine
quantity
start time
operator/supervisor
remarks
```

Action:

```text
Start Step
```

---

## 40. Complete Wash Step Screen

Fields:

```text
batch no
step name
quantity completed
result status
end time
remarks
photo if needed
```

Action:

```text
Complete Step
```

---

## 41. Mark Rewash Screen

Fields:

```text
batch no
affected quantity
reason
rewash route
expected extra time
photo/evidence
remarks
```

Action:

```text
Mark Rewash Required
```

---

## 42. Release to Finishing Screen

Fields:

```text
batch no
quantity passed
post-wash QC status
handover to department
remarks
```

Action:

```text
Release to Finishing
```

---

## 43. Offline Behavior

Wash mobile screens should support:

```text
local draft event
offline event queue
sync status
conflict warning
preserve original timestamp
```

Critical offline actions that may create conflicts:

```text
batch completion
rewash marking
release to finishing
```

If conflict occurs:

```text
supervisor must resolve
```

---

# Part J: APIs

---

## 44. Wash Queue API

### 44.1 GET /api/v1/wash/queue

Query params:

```text
factoryId
date
washRouteId
stage
shipmentRisk
ageingStatus
customerId
shadeLot
reworkOnly
priorityOnly
```

Response item:

```json
{
  "orderId": "uuid",
  "orderNo": "ORD-1001",
  "styleCode": "STY-5001",
  "customerName": "Customer A",
  "washRoute": {
    "id": "uuid",
    "code": "HEAVY_ENZYME",
    "name": "Heavy Enzyme Wash"
  },
  "shadeLot": "SH-A",
  "qtyWaiting": 1400,
  "ageingHours": 32.0,
  "ageingStatus": "RED",
  "shipmentDate": "2026-07-15",
  "shipmentRisk": "RED",
  "priorityRank": 1,
  "priorityReason": "Shipment risk RED and WIP ageing 32h"
}
```

---

## 45. Wash Board API

### 45.1 GET /api/v1/wash/board

Response:

```json
{
  "data": {
    "summary": {
      "waitingForWashQty": 14000,
      "plannedWashLoadMinutes": 10400,
      "availableCapacityMinutes": 8000,
      "utilizationPercent": 130.0,
      "rewashWipQty": 2800,
      "shipmentRiskWipQty": 8400
    },
    "columns": [
      {
        "stage": "SEWN_WAITING_WASH",
        "label": "Waiting for Wash",
        "qty": 14000,
        "cards": []
      },
      {
        "stage": "WET_WASH_WIP",
        "label": "Wet Wash",
        "qty": 3200,
        "cards": []
      }
    ]
  },
  "meta": {},
  "errors": []
}
```

---

## 46. Create Wash Batch API

### 46.1 POST /api/v1/wash/batches

Request:

```json
{
  "orderId": "uuid",
  "washRouteId": "uuid",
  "shadeLot": "SH-A",
  "qty": 500,
  "plannedStart": "2026-06-05T10:00:00+07:00",
  "plannedEnd": "2026-06-05T14:00:00+07:00",
  "machineId": "uuid",
  "remarks": "Urgent shipment batch"
}
```

Response:

```json
{
  "data": {
    "batchId": "uuid",
    "batchNo": "WB-1001",
    "status": "QUEUED",
    "plannedLoadMinutes": 240,
    "wipStage": "WASH_QUEUE",
    "shipmentRisk": "RED"
  },
  "meta": {},
  "errors": []
}
```

---

## 47. Wash Batch Detail API

### 47.1 GET /api/v1/wash/batches/{batchId}

Response:

```json
{
  "data": {
    "batchId": "uuid",
    "batchNo": "WB-1001",
    "order": {
      "id": "uuid",
      "orderNo": "ORD-1001",
      "styleCode": "STY-5001",
      "customerName": "Customer A"
    },
    "washRoute": {
      "id": "uuid",
      "code": "HEAVY_ENZYME",
      "name": "Heavy Enzyme Wash"
    },
    "qty": 500,
    "shadeLot": "SH-A",
    "status": "WET_WASH",
    "currentStep": {
      "id": "uuid",
      "stepName": "Enzyme Wash"
    },
    "plannedStart": "2026-06-05T10:00:00+07:00",
    "plannedEnd": "2026-06-05T14:00:00+07:00",
    "actualStart": "2026-06-05T10:10:00+07:00",
    "actualEnd": null,
    "routeSteps": [
      {
        "stepId": "uuid",
        "sequenceNo": 10,
        "stepType": "DRY_PROCESS",
        "stepName": "Hand Scrape",
        "standardMinutes": 60,
        "status": "COMPLETED",
        "actualStart": "2026-06-05T10:10:00+07:00",
        "actualEnd": "2026-06-05T11:05:00+07:00"
      }
    ],
    "events": []
  },
  "meta": {},
  "errors": []
}
```

---

## 48. Record Wash Event API

### 48.1 POST /api/v1/wash/batches/{batchId}/events

Request:

```json
{
  "stepId": "uuid",
  "eventType": "STEP_COMPLETED",
  "eventTime": "2026-06-05T12:45:00+07:00",
  "qty": 500,
  "resultStatus": "PASSED",
  "remarks": "Step completed"
}
```

Response:

```json
{
  "data": {
    "eventId": "uuid",
    "batchId": "uuid",
    "batchStatus": "DRYING",
    "nextStep": {
      "stepId": "uuid",
      "stepName": "Drying"
    },
    "wipUpdated": true
  },
  "meta": {},
  "errors": []
}
```

---

## 49. Mark Rewash Required API

### 49.1 POST /api/v1/wash/batches/{batchId}/rewash

Request:

```json
{
  "reason": "SHADE_TOO_DARK",
  "qty": 300,
  "rewashRouteId": "uuid",
  "expectedExtraMinutes": 180,
  "approvalRequired": true,
  "remarks": "Shade darker than approved standard"
}
```

Response:

```json
{
  "data": {
    "batchId": "uuid",
    "status": "REWASH_REQUIRED",
    "rewashBatchId": "uuid",
    "rewashCycleNo": 1,
    "additionalLoadMinutes": 180,
    "wipStage": "REWASH_WIP",
    "shipmentRiskAfter": "RED",
    "exceptionId": "uuid"
  },
  "meta": {},
  "errors": []
}
```

---

## 50. Release to Finishing API

### 50.1 POST /api/v1/wash/batches/{batchId}/release-to-finishing

Request:

```json
{
  "qty": 500,
  "postWashQcStatus": "PASSED",
  "handoverToDepartmentId": "uuid",
  "remarks": "Released after QC pass"
}
```

Response:

```json
{
  "data": {
    "batchId": "uuid",
    "status": "RELEASED_TO_FINISHING",
    "releasedQty": 500,
    "wipStage": "WASHED_WAITING_FINISHING",
    "releasedAt": "2026-06-05T16:00:00+07:00"
  },
  "meta": {},
  "errors": []
}
```

---

## 51. Wash Capacity API

### 51.1 GET /api/v1/wash/capacity

Query params:

```text
factoryId
dateFrom
dateTo
workcenterId
machineType
```

Response:

```json
{
  "data": {
    "dateFrom": "2026-06-05",
    "dateTo": "2026-06-05",
    "availableCapacityMinutes": 8000,
    "plannedLoadMinutes": 10400,
    "actualLoadMinutes": 6400,
    "rewashLoadMinutes": 1200,
    "utilizationPercent": 130.0,
    "constraintStatus": "CRITICAL_CONSTRAINT",
    "machines": [
      {
        "machineId": "uuid",
        "machineCode": "WASH-01",
        "machineType": "WASHER",
        "availableMinutes": 480,
        "plannedLoadMinutes": 620,
        "status": "OVERLOADED"
      }
    ]
  },
  "meta": {},
  "errors": []
}
```

---

# Part K: Backend Services

---

## 52. Recommended Service Modules

```text
washing/services/routes.py
washing/services/batches.py
washing/services/execution.py
washing/services/capacity.py
washing/services/priority.py
washing/services/rewash.py
washing/services/qc.py
washing/selectors/queue.py
washing/selectors/board.py
washing/selectors/capacity.py
```

---

## 53. Core Service Functions

```python
get_approved_wash_route(style_or_order)
calculate_wash_batch_load(batch)
calculate_wash_workcenter_load(date_range)
calculate_wash_queue_priority(order_or_wip)
create_wash_batch(order, route, shade_lot, qty, user)
start_wash_step(batch, step, user)
complete_wash_step(batch, step, payload, user)
hold_wash_batch(batch, reason, user)
release_wash_hold(batch, user)
mark_rewash_required(batch, reason, qty, rewash_route, user)
release_batch_to_finishing(batch, qty, user)
calculate_wash_reconciliation(batch)
```

---

## 54. Transaction Safety

Critical wash transitions must be atomic:

```text
create wash event
update batch status
update WIP
create exception if needed
write audit
```

Example:

```python
with transaction.atomic():
    create_wash_event()
    update_batch_status()
    wip_inventory.move_wip()
    exceptions.create_if_needed()
    audit.write()
```

---

## 55. Idempotency

Mobile wash events may be submitted twice due to network issues.

Use:

```text
client_event_id
device_id
original_timestamp
```

If duplicate event is received:

```text
return original result
do not duplicate batch event
do not duplicate WIP movement
```

---

# Part L: Permissions and Audit

---

## 56. Wash Permissions

Recommended permission actions:

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

## 57. Audit Required For

```text
wash route approval
wash route version change
batch creation
batch cancellation
batch hold
hold release
rewash required decision
rewash approval
shade lot mix approval
release to finishing
manual quantity adjustment
post-wash QC waiver
```

---

## 58. Audit Payload Example

```json
{
  "entityType": "WashBatch",
  "entityId": "uuid",
  "action": "REWASH_REQUIRED",
  "oldValue": {
    "status": "POST_WASH_QC"
  },
  "newValue": {
    "status": "REWASH_REQUIRED",
    "rewashQty": 300,
    "reason": "SHADE_TOO_DARK"
  },
  "reason": "Shade darker than standard",
  "performedBy": 78,
  "performedAt": "2026-06-05T15:00:00+07:00"
}
```

---

# Part M: Analytics

---

## 59. Wash KPIs

Recommended KPIs:

```text
wash queue quantity
wash queue ageing
wash utilization
dry process utilization
wet wash utilization
dryer utilization
post-wash QC pending
rewash quantity
rewash rate
average wash cycle time
batch delay
wash-related shipment risk
wash defect rate
machine downtime
```

---

## 60. Rewash Rate

```text
rewash_rate =
rewash_qty / washed_qty × 100
```

By:

```text
style
wash route
customer
machine
operator/supervisor
shade lot
factory
```

---

## 61. Wash Cycle Time

```text
wash_cycle_time =
batch_released_to_finishing_at - batch_created_at
```

Step-level cycle:

```text
step_cycle_time =
step_completed_at - step_started_at
```

---

## 62. Wash Plan Adherence

```text
wash_plan_adherence =
batches_completed_as_planned / planned_batches × 100
```

or by quantity:

```text
planned_qty_completed_on_time / planned_qty × 100
```

---

# Part N: Testing Requirements

---

## 63. Unit Tests

Required tests:

```text
wash route cannot be approved without steps
batch cannot be created without approved route
batch qty cannot exceed available sewn WIP
shade lot mixing requires approval
batch load calculated from route steps
capacity utilization calculated correctly
rewash creates additional load
release to finishing blocked if QC pending
```

---

## 64. API Tests

Required tests:

```text
wash queue filters by risk and ageing
create batch validates WIP availability
record step completion updates batch state
rewash API creates rewash WIP and exception
release to finishing moves WIP correctly
capacity API includes rewash load
permission checks for rewash and release
```

---

## 65. E2E Tests

### 65.1 Normal Wash Flow

```text
Sewn goods available
→ create wash batch
→ complete dry process
→ complete wet wash
→ complete drying
→ post-wash QC passed
→ release to finishing
```

Expected:

```text
WIP moves to WASHED_WAITING_FINISHING
batch status RELEASED_TO_FINISHING
order risk recalculated
```

### 65.2 Rewash Flow

```text
Wash batch reaches post-wash QC
→ shade issue found
→ mark rewash required
→ rewash batch created
→ rewash completed
→ QC passed
→ release to finishing
```

Expected:

```text
rewash WIP created
additional wash load created
exception created/updated
shipment risk recalculated
```

### 65.3 Wash Capacity Overload

```text
planned wash load exceeds capacity
```

Expected:

```text
constraint status = CONSTRAINT/CRITICAL_CONSTRAINT
wash exception created
affected orders visible
```

---

# Part O: Implementation Phasing

---

## 66. Phase 1: Wash Master and Queue

Build:

```text
wash route
wash route steps
wash machine master
wash queue API
basic wash planning board
```

---

## 67. Phase 2: Wash Batch Execution

Build:

```text
wash batch
wash batch events
start/complete steps
WIP movement through wash
handheld wash execution
```

---

## 68. Phase 3: Rewash and QC

Build:

```text
post-wash QC integration
rewash required
rewash batch
rewash capacity load
touch-up
wash hold/release
```

---

## 69. Phase 4: Capacity and Prioritization

Build:

```text
wash capacity calculation
queue priority score
workcenter load integration
dry/wet/dryer capacity separation
```

---

## 70. Phase 5: Analytics and Optimization

Build:

```text
rewash rate
wash cycle time
machine utilization
wash plan adherence
style/wash route performance
shipment risk analytics
```

---

# Part P: Open Decisions

---

## 71. Decisions Required Before Build

1. Are wash routes standardized today or maintained style-wise?
2. Are dry process and wet wash tracked separately today?
3. Is shade lot mandatory for wash batching?
4. What is the current batch size rule by machine?
5. Are wash machines digitally identified?
6. Is post-wash QC performed batch-wise or sample-wise?
7. Who can approve rewash?
8. How many rewash cycles are allowed before escalation?
9. Are chemical inventory and recipe parameters needed in MVP?
10. Should dryer capacity be treated as separate constraint?
11. Should wash outsourcing be modeled as a recovery option?
12. Is handheld wash execution realistic at go-live?

---

## 72. Non-Negotiable Rules

```text
1. Wash must be modeled as a production constraint.
2. No wash batch without approved wash route.
3. Wash batch quantity cannot exceed available WIP.
4. Shade lot must be preserved through wash.
5. Rewash must consume capacity.
6. Rewash must update WIP and shipment risk.
7. Post-wash QC must gate release to finishing.
8. Wash queue ageing must create alerts.
9. Wash capacity overload must be visible to planners.
10. Wash execution actuals must be captured live or near-live.
```

---

## 73. Summary

This document defines the wash planning and execution spine for the Eratex Planning & Scheduling Platform.

The system must support the complete wash control loop:

```text
sewn WIP
→ wash queue
→ batch planning
→ dry process
→ wet wash
→ drying
→ post-wash QC
→ rewash/touch-up if needed
→ release to finishing
```

For denim bottoms and chinos, wash is a critical determinant of shipment reliability, quality, WIP ageing, and operating expense. The platform must therefore treat wash as a first-class planning and execution domain.

The wash module should integrate tightly with:

```text
WIP inventory
workcenter load
sewing output
quality
exceptions
shipment readiness
analytics
handheld capture
```

This ensures that planners do not see sewing completion as a false signal of shipment readiness while wash remains the hidden bottleneck.
