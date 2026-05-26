type BadgeTone = "green" | "yellow" | "red" | "black" | "slate";

const toneClass: Record<BadgeTone, string> = {
  green: "bg-emerald-50 text-emerald-700 border-emerald-200",
  yellow: "bg-amber-50 text-amber-700 border-amber-200",
  red: "bg-red-50 text-red-700 border-red-200",
  black: "bg-slate-950 text-white border-slate-950",
  slate: "bg-slate-100 text-slate-700 border-slate-200",
};

function Badge({ label, tone }: { label: string; tone: BadgeTone }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.05em] ${toneClass[tone]}`}
    >
      {label}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge label={status.replaceAll("_", " ")} tone="slate" />;
}

export function RiskBadge({ risk }: { risk: "ON_TRACK" | "WATCH" | "ACTION" | "CRITICAL" }) {
  const tone = {
    ON_TRACK: "green",
    WATCH: "yellow",
    ACTION: "red",
    CRITICAL: "black",
  } satisfies Record<typeof risk, BadgeTone>;
  return <Badge label={risk.replaceAll("_", " ")} tone={tone[risk]} />;
}

export function SeverityBadge({ severity }: { severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" }) {
  const tone = {
    LOW: "green",
    MEDIUM: "yellow",
    HIGH: "red",
    CRITICAL: "black",
  } satisfies Record<typeof severity, BadgeTone>;
  return <Badge label={severity} tone={tone[severity]} />;
}

export function OwnerBadge({ owner }: { owner: string }) {
  return <Badge label={owner} tone="slate" />;
}

export function StaleDataBadge({ minutes }: { minutes: number }) {
  return <Badge label={`SYNC ${minutes}M AGO`} tone={minutes > 15 ? "red" : "green"} />;
}

export function SyncStatusBadge({ status }: { status: "SYNCED" | "PENDING" | "FAILED" }) {
  const tone = {
    SYNCED: "green",
    PENDING: "yellow",
    FAILED: "red",
  } satisfies Record<typeof status, BadgeTone>;
  return <Badge label={status} tone={tone[status]} />;
}
