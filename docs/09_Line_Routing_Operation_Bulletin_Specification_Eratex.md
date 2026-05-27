# 09. Line Routing and Operation Bulletin Specification  
# Eratex End-to-End Planning & Scheduling Platform

**Company:** Eratex  
**Product:** Planning & Scheduling Tool for Denim Bottoms + Chinos Manufacturing  
**Document Type:** Line Routing, Operation Bulletin, Line Realignment, and Efficiency Specification  
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

---

## 1. Purpose

This document defines the technical and functional specification for:

```text
operation bulletin
style routing
sewing operation sequence
machine requirement
skill requirement
line master configuration
line creation
line realignment
line balancing
sewing capacity calculation
operation-level bottleneck detection
performance efficiency review
operation bulletin performance dashboard
```

The platform must not only decide **which order is assigned to which line**. It must also understand **how the line is expected to produce that style**.

For Eratex-scale denim bottoms and chinos manufacturing, line loading without operation bulletin and routing logic will remain shallow. It may show that a line is loaded, but it will not know whether the line has the right machines, skills, sequence, balance, and capacity to achieve the shipment commitment.

---

## 2. Core Thesis

A garment planning system must connect technical method design with execution planning.

The closed loop is:

```text
Style technical file
→ operation bulletin
→ routing sequence
→ machine and skill requirement
→ line capability
→ line realignment
→ line balance
→ planned line capacity
→ actual output
→ efficiency review
→ future planning recalibration
```

Without this loop:

```text
line loading becomes manual judgement
capacity assumptions become weak
operator skill impact is hidden
machine gaps are discovered late
style learning curve is unmanaged
efficiency review is disconnected from planning
```

This specification creates that missing bridge.

---

## 3. Business Context

Denim bottoms and chinos manufacturing has operation complexity because each style can differ in:

```text
fabric behavior
wash requirement
pocket construction
fly construction
waistband construction
belt loop method
bartack/rivet count
button/buttonhole requirements
thread trimming effort
measurement sensitivity
buyer quality tolerance
```

Even if two styles are both “bottoms,” their SMV, required machines, operator skill, line balance, and wash dependency can be very different.

Therefore, the planning tool must support style-specific routing and line setup.

---

## 4. Scope

This document covers:

```text
1. Operation master
2. Operation bulletin master
3. Operation bulletin line detail
4. Routing sequence
5. Parallel and merge operations
6. SMV/SAM and target output
7. Machine type requirement
8. Attachment/folder requirement
9. Skill requirement
10. Quality checkpoint mapping
11. Critical operation flag
12. Line master and line capability
13. Machine assignment to line
14. Operator skill matrix linkage
15. Line realignment workbench
16. Line balance board
17. Sewing capacity calculation
18. Operation bottleneck detection
19. Operation bulletin performance review
20. Efficiency review feedback into planning
```

---

## 5. Out of Scope for MVP

The following may be deferred:

```text
operator-by-operator live operation scanning
fully dynamic operation-level WIP
automatic AI-generated operation bulletin
IoT machine-level cycle capture
real-time workstation balancing from sensors
advanced simulation of every operator movement
```

However, the data model must not block these future capabilities.

---

# Part A: Operation and Routing Master Data

---

## 6. Operation Master

### 6.1 Purpose

Operation master defines reusable standard sewing operations.

It prevents every operation bulletin from becoming free-text and enables:

```text
skill matrix
machine requirement
line balancing
operation-level analytics
bottleneck analysis
training plans
```

### 6.2 Required Fields

```text
operation_id
operation_code
operation_name
operation_group
default_machine_type
default_skill_level
default_qc_checkpoint_flag
active_status
```

### 6.3 Optional Fields

```text
standard_smv_reference
operation_description
common_defects
training_notes
attachment_required_default
rework_sensitive_flag
```

### 6.4 Recommended Operation Groups for Denim/Chino Bottoms

```text
FRONT_PREP
POCKET_PREP
FLY_PREP
BACK_PREP
YOKE_RISE
PANEL_JOINING
WAISTBAND
BELT_LOOP
BUTTONHOLE_BUTTON
BARTACK_RIVET
HEM
TRIM_THREAD
END_LINE_CHECK
```

### 6.5 Example Operation Master Records

| Operation Code | Operation Name | Group | Default Machine |
|---|---|---|---|
| OP-FRONT-001 | Front pocket attach | FRONT_PREP | LOCKSTITCH |
| OP-FLY-001 | Fly attach | FLY_PREP | LOCKSTITCH |
| OP-WB-001 | Waistband attach | WAISTBAND | WAISTBAND |
| OP-BT-001 | Bartack pocket | BARTACK_RIVET | BARTACK |
| OP-HEM-001 | Bottom hem | HEM | CHAINSTITCH |
| OP-CHK-001 | End-line check | END_LINE_CHECK | MANUAL |

---

## 7. Machine Type Master

### 7.1 Purpose

Machine type master supports operation bulletin and line capability validation.

### 7.2 Recommended Values

```text
LOCKSTITCH
OVERLOCK
CHAINSTITCH
DOUBLE_NEEDLE
FEED_OFF_ARM
WAISTBAND
BARTACK
BUTTONHOLE
BUTTON_ATTACH
RIVET
SNAP_BUTTON
SPECIAL_ATTACHMENT
MANUAL_TABLE
PRESSING
```

### 7.3 Denim-Specific Notes

Denim bottoms often require attention to:

```text
bartack availability
rivet/button attachment
heavy fabric handling capability
waistband machine availability
feed-off-arm / chainstitch usage
special folders for waistband or belt loop
```

---

## 8. Attachment / Folder Master

### 8.1 Purpose

Attachments and folders can become hidden constraints. A line may have the machine type but not the correct attachment.

### 8.2 Example Values

```text
waistband folder
belt loop folder
hem folder
pocket folder
special guide
heavy fabric presser foot
double fold attachment
```

### 8.3 Planning Usage

Used for:

```text
line realignment
changeover readiness
setup gap detection
technical readiness
```

---

## 9. Skill Master

### 9.1 Purpose

Defines skill levels required for operations and operators.

### 9.2 Recommended Skill Levels

```text
NOT_TRAINED
TRAINEE
BASIC
MEDIUM
HIGH
EXPERT
```

### 9.3 Planning Usage

Skill level affects:

```text
line capability
operator assignment
target efficiency
quality risk
learning curve
line realignment
```

---

# Part B: Operation Bulletin

---

## 10. Operation Bulletin Definition

An operation bulletin is the style-specific production method definition.

It defines:

```text
operation sequence
operation description
operation group
machine type
attachment/folder
skill requirement
SMV/SAM
QC checkpoint
critical operation
parallel operation
predecessor relationship
rework sensitivity
```

It is the foundation for:

```text
sewing capacity
line loading
line balancing
line realignment
efficiency review
operation bottleneck analysis
```

---

## 11. Operation Bulletin Header

### 11.1 Required Fields

```text
bulletin_id
style_id
version
status
total_smv
effective_from
effective_to
approved_by
approved_at
created_by
created_at
updated_at
```

### 11.2 Status Values

```text
DRAFT
UNDER_REVIEW
APPROVED
OBSOLETE
```

### 11.3 Header Business Rules

```text
Only APPROVED bulletin can be used for production planning.
Approved bulletin cannot be edited directly.
Changes require new version.
Active production orders must retain the exact bulletin version used for planning.
Total SMV must equal the sum of operation-line SMVs.
```

---

## 12. Operation Bulletin Line

### 12.1 Required Fields

```text
bulletin_line_id
bulletin_id
sequence_no
operation_master_id
operation_name
operation_group
machine_type
attachment_required
skill_level
smv
target_pph
qc_checkpoint
critical_operation
predecessor_sequence_no
parallel_allowed
rework_sensitive
remarks
```

### 12.2 Example Operation Bulletin Line

```json
{
  "sequenceNo": 10,
  "operationName": "Front pocket attach",
  "operationGroup": "FRONT_PREP",
  "machineType": "LOCKSTITCH",
  "attachmentRequired": "Pocket folder",
  "skillLevel": "MEDIUM",
  "smv": 0.85,
  "targetPph": 70.59,
  "qcCheckpoint": false,
  "criticalOperation": false,
  "predecessorSequenceNo": null,
  "parallelAllowed": true,
  "reworkSensitive": false
}
```

### 12.3 Target Pieces Per Hour

```text
target_pph = 60 / smv
```

This is a theoretical per-operator rate before line efficiency adjustment.

---

## 13. Operation Bulletin Validation

Before approval, validate:

```text
style exists and is active
version is unique for style
at least one operation line exists
sequence numbers are unique
all SMV values are positive
total SMV equals sum of line SMV
machine type exists
skill level exists
critical operations are identified
QC checkpoint exists where required
operation group is valid
```

### 13.1 Approval Blockers

Approval should be blocked if:

```text
total SMV is zero
operation sequence has duplicates
machine type missing for machine operation
skill level missing
mandatory QC checkpoint missing
style is obsolete
```

---

## 14. Bulletin Versioning

### 14.1 Why Versioning Is Required

A style may be improved after production learning:

```text
operation split changed
SMV corrected
machine type changed
QC checkpoint added
attachment requirement updated
```

If active orders are using an older bulletin, changing it directly will corrupt historical planning.

### 14.2 Versioning Rule

```text
Approved bulletin is immutable.
To change, clone approved bulletin into new draft version.
Approve new version after review.
New orders may use new version.
Existing orders retain old version unless explicitly migrated.
```

### 14.3 Version Comparison

The UI should support comparing:

```text
total SMV difference
operation added/removed
SMV changed
machine requirement changed
skill requirement changed
QC checkpoint changed
critical operation changed
```

---

## 15. Routing Sequence

### 15.1 Simple Linear Routing

Example:

```text
Front prep
→ Back prep
→ Panel joining
→ Waistband
→ Belt loop
→ Buttonhole/button
→ Hem
→ Thread trim
→ End-line check
```

### 15.2 Parallel Routing

Some prep operations can run in parallel:

```text
Front pocket prep
Back pocket prep
Fly prep
Belt loop prep
```

These later merge into assembly.

### 15.3 Merge Points

Merge points should be visible in the routing builder.

Examples:

```text
front prep + back prep → panel joining
belt loop prep → waistband/belt loop attach
fly prep → front assembly
```

### 15.4 Routing Data Model

For MVP:

```text
sequence_no
predecessor_sequence_no
parallel_allowed
operation_group
```

For maturity:

```text
routing graph with nodes and edges
```

MVP should avoid over-engineering but preserve enough data to represent parallel operations.

---

## 16. Critical Operations

### 16.1 Purpose

Critical operations are operations that can disproportionately affect:

```text
line throughput
quality
rework
shipment
customer acceptance
```

### 16.2 Examples

```text
waistband attach
fly construction
pocket positioning
bartack/rivet
measurement-sensitive operations
wash-sensitive attachment areas
```

### 16.3 Planning Usage

Critical operations should influence:

```text
line balance review
skill requirement
QC checkpoint placement
bottleneck monitoring
efficiency review
training requirement
```

---

# Part C: Line Master and Capability

---

## 17. Line Master

### 17.1 Purpose

Defines the physical and operational capability of a sewing line.

### 17.2 Required Fields

```text
line_id
factory_id
line_code
line_name
line_type
supervisor_id
standard_manpower
current_manpower
shift_calendar
baseline_efficiency
net_good_output_baseline
status
active_status
```

### 17.3 Optional Fields

```text
allowed_product_types
special_capability
average_defect_rate
average_absenteeism
learning_curve_profile
default_workcenter
```

### 17.4 Line Types

```text
DENIM
CHINO
MIXED
SAMPLE
SPECIAL
```

### 17.5 Line Capability

A line capability profile is derived from:

```text
machine assignment
operator skill matrix
historical efficiency
quality performance
product type specialization
supervisor performance
```

---

## 18. Machine Assignment to Line

### 18.1 Purpose

Defines which machines are currently available on a line.

### 18.2 Required Fields

```text
line_id
machine_id
assigned_from
assigned_to
assigned_by
remarks
```

### 18.3 Validation

```text
machine cannot be active on two lines in same time period
machine under maintenance cannot be assigned
inactive machine cannot be planned
```

### 18.4 Planning Usage

Machine assignment is used to check:

```text
whether line can run a style
whether realignment is required
whether special machine gap exists
whether machine breakdown affects capacity
```

---

## 19. Operator Skill Matrix

### 19.1 Purpose

Defines operation-level human capability.

### 19.2 Required Fields

```text
operator_id
operation_id
skill_level
efficiency_rating
quality_rating
last_review_date
training_required
```

### 19.3 Planning Usage

Used for:

```text
line capability
operator allocation
line balance
skill gap detection
quality-adjusted capacity
training recommendations
```

### 19.4 MVP Simplification

If operator-level skill data is not available at go-live, use:

```text
line-level average skill
line-level efficiency baseline
operation criticality flag
manual skill gap notes
```

But the data model should allow operator-level skill later.

---

# Part D: Line Loading and Capacity

---

## 20. Sewing Line Capacity Calculation

### 20.1 Inputs

```text
line manpower
working minutes
style SMV
target efficiency
learning curve factor
absenteeism factor
machine availability factor
expected defect rate
```

### 20.2 Gross Capacity

```text
gross_capacity =
(line_manpower × working_minutes × target_efficiency)
÷ style_smv
```

### 20.3 Adjusted Capacity

```text
adjusted_capacity =
gross_capacity
× learning_curve_factor
× absenteeism_factor
× machine_availability_factor
```

### 20.4 Net-Good Capacity

```text
net_good_capacity =
adjusted_capacity × (1 - expected_defect_rate)
```

### 20.5 Example

```text
line manpower = 40
working minutes = 480
target efficiency = 65%
style SMV = 32
learning factor = 0.90
absenteeism factor = 0.95
machine availability factor = 1.00
expected defect rate = 5%
```

```text
gross capacity = 40 × 480 × 0.65 / 32 = 390 pcs
adjusted capacity = 390 × 0.90 × 0.95 = 333 pcs
net-good capacity = 333 × 0.95 = 316 pcs
```

---

## 21. Style-Line Fit Check

Before loading a style on a line, system should check:

```text
product type fit
machine availability
attachment availability
skill availability
baseline efficiency suitability
historical performance if available
quality risk
wash complexity if line produces wash-sensitive construction
```

### 21.1 Fit Result

```text
GOOD_FIT
ACCEPTABLE_WITH_REALIGNMENT
RISKY
NOT_RECOMMENDED
```

### 21.2 Fit Score Example

```text
fit_score =
machine_match_score
+ skill_match_score
+ historical_efficiency_score
+ quality_score
+ product_type_specialization_score
- changeover_penalty
```

---

## 22. Line Loading Data Contract

```json
{
  "lineId": "uuid",
  "lineCode": "LINE-05",
  "orderId": "uuid",
  "orderNo": "ORD-1001",
  "styleCode": "STY-5001",
  "bulletinId": "uuid",
  "bulletinVersion": "v2",
  "styleSmv": 32.5,
  "plannedStart": "2026-06-10",
  "plannedEnd": "2026-06-14",
  "plannedQty": 5000,
  "dailyTarget": 700,
  "targetEfficiency": 68.0,
  "expectedDefectRate": 4.5,
  "fitStatus": "ACCEPTABLE_WITH_REALIGNMENT",
  "riskStatus": "YELLOW"
}
```

---

# Part E: Line Realignment Workbench

---

## 23. Purpose of Line Realignment

Line realignment is required when the current line setup does not match the required operation bulletin for a planned style.

It should answer:

```text
Can this line run this style?
What is missing?
What must be moved or added?
What skill gap exists?
What will be the output before and after realignment?
How much changeover time is required?
```

---

## 24. Realignment Inputs

```text
line
current machine assignment
current manpower
operator skill matrix
target style
approved operation bulletin
target output
planned start date
available shift time
historical line efficiency
```

---

## 25. Realignment Output

The workbench should produce:

```text
required machines by type
available machines by type
machine gap
required skills by operation
available skills
skill gap
bottleneck operations
expected output before realignment
expected output after realignment
changeover time
training requirement
risk status
recommendations
```

---

## 26. Machine Gap Calculation

### 26.1 Required Machine Count

Basic method:

```text
required_machine_count_by_type =
ceil(total_smv_for_machine_type / available_minutes_per_machine_per_target_period)
```

For line-level practical use, this can be refined by line balance.

### 26.2 Machine Gap

```text
machine_gap =
required_machine_count - available_machine_count
```

If gap > 0:

```text
realignment required
```

---

## 27. Skill Gap Calculation

### 27.1 Required Skill Count

For critical operations:

```text
required_skill_count =
number of operators required for operation or workstation
```

### 27.2 Available Skill Count

```text
available_skill_count =
operators on line with skill level >= required level
```

### 27.3 Skill Gap

```text
skill_gap =
required_skill_count - available_skill_count
```

---

## 28. Realignment Recommendations

Possible recommendations:

```text
move machine from alternate line
add machine from spare inventory
move skilled operator
add helper
split critical operation
combine low-load operations
change workstation allocation
add training
reduce target
add overtime
choose alternate line
```

---

## 29. Line Realignment State

```text
PROPOSED
UNDER_REVIEW
APPROVED
APPLIED
REJECTED
CANCELLED
```

### 29.1 Approval Required

Line realignment approval should be mandatory if:

```text
machine movement required
operator movement required
target efficiency changed
line output target changed
critical operation split changed
```

---

## 30. Realignment API Contract

### 30.1 Preview Request

```json
{
  "lineId": "uuid",
  "styleId": "uuid",
  "bulletinId": "uuid",
  "targetOutput": 700,
  "plannedStartDate": "2026-06-10"
}
```

### 30.2 Preview Response

```json
{
  "data": {
    "lineId": "uuid",
    "styleId": "uuid",
    "styleCode": "STY-5001",
    "bulletinVersion": "v2",
    "fitStatus": "ACCEPTABLE_WITH_REALIGNMENT",
    "expectedOutputBefore": 480,
    "expectedOutputAfter": 650,
    "changeoverMinutes": 180,
    "machineGaps": [
      {
        "machineType": "BARTACK",
        "required": 3,
        "available": 2,
        "gap": 1,
        "recommendation": "Move one bartack machine from spare pool"
      }
    ],
    "skillGaps": [
      {
        "operationName": "Waistband attach",
        "requiredSkill": "HIGH",
        "requiredOperators": 2,
        "availableOperators": 1,
        "gap": 1,
        "recommendation": "Assign one high-skill waistband operator"
      }
    ],
    "bottleneckOperations": [
      {
        "operationName": "Waistband attach",
        "loadPercent": 132.0
      }
    ],
    "recommendations": [
      "Move one bartack machine to Line 05",
      "Assign one high-skill waistband operator",
      "Split waistband operation"
    ]
  },
  "meta": {},
  "errors": []
}
```

---

# Part F: Line Balance Board

---

## 31. Purpose

Line balancing aligns operations, operators, and machines so that flow is smooth and no workstation becomes a bottleneck.

The line balance board should support IE and production managers in configuring a practical setup for a style.

---

## 32. Line Balance Inputs

```text
line
operation bulletin
target output
working minutes
operator count
machine count
operator skill matrix
operation SMV
operation sequence
```

---

## 33. Key Metrics

```text
takt time
operation SMV
workstation load
operator allocation
machine allocation
balance efficiency
balance loss
bottleneck operation
expected output
WIP build-up risk
```

---

## 34. Takt Time

```text
takt_time =
available_line_minutes / target_output
```

Example:

```text
available_line_minutes = 480 minutes
target_output = 600 pcs
takt_time = 0.8 minutes per piece
```

---

## 35. Workstation Load

```text
workstation_load_percent =
assigned_operation_smv / takt_time × 100
```

If workstation load > 100%, it is overloaded relative to target.

---

## 36. Bottleneck Operation

The bottleneck operation is the operation/workstation with:

```text
highest load percentage
or persistent WIP build-up
or actual cycle time above target
```

---

## 37. Line Balance Efficiency

```text
line_balance_efficiency =
total_style_smv /
(number_of_workstations × bottleneck_cycle_time)
× 100
```

---

## 38. Balance Loss

```text
balance_loss_percent =
100 - line_balance_efficiency
```

---

## 39. Balance Actions

The line balance board should allow users to simulate:

```text
split operation
combine operation
add operator
remove operator
move operator
change machine
add helper
change workstation sequence
mark critical operation
```

---

## 40. Line Balance State

```text
DRAFT
UNDER_REVIEW
APPROVED
ACTIVE
SUPERSEDED
OBSOLETE
```

Only approved/active line balance should feed production targets.

---

## 41. Line Balance API Contract

### 41.1 Create / Update Balance Plan

```json
{
  "lineId": "uuid",
  "orderId": "uuid",
  "bulletinId": "uuid",
  "version": "v1",
  "targetOutput": 700,
  "operations": [
    {
      "operationBulletinLineId": "uuid",
      "workstationNo": 1,
      "assignedOperatorId": 101,
      "assignedMachineId": "uuid",
      "allocatedSmv": 0.85
    }
  ]
}
```

### 41.2 Response

```json
{
  "data": {
    "lineBalancePlanId": "uuid",
    "targetOutput": 700,
    "taktTime": 0.686,
    "balanceEfficiency": 82.4,
    "balanceLoss": 17.6,
    "bottleneckOperation": "Waistband attach",
    "workstations": [
      {
        "workstationNo": 1,
        "loadPercent": 92.0,
        "status": "NORMAL"
      },
      {
        "workstationNo": 2,
        "loadPercent": 128.0,
        "status": "BOTTLENECK"
      }
    ]
  },
  "meta": {},
  "errors": []
}
```

---

# Part G: Operation Bulletin Performance Review

---

## 42. Purpose

Operation bulletin performance review compares planned assumptions against actual production performance.

It answers:

```text
Is the SMV realistic?
Which operation caused loss?
Which style repeatedly misses planned efficiency?
Which line is best suited to this style?
Did realignment improve output?
Is the operation bulletin outdated?
```

---

## 43. Inputs

```text
operation bulletin
line loading
daily target
actual output
net-good output
defect qty
rework qty
downtime
line balance plan
operator skill data
workstation bottleneck notes
```

---

## 44. Performance Metrics

```text
planned SMV
actual achieved SMV equivalent
planned output
actual gross output
actual net-good output
efficiency percent
defect rate
rework rate
downtime minutes
balance loss
learning curve days
bottleneck operations
```

---

## 45. Earned Minutes

```text
earned_minutes =
net_good_output × style_smv
```

---

## 46. Line Efficiency

```text
line_efficiency =
earned_minutes / available_line_minutes × 100
```

---

## 47. Actual Equivalent SMV

A rough equivalent:

```text
actual_equivalent_smv =
available_line_minutes × actual_efficiency_factor / net_good_output
```

This must be interpreted carefully and should be used directionally.

---

## 48. Bulletin Variance

```text
smv_variance_percent =
(actual_equivalent_smv - planned_smv) / planned_smv × 100
```

If actual equivalent SMV is consistently higher than planned SMV, the bulletin may be unrealistic or line execution is weak.

---

## 49. Performance Diagnosis

Possible diagnosis categories:

```text
unrealistic SMV
line skill gap
machine gap
line imbalance
style learning curve
high defect/rework
downtime
material/input issue
wash impact
supervisor execution issue
```

---

## 50. Feedback into Planning

The system should use performance review to update future planning assumptions.

Possible outputs:

```text
recommended target efficiency adjustment
line-style fit score update
operation bulletin review flag
training requirement
realignment recommendation
customer/style complexity update
```

Important: automatically changing master data should not happen without approval.

---

# Part H: Efficiency Review Workbench

---

## 51. Purpose

Efficiency review provides operational performance visibility by:

```text
line
style
operation
shift
supervisor
customer
factory
```

It should separate:

```text
utilization
efficiency
quality loss
downtime loss
line imbalance
skill gap
```

---

## 52. Core Efficiency Metrics

```text
planned output
actual gross output
actual net-good output
defect qty
rework qty
efficiency percent
utilization percent
downtime minutes
changeover loss
balance loss
absenteeism impact
quality-adjusted output
```

---

## 53. Efficiency Formula

```text
efficiency_percent =
(net_good_output × style_smv) / available_line_minutes × 100
```

Where:

```text
available_line_minutes =
line_manpower × working_minutes
```

---

## 54. Utilization vs Efficiency

The system must distinguish:

```text
Utilization = whether resources were loaded/used
Efficiency = how well resources converted time into good output
```

A line can be:

```text
highly utilized but inefficient
underutilized but efficient
```

This distinction is essential because the user stated current resource utilization is around 70%, while OTIF is protected through extra operating expense.

---

## 55. Diagnostic Panels

The efficiency review UI should identify:

```text
Low efficiency due to low output
Low efficiency due to high defect
Low efficiency due to rework
Low efficiency due to downtime
Low efficiency due to absenteeism
Low efficiency due to line imbalance
Low efficiency due to style learning curve
Low efficiency due to machine/skill gap
```

---

# Part I: APIs

---

## 56. Operation Bulletin APIs

```text
GET /api/v1/operation-bulletins
POST /api/v1/operation-bulletins
GET /api/v1/operation-bulletins/{id}
PATCH /api/v1/operation-bulletins/{id}
POST /api/v1/operation-bulletins/{id}/approve
POST /api/v1/operation-bulletins/{id}/clone
GET /api/v1/operation-bulletins/{id}/compare/{otherId}
```

---

## 57. Line Master APIs

```text
GET /api/v1/master/lines
GET /api/v1/master/lines/{id}
POST /api/v1/master/lines
PATCH /api/v1/master/lines/{id}
GET /api/v1/master/lines/{id}/machines
POST /api/v1/master/lines/{id}/assign-machine
POST /api/v1/master/lines/{id}/remove-machine
```

For MVP, line write actions may remain Django Admin only.

---

## 58. Line Realignment APIs

```text
POST /api/v1/sewing/line-realignment/preview
POST /api/v1/sewing/line-realignment
GET /api/v1/sewing/line-realignment/{id}
POST /api/v1/sewing/line-realignment/{id}/approve
POST /api/v1/sewing/line-realignment/{id}/apply
POST /api/v1/sewing/line-realignment/{id}/reject
```

---

## 59. Line Balance APIs

```text
GET /api/v1/sewing/line-balance
POST /api/v1/sewing/line-balance
GET /api/v1/sewing/line-balance/{id}
PATCH /api/v1/sewing/line-balance/{id}
POST /api/v1/sewing/line-balance/{id}/approve
POST /api/v1/sewing/line-balance/{id}/activate
```

---

## 60. Performance APIs

```text
GET /api/v1/analytics/operation-bulletin-performance
GET /api/v1/analytics/line-efficiency
GET /api/v1/analytics/line-style-fit
GET /api/v1/analytics/bottleneck-operations
GET /api/v1/analytics/efficiency-diagnostics
```

---

# Part J: Frontend Surfaces

---

## 61. Operation Bulletin Master Dashboard

Route:

```text
/technical/operation-bulletins
```

### Required Widgets

```text
approved bulletins
draft bulletins
pending approval
styles without bulletin
bulletins used in active production
bulletins with performance deviation
```

### Grid Columns

```text
style code
customer
product type
version
status
total SMV
operation count
critical operation count
machine types required
approval status
used in active order
last updated
```

---

## 62. Operation Bulletin Routing Builder

Route:

```text
/technical/operation-bulletins/:id/routing
```

### Layout

```text
Left: operation sequence list
Center: routing visualization / operation grid
Right: operation detail drawer
Bottom: machine and skill summary
```

### User Actions

```text
add operation
clone operation
reorder operation
set predecessor
mark parallel
set SMV
set machine type
set skill
mark QC checkpoint
submit for approval
approve bulletin
clone new version
```

---

## 63. Line Master Configuration Screen

Route:

```text
/master-data/lines
/master-data/lines/:id
```

May be Django Admin for MVP, custom frontend for mature state.

### Required Views

```text
line profile
machine assignment
supervisor
manpower
shift calendar
baseline efficiency
historical performance
```

---

## 64. Line Realignment Workbench

Route:

```text
/sewing/line-realignment
/sewing/lines/:lineId/realign
```

### Layout

```text
Top: selected line and target style
Left: current line setup
Center: required setup from operation bulletin
Right: machine/skill gap and recommendations
Bottom: expected output before/after
```

---

## 65. Line Balance Board

Route:

```text
/sewing/line-balance
/sewing/lines/:lineId/balance
```

### Visualization

```text
station-wise load bar
bottleneck highlight
operation cards
operator allocation
machine allocation
balance efficiency
target output
```

---

## 66. Operation Bulletin Performance Dashboard

Route:

```text
/analytics/operation-bulletin-performance
```

Views:

```text
by style
by line
by operation
by customer
by product type
by supervisor
```

---

## 67. Efficiency Review Workbench

Route:

```text
/analytics/efficiency-review
```

Diagnostic panels:

```text
output shortfall
defect loss
rework loss
downtime loss
line imbalance
skill gap
learning curve
```

---

# Part K: Backend Services

---

## 68. Recommended Service Modules

```text
style_technical/services/operation_bulletins.py
style_technical/services/routing.py
sewing/services/line_capacity.py
sewing/services/line_realignment.py
sewing/services/line_balance.py
sewing/services/efficiency.py
analytics/services/operation_bulletin_performance.py
```

---

## 69. Core Service Functions

```python
calculate_total_smv(bulletin)
validate_operation_bulletin(bulletin)
approve_operation_bulletin(bulletin, user)
clone_operation_bulletin(bulletin, new_version, user)
calculate_required_machines(bulletin, target_output)
calculate_required_skills(bulletin, target_output)
preview_line_realignment(line, bulletin, target_output)
approve_line_realignment(realignment, user)
calculate_line_balance(line_balance_plan)
calculate_line_efficiency(line, date_range)
calculate_operation_bulletin_performance(bulletin, filters)
```

---

# Part L: Permissions and Audit

---

## 70. Permissions

Recommended permission actions:

```text
bulletin.view
bulletin.create
bulletin.edit
bulletin.approve
bulletin.clone
line.view
line.create
line.edit
line.assign_machine
line.realign
line.approve_realignment
line_balance.view
line_balance.edit
line_balance.approve
efficiency.view
efficiency.export
```

---

## 71. Mandatory Audit Events

Audit required for:

```text
operation bulletin approval
operation bulletin version creation
operation bulletin obsolete marking
line creation
line machine assignment change
line realignment approval
line realignment application
line balance approval
line baseline efficiency change
operator skill matrix change
```

---

# Part M: Tests

---

## 72. Operation Bulletin Tests

```text
total SMV equals sum operation SMVs
duplicate sequence rejected
missing machine type rejected for machine operation
approved bulletin cannot be edited
clone creates new draft version
only approved bulletin can be used for line loading
```

---

## 73. Line Capability Tests

```text
line with missing required machine returns machine gap
line with insufficient skill returns skill gap
inactive line cannot be loaded
machine under maintenance not counted as available
```

---

## 74. Line Realignment Tests

```text
preview calculates machine gap
preview calculates skill gap
expected output before/after returned
approval requires permission
approval writes audit event
```

---

## 75. Line Balance Tests

```text
takt time calculated correctly
workstation load calculated correctly
bottleneck identified
balance efficiency calculated correctly
approved balance becomes active
```

---

## 76. Efficiency Tests

```text
net-good efficiency calculated correctly
defect-adjusted output calculated correctly
operation bulletin performance variance calculated
line-style performance improves fit score
```

---

# Part N: Implementation Phasing

---

## 77. Phase 1: Operation Bulletin Foundation

Build:

```text
operation master
operation bulletin
operation bulletin lines
SMV total calculation
approval/versioning
Django Admin
basic APIs
```

---

## 78. Phase 2: Line Capability Foundation

Build:

```text
line master
machine master
line-machine assignment
operator skill matrix placeholder
line capacity calculation
style-line fit check
```

---

## 79. Phase 3: Line Realignment

Build:

```text
realignment preview
machine gap
skill gap
expected output before/after
approval workflow
audit
```

---

## 80. Phase 4: Line Balance

Build:

```text
line balance plan
workstation allocation
takt time
load percentage
bottleneck detection
approval
```

---

## 81. Phase 5: Performance Feedback

Build:

```text
operation bulletin performance dashboard
efficiency review
line-style fit learning
planning assumption review
```

---

# Part O: Open Decisions

---

## 82. Decisions Required

Before implementation, confirm:

1. Are operation bulletins already available in Excel?
2. Is SMV/SAM available at operation level for all styles?
3. Are operation names standardized today?
4. Is operator skill matrix available or must MVP start with line-level efficiency?
5. Are machine assignments to lines digitally available?
6. Do lines frequently realign by style or remain mostly fixed?
7. Who approves operation bulletins?
8. Who approves line realignment?
9. Should line balance be required before line loading in MVP?
10. How much operation-level detail is realistic for shopfloor capture?

---

## 83. Non-Negotiable Rules

```text
1. No production line loading without approved operation bulletin or approved exception.
2. Approved operation bulletin must be version-controlled.
3. Style SMV must come from operation bulletin, not free text.
4. Line capability must check machines and skills.
5. Reassignment of machines/operators should be auditable.
6. Realignment must show expected output before and after.
7. Line balance must identify bottleneck operations.
8. Efficiency must be based on net-good output.
9. Bulletin performance review must feed planning assumptions.
10. Frontend must not hardcode SMV, machine, or skill logic.
```

---

## 84. Summary

This document defines the line routing and operation bulletin spine for the Eratex Planning & Scheduling Platform.

The platform must connect:

```text
style technical design
→ operation bulletin
→ machine and skill requirements
→ line capability
→ line realignment
→ line balance
→ production output
→ efficiency review
→ planning recalibration
```

This capability is critical because Eratex-scale garment manufacturing cannot rely only on high-level line loading. The system must know whether the planned line can actually produce the style at the expected quantity, quality, and efficiency.

The operation bulletin and line routing layer turns planning from manual estimation into governed, data-backed execution planning.

## Phase 5 / EOS-05 Execution Alignment

Line loading must validate against the approved operation bulletin before a release can become active on a sewing line. The loading service checks:

- approved bulletin status, unless an approved governed exception is linked;
- machine type coverage against operation requirements;
- operator skill coverage against critical operation needs;
- expected output before and after any realignment.

The operation bulletin master and routing builder now expose read-only production usage and performance deviation. These values support planning recalibration but do not mutate the approved bulletin version.
