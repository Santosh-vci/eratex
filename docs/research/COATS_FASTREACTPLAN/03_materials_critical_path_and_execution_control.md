# Materials, Critical Path, and Execution Control

This document covers FastReactPlan's material supply and demand planning, pre-production critical path control, alerts, failure reasons, and execution control.

Primary official sources:

- [FastReactPlan](https://www.coatsdigital.com/en/manufacturer/fastreactplan/)
- [Garment Production Planning Process](https://www.coatsdigital.com/en/manufacturer/production-planning/)
- [Tunicotex FastReactPlan results](https://www.coatsdigital.com/en/news/tunicotex-boosts-otdp-to-with-fastreactplan/)
- [WinPro Handbag FastReactPlan case study](https://www.coatsdigital.com/en/testimonial/winpro-handbag-fastreactplan/)
- [Classic Fashion Apparel selects FastReactPlan](https://www.coatsdigital.com/en/news/classic-fashion-apparel-fastreactplan/)

## 1. Material Supply and Demand / MRP

### Official Workflow Addressed

Coats Digital describes FastReactPlan material supply and demand as full material requirements dynamically calculated on lean pull principles based on the latest sewing plan. Inventory and open MPOs are imported from the main business system to provide an up-to-date picture of material demand and supply.

### What It Does

The MRP capability turns the production plan into material priorities. When the sewing plan changes, material demand dates and priorities change.

It provides visibility into:

- Material requirements required by the production plan.
- Material demand timing.
- Current inventory.
- Open material purchase orders.
- Material supply versus production need.
- Supplier priorities needed to support sewing start dates.

### Logic Used

Officially stated logic:

- Full material requirements are dynamically calculated.
- Calculation is based on lean pull principles.
- The latest sewing plan is the driver.
- Inventory and open MPOs are imported from the main business system.
- Material suppliers get clearer priority visibility.

Interpretation:

- Material demand date is likely tied to the production start date, with offsets for goods-in, inspection, relaxation, shrinkage, cutting, or pre-production requirements.
- Demand quantity likely derives from order quantity, BOM consumption, wastage, color-size breakdown, and process needs.
- Supply quantity likely comes from on-hand inventory, allocated inventory, open purchase orders, expected delivery dates, and approved/usable status.
- The planning gap is the difference between required quantity/date and available or expected supply quantity/date.

### Promise of Delivery

Official promises include:

- More on-time starts of production.
- Smoother production flow.
- Improved efficiency and delivery performance.
- Reduced need to carry high raw material and WIP buffers.
- Less changing and chasing with fabric mills and material suppliers.

Customer evidence:

- WinPro states that FastReactPlan provided visibility into accurate material requirements based on lean pull principles, reducing material inventory and supporting cash flow.
- Tunicotex reports optimized inventory and material use, fewer shortages, reduced waste, and better cash flow after implementation.

### What It Means in System Use

Material teams use the latest plan as the priority engine. Instead of all orders being treated as urgent, material follow-up is focused on what is needed to protect planned production starts.

Procurement or ERP may remain the transaction system for POs, receiving, and stock. FastReactPlan appears to consume those signals for planning visibility and priority management.

### Tech Engagement

Typical engagement requirements:

- Map order requirements to material/BOM data.
- Import inventory and open MPOs from ERP or the main business system.
- Define material lead times and readiness offsets.
- Define supply status logic: ordered, received, inspected, approved, allocated, short, late.
- Agree how material shortage alerts are created and owned.
- Define supplier priority reports or views.

### Capability Probes

- Does FastReactPlan hold full BOM structures, or does it consume BOM from ERP/PLM?
- Can it distinguish fabric, trims, packaging, subcontract materials, and buyer-supplied materials?
- Does it support color/size/material variant-level shortage logic?
- Can it handle substitutions, partial availability, split deliveries, and late supplier ETAs?
- Can quality hold or failed inspection be represented as unavailable supply?
- Can material allocation be reserved by order, style, color, factory, or plan version?
- Does MRP generate purchase recommendations, or only visibility and priority reports?

## 2. Lean Pull Planning

### Official Workflow Addressed

Coats Digital repeatedly describes material and pre-production activities as dynamically driven by the latest plan on lean just-in-time principles.

### What It Does

Lean pull planning means upstream work is triggered by actual production need rather than broad static due dates. The system attempts to reduce unnecessary buffers while protecting on-time production start.

### Logic Used

Officially stated:

- Material priorities are driven by the latest plan.
- Critical pre-production dates are dynamically updated based on the latest plan.

Interpretation:

- The sewing plan creates demand signals.
- Upstream tasks and materials work backward from planned start dates.
- If production moves later, upstream urgency may reduce.
- If production pulls in, upstream tasks and materials become urgent.
- If production moves between factories or lines, owners and dates may change.

### Promise of Delivery

The promise is lower inventory, lower WIP, fewer buffers, and better on-time starts without constant manual chasing.

### Capability Probes

- What plan event triggers recalculation: drag/drop change, approved plan publication, production actual, or imported ERP change?
- Can recalculated material and critical-path dates require approval before publication?
- Can the system protect frozen or committed windows from automatic upstream churn?
- Can pull logic be configured by product type, buyer, factory, material category, or lead-time class?

## 3. Pre-Production Critical Path

### Official Workflow Addressed

Coats Digital says FastReactPlan provides a mechanism for all departments, suppliers, and customers to have shared priorities and clear visibility of the key tasks that must be completed, by whom and by when, to hit on-time start of production.

Official: Target dates are dynamically updated based on the latest plan. Color-coded alerts highlight late events. Failure reason codes support analysis and continuous improvement.

### What It Does

The critical path capability manages the pre-production tasks required before manufacturing can start. These tasks may include approvals, samples, trims, fabric, technical handoffs, artwork, testing, pilot runs, PP meeting, production file release, or supplier confirmations.

Officially, the page does not enumerate every task type. It describes the mechanism: shared task priorities, dynamic target dates, alerts, and reason codes.

### Logic Used

Officially stated logic:

- Tasks have owners and due dates.
- Target dates update with the latest plan.
- Late events are color-coded.
- Failure reason codes are captured for analysis.

Interpretation:

- Task dates are likely calculated backward from planned production start or milestone dates.
- Task templates may vary by product type, buyer, factory, material risk, embellishment, or quality process.
- Failure reason codes transform missed tasks from anecdotal issues into data for continuous improvement.
- When the production plan changes, affected tasks should recalculate or become flagged for review.

### Promise of Delivery

Official promises include:

- Shared priorities across departments, suppliers, and customers.
- More on-time starts of production.
- Fewer changes to the plan.
- Improved efficiency and delivery performance.
- Better identification of failure reasons and improvement opportunities.

Customer evidence:

- Classic Fashion Apparel's implementation included full critical path management providing clear priorities and early warning of issues.
- Paddock's Jeans, cited on the production planning page, reported improvement in critical path monitoring.

### What It Means in System Use

Pre-production teams should not maintain independent due-date trackers disconnected from the production plan. Their task dates should be plan-driven and visible to planning teams.

If a sample, fabric approval, lab dip, print strike-off, or PP approval is late, the planning team sees the production risk early enough to act.

### Tech Engagement

Typical engagement requirements:

- Define critical path templates and milestone libraries.
- Map task ownership by department, supplier, customer, role, or user.
- Define task offsets from production start or delivery date.
- Configure color alerts and lateness thresholds.
- Define failure reason codes and escalation routes.
- Build reports for late tasks, root causes, and continuous improvement.

### Capability Probes

- Can task templates vary by buyer, product family, factory, material, embellishment, or risk level?
- Can a task be owned by an external supplier or customer contact?
- Can target dates be recalculated automatically but require acceptance?
- Can reason codes be made mandatory when a task is completed late?
- Can critical path status block or warn against line loading?
- Is there audit history for due-date changes and responsibility changes?

## 4. Alerts and Management by Exception

### Official Workflow Addressed

FastReactPlan repeatedly references color-coded alerts, drill-down, powerful search, reporting, late event visibility, and management by exception.

### What It Does

Alerts help users focus on orders, lines, materials, or tasks that need action. Rather than reviewing every order manually, planners and managers prioritize exceptions.

Likely alert categories:

- Capacity overload.
- Material shortage.
- Late material delivery.
- Late pre-production task.
- Production behind plan.
- Support process bottleneck.
- Delivery risk.
- Reallocation or subcontracting need.

### Logic Used

Officially stated:

- Color-coded alerts highlight late events.
- Drill-down supports early proactive action.
- Reporting supports management by exception.

Interpretation:

- Alerts likely compare current status against planned dates, quantities, capacity, and readiness thresholds.
- Color coding may reflect normal, warning, critical, completed, late, or blocked states.
- Drill-down must connect the alert to the underlying order, material, task, or production block.

### Promise of Delivery

The promise is fewer surprises, faster proactive action, less time manually finding problems, and better delivery performance.

### Tech Engagement

Typical engagement requirements:

- Define alert states and colors.
- Configure alert thresholds and due-date logic.
- Define responsible owner by alert type.
- Train users on exception routines and daily planning meetings.
- Build escalation and reporting routines.

### Capability Probes

- Which alert rules are configurable versus hard-coded?
- Can users filter by buyer, factory, line, order, product type, material, or process?
- Can alerts be assigned, acknowledged, escalated, or closed?
- Are alert histories auditable?
- Can alerts trigger external notifications or integrations?

## 5. Execution Control Loop

FastReactPlan's execution control loop appears to work like this:

1. The latest production plan defines capacity demand.
2. The same plan drives material requirement priorities.
3. The same plan drives critical path task due dates.
4. Production updates are imported and compared to plan.
5. Late events, shortages, overloads, and plan variances are color-coded.
6. Planners and managers drill into exceptions and replan where needed.
7. Reason codes and KPI reports feed continuous improvement.

Interpretation: This is a closed-loop planning model. It is weaker if actual production, material status, and task completion are updated infrequently or inconsistently. It becomes stronger when every department treats the latest approved plan as the shared operating reference.

