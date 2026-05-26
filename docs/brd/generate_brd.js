const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, VerticalAlign, PageNumber, PageBreak, LevelFormat,
  TabStopType, TabStopPosition
} = require('docx');
const fs = require('fs');
const path = require('path');

// ─── Color palette ────────────────────────────────────────────────────────────
const BRAND_BLUE   = "1B3A6B";
const ACCENT_BLUE  = "2E75B6";
const LIGHT_BLUE   = "D5E8F0";
const HEADER_BG    = "1B3A6B";
const ALT_ROW      = "EEF4F9";
const WHITE        = "FFFFFF";
const DARK_TEXT    = "1A1A1A";
const MED_GRAY     = "555555";
const RULE_COLOR   = "2E75B6";

// ─── Border helpers ────────────────────────────────────────────────────────────
const border = (color = "CCCCCC") => ({ style: BorderStyle.SINGLE, size: 1, color });
const cellBorder = (color = "CCCCCC") => ({ top: border(color), bottom: border(color), left: border(color), right: border(color) });
const noBorder   = () => ({ top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" } });

// ─── Spacing ───────────────────────────────────────────────────────────────────
const sp = (before=0, after=0) => ({ before, after });

// ─── Text helpers ──────────────────────────────────────────────────────────────
const run = (text, opts={}) => new TextRun({ text, font: "Arial", color: DARK_TEXT, ...opts });
const boldRun = (text, opts={}) => run(text, { bold: true, ...opts });

// ─── Paragraph helpers ────────────────────────────────────────────────────────
const para = (text, opts={}) => new Paragraph({ children: [run(text)], spacing: sp(60, 60), ...opts });

const rulePara = () => new Paragraph({
  keepNext: true,
  border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: RULE_COLOR, space: 1 } },
  spacing: sp(0, 120)
});

const sectionHeading = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_1,
  keepNext: true,
  keepLines: true,
  children: [new TextRun({ text, font: "Arial", color: WHITE, bold: true, size: 32 })],
  shading: { fill: HEADER_BG, type: ShadingType.CLEAR },
  spacing: sp(240, 120),
  indent: { left: 120, right: 120 }
});

const subHeading = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  keepNext: true,
  keepLines: true,
  children: [new TextRun({ text, font: "Arial", color: ACCENT_BLUE, bold: true, size: 26 })],
  spacing: sp(200, 80),
  border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: LIGHT_BLUE, space: 1 } }
});

const h3 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_3,
  keepNext: true,
  keepLines: true,
  children: [new TextRun({ text, font: "Arial", color: BRAND_BLUE, bold: true, size: 24 })],
  spacing: sp(160, 60)
});

const bodyPara = (text) => new Paragraph({
  children: [run(text, { size: 22 })],
  spacing: sp(60, 80),
});

const bullet = (text) => new Paragraph({
  numbering: { reference: "bullets", level: 0 },
  children: [run(text, { size: 22 })],
  spacing: sp(40, 40)
});

const codeBlock = (lines) => {
  const paras = [];
  for (const line of lines) {
    paras.push(new Paragraph({
      children: [new TextRun({ text: line, font: "Courier New", size: 18, color: "2C2C2C" })],
      shading: { fill: "F4F7FB", type: ShadingType.CLEAR },
      spacing: sp(40, 40),
      indent: { left: 360, right: 360 }
    }));
  }
  return paras;
};

// ─── Table helpers ────────────────────────────────────────────────────────────
function hdrCell(text, width) {
  return new TableCell({
    borders: cellBorder("FFFFFF"),
    width: { size: width, type: WidthType.DXA },
    shading: { fill: HEADER_BG, type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({ children: [boldRun(text, { color: WHITE, size: 20 })], spacing: sp(0,0) })]
  });
}
function dataCell(text, width, shade=false, bold=false) {
  const fill = shade ? ALT_ROW : WHITE;
  return new TableCell({
    borders: cellBorder("D0DCE8"),
    width: { size: width, type: WidthType.DXA },
    shading: { fill, type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({ children: [bold ? boldRun(text, { size: 20, color: DARK_TEXT }) : run(text, { size: 20 })], spacing: sp(0,0) })]
  });
}

function simpleTable(headers, rows, widths) {
  const tableWidth = widths.reduce((a,b)=>a+b, 0);
  return new Table({
    width: { size: tableWidth, type: WidthType.DXA },
    columnWidths: widths,
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map((h, i) => hdrCell(h, widths[i]))
      }),
      ...rows.map((row, ri) =>
        new TableRow({
          children: row.map((cell, ci) => dataCell(cell, widths[ci], ri % 2 === 1))
        })
      )
    ]
  });
}

// ─── Page break ───────────────────────────────────────────────────────────────
const pageBreak = () => new Paragraph({ children: [new TextRun({ break: 1 })], spacing: sp(0,0) });
const partHeading = (text) => new Paragraph({
  keepNext: true,
  keepLines: true,
  children: [new TextRun({ text, font: "Arial", size: 36, bold: true, color: BRAND_BLUE })],
  alignment: AlignmentType.CENTER,
  spacing: sp(480, 480),
});

// ─── Cover page ───────────────────────────────────────────────────────────────
function coverPage() {
  return [
    new Paragraph({ spacing: sp(1800, 0) }),
    new Paragraph({
      children: [new TextRun({ text: "BUSINESS REQUIREMENTS DOCUMENT", font: "Arial", size: 48, bold: true, color: WHITE })],
      alignment: AlignmentType.CENTER,
      shading: { fill: HEADER_BG, type: ShadingType.CLEAR },
      spacing: sp(240, 60),
      indent: { left: 0, right: 0 }
    }),
    new Paragraph({
      children: [new TextRun({ text: "End-to-End Planning & Scheduling Tool", font: "Arial", size: 36, bold: false, color: WHITE })],
      alignment: AlignmentType.CENTER,
      shading: { fill: HEADER_BG, type: ShadingType.CLEAR },
      spacing: sp(0, 60),
    }),
    new Paragraph({
      children: [new TextRun({ text: "Denim Bottoms and Chinos Manufacturing", font: "Arial", size: 28, color: "A8C8E8" })],
      alignment: AlignmentType.CENTER,
      shading: { fill: HEADER_BG, type: ShadingType.CLEAR },
      spacing: sp(0, 240),
    }),
    new Paragraph({ spacing: sp(480, 0) }),
    // Meta table
    new Table({
      width: { size: 6000, type: WidthType.DXA },
      columnWidths: [2200, 3800],
      alignment: AlignmentType.CENTER,
      rows: [
        ["Company", "Eratex"],
        ["Document Type", "Business Requirements Document"],
        ["Product Scope", "Planning & Scheduling Tool for Garment Manufacturing"],
        ["Manufacturing Scope", "Denim Bottoms + Chinos"],
        ["Version", "1.0"],
        ["Date", "2026-05-26"],
        ["Status", "Draft for Review"],
      ].map(([label, value]) => new TableRow({
        children: [
          new TableCell({
            borders: cellBorder("3B5E9A"),
            width: { size: 2200, type: WidthType.DXA },
            shading: { fill: "243F6B", type: ShadingType.CLEAR },
            margins: { top: 100, bottom: 100, left: 140, right: 140 },
            children: [new Paragraph({ children: [boldRun(label, { color: "C8D8EE", size: 20 })], spacing: sp(0,0) })]
          }),
          new TableCell({
            borders: cellBorder("3B5E9A"),
            width: { size: 3800, type: WidthType.DXA },
            shading: { fill: "1E3359", type: ShadingType.CLEAR },
            margins: { top: 100, bottom: 100, left: 140, right: 140 },
            children: [new Paragraph({ children: [run(value, { color: WHITE, size: 20 })], spacing: sp(0,0) })]
          })
        ]
      }))
    }),
    pageBreak()
  ];
}

// ─── Document definition ─────────────────────────────────────────────────────
const doc = new Document({
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } }
        }]
      },
      {
        reference: "numbers",
        levels: [{
          level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } }
        }]
      }
    ]
  },
  styles: {
    default: {
      document: { run: { font: "Arial", size: 22, color: DARK_TEXT } }
    },
    paragraphStyles: [
      {
        id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: "Arial", color: WHITE },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 0 }
      },
      {
        id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: "Arial", color: ACCENT_BLUE },
        paragraph: { spacing: { before: 200, after: 80 }, outlineLevel: 1 }
      },
      {
        id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, font: "Arial", color: BRAND_BLUE },
        paragraph: { spacing: { before: 160, after: 60 }, outlineLevel: 2 }
      }
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1080, right: 1260, bottom: 1080, left: 1260 }
      }
    },
    headers: {
      default: new Header({
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: "ERATEX  |  Planning & Scheduling Tool BRD  |  Version 1.0", font: "Arial", size: 16, color: "888888" }),
            ],
            alignment: AlignmentType.RIGHT,
            border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: ACCENT_BLUE, space: 1 } },
            spacing: sp(0, 80)
          })
        ]
      })
    },
    footers: {
      default: new Footer({
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: "Confidential — Eratex Internal Use Only          Page ", font: "Arial", size: 16, color: "888888" }),
              new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 16, color: "888888" }),
              new TextRun({ text: " of ", font: "Arial", size: 16, color: "888888" }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], font: "Arial", size: 16, color: "888888" }),
            ],
            border: { top: { style: BorderStyle.SINGLE, size: 4, color: ACCENT_BLUE, space: 1 } },
            spacing: sp(80, 0)
          })
        ]
      })
    },
    children: [
      // ── COVER PAGE ────────────────────────────────────────────────────────
      ...coverPage(),

      // ── 1. EXECUTIVE SUMMARY ─────────────────────────────────────────────
      sectionHeading("1. Executive Summary"),
      bodyPara("Eratex operates a large-scale garment manufacturing environment focused on denim bottoms and chinos. The production flow is complex because it depends on customer approvals, sampling iterations, nominated vendor procurement, fabric quality clearance, planned cut date readiness, sewing line loading, wash complexity, finishing, quality inspection, packing, and shipment commitments."),
      bodyPara("Although a garment planning tool such as FastReact may already be present in the operating environment, planning activity still appears to remain heavily dependent on manual Excel files, indicating that the formal planning system has not fully become the daily operating backbone of the factory."),
      subHeading("Current Business Condition"),
      ...codeBlock([
        "The factory is meeting customer shipment commitments, but not through a stable",
        "and fully trusted planning system. It is maintaining OTIF through manual coordination,",
        "Excel-based firefighting, overtime, expediting, and extra operating expense."
      ]),
      bodyPara("The proposed product is an end-to-end planning and scheduling tool designed to enforce operational discipline across order lifecycle visibility, PCD readiness, weekly planning, daily production release, workcenter load monitoring, sewing line loading, wash planning, WIP ageing, exception management, and shipment readiness."),
      bodyPara("The MVP should focus on ten critical operating surfaces that solve the most immediate business problem: converting a complex garment order book into a realistic, executable, constraint-aware, and shipment-protecting production plan."),
      pageBreak(),

      // ── 2. BUSINESS CONTEXT ──────────────────────────────────────────────
      sectionHeading("2. Business Context"),
      subHeading("2.1 Nature of Eratex Operations"),
      bodyPara("Eratex's manufacturing operation involves large-scale production of denim bottoms and chinos. The production flow is comprehensive:"),
      ...codeBlock([
        "Customer enquiry  →  Sampling  →  Buyer approval  →  Order confirmation",
        "→  Fabric and trim procurement  →  Fabric inward  →  Fabric QC",
        "→  PCD readiness  →  Cutting  →  Sewing  →  Wet/dry washing",
        "→  Repeat wash or rework if required  →  Finishing  →  Final QC",
        "→  Packing  →  Shipment"
      ]),
      subHeading("2.2 Operational Sensitivities for Denim and Chinos"),
      bullet("Fabric is often sourced from nominated vendors with lead times of 20–30 days."),
      bullet("Fabric QC, shade-lot segregation, shrinkage, skewing, and stretch recovery are critical before cutting."),
      bullet("Washing is a major production stage — not a minor finishing step."),
      bullet("Wash processes may include dry process, wet wash, enzyme wash, stone wash, bleach, ozone, tinting, softener, and repeat wash cycles."),
      bullet("Manual effects such as whiskering, scraping, grinding, destroy, and touch-up depend heavily on operator skill."),
      bullet("Quality failures and rewash loops consume real capacity and affect shipment reliability."),
      bullet("OTIF can be protected only if the planning system detects risks early and triggers recovery actions in time."),
      pageBreak(),

      // ── 3. PROBLEM STATEMENT ─────────────────────────────────────────────
      sectionHeading("3. Problem Statement"),
      bodyPara("A large denim and chinos manufacturer using FastReact but still relying on Excel is likely operating with a partially digitized planning process where the formal schedule exists in software but real decisions are still made manually."),
      bodyPara("Eratex is achieving high OTIF, reportedly above 95%, but this performance is being protected through additional operating expense. At the same time, resource utilization is around 70%, which indicates that capacity is not being converted efficiently into stable, predictable, net-good output."),
      ...codeBlock([
        "FastReact or a similar planning tool may be present,",
        "but Excel remains the real execution layer for planning decisions."
      ]),
      subHeading("3.1 Operational Gaps Identified"),
      bullet("Planning is formally digital but operationally manual."),
      bullet("OTIF is maintained through firefighting and cost absorption."),
      bullet("Utilization is low because flow is unstable."),
      bullet("Workcenter constraints shift without timely visibility."),
      bullet("Sewing output may be planned without sufficient wash capacity alignment."),
      bullet("Wash rework and repeat cycles may not be fully capacity-planned."),
      bullet("PCD readiness may not be enforced as a hard production gate."),
      bullet("WIP ageing may remain hidden between departments."),
      bullet("Daily production release may be driven by urgency rather than readiness."),
      bullet("Shipment readiness may be assessed too late."),
      bodyPara("At Eratex scale, small planning gaps multiply across many buyers, styles, production lines, wash routes, quality gates, and shipment commitments. The real problem is not simply the absence of software — the planning system has not become the daily operating discipline of the factory."),
      pageBreak(),

      // ── 4. BUSINESS NEED ─────────────────────────────────────────────────
      sectionHeading("4. Business Need"),
      bodyPara("Eratex requires an integrated planning and scheduling tool that can become the single operating layer for production control. The product must help Eratex answer, every day:"),
      ...codeBlock([
        "Which orders are ready?       Which orders are blocked?",
        "Where is the bottleneck?      What is overloaded?",
        "What can be released today?   What is ageing in WIP?",
        "Which shipment is at risk?    What recovery action is required?",
        "Who owns the next action?"
      ]),
      subHeading("4.1 Required Transformation"),
      simpleTable(
        ["From", "To"],
        [
          ["Manual Excel planning", "System-led planning"],
          ["Department-wise tracking", "End-to-end order visibility"],
          ["Gross capacity planning", "Net-good capacity planning"],
          ["Weekly static planning", "Daily executable release"],
          ["Late-stage firefighting", "Early exception detection"],
          ["OTIF through extra cost", "OTIF through stable flow control"],
        ],
        [4320, 4320]
      ),
      pageBreak(),

      // ── 5. BUSINESS OBJECTIVES ───────────────────────────────────────────
      sectionHeading("5. Business Objectives"),
      subHeading("5.1 Primary Objectives"),
      ...[
        "Establish one integrated planning view from order confirmation to shipment.",
        "Enforce PCD readiness before cutting starts.",
        "Convert weekly production plans into daily executable releases.",
        "Monitor total workcenter load and identify shifting constraints.",
        "Improve sewing line loading using realistic capacity assumptions.",
        "Treat washing as a core production constraint for denim and chinos.",
        "Make WIP ageing visible across departments.",
        "Track exceptions with owner, severity, due date, and recovery action.",
        "Distinguish production completion from true shipment readiness.",
        "Reduce reliance on Excel-based planning and manual firefighting.",
      ].map((t, i) => new Paragraph({
        numbering: { reference: "numbers", level: 0 },
        children: [run(t, { size: 22 })],
        spacing: sp(40, 40)
      })),
      new Paragraph({ spacing: sp(120, 0) }),
      subHeading("5.2 Performance Objectives"),
      simpleTable(
        ["Metric", "Current Concern", "Desired Direction"],
        [
          ["Resource Utilization", "Around 70%", "Improve through better readiness, loading, and flow discipline"],
          ["OTIF", "Above 95% but cost-heavy", "Maintain or improve while reducing extra operating expense"],
          ["Overtime Dependency", "High due to recovery pressure", "Reduce through earlier risk detection"],
          ["Planning Accuracy", "Weak due to Excel dependency", "Improve through single system of truth"],
          ["WIP Ageing", "Hidden or manually tracked", "Make visible and actionable"],
          ["Wash Bottleneck Visibility", "Often late", "Make constraint visible before shipment risk escalates"],
          ["Rework Impact", "May be invisible in capacity", "Consume capacity explicitly in plan"],
          ["Shipment Readiness", "Often checked late", "Track continuously before dispatch"],
        ],
        [2600, 2600, 3440]
      ),
      pageBreak(),

      // ── 6. PRODUCT SCOPE ─────────────────────────────────────────────────
      sectionHeading("6. Product Scope"),
      bodyPara("The product scope is divided into two components:"),
      bullet("MVP Scope: Ten critical surfaces required to stabilize planning discipline."),
      bullet("Mature-State Scope: Additional surfaces required for full-scale deployment and long-term operational maturity."),
      pageBreak(),

      // ── PART A: MVP SURFACES ─────────────────────────────────────────────
      partHeading("PART A: MVP SCOPE — TEN CRITICAL SURFACES"),
      rulePara(),

      // Surface 1
      sectionHeading("7. MVP Surface 1: Order Lifecycle Surface"),
      subHeading("7.1 Purpose"),
      bodyPara("To provide one digital thread for every customer order from confirmation to shipment."),
      subHeading("7.2 Business Problem Solved"),
      bodyPara("Orders are currently tracked across disconnected files and departments. There is no single reliable view of where an order stands, what is pending, who owns the next action, and whether the shipment date is safe."),
      subHeading("7.3 Key Capabilities"),
      bullet("Order master view: customer, buyer, style, PO, quantity, delivery date"),
      bullet("Current stage of order with planned vs actual dates by stage"),
      bullet("Pending dependencies and delay reasons"),
      bullet("Owner by stage and risk status"),
      bullet("Next required action"),
      bullet("Linkage to materials, PCD, production, wash, QC, and shipment"),
      subHeading("7.4 Key Data Elements"),
      simpleTable(
        ["Data Element", "Description"],
        [
          ["Order ID", "Unique order reference"],
          ["Customer / Buyer", "Customer or brand"],
          ["Style Code", "Garment style"],
          ["Product Type", "Denim bottom, chino, cargo, jogger, etc."],
          ["Quantity", "Ordered quantity"],
          ["Delivery Date", "Committed shipment date"],
          ["Current Stage", "Current lifecycle status"],
          ["Risk Status", "Green, Yellow, Red, Black"],
          ["Owner", "Responsible user or department"],
          ["Next Action", "Action required to move order forward"],
        ],
        [3120, 5520]
      ),
      subHeading("7.5 Success Criteria"),
      bullet("Every order has one system-level lifecycle status."),
      bullet("Users no longer need separate Excel files to know order progress."),
      bullet("Delayed orders have visible reasons and owners."),
      pageBreak(),

      // Surface 2
      sectionHeading("8. MVP Surface 2: PCD Readiness Surface"),
      subHeading("8.1 Purpose"),
      bodyPara("To enforce production readiness before cutting starts."),
      subHeading("8.2 Business Problem Solved"),
      bodyPara("Orders may be pushed into cutting before all required conditions are ready, causing downstream rework, holds, shade problems, measurement issues, trim shortages, and shipment risk."),
      subHeading("8.3 PCD Validation Checklist"),
      ...codeBlock([
        "PO confirmed            BOM frozen              Fabric received",
        "Fabric QC passed        Shade lots mapped       Shrinkage report available",
        "Trims available         Pattern approved        Marker ready",
        "PP sample approved      Wash standard approved  Line allocated",
        "Wash capacity booked    QC file ready"
      ]),
      subHeading("8.4 Readiness Status"),
      simpleTable(
        ["Status", "Meaning"],
        [
          ["Ready", "Can be released to cutting"],
          ["Conditionally Ready", "Minor open item exists with approved risk"],
          ["Blocked", "Cannot be released"],
          ["Escalated", "Management action required"],
        ],
        [2400, 6240]
      ),
      subHeading("8.5 Success Criteria"),
      bullet("No order is cut without readiness visibility."),
      bullet("Blocked orders are visible before PCD."),
      bullet("Conditional releases are approved and auditable."),
      pageBreak(),

      // Surface 3
      sectionHeading("9. MVP Surface 3: Weekly Planning Workbench"),
      subHeading("9.1 Purpose"),
      bodyPara("To convert the order book into an executable weekly cross-functional plan."),
      subHeading("9.2 Business Problem Solved"),
      bodyPara("Weekly plans often fail because material readiness, cutting, sewing, wash, finishing, QC, and shipment are not planned as one integrated flow."),
      subHeading("9.3 Key Capabilities"),
      bullet("2–4 week firm plan view with 8–12 week rolling visibility"),
      bullet("Order sequencing and cutting plan"),
      bullet("Sewing line allocation and wash plan"),
      bullet("Finishing, inspection, and shipment plan"),
      bullet("Load vs capacity view with material readiness filter"),
      bullet("Shipment-risk priority indicator"),
      bullet("Plan freeze capability and plan-change impact visibility"),
      subHeading("9.4 Success Criteria"),
      bullet("Weekly plan becomes the coordination contract across departments."),
      bullet("Plan is capacity-checked before being frozen."),
      bullet("Orders with material or PCD risks are not silently included in execution plan."),
      pageBreak(),

      // Surface 4
      sectionHeading("10. MVP Surface 4: Daily Production Release Surface"),
      subHeading("10.1 Purpose"),
      bodyPara("To release only what is actually ready and executable today."),
      subHeading("10.2 Business Problem Solved"),
      bodyPara("Daily production may be released based on urgency rather than actual readiness, resulting in line stoppages, partial production, WIP imbalance, and manual firefighting."),
      subHeading("10.3 Daily Release Validation Gates"),
      ...codeBlock([
        "Material availability        Previous process completion",
        "Machine availability         Manpower availability",
        "Quality clearance            Workcenter capacity",
        "Next-process readiness"
      ]),
      subHeading("10.4 Release Actions Supported"),
      bullet("Release to cutting, sewing, wash, or finishing"),
      bullet("Release block with reason and exception approval"),
      bullet("Daily release history and audit trail"),
      subHeading("10.5 Success Criteria"),
      bullet("Daily release becomes gate-based."),
      bullet("Unready orders are blocked or escalated."),
      bullet("Production teams receive executable work, not theoretical plan items."),
      pageBreak(),

      // Surface 5
      sectionHeading("11. MVP Surface 5: Workcenter Load Monitor"),
      subHeading("11.1 Purpose"),
      bodyPara("To show load, capacity, queue, WIP ageing, utilization, and current constraint across workcenters."),
      subHeading("11.2 Business Problem Solved"),
      bodyPara("The active bottleneck can shift from sewing to washing, dry process, finishing, QC, or shipment — but this is often discovered late."),
      subHeading("11.3 Workcenters in MVP Scope"),
      simpleTable(
        ["Workcenter"],
        [
          ["Fabric QC"], ["Cutting"], ["Sewing Lines"],
          ["Dry Process"], ["Wet Wash"], ["Drying"],
          ["Finishing"], ["Packing"], ["Final QC"], ["Shipment Documentation"]
        ],
        [8640]
      ),
      subHeading("11.4 Key Metrics"),
      simpleTable(
        ["Metric", "Description"],
        [
          ["Available Capacity", "Capacity by day or week"],
          ["Planned Load", "Work already scheduled"],
          ["Queue", "Work waiting before workcenter"],
          ["WIP Ageing", "Time waiting before next process"],
          ["Utilization", "Load as percentage of available capacity"],
          ["Throughput", "Actual output"],
          ["Constraint Flag", "Whether workcenter is bottleneck"],
          ["Recovery Need", "Whether action is required"],
        ],
        [3120, 5520]
      ),
      subHeading("11.5 Success Criteria"),
      bullet("Bottleneck shifts are visible early."),
      bullet("Planners can see total load, not just urgent orders."),
      bullet("Recovery action is triggered before shipment risk becomes critical."),
      pageBreak(),

      // Surface 6
      sectionHeading("12. MVP Surface 6: Sewing Line Loading Surface"),
      subHeading("12.1 Purpose"),
      bodyPara("To support realistic sewing line allocation and production target setting."),
      subHeading("12.2 Business Problem Solved"),
      bodyPara("Sewing lines are often loaded using nominal capacity, while real output depends on style SMV, operator skill, absenteeism, learning curve, quality loss, line balance, and machine availability."),
      subHeading("12.3 Key Capabilities"),
      bullet("Assign orders to lines and calculate daily target from SMV and manpower"),
      bullet("Track line capacity by day and loading by style and order"),
      bullet("Capture actual output and compare planned vs actual"),
      bullet("Calculate gross output and net-good output with quality loss tracking"),
      bullet("Identify overloaded or underloaded lines"),
      bullet("Suggest alternate line or split-line loading"),
      subHeading("12.4 Required Inputs"),
      ...codeBlock([
        "Style SMV          Operation bulletin     Line manpower",
        "Machine availability    Operator skill level   Target efficiency",
        "Learning curve     Absenteeism            Quality performance"
      ]),
      subHeading("12.5 Success Criteria"),
      bullet("Sewing plan reflects realistic net-good capacity."),
      bullet("Underperformance is visible by line and order."),
      bullet("Line loading decisions improve resource utilization."),
      pageBreak(),

      // Surface 7
      sectionHeading("13. MVP Surface 7: Wash Planning Surface"),
      subHeading("13.1 Purpose"),
      bodyPara("To plan washing as a core production constraint, not as an afterthought."),
      subHeading("13.2 Business Problem Solved"),
      bodyPara("In denim manufacturing, wash processes and rewash loops can become the real bottleneck. If washing is planned only after sewing, WIP builds up and shipment risk increases."),
      subHeading("13.3 Key Capabilities"),
      bullet("Define wash route by style and plan dry and wet process"),
      bullet("Plan washer/dryer capacity and create wash batches"),
      bullet("Maintain shade-lot identity throughout the wash process"),
      bullet("Track batch queue and wash completion"),
      bullet("Track rewash or touch-up requirements"),
      bullet("Reserve capacity for repeat wash and link wash status to finishing release"),
      subHeading("13.4 Wash Routes Covered"),
      ...codeBlock([
        "Dry process         Wet wash            Enzyme wash",
        "Stone wash          Bleach / Ozone      Tinting",
        "Softener            Hydro extraction    Drying",
        "Post-wash shade check    Rewash / touch-up loop"
      ]),
      subHeading("13.5 Success Criteria"),
      bullet("Sewn garments do not pile up invisibly before wash."),
      bullet("Wash bottleneck is visible before shipment risk escalates."),
      bullet("Rewash consumes planned capacity."),
      pageBreak(),

      // Surface 8
      sectionHeading("14. MVP Surface 8: WIP and Queue Monitoring Surface"),
      subHeading("14.1 Purpose"),
      bodyPara("To monitor work waiting between processes and surface hidden delays."),
      subHeading("14.2 Business Problem Solved"),
      bodyPara("Hidden WIP causes hidden delay. Departments may report output, but orders may remain stuck between processes."),
      subHeading("14.3 WIP Points Tracked"),
      ...codeBlock([
        "Fabric waiting for QC              Fabric cleared but not cut",
        "Cut panels waiting for sewing      Sewn garments waiting for wash",
        "Washed garments waiting finishing  Finished garments waiting packing",
        "Packed cartons waiting inspection"
      ]),
      subHeading("14.4 Key Capabilities"),
      simpleTable(
        ["Capability", "Description"],
        [
          ["WIP Quantity", "Quantity by stage"],
          ["Ageing by Stage", "Time at current stage"],
          ["Hold Reason", "Why the WIP is held"],
          ["Next Process", "Where it should flow"],
          ["Owner", "Responsible person"],
          ["Shipment Risk", "Risk level for linked order"],
          ["Ageing Threshold", "Escalation trigger point"],
        ],
        [3120, 5520]
      ),
      subHeading("14.5 Success Criteria"),
      bullet("Hidden queues become visible."),
      bullet("Ageing WIP is escalated before it becomes a shipment risk."),
      bullet("Planners can prioritize flow, not only output."),
      pageBreak(),

      // Surface 9
      sectionHeading("15. MVP Surface 9: Exception and Alert Surface"),
      subHeading("15.1 Purpose"),
      bodyPara("To drive exception-based planning and structured recovery action."),
      subHeading("15.2 Business Problem Solved"),
      bodyPara("Operational issues are often known informally but not structured into a system with severity, owner, due date, and recovery action."),
      subHeading("15.3 Exception Types and Examples"),
      ...codeBlock([
        "Fabric delayed beyond PCD         Fabric QC failed",
        "PP sample approval pending        Line overloaded next week",
        "Wash queue exceeds capacity       Sewn WIP ageing above limit",
        "Post-wash rejection high          Final inspection not scheduled",
        "Shipment risk turned red          Recovery action overdue"
      ]),
      subHeading("15.4 Exception Data Structure"),
      simpleTable(
        ["Field", "Description"],
        [
          ["Exception Type", "Material, capacity, quality, approval, WIP, shipment"],
          ["Affected Order", "Order impacted by the exception"],
          ["Severity", "Green, Yellow, Red, Black or equivalent"],
          ["Owner", "Responsible person"],
          ["Due Date", "Resolution target"],
          ["Suggested Action", "Recommended recovery"],
          ["Status", "Open, In Progress, Closed"],
          ["Escalation Level", "Normal, Urgent, Management"],
        ],
        [3120, 5520]
      ),
      subHeading("15.5 Success Criteria"),
      bullet("Exceptions are not buried in WhatsApp or Excel."),
      bullet("Every critical issue has an owner and due date."),
      bullet("Management sees only actionable risks."),
      pageBreak(),

      // Surface 10
      sectionHeading("16. MVP Surface 10: Shipment Readiness Surface"),
      subHeading("16.1 Purpose"),
      bodyPara("To protect final shipment commitments and provide continuous dispatch-readiness visibility."),
      subHeading("16.2 Business Problem Solved"),
      bodyPara("Production completion does not automatically mean shipment readiness. Orders may be delayed by final QC, buyer inspection, packing, labels, documents, or forwarder booking."),
      subHeading("16.3 Shipment Readiness Checklist"),
      ...codeBlock([
        "Final QC passed        AQL passed            Packing complete",
        "Cartons closed         Barcode/label correct  Packing list ready",
        "Invoice ready          Forwarder booked       Shipment date confirmed"
      ]),
      subHeading("16.4 Key Tracking Capabilities"),
      bullet("Shipment date, finished quantity, packed quantity, and short quantity"),
      bullet("Final QC, AQL / buyer inspection, and carton readiness status"),
      bullet("Barcode / label readiness and documentation status"),
      bullet("Shipment booking and split shipment decisions"),
      subHeading("16.5 Success Criteria"),
      bullet("Shipment risk is visible before dispatch date."),
      bullet("Production completion and dispatch readiness are clearly separated."),
      bullet("OTIF is protected with fewer last-minute interventions."),
      pageBreak(),

      // ── PART B: MATURE-STATE SCOPE ───────────────────────────────────────
      partHeading("PART B: MATURE-STATE SCOPE — ADDITIONAL SURFACES"),
      rulePara(),
      bodyPara("The MVP stabilizes planning discipline. A mature deployment extends the product into the following additional surfaces:"),
      new Paragraph({ spacing: sp(120, 0) }),
      simpleTable(
        ["#", "Surface", "Purpose"],
        [
          ["17", "Executive Control Tower", "Management-level exception dashboard with risk heatmap, OTIF cost, overtime exposure, and customer-wise delay view"],
          ["18", "Enquiry and Costing", "Pre-order feasibility evaluation including capacity simulation, wash complexity assessment, and delivery promise validation"],
          ["19", "Sampling and Approval Tracker", "Proto, fit, wash, size set, and PP sample workflow with buyer comments, resubmission tracking, and approval ageing"],
          ["20", "Style Master and Technical File", "Style-level technical master including tech pack, BOM, SMV, operation bulletin, machine/skill requirements, and wash route"],
          ["21", "BOM and Material Planning", "Material requirement calculation with shortage alerts, fabric width and shrinkage impact, and procurement linkage"],
          ["22", "Procurement and Vendor Follow-up", "Vendor PO tracking, ETA monitoring, delay alerts, material criticality ranking, and vendor performance scorecard"],
          ["23", "Fabric Inward and Fabric QC", "Roll-wise receipt and 4-point inspection including shade lot, GSM, shrinkage, skewing, and stretch/recovery testing"],
          ["24", "Operator Skill and Capacity", "Operator skill matrix with efficiency, quality rating, absenteeism tracking, learning curve, and training needs"],
          ["25", "Cutting Room", "Shade-wise cutting management including marker approval, spreading, cut panel QC, bundle numbering, and sewing issue"],
          ["26", "Wash Recipe and Batch Execution", "Shopfloor wash batch control with recipe steps, machine assignment, shade/hand-feel results, and rewash management"],
          ["27", "Quality Management", "Full QC coverage from fabric through final inspection with defect categorization, root cause, and quality-adjusted capacity"],
          ["28", "Rework and Recovery", "Structured rework order management with type, quantity, capacity reservation, shipment impact, and closure tracking"],
          ["29", "Calendar / Gantt Planning", "Visual order, department, line, wash, shipment, approval, and procurement timelines"],
          ["30", "Recovery Planning / What-If Simulation", "Scenario testing for fabric delays, line splits, wash rework, overtime, and shift extensions with cost and capacity impact"],
          ["31", "Plan Change and Approval", "Governance workflow for frozen/firm zone plan changes with reason codes, impact analysis, and audit trail"],
          ["32", "Department Handover", "Formal interdepartmental handover surface with completeness checks across all production stages"],
          ["33", "Master Data Governance", "Completeness and version control for styles, BOM, SMV, workcenters, shift calendars, and wash recipe masters"],
          ["34", "Performance Analytics", "OTIF, utilization, plan adherence, line efficiency, net-good output, rework rate, and cost of recovery trends"],
          ["35", "Mobile / Shopfloor Update", "Low-friction capture for output, defects, shortages, machine issues, absenteeism, and handover confirmations"],
          ["36", "Role-Based Home Surfaces", "Role-specific operating dashboards for all user functions from merchandiser to management"],
        ],
        [480, 2880, 5280]
      ),
      pageBreak(),

      // ── PART C: FUNCTIONAL REQUIREMENTS ─────────────────────────────────
      partHeading("PART C: FUNCTIONAL REQUIREMENTS"),
      rulePara(),
      sectionHeading("37. Core Functional Requirements"),
      simpleTable(
        ["Req. ID", "Requirement"],
        [
          ["FR-001", "System shall maintain order lifecycle status from confirmation to shipment."],
          ["FR-002", "System shall maintain planned and actual dates for each major order stage."],
          ["FR-003", "System shall enforce PCD readiness checks before cutting release."],
          ["FR-004", "System shall support weekly capacity-based production planning."],
          ["FR-005", "System shall support daily production release based on readiness."],
          ["FR-006", "System shall monitor load and capacity at each workcenter."],
          ["FR-007", "System shall identify current and future bottlenecks."],
          ["FR-008", "System shall support sewing line loading using SMV, manpower, and capacity assumptions."],
          ["FR-009", "System shall distinguish gross output from net-good output."],
          ["FR-010", "System shall support wash route and wash batch planning."],
          ["FR-011", "System shall track rewash and repeat wash capacity consumption."],
          ["FR-012", "System shall track WIP quantity and ageing between processes."],
          ["FR-013", "System shall generate exceptions for material, capacity, quality, approval, WIP, and shipment risks."],
          ["FR-014", "System shall assign owner and due date to every exception."],
          ["FR-015", "System shall track shipment readiness separately from production completion."],
          ["FR-016", "System shall maintain audit trail for plan changes and conditional releases."],
          ["FR-017", "System shall support role-based views and permissions."],
          ["FR-018", "System shall support integration with ERP or existing order/material data sources."],
          ["FR-019", "System shall support export and reporting for management review."],
          ["FR-020", "System shall preserve historical data for performance analytics."],
        ],
        [1200, 7440]
      ),
      pageBreak(),

      sectionHeading("38. Key Business Rules"),
      subHeading("38.1 PCD Release Rules"),
      bullet("No order should move to cutting without PCD readiness status."),
      bullet("Blocked orders must have open dependency and owner."),
      bullet("Conditional release must require reason and approval."),
      bullet("Fabric QC failure should block PCD unless overridden by authorized role."),
      subHeading("38.2 Planning Rules"),
      bullet("Weekly plan must be capacity checked before freeze."),
      bullet("Frozen-zone changes must require reason code and approval."),
      bullet("Daily release must validate real readiness."),
      bullet("Workcenter overload should trigger exception."),
      bullet("Orders with high shipment risk should receive priority review."),
      subHeading("38.3 Capacity Rules"),
      bullet("Capacity should be based on available minutes, manpower, machine availability, SMV, and demonstrated efficiency."),
      bullet("Net-good output should account for quality loss and rework."),
      bullet("Rework and rewash must consume capacity."),
      bullet("Wash capacity must be separately planned from sewing capacity."),
      subHeading("38.4 WIP Rules"),
      bullet("WIP must be tracked at key handover points."),
      bullet("WIP ageing beyond threshold must trigger alert."),
      bullet("WIP with quality hold must not proceed without clearance."),
      bullet("WIP waiting before constraint workcenter must be prioritized by shipment risk and readiness."),
      subHeading("38.5 Shipment Rules"),
      bullet("Shipment readiness must include final QC, inspection, packing, documents, and booking."),
      bullet("Production complete does not mean shipment ready."),
      bullet("Short shipment risk must be visible before shipment date."),
      bullet("Split shipment decision must be tracked and approved."),
      pageBreak(),

      // ── PART D: NON-FUNCTIONAL REQUIREMENTS ─────────────────────────────
      partHeading("PART D: NON-FUNCTIONAL REQUIREMENTS"),
      rulePara(),
      sectionHeading("39. Non-Functional Requirements"),
      simpleTable(
        ["Category", "Requirement"],
        [
          ["Usability", "Screens must be simple, action-oriented, and suitable for planners and shopfloor supervisors."],
          ["Performance", "Workcenter load, WIP, and order risk views should load quickly for large order volumes."],
          ["Scalability", "System must support large factory operations with many lines, workcenters, styles, and orders."],
          ["Reliability", "Planning data must be version-controlled and auditable."],
          ["Security", "Access should be role-based. Sensitive commercial and customer data must be protected."],
          ["Integration", "System should integrate with ERP, material records, shopfloor actuals, and shipment data where available."],
          ["Auditability", "Plan changes, overrides, conditional releases, and shipment changes must be traceable."],
          ["Configurability", "Workcenters, statuses, thresholds, calendars, and roles must be configurable."],
          ["Mobile Readiness", "Shopfloor update flows should eventually support mobile or tablet usage."],
          ["Data Quality", "Missing or incomplete master data must be visible before planning decisions."],
        ],
        [2400, 6240]
      ),
      pageBreak(),

      // ── PART E: INTEGRATION ──────────────────────────────────────────────
      partHeading("PART E: INTEGRATION REQUIREMENTS"),
      rulePara(),
      sectionHeading("40. Required Integration Areas"),
      simpleTable(
        ["Integration Area", "Purpose"],
        [
          ["Order Management / ERP", "Order, customer, style, PO, quantity, delivery date"],
          ["BOM / Material System", "Fabric, trims, packing materials"],
          ["Procurement", "Vendor PO, ETA, inward status"],
          ["Fabric QC", "Inspection status and results"],
          ["Production Actuals", "Cutting, sewing, wash, finishing output"],
          ["Quality System", "Defects, holds, rework, AQL"],
          ["HR / Attendance", "Operator availability and absenteeism"],
          ["Machine / Maintenance", "Machine availability and breakdown"],
          ["Shipment / Logistics", "Packing, inspection, dispatch, documents"],
        ],
        [3120, 5520]
      ),
      pageBreak(),

      // ── PART F: ROLES AND USERS ──────────────────────────────────────────
      partHeading("PART F: ROLES AND USERS"),
      rulePara(),
      sectionHeading("41. Key User Roles"),
      simpleTable(
        ["Role", "Key Usage"],
        [
          ["Management", "Control tower, shipment risk, bottlenecks, performance"],
          ["Production Planner", "Weekly plan, daily release, workcenter load, recovery"],
          ["Merchandiser", "Order lifecycle, approvals, buyer comments"],
          ["Procurement User", "Material status, vendor follow-up"],
          ["Fabric QC User", "Fabric inspection and clearance"],
          ["Cutting Manager", "Cutting readiness and cut output"],
          ["Sewing Manager", "Line load, output, WIP, constraints"],
          ["Washing Manager", "Wash plan, batch status, rewash"],
          ["Finishing Manager", "Finishing queue, packing readiness"],
          ["QC Manager", "Quality holds, inspection, defects"],
          ["Shipment Team", "Shipment readiness and dispatch"],
          ["Shopfloor Supervisor", "Daily updates, output, issues, handover"],
        ],
        [3120, 5520]
      ),
      pageBreak(),

      // ── PART G: REPORTING ────────────────────────────────────────────────
      partHeading("PART G: REPORTING REQUIREMENTS"),
      rulePara(),
      sectionHeading("42. MVP Reports"),
      simpleTable(
        ["Report", "Purpose"],
        [
          ["Order Status Report", "End-to-end order progress"],
          ["PCD Readiness Report", "Orders ready, blocked, conditional"],
          ["Weekly Plan Report", "Department-wise weekly plan"],
          ["Daily Release Report", "Work released and blocked"],
          ["Workcenter Load Report", "Load vs capacity by workcenter"],
          ["Sewing Line Load Report", "Line-wise plan and output"],
          ["Wash Queue Report", "Wash load, queue, and rewash"],
          ["WIP Ageing Report", "Stuck WIP and owner"],
          ["Exception Report", "Open issues and recovery actions"],
          ["Shipment Readiness Report", "Orders ready or at risk for shipment"],
        ],
        [3600, 5040]
      ),
      pageBreak(),

      // ── PART H: SUCCESS METRICS ──────────────────────────────────────────
      partHeading("PART H: SUCCESS METRICS"),
      rulePara(),
      sectionHeading("43. Business Success Metrics"),
      simpleTable(
        ["Metric", "Target Direction"],
        [
          ["OTIF", "Maintain above 95% while reducing recovery cost"],
          ["Utilization", "Improve from 70% through better flow and readiness"],
          ["Overtime Cost", "Reduce overtime used for shipment recovery"],
          ["Planning Adherence", "Improve weekly and daily plan compliance"],
          ["PCD Readiness Accuracy", "Reduce cutting releases with open blockers"],
          ["WIP Ageing", "Reduce ageing at key handover points"],
          ["Wash Queue Ageing", "Reduce sewn garments waiting for wash"],
          ["Rework Visibility", "100% of major rework captured with owner"],
          ["Shipment Readiness", "Improve advance visibility of dispatch blockers"],
          ["Excel Dependency", "Reduce manual planning sheets over time"],
        ],
        [3600, 5040]
      ),
      pageBreak(),

      // ── PART I: IMPLEMENTATION ROADMAP ───────────────────────────────────
      partHeading("PART I: IMPLEMENTATION ROADMAP"),
      rulePara(),
      sectionHeading("44. Suggested Implementation Phases"),
      subHeading("Phase 1: MVP Foundation"),
      bodyPara("Build and deploy the ten critical surfaces:"),
      ...codeBlock([
        "1. Order Lifecycle               2. PCD Readiness",
        "3. Weekly Planning Workbench     4. Daily Production Release",
        "5. Workcenter Load Monitor       6. Sewing Line Loading",
        "7. Wash Planning                 8. WIP and Queue Monitoring",
        "9. Exception and Alert Management    10. Shipment Readiness"
      ]),
      subHeading("Phase 2: Material, Sampling, and Technical Master Expansion"),
      bodyPara("Add the following capabilities:"),
      ...codeBlock([
        "Enquiry and costing             Sampling and approvals",
        "Style technical file            BOM and material planning",
        "Procurement and vendor follow-up    Fabric inward and QC"
      ]),
      subHeading("Phase 3: Shopfloor and Quality Depth"),
      bodyPara("Add the following capabilities:"),
      ...codeBlock([
        "Cutting room                    Wash recipe execution",
        "Quality management              Rework and recovery",
        "Operator skill and capacity     Department handover",
        "Mobile shopfloor updates"
      ]),
      subHeading("Phase 4: Governance, Simulation, and Analytics"),
      bodyPara("Add the following capabilities:"),
      ...codeBlock([
        "Executive control tower         Calendar / Gantt planning",
        "What-if simulation              Plan change approval",
        "Master data governance          Performance analytics",
        "Role-based home surfaces"
      ]),
      pageBreak(),

      // ── PART J: KEY RISKS ────────────────────────────────────────────────
      partHeading("PART J: KEY RISKS AND MITIGATION"),
      rulePara(),
      sectionHeading("45. Implementation Risks"),
      simpleTable(
        ["Risk", "Mitigation"],
        [
          ["Users continue using Excel", "Make MVP surfaces action-critical and reduce duplicate entry"],
          ["Poor master data", "Start with minimum required master data and completeness checks"],
          ["Delayed shopfloor actuals", "Use simple update flows and supervisor-level capture"],
          ["Resistance to gate-based release", "Use management-backed policy for PCD and daily release"],
          ["FastReact overlap confusion", "Define integration or coexistence role clearly"],
          ["Wash complexity under-modeled", "Include wash planning in MVP, not later phase"],
          ["Data not trusted", "Show planned vs actual and audit trail"],
          ["Too many alerts", "Prioritize shipment-impacting exceptions"],
          ["Large-scale rollout risk", "Pilot with selected lines/styles before scale-up"],
          ["Extra workload perception", "Replace Excel routines instead of adding parallel work"],
        ],
        [3600, 5040]
      ),
      pageBreak(),

      // ── PART K: OPEN DECISIONS ───────────────────────────────────────────
      partHeading("PART K: OPEN DECISIONS"),
      rulePara(),
      sectionHeading("46. Decisions Required Before Build"),
      ...[
        "Will this tool replace FastReact, integrate with it, or operate as an operational control layer above/beside it?",
        "What is the source of truth for order master and PO details?",
        "What is the source of truth for material readiness?",
        "What production actuals are currently captured digitally?",
        "Which workcenters should be included in the first pilot?",
        "What are the current PCD readiness rules at Eratex?",
        "How is wash planning currently performed?",
        "How are sewing line capacities currently calculated?",
        "How is overtime cost currently tracked against shipment recovery?",
        "Which Excel files are currently used for real planning decisions?",
      ].map((t, i) => new Paragraph({
        numbering: { reference: "numbers", level: 0 },
        children: [run(t, { size: 22 })],
        spacing: sp(60, 60)
      })),
      pageBreak(),

      // ── FINAL SUMMARY ────────────────────────────────────────────────────
      sectionHeading("47. Final BRD Summary"),
      bodyPara("Eratex requires an end-to-end planning and scheduling tool because its current planning environment appears to be partially digitized but still operationally dependent on Excel. The factory maintains high OTIF, but with additional operating expense, while resource utilization remains around 70%. This suggests that shipment commitments are being protected through late-stage recovery rather than stable flow-based planning."),
      bodyPara("The proposed tool must become the daily operating discipline layer for Eratex. It must enforce order visibility, PCD readiness, weekly and daily planning control, workcenter load monitoring, realistic sewing line loading, denim-specific wash planning, WIP ageing visibility, exception ownership, and shipment readiness."),
      bodyPara("The MVP must deliver the ten critical surfaces needed to stabilize the planning process. The mature-state product should then expand into sampling, procurement, quality, shopfloor execution, skill-based capacity, what-if simulation, master data governance, analytics, and role-based control surfaces."),
      new Paragraph({ spacing: sp(240, 0) }),
      subHeading("Intended Business Outcome"),
      ...codeBlock([
        "Maintain high OTIF,",
        "Increase resource utilization,",
        "Reduce overtime and recovery cost,",
        "Reduce Excel dependency,",
        "Improve planning discipline,",
        "and protect shipment commitments through early, constraint-aware control."
      ]),
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  const outputPath = path.join(__dirname, "Eratex_Planning_Scheduling_Tool_BRD_Professional_Generated.docx");
  fs.writeFileSync(outputPath, buffer);
  console.log(`Done: ${outputPath}`);
});
