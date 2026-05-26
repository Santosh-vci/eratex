export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="border border-dashed border-grid-border bg-white p-5">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{message}</p>
    </div>
  );
}
