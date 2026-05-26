# 02. Data Model and Table Schema Specification  
# Eratex End-to-End Planning & Scheduling Platform

**Company:** Eratex  
**Product:** Planning & Scheduling Tool for Denim Bottoms + Chinos Manufacturing  
**Document Type:** Data Model and Table Schema Specification  
**Version:** 2.0  
**Date:** 2026-05-26  
**Primary Backend Stack:** Django + Django REST Framework + PostgreSQL  
**Admin/RBAC:** Django Admin + Django Auth + Custom Role/Action Permissions  
**Deployment Context:** Dockerized application stack  

---

## 1. Purpose

This document defines the core data model and PostgreSQL table schema direction for the Eratex Planning & Scheduling Platform.

The schema must support the full planning and execution loop:

```text
Order
→ style technical file
→ BOM
→ operation bulletin
→ line routing
→ material procurement
→ fabric QC
→ PCD readiness
→ weekly planning
→ daily release
→ cutting
→ sewing
→ wash
→ WIP
→ QC
→ rework
→ finishing
→ packing
→ shipment readiness
→ audit and analytics
```

This document is written as a **technical handoff specification**. It should guide:

- Django model design
- PostgreSQL schema design
- migration creation
- API serializer planning
- admin interface configuration
- frontend data-contract design
- analytics snapshot design
- seed-data design
- QA data setup

---

## 2. Schema Design Principles

### 2.1 PostgreSQL as Transactional Source of Truth

PostgreSQL is the primary system of record for:

- master data
- orders
- planning state
- production execution
- WIP inventory
- QC events
- exceptions
- shipment readiness
- audit logs

### 2.2 Django ORM Compatibility

Tables should be designed to map cleanly to Django models.

Recommended field conventions:

```text
id
created_at
updated_at
created_by
updated_by
is_active
status
```

Where volume is high or mobile/offline capture is needed, use UUID primary keys.

### 2.3 Clear Separation of Data Types

The schema should distinguish:

| Data Type | Description |
|---|---|
| Master data | Stable reference data such as styles, lines, machines, vendors |
| Transaction data | Orders, releases, WIP movements, QC inspections |
| Planning data | plan versions, planned work items, line loading |
| Event data | output entries, wash events, audit events |
| Snapshot data | daily aggregates for analytics |
| Configuration data | thresholds, roles, permissions, calendars |

### 2.4 Auditability

All critical tables must either have:

```text
direct audit fields
or separate audit_event records
or history/version tables
```

Audited areas include:

- PCD conditional release
- blocked release override
- plan freeze
- plan change
- operation bulletin version change
- line realignment
- QC hold and release
- wash rework decision
- WIP quantity adjustment
- shipment readiness
- exception closure
- master data changes

### 2.5 Status Discipline

Status values should be implemented using:

```text
Django choices for stable internal statuses
or controlled lookup tables when business users need configuration
```

Do not allow free-text status values.

### 2.6 Quantity Discipline

Quantities must distinguish between:

```text
order quantity
fabric quantity
garment-equivalent quantity
cut quantity
gross output
defect quantity
rework quantity
net-good quantity
packed quantity
shipment-ready quantity
dispatched quantity
```

### 2.7 Timezone Discipline

All timestamps must be timezone-aware.

Recommended:

```text
Store as timestamptz in PostgreSQL.
Display in factory timezone.
```

---

## 3. Naming Conventions

### 3.1 Table Naming

Use singular or domain-oriented table names consistently. Recommended style:

```text
production_order
operation_bulletin
operation_bulletin_line
production_line
workcenter
wip_item
wip_movement
exception_record
shipment_readiness
```

### 3.2 Primary Keys

Recommended:

```text
UUID primary key for business/domain tables
Django integer auth_user can remain default
```

### 3.3 Foreign Keys

Foreign keys should be explicit and indexed.

Example:

```sql
order_id uuid references production_order(id)
```

### 3.4 Date Fields

Use:

```text
*_date for date-only fields
*_at for timestamp fields
```

Examples:

```text
planned_pcd_date
released_at
approved_at
entered_stage_at
```

---

# Part A: Identity, RBAC, and Organization

---

## 4. User Profile

Django provides the base `auth_user` table. Extend it through a `user_profile` table.

### 4.1 user_profile

```sql
CREATE TABLE user_profile (
    id uuid PRIMARY KEY,
    user_id integer NOT NULL UNIQUE REFERENCES auth_user(id),
    employee_code varchar(50),
    display_name varchar(150),
    factory_id uuid,
    department_id uuid,
    default_role_id uuid,
    phone varchar(30),
    email varchar(254),
    is_shopfloor_user boolean NOT NULL DEFAULT false,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL
);
```

### 4.2 Purpose

Stores operational profile details beyond Django auth.

### 4.3 Implementation Notes

- Django Admin should manage user-profile mapping.
- Shopfloor users may have restricted mobile-only permissions.
- User may have multiple roles through a mapping table.

---

## 5. Role and Permission Tables

Django has built-in groups and permissions, but for operational action-level permissions, create explicit business-role tables.

### 5.1 role

```sql
CREATE TABLE role (
    id uuid PRIMARY KEY,
    code varchar(80) NOT NULL UNIQUE,
    name varchar(150) NOT NULL,
    description text,
    is_system_role boolean NOT NULL DEFAULT false,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL
);
```

Example roles:

```text
SYSTEM_ADMIN
MANAGEMENT
PLANNING_HEAD
PRODUCTION_PLANNER
MERCHANDISER
PROCUREMENT_USER
FABRIC_QC_USER
CUTTING_MANAGER
SEWING_MANAGER
WASHING_MANAGER
FINISHING_MANAGER
QC_MANAGER
SHIPMENT_USER
IE_USER
SHOPFLOOR_SUPERVISOR
READ_ONLY_AUDITOR
```

### 5.2 permission_action

```sql
CREATE TABLE permission_action (
    id uuid PRIMARY KEY,
    code varchar(120) NOT NULL UNIQUE,
    module varchar(80) NOT NULL,
    action varchar(80) NOT NULL,
    description text,
    is_active boolean NOT NULL DEFAULT true
);
```

Examples:

```text
pcd.approve_conditional_release
planning.freeze_weekly_plan
release.override_blocked_release
quality.release_hold
shipment.mark_ready
line.approve_realignment
bulletin.approve
exception.close_critical
```

### 5.3 user_role

```sql
CREATE TABLE user_role (
    id uuid PRIMARY KEY,
    user_id integer NOT NULL REFERENCES auth_user(id),
    role_id uuid NOT NULL REFERENCES role(id),
    factory_id uuid,
    department_id uuid,
    is_primary boolean NOT NULL DEFAULT false,
    valid_from date,
    valid_to date,
    UNIQUE(user_id, role_id, factory_id, department_id)
);
```

### 5.4 role_permission

```sql
CREATE TABLE role_permission (
    id uuid PRIMARY KEY,
    role_id uuid NOT NULL REFERENCES role(id),
    permission_action_id uuid NOT NULL REFERENCES permission_action(id),
    UNIQUE(role_id, permission_action_id)
);
```

---

## 6. Organization Tables

### 6.1 factory

```sql
CREATE TABLE factory (
    id uuid PRIMARY KEY,
    code varchar(50) NOT NULL UNIQUE,
    name varchar(200) NOT NULL,
    location text,
    timezone varchar(80) NOT NULL DEFAULT 'Asia/Jakarta',
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL
);
```

### 6.2 department

```sql
CREATE TABLE department (
    id uuid PRIMARY KEY,
    factory_id uuid NOT NULL REFERENCES factory(id),
    code varchar(50) NOT NULL,
    name varchar(200) NOT NULL,
    department_type varchar(80) NOT NULL,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL,
    UNIQUE(factory_id, code)
);
```

Department types:

```text
MERCHANDISING
PROCUREMENT
FABRIC_QC
CUTTING
SEWING
WASHING
FINISHING
QC
PACKING
SHIPMENT
IE
PLANNING
MANAGEMENT
```

### 6.3 workcenter

```sql
CREATE TABLE workcenter (
    id uuid PRIMARY KEY,
    factory_id uuid NOT NULL REFERENCES factory(id),
    department_id uuid REFERENCES department(id),
    code varchar(80) NOT NULL,
    name varchar(200) NOT NULL,
    workcenter_type varchar(80) NOT NULL,
    capacity_unit varchar(30) NOT NULL,
    is_constraint_candidate boolean NOT NULL DEFAULT true,
    default_calendar_id uuid,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL,
    UNIQUE(factory_id, code)
);
```

Workcenter types:

```text
FABRIC_QC
CUTTING
SEWING_LINE
DRY_PROCESS
WET_WASH
DRYING
FINISHING
PACKING
FINAL_QC
SHIPMENT_DOCS
```

---

## 7. Calendar and Shift Tables

### 7.1 shift_calendar

```sql
CREATE TABLE shift_calendar (
    id uuid PRIMARY KEY,
    factory_id uuid NOT NULL REFERENCES factory(id),
    code varchar(80) NOT NULL,
    name varchar(150) NOT NULL,
    description text,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL,
    UNIQUE(factory_id, code)
);
```

### 7.2 shift_calendar_day

```sql
CREATE TABLE shift_calendar_day (
    id uuid PRIMARY KEY,
    calendar_id uuid NOT NULL REFERENCES shift_calendar(id),
    day_of_week integer NOT NULL,
    shift_name varchar(80) NOT NULL,
    start_time time NOT NULL,
    end_time time NOT NULL,
    break_minutes integer NOT NULL DEFAULT 0,
    working_minutes integer NOT NULL,
    overtime_allowed boolean NOT NULL DEFAULT false
);
```

### 7.3 factory_holiday

```sql
CREATE TABLE factory_holiday (
    id uuid PRIMARY KEY,
    factory_id uuid NOT NULL REFERENCES factory(id),
    holiday_date date NOT NULL,
    name varchar(150),
    is_working_day boolean NOT NULL DEFAULT false,
    remarks text,
    UNIQUE(factory_id, holiday_date)
);
```

---

# Part B: Customer, Style, Order, and Technical Data

---

## 8. Customer and Buyer

### 8.1 customer

```sql
CREATE TABLE customer (
    id uuid PRIMARY KEY,
    code varchar(80) NOT NULL UNIQUE,
    name varchar(250) NOT NULL,
    priority_level varchar(30),
    payment_terms varchar(100),
    default_aql_level varchar(50),
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL
);
```

### 8.2 buyer

```sql
CREATE TABLE buyer (
    id uuid PRIMARY KEY,
    customer_id uuid NOT NULL REFERENCES customer(id),
    code varchar(80) NOT NULL,
    name varchar(250) NOT NULL,
    contact_email varchar(254),
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL,
    UNIQUE(customer_id, code)
);
```

---

## 9. Style Master

### 9.1 style

```sql
CREATE TABLE style (
    id uuid PRIMARY KEY,
    style_code varchar(120) NOT NULL UNIQUE,
    customer_id uuid REFERENCES customer(id),
    buyer_id uuid REFERENCES buyer(id),
    product_type varchar(80) NOT NULL,
    description text,
    fit_type varchar(80),
    fabric_category varchar(80),
    wash_complexity varchar(50),
    sewing_complexity varchar(50),
    overall_complexity varchar(50),
    default_wash_route_id uuid,
    status varchar(30) NOT NULL DEFAULT 'DRAFT',
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL
);
```

Product types:

```text
DENIM_BOTTOM
CHINO
CARGO
JOGGER
SHORTS
OTHER_BOTTOM
```

### 9.2 style_version

Optional but recommended for controlled technical changes.

```sql
CREATE TABLE style_version (
    id uuid PRIMARY KEY,
    style_id uuid NOT NULL REFERENCES style(id),
    version varchar(30) NOT NULL,
    status varchar(30) NOT NULL,
    approved_by integer REFERENCES auth_user(id),
    approved_at timestamptz,
    remarks text,
    created_at timestamptz NOT NULL,
    UNIQUE(style_id, version)
);
```

---

## 10. Operation Master and Operation Bulletin

### 10.1 operation_master

```sql
CREATE TABLE operation_master (
    id uuid PRIMARY KEY,
    code varchar(100) NOT NULL UNIQUE,
    name varchar(250) NOT NULL,
    operation_group varchar(100) NOT NULL,
    default_machine_type varchar(100),
    default_skill_level varchar(50),
    default_qc_checkpoint boolean NOT NULL DEFAULT false,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL
);
```

Operation groups:

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

### 10.2 operation_bulletin

```sql
CREATE TABLE operation_bulletin (
    id uuid PRIMARY KEY,
    style_id uuid NOT NULL REFERENCES style(id),
    version varchar(30) NOT NULL,
    status varchar(30) NOT NULL DEFAULT 'DRAFT',
    total_smv decimal(10,3) NOT NULL DEFAULT 0,
    approved_by integer REFERENCES auth_user(id),
    approved_at timestamptz,
    effective_from date,
    effective_to date,
    remarks text,
    created_by integer REFERENCES auth_user(id),
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL,
    UNIQUE(style_id, version)
);
```

Statuses:

```text
DRAFT
UNDER_REVIEW
APPROVED
OBSOLETE
```

### 10.3 operation_bulletin_line

```sql
CREATE TABLE operation_bulletin_line (
    id uuid PRIMARY KEY,
    bulletin_id uuid NOT NULL REFERENCES operation_bulletin(id) ON DELETE CASCADE,
    sequence_no integer NOT NULL,
    operation_master_id uuid REFERENCES operation_master(id),
    operation_name varchar(250) NOT NULL,
    operation_group varchar(100) NOT NULL,
    machine_type varchar(100),
    attachment_required varchar(150),
    skill_level varchar(50),
    smv decimal(10,3) NOT NULL,
    target_pph decimal(10,2),
    qc_checkpoint boolean NOT NULL DEFAULT false,
    critical_operation boolean NOT NULL DEFAULT false,
    predecessor_sequence_no integer,
    parallel_allowed boolean NOT NULL DEFAULT false,
    rework_sensitive boolean NOT NULL DEFAULT false,
    remarks text,
    UNIQUE(bulletin_id, sequence_no)
);
```

---

## 11. BOM Tables

### 11.1 material_master

```sql
CREATE TABLE material_master (
    id uuid PRIMARY KEY,
    code varchar(120) NOT NULL UNIQUE,
    name varchar(250) NOT NULL,
    material_type varchar(80) NOT NULL,
    uom varchar(30) NOT NULL,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL
);
```

Material types:

```text
MAIN_FABRIC
POCKETING
LINING
THREAD
ZIPPER
BUTTON
RIVET
PATCH
LABEL
HANGTAG
POLYBAG
CARTON
STICKER
CHEMICAL
OTHER
```

### 11.2 bom_header

```sql
CREATE TABLE bom_header (
    id uuid PRIMARY KEY,
    style_id uuid NOT NULL REFERENCES style(id),
    version varchar(30) NOT NULL,
    status varchar(30) NOT NULL DEFAULT 'DRAFT',
    approved_by integer REFERENCES auth_user(id),
    approved_at timestamptz,
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL,
    UNIQUE(style_id, version)
);
```

### 11.3 bom_line

```sql
CREATE TABLE bom_line (
    id uuid PRIMARY KEY,
    bom_id uuid NOT NULL REFERENCES bom_header(id) ON DELETE CASCADE,
    material_id uuid NOT NULL REFERENCES material_master(id),
    consumption decimal(14,5) NOT NULL,
    wastage_percent decimal(6,2) NOT NULL DEFAULT 0,
    uom varchar(30) NOT NULL,
    required_stage varchar(80),
    nominated_vendor_required boolean NOT NULL DEFAULT false,
    remarks text
);
```

---

# Part C: Order and Procurement Data

---

## 12. Production Order

### 12.1 production_order

```sql
CREATE TABLE production_order (
    id uuid PRIMARY KEY,
    order_no varchar(120) NOT NULL UNIQUE,
    po_number varchar(120),
    customer_id uuid NOT NULL REFERENCES customer(id),
    buyer_id uuid REFERENCES buyer(id),
    style_id uuid NOT NULL REFERENCES style(id),
    factory_id uuid REFERENCES factory(id),
    product_type varchar(80) NOT NULL,
    order_qty integer NOT NULL,
    planned_ship_date date,
    committed_ship_date date NOT NULL,
    current_stage varchar(80) NOT NULL DEFAULT 'CREATED',
    lifecycle_status varchar(80) NOT NULL DEFAULT 'CREATED',
    risk_status varchar(20) NOT NULL DEFAULT 'GREEN',
    owner_id integer REFERENCES auth_user(id),
    order_status varchar(50) NOT NULL DEFAULT 'ACTIVE',
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL
);
```

### 12.2 order_size_color_breakup

```sql
CREATE TABLE order_size_color_breakup (
    id uuid PRIMARY KEY,
    order_id uuid NOT NULL REFERENCES production_order(id) ON DELETE CASCADE,
    size varchar(50) NOT NULL,
    color varchar(100) NOT NULL,
    qty integer NOT NULL
);
```

### 12.3 order_milestone

```sql
CREATE TABLE order_milestone (
    id uuid PRIMARY KEY,
    order_id uuid NOT NULL REFERENCES production_order(id) ON DELETE CASCADE,
    milestone_type varchar(80) NOT NULL,
    planned_date date,
    actual_date date,
    status varchar(50) NOT NULL DEFAULT 'PENDING',
    owner_id integer REFERENCES auth_user(id),
    delay_reason text,
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL
);
```

Milestone types:

```text
ORDER_CONFIRMED
FABRIC_PO_PLACED
FABRIC_RECEIVED
FABRIC_QC_COMPLETE
PCD
CUTTING_START
SEWING_START
WASH_START
FINISHING_START
PACKING_COMPLETE
FINAL_QC
SHIPMENT
```

---

## 13. Vendor and Procurement

### 13.1 vendor

```sql
CREATE TABLE vendor (
    id uuid PRIMARY KEY,
    code varchar(120) NOT NULL UNIQUE,
    name varchar(250) NOT NULL,
    vendor_type varchar(80) NOT NULL,
    nominated boolean NOT NULL DEFAULT false,
    standard_lead_time_days integer,
    reliability_score decimal(5,2),
    contact_name varchar(150),
    contact_email varchar(254),
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL
);
```

### 13.2 material_requirement

```sql
CREATE TABLE material_requirement (
    id uuid PRIMARY KEY,
    order_id uuid NOT NULL REFERENCES production_order(id),
    material_id uuid NOT NULL REFERENCES material_master(id),
    required_qty decimal(14,3) NOT NULL,
    required_date date,
    required_stage varchar(80),
    status varchar(50) NOT NULL DEFAULT 'OPEN',
    shortage_qty decimal(14,3) NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL
);
```

### 13.3 material_po

```sql
CREATE TABLE material_po (
    id uuid PRIMARY KEY,
    po_no varchar(120) NOT NULL UNIQUE,
    vendor_id uuid NOT NULL REFERENCES vendor(id),
    order_id uuid REFERENCES production_order(id),
    material_id uuid NOT NULL REFERENCES material_master(id),
    ordered_qty decimal(14,3) NOT NULL,
    acknowledged_qty decimal(14,3),
    expected_arrival_date date,
    revised_eta date,
    actual_arrival_date date,
    status varchar(50) NOT NULL DEFAULT 'OPEN',
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL
);
```

---

# Part D: Fabric Inward and Fabric QC

---

## 14. Fabric Lot and Roll

### 14.1 fabric_lot

```sql
CREATE TABLE fabric_lot (
    id uuid PRIMARY KEY,
    order_id uuid REFERENCES production_order(id),
    material_po_id uuid REFERENCES material_po(id),
    lot_no varchar(120) NOT NULL,
    shade_lot varchar(120),
    received_qty decimal(14,3) NOT NULL,
    received_date date NOT NULL,
    status varchar(50) NOT NULL DEFAULT 'RECEIVED',
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL
);
```

### 14.2 fabric_roll

```sql
CREATE TABLE fabric_roll (
    id uuid PRIMARY KEY,
    fabric_lot_id uuid NOT NULL REFERENCES fabric_lot(id) ON DELETE CASCADE,
    roll_no varchar(120) NOT NULL,
    roll_length decimal(14,3) NOT NULL,
    width decimal(8,2),
    gsm decimal(8,2),
    shade varchar(120),
    qc_status varchar(50) NOT NULL DEFAULT 'PENDING',
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL,
    UNIQUE(fabric_lot_id, roll_no)
);
```

### 14.3 fabric_qc_inspection

```sql
CREATE TABLE fabric_qc_inspection (
    id uuid PRIMARY KEY,
    fabric_roll_id uuid NOT NULL REFERENCES fabric_roll(id),
    inspection_date date NOT NULL,
    four_point_score decimal(8,2),
    width_result decimal(8,2),
    gsm_result decimal(8,2),
    shrinkage_percent decimal(6,2),
    skewing_result varchar(80),
    bowing_result varchar(80),
    stretch_recovery_result varchar(80),
    colorfastness_result varchar(80),
    crocking_result varchar(80),
    status varchar(50) NOT NULL,
    inspected_by integer REFERENCES auth_user(id),
    remarks text,
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL
);
```

Fabric QC status:

```text
PENDING
PASSED
FAILED
HOLD
WAIVED
```

---

# Part E: PCD Readiness and Production Release

---

## 15. PCD Readiness

### 15.1 pcd_readiness

```sql
CREATE TABLE pcd_readiness (
    id uuid PRIMARY KEY,
    order_id uuid NOT NULL UNIQUE REFERENCES production_order(id),
    planned_pcd_date date NOT NULL,
    readiness_status varchar(50) NOT NULL DEFAULT 'IN_REVIEW',
    conditional_release boolean NOT NULL DEFAULT false,
    conditional_release_reason text,
    conditional_release_expiry date,
    approved_by integer REFERENCES auth_user(id),
    approved_at timestamptz,
    released_to_cutting_at timestamptz,
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL
);
```

Readiness statuses:

```text
IN_REVIEW
READY
CONDITIONALLY_READY
BLOCKED
ESCALATED
RELEASED
```

### 15.2 pcd_readiness_item

```sql
CREATE TABLE pcd_readiness_item (
    id uuid PRIMARY KEY,
    pcd_readiness_id uuid NOT NULL REFERENCES pcd_readiness(id) ON DELETE CASCADE,
    item_code varchar(120) NOT NULL,
    item_label varchar(250) NOT NULL,
    is_mandatory boolean NOT NULL DEFAULT true,
    status varchar(50) NOT NULL DEFAULT 'PENDING',
    owner_id integer REFERENCES auth_user(id),
    due_date date,
    waiver_reason text,
    evidence_url text,
    remarks text,
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL,
    UNIQUE(pcd_readiness_id, item_code)
);
```

Checklist item codes:

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

---

## 16. Production Release

### 16.1 production_release

```sql
CREATE TABLE production_release (
    id uuid PRIMARY KEY,
    order_id uuid NOT NULL REFERENCES production_order(id),
    release_type varchar(80) NOT NULL,
    workcenter_id uuid REFERENCES workcenter(id),
    line_id uuid,
    release_date date NOT NULL,
    release_qty integer NOT NULL,
    status varchar(50) NOT NULL DEFAULT 'DRAFT',
    released_by integer REFERENCES auth_user(id),
    released_at timestamptz,
    exception_release boolean NOT NULL DEFAULT false,
    exception_reason text,
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL
);
```

Release types:

```text
CUTTING
SEWING
WASH
FINISHING
PACKING
SHIPMENT
```

Statuses:

```text
DRAFT
VALIDATED
BLOCKED
RELEASED
IN_PROGRESS
COMPLETED
CANCELLED
```

### 16.2 release_validation_item

```sql
CREATE TABLE release_validation_item (
    id uuid PRIMARY KEY,
    release_id uuid NOT NULL REFERENCES production_release(id) ON DELETE CASCADE,
    item_code varchar(120) NOT NULL,
    item_label varchar(250) NOT NULL,
    status varchar(50) NOT NULL,
    reason text,
    owner_id integer REFERENCES auth_user(id),
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL
);
```

---

# Part F: Planning and Workcenter Load

---

## 17. Plan Version

### 17.1 plan_version

```sql
CREATE TABLE plan_version (
    id uuid PRIMARY KEY,
    factory_id uuid NOT NULL REFERENCES factory(id),
    plan_type varchar(80) NOT NULL,
    horizon_start date NOT NULL,
    horizon_end date NOT NULL,
    status varchar(50) NOT NULL DEFAULT 'DRAFT',
    frozen_at timestamptz,
    frozen_by integer REFERENCES auth_user(id),
    activated_at timestamptz,
    superseded_by uuid,
    created_by integer REFERENCES auth_user(id),
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL
);
```

Plan types:

```text
MASTER
WEEKLY
DAILY
RECOVERY
```

Plan statuses:

```text
DRAFT
UNDER_REVIEW
FROZEN
ACTIVE
SUPERSEDED
ARCHIVED
```

### 17.2 planned_work_item

```sql
CREATE TABLE planned_work_item (
    id uuid PRIMARY KEY,
    plan_version_id uuid NOT NULL REFERENCES plan_version(id) ON DELETE CASCADE,
    order_id uuid NOT NULL REFERENCES production_order(id),
    workcenter_id uuid NOT NULL REFERENCES workcenter(id),
    line_id uuid,
    planned_start timestamptz NOT NULL,
    planned_end timestamptz NOT NULL,
    planned_qty integer NOT NULL,
    planned_load_minutes integer NOT NULL,
    status varchar(50) NOT NULL DEFAULT 'PLANNED',
    risk_status varchar(20) NOT NULL DEFAULT 'GREEN',
    remarks text,
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL
);
```

### 17.3 plan_change_request

```sql
CREATE TABLE plan_change_request (
    id uuid PRIMARY KEY,
    plan_version_id uuid NOT NULL REFERENCES plan_version(id),
    requested_by integer NOT NULL REFERENCES auth_user(id),
    change_reason varchar(150) NOT NULL,
    change_description text,
    impact_summary jsonb,
    status varchar(50) NOT NULL DEFAULT 'REQUESTED',
    approved_by integer REFERENCES auth_user(id),
    approved_at timestamptz,
    rejected_reason text,
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL
);
```

---

## 18. Workcenter Capacity Snapshot

Although workcenter capacity can be calculated on the fly, daily snapshots are recommended.

### 18.1 workcenter_capacity_day

```sql
CREATE TABLE workcenter_capacity_day (
    id uuid PRIMARY KEY,
    workcenter_id uuid NOT NULL REFERENCES workcenter(id),
    capacity_date date NOT NULL,
    available_minutes integer NOT NULL,
    available_qty decimal(14,3),
    planned_load_minutes integer NOT NULL DEFAULT 0,
    actual_load_minutes integer NOT NULL DEFAULT 0,
    utilization_percent decimal(6,2),
    constraint_status varchar(50),
    calculated_at timestamptz NOT NULL,
    UNIQUE(workcenter_id, capacity_date)
);
```

---

# Part G: Line, Machine, Skill, Sewing

---

## 19. Machine and Line

### 19.1 machine

```sql
CREATE TABLE machine (
    id uuid PRIMARY KEY,
    factory_id uuid NOT NULL REFERENCES factory(id),
    machine_code varchar(120) NOT NULL UNIQUE,
    machine_type varchar(100) NOT NULL,
    brand varchar(100),
    model varchar(100),
    status varchar(50) NOT NULL DEFAULT 'AVAILABLE',
    current_line_id uuid,
    maintenance_status varchar(50),
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL
);
```

### 19.2 production_line

```sql
CREATE TABLE production_line (
    id uuid PRIMARY KEY,
    factory_id uuid NOT NULL REFERENCES factory(id),
    line_code varchar(80) NOT NULL,
    name varchar(150) NOT NULL,
    line_type varchar(80) NOT NULL,
    supervisor_id integer REFERENCES auth_user(id),
    standard_manpower integer NOT NULL DEFAULT 0,
    current_manpower integer NOT NULL DEFAULT 0,
    baseline_efficiency decimal(6,2),
    net_good_output_baseline integer,
    shift_calendar_id uuid REFERENCES shift_calendar(id),
    status varchar(50) NOT NULL DEFAULT 'ACTIVE',
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL,
    UNIQUE(factory_id, line_code)
);
```

### 19.3 line_machine_assignment

```sql
CREATE TABLE line_machine_assignment (
    id uuid PRIMARY KEY,
    line_id uuid NOT NULL REFERENCES production_line(id),
    machine_id uuid NOT NULL REFERENCES machine(id),
    assigned_from date NOT NULL,
    assigned_to date,
    assigned_by integer REFERENCES auth_user(id),
    remarks text,
    created_at timestamptz NOT NULL
);
```

---

## 20. Operator Skill

### 20.1 operator_skill

```sql
CREATE TABLE operator_skill (
    id uuid PRIMARY KEY,
    user_id integer NOT NULL REFERENCES auth_user(id),
    operation_master_id uuid NOT NULL REFERENCES operation_master(id),
    skill_level varchar(50) NOT NULL,
    efficiency_rating decimal(6,2),
    quality_rating decimal(6,2),
    last_review_date date,
    reviewed_by integer REFERENCES auth_user(id),
    training_required boolean NOT NULL DEFAULT false,
    remarks text,
    UNIQUE(user_id, operation_master_id)
);
```

---

## 21. Sewing Planning and Output

### 21.1 sewing_line_loading

```sql
CREATE TABLE sewing_line_loading (
    id uuid PRIMARY KEY,
    order_id uuid NOT NULL REFERENCES production_order(id),
    line_id uuid NOT NULL REFERENCES production_line(id),
    bulletin_id uuid REFERENCES operation_bulletin(id),
    planned_start date NOT NULL,
    planned_end date NOT NULL,
    planned_qty integer NOT NULL,
    daily_target integer,
    target_efficiency decimal(6,2),
    expected_defect_rate decimal(6,2),
    status varchar(50) NOT NULL DEFAULT 'PLANNED',
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL
);
```

### 21.2 sewing_output_entry

```sql
CREATE TABLE sewing_output_entry (
    id uuid PRIMARY KEY,
    order_id uuid NOT NULL REFERENCES production_order(id),
    line_id uuid NOT NULL REFERENCES production_line(id),
    entry_time timestamptz NOT NULL,
    time_slot varchar(50),
    gross_qty integer NOT NULL DEFAULT 0,
    defect_qty integer NOT NULL DEFAULT 0,
    rework_qty integer NOT NULL DEFAULT 0,
    net_good_qty integer NOT NULL DEFAULT 0,
    entered_by integer NOT NULL REFERENCES auth_user(id),
    source varchar(50) NOT NULL DEFAULT 'WEB',
    remarks text,
    created_at timestamptz NOT NULL
);
```

### 21.3 line_realignment

```sql
CREATE TABLE line_realignment (
    id uuid PRIMARY KEY,
    line_id uuid NOT NULL REFERENCES production_line(id),
    style_id uuid NOT NULL REFERENCES style(id),
    bulletin_id uuid NOT NULL REFERENCES operation_bulletin(id),
    target_qty integer,
    expected_output_before integer,
    expected_output_after integer,
    changeover_minutes integer,
    status varchar(50) NOT NULL DEFAULT 'PROPOSED',
    proposed_by integer REFERENCES auth_user(id),
    approved_by integer REFERENCES auth_user(id),
    approved_at timestamptz,
    gap_summary jsonb,
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL
);
```

### 21.4 line_balance_plan

```sql
CREATE TABLE line_balance_plan (
    id uuid PRIMARY KEY,
    line_id uuid NOT NULL REFERENCES production_line(id),
    order_id uuid REFERENCES production_order(id),
    bulletin_id uuid NOT NULL REFERENCES operation_bulletin(id),
    version varchar(30) NOT NULL,
    target_output integer NOT NULL,
    takt_time decimal(10,3),
    balance_efficiency decimal(6,2),
    bottleneck_operation varchar(250),
    status varchar(50) NOT NULL DEFAULT 'DRAFT',
    approved_by integer REFERENCES auth_user(id),
    approved_at timestamptz,
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL
);
```

### 21.5 line_balance_operation

```sql
CREATE TABLE line_balance_operation (
    id uuid PRIMARY KEY,
    line_balance_plan_id uuid NOT NULL REFERENCES line_balance_plan(id) ON DELETE CASCADE,
    operation_bulletin_line_id uuid NOT NULL REFERENCES operation_bulletin_line(id),
    workstation_no integer,
    assigned_operator_id integer REFERENCES auth_user(id),
    assigned_machine_id uuid REFERENCES machine(id),
    allocated_smv decimal(10,3),
    load_percent decimal(6,2),
    is_bottleneck boolean NOT NULL DEFAULT false
);
```

---

# Part H: Wash Planning and Execution

---

## 22. Wash Route and Batch

### 22.1 wash_route

```sql
CREATE TABLE wash_route (
    id uuid PRIMARY KEY,
    code varchar(120) NOT NULL UNIQUE,
    name varchar(250) NOT NULL,
    description text,
    complexity_rating varchar(50),
    rewash_allowed boolean NOT NULL DEFAULT true,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL
);
```

### 22.2 wash_route_step

```sql
CREATE TABLE wash_route_step (
    id uuid PRIMARY KEY,
    wash_route_id uuid NOT NULL REFERENCES wash_route(id) ON DELETE CASCADE,
    sequence_no integer NOT NULL,
    step_type varchar(80) NOT NULL,
    step_name varchar(200) NOT NULL,
    standard_minutes integer NOT NULL,
    machine_type varchar(100),
    requires_qc boolean NOT NULL DEFAULT false,
    remarks text,
    UNIQUE(wash_route_id, sequence_no)
);
```

Step types:

```text
DRY_PROCESS
WET_WASH
CHEMICAL
DRYING
QC
SOFTENER
REWASH
TOUCH_UP
```

### 22.3 wash_batch

```sql
CREATE TABLE wash_batch (
    id uuid PRIMARY KEY,
    batch_no varchar(120) NOT NULL UNIQUE,
    order_id uuid NOT NULL REFERENCES production_order(id),
    wash_route_id uuid NOT NULL REFERENCES wash_route(id),
    shade_lot varchar(120),
    qty integer NOT NULL,
    current_step_id uuid REFERENCES wash_route_step(id),
    status varchar(50) NOT NULL DEFAULT 'CREATED',
    planned_start timestamptz,
    planned_end timestamptz,
    actual_start timestamptz,
    actual_end timestamptz,
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL
);
```

Wash batch statuses:

```text
CREATED
QUEUED
IN_PROCESS
HELD
POST_WASH_QC
REWASH_REQUIRED
RELEASED_TO_FINISHING
CLOSED
```

### 22.4 wash_batch_event

```sql
CREATE TABLE wash_batch_event (
    id uuid PRIMARY KEY,
    wash_batch_id uuid NOT NULL REFERENCES wash_batch(id) ON DELETE CASCADE,
    step_id uuid REFERENCES wash_route_step(id),
    event_type varchar(80) NOT NULL,
    event_time timestamptz NOT NULL,
    qty integer,
    result_status varchar(50),
    reason varchar(150),
    remarks text,
    entered_by integer REFERENCES auth_user(id),
    created_at timestamptz NOT NULL
);
```

---

# Part I: WIP Inventory and Movement

---

## 23. WIP Item

### 23.1 wip_item

```sql
CREATE TABLE wip_item (
    id uuid PRIMARY KEY,
    order_id uuid NOT NULL REFERENCES production_order(id),
    style_id uuid REFERENCES style(id),
    stage varchar(100) NOT NULL,
    qty integer NOT NULL,
    status varchar(50) NOT NULL DEFAULT 'WAITING',
    hold_reason varchar(150),
    owner_id integer REFERENCES auth_user(id),
    entered_stage_at timestamptz NOT NULL,
    next_process varchar(100),
    batch_or_bundle_ref varchar(150),
    shade_lot varchar(120),
    shipment_risk varchar(20),
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL
);
```

WIP stages:

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

### 23.2 wip_movement

```sql
CREATE TABLE wip_movement (
    id uuid PRIMARY KEY,
    wip_item_id uuid REFERENCES wip_item(id),
    order_id uuid NOT NULL REFERENCES production_order(id),
    from_stage varchar(100),
    to_stage varchar(100) NOT NULL,
    qty integer NOT NULL,
    moved_at timestamptz NOT NULL,
    moved_by integer REFERENCES auth_user(id),
    movement_reason varchar(150),
    remarks text,
    created_at timestamptz NOT NULL
);
```

---

# Part J: QC, Rework, Exception, Shipment

---

## 24. Quality Tables

### 24.1 qc_inspection

```sql
CREATE TABLE qc_inspection (
    id uuid PRIMARY KEY,
    order_id uuid NOT NULL REFERENCES production_order(id),
    stage varchar(100) NOT NULL,
    workcenter_id uuid REFERENCES workcenter(id),
    line_id uuid REFERENCES production_line(id),
    checked_qty integer NOT NULL,
    passed_qty integer NOT NULL,
    defect_qty integer NOT NULL,
    status varchar(50) NOT NULL,
    inspected_by integer REFERENCES auth_user(id),
    inspected_at timestamptz NOT NULL,
    remarks text,
    created_at timestamptz NOT NULL
);
```

QC stages:

```text
FABRIC_QC
CUT_PANEL_QC
INLINE_QC
END_LINE_QC
PRE_WASH_QC
POST_WASH_QC
FINISHING_QC
FINAL_QC
AQL
```

### 24.2 defect_code

```sql
CREATE TABLE defect_code (
    id uuid PRIMARY KEY,
    code varchar(120) NOT NULL UNIQUE,
    name varchar(200) NOT NULL,
    defect_category varchar(100),
    default_severity varchar(30),
    is_active boolean NOT NULL DEFAULT true
);
```

### 24.3 qc_defect

```sql
CREATE TABLE qc_defect (
    id uuid PRIMARY KEY,
    qc_inspection_id uuid NOT NULL REFERENCES qc_inspection(id) ON DELETE CASCADE,
    defect_code_id uuid REFERENCES defect_code(id),
    defect_description text,
    severity varchar(30),
    qty integer NOT NULL,
    responsible_process varchar(100),
    photo_url text,
    remarks text
);
```

---

## 25. Rework

### 25.1 rework_order

```sql
CREATE TABLE rework_order (
    id uuid PRIMARY KEY,
    order_id uuid NOT NULL REFERENCES production_order(id),
    rework_type varchar(100) NOT NULL,
    qty integer NOT NULL,
    responsible_process varchar(100),
    status varchar(50) NOT NULL DEFAULT 'CREATED',
    owner_id integer REFERENCES auth_user(id),
    expected_completion timestamptz,
    completed_at timestamptz,
    remarks text,
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL
);
```

Rework types:

```text
SEWING_REPAIR
WASH_REWORK
DRY_PROCESS_TOUCHUP
MEASUREMENT_CORRECTION
FINISHING_REPAIR
PACKING_CORRECTION
```

---

## 26. Exception Management

### 26.1 exception_record

```sql
CREATE TABLE exception_record (
    id uuid PRIMARY KEY,
    exception_no varchar(120) NOT NULL UNIQUE,
    order_id uuid REFERENCES production_order(id),
    category varchar(100) NOT NULL,
    severity varchar(20) NOT NULL,
    stage varchar(100),
    description text NOT NULL,
    owner_id integer REFERENCES auth_user(id),
    due_date date,
    status varchar(50) NOT NULL DEFAULT 'OPEN',
    suggested_action text,
    escalation_level varchar(50),
    closed_by integer REFERENCES auth_user(id),
    closed_at timestamptz,
    closure_note text,
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL
);
```

Categories:

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

### 26.2 exception_comment

```sql
CREATE TABLE exception_comment (
    id uuid PRIMARY KEY,
    exception_id uuid NOT NULL REFERENCES exception_record(id) ON DELETE CASCADE,
    comment text NOT NULL,
    created_by integer REFERENCES auth_user(id),
    created_at timestamptz NOT NULL
);
```

### 26.3 recovery_action

```sql
CREATE TABLE recovery_action (
    id uuid PRIMARY KEY,
    exception_id uuid REFERENCES exception_record(id),
    order_id uuid REFERENCES production_order(id),
    action_type varchar(100) NOT NULL,
    description text,
    owner_id integer REFERENCES auth_user(id),
    target_date date,
    status varchar(50) NOT NULL DEFAULT 'OPEN',
    capacity_impact jsonb,
    shipment_impact jsonb,
    completed_at timestamptz,
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL
);
```

---

## 27. Shipment Readiness

### 27.1 shipment_readiness

```sql
CREATE TABLE shipment_readiness (
    id uuid PRIMARY KEY,
    order_id uuid NOT NULL UNIQUE REFERENCES production_order(id),
    shipment_date date NOT NULL,
    finished_qty integer NOT NULL DEFAULT 0,
    packed_qty integer NOT NULL DEFAULT 0,
    short_qty integer NOT NULL DEFAULT 0,
    final_qc_status varchar(50) NOT NULL DEFAULT 'PENDING',
    aql_status varchar(50) NOT NULL DEFAULT 'PENDING',
    documentation_status varchar(50) NOT NULL DEFAULT 'PENDING',
    forwarder_booking_status varchar(50) NOT NULL DEFAULT 'PENDING',
    readiness_status varchar(50) NOT NULL DEFAULT 'NOT_READY',
    marked_ready_by integer REFERENCES auth_user(id),
    marked_ready_at timestamptz,
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL
);
```

### 27.2 shipment_readiness_item

```sql
CREATE TABLE shipment_readiness_item (
    id uuid PRIMARY KEY,
    shipment_readiness_id uuid NOT NULL REFERENCES shipment_readiness(id) ON DELETE CASCADE,
    item_code varchar(120) NOT NULL,
    item_label varchar(250) NOT NULL,
    is_mandatory boolean NOT NULL DEFAULT true,
    status varchar(50) NOT NULL DEFAULT 'PENDING',
    owner_id integer REFERENCES auth_user(id),
    due_date date,
    remarks text,
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL,
    UNIQUE(shipment_readiness_id, item_code)
);
```

Checklist items:

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

---

# Part K: Shopfloor Events, Downtime, Handover

---

## 28. Downtime Event

```sql
CREATE TABLE downtime_event (
    id uuid PRIMARY KEY,
    workcenter_id uuid NOT NULL REFERENCES workcenter(id),
    line_id uuid REFERENCES production_line(id),
    order_id uuid REFERENCES production_order(id),
    event_type varchar(100) NOT NULL,
    start_time timestamptz NOT NULL,
    expected_duration_minutes integer,
    actual_duration_minutes integer,
    capacity_impact_qty integer,
    owner_id integer REFERENCES auth_user(id),
    status varchar(50) NOT NULL DEFAULT 'OPEN',
    remarks text,
    created_by integer REFERENCES auth_user(id),
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL
);
```

Event types:

```text
MACHINE_BREAKDOWN
OPERATOR_ABSENT
MATERIAL_SHORTAGE
TRIM_SHORTAGE
QUALITY_HOLD
POWER_ISSUE
WASH_MACHINE_DELAY
CHEMICAL_SHORTAGE
NO_INPUT_WIP
CHANGEOVER_DELAY
OTHER
```

---

## 29. Department Handover

```sql
CREATE TABLE department_handover (
    id uuid PRIMARY KEY,
    order_id uuid NOT NULL REFERENCES production_order(id),
    from_department_id uuid REFERENCES department(id),
    to_department_id uuid REFERENCES department(id),
    from_stage varchar(100),
    to_stage varchar(100),
    qty integer NOT NULL,
    batch_or_bundle_refs jsonb,
    qc_status varchar(50),
    open_issues text,
    handed_over_by integer REFERENCES auth_user(id),
    accepted_by integer REFERENCES auth_user(id),
    handed_over_at timestamptz NOT NULL,
    accepted_at timestamptz,
    status varchar(50) NOT NULL DEFAULT 'PENDING_ACCEPTANCE',
    remarks text,
    created_at timestamptz NOT NULL
);
```

---

## 30. Andon Issue

```sql
CREATE TABLE andon_issue (
    id uuid PRIMARY KEY,
    issue_no varchar(120) NOT NULL UNIQUE,
    workcenter_id uuid REFERENCES workcenter(id),
    line_id uuid REFERENCES production_line(id),
    order_id uuid REFERENCES production_order(id),
    issue_type varchar(100) NOT NULL,
    urgency varchar(30) NOT NULL,
    description text,
    photo_url text,
    status varchar(50) NOT NULL DEFAULT 'OPEN',
    owner_id integer REFERENCES auth_user(id),
    raised_by integer REFERENCES auth_user(id),
    raised_at timestamptz NOT NULL,
    resolved_at timestamptz,
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL
);
```

---

# Part L: Audit, Configuration, Analytics Snapshots

---

## 31. Audit Event

```sql
CREATE TABLE audit_event (
    id uuid PRIMARY KEY,
    entity_type varchar(120) NOT NULL,
    entity_id uuid,
    action varchar(120) NOT NULL,
    old_value jsonb,
    new_value jsonb,
    reason text,
    source varchar(80),
    performed_by integer REFERENCES auth_user(id),
    performed_at timestamptz NOT NULL
);
```

---

## 32. Threshold Configuration

```sql
CREATE TABLE planning_threshold (
    id uuid PRIMARY KEY,
    threshold_code varchar(120) NOT NULL UNIQUE,
    threshold_name varchar(200) NOT NULL,
    module varchar(100) NOT NULL,
    threshold_value decimal(14,3) NOT NULL,
    unit varchar(50),
    severity varchar(30),
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL
);
```

Examples:

```text
WIP_SEWN_WAITING_WASH_CRITICAL_HOURS
WORKCENTER_OVERLOAD_RED_PERCENT
SHIPMENT_BUFFER_RED_HOURS
PCD_BLOCKER_ESCALATION_DAYS
LINE_EFFICIENCY_LOW_PERCENT
```

---

## 33. Snapshot Tables

### 33.1 daily_order_status_snapshot

```sql
CREATE TABLE daily_order_status_snapshot (
    id uuid PRIMARY KEY,
    snapshot_date date NOT NULL,
    order_id uuid NOT NULL REFERENCES production_order(id),
    current_stage varchar(100),
    risk_status varchar(20),
    open_exception_count integer,
    wip_qty integer,
    shipment_readiness_status varchar(50),
    calculated_at timestamptz NOT NULL,
    UNIQUE(snapshot_date, order_id)
);
```

### 33.2 daily_workcenter_load_snapshot

```sql
CREATE TABLE daily_workcenter_load_snapshot (
    id uuid PRIMARY KEY,
    snapshot_date date NOT NULL,
    workcenter_id uuid NOT NULL REFERENCES workcenter(id),
    available_capacity decimal(14,3),
    planned_load decimal(14,3),
    actual_load decimal(14,3),
    utilization_percent decimal(6,2),
    queue_qty integer,
    oldest_wip_age_hours decimal(10,2),
    constraint_status varchar(50),
    calculated_at timestamptz NOT NULL,
    UNIQUE(snapshot_date, workcenter_id)
);
```

### 33.3 daily_line_efficiency_snapshot

```sql
CREATE TABLE daily_line_efficiency_snapshot (
    id uuid PRIMARY KEY,
    snapshot_date date NOT NULL,
    line_id uuid NOT NULL REFERENCES production_line(id),
    order_id uuid REFERENCES production_order(id),
    gross_output integer,
    defect_qty integer,
    rework_qty integer,
    net_good_output integer,
    efficiency_percent decimal(6,2),
    utilization_percent decimal(6,2),
    calculated_at timestamptz NOT NULL
);
```

### 33.4 daily_wip_pipeline_snapshot

```sql
CREATE TABLE daily_wip_pipeline_snapshot (
    id uuid PRIMARY KEY,
    snapshot_date date NOT NULL,
    stage varchar(100) NOT NULL,
    order_id uuid REFERENCES production_order(id),
    qty integer,
    ageing_hours decimal(10,2),
    risk_status varchar(20),
    calculated_at timestamptz NOT NULL
);
```

### 33.5 daily_exception_snapshot

```sql
CREATE TABLE daily_exception_snapshot (
    id uuid PRIMARY KEY,
    snapshot_date date NOT NULL,
    category varchar(100),
    severity varchar(20),
    status varchar(50),
    owner_id integer REFERENCES auth_user(id),
    count integer,
    calculated_at timestamptz NOT NULL
);
```

---

# Part M: Indexing and Performance

---

## 34. Mandatory Indexes

Create indexes on:

```sql
CREATE INDEX idx_production_order_stage ON production_order(current_stage);
CREATE INDEX idx_production_order_risk ON production_order(risk_status);
CREATE INDEX idx_production_order_ship_date ON production_order(committed_ship_date);
CREATE INDEX idx_production_order_customer ON production_order(customer_id);

CREATE INDEX idx_order_milestone_order ON order_milestone(order_id);
CREATE INDEX idx_pcd_status ON pcd_readiness(readiness_status);
CREATE INDEX idx_pcd_planned_date ON pcd_readiness(planned_pcd_date);

CREATE INDEX idx_planned_work_item_workcenter_time ON planned_work_item(workcenter_id, planned_start, planned_end);
CREATE INDEX idx_planned_work_item_order ON planned_work_item(order_id);

CREATE INDEX idx_release_order ON production_release(order_id);
CREATE INDEX idx_release_date ON production_release(release_date);

CREATE INDEX idx_sewing_output_line_time ON sewing_output_entry(line_id, entry_time);
CREATE INDEX idx_sewing_output_order ON sewing_output_entry(order_id);

CREATE INDEX idx_wash_batch_status ON wash_batch(status);
CREATE INDEX idx_wash_batch_order ON wash_batch(order_id);
CREATE INDEX idx_wash_batch_planned ON wash_batch(planned_start, planned_end);

CREATE INDEX idx_wip_stage_status ON wip_item(stage, status);
CREATE INDEX idx_wip_order ON wip_item(order_id);
CREATE INDEX idx_wip_entered_stage ON wip_item(entered_stage_at);

CREATE INDEX idx_exception_status_severity ON exception_record(status, severity);
CREATE INDEX idx_exception_owner ON exception_record(owner_id);
CREATE INDEX idx_exception_order ON exception_record(order_id);

CREATE INDEX idx_shipment_readiness_status ON shipment_readiness(readiness_status);
CREATE INDEX idx_shipment_date ON shipment_readiness(shipment_date);
```

---

## 35. High-Volume Table Notes

High-volume tables:

```text
sewing_output_entry
wip_movement
wash_batch_event
audit_event
qc_defect
daily snapshots
```

Recommendations:

```text
partition later by date if needed
avoid unbounded frontend queries
use pagination
use aggregate snapshots for dashboards
```

---

# Part N: Django Implementation Notes

---

## 36. Django Model Recommendations

### 36.1 Base Model

Create an abstract base model:

```python
class TimeStampedModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
```

### 36.2 Status Choices

Use enums:

```python
class RiskStatus(models.TextChoices):
    GREEN = "GREEN"
    YELLOW = "YELLOW"
    RED = "RED"
    BLACK = "BLACK"
```

### 36.3 Service Layer

Do not implement planning logic inside model `save()` unless unavoidable.

Preferred:

```text
services.py
selectors.py
serializers.py
views.py
permissions.py
```

### 36.4 Admin

Admin should support:

```text
search
filters
inline child records
read-only audit fields
import/export for controlled masters
approval status
```

---

## 37. Migration Strategy

Implementation order:

```text
identity and organization
customer/style/order
technical masters
line/machine/skill
materials and fabric
PCD readiness
planning/release
sewing/wash
WIP
QC/rework/exceptions
shipment
audit/snapshots
```

Avoid creating all tables at once without module tests.

---

## 38. Data Retention

Suggested retention:

| Data | Retention |
|---|---|
| Order data | 7+ years |
| Audit events | 5+ years |
| Production events | 3+ years |
| Mobile raw events | 2+ years |
| Daily snapshots | 5+ years |
| Import logs | 2+ years |

---

## 39. Open Design Decisions

Before implementation, confirm:

```text
UUID vs bigserial globally
whether Django auth_user remains integer
whether multi-factory deployment is required in MVP
whether FastReact integration is in MVP
which fields are mandatory in seed data
whether operation-level WIP is required in MVP
whether fabric is tracked by meter, roll, or garment equivalent in MVP
whether packed goods and finished goods need inventory valuation
```

---

## 40. Summary

This schema specification provides the core PostgreSQL/Django data model for the Eratex Planning & Scheduling Platform.

The model is designed to support:

```text
large-scale garment planning
operation bulletin and line routing
PCD readiness
capacity planning
daily production release
live shopfloor capture
wash planning and rewash
pipeline WIP inventory
QC and rework
exception management
shipment readiness
audit and analytics
```

The schema should be implemented module by module, with migrations, admin configuration, APIs, service logic, and tests created together for each domain.
