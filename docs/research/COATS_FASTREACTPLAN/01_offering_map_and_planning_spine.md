# FastReactPlan Offering Map and Planning Spine

## 1. Positioning

Official: Coats Digital describes FastReactPlan as a production planning and control software solution for garment manufacturers. It supports faster and more reliable order confirmation and a production plan optimized for delivery, speed, and efficiency.

Official: The product is designed specifically for apparel and footwear manufacturers of different sizes. Coats Digital also positions it within a wider manufacturer solution suite covering design/development, method-time-cost optimization, production planning, fabric optimization, and sustainability.

Interpretation: FastReactPlan should be understood as a specialist planning control layer rather than a full ERP. It needs demand, orders, product, capacity, material, and actual production signals from adjacent systems or configured master data. Its value comes from making the production plan dynamically reflect capacity, material readiness, and pre-production readiness.

## 2. Core Planning Claim

Official: FastReactPlan dynamically manages the three key planning constraints of:

- Capacity.
- Materials.
- Pre-production critical path.

Official: Coats Digital says the system uses a highly visual and flexible drag-and-drop approach. It supports master planning across multiple factories and detailed scheduling of manufacturing lines or machines.

Official: Critical pre-production activities and material requirements are dynamically driven by the latest plan on a lean just-in-time basis.

Interpretation: The system treats the sewing or main manufacturing plan as the primary schedule driver. Material requirement dates and pre-production task due dates are then recalculated against the latest production start and delivery assumptions.

## 3. Product Philosophy

FastReactPlan repeats three themes on the official page:

- Optimise: fast, detailed, accurate planning and order confirmation, producing smoother production flow.
- Connect: material and pre-production priorities driven by the latest plan on lean JIT principles.
- Accelerate: improved visibility, coordination, and control to remove buffers of time and cost.

Interpretation: The logic is not only to make a schedule. It is to compress planning uncertainty by replacing offline planning buffers with earlier visibility of actual constraints.

## 4. Workflow Spine

The public capability map implies the following operating spine:

1. Demand enters the planning environment as projected and/or confirmed orders.
2. Master planning evaluates demand against factory capacity at a higher level.
3. Planners allocate or reallocate demand across factories or subcontractors.
4. Detailed line or machine planning schedules the main production process, typically sewing.
5. Supporting bottleneck processes, such as embroidery or screen printing, are driven by the main sewing plan.
6. Material supply and demand planning recalculates material priorities using the latest plan.
7. Pre-production critical path dates are recalculated using the latest plan.
8. Production updates are imported and compared against plan.
9. Alerts, color coding, reports, and dashboards support management by exception.
10. Management reviews performance through KPI dashboards and continuous improvement loops.

## 5. Functional Boundary

FastReactPlan appears to cover:

- Order confirmation planning.
- Demand and capacity planning.
- Master planning across factories.
- Factory line and machine-level scheduling.
- Plan-versus-actual production monitoring.
- Material requirement visibility and prioritization.
- Pre-production task visibility and dynamic date management.
- Alerts and management by exception.
- Reporting and KPI dashboards.
- Business-system connectivity.
- Optional advanced planning modules.

FastReactPlan does not appear, from public pages alone, to be positioned as the main system for:

- Full order entry or ERP financial accounting.
- Full procurement execution.
- Full warehouse inventory transaction control.
- Full shop-floor MES capture.
- Full PLM tech-pack authoring.
- Payroll or HR attendance.

Interpretation: Those functions may be integrated from existing business systems. Coats Digital explicitly mentions interfaces with ERP, shop-floor data collection, and PLM.

## 6. Delivery Promise

Official typical benefit claims include:

- 3% to 10% productivity increase.
- 10% to 30% improvement in OTDP.
- 10% to 30% reduction in lead time.
- Typical return on investment of less than 12 months.

Official customer proof points include:

- Tunicotex: OTDP improved from 75% to 85%, planning time reduced by 25%, and overall production capacity increased by 40%.
- VT Garment: 95% productivity improvement, 92% improvement in capacity plan accuracy, 50% OTDP increase, 57% reduction in planning time, and planning variation recording reduced from 4 hours to 10 minutes.
- WinPro Handbag: planning time improved by 40% and factory efficiency improved by 4.4%.
- Song Hong: planning time reduced by 20% and reporting time reduced by 40%.
- Classic Fashion Apparel: selected FastReactPlan to replace manual planning and interface with its apparel ERP.

Interpretation: These are official customer claims, but they should be evaluated as implementation-context dependent. Baseline maturity, data quality, factory discipline, planner adoption, and integration completeness will strongly affect realized benefit.

## 7. What Using FastReactPlan Means Operationally

Using FastReactPlan means the production plan becomes a shared operational system rather than a planner-owned spreadsheet.

For planning teams:

- Orders are loaded, compared, searched, color-coded, and reallocated visually.
- Multiple factories and lines can be viewed against load and capacity.
- What-if scenarios can be tested before committing a plan.
- Production updates trigger replanning and exception focus.

For materials and procurement teams:

- Material priorities are driven by the latest production plan.
- Inventory and open material purchase orders are imported from the main system.
- Material demand versus supply becomes visible against production start needs.

For pre-production teams:

- Tasks are date-driven by the latest plan.
- Late events and failure reasons are visible.
- Departments share the same production-priority context.

For management:

- KPI dashboards and reports expose actual and projected performance.
- The system supports management by exception and continuous improvement.

## 8. Capability Probes for Eratex Evaluation

These are the major questions to verify before using FastReactPlan as a comparator or potential reference model:

- What is the exact master data required for styles, orders, lines, shifts, capacities, standard minutes, efficiencies, materials, and tasks?
- Does the system maintain committed versus draft or scenario plans, and how are approvals governed?
- How does the system handle changing order quantities, shipment pull-ins, postponements, and partial shipments?
- Can planning zones, freeze windows, or schedule-governance rules be configured?
- How deeply can material readiness be represented beyond imported inventory and open MPOs?
- Can critical path rules vary by buyer, product type, fabric type, season, factory, or risk class?
- What is the workflow for plan publication, planner override, and audit history?
- How does the system model multi-process apparel flow beyond sewing, especially cutting, wash, embroidery, printing, finishing, and packing?
- What is available through APIs versus intermediary shared file exchange?
- How much of AI Analytics is query/reporting assistance versus predictive planning recommendation?

## 9. Key Takeaway

FastReactPlan is built around a strong production planning control thesis: a plan is only useful when capacity, material readiness, and pre-production readiness move together. Its public capability set is narrower than a full apparel ERP, but deeper in multi-factory planning, line scheduling, material-priority pull logic, critical path management, and management-by-exception reporting.

