# Delivery Engagement and Operating Change

This document describes the likely implementation engagement and operating change implied by FastReactPlan's public material and official case studies.

Primary official sources:

- [FastReactPlan](https://www.coatsdigital.com/en/manufacturer/fastreactplan/)
- [Manufacturer Overview](https://www.coatsdigital.com/en/manufacturer/)
- [Classic Fashion Apparel selects FastReactPlan](https://www.coatsdigital.com/en/news/classic-fashion-apparel-fastreactplan/)
- [WinPro Handbag FastReactPlan case study](https://www.coatsdigital.com/en/testimonial/winpro-handbag-fastreactplan/)
- [Tunicotex FastReactPlan results](https://www.coatsdigital.com/en/news/tunicotex-boosts-otdp-to-with-fastreactplan/)
- [VT Garment FastReactPlan results](https://www.coatsdigital.com/en/news/vt-garment-fastreactplan/)

## 1. Implementation Positioning

Official: Coats Digital says FastReactPlan is developed and delivered by industry experts to address fashion manufacturing challenges. It emphasizes a highly visual, easy-to-use interface, rapid user adoption, and accelerated business benefits.

Official: Customer stories refer to best-practice planning processes, industry expertise, project teams, integration with ERP, KPI monitoring, and partnership-led transformation.

Interpretation: FastReactPlan implementation is not just software installation. It is a planning-process redesign and adoption program.

## 2. Typical Engagement Workstreams

### Process Discovery

Likely activities:

- Document current planning process.
- Identify spreadsheets, manual trackers, and duplicate reports.
- Map order confirmation process.
- Map master planning and line planning responsibilities.
- Identify support-process bottlenecks.
- Map material planning and critical path ownership.
- Identify existing KPIs and management meeting routines.

Official support: Classic Fashion Apparel's story describes manual, disconnected planning processes as a business risk and says FastReactPlan was selected along with best-practice planning expertise.

### Data Preparation

Likely activities:

- Clean factory, line, machine, workcenter, and calendar data.
- Validate style, order, quantity, delivery, and customer data.
- Load SAM or standard minutes.
- Define efficiency profiles and start-up curves.
- Map materials, inventory, and open MPO data.
- Define critical path templates and reason codes.

Interpretation: FastReactPlan's plan quality depends heavily on data quality. The system can expose planning problems, but inaccurate SAM, capacity, inventory, or actual production data will produce false confidence.

### Configuration

Likely activities:

- Configure high-level planning boards.
- Configure low-level line or machine boards.
- Configure product families and planning dimensions.
- Configure material pull logic and MRP views.
- Configure critical path tasks, offsets, owners, and alerts.
- Configure reports, dashboards, and color coding.
- Configure optional modules if in scope.

Official support: Tunicotex implemented a high-level board, four low-level boards, and embellishment planning. Classic Fashion Apparel's initial configuration focused on high-level planning across factories, detailed sewing line planning for key factories, supporting operations, critical path, MRP, and KPI dashboard.

### Integration

Likely activities:

- Define inbound data from ERP, PLM, shop-floor data collection, or MES.
- Define outbound planning data if required.
- Build shared-file interfaces or other supported integrations.
- Schedule timed or triggered data exchange.
- Validate import/export results.
- Reconcile plan, actual, material, and order data during parallel run.

Official: Coats Digital states data exchange can happen through an intermediary shared file system on an automatic timed and/or triggered basis. It says this allows data integrity checking by the receiving system.

### Adoption and Governance

Likely activities:

- Train master planners, factory planners, material teams, pre-production teams, managers, and executives.
- Define plan ownership.
- Define daily and weekly planning meeting routines.
- Define who can change master plan, line plan, material dates, and critical path dates.
- Define how exceptions are reviewed and closed.
- Define continuous improvement metrics and reason code discipline.

Official support: WinPro describes a project steering committee, Critical Success Factors, KPI monitoring, and a focus on changing planner mindset and adopting best-practice processes.

## 3. Data Engagement Model

FastReactPlan needs a clear operating data model.

### Core Planning Data

Required or likely required:

- Factories and units.
- Lines, machines, and bottleneck workcenters.
- Working calendars, shifts, holidays, and overtime assumptions.
- Product type, style, buyer, order, color, size, delivery, and quantity.
- SAM or standard minutes.
- Efficiency profiles.
- Start-up/training curves.
- Forecast and confirmed order distinction.
- Subcontractor capacity, if used.

### Material and Pre-Production Data

Required or likely required:

- BOM or material requirement source.
- Material categories.
- Inventory balances.
- Open material purchase orders.
- Material expected dates.
- Material readiness states.
- Critical path task templates.
- Task owners and due-date offsets.
- Failure reason codes.

### Actual and Performance Data

Required or likely required:

- Production actuals.
- Production progress by order/line/date.
- Plan changes.
- Late event status.
- Material shortage status.
- Task completion status.
- KPI inputs.

## 4. Operating Change Required

FastReactPlan creates value only if planning behavior changes.

### From Spreadsheet Ownership to Shared Planning Truth

Current-state issue often described in customer stories:

- Manual planning.
- Disconnected spreadsheets.
- Inconsistent forecasts.
- Fragmented communication.
- Weak visibility.

Expected new-state:

- Shared planning board.
- One version of planning truth.
- Common demand/capacity view.
- Visible material and critical path status.
- Management by exception.

### From Static Schedules to Dynamic Control

Current-state issue:

- Plans become outdated when orders, production progress, material status, or approvals change.

Expected new-state:

- Material and critical path priorities update from the latest plan.
- Production actuals are imported.
- Planners replan based on variance.
- Alerts focus attention on risk.

### From Firefighting to Continuous Improvement

Official support: FastReactPlan captures failure reason codes for critical path events. Tunicotex references structured Plan-Do-Check-Act methodology supported by WIP, MRP, and FRP reporting.

Expected new-state:

- Late causes are categorized.
- KPI dashboards show patterns.
- Managers improve process constraints rather than only expediting individual orders.

## 5. Delivery Risks and Dependencies

### Data Quality Risk

If standard minutes, efficiency profiles, capacity calendars, or order dates are wrong, the plan will be wrong.

### Actual Update Latency

If production actuals are imported late, plan-versus-actual replanning loses value.

### Material System Dependency

FastReactPlan's MRP view depends on inventory and open MPO data from the main business system. If that system is inaccurate or delayed, material readiness visibility will be unreliable.

### Adoption Risk

If departments continue to run separate spreadsheets after implementation, the shared planning truth weakens.

### Governance Risk

If any planner can move dates without approval or audit, dynamic planning can create instability. Public pages do not disclose the full governance model, so this must be probed.

## 6. Eratex Fit Analysis

FastReactPlan maps strongly to several Eratex planning concerns:

- Multi-level planning.
- Capacity visibility.
- Line scheduling.
- Material readiness tied to the plan.
- Pre-production critical path readiness.
- Management by exception.
- Plan-versus-actual feedback.
- Scenario planning and order reallocation.

FastReactPlan appears less directly aligned, from public pages alone, to Eratex rules that require:

- Explicit schedule freeze governance.
- Formal boundary-case approval events.
- Daily release control not creating execution records.
- Controlled external plan validation as draft.
- Execution lot movement and sewing output capture rules.
- Immutable approved technical versions.

Interpretation: FastReactPlan is a strong comparator for planning logic and operating discipline, but Eratex's governed workflow boundaries and execution-domain rules would need separate design rather than direct imitation.

## 7. Vendor Evaluation Probes

Use these probes in any deeper product evaluation:

- What are the exact modules included in a base FastReactPlan implementation?
- What is optional and separately licensed: APS, KPI dashboard, AI Analytics, embellishment/laundry planning, tooling constraint planning?
- What is the deployment model: cloud, hosted, on-premises, hybrid?
- What authentication, role, audit, and approval capabilities exist?
- Can FastReactPlan expose APIs, or is shared-file exchange the standard integration route?
- How are plan versions, scenarios, approvals, and frozen periods handled?
- Can material and critical path recalculations be reviewed before publication?
- How does the system handle order changes, shipment pull-ins, cancellations, and split deliveries?
- Can the system represent cutting, sewing, wash, finishing, packing, and subcontracting as governed linked processes?
- What is the actual implementation timeline for a multi-factory apparel manufacturer?
- What data cleansing work is expected before go-live?
- What post-go-live support model is used?

## 8. Key Takeaway

FastReactPlan implementation should be understood as a disciplined planning operating model with software support. The technical engagement is important, but the largest business change is behavioral: all departments must accept that capacity, material, and critical path priorities are driven by a shared and continuously updated production plan.

