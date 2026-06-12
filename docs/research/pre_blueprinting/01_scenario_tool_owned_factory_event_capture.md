# Pre-Blueprint Scenario 1: Datatex Canonical Feed with Tool-Owned Factory Event Capture

Date prepared: 2026-06-11

Source context:

- `F:/eratex/docs/research/Eratex_Solution_Deck_Synthesis.md`
- `F:/eratex/docs/research/BLUEKAKTUS/07_fastreactplan_vs_bluekaktus_end_to_end_manufacturing_comparison.md`

## 1. Scenario Definition

In this scenario, Datatex remains the canonical ERP and transaction-data source for the planning and scheduling tool. Datatex is the primary feed for customer order, projection, confirmed order, product/order attributes, procurement, material, inventory, and shipment-related transaction data.

The new planning and scheduling tool owns the live operational capture layer for factory execution events that are not available with sufficient granularity, speed, or reliability from Datatex or existing systems.

This means the tool will include web, mobile, tablet, or shop-floor interfaces for capturing:

- Actual production output.
- Cutting progress.
- Sewing line loading and hourly/daily output.
- Sewing WIP and basket completion.
- Laundry lot status and machine events.
- Finishing and packing progress.
- Machine breakdown and downtime.
- Human resource availability at line/workcenter level.
- Defect, rework, and quality events where needed for planning.
- Daily flow meeting remarks and exception actions.

The intent is to make the planning tool not only a planner's schedule board, but also the owner of operational truth needed to stabilize the plan.

## 2. Core Design Position

This scenario is most relevant if Eratex does not currently have reliable real-time or near-real-time event capture for shop-floor operations outside Datatex, or if existing systems cannot expose the required event detail through APIs.

The core position is:

- Datatex owns canonical commercial and ERP transactions.
- The planning tool owns the operational event ledger for planning-relevant execution truth.
- FastReact, if retained, is treated as a controlled planning visualization or schedule board, not the only scheduling brain.
- The planning tool or Vector Flow-aligned engine owns planning logic, release governance, readiness checks, execution priorities, and daily operational feedback.

## 3. Why This Scenario Exists

The Eratex solution deck indicates that existing FastReact availability is not enough to solve the full reliability problem. The identified gaps include:

- Full Kit Date misses caused by fabric, trims, PPS, garment test sample approval, and handoff delays.
- Planned Cut Date instability caused by pre-production uncertainty and repeated date changes.
- Sewing plan instability caused by frequent line changes and start-date changes.
- Laundry constraints not captured deeply enough for daily machine-wise scheduling.
- Lack of sub-category-level capacity visibility.
- Lack of granular WIP and line feeding visibility.
- Manual follow-up through Excel, WhatsApp, email, memory, and meetings.
- Missing common priority mechanism across departments.

This scenario responds by giving the new tool first-hand data capture responsibility for the events that drive planning credibility.

## 4. System Roles

| System / Layer | Role in Scenario 1 |
|---|---|
| Datatex ERP | Canonical system for order, projection, customer, style/order attributes, procurement, inventory, financial/shipment transaction references, and ERP lifecycle states. |
| Planning and scheduling tool | Planning brain, readiness controller, scenario planner, zone governance engine, execution release controller, factory event capture layer, operational event ledger, dashboard and exception layer. |
| FastReact, if retained | Controlled sewing plan visualization and planning board, receiving approved plan updates from the planning tool or supplying current line load where still required. Manual override should be governed. |
| Tool-owned mobile/tablet apps | Capture cutting, sewing, laundry, finishing, packing, breakdown, HR availability, quality, and WIP events. |
| TMS/WAS module | Controls merchandising and pre-production tickets, Time and Action Calendar, FKD/PCD readiness, closure criteria, file uploads, SLA, and project health. |
| Laundry scheduler | Generates machine-wise, order-wise, operation-wise schedules for laundry based on route, lot availability, machine capability, priority, and capacity. |
| Dashboards/reviews | OTIF, FKD, PCD, load/capacity, WIP, line output, laundry adherence, reason-code Pareto, and daily flow meeting control. |

## 5. Operating Flow Overview

The expected end-to-end flow is:

1. Datatex sends projected or confirmed customer order data to the planning tool.
2. The planning tool maps the order to product category, route, SMV/SAM, critical resource categories, and resource sub-categories.
3. The planning tool checks available capacity across cutting, sewing, laundry, finishing, and other critical resources.
4. The tool proposes feasible delivery week/date and capacity block.
5. Volatile-zone changes are governed until order confirmation.
6. Firm-zone entry locks key dates and resource commitments.
7. TMS/WAS controls Time and Action Calendar, FKD, and PCD readiness through workflow tickets.
8. Release control validates material, technical, pre-production, capacity, and line readiness.
9. Tool-owned factory interfaces capture execution events.
10. The scheduler updates priorities, WIP, load, delay risk, and dashboards.
11. Shipment readiness is reconciled back with Datatex shipment/dispatch status.

## 6. End-to-End Flow Details

### 6.1 Customer Order / Projection Entry

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
- Order type: projection, confirmed, repeat, replenishment, sample-linked, priority, or strategic order.
- Product group: basic, chino, cargo, jacket, etc.
- Fabric and garment type.
- Destination/shipment requirement where required.

The planning tool should:

- Create or update an internal planning order.
- Preserve the Datatex identifier as canonical reference.
- Validate missing planning attributes.
- Flag missing route, SMV/SAM, product group, laundry route, or customer-specific constraints.
- Place the order into the correct planning zone.

Governance:

- Datatex remains the source of commercial order truth.
- The planning tool should not create independent commercial orders.
- Any order imported without sufficient planning attributes is held in a data exception queue.

### 6.2 Due Quotation and Future / Free Zone Planning

Purpose:

- Decide what delivery week/date can be promised before final commitment.
- Avoid quoting dates that overload critical resources.

The planning tool should calculate load across:

- Cutting.
- Relaxation.
- Embroidery/printing.
- Sewing.
- Laundry.
- Finishing.
- FG/packing readiness where capacity-sensitive.

Calculation inputs:

- Order quantity.
- SMV/SAM.
- Product route.
- Sewing sub-category.
- Laundry route and machine/process sub-category.
- Existing load.
- Workcenter capacity.
- Shift pattern.
- Holiday/maintenance calendar.
- Historical performance buffer.
- Strategic customer priority.

Output:

- Requested week feasible / not feasible.
- Alternate feasible delivery week.
- Indicative PCD.
- Indicative FKD.
- Indicative route and resource load.
- Capacity block if the order is a projection.
- Expiry date for projection capacity block.

Governance:

- In this zone, exact line and machine assignments are not locked.
- The system should record whether a capacity reservation is projection-based or confirmed.
- Projection expiry should trigger follow-up or capacity release.

### 6.3 Volatile Zone: Confirmation and Controlled Reshuffling

Purpose:

- Convert uncertain demand into confirmed orders.
- Allow controlled changes before firm-zone lock.

Operations in this zone:

- Projection confirmation follow-up.
- Projection expiry.
- Strategic customer prioritization.
- Quantity/date revision.
- Order cancellation.
- Fabric/trims procurement trigger review.
- TMS/WAS project initiation.
- Workflow route selection by customer, fabric, garment type, and product group.

Tool-owned actions:

- Maintain a volatile-zone change log.
- Recalculate capacity impact when Datatex sends order changes.
- Notify merchandising for projection confirmation.
- Release capacity when projection expires.
- Start TMS/WAS workflows when defined triggers are received.
- Show impact of pull-ahead/postponement before applying to plan.

Governance:

- Changes are allowed but must be visible and reason-coded.
- Delivery week changes should retain history.
- Capacity reservations should show whether they are strategic, confirmed, or provisional.

### 6.4 Firm Zone: Plan Lock and Release Readiness

Purpose:

- Stop routine replanning.
- Convert the order from planning candidate to protected execution commitment.

Locked objects:

- Committed ex-factory date or delivery date.
- Planned Cut Date.
- Full Kit Date.
- Sewing start and sewing end date.
- Sewing line/sub-category allocation.
- Critical-resource route.
- Laundry route and machine group.
- Capacity reservation.
- Standard production lead-time buffer.
- Critical TMS/WAS milestone obligations.

Release readiness checks:

- Confirmed order state in Datatex.
- Approved style/product data.
- Approved route.
- Approved SMV/SAM.
- Material readiness or governed shortage exception.
- FKD status.
- PCD status.
- Required approvals: PPS, garment test, wash, fit, lab, or buyer-specific approvals.
- Cutting capacity.
- Sewing line capacity and manpower readiness.
- Laundry route and capacity readiness.
- Quality readiness where applicable.

Governance:

- Manual FastReact or line-schedule changes should require approval.
- PCD movement should require reason and impact preview.
- Ex-factory date changes should require explicit approval.
- Orders should not be released to cutting if required readiness gates fail, unless a governed override is approved.

### 6.5 PCD Journey and Full Kit Control

The tool should run TMS/WAS workflows for all pre-production and merchandising activities that can affect FKD and PCD.

The Time and Action Calendar should be treated as either an extension of TMS/WAS or a merged calendar-workflow feature. It is the date-governance layer that converts order requirements into a milestone calendar and then opens, prioritizes, and closes tickets against that calendar.

T&A should be generated from:

- Customer.
- Buyer program or order type.
- Fabric and garment type.
- Style/product group.
- Order confirmation date.
- Requested or committed ex-factory date.
- Planned Cut Date.
- Full Kit Date.
- Approved workflow template.
- Standard milestone offsets and buffers.

T&A should maintain:

- Baseline planned date.
- Current target date.
- Revised date where allowed.
- Actual completion date.
- Owner/team.
- Predecessor and successor dependency.
- Mandatory closure criteria.
- Delay reason.
- Whether the milestone is critical for FKD, PCD, cutting release, sewing loading, laundry start, packing, or shipment.

T&A milestone examples:

- Order confirmation.
- Fabric PO creation.
- Trims PO creation.
- Lab dip / wash / shade / approval milestones.
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

Ticket logic:

- Tickets open only when prerequisites are complete.
- Tickets do not open before the work can meaningfully start.
- Tickets have SLA based on touch time plus nominal queue length.
- Ticket priority is based on SLA and project milestone health.
- Closure requires mandatory fields, dates, checklists, and file uploads.
- Critical tickets can include intermediate check tickets.
- T&A milestones update from ticket closure, but milestone date revision requires governance when the order is in volatile, firm, or execution zone.

Typical workflow areas:

- Customer confirmation.
- Fabric PO.
- Trims PO.
- Ex-mill follow-up.
- PPS.
- Garment test sample approval.
- Fit approval.
- Wash approval.
- Chemical test.
- Fabric test.
- Cut head end.
- Relax shrinkage.
- Marking shrinkage.
- Production file readiness.

Tool-owned event capture:

- Ticket updates are captured directly in the tool.
- Supporting documents are uploaded into the tool.
- Missing closure inputs prevent downstream tickets from opening.

Governance:

- FKD and PCD readiness should be computed from actual ticket closure state.
- A ticket should be able to block release when it is mandatory for that order type.
- PCD changes must be logged with reason and impact.
- T&A baseline dates should be preserved for audit.
- T&A date revisions should require reason codes and approval once the order is inside the firm zone.
- Critical T&A misses should feed the Black/Red/Yellow/Green priority system and Daily Flow Meeting.

### 6.6 Production Initiation / Daily Release Control

The planning tool should create a controlled daily release step before production execution begins.

Release scope:

- Release to cutting.
- Release to sewing line loading.
- Release to laundry sequence.
- Release to finishing/packing where required.

Release checks:

- Order is in firm zone.
- PCD is valid and not expired.
- Required materials are available or exception-approved.
- Cut plan is ready.
- Sewing line is allocated.
- Line manpower is available.
- Laundry route is scheduled.
- Quality checkpoints are known.
- No unresolved Black/Red readiness blockers.

Tool-owned interface:

- Release dashboard for PPIC/planning.
- Supervisor confirmation screen.
- Exception approval screen.
- Release audit trail.

Governance:

- Release should be an explicit event.
- Release should not be inferred merely from schedule placement.
- Every release override should capture reason, owner, approval, and risk.

### 6.7 Cutting Planning and Execution

Tool-owned capture should include:

- Fabric relaxation start/end.
- Marker status.
- Spreading start/end.
- Cutting output.
- Cut quantity by order/color/size/lot.
- Cut bundle or cut panel creation.
- Cut panel WIP by target sewing line.
- Shortage, shade, damage, replacement, and recut events.
- Transfer from cutting to sewing queue.

Planning use:

- PCD adherence.
- Cutting WIP target.
- Line feeding readiness.
- Cut panel shortage detection.
- Multi-line basket completion.

Governance:

- Cutting output should be linked to a governed release.
- Cut WIP should be visible by line and order.
- Recut or replacement events should impact capacity and delivery risk.

### 6.8 Sewing Scheduling, Line Balancing, and Output Capture

Scheduling logic:

- Use Datatex order quantity and product attributes.
- Use approved SMV/SAM and route.
- Use line/sub-category capability.
- Use learning curve and line efficiency assumptions.
- Use actual line capacity, shift pattern, and manpower availability.
- Allocate order to one or more lines where required.

Tool-owned capture:

- Line loading confirmation.
- Line manpower availability.
- Hourly or shift output.
- End-of-line output.
- Defects and rework quantity.
- Downtime and reason.
- Style changeover start/end.
- Multi-line basket progress.
- Sewing completion.

Line balancing expectation:

- At pre-blueprint stage, line balancing should be treated as a capability area, not assumed fully solved.
- Required design decisions include operation bulletin depth, workstation-level data, skill matrix, operator availability, machine availability, and whether balancing is done at order loading, daily execution, or operation level.

Governance:

- Line changes inside firm/execution zone require approval.
- Manual schedule movement should generate an impact preview.
- Output shortfall should trigger priority escalation before due dates are moved.

### 6.9 Laundry Planning and Execution

Laundry is a critical constraint in the Eratex deck.

Scheduler inputs:

- Laundry route.
- Operation sequence.
- Lot count.
- Piece count / kg.
- Machine group.
- Preferred machine rules.
- Changeover matrix.
- Capacity calendar.
- Stage-wise WIP.
- Priority color.
- Due date and buffer status.

Tool-owned capture:

- Laundry in.
- Lot making.
- Machine assignment.
- Operation start/end.
- Waiting reason.
- Machine breakdown.
- Rework/re-wash.
- Laundry out.
- Stage-wise WIP.

Scheduler output:

- Machine-wise schedule.
- Order-wise schedule.
- Operation-wise schedule.
- Bottleneck load.
- Lot readiness gaps.
- Changeover impact.
- Idle reason visibility.

Governance:

- Laundry schedule should be generated from constraint logic, not informal manual sequencing.
- Machine substitutions should capture reason.
- Preferred-machine deviations should be visible.
- Laundry delay should feed production priority and shipment risk.

### 6.10 Finishing, Packing, and Shipment Readiness

Tool-owned capture:

- Finishing input.
- Finishing output.
- Ironing, tagging, inspection, repair, and final packing status where applicable.
- Packing start/end.
- Carton completion.
- FG warehouse receipt.
- Shipment readiness.
- Short shipment risk.

Datatex role:

- Shipment transaction.
- Invoice/export documentation references.
- Dispatch and shipment closure.
- Financial posting.

Planning-tool role:

- Protect ex-factory promise.
- Show remaining flow to shipment.
- Detect FG spread: first combo receipt to last combo receipt.
- Track short-shipment risk.
- Confirm whether all order quantities are ready in full.

Governance:

- Shipment readiness should be evaluated against originally committed date and quantity.
- Shipment closure should reconcile with Datatex dispatch state.
- Short shipment requires reason code and customer/management approval if applicable.

## 7. Event Capture Model

The tool should maintain an operational event ledger.

Mandatory event families:

| Event Family | Example Events | Capture Interface |
|---|---|---|
| Planning | due quote, capacity block, zone transition, plan lock, plan change request | planner web app |
| TMS/WAS | ticket open, ticket close, document upload, SLA breach, check fail, milestone achieved | web/mobile |
| T&A calendar | milestone generated, baseline date locked, target date revised, milestone completed, critical milestone missed | web/mobile |
| Material readiness | material ready, shortage, QC hold, allocation issue, exception approval | web/mobile or Datatex feed plus user validation |
| Cutting | cut start, cut output, recut, cut WIP transfer, panel shortage | tablet |
| Sewing | line loading, hourly output, downtime, defect, rework, basket completion | tablet |
| Laundry | lot making, machine start/end, waiting, breakdown, rewash, laundry out | tablet/kiosk |
| Finishing/packing | finishing output, packed qty, carton completion, FG receipt | tablet |
| Maintenance | machine down, machine restored, downtime reason | tablet/mobile |
| HR/manpower | line manpower available, absenteeism, substitute manpower, skill exception | tablet/mobile |
| Quality | inspection pass/fail, defect reason, rework requirement | tablet/mobile |
| Shipment | ready to ship, short quantity, dispatch confirmation | Datatex feed plus planning confirmation |

## 8. Datatex Interface Expectations

Inbound from Datatex:

- Customer/order/projection/confirmed order data.
- Style and product attributes.
- Shipment split and requested dates.
- Order status.
- Procurement PO status.
- Material receipt and inventory status where available.
- Shipment/dispatch status.
- Existing T&A dates or milestone references, if maintained in Datatex.

Outbound to Datatex:

- Suggested delivery week/date, if agreed.
- Final committed due date, if Datatex stores it.
- PCD/FKD values, if Datatex requires them.
- T&A baseline/current/actual milestone dates, if Datatex consumes milestone status.
- Release status.
- Production completion milestones, if Datatex consumes them.
- Shipment readiness or exception status.

Design rule:

- Datatex remains transaction truth.
- The planning tool owns planning status and operational event truth.
- Reconciliation rules must be explicitly defined where both systems contain overlapping fields.

## 9. Zone Governance and Lock Matrix

| Operational Object | Future / Free Zone | Volatile Zone | Firm Zone | Execution Zone |
|---|---|---|---|---|
| Order status | projection/early demand from Datatex | confirmation targeted | confirmed only | confirmed and released |
| Delivery week/date | suggested | negotiated and impact-checked | locked | exception only |
| Capacity block | provisional | confirmed or released | committed | consumed |
| Route | estimated/selected | validated | locked | exception only |
| SMV/SAM | assumed or latest available | validated | locked | revision by exception |
| FKD | indicative | workflow-driven | locked target | blocker if missed |
| PCD | indicative | stabilized | locked | delay managed by priority |
| Sewing line | not fixed | candidate | locked | change approval required |
| Laundry machine group | estimated | validated | locked | substitution reason required |
| T&A / TMS tickets | template and milestone calendar selected | active and priority-driven | baseline critical dates locked; mandatory tickets controlled | proof required; revisions by exception |
| Production release | not allowed | not allowed except special case | readiness-controlled | execution event |

## 10. Strengths of Scenario 1

- Gives the planning tool direct access to live execution truth.
- Avoids dependence on incomplete external event feeds.
- Enables interface design around Eratex's exact shop-floor needs.
- Supports granular WIP and priority control.
- Makes line feeding, laundry, and production delays visible at source.
- Provides one operational event ledger for planning and execution.

## 11. Risks of Scenario 1

- Larger implementation scope.
- Higher user adoption burden on factory supervisors and operators.
- Device rollout, connectivity, user training, and support are required.
- Risk of duplicate entry if Datatex or other systems already capture similar events.
- Requires careful master-data synchronization with Datatex.
- Requires strong role and data-quality governance to prevent bad shop-floor capture from corrupting planning.

## 12. Blueprinting Questions

1. Which factory events are not available today from Datatex or other systems?
2. Which events must be captured in real time versus shift-end or day-end?
3. Which devices are practical for cutting, sewing, laundry, finishing, and packing?
4. Does Eratex require offline-capable capture in factory areas?
5. Which users will capture output, downtime, defects, and WIP movement?
6. How will captured data be validated before it affects the plan?
7. Which captured events should be pushed back to Datatex?
8. What is the authoritative source for manpower availability and skill?
9. Which execution events should trigger automatic priority changes?
10. Which events should block release, line loading, packing, or shipment?
11. Should T&A be a standalone module, a TMS/WAS calendar view, or a generated milestone layer inside workflow?
12. Which T&A milestones must be baseline-locked at order confirmation, firm-zone entry, and production release?
13. Which teams can revise T&A dates, and what approval is required after firm-zone entry?

## 13. Scenario 1 Summary

Scenario 1 is the fuller control model. Datatex feeds the canonical transaction data, but the planning tool becomes the operational nervous system for factory events. This gives the tool the direct visibility needed to manage the pain points in the Eratex deck: FKD/PCD drift, line instability, laundry scheduling, execution WIP, priority confusion, and firefighting.

The cost is implementation breadth. The project becomes not just planning software but a shop-floor event capture and execution-control rollout.
