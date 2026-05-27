"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Scissors, SlidersHorizontal } from "lucide-react";
import { useState } from "react";

import {
  applyLineRealignment,
  approveLineRealignment,
  createSewingOutput,
  getCuttingJobs,
  getSewingLineLoadingBoard,
  getSewingLineLoadings,
  getSewingOutput,
  getWipOrderSummary,
  previewLineRealignment,
  requestLineRealignment,
} from "@/services/api/execution";
import { queryKeys } from "@/services/query-keys";
import { ConfirmDialog } from "@/shared/ConfirmDialog";
import { DataGrid } from "@/shared/DataGrid";
import { RightDrawer } from "@/shared/RightDrawer";
import { RiskBadge, StatusBadge } from "@/shared/badges";
import { ActionButton, Panel } from "@/shared/layout";
import {
  InfoRow,
  KpiGrid,
  KpiTile,
  PrototypeHeader,
  SectionLabel,
  Timeline,
} from "@/shared/prototype";
import { EmptyState } from "@/shared/states/EmptyState";
import { LoadingState } from "@/shared/states/LoadingState";
import type {
  CuttingJob,
  LineRealignment,
  LineRealignmentPreview,
  SewingLineBoardRow,
  SewingLineLoading,
  WipSummary,
} from "@/types/domain";

function stageLabel(value: string) {
  return value.replaceAll("_", " ");
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Feedback({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div role="status" className="mb-3 border border-emerald-200 bg-emerald-50 px-3 py-2 text-[13px] text-emerald-800">
      {message}
    </div>
  );
}

export function CuttingRoomPage() {
  const jobs = useQuery({ queryKey: queryKeys.cuttingJobs, queryFn: getCuttingJobs });
  const [selected, setSelected] = useState<CuttingJob | null>(null);
  const rows = jobs.data ?? [];
  const ready = rows.filter((job) => job.status === "RELEASED").length;
  const completed = rows.filter((job) => ["COMPLETED", "HANDED_OVER"].includes(job.status)).length;
  const netCut = rows.reduce((sum, job) => sum + job.netCutQty, 0);

  const columns: ColumnDef<CuttingJob>[] = [
    { accessorKey: "jobNo", header: "Cutting job" },
    { accessorKey: "orderNo", header: "Order" },
    { accessorKey: "styleCode", header: "Style" },
    { accessorKey: "markerNo", header: "Marker" },
    { accessorKey: "plannedQuantity", header: "Plan qty" },
    { accessorKey: "netCutQty", header: "Net cut" },
    { accessorKey: "bundleCount", header: "Bundles" },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
  ];

  return (
    <section>
      <PrototypeHeader
        title="Cutting Room Management"
        subtitle="Cutting plan, output proof, marker detail, bundle creation, and sewing handover control."
        actions={<button className="ops-button ops-button-primary" type="button"><Scissors className="h-3.5 w-3.5" /> Record Output</button>}
      />
      <KpiGrid>
        <KpiTile label="Released Jobs" value={ready} risk={ready ? "WATCH" : "ON_TRACK"} />
        <KpiTile label="Output Today" value={netCut.toLocaleString()} meta="net cut pcs" />
        <KpiTile label="Bundle Count" value={rows.reduce((sum, job) => sum + job.bundleCount, 0)} />
        <KpiTile label="Handed Over" value={completed} risk="ON_TRACK" />
      </KpiGrid>
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Panel title="Cutting Plan & Execution">
          <DataGrid
            data={rows}
            columns={columns}
            isLoading={jobs.isLoading}
            error={jobs.error ? "Cutting jobs failed to load." : null}
            onRowClick={setSelected}
            heightClassName="max-h-[calc(100vh-340px)]"
          />
        </Panel>
        <Panel title="Marker & Bundle Detail">
          {selected ? <CuttingDetail job={selected} /> : <EmptyState title="Select a job" message="Open a cutting job to inspect marker, output, and bundle detail." />}
        </Panel>
      </div>
      <RightDrawer open={Boolean(selected)} title={selected?.jobNo ?? "Cutting job"} onClose={() => setSelected(null)}>
        {selected ? <CuttingDetail job={selected} drawer /> : null}
      </RightDrawer>
    </section>
  );
}

function CuttingDetail({ job, drawer = false }: { job: CuttingJob; drawer?: boolean }) {
  const wip = useQuery({
    queryKey: queryKeys.wipOrderSummary(job.orderId),
    queryFn: () => getWipOrderSummary(job.orderId),
  });
  return (
    <div className="space-y-4">
      <section>
        <SectionLabel>Marker and Release</SectionLabel>
        <InfoRow label="Order" value={job.orderNo} />
        <InfoRow label="Style" value={job.styleCode} />
        <InfoRow label="Marker" value={job.markerNo} />
        <InfoRow label="Shade lot" value={job.shadeLot || "-"} />
        <InfoRow label="Status" value={<StatusBadge status={job.status} />} />
      </section>
      <section>
        <SectionLabel>Output</SectionLabel>
        <div className="grid grid-cols-2 gap-2">
          <KpiTile label="Plan" value={job.plannedQuantity.toLocaleString()} />
          <KpiTile label="Net cut" value={job.netCutQty.toLocaleString()} risk={job.netCutQty ? "ON_TRACK" : "ACTION"} />
        </div>
      </section>
      <section>
        <SectionLabel>WIP Position</SectionLabel>
        <WipSummaryBlock summary={wip.data} isLoading={wip.isLoading} />
      </section>
      {drawer ? (
        <Timeline
          rows={[
            { title: "Release received", meta: job.releaseNo, tone: "ON_TRACK" },
            { title: "Cutting output", meta: `${job.netCutQty.toLocaleString()} pcs net cut`, tone: job.netCutQty ? "ON_TRACK" : "WATCH" },
            { title: "Sewing handover", meta: job.handedOverAt ? formatDateTime(job.handedOverAt) : "Pending", tone: job.handedOverAt ? "ON_TRACK" : "ACTION" },
          ]}
        />
      ) : null}
    </div>
  );
}

function WipSummaryBlock({ summary, isLoading }: { summary?: WipSummary; isLoading: boolean }) {
  if (isLoading) return <LoadingState label="Loading WIP" />;
  if (!summary) return <EmptyState title="No WIP" message="No execution WIP exists for this order." />;
  return (
    <div className="divide-y divide-grid-border border border-grid-border bg-white">
      {Object.entries(summary.stages).map(([stage, row]) => (
        <div key={stage} className="grid grid-cols-[1fr_auto] gap-2 px-3 py-2 text-sm">
          <span className="font-semibold text-primary">{stageLabel(stage)}</span>
          <span className="font-mono">{row.availableQuantity.toLocaleString()} / {row.quantity.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

export function SewingLineLoadingPage() {
  const queryClient = useQueryClient();
  const board = useQuery({
    queryKey: queryKeys.sewingLineLoadingBoard,
    queryFn: getSewingLineLoadingBoard,
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const rows = board.data?.lines ?? [];
  const selected = rows.find((row) => row.id === selectedId) ?? null;
  const realignmentRequest = useMutation({
    mutationFn: (row: SewingLineBoardRow) =>
      requestLineRealignment({
        lineLoadingId: row.lineLoadingId,
        targetOutput: row.target,
      }),
    onSuccess: async (request) => {
      setActionFeedback(`Realignment request ${request.requestNo} created through API.`);
      await queryClient.invalidateQueries({ queryKey: queryKeys.sewingLineLoadingBoard });
      await queryClient.invalidateQueries({ queryKey: queryKeys.sewingLineLoadings });
    },
    onError: (error) => {
      setActionFeedback(
        error instanceof Error ? error.message : "Realignment request failed.",
      );
    },
  });

  if (board.isLoading) return <LoadingState label="Loading sewing line board" />;
  if (board.error || !board.data) {
    return <EmptyState title="Line loading board unavailable" message="Refresh after seeding execution data." />;
  }

  const openLine = (row: SewingLineBoardRow) => {
    setSelectedId(row.id);
    setActionFeedback(null);
  };

  return (
    <section>
      <h1 className="sr-only">Sewing Line Loading</h1>
      <div className="mb-3 grid gap-2 md:grid-cols-2 xl:grid-cols-5">
        <LineBoardKpi label="Active Lines" value={formatNumber(board.data.summary.activeLines)} />
        <LineBoardKpi
          label="Overloaded Lines"
          value={String(board.data.summary.overloadedLines).padStart(2, "0")}
          tone="ACTION"
        />
        <LineBoardKpi
          label="Underloaded"
          value={String(board.data.summary.underloadedLines).padStart(2, "0")}
          tone="WATCH"
        />
        <LineBoardKpi
          label="Avg. Net-Good Eff."
          value={`${Math.round(board.data.summary.avgNetGoodEfficiency)}%`}
          tone="ON_TRACK"
        />
        <LineBoardKpi
          dark
          label="Highest Risk"
          value={board.data.summary.highestRisk.lineCode || "-"}
          meta={`Efficiency: ${formatPercent(board.data.summary.highestRisk.efficiencyPercent)} | Defect: ${formatPercent(
            board.data.summary.highestRisk.defectPercent,
          )}`}
          tone="CRITICAL"
        />
      </div>

      <div className="min-w-0 overflow-x-auto border border-grid-border bg-white">
          <table className="min-w-[1340px] border-collapse text-[14px]" aria-label="Sewing line loading board">
            <thead className="bg-slate-100 text-[12px] uppercase tracking-[0.04em] text-slate-600">
              <tr>
                {["LINE ID", "PO#", "STYLE", "SMV", "TARGET", "ACTUAL", "EFF %", "DEFECT %", "NET GOOD", "MANPOWER (P/A)", "STATUS", "RISK"].map(
                  (header, index) => (
                    <th
                      key={header}
                      scope="col"
                      className={`h-8 border-b border-r border-grid-border px-2 text-left font-bold last:border-r-0 ${
                        index === 0 ? "sticky left-0 z-10 bg-slate-100" : ""
                      }`}
                    >
                      {header}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const active = row.id === selected?.id;
                return (
                  <tr
                    key={row.id}
                    tabIndex={0}
                    aria-selected={active}
                    onClick={() => openLine(row)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openLine(row);
                      }
                    }}
                    className={`cursor-pointer outline-none transition-colors hover:bg-secondary/10 focus:bg-secondary/10 focus:ring-2 focus:ring-inset focus:ring-secondary/30 ${
                      active ? "bg-risk-action/5" : "odd:bg-white even:bg-slate-50/60"
                    }`}
                  >
                    <td className={`sticky left-0 z-10 h-8 border-b border-r border-grid-border px-2 ${active ? "bg-risk-action/5" : "bg-inherit"}`}>
                      <span className="font-bold text-primary">{row.lineCode}</span>
                    </td>
                    <td className="h-8 border-b border-r border-grid-border px-2 font-mono">{row.poNo}</td>
                    <td className="h-8 border-b border-r border-grid-border px-2 font-semibold">{row.style}</td>
                    <td className="h-8 border-b border-r border-grid-border px-2 font-mono">{row.smv.toFixed(1)}</td>
                    <td className="h-8 border-b border-r border-grid-border px-2 text-right font-mono">{formatNumber(row.target)}</td>
                    <td className={`h-8 border-b border-r border-grid-border px-2 text-right font-mono font-bold ${row.status === "DOWN" ? "text-risk-action" : ""}`}>
                      {formatNumber(row.actual)}
                    </td>
                    <td className="h-8 border-b border-r border-grid-border px-2">
                      <LineEfficiencyCell row={row} />
                    </td>
                    <td className={`h-8 border-b border-r border-grid-border px-2 text-right font-mono ${row.defectPercent >= 4 ? "font-bold text-risk-action" : ""}`}>
                      {formatPercent(row.defectPercent)}
                    </td>
                    <td className="h-8 border-b border-r border-grid-border px-2 text-right font-mono">{formatNumber(row.netGood)}</td>
                    <td className="h-8 border-b border-r border-grid-border px-2 text-center font-mono">
                      <span className={row.actualManpower < row.plannedManpower ? "font-bold text-risk-action" : ""}>
                        {row.plannedManpower} / {row.actualManpower}
                      </span>
                    </td>
                    <td className="h-8 border-b border-r border-grid-border px-2">
                      <LineStatusPill status={row.status} />
                    </td>
                    <td className="h-8 border-b border-grid-border px-2">
                      <RiskBadge risk={row.riskStatus} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      <RightDrawer
        open={Boolean(selected)}
        title={selected?.analysis.title ?? "Line analysis"}
        subtitle={selected?.analysis.subtitle}
        onClose={() => {
          setSelectedId(null);
          setActionFeedback(null);
        }}
      >
        {selected ? (
          <LineAnalysisPanel
            line={selected}
            feedback={actionFeedback}
            isActionPending={realignmentRequest.isPending}
            onApprove={() => realignmentRequest.mutate(selected)}
          />
        ) : null}
      </RightDrawer>
    </section>
  );
}

function LineBoardKpi({
  label,
  value,
  meta,
  tone = "ON_TRACK",
  dark = false,
}: {
  label: string;
  value: string;
  meta?: string;
  tone?: SewingLineBoardRow["riskStatus"];
  dark?: boolean;
}) {
  const borderClass =
    tone === "CRITICAL"
      ? "border-l-primary"
      : tone === "ACTION"
        ? "border-l-risk-action"
        : tone === "WATCH"
          ? "border-l-risk-watch"
          : "border-l-risk-on-track";
  if (dark) {
    return (
      <div className="border border-primary bg-primary px-3 py-3 text-white">
        <p className="text-[12px] font-bold tracking-[0.06em] text-slate-300">{label}</p>
        <p className="mt-1 text-[18px] font-bold leading-6">{value}</p>
        {meta ? <p className="mt-1 text-[12px] font-medium text-slate-300">{meta}</p> : null}
      </div>
    );
  }
  return (
    <div className={`border border-grid-border border-l-4 ${borderClass} bg-white px-3 py-3`}>
      <p className="text-[12px] font-bold text-slate-700">{label}</p>
      <p className={`mt-1 text-[22px] font-semibold leading-7 ${tone === "ACTION" ? "text-risk-action" : tone === "WATCH" ? "text-risk-watch" : "text-risk-on-track"}`}>
        {value}
      </p>
      {meta ? <p className="mt-1 text-[12px] font-medium text-slate-500">{meta}</p> : null}
    </div>
  );
}

function LineEfficiencyCell({ row }: { row: SewingLineBoardRow }) {
  const color =
    row.riskStatus === "ACTION" || row.riskStatus === "CRITICAL"
      ? "bg-risk-action"
      : row.riskStatus === "WATCH"
        ? "bg-risk-watch"
        : "bg-risk-on-track";
  return (
    <div className="flex min-w-20 items-center gap-2">
      <div className="h-2 flex-1 overflow-hidden rounded-sm bg-slate-200">
        <div className={`h-full ${color}`} style={{ width: `${Math.min(row.efficiencyPercent, 100)}%` }} />
      </div>
      <span className={`w-10 text-right font-mono text-[12px] ${row.riskStatus === "ACTION" ? "font-bold text-risk-action" : "text-primary"}`}>
        {Math.round(row.efficiencyPercent)}%
      </span>
    </div>
  );
}

function LineStatusPill({ status }: { status: string }) {
  const tone =
    status === "DOWN"
      ? "border-risk-action/30 bg-risk-action/10 text-risk-action"
      : status === "CHANGEOVER"
        ? "border-risk-watch/30 bg-risk-watch/10 text-risk-watch"
        : "border-emerald-200 bg-emerald-50 text-emerald-700";
  return (
    <span className={`inline-flex rounded-sm border px-2 py-0.5 text-[11px] font-bold uppercase ${tone}`}>
      {status}
    </span>
  );
}

function LineAnalysisPanel({
  line,
  feedback,
  isActionPending,
  onApprove,
}: {
  line: SewingLineBoardRow;
  feedback: string | null;
  isActionPending: boolean;
  onApprove: () => void;
}) {
  const analysis = line.analysis;
  return (
    <div className="space-y-4">
      {feedback ? <Feedback message={feedback} /> : null}
        <section>
          <SectionLabel>{"Today's Hourly Output"}</SectionLabel>
          <HourlyOutputChart line={line} />
        </section>

        <section className="border border-grid-border bg-slate-50 px-3 py-3">
          <div className="mb-2 text-[12px] font-bold text-slate-700">Bottleneck Operation</div>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <div>
              <p className="text-[15px] font-bold text-primary">{analysis.bottleneckOperation.operationName}</p>
              <p className="mt-1 text-[12px] text-slate-600">
                SMV: {analysis.bottleneckOperation.smv.toFixed(1)} | Station: {analysis.bottleneckOperation.station}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[20px] font-bold text-risk-action">{formatNumber(analysis.bottleneckOperation.wipAccumulation)} pcs</p>
              <p className="text-[11px] uppercase text-slate-600">WIP Accumulation</p>
            </div>
          </div>
        </section>

        <section>
          <SectionLabel>Operator Allocation</SectionLabel>
          <div className="space-y-2">
            {analysis.operatorAllocation.map((operator) => (
              <div key={`${line.id}-${operator.code}`} className="grid min-h-12 grid-cols-[40px_1fr_auto] items-center gap-2 border border-grid-border px-2">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-[12px] font-bold ${operator.status === "ABSENT" ? "bg-risk-action/15 text-risk-action" : "bg-slate-100 text-primary"}`}>
                  {operator.code}
                </div>
                <div>
                  <p className="font-bold text-primary">{operator.name}</p>
                  <p className="text-[12px] text-slate-600">{operator.role}</p>
                </div>
                <span className={`rounded-sm px-2 py-1 text-[11px] font-bold uppercase ${operator.status === "ABSENT" ? "bg-risk-action/10 text-risk-action" : "bg-emerald-50 text-emerald-700"}`}>
                  {operator.status}
                </span>
              </div>
            ))}
            <p className="text-[13px] italic text-risk-action">{analysis.absenceImpact}</p>
          </div>
        </section>

        <section className="bg-primary px-3 py-4 text-white">
          <div className="mb-2 text-[12px] font-bold tracking-[0.04em] text-slate-300">{analysis.recoveryAction.label}</div>
          <p className="text-[15px] font-bold leading-6">{analysis.recoveryAction.description}</p>
          <button
            className="mt-4 w-full bg-white px-3 py-2 text-[13px] font-bold text-primary disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            disabled={isActionPending}
            onClick={onApprove}
          >
            {isActionPending ? "Sending..." : analysis.recoveryAction.actionLabel}
          </button>
        </section>
    </div>
  );
}

function HourlyOutputChart({ line }: { line: SewingLineBoardRow }) {
  const maxValue = Math.max(...line.analysis.hourlyOutput.flatMap((bucket) => [bucket.target, bucket.actual]), 1);
  return (
    <div>
      <div className="flex h-28 items-end gap-4 border-b border-grid-border px-2">
        {line.analysis.hourlyOutput.map((bucket) => (
          <div key={bucket.time} className="flex flex-1 items-end justify-center gap-1">
            <div
              className="w-4 bg-emerald-200"
              title={`Target ${bucket.target}`}
              style={{ height: `${Math.max((bucket.target / maxValue) * 100, 8)}%` }}
            />
            <div
              className="w-4 bg-risk-action"
              title={`Actual ${bucket.actual}`}
              style={{ height: `${Math.max((bucket.actual / maxValue) * 100, 6)}%` }}
            />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-5 px-1 pt-1 text-center font-mono text-[11px] text-primary">
        {line.analysis.hourlyOutput.map((bucket) => (
          <span key={bucket.time}>{bucket.time}</span>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between text-[12px]">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 bg-emerald-200" />
          Target
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 bg-risk-action" />
          Actual
        </span>
      </div>
    </div>
  );
}

function formatNumber(value: number) {
  return value.toLocaleString("en-US");
}

function formatPercent(value: number) {
  return `${Number(value).toFixed(value % 1 === 0 ? 0 : 1)}%`;
}

export function LineRealignmentWorkbenchPage() {
  const queryClient = useQueryClient();
  const loadings = useQuery({ queryKey: queryKeys.sewingLineLoadings, queryFn: getSewingLineLoadings });
  const [selected, setSelected] = useState<SewingLineLoading | null>(null);
  const [preview, setPreview] = useState<LineRealignmentPreview | null>(null);
  const [realignment, setRealignment] = useState<LineRealignment | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const active = selected ?? loadings.data?.[0] ?? null;
  const previewMutation = useMutation({
    mutationFn: (loading: SewingLineLoading) =>
      previewLineRealignment({
        lineLoadingId: loading.id,
        lineId: loading.lineId,
        bulletinId: loading.bulletinId,
        targetOutput: loading.targetOutputPerDay,
      }),
    onSuccess: setPreview,
  });
  const requestMutation = useMutation({
    mutationFn: (loading: SewingLineLoading) =>
      requestLineRealignment({ lineLoadingId: loading.id, targetOutput: loading.targetOutputPerDay }),
    onSuccess: async (data) => {
      setRealignment(data);
      setFeedback("Line realignment request created.");
      await queryClient.invalidateQueries({ queryKey: queryKeys.sewingLineLoadings });
    },
  });
  const approveMutation = useMutation({
    mutationFn: (requestId: string) => approveLineRealignment(requestId),
    onSuccess: (data) => {
      setRealignment(data);
      setFeedback("Line realignment approved.");
    },
  });
  const applyMutation = useMutation({
    mutationFn: (requestId: string) => applyLineRealignment(requestId),
    onSuccess: (data) => {
      setRealignment(data);
      setFeedback("Line realignment applied to the active loading.");
    },
  });

  const currentPreview = preview ?? (realignment as LineRealignmentPreview | null);

  return (
    <section>
      <PrototypeHeader
        title="Line Realignment Workbench"
        subtitle="Compare current line setup against OB-required setup and approve before/after output improvement."
        actions={<button className="ops-button ops-button-primary" type="button" onClick={() => active && previewMutation.mutate(active)}><SlidersHorizontal className="h-3.5 w-3.5" /> Preview</button>}
      />
      <Feedback message={feedback} />
      <div className="grid min-h-[calc(100vh-210px)] gap-3 xl:grid-cols-[300px_minmax(0,1fr)_380px]">
        <Panel title="Active Line Load">
          <div className="space-y-2">
            {(loadings.data ?? []).map((loading) => (
              <button
                key={loading.id}
                type="button"
                onClick={() => {
                  setSelected(loading);
                  previewMutation.mutate(loading);
                }}
                className="w-full border border-grid-border bg-white p-3 text-left hover:bg-slate-50"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-mono text-[11px] text-slate-500">{loading.lineCode}</p>
                    <p className="font-semibold text-primary">{loading.orderNo}</p>
                  </div>
                  <RiskBadge risk={loading.riskStatus} />
                </div>
                <p className="mt-2 text-[12px] text-slate-500">Target {loading.targetOutputPerDay} / {loading.fitStatus}</p>
              </button>
            ))}
          </div>
        </Panel>
        <Panel title="Current vs Required Setup">
          {currentPreview ? (
            <div className="grid gap-3 lg:grid-cols-3">
              <SetupColumn title="Current Line" rows={[`Line ${currentPreview.lineCode}`, `${currentPreview.expectedOutputBefore} pcs expected`, `${currentPreview.changeoverMinutes} min changeover`]} />
              <SetupColumn title="OB Required" rows={[currentPreview.styleCode, `OB ${currentPreview.bulletinVersion}`, `${currentPreview.machineGaps.length + currentPreview.skillGaps.length} gaps`]} />
              <SetupColumn title="Recommended Setup" rows={[`${currentPreview.expectedOutputAfter} pcs after`, currentPreview.fitStatus, currentPreview.approvalRequired ? "Approval required" : "No approval"]} />
            </div>
          ) : (
            <EmptyState title="No preview" message="Select an active line loading and preview realignment." />
          )}
        </Panel>
        <Panel title="Gap & Approval Panel">
          {currentPreview ? (
            <div className="space-y-4">
              <section>
                <SectionLabel>Expected Output</SectionLabel>
                <div className="grid grid-cols-[1fr_auto_1fr] gap-2">
                  <KpiTile label="Before" value={currentPreview.expectedOutputBefore} risk="ACTION" />
                  <span className="flex items-center justify-center text-xl text-slate-400">-&gt;</span>
                  <KpiTile label="After" value={currentPreview.expectedOutputAfter} risk="ON_TRACK" />
                </div>
              </section>
              <GapList title="Machine Gaps" rows={currentPreview.machineGaps} />
              <GapList title="Skill Gaps" rows={currentPreview.skillGaps} />
              <div className="grid grid-cols-3 gap-2">
                <ActionButton disabled={!active} onClick={() => active && requestMutation.mutate(active)}>Request</ActionButton>
                <ActionButton disabled={!realignment} variant="ghost" onClick={() => realignment && approveMutation.mutate(realignment.id)}>Approve</ActionButton>
                <ActionButton disabled={!realignment} variant="ghost" onClick={() => realignment && applyMutation.mutate(realignment.id)}>Apply</ActionButton>
              </div>
            </div>
          ) : null}
        </Panel>
      </div>
    </section>
  );
}

function SetupColumn({ title, rows }: { title: string; rows: string[] }) {
  return (
    <div className="border border-grid-border bg-white p-3">
      <SectionLabel>{title}</SectionLabel>
      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row} className="border-b border-grid-border py-2 text-sm font-medium text-primary last:border-b-0">{row}</div>
        ))}
      </div>
    </div>
  );
}

function GapList({ title, rows }: { title: string; rows: Array<{ gap: number; recommendation: string; label?: string; machineType?: string; operationName?: string }> }) {
  return (
    <section>
      <SectionLabel>{title}</SectionLabel>
      <div className="space-y-2">
        {rows.map((row, index) => (
          <div key={`${row.recommendation}-${index}`} className="border border-grid-border bg-white px-3 py-2 text-sm">
            <div className="flex justify-between">
              <span className="font-semibold text-primary">{row.label ?? row.machineType ?? row.operationName ?? "Gap"}</span>
              <span className="font-mono text-risk-action">Gap {row.gap}</span>
            </div>
            <p className="mt-1 text-[12px] text-slate-600">{row.recommendation}</p>
          </div>
        ))}
        {!rows.length ? <p className="text-sm text-slate-500">No gap detected.</p> : null}
      </div>
    </section>
  );
}

export function SewingOutputCapturePage() {
  const queryClient = useQueryClient();
  const loadings = useQuery({ queryKey: queryKeys.sewingLineLoadings, queryFn: getSewingLineLoadings });
  const output = useQuery({ queryKey: queryKeys.sewingOutput, queryFn: getSewingOutput });
  const active = (loadings.data ?? []).find((loading) => loading.status === "ACTIVE") ?? loadings.data?.[0] ?? null;
  const [gross, setGross] = useState(120);
  const [defect, setDefect] = useState(0);
  const [rework, setRework] = useState(0);
  const [confirm, setConfirm] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const netGood = Math.max(gross - defect - rework, 0);
  const invalid = defect + rework > gross || !active;
  const submit = useMutation({
    mutationFn: () =>
      createSewingOutput({
        lineLoadingId: active?.id ?? "",
        clientEventId: `ui-${Date.now()}`,
        timeSlot: "CURRENT",
        grossQty: gross,
        defectQty: defect,
        reworkQty: rework,
        remarks: "Desktop output capture.",
      }),
    onSuccess: async (entry) => {
      setFeedback(`Output submitted: ${entry.netGoodQty} net-good pcs.`);
      setConfirm(false);
      await queryClient.invalidateQueries({ queryKey: queryKeys.sewingOutput });
      await queryClient.invalidateQueries({ queryKey: queryKeys.sewingLineEfficiency });
    },
  });

  return (
    <section className="grid min-h-[calc(100vh-112px)] gap-3 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div>
        <PrototypeHeader
          title="Sewing Output Capture"
          subtitle="Large numeric capture for gross, defect, rework, and net-good truth against an active line assignment."
          actions={<button className="ops-button ops-button-primary" type="button" disabled={invalid} onClick={() => setConfirm(true)}><CheckCircle2 className="h-3.5 w-3.5" /> Submit Output</button>}
        />
        <Feedback message={feedback} />
        <div className="grid gap-3 md:grid-cols-2">
          <Panel title="Active Line Task">
            {active ? (
              <div className="space-y-2">
                <InfoRow label="Line" value={active.lineCode} />
                <InfoRow label="Order" value={active.orderNo} />
                <InfoRow label="Style" value={active.styleCode} />
                <InfoRow label="Target" value={`${active.targetOutputPerDay} pcs/day`} />
                <InfoRow label="Status" value={<StatusBadge status={active.status} />} />
              </div>
            ) : (
              <EmptyState title="No active line" message="Output requires an active release and line loading." />
            )}
          </Panel>
          <Panel title="Net-Good Calculator">
            <div className="grid gap-3">
              <NumberField label="Gross Output Entry" value={gross} onChange={setGross} />
              <NumberField label="Defect Qty" value={defect} onChange={setDefect} risk="ACTION" />
              <NumberField label="Rework Qty" value={rework} onChange={setRework} risk="WATCH" />
              <div className="border border-primary bg-primary p-4 text-white">
                <span className="block text-[10px] font-bold uppercase text-white/60">Net Good Quantity</span>
                <span className="font-mono text-[38px] font-bold leading-none">{netGood}</span>
              </div>
              {invalid ? <p className="text-sm font-semibold text-risk-action">Defect and rework cannot exceed gross output.</p> : null}
            </div>
          </Panel>
        </div>
      </div>
      <Panel title="Latest Output">
        <div className="space-y-2">
          {(output.data ?? []).slice(0, 8).map((entry) => (
            <div key={entry.id} className="grid grid-cols-[1fr_auto] gap-2 border border-grid-border bg-white px-3 py-2 text-sm">
              <div>
                <p className="font-semibold text-primary">{entry.lineCode} / {entry.orderNo}</p>
                <p className="text-[11px] text-slate-500">{entry.timeSlot} / gross {entry.grossQty}</p>
              </div>
              <span className="font-mono text-lg font-semibold">{entry.netGoodQty}</span>
            </div>
          ))}
          {output.isLoading ? <LoadingState label="Loading output" /> : null}
          {!output.isLoading && !(output.data ?? []).length ? <EmptyState title="No output yet" message="Submit output against the active line." /> : null}
        </div>
      </Panel>
      <ConfirmDialog
        open={confirm}
        title="Submit sewing output"
        message={`Record ${netGood} net-good pieces for ${active?.lineCode ?? "the selected line"}.`}
        confirmLabel="Submit"
        onConfirm={() => submit.mutate()}
        onCancel={() => setConfirm(false)}
      />
    </section>
  );
}

function NumberField({
  label,
  value,
  onChange,
  risk,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  risk?: "ACTION" | "WATCH";
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.05em] text-slate-500">{label}</span>
      <input
        className={`h-12 w-full border-2 px-4 font-mono text-xl outline-none ${risk === "ACTION" ? "border-risk-action/40 focus:border-risk-action" : risk === "WATCH" ? "border-risk-watch/50 focus:border-risk-watch" : "border-grid-border focus:border-primary"}`}
        type="number"
        min={0}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}
