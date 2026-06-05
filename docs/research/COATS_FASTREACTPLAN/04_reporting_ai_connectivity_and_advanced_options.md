# Reporting, AI Analytics, Connectivity, and Advanced Options

This document covers FastReactPlan reporting, KPI dashboard, AI Analytics, integrations, and optional advanced planning modules.

Primary official sources:

- [FastReactPlan](https://www.coatsdigital.com/en/manufacturer/fastreactplan/)
- [Manufacturer Overview](https://www.coatsdigital.com/en/manufacturer/)
- [FastReactPlan landing page](https://web.coatsdigital.com/frp-en)
- [WinPro Handbag FastReactPlan case study](https://www.coatsdigital.com/en/testimonial/winpro-handbag-fastreactplan/)
- [Classic Fashion Apparel selects FastReactPlan](https://www.coatsdigital.com/en/news/classic-fashion-apparel-fastreactplan/)

## 1. Integrated Report Writing

### Official Workflow Addressed

Coats Digital says FastReactPlan includes an integrated report writing tool with flexibility to add bespoke reports to the standard suite of best-practice reports delivered as part of the project.

### What It Does

The report writing capability turns planning data into operational reports for planners, department leads, and management.

It likely supports reports such as:

- Load versus capacity.
- Forward plan.
- Order status.
- Line loading.
- Plan versus actual.
- Material demand and shortage.
- Critical path exceptions.
- Late tasks and failure reasons.
- Delivery risk.
- Factory performance.

### Logic Used

Officially stated:

- Bespoke reports can be added.
- Standard best-practice reporting is delivered as part of the project.

Interpretation:

- Reporting depends on configured dimensions such as factory, line, buyer, style, product family, material, process, order, delivery date, and status.
- Best-practice reports probably reflect planning-control routines Coats Digital has learned across implementations.

### Promise of Delivery

Officially, reporting helps planners and management spend less time "working the numbers" and more time acting on insights.

### What It Means in System Use

Planning meetings should shift from manual spreadsheet preparation to exception review. Reports become a by-product of live plan data, not a separate activity.

### Tech Engagement

Typical engagement requirements:

- Define report audiences and decision routines.
- Map operational dimensions and filters.
- Configure standard report pack.
- Build bespoke reports where local processes differ.
- Agree report ownership and data refresh timing.

### Capability Probes

- Which standard reports are included in a normal implementation?
- Can reports be built by customer superusers or only by Coats Digital?
- Can reports be exported, scheduled, or embedded?
- Can reports show plan versions and historical changes?
- How is report performance handled for large multi-factory datasets?

## 2. KPI Dashboard for Power BI

### Official Workflow Addressed

Coats Digital describes an optional KPI Dashboard that transforms FastReactPlan data into predefined visual reports representing industry-standard KPIs for garment manufacturing and control. It is surfaced in Microsoft Power BI.

### What It Does

The dashboard provides senior management with up-to-date analytics of actual and projected performance. It is intended to support proactive action and continuous improvement.

Possible KPI domains:

- Capacity utilization.
- Load versus capacity.
- Plan adherence.
- OTDP risk.
- Production start performance.
- Production progress.
- Material readiness.
- Critical path status.
- Factory/line performance.
- Planning accuracy.

### Logic Used

Officially stated:

- FastReactPlan data is transformed into predefined visual reports.
- Reports represent industry-standard KPIs.
- Power BI provides interactive dashboards and drill-down.

Interpretation:

- KPI calculations require stable definitions. For example, "plan adherence" must specify whether it is measured by start date, finish date, quantity, standard minutes, or delivery milestone.
- Actual and projected performance require both live actuals and future planned loads.

### Promise of Delivery

Official promise:

- Less time working numbers.
- More data-driven management by exception.
- Senior management visibility of KPIs and continuous improvement focus.

Customer evidence:

- Classic Fashion Apparel planned KPI dashboard use for global, mobile access to latest KPI information with drill-down.
- WinPro uses KPI dashboard and data-driven insights for early proactive action.

### What It Means in System Use

Management no longer depends only on planner-prepared weekly packs. The dashboard becomes a common performance view, provided the underlying plan and actual data are current.

### Tech Engagement

Typical engagement requirements:

- Power BI tenant/workspace access.
- KPI definition workshops.
- Data refresh and access control setup.
- Dashboard role design for planners, factory managers, executives, and department heads.
- Reconciliation of KPI definitions with existing management reports.

### Capability Probes

- Which Power BI dataset model is provided?
- Can Eratex define custom KPIs and drill paths?
- Does dashboard data refresh in near real time, scheduled batches, or manual export?
- Can dashboard access be filtered by factory, role, buyer, or unit?
- Are KPI formulas documented and auditable?

## 3. FastReactPlan AI Analytics

### Official Workflow Addressed

Coats Digital says FastReactPlan has AI Analytics as an add-on capability for advanced operational intelligence.

Officially surfaced capabilities:

- Live visibility through real-time business insights.
- AI Dashboard to track KPIs, financials, and operations.
- Connected Data to turn insights into action.
- Ask Coats Digital, where users type queries and get instant insights and charts.
- Intent Recognition to turn fragmented data into trusted business insights.
- Flexible self-service reporting.
- Customizable dashboards.
- Automated reports.

### What It Does

AI Analytics appears to add a conversational and self-service intelligence layer on top of FastReactPlan and connected operational data.

Users may be able to ask questions such as:

- Which lines are overloaded next week?
- Which orders are at risk of missing shipment?
- Which materials are blocking planned production starts?
- Which factory has available capacity for a pull-in?
- Which buyer or product family has the highest planning variance?

Official pages do not disclose the exact AI model, data architecture, governance controls, or recommendation algorithm.

### Logic Used

Officially stated:

- Natural language queries generate insights and charts.
- Intent recognition turns fragmented data into insights.
- Dashboards and automated reports are customizable.
- Connected data helps turn insights into action.

Interpretation:

- The AI layer likely combines natural language query, semantic metric mapping, chart generation, and dashboard/report automation.
- It should be evaluated separately from the deterministic planning engine. Public pages do not prove that AI automatically optimizes production schedules.

### Promise of Delivery

Official promise:

- Real-time insights.
- Instant answers.
- Total control through flexible reporting.
- Advanced operational intelligence.

### What It Means in System Use

AI Analytics could reduce dependency on analysts or report builders for routine questions. However, the value depends on trusted data definitions, role-based access, and clear boundaries between suggested insight and approved planning action.

### Tech Engagement

Typical engagement requirements:

- Define semantic layer: KPI names, dimensions, business terms, synonyms.
- Connect FastReactPlan data and possibly ERP, finance, production, and material data.
- Establish user permissions and data visibility rules.
- Validate AI-generated charts and answers against authoritative reports.
- Define which AI outputs can trigger workflow action, if any.

### Capability Probes

- Is AI Analytics generative query/reporting only, or does it recommend schedule changes?
- What data sources can it connect to beyond FastReactPlan?
- How are user permissions enforced in natural language results?
- Are AI answers traceable to source data?
- Can customers configure business vocabulary and metric definitions?
- Does it support predictive risk scoring for delivery, material shortage, or capacity overload?

## 4. Business Systems Connectivity

### Official Workflow Addressed

Coats Digital says FastReactPlan uses a simple, robust, proven approach to data interfacing with in-house and commercial systems, including ERP, shop-floor data collection, and PLM. Data is exchanged through an intermediary shared file system on an automatic timed and/or triggered basis so the receiving system can perform data integrity checks.

### What It Does

Connectivity allows FastReactPlan to operate as the planning control layer while other systems remain systems of record for orders, materials, production actuals, or product data.

Likely integration flows:

- Orders from ERP to FastReactPlan.
- Forecast orders or planned orders to FastReactPlan.
- Style/product/SAM data from ERP, PLM, or GSDCost.
- Inventory and open material purchase orders from ERP to FastReactPlan.
- Production actuals from shop-floor data collection or MES to FastReactPlan.
- Planning outputs or priorities back to ERP, departments, reports, or dashboards.

### Logic Used

Officially stated:

- Data exchange uses an intermediary shared file system.
- Exchange can be automatic on timed and/or triggered basis.
- The receiving system performs data integrity checking.
- The approach is quick to implement and easy to change.

Interpretation:

- This is likely batch or event-triggered file-based integration, not necessarily real-time API integration.
- The approach can be pragmatic for apparel manufacturers with legacy ERPs, but it requires strong file schema governance and reconciliation routines.

### Promise of Delivery

Official promise:

- Proven and quick to implement.
- Supports data integrity checking.
- Easy and quick to change.

Customer evidence:

- Classic Fashion Apparel planned seamless interface with CTeBS Trendz.
- WinPro integrated FastReactPlan with Mac ERP and imported material availability.

### What It Means in System Use

FastReactPlan does not need to replace every operational system. It can consume and return planning-critical data through controlled interfaces.

### Tech Engagement

Typical engagement requirements:

- Interface inventory and ownership.
- File schema design and mapping.
- Shared folder or middleware setup.
- Timed and triggered exchange scheduling.
- Data validation and rejection handling.
- Reconciliation reports.
- Cutover and parallel-run process.

### Capability Probes

- Are APIs available, or is file exchange the primary supported integration pattern?
- What file formats are supported: CSV, XML, Excel, fixed-width, JSON?
- How are failed imports reported and corrected?
- Can integrations be event-triggered from ERP/MES?
- How are duplicate, changed, or cancelled orders handled?
- Can actual production be imported multiple times per day?
- Can FastReactPlan publish plan data back to downstream systems?

## 5. Advanced Planning and Scheduling (APS)

### Official Workflow Addressed

Coats Digital lists APS as an optional advanced module. It supports automatic planning of large volumes of orders in seconds while considering multiple constraints and planning scenarios.

### What It Does

APS appears to automate part of the planning placement process. Instead of manually placing many orders, planners can use optimization or rules to generate candidate plans quickly.

### Logic Used

Officially stated:

- Automatic planning of large volumes of orders.
- Multiple constraints.
- Multiple planning scenarios.

Interpretation:

- APS likely evaluates capacity, dates, line suitability, product groups, constraints, priorities, and sequence rules.
- It may produce a plan proposal rather than a final committed plan.
- Human planners still need to validate commercial, material, quality, and operational feasibility.

### Promise of Delivery

The promise is faster planning for large order volumes and better scenario comparison.

### Capability Probes

- Which constraints can APS optimize against?
- Can planners weight delivery, efficiency, changeover, buyer priority, margin, or material readiness?
- Can APS explain why it placed an order on a line or factory?
- Can planners compare APS scenarios before publishing?
- Does APS support frozen windows and protected orders?

## 6. Embellishment / Laundry Planning

### Official Workflow Addressed

Coats Digital lists embellishment/laundry planning as an optional module. It supports automatic rescheduling of multiple connected manufacturing processes, considering constraints such as minimum production runs and lead times.

### What It Does

This module addresses multi-process apparel flows where printing, embroidery, washing, laundry, or other embellishment processes create bottlenecks and batching constraints.

### Logic Used

Officially stated:

- Automatic rescheduling of connected manufacturing processes.
- Multiple constraints.
- Minimum production runs.
- Lead times.

Interpretation:

- The module likely supports finite-capacity planning for process workcenters linked to the sewing plan.
- Minimum run constraints are important for wash recipes, print screens, embroidery setups, and batch-oriented processes.
- If sewing changes, embellishment or laundry schedules can be recalculated.

### Promise of Delivery

The promise is fewer conflicts across connected processes, better bottleneck utilization, and lower disruption when the main plan changes.

### Capability Probes

- Can the module model wash recipes, color grouping, machine capacity, and batch size?
- Can it support pre-sewing and post-sewing embellishment flows?
- Can it model minimum run sizes and setup/changeover time?
- How does it handle rework, failed wash, or repeat process needs?
- Can process schedules be independent but linked to sewing?

## 7. Constraint / Last and Mould Planning

### Official Workflow Addressed

Coats Digital lists constraint, last, and mould planning as an optional module. It tracks and monitors machine/product-specific tooling such as moulds, lasts, and forms to support efficient planning around hard constraints.

### What It Does

This capability is relevant where product-specific tooling limits production feasibility, such as footwear lasts, moulds, forms, special fixtures, or machine attachments.

### Logic Used

Officially stated:

- Tracking and monitoring of machine/product-specific tooling.
- Planning around hard constraints.

Interpretation:

- This is finite tooling capacity planning. A line may be available, but production cannot start if the required tool is unavailable, already allocated, under maintenance, or physically at another site.

### Promise of Delivery

The promise is more realistic planning in environments where tooling, not only labor or machines, constrains capacity.

### Capability Probes

- Can tooling be allocated by date, factory, product, size, or operation?
- Can tooling availability block schedule placement?
- Can maintenance, repair, transfer, or cleaning time be modeled?
- Can one tool support multiple products or sizes with setup rules?

## 8. Synthesis

FastReactPlan's reporting, AI, connectivity, and advanced options extend the core planning spine in four directions:

1. Reporting makes the plan visible and measurable.
2. AI Analytics makes the data easier to query and personalize.
3. Connectivity keeps FastReactPlan linked to ERP, PLM, and production actuals.
4. Optional modules deepen planning for high-volume APS, connected embellishment/laundry processes, and hard tooling constraints.

Interpretation: The strongest architecture is likely hub-and-spoke. FastReactPlan is the planning hub, while ERP, PLM, MES/shop-floor capture, and reporting systems exchange planning-critical data around it.

