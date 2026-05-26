# Business Requirements Document (BRD)  
# Eratex End-to-End Planning & Scheduling Tool for Denim Bottoms and Chinos Manufacturing

**Company:** Eratex  
**Document Type:** Business Requirements Document  
**Product Scope:** Planning and Scheduling Tool for Garment Manufacturing Operations  
**Manufacturing Scope:** Denim Bottoms + Chinos  
**Version:** 1.0  
**Date:** 2026-05-26  

---

## 1. Executive Summary

Eratex operates a large-scale garment manufacturing environment focused on denim bottoms and chinos. The production flow is complex because it depends on customer approvals, sampling iterations, nominated vendor procurement, fabric quality clearance, planned cut date readiness, sewing line loading, wash complexity, finishing, quality inspection, packing, and shipment commitments.

Although a garment planning tool such as FastReact may already be present in the operating environment, planning activity still appears to remain heavily dependent on manual Excel files. This indicates that the formal planning system has not fully become the daily operating backbone of the factory.

The current business condition can be summarized as follows:

```text
The factory is meeting customer shipment commitments, but not through a stable and fully trusted planning system. It is maintaining OTIF through manual coordination, Excel-based firefighting, overtime, expediting, and extra operating expense.
```

The proposed product is an end-to-end planning and scheduling tool designed to enforce operational discipline across order lifecycle visibility, PCD readiness, weekly planning, daily production release, workcenter load monitoring, sewing line loading, wash planning, WIP ageing, exception management, and shipment readiness.

The MVP should focus on ten critical operating surfaces that solve the most immediate business problem: converting a complex garment order book into a realistic, executable, constraint-aware, and shipment-protecting production plan.

---

## 2. Business Context

### 2.1 Nature of Eratex Operations

Eratex’s manufacturing operation involves large-scale production of denim bottoms and chinos. The flow is not limited to cutting and sewing. It includes:

```text
Customer enquiry
→ Sampling
→ Buyer approval
→ Order confirmation
→ Fabric and trim procurement
→ Fabric inward
→ Fabric QC
→ PCD readiness
→ Cutting
→ Sewing
→ Wet/dry washing
→ Repeat wash or rework if required
→ Finishing
→ Final QC
→ Packing
→ Shipment
```

Denim bottoms and chinos have specific operational sensitivities:

- Fabric is often sourced from nominated vendors.
- Fabric procurement may have a lead time of 20–30 days.
- Fabric QC, shade-lot segregation, shrinkage, skewing, and stretch recovery are critical before cutting.
- Washing is a major production stage, not a minor finishing step.
- Wash processes may include dry process, wet wash, enzyme wash, stone wash, bleach, ozone, tinting, softener, and repeat wash cycles.
- Manual effects such as whiskering, scraping, grinding, destroy, and touch-up depend heavily on skill.
- Quality failures and rewash loops consume real capacity and affect shipment reliability.
- OTIF can be protected only if the planning system detects risks early and triggers recovery actions in time.

---

## 3. Problem Statement

A large denim and chinos manufacturer using FastReact but still relying on Excel is likely operating with a partially digitized planning process where the formal schedule exists in software but the real decisions are still made manually.

Eratex is achieving high OTIF, reportedly above 95%, but this performance is being protected through additional operating expense. At the same time, resource utilization is around 70%, which indicates that capacity is not being converted efficiently into stable, predictable, net-good output.

The current condition suggests the following:

```text
FastReact or a similar planning tool may be present,
but Excel remains the real execution layer for planning decisions.
```

This creates a situation where:

- Planning is formally digital but operationally manual.
- OTIF is maintained through firefighting and cost absorption.
- Utilization is low because flow is unstable.
- Workcenter constraints shift without timely visibility.
- Sewing output may be planned without sufficient wash capacity alignment.
- Wash rework and repeat cycles may not be fully capacity-planned.
- PCD readiness may not be enforced as a hard production gate.
- WIP ageing may remain hidden between departments.
- Daily production release may be driven by urgency rather than readiness.
- Shipment readiness may be assessed too late.

At Eratex scale, small planning gaps multiply across many buyers, styles, production lines, wash routes, quality gates, and shipment commitments.

The real problem is therefore not simply the absence of software. The problem is that the planning system has not become the daily operating discipline of the factory.

---

## 4. Business Need

Eratex requires an integrated planning and scheduling tool that can become the single operating layer for production control.

The product must help Eratex answer, every day:

```text
Which orders are ready?
Which orders are blocked?
Where is the bottleneck?
What is overloaded?
What can be released today?
What is ageing in WIP?
Which shipment is at risk?
What recovery action is required?
Who owns the next action?
```

The tool must shift the factory from:

```text
Manual Excel planning
→ System-led planning

Department-wise tracking
→ End-to-end order visibility

Gross capacity planning
→ Net-good capacity planning

Weekly static planning
→ Daily executable release

Late-stage firefighting
→ Early exception detection

OTIF through extra cost
→ OTIF through stable flow control
```

---

## 5. Business Objectives

### 5.1 Primary Objectives

1. Establish one integrated planning view from order confirmation to shipment.
2. Enforce PCD readiness before cutting starts.
3. Convert weekly production plans into daily executable releases.
4. Monitor total workcenter load and identify shifting constraints.
5. Improve sewing line loading using realistic capacity assumptions.
6. Treat washing as a core production constraint for denim and chinos.
7. Make WIP ageing visible across departments.
8. Track exceptions with owner, severity, due date, and recovery action.
9. Distinguish production completion from true shipment readiness.
10. Reduce reliance on Excel-based planning and manual firefighting.

### 5.2 Performance Objectives

The system should help improve:

| Metric | Current Concern | Desired Direction |
|---|---|---|
| Resource utilization | Around 70% | Improve through better readiness, loading, and flow discipline |
| OTIF | Above 95% but cost-heavy | Maintain or improve while reducing extra operating expense |
| Overtime dependency | High due to recovery pressure | Reduce through earlier risk detection |
| Planning accuracy | Weak due to Excel dependency | Improve through single system of truth |
| WIP ageing | Hidden or manually tracked | Make visible and actionable |
| Wash bottleneck visibility | Often late | Make constraint visible before shipment risk escalates |
| Rework impact | May be invisible in capacity | Consume capacity explicitly in plan |
| Shipment readiness | Often checked late | Track continuously before dispatch |

---

## 6. Product Scope

The product scope is divided into:

1. **MVP Scope:** Ten critical surfaces required to stabilize planning discipline.
2. **Mature-State Scope:** Additional surfaces required for a full-scale deployment and long-term operational maturity.

---

# Part A: MVP Scope — Ten Critical Surfaces

---

## 7. MVP Surface 1: Order Lifecycle Surface

### 7.1 Purpose

To provide one digital thread for every customer order from confirmation to shipment.

### 7.2 Business Problem Solved

Orders are currently tracked across disconnected files and departments. There is no single reliable view of where an order stands, what is pending, who owns the next action, and whether the shipment date is safe.

### 7.3 Key Capabilities

- Order master view
- Customer, buyer, style, PO, quantity, delivery date
- Current stage of order
- Planned vs actual dates by stage
- Pending dependencies
- Delay reason
- Owner by stage
- Risk status
- Next required action
- Linkage to materials, PCD, production, wash, QC, and shipment

### 7.4 Key Data Elements

| Data Element | Description |
|---|---|
| Order ID | Unique order reference |
| Customer / Buyer | Customer or brand |
| Style code | Garment style |
| Product type | Denim bottom, chino, cargo, jogger, etc. |
| Quantity | Ordered quantity |
| Delivery date | Committed shipment date |
| Current stage | Current lifecycle status |
| Risk status | Green, Yellow, Red, Black |
| Owner | Responsible user or department |
| Next action | Action required to move order forward |

### 7.5 Success Criteria

- Every order has one system-level lifecycle status.
- Users no longer need separate Excel files to know order progress.
- Delayed orders have visible reasons and owners.

---

## 8. MVP Surface 2: PCD Readiness Surface

### 8.1 Purpose

To enforce production readiness before cutting starts.

### 8.2 Business Problem Solved

Orders may be pushed into cutting before all required conditions are ready, causing downstream rework, holds, shade problems, measurement issues, trim shortages, and shipment risk.

### 8.3 Key Capabilities

The surface must validate:

```text
PO confirmed
BOM frozen
Fabric received
Fabric QC passed
Shade lots mapped
Shrinkage report available
Trims available or secured
Pattern approved
Marker ready
PP sample approved
Wash standard approved
Line allocated
Wash capacity booked
QC file ready
```

### 8.4 Readiness Status

| Status | Meaning |
|---|---|
| Ready | Can be released to cutting |
| Conditionally Ready | Minor open item exists with approved risk |
| Blocked | Cannot be released |
| Escalated | Management action required |

### 8.5 Success Criteria

- No order is cut without readiness visibility.
- Blocked orders are visible before PCD.
- Conditional releases are approved and auditable.

---

## 9. MVP Surface 3: Weekly Planning Workbench

### 9.1 Purpose

To convert the order book into an executable weekly cross-functional plan.

### 9.2 Business Problem Solved

Weekly plans often fail because material readiness, cutting, sewing, wash, finishing, QC, and shipment are not planned as one integrated flow.

### 9.3 Key Capabilities

- 2–4 week firm plan view
- 8–12 week rolling visibility
- Order sequencing
- Cutting plan
- Sewing line allocation
- Wash plan
- Finishing plan
- Inspection plan
- Shipment plan
- Load vs capacity view
- Material readiness filter
- Shipment-risk priority indicator
- Plan freeze capability
- Plan-change impact visibility

### 9.4 Success Criteria

- Weekly plan becomes the coordination contract across departments.
- Plan is capacity-checked before being frozen.
- Orders with material or PCD risks are not silently included in execution plan.

---

## 10. MVP Surface 4: Daily Production Release Surface

### 10.1 Purpose

To release only what is actually ready and executable today.

### 10.2 Business Problem Solved

Daily production may be released based on urgency rather than actual readiness, resulting in line stoppages, partial production, WIP imbalance, and manual firefighting.

### 10.3 Key Capabilities

Daily release must validate:

```text
Material availability
Previous process completion
Machine availability
Manpower availability
Quality clearance
Workcenter capacity
Next-process readiness
```

The surface should support:

- Release to cutting
- Release to sewing
- Release to wash
- Release to finishing
- Release block with reason
- Exception approval
- Daily release history

### 10.4 Success Criteria

- Daily release becomes gate-based.
- Unready orders are blocked or escalated.
- Production teams receive executable work, not theoretical plan items.

---

## 11. MVP Surface 5: Workcenter Load Monitor

### 11.1 Purpose

To show load, capacity, queue, WIP ageing, utilization, and current constraint across workcenters.

### 11.2 Business Problem Solved

The active bottleneck can shift from sewing to washing, dry process, finishing, QC, or shipment, but this is often discovered late.

### 11.3 Workcenters in MVP

```text
Fabric QC
Cutting
Sewing lines
Dry process
Wet wash
Drying
Finishing
Packing
Final QC
Shipment documentation
```

### 11.4 Key Metrics

| Metric | Description |
|---|---|
| Available capacity | Capacity by day or week |
| Planned load | Work already scheduled |
| Queue | Work waiting before workcenter |
| WIP ageing | Time waiting before next process |
| Utilization | Load as percentage of available capacity |
| Throughput | Actual output |
| Constraint flag | Whether workcenter is bottleneck |
| Recovery need | Whether action is required |

### 11.5 Success Criteria

- Bottleneck shifts are visible early.
- Planners can see total load, not just urgent orders.
- Recovery action is triggered before shipment risk becomes critical.

---

## 12. MVP Surface 6: Sewing Line Loading Surface

### 12.1 Purpose

To support realistic sewing line allocation and production target setting.

### 12.2 Business Problem Solved

Sewing lines are often loaded using nominal capacity, while real output depends on style SMV, operator skill, absenteeism, learning curve, quality loss, line balance, and machine availability.

### 12.3 Key Capabilities

- Assign orders to lines
- Calculate daily target from SMV and manpower
- Track line capacity by day
- Track line loading by style and order
- Capture actual output
- Compare planned vs actual
- Calculate gross output and net-good output
- Record quality loss
- Identify overloaded or underloaded lines
- Suggest alternate line or split-line loading

### 12.4 Required Inputs

```text
Style SMV
Operation bulletin
Line manpower
Machine availability
Operator skill level
Target efficiency
Learning curve
Absenteeism
Quality performance
```

### 12.5 Success Criteria

- Sewing plan reflects realistic net-good capacity.
- Underperformance is visible by line and order.
- Line loading decisions improve resource utilization.

---

## 13. MVP Surface 7: Wash Planning Surface

### 13.1 Purpose

To plan washing as a core production constraint.

### 13.2 Business Problem Solved

In denim manufacturing, wash processes and rewash loops can become the real bottleneck. If washing is planned only after sewing, WIP builds up and shipment risk increases.

### 13.3 Key Capabilities

- Define wash route by style
- Plan dry process
- Plan wet wash
- Plan washer/dryer capacity
- Create wash batches
- Maintain shade-lot identity
- Track batch queue
- Track wash completion
- Track rewash or touch-up requirement
- Reserve capacity for repeat wash
- Link wash status to finishing release

### 13.4 Wash Routes Covered

```text
Dry process
Wet wash
Enzyme wash
Stone wash
Bleach / ozone
Tinting
Softener
Hydro extraction
Drying
Post-wash shade check
Rewash / touch-up loop
```

### 13.5 Success Criteria

- Sewn garments do not pile up invisibly before wash.
- Wash bottleneck is visible before shipment risk escalates.
- Rewash consumes planned capacity.

---

## 14. MVP Surface 8: WIP and Queue Monitoring Surface

### 14.1 Purpose

To monitor work waiting between processes.

### 14.2 Business Problem Solved

Hidden WIP causes hidden delay. Departments may report output, but orders may remain stuck between processes.

### 14.3 WIP Points Tracked

```text
Fabric waiting for QC
Fabric cleared but not cut
Cut panels waiting for sewing
Sewn garments waiting for wash
Washed garments waiting for finishing
Finished garments waiting for packing
Packed cartons waiting for inspection
```

### 14.4 Key Capabilities

- WIP quantity by stage
- Ageing by stage
- Hold reason
- Next process
- Owner
- Shipment risk
- WIP ageing threshold
- Escalation trigger

### 14.5 Success Criteria

- Hidden queues become visible.
- Ageing WIP is escalated.
- Planners can prioritize flow, not only output.

---

## 15. MVP Surface 9: Exception and Alert Surface

### 15.1 Purpose

To drive exception-based planning and action.

### 15.2 Business Problem Solved

Operational issues are often known informally but not structured into a system with severity, owner, due date, and recovery action.

### 15.3 Alert Examples

```text
Fabric delayed beyond PCD
Fabric QC failed
PP sample approval pending
Line overloaded next week
Wash queue exceeds capacity
Sewn WIP ageing above limit
Post-wash rejection high
Final inspection not scheduled
Shipment risk turned red
Recovery action overdue
```

### 15.4 Key Capabilities

Each exception must contain:

| Field | Description |
|---|---|
| Exception type | Material, capacity, quality, approval, WIP, shipment |
| Affected order | Order impacted |
| Severity | Green, Yellow, Red, Black or equivalent |
| Owner | Responsible person |
| Due date | Resolution target |
| Suggested action | Recommended recovery |
| Status | Open, in progress, closed |
| Escalation level | Normal, urgent, management |

### 15.5 Success Criteria

- Exceptions are not buried in WhatsApp or Excel.
- Every critical issue has an owner and due date.
- Management sees only actionable risks.

---

## 16. MVP Surface 10: Shipment Readiness Surface

### 16.1 Purpose

To protect final shipment commitments.

### 16.2 Business Problem Solved

Production completion does not automatically mean shipment readiness. Orders may be delayed by final QC, buyer inspection, packing, labels, documents, or forwarder booking.

### 16.3 Key Capabilities

- Track shipment date
- Track finished quantity
- Track packed quantity
- Track short quantity
- Track final QC status
- Track AQL / buyer inspection status
- Track carton readiness
- Track barcode / label readiness
- Track documentation status
- Track shipment booking
- Track split shipment decisions

### 16.4 Shipment Readiness Checklist

```text
Final QC passed
AQL passed
Packing complete
Cartons closed
Barcode / label correct
Packing list ready
Invoice ready
Forwarder booked
Shipment date confirmed
```

### 16.5 Success Criteria

- Shipment risk is visible before dispatch date.
- Production completion and dispatch readiness are clearly separated.
- OTIF is protected with fewer last-minute interventions.

---

# Part B: Mature-State Scope — Additional Surfaces for Full Deployment

The MVP stabilizes planning discipline. A mature deployment should extend the product into the following additional surfaces.

---

## 17. Executive Control Tower Surface

A management-level exception dashboard showing shipment risk, bottlenecks, customer-wise delays, recovery actions, utilization, OTIF cost, overtime exposure, and order book health.

### Mature-State Capabilities

- Factory-wide risk heatmap
- Customer-wise OTIF and delay view
- Top constraints and bottleneck history
- Cost of recovery by order
- Overtime and premium freight visibility
- Management escalation board

---

## 18. Enquiry and Costing Surface

A pre-order feasibility surface for evaluating new buyer enquiries before order commitment.

### Mature-State Capabilities

- Tech pack capture
- Initial feasibility
- Capacity simulation
- Wash complexity assessment
- Fabric lead-time feasibility
- Costing estimate
- Delivery promise validation

---

## 19. Sampling and Approval Tracker Surface

A workflow surface to manage proto, fit, wash, size set, and PP samples.

### Mature-State Capabilities

- Sample request creation
- Sample room loading
- Buyer comments
- Resubmission tracking
- Approval ageing
- Sampling delay risk
- Linkage to order confirmation and PCD readiness

---

## 20. Style Master and Technical File Surface

A technical master data surface for style-level details.

### Mature-State Capabilities

- Style master
- Tech pack
- BOM reference
- Operation bulletin
- SMV
- Machine requirements
- Skill requirements
- Wash route
- Complexity rating
- Quality checkpoints

---

## 21. BOM and Material Planning Surface

A material requirement planning surface for fabrics, trims, labels, packing materials, and consumables.

### Mature-State Capabilities

- Material requirement calculation
- Consumption and wastage
- Fabric width impact
- Shrinkage allowance
- Ordered vs received vs required
- Shortage alerts
- Link to procurement and PCD

---

## 22. Procurement and Vendor Follow-up Surface

A supplier tracking surface, especially for nominated vendors.

### Mature-State Capabilities

- Vendor PO tracking
- Standard lead time vs actual lead time
- Vendor acknowledgement
- Fabric ETA
- Trim ETA
- Vendor delay alerts
- Material criticality ranking
- Vendor performance scorecard

---

## 23. Fabric Inward and Fabric QC Surface

A roll-wise fabric receipt and inspection surface.

### Mature-State Capabilities

- Roll inward
- Shade lot capture
- 4-point inspection
- Width check
- GSM check
- Shrinkage test
- Skewing / bowing check
- Stretch and recovery check
- Crocking / rubbing test
- Pass / fail / hold status

---

## 24. Operator Skill and Capacity Surface

A human-capability planning surface.

### Mature-State Capabilities

- Operator skill matrix
- Operation-wise skill rating
- Efficiency by operation
- Quality rating
- Absenteeism tracking
- Learning curve tracking
- Training needs
- Recommended operator allocation

---

## 25. Cutting Room Surface

A surface to manage the conversion of fabric into cut bundles.

### Mature-State Capabilities

- Cutting plan
- Shade-wise cutting sequence
- Marker approval
- Fabric relaxation
- Spreading
- Cutting quantity
- Cut panel QC
- Bundle numbering
- Issue to sewing

---

## 26. Wash Recipe and Batch Execution Surface

A detailed wash execution surface for shopfloor control.

### Mature-State Capabilities

- Batch creation
- Recipe step control
- Machine assignment
- Start and end time
- Chemical/process parameters
- Shade result
- Hand-feel result
- Measurement result
- Rewash requirement
- Batch approval / hold / reject

---

## 27. Quality Management Surface

A full quality control surface across all production stages.

### Mature-State Capabilities

- Fabric QC
- Cut panel QC
- Inline sewing QC
- End-line QC
- Pre-wash QC
- Post-wash QC
- Finishing QC
- Final QC
- AQL inspection
- Defect categorization
- Root cause
- Quality-adjusted capacity feedback

---

## 28. Rework and Recovery Surface

A structured surface for rework orders and recovery actions.

### Mature-State Capabilities

- Rework order creation
- Rework type
- Quantity affected
- Responsible process
- Recovery time
- Capacity reservation
- Shipment impact
- Closure tracking

---

## 29. Calendar / Gantt Planning Surface

A visual planning surface for order timelines and dependencies.

### Mature-State Capabilities

- Order Gantt
- Department Gantt
- Line Gantt
- Wash Gantt
- Shipment calendar
- Approval calendar
- Procurement calendar

---

## 30. Recovery Planning / What-If Simulation Surface

A decision-support surface for testing recovery scenarios.

### Mature-State Capabilities

- Fabric delay simulation
- Line split simulation
- Wash rework simulation
- Overtime simulation
- Shift extension simulation
- Shipment pull-forward simulation
- Capacity impact
- Cost impact
- Other order impact

---

## 31. Plan Change and Approval Surface

A governance surface for frozen-zone and firm-zone plan changes.

### Mature-State Capabilities

- Plan change request
- Reason code
- Impact analysis
- Approval workflow
- Audit trail
- Notification to affected departments

---

## 32. Department Handover Surface

A surface for formal interdepartmental handovers.

### Mature-State Capabilities

- Warehouse to cutting handover
- Cutting to sewing handover
- Sewing to wash handover
- Wash to finishing handover
- Finishing to packing handover
- Packing to shipment handover
- Handover completeness checks

---

## 33. Master Data Governance Surface

A governance surface for planning-critical master data.

### Mature-State Capabilities

- Style master completeness
- BOM completeness
- SMV version control
- Workcenter capacity versioning
- Machine master
- Shift calendar
- Wash recipe master
- Vendor lead-time master
- Quality parameter master
- Change approval and history

---

## 34. Performance Analytics Surface

A learning and improvement surface.

### Mature-State Capabilities

- OTIF trend
- Utilization trend
- Plan adherence
- Line efficiency
- Net-good output
- Wash rework rate
- Quality defect trend
- Procurement delay trend
- WIP ageing trend
- Cost of recovery
- Planning accuracy

---

## 35. Mobile / Shopfloor Update Surface

A low-friction shopfloor data-capture surface.

### Mature-State Capabilities

- Start / stop process
- Output update
- Defect update
- Shortage reporting
- Machine issue reporting
- Operator absenteeism reporting
- Handover confirmation
- Photo capture for defects
- Recovery action closure

---

## 36. Role-Based Home Surfaces

Role-specific operating dashboards for each function.

### Mature-State Capabilities

| Role | Home Surface Focus |
|---|---|
| Merchandiser | Sampling, approvals, customer comments |
| Procurement | Vendor ETA, material shortage |
| Fabric QC | Lots waiting for inspection |
| Planner | Capacity, PCD, weekly plan |
| Cutting manager | Ready-to-cut orders |
| Sewing manager | Line target, WIP, bottlenecks |
| Washing manager | Wash queue, batch plan, rewash |
| Finishing manager | Finishing queue and packing |
| QC manager | Defects and inspections |
| Shipment team | Ready-to-ship status |
| Management | Risk and bottlenecks |

---

# Part C: Functional Requirements

---

## 37. Core Functional Requirements

| Requirement ID | Requirement |
|---|---|
| FR-001 | System shall maintain order lifecycle status from confirmation to shipment. |
| FR-002 | System shall maintain planned and actual dates for each major order stage. |
| FR-003 | System shall enforce PCD readiness checks before cutting release. |
| FR-004 | System shall support weekly capacity-based production planning. |
| FR-005 | System shall support daily production release based on readiness. |
| FR-006 | System shall monitor load and capacity at each workcenter. |
| FR-007 | System shall identify current and future bottlenecks. |
| FR-008 | System shall support sewing line loading using SMV, manpower, and capacity assumptions. |
| FR-009 | System shall distinguish gross output from net-good output. |
| FR-010 | System shall support wash route and wash batch planning. |
| FR-011 | System shall track rewash and repeat wash capacity consumption. |
| FR-012 | System shall track WIP quantity and ageing between processes. |
| FR-013 | System shall generate exceptions for material, capacity, quality, approval, WIP, and shipment risks. |
| FR-014 | System shall assign owner and due date to every exception. |
| FR-015 | System shall track shipment readiness separately from production completion. |
| FR-016 | System shall maintain audit trail for plan changes and conditional releases. |
| FR-017 | System shall support role-based views and permissions. |
| FR-018 | System shall support integration with ERP or existing order/material data sources. |
| FR-019 | System shall support export and reporting for management review. |
| FR-020 | System shall preserve historical data for performance analytics. |

---

## 38. Key Business Rules

### 38.1 PCD Release Rules

- No order should move to cutting without PCD readiness status.
- Blocked orders must have open dependency and owner.
- Conditional release must require reason and approval.
- Fabric QC failure should block PCD unless overridden by authorized role.

### 38.2 Planning Rules

- Weekly plan must be capacity checked before freeze.
- Frozen-zone changes must require reason code and approval.
- Daily release must validate real readiness.
- Workcenter overload should trigger exception.
- Orders with high shipment risk should receive priority review.

### 38.3 Capacity Rules

- Capacity should be based on available minutes, manpower, machine availability, SMV, and demonstrated efficiency.
- Net-good output should account for quality loss and rework.
- Rework and rewash must consume capacity.
- Wash capacity must be separately planned from sewing capacity.

### 38.4 WIP Rules

- WIP must be tracked at key handover points.
- WIP ageing beyond threshold must trigger alert.
- WIP with quality hold must not proceed without clearance.
- WIP waiting before constraint workcenter must be prioritized by shipment risk and readiness.

### 38.5 Shipment Rules

- Shipment readiness must include final QC, inspection, packing, documents, and booking.
- Production complete does not mean shipment ready.
- Short shipment risk must be visible before shipment date.
- Split shipment decision must be tracked and approved.

---

# Part D: Non-Functional Requirements

---

## 39. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Usability | Screens must be simple, action-oriented, and suitable for planners and shopfloor supervisors. |
| Performance | Workcenter load, WIP, and order risk views should load quickly for large order volumes. |
| Scalability | System must support large factory operations with many lines, workcenters, styles, and orders. |
| Reliability | Planning data must be version-controlled and auditable. |
| Security | Access should be role-based. Sensitive commercial and customer data must be protected. |
| Integration | System should integrate with ERP, material records, shopfloor actuals, and shipment data where available. |
| Auditability | Plan changes, overrides, conditional releases, and shipment changes must be traceable. |
| Configurability | Workcenters, statuses, thresholds, calendars, and roles must be configurable. |
| Mobile Readiness | Shopfloor update flows should eventually support mobile or tablet usage. |
| Data Quality | Missing or incomplete master data must be visible before planning decisions. |

---

# Part E: Integration Requirements

---

## 40. Required Integration Areas

| Integration Area | Purpose |
|---|---|
| Order Management / ERP | Order, customer, style, PO, quantity, delivery date |
| BOM / Material System | Fabric, trims, packing materials |
| Procurement | Vendor PO, ETA, inward status |
| Fabric QC | Inspection status and results |
| Production Actuals | Cutting, sewing, wash, finishing output |
| Quality System | Defects, holds, rework, AQL |
| HR / Attendance | Operator availability and absenteeism |
| Machine / Maintenance | Machine availability and breakdown |
| Shipment / Logistics | Packing, inspection, dispatch, documents |

---

# Part F: Roles and Users

---

## 41. Key User Roles

| Role | Key Usage |
|---|---|
| Management | Control tower, shipment risk, bottlenecks, performance |
| Production Planner | Weekly plan, daily release, workcenter load, recovery |
| Merchandiser | Order lifecycle, approvals, buyer comments |
| Procurement User | Material status, vendor follow-up |
| Fabric QC User | Fabric inspection and clearance |
| Cutting Manager | Cutting readiness and cut output |
| Sewing Manager | Line load, output, WIP, constraints |
| Washing Manager | Wash plan, batch status, rewash |
| Finishing Manager | Finishing queue, packing readiness |
| QC Manager | Quality holds, inspection, defects |
| Shipment Team | Shipment readiness and dispatch |
| Shopfloor Supervisor | Daily updates, output, issues, handover |

---

# Part G: Reporting Requirements

---

## 42. MVP Reports

| Report | Purpose |
|---|---|
| Order Status Report | End-to-end order progress |
| PCD Readiness Report | Orders ready, blocked, conditional |
| Weekly Plan Report | Department-wise weekly plan |
| Daily Release Report | Work released and blocked |
| Workcenter Load Report | Load vs capacity by workcenter |
| Sewing Line Load Report | Line-wise plan and output |
| Wash Queue Report | Wash load, queue, and rewash |
| WIP Ageing Report | Stuck WIP and owner |
| Exception Report | Open issues and recovery actions |
| Shipment Readiness Report | Orders ready or at risk for shipment |

---

# Part H: Success Metrics

---

## 43. Business Success Metrics

| Metric | Target Direction |
|---|---|
| OTIF | Maintain above 95% while reducing recovery cost |
| Utilization | Improve from 70% through better flow and readiness |
| Overtime cost | Reduce overtime used for shipment recovery |
| Planning adherence | Improve weekly and daily plan compliance |
| PCD readiness accuracy | Reduce cutting releases with open blockers |
| WIP ageing | Reduce ageing at key handover points |
| Wash queue ageing | Reduce sewn garments waiting for wash |
| Rework visibility | 100% of major rework captured with owner |
| Shipment readiness | Improve advance visibility of dispatch blockers |
| Excel dependency | Reduce manual planning sheets over time |

---

# Part I: Implementation Roadmap

---

## 44. Suggested Implementation Phases

### Phase 1: MVP Foundation

Build and deploy the ten critical surfaces:

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

### Phase 2: Material, Sampling, and Technical Master Expansion

Add:

```text
Enquiry and costing
Sampling and approvals
Style technical file
BOM and material planning
Procurement and vendor follow-up
Fabric inward and QC
```

### Phase 3: Shopfloor and Quality Depth

Add:

```text
Cutting room
Wash recipe execution
Quality management
Rework and recovery
Operator skill and capacity
Department handover
Mobile shopfloor updates
```

### Phase 4: Governance, Simulation, and Analytics

Add:

```text
Executive control tower
Calendar / Gantt planning
What-if simulation
Plan change approval
Master data governance
Performance analytics
Role-based home surfaces
```

---

# Part J: Key Risks and Mitigation

---

## 45. Implementation Risks

| Risk | Mitigation |
|---|---|
| Users continue using Excel | Make MVP surfaces action-critical and reduce duplicate entry |
| Poor master data | Start with minimum required master data and completeness checks |
| Delayed shopfloor actuals | Use simple update flows and supervisor-level capture |
| Resistance to gate-based release | Use management-backed policy for PCD and daily release |
| FastReact overlap confusion | Define integration or coexistence role clearly |
| Wash complexity under-modeled | Include wash planning in MVP, not later phase |
| Data not trusted | Show planned vs actual and audit trail |
| Too many alerts | Prioritize shipment-impacting exceptions |
| Large-scale rollout risk | Pilot with selected lines/styles before scale-up |
| Extra workload perception | Replace Excel routines instead of adding parallel work |

---

# Part K: Open Decisions

---

## 46. Decisions Required Before Build

1. Will this tool replace FastReact, integrate with it, or operate as an operational control layer above/beside it?
2. What is the source of truth for order master and PO details?
3. What is the source of truth for material readiness?
4. What production actuals are currently captured digitally?
5. Which workcenters should be included in the first pilot?
6. What are the current PCD readiness rules at Eratex?
7. How is wash planning currently performed?
8. How are sewing line capacities currently calculated?
9. How is overtime cost currently tracked against shipment recovery?
10. Which Excel files are currently used for real planning decisions?

---

# 47. Final BRD Summary

Eratex requires an end-to-end planning and scheduling tool because its current planning environment appears to be partially digitized but still operationally dependent on Excel. The factory maintains high OTIF, but with additional operating expense, while resource utilization remains around 70%. This suggests that shipment commitments are being protected through late-stage recovery rather than stable flow-based planning.

The proposed tool must become the daily operating discipline layer for Eratex. It must enforce order visibility, PCD readiness, weekly and daily planning control, workcenter load monitoring, realistic sewing line loading, denim-specific wash planning, WIP ageing visibility, exception ownership, and shipment readiness.

The MVP must deliver the ten critical surfaces needed to stabilize the planning process. The mature-state product should then expand into sampling, procurement, quality, shopfloor execution, skill-based capacity, what-if simulation, master data governance, analytics, and role-based control surfaces.

The intended business outcome is clear:

```text
Maintain high OTIF,
increase resource utilization,
reduce overtime and recovery cost,
reduce Excel dependency,
improve planning discipline,
and protect shipment commitments through early, constraint-aware control.
```
