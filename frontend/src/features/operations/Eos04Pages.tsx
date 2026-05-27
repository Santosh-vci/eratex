"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, GitPullRequestArrow, Lock, Play, RotateCw } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import {
  approveReleaseOverride,
  assignWeeklyPlanItem,
  completeRelease,
  createRelease,
  createWeeklyPlan,
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
import { ActionButton, FilterBar, MetricStrip, ModuleHeader, Panel } from "@/shared/layout";
import { EmptyState } from "@/shared/states/EmptyState";
import { LoadingState } from "@/shared/states/LoadingState";
import type {
  PlanImpactPreview,
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

function MetricBand({ metrics }: { metrics: Array<{ label: string; value: string | number; risk?: RiskStatus }> }) {
  return (
    <MetricStrip
      metrics={metrics.map((metric) => ({
        label: metric.label,
        value: metric.value,
        meta: metric.risk ? <RiskBadge risk={metric.risk} /> : null,
      }))}
    />
  );
}

function PlanImpactPanel({ impact }: { impact: PlanImpactPreview | null }) {
  if (!impact) {
    return <EmptyState title="No impact preview" message="Select a ready order and preview the capacity impact." />;
  }
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="border border-grid-border p-2">
          <p className="font-mono uppercase text-slate-500">Before</p>
          <p className="mt-1 text-lg font-semibold">{impact.before.utilizationPercent}%</p>
          <RiskBadge risk={impact.before.riskStatus} />
        </div>
        <div className="border border-grid-border p-2">
          <p className="font-mono uppercase text-slate-500">After</p>
          <p className="mt-1 text-lg font-semibold">{impact.after.utilizationPercent}%</p>
          <RiskBadge risk={impact.after.riskStatus} />
        </div>
      </div>
      <div className="space-y-2 text-sm text-slate-700">
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
    </div>
  );
}

export function WeeklyPlanningWorkbenchPage() {
  const queryClient = useQueryClient();
  const weekly = useQuery({ queryKey: queryKeys.weeklyPlanning, queryFn: getWeeklyPlanning });
  const [selectedBacklog, setSelectedBacklog] = useState<ProductionOrder | null>(null);
  const [selectedItem, setSelectedItem] = useState<PlannedWorkItem | null>(null);
  const [impact, setImpact] = useState<PlanImpactPreview | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [confirmFreeze, setConfirmFreeze] = useState(false);

  const payload = weekly.data;
  const plan = payload?.plan ?? null;
  const horizon = payload?.horizon ?? null;
  const loads = payload?.workcenterLoads ?? EMPTY_LOADS;
  const workItems = payload?.workItems ?? EMPTY_WORK_ITEMS;
  const backlog = payload?.backlog ?? EMPTY_BACKLOG;
  const defaultLoad = loads[0] ?? null;

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.weeklyPlanning });
    await queryClient.invalidateQueries({ queryKey: queryKeys.workcenterLoad });
    await queryClient.invalidateQueries({ queryKey: queryKeys.dailyReleases });
  };

  const createPlan = useMutation({
    mutationFn: createWeeklyPlan,
    onSuccess: async () => {
      setFeedback("New weekly plan version created.");
      await invalidate();
    },
  });
  const preview = useMutation({
    mutationFn: (order: ProductionOrder) =>
      previewPlanImpact(plan?.id ?? "", {
        orderId: order.id,
        workcenterId: defaultLoad?.workcenterId ?? workItems[0]?.workcenterId ?? "",
        plannedQuantity: Math.min(order.orderQty, 500),
        plannedStartDate: horizon?.startDate,
        plannedEndDate: horizon?.endDate,
      }),
    onSuccess: setImpact,
  });
  const assign = useMutation({
    mutationFn: (order: ProductionOrder) =>
      assignWeeklyPlanItem(plan?.id ?? "", {
        orderId: order.id,
        workcenterId: defaultLoad?.workcenterId ?? workItems[0]?.workcenterId ?? "",
        plannedQuantity: Math.min(order.orderQty, 500),
        plannedStartDate: horizon?.startDate,
        plannedEndDate: horizon?.endDate,
      }),
    onSuccess: async () => {
      setFeedback("Backlog order assigned to the weekly plan.");
      setSelectedBacklog(null);
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

  const groupedItems = useMemo(() => {
    return workItems.reduce<Record<string, PlannedWorkItem[]>>((groups, item) => {
      groups[item.workcenterCode] = [...(groups[item.workcenterCode] ?? []), item];
      return groups;
    }, {});
  }, [workItems]);

  if (weekly.isLoading) return <LoadingState label="Loading weekly planning workbench" />;

  return (
    <section>
      <ModuleHeader
        title="Weekly Planning"
        description="Backlog, weekly board, capacity overlay, impact preview, and plan freeze control."
        actions={
          <>
            <ActionButton variant="ghost" onClick={() => createPlan.mutate()}>
              <RotateCw className="h-3.5 w-3.5" aria-hidden />
              New Version
            </ActionButton>
            <ActionButton disabled={!plan || plan.status === "FROZEN"} onClick={() => setConfirmFreeze(true)}>
              <Lock className="h-3.5 w-3.5" aria-hidden />
              Freeze
            </ActionButton>
          </>
        }
      />
      <Feedback message={feedback} />
      <MetricBand
        metrics={[
          { label: "Backlog ready", value: backlog.length, risk: backlog.length ? "WATCH" : "ON_TRACK" },
          { label: "Plan items", value: workItems.length },
          { label: "Blocked load", value: workItems.filter((item) => item.status === "BLOCKED").length, risk: "ACTION" },
          { label: "Plan status", value: plan?.status ?? "NONE", risk: riskFromState(plan?.status ?? "") },
        ]}
      />
      <FilterBar>
        <StatusBadge status={horizon ? `${horizon.startDate} to ${horizon.endDate}` : "No horizon"} />
        <StatusBadge status="Capacity overlay" />
        <StatusBadge status="Impact preview no-write" />
      </FilterBar>
      <div className="grid gap-3 xl:grid-cols-[300px_minmax(0,1fr)_360px]">
        <Panel title="Ready Backlog">
          <div className="max-h-[calc(100vh-290px)] overflow-y-auto">
            {backlog.length ? (
              <div className="divide-y divide-grid-border border border-grid-border bg-white">
                {backlog.map((order) => (
                  <button
                    key={order.id}
                    type="button"
                    onClick={() => {
                      setSelectedBacklog(order);
                      preview.mutate(order);
                    }}
                    className="grid w-full grid-cols-[1fr_auto] gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-slate-900">{order.orderNo}</span>
                      <span className="block truncate text-xs text-slate-500">{order.style.styleCode}</span>
                    </span>
                    <RiskBadge risk={riskFromState(order.pcdStatus)} />
                  </button>
                ))}
              </div>
            ) : (
              <EmptyState title="No ready backlog" message="PCD-ready orders are already planned." />
            )}
          </div>
        </Panel>
        <Panel title="Plan Board">
          <div className="grid gap-3 lg:grid-cols-2">
            {Object.entries(groupedItems).map(([workcenter, items]) => (
              <div key={workcenter} className="border border-grid-border bg-white">
                <div className="flex h-9 items-center justify-between border-b border-grid-border px-3">
                  <h3 className="text-sm font-semibold text-slate-900">{workcenter}</h3>
                  <StatusBadge status={`${items.length} items`} />
                </div>
                <div className="divide-y divide-grid-border">
                  {items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedItem(item)}
                      className="grid w-full grid-cols-[1fr_auto] items-center gap-2 px-3 py-2 text-left hover:bg-slate-50"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">{item.orderNo}</span>
                        <span className="block truncate text-xs text-slate-500">
                          {item.plannedQuantity} pcs / {item.loadMinutes} min
                        </span>
                      </span>
                      <RiskBadge risk={item.riskStatus} />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Capacity Overlay">
          <div className="space-y-3">
            {loads.map((load) => (
              <div key={load.workcenterId} className="border border-grid-border p-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{load.workcenterCode}</p>
                    <p className="text-xs text-slate-500">{load.suggestedAction}</p>
                  </div>
                  <RiskBadge risk={load.riskStatus} />
                </div>
                <div className="mt-3">
                  <UtilizationBar value={load.utilizationPercent} />
                  <div className="mt-1 flex justify-between font-mono text-[11px] text-slate-500">
                    <span>{load.utilizationPercent}%</span>
                    <span>{load.plannedLoadMinutes}/{load.availableMinutes}</span>
                  </div>
                </div>
              </div>
            ))}
            <PlanImpactPanel impact={impact} />
            <ActionButton disabled={!selectedBacklog || !plan} onClick={() => selectedBacklog && assign.mutate(selectedBacklog)}>
              Assign Selected
            </ActionButton>
          </div>
        </Panel>
      </div>
      <RightDrawer open={Boolean(selectedItem)} title={selectedItem?.orderNo ?? "Plan item"} onClose={() => setSelectedItem(null)}>
        {selectedItem ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <StatusBadge status={selectedItem.status} />
              <RiskBadge risk={selectedItem.riskStatus} />
            </div>
            <div className="space-y-2 text-sm text-slate-700">
              <p>Style: {selectedItem.styleCode}</p>
              <p>Workcenter: {selectedItem.workcenterName}</p>
              <p>Quantity: {selectedItem.plannedQuantity}</p>
              <p>Load: {selectedItem.loadMinutes} minutes</p>
            </div>
            <ActionButton disabled={plan?.status !== "FROZEN"} onClick={() => changeRequest.mutate(selectedItem)}>
              <GitPullRequestArrow className="h-3.5 w-3.5" aria-hidden />
              Request Change
            </ActionButton>
          </div>
        ) : null}
      </RightDrawer>
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

export function WorkcenterLoadMonitorPage() {
  const load = useQuery({ queryKey: queryKeys.workcenterLoad, queryFn: getWorkcenterLoad });
  const current = useQuery({ queryKey: queryKeys.currentConstraint, queryFn: getCurrentConstraint });
  const [selected, setSelected] = useState<WorkcenterLoad | null>(null);
  const rows = load.data ?? [];
  const columns: ColumnDef<WorkcenterLoad>[] = [
    { accessorKey: "workcenterCode", header: "Workcenter" },
    { accessorKey: "workcenterType", header: "Type" },
    {
      accessorKey: "utilizationPercent",
      header: "Utilization",
      cell: ({ row }) => (
        <div className="min-w-40">
          <UtilizationBar value={row.original.utilizationPercent} />
        </div>
      ),
    },
    { accessorKey: "plannedLoadMinutes", header: "Load min" },
    { accessorKey: "availableMinutes", header: "Capacity min" },
    { accessorKey: "queueQuantity", header: "Queue qty" },
    { accessorKey: "topAffectedOrderNo", header: "Affected order" },
    {
      accessorKey: "constraintStatus",
      header: "Constraint",
      cell: ({ row }) => <RiskBadge risk={riskFromState(row.original.constraintStatus)} />,
    },
  ];
  return (
    <section>
      <ModuleHeader
        title="Workcenter Load"
        description="Current constraint, utilization, queue ageing, affected orders, and capacity action state."
      />
      <MetricBand
        metrics={[
          { label: "Workcenters", value: rows.length },
          { label: "Highest overload", value: `${current.data?.utilizationPercent ?? 0}%`, risk: current.data?.riskStatus ?? "ON_TRACK" },
          { label: "Critical", value: rows.filter((row) => row.constraintStatus === "CRITICAL").length, risk: "CRITICAL" },
          { label: "Queue qty", value: rows.reduce((sum, row) => sum + row.queueQuantity, 0), risk: "WATCH" },
        ]}
      />
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_360px]">
        <DataGrid
          data={rows}
          columns={columns}
          isLoading={load.isLoading}
          error={load.error ? "Workcenter load failed to load." : null}
          onRowClick={setSelected}
        />
        <Panel title="Current Constraint">
          {current.data ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-lg font-semibold">{current.data.workcenterCode}</p>
                  <p className="text-xs text-slate-500">{current.data.suggestedAction}</p>
                </div>
                <RiskBadge risk={current.data.riskStatus} />
              </div>
              <UtilizationBar value={current.data.utilizationPercent} />
              <div className="grid grid-cols-2 gap-2 text-sm text-slate-700">
                <p>Queue: {current.data.queueQuantity}</p>
                <p>Age: {current.data.oldestQueueAgeHours ?? 0}h</p>
                <p>Load: {current.data.plannedLoadMinutes}</p>
                <p>Capacity: {current.data.availableMinutes}</p>
              </div>
              <Link className="ops-button" href={`/workcenters/${current.data.workcenterId}/queue`}>
                Open Queue
              </Link>
            </div>
          ) : (
            <EmptyState title="No constraint" message="No workcenter load snapshot is available." />
          )}
        </Panel>
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
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <StatusBadge status={load.constraintStatus} />
        <RiskBadge risk={load.riskStatus} />
      </div>
      <UtilizationBar value={load.utilizationPercent} />
      <QueueList rows={queue.data ?? []} isLoading={queue.isLoading} />
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
      <ModuleHeader title="Workcenter Queue" description="Order queue snapshot for the selected workcenter constraint." />
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
  const columns: ColumnDef<ProductionRelease>[] = [
    { accessorKey: "releaseNo", header: "Release" },
    { accessorKey: "orderNo", header: "Order" },
    { accessorKey: "workcenterCode", header: "Workcenter" },
    { accessorKey: "releaseDate", header: "Date" },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    { accessorKey: "riskStatus", header: "Risk", cell: ({ row }) => <RiskBadge risk={row.original.riskStatus} /> },
    { accessorKey: "overrideReason", header: "Override reason" },
  ];
  return (
    <section>
      <ModuleHeader
        title="Daily Release"
        description="Ready, blocked, released, validation blockers, override approval, and completion control."
        actions={
          <ActionButton disabled={!readyWorkItem} onClick={() => setConfirmAction("release")}>
            <Play className="h-3.5 w-3.5" aria-hidden />
            Release Ready Item
          </ActionButton>
        }
      />
      <Feedback message={feedback} />
      <MetricBand
        metrics={[
          { label: "Planned releases", value: rows.length },
          { label: "Ready", value: rows.filter((row) => row.status === "READY").length, risk: "ON_TRACK" },
          { label: "Blocked", value: rows.filter((row) => ["BLOCKED", "OVERRIDE_REQUESTED"].includes(row.status)).length, risk: "ACTION" },
          { label: "Released", value: rows.filter((row) => ["RELEASED", "COMPLETED"].includes(row.status)).length, risk: "ON_TRACK" },
        ]}
      />
      <DataGrid
        data={rows}
        columns={columns}
        isLoading={releases.isLoading}
        error={releases.error ? "Daily releases failed to load." : null}
        onRowClick={(release) => {
          setSelected(release);
          setValidation(release.validation);
        }}
      />
      <RightDrawer open={Boolean(selected)} title={selected?.releaseNo ?? "Release"} onClose={() => setSelected(null)}>
        {selected ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <StatusBadge status={selected.status} />
              <RiskBadge risk={selected.riskStatus} />
            </div>
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
                Complete
              </ActionButton>
            </div>
            <ReleaseValidationPanel validation={validation} />
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
      <div className="flex items-center justify-between border border-grid-border px-3 py-2">
        <span className="text-sm font-semibold">Validation result</span>
        <RiskBadge risk={validation.riskStatus} />
      </div>
      <div className="divide-y divide-grid-border border border-grid-border">
        {validation.checks.map((check) => (
          <div key={check.code} className="grid grid-cols-[1fr_auto] gap-2 px-3 py-2 text-sm">
            <span>{check.code.replaceAll("_", " ")}</span>
            <StatusBadge status={check.passed ? "PASSED" : "BLOCKED"} />
          </div>
        ))}
      </div>
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
