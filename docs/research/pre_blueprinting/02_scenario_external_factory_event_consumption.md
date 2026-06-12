# Pre-Blueprint Scenario 2: Datatex Canonical Feed with External Factory Event Consumption

Date prepared: 2026-06-11

Source context:

- `F:/eratex/docs/research/Eratex_Solution_Deck_Synthesis.md`
- `F:/eratex/docs/research/BLUEKAKTUS/07_fastreactplan_vs_bluekaktus_end_to_end_manufacturing_comparison.md`

## 1. Scenario Definition

In this scenario, Datatex remains the canonical ERP and transaction-data source for the planning and scheduling tool. Datatex is the primary feed for customer order, projection, confirmed order, product/order attributes, procurement, material, inventory, and shipment transaction data.

Unlike Scenario 1, the new planning and scheduling tool does not become the primary factory event capture application. Instead, live operational event information is expected to be available from Datatex, FastReact, MES, HR, maintenance, quality, warehouse, laundry automation, or other existing factory systems through APIs, files, events, or database-backed integration services.

The planning tool is primarily a consumer, normalizer, planner, governance engine, scheduler, and control cockpit.

## 2. Core Design Position

This scenario is most relevant if Eratex already has reliable systems or automation that capture factory execution events with enough detail and frequency.

The core position is:

- Datatex owns canonical transaction truth.
- Existing factory systems own live event capture.
- The planning tool consumes trusted external event streams.
- The planning tool owns planning logic, plan governance, readiness interpretation, constraint scheduling, exception prioritization, and dashboards.
- The planning tool should avoid duplicate capture except for approvals, planning decisions, and exception comments.

## 3. Why This Scenario Exists

The Eratex deck identifies planning and execution gaps, but those gaps do not automatically mean the new planning tool must capture every event itself.

If the required events already exist in Datatex or adjacent systems, the better design may be to consume them and focus the new tool on:

- Capacity-constrained due quotation.
- Critical-resource planning.
- Zone governance.
- Plan freeze and release control.
- PCD/FKD risk interpretation.
- Laundry constraint scheduling.
- Priority and buffer management.
- Exception management.
- Dashboards and POOGI.

This reduces duplicate entry and lets Eratex reuse existing operational systems.

## 4. System Roles

| System / Layer | Role in Scenario 2 |
|---|---|
| Datatex ERP | Canonical commercial and ERP transaction source for orders, projections, procurement, material, inventory, shipment, and ERP lifecycle status. |
| Existing MES / shop-floor systems | Source of actual production output, line output, WIP movement, downtime, defects, and execution status where available. |
| FastReact, if retained | Source or target for sewing plan, line allocation, load, and schedule status. May remain schedule visualization layer if governed. |
| HR/attendance system | Source of manpower availability, absenteeism, shift availability, and possibly skill availability. |
| Maintenance/CMMS or machine automation | Source of machine breakdown, machine availability, planned maintenance, and downtime events. |
| Quality system | Source of inspection status, defects, rework, hold, and approval events. |
| WMS/packing/FG systems | Source of packed quantity, carton status, FG receipt, shipment readiness, and dispatch status. |
| Planning and scheduling tool | Consumer of all event feeds; owner of planning, Time and Action Calendar interpretation where required, release governance, readiness interpretation, scheduling recommendations, exception control, and dashboards. |

## 5. Operating Flow Overview

The expected end-to-end flow is:

1. Datatex sends projected or confirmed customer order data to the planning tool.
2. External systems provide product, route, capacity, material, production, HR, machine, quality, WIP, packing, and shipment events.
3. The planning tool normalizes these feeds into a planning data model.
4. The planning tool calculates feasible delivery week/date and critical-resource load.
5. Zone governance controls when demand is flexible, volatile, firm, and released.
6. T&A, FKD, PCD, and readiness are interpreted from external system data rather than captured directly where reliable feeds exist.
7. The scheduler produces line/laundry/critical-resource plans and recommendations.
8. Execution progress is consumed from external systems.
9. Exceptions are prioritized, escalated, and reviewed in planning dashboards.
10. Shipment readiness and OTIF are reconciled against Datatex and shipment systems.

## 6. Required Integration Principle

Scenario 2 is integration-led. Its success depends on the quality of upstream event feeds.

Minimum integration principles:

- Every external event must carry a stable order/work-order identifier that maps to Datatex.
- Every event must carry timestamp, source system, status, quantity where applicable, and user/machine/workcenter where applicable.
- The planning tool must store raw inbound event references for audit.
- The planning tool must normalize events into common planning statuses.
- Data latency must be defined per event type.
- Failed imports must be visible and actionable.
- Feed completeness must be monitored.

## 7. End-to-End Flow Details

### 7.1 Customer Order / Projection Entry

Canonical source: Datatex.

Datatex should feed:

- Customer.
- Buyer division or customer segment.
- Sales order / work order / garment PO reference.
- Projection or confirmed order status.
- Style/article.
- Color/size/assortment where available.
- Quantity and shipment split.
- Requested ex-factory date or requested delivery week.
- Product group.
- Fabric and garment type.
- Commercial priority.
- Shipment requirement.

The planning tool should:

- Create or update an internal planning order.
- Map external events from other systems to the Datatex order key.
- Detect missing planning attributes.
- Place the order into the correct planning zone.

Governance:

- No independent customer order creation in the planning tool.
- Datatex remains the authority for order existence and transaction state.
- The planning tool may own planning-specific derived statuses.

### 7.2 Due Quotation and Future / Free Zone Planning

Purpose:

- Quote or recommend feasible delivery week/date based on real load and constraints.

External inputs required:

- Order demand from Datatex.
- SMV/SAM from Datatex, IE system, PLM, or FastReact/GSD source.
- Route from Datatex, PLM, or route master.
- Current load from FastReact/MES/planning systems.
- Capacity calendars from Datatex, HR, maintenance, or capacity master system.
- Machine availability from maintenance/automation system.
- Material availability from Datatex/procurement/inventory.

Planning tool output:

- Requested week feasible / not feasible.
- Suggested alternate week.
- Capacity block recommendation.
- Indicative FKD/PCD.
- Resource-load impact.
- Risk flags for missing data.

Governance:

- Delivery commitment should not be confirmed if critical feeds are stale.
- The tool should clearly distinguish calculated recommendation from Datatex-confirmed commitment.

### 7.3 Volatile Zone: Confirmation and Controlled Reshuffling

Operations in this zone:

- Projection follow-up.
- Projection expiry.
- Order confirmation.
- Order changes.
- Strategic prioritization.
- Quantity revision.
- Procurement trigger review.
- Pre-production workflow start.

External feeds:

- Datatex order status changes.
- Datatex projection-to-confirmed status.
- Procurement status from Datatex.
- TMS/workflow status if already external.
- Email-trigger or CRM/order-confirmation signals if integrated.

Planning tool responsibilities:

- Recalculate capacity after every confirmed change.
- Maintain change history.
- Compare previous load with revised load.
- Flag impact on other orders.
- Recommend whether a change can stay in volatile zone or requires escalation.

Governance:

- Volatile-zone changes are permitted but reason-coded.
- Strategic pull-ins or postponements require impact preview.
- Expired projection capacity must be released or renewed.

### 7.4 Firm Zone: Plan Lock and Release Readiness

The firm zone depends heavily on external data correctness in Scenario 2.

Locked objects:

- Ex-factory commitment.
- Planned Cut Date.
- Full Kit Date.
- Sewing schedule.
- Sewing line/sub-category allocation.
- Critical route.
- Laundry route.
- Critical resource capacity reservation.

External readiness feeds:

- Material availability from Datatex/WMS.
- Procurement status from Datatex.
- Approval/TMS status from workflow system.
- Quality approval status from QMS.
- Sewing plan from FastReact or scheduling system.
- Line availability from MES/HR.
- Machine availability from maintenance system.

Planning tool responsibilities:

- Interpret readiness from external feeds.
- Produce readiness score and blockers.
- Block or warn against firm release if feeds show missing readiness.
- Generate release exception workflow.
- Maintain planning audit.

Governance:

- A feed being absent is not the same as readiness.
- The planning tool should treat missing or stale mandatory data as a blocker.
- Plan changes inside firm zone require approval and reason.

### 7.5 PCD Journey and Full Kit Control

Scenario 2 assumes merchandising and pre-production event data is available from Datatex, TMS, PLM, or other workflow systems.

The Time and Action Calendar can be handled in two ways in this scenario:

- External-source model: Datatex, PLM, or an existing workflow system owns the T&A calendar and sends planned, revised, and actual milestone dates to the planning tool.
- Planning-tool-derived model: the planning tool generates or maintains a derived T&A calendar from Datatex order data and external milestone events, while the underlying activity execution remains in other systems.

In either case, T&A is the milestone calendar that connects customer commitment to FKD, PCD, production release, and shipment readiness. It should not be a passive list of dates. It must be connected to readiness, priority, and release governance.

Required T&A data:

- Milestone code and description.
- Baseline planned date.
- Current target date.
- Revised date where applicable.
- Actual completion date.
- Owner/team.
- Source system.
- Dependency or predecessor milestone.
- Criticality flag for FKD, PCD, release, packing, or shipment.
- Delay reason.
- Approval status for date revisions.

T&A milestone examples:

- Order confirmation.
- Fabric PO creation.
- Trims PO creation.
- Fabric ex-mill.
- Fabric in-house.
- Fabric inspection and approval.
- PPS / PP sample / garment test sample approval.
- Fit approval.
- Wash approval.
- Full Kit Date.
- Planned Cut Date.
- Cutting release.
- Sewing start.
- Sewing end.
- Laundry in.
- Laundry out.
- Finishing completion.
- Packing completion.
- Shipment readiness.

Required external events:

- Fabric PO creation.
- Fabric ex-mill.
- Fabric receipt.
- Trim readiness.
- PPS approval.
- Garment test sample approval.
- Fit approval.
- Wash approval.
- Chemical and fabric tests.
- Cut head end.
- Pre-production file completion.

Planning tool responsibilities:

- Convert these external milestones into FKD/PCD readiness.
- Detect late or incomplete milestones.
- Compare milestone health against project buffer.
- Prioritize orders using Black/Red/Yellow/Green status.
- Show which activity is blocking FKD or PCD.
- Preserve baseline T&A dates for audit.
- Highlight revised milestone dates separately from original milestone dates.
- Treat missing, stale, or conflicting T&A events as readiness risks.

Governance:

- External systems must provide enough detail to determine whether a milestone is actually complete.
- If only a high-level status is available, blueprinting must decide whether that is sufficient or whether Scenario 1-style capture is needed for specific events.
- T&A date revision after firm-zone entry should require reason, approver, and impact visibility.
- Critical T&A misses should feed release blockers and Daily Flow Meeting priorities.

### 7.6 Production Initiation / Daily Release Control

Daily release control should be owned by the planning tool even if event data is external.

Release checks:

- Confirmed order in Datatex.
- Firm-zone status.
- Approved route and SMV/SAM.
- Material readiness from Datatex/WMS.
- Pre-production readiness from workflow system.
- Cutting capacity readiness.
- Sewing line availability from FastReact/MES/HR.
- Laundry route and capacity readiness.
- Open machine breakdown status from maintenance.
- Open quality hold status from QMS.

Planning tool output:

- Release allowed.
- Release blocked.
- Release allowed with exception.
- Blocker list.
- Required approver.
- Risk to ex-factory.

Governance:

- The release decision should be recorded in the planning tool.
- Release should not depend on manual interpretation of multiple external screens.
- Feed timestamp should be visible to approvers.

### 7.7 Cutting Planning and Execution

External source options:

- Datatex production module.
- MES.
- Cutting room system.
- Barcode/RFID system.
- WMS or cut-panel tracking system.

Required events:

- Fabric relaxation start/end.
- Marker/spreading/cutting start/end.
- Cut quantity.
- Cut bundle/panel creation.
- Cut panel allocation to line.
- Cut WIP by line/order.
- Recut/replacement.
- Transfer to sewing.

Planning tool responsibilities:

- Monitor PCD adherence.
- Detect cut WIP imbalance by line.
- Detect insufficient line feeding.
- Update execution priority.
- Provide Daily Flow Meeting visibility.

Governance:

- If cutting events are not granular enough, this area becomes a candidate for Scenario 1-style capture.
- Cut output should be reconciled with order quantity and sewing input.

### 7.8 Sewing Scheduling, Line Balancing, and Output Consumption

External source options:

- FastReact.
- MES.
- Line output capture system.
- HR/attendance system.
- IE/skill system.

Required feeds:

- Approved sewing schedule.
- Line allocation.
- Sewing start date.
- Sewing end date.
- Hourly/shift output.
- Line manpower.
- Downtime.
- Defect/rework quantity.
- Changeover event.
- Basket completion for multi-line orders.

Planning tool responsibilities:

- Compare plan versus actual.
- Recalculate risk and buffer penetration.
- Identify line starvation or overload.
- Identify sewing line changes.
- Recommend whether execution priority can absorb delay or plan change is required.
- Support line balancing decisions where detailed operation data exists.

Line balancing dependency:

- If operation bulletin, skill matrix, operator allocation, and machine availability are available externally, the planning tool can support deeper balancing.
- If only line-level output is available, line balancing will remain coarse and should not be overpromised in blueprinting.

Governance:

- The source of sewing schedule truth must be explicit: FastReact or the planning tool.
- Manual changes in FastReact must be either blocked, imported with reason, or reconciled through change approval.

### 7.9 Laundry Planning and Execution

External source options:

- Laundry automation system.
- MES.
- Machine monitoring system.
- Manual laundry planning system with API.
- Datatex production status if sufficiently detailed.

Required feeds:

- Laundry route.
- Machine group.
- Lot status.
- Lot making status.
- Machine availability.
- Machine start/end events.
- Waiting reason.
- Breakdown event.
- Rewash/rework.
- Laundry out.

Planning tool responsibilities:

- Generate or evaluate machine-wise schedule.
- Check bottleneck starvation.
- Check batch formation feasibility.
- Check changeover impact.
- Check preferred-machine adherence.
- Compare planned versus actual shift adherence.
- Feed laundry risk into ex-factory and finishing risk.

Governance:

- If external laundry data is late or incomplete, a constraint scheduler cannot be trusted.
- Blueprinting must confirm whether laundry WIP and machine status are already captured reliably.

### 7.10 Finishing, Packing, and Shipment

External source options:

- Datatex.
- WMS.
- Packing system.
- FG warehouse system.
- Shipment/export documentation system.

Required feeds:

- Finishing input/output.
- Repair/rework.
- Final inspection status.
- Packing quantity.
- Carton completion.
- FG receipt.
- Short quantity.
- Shipment readiness.
- Dispatch/shipment event.

Planning tool responsibilities:

- Monitor remaining flow to ex-factory.
- Detect FG spread from first combo receipt to last combo receipt.
- Detect short-shipment risk.
- Reconcile OTIF against originally committed date and quantity.
- Send closure/status to Datatex if required.

Governance:

- Shipment transaction remains Datatex-owned.
- Planning tool owns delivery-risk interpretation and OTIF analytics.
- Short shipment should require reason and approval workflow where applicable.

## 8. Required API / Feed Families

| Feed Family | Source Candidate | Required Frequency | Planning Use |
|---|---|---|---|
| Order/projection | Datatex | near-real-time or scheduled frequent sync | demand, quote, zone entry |
| Product/style/route | Datatex/PLM/IE | on change | load calculation |
| SMV/SAM | IE/Datatex/FastReact/GSD source | on approval/change | sewing load, line balancing |
| Procurement/material | Datatex/WMS | frequent daily or event-based | FKD, release readiness |
| Workflow/TMS/T&A | Datatex/TMS/PLM | event-based | milestone calendar, FKD/PCD health, release blockers |
| Sewing schedule | FastReact/planning system | event-based | firm plan, line allocation |
| Sewing actual | MES/line system | hourly/shift | plan vs actual, priorities |
| Cutting actual | MES/cutting system | event/hourly/shift | PCD, line feeding |
| Laundry actual | laundry system/MES | event-based | machine scheduling, bottleneck status |
| HR/manpower | HR/attendance system | shift start and changes | capacity realism |
| Machine status | CMMS/automation | event-based | capacity availability |
| Quality | QMS/MES | event-based | hold, rework, release risk |
| Packing/FG/shipment | WMS/Datatex | event-based | shipment readiness, OTIF |

## 9. Data Quality and Feed Health Requirements

For Scenario 2, feed health is a first-class design object.

Each critical feed should publish:

- Last successful sync time.
- Last failed sync time.
- Record count.
- Rejected record count.
- Missing mandatory field count.
- Duplicate event count.
- Unmapped order count.
- Latency against agreed SLA.

The planning tool should show feed status because a stale feed can create a false plan.

Examples:

- If laundry WIP is stale, daily laundry scheduling should be marked unreliable.
- If material status is stale, release readiness should be blocked or warning-rated.
- If FastReact manual changes are not imported, line allocation should not be treated as current.
- If HR attendance is unavailable, available capacity should use a fallback assumption and show risk.
- If T&A milestone feeds are stale, FKD/PCD readiness should be risk-rated or blocked depending on criticality.

## 10. Zone Governance and Lock Matrix

| Operational Object | Future / Free Zone | Volatile Zone | Firm Zone | Execution Zone |
|---|---|---|---|---|
| Order status | Datatex projection/early demand | Datatex confirmation pending | confirmed in Datatex | confirmed/released |
| Delivery week/date | calculated recommendation | negotiated with impact preview | locked | exception only |
| Capacity block | provisional | confirmed/released | committed | consumed |
| Route | consumed from source | validated | locked | exception only |
| SMV/SAM | latest approved source | validated | locked | exception if changed |
| T&A calendar | generated/consumed from external source | milestone dates active and monitored | baseline critical dates locked | revisions by exception |
| FKD | derived from material/workflow/T&A feeds | workflow-driven | mandatory readiness target | blocker if missed |
| PCD | derived/validated from T&A and readiness feeds | stabilized | locked | priority-managed if delayed |
| Sewing schedule | candidate from planning/FastReact | candidate/revised | committed | manual changes governed |
| Laundry schedule | load/risk estimate | route validated | committed | machine sequence monitored |
| Release | not allowed | not allowed except exception | readiness controlled | execution event |

## 11. Strengths of Scenario 2

- Avoids duplicate shop-floor capture if reliable systems already exist.
- Reduces new mobile/tablet rollout scope.
- Lets users continue working in familiar execution systems.
- Positions the planning tool as the integration and governance brain.
- Can be faster if APIs and data contracts are mature.
- Keeps Datatex and existing systems as operational systems of record.

## 12. Risks of Scenario 2

- Planning accuracy depends on external feed quality.
- Missing event granularity can weaken scheduling and execution control.
- Integration latency can make dashboards stale.
- Different systems may define statuses differently.
- Mapping order/style/line/machine identifiers can become complex.
- External systems may not capture reason codes, closure proof, or project-health priority.
- If FastReact manual overrides are not governed, the planning tool may inherit unstable schedule truth.

## 13. Blueprinting Questions

1. Which systems currently capture cutting, sewing, laundry, finishing, packing, maintenance, HR, and quality events?
2. Do those systems expose APIs, files, database views, or only reports?
3. What is the latency of each event source?
4. Are event timestamps reliable and timezone-consistent?
5. Can every event be mapped to a Datatex order/work-order key?
6. Does FastReact expose schedule changes with reason and user?
7. Is laundry WIP available by stage and machine?
8. Is line manpower available by line and shift?
9. Are machine breakdowns available in near real time?
10. Does the quality system expose defects and rework in a way that affects capacity?
11. Are packing and shipment events detailed enough to measure in-full delivery?
12. Which missing feeds would force selective Scenario 1-style capture?
13. Where should T&A be owned: Datatex, existing PLM/TMS, or the new planning tool?
14. Can external systems provide baseline, revised, and actual milestone dates separately?
15. Can external systems expose T&A date-revision reason and approver?
16. Which T&A milestones are mandatory release blockers?

## 14. Scenario 2 Summary

Scenario 2 is the lighter capture and heavier integration model. Datatex remains the canonical transaction feed, and existing factory systems provide execution truth. The planning tool becomes the consumer and interpreter of operational data, using it to drive capacity-constrained order quotation, zone governance, release control, laundry scheduling, priority management, and dashboards.

This scenario is attractive if Eratex already has trustworthy factory event systems. Its risk is that poor integration quality or insufficient event granularity will make the planning tool look complete while still leaving the original problems unresolved.
