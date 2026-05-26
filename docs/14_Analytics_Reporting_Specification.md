# 14. Analytics and Reporting Specification  
# Eratex End-to-End Planning & Scheduling Platform

**Company:** Eratex  
**Product:** Planning & Scheduling Tool for Denim Bottoms + Chinos Manufacturing  
**Document Type:** Analytics and Reporting Specification  
**Version:** 2.0  
**Date:** 2026-05-26  
**Backend Stack:** Django + Django REST Framework + PostgreSQL + Celery  
**Frontend Stack Context:** React/Next.js + TypeScript + Recharts + Data Grids  
**Related Documents:**  
- 02 Data Model and Table Schema Specification  
- 04 Planning Logic and Calculation Flows  
- 05 Backend Domain Module Specification  
- 06 API and Data Contracts Specification  
- 08 WIP Inventory and Reconciliation Specification  
- 09 Line Routing and Operation Bulletin Specification  
- 10 Wash Planning and Execution Specification  
- 11 Exception, Alert, and Recovery Specification  
- 13 Frontend Implementation Specification  

---

## 1. Purpose

This document defines the analytics, reporting, KPI, dashboard, snapshot, and drilldown specification for the Eratex Planning & Scheduling Platform.

The platform must not only support planning and execution. It must also provide management visibility into:

```text
production health
order risk
PCD readiness
capacity utilization
line efficiency
wash load
rewash rate
WIP ageing
exception performance
shipment readiness
OTIF
cost-protected OTIF
resource utilization
planning adherence
quality losses
recovery effectiveness
```

This document provides a build-ready specification for:

```text
analytics data model
KPI definitions
snapshot jobs
dashboard surfaces
API contracts
frontend reporting views
drilldown logic
exports
permissions
testing
governance
```

---

## 2. Analytics Thesis

The analytics layer must not be a passive reporting module. It must help the management and planning team distinguish between:

```text
stable operating performance
and shipment commitments protected by firefighting
```

A factory may show high OTIF while hiding:

```text
low resource utilization
excess overtime
wash rework
manual expediting
split shipments
premium freight
late-stage recovery
high WIP ageing
```

Therefore, analytics should answer:

```text
Are we shipping on time?
Are we shipping on time efficiently?
Which process is protecting or damaging OTIF?
Where is WIP stuck?
Which line/style/customer causes recurring loss?
Which recovery actions are repeatedly needed?
Which master data assumptions are wrong?
```

---

## 3. Analytics Scope

The analytics scope includes:

```text
1. Executive control tower
2. Order risk analytics
3. OTIF analytics
4. Cost-protected OTIF
5. Resource utilization
6. Workcenter load and constraint analytics
7. Sewing line efficiency
8. Operation bulletin performance
9. Line-style fit analytics
10. Wash analytics
11. WIP pipeline analytics
12. WIP reconciliation analytics
13. Quality and rework analytics
14. Exception analytics
15. Recovery action analytics
16. Shipment readiness analytics
17. Planning adherence
18. Data freshness and system discipline analytics
19. Master data completeness analytics
20. Export and scheduled reports
```

---

## 4. Analytics Principles

### 4.1 Backend Owns KPI Calculation

The backend must calculate official KPI values.

Frontend should render:

```text
values
trends
breakdowns
drilldowns
```

Frontend should not define core KPI formulas independently.

### 4.2 Snapshot for Historical Reporting

Operational tables change frequently. Daily snapshots are required for stable analytics.

### 4.3 Drilldown to Root Cause

Every KPI should allow drilldown from:

```text
summary → dimension breakdown → order/workcenter/line list → entity detail
```

### 4.4 Separate Gross and Net-Good Metrics

For garment manufacturing, analytics must distinguish:

```text
gross output
net-good output
defect quantity
rework quantity
scrap/reject quantity
```

### 4.5 Separate Utilization and Efficiency

Do not conflate:

```text
utilization = how much capacity was loaded/used
efficiency = how well loaded resources converted time into good output
```

### 4.6 Track Recovery Cost Stress

High OTIF with repeated recovery is not healthy.

The system must track:

```text
OTIF achieved normally
OTIF achieved with recovery
OTIF protected by overtime
OTIF protected by split shipment
OTIF protected by expedited material
OTIF protected by premium freight
```

---

# Part A: Analytics Data Architecture

---

## 5. Analytics Data Sources

Analytics will consume:

```text
production_order
order_milestone
pcd_readiness
material_requirement
material_po
fabric_qc_inspection
plan_version
planned_work_item
production_release
workcenter_capacity_day
sewing_output_entry
sewing_line_loading
line_balance_plan
wash_batch
wash_batch_event
wip_item
wip_movement
qc_inspection
qc_defect
rework_order
exception_record
recovery_action
shipment_readiness
shipment_readiness_item
audit_event
integration_run
```

---

## 6. Snapshot Strategy

### 6.1 Why Snapshots Are Required

Historical reporting cannot rely only on current-state tables because statuses change.

Example:

```text
A shipment that was RED risk last week may be GREEN today.
```

Without snapshots, the system loses historical risk progression.

### 6.2 Snapshot Frequency

Recommended:

```text
daily snapshots for management KPIs
hourly snapshots for WIP/workcenter where needed
event-driven recalculation for live boards
```

### 6.3 Snapshot Timing

Daily snapshot should run:

```text
after shift close
or at configured end-of-day time
```

For multi-shift factories, snapshot timing must be aligned to operational day.

---

## 7. Snapshot Tables

Recommended snapshot tables:

```text
daily_order_status_snapshot
daily_workcenter_load_snapshot
daily_line_efficiency_snapshot
daily_wip_pipeline_snapshot
daily_exception_snapshot
daily_shipment_readiness_snapshot
daily_wash_snapshot
daily_quality_snapshot
daily_recovery_action_snapshot
daily_master_data_readiness_snapshot
```

---

## 8. Snapshot Idempotency

Snapshot jobs must be idempotent.

For a given:

```text
snapshot_date + entity key
```

rerun should update/replace snapshot, not duplicate records.

---

## 9. Analytics Job Ownership

Recommended Celery jobs:

```text
create_daily_order_status_snapshot
create_daily_workcenter_load_snapshot
create_daily_line_efficiency_snapshot
create_daily_wip_pipeline_snapshot
create_daily_exception_snapshot
create_daily_shipment_snapshot
create_daily_wash_snapshot
create_daily_quality_snapshot
create_daily_recovery_snapshot
create_daily_master_data_snapshot
```

---

# Part B: Executive Control Tower

---

## 10. Executive Control Tower Purpose

Route:

```text
/dashboard/control-tower
```

The control tower provides a one-page view of factory health.

It should answer:

```text
What is at risk today?
Where is the constraint?
Which shipments are not safe?
Which WIP is stuck?
Which exceptions need management attention?
Is OTIF being protected by extra cost?
```

---

## 11. Executive KPIs

Recommended header cards:

```text
Orders at RED/BLACK Risk
Shipments Due This Week
Shipment Ready %
OTIF Current Period
Cost-Protected OTIF
Resource Utilization
Net-Good Efficiency
Current Constraint
Ageing WIP Quantity
Open RED/BLACK Exceptions
Wash Rework Rate
PCD Blocked Orders
```

---

## 12. Control Tower Panels

Panels:

```text
Top 10 at-risk orders
Current constraint and affected orders
Shipment readiness by week
WIP ageing by stage
Wash queue and rewash
Line underperformance
Exception ageing
Recovery actions due today
Data freshness alerts
```

---

## 13. Control Tower Drilldowns

Each KPI card should drill into a workbench:

| KPI | Drilldown |
|---|---|
| Orders at risk | Order lifecycle grid |
| Current constraint | Workcenter load monitor |
| Ageing WIP | WIP pipeline stage drilldown |
| Wash rework | Wash board / wash analytics |
| Open exceptions | Exception control tower |
| Shipment readiness | Shipment readiness screen |
| Line efficiency | Efficiency review |
| PCD blocked | PCD readiness screen |

---

# Part C: OTIF Analytics

---

## 14. OTIF Definition

OTIF means:

```text
On Time In Full
```

An order/shipment is OTIF if:

```text
actual dispatch date <= committed ship date
and dispatched quantity >= committed shipment quantity
```

---

## 15. OTIF Formula

```text
OTIF % =
OTIF shipments / total due shipments × 100
```

Where:

```text
OTIF shipment = on time and in full
```

---

## 16. On-Time Logic

```text
on_time =
actual_dispatch_date <= committed_ship_date
```

---

## 17. In-Full Logic

```text
in_full =
dispatched_qty >= committed_ship_qty
```

If split shipments are used:

```text
in_full should be evaluated against agreed shipment commitment
```

This must be configurable by business rule.

---

## 18. OTIF Breakdown

Break down OTIF by:

```text
customer
buyer
product type
factory
shipment week
style
wash complexity
order size bucket
```

---

## 19. OTIF Failure Reasons

Recommended categories:

```text
PCD_DELAY
MATERIAL_DELAY
FABRIC_QC_DELAY
CUTTING_DELAY
SEWING_SHORTFALL
WASH_DELAY
REWASH_DELAY
QUALITY_HOLD
PACKING_DELAY
AQL_DELAY
DOCUMENTATION_DELAY
FORWARDER_DELAY
UNKNOWN
```

---

## 20. Cost-Protected OTIF

### 20.1 Purpose

Shows shipments that were on time only because recovery actions were used.

### 20.2 Recovery Indicators

```text
overtime used
extra shift used
premium freight used
split shipment used
outsourcing used
material expediting used
management override used
```

### 20.3 Formula

```text
cost_protected_otif_count =
count(OTIF shipments with linked recovery actions)
```

```text
cost_protected_otif_percent =
cost_protected_otif_count / OTIF shipments × 100
```

### 20.4 Reporting View

Show:

```text
OTIF %
Normal OTIF %
Cost-Protected OTIF %
Late %
Short %
```

This helps show whether high OTIF is stable or firefighting-driven.

---

# Part D: Resource Utilization and Capacity Analytics

---

## 21. Resource Utilization

```text
resource_utilization_percent =
actual_productive_load / available_capacity × 100
```

By:

```text
factory
department
workcenter
line
date
shift
```

---

## 22. Planned Utilization

```text
planned_utilization_percent =
planned_load / available_capacity × 100
```

---

## 23. Actual Utilization

```text
actual_utilization_percent =
actual_load / available_capacity × 100
```

---

## 24. Net-Good Utilization

```text
net_good_utilization_percent =
net_good_productive_minutes / available_capacity_minutes × 100
```

Where:

```text
net_good_productive_minutes = net_good_output × SMV
```

---

## 25. Utilization Bands

Default bands:

```text
0–60% = UNDERUTILIZED
61–85% = NORMAL
86–100% = HIGH
101–115% = OVERLOADED
116%+ = CRITICAL
```

Thresholds must be configurable by workcenter.

---

## 26. Utilization vs Efficiency Diagnostic

Examples:

```text
High utilization + low efficiency = resources loaded but poor conversion
Low utilization + high efficiency = not enough work loaded
High utilization + high efficiency = healthy but watch overload
Low utilization + low efficiency = major planning/execution issue
```

---

# Part E: Workcenter Constraint Analytics

---

## 27. Current Constraint KPI

Current constraint is the workcenter with highest operational constraint score.

### 27.1 Constraint Score

```text
constraint_score =
utilization_score
+ queue_ageing_score
+ shipment_impact_score
+ exception_score
+ throughput_shortfall_score
```

---

## 28. Constraint Analytics

Show by workcenter:

```text
available capacity
planned load
actual load
utilization
queue quantity
oldest WIP age
shipment-risk WIP
open exceptions
constraint status
```

---

## 29. Constraint Trend

Track:

```text
how many days workcenter was constraint
average utilization
average queue ageing
orders affected
shipment misses linked to constraint
```

This helps identify recurring bottlenecks.

---

# Part F: Sewing Line Efficiency Analytics

---

## 30. Line Efficiency Formula

```text
earned_minutes =
net_good_output × style_smv
```

```text
line_efficiency_percent =
earned_minutes / available_line_minutes × 100
```

Where:

```text
available_line_minutes = manpower × working_minutes
```

---

## 31. Gross Output vs Net-Good Output

Analytics must show:

```text
gross output
defect quantity
rework quantity
net-good output
```

Do not use gross output as the primary planning performance metric.

---

## 32. Line Efficiency Breakdowns

Break down by:

```text
line
style
customer
supervisor
product type
shift
date
operation bulletin version
```

---

## 33. Line Loss Breakdown

Loss categories:

```text
defect loss
rework loss
downtime loss
changeover loss
absenteeism loss
line imbalance loss
machine breakdown
no input WIP
quality hold
```

---

## 34. Required Run Rate Analytics

For active lines:

```text
required_run_rate =
remaining_daily_target / remaining_shift_time
```

Compare with:

```text
current_run_rate =
actual_net_good_output / elapsed_shift_time
```

If required rate exceeds achievable rate:

```text
line shortfall risk
```

---

## 35. Line-Style Fit Analytics

Track performance by:

```text
line × style
line × product type
line × wash complexity
line × operation bulletin version
```

Metrics:

```text
average efficiency
defect rate
rework rate
learning days
output stability
```

Use for future line assignment suggestions.

---

# Part G: Operation Bulletin Performance Analytics

---

## 36. Purpose

Operation bulletin performance analytics compares planned technical assumptions against execution reality.

It identifies:

```text
unrealistic SMV
operation bottleneck
line imbalance
skill gap
style learning curve
technical method issue
```

---

## 37. Metrics

```text
planned SMV
actual equivalent SMV
efficiency gap
operation bottleneck count
line balance efficiency
balance loss
defect rate by operation group
rework rate
style learning curve
```

---

## 38. Bulletin Variance

```text
smv_variance_percent =
(actual_equivalent_smv - planned_smv) / planned_smv × 100
```

Interpretation:

```text
positive variance = actual is slower than planned
negative variance = actual is faster than planned
```

---

## 39. Review Flags

Flag operation bulletin for review if:

```text
actual equivalent SMV exceeds planned SMV by threshold
same bottleneck operation repeats
defect rate high for operation group
line cannot achieve target after learning period
```

---

# Part H: Wash Analytics

---

## 40. Wash KPIs

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
wash cycle time
wash plan adherence
wash-related shipment risk
wash machine downtime
```

---

## 41. Rewash Rate

```text
rewash_rate =
rewash_qty / washed_qty × 100
```

Break down by:

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

## 42. Wash Cycle Time

```text
wash_cycle_time =
released_to_finishing_at - batch_created_at
```

Step cycle time:

```text
step_cycle_time =
step_completed_at - step_started_at
```

---

## 43. Wash Delay Reasons

```text
queue ageing
dry process delay
wet wash delay
dryer delay
QC delay
rewash
machine breakdown
chemical shortage
shade hold
```

---

## 44. Wash Route Performance

For each wash route:

```text
average cycle time
planned vs actual cycle time
rewash rate
QC pass rate
shipment impact count
machine utilization
```

---

# Part I: WIP Analytics

---

## 45. WIP Pipeline KPIs

```text
total pipeline WIP
WIP by stage
blocked WIP
ageing WIP
critical ageing WIP
rework WIP
WIP before current constraint
shipment-risk WIP
shipment-ready quantity
```

---

## 46. WIP Ageing

```text
wip_age_hours =
current_timestamp - entered_stage_at
```

Ageing bands:

```text
GREEN
YELLOW
RED
BLACK
```

Stage-specific thresholds must be used.

---

## 47. WIP Turn Time

```text
stage_turn_time =
moved_out_at - entered_stage_at
```

Break down by:

```text
stage
style
customer
workcenter
factory
```

---

## 48. WIP Reconciliation Analytics

Track:

```text
quantity gaps
unexplained loss
manual adjustments
scrap/reject
rework recovery
impossible quantities
```

Metrics:

```text
orders with reconciliation gaps
total quantity gap
manual adjustment count
unexplained loss quantity
```

---

# Part J: Quality and Rework Analytics

---

## 49. Quality KPIs

```text
defect rate
rework rate
first-pass quality
QC hold quantity
AQL failure count
defects by stage
defects by operation group
defects by line
defects by style
```

---

## 50. Defect Rate

```text
defect_rate =
defect_qty / checked_qty × 100
```

---

## 51. First Pass Quality

```text
first_pass_quality =
passed_qty_first_time / checked_qty × 100
```

---

## 52. Rework Rate

```text
rework_rate =
rework_qty / produced_qty × 100
```

Breakdown:

```text
sewing rework
wash rework
finishing rework
packing correction
```

---

## 53. Quality Cost Proxy

If financial cost is not available, use operational proxy:

```text
rework minutes
rework quantity
extra wash cycles
shipment delay impact
```

---

# Part K: Exception and Recovery Analytics

---

## 54. Exception KPIs

```text
open exceptions
RED/BLACK exceptions
shipment-impacting exceptions
overdue exceptions
unassigned exceptions
average closure time
SLA adherence
exception recurrence
exceptions by category
exceptions by owner
exceptions by workcenter
```

---

## 55. Closure Time

```text
closure_time_hours =
closed_at - created_at
```

---

## 56. SLA Adherence

```text
sla_adherence =
exceptions_closed_on_time / total_closed_exceptions × 100
```

---

## 57. Recurrence Analytics

Track recurrence by:

```text
rule code
category
workcenter
line
style
vendor
wash route
customer
```

Recurring exceptions indicate systemic problems.

---

## 58. Recovery Action Analytics

Track:

```text
recovery actions created
recovery actions completed
failed recovery actions
approval pending actions
actions by type
OTIF protected by action type
capacity added by recovery
```

---

# Part L: Shipment Readiness Analytics

---

## 59. Shipment Readiness KPIs

```text
shipments due
ready shipments
blocked shipments
short quantity
AQL pending
documentation pending
forwarder booking pending
shipment-risk orders
```

---

## 60. Readiness Percentage

```text
shipment_readiness_percent =
ready_shipments / total_shipments_due × 100
```

---

## 61. Shipment Blocker Breakdown

```text
final QC pending
AQL pending
packing incomplete
documentation pending
forwarder pending
short quantity
barcode/label issue
```

---

## 62. Shipment Risk Ageing

For shipment-readiness blockers:

```text
days_to_shipment
blocker age
owner
exception status
```

Prioritize blockers close to shipment date.

---

# Part M: Planning Adherence Analytics

---

## 63. Plan Adherence

```text
plan_adherence_percent =
completed_planned_work / planned_work × 100
```

Can be measured by:

```text
quantity
work item count
planned minutes
shipment milestone
```

---

## 64. Weekly Plan Stability

Track:

```text
number of plan changes
orders moved
workcenter changes
line changes
date changes
changes after freeze
```

---

## 65. Daily Release Adherence

```text
daily_release_adherence =
completed_released_qty / released_qty × 100
```

---

## 66. Plan Change Reason Analytics

Categories:

```text
material delay
PCD blocker
capacity overload
line shortfall
wash delay
quality hold
shipment priority change
customer change
master data error
```

---

# Part N: Master Data and Data Freshness Analytics

---

## 67. Master Data Completeness KPIs

```text
styles missing BOM
styles missing operation bulletin
styles missing wash route
lines missing machines
lines missing efficiency baseline
operators missing skill matrix
vendors missing lead time
workcenters missing calendar
```

---

## 68. Data Freshness KPIs

```text
lines with stale output
workcenters with no update
pending offline sync entries
failed integration runs
stale shipment readiness
unclosed shift closures
```

---

## 69. Stale Data Rule

Example:

```text
active line + active shift + no output update for configured threshold
= stale line data
```

Create exception:

```text
SYSTEM_DATA / SHOPFLOOR_DATA_STALE
```

---

# Part O: Reporting Surfaces

---

## 70. Analytics Routes

Recommended routes:

```text
/analytics/executive
/analytics/otif
/analytics/utilization
/analytics/workcenter-constraints
/analytics/line-efficiency
/analytics/operation-bulletin-performance
/analytics/wash
/analytics/wip
/analytics/quality
/analytics/exceptions
/analytics/recovery
/analytics/shipment
/analytics/planning-adherence
/analytics/master-data-readiness
/analytics/data-freshness
```

---

## 71. Common Report Layout

Each report should include:

```text
title
description
date range
filters
KPI cards
chart area
breakdown table
drilldown grid
export action
last calculated timestamp
```

---

## 72. Filter Standards

Common filters:

```text
factory
date range
customer
buyer
style
product type
workcenter
line
owner
shipment week
risk status
exception category
wash route
```

---

## 73. Chart Types

Recommended:

```text
line chart for trends
bar chart for category breakdown
stacked bar for status distribution
area chart for WIP trend
heatmap for line/workcenter performance
funnel/flow for order lifecycle
```

Avoid chart overload. Every chart should answer an operational question.

---

# Part P: API Contracts

---

## 74. Analytics API Principles

Analytics APIs should support:

```text
date range
dimensions
filters
drilldown
export
```

Use backend-calculated measures.

---

## 75. Executive Analytics API

```text
GET /api/v1/analytics/executive
```

Response:

```json
{
  "data": {
    "kpis": {
      "ordersAtRisk": 42,
      "shipmentsDueThisWeek": 85,
      "shipmentReadyPercent": 72.5,
      "otifPercent": 95.8,
      "costProtectedOtifPercent": 31.2,
      "resourceUtilizationPercent": 70.0,
      "netGoodEfficiencyPercent": 62.5,
      "ageingWipQty": 18500,
      "openRedBlackExceptions": 27,
      "washReworkRate": 8.4
    },
    "currentConstraint": {
      "workcenterId": "uuid",
      "workcenterName": "Wet Wash",
      "constraintStatus": "CRITICAL_CONSTRAINT"
    },
    "topRisks": []
  },
  "meta": {
    "lastCalculatedAt": "2026-06-05T18:00:00+07:00"
  },
  "errors": []
}
```

---

## 76. OTIF Analytics API

```text
GET /api/v1/analytics/otif
```

Query params:

```text
dateFrom
dateTo
factoryId
customerId
productType
```

Response:

```json
{
  "data": {
    "otifPercent": 95.8,
    "normalOtifPercent": 65.9,
    "costProtectedOtifPercent": 29.9,
    "totalShipments": 240,
    "onTimeInFull": 230,
    "late": 6,
    "short": 4,
    "protectedByRecovery": {
      "overtime": 48,
      "premiumFreight": 7,
      "splitShipment": 12,
      "extraShift": 20
    },
    "failureReasons": [
      {
        "reason": "WASH_DELAY",
        "count": 5
      }
    ],
    "trend": [
      {
        "period": "2026-05",
        "otifPercent": 95.1,
        "costProtectedOtifPercent": 28.0
      }
    ]
  },
  "meta": {},
  "errors": []
}
```

---

## 77. Utilization Analytics API

```text
GET /api/v1/analytics/utilization
```

Response:

```json
{
  "data": {
    "overallUtilizationPercent": 70.0,
    "plannedUtilizationPercent": 82.4,
    "actualUtilizationPercent": 70.0,
    "netGoodUtilizationPercent": 62.5,
    "byWorkcenter": [
      {
        "workcenterName": "Sewing",
        "utilizationPercent": 72.0,
        "efficiencyPercent": 64.5
      },
      {
        "workcenterName": "Wet Wash",
        "utilizationPercent": 118.0,
        "constraintStatus": "CONSTRAINT"
      }
    ]
  },
  "meta": {},
  "errors": []
}
```

---

## 78. Line Efficiency API

```text
GET /api/v1/analytics/line-efficiency
```

Response item:

```json
{
  "lineCode": "LINE-05",
  "styleCode": "STY-5001",
  "grossOutput": 5200,
  "defectQty": 180,
  "reworkQty": 100,
  "netGoodOutput": 4920,
  "efficiencyPercent": 64.5,
  "defectRate": 3.46,
  "downtimeMinutes": 180,
  "mainLossReason": "Line imbalance"
}
```

---

## 79. Wash Analytics API

```text
GET /api/v1/analytics/wash
```

Response:

```json
{
  "data": {
    "washUtilizationPercent": 118.0,
    "queueQty": 14000,
    "ageingQueueQty": 8400,
    "rewashQty": 2800,
    "rewashRate": 8.4,
    "postWashQcPendingQty": 2200,
    "averageCycleTimeHours": 18.5,
    "shipmentRiskWashQty": 8400,
    "byWashRoute": [
      {
        "washRoute": "HEAVY_ENZYME",
        "washedQty": 12000,
        "rewashRate": 10.2,
        "averageCycleTimeHours": 21.0
      }
    ]
  },
  "meta": {},
  "errors": []
}
```

---

## 80. WIP Analytics API

```text
GET /api/v1/analytics/wip
```

Response:

```json
{
  "data": {
    "totalWipQty": 86500,
    "blockedWipQty": 7400,
    "ageingWipQty": 18500,
    "reworkWipQty": 2800,
    "wipBeforeConstraintQty": 14000,
    "shipmentRiskWipQty": 22600,
    "byStage": [
      {
        "stage": "SEWN_WAITING_WASH",
        "qty": 14000,
        "ageingQty": 8400,
        "oldestAgeHours": 52.0,
        "riskStatus": "RED"
      }
    ]
  },
  "meta": {},
  "errors": []
}
```

---

## 81. Exception Analytics API

```text
GET /api/v1/analytics/exceptions
```

Response:

```json
{
  "data": {
    "openExceptions": 120,
    "redBlackExceptions": 27,
    "shipmentImpacting": 18,
    "overdue": 13,
    "averageClosureHours": 18.2,
    "slaAdherencePercent": 76.0,
    "byCategory": [
      {
        "category": "WASH",
        "count": 22
      }
    ],
    "recurringIssues": [
      {
        "ruleCode": "WASH_QUEUE_AGED",
        "count": 8
      }
    ]
  },
  "meta": {},
  "errors": []
}
```

---

# Part Q: Export and Scheduled Reports

---

## 82. Export Formats

Allowed formats:

```text
CSV
XLSX
PDF summary, later
```

For MVP:

```text
CSV/XLSX export from grids
```

---

## 83. Export Governance

Export should require permission:

```text
analytics.export
```

Export logs should capture:

```text
user
report
filters
timestamp
row count
```

---

## 84. Scheduled Reports

Mature state can support scheduled:

```text
daily management summary
weekly OTIF report
weekly exception review
monthly efficiency report
monthly wash performance report
monthly master data readiness report
```

---

# Part R: Permissions

---

## 85. Analytics Permissions

Recommended permission actions:

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

## 86. Role-Based Visibility

Examples:

```text
Management sees executive and OTIF analytics.
Planning sees order risk, capacity, WIP, shipment, exceptions.
Production sees line efficiency, workcenter load, WIP.
Washing sees wash analytics.
QC sees quality/rework analytics.
IE sees operation bulletin and efficiency analytics.
```

---

# Part S: Testing Requirements

---

## 87. KPI Unit Tests

Required tests:

```text
OTIF calculation
cost-protected OTIF calculation
utilization calculation
net-good efficiency calculation
line efficiency calculation
rewash rate calculation
WIP ageing aggregation
exception SLA calculation
shipment readiness percent calculation
plan adherence calculation
```

---

## 88. Snapshot Tests

Required tests:

```text
daily snapshot creates expected records
snapshot rerun is idempotent
historical snapshot does not change unexpectedly
snapshot handles missing data safely
```

---

## 89. API Tests

Required tests:

```text
analytics APIs respect filters
analytics APIs enforce permissions
drilldown lists match KPI counts
export respects permission
date range filters work
```

---

## 90. E2E Analytics Scenarios

### 90.1 Cost-Protected OTIF

```text
shipment is on time
recovery action overtime linked
OTIF counted as achieved
cost-protected OTIF count increases
```

### 90.2 Wash Rework Analytics

```text
wash batch marked rewash
rewash quantity increases
wash analytics rewash rate updates
```

### 90.3 WIP Ageing Analytics

```text
WIP remains in SEWN_WAITING_WASH beyond threshold
WIP analytics ageing qty increases
exception is linked
```

### 90.4 Line Efficiency

```text
sewing output captured with defects
net-good output calculated
line efficiency uses net-good output
```

---

# Part T: Implementation Phasing

---

## 91. Phase 1: Analytics Foundation

Build:

```text
snapshot framework
daily order status snapshot
daily workcenter load snapshot
daily line efficiency snapshot
basic executive KPIs
```

---

## 92. Phase 2: Operational Dashboards

Build:

```text
OTIF analytics
utilization analytics
workcenter constraint analytics
WIP analytics
exception analytics
shipment readiness analytics
```

---

## 93. Phase 3: Production Quality Analytics

Build:

```text
line efficiency
wash analytics
quality/rework analytics
operation bulletin performance
line-style fit
```

---

## 94. Phase 4: Recovery and Cost-Protected OTIF

Build:

```text
recovery action analytics
cost-protected OTIF
recovery effectiveness
overtime/split shipment tracking
```

---

## 95. Phase 5: Mature Reporting

Build:

```text
scheduled reports
advanced drilldowns
trend comparisons
management PDF summaries
root-cause recurrence analytics
```

---

# Part U: Open Decisions

---

## 96. Decisions Required

Before implementation, confirm:

1. What is the official OTIF measurement grain: order, PO, shipment, or shipment line?
2. How should split shipments be treated for OTIF?
3. Which recovery actions count as cost-protected OTIF?
4. Is overtime cost available or only overtime occurrence?
5. What is the official resource utilization definition for Eratex?
6. Should utilization be calculated by minutes, pieces, or both?
7. Which shift calendar defines analytics day close?
8. What are official RED/BLACK thresholds by KPI?
9. Which reports require export?
10. Which analytics are management-only?
11. Is PDF scheduled reporting required in MVP?
12. Should analytics be in PostgreSQL initially or moved to a separate warehouse later?

---

## 97. Non-Negotiable Rules

```text
1. OTIF must distinguish normal OTIF from recovery-protected OTIF.
2. Efficiency must use net-good output, not only gross output.
3. Utilization and efficiency must be separate metrics.
4. WIP analytics must be stage-wise and order-linked.
5. Rewash must be visible as capacity and quality loss.
6. Exceptions must be measurable by category, owner, SLA, and recurrence.
7. Analytics must support drilldown to source orders/entities.
8. Snapshots must be idempotent.
9. Frontend must not redefine KPI formulas.
10. Export must be permission-controlled.
```

---

## 98. Summary

This document defines the analytics and reporting spine for the Eratex Planning & Scheduling Platform.

The analytics layer must provide visibility into:

```text
OTIF
cost-protected OTIF
capacity utilization
line efficiency
wash rework
WIP ageing
quality loss
exceptions
recovery actions
shipment readiness
planning adherence
master data readiness
```

The key principle is:

```text
The system should not only show whether Eratex shipped on time.
It should show how stable, efficient, and recoverable the operating system was while shipping on time.
```

Analytics must therefore connect management reporting with the operational truth captured through planning, WIP, shopfloor, wash, quality, exceptions, and shipment readiness.
