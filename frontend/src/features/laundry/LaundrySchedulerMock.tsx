"use client";

import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Factory,
  Gauge,
  GripVertical,
  PauseCircle,
  Play,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Waves,
  Wrench,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";

type RiskTone = "ON_TRACK" | "WATCH" | "ACTION" | "CRITICAL";
type StageState = RiskTone | "IDLE" | "BLOCKED";
type Zone = "Future" | "Volatile" | "Firm";
type TabId = "live" | "capacity" | "batches" | "timeline" | "exceptions" | "adherence" | "rules";

type LaundryKpi = {
  id: string;
  label: string;
  value: string;
  meta: string;
  tone: RiskTone;
  detail: {
    cause: string;
    trend: Array<{ label: string; value: number }>;
    affected: string[];
    suggestions: string[];
  };
};

type FlowStage = {
  id: string;
  name: string;
  wip: string;
  age: string;
  load: number;
  capacity: string;
  machines: string;
  blocked: number;
  riskCount: number;
  state: StageState;
  reason: string;
  imbalance: string;
};

type LaundryBatch = {
  id: string;
  order: string;
  po: string;
  customer: string;
  style: string;
  washCode: string;
  route: string[];
  qty: number;
  kg: number;
  shade: string;
  step: string;
  machine: string;
  planned: string;
  actual: string;
  due: string;
  risk: RiskTone;
  reason: string;
  alternates: string[];
  recipe: string;
  quality: string;
};

type CapacityCell = {
  key: string;
  label: string;
  planned: number;
  actual: number;
  available: number;
  batches: number;
  reserve: number;
  state: StageState;
  note: string;
  action: string;
};

type CapacityRow = {
  id: string;
  group: string;
  family: string;
  cells: CapacityCell[];
};

type TimelineSlot = {
  bucket: string;
  label: string;
  type: "batch" | "setup" | "down" | "idle" | "overload" | "open";
  batchId?: string;
  detail: string;
  tone: StageState;
};

type TimelineMachine = {
  id: string;
  name: string;
  group: string;
  state: StageState;
  utilisation: number;
  queue: string;
  slots: TimelineSlot[];
};

type DemandRow = {
  id: string;
  order: string;
  customer: string;
  style: string;
  washCode: string;
  qty: number;
  kg: number;
  shade: string;
  due: string;
  readiness: "READY" | "NOT_READY" | "HOLD";
  latestStart: string;
  risk: RiskTone;
};

type LaundryException = {
  id: string;
  type: string;
  trigger: string;
  severity: RiskTone;
  status: "Previewed" | "Approval required" | "Approved" | "Applied";
  affected: string;
  impact: string;
  recommendation: string;
  approval: string;
};

type Selected =
  | { type: "batch"; id: string }
  | { type: "stage"; id: string }
  | { type: "machine"; id: string }
  | { type: "capacity"; rowId: string; cellKey: string }
  | { type: "exception"; id: string }
  | { type: "demand"; id: string };

type PendingMove = {
  batchId: string;
  machineId: string;
  bucket: string;
};

type Modal =
  | { type: "kpi"; kpi: LaundryKpi }
  | { type: "capacity"; row: CapacityRow; cell: CapacityCell }
  | { type: "batch"; batch: LaundryBatch }
  | { type: "machine"; machine: TimelineMachine }
  | { type: "exception"; exception: LaundryException }
  | { type: "impact"; title: string; move?: PendingMove; source: string }
  | { type: "idle"; machine: TimelineMachine; slot: TimelineSlot }
  | { type: "rewash"; batch: LaundryBatch };

const tabs: Array<{ id: TabId; label: string }> = [
  { id: "live", label: "Live Flow" },
  { id: "capacity", label: "Capacity Board" },
  { id: "batches", label: "Batch Builder" },
  { id: "timeline", label: "Machine Timeline" },
  { id: "exceptions", label: "Exceptions" },
  { id: "adherence", label: "Adherence" },
  { id: "rules", label: "Masters & Rules" },
];

const kpis: LaundryKpi[] = [
  {
    id: "ccr",
    label: "Active CCR",
    value: "Dryer",
    meta: "118% Shift B load",
    tone: "ACTION",
    detail: {
      cause: "Planned drying load is above Shift B capacity because heavy wash and rewash batches are converging after wet wash.",
      trend: [
        { label: "Shift A", value: 92 },
        { label: "Shift B", value: 118 },
        { label: "Shift C", value: 101 },
      ],
      affected: ["W-204", "W-211", "ORD-1088", "ORD-1092"],
      suggestions: ["Hold W-211 wet release until Dryer 03 opens", "Move W-204 to Tonello 150-2 and protect Dryer 02 slot"],
    },
  },
  {
    id: "planned",
    label: "Planned utilisation",
    value: "104%",
    meta: "Wet + dry combined",
    tone: "WATCH",
    detail: {
      cause: "The plan is feasible at washer level but exceeds dryer and shade QC buffers.",
      trend: [
        { label: "Dry", value: 86 },
        { label: "Wet", value: 104 },
        { label: "Dryer", value: 118 },
      ],
      affected: ["Dryer 02", "Shade QC", "W-219"],
      suggestions: ["Pull PP spray earlier", "Reserve 90 min rewash slot before Shift C"],
    },
  },
  {
    id: "actual",
    label: "Actual utilisation",
    value: "88%",
    meta: "Machine events to 12:20",
    tone: "ON_TRACK",
    detail: {
      cause: "Actual consumption is below plan because Tonello 125-2 had two hours of breakdown and Dryer 02 waited for hydro.",
      trend: [
        { label: "08:00", value: 74 },
        { label: "10:00", value: 88 },
        { label: "12:00", value: 88 },
      ],
      affected: ["Tonello 125-2", "Dryer 02"],
      suggestions: ["Capture idle reason on Dryer 02", "Re-sequence W-214 after repair clearance"],
    },
  },
  {
    id: "idle",
    label: "Idle hours",
    value: "6.5h",
    meta: "3.0h no lot, 2.0h down",
    tone: "ACTION",
    detail: {
      cause: "Idle loss is concentrated in Dryer 02 and Tonello 125-2. One idle window is caused by late sewn WIP.",
      trend: [
        { label: "No lot", value: 3 },
        { label: "Down", value: 2 },
        { label: "Waiting dryer", value: 1.5 },
      ],
      affected: ["Dryer 02", "Tonello 125-2", "ORD-1098"],
      suggestions: ["Fill Dryer 02 with W-217", "Escalate late sewn WIP for ORD-1098"],
    },
  },
  {
    id: "adherence",
    label: "Plan adherence",
    value: "76%",
    meta: "Sequence adherence 68%",
    tone: "WATCH",
    detail: {
      cause: "Four batches changed machine sequence after breakdown and one urgent underloaded batch entered the firm zone.",
      trend: [
        { label: "Machine", value: 81 },
        { label: "Sequence", value: 68 },
        { label: "Start time", value: 74 },
      ],
      affected: ["W-202", "W-204", "W-214", "W-219"],
      suggestions: ["Approve governed change for W-204", "Review underloaded urgent batch reason"],
    },
  },
  {
    id: "rewash",
    label: "Rewash load",
    value: "72%",
    meta: "85% reserve protected",
    tone: "WATCH",
    detail: {
      cause: "Shade QC released two rewash children, but reserve remains inside rule because Shift C has a protected slot.",
      trend: [
        { label: "Reserved", value: 85 },
        { label: "Consumed", value: 72 },
        { label: "Open", value: 13 },
      ],
      affected: ["RW-044", "RW-045", "Shade QC"],
      suggestions: ["Keep reserve locked", "Create W-204 rewash child only after QC confirmation"],
    },
  },
  {
    id: "risk",
    label: "Shipment risk",
    value: "5 orders",
    meta: "2 due within 48h",
    tone: "CRITICAL",
    detail: {
      cause: "Dryer overload and missing recipe approval expose two shipments inside the 48 hour horizon.",
      trend: [
        { label: "Red", value: 2 },
        { label: "Amber", value: 3 },
        { label: "Cleared", value: 6 },
      ],
      affected: ["ORD-1088", "ORD-1092", "ORD-1101"],
      suggestions: ["Approve W-204 move", "Route missing enzyme wash master correction"],
    },
  },
];

const flowStages: FlowStage[] = [
  {
    id: "waiting",
    name: "Sewn Waiting Wash",
    wip: "11.8k pcs",
    age: "18h",
    load: 94,
    capacity: "12.5k pcs",
    machines: "Queue",
    blocked: 3,
    riskCount: 2,
    state: "WATCH",
    reason: "Late sewn WIP can starve dry process after 15:00.",
    imbalance: "3 not-ready lots hold 1.6k pcs.",
  },
  {
    id: "dry",
    name: "Dry Process",
    wip: "5.2k pcs",
    age: "10h",
    load: 86,
    capacity: "6.0k pcs",
    machines: "7 active",
    blocked: 0,
    riskCount: 1,
    state: "ON_TRACK",
    reason: "Laser and whisker sequence is stable.",
    imbalance: "Dry output can feed wet wash until 17:00.",
  },
  {
    id: "laser",
    name: "Laser / PP Spray",
    wip: "3.4k pcs",
    age: "12h",
    load: 111,
    capacity: "3.1k pcs",
    machines: "4 active",
    blocked: 1,
    riskCount: 2,
    state: "WATCH",
    reason: "PP spray queue is above normal and one booth is under operator constraint.",
    imbalance: "May become active CCR if Dryer recovery succeeds.",
  },
  {
    id: "wet",
    name: "Wet Wash",
    wip: "8.4k pcs",
    age: "16h",
    load: 128,
    capacity: "6.6k pcs",
    machines: "8 active",
    blocked: 2,
    riskCount: 3,
    state: "ACTION",
    reason: "Washer load exceeds plan, but the real blocker is downstream drying.",
    imbalance: "Wet release exceeds dryer capacity by 220 min.",
  },
  {
    id: "hydro",
    name: "Hydro",
    wip: "2.2k pcs",
    age: "4h",
    load: 72,
    capacity: "3.0k pcs",
    machines: "3 active",
    blocked: 0,
    riskCount: 0,
    state: "ON_TRACK",
    reason: "Hydro has spare minutes and can absorb wet wash output.",
    imbalance: "No current constraint.",
  },
  {
    id: "dryer",
    name: "Dryer",
    wip: "7.1k pcs",
    age: "22h",
    load: 118,
    capacity: "6.0k pcs",
    machines: "5 active",
    blocked: 4,
    riskCount: 5,
    state: "CRITICAL",
    reason: "Heavy wash, rewash, and 90 min downtime make Dryer the active CCR.",
    imbalance: "Hold wet wash release before Dryer 03 opens.",
  },
  {
    id: "qc",
    name: "Shade QC",
    wip: "1.8k pcs",
    age: "9h",
    load: 96,
    capacity: "1.9k pcs",
    machines: "2 tables",
    blocked: 1,
    riskCount: 2,
    state: "WATCH",
    reason: "Shade-sensitive customer is close to QC capacity.",
    imbalance: "Two rewash candidates may consume reserve.",
  },
  {
    id: "rewash",
    name: "Rewash / Touch-up",
    wip: "0.9k pcs",
    age: "6h",
    load: 72,
    capacity: "1.2k pcs",
    machines: "Reserve",
    blocked: 0,
    riskCount: 1,
    state: "WATCH",
    reason: "Reserve is protected but should not be consumed by normal production.",
    imbalance: "13% reserve remains after current children.",
  },
  {
    id: "finish",
    name: "Released to Finishing",
    wip: "6.5k pcs",
    age: "3h",
    load: 81,
    capacity: "8.0k pcs",
    machines: "Release",
    blocked: 0,
    riskCount: 0,
    state: "ON_TRACK",
    reason: "Finishing release is not blocking laundry.",
    imbalance: "No downstream hold.",
  },
];

const batches: LaundryBatch[] = [
  {
    id: "W-204",
    order: "ORD-1088",
    po: "PO-77821",
    customer: "Northstar Retail",
    style: "DENIM-S24",
    washCode: "ENZ-STN",
    route: ["Dry Process", "Wet Wash", "Hydro", "Dryer", "Shade QC"],
    qty: 1320,
    kg: 72,
    shade: "IND-A2",
    step: "Wet Wash",
    machine: "Tonello 125-1",
    planned: "18 Jun 10:00-12:00",
    actual: "Started 10:22",
    due: "D-1",
    risk: "ACTION",
    reason: "Dryer Shift B overload and preferred machine conflict.",
    alternates: ["Tonello 150-2", "Tolkar 01"],
    recipe: "REC-ENZ-STN-v4",
    quality: "Shade QC pending",
  },
  {
    id: "W-211",
    order: "ORD-1092",
    po: "PO-78110",
    customer: "Blue Harbor",
    style: "JEAN-SLIM",
    washCode: "ACID-LT",
    route: ["Laser / PP Spray", "Wet Wash", "Hydro", "Dryer", "Shade QC"],
    qty: 980,
    kg: 64,
    shade: "BLK-C1",
    step: "Dryer",
    machine: "Dryer 02",
    planned: "18 Jun 12:00-14:00",
    actual: "Waiting hydro",
    due: "D-0",
    risk: "CRITICAL",
    reason: "Shipment due inside 48h and dryer slot overloaded.",
    alternates: ["Dryer 03"],
    recipe: "REC-ACID-LT-v2",
    quality: "No QC yet",
  },
  {
    id: "W-214",
    order: "ORD-1098",
    po: "PO-78440",
    customer: "Hale Outfitters",
    style: "DENIM-CROP",
    washCode: "RNS-DK",
    route: ["Wet Wash", "Hydro", "Dryer", "Shade QC"],
    qty: 760,
    kg: 48,
    shade: "IND-B1",
    step: "Wet Wash",
    machine: "Tonello 125-2",
    planned: "18 Jun 12:00-15:00",
    actual: "Machine down",
    due: "D+1",
    risk: "WATCH",
    reason: "Machine breakdown created sequence change.",
    alternates: ["Tonello 125-1", "Tolkar 02"],
    recipe: "REC-RNS-DK-v1",
    quality: "Pending",
  },
  {
    id: "W-219",
    order: "ORD-1101",
    po: "PO-79021",
    customer: "Aster Goods",
    style: "JACKET-RAW",
    washCode: "HEAVY-BLK",
    route: ["Dry Process", "Wet Wash", "Hydro", "Dryer", "Shade QC", "Rewash"],
    qty: 620,
    kg: 83,
    shade: "BLK-D4",
    step: "Sewn Waiting Wash",
    machine: "Unassigned",
    planned: "18 Jun 16:00-19:00",
    actual: "Not ready",
    due: "D+2",
    risk: "ACTION",
    reason: "Late sewn WIP and heavy dryer load.",
    alternates: ["Tonello 150-1"],
    recipe: "REC-HEAVY-BLK-v3",
    quality: "Not started",
  },
];

const capacityRows: CapacityRow[] = [
  {
    id: "dry",
    group: "Dry Process",
    family: "Pre-wash",
    cells: [
      { key: "d1a", label: "18 Jun A", planned: 86, actual: 79, available: 960, batches: 8, reserve: 0, state: "ON_TRACK", note: "Stable feed to wet wash.", action: "Keep current sequence." },
      { key: "d1b", label: "18 Jun B", planned: 94, actual: 42, available: 960, batches: 9, reserve: 0, state: "WATCH", note: "PP spray operator gap after 15:00.", action: "Pull two dry batches into Shift A." },
      { key: "d2a", label: "19 Jun A", planned: 78, actual: 0, available: 960, batches: 7, reserve: 0, state: "ON_TRACK", note: "Open capacity.", action: "Hold reserve." },
    ],
  },
  {
    id: "laser",
    group: "Laser / PP Spray",
    family: "Pre-wash",
    cells: [
      { key: "l1a", label: "18 Jun A", planned: 111, actual: 96, available: 720, batches: 6, reserve: 0, state: "WATCH", note: "PP spray booth constrained.", action: "Approve overtime 1h or move W-219." },
      { key: "l1b", label: "18 Jun B", planned: 104, actual: 28, available: 720, batches: 5, reserve: 0, state: "WATCH", note: "Potential active CCR after dryer recovery.", action: "Watch W-219 readiness." },
      { key: "l2a", label: "19 Jun A", planned: 82, actual: 0, available: 720, batches: 4, reserve: 0, state: "ON_TRACK", note: "Feasible.", action: "No action." },
    ],
  },
  {
    id: "wet125",
    group: "Wet Wash - Tonello 125 kg",
    family: "Wet wash",
    cells: [
      { key: "w1a", label: "18 Jun A", planned: 106, actual: 88, available: 840, batches: 5, reserve: 0, state: "WATCH", note: "Tonello 125-2 breakdown.", action: "Move W-214 to Tolkar 02." },
      { key: "w1b", label: "18 Jun B", planned: 128, actual: 33, available: 840, batches: 6, reserve: 0, state: "ACTION", note: "Wet plan exceeds downstream dryer.", action: "Hold W-211 wet release." },
      { key: "w2a", label: "19 Jun A", planned: 99, actual: 0, available: 840, batches: 5, reserve: 0, state: "ON_TRACK", note: "Balanced.", action: "Commit after repair." },
    ],
  },
  {
    id: "wet150",
    group: "Wet Wash - Tonello 150 kg",
    family: "Wet wash",
    cells: [
      { key: "w15a", label: "18 Jun A", planned: 92, actual: 91, available: 900, batches: 4, reserve: 0, state: "ON_TRACK", note: "High load fit.", action: "Keep heavy batches grouped." },
      { key: "w15b", label: "18 Jun B", planned: 118, actual: 61, available: 900, batches: 5, reserve: 0, state: "ACTION", note: "Can absorb W-204, but customer preferred machine conflict.", action: "Preview governed move." },
      { key: "w15c", label: "19 Jun A", planned: 84, actual: 0, available: 900, batches: 4, reserve: 0, state: "ON_TRACK", note: "Open alternate capacity.", action: "Keep fallback." },
    ],
  },
  {
    id: "dryer",
    group: "Dryer",
    family: "Dry",
    cells: [
      { key: "dr1a", label: "18 Jun A", planned: 101, actual: 97, available: 1260, batches: 7, reserve: 60, state: "WATCH", note: "Near capacity.", action: "Avoid extra wet release." },
      { key: "dr1b", label: "18 Jun B", planned: 118, actual: 44, available: 1260, batches: 8, reserve: 90, state: "CRITICAL", note: "220 min overload: 4 heavy-wash batches, 1 rewash child.", action: "Move W-204, hold W-211, approve 2.5h overtime." },
      { key: "dr2a", label: "19 Jun A", planned: 96, actual: 0, available: 1260, batches: 6, reserve: 90, state: "ON_TRACK", note: "Recovery slot open.", action: "Protect reserve." },
    ],
  },
  {
    id: "qc",
    group: "Shade QC",
    family: "Quality",
    cells: [
      { key: "q1a", label: "18 Jun A", planned: 88, actual: 76, available: 540, batches: 12, reserve: 0, state: "ON_TRACK", note: "Stable.", action: "No action." },
      { key: "q1b", label: "18 Jun B", planned: 96, actual: 21, available: 540, batches: 14, reserve: 0, state: "WATCH", note: "Shade-sensitive customer queue.", action: "Add QC checker after 16:00." },
      { key: "q2a", label: "19 Jun A", planned: 72, actual: 0, available: 540, batches: 9, reserve: 0, state: "ON_TRACK", note: "Feasible.", action: "Keep plan." },
    ],
  },
  {
    id: "reserve",
    group: "Rewash Reserve",
    family: "Reserve",
    cells: [
      { key: "r1a", label: "18 Jun A", planned: 72, actual: 44, available: 240, batches: 2, reserve: 85, state: "WATCH", note: "Reserve partly consumed by RW-044.", action: "Do not use for normal batches." },
      { key: "r1b", label: "18 Jun B", planned: 64, actual: 0, available: 240, batches: 2, reserve: 85, state: "ON_TRACK", note: "Protected.", action: "Hold reserve locked." },
      { key: "r2a", label: "19 Jun A", planned: 50, actual: 0, available: 240, batches: 1, reserve: 90, state: "ON_TRACK", note: "Open.", action: "Use only after QC failure." },
    ],
  },
];

const timelineBuckets = ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00"];

const timelineMachines: TimelineMachine[] = [
  {
    id: "tonello125-1",
    name: "Tonello 125-1",
    group: "Wet Wash",
    state: "WATCH",
    utilisation: 106,
    queue: "W-204 -> W-208 -> W-217",
    slots: [
      { bucket: "08:00", label: "W-201", type: "batch", batchId: "W-201", detail: "Rinse denim, on time", tone: "ON_TRACK" },
      { bucket: "10:00", label: "W-204", type: "batch", batchId: "W-204", detail: "72kg enzyme stone, preferred-machine conflict", tone: "ACTION" },
      { bucket: "12:00", label: "Setup", type: "setup", detail: "Stone cleanout 35 min", tone: "WATCH" },
      { bucket: "14:00", label: "W-208", type: "batch", batchId: "W-208", detail: "Dark rinse", tone: "ON_TRACK" },
      { bucket: "16:00", label: "Idle", type: "idle", detail: "Waiting sewn WIP", tone: "IDLE" },
      { bucket: "18:00", label: "W-217", type: "batch", batchId: "W-217", detail: "Recovery candidate", tone: "ON_TRACK" },
    ],
  },
  {
    id: "tonello125-2",
    name: "Tonello 125-2",
    group: "Wet Wash",
    state: "ACTION",
    utilisation: 61,
    queue: "Down -> W-214 -> W-219",
    slots: [
      { bucket: "08:00", label: "Down", type: "down", detail: "Drain valve fault", tone: "ACTION" },
      { bucket: "10:00", label: "Down", type: "down", detail: "Maintenance ETA 11:45", tone: "ACTION" },
      { bucket: "12:00", label: "W-214", type: "batch", batchId: "W-214", detail: "Sequence delayed", tone: "WATCH" },
      { bucket: "14:00", label: "W-214", type: "batch", batchId: "W-214", detail: "Extended cycle", tone: "WATCH" },
      { bucket: "16:00", label: "W-219", type: "batch", batchId: "W-219", detail: "Heavy black, not ready risk", tone: "ACTION" },
      { bucket: "18:00", label: "Open", type: "open", detail: "Can absorb recovery move", tone: "ON_TRACK" },
    ],
  },
  {
    id: "dryer02",
    name: "Dryer 02",
    group: "Dryer",
    state: "CRITICAL",
    utilisation: 118,
    queue: "W-197 -> W-211 -> RW-044",
    slots: [
      { bucket: "08:00", label: "W-197", type: "batch", batchId: "W-197", detail: "Heavy wash continued", tone: "WATCH" },
      { bucket: "10:00", label: "W-197", type: "batch", batchId: "W-197", detail: "Moisture extended 25 min", tone: "WATCH" },
      { bucket: "12:00", label: "Idle", type: "idle", detail: "Waiting hydro output", tone: "IDLE" },
      { bucket: "14:00", label: "Over", type: "overload", detail: "220 min overload from W-211 and rewash", tone: "CRITICAL" },
      { bucket: "16:00", label: "W-211", type: "batch", batchId: "W-211", detail: "Shipment risk red", tone: "CRITICAL" },
      { bucket: "18:00", label: "RW-044", type: "batch", batchId: "RW-044", detail: "Rewash child", tone: "WATCH" },
    ],
  },
  {
    id: "dryer03",
    name: "Dryer 03",
    group: "Dryer",
    state: "ON_TRACK",
    utilisation: 84,
    queue: "Open recovery",
    slots: [
      { bucket: "08:00", label: "W-202", type: "batch", batchId: "W-202", detail: "On time", tone: "ON_TRACK" },
      { bucket: "10:00", label: "W-202", type: "batch", batchId: "W-202", detail: "On time", tone: "ON_TRACK" },
      { bucket: "12:00", label: "Open", type: "open", detail: "Recovery slot", tone: "ON_TRACK" },
      { bucket: "14:00", label: "W-210", type: "batch", batchId: "W-210", detail: "Normal load", tone: "ON_TRACK" },
      { bucket: "16:00", label: "Open", type: "open", detail: "Can absorb W-204 after approval", tone: "ON_TRACK" },
      { bucket: "18:00", label: "Reserve", type: "setup", detail: "Protected rewash reserve", tone: "WATCH" },
    ],
  },
  {
    id: "shade-qc",
    name: "Shade QC Table 01",
    group: "Quality",
    state: "WATCH",
    utilisation: 96,
    queue: "12 batches",
    slots: [
      { bucket: "08:00", label: "W-190", type: "batch", batchId: "W-190", detail: "Passed", tone: "ON_TRACK" },
      { bucket: "10:00", label: "W-197", type: "batch", batchId: "W-197", detail: "Shade delta watch", tone: "WATCH" },
      { bucket: "12:00", label: "QC Hold", type: "down", detail: "Await shade master", tone: "ACTION" },
      { bucket: "14:00", label: "W-204", type: "batch", batchId: "W-204", detail: "Expected if move approved", tone: "ACTION" },
      { bucket: "16:00", label: "RW-045", type: "batch", batchId: "RW-045", detail: "Rewash review", tone: "WATCH" },
      { bucket: "18:00", label: "Open", type: "open", detail: "No constraint", tone: "ON_TRACK" },
    ],
  },
];

const demandRows: DemandRow[] = [
  { id: "d-1088", order: "ORD-1088", customer: "Northstar Retail", style: "DENIM-S24", washCode: "ENZ-STN", qty: 1320, kg: 72, shade: "IND-A2", due: "20 Jun", readiness: "READY", latestStart: "18 Jun 10:00", risk: "ACTION" },
  { id: "d-1092", order: "ORD-1092", customer: "Blue Harbor", style: "JEAN-SLIM", washCode: "ACID-LT", qty: 980, kg: 64, shade: "BLK-C1", due: "19 Jun", readiness: "READY", latestStart: "18 Jun 12:00", risk: "CRITICAL" },
  { id: "d-1098", order: "ORD-1098", customer: "Hale Outfitters", style: "DENIM-CROP", washCode: "RNS-DK", qty: 760, kg: 48, shade: "IND-B1", due: "21 Jun", readiness: "NOT_READY", latestStart: "19 Jun 08:00", risk: "WATCH" },
  { id: "d-1101", order: "ORD-1101", customer: "Aster Goods", style: "JACKET-RAW", washCode: "HEAVY-BLK", qty: 620, kg: 83, shade: "BLK-D4", due: "22 Jun", readiness: "HOLD", latestStart: "19 Jun 14:00", risk: "ACTION" },
  { id: "d-1106", order: "ORD-1106", customer: "Northstar Retail", style: "DENIM-SHORT", washCode: "ENZ-STN", qty: 880, kg: 52, shade: "IND-A2", due: "22 Jun", readiness: "READY", latestStart: "19 Jun 16:00", risk: "ON_TRACK" },
  { id: "d-1110", order: "ORD-1110", customer: "Lumen Co", style: "CHINO-DYE", washCode: "RNS-LT", qty: 1040, kg: 58, shade: "KHA-C2", due: "23 Jun", readiness: "READY", latestStart: "20 Jun 08:00", risk: "ON_TRACK" },
];

const exceptions: LaundryException[] = [
  {
    id: "EX-501",
    type: "Machine breakdown",
    trigger: "Tonello 125-2 down from 08:00",
    severity: "ACTION",
    status: "Approval required",
    affected: "W-214, W-219, 840 min wet capacity",
    impact: "-360 min available, sequence adherence drops to 64%",
    recommendation: "Move W-214 to Tolkar 02 and resequence W-219 after sewn readiness.",
    approval: "Washing manager",
  },
  {
    id: "EX-506",
    type: "Dryer overload",
    trigger: "Wet wash release exceeds dryer capacity",
    severity: "CRITICAL",
    status: "Previewed",
    affected: "W-204, W-211, ORD-1088, ORD-1092",
    impact: "+220 min overload, 2 red shipments",
    recommendation: "Hold W-211 wet release and approve W-204 dryer move.",
    approval: "Planning head",
  },
  {
    id: "EX-512",
    type: "Rewash required",
    trigger: "Shade QC fail candidate",
    severity: "WATCH",
    status: "Previewed",
    affected: "RW-045, W-197",
    impact: "Consumes 70 min reserve, shipment risk stays amber",
    recommendation: "Create child batch only after QC lead confirmation.",
    approval: "QC lead",
  },
  {
    id: "EX-518",
    type: "Recipe missing",
    trigger: "HEAVY-BLK wash recipe not released for customer",
    severity: "ACTION",
    status: "Approval required",
    affected: "ORD-1101, W-219",
    impact: "Blocks scheduling and latest safe start is 19 Jun 14:00",
    recommendation: "Route to master correction before batch release.",
    approval: "Master data owner",
  },
];

const rules = [
  { rule: "Route compatible", result: "Pass", owner: "Planning", note: "Selected demand uses approved wash routes." },
  { rule: "Recipe approved", result: "Watch", owner: "Laundry master", note: "HEAVY-BLK requires customer recipe release." },
  { rule: "Machine group eligible", result: "Pass", owner: "Laundry", note: "Tonello 150 kg group can run ENZ-STN." },
  { rule: "Within min/max load", result: "Watch", owner: "Planning", note: "ORD-1092 is under ideal load if isolated." },
  { rule: "Shade lot compatible", result: "Pass", owner: "Quality", note: "IND-A2 can combine with ORD-1106." },
  { rule: "Dryer capacity available", result: "Action", owner: "Laundry", note: "Shift B dryer remains overloaded." },
  { rule: "Rewash reserve available", result: "Pass", owner: "Quality", note: "85% reserve protected." },
];

export function LaundrySchedulerMock() {
  const [activeTab, setActiveTab] = useState<TabId>("live");
  const [zone, setZone] = useState<Zone>("Firm");
  const [selected, setSelected] = useState<Selected>({ type: "batch", id: "W-204" });
  const [inspectorTab, setInspectorTab] = useState("Summary");
  const [modal, setModal] = useState<Modal | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [selectedDemand, setSelectedDemand] = useState<string[]>(["d-1088", "d-1106"]);
  const [batchComposition, setBatchComposition] = useState<string[]>(["d-1088", "d-1106"]);
  const [exceptionStatus, setExceptionStatus] = useState<Record<string, LaundryException["status"]>>({});
  const [timelineMoves, setTimelineMoves] = useState<Record<string, PendingMove>>({});
  const [draggingBatch, setDraggingBatch] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showActual, setShowActual] = useState(true);

  useEffect(() => {
    if (!modal) return undefined;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setModal(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [modal]);

  const visibleDemand = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return demandRows;
    return demandRows.filter((row) =>
      [row.order, row.customer, row.style, row.washCode, row.shade].some((value) =>
        value.toLowerCase().includes(normalized),
      ),
    );
  }, [search]);

  const compositionRows = useMemo(
    () => demandRows.filter((row) => batchComposition.includes(row.id)),
    [batchComposition],
  );
  const compositionKg = compositionRows.reduce((sum, row) => sum + row.kg, 0);
  const compositionQty = compositionRows.reduce((sum, row) => sum + row.qty, 0);

  const updateSelection = (next: Selected) => {
    setSelected(next);
    setInspectorTab("Summary");
  };

  const addSelectedDemand = () => {
    const additions = selectedDemand.filter((id) => !batchComposition.includes(id));
    if (!additions.length) {
      setFeedback("Selected demand is already in the proposed batch.");
      return;
    }
    setBatchComposition((current) => [...current, ...additions]);
    setFeedback(`${additions.length} demand row added to the batch composition.`);
  };

  const removeDemand = (id: string) => {
    setBatchComposition((current) => current.filter((rowId) => rowId !== id));
    setFeedback("Demand removed from the proposed batch.");
  };

  const handleDrop = (machineId: string, bucket: string) => {
    if (!draggingBatch) return;
    const move = { batchId: draggingBatch, machineId, bucket };
    if (zone === "Firm") {
      setModal({
        type: "impact",
        title: "Firm-zone change impact preview",
        move,
        source: "Drag/drop from machine timeline",
      });
      setFeedback("Firm-zone move blocked until impact preview is approved.");
    } else {
      setTimelineMoves((current) => ({ ...current, [draggingBatch]: move }));
      setFeedback(`${draggingBatch} staged on ${machineLabel(machineId)} at ${bucket} in ${zone} zone.`);
      updateSelection({ type: "machine", id: machineId });
    }
    setDraggingBatch(null);
  };

  const approveImpactMove = (move?: PendingMove) => {
    if (move) {
      setTimelineMoves((current) => ({ ...current, [move.batchId]: move }));
      setFeedback(`${move.batchId} move approved and applied to ${machineLabel(move.machineId)} ${move.bucket}.`);
      updateSelection({ type: "machine", id: move.machineId });
    } else {
      setFeedback("Impact preview accepted for the selected recovery action.");
    }
    setModal(null);
  };

  const applyException = (exception: LaundryException) => {
    setExceptionStatus((current) => ({ ...current, [exception.id]: "Approved" }));
    setFeedback(`${exception.id} approved. Recovery action is ready for application.`);
    setModal(null);
    updateSelection({ type: "exception", id: exception.id });
  };

  return (
    <section className="laundry-scheduler" aria-label="Laundry scheduler mock">
      <div className="mb-2 flex min-h-9 flex-wrap items-center justify-between gap-2 border-b border-grid-border pb-2">
        <div className="min-w-0">
          <h1 className="text-[20px] font-semibold leading-7 text-primary">Laundry Scheduler</h1>
          <p className="text-[12px] text-slate-600">
            Unit 01 / 18 Jun / finite-capacity wash control / mock state
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="ops-button" aria-label="Unit selector">
            <Factory className="h-3.5 w-3.5" aria-hidden />
            Unit 01
            <ChevronDown className="h-3.5 w-3.5" aria-hidden />
          </button>
          <button type="button" className="ops-button" aria-label="Date horizon selector">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden />
            18-19 Jun
            <ChevronDown className="h-3.5 w-3.5" aria-hidden />
          </button>
          <button
            type="button"
            className="ops-button"
            onClick={() => {
              setFeedback("Schedule recalculated from mock machine events at 12:24.");
              setShowActual((current) => !current);
            }}
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden />
            Recalculate
          </button>
        </div>
      </div>

      <div className="mb-2 grid gap-2 xl:grid-cols-[minmax(0,1fr)_auto]">
        <div className="flex min-h-8 flex-wrap items-center gap-2 border border-grid-border bg-white px-2 py-1">
          <span className="text-[11px] font-bold uppercase text-slate-500">Planning zone</span>
          <div className="inline-flex overflow-hidden rounded border border-grid-border" role="group" aria-label="Planning zone selector">
            {(["Future", "Volatile", "Firm"] as Zone[]).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setZone(value);
                  setFeedback(`${value} zone selected. ${value === "Firm" ? "Moves require impact preview." : "Moves can be staged directly."}`);
                }}
                className={`h-7 px-3 text-[12px] font-bold ${
                  zone === value ? "bg-primary text-white" : "bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {value}
              </button>
            ))}
          </div>
          <span className="hidden font-mono text-[11px] text-slate-500 md:inline">ERP sync 2m / Sewing WIP 18m / QC 6m</span>
          <div className="relative ml-auto min-w-[220px] flex-1 xl:max-w-sm">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" aria-hidden />
            <input
              aria-label="Search laundry demand"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-7 w-full border border-grid-border bg-white pl-7 pr-2 text-[12px] outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
              placeholder="Search order, style, wash, shade"
            />
          </div>
        </div>
        <div className="flex min-h-8 flex-wrap items-center gap-2 border border-grid-border bg-white px-2 py-1">
          <button
            type="button"
            className={`ops-button h-7 min-h-7 ${showActual ? "ops-button-primary" : ""}`}
            onClick={() => setShowActual((current) => !current)}
          >
            <Gauge className="h-3.5 w-3.5" aria-hidden />
            {showActual ? "Actual overlay on" : "Planned only"}
          </button>
          <button type="button" className="ops-button h-7 min-h-7" onClick={() => setModal({ type: "impact", title: "Release recovery action preview", source: "Suggested action button" })}>
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
            Preview action
          </button>
        </div>
      </div>

      {feedback ? (
        <div role="status" className="mb-2 border border-secondary/20 bg-secondary/10 px-3 py-1.5 text-[12px] font-medium text-primary">
          {feedback}
        </div>
      ) : null}

      <KpiStrip onOpen={(kpi) => setModal({ type: "kpi", kpi })} />
      <LaundryFlowMap selected={selected} onSelect={(id) => updateSelection({ type: "stage", id })} />

      <div className="mb-2 flex h-10 items-center gap-1 overflow-x-auto border border-grid-border bg-white px-2" role="tablist" aria-label="Laundry scheduler tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`h-8 shrink-0 border-b-2 px-3 text-[13px] font-semibold transition-colors ${
              activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-primary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid gap-2 xl:grid-cols-[minmax(0,1fr)_400px]">
        <main className="min-w-0" aria-live="polite">
          {activeTab === "live" ? (
            <LiveFlowView
              onSelectBatch={(id) => updateSelection({ type: "batch", id })}
              onOpenBatch={(batch) => setModal({ type: "batch", batch })}
              onOpenImpact={() => setModal({ type: "impact", title: "Dryer recovery impact preview", source: "Live Flow recommended action" })}
            />
          ) : null}
          {activeTab === "capacity" ? (
            <CapacityBoardView
              onSelect={(row, cell) => {
                updateSelection({ type: "capacity", rowId: row.id, cellKey: cell.key });
                setModal({ type: "capacity", row, cell });
              }}
            />
          ) : null}
          {activeTab === "batches" ? (
            <BatchBuilderView
              visibleDemand={visibleDemand}
              selectedDemand={selectedDemand}
              setSelectedDemand={setSelectedDemand}
              batchComposition={batchComposition}
              compositionRows={compositionRows}
              compositionKg={compositionKg}
              compositionQty={compositionQty}
              onAddDemand={addSelectedDemand}
              onRemoveDemand={removeDemand}
              onSelectDemand={(id) => updateSelection({ type: "demand", id })}
              onPreview={() => setModal({ type: "impact", title: "Batch creation impact preview", source: "Batch Builder" })}
            />
          ) : null}
          {activeTab === "timeline" ? (
            <MachineTimelineView
              zone={zone}
              timelineMoves={timelineMoves}
              onDragStart={setDraggingBatch}
              onDrop={handleDrop}
              onSelectMachine={(id) => updateSelection({ type: "machine", id })}
              onOpenMachine={(machine) => setModal({ type: "machine", machine })}
              onOpenBatch={(batch) => setModal({ type: "batch", batch })}
              onOpenIdle={(machine, slot) => setModal({ type: "idle", machine, slot })}
              onOpenImpact={(slot) => setModal({ type: "impact", title: `${slot.label} impact preview`, source: "Timeline overload block" })}
            />
          ) : null}
          {activeTab === "exceptions" ? (
            <ExceptionsView
              exceptionStatus={exceptionStatus}
              onSelect={(id) => updateSelection({ type: "exception", id })}
              onOpen={(exception) => setModal({ type: "exception", exception })}
            />
          ) : null}
          {activeTab === "adherence" ? <AdherenceView onOpenKpi={(kpi) => setModal({ type: "kpi", kpi })} /> : null}
          {activeTab === "rules" ? <RulesView /> : null}
        </main>

        <Inspector
          selected={selected}
          inspectorTab={inspectorTab}
          setInspectorTab={setInspectorTab}
          exceptionStatus={exceptionStatus}
          onOpenBatch={(batch) => setModal({ type: "batch", batch })}
          onOpenRewash={(batch) => setModal({ type: "rewash", batch })}
          onOpenImpact={(source) => setModal({ type: "impact", title: "Selected item impact preview", source })}
        />
      </div>

      {modal ? (
        <DrillModal
          modal={modal}
          exceptionStatus={exceptionStatus}
          onClose={() => setModal(null)}
          onApproveMove={approveImpactMove}
          onApproveException={applyException}
          onFeedback={setFeedback}
        />
      ) : null}
    </section>
  );
}

function KpiStrip({ onOpen }: { onOpen: (kpi: LaundryKpi) => void }) {
  return (
    <div className="mb-2 grid border border-grid-border bg-white md:grid-cols-2 xl:grid-cols-7" aria-label="Laundry KPI strip">
      {kpis.map((kpi) => (
        <button
          key={kpi.id}
          type="button"
          onClick={() => onOpen(kpi)}
          className={`min-h-[58px] border-b border-r border-grid-border px-2 py-2 text-left transition-colors hover:bg-slate-50 md:border-b-0 ${leftBorder(kpi.tone)}`}
        >
          <span className="block text-[11px] font-bold uppercase text-slate-500">{kpi.label}</span>
          <span className="mt-1 flex items-baseline justify-between gap-2">
            <span className="text-[18px] font-semibold leading-5 text-primary">{kpi.value}</span>
            <RiskPill tone={kpi.tone} />
          </span>
          <span className="mt-1 block truncate text-[11px] text-slate-500">{kpi.meta}</span>
        </button>
      ))}
    </div>
  );
}

function LaundryFlowMap({
  selected,
  onSelect,
}: {
  selected: Selected;
  onSelect: (id: string) => void;
}) {
  return (
    <section className="mb-2 border border-grid-border bg-white" aria-labelledby="laundry-flow-map-title">
      <div className="flex h-8 items-center justify-between border-b border-grid-border px-2">
        <h2 id="laundry-flow-map-title" className="text-[12px] font-bold uppercase text-slate-600">
          Laundry flow map
        </h2>
        <span className="font-mono text-[11px] text-slate-500">Current active CCR: Dryer / next likely CCR: Laser-PP</span>
      </div>
      <div className="flex gap-1 overflow-x-auto p-2">
        {flowStages.map((stage, index) => {
          const active = selected.type === "stage" && selected.id === stage.id;
          return (
            <div key={stage.id} className="flex min-w-[150px] items-stretch gap-1">
              <button
                type="button"
                onClick={() => onSelect(stage.id)}
                className={`min-h-[94px] w-full border bg-white p-2 text-left transition-colors hover:bg-slate-50 ${
                  active ? "border-primary ring-2 ring-primary/20" : "border-grid-border"
                }`}
              >
                <span className={`mb-1 block h-1 ${barColor(stage.state)}`} />
                <span className="block truncate text-[12px] font-bold text-primary">{stage.name}</span>
                <span className="mt-1 grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-slate-600">
                  <span>WIP</span>
                  <span className="text-right font-mono text-primary">{stage.wip}</span>
                  <span>Load</span>
                  <span className={stage.load > 100 ? "text-right font-mono font-bold text-risk-action" : "text-right font-mono text-primary"}>
                    {stage.load}%
                  </span>
                  <span>Blocked</span>
                  <span className="text-right font-mono">{stage.blocked}</span>
                </span>
              </button>
              {index < flowStages.length - 1 ? (
                <span className="flex w-5 items-center justify-center text-slate-300" aria-hidden>
                  <ArrowRight className="h-4 w-4" />
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function LiveFlowView({
  onSelectBatch,
  onOpenBatch,
  onOpenImpact,
}: {
  onSelectBatch: (id: string) => void;
  onOpenBatch: (batch: LaundryBatch) => void;
  onOpenImpact: () => void;
}) {
  const lateBatches = batches.filter((batch) => batch.risk !== "ON_TRACK");
  return (
    <div className="grid gap-2 2xl:grid-cols-[minmax(0,1fr)_320px]">
      <section className="border border-grid-border bg-white" aria-labelledby="live-machine-state-title">
        <div className="flex h-8 items-center justify-between border-b border-grid-border px-2">
          <h2 id="live-machine-state-title" className="text-[12px] font-bold uppercase text-slate-600">
            Machine and resource load board
          </h2>
          <span className="font-mono text-[11px] text-slate-500">Shift B / planned vs actual</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[900px] border-collapse text-[12px]" aria-label="Live laundry machine load board">
            <thead>
              <tr className="bg-slate-50 text-[11px] uppercase text-slate-500">
                <th className="h-8 border-b border-r border-grid-border px-2 text-left">Resource</th>
                <th className="h-8 border-b border-r border-grid-border px-2 text-left">State</th>
                <th className="h-8 border-b border-r border-grid-border px-2 text-left">Load</th>
                <th className="h-8 border-b border-r border-grid-border px-2 text-left">Current batch</th>
                <th className="h-8 border-b border-r border-grid-border px-2 text-left">Next valid action</th>
                <th className="h-8 border-b border-grid-border px-2 text-left">Shipment exposure</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Dryer", "Critical", 118, "W-211", "Hold wet release until Dryer 03 opens", "ORD-1088, ORD-1092"],
                ["Wet Wash 125 kg", "Action", 128, "W-204", "Preview move to Tonello 150-2", "ORD-1088"],
                ["Laser / PP Spray", "Watch", 111, "W-219", "Resolve operator gap", "ORD-1101"],
                ["Shade QC", "Watch", 96, "W-197", "Add checker after 16:00", "2 amber orders"],
                ["Rewash Reserve", "Watch", 72, "RW-044", "Keep reserve locked", "No red exposure"],
              ].map((row) => (
                <tr key={row[0] as string} className="odd:bg-white even:bg-slate-50/60">
                  <td className="h-8 border-b border-r border-grid-border px-2 font-bold text-primary">{row[0]}</td>
                  <td className="h-8 border-b border-r border-grid-border px-2"><StatePill state={String(row[1])} /></td>
                  <td className="h-8 border-b border-r border-grid-border px-2"><MiniLoad value={Number(row[2])} /></td>
                  <td className="h-8 border-b border-r border-grid-border px-2 font-mono">{row[3]}</td>
                  <td className="h-8 border-b border-r border-grid-border px-2">{row[4]}</td>
                  <td className="h-8 border-b border-grid-border px-2">{row[5]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <aside className="space-y-2">
        <section className="border border-grid-border bg-white">
          <div className="flex h-8 items-center justify-between border-b border-grid-border px-2">
            <h2 className="text-[12px] font-bold uppercase text-slate-600">Late and blocked batches</h2>
          </div>
          <div className="divide-y divide-grid-border">
            {lateBatches.map((batch) => (
              <button
                key={batch.id}
                type="button"
                onClick={() => {
                  onSelectBatch(batch.id);
                  onOpenBatch(batch);
                }}
                className="grid w-full grid-cols-[1fr_auto] gap-2 px-2 py-2 text-left hover:bg-slate-50"
              >
                <span>
                  <span className="block font-mono text-[12px] font-bold text-primary">{batch.id} / {batch.order}</span>
                  <span className="block text-[11px] text-slate-500">{batch.reason}</span>
                </span>
                <RiskPill tone={batch.risk} />
              </button>
            ))}
          </div>
        </section>

        <section className="border border-primary bg-primary p-3 text-white">
          <h2 className="text-[12px] font-bold uppercase text-slate-300">Shift value strip</h2>
          <div className="mt-2 grid grid-cols-2 gap-2 text-[12px]">
            <ValueMetric label="Idle avoided" value="4.5h" />
            <ValueMetric label="Overload removed" value="220m" />
            <ValueMetric label="Late risk improved" value="3" />
            <ValueMetric label="Reserve protected" value="85%" />
          </div>
          <button type="button" onClick={onOpenImpact} className="mt-3 h-8 w-full bg-white px-2 text-[12px] font-bold text-primary">
            Preview dryer recovery
          </button>
        </section>
      </aside>
    </div>
  );
}

function CapacityBoardView({ onSelect }: { onSelect: (row: CapacityRow, cell: CapacityCell) => void }) {
  return (
    <section className="border border-grid-border bg-white" aria-labelledby="capacity-board-title">
      <div className="flex h-8 items-center justify-between border-b border-grid-border px-2">
        <h2 id="capacity-board-title" className="text-[12px] font-bold uppercase text-slate-600">
          Multi-CCR capacity board
        </h2>
        <span className="font-mono text-[11px] text-slate-500">Rows are machine groups / columns are shift buckets</span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[1120px] border-collapse text-[12px]" aria-label="Laundry capacity board">
          <thead>
            <tr className="bg-slate-50 text-[11px] uppercase text-slate-500">
              <th className="sticky left-0 z-10 h-8 min-w-[210px] border-b border-r border-grid-border bg-slate-50 px-2 text-left">Machine group</th>
              <th className="h-8 min-w-[260px] border-b border-r border-grid-border px-2 text-left">18 Jun A</th>
              <th className="h-8 min-w-[260px] border-b border-r border-grid-border px-2 text-left">18 Jun B</th>
              <th className="h-8 min-w-[260px] border-b border-grid-border px-2 text-left">19 Jun A</th>
            </tr>
          </thead>
          <tbody>
            {capacityRows.map((row) => (
              <tr key={row.id}>
                <th className="sticky left-0 z-10 h-[74px] border-b border-r border-grid-border bg-white px-2 text-left align-top">
                  <span className="block text-[12px] font-bold text-primary">{row.group}</span>
                  <span className="block text-[11px] font-medium text-slate-500">{row.family}</span>
                </th>
                {row.cells.map((cell) => (
                  <td key={cell.key} className="h-[74px] border-b border-r border-grid-border p-1 align-top last:border-r-0">
                    <button
                      type="button"
                      aria-label={`${row.group} ${cell.label} ${cell.note}`}
                      onClick={() => onSelect(row, cell)}
                      className={`h-full w-full border-l-4 bg-white px-2 py-1 text-left transition-colors hover:bg-slate-50 ${leftBorder(cell.state)}`}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[11px] text-slate-500">{cell.label}</span>
                        <StateDot state={cell.state} />
                      </span>
                      <MiniLoad value={cell.planned} actual={cell.actual} />
                      <span className="mt-1 block truncate text-[11px] text-slate-500">
                        {cell.batches} batches / reserve {cell.reserve}%
                      </span>
                    </button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function BatchBuilderView({
  visibleDemand,
  selectedDemand,
  setSelectedDemand,
  batchComposition,
  compositionRows,
  compositionKg,
  compositionQty,
  onAddDemand,
  onRemoveDemand,
  onSelectDemand,
  onPreview,
}: {
  visibleDemand: DemandRow[];
  selectedDemand: string[];
  setSelectedDemand: (ids: string[]) => void;
  batchComposition: string[];
  compositionRows: DemandRow[];
  compositionKg: number;
  compositionQty: number;
  onAddDemand: () => void;
  onRemoveDemand: (id: string) => void;
  onSelectDemand: (id: string) => void;
  onPreview: () => void;
}) {
  const toggleDemand = (id: string) => {
    setSelectedDemand(selectedDemand.includes(id) ? selectedDemand.filter((rowId) => rowId !== id) : [...selectedDemand, id]);
  };

  return (
    <div className="grid gap-2 2xl:grid-cols-[minmax(0,1fr)_310px_320px]">
      <section className="border border-grid-border bg-white" aria-labelledby="demand-queue-title">
        <div className="flex h-8 items-center justify-between border-b border-grid-border px-2">
          <h2 id="demand-queue-title" className="text-[12px] font-bold uppercase text-slate-600">
            Unbatched wash demand
          </h2>
          <button type="button" onClick={onAddDemand} className="ops-button h-7 min-h-7">
            <ClipboardCheck className="h-3.5 w-3.5" aria-hidden />
            Add selected demand
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[860px] border-collapse text-[12px]" aria-label="Unbatched wash demand queue">
            <thead>
              <tr className="bg-slate-50 text-[11px] uppercase text-slate-500">
                {["", "Order", "Customer", "Style", "Wash", "Qty / kg", "Shade", "Readiness", "Latest start", "Risk"].map((header) => (
                  <th key={header || "select"} className="h-8 border-b border-r border-grid-border px-2 text-left last:border-r-0">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleDemand.map((row) => (
                <tr key={row.id} className="odd:bg-white even:bg-slate-50/60">
                  <td className="h-8 border-b border-r border-grid-border px-2">
                    <input
                      aria-label={`Select ${row.order}`}
                      type="checkbox"
                      checked={selectedDemand.includes(row.id)}
                      onChange={() => toggleDemand(row.id)}
                      className="h-4 w-4 accent-primary"
                    />
                  </td>
                  <td className="h-8 border-b border-r border-grid-border px-2">
                    <button type="button" onClick={() => onSelectDemand(row.id)} className="font-mono font-bold text-primary hover:underline">
                      {row.order}
                    </button>
                  </td>
                  <td className="h-8 border-b border-r border-grid-border px-2">{row.customer}</td>
                  <td className="h-8 border-b border-r border-grid-border px-2">{row.style}</td>
                  <td className="h-8 border-b border-r border-grid-border px-2 font-mono">{row.washCode}</td>
                  <td className="h-8 border-b border-r border-grid-border px-2 font-mono">{row.qty.toLocaleString()} / {row.kg}kg</td>
                  <td className="h-8 border-b border-r border-grid-border px-2 font-mono">{row.shade}</td>
                  <td className="h-8 border-b border-r border-grid-border px-2"><StatePill state={row.readiness} /></td>
                  <td className="h-8 border-b border-r border-grid-border px-2 font-mono">{row.latestStart}</td>
                  <td className="h-8 border-b border-grid-border px-2"><RiskPill tone={row.risk} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="border border-grid-border bg-white" aria-labelledby="compatible-groups-title">
        <div className="flex h-8 items-center border-b border-grid-border px-2">
          <h2 id="compatible-groups-title" className="text-[12px] font-bold uppercase text-slate-600">Suggested compatible groups</h2>
        </div>
        <div className="divide-y divide-grid-border">
          {[
            ["Good fit", "Tonello 150 kg", "124kg combined / route compatible", "ON_TRACK"],
            ["Risky", "Tonello 125 kg", "Preferred machine, but dryer creates red risk", "WATCH"],
            ["Underloaded", "Tolkar 02", "48kg single lot needs urgent reason", "WATCH"],
            ["Blocked", "Dryer 02", "Shift B overload blocks release", "ACTION"],
          ].map(([state, group, note, tone]) => (
            <button key={group} type="button" onClick={onPreview} className="grid w-full grid-cols-[1fr_auto] gap-2 px-2 py-2 text-left hover:bg-slate-50">
              <span>
                <span className="block text-[13px] font-bold text-primary">{group}</span>
                <span className="block text-[11px] text-slate-500">{state}: {note}</span>
              </span>
              <RiskPill tone={tone as RiskTone} />
            </button>
          ))}
        </div>
      </section>

      <section className="border border-grid-border bg-white" aria-labelledby="batch-composition-title">
        <div className="flex h-8 items-center justify-between border-b border-grid-border px-2">
          <h2 id="batch-composition-title" className="text-[12px] font-bold uppercase text-slate-600">Batch composition</h2>
          <span className="font-mono text-[11px] text-slate-500">{compositionQty.toLocaleString()} pcs / {compositionKg}kg</span>
        </div>
        <div className="divide-y divide-grid-border">
          {compositionRows.map((row) => (
            <div key={row.id} className="grid grid-cols-[1fr_auto] gap-2 px-2 py-2">
              <div>
                <p className="font-mono text-[12px] font-bold text-primary">{row.order}</p>
                <p className="text-[11px] text-slate-500">{row.washCode} / {row.shade} / {row.kg}kg</p>
              </div>
              <button type="button" onClick={() => onRemoveDemand(row.id)} className="h-7 border border-grid-border px-2 text-[11px] font-bold text-slate-600 hover:bg-slate-50">
                Remove
              </button>
            </div>
          ))}
        </div>
        <div className="border-t border-grid-border p-2">
          <h3 className="mb-2 text-[11px] font-bold uppercase text-slate-500">Rule validation</h3>
          <div className="space-y-1">
            {rules.map((rule) => (
              <div key={rule.rule} className="grid grid-cols-[1fr_auto] gap-2 text-[12px]">
                <span className="truncate text-slate-600">{rule.rule}</span>
                <StatePill state={rule.result} />
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={onPreview}
            disabled={!batchComposition.length}
            className="ops-button ops-button-primary mt-3 w-full justify-center"
          >
            Preview batch creation
          </button>
        </div>
      </section>
    </div>
  );
}

function MachineTimelineView({
  zone,
  timelineMoves,
  onDragStart,
  onDrop,
  onSelectMachine,
  onOpenMachine,
  onOpenBatch,
  onOpenIdle,
  onOpenImpact,
}: {
  zone: Zone;
  timelineMoves: Record<string, PendingMove>;
  onDragStart: (batchId: string | null) => void;
  onDrop: (machineId: string, bucket: string) => void;
  onSelectMachine: (id: string) => void;
  onOpenMachine: (machine: TimelineMachine) => void;
  onOpenBatch: (batch: LaundryBatch) => void;
  onOpenIdle: (machine: TimelineMachine, slot: TimelineSlot) => void;
  onOpenImpact: (slot: TimelineSlot) => void;
}) {
  return (
    <section className="border border-grid-border bg-white" aria-labelledby="machine-timeline-title">
      <div className="flex h-8 items-center justify-between border-b border-grid-border px-2">
        <h2 id="machine-timeline-title" className="text-[12px] font-bold uppercase text-slate-600">
          Machine timeline
        </h2>
        <span className="font-mono text-[11px] text-slate-500">{zone} zone / drag a batch into another bucket</span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[1180px] border-collapse text-[12px]" aria-label="Machine timeline board">
          <thead>
            <tr className="bg-slate-50 text-[11px] uppercase text-slate-500">
              <th className="sticky left-0 z-10 h-8 w-[190px] border-b border-r border-grid-border bg-slate-50 px-2 text-left">Machine</th>
              {timelineBuckets.map((bucket) => (
                <th key={bucket} className="h-8 min-w-[150px] border-b border-r border-grid-border px-2 text-left last:border-r-0">{bucket}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timelineMachines.map((machine) => (
              <tr key={machine.id}>
                <th className="sticky left-0 z-10 h-[54px] border-b border-r border-grid-border bg-white px-2 text-left">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectMachine(machine.id);
                      onOpenMachine(machine);
                    }}
                    className="w-full text-left"
                  >
                    <span className="block font-bold text-primary">{machine.name}</span>
                    <span className="block text-[11px] text-slate-500">{machine.group} / {machine.utilisation}% load</span>
                  </button>
                </th>
                {timelineBuckets.map((bucket) => {
                  const slot = resolvedSlot(machine, bucket, timelineMoves);
                  return (
                    <td
                      key={`${machine.id}-${bucket}`}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => onDrop(machine.id, bucket)}
                      className="h-[54px] border-b border-r border-grid-border p-1 align-top last:border-r-0"
                    >
                      <TimelineCell
                        machine={machine}
                        slot={slot}
                        onDragStart={onDragStart}
                        onOpenBatch={onOpenBatch}
                        onOpenIdle={onOpenIdle}
                        onOpenImpact={onOpenImpact}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function TimelineCell({
  machine,
  slot,
  onDragStart,
  onOpenBatch,
  onOpenIdle,
  onOpenImpact,
}: {
  machine: TimelineMachine;
  slot: TimelineSlot;
  onDragStart: (batchId: string | null) => void;
  onOpenBatch: (batch: LaundryBatch) => void;
  onOpenIdle: (machine: TimelineMachine, slot: TimelineSlot) => void;
  onOpenImpact: (slot: TimelineSlot) => void;
}) {
  const batch = slot.batchId ? batches.find((candidate) => candidate.id === slot.batchId) : undefined;
  const draggable = Boolean(slot.batchId);
  const label = `${slot.label} ${machine.name} ${slot.bucket}`;

  const handleClick = () => {
    if (slot.type === "idle") {
      onOpenIdle(machine, slot);
      return;
    }
    if (slot.type === "overload") {
      onOpenImpact(slot);
      return;
    }
    if (batch) {
      onOpenBatch(batch);
    }
  };

  return (
    <button
      type="button"
      draggable={draggable}
      onDragStart={(event) => {
        if (!slot.batchId) return;
        event.dataTransfer.setData("text/plain", slot.batchId);
        onDragStart(slot.batchId);
      }}
      onDragEnd={() => onDragStart(null)}
      onClick={handleClick}
      className={`flex h-full w-full items-center gap-1 border px-2 text-left transition-colors hover:bg-white ${slotBg(slot.type, slot.tone)}`}
      aria-label={slot.type === "idle" ? `Capture idle reason ${label}` : label}
    >
      {draggable ? <GripVertical className="h-3 w-3 shrink-0 text-slate-400" aria-hidden /> : slotIcon(slot.type)}
      <span className="min-w-0">
        <span className="block truncate font-mono text-[12px] font-bold text-primary">{slot.label}</span>
        <span className="block truncate text-[10px] text-slate-500">{slot.detail}</span>
      </span>
    </button>
  );
}

function ExceptionsView({
  exceptionStatus,
  onSelect,
  onOpen,
}: {
  exceptionStatus: Record<string, LaundryException["status"]>;
  onSelect: (id: string) => void;
  onOpen: (exception: LaundryException) => void;
}) {
  return (
    <section className="border border-grid-border bg-white" aria-labelledby="exceptions-title">
      <div className="flex h-8 items-center justify-between border-b border-grid-border px-2">
        <h2 id="exceptions-title" className="text-[12px] font-bold uppercase text-slate-600">
          Governed exceptions
        </h2>
        <span className="font-mono text-[11px] text-slate-500">Preview impact before approval</span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[980px] border-collapse text-[12px]" aria-label="Laundry exception table">
          <thead>
            <tr className="bg-slate-50 text-[11px] uppercase text-slate-500">
              {["Exception", "Trigger", "Severity", "Status", "Affected", "Recommendation", "Action"].map((header) => (
                <th key={header} className="h-8 border-b border-r border-grid-border px-2 text-left last:border-r-0">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {exceptions.map((exception) => {
              const status = exceptionStatus[exception.id] ?? exception.status;
              return (
                <tr key={exception.id} className="odd:bg-white even:bg-slate-50/60">
                  <td className="h-9 border-b border-r border-grid-border px-2">
                    <button type="button" onClick={() => onSelect(exception.id)} className="text-left font-mono font-bold text-primary hover:underline">
                      {exception.id}
                      <span className="block font-sans text-[11px] font-semibold text-slate-600">{exception.type}</span>
                    </button>
                  </td>
                  <td className="h-9 border-b border-r border-grid-border px-2">{exception.trigger}</td>
                  <td className="h-9 border-b border-r border-grid-border px-2"><RiskPill tone={exception.severity} /></td>
                  <td className="h-9 border-b border-r border-grid-border px-2"><StatePill state={status} /></td>
                  <td className="h-9 border-b border-r border-grid-border px-2">{exception.affected}</td>
                  <td className="h-9 border-b border-r border-grid-border px-2">{exception.recommendation}</td>
                  <td className="h-9 border-b border-grid-border px-2">
                    <button type="button" onClick={() => onOpen({ ...exception, status })} className="ops-button h-7 min-h-7">
                      Preview
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function AdherenceView({ onOpenKpi }: { onOpenKpi: (kpi: LaundryKpi) => void }) {
  const adherenceKpi = kpis.find((kpi) => kpi.id === "adherence") ?? kpis[0];
  const rows = [
    ["Planned batches", 28, "ON_TRACK"],
    ["Executed as planned", 21, "WATCH"],
    ["Machine changed", 4, "ACTION"],
    ["Sequence changed", 7, "ACTION"],
    ["Delayed start", 5, "WATCH"],
    ["Delayed completion", 3, "WATCH"],
  ] as const;
  return (
    <div className="grid gap-2 xl:grid-cols-[minmax(0,1fr)_340px]">
      <section className="border border-grid-border bg-white" aria-labelledby="adherence-title">
        <div className="flex h-8 items-center justify-between border-b border-grid-border px-2">
          <h2 id="adherence-title" className="text-[12px] font-bold uppercase text-slate-600">Plan adherence panel</h2>
          <button type="button" onClick={() => onOpenKpi(adherenceKpi)} className="ops-button h-7 min-h-7">
            Open adherence drill
          </button>
        </div>
        <div className="grid gap-3 p-3 md:grid-cols-3">
          <AdherenceMetric label="Plan adherence" value={76} tone="WATCH" />
          <AdherenceMetric label="Machine adherence" value={81} tone="WATCH" />
          <AdherenceMetric label="Sequence adherence" value={68} tone="ACTION" />
        </div>
        <div className="border-t border-grid-border p-3">
          <h3 className="mb-2 text-[11px] font-bold uppercase text-slate-500">Deviation reason distribution</h3>
          <div className="space-y-2">
            {[
              ["Machine breakdown", 34, "ACTION"],
              ["Waiting dryer", 26, "ACTION"],
              ["No lot available", 18, "WATCH"],
              ["Changeover delay", 12, "WATCH"],
              ["Recipe/master missing", 10, "ACTION"],
            ].map(([label, value, tone]) => (
              <div key={label}>
                <div className="mb-1 flex justify-between text-[12px]">
                  <span className="font-medium text-slate-700">{label}</span>
                  <span className="font-mono text-slate-500">{value}%</span>
                </div>
                <div className="h-2 bg-slate-100">
                  <div className={`h-full ${barColor(tone as StageState)}`} style={{ width: `${value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="border border-grid-border bg-white" aria-labelledby="adherence-counts-title">
        <div className="flex h-8 items-center border-b border-grid-border px-2">
          <h2 id="adherence-counts-title" className="text-[12px] font-bold uppercase text-slate-600">Shift counts</h2>
        </div>
        <div className="divide-y divide-grid-border">
          {rows.map(([label, value, tone]) => (
            <div key={label} className="grid grid-cols-[1fr_auto_auto] items-center gap-2 px-3 py-2 text-[12px]">
              <span className="font-medium text-slate-700">{label}</span>
              <span className="font-mono text-[16px] font-bold text-primary">{value}</span>
              <RiskPill tone={tone as RiskTone} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function RulesView() {
  return (
    <div className="grid gap-2 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="border border-grid-border bg-white" aria-labelledby="rules-title">
        <div className="flex h-8 items-center justify-between border-b border-grid-border px-2">
          <h2 id="rules-title" className="text-[12px] font-bold uppercase text-slate-600">Machine capability and planning rules</h2>
          <span className="font-mono text-[11px] text-slate-500">Read-only mock</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[760px] border-collapse text-[12px]" aria-label="Machine capability matrix">
            <thead>
              <tr className="bg-slate-50 text-[11px] uppercase text-slate-500">
                {["Machine group", "Eligible wash", "Min / max load", "Restricted customers", "Setup family", "Governance"].map((header) => (
                  <th key={header} className="h-8 border-b border-r border-grid-border px-2 text-left last:border-r-0">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["Tonello 125 kg", "ENZ-STN, RNS-DK", "45 / 125kg", "Northstar preferred only", "Enzyme, rinse", "Firm move requires approval"],
                ["Tonello 150 kg", "HEAVY-BLK, ENZ-STN", "60 / 150kg", "No Blue Harbor acid", "Heavy, black", "Volatile resequence allowed"],
                ["Tolkar", "RNS, ACID-LT", "40 / 110kg", "None", "Rinse, light acid", "Future rough-cut only"],
                ["Dryer", "All wet wash", "30 / 140kg", "Shade-sensitive hold", "Moisture class", "Overload blocks release"],
                ["Shade QC", "All", "Queue by customer", "Northstar 100% check", "Shade family", "QC fail creates rewash child"],
              ].map((row) => (
                <tr key={row[0]} className="odd:bg-white even:bg-slate-50/60">
                  {row.map((cell, index) => (
                    <td key={cell} className={`h-8 border-b border-r border-grid-border px-2 last:border-r-0 ${index === 0 ? "font-bold text-primary" : ""}`}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="border border-grid-border bg-white">
        <div className="flex h-8 items-center border-b border-grid-border px-2">
          <h2 className="text-[12px] font-bold uppercase text-slate-600">Planning-zone governance</h2>
        </div>
        <div className="divide-y divide-grid-border">
          {[
            ["Future", "Resource-group load, tentative batch suggestions, no approval for normal moves."],
            ["Volatile", "Rebatch and resequence with downstream impact and reason capture."],
            ["Firm", "Specific machine, shift, sequence, and batch are frozen; move opens impact preview."],
          ].map(([label, text]) => (
            <div key={label} className="px-3 py-2">
              <p className="font-bold text-primary">{label}</p>
              <p className="text-[12px] text-slate-600">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Inspector({
  selected,
  inspectorTab,
  setInspectorTab,
  exceptionStatus,
  onOpenBatch,
  onOpenRewash,
  onOpenImpact,
}: {
  selected: Selected;
  inspectorTab: string;
  setInspectorTab: (tab: string) => void;
  exceptionStatus: Record<string, LaundryException["status"]>;
  onOpenBatch: (batch: LaundryBatch) => void;
  onOpenRewash: (batch: LaundryBatch) => void;
  onOpenImpact: (source: string) => void;
}) {
  const content = inspectorContent(selected, exceptionStatus);
  const batch = selected.type === "batch" ? batches.find((candidate) => candidate.id === selected.id) : null;

  return (
    <aside className="min-h-[520px] border border-grid-border bg-white" aria-labelledby="selected-inspector-title">
      <div className="flex h-8 items-center justify-between border-b border-grid-border px-2">
        <h2 id="selected-inspector-title" className="truncate text-[12px] font-bold uppercase text-slate-600">
          Selected batch inspector
        </h2>
        <span className="font-mono text-[11px] text-slate-500">{content.kind}</span>
      </div>
      <div className="flex h-9 gap-1 overflow-x-auto border-b border-grid-border px-2">
        {["Summary", "Route", "Capacity", "Quality", "Exceptions", "Audit"].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setInspectorTab(tab)}
            className={`h-9 shrink-0 border-b-2 px-2 text-[12px] font-bold ${
              inspectorTab === tab ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-primary"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="p-3">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            <p className="font-mono text-[12px] font-bold text-primary">{content.title}</p>
            <p className="text-[12px] text-slate-600">{content.subtitle}</p>
          </div>
          <RiskPill tone={content.tone} />
        </div>
        <div className="space-y-1">
          {content.rows.map((row) => (
            <InfoRow key={row.label} label={row.label} value={row.value} />
          ))}
        </div>
        <div className="mt-4">
          {inspectorTab === "Summary" ? <InsightBlock title="Next valid action" body={content.action} /> : null}
          {inspectorTab === "Route" ? <RouteBlock selected={selected} /> : null}
          {inspectorTab === "Capacity" ? <CapacityImpactBlock /> : null}
          {inspectorTab === "Quality" ? <QualityBlock selected={selected} /> : null}
          {inspectorTab === "Exceptions" ? <ExceptionMiniList /> : null}
          {inspectorTab === "Audit" ? <AuditBlock /> : null}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {batch ? (
            <button type="button" className="ops-button justify-center" onClick={() => onOpenBatch(batch)}>
              Open detail
            </button>
          ) : (
            <button type="button" className="ops-button justify-center" onClick={() => onOpenImpact(content.title)}>
              Impact preview
            </button>
          )}
          {batch ? (
            <button type="button" className="ops-button ops-button-primary justify-center" onClick={() => (batch.quality.includes("pending") || batch.quality.includes("Pending") ? onOpenImpact(batch.id) : onOpenRewash(batch))}>
              {batch.quality.includes("pending") || batch.quality.includes("Pending") ? "Preview move" : "Create rewash"}
            </button>
          ) : (
            <button type="button" className="ops-button ops-button-primary justify-center" onClick={() => onOpenImpact(content.title)}>
              Preview action
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}

function DrillModal({
  modal,
  exceptionStatus,
  onClose,
  onApproveMove,
  onApproveException,
  onFeedback,
}: {
  modal: Modal;
  exceptionStatus: Record<string, LaundryException["status"]>;
  onClose: () => void;
  onApproveMove: (move?: PendingMove) => void;
  onApproveException: (exception: LaundryException) => void;
  onFeedback: (message: string) => void;
}) {
  const title = modalTitle(modal);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-4" role="presentation">
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[90vh] w-full max-w-4xl overflow-hidden border border-grid-border bg-white shadow-xl"
      >
        <div className="flex h-11 items-center justify-between border-b border-grid-border px-3">
          <h2 className="text-[15px] font-bold text-primary">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close modal" className="flex h-8 w-8 items-center justify-center border border-grid-border hover:bg-slate-50">
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <div className="max-h-[calc(90vh-92px)] overflow-y-auto p-3">
          {modal.type === "kpi" ? <KpiDrill kpi={modal.kpi} /> : null}
          {modal.type === "capacity" ? <CapacityDrill row={modal.row} cell={modal.cell} /> : null}
          {modal.type === "batch" ? <BatchDrill batch={modal.batch} /> : null}
          {modal.type === "machine" ? <MachineDrill machine={modal.machine} /> : null}
          {modal.type === "exception" ? <ExceptionDrill exception={{ ...modal.exception, status: exceptionStatus[modal.exception.id] ?? modal.exception.status }} /> : null}
          {modal.type === "impact" ? <ImpactPreview move={modal.move} source={modal.source} /> : null}
          {modal.type === "idle" ? <IdleDrill machine={modal.machine} slot={modal.slot} /> : null}
          {modal.type === "rewash" ? <RewashDrill batch={modal.batch} /> : null}
        </div>
        <div className="flex min-h-12 items-center justify-end gap-2 border-t border-grid-border bg-slate-50 px-3">
          <button type="button" className="ops-button" onClick={onClose}>Close</button>
          {modal.type === "impact" ? (
            <button type="button" className="ops-button ops-button-primary" onClick={() => onApproveMove(modal.move)}>
              Approve and apply
            </button>
          ) : null}
          {modal.type === "exception" ? (
            <button type="button" className="ops-button ops-button-primary" onClick={() => onApproveException(modal.exception)}>
              Approve exception
            </button>
          ) : null}
          {modal.type === "idle" ? (
            <button
              type="button"
              className="ops-button ops-button-primary"
              onClick={() => {
                onFeedback(`Idle reason captured for ${modal.machine.name}: ${modal.slot.detail}.`);
                onClose();
              }}
            >
              Capture reason
            </button>
          ) : null}
          {modal.type === "rewash" ? (
            <button
              type="button"
              className="ops-button ops-button-primary"
              onClick={() => {
                onFeedback(`Rewash child batch created for ${modal.batch.id}; reserve capacity recalculated.`);
                onClose();
              }}
            >
              Create child batch
            </button>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function KpiDrill({ kpi }: { kpi: LaundryKpi }) {
  return (
    <div className="grid gap-3 lg:grid-cols-[1fr_280px]">
      <section className="border border-grid-border p-3">
        <h3 className="mb-2 text-[12px] font-bold uppercase text-slate-500">Explanation</h3>
        <p className="text-[13px] leading-5 text-slate-700">{kpi.detail.cause}</p>
        <div className="mt-4 space-y-2">
          {kpi.detail.trend.map((row) => (
            <div key={row.label}>
              <div className="mb-1 flex justify-between text-[12px]">
                <span>{row.label}</span>
                <span className="font-mono">{row.value}{kpi.id === "idle" ? "h" : "%"}</span>
              </div>
              <div className="h-2 bg-slate-100">
                <div className={`h-full ${barColor(kpi.tone)}`} style={{ width: `${Math.min(row.value, 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="space-y-3">
        <ModalList title="Affected machines, batches, and orders" rows={kpi.detail.affected} />
        <ModalList title="Suggested actions" rows={kpi.detail.suggestions} numbered />
      </section>
    </div>
  );
}

function CapacityDrill({ row, cell }: { row: CapacityRow; cell: CapacityCell }) {
  return (
    <div className="grid gap-3 lg:grid-cols-3">
      <ModalMetric label="Machine group" value={row.group} />
      <ModalMetric label="Date / shift" value={cell.label} />
      <ModalMetric label="Overload" value={`${Math.max(cell.planned - 100, 0)}%`} tone={cell.state} />
      <section className="border border-grid-border p-3 lg:col-span-2">
        <h3 className="mb-2 text-[12px] font-bold uppercase text-slate-500">Load contributors</h3>
        <p className="text-[13px] text-slate-700">{cell.note}</p>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          <ModalMetric label="Available" value={`${cell.available} min`} />
          <ModalMetric label="Planned" value={`${cell.planned}%`} tone={cell.state} />
          <ModalMetric label="Batch count" value={String(cell.batches)} />
        </div>
      </section>
      <ModalList title="Recovery action" rows={[cell.action, "Recalculate affected shipments", "Keep audit event append-only"]} numbered />
    </div>
  );
}

function BatchDrill({ batch }: { batch: LaundryBatch }) {
  return (
    <div className="grid gap-3 lg:grid-cols-[1fr_300px]">
      <section className="border border-grid-border p-3">
        <h3 className="mb-2 text-[12px] font-bold uppercase text-slate-500">Route and progress</h3>
        <div className="mb-3 flex flex-wrap items-center gap-1">
          {batch.route.map((step, index) => (
            <span key={step} className="inline-flex items-center gap-1">
              <span className={`border px-2 py-1 text-[11px] font-bold ${step === batch.step ? "border-primary bg-primary text-white" : "border-grid-border bg-white text-slate-600"}`}>
                {step}
              </span>
              {index < batch.route.length - 1 ? <ArrowRight className="h-3 w-3 text-slate-300" aria-hidden /> : null}
            </span>
          ))}
        </div>
        <div className="grid gap-2 md:grid-cols-3">
          <ModalMetric label="Order" value={batch.order} />
          <ModalMetric label="Quantity" value={`${batch.qty.toLocaleString()} pcs`} />
          <ModalMetric label="Load" value={`${batch.kg}kg`} />
          <ModalMetric label="Recipe" value={batch.recipe} />
          <ModalMetric label="Machine" value={batch.machine} />
          <ModalMetric label="Risk" value={batch.reason} tone={batch.risk} />
        </div>
      </section>
      <section className="space-y-3">
        <ModalList title="Compatible alternate machines" rows={batch.alternates} />
        <ModalList title="Available actions" rows={["Preview machine move", "Create rewash child", "Open exception approval", "Lock current sequence"]} numbered />
      </section>
    </div>
  );
}

function MachineDrill({ machine }: { machine: TimelineMachine }) {
  return (
    <div className="grid gap-3 lg:grid-cols-[1fr_300px]">
      <section className="border border-grid-border p-3">
        <h3 className="mb-2 text-[12px] font-bold uppercase text-slate-500">Utilisation and queue</h3>
        <div className="grid gap-2 md:grid-cols-3">
          <ModalMetric label="Machine" value={machine.name} />
          <ModalMetric label="Current state" value={<StatePill state={machine.state} />} />
          <ModalMetric label="Utilisation" value={`${machine.utilisation}%`} tone={machine.state} />
        </div>
        <p className="mt-3 text-[13px] text-slate-700">{machine.queue}</p>
      </section>
      <ModalList
        title="Current slots"
        rows={machine.slots.map((slot) => `${slot.bucket} / ${slot.label} / ${slot.detail}`)}
      />
    </div>
  );
}

function ExceptionDrill({ exception }: { exception: LaundryException }) {
  return (
    <div className="grid gap-3 lg:grid-cols-[1fr_300px]">
      <section className="border border-grid-border p-3">
        <h3 className="mb-2 text-[12px] font-bold uppercase text-slate-500">Current issue</h3>
        <p className="text-[13px] leading-5 text-slate-700">{exception.trigger}</p>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <ModalMetric label="Affected" value={exception.affected} />
          <ModalMetric label="Capacity impact" value={exception.impact} tone={exception.severity} />
          <ModalMetric label="Approval" value={exception.approval} />
          <ModalMetric label="Status" value={<StatePill state={exception.status} />} />
        </div>
      </section>
      <ModalList title="Suggested recovery" rows={[exception.recommendation, "Show affected shipments", "Record approval reason"]} numbered />
    </div>
  );
}

function ImpactPreview({ move, source }: { move?: PendingMove; source: string }) {
  const target = move ? `${move.batchId} -> ${machineLabel(move.machineId)} / ${move.bucket}` : "Suggested recovery action";
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <section className="border border-grid-border p-3">
        <h3 className="mb-2 text-[12px] font-bold uppercase text-slate-500">Before</h3>
        <div className="space-y-2">
          <ModalMetric label="Source" value={source} />
          <ModalMetric label="Dryer Shift B load" value="118%" tone="CRITICAL" />
          <ModalMetric label="Late-risk batches" value="3 red / 2 amber" tone="ACTION" />
          <ModalMetric label="Idle on Tonello 125-2" value="2.5h" tone="ACTION" />
        </div>
      </section>
      <section className="border border-grid-border p-3">
        <h3 className="mb-2 text-[12px] font-bold uppercase text-slate-500">After</h3>
        <div className="space-y-2">
          <ModalMetric label="Target action" value={target} />
          <ModalMetric label="Dryer Shift B load" value="96%" tone="ON_TRACK" />
          <ModalMetric label="Late-risk batches" value="1 red / 2 amber" tone="WATCH" />
          <ModalMetric label="Changeover impact" value="+20 min" tone="WATCH" />
        </div>
      </section>
      <section className="border border-grid-border p-3 lg:col-span-2">
        <h3 className="mb-2 text-[12px] font-bold uppercase text-slate-500">Approval requirements</h3>
        <div className="grid gap-2 md:grid-cols-3">
          <ModalMetric label="Customer rule" value="Preferred-machine exception required" tone="WATCH" />
          <ModalMetric label="Affected orders" value="ORD-1088, ORD-1092, ORD-1101" />
          <ModalMetric label="Audit event" value="Append-only approval note" />
        </div>
      </section>
    </div>
  );
}

function IdleDrill({ machine, slot }: { machine: TimelineMachine; slot: TimelineSlot }) {
  return (
    <div className="grid gap-3 lg:grid-cols-[1fr_300px]">
      <section className="border border-grid-border p-3">
        <h3 className="mb-2 text-[12px] font-bold uppercase text-slate-500">Idle reason capture</h3>
        <p className="text-[13px] text-slate-700">{machine.name} at {slot.bucket}: {slot.detail}</p>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          {["No lot available", "Waiting prior process", "Machine breakdown", "Dryer not available", "Operator unavailable", "Recipe missing"].map((reason) => (
            <label key={reason} className="flex items-center gap-2 border border-grid-border px-2 py-2 text-[12px]">
              <input type="radio" name="idle-reason" defaultChecked={reason === "Waiting prior process"} className="accent-primary" />
              {reason}
            </label>
          ))}
        </div>
      </section>
      <ModalList title="Preventive actions" rows={["Fill idle capacity with W-217", "Escalate late sewn WIP", "Protect Dryer 03 recovery slot"]} numbered />
    </div>
  );
}

function RewashDrill({ batch }: { batch: LaundryBatch }) {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <section className="border border-grid-border p-3">
        <h3 className="mb-2 text-[12px] font-bold uppercase text-slate-500">Child batch</h3>
        <InfoRow label="Parent batch" value={batch.id} />
        <InfoRow label="Reason" value="Shade delta outside tolerance" />
        <InfoRow label="Reserve impact" value="70 min / reserve remains 72%" />
        <InfoRow label="Shipment impact" value="Amber, no red escalation" />
      </section>
      <ModalList title="Governance" rows={["QC lead confirmation required", "Capacity reserve consumed", "Parent batch audit linked"]} numbered />
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid min-h-7 grid-cols-[132px_minmax(0,1fr)] gap-2 border-b border-grid-border py-1 text-[12px]">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-slate-900">{value}</span>
    </div>
  );
}

function ModalMetric({ label, value, tone }: { label: string; value: ReactNode; tone?: StageState }) {
  return (
    <div className={`border border-grid-border border-l-4 bg-white p-2 ${tone ? leftBorder(tone) : "border-l-transparent"}`}>
      <p className="text-[11px] font-bold uppercase text-slate-500">{label}</p>
      <div className="mt-1 text-[13px] font-semibold text-primary">{value}</div>
    </div>
  );
}

function ModalList({ title, rows, numbered = false }: { title: string; rows: string[]; numbered?: boolean }) {
  return (
    <section className="border border-grid-border p-3">
      <h3 className="mb-2 text-[12px] font-bold uppercase text-slate-500">{title}</h3>
      <div className="space-y-2">
        {rows.map((row, index) => (
          <div key={`${row}-${index}`} className="grid grid-cols-[24px_1fr] gap-2 text-[12px]">
            <span className="flex h-5 w-5 items-center justify-center bg-slate-100 font-mono text-[10px] font-bold text-slate-600">
              {numbered ? index + 1 : <CheckCircle2 className="h-3 w-3" aria-hidden />}
            </span>
            <span className="text-slate-700">{row}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function InsightBlock({ title, body }: { title: string; body: string }) {
  return (
    <section className="border border-primary bg-primary p-3 text-white">
      <h3 className="text-[11px] font-bold uppercase text-slate-300">{title}</h3>
      <p className="mt-1 text-[13px] font-semibold leading-5">{body}</p>
    </section>
  );
}

function RouteBlock({ selected }: { selected: Selected }) {
  const batch = selected.type === "batch" ? batches.find((candidate) => candidate.id === selected.id) : batches[0];
  return (
    <div className="space-y-2">
      {batch?.route.map((step) => (
        <div key={step} className={`border px-2 py-2 text-[12px] ${step === batch.step ? "border-primary bg-primary text-white" : "border-grid-border bg-white text-slate-700"}`}>
          {step}
        </div>
      ))}
    </div>
  );
}

function CapacityImpactBlock() {
  return (
    <div className="grid grid-cols-2 gap-2">
      <ModalMetric label="Before dryer load" value="118%" tone="CRITICAL" />
      <ModalMetric label="After recovery" value="96%" tone="ON_TRACK" />
      <ModalMetric label="Overload removed" value="220 min" tone="ON_TRACK" />
      <ModalMetric label="Changeover added" value="20 min" tone="WATCH" />
    </div>
  );
}

function QualityBlock({ selected }: { selected: Selected }) {
  const batch = selected.type === "batch" ? batches.find((candidate) => candidate.id === selected.id) : null;
  return (
    <div className="space-y-2">
      <InfoRow label="QC status" value={batch?.quality ?? "Flow-stage quality status"} />
      <InfoRow label="Rewash reserve" value="85% protected" />
      <InfoRow label="Shade family" value={batch?.shade ?? "Multiple"} />
    </div>
  );
}

function ExceptionMiniList() {
  return (
    <div className="space-y-2">
      {exceptions.slice(0, 3).map((exception) => (
        <div key={exception.id} className="border border-grid-border px-2 py-2">
          <div className="flex justify-between gap-2">
            <span className="font-mono text-[12px] font-bold text-primary">{exception.id}</span>
            <RiskPill tone={exception.severity} />
          </div>
          <p className="mt-1 text-[11px] text-slate-500">{exception.type}</p>
        </div>
      ))}
    </div>
  );
}

function AuditBlock() {
  return (
    <div className="space-y-3 border-l border-grid-border pl-3">
      {[
        ["12:24", "Impact preview opened for dryer recovery"],
        ["12:12", "Dryer 02 idle reason updated"],
        ["11:58", "Tonello 125-2 breakdown exception previewed"],
      ].map(([time, event]) => (
        <div key={event} className="relative">
          <span className="absolute -left-[17px] top-1 h-2 w-2 rounded-full bg-primary" />
          <p className="font-mono text-[11px] text-slate-500">{time}</p>
          <p className="text-[12px] font-medium text-slate-700">{event}</p>
        </div>
      ))}
    </div>
  );
}

function AdherenceMetric({ label, value, tone }: { label: string; value: number; tone: RiskTone }) {
  return (
    <div className="border border-grid-border p-3">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-bold text-slate-600">{label}</span>
        <RiskPill tone={tone} />
      </div>
      <div className="mt-3 h-2 bg-slate-100">
        <div className={`h-full ${barColor(tone)}`} style={{ width: `${value}%` }} />
      </div>
      <p className="mt-2 font-mono text-[20px] font-bold text-primary">{value}%</p>
    </div>
  );
}

function ValueMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-white/15 p-2">
      <p className="text-[10px] font-bold uppercase text-slate-300">{label}</p>
      <p className="font-mono text-[18px] font-bold text-white">{value}</p>
    </div>
  );
}

function MiniLoad({ value, actual }: { value: number; actual?: number }) {
  const tone = value >= 115 ? "CRITICAL" : value > 100 ? "ACTION" : value >= 92 ? "WATCH" : "ON_TRACK";
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-2">
        <div className="h-2 flex-1 bg-slate-100">
          <div className={`h-full ${barColor(tone)}`} style={{ width: `${Math.min(value, 128)}%` }} />
        </div>
        <span className={`w-10 text-right font-mono text-[11px] ${value > 100 ? "font-bold text-risk-action" : "text-slate-600"}`}>{value}%</span>
      </div>
      {actual !== undefined ? <p className="mt-0.5 font-mono text-[10px] text-slate-500">Actual {actual}%</p> : null}
    </div>
  );
}

function RiskPill({ tone }: { tone: RiskTone }) {
  const label = tone === "ON_TRACK" ? "On track" : tone === "WATCH" ? "Watch" : tone === "ACTION" ? "Action" : "Critical";
  return (
    <span className={`inline-flex h-5 items-center rounded-full px-2 text-[10px] font-bold uppercase ${pillClass(tone)}`}>
      {label}
    </span>
  );
}

function StatePill({ state }: { state: string }) {
  const normalized = state.toUpperCase();
  const tone: RiskTone =
    normalized.includes("CRITICAL") || normalized.includes("BLOCK") || normalized.includes("NOT_READY")
      ? "CRITICAL"
      : normalized.includes("ACTION") || normalized.includes("HOLD") || normalized.includes("APPROVAL")
        ? "ACTION"
        : normalized.includes("WATCH") || normalized.includes("PREVIEW") || normalized.includes("UNDER")
          ? "WATCH"
          : "ON_TRACK";
  return (
    <span className={`inline-flex h-5 items-center rounded-full px-2 text-[10px] font-bold uppercase ${pillClass(tone)}`}>
      {state}
    </span>
  );
}

function StateDot({ state }: { state: StageState }) {
  return <span className={`h-2.5 w-2.5 rounded-full ${barColor(state)}`} aria-hidden />;
}

function resolvedSlot(machine: TimelineMachine, bucket: string, moves: Record<string, PendingMove>): TimelineSlot {
  const movedHere = Object.values(moves).find((move) => move.machineId === machine.id && move.bucket === bucket);
  if (movedHere) {
    return {
      bucket,
      label: movedHere.batchId,
      type: "batch",
      batchId: movedHere.batchId,
      detail: "Approved moved batch",
      tone: movedHere.batchId === "W-211" ? "CRITICAL" : "WATCH",
    };
  }

  const base = machine.slots.find((slot) => slot.bucket === bucket);
  if (!base) {
    return { bucket, label: "Open", type: "open", detail: "Open capacity", tone: "ON_TRACK" };
  }

  if (base.batchId && moves[base.batchId]) {
    return { bucket, label: "Open", type: "open", detail: `${base.batchId} moved`, tone: "ON_TRACK" };
  }

  return base;
}

function inspectorContent(selected: Selected, exceptionStatus: Record<string, LaundryException["status"]>) {
  if (selected.type === "stage") {
    const stage = flowStages.find((candidate) => candidate.id === selected.id) ?? flowStages[0];
    return {
      kind: "Stage",
      title: stage.name,
      subtitle: stage.reason,
      tone: riskTone(stage.state),
      action: stage.imbalance,
      rows: [
        { label: "WIP", value: stage.wip },
        { label: "Oldest age", value: stage.age },
        { label: "Planned load", value: `${stage.load}%` },
        { label: "Capacity", value: stage.capacity },
        { label: "Machines", value: stage.machines },
        { label: "Risk count", value: String(stage.riskCount) },
      ],
    };
  }

  if (selected.type === "machine") {
    const machine = timelineMachines.find((candidate) => candidate.id === selected.id) ?? timelineMachines[0];
    return {
      kind: "Machine",
      title: machine.name,
      subtitle: machine.queue,
      tone: riskTone(machine.state),
      action: machine.state === "CRITICAL" ? "Preview overload recovery before wet release." : "Keep sequence and monitor actual overlay.",
      rows: [
        { label: "Group", value: machine.group },
        { label: "State", value: <StatePill state={machine.state} /> },
        { label: "Utilisation", value: `${machine.utilisation}%` },
        { label: "Queue", value: machine.queue },
      ],
    };
  }

  if (selected.type === "capacity") {
    const row = capacityRows.find((candidate) => candidate.id === selected.rowId) ?? capacityRows[0];
    const cell = row.cells.find((candidate) => candidate.key === selected.cellKey) ?? row.cells[0];
    const tone = riskTone(cell.state);
    return {
      kind: "Capacity",
      title: `${row.group} / ${cell.label}`,
      subtitle: cell.note,
      tone,
      action: cell.action,
      rows: [
        { label: "Available", value: `${cell.available} min` },
        { label: "Planned", value: `${cell.planned}%` },
        { label: "Actual", value: `${cell.actual}%` },
        { label: "Batches", value: String(cell.batches) },
        { label: "Reserve", value: `${cell.reserve}%` },
      ],
    };
  }

  if (selected.type === "exception") {
    const exception = exceptions.find((candidate) => candidate.id === selected.id) ?? exceptions[0];
    const status = exceptionStatus[exception.id] ?? exception.status;
    return {
      kind: "Exception",
      title: `${exception.id} / ${exception.type}`,
      subtitle: exception.trigger,
      tone: exception.severity,
      action: exception.recommendation,
      rows: [
        { label: "Status", value: <StatePill state={status} /> },
        { label: "Affected", value: exception.affected },
        { label: "Impact", value: exception.impact },
        { label: "Approval", value: exception.approval },
      ],
    };
  }

  if (selected.type === "demand") {
    const demand = demandRows.find((candidate) => candidate.id === selected.id) ?? demandRows[0];
    return {
      kind: "Demand",
      title: demand.order,
      subtitle: `${demand.customer} / ${demand.style}`,
      tone: demand.risk,
      action: demand.readiness === "READY" ? "Add to compatible batch and preview capacity." : "Resolve readiness before scheduling.",
      rows: [
        { label: "Wash code", value: demand.washCode },
        { label: "Qty / kg", value: `${demand.qty.toLocaleString()} / ${demand.kg}kg` },
        { label: "Shade", value: demand.shade },
        { label: "Readiness", value: <StatePill state={demand.readiness} /> },
        { label: "Latest start", value: demand.latestStart },
      ],
    };
  }

  const batch = batches.find((candidate) => candidate.id === selected.id) ?? batches[0];
  return {
    kind: "Batch",
    title: `${batch.id} / ${batch.order}`,
    subtitle: `${batch.customer} / ${batch.washCode}`,
    tone: batch.risk,
    action: batch.reason,
    rows: [
      { label: "PO", value: batch.po },
      { label: "Style", value: batch.style },
      { label: "Qty / kg", value: `${batch.qty.toLocaleString()} / ${batch.kg}kg` },
      { label: "Shade lot", value: batch.shade },
      { label: "Current step", value: batch.step },
      { label: "Machine", value: batch.machine },
      { label: "Planned", value: batch.planned },
      { label: "Actual", value: batch.actual },
      { label: "Due", value: batch.due },
    ],
  };
}

function modalTitle(modal: Modal) {
  if (modal.type === "kpi") return `KPI: ${modal.kpi.label}`;
  if (modal.type === "capacity") return `${modal.row.group} / ${modal.cell.label}`;
  if (modal.type === "batch") return `Batch detail ${modal.batch.id}`;
  if (modal.type === "machine") return `Machine utilisation ${modal.machine.name}`;
  if (modal.type === "exception") return `Exception approval ${modal.exception.id}`;
  if (modal.type === "impact") return modal.title;
  if (modal.type === "idle") return `Idle reason ${modal.machine.name} ${modal.slot.bucket}`;
  return `Rewash creation ${modal.batch.id}`;
}

function machineLabel(machineId: string) {
  return timelineMachines.find((machine) => machine.id === machineId)?.name ?? machineId;
}

function riskTone(tone: StageState): RiskTone {
  if (tone === "IDLE" || tone === "BLOCKED") return "ACTION";
  return tone;
}

function leftBorder(tone: StageState) {
  if (tone === "CRITICAL" || tone === "BLOCKED") return "border-l-risk-critical";
  if (tone === "ACTION") return "border-l-risk-action";
  if (tone === "WATCH" || tone === "IDLE") return "border-l-risk-watch";
  return "border-l-risk-on-track";
}

function barColor(tone: StageState) {
  if (tone === "CRITICAL" || tone === "BLOCKED") return "bg-risk-critical";
  if (tone === "ACTION") return "bg-risk-action";
  if (tone === "WATCH" || tone === "IDLE") return "bg-risk-watch";
  return "bg-risk-on-track";
}

function pillClass(tone: RiskTone) {
  if (tone === "CRITICAL") return "bg-slate-900 text-white";
  if (tone === "ACTION") return "bg-risk-action/10 text-risk-action";
  if (tone === "WATCH") return "bg-risk-watch/10 text-risk-watch";
  return "bg-risk-on-track/10 text-emerald-700";
}

function slotBg(type: TimelineSlot["type"], tone: StageState) {
  if (type === "open") return "border-dashed border-grid-border bg-slate-50 text-slate-500";
  if (type === "setup") return "border-risk-watch/30 bg-risk-watch/10";
  if (type === "down") return "border-risk-action/30 bg-risk-action/10";
  if (type === "idle") return "border-slate-300 bg-slate-100";
  if (type === "overload") return "border-risk-critical bg-slate-900 text-white";
  if (tone === "CRITICAL") return "border-risk-critical bg-slate-900 text-white";
  if (tone === "ACTION") return "border-risk-action/40 bg-risk-action/10";
  if (tone === "WATCH") return "border-risk-watch/40 bg-risk-watch/10";
  return "border-emerald-200 bg-emerald-50";
}

function slotIcon(type: TimelineSlot["type"]) {
  if (type === "setup") return <SlidersHorizontal className="h-3 w-3 shrink-0 text-risk-watch" aria-hidden />;
  if (type === "down") return <Wrench className="h-3 w-3 shrink-0 text-risk-action" aria-hidden />;
  if (type === "idle") return <PauseCircle className="h-3 w-3 shrink-0 text-slate-500" aria-hidden />;
  if (type === "overload") return <AlertTriangle className="h-3 w-3 shrink-0 text-white" aria-hidden />;
  if (type === "open") return <Play className="h-3 w-3 shrink-0 text-slate-400" aria-hidden />;
  return <Waves className="h-3 w-3 shrink-0 text-slate-400" aria-hidden />;
}
