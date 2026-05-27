export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="border border-dashed border-grid-border bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-[13px] leading-[18px] text-slate-500">{message}</p>
    </div>
  );
}
