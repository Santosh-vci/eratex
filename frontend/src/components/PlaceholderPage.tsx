type PlaceholderPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  phase?: string;
  scope?: string;
};

export function PlaceholderPage({
  eyebrow,
  title,
  description,
  phase = "Phase 1",
  scope = "Platform foundation only",
}: PlaceholderPageProps) {
  return (
    <section className="max-w-5xl">
      <div className="border border-grid-border bg-white p-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">{eyebrow}</p>
        <h2 className="mt-2 text-xl font-semibold text-slate-950">{title}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
        <dl className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="border border-grid-border bg-surface-muted p-3">
            <dt className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
              Status
            </dt>
            <dd className="mt-1 text-sm font-semibold text-risk-on-track">Foundation Route</dd>
          </div>
          <div className="border border-grid-border bg-surface-muted p-3">
            <dt className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
              Phase
            </dt>
            <dd className="mt-1 text-sm font-semibold text-slate-900">{phase}</dd>
          </div>
          <div className="border border-grid-border bg-surface-muted p-3">
            <dt className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
              Scope
            </dt>
            <dd className="mt-1 text-sm font-semibold text-slate-900">{scope}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
