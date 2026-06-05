# FastReactPlan Capability Crosswalk

This matrix summarizes FastReactPlan capabilities using the same probing structure as the BlueKaktus research notes.

## 1. Core Planning Capabilities

| Capability | Workflow Addressed | Main Logic | Delivery Promise | System Use Meaning | Tech Engagement | Capability Probes |
|---|---|---|---|---|---|---|
| Master planning | Multi-factory demand and capacity planning, order allocation, order confirmation | Projected and confirmed demand, load versus capacity, what-if scenarios, reallocation across factories/subcontractors | Faster realistic order confirmation, better load balance, earlier risk visibility | Master planner uses a control-tower board as shared planning truth | Factory capacity, demand feeds, calendars, scenario rules, planner roles | Can it support draft/approved/frozen plans, subcontractor capacity, and scenario audit? |
| Order confirmation planning | Feasibility check before committing customer delivery | Capacity, material readiness, critical path timing, scenario comparison | More reliable commitments and fewer late changes | Sales/merchandising and planning confirm orders from shared feasibility view | Order feed, customer/date rules, forecast-to-confirmed process | Can it show risk to existing orders when a new order is accepted? |
| Factory line/machine planning | Detailed production scheduling on lines or machines | Drag/drop schedule, standard minutes, efficiency profiles, start-up/training curves | Faster detailed planning, better efficiency, quicker replanning | Factory planners maintain executable line schedule | Line/machine masters, SAM, efficiency, shifts, actuals feed | Can orders split by line, color, shipment, lot, and can learning curves vary? |
| Supporting process scheduling | Bottleneck process alignment with sewing plan | Embroidery, screen printing, cutting, washing, etc. dynamically driven by main plan | Fewer bottlenecks and smoother flow | Support departments work from production-driven priorities | Workcenter calendars, lead/lag rules, process dependencies | Are supporting processes finite-capacity and independently schedulable? |
| Advanced Planning and Scheduling | Automated planning of large order volumes | Multi-constraint planning scenarios, automatic placement | Faster planning for complex order books | Planner reviews generated scenarios rather than manually placing every order | Constraint setup, priorities, frozen windows, scenario comparison | Which constraints and optimization weights are configurable? |

## 2. Materials and Critical Path Capabilities

| Capability | Workflow Addressed | Main Logic | Delivery Promise | System Use Meaning | Tech Engagement | Capability Probes |
|---|---|---|---|---|---|---|
| Material supply and demand / MRP | Material requirement visibility tied to latest sewing plan | Lean pull calculation, inventory and open MPO imports, demand versus supply | More on-time starts, less raw material and WIP buffering | Material teams prioritize by plan need, not manual chasing | BOM/source mapping, inventory import, open MPO import, shortage rules | Does it generate procurement actions or only material visibility and priorities? |
| Lean pull planning | Dynamic upstream priorities from latest plan | Production start dates drive material and task dates | Reduced lead time, inventory, and firefighting | Plan changes automatically affect upstream priorities | Trigger rules, lead-time offsets, plan publication governance | Can recalculations be reviewed before being published to departments? |
| Pre-production critical path | Tasks needed to start production on time | Owner/date/task templates, dynamic target dates, late alerts, reason codes | More on-time starts and clearer accountability | Departments share task priorities tied to latest plan | Critical path templates, task owners, offsets, alerts, reason codes | Can tasks vary by buyer/product/factory and block or warn against line loading? |
| Alerts and management by exception | Focus users on late, short, overloaded, or risky items | Color coding, drill-down, search, reporting, exception status | Earlier proactive action, fewer surprises | Daily meetings focus on exceptions rather than all orders | Alert states, thresholds, owners, reports | Can alerts be assigned, acknowledged, escalated, and audited? |

## 3. Analytics, AI, and Connectivity

| Capability | Workflow Addressed | Main Logic | Delivery Promise | System Use Meaning | Tech Engagement | Capability Probes |
|---|---|---|---|---|---|---|
| Integrated reports | Operational planning reports and best-practice report packs | Standard reports plus bespoke report writer | Less manual reporting, more action | Reports come from live planning data | Report definitions, filters, export rules | Can customers build reports and track historical plan changes? |
| KPI dashboard for Power BI | Management analytics and KPI monitoring | FastReactPlan data transformed into Power BI dashboards | Senior visibility, continuous improvement | Management reviews actual and projected performance in BI | Power BI model, refresh, access control, KPI definitions | Are KPI formulas documented and role-filtered? |
| AI Analytics | Natural language and self-service intelligence | AI dashboard, connected data, Ask Coats Digital, intent recognition, customizable reports | Instant insights and advanced operational intelligence | Users query performance and risk without manual report building | Semantic layer, permissions, data source integration, validation | Is it reporting-only, or can it recommend and explain plan changes? |
| Business systems connectivity | Data exchange with ERP, PLM, shop-floor systems | Intermediary shared-file exchange, timed/triggered, integrity checks by receiving system | Quick implementation, robust integration, easier change | FastReactPlan becomes planning hub connected to systems of record | File schemas, schedules, validation, reconciliation | Are APIs supported, and how are failed imports corrected? |

## 4. Optional Process-Specific Capabilities

| Capability | Workflow Addressed | Main Logic | Delivery Promise | System Use Meaning | Tech Engagement | Capability Probes |
|---|---|---|---|---|---|---|
| Embellishment/laundry planning | Connected process planning beyond sewing | Automatic rescheduling, minimum production runs, lead times, constraints | Better bottleneck utilization and fewer plan conflicts | Wash/print/embroidery teams receive linked schedules | Process capacities, batch rules, lead times, dependencies | Can it model wash recipes, batch sizes, setup times, and rework? |
| Constraint / last and mould planning | Tooling-constrained production planning | Track and monitor machine/product-specific tooling such as moulds, lasts, forms | More realistic planning where tooling is the constraint | Tool availability becomes a schedule constraint | Tool masters, allocation, transfer, maintenance, availability | Can tooling block placement and be allocated by product/date/factory? |
| Host order substitution | Replacement of forecast with confirmed order | Forecast demand automatically replaced by confirmed orders | More accurate forward load | Forecast and committed demand share capacity logic | Forecast and confirmed order mapping | Is this standard product capability or implementation-specific configuration? |

## 5. Delivery and Engagement Capabilities

| Capability | Workflow Addressed | Main Logic | Delivery Promise | System Use Meaning | Tech Engagement | Capability Probes |
|---|---|---|---|---|---|---|
| Best-practice planning implementation | Process redesign around planning discipline | Industry-expert configuration and adoption | Rapid adoption and measurable benefits | Teams change planning routines, not only tools | Process discovery, configuration, training, governance | What implementation artifacts and process templates are delivered? |
| Steering and KPI governance | Continuous improvement after go-live | Critical success factors, KPI monitoring, reason codes, PDCA | Sustainable improvement | Management uses system data for improvement routines | KPI ownership, meeting cadence, dashboard governance | Are reason codes mandatory and linked to improvement actions? |
| Multi-factory rollout | Scaling planning across factories and boards | High-level and low-level boards, phased deployment | Growth support and shared planning truth | Corporate and factory planners use connected boards | Rollout plan, data harmonization, factory templates | How are local factory differences controlled without fragmenting standards? |

## 6. Overall Pattern

FastReactPlan repeatedly follows this operating pattern:

1. Create one visual planning truth.
2. Plan across multiple factories, lines, machines, and bottleneck processes.
3. Use standard minutes, efficiency profiles, and learning curves to make capacity realistic.
4. Drive material priorities and critical path due dates from the latest plan.
5. Import actual production and business-system signals.
6. Surface alerts, reports, dashboards, and AI-assisted insights.
7. Use exception management and KPI review to improve performance.

The implementation lesson for Eratex is direct: dynamic planning is not just a scheduling surface. It requires connected readiness signals, disciplined plan governance, reliable actual updates, and a management routine that acts on exceptions.

