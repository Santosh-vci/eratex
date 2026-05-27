import type { ReactNode } from "react";

export function ModuleHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <header className="ops-module-header">
      <div>
        <h2 className="text-[20px] font-semibold leading-7 text-slate-950">{title}</h2>
        <p className="mt-0.5 max-w-4xl text-[13px] leading-[18px] text-slate-600">{description}</p>
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap justify-end gap-2">{actions}</div> : null}
    </header>
  );
}

export function FilterBar({ children }: { children: ReactNode }) {
  return <div className="ops-filterbar">{children}</div>;
}

export function ActionButton({
  children,
  onClick,
  variant = "primary",
  disabled = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost";
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={variant === "primary" ? "ops-button ops-button-primary" : "ops-button"}
    >
      {children}
    </button>
  );
}

export function MetricStrip({
  metrics,
}: {
  metrics: Array<{ label: string; value: ReactNode; meta?: ReactNode }>;
}) {
  return (
    <dl className="ops-kpi-strip">
      {metrics.map((metric) => (
        <div key={metric.label} className="ops-kpi">
          <dt className="text-[11px] font-bold uppercase tracking-[0.05em] text-slate-500">
            {metric.label}
          </dt>
          <dd className="mt-1 flex items-center justify-between gap-2 text-[18px] font-semibold leading-6 text-slate-950">
            <span>{metric.value}</span>
            {metric.meta}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function Panel({
  title,
  eyebrow,
  children,
  actions,
}: {
  title?: string;
  eyebrow?: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section className="ops-panel">
      {title || eyebrow || actions ? (
        <div className="flex min-h-10 items-center justify-between gap-2 border-b border-grid-border px-3 py-2">
          <div>
            {eyebrow ? (
              <p className="text-[11px] font-bold uppercase tracking-[0.05em] text-slate-500">{eyebrow}</p>
            ) : null}
            {title ? <h3 className="text-sm font-semibold text-slate-950">{title}</h3> : null}
          </div>
          {actions}
        </div>
      ) : null}
      <div className="p-3">{children}</div>
    </section>
  );
}
