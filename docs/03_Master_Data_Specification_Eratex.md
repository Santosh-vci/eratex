# 03. Master Data Specification  
# Eratex End-to-End Planning & Scheduling Platform

**Company:** Eratex  
**Product:** Planning & Scheduling Tool for Denim Bottoms + Chinos Manufacturing  
**Document Type:** Master Data Specification  
**Version:** 2.0  
**Date:** 2026-05-26  
**Backend Stack Context:** Django + Django Admin + PostgreSQL  
**Frontend Context:** React/Next.js Planning Workbenches + PWA Shopfloor Capture  

---

## 1. Purpose

This document defines the master data required to build and operate the Eratex Planning & Scheduling Platform.

The planning system will only work if its master data is clean, owned, approved, and version-controlled where required. In garment manufacturing, especially denim bottoms and chinos, planning accuracy depends heavily on master data such as:

```text
style technical data
BOM
operation bulletin
SMV/SAM
line master
machine master
operator skill matrix
workcenter capacity
shift calendar
fabric master
wash route
vendor lead time
quality defect codes
shipment readiness rules
planning thresholds
```

If this master data is weak, the system will simply digitize bad planning assumptions and users will continue depending on Excel and manual judgement.

---

## 2. Master Data Thesis

The core master data principle is:

```text
No serious planning without validated master data.
```

The system must enforce the following:

```text
No order planning without approved style master.
No material planning without approved BOM.
No sewing line loading without approved operation bulletin.
No realistic capacity without line, machine, shift, and efficiency data.
No wash planning without approved wash route.
No PCD readiness without fabric, trim, pattern, marker, wash, and QC checklist masters.
No quality analytics without defect and hold reason masters.
No exception discipline without owner, severity, and threshold masters.
```

Master data is not only reference data. It is the foundation for planning logic.

---

## 3. Master Data Management Approach

### 3.1 Django Admin as Master Data Control Layer

Django Admin should be used for most master data maintenance because it provides:

- quick CRUD setup
- search and filters
- inline child records
- role-based administrative control
- audit integration
- import/export support
- controlled access for admin users

However, Django Admin should not be the main operational UI for planners. Operational planning should happen in the custom frontend.

Recommended split:

| Area | Interface |
|---|---|
| Master data setup | Django Admin |
| Role and permission setup | Django Admin |
| Planning workbench | Custom frontend |
| Daily release | Custom frontend |
| Shopfloor capture | Mobile/PWA frontend |
| Exception management | Custom frontend |
| Master data completeness dashboard | Custom frontend or Admin report |

---

## 4. Master Data Governance Principles

### 4.1 Ownership

Every master data domain must have a business owner.

Example:

| Master Data | Business Owner |
|---|---|
| Style master | Merchandising / Technical |
| BOM | Technical / Merchandising |
| Operation bulletin | IE |
| Line master | Production / IE |
| Machine master | Maintenance / IE |
| Operator skill matrix | IE / HR / Production |
| Workcenter master | Planning |
| Shift calendar | HR / Planning |
| Vendor master | Procurement |
| Fabric master | Procurement / Fabric QC |
| Wash route master | Washing / Technical |
| Defect code master | QC |
| Shipment checklist | Shipment / QC |
| Planning thresholds | Planning Head / Management |

### 4.2 Approval

Planning-critical master data should have approval status.

Recommended statuses:

```text
DRAFT
UNDER_REVIEW
APPROVED
SUSPENDED
OBSOLETE
```

Only approved master data should be used for production planning unless a documented override is granted.

### 4.3 Versioning

Versioning is mandatory for masters that influence planning calculations or execution methods.

Version-controlled masters:

```text
style technical file
BOM
operation bulletin
wash route
line balance plan
planning thresholds
shipment checklist
quality standards
```

### 4.4 Audit

All planning-critical master data changes should be audited.

Audit should capture:

```text
entity
old value
new value
changed by
changed at
reason
approval status
```

### 4.5 Completeness

The system should maintain master data completeness indicators.

Examples:

```text
Style missing approved BOM.
Style missing approved operation bulletin.
Line missing machine assignment.
Workcenter missing capacity calendar.
Wash route missing steps.
Vendor missing standard lead time.
Operator missing skill matrix.
```

---

# Part A: Organization and User Master Data

---

## 5. Factory Master

### 5.1 Purpose

Defines manufacturing units/factories within Eratex.

### 5.2 Required Fields

```text
factory code
factory name
location
timezone
active status
```

### 5.3 Optional Fields

```text
address
contact person
legal entity
production specialization
default shift calendar
```

### 5.4 Validation Rules

```text
factory code must be unique
timezone is mandatory
inactive factory cannot be used for new orders/plans
```

### 5.5 Planning Usage

Factory master is used for:

```text
order assignment
workcenter grouping
line planning
capacity calculation
shopfloor user access
dashboard filtering
```

---

## 6. Department Master

### 6.1 Purpose

Defines operational departments.

### 6.2 Department Types

```text
MERCHANDISING
PROCUREMENT
FABRIC_QC
CUTTING
SEWING
WASHING
FINISHING
PACKING
FINAL_QC
SHIPMENT
IE
PLANNING
MAINTENANCE
MANAGEMENT
```

### 6.3 Required Fields

```text
department code
department name
factory
department type
active status
```

### 6.4 Planning Usage

Department master supports:

```text
role assignment
exception ownership
handover routing
workcenter grouping
dashboard filters
```

---

## 7. User Profile Master

### 7.1 Purpose

Extends Django users with operational identity.

### 7.2 Required Fields

```text
user
employee code
display name
factory
department
default role
active status
```

### 7.3 Optional Fields

```text
phone
email
shopfloor user flag
default line/workcenter
supervisor flag
```

### 7.4 Validation Rules

```text
employee code should be unique
inactive users cannot own new exceptions
shopfloor users should have restricted mobile actions
```

### 7.5 Planning Usage

Used for:

```text
ownership
exception assignment
release approval
shopfloor capture
audit
role-based screens
```

---

## 8. Role Master

### 8.1 Purpose

Defines business roles.

### 8.2 Recommended Roles

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
MAINTENANCE_USER
SHOPFLOOR_SUPERVISOR
READ_ONLY_AUDITOR
```

### 8.3 Usage

Role master controls:

```text
module access
action permissions
approval authority
dashboard visibility
admin access
```

---

## 9. Permission Action Master

### 9.1 Purpose

Defines action-level permissions.

### 9.2 Example Permission Actions

```text
pcd.view
pcd.approve_conditional_release
pcd.release_to_cutting
planning.freeze_weekly_plan
planning.approve_plan_change
release.override_blocked_release
quality.release_hold
shipment.mark_ready
bulletin.approve
line.approve_realignment
exception.close_critical
master_data.edit
```

### 9.3 Governance Rule

New critical workflow actions must not be implemented without defining the required permission action.

---

# Part B: Product, Style, and Technical Master Data

---

## 10. Customer Master

### 10.1 Purpose

Defines buyer/customer organizations.

### 10.2 Required Fields

```text
customer code
customer name
priority level
active status
```

### 10.3 Optional Fields

```text
payment terms
default AQL level
default shipment rules
default packing rules
contact details
```

### 10.4 Planning Usage

Used for:

```text
order grouping
customer-wise OTIF
priority decisions
risk escalation
shipment reporting
```

---

## 11. Buyer Master

### 11.1 Purpose

Defines buyer contacts or brand units under a customer.

### 11.2 Required Fields

```text
customer
buyer code
buyer name
active status
```

### 11.3 Planning Usage

Used for:

```text
approval tracking
style ownership
customer reporting
order filtering
```

---

## 12. Product Type Master

### 12.1 Purpose

Classifies garment categories.

### 12.2 Recommended Values

```text
DENIM_BOTTOM
CHINO
CARGO
JOGGER
SHORTS
OTHER_BOTTOM
```

### 12.3 Planning Usage

Used for:

```text
line capability matching
wash route selection
complexity rating
capacity assumptions
```

---

## 13. Style Master

### 13.1 Purpose

Defines the garment style being produced.

### 13.2 Required Fields

```text
style code
customer
buyer
product type
style description
fit type
fabric category
wash complexity
sewing complexity
overall complexity
status
```

### 13.3 Optional Fields

```text
season
reference sample number
tech pack attachment
measurement spec attachment
default wash route
default BOM
default operation bulletin
default packing rule
```

### 13.4 Status Values

```text
DRAFT
UNDER_REVIEW
APPROVED
SUSPENDED
OBSOLETE
```

### 13.5 Validation Rules

A style becomes production-loadable only when:

```text
style status = APPROVED
approved BOM exists
approved operation bulletin exists
approved wash route exists if wash is required
quality checkpoints exist
```

### 13.6 Planning Usage

Style master drives:

```text
BOM selection
operation bulletin
SMV
line loading
wash route
quality checkpoints
complexity buffer
shipment risk
```

---

## 14. Style Complexity Master

### 14.1 Purpose

Defines complexity categories for planning.

### 14.2 Suggested Dimensions

```text
sewing complexity
wash complexity
fabric complexity
trim complexity
measurement sensitivity
buyer strictness
```

### 14.3 Example Ratings

```text
LOW
MEDIUM
HIGH
VERY_HIGH
```

### 14.4 Planning Usage

Complexity affects:

```text
expected efficiency
learning curve
buffer requirement
QC intensity
wash rework allowance
line allocation
```

---

## 15. BOM Master

### 15.1 Purpose

Defines style-wise material requirements.

### 15.2 BOM Header Fields

```text
style
version
status
approved by
approved at
effective date
remarks
```

### 15.3 BOM Line Fields

```text
material
consumption per piece
wastage percent
UOM
required stage
nominated vendor required
remarks
```

### 15.4 Material Types

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

### 15.5 Validation Rules

```text
BOM version must be approved before material planning.
Main fabric must exist for production styles.
Required stage must be specified for planning-critical materials.
BOM change after order confirmation must trigger impact review.
```

### 15.6 Planning Usage

Used for:

```text
material requirement calculation
procurement planning
PCD readiness
trim readiness
shortage alerts
shipment packing readiness
```

---

## 16. Material Master

### 16.1 Purpose

Defines all fabric, trims, packing materials, and consumables.

### 16.2 Required Fields

```text
material code
material name
material type
UOM
active status
```

### 16.3 Optional Fields

```text
standard lead time
default vendor
nominated vendor required
storage conditions
inspection required flag
```

### 16.4 Planning Usage

Used for:

```text
BOM
procurement
material availability
PCD readiness
shortage analysis
```

---

# Part C: Operation Bulletin and Routing Master Data

---

## 17. Operation Master

### 17.1 Purpose

Defines reusable standard operations.

### 17.2 Required Fields

```text
operation code
operation name
operation group
default machine type
default skill level
active status
```

### 17.3 Operation Groups for Denim/Chino Bottoms

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

### 17.4 Planning Usage

Used for:

```text
operation bulletin creation
skill matrix
line balancing
bottleneck detection
efficiency review
```

---

## 18. Operation Bulletin Master

### 18.1 Purpose

Defines the style-specific operation sequence and SMV/SAM.

### 18.2 Header Required Fields

```text
style
version
status
total SMV
effective date
approved by
approved at
```

### 18.3 Line Required Fields

```text
sequence number
operation
operation name
operation group
machine type
attachment required
skill level
SMV/SAM
target pieces per hour
QC checkpoint
critical operation flag
predecessor operation
parallel allowed flag
rework sensitive flag
```

### 18.4 Status Values

```text
DRAFT
UNDER_REVIEW
APPROVED
OBSOLETE
```

### 18.5 Validation Rules

```text
total SMV = sum operation SMV
sequence numbers must be unique
approved bulletin cannot be edited directly
changes require new version
active order must retain bulletin version used for planning
```

### 18.6 Planning Usage

Used for:

```text
line loading
line balance
machine requirement
skill requirement
capacity calculation
efficiency review
costing
```

---

## 19. Machine Type Master

### 19.1 Purpose

Defines machine categories used by operations and line setup.

### 19.2 Recommended Values

```text
LOCKSTITCH
OVERLOCK
CHAINSTITCH
BARTACK
BUTTONHOLE
BUTTON_ATTACH
WAISTBAND
FEED_OFF_ARM
DOUBLE_NEEDLE
RIVET
SNAP_BUTTON
SPECIAL_ATTACHMENT
WASHER
DRYER
LASER
OZONE
SPRAY_BOOTH
```

### 19.3 Planning Usage

Used for:

```text
operation bulletin
line master
line realignment
machine availability
capacity analysis
maintenance impact
```

---

## 20. Attachment / Folder Master

### 20.1 Purpose

Defines special attachments required for operations.

### 20.2 Example Values

```text
waistband folder
belt loop folder
hem folder
pocket folder
special guide
special presser foot
```

### 20.3 Planning Usage

Used for:

```text
line realignment
setup readiness
changeover planning
```

---

# Part D: Line, Machine, Skill, and Capacity Master Data

---

## 21. Workcenter Master

### 21.1 Purpose

Defines planning and execution centers.

### 21.2 Required Fields

```text
factory
department
workcenter code
workcenter name
workcenter type
capacity unit
constraint candidate flag
default calendar
active status
```

### 21.3 Workcenter Types

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

### 21.4 Capacity Units

```text
PIECES
MINUTES
BATCHES
ROLLS
CARTONS
```

### 21.5 Planning Usage

Used for:

```text
workcenter load
constraint detection
weekly planning
daily release
WIP queue mapping
```

---

## 22. Line Master

### 22.1 Purpose

Defines sewing production lines.

### 22.2 Required Fields

```text
factory
line code
line name
line type
supervisor
standard manpower
current manpower
shift calendar
baseline efficiency
net-good output baseline
active status
```

### 22.3 Optional Fields

```text
allowed product types
special capability
average defect rate
average absenteeism
default workcenter
```

### 22.4 Line Types

```text
DENIM
CHINO
MIXED
SAMPLE
SPECIAL
```

### 22.5 Validation Rules

```text
line code unique within factory
inactive line cannot be planned
line without shift calendar cannot be capacity-planned
line without machine assignment should be flagged
```

### 22.6 Planning Usage

Used for:

```text
sewing line loading
capacity calculation
line realignment
efficiency review
constraint analysis
```

---

## 23. Machine Master

### 23.1 Purpose

Defines machine inventory and availability.

### 23.2 Required Fields

```text
machine code
machine type
factory
status
active status
```

### 23.3 Optional Fields

```text
brand
model
current line
maintenance status
last service date
next service date
```

### 23.4 Machine Status

```text
AVAILABLE
ASSIGNED
UNDER_MAINTENANCE
BREAKDOWN
INACTIVE
```

### 23.5 Planning Usage

Used for:

```text
line setup
machine availability
line realignment
downtime impact
capacity validation
```

---

## 24. Line Machine Assignment Master

### 24.1 Purpose

Maps machines to lines over time.

### 24.2 Required Fields

```text
line
machine
assigned from
assigned to
assigned by
remarks
```

### 24.3 Validation Rules

```text
machine cannot be assigned to two active lines for same period
machine under maintenance cannot be assigned
```

### 24.4 Planning Usage

Used for:

```text
line capability
line loading
realignment
machine shortage detection
```

---

## 25. Operator Skill Matrix

### 25.1 Purpose

Defines which operator can perform which operation at what performance level.

### 25.2 Required Fields

```text
operator
operation
skill level
efficiency rating
quality rating
last reviewed date
training required flag
```

### 25.3 Skill Levels

```text
NOT_TRAINED
TRAINEE
BASIC
MEDIUM
HIGH
EXPERT
```

### 25.4 Planning Usage

Used for:

```text
realistic line capacity
line balancing
operator allocation
skill gap detection
training planning
quality-adjusted capacity
```

### 25.5 Governance

Skill matrix should be reviewed periodically by IE/production.

Recommended review frequency:

```text
monthly for active operators
after new style introduction
after major quality issue
after training completion
```

---

## 26. Efficiency Baseline Master

### 26.1 Purpose

Defines planning efficiency assumptions.

### 26.2 Possible Levels

```text
factory level
workcenter level
line level
style level
operation level
operator level
```

### 26.3 Required Fields

```text
entity type
entity reference
baseline efficiency
effective from
effective to
approved by
```

### 26.4 Planning Usage

Used for:

```text
capacity calculation
line loading
target output
plan realism
```

---

# Part E: Fabric, Vendor, Procurement, and QC Master Data

---

## 27. Vendor Master

### 27.1 Purpose

Defines suppliers, including nominated vendors.

### 27.2 Required Fields

```text
vendor code
vendor name
vendor type
nominated flag
standard lead time days
active status
```

### 27.3 Optional Fields

```text
reliability score
contact person
contact email
country
material specialization
```

### 27.4 Vendor Types

```text
FABRIC
TRIM
PACKING
CHEMICAL
SERVICE
OTHER
```

### 27.5 Planning Usage

Used for:

```text
material ETA
procurement lead time
PCD risk
vendor delay analytics
```

---

## 28. Fabric Master

### 28.1 Purpose

Defines fabric characteristics relevant to planning and QC.

### 28.2 Required Fields

```text
fabric code
fabric name
composition
GSM
width
fabric category
active status
```

### 28.3 Optional Fields

```text
stretch category
expected shrinkage
shade behavior
wash behavior notes
skew risk
crocking risk
default inspection requirements
```

### 28.4 Fabric Categories

```text
DENIM_RIGID
DENIM_STRETCH
BLACK_DENIM
OVERDYED_DENIM
CHINO_TWILL
STRETCH_CHINO
OTHER
```

### 28.5 Planning Usage

Used for:

```text
fabric QC
marker planning
shrinkage impact
shade lot control
wash risk
PCD readiness
```

---

## 29. Fabric QC Parameter Master

### 29.1 Purpose

Defines fabric QC checks and pass/fail rules.

### 29.2 QC Parameters

```text
4-point inspection
width
GSM
shrinkage
skewing
bowing
stretch recovery
colorfastness
crocking
roll-to-roll shade
hand feel
```

### 29.3 Required Fields

```text
parameter code
parameter name
applicable fabric type
lower tolerance
upper tolerance
mandatory flag
active status
```

### 29.4 Planning Usage

Used for:

```text
fabric QC pass/fail
PCD readiness
quality risk
vendor performance
```

---

# Part F: Wash and Finishing Master Data

---

## 30. Wash Route Master

### 30.1 Purpose

Defines standard wash route templates.

### 30.2 Required Header Fields

```text
wash route code
wash route name
complexity rating
rewash allowed flag
active status
```

### 30.3 Wash Route Step Fields

```text
sequence number
step type
step name
standard minutes
machine type
requires QC
remarks
```

### 30.4 Step Types

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
HYDRO
DRYING
POST_WASH_QC
TOUCH_UP
REWASH
```

### 30.5 Validation Rules

```text
route code must be unique
approved route must have at least one step
step sequence must be unique
rewash route must be identifiable
```

### 30.6 Planning Usage

Used for:

```text
wash batch planning
wash capacity calculation
wash queue
rewash planning
shipment risk
```

---

## 31. Wash Machine Master

### 31.1 Purpose

Defines wash-specific machines.

### 31.2 Required Fields

```text
machine code
machine type
capacity pieces/batch
standard cycle time
factory
status
```

### 31.3 Machine Types

```text
WASHER
DRYER
OZONE
LASER
SPRAY_BOOTH
HYDRO_EXTRACTOR
TUMBLE_DRYER
```

### 31.4 Planning Usage

Used for:

```text
wash capacity
batch sizing
machine assignment
downtime impact
```

---

## 32. Finishing Operation Master

### 32.1 Purpose

Defines finishing and packing activities.

### 32.2 Example Operations

```text
thread trimming
spot cleaning
pressing
measurement check
tagging
folding
polybag packing
carton packing
barcode check
metal detection
```

### 32.3 Planning Usage

Used for:

```text
finishing load
shipment readiness
packing bottleneck
quality checks
```

---

# Part G: Quality, Exception, and Shipment Master Data

---

## 33. Defect Code Master

### 33.1 Purpose

Defines standard defect types.

### 33.2 Required Fields

```text
defect code
defect name
defect category
default severity
responsible process default
active status
```

### 33.3 Defect Categories

```text
FABRIC
CUTTING
SEWING
WASH
FINISHING
PACKING
MEASUREMENT
SHADE
TRIM
DOCUMENTATION
```

### 33.4 Example Defects

```text
open seam
broken stitch
needle cut
oil stain
wrong trim
measurement out of tolerance
shade variation
wash effect mismatch
hand feel issue
damage
packing mismatch
barcode error
```

### 33.5 Planning Usage

Used for:

```text
QC capture
quality analytics
rework creation
quality-adjusted capacity
exception generation
```

---

## 34. Hold Reason Master

### 34.1 Purpose

Defines standard reasons for blocking WIP/order movement.

### 34.2 Example Hold Reasons

```text
fabric QC fail
trim shortage
shade mismatch
measurement fail
wash fail
AQL fail
machine breakdown
buyer approval pending
documentation pending
quantity mismatch
```

### 34.3 Planning Usage

Used for:

```text
WIP hold
daily release block
exception reporting
root cause analytics
```

---

## 35. Exception Category Master

### 35.1 Purpose

Defines exception categories.

### 35.2 Recommended Categories

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

### 35.3 Planning Usage

Used for:

```text
exception routing
owner suggestion
dashboard grouping
escalation rules
analytics
```

---

## 36. Severity Master

### 36.1 Purpose

Defines risk and exception severity.

### 36.2 Recommended Values

```text
GREEN
YELLOW
RED
BLACK
```

### 36.3 Governance Rule

Severity colors must be used only for operational risk, not for arbitrary visual styling.

---

## 37. Shipment Readiness Checklist Master

### 37.1 Purpose

Defines mandatory shipment readiness checks.

### 37.2 Default Checklist Items

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

### 37.3 Required Fields

```text
item code
item label
mandatory flag
default owner role
due threshold
active status
```

### 37.4 Planning Usage

Used for:

```text
shipment readiness
dispatch block
OTIF protection
shipment exception generation
```

---

# Part H: Planning Threshold and Rule Master Data

---

## 38. Planning Threshold Master

### 38.1 Purpose

Defines configurable thresholds for alerts, risk, and capacity.

### 38.2 Required Fields

```text
threshold code
threshold name
module
value
unit
severity
active status
```

### 38.3 Example Thresholds

```text
WORKCENTER_OVERLOAD_YELLOW_PERCENT = 90
WORKCENTER_OVERLOAD_RED_PERCENT = 110
WORKCENTER_OVERLOAD_BLACK_PERCENT = 130
WIP_SEWN_WAITING_WASH_YELLOW_HOURS = 24
WIP_SEWN_WAITING_WASH_RED_HOURS = 48
SHIPMENT_BUFFER_RED_HOURS = 48
PCD_BLOCKER_ESCALATION_DAYS = 3
LINE_EFFICIENCY_LOW_PERCENT = 65
WASH_REWORK_RATE_RED_PERCENT = 8
```

### 38.4 Planning Usage

Used for:

```text
risk calculation
exception generation
workcenter load severity
WIP ageing severity
shipment risk
performance alerts
```

---

## 39. Stage Master

### 39.1 Purpose

Defines order and WIP stages.

### 39.2 Order Lifecycle Stages

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
```

### 39.3 WIP Stages

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

### 39.4 Planning Usage

Used for:

```text
order lifecycle
WIP movement
pipeline inventory
handover
exception logic
dashboards
```

---

## 40. Handover Rule Master

### 40.1 Purpose

Defines department-to-department handover requirements.

### 40.2 Handover Points

```text
Fabric warehouse → cutting
Cutting → sewing
Sewing → wash
Wash → finishing
Finishing → packing
Packing → shipment
```

### 40.3 Required Fields

```text
from stage
to stage
mandatory QC status
quantity validation required
acceptance required flag
default owner role
```

### 40.4 Planning Usage

Used for:

```text
WIP movement control
handover capture
quantity reconciliation
department accountability
```

---

# Part I: Master Data Completeness and Readiness

---

## 41. Master Data Completeness Rules

### 41.1 Style Completeness

A style is complete if:

```text
style master approved
BOM approved
operation bulletin approved
wash route approved if applicable
quality checkpoints defined
```

### 41.2 Line Completeness

A line is complete if:

```text
line active
supervisor assigned
shift calendar assigned
machine assignment exists
baseline efficiency defined
current manpower defined
```

### 41.3 Workcenter Completeness

A workcenter is complete if:

```text
workcenter active
capacity unit defined
calendar assigned
constraint candidate flag set
owner department assigned
```

### 41.4 Wash Route Completeness

A wash route is complete if:

```text
route active
steps defined
standard minutes defined for each step
machine type assigned where needed
QC step defined if required
```

### 41.5 Vendor Completeness

A vendor is complete if:

```text
vendor active
vendor type defined
standard lead time defined
nominated flag defined
```

---

## 42. Master Data Readiness Dashboard

A mature system should have a master-data readiness dashboard.

### 42.1 Dashboard Cards

```text
Styles missing BOM
Styles missing operation bulletin
Styles missing wash route
Lines missing machines
Lines missing efficiency baseline
Operators missing skill matrix
Workcenters missing calendar
Vendors missing lead time
Wash routes missing steps
Thresholds missing values
```

### 42.2 Actions

```text
open master record
assign owner
create data issue
mark under review
approve
reject
```

---

# Part J: Django Admin Configuration

---

## 43. Admin Requirements by Master

### 43.1 General Admin Features

All master-data admin screens should support:

```text
search
list filters
list display
created/updated fields
active/inactive flag
approval status
audit link
```

### 43.2 Inline Admin

Use inline admin for:

```text
BOM header → BOM lines
Operation bulletin → operation lines
Wash route → wash route steps
Role → permissions
Line → machine assignments
Shipment checklist template → checklist items
```

### 43.3 Import/Export

Controlled import/export should be available for:

```text
style master
BOM
operation bulletin
machine master
line master
operator skill matrix
vendor master
material master
```

### 43.4 Admin Protection

Critical approved records should be protected from direct edit.

Recommended behavior:

```text
approved records read-only
clone to new version for change
changes require approval
audit event created
```

---

# Part K: Data Quality and Validation

---

## 44. General Validation Rules

```text
codes must be unique
mandatory planning fields cannot be blank
inactive master data cannot be used for new planning
approved version cannot be edited directly
status transitions must be controlled
```

---

## 45. Duplicate Control

Duplicate checks:

```text
style code
material code
vendor code
machine code
line code
operation code
wash route code
customer code
```

---

## 46. Master Data Error Severity

| Error Type | Severity |
|---|---|
| Missing approved operation bulletin | Critical |
| Missing BOM for active style | Critical |
| Missing shift calendar for active line | Critical |
| Missing standard lead time for nominated vendor | High |
| Missing operator skill matrix | Medium/High |
| Missing defect code mapping | Medium |
| Missing shipment checklist owner | High |

---

# Part L: API and Frontend Implications

---

## 47. Master Data API Groups

Recommended APIs:

```text
GET /api/v1/master/factories
GET /api/v1/master/workcenters
GET /api/v1/master/lines
GET /api/v1/master/machines
GET /api/v1/master/materials
GET /api/v1/master/vendors
GET /api/v1/master/styles
GET /api/v1/master/wash-routes
GET /api/v1/master/defect-codes
GET /api/v1/master/thresholds
```

Write APIs should be restricted and often replaced by Django Admin for MVP.

---

## 48. Frontend Usage

Frontend workbenches consume master data for:

```text
filters
dropdowns
status labels
line assignment
workcenter planning
operation bulletin display
wash route planning
exception categories
shipment checklist
```

Frontend should not hardcode master values except for stable technical enums agreed by backend.

---

# Part M: Implementation Phasing

---

## 49. Phase 1 Master Data

Required for first backend foundation:

```text
factory
department
user profile
role
permission action
workcenter
shift calendar
customer
buyer
style
product type
material
vendor
line
machine
```

---

## 50. Phase 2 Master Data

Required for PCD and planning:

```text
BOM
fabric master
fabric QC parameter
PCD checklist template
planning thresholds
shipment checklist template
```

---

## 51. Phase 3 Master Data

Required for sewing and wash:

```text
operation master
operation bulletin
machine type
operator skill matrix
wash route
wash machine
finishing operation
```

---

## 52. Phase 4 Master Data

Required for maturity:

```text
line balance template
handover rule
quality standards
exception routing rules
recovery action templates
analytics dimension masters
```

---

# Part N: Open Decisions

---

## 53. Decisions Required Before Build

1. Should style master be created manually or imported from an existing technical system?
2. Are BOMs currently available digitally?
3. Are operation bulletins available in Excel?
4. Is SMV/SAM standardized across all styles?
5. Is operator-level skill data available or should line-level efficiency be used first?
6. Are wash routes standardized or mostly buyer/style specific?
7. Should shipment checklists vary by customer?
8. Which master data will be maintained in Django Admin vs imported?
9. Who will approve master-data versions?
10. What is the minimum master data required for pilot go-live?

---

## 54. Summary

The Eratex planning platform depends on strong master data. The most critical master data domains are:

```text
style
BOM
operation bulletin
line
machine
operator skill
workcenter
shift calendar
fabric
vendor
wash route
quality defect codes
shipment checklist
planning thresholds
```

The implementation should use Django Admin for master-data maintenance and RBAC control, while the custom frontend should consume approved master data for planning and execution.

The system should continuously monitor master-data completeness because poor master data will directly cause poor planning, incorrect capacity, bad line loading, weak wash planning, and continued Excel dependency.
