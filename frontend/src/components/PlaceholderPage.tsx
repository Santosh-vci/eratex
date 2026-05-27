import { RiskBadge, StatusBadge, StaleDataBadge } from "@/shared/badges";
import { FilterBar, MetricStrip, ModuleHeader } from "@/shared/layout";

type PlaceholderPageProps = {
  title: string;
  description: string;
};

type SurfaceBlueprint = {
  tabs: string[];
  metrics: Array<{ label: string; value: string; risk?: "ON_TRACK" | "WATCH" | "ACTION" | "CRITICAL" }>;
  columns: string[];
  rows: string[][];
  drawerTitle: string;
  drawerRows: Array<{ label: string; value: string; risk?: "ON_TRACK" | "WATCH" | "ACTION" | "CRITICAL" }>;
};

const defaultBlueprint: SurfaceBlueprint = {
  tabs: ["Open actions", "At risk", "Due today", "Audit"],
  metrics: [
    { label: "Open", value: "12", risk: "WATCH" },
    { label: "Action req", value: "03", risk: "ACTION" },
    { label: "Owners", value: "06" },
    { label: "Critical", value: "01", risk: "CRITICAL" },
  ],
  columns: ["Object", "Stage", "Owner", "Due", "Risk", "Next action"],
  rows: [
    ["ORD-HP-001", "PCD", "Planner", "Today", "ACTION", "Clear readiness blocker"],
    ["ORD-MAT-001", "Material", "Procurement", "Tomorrow", "WATCH", "Confirm vendor ETA"],
    ["ORD-FABQC-001", "Fabric QC", "QC Lead", "This week", "ON_TRACK", "Review inspection proof"],
  ],
  drawerTitle: "Selected action",
  drawerRows: [
    { label: "Owner", value: "Planner" },
    { label: "Risk", value: "ACTION", risk: "ACTION" },
    { label: "Audit", value: "Gate event required" },
  ],
};

const blueprints: Record<string, SurfaceBlueprint> = {
  "Eratex Operating Spine": {
    tabs: ["Orders", "Readiness", "Capacity", "Exceptions"],
    metrics: [
      { label: "Active orders", value: "05", risk: "ON_TRACK" },
      { label: "PCD blocked", value: "02", risk: "ACTION" },
      { label: "Fabric QC hold", value: "01", risk: "WATCH" },
      { label: "Release ready", value: "01", risk: "ON_TRACK" },
    ],
    columns: ["Surface", "Route", "Gate", "Owner", "Risk", "Next action"],
    rows: [
      ["Orders", "/orders", "Lifecycle", "Merchandising", "WATCH", "Open order thread"],
      ["PCD Readiness", "/pcd-readiness", "Cutting release", "Planning", "ACTION", "Resolve blocker"],
      ["Fabric QC", "/fabric/qc", "QC proof", "Fabric QC", "WATCH", "Review held rolls"],
      ["Procurement", "/procurement/vendor-follow-up", "Material ETA", "Procurement", "ACTION", "Update ETA"],
    ],
    drawerTitle: "Operating proof",
    drawerRows: [
      { label: "Gate pattern", value: "Readiness before release" },
      { label: "Navigation object", value: "Order-centric" },
      { label: "Risk language", value: "Exception first", risk: "WATCH" },
    ],
  },
  "Weekly Planning": {
    tabs: ["Backlog", "By workcenter", "By week", "Impact preview"],
    metrics: [
      { label: "Ready backlog", value: "18", risk: "ON_TRACK" },
      { label: "Overloaded", value: "02", risk: "ACTION" },
      { label: "Wash load", value: "132%", risk: "CRITICAL" },
      { label: "Plan freeze", value: "Pending", risk: "WATCH" },
    ],
    columns: ["Order", "Customer", "Style", "Week", "Workcenter", "Load", "Risk", "Next action"],
    rows: [
      ["ORD-HP-001", "Northstar", "STY-DEN-BASIC", "W23", "Sewing L5", "116%", "ACTION", "Rebalance line"],
      ["ORD-MAT-001", "Metro", "STY-CHINO-BASIC", "W23", "Wet Wash", "132%", "CRITICAL", "Add wash window"],
      ["ORD-PCD-001", "Northstar", "STY-DEN-HEAVY", "W24", "Cutting", "88%", "WATCH", "Confirm PCD"],
    ],
    drawerTitle: "Capacity impact",
    drawerRows: [
      { label: "Affected workcenter", value: "Wet Wash" },
      { label: "Shipment impact", value: "2 orders at risk", risk: "ACTION" },
      { label: "Recovery", value: "Overtime or resequence" },
    ],
  },
  "Daily Release": {
    tabs: ["Ready", "Blocked", "Released", "Exceptions"],
    metrics: [
      { label: "Ready today", value: "07", risk: "ON_TRACK" },
      { label: "Blocked", value: "03", risk: "ACTION" },
      { label: "Released", value: "04", risk: "ON_TRACK" },
      { label: "Exception release", value: "01", risk: "WATCH" },
    ],
    columns: ["Release", "Order", "Previous process", "Input", "Capacity", "Hold", "Risk", "Action"],
    rows: [
      ["Cutting", "ORD-PCD-001", "PCD ready", "Fabric clear", "Available", "None", "ON_TRACK", "Release"],
      ["Sewing", "ORD-MAT-001", "Cut pending", "Trims short", "Line L5", "Material", "ACTION", "Block"],
      ["Wash", "ORD-FABQC-001", "Sewing done", "QC hold", "Wet wash", "Fabric hold", "CRITICAL", "Create exception"],
    ],
    drawerTitle: "Release validation",
    drawerRows: [
      { label: "Input available", value: "Trims short", risk: "ACTION" },
      { label: "Next process capacity", value: "Line L5 116%", risk: "WATCH" },
      { label: "Audit event", value: "Required on release" },
    ],
  },
  "Workcenter Load": {
    tabs: ["Constraints", "Queues", "Affected orders", "Recovery"],
    metrics: [
      { label: "Current constraint", value: "Wet Wash", risk: "CRITICAL" },
      { label: "Highest overload", value: "132%", risk: "CRITICAL" },
      { label: "Oldest queue", value: "38h", risk: "ACTION" },
      { label: "Recovery open", value: "04", risk: "WATCH" },
    ],
    columns: ["Workcenter", "Capacity", "Load", "Actual", "Utilization", "Queue", "Risk", "Suggested action"],
    rows: [
      ["Wet Wash", "8,000", "10,400", "7,600", "130%", "5,600", "CRITICAL", "Add shift"],
      ["Sewing L5", "5,200", "6,030", "4,800", "116%", "2,100", "ACTION", "Reassign load"],
      ["Packing", "7,500", "6,850", "6,700", "91%", "900", "ON_TRACK", "Monitor"],
    ],
    drawerTitle: "Constraint detail",
    drawerRows: [
      { label: "Top affected order", value: "ORD-MAT-001" },
      { label: "Queue ageing", value: "38h", risk: "ACTION" },
      { label: "Recovery", value: "Simulate overtime" },
    ],
  },
  "Sewing Line Loading": {
    tabs: ["Active lines", "Bottlenecks", "Output", "Quality"],
    metrics: [
      { label: "Active lines", value: "08", risk: "ON_TRACK" },
      { label: "Overloaded", value: "02", risk: "ACTION" },
      { label: "Net good avg", value: "82%", risk: "WATCH" },
      { label: "Highest risk", value: "Line 5", risk: "CRITICAL" },
    ],
    columns: ["Line", "Order", "Style", "SMV", "Target", "Actual", "Defect", "Net good", "Risk"],
    rows: [
      ["Line 5", "ORD-HP-001", "STY-DEN-BASIC", "21.5", "620", "540", "4.2%", "517", "ACTION"],
      ["Line 3", "ORD-PCD-001", "STY-DEN-HEAVY", "26.8", "480", "468", "2.1%", "458", "ON_TRACK"],
      ["Line 7", "ORD-MAT-001", "STY-CHINO-BASIC", "18.4", "700", "640", "3.8%", "616", "WATCH"],
    ],
    drawerTitle: "Line detail",
    drawerRows: [
      { label: "Bottleneck operation", value: "Waistband attach" },
      { label: "Machine issue", value: "DNLS shortage", risk: "WATCH" },
      { label: "Recovery", value: "Operator reallocation" },
    ],
  },
  "Wash Planning": {
    tabs: ["Queue", "Dry process", "Wet wash", "Rewash"],
    metrics: [
      { label: "Wash queue", value: "14", risk: "WATCH" },
      { label: "Rewash", value: "03", risk: "ACTION" },
      { label: "Machine load", value: "128%", risk: "CRITICAL" },
      { label: "Released finishing", value: "09", risk: "ON_TRACK" },
    ],
    columns: ["Batch", "Order", "Style", "Shade lot", "Route", "Step", "Machine", "Risk"],
    rows: [
      ["WB-001", "ORD-FABQC-001", "STY-DEN-BASIC", "SL-02", "Enzyme", "Wet wash", "WASH-03", "ACTION"],
      ["WB-002", "ORD-PCD-001", "STY-DEN-HEAVY", "SL-04", "Stone", "Drying", "DRY-01", "WATCH"],
      ["WB-003", "ORD-HP-001", "STY-DEN-FASHION", "SL-01", "Fashion", "Post QC", "QC-02", "ON_TRACK"],
    ],
    drawerTitle: "Wash batch",
    drawerRows: [
      { label: "Current step", value: "Wet wash" },
      { label: "Rewash flag", value: "Capacity consuming", risk: "ACTION" },
      { label: "Next gate", value: "Release to finishing" },
    ],
  },
  "WIP Pipeline": {
    tabs: ["Ageing", "Before constraint", "Held", "Escalated"],
    metrics: [
      { label: "Ageing WIP", value: "9,800", risk: "ACTION" },
      { label: "Oldest WIP", value: "52h", risk: "CRITICAL" },
      { label: "Before wash", value: "4,200", risk: "WATCH" },
      { label: "Shipment linked", value: "06", risk: "ACTION" },
    ],
    columns: ["Stage", "Order", "Style", "Qty waiting", "Ageing", "Hold reason", "Owner", "Risk"],
    rows: [
      ["Sewn waiting wash", "ORD-MAT-001", "STY-CHINO-BASIC", "1,800", "52h", "Wash load", "Wash Manager", "CRITICAL"],
      ["Fabric cleared not cut", "ORD-PCD-001", "STY-DEN-HEAVY", "900", "18h", "PCD gate", "Planner", "WATCH"],
      ["Packed awaiting inspection", "ORD-HP-001", "STY-DEN-BASIC", "1,200", "10h", "AQL slot", "Shipment", "ON_TRACK"],
    ],
    drawerTitle: "WIP ageing",
    drawerRows: [
      { label: "Next process", value: "Wet Wash" },
      { label: "Shipment date", value: "2026-06-30", risk: "WATCH" },
      { label: "Action", value: "Escalate queue" },
    ],
  },
  "Exceptions Control Tower": {
    tabs: ["Critical", "By owner", "By due date", "Shipment impact"],
    metrics: [
      { label: "Open", value: "21", risk: "WATCH" },
      { label: "Critical", value: "03", risk: "CRITICAL" },
      { label: "Due today", value: "08", risk: "ACTION" },
      { label: "Overdue", value: "02", risk: "CRITICAL" },
    ],
    columns: ["Exception", "Type", "Severity", "Order", "Owner", "Due", "Ageing", "Suggested action"],
    rows: [
      ["EXC-9001", "Wash capacity", "CRITICAL", "ORD-MAT-001", "Wash Manager", "Today", "18h", "Add shift"],
      ["EXC-9002", "Material", "ACTION", "ORD-PCD-001", "Procurement", "Tomorrow", "9h", "Confirm ETA"],
      ["EXC-9003", "Fabric QC", "WATCH", "ORD-FABQC-001", "QC Lead", "This week", "4h", "Review waiver"],
    ],
    drawerTitle: "Exception ownership",
    drawerRows: [
      { label: "Owner", value: "Wash Manager" },
      { label: "Due date", value: "Today", risk: "ACTION" },
      { label: "Closure rule", value: "Comment and audit" },
    ],
  },
  "Shipment Readiness": {
    tabs: ["This week", "At risk", "Inspection", "Documentation"],
    metrics: [
      { label: "Due this week", value: "11", risk: "WATCH" },
      { label: "Shipment ready", value: "05", risk: "ON_TRACK" },
      { label: "At risk", value: "04", risk: "ACTION" },
      { label: "Docs pending", value: "03", risk: "WATCH" },
    ],
    columns: ["Order", "Customer", "Ship date", "Finished", "Packed", "Short", "AQL", "Docs", "Risk"],
    rows: [
      ["ORD-HP-001", "Northstar", "2026-06-30", "11,800", "10,200", "200", "PENDING", "PENDING", "ACTION"],
      ["ORD-PCD-001", "Metro", "2026-07-02", "4,800", "4,800", "0", "PASSED", "READY", "ON_TRACK"],
      ["ORD-FABQC-001", "Northstar", "2026-07-04", "6,200", "5,900", "300", "PENDING", "READY", "WATCH"],
    ],
    drawerTitle: "Shipment checklist",
    drawerRows: [
      { label: "Final QC", value: "Passed", risk: "ON_TRACK" },
      { label: "AQL", value: "Pending", risk: "WATCH" },
      { label: "Documentation", value: "Invoice pending", risk: "ACTION" },
    ],
  },
  "Mobile Home": {
    tabs: ["Today", "Output", "Defects", "Handover"],
    metrics: [
      { label: "Assigned work", value: "06", risk: "ON_TRACK" },
      { label: "Open issues", value: "02", risk: "ACTION" },
      { label: "Handover due", value: "01", risk: "WATCH" },
      { label: "Offline sync", value: "Later", risk: "WATCH" },
    ],
    columns: ["Task", "Order", "Line", "Target", "Actual", "Issue", "Owner", "Risk"],
    rows: [
      ["Output update", "ORD-HP-001", "Line 5", "620", "540", "Machine wait", "Supervisor", "ACTION"],
      ["Defect update", "ORD-PCD-001", "Line 3", "480", "468", "Low", "QC", "ON_TRACK"],
      ["Handover", "ORD-FABQC-001", "Wash", "Batch", "Done", "AQL pending", "Wash Lead", "WATCH"],
    ],
    drawerTitle: "Shopfloor action",
    drawerRows: [
      { label: "Capture", value: "Output / defect / issue" },
      { label: "Sync", value: "Online session only", risk: "WATCH" },
      { label: "Audit", value: "Supervisor confirmation" },
    ],
  },
};

function riskFrom(value: string): "ON_TRACK" | "WATCH" | "ACTION" | "CRITICAL" {
  if (["ON_TRACK", "READY", "PASSED"].includes(value)) return "ON_TRACK";
  if (["WATCH", "PENDING"].includes(value)) return "WATCH";
  if (["CRITICAL"].includes(value)) return "CRITICAL";
  return "ACTION";
}

export function PlaceholderPage({
  title,
  description,
}: PlaceholderPageProps) {
  const blueprint = blueprints[title] ?? defaultBlueprint;

  return (
    <section>
      <ModuleHeader
        title={title}
        description={description}
        actions={<StaleDataBadge minutes={2} />}
      />
      <MetricStrip
        metrics={blueprint.metrics.map((metric) => ({
          label: metric.label,
          value: metric.value,
          meta: metric.risk ? <RiskBadge risk={metric.risk} /> : null,
        }))}
      />
      <FilterBar>
        {blueprint.tabs.map((tab) => (
          <button key={tab} type="button" className="ops-button">
            {tab}
          </button>
        ))}
      </FilterBar>
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="ops-grid-wrap">
          <table className="ops-grid">
            <thead>
              <tr>
                {blueprint.columns.map((column) => (
                  <th key={column}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {blueprint.rows.map((row) => (
                <tr key={row.join("-")}>
                  {row.map((cell, index) => (
                    <td key={`${cell}-${index}`}>
                      {["ON_TRACK", "WATCH", "ACTION", "CRITICAL"].includes(cell) ? (
                        <RiskBadge risk={riskFrom(cell)} />
                      ) : ["READY", "PASSED", "PENDING"].includes(cell) ? (
                        <StatusBadge status={cell} />
                      ) : (
                        cell
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <aside className="ops-panel">
          <div className="border-b border-grid-border px-3 py-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.05em] text-slate-500">
              Right Action Drawer
            </p>
            <h3 className="text-sm font-semibold text-slate-950">{blueprint.drawerTitle}</h3>
          </div>
          <div className="divide-y divide-grid-border">
            {blueprint.drawerRows.map((row) => (
              <div key={row.label} className="grid min-h-10 grid-cols-[120px_1fr] items-center gap-2 px-3 py-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.05em] text-slate-500">
                  {row.label}
                </span>
                <span className="text-[13px] font-medium text-slate-800">
                  {row.risk ? <RiskBadge risk={row.risk} /> : row.value}
                </span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}
