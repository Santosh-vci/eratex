export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <div className="border border-grid-border bg-white p-5 text-sm text-slate-600">
      <div className="h-1 w-28 overflow-hidden rounded bg-slate-100">
        <div className="h-full w-1/2 animate-pulse bg-primary" />
      </div>
      <p className="mt-3 font-medium">{label}</p>
    </div>
  );
}
