"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, GitPullRequestArrow, Lock, Play } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, type DragEvent } from "react";

import {
  approveReleaseOverride,
  assignWeeklyPlanItem,
  completeRelease,
  createRelease,
  freezeWeeklyPlan,
  getCurrentConstraint,
  getDailyReleases,
  getWeeklyPlanning,
  getWorkcenterLoad,
  getWorkcenterQueue,
  previewPlanImpact,
  requestPlanChange,
  requestReleaseOverride,
  validateRelease,
} from "@/services/api/eos04";
import { queryKeys } from "@/services/query-keys";
import { ConfirmDialog } from "@/shared/ConfirmDialog";
import { DataGrid } from "@/shared/DataGrid";
import { RightDrawer } from "@/shared/RightDrawer";
import { RiskBadge, StatusBadge } from "@/shared/badges";
import { ActionButton } from "@/shared/layout";
import {
  ChecklistRows,
  InfoRow,
  KpiGrid,
  KpiTile,
  ProgressBar as PrototypeProgressBar,
  PrototypeHeader,
  SectionLabel,
} from "@/shared/prototype";
import { EmptyState } from "@/shared/states/EmptyState";
import { LoadingState } from "@/shared/states/LoadingState";
import type {
  PlanImpactPreview,
  PlanningHorizon,
  PlannedWorkItem,
  ProductionOrder,
  ProductionRelease,
  ReleaseValidationResult,
  RiskStatus,
  WeeklyPlanningPayload,
  WorkcenterLoad,
  WorkcenterQueueItem,
} from "@/types/domain";

const EMPTY_BACKLOG: ProductionOrder[] = [];
const EMPTY_WORK_ITEMS: PlannedWorkItem[] = [];
const EMPTY_LOADS: WorkcenterLoad[] = [];

function riskFromState(state: string): RiskStatus {
  if (["NORMAL", "READY", "RELEASE_READY", "RELEASED", "COMPLETED", "ON_TRACK"].includes(state)) {
    return "ON_TRACK";
  }
  if (["WATCH", "OVERRIDE_APPROVED", "CONDITIONALLY_READY"].includes(state)) {
    return "WATCH";
  }
  if (["CRITICAL", "BLOCKED", "FAILED"].includes(state)) {
    return "CRITICAL";
  }
  return "ACTION";
}

function Feedback({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div role="status" className="mb-3 border border-emerald-200 bg-emerald-50 px-3 py-2 text-[13px] text-emerald-800">
      {message}
    </div>
  );
}

function UtilizationBar({ value }: { value: number }) {
  const width = `${Math.min(value, 160)}%`;
  const color = value > 120 ? "bg-slate-950" : value > 100 ? "bg-risk-action" : value > 85 ? "bg-risk-watch" : "bg-risk-on-track";
  return (
    <div className="h-2 w-full overflow-hidden rounded-sm bg-slate-100" aria-label={`Utilization ${value}%`}>
      <div className={`h-full ${color}`} style={{ width }} />
    </div>
  );
}

type PlanDay = {
  date: string;
  label: string;
  isWeekend: boolean;
};

function toUtcDate(dateString: string) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function buildPlanDays(horizon: PlanningHorizon | null): PlanDay[] {
  if (!horizon) return [];
  const start = toUtcDate(horizon.startDate);
  const end = toUtcDate(horizon.endDate);
  const days: PlanDay[] = [];
  for (let index = 0; index < 7; index += 1) {
    const day = new Date(start);
    day.setUTCDate(start.getUTCDate() + index);
    if (day > end) break;
    const weekday = day.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }).toUpperCase();
    const dayNumber = String(day.getUTCDate()).padStart(2, "0");
    days.push({
      date: toIsoDate(day),
      label: `${weekday} ${dayNumber}`,
      isWeekend: [0, 6].includes(day.getUTCDay()),
    });
  }
  return days;
}

function formatWeekTitle(horizon: PlanningHorizon | null) {
  if (!horizon) return "Weekly Plan";
  const start = toUtcDate(horizon.startDate);
  const yearStart = Date.UTC(start.getUTCFullYear(), 0, 1);
  const dayOfYear = Math.floor((start.getTime() - yearStart) / 86400000) + 1;
  const weekNo = Math.ceil((dayOfYear + new Date(yearStart).getUTCDay()) / 7);
  const month = start.toLocaleDateString("en-US", { month: "long", timeZone: "UTC" });
  return `${month} Week ${weekNo}`;
}

function formatShortDate(dateString: string | null | undefined) {
  if (!dateString) return "-";
  return toUtcDate(dateString).toLocaleDateString("en-US", { month: "short", day: "2-digit", timeZone: "UTC" });
}

function riskBorderClass(risk: RiskStatus) {
  if (risk === "CRITICAL") return "border-l-risk-critical";
  if (risk === "ACTION") return "border-l-risk-action";
  if (risk === "WATCH") return "border-l-risk-watch";
  return "border-l-risk-on-track";
}

function PlanImpactPanel({ impact }: { impact: PlanImpactPreview | null }) {
  if (!impact) {
    return (
      <div className="border border-dashed border-grid-border bg-white px-3 py-4">
        <p className="text-sm font-semibold text-slate-950">No impact preview</p>
        <p className="mt-1 text-[13px] leading-5 text-slate-600">Drag a ready order into a day swimlane to preview impact.</p>
      </div>
    );
  }
  return (
    <div className="border border-grid-border bg-surface-container-low p-4">
      <h4 className="mb-4 text-[11px] font-bold uppercase tracking-[0.05em] text-slate-700">Production Impact</h4>
      <div className="grid grid-cols-[1fr_auto_1fr] gap-3">
        <div className="border border-grid-border bg-white p-3">
          <p className="text-[10px] font-bold uppercase text-slate-500">Current plan</p>
          <p className="mt-1 text-lg font-semibold">{impact.before.utilizationPercent}%</p>
          <RiskBadge risk={impact.before.riskStatus} />
        </div>
        <div className="flex items-center text-xl text-slate-500">-&gt;</div>
        <div className="bg-primary p-3 text-white">
          <p className="text-[10px] font-bold uppercase text-white/70">After preview</p>
          <p className="mt-1 text-lg font-semibold">{impact.after.utilizationPercent}%</p>
          <RiskBadge risk={impact.after.riskStatus} />
        </div>
      </div>
      <div className="mt-4 space-y-2 text-sm text-slate-700">
        <div className="flex justify-between border-b border-grid-border py-1">
          <span>Added minutes</span>
          <span className="font-mono">{impact.addedMinutes}</span>
        </div>
        <div className="flex justify-between border-b border-grid-border py-1">
          <span>After load</span>
          <span className="font-mono">{impact.after.plannedLoadMinutes}</span>
        </div>
        <div className="flex justify-between border-b border-grid-border py-1">
          <span>Write applied</span>
          <span className="font-mono">{impact.writeApplied ? "YES" : "NO"}</span>
        </div>
      </div>
      {impact.after.riskStatus !== "ON_TRACK" ? (
        <p className="mt-4 text-[13px] font-medium text-risk-action">
          Caution: Capacity risk changes after this placement.
        </p>
      ) : null}
    </div>
  );
}

export function WeeklyPlanningWorkbenchPage() {
  const queryClient = useQueryClient();
  const weekly = useQuery({ queryKey: queryKeys.weeklyPlanning, queryFn: getWeeklyPlanning });
  const [selectedBacklog, setSelectedBacklog] = useState<ProductionOrder | null>(null);
  const [selectedItem, setSelectedItem] = useState<PlannedWorkItem | null>(null);
  const [impact, setImpact] = useState<PlanImpactPreview | null>(null);
  const [targetWorkcenterId, setTargetWorkcenterId] = useState<string | null>(null);
  const [targetPlanDate, setTargetPlanDate] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [confirmFreeze, setConfirmFreeze] = useState(false);

  const payload = weekly.data;
  const plan = payload?.plan ?? null;
  const horizon = payload?.horizon ?? null;
  const loads = payload?.workcenterLoads ?? EMPTY_LOADS;
  const workItems = payload?.workItems ?? EMPTY_WORK_ITEMS;
  const backlog = payload?.backlog ?? EMPTY_BACKLOG;
  const planDays = useMemo(() => buildPlanDays(horizon), [horizon]);
  const defaultLoad = loads[0] ?? null;
  const selectedWorkcenterId = targetWorkcenterId ?? defaultLoad?.workcenterId ?? workItems[0]?.workcenterId ?? "";
  const selectedPlanDate = targetPlanDate ?? planDays[0]?.date ?? horizon?.startDate ?? "";
  const selectedWorkcenterLabel =
    loads.find((load) => load.workcenterId === selectedWorkcenterId)?.workcenterCode ??
    workItems.find((item) => item.workcenterId === selectedWorkcenterId)?.workcenterCode ??
    "selected workcenter";

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.weeklyPlanning });
    await queryClient.invalidateQueries({ queryKey: queryKeys.workcenterLoad });
    await queryClient.invalidateQueries({ queryKey: queryKeys.dailyReleases });
  };

  const preview = useMutation({
    mutationFn: ({ order, workcenterId, planDate }: { order: ProductionOrder; workcenterId: string; planDate: string }) =>
      previewPlanImpact(plan?.id ?? "", {
        orderId: order.id,
        workcenterId,
        plannedQuantity: Math.min(order.orderQty, 500),
        plannedStartDate: planDate,
        plannedEndDate: planDate,
      }),
    onSuccess: setImpact,
  });
  const assign = useMutation({
    mutationFn: (order: ProductionOrder) =>
      assignWeeklyPlanItem(plan?.id ?? "", {
        orderId: order.id,
        workcenterId: selectedWorkcenterId,
        plannedQuantity: Math.min(order.orderQty, 500),
        plannedStartDate: selectedPlanDate,
        plannedEndDate: selectedPlanDate,
      }),
    onSuccess: async () => {
      setFeedback("Backlog order assigned to the weekly plan.");
      setSelectedBacklog(null);
      setTargetWorkcenterId(null);
      setTargetPlanDate(null);
      setImpact(null);
      await invalidate();
    },
  });
  const freeze = useMutation({
    mutationFn: () => freezeWeeklyPlan(plan?.id ?? ""),
    onSuccess: async () => {
      setFeedback("Plan frozen. Post-freeze edits now require approved change control.");
      setConfirmFreeze(false);
      await invalidate();
    },
  });
  const changeRequest = useMutation({
    mutationFn: (item: PlannedWorkItem) =>
      requestPlanChange({
        planId: item.planVersionId,
        workItemId: item.id,
        reason: "Move requested after freeze impact review.",
        changeType: "MOVE",
        payload: { orderNo: item.orderNo, workcenterCode: item.workcenterCode },
      }),
    onSuccess: async () => {
      setFeedback("Plan change request recorded.");
      await invalidate();
    },
  });

  const itemsByDate = useMemo(() => {
    return workItems.reduce<Record<string, PlannedWorkItem[]>>((groups, item) => {
      groups[item.plannedStartDate] = [...(groups[item.plannedStartDate] ?? []), item];
      return groups;
    }, {});
  }, [workItems]);

  function previewOrder(order: ProductionOrder, workcenterId = selectedWorkcenterId, planDate = selectedPlanDate) {
    if (!plan || !workcenterId || !planDate) return;
    setSelectedBacklog(order);
    setTargetWorkcenterId(workcenterId);
    setTargetPlanDate(planDate);
    preview.mutate({ order, workcenterId, planDate });
  }

  function handleOrderDrop(event: DragEvent<HTMLDivElement>, planDate: string) {
    event.preventDefault();
    const orderId = event.dataTransfer.getData("application/x-eratex-order");
    const order = backlog.find((candidate) => candidate.id === orderId);
    if (order) {
      previewOrder(order, selectedWorkcenterId, planDate);
    }
  }

  if (weekly.isLoading) return <LoadingState label="Loading weekly planning workbench" />;

  return (
    <section className="overflow-hidden border border-grid-border bg-surface-muted xl:grid xl:min-h-[calc(100vh-112px)] xl:grid-cols-[330px_minmax(0,1fr)_400px]">
      <aside className="border-r border-grid-border bg-surface">
        <div className="flex h-12 items-center justify-between border-b border-grid-border bg-white px-4">
          <h2 className="text-[20px] font-semibold uppercase leading-7 text-slate-950">Backlog</h2>
          <span className="inline-flex items-center gap-2 rounded-sm bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase text-slate-800">
            {backlog.length} Ready
          </span>
        </div>
        <div className="max-h-[calc(100vh-170px)] space-y-3 overflow-y-auto p-4">
          {backlog.length ? (
            backlog.map((order) => (
              <button
                key={order.id}
                type="button"
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.effectAllowed = "copy";
                  event.dataTransfer.setData("application/x-eratex-order", order.id);
                }}
                onClick={() => previewOrder(order)}
                className="w-full border border-grid-border bg-white p-3 text-left shadow-sm transition-colors hover:bg-slate-50"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-mono text-[12px] text-slate-600">{order.orderNo}</span>
                  <RiskBadge risk={riskFromState(order.pcdStatus)} />
                </div>
                <p className="mt-3 truncate text-[15px] font-bold text-slate-950">{order.style.styleCode}</p>
                <div className="mt-3 flex items-end justify-between text-sm">
                  <div>
                    <p className="text-[10px] uppercase text-slate-500">Quantity</p>
                    <p className="font-medium">{order.orderQty.toLocaleString()} units</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase text-slate-500">Deadline</p>
                    <p className="font-medium">{formatShortDate(order.committedShipDate)}</p>
                  </div>
                </div>
              </button>
            ))
          ) : (
            <EmptyState title="No ready backlog" message="PCD-ready orders are already planned." />
          )}
        </div>
      </aside>

      <div className="flex min-w-0 flex-col bg-surface-muted">
        <div className="flex min-h-12 items-center justify-between gap-3 border-b border-grid-border bg-white px-4">
          <div className="flex min-w-0 items-center gap-4">
            <h1 className="truncate text-[20px] font-semibold leading-7 text-slate-950">{formatWeekTitle(horizon)}</h1>
            <div className="flex bg-slate-100 p-0.5">
              <button className="bg-white px-3 py-1 text-[11px] font-bold uppercase shadow-sm" type="button">
                By Workcenter
              </button>
              <button className="px-3 py-1 text-[11px] font-bold uppercase text-slate-500" type="button">
                By Style
              </button>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="font-mono text-[12px] uppercase text-slate-500">Sync: 2m ago</span>
            <ActionButton disabled={!plan || plan.status === "FROZEN"} onClick={() => setConfirmFreeze(true)}>
              <Lock className="h-3.5 w-3.5" aria-hidden />
              Freeze Plan
            </ActionButton>
          </div>
        </div>
      <Feedback message={feedback} />
        <div className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden">
          <div
            className="grid h-full min-h-[560px] min-w-[980px]"
            style={{ gridTemplateColumns: `repeat(${Math.max(planDays.length, 1)}, minmax(190px, 1fr))` }}
          >
            {planDays.map((day) => {
              const items = itemsByDate[day.date] ?? [];
              const isTarget = targetPlanDate === day.date;
              return (
                <div key={day.date} className={`flex flex-col border-r border-grid-border ${day.isWeekend ? "bg-slate-100" : "bg-white"}`}>
                  <div className="sticky top-0 z-10 flex h-10 items-center justify-center border-b border-grid-border bg-white">
                    <span className={`text-[11px] font-bold uppercase tracking-[0.05em] ${day.isWeekend ? "text-slate-500" : "text-slate-950"}`}>
                      {day.label}
                    </span>
                  </div>
                  <div
                    role="region"
                    aria-label={`Plan ${day.label} swim lane`}
                    onDragOver={(event) => {
                      event.preventDefault();
                      if (targetPlanDate !== day.date) setTargetPlanDate(day.date);
                    }}
                    onDrop={(event) => handleOrderDrop(event, day.date)}
                    className={`min-h-[520px] flex-1 space-y-3 p-3 ${isTarget ? "outline outline-2 outline-dashed outline-primary" : ""}`}
                  >
                    {items.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedItem(item)}
                        className={`w-full border border-grid-border border-l-4 bg-white p-2 text-left shadow-sm transition-colors hover:bg-slate-50 ${riskBorderClass(item.riskStatus)}`}
                      >
                        <p className="font-mono text-[10px] uppercase text-slate-500">{item.workcenterCode}</p>
                        <p className="truncate text-[13px] font-bold text-slate-950">{item.orderNo}</p>
                        <p className="text-[12px] text-slate-700">Qty: {item.plannedQuantity.toLocaleString()}</p>
                      </button>
                    ))}
                    {isTarget || items.length === 0 ? (
                      <div className="flex h-20 items-center justify-center border-2 border-dashed border-slate-300 text-[12px] italic text-slate-500">
                        Drop here
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex min-h-14 items-center gap-6 overflow-x-auto bg-primary px-4 text-white">
          <span className="shrink-0 text-[11px] font-bold uppercase tracking-[0.05em] text-risk-watch">System alert</span>
          {loads.map((load) => (
            <div key={load.workcenterId} className="flex min-w-32 flex-col">
              <span className="text-[10px] uppercase leading-none text-white/60">{load.workcenterCode}</span>
              <span className="font-mono text-[12px]">
                {load.utilizationPercent}%{" "}
                <span className={load.utilizationPercent > 100 ? "text-risk-action" : "text-risk-on-track"}>
                  {load.utilizationPercent > 100 ? "Overloaded" : "Utilized"}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>

      <aside className="border-l border-grid-border bg-white">
        <div className="flex h-12 items-center justify-between border-b border-grid-border bg-surface-muted px-4">
          <h2 className="text-[16px] font-semibold text-slate-950">Impact Preview</h2>
        </div>
        <div className="max-h-[calc(100vh-150px)] space-y-6 overflow-y-auto p-5">
          <div>
            <h3 className="mb-3 text-[11px] font-bold uppercase tracking-[0.05em] text-slate-600">Order Readiness Checklist</h3>
            <div className="space-y-3">
              {[
                ["Fabric Availability", selectedBacklog?.fabricQcStatus === "PASSED" ? "VERIFIED" : "PENDING"],
                ["Pattern Approval", selectedBacklog?.pcdStatus === "READY" ? "VERIFIED" : "PENDING"],
                ["Trim & Accs Pack", selectedBacklog?.materialReadinessStatus === "READY" ? "VERIFIED" : "PENDING"],
              ].map(([label, status]) => (
                <div key={label} className="flex items-center justify-between border border-grid-border px-3 py-2">
                  <label className="flex items-center gap-3 text-sm text-slate-800">
                    <input checked={status === "VERIFIED"} readOnly className="h-4 w-4 rounded border-grid-border accent-primary" type="checkbox" />
                    {label}
                  </label>
                  <StatusBadge status={status} />
                </div>
              ))}
            </div>
          </div>
          <PlanImpactPanel impact={impact} />
          {selectedBacklog ? (
            <div className="border border-grid-border bg-white px-3 py-2 text-[13px] text-slate-600">
              Previewing {selectedBacklog.orderNo} into {selectedWorkcenterLabel} on {formatShortDate(selectedPlanDate)}.
            </div>
          ) : null}
          <div>
            <h3 className="mb-3 text-[11px] font-bold uppercase tracking-[0.05em] text-slate-600">Unit 01 Load Profile</h3>
            <div className="space-y-4">
              {loads.map((load) => (
                <div key={load.workcenterId} className="space-y-1">
                  <div className="flex justify-between text-[12px] font-bold">
                    <span>{load.workcenterCode}</span>
                    <span>{load.utilizationPercent}%</span>
                  </div>
                  <UtilizationBar value={load.utilizationPercent} />
                </div>
              ))}
            </div>
          </div>
          {selectedItem ? (
            <div className="border border-grid-border bg-slate-50 p-3">
              <h3 className="text-sm font-semibold text-slate-950">{selectedItem.orderNo}</h3>
              <div className="mt-2 space-y-1 text-sm text-slate-700">
                <p>Style: {selectedItem.styleCode}</p>
                <p>Lane: {formatShortDate(selectedItem.plannedStartDate)} / {selectedItem.workcenterCode}</p>
                <p>Load: {selectedItem.loadMinutes} minutes</p>
              </div>
              <ActionButton
                disabled={plan?.status !== "FROZEN"}
                onClick={() => changeRequest.mutate(selectedItem)}
                variant="ghost"
              >
                <GitPullRequestArrow className="h-3.5 w-3.5" aria-hidden />
                Request Change
              </ActionButton>
            </div>
          ) : null}
          <ActionButton
            disabled={!selectedBacklog || !plan || !selectedWorkcenterId || !selectedPlanDate}
            onClick={() => selectedBacklog && assign.mutate(selectedBacklog)}
          >
            Assign Selected
          </ActionButton>
        </div>
      </aside>
      <ConfirmDialog
        open={confirmFreeze}
        title="Freeze weekly plan"
        message="Freeze locks direct edits. Later movement requires approved plan change."
        confirmLabel="Freeze"
        onConfirm={() => freeze.mutate()}
        onCancel={() => setConfirmFreeze(false)}
      />
    </section>
  );
}

function workcenterDepartment(load: WorkcenterLoad) {
  const type = load.workcenterType ?? load.workcenterCode;
  if (type.includes("WASH")) return "Wet Wash Dept.";
  if (type.includes("SEW")) return "Sewing Dept.";
  if (type.includes("CUT")) return "Cutting Dept.";
  if (type.includes("FIN")) return "Finishing Dept.";
  return load.workcenterName;
}

function WorkcenterLoadCard({ load, onOpen }: { load: WorkcenterLoad; onOpen: (load: WorkcenterLoad) => void }) {
  const risk = riskFromState(load.constraintStatus);
  return (
    <button
      type="button"
      onClick={() => onOpen(load)}
      className={`border bg-white p-3 text-left transition-colors hover:bg-slate-50 ${
        risk === "CRITICAL" ? "border-risk-action" : "border-grid-border"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.05em] text-slate-500">{workcenterDepartment(load)}</p>
          <h2 className="mt-1 text-[16px] font-semibold text-primary">{load.workcenterCode}</h2>
        </div>
        <RiskBadge risk={risk} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-y-2 border-y border-dashed border-grid-border py-2 text-[12px]">
        <div>
          <span className="block text-[9px] font-bold uppercase text-slate-500">Planned Load</span>
          <span className="font-mono">{Math.round(load.plannedLoadMinutes / 60)} hrs/wk</span>
        </div>
        <div>
          <span className="block text-[9px] font-bold uppercase text-slate-500">Queue Qty</span>
          <span className="font-mono">{load.queueQuantity.toLocaleString()} pcs</span>
        </div>
        <div>
          <span className="block text-[9px] font-bold uppercase text-slate-500">Oldest Age</span>
          <span className="font-mono">{load.oldestQueueAgeHours ?? 0}h</span>
        </div>
        <div>
          <span className="block text-[9px] font-bold uppercase text-slate-500">Affected</span>
          <span className="font-mono">{load.topAffectedOrderNo ?? "-"}</span>
        </div>
      </div>
      <div className="mt-3">
        <div className="mb-1 flex justify-between">
          <span className="text-[10px] font-bold uppercase text-slate-500">Utilization</span>
          <span className="font-mono text-[12px]">{load.utilizationPercent}%</span>
        </div>
        <UtilizationBar value={load.utilizationPercent} />
      </div>
      <p className="mt-3 text-[12px] text-slate-600">{load.suggestedAction}</p>
    </button>
  );
}

export function WorkcenterLoadMonitorPage() {
  const load = useQuery({ queryKey: queryKeys.workcenterLoad, queryFn: getWorkcenterLoad });
  const current = useQuery({ queryKey: queryKeys.currentConstraint, queryFn: getCurrentConstraint });
  const [selected, setSelected] = useState<WorkcenterLoad | null>(null);
  const rows = load.data ?? [];
  const highest = current.data ?? [...rows].sort((a, b) => b.utilizationPercent - a.utilizationPercent)[0] ?? null;

  return (
    <section>
      <PrototypeHeader
        title="Workcenter Load & Constraint Monitor"
        subtitle="Constraint-first capacity visibility across active production workcenters."
        actions={
          <>
            <button className="ops-button" type="button">Export Logs</button>
            <button className="ops-button ops-button-primary" type="button">Reevaluate All Loads</button>
          </>
        }
      />
      <KpiGrid columns={3}>
        <KpiTile label="Highest Overload" value={highest ? workcenterDepartment(highest) : "-"} risk={highest?.riskStatus ?? "ON_TRACK"} meta={highest ? `${highest.utilizationPercent}% capacity load` : null} />
        <KpiTile label="Longest Ageing Queue" value={rows.reduce((max, row) => Math.max(max, row.oldestQueueAgeHours ?? 0), 0)} risk="WATCH" meta="hours" />
        <KpiTile label="Total Active Workcenters" value={`${rows.length} Operations`} />
      </KpiGrid>
      {highest ? (
        <div className="mb-3 flex items-center justify-between border border-risk-action/30 bg-risk-action/5 px-3 py-2">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.05em] text-risk-action">Current Constraint</p>
            <p className="text-sm font-semibold text-primary">{highest.workcenterCode} / {highest.suggestedAction}</p>
          </div>
          <Link className="ops-button" href={`/workcenters/${highest.workcenterId}/queue`}>
            Open Queue
          </Link>
        </div>
      ) : null}
      {load.isLoading ? <LoadingState label="Loading workcenter load" /> : null}
      {load.error ? <EmptyState title="Workcenter load unavailable" message="Load snapshots could not be loaded." /> : null}
      <div className="grid gap-4 pb-12 md:grid-cols-2 xl:grid-cols-4">
        {rows.map((row) => <WorkcenterLoadCard key={row.workcenterId} load={row} onOpen={setSelected} />)}
      </div>
      <RightDrawer open={Boolean(selected)} title={selected?.workcenterCode ?? "Workcenter"} onClose={() => setSelected(null)}>
        {selected ? <QueueDrawerContent load={selected} /> : null}
      </RightDrawer>
    </section>
  );
}

function QueueDrawerContent({ load }: { load: WorkcenterLoad }) {
  const queue = useQuery({
    queryKey: queryKeys.workcenterQueue(load.workcenterId),
    queryFn: () => getWorkcenterQueue(load.workcenterId),
  });
  return (
    <div className="space-y-5">
      <section>
        <SectionLabel>Constraint Detail</SectionLabel>
        <InfoRow label="Department" value={workcenterDepartment(load)} />
        <InfoRow label="Planned load" value={`${load.plannedLoadMinutes} min`} />
        <InfoRow label="Available capacity" value={`${load.availableMinutes} min`} />
        <InfoRow label="Aggregate queue" value={`${load.queueQuantity.toLocaleString()} units active`} />
        <UtilizationBar value={load.utilizationPercent} />
      </section>
      <section className="border border-risk-watch/30 bg-risk-watch/5 p-3">
        <SectionLabel>Impact Preview</SectionLabel>
        <InfoRow label="Original Queue Delay" value={`${Math.ceil((load.oldestQueueAgeHours ?? 0) / 24)} days`} />
        <InfoRow label="Top affected order" value={load.topAffectedOrderNo ?? "-"} />
      </section>
      <section>
        <SectionLabel>Affected Queue</SectionLabel>
        <QueueList rows={queue.data ?? []} isLoading={queue.isLoading} />
      </section>
    </div>
  );
}

function QueueList({ rows, isLoading }: { rows: WorkcenterQueueItem[]; isLoading: boolean }) {
  if (isLoading) return <LoadingState label="Loading queue" />;
  if (!rows.length) return <EmptyState title="No queue" message="No queue snapshots for this workcenter." />;
  return (
    <div className="divide-y divide-grid-border border border-grid-border">
      {rows.map((row) => (
        <div key={row.id} className="grid grid-cols-[1fr_auto] gap-2 px-3 py-2 text-sm">
          <div>
            <p className="font-semibold text-slate-900">{row.orderNo ?? "Unallocated"}</p>
            <p className="text-xs text-slate-500">{row.queueStage} / {row.nextAction}</p>
          </div>
          <div className="text-right">
            <RiskBadge risk={row.riskStatus} />
            <p className="mt-1 font-mono text-[11px] text-slate-500">{row.queueQuantity} pcs</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function WorkcenterQueuePage({ workcenterId }: { workcenterId: string }) {
  const queue = useQuery({
    queryKey: queryKeys.workcenterQueue(workcenterId),
    queryFn: () => getWorkcenterQueue(workcenterId),
  });
  const columns: ColumnDef<WorkcenterQueueItem>[] = [
    { accessorKey: "orderNo", header: "Order" },
    { accessorKey: "queueStage", header: "Stage" },
    { accessorKey: "queueQuantity", header: "Qty" },
    { accessorKey: "ageHours", header: "Age h" },
    { accessorKey: "ownerLabel", header: "Owner" },
    { accessorKey: "nextAction", header: "Next action" },
    { accessorKey: "riskStatus", header: "Risk", cell: ({ row }) => <RiskBadge risk={row.original.riskStatus} /> },
  ];
  return (
    <section>
      <PrototypeHeader title="Workcenter Queue" subtitle="Deep-link view of the same queue detail used by the load monitor drawer." />
      <DataGrid
        data={queue.data ?? []}
        columns={columns}
        isLoading={queue.isLoading}
        error={queue.error ? "Queue failed to load." : null}
      />
    </section>
  );
}

export function DailyReleaseDashboardPage() {
  const queryClient = useQueryClient();
  const releases = useQuery({ queryKey: queryKeys.dailyReleases, queryFn: getDailyReleases });
  const weekly = useQuery({ queryKey: queryKeys.weeklyPlanning, queryFn: getWeeklyPlanning });
  const [selected, setSelected] = useState<ProductionRelease | null>(null);
  const [validation, setValidation] = useState<ReleaseValidationResult | null>(null);
  const [confirmAction, setConfirmAction] = useState<"release" | "override" | "approve" | "complete" | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const rows = releases.data ?? [];
  const readyWorkItem = (weekly.data as WeeklyPlanningPayload | undefined)?.workItems.find(
    (item) => item.status === "RELEASE_READY",
  );
  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.dailyReleases });
    await queryClient.invalidateQueries({ queryKey: queryKeys.weeklyPlanning });
  };
  const validate = useMutation({
    mutationFn: (release: ProductionRelease) => validateRelease({ releaseId: release.id }),
    onSuccess: setValidation,
  });
  const releaseCreate = useMutation({
    mutationFn: () => createRelease(readyWorkItem?.id ?? ""),
    onSuccess: async (release) => {
      setFeedback("Daily release issued.");
      setSelected(release);
      setConfirmAction(null);
      await invalidate();
    },
  });
  const requestOverride = useMutation({
    mutationFn: (release: ProductionRelease) =>
      requestReleaseOverride(release.id, "Capacity or blocker override requested for governed release."),
    onSuccess: async (release) => {
      setFeedback("Override requested.");
      setSelected(release);
      setConfirmAction(null);
      await invalidate();
    },
  });
  const approveOverride = useMutation({
    mutationFn: (release: ProductionRelease) =>
      approveReleaseOverride(release.id, "Approved for daily release with owner follow-up."),
    onSuccess: async (release) => {
      setFeedback("Override approved.");
      setSelected(release);
      setConfirmAction(null);
      await invalidate();
    },
  });
  const complete = useMutation({
    mutationFn: (release: ProductionRelease) => completeRelease(release.id),
    onSuccess: async (release) => {
      setFeedback("Release completed.");
      setSelected(release);
      setConfirmAction(null);
      await invalidate();
    },
  });

  function openRelease(release: ProductionRelease) {
    setSelected(release);
    setValidation(release.validation);
  }

  return (
    <section>
      <PrototypeHeader
        title="Daily Production Release"
        subtitle="Ready, blocked, and released production controls with release readiness gate validation."
        actions={
          <>
            <ActionButton disabled={!readyWorkItem} onClick={() => setConfirmAction("release")}>
              <Play className="h-3.5 w-3.5" aria-hidden />
              Bulk Release
            </ActionButton>
            <button className="ops-button" type="button">Export</button>
          </>
        }
      />
      <Feedback message={feedback} />
      <KpiGrid>
        <KpiTile label="Today's Planned Releases" value={rows.length} />
        <KpiTile label="Ready to Release" value={rows.filter((row) => row.status === "READY").length} risk="ON_TRACK" meta="Gate Approved" />
        <KpiTile label="Blocked Releases" value={rows.filter((row) => ["BLOCKED", "OVERRIDE_REQUESTED"].includes(row.status)).length} risk="WATCH" />
        <KpiTile label="Released Today" value={rows.filter((row) => ["RELEASED", "COMPLETED"].includes(row.status)).length} />
      </KpiGrid>
      <div className="ops-grid-wrap max-h-[calc(100vh-340px)]">
        <table className="ops-grid min-w-[980px]">
          <thead>
            <tr>
              <th>Release ID</th>
              <th>Style / SKU</th>
              <th>Release Type</th>
              <th>Workcenter</th>
              <th>Load Status</th>
              <th>Gate Readiness</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((release) => (
              <tr key={release.id} className="cursor-pointer hover:bg-slate-50" onClick={() => openRelease(release)}>
                <td className="font-mono font-semibold text-primary">{release.releaseNo}</td>
                <td>{release.orderNo}</td>
                <td>{release.releaseType}</td>
                <td>{release.workcenterCode}</td>
                <td>
                  <PrototypeProgressBar value={release.riskStatus === "CRITICAL" ? 112 : release.riskStatus === "WATCH" ? 94 : 85} risk={release.riskStatus} />
                </td>
                <td className="text-center">
                  <StatusBadge status={release.status === "READY" ? "READY" : release.status} />
                </td>
                <td className="text-center">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      openRelease(release);
                      setConfirmAction(release.status === "READY" ? "complete" : "override");
                    }}
                    className="font-bold text-primary hover:underline"
                  >
                    {release.status === "READY" ? "Release" : "Review"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && !releases.isLoading ? <EmptyState title="No releases" message="No daily releases are available." /> : null}
      </div>
      <RightDrawer open={Boolean(selected)} title={selected?.releaseNo ?? "Release"} onClose={() => setSelected(null)}>
        {selected ? (
          <div className="space-y-5">
            <section>
              <SectionLabel>Release Readiness Gate</SectionLabel>
              <div className="mb-3 flex items-center justify-between border border-grid-border px-3 py-2">
                <span className="text-sm font-semibold">{selected.orderNo}</span>
                <RiskBadge risk={selected.riskStatus} />
              </div>
              <ReleaseValidationPanel validation={validation} />
            </section>
            <section className="border border-grid-border p-3">
              <SectionLabel>Impact Preview</SectionLabel>
              <InfoRow label="Workcenter" value={selected.workcenterCode} />
              <InfoRow label="Release date" value={formatShortDate(selected.releaseDate)} />
              <InfoRow label="Override reason" value={selected.overrideReason || "-"} />
            </section>
            <div className="flex flex-wrap gap-2">
              <ActionButton variant="ghost" onClick={() => validate.mutate(selected)}>
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                Validate
              </ActionButton>
              <ActionButton variant="ghost" onClick={() => setConfirmAction("override")}>
                <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                Request Override
              </ActionButton>
              <ActionButton variant="ghost" onClick={() => setConfirmAction("approve")}>
                Approve Override
              </ActionButton>
              <ActionButton onClick={() => setConfirmAction("complete")}>
                Release to Floor
              </ActionButton>
            </div>
          </div>
        ) : null}
      </RightDrawer>
      <ConfirmDialog
        open={Boolean(confirmAction)}
        title="Daily release action"
        message={
          confirmAction === "release"
            ? "Create a governed daily release for the first release-ready planned item."
            : confirmAction === "override"
              ? "Request an approved override for a blocked release."
              : confirmAction === "approve"
                ? "Approve the requested override with audit."
                : "Complete this release control record."
        }
        confirmLabel="Confirm"
        onConfirm={() => {
          if (confirmAction === "release") releaseCreate.mutate();
          if (selected && confirmAction === "override") requestOverride.mutate(selected);
          if (selected && confirmAction === "approve") approveOverride.mutate(selected);
          if (selected && confirmAction === "complete") complete.mutate(selected);
        }}
        onCancel={() => setConfirmAction(null)}
      />
    </section>
  );
}

function ReleaseValidationPanel({ validation }: { validation: ReleaseValidationResult | null }) {
  if (!validation) {
    return <EmptyState title="No validation selected" message="Run validation to view checks and blockers." />;
  }
  return (
    <div className="space-y-3">
      <ChecklistRows
        rows={validation.checks.map((check) => ({
          label: check.code.replaceAll("_", " "),
          status: check.passed ? "PASSED" : "BLOCKED",
          passed: check.passed,
          note: check.owner,
        }))}
      />
      {validation.blockers.length ? (
        <div className="space-y-2">
          {validation.blockers.map((blocker) => (
            <div key={blocker.code} className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              <p className="font-semibold">{blocker.code.replaceAll("_", " ")}</p>
              <p>{blocker.message}</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
