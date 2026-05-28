import type { ReactNode } from "react";

import { RiskBadge, StatusBadge } from "@/shared/badges";
import type { RiskStatus } from "@/types/domain";

export function PrototypeHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div>
        <h1 className="text-[20px] font-semibold leading-7 text-primary">{title}</h1>
        {subtitle ? <p className="text-[13px] leading-5 text-slate-600">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap justify-end gap-2">{actions}</div> : null}
    </div>
  );
}

export function KpiGrid({ children, columns = 4 }: { children: ReactNode; columns?: 3 | 4 | 5 }) {
  const gridClass = {
    3: "lg:grid-cols-3",
    4: "lg:grid-cols-4",
    5: "lg:grid-cols-5",
  }[columns];
  return <div className={`mb-3 grid gap-3 md:grid-cols-2 ${gridClass}`}>{children}</div>;
}

export function KpiTile({
  label,
  value,
  meta,
  risk,
  active = false,
}: {
  label: string;
  value: ReactNode;
  meta?: ReactNode;
  risk?: RiskStatus;
  active?: boolean;
}) {
  const border = risk === "CRITICAL" ? "border-l-risk-critical" : risk === "ACTION" ? "border-l-risk-action" : risk === "WATCH" ? "border-l-risk-watch" : active ? "border-l-primary" : "border-l-transparent";
  return (
    <div className={`border border-grid-border border-l-4 ${border} bg-white p-3`}>
      <p className="text-[11px] font-bold uppercase tracking-[0.05em] text-slate-500">{label}</p>
      <div className="mt-1 flex items-baseline justify-between gap-2">
        <span className="text-[22px] font-semibold leading-7 text-primary">{value}</span>
        {risk ? <RiskBadge risk={risk} /> : meta}
      </div>
      {meta && risk ? <div className="mt-2 text-[11px] font-medium text-slate-500">{meta}</div> : null}
    </div>
  );
}

export function PrototypeTabs({ tabs }: { tabs: Array<{ label: string; active?: boolean }> }) {
  return (
    <div className="mb-3 flex h-10 items-center gap-6 border border-grid-border bg-white px-3">
      {tabs.map((tab) => (
        <button
          key={tab.label}
          type="button"
          className={`h-full border-b-2 px-1 text-[13px] font-semibold transition-colors ${
            tab.active ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-primary"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <h3 className="mb-3 text-[11px] font-bold uppercase tracking-[0.05em] text-slate-500">{children}</h3>;
}

export function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex justify-between gap-3 border-b border-grid-border py-1.5 text-[13px]">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-slate-900">{value}</span>
    </div>
  );
}

export function ProgressBar({ value, risk }: { value: number; risk?: RiskStatus }) {
  const color = risk === "CRITICAL" ? "bg-risk-critical" : risk === "ACTION" ? "bg-risk-action" : risk === "WATCH" ? "bg-risk-watch" : "bg-risk-on-track";
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 flex-1 overflow-hidden rounded-sm bg-slate-100">
        <div className={`h-full ${color}`} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
      <span className={`w-10 text-right font-mono text-[11px] ${value > 100 ? "font-bold text-risk-action" : "text-slate-600"}`}>
        {value}%
      </span>
    </div>
  );
}

export function ChecklistRows({
  rows,
}: {
  rows: Array<{ label: string; status: string; passed?: boolean; note?: string }>;
}) {
  return (
    <div className="divide-y divide-grid-border border border-grid-border bg-white">
      {rows.map((row) => (
        <div key={row.label} className="grid min-h-11 grid-cols-[20px_1fr_auto] items-center gap-3 px-3 py-2">
          <input checked={row.passed} readOnly type="checkbox" className="h-4 w-4 rounded border-grid-border accent-primary" />
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium text-slate-800">{row.label}</p>
            {row.note ? <p className="truncate text-[11px] text-slate-500">{row.note}</p> : null}
          </div>
          <StatusBadge status={row.status} />
        </div>
      ))}
    </div>
  );
}

export function Timeline({
  rows,
}: {
  rows: Array<{ title: string; meta: string; tone?: RiskStatus; detail?: string }>;
}) {
  return (
    <div className="relative space-y-5 pl-6 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-px before:bg-grid-border">
      {rows.map((row, index) => {
        const dot = row.tone === "CRITICAL" ? "bg-risk-critical" : row.tone === "ACTION" ? "bg-risk-action" : row.tone === "WATCH" ? "bg-risk-watch" : "bg-risk-on-track";
        return (
          <div key={`${row.title}-${row.meta}-${index}`} className="relative">
            <span className={`absolute -left-[22px] top-1 h-3 w-3 rounded-full border-2 border-white ${dot}`} />
            <p className="text-[13px] font-bold text-primary">{row.title}</p>
            <p className="text-[11px] text-slate-500">{row.meta}</p>
            {row.detail ? <p className="mt-1 text-[12px] text-risk-action">{row.detail}</p> : null}
          </div>
        );
      })}
    </div>
  );
}
