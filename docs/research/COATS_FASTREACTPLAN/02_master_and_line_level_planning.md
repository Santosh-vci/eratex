# Master and Line-Level Planning

This document covers FastReactPlan's core planning surface: high-level master planning and detailed factory line or machine-level planning.

Primary official sources:

- [FastReactPlan](https://www.coatsdigital.com/en/manufacturer/fastreactplan/)
- [Garment Production Planning Process](https://www.coatsdigital.com/en/manufacturer/production-planning/)
- [Classic Fashion Apparel selects FastReactPlan](https://www.coatsdigital.com/en/news/classic-fashion-apparel-fastreactplan/)
- [VT Garment FastReactPlan results](https://www.coatsdigital.com/en/news/vt-garment-fastreactplan/)
- [WinPro Handbag FastReactPlan case study](https://www.coatsdigital.com/en/testimonial/winpro-handbag-fastreactplan/)

## 1. Master Planning

### Official Workflow Addressed

Coats Digital says that in multi-factory businesses the planning process starts on a high-level planning board that provides a control-tower view. The Master Planner manages total demand, projected and confirmed orders, and capacity while seeing a consolidated picture of materials and pre-production activities across the business.

### What It Does

Master planning gives the business a visual demand-versus-capacity view before detailed line scheduling. It supports order confirmation, order allocation, and capacity balancing across factories.

In practical use, the master planning board likely answers:

- Can the business accept or confirm this order?
- Which factory or production unit should make it?
- Does the load exceed available capacity in a week, month, or season?
- What happens if demand is moved from one factory to another?
- What happens if capacity is ramped up, reduced, or supplemented by subcontracting?
- Which orders are confirmed versus forecast or projected?

### Logic Used

Officially stated logic:

- Demand and capacity are managed together.
- Projected and confirmed orders are considered.
- Load versus capacity is visible across multiple factories.
- What-if planning allows sandbox comparison of scenarios.
- Reallocation across factories or subcontractors can be evaluated.
- Color coding, drill-down, search, and reporting support management by exception.

Interpretation:

- Master planning works at a higher aggregation level than line scheduling. It likely uses weekly or daily capacity buckets, factory-level capacity pools, product group assumptions, standard minutes, efficiency assumptions, and order delivery windows.
- Projected orders can reserve or forecast capacity before order confirmation.
- Confirmed orders can replace forecast demand where the implementation supports host order substitution, as described in the Classic Fashion Apparel implementation story.
- Scenario planning likely creates temporary versions of capacity/demand arrangements so planners can compare feasibility before committing.

### Promise of Delivery

Official promises tied to master planning include:

- Faster, more detailed, and more realistic planning and order confirmation.
- Informed order allocation.
- Better load-versus-capacity control across multiple factories.
- Earlier visibility of order status and planning problems.

Customer evidence:

- Classic Fashion Apparel selected the solution to support high-level demand and capacity across multiple factories.
- VT Garment reports large reductions in planning time and better capacity plan accuracy after implementation.
- Tunicotex reports a single source of truth for planning and production across vertically integrated operations.

### What It Means in System Use

Planning users must maintain a trustworthy demand and capacity view. The master board becomes the common planning reference for sales, merchandising, factory planning, management, materials, and pre-production.

The practical operating change is that order commitment should not happen only by planner intuition or spreadsheet capacity summaries. The planning board becomes the place where projected and confirmed demand is checked against available factory capacity and operational readiness.

### Tech Engagement

Typical engagement requirements:

- Load factory, unit, department, and capacity calendars.
- Define capacity buckets, shifts, holidays, working days, and available standard minutes.
- Map projected and confirmed order feeds from ERP or order systems.
- Define product group or style-level standard minute assumptions.
- Configure how forecast demand is replaced by confirmed demand.
- Configure subcontracting or external-capacity logic if used.
- Define planner roles, scenario permissions, and plan publication rules.

### Capability Probes

- Can FastReactPlan maintain multiple master-plan versions: draft, scenario, approved, and frozen?
- Can projected demand reserve capacity and then be automatically replaced by confirmed orders?
- What is the lowest and highest planning time bucket available in master planning?
- How does it model unavailable capacity, holidays, maintenance, absenteeism, and planned overtime?
- Can capacity be split by product family, buyer, skill, factory, process, or workcenter?
- How are subcontractor capacities represented and governed?
- Does the system retain scenario history and approval audit?

## 2. Order Confirmation Planning

### Official Workflow Addressed

FastReactPlan is described as supporting a faster and more reliable order confirmation process. The production planning page says fashion manufacturers need dynamic planning infrastructure for a fast, reliable order confirmation process optimized for delivery, cost, and speed.

### What It Does

Order confirmation planning uses the capacity and readiness view to determine whether new demand can be accepted, when it can be delivered, and what operational risks must be addressed.

### Logic Used

Officially supported:

- Capacity, materials, and pre-production must be considered together.
- Projected and confirmed demand can be managed in the high-level board.
- What-if planning supports scenario comparison before commitment.

Interpretation:

- A credible order confirmation should check:
  - Factory or line capacity.
  - Standard minute load.
  - Delivery date and production lead time.
  - Pre-production critical path lead time.
  - Material availability or supplier lead time.
  - Support-process capacity such as cutting, printing, embroidery, washing, finishing, or packing.
  - Risk of existing orders being displaced.

### Promise of Delivery

The promise is not only faster confirmation. It is more realistic confirmation, reducing late plan changes, expensive overtime, air freight, and customer disappointment.

### What It Means in System Use

Sales, merchandising, and planning teams need to use the system before committing customer dates. If order confirmation remains outside the planning board, the planning benefits will be weakened.

### Capability Probes

- Does FastReactPlan expose delivery-date promising logic to non-planner roles?
- Can order confirmation include material and critical-path feasibility, not only capacity?
- Can it flag whether accepting one order risks another order?
- Can it support customer-priority rules or margin-priority rules?
- Can it generate a confirmed plan lock or approval after order acceptance?

## 3. Factory Line / Machine-Level Planning

### Official Workflow Addressed

Coats Digital describes factory line or machine-level planning as highly visual drag-and-drop planning of the main manufacturing process, typically sewing. The planning uses standard minutes, efficiency profiles, and start-up or training curves. Supporting bottleneck processes such as embroidery and screen printing are automatically and dynamically driven by the sewing plan.

### What It Does

Line-level planning converts master demand into executable schedules for lines or machines. It assigns production orders to specific lines, dates, and sequences.

It supports:

- Visual placement of orders on lines or machines.
- Capacity calculation using standard minutes.
- Efficiency profile application.
- Learning or start-up curve modeling.
- Plan-versus-actual monitoring through imported production updates.
- Quick replanning when actual performance diverges.
- Color-coded alerts and drill-downs.

### Logic Used

Officially stated logic:

- Standard minutes are used.
- Efficiency profiles are used.
- Start-up and training curves are used.
- Supporting bottleneck process schedules are driven by the sewing plan.
- Production updates can be imported to monitor plan versus actual.

Interpretation:

- Available capacity is likely calculated from line hours, manpower, efficiency, and working calendar.
- Required capacity is likely calculated from order quantity multiplied by SAM or standard minute assumptions.
- Efficiency profiles may vary by line, product type, style complexity, factory, or learning period.
- Start-up/training curves reflect lower output during early days of a style or new line loading.
- Plan-versus-actual can detect shortfall, delay risk, overperformance, and available gap capacity.

### Promise of Delivery

Official promises include:

- Faster, detailed, and accurate planning.
- Better delivery and efficiency.
- Early proactive action through alerts.
- Quick replanning based on production updates.

Customer evidence:

- VT Garment reports reduced order loading time and plan variation recording time.
- WinPro reports more accurate production targets by considering line capability by product type.
- Nice Group, referenced on the FastReactPlan page, improved factory efficiency by focusing similar product families on lines for longer periods.

### What It Means in System Use

The line plan becomes a living production agreement. It is not just a daily schedule file. It is used to set expectations for:

- Line loading.
- Start and finish dates.
- Learning curve impact.
- Support-process timing.
- Material priorities.
- Pre-production due dates.
- Delivery risk.

If actual output is imported frequently enough, planners can replan quickly instead of waiting for end-of-week schedule reconciliation.

### Tech Engagement

Typical engagement requirements:

- Define production lines, machines, departments, processes, and shift calendars.
- Load style-level SAM or standard minute values.
- Configure efficiency profiles by line, product group, or style.
- Configure start-up and training curves.
- Map production update feeds from MES, shop-floor data capture, ERP, or manual imports.
- Define color alerts, delay thresholds, and exception categories.
- Configure supporting bottleneck process relationships.

### Capability Probes

- How granular can a production block be: PO, style, color, size, cut lot, shipment split, or line loading unit?
- Can one order be split across multiple lines or factories?
- Can the same line process several styles in sequence with changeover impacts?
- Are style family, skill, or machine constraints configurable?
- How are learning curves defined and maintained?
- How frequently can production actuals be imported?
- Can FastReactPlan consume real-time MES updates, or is it batch-oriented?
- How are rework, defects, partial completion, and lost time reflected in plan-versus-actual?

## 4. Supporting Process Scheduling

### Official Workflow Addressed

The official FastReactPlan page says schedules for supporting bottleneck processes, such as embroidery and screen printing, are automatically and dynamically driven by the sewing plan. The Classic Fashion Apparel page mentions sewing and supporting processes such as cutting, embroidery, printing, and washing.

### What It Does

Supporting process scheduling ensures that non-sewing constraints do not break the sewing plan. If embroidery, printing, washing, cutting, or finishing must happen before or after sewing, their dates and capacity needs must align with the main plan.

### Logic Used

Officially supported:

- Supporting bottleneck process schedules are dynamically driven by the sewing plan.
- Multiple planning pillars should consider capacity, critical path, and materials.

Interpretation:

- Support-process scheduling likely uses lead/lag offsets from sewing start or sewing completion.
- Some processes are pre-sewing, some post-sewing, and some can run parallel.
- Bottleneck processes require capacity calendars and minimum run constraints.
- When sewing moves, support-process priorities move too.

### Promise of Delivery

The promise is fewer line stoppages, fewer last-minute process conflicts, less firefighting, and smoother production flow.

### Capability Probes

- Can support processes be represented as independent workcenters with finite capacity?
- Can FastReactPlan model process sequences, overlaps, and dependencies?
- Can cutting and sewing be independently scheduled but linked?
- Does wash planning support color/wash recipe batching?
- Can embellishment planning be rescheduled automatically after sewing plan changes?
- Can material and critical-path alerts account for support-process readiness?

## 5. Master-to-Line Planning Synthesis

FastReactPlan's core planning loop is:

1. Master Planner checks total demand and capacity.
2. Demand is allocated or reallocated across factories.
3. Factory planners schedule main production on lines or machines.
4. Supporting bottleneck processes are recalculated from the main plan.
5. Actual production is imported.
6. Variances trigger color-coded alerts and replanning.

Interpretation: This is a planning-control loop, not a passive schedule board. Its quality depends on accurate standard minutes, realistic efficiency profiles, frequent actual updates, and disciplined use of the plan as the shared production truth.

