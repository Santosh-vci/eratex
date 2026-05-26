import type { ReactNode } from "react";

export function Breadcrumbs({ items }: { items: string[] }) {
  return (
    <nav className="text-xs text-slate-500">
      {items.map((item, index) => (
        <span key={item}>
          {index > 0 ? " / " : null}
          {item}
        </span>
      ))}
    </nav>
  );
}

export function ModuleHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">{eyebrow}</p>
        <h2 className="mt-1 text-xl font-semibold text-slate-950">{title}</h2>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
      </div>
      {actions ? <div className="flex gap-2">{actions}</div> : null}
    </header>
  );
}

export function FilterBar({ children }: { children: ReactNode }) {
  return <div className="mb-4 flex flex-wrap items-center gap-2 border-y border-grid-border py-3">{children}</div>;
}

export function ActionButton({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
    >
      {children}
    </button>
  );
}
