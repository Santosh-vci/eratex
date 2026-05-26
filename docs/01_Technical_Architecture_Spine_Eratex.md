# 01. Technical Architecture Spine Document  
# Eratex End-to-End Planning & Scheduling Platform

**Company:** Eratex  
**Product:** End-to-End Planning & Scheduling Tool for Denim Bottoms + Chinos Manufacturing  
**Document Type:** Technical Architecture Spine  
**Version:** 2.0  
**Date:** 2026-05-26  
**Intended Audience:** Product Owner, Technology Head, Solution Architect, Backend Engineers, Frontend Engineers, DevOps, QA, Implementation Team  

---

## 1. Document Purpose

This document defines the **technical architecture spine** for the Eratex Planning & Scheduling Platform.

It is the master technical reference for the build. It explains:

- the business problem the platform is solving
- the architectural approach
- the recommended technology stack
- the backend and frontend structure
- the database and data model direction
- the role of Django Admin and RBAC
- the Dockerized deployment approach
- the integration approach
- the module map
- the phase-wise build strategy
- the governance principles that should guide future development

This document does not replace detailed schema, API, planning logic, frontend, or deployment documents. Instead, it provides the overarching technical spine within which those documents must fit.

---

## 2. Business and Operational Context

Eratex operates a large-scale garment manufacturing environment for **denim bottoms and chinos**. The production flow is complex because manufacturing reliability depends on many linked stages:

```text
Customer order / PO
→ style and technical file
→ operation bulletin
→ BOM and material planning
→ nominated vendor procurement
→ fabric inward
→ fabric QC
→ PCD readiness
→ cutting
→ sewing line loading
→ sewing execution
→ wash planning
→ dry process / wet process / rewash
→ finishing
→ final QC
→ packing
→ shipment readiness
→ dispatch
```

The platform must support this full production control flow.

The earlier business diagnosis is:

```text
Eratex may have a planning tool, but if actual planning still depends heavily on Excel,
then the official system is not the real operating system of the factory.
```

The technical architecture must therefore be designed to replace informal planning execution with a governed, integrated, live operating platform.

---

## 3. Core Product Thesis

The platform should not be built as a generic ERP module or passive reporting dashboard.

It must be built as an **operations control system**.

The core closed loop is:

```text
Plan
→ validate readiness
→ release
→ execute
→ capture actuals
→ detect variance
→ trigger exception
→ recommend recovery
→ protect shipment
```

This means the platform needs two tightly connected front-end layers:

```text
1. Planner / management desktop workbenches
2. Shopfloor handheld / tablet live capture screens
```

The desktop layer creates and manages the plan.  
The shopfloor layer captures what actually happens.

Without live shopfloor capture, the planning board will become stale and users will return to Excel, WhatsApp, paper, and end-of-day manual updates.

---

## 4. Architectural Goals

The system architecture must satisfy the following goals:

### 4.1 Operational Reliability

The system must provide a reliable single source of truth for:

- order status
- PCD readiness
- weekly plan
- daily release
- line loading
- workcenter load
- wash queue
- WIP inventory
- exceptions
- shipment readiness

### 4.2 Planning Discipline

The architecture must enforce operating rules, such as:

```text
No cutting without PCD readiness.
No release without validation.
No line loading without capacity.
No denim plan without wash visibility.
No WIP without ageing.
No exception without owner and due date.
No shipment without readiness proof.
```

### 4.3 Live Execution Visibility

The platform must capture near-real-time production actuals from the floor:

- sewing output
- bundle progress
- wash step completion
- rewash requirement
- QC defects
- WIP handover
- downtime
- finishing and packing output

### 4.4 Scalability for Large Factory Operations

The platform must support:

- many active orders
- many styles
- many production lines
- many workcenters
- many WIP records
- frequent output capture
- large historical datasets
- role-based workflows

### 4.5 Auditability and Governance

The platform must preserve traceability for:

- plan changes
- conditional release
- blocked release override
- operation bulletin version changes
- line realignment
- QC hold and release
- rewash decision
- shipment readiness
- exception closure

### 4.6 Incremental Build

The architecture must support modular phased implementation. The platform should be buildable in layers without requiring the full enterprise scope on day one.

---

## 5. Recommended Technology Stack

## 5.1 Backend Stack

| Layer | Recommended Technology | Reason |
|---|---|---|
| Backend framework | Django | Mature framework, strong ORM, admin, auth, ecosystem |
| API layer | Django REST Framework | Clear REST API development, serializers, permissions |
| Admin / RBAC | Django Admin + Django Auth + custom role/action permissions | Fast configuration of users, roles, master data, permissions |
| Database | PostgreSQL | Reliable transactional database with relational integrity and JSONB support |
| Background jobs | Celery | Async jobs for calculations, snapshots, imports, alerts |
| Broker/cache | Redis | Celery broker, cache, locks, temporary state |
| API docs | drf-spectacular / OpenAPI | Contract discipline for frontend/backend |
| Audit | Custom audit tables or django-simple-history | Traceability and governance |
| Import/export | django-import-export or custom import services | Excel transition support |
| Authentication | Django session/JWT depending deployment | Secure user authentication |
| Static/media | Django storage backend | QC photos, attachments, import files |

### Backend stack position

Django is appropriate because the product requires:

```text
structured relational data
role-based access
admin-managed master data
auditability
workflow-heavy backend services
stable enterprise development
```

Django Admin should be used for:

```text
RBAC
master data maintenance
lookup tables
threshold configuration
factory/workcenter/line setup
user administration
integration configuration
```

Django Admin should **not** be used as the main planner-facing UI. Planner workflows should be built in a custom frontend.

---

## 5.2 Database Stack

### Primary database

```text
PostgreSQL
```

PostgreSQL should be the primary system of record for:

- orders
- styles
- BOM
- operation bulletins
- workcenters
- lines
- machines
- operators
- PCD readiness
- weekly plans
- production releases
- sewing output
- wash batches
- WIP inventory
- QC defects
- exceptions
- shipment readiness
- audit logs

### Optional future analytical database

For the first build, PostgreSQL is sufficient if indexed and snapshotted properly.

If historical analytics becomes very large, add:

```text
ClickHouse or another analytical store
```

Possible future use cases for ClickHouse:

- multi-year line efficiency trends
- high-frequency shopfloor events
- large WIP and output analytics
- control tower historical dashboards

But this should not be introduced prematurely.

---

## 5.3 Frontend Stack

The frontend must support dense, interactive planning workbenches and mobile shopfloor input.

Recommended stack:

| Layer | Recommended Technology | Reason |
|---|---|---|
| Framework | Next.js or React + Vite | Suitable for SPA-style planning UI |
| Language | TypeScript | Strong contract discipline |
| Server state | TanStack Query | API cache, refresh, stale data handling |
| Dense grids | AG Grid or TanStack Table | Required for planning grids |
| Forms | React Hook Form + Zod | Validation and form discipline |
| UI components | shadcn/ui or internal component library | Consistent reusable components |
| Charts | Recharts | Operational charts and load views |
| Mobile/PWA | Responsive React/Next.js PWA | Handheld shopfloor capture |
| Drag/drop | dnd-kit or equivalent | Planning boards, line allocation |
| Date/time | date-fns or Luxon | Planning horizons and timezone handling |

### Frontend choice recommendation

For this product, the frontend should prioritize:

```text
dense grids
fast filtering
right-side drawers
planning boards
capacity overlays
mobile capture screens
role-based action rendering
```

A generic CRUD UI will not be sufficient.

Recommended default:

```text
Next.js + TypeScript + TanStack Query + AG Grid + shadcn/ui
```

AG Grid is useful because the planner workbench will need:

- large row counts
- column pinning
- grouping
- filtering
- sorting
- virtual scrolling
- inline status badges
- export where allowed

---

## 5.4 Deployment Stack

The platform should be built inside Docker.

Recommended services:

```text
eratex_backend
eratex_frontend
eratex_postgres
eratex_redis
eratex_celery_worker
eratex_celery_beat
eratex_reverse_proxy
```

Recommended deployment path:

```text
Local Docker Compose
→ Development Docker Compose
→ Staging Docker Compose
→ Production Docker Compose
→ Kubernetes only if later required
```

Initial production deployment can be Docker Compose on a properly sized VM or on-prem server, depending Eratex infrastructure preference.

---

## 6. High-Level System Architecture

```text
┌────────────────────────────────────────────────────┐
│                    Users                           │
│ Planner | Manager | QC | Sewing | Wash | Shipment  │
└────────────────────────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────┐
│              Frontend Web / PWA                    │
│ Desktop workbenches + handheld shopfloor screens   │
└────────────────────────────────────────────────────┘
                         │ REST / JSON
                         ▼
┌────────────────────────────────────────────────────┐
│              Django REST API Layer                 │
│ serializers | permissions | validation | views     │
└────────────────────────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────┐
│              Domain Service Layer                  │
│ planning | readiness | WIP | wash | exceptions     │
└────────────────────────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────┐
│                  PostgreSQL                        │
│ transactional data | plans | WIP | audit | masters │
└────────────────────────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────┐
│            Celery + Redis                          │
│ snapshots | alerts | imports | recalculations      │
└────────────────────────────────────────────────────┘
```

---

## 7. Core Backend Architectural Pattern

The backend should use a layered pattern:

```text
API View
→ Serializer
→ Permission Check
→ Domain Service
→ ORM / Repository
→ Audit Event
→ Optional Async Recalculation
```

### Example: PCD Release

```text
POST /orders/{id}/release-to-cutting
→ validate user permission
→ fetch order
→ calculate PCD readiness
→ if blocked, reject or require override
→ create production release
→ update order lifecycle
→ create audit event
→ trigger WIP/planning recalculation
→ return release status
```

### Rule

Business logic must not live directly inside API views or frontend components. It must live in backend domain services.

---

## 8. Major Backend Modules

The backend should be organized into Django apps or domain modules.

```text
identity_access
master_data
orders
style_technical
materials_procurement
fabric_qc
pcd_readiness
planning
production_release
workcenters
cutting
sewing
washing
quality
wip_inventory
rework_recovery
exceptions
shipment
analytics
audit_governance
integrations
```

Each module should own:

- models
- serializers
- APIs
- service functions
- permissions
- tests
- admin configuration

---

## 9. Module Responsibility Map

| Module | Responsibility |
|---|---|
| identity_access | users, roles, permissions, profile, action control |
| master_data | factory, department, workcenter, line, machine, shift, vendor, lookup data |
| orders | order lifecycle, milestones, customer order status |
| style_technical | style, BOM, operation bulletin, routing |
| materials_procurement | material requirements, vendor PO, ETA, shortage |
| fabric_qc | fabric lot, roll inspection, QC status, shade lots |
| pcd_readiness | PCD checklist, readiness status, conditional release |
| planning | weekly plan, plan version, plan change, impact preview |
| production_release | daily release, release validation, blocked release |
| workcenters | load, capacity, queue, constraint flag |
| cutting | cutting release, cut bundles, cut WIP |
| sewing | line loading, output, line balance, realignment |
| washing | wash route, wash batch, rewash, wash execution |
| quality | QC inspections, defects, holds |
| wip_inventory | pipeline WIP, movement, ageing, reconciliation |
| rework_recovery | rework orders, recovery actions |
| exceptions | exception generation, assignment, escalation, closure |
| shipment | shipment checklist, readiness, dispatch |
| analytics | snapshots, KPIs, performance reports |
| audit_governance | audit events, state history, traceability |
| integrations | ERP, FastReact, Excel import, HR, logistics |

---

## 10. Frontend Architecture

The frontend should be organized by product modules, not generic pages.

Recommended structure:

```text
src/
  app/
    layout/
    routes/
  modules/
    orders/
    pcd-readiness/
    weekly-planning/
    daily-release/
    workcenters/
    sewing/
    washing/
    wip/
    exceptions/
    shipment/
    operation-bulletin/
    line-routing/
    shopfloor-mobile/
    analytics/
    admin/
  components/
    ui/
    data-grid/
    status-badge/
    risk-badge/
    readiness-checklist/
    order-drawer/
    exception-card/
    workcenter-card/
    timeline/
    mobile/
  services/
    api/
    query-keys/
  types/
  utils/
```

---

## 11. Core Frontend Surfaces

### 11.1 MVP Surfaces

```text
1. Order Lifecycle
2. PCD Readiness
3. Weekly Planning Workbench
4. Daily Production Release
5. Workcenter Load Monitor
6. Sewing Line Loading
7. Wash Planning
8. WIP and Queue Monitoring
9. Exception and Alert Management
10. Shipment Readiness
```

### 11.2 MVP-Adjacent Surfaces

```text
Handheld Shopfloor Home
Sewing Output Capture
Wash Execution Capture
QC Defect Capture
Department Handover Capture
Live Production Control Board
Operation Bulletin Master
Line Master
Pipeline WIP Inventory
```

### 11.3 Mature-State Surfaces

```text
Executive Control Tower
Enquiry and Costing
Sampling and Approvals
BOM and Material Planning
Procurement Follow-up
Fabric Inward and QC
Line Realignment
Line Balance Board
Quality Management
Rework and Recovery
Calendar/Gantt Planning
What-if Simulation
Plan Change Approval
Master Data Governance
Performance Analytics
Role-Based Home Pages
```

---

## 12. Database Architecture

### 12.1 PostgreSQL as Transactional Source of Truth

PostgreSQL should store:

- master data
- transaction data
- operational events
- planning state
- audit history
- snapshots

### 12.2 Key Data Groups

```text
Identity and RBAC
Organization masters
Customer/order
Style/BOM/operation bulletin
Line/machine/skill
Material/procurement/fabric QC
PCD readiness
Planning and release
Sewing and wash execution
WIP inventory
QC/rework/exceptions
Shipment readiness
Audit and snapshots
```

### 12.3 Snapshot Strategy

Operational views should use current tables. Analytics and heavy dashboards should use snapshots.

Recommended snapshots:

```text
daily_order_status_snapshot
daily_workcenter_load_snapshot
daily_line_efficiency_snapshot
daily_wip_pipeline_snapshot
daily_shipment_readiness_snapshot
daily_exception_snapshot
```

---

## 13. Data Flow Architecture

## 13.1 Order Flow

```text
Order import/create
→ style and BOM linkage
→ material planning
→ PCD readiness
→ weekly plan
→ daily release
→ production execution
→ WIP movement
→ QC
→ shipment readiness
→ dispatch
```

## 13.2 Planning Flow

```text
Order book
→ readiness filter
→ capacity check
→ weekly plan
→ plan freeze
→ daily release
→ live actuals
→ variance detection
→ recovery action
```

## 13.3 Shopfloor Flow

```text
Supervisor opens handheld screen
→ selects active line/order/batch
→ enters output/defect/downtime/handover
→ API validates and saves event
→ WIP and capacity update
→ exceptions generated if needed
→ planner dashboard refreshes
```

---

## 14. Integration Architecture

The platform may need to coexist with or integrate with existing systems.

### 14.1 Integration Sources

```text
ERP/order system
FastReact
Excel trackers during transition
HR attendance system
maintenance system
procurement system
shipment/logistics system
barcode/QR system
```

### 14.2 Source-of-Truth Rules

| Data | Preferred Source |
|---|---|
| Order / PO | ERP or controlled import |
| Style / BOM | Technical master or controlled import |
| Planning state | Eratex planning platform |
| Production actuals | Handheld/shopfloor capture |
| Fabric QC | Eratex planning platform or QC integration |
| Shipment readiness | Eratex planning platform |
| RBAC | Django Admin |
| Analytics | Platform snapshots |

### 14.3 FastReact Coexistence Options

There are three possible approaches:

```text
Option 1: Replace FastReact gradually.
Option 2: Integrate FastReact for high-level planning only.
Option 3: Use this platform as execution-control layer beside FastReact.
```

Recommended initial approach:

```text
Treat this platform as the operational execution-control and readiness layer.
Map where FastReact is useful.
Do not depend on FastReact for WIP, live output, wash rework, PCD gate, or shipment readiness unless those are proven live and reliable.
```

---

## 15. RBAC and Django Admin Architecture

### 15.1 Why Django Admin

Django Admin is suitable for:

```text
user administration
role administration
permission mapping
master data maintenance
factory/workcenter/line configuration
threshold setup
lookup tables
integration settings
audit review
```

### 15.2 Why Custom Frontend Is Still Required

Django Admin is not suitable for:

```text
weekly planning workbench
line loading board
wash planning board
WIP pipeline dashboard
shopfloor handheld capture
shipment readiness board
control tower
```

Therefore:

```text
Django Admin = configuration and governance layer
Custom frontend = operational execution layer
```

---

## 16. API Architecture

The API should be REST-first.

Base path:

```text
/api/v1/
```

Core API principles:

```text
consistent response envelope
pagination on list endpoints
filtering and sorting standards
OpenAPI documentation
role-based permissions
audit on critical writes
backend-owned calculations
```

Example endpoint groups:

```text
/api/v1/orders
/api/v1/pcd-readiness
/api/v1/planning/weekly
/api/v1/releases/daily
/api/v1/workcenters/load
/api/v1/sewing
/api/v1/wash
/api/v1/wip
/api/v1/exceptions
/api/v1/shipments
/api/v1/operation-bulletins
/api/v1/shopfloor
/api/v1/analytics
```

---

## 17. Event and Recalculation Architecture

Critical user actions should create events and trigger recalculations.

Examples:

| Event | Recalculation |
|---|---|
| Fabric QC passed | PCD readiness |
| PCD released | order lifecycle and cutting release |
| Sewing output entered | line efficiency, WIP, order status |
| Wash rework required | wash load, shipment risk |
| WIP moved | queue, ageing, workcenter load |
| QC hold created | WIP hold, exception, order risk |
| Shipment checklist updated | shipment readiness |
| Plan frozen | audit and workcenter load snapshot |

Celery should run:

```text
scheduled risk recalculation
daily snapshots
integration imports
alert escalation
analytics aggregates
stale data checks
```

---

## 18. Offline and Handheld Architecture

Handheld screens should be implemented as responsive web/PWA.

### 18.1 Offline Needs

Support:

```text
local draft storage
unsynced indicator
retry sync
conflict warning
original timestamp preservation
```

### 18.2 Sync Rule

For offline entries:

```text
capture local UUID
capture original timestamp
sync when network returns
validate against latest server state
if conflict, require supervisor resolution
```

### 18.3 Device Role

Shopfloor devices should be role-limited:

```text
line supervisor sees assigned lines
wash supervisor sees wash batches
QC sees QC capture
shipment user sees packing/shipment updates
```

---

## 19. Performance Architecture

### 19.1 Expected Load Patterns

High-load screens:

```text
order grid
weekly planning board
workcenter load
WIP pipeline
sewing output
wash board
exceptions
shipment readiness
```

### 19.2 Performance Strategies

```text
database indexes
server-side pagination
server-side filtering
cached snapshots
async calculations
materialized views where useful
frontend virtualization
partial refresh
stale data indicators
```

### 19.3 Avoid

```text
client-side filtering on huge data
unbounded API list responses
heavy calculations in frontend
real-time polling every few seconds across all screens
```

Use targeted refreshes and event-based refresh later if needed.

---

## 20. Security Architecture

### 20.1 Security Requirements

```text
authenticated access
role-based module visibility
action-level permissions
audit for critical actions
secure session/token handling
CSRF protection if session auth
HTTPS in production
environment-specific secrets
```

### 20.2 Sensitive Operations

Require higher permission:

```text
approve conditional PCD
override blocked release
freeze weekly plan
approve line realignment
release QC hold
mark shipment ready
close critical exception
change master data
```

---

## 21. Audit Architecture

Audit should be implemented as a first-class capability.

Audit events must capture:

```text
entity type
entity ID
action
old value
new value
performed by
performed at
reason
source
```

Audited actions:

```text
PCD conditional release
blocked release override
plan freeze
plan change
operation bulletin approval
line realignment
QC hold release
rewash decision
WIP adjustment
shipment readiness
exception closure
master data change
```

---

## 22. Docker Architecture

### 22.1 Recommended Docker Compose Services

```yaml
services:
  backend:
    build: ./backend
    command: gunicorn config.wsgi:application --bind 0.0.0.0:8000
    env_file:
      - .env
    depends_on:
      - postgres
      - redis

  frontend:
    build: ./frontend
    env_file:
      - .env
    depends_on:
      - backend

  postgres:
    image: postgres:16
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7

  celery_worker:
    build: ./backend
    command: celery -A config worker -l info
    depends_on:
      - backend
      - redis
      - postgres

  celery_beat:
    build: ./backend
    command: celery -A config beat -l info
    depends_on:
      - backend
      - redis
      - postgres

  reverse_proxy:
    image: nginx:alpine
    depends_on:
      - frontend
      - backend
```

### 22.2 Volumes

```text
postgres_data
media_files
static_files
logs
```

---

## 23. Environment Strategy

Recommended environments:

```text
local
dev
staging
production
```

Each environment must have:

```text
separate database
separate environment variables
separate media storage
separate secrets
separate allowed hosts
separate debug setting
```

---

## 24. DevOps and CI/CD Direction

A standard pipeline should include:

```text
lint backend
run backend tests
check migrations
build backend image
lint frontend
type-check frontend
run frontend tests
build frontend image
run integration tests
deploy to staging
manual UAT approval
deploy to production
```

---

## 25. Observability

Minimum observability:

```text
backend request logs
frontend error logs
Celery task logs
integration logs
audit logs
health endpoints
```

Recommended tools:

```text
Sentry for errors
Prometheus/Grafana for metrics
structured JSON logs
database slow query monitoring
```

Health endpoints:

```text
/api/v1/health
/api/v1/health/db
/api/v1/health/redis
/api/v1/health/celery
```

---

## 26. Backup and Recovery

Minimum requirements:

```text
daily PostgreSQL backup
media file backup
backup retention policy
monthly restore test
pre-migration production backup
```

Backup scope:

```text
database
media uploads
import files
configuration
environment documentation
```

---

## 27. Phase-Wise Build Architecture

### Phase 1: Foundation

```text
Docker stack
Django project
PostgreSQL
Django Admin
RBAC
master data foundation
audit base
OpenAPI
frontend shell
```

### Phase 2: Order and Readiness

```text
orders
style master
BOM placeholder
PCD readiness
fabric QC placeholder
order lifecycle UI
PCD UI
```

### Phase 3: Planning and Release

```text
weekly planning
workcenter capacity
daily release
plan freeze
release validation
workcenter load UI
```

### Phase 4: Sewing and Line Routing

```text
operation bulletin
line master
line loading
sewing output
net-good output
line realignment
line balance
```

### Phase 5: Wash and WIP

```text
wash route
wash batch
rewash
WIP pipeline
WIP movement
queue ageing
```

### Phase 6: Quality, Exceptions, Shipment

```text
QC inspections
defects
holds
exceptions
recovery actions
shipment readiness
```

### Phase 7: Handheld and Live Control

```text
mobile output capture
mobile QC
mobile wash execution
handover
downtime
live production control board
```

### Phase 8: Analytics and Governance

```text
snapshots
OTIF
utilization
efficiency
operation bulletin performance
audit hardening
integration hardening
```

---

## 28. Key Architecture Decisions

| Decision | Recommendation |
|---|---|
| Backend | Django |
| Admin/RBAC | Django Admin + custom action permissions |
| Database | PostgreSQL |
| Frontend | Next.js/React + TypeScript |
| Dense grids | AG Grid or TanStack Table |
| Mobile | PWA/responsive web |
| Deployment | Docker Compose initially |
| Background jobs | Celery + Redis |
| Business logic | Backend service layer |
| Audit | First-class audit table |
| Analytics | PostgreSQL snapshots initially |
| Future analytics | ClickHouse only if needed |
| FastReact | Coexist/integrate only after gap mapping |

---

## 29. Risks and Mitigation

| Risk | Mitigation |
|---|---|
| System becomes another reporting layer | Build daily release, handheld capture, and exceptions early |
| Users continue Excel | Replace the Excel routines: PCD, line load, WIP, shipment readiness |
| Bad master data | Django Admin + completeness checks + approval workflow |
| Wash complexity under-modeled | Include wash route, batch, rewash in early build |
| Frontend hardcodes planning logic | Backend-owned calculations |
| Performance issues on large grids | Server pagination, indexes, snapshots, virtualization |
| Mobile data loss | Offline draft and sync status |
| RBAC gaps | Action-level permissions and audit |
| FastReact overlap confusion | Define coexistence role before integration |
| Alert overload | Alert only readiness/capacity/WIP/quality/shipment risks |

---

## 30. Non-Negotiable Architecture Rules

```text
1. PostgreSQL is the primary transactional source of truth.
2. Django Admin controls RBAC and master data.
3. Planner-facing screens must be custom frontend, not Admin.
4. Business logic belongs in backend services.
5. Critical state changes must be audited.
6. PCD readiness must be a real gate.
7. Wash planning must be modeled as production constraint.
8. WIP must be pipeline-wide, not only department-local.
9. Shopfloor actuals must be captured live or near-live.
10. The system must reduce Excel dependency, not add another parallel tracker.
```

---

## 31. Summary

The Eratex Planning & Scheduling Platform should be built as a Dockerized Django + PostgreSQL + React/Next.js system.

The backend should provide a governed, auditable, service-driven planning engine. Django Admin should manage RBAC, master data, configuration, and governance. PostgreSQL should be the transactional source of truth. Celery and Redis should handle async recalculations, snapshots, alerts, and imports.

The frontend should be a dense operational planning cockpit with desktop workbenches and handheld/PWA shopfloor screens. It should support order lifecycle, PCD readiness, weekly planning, daily release, sewing line loading, wash planning, WIP inventory, exceptions, and shipment readiness.

The architecture must be modular, auditable, scalable, and phased. Its primary purpose is to turn Eratex’s planning process from Excel-driven firefighting into a live, system-led operating discipline.
