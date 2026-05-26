# 06. API and Data Contracts Specification  
# Eratex End-to-End Planning & Scheduling Platform

**Company:** Eratex  
**Product:** Planning & Scheduling Tool for Denim Bottoms + Chinos Manufacturing  
**Document Type:** API and Data Contracts Specification  
**Version:** 2.0  
**Date:** 2026-05-26  
**Backend Stack:** Django + Django REST Framework + PostgreSQL + Celery  
**Frontend Stack Context:** React/Next.js + TypeScript + TanStack Query + AG Grid/TanStack Table + PWA Mobile Screens  
**Related Documents:**  
- 01 Technical Architecture Spine  
- 02 Data Model and Table Schema Specification  
- 03 Master Data Specification  
- 04 Planning Logic and Calculation Flows  
- 05 Backend Domain Module Specification  

---

## 1. Purpose

This document defines the REST API and data-contract specification for the Eratex Planning & Scheduling Platform.

The API layer must support:

```text
desktop planning workbenches
mobile / handheld shopfloor capture
Django Admin-backed master data
role-based action control
live planning status
planning calculations
state transitions
audit trail
analytics dashboards
integration/import flows
```

This document should guide:

- Django REST Framework endpoint implementation
- frontend TypeScript type definitions
- API serializer design
- backend service boundaries
- API tests
- OpenAPI/Swagger documentation
- UAT data validation
- integration planning

---

## 2. API Design Principles

### 2.1 REST-First

The first implementation should use REST APIs with JSON payloads.

GraphQL is not recommended for MVP because the platform is workflow-heavy and needs strongly governed backend actions.

### 2.2 Backend Owns Business Logic

The API must return calculated values such as:

```text
readiness_status
risk_status
can_release
constraint_status
wip_ageing_status
shipment_readiness_status
suggested_action
```

The frontend should not recalculate these independently.

### 2.3 Action APIs for State Transitions

Critical workflow actions should use explicit action endpoints.

Examples:

```text
POST /api/v1/orders/{id}/release-to-cutting
POST /api/v1/planning/weekly/{id}/freeze
POST /api/v1/exceptions/{id}/close
POST /api/v1/wash/batches/{id}/rewash
POST /api/v1/orders/{id}/mark-shipment-ready
```

Do not rely only on generic `PATCH status = X` for critical transitions.

### 2.4 Consistent Response Shape

All APIs should return a consistent response envelope.

### 2.5 Permission-Enforced APIs

Every write/action endpoint must enforce role/action permission server-side.

Frontend hiding of buttons is not sufficient.

### 2.6 Auditable Actions

Critical actions must trigger audit events.

### 2.7 Filterable Lists

Planning screens need dense grids. List APIs must support:

```text
pagination
search
filtering
sorting
date ranges
factory scoping
status filtering
risk filtering
```

### 2.8 No Unbounded Large Responses

APIs must not return unbounded large datasets. Use pagination, date windows, or aggregation endpoints.

---

## 3. API Base Conventions

## 3.1 Base Path

```text
/api/v1/
```

## 3.2 Content Type

```text
Content-Type: application/json
Accept: application/json
```

File uploads may use:

```text
multipart/form-data
```

## 3.3 Authentication

Recommended MVP options:

```text
Session authentication for web app if same domain
JWT/token authentication if frontend and backend are separated
```

For mobile/PWA, token-based auth may be more convenient.

## 3.4 Timezone

All datetime fields should be ISO-8601 with timezone.

Example:

```json
"releasedAt": "2026-06-05T14:30:00+07:00"
```

Dates should be ISO date strings:

```json
"plannedPcdDate": "2026-06-05"
```

## 3.5 ID Format

Domain IDs should use UUID strings.

Example:

```json
"id": "b2fc0e34-5be7-4ef2-946d-bd68b6b5996f"
```

---

## 4. Standard Response Envelope

## 4.1 Success Response: Object

```json
{
  "data": {
    "id": "uuid",
    "status": "READY"
  },
  "meta": {},
  "errors": []
}
```

## 4.2 Success Response: List

```json
{
  "data": [
    {
      "id": "uuid",
      "orderNo": "ORD-1001"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 50,
    "total": 1240,
    "totalPages": 25
  },
  "errors": []
}
```

## 4.3 Error Response

```json
{
  "data": null,
  "meta": {},
  "errors": [
    {
      "code": "PCD_BLOCKED",
      "message": "Order cannot be released to cutting because Fabric QC is pending.",
      "field": "fabricQc",
      "details": {
        "blockingItem": "FABRIC_QC_PASSED"
      }
    }
  ]
}
```

## 4.4 Partial Validation Response

Used for validations and previews.

```json
{
  "data": {
    "canProceed": false,
    "status": "BLOCKED",
    "validationItems": [
      {
        "code": "FABRIC_QC_PASSED",
        "label": "Fabric QC Passed",
        "status": "FAILED",
        "message": "Fabric QC is still pending."
      }
    ]
  },
  "meta": {},
  "errors": []
}
```

---

## 5. Standard HTTP Status Codes

| Status Code | Meaning |
|---:|---|
| 200 | Successful read/update |
| 201 | Created |
| 202 | Accepted for async processing |
| 204 | Successful no-content response |
| 400 | Validation error |
| 401 | Unauthenticated |
| 403 | Authenticated but not permitted |
| 404 | Resource not found |
| 409 | Conflict/state transition not allowed |
| 422 | Business rule violation |
| 500 | Server error |

### 5.1 Recommended Business Rule Response

Use `409` or `422` for blocked transitions.

Example:

```json
{
  "data": {
    "canRelease": false,
    "readinessStatus": "BLOCKED"
  },
  "errors": [
    {
      "code": "RELEASE_NOT_ALLOWED",
      "message": "Release to cutting is blocked."
    }
  ]
}
```

---

## 6. Common Query Parameters

All list APIs should support a consistent pattern where applicable.

```text
?page=1
&pageSize=50
&search=STY-1001
&ordering=-committedShipDate
&factoryId=uuid
&customerId=uuid
&dateFrom=2026-06-01
&dateTo=2026-06-30
&status=BLOCKED
&riskStatus=RED
&ownerId=45
```

### 6.1 Pagination

Default:

```text
pageSize = 50
maxPageSize = 500
```

### 6.2 Ordering

Use camelCase field names in API query.

Example:

```text
ordering=committedShipDate
ordering=-committedShipDate
```

Backend may map to model fields internally.

### 6.3 Search

`search` should support common identifiers:

```text
order number
PO number
style code
customer name
buyer name
batch number
exception number
line code
```

---

## 7. Common Data Types and Enums

## 7.1 RiskStatus

```json
["GREEN", "YELLOW", "RED", "BLACK"]
```

## 7.2 LifecycleStage

```json
[
  "CREATED",
  "PRE_PRODUCTION",
  "PCD_PENDING",
  "PCD_READY",
  "CUTTING",
  "SEWING",
  "WASHING",
  "FINISHING",
  "PACKING",
  "SHIPMENT_READY",
  "SHIPPED",
  "ON_HOLD"
]
```

## 7.3 ReadinessStatus

```json
[
  "IN_REVIEW",
  "READY",
  "CONDITIONALLY_READY",
  "BLOCKED",
  "ESCALATED",
  "RELEASED"
]
```

## 7.4 ChecklistItemStatus

```json
["PENDING", "PASSED", "FAILED", "WAIVED", "NOT_APPLICABLE"]
```

## 7.5 WorkcenterConstraintStatus

```json
["NORMAL", "WATCH", "OVERLOADED", "CONSTRAINT", "CRITICAL_CONSTRAINT"]
```

## 7.6 ReleaseStatus

```json
[
  "DRAFT",
  "VALIDATED",
  "BLOCKED",
  "RELEASED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED"
]
```

## 7.7 ExceptionStatus

```json
["OPEN", "ASSIGNED", "IN_PROGRESS", "ESCALATED", "RESOLVED", "CLOSED", "REOPENED"]
```

## 7.8 WipStatus

```json
["WAITING", "IN_PROCESS", "HELD", "REWORK", "READY_TO_MOVE", "MOVED", "CLOSED"]
```

## 7.9 ShipmentReadinessStatus

```json
["NOT_STARTED", "IN_PROGRESS", "BLOCKED", "READY", "DISPATCHED", "CLOSED"]
```

---

# Part A: Identity, Permissions, and Session APIs

---

## 8. Current User API

### 8.1 GET /api/v1/me

Returns authenticated user profile, roles, factory, department, and feature permissions.

### Response

```json
{
  "data": {
    "id": 45,
    "username": "planner01",
    "displayName": "Planner 01",
    "employeeCode": "EMP-0045",
    "factory": {
      "id": "uuid",
      "code": "F01",
      "name": "Main Denim Unit"
    },
    "department": {
      "id": "uuid",
      "code": "PLANNING",
      "name": "Planning"
    },
    "roles": [
      {
        "code": "PRODUCTION_PLANNER",
        "name": "Production Planner"
      }
    ],
    "permissions": [
      "orders.view",
      "pcd.view",
      "planning.edit",
      "release.create"
    ],
    "isShopfloorUser": false
  },
  "meta": {},
  "errors": []
}
```

### Frontend Usage

Used for:

```text
route guards
visible modules
action buttons
factory default
role-specific home page
```

---

## 9. Permission Check API

### 9.1 GET /api/v1/me/permissions

Optional if `/me` returns permissions.

### Response

```json
{
  "data": {
    "permissions": [
      "pcd.approve_conditional_release",
      "planning.freeze_weekly_plan"
    ]
  },
  "meta": {},
  "errors": []
}
```

---

# Part B: Master and Reference APIs

---

## 10. Master List APIs

These APIs primarily support frontend dropdowns, filters, and lookup labels. Most write operations may be done through Django Admin in MVP.

### 10.1 GET /api/v1/master/factories

```json
{
  "data": [
    {
      "id": "uuid",
      "code": "F01",
      "name": "Main Denim Unit",
      "timezone": "Asia/Jakarta",
      "isActive": true
    }
  ],
  "meta": {},
  "errors": []
}
```

### 10.2 GET /api/v1/master/workcenters

Query params:

```text
factoryId
workcenterType
isActive
```

Response item:

```json
{
  "id": "uuid",
  "code": "WET_WASH",
  "name": "Wet Wash",
  "workcenterType": "WET_WASH",
  "capacityUnit": "MINUTES",
  "isConstraintCandidate": true
}
```

### 10.3 GET /api/v1/master/lines

Response item:

```json
{
  "id": "uuid",
  "lineCode": "LINE-05",
  "name": "Line 05",
  "lineType": "DENIM",
  "factoryId": "uuid",
  "supervisor": {
    "id": 45,
    "displayName": "Supervisor A"
  },
  "standardManpower": 42,
  "currentManpower": 39,
  "baselineEfficiency": 68.5,
  "status": "ACTIVE"
}
```

### 10.4 Other Master APIs

```text
GET /api/v1/master/customers
GET /api/v1/master/buyers
GET /api/v1/master/materials
GET /api/v1/master/vendors
GET /api/v1/master/machines
GET /api/v1/master/defect-codes
GET /api/v1/master/hold-reasons
GET /api/v1/master/wash-routes
GET /api/v1/master/planning-thresholds
```

---

# Part C: Order Lifecycle APIs

---

## 11. Order List API

### 11.1 GET /api/v1/orders

Used by Order Lifecycle surface.

### Query Parameters

```text
factoryId
customerId
buyerId
styleCode
productType
currentStage
riskStatus
ownerId
shipmentDateFrom
shipmentDateTo
pcdStatus
shipmentWeek
search
ordering
page
pageSize
```

### Response Item

```json
{
  "id": "uuid",
  "orderNo": "ORD-1001",
  "poNumber": "PO-5581",
  "customer": {
    "id": "uuid",
    "code": "CUST-A",
    "name": "Customer A"
  },
  "buyer": {
    "id": "uuid",
    "code": "BUYER-A",
    "name": "Buyer A"
  },
  "style": {
    "id": "uuid",
    "styleCode": "STY-5001"
  },
  "productType": "DENIM_BOTTOM",
  "orderQty": 12000,
  "committedShipDate": "2026-07-15",
  "currentStage": "SEWING",
  "lifecycleStatus": "IN_PROGRESS",
  "riskStatus": "RED",
  "pcdStatus": "RELEASED",
  "washStatus": "WAITING",
  "shipmentReadinessStatus": "IN_PROGRESS",
  "owner": {
    "id": 45,
    "displayName": "Planner A"
  },
  "nextAction": "Resolve wet wash overload",
  "openExceptionCount": 3,
  "lastUpdatedAt": "2026-06-05T10:15:00+07:00"
}
```

---

## 12. Order Detail API

### 12.1 GET /api/v1/orders/{orderId}

### Response

```json
{
  "data": {
    "id": "uuid",
    "orderNo": "ORD-1001",
    "poNumber": "PO-5581",
    "customer": {
      "id": "uuid",
      "name": "Customer A"
    },
    "buyer": {
      "id": "uuid",
      "name": "Buyer A"
    },
    "style": {
      "id": "uuid",
      "styleCode": "STY-5001",
      "productType": "DENIM_BOTTOM",
      "washComplexity": "HIGH",
      "sewingComplexity": "MEDIUM"
    },
    "orderQty": 12000,
    "committedShipDate": "2026-07-15",
    "currentStage": "SEWING",
    "lifecycleStatus": "IN_PROGRESS",
    "riskStatus": "RED",
    "owner": {
      "id": 45,
      "displayName": "Planner A"
    },
    "summary": {
      "cutQty": 8000,
      "sewnQty": 5200,
      "washedQty": 2600,
      "finishedQty": 1400,
      "packedQty": 900,
      "shipmentReadyQty": 0
    },
    "openBlockers": [
      {
        "category": "WASH",
        "severity": "RED",
        "message": "Wet wash capacity overloaded"
      }
    ]
  },
  "meta": {},
  "errors": []
}
```

---

## 13. Order Timeline API

### 13.1 GET /api/v1/orders/{orderId}/timeline

### Response

```json
{
  "data": [
    {
      "milestoneType": "ORDER_CONFIRMED",
      "label": "Order Confirmed",
      "plannedDate": "2026-05-01",
      "actualDate": "2026-05-01",
      "status": "COMPLETED",
      "delayDays": 0
    },
    {
      "milestoneType": "PCD",
      "label": "Planned Cut Date",
      "plannedDate": "2026-06-03",
      "actualDate": "2026-06-04",
      "status": "COMPLETED",
      "delayDays": 1
    }
  ],
  "meta": {},
  "errors": []
}
```

---

## 14. Order Owner Update

### 14.1 PATCH /api/v1/orders/{orderId}/owner

### Request

```json
{
  "ownerId": 45
}
```

### Response

```json
{
  "data": {
    "orderId": "uuid",
    "owner": {
      "id": 45,
      "displayName": "Planner A"
    }
  },
  "meta": {},
  "errors": []
}
```

### Permission

```text
orders.assign_owner
```

---

# Part D: Style, BOM, and Operation Bulletin APIs

---

## 15. Style APIs

### 15.1 GET /api/v1/styles

Query params:

```text
customerId
productType
status
search
```

Response item:

```json
{
  "id": "uuid",
  "styleCode": "STY-5001",
  "customerName": "Customer A",
  "productType": "DENIM_BOTTOM",
  "washComplexity": "HIGH",
  "sewingComplexity": "MEDIUM",
  "status": "APPROVED",
  "planningReady": true
}
```

### 15.2 GET /api/v1/styles/{styleId}/planning-readiness

```json
{
  "data": {
    "styleId": "uuid",
    "styleCode": "STY-5001",
    "planningReady": false,
    "missingItems": [
      "APPROVED_OPERATION_BULLETIN",
      "APPROVED_WASH_ROUTE"
    ]
  },
  "meta": {},
  "errors": []
}
```

---

## 16. Operation Bulletin APIs

### 16.1 GET /api/v1/operation-bulletins

Query params:

```text
styleId
status
customerId
productType
usedInActiveOrder
search
```

Response item:

```json
{
  "id": "uuid",
  "styleId": "uuid",
  "styleCode": "STY-5001",
  "version": "v2",
  "status": "APPROVED",
  "totalSmv": 32.5,
  "operationCount": 42,
  "criticalOperationCount": 5,
  "approvedAt": "2026-05-15T12:00:00+07:00"
}
```

### 16.2 GET /api/v1/operation-bulletins/{bulletinId}

```json
{
  "data": {
    "id": "uuid",
    "style": {
      "id": "uuid",
      "styleCode": "STY-5001"
    },
    "version": "v2",
    "status": "APPROVED",
    "totalSmv": 32.5,
    "operations": [
      {
        "id": "uuid",
        "sequenceNo": 10,
        "operationName": "Front pocket attach",
        "operationGroup": "FRONT_PREP",
        "machineType": "LOCKSTITCH",
        "attachmentRequired": "Pocket folder",
        "skillLevel": "MEDIUM",
        "smv": 0.85,
        "targetPph": 70.5,
        "qcCheckpoint": false,
        "criticalOperation": false,
        "parallelAllowed": true
      }
    ]
  },
  "meta": {},
  "errors": []
}
```

### 16.3 POST /api/v1/operation-bulletins

Creates draft bulletin.

### Request

```json
{
  "styleId": "uuid",
  "version": "v3",
  "operations": [
    {
      "sequenceNo": 10,
      "operationMasterId": "uuid",
      "operationName": "Front pocket attach",
      "operationGroup": "FRONT_PREP",
      "machineType": "LOCKSTITCH",
      "skillLevel": "MEDIUM",
      "smv": 0.85
    }
  ]
}
```

### 16.4 POST /api/v1/operation-bulletins/{bulletinId}/approve

Approves operation bulletin.

### Permission

```text
bulletin.approve
```

### Response

```json
{
  "data": {
    "id": "uuid",
    "status": "APPROVED",
    "approvedAt": "2026-06-05T11:00:00+07:00",
    "totalSmv": 32.5
  },
  "meta": {},
  "errors": []
}
```

---

# Part E: Material, Procurement, and Fabric QC APIs

---

## 17. Material Status by Order

### 17.1 GET /api/v1/orders/{orderId}/material-status

```json
{
  "data": {
    "orderId": "uuid",
    "overallStatus": "SHORT",
    "materials": [
      {
        "materialId": "uuid",
        "materialCode": "FAB-DEN-001",
        "materialName": "12 oz Stretch Denim",
        "materialType": "MAIN_FABRIC",
        "requiredQty": 15000.0,
        "orderedQty": 15000.0,
        "receivedQty": 12000.0,
        "shortageQty": 3000.0,
        "requiredDate": "2026-06-01",
        "eta": "2026-06-05",
        "status": "PARTIALLY_RECEIVED",
        "riskStatus": "RED"
      }
    ]
  },
  "meta": {},
  "errors": []
}
```

---

## 18. Calculate Material Requirements

### 18.1 POST /api/v1/orders/{orderId}/calculate-materials

Creates or refreshes material requirements from approved BOM.

### Response

```json
{
  "data": {
    "orderId": "uuid",
    "calculatedAt": "2026-06-05T11:15:00+07:00",
    "requirementsCreated": 18,
    "requirementsUpdated": 3,
    "warnings": [
      "BOM line for carton has missing wastage percent; defaulted to 0."
    ]
  },
  "meta": {},
  "errors": []
}
```

---

## 19. Vendor PO APIs

### 19.1 GET /api/v1/material-pos

Query params:

```text
vendorId
orderId
materialId
status
etaFrom
etaTo
delayedOnly
```

### Response Item

```json
{
  "id": "uuid",
  "poNo": "MPO-1001",
  "vendor": {
    "id": "uuid",
    "name": "Vendor A",
    "nominated": true
  },
  "orderNo": "ORD-1001",
  "materialCode": "FAB-DEN-001",
  "orderedQty": 15000.0,
  "expectedArrivalDate": "2026-06-03",
  "revisedEta": "2026-06-07",
  "actualArrivalDate": null,
  "status": "OPEN",
  "riskStatus": "RED"
}
```

### 19.2 PATCH /api/v1/material-pos/{poId}/eta

```json
{
  "revisedEta": "2026-06-07",
  "reason": "Vendor production delay"
}
```

---

## 20. Fabric QC APIs

### 20.1 GET /api/v1/fabric/lots

Query params:

```text
orderId
status
shadeLot
qcStatus
```

### Response Item

```json
{
  "id": "uuid",
  "orderNo": "ORD-1001",
  "lotNo": "LOT-001",
  "shadeLot": "SH-A",
  "receivedQty": 12000.0,
  "receivedDate": "2026-05-25",
  "status": "RECEIVED",
  "rollCount": 48,
  "qcStatus": "PARTIAL"
}
```

### 20.2 POST /api/v1/fabric/qc-inspections

```json
{
  "fabricRollId": "uuid",
  "inspectionDate": "2026-05-26",
  "fourPointScore": 22.5,
  "widthResult": 58.2,
  "gsmResult": 12.1,
  "shrinkagePercent": 3.5,
  "skewingResult": "PASS",
  "stretchRecoveryResult": "PASS",
  "status": "PASSED",
  "remarks": "Accepted"
}
```

### 20.3 GET /api/v1/orders/{orderId}/fabric-qc-status

```json
{
  "data": {
    "orderId": "uuid",
    "overallStatus": "HOLD",
    "rollsTotal": 48,
    "rollsPassed": 40,
    "rollsFailed": 2,
    "rollsPending": 6,
    "shadeLots": [
      {
        "shadeLot": "SH-A",
        "status": "PASSED",
        "qty": 8000.0
      }
    ],
    "pcdImpact": "BLOCKED"
  },
  "meta": {},
  "errors": []
}
```

---

# Part F: PCD Readiness APIs

---

## 21. PCD Readiness List

### 21.1 GET /api/v1/pcd-readiness

Query params:

```text
factoryId
readinessStatus
plannedPcdFrom
plannedPcdTo
customerId
ownerId
blockedOnly
escalatedOnly
search
```

### Response Item

```json
{
  "orderId": "uuid",
  "orderNo": "ORD-1001",
  "customerName": "Customer A",
  "styleCode": "STY-5001",
  "plannedPcdDate": "2026-06-05",
  "readinessStatus": "BLOCKED",
  "riskStatus": "RED",
  "blockingItemCount": 2,
  "blockingItems": [
    "FABRIC_QC_PASSED",
    "TRIMS_AVAILABLE"
  ],
  "owner": {
    "id": 45,
    "displayName": "Planner A"
  },
  "canReleaseToCutting": false
}
```

---

## 22. Order PCD Readiness Detail

### 22.1 GET /api/v1/orders/{orderId}/pcd-readiness

```json
{
  "data": {
    "orderId": "uuid",
    "orderNo": "ORD-1001",
    "plannedPcdDate": "2026-06-05",
    "readinessStatus": "BLOCKED",
    "canReleaseToCutting": false,
    "conditionalRelease": false,
    "items": [
      {
        "code": "FABRIC_QC_PASSED",
        "label": "Fabric QC Passed",
        "isMandatory": true,
        "status": "FAILED",
        "owner": {
          "id": 51,
          "displayName": "Fabric QC Lead"
        },
        "dueDate": "2026-06-04",
        "message": "6 rolls pending inspection",
        "evidenceUrl": null
      },
      {
        "code": "TRIMS_AVAILABLE",
        "label": "Trims Available",
        "isMandatory": true,
        "status": "PENDING",
        "owner": {
          "id": 62,
          "displayName": "Procurement User"
        },
        "dueDate": "2026-06-05",
        "message": "Buttons short by 2,000 pcs"
      }
    ]
  },
  "meta": {},
  "errors": []
}
```

---

## 23. Update PCD Checklist Item

### 23.1 PATCH /api/v1/orders/{orderId}/pcd-readiness/items/{itemCode}

### Request

```json
{
  "status": "PASSED",
  "remarks": "Fabric QC completed",
  "evidenceUrl": "https://example.com/file.pdf"
}
```

### Response

```json
{
  "data": {
    "orderId": "uuid",
    "readinessStatus": "READY",
    "updatedItem": {
      "code": "FABRIC_QC_PASSED",
      "status": "PASSED"
    }
  },
  "meta": {},
  "errors": []
}
```

---

## 24. Conditional PCD Release

### 24.1 POST /api/v1/orders/{orderId}/pcd-conditional-release

### Request

```json
{
  "reason": "Trim arrival is confirmed before sewing start; cutting can proceed.",
  "openItems": [
    "TRIMS_AVAILABLE"
  ],
  "expiryDate": "2026-06-08",
  "riskNote": "If trims slip beyond June 8, sewing release will be blocked."
}
```

### Permission

```text
pcd.approve_conditional_release
```

### Response

```json
{
  "data": {
    "orderId": "uuid",
    "readinessStatus": "CONDITIONALLY_READY",
    "conditionalRelease": true,
    "approvedBy": {
      "id": 12,
      "displayName": "Production Head"
    },
    "approvedAt": "2026-06-05T12:05:00+07:00"
  },
  "meta": {},
  "errors": []
}
```

---

## 25. Release to Cutting

### 25.1 POST /api/v1/orders/{orderId}/release-to-cutting

### Request

```json
{
  "releaseQty": 5000,
  "releaseDate": "2026-06-05",
  "remarks": "First lot cutting release"
}
```

### Response: Success

```json
{
  "data": {
    "releaseId": "uuid",
    "orderId": "uuid",
    "releaseType": "CUTTING",
    "releaseQty": 5000,
    "status": "RELEASED",
    "releasedAt": "2026-06-05T12:30:00+07:00"
  },
  "meta": {},
  "errors": []
}
```

### Response: Blocked

```json
{
  "data": {
    "canRelease": false,
    "readinessStatus": "BLOCKED",
    "blockingItems": [
      "FABRIC_QC_PASSED"
    ]
  },
  "meta": {},
  "errors": [
    {
      "code": "PCD_BLOCKED",
      "message": "Order cannot be released to cutting because Fabric QC is not passed."
    }
  ]
}
```

---

# Part G: Planning APIs

---

## 26. Weekly Planning Board

### 26.1 GET /api/v1/planning/weekly

Query params:

```text
factoryId
horizonStart
horizonEnd
planStatus
customerId
workcenterId
lineId
riskStatus
```

### Response

```json
{
  "data": {
    "planVersionId": "uuid",
    "factoryId": "uuid",
    "planType": "WEEKLY",
    "horizonStart": "2026-06-01",
    "horizonEnd": "2026-06-28",
    "status": "DRAFT",
    "workItems": [
      {
        "id": "uuid",
        "orderId": "uuid",
        "orderNo": "ORD-1001",
        "styleCode": "STY-5001",
        "workcenterId": "uuid",
        "workcenterName": "Sewing Line 05",
        "lineId": "uuid",
        "plannedStart": "2026-06-10T08:00:00+07:00",
        "plannedEnd": "2026-06-14T17:00:00+07:00",
        "plannedQty": 5000,
        "plannedLoadMinutes": 160000,
        "riskStatus": "YELLOW",
        "status": "PLANNED"
      }
    ],
    "capacitySummary": [
      {
        "workcenterId": "uuid",
        "workcenterName": "Wet Wash",
        "availableCapacityMinutes": 8000,
        "plannedLoadMinutes": 10400,
        "utilizationPercent": 130.0,
        "constraintStatus": "CRITICAL_CONSTRAINT"
      }
    ]
  },
  "meta": {},
  "errors": []
}
```

---

## 27. Planning Backlog

### 27.1 GET /api/v1/planning/backlog

Returns orders eligible or near-eligible for planning.

Query params:

```text
factoryId
stage
readinessStatus
shipmentWeek
customerId
riskStatus
readyOnly
```

Response item:

```json
{
  "orderId": "uuid",
  "orderNo": "ORD-1001",
  "customerName": "Customer A",
  "styleCode": "STY-5001",
  "orderQty": 12000,
  "committedShipDate": "2026-07-15",
  "pcdStatus": "READY",
  "materialStatus": "READY",
  "washRouteApproved": true,
  "suggestedWorkcenter": "CUTTING",
  "riskStatus": "YELLOW"
}
```

---

## 28. Assign Work Item

### 28.1 POST /api/v1/planning/weekly/assign

### Request

```json
{
  "planVersionId": "uuid",
  "orderId": "uuid",
  "workcenterId": "uuid",
  "lineId": "uuid",
  "plannedStart": "2026-06-10T08:00:00+07:00",
  "plannedEnd": "2026-06-14T17:00:00+07:00",
  "plannedQty": 5000
}
```

### Response

```json
{
  "data": {
    "workItemId": "uuid",
    "status": "PLANNED",
    "capacityImpact": {
      "workcenterId": "uuid",
      "utilizationBefore": 88.0,
      "utilizationAfter": 104.5,
      "constraintStatusAfter": "OVERLOADED"
    },
    "warnings": [
      {
        "code": "WORKCENTER_OVERLOAD",
        "message": "Wet Wash utilization will exceed 100%."
      }
    ]
  },
  "meta": {},
  "errors": []
}
```

---

## 29. Plan Impact Preview

### 29.1 POST /api/v1/planning/weekly/impact-preview

### Request

```json
{
  "planVersionId": "uuid",
  "changes": [
    {
      "action": "MOVE",
      "workItemId": "uuid",
      "newWorkcenterId": "uuid",
      "newLineId": "uuid",
      "newPlannedStart": "2026-06-12T08:00:00+07:00",
      "newPlannedEnd": "2026-06-16T17:00:00+07:00"
    }
  ]
}
```

### Response

```json
{
  "data": {
    "canApply": true,
    "requiresApproval": true,
    "capacityImpact": [
      {
        "workcenterId": "uuid",
        "workcenterName": "Sewing Line 05",
        "utilizationBefore": 92.0,
        "utilizationAfter": 118.0,
        "constraintStatusAfter": "CONSTRAINT"
      }
    ],
    "shipmentImpact": [
      {
        "orderId": "uuid",
        "orderNo": "ORD-1001",
        "riskBefore": "YELLOW",
        "riskAfter": "RED",
        "message": "Projected shipment readiness delayed by 1 day."
      }
    ],
    "affectedOrders": [
      {
        "orderId": "uuid",
        "orderNo": "ORD-1002",
        "impact": "May be displaced from Line 05"
      }
    ],
    "suggestedActions": [
      "Add overtime",
      "Move lower-risk order to Line 07"
    ]
  },
  "meta": {},
  "errors": []
}
```

---

## 30. Freeze Weekly Plan

### 30.1 POST /api/v1/planning/weekly/{planVersionId}/freeze

### Request

```json
{
  "remarks": "Approved in weekly planning meeting"
}
```

### Permission

```text
planning.freeze_weekly_plan
```

### Response

```json
{
  "data": {
    "planVersionId": "uuid",
    "status": "FROZEN",
    "frozenAt": "2026-06-05T15:00:00+07:00",
    "frozenBy": {
      "id": 12,
      "displayName": "Planning Head"
    }
  },
  "meta": {},
  "errors": []
}
```

---

# Part H: Daily Production Release APIs

---

## 31. Daily Release Board

### 31.1 GET /api/v1/releases/daily

Query params:

```text
factoryId
releaseDate
releaseType
workcenterId
lineId
status
```

### Response

```json
{
  "data": {
    "releaseDate": "2026-06-05",
    "readyToRelease": [
      {
        "orderId": "uuid",
        "orderNo": "ORD-1001",
        "releaseType": "SEWING",
        "lineId": "uuid",
        "lineCode": "LINE-05",
        "releaseQty": 800,
        "validationStatus": "READY"
      }
    ],
    "blocked": [
      {
        "orderId": "uuid",
        "orderNo": "ORD-1002",
        "releaseType": "WASH",
        "validationStatus": "BLOCKED",
        "blockingReasons": [
          "Pre-wash QC pending"
        ]
      }
    ],
    "releasedToday": []
  },
  "meta": {},
  "errors": []
}
```

---

## 32. Validate Release

### 32.1 POST /api/v1/releases/validate

### Request

```json
{
  "orderId": "uuid",
  "releaseType": "WASH",
  "releaseQty": 700,
  "workcenterId": "uuid",
  "lineId": null
}
```

### Response

```json
{
  "data": {
    "canRelease": false,
    "status": "BLOCKED",
    "validationItems": [
      {
        "code": "PREVIOUS_PROCESS_COMPLETE",
        "label": "Previous Process Complete",
        "status": "PASSED"
      },
      {
        "code": "PRE_WASH_QC_CLEAR",
        "label": "Pre-Wash QC Clear",
        "status": "FAILED",
        "message": "Pre-wash QC pending for 200 pcs"
      }
    ]
  },
  "meta": {},
  "errors": []
}
```

---

## 33. Create Release

### 33.1 POST /api/v1/releases

### Request

```json
{
  "orderId": "uuid",
  "releaseType": "SEWING",
  "workcenterId": "uuid",
  "lineId": "uuid",
  "releaseDate": "2026-06-05",
  "releaseQty": 800,
  "remarks": "Daily line input release"
}
```

### Response

```json
{
  "data": {
    "releaseId": "uuid",
    "status": "RELEASED",
    "releasedAt": "2026-06-05T08:05:00+07:00"
  },
  "meta": {},
  "errors": []
}
```

---

## 34. Approve Exception Release

### 34.1 POST /api/v1/releases/{releaseId}/approve-exception

### Request

```json
{
  "reason": "Minor trim shortage will be resolved before operation reaches trim attachment.",
  "expiryDate": "2026-06-06",
  "riskNote": "If trims not available by tomorrow, line may stop."
}
```

### Permission

```text
release.override_blocked_release
```

---

# Part I: Workcenter Load APIs

---

## 35. Workcenter Load Dashboard

### 35.1 GET /api/v1/workcenters/load

Query params:

```text
factoryId
dateFrom
dateTo
workcenterType
constraintOnly
```

### Response Item

```json
{
  "workcenterId": "uuid",
  "workcenterCode": "WET_WASH",
  "workcenterName": "Wet Wash",
  "workcenterType": "WET_WASH",
  "availableCapacityMinutes": 8000,
  "plannedLoadMinutes": 10400,
  "actualLoadMinutes": 6400,
  "utilizationPercent": 130.0,
  "queueQty": 5600,
  "oldestWipAgeHours": 38.0,
  "constraintStatus": "CRITICAL_CONSTRAINT",
  "topAffectedOrder": {
    "id": "uuid",
    "orderNo": "ORD-1001"
  },
  "suggestedAction": "Add wash shift or resequence low-risk batches"
}
```

---

## 36. Workcenter Queue

### 36.1 GET /api/v1/workcenters/{workcenterId}/queue

### Response Item

```json
{
  "wipItemId": "uuid",
  "orderId": "uuid",
  "orderNo": "ORD-1001",
  "styleCode": "STY-5001",
  "stage": "SEWN_WAITING_WASH",
  "qty": 1400,
  "ageingHours": 36.5,
  "ageingStatus": "RED",
  "shipmentDate": "2026-07-15",
  "shipmentRisk": "RED",
  "owner": {
    "id": 78,
    "displayName": "Washing Manager"
  }
}
```

---

# Part J: Sewing, Line Routing, and Output APIs

---

## 37. Sewing Line Loading

### 37.1 GET /api/v1/sewing/line-loading

Query params:

```text
factoryId
date
lineId
status
riskStatus
```

### Response Item

```json
{
  "lineId": "uuid",
  "lineCode": "LINE-05",
  "lineName": "Line 05",
  "currentOrder": {
    "id": "uuid",
    "orderNo": "ORD-1001",
    "styleCode": "STY-5001"
  },
  "styleSmv": 32.5,
  "plannedQty": 800,
  "dailyTarget": 700,
  "grossOutput": 420,
  "defectQty": 28,
  "reworkQty": 12,
  "netGoodOutput": 380,
  "efficiencyPercent": 61.5,
  "defectRate": 6.67,
  "manpower": 39,
  "machineIssues": 1,
  "riskStatus": "RED",
  "nextAction": "Rebalance waistband operation"
}
```

---

## 38. Sewing Output Capture

### 38.1 POST /api/v1/sewing/output

Used by handheld/mobile and desktop fallback.

### Request

```json
{
  "orderId": "uuid",
  "lineId": "uuid",
  "entryTime": "2026-06-05T14:00:00+07:00",
  "timeSlot": "14:00-15:00",
  "grossQty": 320,
  "defectQty": 18,
  "reworkQty": 12,
  "netGoodQty": 290,
  "source": "HANDHELD",
  "remarks": "Output after lunch session"
}
```

### Validation Rules

```text
grossQty >= defectQty + reworkQty
netGoodQty = grossQty - defectQty - reworkQty unless server recalculates
line must be active
order must be loaded/released to line
entryTime must not be in future beyond tolerance
```

### Response

```json
{
  "data": {
    "entryId": "uuid",
    "lineId": "uuid",
    "orderId": "uuid",
    "grossQty": 320,
    "netGoodQty": 290,
    "lineSummary": {
      "dailyTarget": 700,
      "netGoodOutputToday": 520,
      "remainingQty": 180,
      "requiredRunRate": 60.0,
      "currentRunRate": 52.0,
      "riskStatus": "YELLOW"
    }
  },
  "meta": {},
  "errors": []
}
```

---

## 39. Line Realignment Preview

### 39.1 POST /api/v1/sewing/line-realignment/preview

### Request

```json
{
  "lineId": "uuid",
  "styleId": "uuid",
  "bulletinId": "uuid",
  "targetOutput": 700,
  "plannedStartDate": "2026-06-10"
}
```

### Response

```json
{
  "data": {
    "lineId": "uuid",
    "styleId": "uuid",
    "expectedOutputBefore": 480,
    "expectedOutputAfter": 650,
    "machineGaps": [
      {
        "machineType": "BARTACK",
        "required": 3,
        "available": 2,
        "gap": 1
      }
    ],
    "skillGaps": [
      {
        "operationName": "Waistband attach",
        "requiredSkill": "HIGH",
        "requiredOperators": 2,
        "availableOperators": 1,
        "gap": 1
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
      "Split waistband attach operation"
    ]
  },
  "meta": {},
  "errors": []
}
```

---

## 40. Approve Line Realignment

### 40.1 POST /api/v1/sewing/line-realignment/{realignmentId}/approve

### Permission

```text
line.approve_realignment
```

### Request

```json
{
  "remarks": "Approved for style STY-5001 loading next week"
}
```

---

# Part K: Wash Planning and Execution APIs

---

## 41. Wash Queue

### 41.1 GET /api/v1/wash/queue

Query params:

```text
factoryId
date
washRouteId
shipmentRisk
ageingStatus
```

### Response Item

```json
{
  "orderId": "uuid",
  "orderNo": "ORD-1001",
  "styleCode": "STY-5001",
  "washRoute": {
    "id": "uuid",
    "code": "HEAVY_ENZYME",
    "name": "Heavy Enzyme Wash"
  },
  "shadeLot": "SH-A",
  "qtyWaiting": 1400,
  "ageingHours": 32.0,
  "shipmentDate": "2026-07-15",
  "shipmentRisk": "RED",
  "suggestedPriority": 1
}
```

---

## 42. Create Wash Batch

### 42.1 POST /api/v1/wash/batches

### Request

```json
{
  "orderId": "uuid",
  "washRouteId": "uuid",
  "shadeLot": "SH-A",
  "qty": 500,
  "plannedStart": "2026-06-05T10:00:00+07:00",
  "plannedEnd": "2026-06-05T14:00:00+07:00"
}
```

### Response

```json
{
  "data": {
    "batchId": "uuid",
    "batchNo": "WB-1001",
    "status": "QUEUED",
    "plannedLoadMinutes": 240
  },
  "meta": {},
  "errors": []
}
```

---

## 43. Wash Batch Detail

### 43.1 GET /api/v1/wash/batches/{batchId}

```json
{
  "data": {
    "batchId": "uuid",
    "batchNo": "WB-1001",
    "orderNo": "ORD-1001",
    "styleCode": "STY-5001",
    "qty": 500,
    "shadeLot": "SH-A",
    "status": "IN_PROCESS",
    "currentStep": "ENZYME",
    "routeSteps": [
      {
        "stepId": "uuid",
        "sequenceNo": 10,
        "stepName": "Dry Process",
        "standardMinutes": 60,
        "status": "COMPLETED",
        "actualStart": "2026-06-05T10:00:00+07:00",
        "actualEnd": "2026-06-05T11:00:00+07:00"
      }
    ]
  },
  "meta": {},
  "errors": []
}
```

---

## 44. Record Wash Event

### 44.1 POST /api/v1/wash/batches/{batchId}/events

### Request

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

---

## 45. Mark Rewash Required

### 45.1 POST /api/v1/wash/batches/{batchId}/rewash

### Request

```json
{
  "reason": "SHADE_TOO_DARK",
  "qty": 300,
  "expectedExtraMinutes": 180,
  "approvalRequired": true,
  "remarks": "Shade darker than approved standard"
}
```

### Response

```json
{
  "data": {
    "batchId": "uuid",
    "status": "REWASH_REQUIRED",
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

# Part L: WIP Inventory APIs

---

## 46. Pipeline WIP Dashboard

### 46.1 GET /api/v1/wip/pipeline

Query params:

```text
factoryId
customerId
orderId
styleId
stage
riskStatus
ageingBucket
blockedOnly
reworkOnly
shipmentWeek
```

### Response

```json
{
  "data": {
    "summary": {
      "totalWipQty": 86500,
      "blockedWipQty": 7400,
      "ageingWipQty": 18500,
      "reworkWipQty": 2800,
      "shipmentRiskWipQty": 22600,
      "shipmentReadyQty": 7500
    },
    "stages": [
      {
        "stage": "SEWN_WAITING_WASH",
        "label": "Sewn Goods Waiting for Wash",
        "qty": 14000,
        "blockedQty": 0,
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

## 47. WIP Stage Drilldown

### 47.1 GET /api/v1/wip/pipeline/{stage}

Response item:

```json
{
  "wipItemId": "uuid",
  "orderId": "uuid",
  "orderNo": "ORD-1001",
  "styleCode": "STY-5001",
  "customerName": "Customer A",
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
  "shipmentRisk": "RED"
}
```

---

## 48. Move WIP

### 48.1 POST /api/v1/wip/move

### Request

```json
{
  "orderId": "uuid",
  "fromStage": "SEWN_WAITING_WASH",
  "toStage": "WASH_QUEUE",
  "qty": 500,
  "batchOrBundleRef": "WB-1001",
  "remarks": "Moved to wash queue"
}
```

### Response

```json
{
  "data": {
    "movementId": "uuid",
    "orderId": "uuid",
    "fromStage": "SEWN_WAITING_WASH",
    "toStage": "WASH_QUEUE",
    "qty": 500,
    "movedAt": "2026-06-05T13:00:00+07:00"
  },
  "meta": {},
  "errors": []
}
```

---

## 49. WIP Reconciliation

### 49.1 GET /api/v1/wip/reconciliation/{orderId}

```json
{
  "data": {
    "orderId": "uuid",
    "orderNo": "ORD-1001",
    "orderQty": 12000,
    "fabricEquivalentQty": 12500,
    "cutQty": 10000,
    "issuedToSewingQty": 9500,
    "sewnQty": 9200,
    "sentToWashQty": 8600,
    "washedQty": 7400,
    "finishedQty": 6000,
    "packedQty": 5200,
    "shipmentReadyQty": 0,
    "dispatchedQty": 0,
    "gaps": [
      {
        "code": "WASHED_LESS_THAN_SENT",
        "message": "Washed qty is lower than sent-to-wash qty by 1,200 pcs.",
        "severity": "YELLOW"
      }
    ]
  },
  "meta": {},
  "errors": []
}
```

---

# Part M: Quality and Rework APIs

---

## 50. QC Inspection Capture

### 50.1 POST /api/v1/qc/inspections

### Request

```json
{
  "orderId": "uuid",
  "stage": "POST_WASH_QC",
  "workcenterId": "uuid",
  "lineId": null,
  "checkedQty": 500,
  "passedQty": 460,
  "defectQty": 40,
  "status": "HOLD",
  "defects": [
    {
      "defectCodeId": "uuid",
      "defectDescription": "Shade variation",
      "severity": "RED",
      "qty": 40,
      "responsibleProcess": "WASH",
      "photoUrl": null
    }
  ],
  "remarks": "Shade variation observed"
}
```

### Response

```json
{
  "data": {
    "inspectionId": "uuid",
    "status": "HOLD",
    "holdCreated": true,
    "exceptionId": "uuid",
    "affectedWipQty": 40
  },
  "meta": {},
  "errors": []
}
```

---

## 51. Rework Order APIs

### 51.1 POST /api/v1/rework

### Request

```json
{
  "orderId": "uuid",
  "reworkType": "WASH_REWORK",
  "qty": 300,
  "responsibleProcess": "WASH",
  "ownerId": 78,
  "expectedCompletion": "2026-06-06T12:00:00+07:00",
  "remarks": "Shade correction rewash"
}
```

### Response

```json
{
  "data": {
    "reworkId": "uuid",
    "status": "CREATED",
    "capacityImpactMinutes": 180
  },
  "meta": {},
  "errors": []
}
```

---

# Part N: Exception and Recovery APIs

---

## 52. Exception List

### 52.1 GET /api/v1/exceptions

Query params:

```text
factoryId
category
severity
status
ownerId
orderId
dueDateFrom
dueDateTo
shipmentImpactingOnly
overdueOnly
search
```

### Response Item

```json
{
  "id": "uuid",
  "exceptionNo": "EXC-1001",
  "category": "WASH",
  "severity": "RED",
  "order": {
    "id": "uuid",
    "orderNo": "ORD-1001",
    "styleCode": "STY-5001"
  },
  "stage": "SEWN_WAITING_WASH",
  "description": "Wash queue exceeds capacity",
  "owner": {
    "id": 78,
    "displayName": "Washing Manager"
  },
  "dueDate": "2026-06-06",
  "status": "OPEN",
  "ageingHours": 14.5,
  "suggestedAction": "Add wash shift or resequence low-risk batches",
  "shipmentImpacting": true
}
```

---

## 53. Create Exception

### 53.1 POST /api/v1/exceptions

### Request

```json
{
  "category": "WIP",
  "severity": "RED",
  "orderId": "uuid",
  "stage": "SEWN_WAITING_WASH",
  "description": "Sewn WIP ageing above threshold",
  "ownerId": 78,
  "dueDate": "2026-06-06",
  "suggestedAction": "Prioritize wash batch creation"
}
```

### Response

```json
{
  "data": {
    "exceptionId": "uuid",
    "exceptionNo": "EXC-1002",
    "status": "OPEN"
  },
  "meta": {},
  "errors": []
}
```

---

## 54. Close Exception

### 54.1 POST /api/v1/exceptions/{exceptionId}/close

### Request

```json
{
  "closureNote": "Additional wash shift completed; WIP ageing cleared."
}
```

### Permission

```text
exception.close
```

Critical exceptions may require:

```text
exception.close_critical
```

### Response

```json
{
  "data": {
    "exceptionId": "uuid",
    "status": "CLOSED",
    "closedAt": "2026-06-05T17:00:00+07:00"
  },
  "meta": {},
  "errors": []
}
```

---

## 55. Recovery Action APIs

### 55.1 POST /api/v1/recovery-actions

### Request

```json
{
  "exceptionId": "uuid",
  "orderId": "uuid",
  "actionType": "ADD_OVERTIME",
  "description": "Add 2 hours overtime in wet wash",
  "ownerId": 78,
  "targetDate": "2026-06-05",
  "capacityImpact": {
    "additionalMinutes": 240
  },
  "shipmentImpact": {
    "riskAfter": "YELLOW"
  }
}
```

---

# Part O: Shipment APIs

---

## 56. Shipment Readiness List

### 56.1 GET /api/v1/shipments/readiness

Query params:

```text
factoryId
shipmentDateFrom
shipmentDateTo
customerId
readinessStatus
riskStatus
inspectionPending
docsPending
shortQtyOnly
```

### Response Item

```json
{
  "orderId": "uuid",
  "orderNo": "ORD-1001",
  "customerName": "Customer A",
  "styleCode": "STY-5001",
  "shipmentDate": "2026-07-15",
  "orderQty": 12000,
  "finishedQty": 11800,
  "packedQty": 10200,
  "shortQty": 1800,
  "finalQcStatus": "PASSED",
  "aqlStatus": "PENDING",
  "documentationStatus": "PENDING",
  "forwarderBookingStatus": "PENDING",
  "readinessStatus": "BLOCKED",
  "riskStatus": "RED"
}
```

---

## 57. Shipment Readiness Detail

### 57.1 GET /api/v1/orders/{orderId}/shipment-readiness

```json
{
  "data": {
    "orderId": "uuid",
    "shipmentDate": "2026-07-15",
    "readinessStatus": "BLOCKED",
    "finishedQty": 11800,
    "packedQty": 10200,
    "shortQty": 1800,
    "checklist": [
      {
        "code": "FINAL_QC_PASSED",
        "label": "Final QC Passed",
        "status": "PASSED",
        "owner": {
          "id": 88,
          "displayName": "QC Manager"
        }
      },
      {
        "code": "AQL_PASSED",
        "label": "AQL Passed",
        "status": "PENDING",
        "owner": {
          "id": 88,
          "displayName": "QC Manager"
        },
        "dueDate": "2026-07-13"
      }
    ]
  },
  "meta": {},
  "errors": []
}
```

---

## 58. Update Shipment Checklist

### 58.1 PATCH /api/v1/orders/{orderId}/shipment-checklist/{itemCode}

### Request

```json
{
  "status": "PASSED",
  "remarks": "AQL inspection passed"
}
```

---

## 59. Mark Shipment Ready

### 59.1 POST /api/v1/orders/{orderId}/mark-shipment-ready

### Request

```json
{
  "remarks": "All shipment readiness checks complete"
}
```

### Permission

```text
shipment.mark_ready
```

### Response

```json
{
  "data": {
    "orderId": "uuid",
    "readinessStatus": "READY",
    "markedReadyAt": "2026-07-14T10:00:00+07:00"
  },
  "meta": {},
  "errors": []
}
```

---

# Part P: Handheld / Shopfloor APIs

---

## 60. Shopfloor Home

### 60.1 GET /api/v1/shopfloor/home

Query params:

```text
factoryId
date
```

Response:

```json
{
  "data": {
    "user": {
      "id": 101,
      "displayName": "Line Supervisor 05"
    },
    "assignedWorkcenters": [
      {
        "id": "uuid",
        "code": "LINE-05",
        "name": "Sewing Line 05"
      }
    ],
    "todayTasks": [
      {
        "taskType": "OUTPUT_CAPTURE",
        "orderId": "uuid",
        "orderNo": "ORD-1001",
        "styleCode": "STY-5001",
        "targetQty": 700,
        "actualQty": 420,
        "status": "IN_PROGRESS"
      }
    ],
    "openIssues": [
      {
        "exceptionId": "uuid",
        "severity": "RED",
        "description": "Hourly output below target"
      }
    ]
  },
  "meta": {},
  "errors": []
}
```

---

## 61. Handover API

### 61.1 POST /api/v1/shopfloor/handover

### Request

```json
{
  "orderId": "uuid",
  "fromStage": "SEWING_WIP",
  "toStage": "SEWN_WAITING_WASH",
  "fromDepartmentId": "uuid",
  "toDepartmentId": "uuid",
  "qty": 800,
  "batchOrBundleRefs": ["BND-1001", "BND-1002"],
  "qcStatus": "PASSED",
  "remarks": "Ready for wash"
}
```

---

## 62. Downtime Event API

### 62.1 POST /api/v1/shopfloor/downtime

### Request

```json
{
  "workcenterId": "uuid",
  "lineId": "uuid",
  "orderId": "uuid",
  "eventType": "MACHINE_BREAKDOWN",
  "startTime": "2026-06-05T11:15:00+07:00",
  "expectedDurationMinutes": 90,
  "capacityImpactQty": 600,
  "ownerId": 91,
  "remarks": "Bartack machine down"
}
```

### Response

```json
{
  "data": {
    "downtimeEventId": "uuid",
    "status": "OPEN",
    "exceptionId": "uuid",
    "workcenterCapacityUpdated": true
  },
  "meta": {},
  "errors": []
}
```

---

## 63. Andon Issue API

### 63.1 POST /api/v1/shopfloor/andon

### Request

```json
{
  "workcenterId": "uuid",
  "lineId": "uuid",
  "orderId": "uuid",
  "issueType": "NEED_QC",
  "urgency": "RED",
  "description": "End-line QC required urgently",
  "photoUrl": null
}
```

---

## 64. Shift Closure API

### 64.1 POST /api/v1/shopfloor/shift-closure

### Request

```json
{
  "workcenterId": "uuid",
  "lineId": "uuid",
  "shiftDate": "2026-06-05",
  "shiftName": "A",
  "outputConfirmed": true,
  "defectsConfirmed": true,
  "wipHandoverConfirmed": true,
  "downtimeConfirmed": true,
  "openIssues": [
    "Bartack machine pending maintenance"
  ],
  "nextShiftInstructions": "Prioritize remaining waistband operations."
}
```

---

## 65. Offline Sync API

### 65.1 POST /api/v1/shopfloor/offline-sync

Used to sync locally stored mobile entries.

### Request

```json
{
  "deviceId": "DEVICE-001",
  "entries": [
    {
      "localId": "local-uuid-1",
      "entryType": "SEWING_OUTPUT",
      "originalTimestamp": "2026-06-05T14:00:00+07:00",
      "payload": {
        "orderId": "uuid",
        "lineId": "uuid",
        "grossQty": 300,
        "defectQty": 12,
        "reworkQty": 8
      }
    }
  ]
}
```

### Response

```json
{
  "data": {
    "synced": [
      {
        "localId": "local-uuid-1",
        "serverId": "uuid",
        "status": "SYNCED"
      }
    ],
    "conflicts": [],
    "failed": []
  },
  "meta": {},
  "errors": []
}
```

---

# Part Q: Analytics APIs

---

## 66. OTIF Analytics

### 66.1 GET /api/v1/analytics/otif

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
    "totalShipments": 240,
    "onTimeInFull": 230,
    "late": 6,
    "short": 4,
    "costProtectedOtif": {
      "withOvertime": 48,
      "withPremiumFreight": 7,
      "withSplitShipment": 12
    },
    "trend": [
      {
        "period": "2026-05",
        "otifPercent": 95.1
      }
    ]
  },
  "meta": {},
  "errors": []
}
```

---

## 67. Utilization Analytics

### 67.1 GET /api/v1/analytics/utilization

Response:

```json
{
  "data": {
    "overallUtilizationPercent": 70.0,
    "netGoodUtilizationPercent": 62.5,
    "byWorkcenter": [
      {
        "workcenterName": "Sewing",
        "utilizationPercent": 72.0
      },
      {
        "workcenterName": "Wet Wash",
        "utilizationPercent": 118.0
      }
    ]
  },
  "meta": {},
  "errors": []
}
```

---

## 68. Line Efficiency Analytics

### 68.1 GET /api/v1/analytics/line-efficiency

Response item:

```json
{
  "lineCode": "LINE-05",
  "styleCode": "STY-5001",
  "grossOutput": 5200,
  "netGoodOutput": 4920,
  "efficiencyPercent": 64.5,
  "defectRate": 5.4,
  "downtimeMinutes": 180,
  "mainLossReason": "Line imbalance"
}
```

---

## 69. Operation Bulletin Performance

### 69.1 GET /api/v1/analytics/operation-bulletin-performance

Query params:

```text
styleId
bulletinId
lineId
dateFrom
dateTo
```

Response:

```json
{
  "data": {
    "styleCode": "STY-5001",
    "bulletinVersion": "v2",
    "plannedSmv": 32.5,
    "actualEquivalentSmv": 36.8,
    "efficiencyGapPercent": -13.2,
    "bottleneckOperations": [
      {
        "operationName": "Waistband attach",
        "plannedSmv": 1.2,
        "actualImpact": "High WIP build-up"
      }
    ],
    "recommendation": "Review operation split and skill allocation"
  },
  "meta": {},
  "errors": []
}
```

---

# Part R: Integration and Import APIs

---

## 70. Excel Import API

### 70.1 POST /api/v1/imports/{importType}

Import types:

```text
orders
styles
bom
operation_bulletins
line_master
machine_master
operator_skill
current_wip
```

### Request

Use multipart form data:

```text
file=<uploaded.xlsx>
dryRun=true
```

### Response

```json
{
  "data": {
    "batchId": "uuid",
    "importType": "orders",
    "dryRun": true,
    "totalRows": 120,
    "validRows": 112,
    "errorRows": 8,
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

## 71. Apply Import Batch

### 71.1 POST /api/v1/imports/{batchId}/apply

Applies validated import.

### Permission

```text
integration.approve_import
```

---

## 72. Integration Status

### 72.1 GET /api/v1/integrations/status

Response:

```json
{
  "data": [
    {
      "source": "ERP_ORDERS",
      "lastRunAt": "2026-06-05T06:00:00+07:00",
      "status": "SUCCESS",
      "recordsProcessed": 250,
      "lastError": null
    },
    {
      "source": "FASTREACT",
      "lastRunAt": null,
      "status": "NOT_CONFIGURED",
      "recordsProcessed": 0,
      "lastError": null
    }
  ],
  "meta": {},
  "errors": []
}
```

---

# Part S: Audit APIs

---

## 73. Entity Audit Trail

### 73.1 GET /api/v1/audit/{entityType}/{entityId}

Response:

```json
{
  "data": [
    {
      "id": "uuid",
      "action": "PCD_CONDITIONAL_RELEASE_APPROVED",
      "performedBy": {
        "id": 12,
        "displayName": "Production Head"
      },
      "performedAt": "2026-06-05T12:05:00+07:00",
      "reason": "Trim arrival confirmed",
      "oldValue": {
        "readinessStatus": "BLOCKED"
      },
      "newValue": {
        "readinessStatus": "CONDITIONALLY_READY"
      }
    }
  ],
  "meta": {},
  "errors": []
}
```

---

# Part T: Frontend TypeScript Contract Guidance

---

## 74. Type Naming Convention

Frontend should define API response types by domain.

Example:

```typescript
export type RiskStatus = "GREEN" | "YELLOW" | "RED" | "BLACK";

export interface OrderListItem {
  id: string;
  orderNo: string;
  poNumber?: string;
  customer: EntityRef;
  buyer?: EntityRef;
  style: {
    id: string;
    styleCode: string;
  };
  productType: string;
  orderQty: number;
  committedShipDate: string;
  currentStage: string;
  lifecycleStatus: string;
  riskStatus: RiskStatus;
  pcdStatus?: string;
  washStatus?: string;
  shipmentReadinessStatus?: string;
  owner?: UserRef;
  nextAction?: string;
  openExceptionCount: number;
}
```

## 75. Shared Types

```typescript
export interface EntityRef {
  id: string;
  code?: string;
  name: string;
}

export interface UserRef {
  id: number;
  displayName: string;
}

export interface ApiError {
  code: string;
  message: string;
  field?: string;
  details?: Record<string, unknown>;
}

export interface ApiResponse<T> {
  data: T;
  meta: Record<string, unknown>;
  errors: ApiError[];
}

export interface PaginatedMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
```

---

# Part U: API Testing Requirements

---

## 76. API Contract Tests

Each API group must test:

```text
response shape
required fields
permission enforcement
filtering
pagination
sorting
business rule errors
audit creation for critical writes
```

---

## 77. Critical API Test Scenarios

### 77.1 PCD Release Blocked

```text
Given fabric QC pending
When POST release-to-cutting
Then API returns blocked response
And no release is created
```

### 77.2 Conditional PCD Release

```text
Given PCD blocked by non-critical item
When authorized user approves conditional release
Then readiness becomes CONDITIONALLY_READY
And audit event is created
```

### 77.3 Sewing Output

```text
Given line has active order
When output posted
Then net-good output is calculated
And WIP is updated
And line summary changes
```

### 77.4 Wash Rework

```text
Given wash batch completed with shade issue
When rewash API called
Then batch status becomes REWASH_REQUIRED
And additional load is created
And exception is created if shipment risk increases
```

### 77.5 Shipment Readiness

```text
Given final QC passed but documents pending
When mark-shipment-ready is called
Then API blocks action
```

---

# Part V: API Governance Rules

---

## 78. Governance Rules

```text
1. All APIs must be documented in OpenAPI.
2. All list APIs must support pagination.
3. All critical writes must check action permission.
4. All critical writes must create audit events.
5. Frontend must not depend on internal DB field names.
6. Status values must be controlled and documented.
7. Calculation fields must be produced by backend.
8. API changes must be versioned or backward-compatible.
9. Mobile APIs must support offline sync identifiers where required.
10. Import APIs must support dry-run validation.
```

---

## 79. OpenAPI Requirement

Use:

```text
drf-spectacular
```

Every endpoint should include:

```text
request schema
response schema
error schema
permissions
description
examples
```

---

## 80. Summary

This API and data contract specification defines the communication layer between:

```text
Django backend
React/Next.js frontend
mobile/PWA shopfloor screens
Django Admin-managed configuration
integration/import flows
```

The API design must support dense planning workbenches, governed state transitions, live shopfloor actuals, auditability, and role-based control.

The most important API design principle is:

```text
The backend must calculate and govern.
The frontend must render, guide, and trigger approved actions.
```
