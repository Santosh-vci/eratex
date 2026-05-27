import type { AuditEvent } from "@/types/domain";

export function AuditTrailPanel({ events }: { events: AuditEvent[] }) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-900">Audit trail</h3>
      {events.length === 0 ? (
        <p className="text-[13px] text-slate-500">No audit events in this view.</p>
      ) : (
        <ol className="space-y-2 border-l border-grid-border pl-3">
          {events.map((event) => (
            <li key={event.id}>
              <p className="text-[13px] font-medium text-slate-900">{event.eventCode}</p>
              <p className="font-mono text-[11px] text-slate-500">{event.createdAt}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
