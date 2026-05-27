# 20. Seed Data and Simulation Scenarios  
# Eratex End-to-End Planning & Scheduling Platform

**Company:** Eratex  
**Product:** Planning & Scheduling Tool for Denim Bottoms + Chinos Manufacturing  
**Document Type:** Seed Data and Simulation Scenarios Specification  
**Version:** 2.0  
**Date:** 2026-05-26  
**Backend Stack:** Django + Django REST Framework + PostgreSQL + Celery + Redis  
**Frontend Stack:** Next.js / React + TypeScript + PWA  
**Deployment Baseline:** Dockerized stack  
**Related Documents:**  
- 02 Data Model and Table Schema Specification  
- 03 Master Data Specification  
- 04 Planning Logic and Calculation Flows  
- 07 Event and State Transition Specification  
- 08 WIP Inventory and Reconciliation Specification  
- 09 Line Routing and Operation Bulletin Specification  
- 10 Wash Planning and Execution Specification  
- 11 Exception, Alert, and Recovery Specification  
- 12 Handheld Shopfloor Capture Technical Specification  
- 14 Analytics and Reporting Specification  
- 19 Testing and QA Strategy  

---

## 1. Purpose

This document defines the seed data and simulation scenario strategy for the Eratex Planning & Scheduling Platform.

The platform must be tested and demonstrated with realistic garment manufacturing scenarios, not generic dummy data. The seed data should allow the implementation team, QA team, business users, and management to experience how the system behaves across:

```text
customer order readiness
sampling and approval gates
material procurement
fabric QC
PCD readiness
weekly planning
daily release
cutting
sewing
wash and rewash
finishing
packing
shipment readiness
exceptions
recovery
shopfloor capture
analytics
```

The goal is to create a realistic operating sandbox where users can see how the planning/scheduling tool will work in day-to-day factory conditions.

---

## 2. Seed Data Thesis

Seed data must do more than populate dropdowns.

It must create a working factory simulation.

The seed data should support:

```text
1. Happy-path production flow
2. Blocked PCD flow
3. Fabric QC failure flow
4. Material delay flow
5. Sewing line shortfall flow
6. Wash bottleneck flow
7. Rewash loop flow
8. WIP ageing flow
9. WIP reconciliation gap flow
10. Shipment readiness blocker flow
11. Exception and recovery flow
12. Mobile shopfloor capture flow
13. Permission and role testing
14. Analytics KPI validation
15. Integration import validation
```

Without scenario-based seed data, the application may appear complete but fail to demonstrate the real operational logic.

---

## 3. Seed Data Principles

### 3.1 Business-Realistic

Use realistic values for:

```text
order quantities
lead times
wash routes
line capacities
SMV
efficiency
WIP stages
shipment dates
material arrival dates
```

### 3.2 Scenario-Driven

Each seed order should exist for a reason.

Example:

```text
ORD-DEN-RED-001 exists to test wash bottleneck and rewash recovery.
```

### 3.3 Deterministic

Seed data should be repeatable.

Running the seed command multiple times should not create duplicates.

### 3.4 Traceable

Every scenario should have:

```text
scenario code
scenario description
seed orders
expected user journey
expected exceptions
expected analytics impact
```

### 3.5 Role-Testable

Seed users should exist for every key role so permission and scope can be tested.

### 3.6 Resettable

QA should be able to reset the database and reload the same scenarios.

---

# Part A: Seed Data Architecture

---

## 4. Recommended Seed Commands

Use Django management commands.

Recommended commands:

```text
python manage.py seed_permissions
python manage.py seed_core_masters
python manage.py seed_factory_master
python manage.py seed_users_roles
python manage.py seed_product_masters
python manage.py seed_operation_bulletins
python manage.py seed_wash_routes
python manage.py seed_orders
python manage.py seed_wip
python manage.py seed_exceptions
python manage.py seed_simulation_scenarios
```

Convenience command:

```text
python manage.py seed_demo_all
```

Reset command for QA/dev:

```text
python manage.py reset_demo_data
python manage.py seed_demo_all
```

---

## 5. Seed Data Idempotency

Every seed record should have a stable business key.

Examples:

```text
factory_code
customer_code
style_code
order_no
line_code
machine_code
employee_code
scenario_code
```

Seed command should:

```text
create if not exists
update if exists and seed-owned
avoid duplicate creation
```

---

## 6. Seed Ownership Flag

Recommended field or tagging approach:

```text
is_seed_data = true
seed_scenario_code
```

If adding fields to every model is not desired, maintain a separate:

```text
SeedRegistry
```

Fields:

```text
entity_type
entity_id
business_key
scenario_code
created_by_seed_command
created_at
```

---

## 7. Demo Date Strategy

Seed scenarios should use relative dates.

Instead of hardcoding old dates, compute dates from current seed date.

Example:

```text
today = system date
shipment_date = today + 14 days
pcd_date = today + 3 days
material_eta = today + 5 days
```

This keeps demo scenarios current.

---

## 8. Scenario Code Convention

Use readable scenario codes:

```text
SCN-001-HAPPY-PATH
SCN-002-PCD-BLOCKED
SCN-003-FABRIC-QC-FAIL
SCN-004-MATERIAL-DELAY
SCN-005-SEWING-SHORTFALL
SCN-006-WASH-BOTTLENECK
SCN-007-REWASH-LOOP
SCN-008-WIP-AGEING
SCN-009-WIP-RECON-GAP
SCN-010-SHIPMENT-BLOCKED
SCN-011-EXCEPTION-RECOVERY
SCN-012-MOBILE-OFFLINE
```

---

# Part B: Core Master Seed Data

---

## 9. Organization and Factory Master

Create one main factory and optional secondary units.

### 9.1 Factories

| Code | Name | Purpose |
|---|---|---|
| F01 | Eratex Main Denim Unit | Main simulation factory |
| F02 | Eratex Chino Unit | Optional secondary unit |
| F-SAMPLE | Sample Room | Sampling and pilot flow |

### 9.2 Departments

```text
MERCHANDISING
PROCUREMENT
FABRIC_QC
CUTTING
SEWING
WASHING
FINISHING
PACKING
QUALITY
SHIPMENT
PLANNING
IE
MAINTENANCE
```

---

## 10. Workcenters

Recommended seeded workcenters:

| Code | Name | Type |
|---|---|---|
| CUTTING | Cutting | CUTTING |
| SEW-L01 | Sewing Line 01 | SEWING |
| SEW-L02 | Sewing Line 02 | SEWING |
| SEW-L03 | Sewing Line 03 | SEWING |
| SEW-L04 | Sewing Line 04 | SEWING |
| DRY-PROC | Dry Process | DRY_PROCESS |
| WET-WASH | Wet Wash | WET_WASH |
| DRYING | Drying | DRYING |
| POST-WASH-QC | Post-Wash QC | QUALITY |
| FINISHING | Finishing | FINISHING |
| PACKING | Packing | PACKING |
| FINAL-QC | Final QC | QUALITY |
| SHIPMENT | Shipment | SHIPMENT |

---

## 11. Shift Calendar

Seed shifts:

| Shift | Start | End | Minutes |
|---|---:|---:|---:|
| A | 08:00 | 17:00 | 480 |
| B | 17:00 | 01:00 | 420 |
| OT | 17:00 | 19:00 | 120 |

Seed factory calendar:

```text
Monday to Saturday working
Sunday non-working
public holiday placeholder
```

---

## 12. Lines

Seed sewing lines with different strengths.

| Line | Type | Manpower | Baseline Efficiency | Specialization |
|---|---|---:|---:|---|
| LINE-01 | DENIM | 42 | 68% | Basic denim |
| LINE-02 | DENIM | 40 | 72% | Heavy denim |
| LINE-03 | CHINO | 38 | 70% | Chinos |
| LINE-04 | MIXED | 36 | 62% | Lower skill / learning line |

This supports scenarios for:

```text
line fit
line shortfall
style-line mismatch
realignment
efficiency analytics
```

---

## 13. Machine Master

Seed machines by type:

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
WASHER
DRYER
HYDRO_EXTRACTOR
OZONE_MACHINE
MANUAL_DRY_PROCESS_TABLE
```

### 13.1 Machine Gap Scenario

Create one line with insufficient bartack or waistband capacity.

Example:

```text
LINE-04 has only 1 BARTACK but target style needs 3.
```

This supports line realignment tests.

---

## 14. Customers and Buyers

Seed customer groups:

| Customer Code | Customer Name | Priority |
|---|---|---|
| CUST-A | Global Denim Buyer A | HIGH |
| CUST-B | Mid-Market Buyer B | MEDIUM |
| CUST-C | Chino Retailer C | MEDIUM |
| CUST-D | Fashion Wash Buyer D | HIGH |

Buyers:

```text
BUYER-A1
BUYER-B1
BUYER-C1
BUYER-D1
```

---

## 15. Vendors

Seed nominated and non-nominated vendors.

| Vendor Code | Type | Nominated | Lead Time |
|---|---|---|---:|
| VEN-FAB-01 | Fabric | Yes | 25 days |
| VEN-FAB-02 | Fabric | Yes | 30 days |
| VEN-TRIM-01 | Trims | Yes | 20 days |
| VEN-PACK-01 | Packing | No | 10 days |

This supports procurement lead-time scenarios.

---

## 16. Materials

Seed material types:

```text
MAIN_FABRIC
POCKETING
ZIPPER
BUTTON
RIVET
THREAD
LABEL
HANGTAG
POLYBAG
CARTON
```

Example materials:

| Code | Name | Type | UOM |
|---|---|---|---|
| FAB-DEN-12OZ | 12 oz Stretch Denim | MAIN_FABRIC | meter |
| FAB-DEN-14OZ | 14 oz Heavy Denim | MAIN_FABRIC | meter |
| FAB-CHINO-TWL | Chino Twill Fabric | MAIN_FABRIC | meter |
| TRIM-RIVET-STD | Standard Rivet | RIVET | pcs |
| TRIM-BUTTON-STD | Denim Button | BUTTON | pcs |
| TRIM-ZIP-STD | Zipper | ZIPPER | pcs |

---

# Part C: Style and Technical Seed Data

---

## 17. Styles

Seed representative styles.

| Style Code | Product Type | Complexity | Wash Complexity | Purpose |
|---|---|---|---|---|
| STY-DEN-BASIC | DENIM_BOTTOM | Medium | Simple | Happy path |
| STY-DEN-HEAVY | DENIM_BOTTOM | High | Heavy | Wash bottleneck |
| STY-DEN-FASHION | DENIM_BOTTOM | High | Very High | Rewash loop |
| STY-CHINO-BASIC | CHINO | Medium | Simple | Chino flow |
| STY-DEN-RUSH | DENIM_BOTTOM | High | Medium | Shipment risk |
| STY-DEN-NO-BULLETIN | DENIM_BOTTOM | Medium | Medium | Master data blocker |

---

## 18. BOM Seed Data

Create BOMs for all approved styles except `STY-DEN-NO-BULLETIN`.

Example BOM for denim:

```text
fabric consumption: 1.35 meter/pc
wastage: 3%
button: 1 pc
rivet: 6 pcs
zipper: 1 pc
thread: 120 meter
label: 1 pc
carton: 1 carton per 30 pcs
```

Example BOM for chino:

```text
fabric consumption: 1.25 meter/pc
wastage: 2.5%
button: 1 pc
zipper: 1 pc
thread: 100 meter
label: 1 pc
carton: 1 carton per 30 pcs
```

---

## 19. Operation Bulletins

Seed operation bulletins for styles.

### 19.1 Basic Denim Bulletin

```text
Style: STY-DEN-BASIC
Total SMV: 28.5
Operations: 35
Critical operations: waistband, fly, bartack
```

### 19.2 Heavy Denim Bulletin

```text
Style: STY-DEN-HEAVY
Total SMV: 34.0
Operations: 42
Critical operations: waistband, fly, bartack, rivet
```

### 19.3 Fashion Denim Bulletin

```text
Style: STY-DEN-FASHION
Total SMV: 36.5
Operations: 46
Critical operations: waistband, pocket placement, bartack, rivet
```

### 19.4 Basic Chino Bulletin

```text
Style: STY-CHINO-BASIC
Total SMV: 26.0
Operations: 32
Critical operations: waistband, fly, bottom hem
```

---

## 20. Sample Operation Lines

Seed operation groups:

```text
FRONT_PREP
POCKET_PREP
FLY_PREP
BACK_PREP
PANEL_JOINING
WAISTBAND
BELT_LOOP
BUTTONHOLE_BUTTON
BARTACK_RIVET
HEM
TRIM_THREAD
END_LINE_CHECK
```

Include operation-level SMV for line balance testing.

---

## 21. Wash Routes

Seed wash routes:

| Route Code | Name | Complexity | Steps |
|---|---|---|---|
| WASH-RINSE | Rinse Wash | Low | wet wash, drying, QC |
| WASH-ENZYME | Enzyme Wash | Medium | enzyme, softener, drying, QC |
| WASH-HEAVY | Heavy Denim Wash | High | dry process, enzyme, stone, drying, QC |
| WASH-FASHION | Fashion Wash | Very High | whisker, scrape, grind, enzyme, tint, drying, QC |
| WASH-CHINO | Chino Garment Wash | Low | garment wash, softener, drying, QC |
| WASH-REWORK-SHADE | Shade Correction Rewash | Medium | tint/softener, drying, QC |

---

# Part D: User and Role Seed Data

---

## 22. Seed Users

Create users for all important roles.

| Username | Role | Scope |
|---|---|---|
| admin | SYSTEM_ADMIN | Global |
| business_admin | BUSINESS_ADMIN | Global |
| mgmt_viewer | MANAGEMENT_VIEWER | Global |
| factory_mgr | FACTORY_MANAGER | F01 |
| planning_head | PLANNING_HEAD | F01 |
| planner_01 | PRODUCTION_PLANNER | F01 |
| merch_01 | MERCHANDISER | F01 |
| procurement_01 | PROCUREMENT_USER | F01 |
| fabric_qc_01 | FABRIC_QC_USER | F01 |
| ie_01 | IE_USER | F01 |
| sewing_mgr | SEWING_MANAGER | F01 |
| line_sup_01 | LINE_SUPERVISOR | LINE-01 |
| line_sup_02 | LINE_SUPERVISOR | LINE-02 |
| wash_mgr | WASHING_MANAGER | WET-WASH |
| wash_sup_01 | WASH_SUPERVISOR | WET-WASH |
| qc_mgr | QC_MANAGER | F01 |
| qc_inspector_01 | QC_INSPECTOR | F01 |
| shipment_mgr | SHIPMENT_MANAGER | F01 |
| shipment_user_01 | SHIPMENT_USER | F01 |
| integration_admin | INTEGRATION_ADMIN | Global |
| data_import_01 | DATA_IMPORT_USER | Global |
| auditor_01 | READ_ONLY_AUDITOR | Global |

---

## 23. Permission Test Users

Create two deliberate permission test users:

```text
limited_line_user
limited_wash_user
```

Use these to verify:

```text
line user cannot submit output for other line
wash user cannot approve critical rewash
data import user cannot apply import
management viewer cannot perform operational writes
```

---

# Part E: Order Seed Data

---

## 24. Seed Order Overview

Create a set of orders across multiple statuses and risks.

| Order No | Style | Qty | Customer | Scenario |
|---|---|---:|---|---|
| ORD-HP-001 | STY-DEN-BASIC | 10,000 | CUST-A | Happy path |
| ORD-PCD-001 | STY-DEN-BASIC | 8,000 | CUST-B | PCD blocked |
| ORD-FABQC-001 | STY-DEN-HEAVY | 12,000 | CUST-A | Fabric QC fail |
| ORD-MAT-001 | STY-CHINO-BASIC | 15,000 | CUST-C | Material delay |
| ORD-SEW-001 | STY-DEN-HEAVY | 18,000 | CUST-A | Sewing shortfall |
| ORD-WASH-001 | STY-DEN-HEAVY | 16,000 | CUST-D | Wash bottleneck |
| ORD-REWASH-001 | STY-DEN-FASHION | 12,000 | CUST-D | Rewash loop |
| ORD-WIPAGE-001 | STY-DEN-BASIC | 9,000 | CUST-B | WIP ageing |
| ORD-RECON-001 | STY-CHINO-BASIC | 7,500 | CUST-C | WIP reconciliation gap |
| ORD-SHIP-001 | STY-DEN-RUSH | 6,000 | CUST-A | Shipment blocked |
| ORD-MDATA-001 | STY-DEN-NO-BULLETIN | 5,000 | CUST-B | Missing master data |
| ORD-MOB-001 | STY-DEN-BASIC | 8,500 | CUST-A | Mobile offline sync |

---

## 25. Date Logic for Orders

Use relative dates.

Example:

```text
today = T
order_confirmed_date = T - 20 days
planned_pcd_date = T + 2 to T + 7 days
committed_ship_date = T + 10 to T + 25 days
```

For shipment-risk scenarios:

```text
committed_ship_date = T + 3 days
```

For relaxed happy path:

```text
committed_ship_date = T + 20 days
```

---

# Part F: Simulation Scenarios

---

## 26. SCN-001-HAPPY-PATH: End-to-End Normal Flow

### 26.1 Purpose

Demonstrate a clean order moving from readiness to shipment without major exceptions.

### 26.2 Seed Order

```text
ORD-HP-001
Style: STY-DEN-BASIC
Qty: 10,000
Customer: CUST-A
Wash route: WASH-ENZYME
Line: LINE-01
Risk: GREEN/YELLOW
```

### 26.3 Initial State

```text
materials available
fabric QC passed
BOM approved
operation bulletin approved
wash route approved
PCD ready
weekly plan exists
daily release ready
```

### 26.4 User Journey

```text
planner releases to cutting
cutting output recorded
sewing release created
line supervisor records output
wash batch created
wash completed
post-wash QC passed
finishing/packing completed
shipment checklist completed
shipment marked ready
dispatch confirmed
```

### 26.5 Expected Results

```text
order lifecycle reaches SHIPPED
no RED exception
WIP reconciles
OTIF positive
audit trace complete
```

---

## 27. SCN-002-PCD-BLOCKED: PCD Readiness Gate

### 27.1 Purpose

Demonstrate that unsafe cutting release is blocked until PCD readiness is complete or conditionally approved.

### 27.2 Seed Order

```text
ORD-PCD-001
Style: STY-DEN-BASIC
Qty: 8,000
PCD date: T + 2 days
```

### 27.3 Initial State

```text
fabric QC passed
button trim pending
operation bulletin approved
wash route approved
PCD checklist status = BLOCKED
```

### 27.4 Expected Blocker

```text
TRIMS_AVAILABLE = PENDING
```

### 27.5 User Journey

```text
planner attempts release to cutting
system blocks release
planner requests conditional release
planning head approves conditional release with expiry
planner releases partial qty to cutting
```

### 27.6 Expected Results

```text
release blocked before approval
conditional release audit created
order status CONDITIONALLY_READY
cutting release allowed within expiry
exception closes when trims arrive
```

---

## 28. SCN-003-FABRIC-QC-FAIL: Fabric Inspection Failure

### 28.1 Purpose

Show fabric QC impact on PCD and order risk.

### 28.2 Seed Order

```text
ORD-FABQC-001
Style: STY-DEN-HEAVY
Qty: 12,000
```

### 28.3 Initial State

```text
fabric received
48 rolls total
40 rolls passed
6 rolls pending
2 rolls failed
shade issue exists
PCD blocked
```

### 28.4 Expected Exceptions

```text
FABRIC_QC_HOLD
PCD_BLOCKED
```

### 28.5 User Journey

```text
fabric QC user records failed rolls
system blocks PCD
planner sees fabric shortage
QC segregates failed rolls
procurement creates replacement action
conditional partial release considered
```

### 28.6 Expected Results

```text
PCD readiness BLOCKED
fabric QC exception RED
material/fabric shortage visible
release blocked unless waiver/partial release approved
```

---

## 29. SCN-004-MATERIAL-DELAY: Nominated Vendor Lead-Time Issue

### 29.1 Purpose

Show procurement delay from nominated vendor affecting PCD.

### 29.2 Seed Order

```text
ORD-MAT-001
Style: STY-CHINO-BASIC
Qty: 15,000
```

### 29.3 Initial State

```text
main fabric available
zipper or button PO delayed
vendor ETA = required date + 5 days
procurement lead time = 20–30 days
PCD at risk
```

### 29.4 Expected Exceptions

```text
MATERIAL_DELAY
PCD_RISK
```

### 29.5 User Journey

```text
procurement updates revised ETA
system recalculates PCD readiness
planner sees RED material blocker
recovery action expedite material or partial production
```

### 29.6 Expected Results

```text
material delay exception created
order risk RED
daily release blocked for dependent stage
```

---

## 30. SCN-005-SEWING-SHORTFALL: Line Underperformance

### 30.1 Purpose

Demonstrate live sewing output capture and line shortfall detection.

### 30.2 Seed Order

```text
ORD-SEW-001
Style: STY-DEN-HEAVY
Qty: 18,000
Line: LINE-04
```

### 30.3 Initial State

```text
style loaded on lower-efficiency line
daily target = 650 pcs
actual output after half shift = 220 pcs
defect rate high
bartack bottleneck
```

### 30.4 Expected Exception

```text
SEWING_SHORTFALL
LINE_IMBALANCE
```

### 30.5 User Journey

```text
line supervisor captures hourly output
system calculates required run rate
shortfall exception created
sewing manager opens line balance
realignment preview shows bartack/skill gap
recovery action adds skilled operator or machine
```

### 30.6 Expected Results

```text
line risk RED
exception assigned to sewing manager
line realignment recommendation visible
efficiency analytics show low net-good output
```

---

## 31. SCN-006-WASH-BOTTLENECK: Wash Capacity Constraint

### 31.1 Purpose

Show wet wash becoming the current constraint.

### 31.2 Seed Order

```text
ORD-WASH-001
Style: STY-DEN-HEAVY
Qty: 16,000
Wash route: WASH-HEAVY
```

### 31.3 Initial State

```text
sewn WIP waiting wash = 4,000 pcs
wet wash available capacity = 8,000 minutes
planned wash load = 10,800 minutes
wash utilization = 135%
```

### 31.4 Expected Exception

```text
WASH_CAPACITY_OVERLOAD
WASH_QUEUE_AGED
```

### 31.5 User Journey

```text
planner opens workcenter load
wet wash shown as current constraint
wash manager opens wash board
system recommends priority sequence
recovery action add overtime or resequence
```

### 31.6 Expected Results

```text
wet wash constraint status CRITICAL_CONSTRAINT
affected orders listed
shipment-risk WIP visible
recovery impact preview reduces risk
```

---

## 32. SCN-007-REWASH-LOOP: Repeat Wash Cycle

### 32.1 Purpose

Demonstrate repeat wash cycle and rewash capacity impact.

### 32.2 Seed Order

```text
ORD-REWASH-001
Style: STY-DEN-FASHION
Qty: 12,000
Wash route: WASH-FASHION
```

### 32.3 Initial State

```text
wash batch WB-REWASH-001 in POST_WASH_QC
qty = 500
shade too dark
post-wash QC result pending/fail
```

### 32.4 User Journey

```text
QC marks shade issue
wash supervisor marks rewash required
system creates rewash batch
rewash cycle no. 1 created
additional load added
post-rewash QC still fails for partial qty
second rewash cycle created
manager approval required after threshold
```

### 32.5 Expected Results

```text
REWASH_WIP created
wash load increases
shipment risk worsens
rewash exception created
cycle counter visible
audit trace shows parent/child batch
```

---

## 33. SCN-008-WIP-AGEING: WIP Stuck Before Wash

### 33.1 Purpose

Demonstrate ageing WIP dashboard and exception.

### 33.2 Seed Order

```text
ORD-WIPAGE-001
Style: STY-DEN-BASIC
Qty: 9,000
```

### 33.3 Initial State

```text
2,200 pcs at SEWN_WAITING_WASH
entered stage 60 hours ago
ageing threshold RED = 48 hours
```

### 33.4 Expected Exception

```text
WIP_AGEING_RED
```

### 33.5 User Journey

```text
planner opens WIP pipeline
SEWN_WAITING_WASH stage RED
opens stage drilldown
creates wash batch or exception recovery
```

### 33.6 Expected Results

```text
ageing WIP card RED
order appears in stage drilldown
exception created
workcenter queue updated
```

---

## 34. SCN-009-WIP-RECON-GAP: Quantity Mismatch

### 34.1 Purpose

Demonstrate WIP reconciliation logic.

### 34.2 Seed Order

```text
ORD-RECON-001
Style: STY-CHINO-BASIC
Qty: 7,500
```

### 34.3 Initial Quantity Chain

```text
finished_qty = 5,800
packed_qty = 6,100
shipment_ready_qty = 5,900
```

This is impossible because packed quantity exceeds finished quantity.

### 34.4 Expected Exception

```text
PACKED_EXCEEDS_FINISHED
```

### 34.5 User Journey

```text
planner opens reconciliation screen
system flags impossible quantity
user reviews handover/output records
WIP adjustment requested
approval required
audit created after correction
```

### 34.6 Expected Results

```text
reconciliation gap visible
manual adjustment blocked without permission
audit captures correction
exception closes after correction
```

---

## 35. SCN-010-SHIPMENT-BLOCKED: Shipment Readiness Gate

### 35.1 Purpose

Show shipment readiness blocking dispatch.

### 35.2 Seed Order

```text
ORD-SHIP-001
Style: STY-DEN-RUSH
Qty: 6,000
Shipment date: T + 3 days
```

### 35.3 Initial State

```text
packed qty = 5,600
short qty = 400
AQL status = PENDING
documents = PENDING
forwarder booking = CONFIRMED
```

### 35.4 Expected Exceptions

```text
SHIPMENT_READY_BLOCKED
AQL_PENDING
DOCUMENTATION_PENDING
PACKED_SHORT
```

### 35.5 User Journey

```text
shipment user tries to mark ready
system blocks
QC completes AQL
documentation completed
split shipment approval requested for short qty
shipment manager approves split
mark shipment ready
```

### 35.6 Expected Results

```text
mark-ready blocked until gates pass
shipment readiness audit created
cost-protected OTIF if split shipment/recovery used
```

---

## 36. SCN-011-EXCEPTION-RECOVERY: Recovery Action Impact

### 36.1 Purpose

Demonstrate exception-to-recovery workflow.

### 36.2 Seed Context

```text
Wet wash overloaded
ORD-WASH-001 shipment risk RED
exception EXC-WASH-001 open
```

### 36.3 User Journey

```text
planner opens exception
creates recovery action ADD_OVERTIME
impact preview shows utilization drops from 135% to 112%
planning head approves overtime
wash manager completes action
exception status resolved/closed
```

### 36.4 Expected Results

```text
recovery action visible
capacity changes
shipment risk improves
audit created
analytics shows OTIF protected by recovery
```

---

## 37. SCN-012-MOBILE-OFFLINE: Offline Shopfloor Capture

### 37.1 Purpose

Demonstrate mobile/PWA offline event capture and sync.

### 37.2 Seed Order

```text
ORD-MOB-001
Style: STY-DEN-BASIC
Line: LINE-01
```

### 37.3 Initial State

```text
line active
release exists
mobile user line_sup_01 assigned
```

### 37.4 User Journey

```text
line supervisor opens mobile output screen
device offline
records output
entry stored locally
network returns
sync runs
duplicate retry occurs
backend ignores duplicate by clientEventId
```

### 37.5 Expected Results

```text
pending sync visible
entry synced
original timestamp preserved
WIP updated once
no duplicate output
```

---

## 38. SCN-013-MASTER-DATA-BLOCKER: Missing Technical Data

### 38.1 Purpose

Show planning blocked due to missing operation bulletin or wash route.

### 38.2 Seed Order

```text
ORD-MDATA-001
Style: STY-DEN-NO-BULLETIN
```

### 38.3 Initial State

```text
style exists
BOM incomplete
operation bulletin missing
wash route missing
```

### 38.4 Expected Exception

```text
MASTER_DATA_INCOMPLETE
```

### 38.5 User Journey

```text
planner tries to plan order
system marks planning readiness incomplete
IE user creates operation bulletin
wash route assigned
style becomes planning ready
```

### 38.6 Expected Results

```text
planning blocked until technical data complete
master data readiness analytics updates
```

---

# Part G: WIP Seed Data

---

## 39. Stage-Wise WIP Seed Requirements

Seed WIP across stages:

```text
FABRIC_RECEIVED_NOT_QC
FABRIC_CLEARED
CUTTING_WIP
CUT_PANELS_WAITING_SEWING
SEWING_WIP
SEWN_WAITING_WASH
WET_WASH_WIP
POST_WASH_QC
REWASH_WIP
WASHED_WAITING_FINISHING
FINISHING_WIP
PACKED_GOODS
SHIPMENT_READY
```

This enables:

```text
pipeline dashboard
stage drilldown
ageing tests
workcenter queue
shipment readiness
WIP reconciliation
```

---

## 40. Example WIP Records

| Order | Stage | Qty | Status | Age |
|---|---|---:|---|---:|
| ORD-HP-001 | SEWING_WIP | 2,000 | IN_PROCESS | 8h |
| ORD-WASH-001 | SEWN_WAITING_WASH | 4,000 | WAITING | 40h |
| ORD-REWASH-001 | REWASH_WIP | 300 | REWORK | 12h |
| ORD-WIPAGE-001 | SEWN_WAITING_WASH | 2,200 | WAITING | 60h |
| ORD-RECON-001 | PACKED_GOODS | 6,100 | WAITING | 10h |
| ORD-SHIP-001 | PACKED_GOODS | 5,600 | WAITING | 20h |

---

# Part H: Exception Seed Data

---

## 41. Seed Exceptions

Create exceptions by scenario.

| Exception Code | Category | Severity | Linked Order | Purpose |
|---|---|---|---|---|
| EXC-PCD-001 | PCD | RED | ORD-PCD-001 | PCD blocker |
| EXC-FABQC-001 | FABRIC_QC | RED | ORD-FABQC-001 | Fabric QC fail |
| EXC-MAT-001 | MATERIAL | RED | ORD-MAT-001 | Material delay |
| EXC-SEW-001 | SEWING | RED | ORD-SEW-001 | Line shortfall |
| EXC-WASH-001 | WASH | RED | ORD-WASH-001 | Wash overload |
| EXC-REWASH-001 | WASH | RED | ORD-REWASH-001 | Rewash |
| EXC-WIPAGE-001 | WIP | RED | ORD-WIPAGE-001 | WIP ageing |
| EXC-RECON-001 | WIP | BLACK | ORD-RECON-001 | Quantity gap |
| EXC-SHIP-001 | SHIPMENT | RED | ORD-SHIP-001 | Shipment readiness |
| EXC-MDATA-001 | SYSTEM_DATA | YELLOW | ORD-MDATA-001 | Missing master data |

---

## 42. Exception Ownership

Assign owners:

```text
PCD → planner_01
FABRIC_QC → fabric_qc_01
MATERIAL → procurement_01
SEWING → sewing_mgr
WASH → wash_mgr
WIP → planner_01
SHIPMENT → shipment_mgr
SYSTEM_DATA → business_admin
```

---

# Part I: Recovery Seed Data

---

## 43. Recovery Actions

Seed recovery actions for selected scenarios.

| Action | Linked Exception | Status | Purpose |
|---|---|---|---|
| ADD_OVERTIME | EXC-WASH-001 | OPEN | Wash overload recovery |
| MOVE_MACHINE | EXC-SEW-001 | APPROVAL_PENDING | Sewing bottleneck |
| EXPEDITE_MATERIAL | EXC-MAT-001 | IN_PROGRESS | Material delay |
| CREATE_REWORK_BATCH | EXC-REWASH-001 | OPEN | Rewash execution |
| APPROVE_SPLIT_SHIPMENT | EXC-SHIP-001 | APPROVAL_PENDING | Shipment short qty |

---

## 44. Recovery Impact Seed

For recovery impact preview:

```text
ADD_OVERTIME on WET-WASH:
utilization before = 135%
utilization after = 112%
risk before = RED
risk after = YELLOW
```

```text
MOVE_MACHINE to LINE-04:
expected output before = 420 pcs/day
expected output after = 600 pcs/day
```

---

# Part J: Analytics Seed Data

---

## 45. Analytics Snapshot Seed

Create historical snapshots for at least 14–30 days.

This supports:

```text
trends
charts
OTIF
WIP ageing trend
line efficiency trend
wash rework trend
exception recurrence
```

### 45.1 Recommended Snapshot Period

```text
last 30 days
```

### 45.2 Snapshot Values

Seed trends such as:

```text
OTIF around 95%
cost-protected OTIF around 25–35%
resource utilization around 70%
wash rework rate 6–10%
line efficiency 60–75%
```

These should align with the problem statement where OTIF is high but protected by extra operating effort.

---

## 46. OTIF Simulation

Seed shipments:

```text
20 completed shipments
19 OTIF
6 of those OTIF required recovery action
1 late shipment
```

Analytics should show:

```text
OTIF = 95%
cost-protected OTIF = 31.6% of OTIF shipments
```

---

## 47. Utilization Simulation

Seed capacity/utilization:

```text
overall resource utilization = 70%
sewing utilization = 72%
wet wash utilization = 118% on some days
packing utilization = 65%
```

This supports demonstrating:

```text
overall underutilization with local constraints
```

---

# Part K: Integration Seed Files

---

## 48. Import Test Files

Generate seed import templates for:

```text
orders_import_valid.xlsx
orders_import_with_errors.xlsx
operation_bulletin_valid.xlsx
operation_bulletin_with_errors.xlsx
opening_wip_valid.xlsx
opening_wip_with_gap.xlsx
material_po_delay.xlsx
fabric_qc_fail.xlsx
fastreact_plan_import.xlsx
shipment_status_import.xlsx
```

For MVP, CSV files may be easier than XLSX.

---

## 49. Import Error Scenarios

Include rows with:

```text
missing style code
invalid customer code
negative quantity
invalid date
unknown vendor
duplicate order number
invalid WIP stage
operation bulletin duplicate sequence
SMV missing
wash route missing
```

---

# Part L: Simulation User Journeys

---

## 50. Demo Journey 1: Planner Morning Control

User:

```text
planner_01
```

Steps:

```text
open control tower
review RED orders
open PCD readiness
release ready order
open workcenter load
identify wet wash as constraint
open exceptions
create recovery action
```

Expected learning:

```text
planner sees what must be acted on first
```

---

## 51. Demo Journey 2: Sewing Supervisor Capture

User:

```text
line_sup_01
```

Steps:

```text
open mobile home
select assigned line output task
record output
record downtime
raise andon issue
close shift
```

Expected learning:

```text
shopfloor capture updates live planning reality
```

---

## 52. Demo Journey 3: Wash Manager Recovery

User:

```text
wash_mgr
```

Steps:

```text
open wash board
see aged queue
create priority batch
mark rewash
review additional capacity load
complete recovery action
```

Expected learning:

```text
wash is controlled as a planning constraint
```

---

## 53. Demo Journey 4: Shipment Gate

User:

```text
shipment_mgr
```

Steps:

```text
open shipment readiness
attempt mark ready for blocked order
complete checklist
request split shipment
approve split
mark ready
```

Expected learning:

```text
shipment readiness is governed and auditable
```

---

## 54. Demo Journey 5: Management Review

User:

```text
mgmt_viewer
```

Steps:

```text
open executive analytics
review OTIF
review cost-protected OTIF
review utilization
review recurring exceptions
review wash rework trend
```

Expected learning:

```text
high OTIF may be achieved through recovery cost and operational firefighting
```

---

# Part M: Seed Data Validation

---

## 55. Validation Command

Create command:

```text
python manage.py validate_seed_scenarios
```

Validation checks:

```text
all scenario orders exist
all scenario users exist
all orders have required style/customer
approved styles have BOM/bulletin/wash route except blocker scenario
WIP quantities exist for WIP scenarios
exceptions exist and linked correctly
permissions assigned
analytics snapshots generated
```

---

## 56. Scenario Validation Output

Example:

```text
SCN-001-HAPPY-PATH: PASS
SCN-002-PCD-BLOCKED: PASS
SCN-003-FABRIC-QC-FAIL: PASS
SCN-009-WIP-RECON-GAP: PASS with expected reconciliation gap
```

---

## 57. Seed Health Dashboard

Optional admin view:

```text
/admin/seed-health
```

Shows:

```text
scenario code
status
linked order
expected exception
actual exception
expected WIP
actual WIP
validation result
```

---

# Part N: Developer Implementation Guidance

---

## 58. Recommended Seed Module Structure

```text
backend/apps/demo_seed/
  management/
    commands/
      seed_demo_all.py
      reset_demo_data.py
      validate_seed_scenarios.py
  seeders/
    permissions.py
    organization.py
    users.py
    masters.py
    styles.py
    bulletins.py
    wash_routes.py
    orders.py
    wip.py
    exceptions.py
    recovery.py
    analytics.py
    imports.py
  scenarios/
    scn_001_happy_path.py
    scn_002_pcd_blocked.py
    ...
```

Alternative:

```text
common/management/commands
```

But a dedicated demo_seed app keeps responsibilities clean.

---

## 59. Factories for Tests

Use `factory_boy` factories for automated tests.

Examples:

```text
OrderFactory
StyleFactory
LineFactory
WipItemFactory
WashBatchFactory
ExceptionFactory
ShipmentReadinessFactory
```

Seed data commands should not replace test factories.

Use both:

```text
seed data for demo/UAT
factories for automated tests
```

---

# Part O: Scenario-to-Screen Mapping

---

## 60. Mapping Table

| Scenario | Main Screens Tested |
|---|---|
| Happy path | Orders, PCD, Release, WIP, Wash, Shipment |
| PCD blocked | PCD Readiness, Release |
| Fabric QC fail | Fabric QC, PCD, Exceptions |
| Material delay | Material Status, PCD, Exceptions |
| Sewing shortfall | Sewing Line Loading, Exceptions, Line Balance |
| Wash bottleneck | Workcenter Load, Wash Board, Recovery |
| Rewash loop | Wash Board, WIP, Exceptions |
| WIP ageing | WIP Pipeline, Workcenter Queue |
| WIP recon gap | WIP Reconciliation, Audit |
| Shipment blocked | Shipment Readiness, Exceptions |
| Master data blocker | Technical Masters, Planning Readiness |
| Mobile offline | Mobile PWA, Offline Sync |

---

# Part P: Scenario-to-API Mapping

---

## 61. Key APIs Exercised

```text
GET /api/v1/orders
GET /api/v1/orders/{id}
GET /api/v1/pcd-readiness
POST /api/v1/orders/{id}/release-to-cutting
GET /api/v1/planning/weekly
POST /api/v1/planning/weekly/impact-preview
GET /api/v1/workcenters/load
POST /api/v1/sewing/output
GET /api/v1/wash/board
POST /api/v1/wash/batches
POST /api/v1/wash/batches/{id}/rewash
GET /api/v1/wip/pipeline
GET /api/v1/wip/reconciliation/{orderId}
GET /api/v1/exceptions
POST /api/v1/recovery-actions
GET /api/v1/shipments/readiness
POST /api/v1/orders/{id}/mark-shipment-ready
POST /api/v1/shopfloor/offline-sync
GET /api/v1/analytics/otif
```

---

# Part Q: Open Decisions

---

## 62. Decisions Required

Before building seed data, confirm:

1. Should seed data use Indonesian factory/local calendar assumptions?
2. Should all dates be relative to current date?
3. Should demo seed include 30 days of analytics history or 90 days?
4. Should import test files be generated as CSV or XLSX?
5. Should wash routes be simplified for MVP demo?
6. Should opening WIP be imported through import module or direct seed?
7. How many lines should the initial seed factory have?
8. Should sample room flow be included in seed version 1?
9. Should cost-protected OTIF include estimated cost or only recovery action count?
10. Should demo users use simple default passwords or environment-generated passwords?
11. Should seed data be allowed in staging only or also local?
12. Should production seed be limited to permissions/core master only?

---

## 63. Non-Negotiable Rules

```text
1. Seed data must be scenario-based, not random.
2. Seed commands must be idempotent.
3. Demo dates must remain current using relative date logic.
4. Seed users must cover all important roles.
5. At least one scenario must test each critical MVP surface.
6. WIP seed must include multiple stages, holds, and ageing.
7. Wash seed must include rewash and capacity overload.
8. Shipment seed must include readiness blockers.
9. Analytics seed must show high OTIF with recovery cost stress.
10. Seed validation command must confirm scenario readiness.
```

---

## 64. Summary

This document defines the seed data and simulation scenario spine for the Eratex Planning & Scheduling Platform.

The seed data must allow the team to demonstrate and test the complete factory operating loop:

```text
order
→ readiness
→ planning
→ release
→ production
→ wash
→ WIP
→ quality
→ exception
→ recovery
→ shipment
→ analytics
```

The most important rule is:

```text
Seed data must tell operational stories.
```

A strong scenario seed pack will allow developers, QA, planners, supervisors, and management to validate whether the platform can realistically replace Excel-driven planning and become a live operating system for Eratex.

## Scheduling Behaviour Rulebook Alignment

The deterministic seed pack now includes SCN-014 through SCN-023 for order cancellation, post-cut cancellation, wash-stage cancellation, sewing/wash capacity loss, overtime capacity addition, shipment pull-in, frozen-plan change request, FastReact imported plan conflict, and wash effect/repeat-cycle rejection. `validate_seed_scenarios` is the acceptance command for these scenarios.
