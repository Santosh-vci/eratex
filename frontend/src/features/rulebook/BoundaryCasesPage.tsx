"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Play, Search } from "lucide-react";
import { useMemo, useState } from "react";

import {
  applyBoundaryAction,
  approveBoundaryAction,
  getBoundaryCases,
  previewBoundaryImpact,
} from "@/services/api/scheduling-rulebook";
import { getWorkcenterLoad } from "@/services/api/eos04";
import { queryKeys } from "@/services/query-keys";
import { RightDrawer } from "@/shared/RightDrawer";
import { RiskBadge, SeverityBadge, StatusBadge } from "@/shared/badges";
import { ActionButton } from "@/shared/layout";
import { InfoRow, KpiGrid, KpiTile, ProgressBar, PrototypeHeader, SectionLabel } from "@/shared/prototype";
import { EmptyState } from "@/shared/states/EmptyState";
import { LoadingState } from "@/shared/states/LoadingState";
import type { BoundaryCaseEvent, BoundaryImpactPreview } from "@/types/domain";

function eventLabel(value: string) {
  return value.replaceAll("_", " ");
}

export function BoundaryImpactPreviewDrawer({
  event,
  preview,
  onClose,
  onApprove,
  onApply,
}: {
  event: BoundaryCaseEvent | null;
  preview: BoundaryImpactPreview | null;
  onClose: () => void;
  onApprove: (event: BoundaryCaseEvent) => void;
  onApply: (event: BoundaryCaseEvent) => void;
}) {
  return (
    <RightDrawer open={Boolean(event)} title={event?.eventNo ?? "Boundary case"} onClose={onClose}>
      {event ? (
        <div className="space-y-5">
          <section>
            <SectionLabel>Event Control</SectionLabel>
            <div className="mb-3 flex items-center justify-between border border-grid-border px-3 py-2">
              <span className="text-sm font-semibold text-slate-950">{eventLabel(event.eventType)}</span>
              <SeverityBadge severity={event.severity} />
            </div>
            <InfoRow label="Status" value={event.status.replaceAll("_", " ")} />
            <InfoRow label="Order" value={event.linkedOrderNo ?? "-"} />
            <InfoRow label="Workcenter" value={event.linkedWorkcenterCode ?? "-"} />
            <InfoRow label="Approval" value={event.approvalRequired ? "Required" : "Not required"} />
          </section>
          <section className="border border-grid-border bg-surface-muted p-3">
            <SectionLabel>Impact Preview</SectionLabel>
            <div className="mb-3 grid grid-cols-[1fr_auto_1fr] gap-3">
              <div className="border border-grid-border bg-white p-3">
                <p className="text-[10px] font-bold uppercase text-slate-500">Before</p>
                <RiskBadge risk={preview?.riskBefore ?? event.riskBefore} />
              </div>
              <div className="flex items-center text-slate-400">-&gt;</div>
              <div className="bg-primary p-3 text-white">
                <p className="text-[10px] font-bold uppercase text-white/70">After</p>
                <RiskBadge risk={preview?.riskAfter ?? event.riskAfter} />
              </div>
            </div>
            <InfoRow label="Capacity minutes" value={String(event.affectedCapacityMinutes)} />
            <InfoRow label="Can apply" value={preview?.canApply ? "YES" : event.approvalRequired ? "AFTER APPROVAL" : "YES"} />
            {(preview?.blockingReasons ?? []).map((reason) => (
              <p key={reason} className="mt-2 border border-red-200 bg-red-50 px-2 py-1 text-[12px] text-red-800">
                {reason}
              </p>
            ))}
          </section>
          <section>
            <SectionLabel>Recommended Action</SectionLabel>
            <p className="text-sm leading-5 text-slate-700">
              {preview?.recommendedActions?.join("; ") || event.recommendedAction || "Review and approve before applying."}
            </p>
          </section>
          <div className="flex flex-wrap gap-2">
            <ActionButton variant="ghost" onClick={() => onApprove(event)}>
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
              Approve
            </ActionButton>
            <ActionButton onClick={() => onApply(event)}>
              <Play className="h-3.5 w-3.5" aria-hidden />
              Apply
            </ActionButton>
          </div>
        </div>
      ) : null}
    </RightDrawer>
  );
}

export function BoundaryCasesPage() {
  const queryClient = useQueryClient();
  const boundaryCases = useQuery({ queryKey: queryKeys.boundaryCases, queryFn: getBoundaryCases });
  const loads = useQuery({ queryKey: queryKeys.workcenterLoad, queryFn: getWorkcenterLoad });
  const [selected, setSelected] = useState<BoundaryCaseEvent | null>(null);
  const [preview, setPreview] = useState<BoundaryImpactPreview | null>(null);
  const [filter, setFilter] = useState("");
  const rows = useMemo(() => boundaryCases.data ?? [], [boundaryCases.data]);
  const filteredRows = useMemo(() => {
    const term = filter.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((row) =>
      [row.eventNo, row.eventType, row.linkedOrderNo, row.linkedWorkcenterCode, row.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term)),
    );
  }, [filter, rows]);
  const openEvents = rows.filter((row) => !["APPLIED", "RESOLVED", "CLOSED", "CANCELLED"].includes(row.status));
  const criticalEvents = rows.filter((row) => row.severity === "CRITICAL" || row.riskAfter === "CRITICAL");

  const previewMutation = useMutation({
    mutationFn: (event: BoundaryCaseEvent) =>
      previewBoundaryImpact({
        eventType: event.eventType,
        payload: {
          orderId: event.linkedOrderId,
          workcenterId: event.linkedWorkcenterId,
          minutesDelta: event.affectedCapacityMinutes,
          eventDate: event.affectedShipmentDate,
        },
      }),
    onSuccess: setPreview,
  });
  const approveMutation = useMutation({
    mutationFn: (event: BoundaryCaseEvent) => approveBoundaryAction(event.id),
    onSuccess: async (event) => {
      setSelected(event);
      await queryClient.invalidateQueries({ queryKey: queryKeys.boundaryCases });
    },
  });
  const applyMutation = useMutation({
    mutationFn: (event: BoundaryCaseEvent) => applyBoundaryAction(event.id),
    onSuccess: async (event) => {
      setSelected(event);
      await queryClient.invalidateQueries({ queryKey: queryKeys.boundaryCases });
      await queryClient.invalidateQueries({ queryKey: queryKeys.workcenterLoad });
      await queryClient.invalidateQueries({ queryKey: queryKeys.dailyReleases });
    },
  });

  function openEvent(event: BoundaryCaseEvent) {
    setSelected(event);
    setPreview(null);
    previewMutation.mutate(event);
  }

  return (
    <section>
      <PrototypeHeader
        title="Boundary Cases"
        subtitle="Visible, owned, stateful schedule disruptions with impact preview before planner action."
        actions={
          <div className="relative min-w-[260px]">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" aria-hidden />
            <input
              className="h-8 w-full border border-grid-border bg-white pl-8 pr-2 text-xs outline-none focus:border-secondary"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              placeholder="Search event, order, workcenter"
              aria-label="Search boundary cases"
            />
          </div>
        }
      />
      <KpiGrid>
        <KpiTile label="Open Boundary Cases" value={openEvents.length} risk={openEvents.length ? "WATCH" : "ON_TRACK"} />
        <KpiTile label="Critical Risk" value={criticalEvents.length} risk={criticalEvents.length ? "CRITICAL" : "ON_TRACK"} />
        <KpiTile label="Approval Required" value={rows.filter((row) => row.approvalRequired).length} risk="ACTION" />
        <KpiTile label="Capacity Definitions" value={loads.data?.filter((load) => load.capacityDefinition).length ?? 0} meta="visible in load monitor" />
      </KpiGrid>
      <div className="ops-grid-wrap max-h-[calc(100vh-300px)]">
        <table className="ops-grid min-w-[1080px]">
          <thead>
            <tr>
              <th>Event</th>
              <th>Type</th>
              <th>Linked Object</th>
              <th>Status</th>
              <th>Risk</th>
              <th>Capacity Impact</th>
              <th>Recommended Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((event) => (
              <tr key={event.id} className="cursor-pointer hover:bg-slate-50" onClick={() => openEvent(event)}>
                <td className="font-mono font-semibold text-primary">{event.eventNo}</td>
                <td>{eventLabel(event.eventType)}</td>
                <td>{event.linkedOrderNo ?? event.linkedWorkcenterCode ?? "-"}</td>
                <td><StatusBadge status={event.status} /></td>
                <td><RiskBadge risk={event.riskAfter} /></td>
                <td>
                  <div className="min-w-32">
                    <ProgressBar value={Math.min(Math.abs(event.affectedCapacityMinutes) / 60, 100)} risk={event.riskAfter} />
                  </div>
                </td>
                <td>{event.recommendedAction || "Review impact"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {boundaryCases.isLoading ? <LoadingState label="Loading boundary cases" /> : null}
        {!boundaryCases.isLoading && !filteredRows.length ? (
          <EmptyState title="No boundary cases" message="No matching schedule disruptions are open." />
        ) : null}
      </div>
      <BoundaryImpactPreviewDrawer
        event={selected}
        preview={preview}
        onClose={() => setSelected(null)}
        onApprove={(event) => approveMutation.mutate(event)}
        onApply={(event) => applyMutation.mutate(event)}
      />
    </section>
  );
}
