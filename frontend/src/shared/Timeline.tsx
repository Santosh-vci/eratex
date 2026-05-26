type TimelineItem = {
  label: string;
  timestamp: string;
  status: string;
};

export function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <ol className="space-y-2 border-l border-grid-border pl-3">
      {items.map((item) => (
        <li key={`${item.label}-${item.timestamp}`}>
          <p className="text-sm font-medium text-slate-900">{item.label}</p>
          <p className="text-xs text-slate-500">
            {item.status} / {item.timestamp}
          </p>
        </li>
      ))}
    </ol>
  );
}
