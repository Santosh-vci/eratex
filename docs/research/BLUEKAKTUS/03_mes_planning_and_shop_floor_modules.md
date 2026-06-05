# MES, Planning, and Shop-Floor Modules

This document covers BlueKaktus shop-floor planning and execution modules: MES, Planning Board, Line Planning, Day Planning, and Quality.

Primary official sources:

- [MES](https://bluekaktus.com/manufacturing/mes/)
- [Planning Board](https://bluekaktus.com/manufacturing/planning-board/)
- [Line Planning](https://bluekaktus.com/manufacturing/lineplanning/)
- [Day Planning](https://bluekaktus.com/manufacturing/day-planning/)
- [Quality](https://bluekaktus.com/manufacturing/quality/)
- [Production Planning](https://bluekaktus.com/manufacturing/production-planning/)
- [Manufacturing overview](https://bluekaktus.com/manufacturing/)

## 1. MES

### Official Workflow Addressed

BlueKaktus describes MES as the shop-floor digitization layer from target planning to real-time monitoring. It is intended to help teams execute faster, track smarter, and improve production outcomes.

Official capabilities include:

- Target planning.
- Real-time production monitoring.
- Display board sync.
- Analytics and reporting.
- Enhanced UI.
- End-to-end shop-floor control.

### What It Does

The MES module defines and tracks daily production goals for each line. It gives live visibility into floor progress, syncs status to digital display boards, and provides analytics for KPIs, inefficiencies, and data-driven decisions.

### Logic Used

Officially stated logic:

- Daily line targets are defined and tracked.
- Process tracking provides live status.
- Display boards show production status.
- Dashboards measure KPIs and inefficiencies.

Interpretation:

- MES logic likely compares planned target quantity, actual output quantity, time elapsed, working hours, downtime, defects, and rework to calculate achievement and efficiency.
- Real-time monitoring depends on frequent data capture from supervisors, tablets, terminals, barcode scans, mobile inputs, IoT integrations, or manual production entries. The website does not disclose the exact capture mechanisms.
- Display board sync implies a shared status model between planning, MES capture, and visual factory communication.

### Promise of Delivery

BlueKaktus claims 25% faster target achievement, 20% productivity boost, full transparency, higher OTIF, lower wastage, faster execution, and total floor visibility.

### What It Means in System Use

MES users would set daily targets in the system, capture production status during the day, monitor performance through dashboards, and use alerts or visibility to correct deviations before the end of shift.

### Tech Engagement

Likely implementation work:

- Define factories, units, departments, lines, shifts, production stages, products, users, and supervisor responsibilities.
- Configure target planning and output capture.
- Connect MES to production planning, quality, WIP, and dashboards.
- Configure display boards and shop-floor views.
- Train floor users on timely, accurate capture.

## 2. Planning Board

### Official Workflow Addressed

BlueKaktus describes Planning Board as a production planning board for real-time line management. It is intended to define daily goals, detect bottlenecks, and monitor line performance in one visual planning dashboard.

Official capabilities include:

- Daily line-wise goal setting.
- Historical analytics.
- Dynamic alerts for delays.
- Visual workload balancing.
- Factory cost visibility.

### What It Does

Planning Board defines production targets by line and day, uses historical production trends to improve planning, flags bottlenecks based on T&A and material readiness, enables task reallocation across lines, and shows cost context while planning.

### Logic Used

Officially stated logic:

- Goals are assigned line-wise.
- Historical analytics improve planning accuracy.
- Delays are alerted using T&A data and material readiness.
- Tasks can be reallocated across lines in real time.
- Cost per unit can be monitored while planning.

Interpretation:

- This is a tactical planning surface. It likely uses production orders, delivery due dates, TNA status, material readiness, line availability, expected efficiency, and current output.
- Workload balancing likely calculates available minutes or capacity against required minutes, then highlights overloading, idle time, or bottleneck risk.
- Factory cost visibility suggests linking planned output, line efficiency, manpower, overhead, or cost per unit to planning decisions.

### Promise of Delivery

BlueKaktus claims 30% less idle time, 25% improvement in planning efficiency, stronger line visibility, bottleneck detection, and improved throughput.

### What It Means in System Use

Planners would use a visual board instead of spreadsheets and whiteboards. They can see line workload, daily goals, bottlenecks, readiness risk, and cost impact in one place.

### Tech Engagement

Likely implementation work:

- Configure line capacity, shifts, style routings, SAM, TNA dates, material readiness signals, and cost model references.
- Connect with production planning, procurement, merchandising, MES, and quality data.
- Build planner workflows for reallocation and exception handling.

## 3. Line Planning

### Official Workflow Addressed

BlueKaktus describes Line Planning as smart day planning for factory managers. It is focused on daily production scheduling, manpower utilization, and execution accuracy.

Official capabilities include:

- Visual platform to plan production lines.
- Drag-and-drop line planning by style, line availability, and shift capacity.
- Line and manpower optimization.
- Planned vs actual production comparison.
- Plant line-wise capacity planning.
- Calendar-wise planning and shift visibility.
- Integration with production and HR modules.

### What It Does

Line Planning assigns styles to lines and shifts, balances operators, helpers, and supervisors, monitors actual output versus planned target, allocates plant and line capacity, and aligns daily execution with TNA, shipment schedules, and resource availability.

### Logic Used

Officially stated logic:

- Drag-and-drop planning uses style, line availability, and shift capacity.
- Manpower assignment considers skill, line speed, and output goals.
- Planned vs actual comparison identifies bottlenecks, breakdowns, and manpower shortfalls.
- Capacity is viewed and allocated line-wise and plant-wise.
- Planning aligns with TNA, shipment schedules, and resource availability.

Interpretation:

- Line planning likely uses available standard minutes = line manpower x shift minutes x efficiency.
- Required minutes likely come from order quantity x SAM, with learning curves or efficiency assumptions.
- Skill mapping helps avoid assigning styles to lines or operators that cannot meet technical requirements.
- Actual production feedback allows live replanning and realignment.

### Promise of Delivery

BlueKaktus claims 30% reduction in line idle time, 100% visibility on daily output versus target, 25% boost in manpower efficiency, instant plan adjustments based on live data, and elimination of spreadsheets or whiteboards.

### What It Means in System Use

Factory managers and planners plan at line/day/shift level with capacity and manpower visibility. Execution variances become visible during the day, not after a weekly review.

### Tech Engagement

Likely implementation work:

- Load line masters, shift calendars, operator/helper/supervisor masters, skills, line speeds, style SAM, and target rules.
- Connect HR or attendance data if available.
- Integrate with MES to compare plan and actual.

## 4. Day Planning

### Official Workflow Addressed

BlueKaktus describes Day Planning as a visual, data-driven platform for daily schedules and plant-level optimization.

Official capabilities include:

- Visual line planning interface.
- Drag-and-drop UI across lines and shifts.
- Line and manpower optimization.
- Planned versus actual analysis.
- Plant and line-wise capacity planning.
- Calendar-based view.
- Over/under capacity alerts.

### What It Does

Day Planning appears to be an add-on or adjacent module to Line Planning and Planning Board. It focuses on day-level line allocation, workload balance, and capacity alerts.

### Logic Used

Officially stated logic:

- Daily production is mapped across lines and shifts.
- Resources are allocated for balanced workloads and minimal downtime.
- Deviations are tracked for future planning.
- Capacity can be set per unit or plant with alerts for over/under usage.
- Calendar view supports alignment across departments.

Interpretation:

- Day planning is the micro-scheduling layer. It converts broader production plans into daily line assignments and checks capacity usage.
- It likely uses required minutes, available minutes, line calendar, shift roster, manpower, TNA urgency, material readiness, and style constraints.

### Promise of Delivery

BlueKaktus promises smarter factory-floor planning, better efficiency, optimized capacity, and improved future planning cycles through planned-versus-actual analysis.

### What It Means in System Use

Planners and line managers would create or adjust the day plan inside the system and use capacity alerts to avoid unrealistic line loading.

### Tech Engagement

Likely implementation work overlaps with Line Planning:

- Define line and shift capacity.
- Configure department calendars.
- Define daily target rules.
- Integrate output capture and variance reporting.

## 5. Quality Module

### Official Workflow Addressed

BlueKaktus describes its manufacturer-side Quality module as AI-enabled quality management for zero-defect production. It monitors, inspects, and improves quality from incoming goods to final output.

Official capabilities include:

- End-to-end quality control.
- WIP and incoming goods tracking.
- Automated quality alerts.
- Quality insights and visibility.
- Integrated feedback to planning.

### What It Does

The module tracks defects and inspections in real time, logs approval or rejection for incoming and in-progress goods, triggers alerts for failures or recurring defects, analyzes defect trends, displays QA metrics, and feeds quality data back into production planning.

### Logic Used

Officially stated logic:

- Defects and inspections are tracked in real time.
- Incoming goods and WIP can be approved or rejected.
- Alerts trigger for inspection failures, variances, and recurring defects.
- Defect trends and QA metrics identify hotspots.
- Quality feedback loops into production planning.

Interpretation:

- Quality logic likely includes inspection checkpoints, defect codes, severity, AQL-style sampling, pass/fail decision rules, corrective action tracking, rework routing, and vendor/line/style defect analytics.
- The feedback to planning is significant: quality performance can affect line allocation, vendor allocation, production risk, and delivery confidence.

### Promise of Delivery

BlueKaktus promises earlier issue detection, faster fixes, better quality delivery, reduced delays, and improved accountability.

### What It Means in System Use

QC teams record inspection outcomes directly into the platform. Planners and production managers can see quality risk in operational views rather than discovering it after shipment or final audit.

### Tech Engagement

Likely implementation work:

- Configure inspection types, defect libraries, quality checkpoints, acceptance rules, roles, alerts, and dashboards.
- Integrate with procurement, WIP, production planning, MES, and vendor performance records.

## 6. Shop-Floor Planning Synthesis

The MES and planning modules form a control loop:

1. Production Planning defines route, SAM, cut/lot, and material assumptions.
2. Planning Board and Line/Day Planning translate order demand into line/day/shift targets.
3. MES captures live progress and compares actual output with target.
4. Quality captures defects, approvals, and production risk.
5. Planning views use production and quality feedback to adjust future allocation.

Interpretation: The strategic promise is not merely scheduling lines. It is continuous correction of the plan using live data from material readiness, output, manpower, capacity, and quality.

