# 15. Integration Specification  
# Eratex End-to-End Planning & Scheduling Platform

**Company:** Eratex  
**Product:** Planning & Scheduling Tool for Denim Bottoms + Chinos Manufacturing  
**Document Type:** Integration Specification  
**Version:** 2.0  
**Date:** 2026-05-26  
**Backend Stack:** Django + Django REST Framework + PostgreSQL + Celery + Redis  
**Frontend Stack Context:** React/Next.js + TypeScript + PWA Shopfloor Capture  
**Deployment Context:** Dockerized application stack  
**Related Documents:**  
- 01 Technical Architecture Spine  
- 02 Data Model and Table Schema Specification  
- 03 Master Data Specification  
- 04 Planning Logic and Calculation Flows  
- 05 Backend Domain Module Specification  
- 06 API and Data Contracts Specification  
- 08 WIP Inventory and Reconciliation Specification  
- 11 Exception, Alert, and Recovery Specification  
- 12 Handheld Shopfloor Capture Technical Specification  
- 14 Analytics and Reporting Specification  

---

## 1. Purpose

This document defines the integration specification for the Eratex Planning & Scheduling Platform.

The planning platform will not operate in isolation. It must exchange data with existing and future systems such as:

```text
ERP / order management
existing Excel planning files
FastReact or other planning tool exports
procurement / material tracking
HR / attendance
machine maintenance
shipment / logistics
quality systems
shopfloor handheld capture
analytics exports
```

This specification defines:

```text
integration principles
source-of-truth rules
data ownership
inbound integrations
outbound integrations
Excel import strategy
FastReact coexistence/migration approach
ERP integration patterns
integration staging model
validation rules
error handling
idempotency
audit
security
monitoring
APIs
implementation phasing
```

---

## 2. Integration Thesis

The planning tool should become the live execution-control layer for planning, WIP, exceptions, shopfloor capture, wash execution, and shipment readiness.

But it must respect existing systems.

The integration principle is:

```text
Do not duplicate the source of truth blindly.
Define who owns each data object.
Import what is needed.
Validate before applying.
Keep audit trail.
Fail visibly.
```

The platform should not become another disconnected Excel repository. It should progressively replace manual Excel dependencies where the platform owns the workflow.

---

## 3. Integration Context

The current operating reality may include:

```text
manual Excel planning
existing ERP/order records
FastReact planning outputs or references
vendor procurement trackers
manual WIP reports
manual shipment trackers
quality inspection records
attendance/manpower data
```

A company can own a planning tool such as FastReact and still depend heavily on Excel because:

```text
tool output is not connected to actual execution
shopfloor actuals are not captured live
WIP is not reconciled
exceptions are followed manually
wash/rework loops are not fully controlled
capacity assumptions are not trusted
data freshness is weak
local planners need override sheets
```

This specification ensures Eratex’s new platform does not repeat the same limitation.

---

## 4. Integration Scope

The platform should support integration for:

```text
1. Order import
2. Customer and buyer import
3. Style and technical master import
4. BOM import
5. Operation bulletin import
6. Material requirement / PO import
7. Vendor import
8. Fabric receipt and QC import
9. Existing WIP opening balance import
10. Line and machine master import
11. Operator skill / manpower import
12. HR attendance import
13. FastReact plan import, if required
14. Shipment status import/export
15. Quality data import/export
16. Analytics export
17. Integration monitoring
18. Integration error management
```

---

## 5. Integration Principles

## 5.1 Source-of-Truth First

Every data domain must have an owning system.

Example:

```text
ERP may own confirmed customer orders.
Planning platform owns weekly plan and daily release.
Shopfloor platform owns live output capture.
Planning platform owns WIP movement after go-live.
```

## 5.2 Dry-Run Before Apply

All bulk imports should support:

```text
dry-run validation
error report
apply only after user approval
```

## 5.3 Staging Before Core Tables

External data should first enter staging/import tables.

Flow:

```text
file/API input
→ staging table
→ validation
→ error report
→ approval
→ apply to domain tables
→ audit
```

## 5.4 Fail Visibly

Integration failures should create:

```text
integration run error
system/data exception if repeated or critical
dashboard warning
```

Do not silently fail.

## 5.5 Idempotency

Repeated imports or retries must not duplicate records.

Use:

```text
external system code
external record ID
business key
import batch ID
hash/checksum where useful
```

## 5.6 No Blind Overwrite

Critical operational data should not be overwritten after go-live without approval.

Example:

```text
Opening WIP may be imported once.
Live WIP should not be overwritten daily from Excel unless controlled.
```

## 5.7 Integration Audit

Every applied import must be auditable.

Audit should capture:

```text
source
batch ID
records created
records updated
records rejected
user
timestamp
file/reference
```

---

# Part A: Source-of-Truth Matrix

---

## 6. Recommended Ownership Matrix

| Data Domain | Source of Truth | Platform Role |
|---|---|---|
| Customer master | ERP / Planning platform | Import or maintain |
| Buyer master | ERP / Planning platform | Import or maintain |
| Confirmed orders | ERP / Order import | Consume and track lifecycle |
| Style master | Technical / ERP / Import | Consume and govern planning readiness |
| BOM | Technical / ERP / Excel import | Consume, version, approve |
| Operation bulletin | IE / Excel / Platform | Own planning-approved version |
| Vendor master | ERP / Procurement | Consume or maintain |
| Material PO | ERP / Procurement | Consume ETA/status |
| Fabric receipt | ERP / Warehouse | Consume or capture |
| Fabric QC | Platform or QC system | Prefer platform for PCD linkage |
| Weekly plan | Planning platform | Own |
| Daily release | Planning platform | Own |
| Sewing output | Shopfloor platform | Own after go-live |
| Wash batch execution | Planning platform | Own |
| WIP movement | Planning platform | Own after go-live |
| Exceptions | Planning platform | Own |
| Shipment readiness | Planning platform / ERP | Own operational readiness |
| Dispatch confirmation | ERP / Shipment system | Consume or capture |
| Analytics snapshots | Planning platform | Own |

---

## 7. Data Ownership Decision Rule

For each integration, decide:

```text
import and reference only
import and allow local enrichment
import and allow local override with audit
platform owns after initial migration
bidirectional sync
```

Default recommendation:

```text
Avoid bidirectional sync in MVP unless absolutely necessary.
```

Bidirectional sync is harder to govern.

---

# Part B: Integration Architecture

---

## 8. Integration Module

Recommended Django app:

```text
integrations
```

### 8.1 Responsibilities

```text
integration source registry
import batch handling
staging records
validation
apply jobs
error logging
sync runs
status dashboard
integration exceptions
```

### 8.2 Suggested Files

```text
integrations/
  models.py
  serializers.py
  views.py
  urls.py
  services/
    import_batches.py
    validators.py
    apply.py
    erp.py
    fastreact.py
    excel.py
    monitoring.py
  selectors.py
  tasks.py
  admin.py
  tests/
```

---

## 9. Integration Models

## 9.1 IntegrationSource

Purpose:

```text
register external systems/files/import types
```

Fields:

```text
source_id
source_code
source_name
source_type
direction
active_status
last_run_at
owner_user_id
configuration
created_at
updated_at
```

Source types:

```text
ERP
FASTREACT
EXCEL
HR
SHIPMENT
QUALITY_SYSTEM
SHOPFLOOR_DEVICE
API
MANUAL
```

Direction:

```text
INBOUND
OUTBOUND
BIDIRECTIONAL
```

---

## 9.2 IntegrationRun

Purpose:

```text
track each sync/import/export execution
```

Fields:

```text
run_id
source_id
run_type
status
started_at
ended_at
records_received
records_valid
records_invalid
records_created
records_updated
records_skipped
error_count
triggered_by
summary
```

Status:

```text
SCHEDULED
RUNNING
SUCCESS
PARTIAL_SUCCESS
FAILED
STALE
DISABLED
```

---

## 9.3 ImportBatch

Purpose:

```text
track uploaded file/import batch
```

Fields:

```text
batch_id
import_type
source_id
file_name
file_url_or_path
status
dry_run
uploaded_by
uploaded_at
validated_at
applied_at
total_rows
valid_rows
error_rows
summary
```

Status:

```text
UPLOADED
VALIDATING
VALIDATED
VALIDATION_FAILED
APPLYING
APPLIED
PARTIALLY_APPLIED
FAILED
CANCELLED
```

---

## 9.4 ImportRowError

Fields:

```text
error_id
batch_id
row_number
field_name
error_code
message
raw_value
severity
```

Severity:

```text
WARNING
ERROR
BLOCKER
```

---

## 9.5 Staging Tables

Recommended staging approach:

```text
one generic staging table with JSON payload for MVP
or import-type-specific staging tables for cleaner validation
```

MVP practical option:

```text
ImportBatch
ImportStagingRow
ImportRowError
```

ImportStagingRow fields:

```text
staging_row_id
batch_id
row_number
raw_payload_json
normalized_payload_json
validation_status
target_entity_type
target_entity_id
business_key
row_hash
created_at
```

---

# Part C: Import Types

---

## 10. Supported Import Types

Recommended import types:

```text
orders
customers
buyers
styles
bom
operation_bulletins
materials
vendors
material_pos
fabric_receipts
fabric_qc
line_master
machine_master
line_machine_assignment
operator_skill_matrix
opening_wip
current_wip
shipment_status
attendance
fastreact_plan
```

---

## 11. Import API

### 11.1 Upload Import

```text
POST /api/v1/imports/{importType}
```

Request:

```text
multipart/form-data
file=<uploaded.xlsx/csv>
dryRun=true
sourceCode=EXCEL
```

Response:

```json
{
  "data": {
    "batchId": "uuid",
    "importType": "orders",
    "dryRun": true,
    "totalRows": 120,
    "validRows": 112,
    "errorRows": 8,
    "status": "VALIDATED",
    "errors": [
      {
        "rowNumber": 14,
        "field": "styleCode",
        "message": "Style code STY-9999 does not exist."
      }
    ]
  },
  "meta": {},
  "errors": []
}
```

---

## 12. Apply Import Batch

```text
POST /api/v1/imports/{batchId}/apply
```

Permission:

```text
integration.approve_import
```

Response:

```json
{
  "data": {
    "batchId": "uuid",
    "status": "APPLIED",
    "recordsCreated": 100,
    "recordsUpdated": 12,
    "recordsSkipped": 0,
    "auditEventId": "uuid"
  },
  "meta": {},
  "errors": []
}
```

---

## 13. Import Validation Rules

General:

```text
mandatory fields present
data type valid
foreign keys exist
business keys unique
status values valid
date formats valid
quantities non-negative
duplicate rows detected
inactive master reference rejected or warned
```

---

# Part D: Order Integration

---

## 14. Order Import Purpose

Orders may originate from ERP or customer order systems.

The planning platform needs confirmed order data for:

```text
PCD planning
material readiness
line loading
wash planning
shipment readiness
analytics
```

---

## 15. Order Import Fields

Required:

```text
order_no
po_number
customer_code
buyer_code
style_code
product_type
order_qty
committed_ship_date
order_confirmed_date
factory_code
```

Optional:

```text
color
size_breakup
destination
shipment_mode
priority
season
planned_pcd_date
```

---

## 16. Order Import Validation

```text
order_no required
customer exists or can be created if allowed
style exists or create placeholder if allowed
order_qty > 0
committed_ship_date valid
duplicate order_no handled by update rule
```

---

## 17. Order Update Policy

If order already exists:

Allowed update fields:

```text
quantity change, if not already released or with approval
shipment date change
buyer/customer metadata
priority
```

Restricted update fields:

```text
style change after planning
quantity reduction below produced quantity
shipment date earlier than current feasibility without risk recalculation
```

---

# Part E: Style, BOM, and Operation Bulletin Integration

---

## 18. Style Import Fields

```text
style_code
customer_code
buyer_code
product_type
fit_type
fabric_category
wash_complexity
sewing_complexity
status
```

Validation:

```text
style code unique
product type valid
customer exists
status valid
```

---

## 19. BOM Import Fields

Header:

```text
style_code
version
status
effective_date
```

Lines:

```text
material_code
material_name
material_type
consumption_per_piece
wastage_percent
uom
required_stage
vendor_code
nominated_vendor_flag
```

Validation:

```text
style exists
material type valid
consumption > 0
UOM valid
duplicate material line warning
approved BOM cannot be overwritten directly
```

---

## 20. Operation Bulletin Import Fields

Header:

```text
style_code
version
status
effective_date
```

Lines:

```text
sequence_no
operation_code
operation_name
operation_group
machine_type
attachment_required
skill_level
smv
qc_checkpoint
critical_operation
predecessor_sequence_no
parallel_allowed
```

Validation:

```text
style exists
sequence unique
smv positive
machine type valid
skill level valid
total SMV calculated
approved bulletin cannot be overwritten
```

---

## 21. Operation Bulletin Import Policy

Recommended:

```text
import as DRAFT
validate
allow IE user to review
approve through platform workflow
```

Do not directly import as approved unless controlled by permission.

---

# Part F: Material and Procurement Integration

---

## 22. Vendor Import Fields

```text
vendor_code
vendor_name
vendor_type
nominated_flag
standard_lead_time_days
active_status
```

Validation:

```text
vendor code unique
lead time required for active nominated vendors
vendor type valid
```

---

## 23. Material PO Import Fields

```text
po_no
order_no
material_code
vendor_code
ordered_qty
expected_arrival_date
revised_eta
actual_arrival_date
status
```

Validation:

```text
PO number required
order exists
material exists
vendor exists
quantity positive
ETA valid
```

---

## 24. Procurement Sync Policy

Recommended sync direction:

```text
ERP/procurement → planning platform
```

Platform uses PO data to calculate:

```text
material readiness
PCD risk
vendor delay exceptions
shipment risk
```

The platform may not own PO creation in MVP.

---

# Part G: Fabric Receipt and Fabric QC Integration

---

## 25. Fabric Receipt Import Fields

```text
order_no
material_code
lot_no
roll_no
shade_lot
received_qty
received_date
warehouse_location
status
```

Validation:

```text
order exists
material is fabric
received qty > 0
lot number present
roll number unique within lot
```

---

## 26. Fabric QC Import Fields

```text
order_no
lot_no
roll_no
inspection_date
four_point_score
width_result
gsm_result
shrinkage_percent
skew_result
crocking_result
shade_result
qc_status
remarks
```

Validation:

```text
fabric roll exists
QC status valid
mandatory parameters present if configured
failed QC blocks PCD unless waived
```

---

## 27. Recommended Fabric QC Ownership

Prefer:

```text
planning platform owns fabric QC capture
```

because fabric QC directly affects:

```text
PCD readiness
cutting release
fabric hold exceptions
```

If an external QC system exists, integrate but preserve PCD linkage.

---

# Part H: Line, Machine, Skill, and Attendance Integration

---

## 28. Line Master Import

Fields:

```text
factory_code
line_code
line_name
line_type
supervisor_employee_code
standard_manpower
current_manpower
baseline_efficiency
active_status
```

Validation:

```text
factory exists
line code unique within factory
baseline efficiency valid percent
```

---

## 29. Machine Master Import

Fields:

```text
machine_code
machine_type
factory_code
status
current_line_code
maintenance_status
```

Validation:

```text
machine code unique
machine type valid
line exists if assigned
```

---

## 30. Line Machine Assignment Import

Fields:

```text
line_code
machine_code
assigned_from
assigned_to
```

Validation:

```text
machine not assigned to two active lines
machine not under maintenance
date range valid
```

---

## 31. Operator Skill Matrix Import

Fields:

```text
employee_code
operation_code
skill_level
efficiency_rating
quality_rating
last_review_date
training_required
```

Validation:

```text
operator exists
operation exists
skill level valid
ratings valid
```

---

## 32. HR Attendance Import

Fields:

```text
employee_code
date
shift
attendance_status
line_code
workcenter_code
in_time
out_time
```

Usage:

```text
manpower availability
line capacity adjustment
absenteeism analytics
```

Validation:

```text
employee exists
date valid
attendance status valid
line/workcenter exists
```

---

# Part I: WIP Integration and Migration

---

## 33. Opening WIP Import

### 33.1 Purpose

At go-live, existing WIP must be loaded into the system.

### 33.2 Fields

```text
order_no
style_code
stage
quantity
status
shade_lot
batch_or_bundle_ref
entered_stage_at
owner_employee_code
hold_reason
remarks
```

### 33.3 Validation

```text
order exists
style matches order
stage valid
quantity positive
status valid
hold reason required for HELD
duplicate batch/bundle warning
```

---

## 34. Opening WIP Policy

Recommended:

```text
one-time controlled import
physical verification before apply
audit required
no repeated uncontrolled overwrite
```

After go-live:

```text
WIP should be updated through platform events
```

---

## 35. Current WIP Import During Transition

If business insists on temporary Excel WIP upload:

```text
allow dry-run
show differences against system WIP
require approval
create reconciliation exceptions
do not silently overwrite
```

---

# Part J: FastReact Integration / Coexistence

---

## 36. FastReact Context

FastReact may be present as an existing planning tool. However, if planning still depends heavily on Excel, the issue may be:

```text
limited adoption
incomplete integration
insufficient shopfloor actuals
scale or complexity mismatch
manual wash/WIP/recovery handling
local planning overrides
```

This platform should avoid simply becoming another disconnected planning layer.

---

## 37. FastReact Integration Options

### Option 1: No Integration, Replace Gradually

Use platform as new planning control layer.

Suitable when:

```text
FastReact data is unreliable or not actively used
Excel is primary planning reality
```

### Option 2: Import FastReact Plan

Use FastReact as initial planning input.

Import:

```text
planned order
line assignment
planned start/end
quantity
workcenter
```

Platform then owns:

```text
daily release
shopfloor actuals
WIP
exceptions
wash
recovery
shipment readiness
```

### Option 3: Export Actuals Back to FastReact

Only if FastReact remains official planning system.

Higher complexity; not recommended for MVP unless required.

---

## 38. FastReact Plan Import Fields

```text
external_plan_id
plan_version
order_no
style_code
line_code
workcenter_code
planned_start
planned_end
planned_qty
planned_smv
status
```

Validation:

```text
order exists
line exists
style exists
planned dates valid
quantity positive
conflicts with existing frozen plan flagged
```

---

## 39. FastReact Coexistence Rule

If FastReact plan is imported:

```text
mark imported plan as external source
do not blindly treat as frozen
run capacity/risk validation
allow planner review
create platform plan version from imported plan
```

---

# Part K: Shipment and Logistics Integration

---

## 40. Shipment Status Import

Fields:

```text
order_no
shipment_id
shipment_date
packed_qty
carton_count
forwarder
booking_status
dispatch_status
actual_dispatch_date
tracking_reference
```

Usage:

```text
shipment readiness
OTIF
dispatch confirmation
```

---

## 41. Shipment Readiness Export

The platform may export:

```text
shipment-ready orders
short qty
packing status
AQL status
documentation status
blocked shipments
```

To:

```text
ERP
shipment team
management report
```

---

## 42. Dispatch Confirmation

If ERP owns dispatch:

```text
ERP → platform dispatch confirmation
```

If platform captures dispatch:

```text
platform → ERP update, later phase
```

---

# Part L: Quality Integration

---

## 43. Quality Data Import/Export

Possible data:

```text
QC inspection
defects
holds
AQL results
fabric QC
post-wash QC
final QC
```

If external QC system exists:

```text
import QC status and defect data
link to WIP/order
trigger exceptions
update shipment readiness
```

If not:

```text
platform owns QC capture
```

---

# Part M: API-Based Integrations

---

## 44. Integration Status API

```text
GET /api/v1/integrations/status
```

Response:

```json
{
  "data": [
    {
      "source": "ERP_ORDERS",
      "sourceType": "ERP",
      "direction": "INBOUND",
      "lastRunAt": "2026-06-05T06:00:00+07:00",
      "status": "SUCCESS",
      "recordsProcessed": 250,
      "lastError": null,
      "owner": {
        "id": 12,
        "displayName": "Integration Owner"
      }
    }
  ],
  "meta": {},
  "errors": []
}
```

---

## 45. Trigger Integration Run API

```text
POST /api/v1/integrations/{sourceCode}/run
```

Permission:

```text
integration.run
```

Response:

```json
{
  "data": {
    "runId": "uuid",
    "sourceCode": "ERP_ORDERS",
    "status": "RUNNING",
    "startedAt": "2026-06-05T09:00:00+07:00"
  },
  "meta": {},
  "errors": []
}
```

---

## 46. Integration Run Detail API

```text
GET /api/v1/integrations/runs/{runId}
```

Response includes:

```text
status
records processed
errors
warnings
created/updated/skipped counts
duration
log summary
```

---

# Part N: Error Handling and Stale Data

---

## 47. Integration Error Types

```text
AUTH_FAILED
CONNECTION_FAILED
FILE_FORMAT_INVALID
MISSING_REQUIRED_FIELD
INVALID_REFERENCE
DUPLICATE_RECORD
BUSINESS_RULE_FAILED
PARTIAL_APPLY_FAILED
TIMEOUT
STALE_DATA
UNKNOWN_ERROR
```

---

## 48. Error Severity

```text
WARNING = import can proceed with caution
ERROR = row rejected
BLOCKER = batch cannot be applied
CRITICAL = system/integration exception required
```

---

## 49. Stale Data Detection

A source is stale when:

```text
current_time - last_successful_run_at > configured threshold
```

Examples:

```text
ERP orders not synced for 24h
HR attendance not synced for current shift
shipment dispatch not synced by end of day
shopfloor offline entries pending beyond threshold
```

Stale data should create:

```text
SYSTEM_DATA or INTEGRATION exception
```

---

## 50. Partial Success Policy

If some rows fail:

```text
valid rows may be applied only if import type allows partial apply
failed rows remain in error report
summary shows partial success
critical domains may require all-or-nothing
```

Recommended all-or-nothing for:

```text
operation bulletin import
BOM version import
opening WIP import
```

Partial allowed for:

```text
vendor master
material PO ETA updates
shipment status updates
```

---

# Part O: Security

---

## 51. Authentication

For APIs:

```text
use authenticated service user/token
```

For file imports:

```text
authenticated platform user required
```

---

## 52. Authorization

Permissions:

```text
integration.view
integration.run
integration.import
integration.approve_import
integration.cancel_import
integration.view_errors
integration.export
integration.configure
```

---

## 53. File Security

Uploaded files should be:

```text
stored securely
scanned if infrastructure supports it
limited by size and type
not publicly accessible
linked to import batch
deleted/archived by retention policy
```

Allowed types:

```text
xlsx
csv
json, for API/testing where needed
```

---

## 54. Sensitive Data

Do not import unnecessary sensitive HR data.

For attendance/capacity, only required fields should be used:

```text
employee code
attendance status
shift
line/workcenter
```

Avoid personal details not needed for planning.

---

# Part P: Monitoring and Dashboard

---

## 55. Integration Monitoring Screen

Route:

```text
/admin/integrations
/integrations/status
```

### Header KPIs

```text
active integrations
failed integrations
stale integrations
last successful order sync
pending import batches
rows with errors
```

### Grid Columns

```text
source
type
direction
status
last run
records processed
error count
owner
next scheduled run
last error
```

### Actions

```text
run now
view run log
upload file
download error report
apply validated import
cancel import
create exception
```

---

## 56. Import Batch Screen

Route:

```text
/integrations/imports/:batchId
```

Sections:

```text
batch summary
valid/error row counts
row error table
normalized preview
apply/cancel actions
audit
```

---

# Part Q: Export Specifications

---

## 57. Export Types

The platform should support controlled exports for:

```text
weekly plan
daily release
WIP pipeline
shipment readiness
exception list
analytics reports
operation bulletin
line balance
```

---

## 58. Export API

```text
POST /api/v1/exports/{exportType}
```

Request:

```json
{
  "filters": {
    "factoryId": "uuid",
    "dateFrom": "2026-06-01",
    "dateTo": "2026-06-30"
  },
  "format": "xlsx"
}
```

Response:

```json
{
  "data": {
    "exportId": "uuid",
    "status": "QUEUED"
  },
  "meta": {},
  "errors": []
}
```

---

## 59. Export Governance

Export must capture:

```text
user
export type
filters
timestamp
row count
file reference
```

Permission:

```text
integration.export or analytics.export
```

---

# Part R: Implementation Phasing

---

## 60. Phase 1: Import Framework

Build:

```text
IntegrationSource
IntegrationRun
ImportBatch
ImportStagingRow
ImportRowError
Excel upload API
dry-run validation
apply import
integration monitoring screen
```

---

## 61. Phase 2: Core Master and Order Imports

Build imports for:

```text
customers
buyers
orders
styles
BOM
operation bulletins
vendors
materials
```

---

## 62. Phase 3: Planning and WIP Migration

Build imports for:

```text
line master
machine master
operator skill matrix
opening WIP
FastReact plan import, if required
```

---

## 63. Phase 4: Execution and Shipment Sync

Build integrations for:

```text
material PO ETA
fabric receipt
fabric QC
attendance
shipment status
dispatch confirmation
```

---

## 64. Phase 5: Automated API Sync and Monitoring

Build:

```text
scheduled ERP sync
scheduled HR sync
scheduled shipment sync
stale data detection
integration exception generation
alerts
```

---

## 65. Phase 6: Mature Export and Bidirectional Interfaces

Build:

```text
controlled outbound exports
ERP update APIs if required
scheduled reports
advanced monitoring
```

---

# Part S: Testing Requirements

---

## 66. Unit Tests

Required tests:

```text
import file parsing
field validation
foreign key resolution
duplicate detection
row hash/idempotency
business rule validation
apply creates/updates expected records
```

---

## 67. API Tests

Required tests:

```text
upload import file
dry-run returns validation errors
apply requires permission
apply creates audit
invalid rows rejected
partial success works where allowed
integration status returns last run
```

---

## 68. Integration Scenario Tests

### 68.1 Order Import

```text
upload order file
validate customer/style references
apply
order appears in planning backlog
```

### 68.2 Operation Bulletin Import

```text
upload bulletin file
validate sequence and SMV
import as draft
approve through workflow
style becomes planning-ready
```

### 68.3 Opening WIP Import

```text
upload opening WIP
validate quantities/stages
apply
WIP pipeline shows quantities
audit created
```

### 68.4 FastReact Plan Import

```text
import external plan
validate line/order references
create draft platform plan
run capacity validation
```

### 68.5 Stale Integration

```text
ERP sync fails repeatedly
integration status = FAILED/STALE
system exception created
```

---

# Part T: Open Decisions

---

## 69. Decisions Required

Before implementation, confirm:

1. Which ERP or order system currently owns confirmed orders?
2. Is FastReact data accessible by export/API?
3. Which Excel files are currently used by planning?
4. Which imports are mandatory for pilot?
5. Are operation bulletins available in Excel?
6. Is opening WIP physically verifiable before upload?
7. Is HR attendance data available digitally?
8. Is dispatch confirmation owned by ERP or shipment team?
9. Which integrations are file-based vs API-based?
10. What is the acceptable sync frequency for order/material/shipment data?
11. Should partial import apply be allowed by import type?
12. Who approves imports and corrections?
13. How long should uploaded files be retained?
14. Is bidirectional ERP sync required in any MVP area?

---

## 70. Non-Negotiable Rules

```text
1. Every integration must have a defined source of truth.
2. Bulk imports must support dry-run validation.
3. Applied imports must be audited.
4. Failed integrations must be visible.
5. Stale data must create alert/exception when operationally critical.
6. Opening WIP must not be repeatedly overwritten without approval.
7. Operation bulletin/BOM imports must respect versioning.
8. Duplicate imports must not duplicate domain records.
9. Frontend and backend must not assume Excel remains the operational source after go-live.
10. Integration errors must be actionable, not hidden in logs only.
```

---

## 71. Summary

This document defines the integration spine for the Eratex Planning & Scheduling Platform.

The platform must connect with existing systems and files while progressively becoming the source of truth for:

```text
planning
daily release
WIP
shopfloor actuals
wash execution
exceptions
recovery
shipment readiness
analytics
```

The integration layer must be governed through:

```text
source-of-truth ownership
staging
validation
dry-run
approval
audit
error handling
stale data detection
monitoring
```

This will prevent the new platform from becoming another disconnected planning tool and will help move Eratex away from manual Excel dependency toward a live, governed operating system.
