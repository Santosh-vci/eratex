"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

import {
  getCustomers,
  getMachines,
  getMaterials,
  getProductTypes,
  getThresholds,
  getVendors,
} from "@/services/api/master-data";
import {
  approveOperationBulletin,
  cloneOperationBulletin,
  getBom,
  getBoms,
  getCapacityDays,
  getLineCapability,
  getOperationBulletin,
  getOperationBulletins,
  getStyle,
  getStyles,
  getWashRoutes,
} from "@/services/api/technical";
import { queryKeys } from "@/services/query-keys";
import { ConfirmDialog } from "@/shared/ConfirmDialog";
import { DataGrid } from "@/shared/DataGrid";
import { RightDrawer } from "@/shared/RightDrawer";
import { RiskBadge, StatusBadge } from "@/shared/badges";
import { ActionButton, Breadcrumbs, FilterBar, ModuleHeader } from "@/shared/layout";
import { EmptyState } from "@/shared/states/EmptyState";
import { LoadingState } from "@/shared/states/LoadingState";
import type {
  BOMHeader,
  BOMLine,
  LineCapability,
  Machine,
  Material,
  OperationBulletin,
  OperationBulletinLine,
  PlanningThreshold,
  StyleDetail,
  StyleListItem,
  WashRoute,
  WorkcenterCapacityDay,
} from "@/types/domain";

type Metric = {
  label: string;
  value: string | number;
  tone?: "ON_TRACK" | "WATCH" | "ACTION" | "CRITICAL";
};

function MetricBand({ metrics }: { metrics: Metric[] }) {
  return (
    <dl className="mb-4 grid gap-2 md:grid-cols-4">
      {metrics.map((metric) => (
        <div key={metric.label} className="border border-grid-border bg-white px-3 py-2">
          <dt className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
            {metric.label}
          </dt>
          <dd className="mt-1 flex items-center justify-between text-lg font-semibold text-slate-950">
            {metric.value}
            {metric.tone ? <RiskBadge risk={metric.tone} /> : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function readinessRisk(item: StyleListItem | StyleDetail) {
  return item.planningReady ? "ON_TRACK" : item.missingItems.length > 2 ? "ACTION" : "WATCH";
}

function ReadinessChecklist({ style }: { style: StyleListItem | StyleDetail }) {
  const missing = new Set(style.missingItems);
  const checks = [
    ["APPROVED_STYLE", "Style approved"],
    ["APPROVED_BOM", "Approved BOM"],
    ["APPROVED_OPERATION_BULLETIN", "Approved operation bulletin"],
    ["APPROVED_WASH_ROUTE", "Approved wash route"],
  ];

  return (
    <div className="space-y-2">
      {checks.map(([code, label]) => {
        const blocked = missing.has(code);
        return (
          <div key={code} className="flex items-center justify-between border-b border-grid-border py-2">
            <span className="text-sm text-slate-700">{label}</span>
            <RiskBadge risk={blocked ? "ACTION" : "ON_TRACK"} />
          </div>
        );
      })}
    </div>
  );
}

function Feedback({ message }: { message: string | null }) {
  if (!message) {
    return null;
  }
  return (
    <div role="status" className="mb-3 border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
      {message}
    </div>
  );
}

export function MasterDataGovernancePage() {
  const styles = useQuery({ queryKey: queryKeys.styles, queryFn: getStyles });
  const customers = useQuery({ queryKey: queryKeys.customers, queryFn: getCustomers });
  const materials = useQuery({ queryKey: queryKeys.materials, queryFn: getMaterials });
  const thresholds = useQuery({ queryKey: queryKeys.thresholds, queryFn: getThresholds });
  const [selected, setSelected] = useState<StyleListItem | null>(null);

  const rows = styles.data ?? [];
  const missingRows = rows.filter((style) => !style.planningReady);
  const columns: ColumnDef<StyleListItem>[] = [
    { accessorKey: "styleCode", header: "Style" },
    { accessorKey: "customerName", header: "Customer" },
    { accessorKey: "productType", header: "Product" },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    {
      accessorKey: "planningReady",
      header: "Readiness",
      cell: ({ row }) => <RiskBadge risk={readinessRisk(row.original)} />,
    },
    { accessorKey: "missingItems", header: "Missing", cell: ({ row }) => row.original.missingItems.length },
  ];

  return (
    <section>
      <Breadcrumbs items={["Master Data", "Governance"]} />
      <ModuleHeader
        eyebrow="EOS-02"
        title="Master Data Governance"
        description="Controlled technical masters and readiness blockers before order planning begins."
      />
      <MetricBand
        metrics={[
          { label: "Styles", value: rows.length, tone: "ON_TRACK" },
          { label: "Blocked styles", value: missingRows.length, tone: missingRows.length ? "ACTION" : "ON_TRACK" },
          { label: "Customers", value: customers.data?.length ?? 0 },
          { label: "Materials", value: materials.data?.length ?? 0 },
        ]}
      />
      <FilterBar>
        <StatusBadge status="Phase 2" />
        <StatusBadge status={`${thresholds.data?.length ?? 0} thresholds`} />
        <StatusBadge status="Admin write surface" />
      </FilterBar>
      <DataGrid
        data={missingRows}
        columns={columns}
        isLoading={styles.isLoading}
        error={styles.error ? "Style readiness failed to load." : null}
        onRowClick={setSelected}
      />
      <RightDrawer
        open={Boolean(selected)}
        title={selected?.styleCode ?? "Style readiness"}
        onClose={() => setSelected(null)}
      >
        {selected ? (
          <div className="space-y-4">
            <ReadinessChecklist style={selected} />
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                Missing items
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {selected.missingItems.map((item) => <StatusBadge key={item} status={item} />)}
              </div>
            </div>
          </div>
        ) : null}
      </RightDrawer>
    </section>
  );
}

export function StyleTechnicalListPage() {
  const styles = useQuery({ queryKey: queryKeys.styles, queryFn: getStyles });
  const productTypes = useQuery({ queryKey: queryKeys.productTypes, queryFn: getProductTypes });
  const [selected, setSelected] = useState<StyleListItem | null>(null);
  const columns: ColumnDef<StyleListItem>[] = [
    {
      accessorKey: "styleCode",
      header: "Style",
      cell: ({ row }) => (
        <Link className="font-semibold text-primary underline-offset-2 hover:underline" href={`/technical/styles/${row.original.id}`}>
          {row.original.styleCode}
        </Link>
      ),
    },
    { accessorKey: "customerName", header: "Customer" },
    { accessorKey: "productType", header: "Product" },
    { accessorKey: "overallComplexity", header: "Complexity" },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    { accessorKey: "planningReady", header: "Ready", cell: ({ row }) => <RiskBadge risk={readinessRisk(row.original)} /> },
  ];

  return (
    <section>
      <Breadcrumbs items={["Technical", "Styles"]} />
      <ModuleHeader
        eyebrow="Style technical file"
        title="Style Technical File"
        description="Approved style masters, linked BOM, operation bulletin, and wash-route readiness."
      />
      <FilterBar>
        {(productTypes.data ?? []).map((productType) => <StatusBadge key={productType.id} status={productType.code} />)}
      </FilterBar>
      <DataGrid
        data={styles.data ?? []}
        columns={columns}
        isLoading={styles.isLoading}
        error={styles.error ? "Styles failed to load." : null}
        onRowClick={setSelected}
      />
      <RightDrawer open={Boolean(selected)} title={selected?.styleCode ?? "Style"} onClose={() => setSelected(null)}>
        {selected ? (
          <div className="space-y-4">
            <ReadinessChecklist style={selected} />
            <Link className="inline-flex rounded bg-primary px-3 py-2 text-sm text-white" href={`/technical/styles/${selected.id}`}>
              Open technical file
            </Link>
          </div>
        ) : null}
      </RightDrawer>
    </section>
  );
}

export function StyleTechnicalDetailPage({ styleId }: { styleId: string }) {
  const style = useQuery({ queryKey: [...queryKeys.styles, styleId], queryFn: () => getStyle(styleId) });

  if (style.isLoading) {
    return <LoadingState label="Loading style technical file" />;
  }
  if (!style.data) {
    return <EmptyState title="Style not available" message="The selected style could not be loaded." />;
  }

  return (
    <section>
      <Breadcrumbs items={["Technical", "Styles", style.data.styleCode]} />
      <ModuleHeader
        eyebrow="Style detail"
        title={style.data.styleCode}
        description={style.data.description}
      />
      <MetricBand
        metrics={[
          { label: "Status", value: style.data.status, tone: style.data.planningReady ? "ON_TRACK" : "ACTION" },
          { label: "Product", value: style.data.productType },
          { label: "Complexity", value: style.data.overallComplexity },
          { label: "Missing", value: style.data.missingItems.length, tone: style.data.missingItems.length ? "ACTION" : "ON_TRACK" },
        ]}
      />
      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <div className="border border-grid-border bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-900">Planning readiness</h3>
          <div className="mt-3">
            <ReadinessChecklist style={style.data} />
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <TechnicalRef label="Approved BOM" value={style.data.readiness.approvedBomId} />
          <TechnicalRef label="Approved bulletin" value={style.data.readiness.approvedOperationBulletinId} />
          <TechnicalRef label="Approved wash route" value={style.data.readiness.approvedWashRouteId} />
        </div>
      </div>
    </section>
  );
}

function TechnicalRef({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="border border-grid-border bg-white p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">{label}</p>
      <p className="mt-2 break-all text-sm font-semibold text-slate-900">{value ?? "Missing"}</p>
    </div>
  );
}

export function BomTechnicalPage() {
  const boms = useQuery({ queryKey: queryKeys.boms, queryFn: getBoms });
  const [selected, setSelected] = useState<BOMHeader | null>(null);
  const detail = useQuery({
    queryKey: [...queryKeys.boms, selected?.id],
    queryFn: () => getBom(selected?.id ?? ""),
    enabled: Boolean(selected),
  });
  const columns: ColumnDef<BOMHeader>[] = [
    { accessorKey: "styleCode", header: "Style" },
    { accessorKey: "version", header: "Version" },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    { accessorKey: "lineCount", header: "Lines" },
    { accessorKey: "approvedAt", header: "Approved" },
  ];

  return (
    <section>
      <Breadcrumbs items={["Technical", "BOM"]} />
      <ModuleHeader
        eyebrow="BOM and material planning"
        title="BOM Version Control"
        description="Approved material definitions that later procurement and PCD workflows will consume."
      />
      <DataGrid
        data={boms.data ?? []}
        columns={columns}
        isLoading={boms.isLoading}
        error={boms.error ? "BOMs failed to load." : null}
        onRowClick={setSelected}
      />
      <RightDrawer open={Boolean(selected)} title={selected?.styleCode ?? "BOM"} onClose={() => setSelected(null)}>
        {detail.isLoading ? <LoadingState label="Loading BOM lines" /> : null}
        {detail.data?.lines ? <BomLines lines={detail.data.lines} /> : null}
      </RightDrawer>
    </section>
  );
}

function BomLines({ lines }: { lines: BOMLine[] }) {
  return (
    <div className="space-y-3">
      {lines.map((line) => (
        <div key={line.id} className="border-b border-grid-border pb-3">
          <p className="text-sm font-semibold text-slate-900">{line.material.code}</p>
          <p className="text-xs text-slate-500">
            {line.consumptionPerPiece} {line.uom} / pc, wastage {line.wastagePercent}%
          </p>
          <StatusBadge status={line.requiredStage} />
        </div>
      ))}
    </div>
  );
}

export function OperationBulletinsPage() {
  const queryClient = useQueryClient();
  const bulletins = useQuery({ queryKey: queryKeys.operationBulletins, queryFn: getOperationBulletins });
  const [selected, setSelected] = useState<OperationBulletin | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<"approve" | "clone" | null>(null);
  const approve = useMutation({
    mutationFn: (bulletinId: string) => approveOperationBulletin(bulletinId),
    onSuccess: async () => {
      setFeedback("Operation bulletin approved.");
      setConfirm(null);
      await queryClient.invalidateQueries({ queryKey: queryKeys.operationBulletins });
    },
  });
  const clone = useMutation({
    mutationFn: (bulletin: OperationBulletin) => cloneOperationBulletin(bulletin.id, `${bulletin.version}-NEXT`),
    onSuccess: async () => {
      setFeedback("Operation bulletin cloned as a new draft.");
      setConfirm(null);
      await queryClient.invalidateQueries({ queryKey: queryKeys.operationBulletins });
    },
  });
  const columns: ColumnDef<OperationBulletin>[] = [
    { accessorKey: "styleCode", header: "Style" },
    { accessorKey: "version", header: "Version" },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    { accessorKey: "totalSmv", header: "SMV" },
    { accessorKey: "operationCount", header: "Ops" },
    { accessorKey: "criticalOperationCount", header: "Critical" },
  ];

  return (
    <section>
      <Breadcrumbs items={["Technical", "Operation Bulletins"]} />
      <ModuleHeader
        eyebrow="Operation bulletin master"
        title="Operation Bulletins"
        description="Versioned IE records that define style SMV, operation sequence, machine need, and skill need."
      />
      <Feedback message={feedback} />
      <DataGrid
        data={bulletins.data ?? []}
        columns={columns}
        isLoading={bulletins.isLoading}
        error={bulletins.error ? "Operation bulletins failed to load." : null}
        onRowClick={setSelected}
      />
      <RightDrawer
        open={Boolean(selected)}
        title={selected ? `${selected.styleCode} ${selected.version}` : "Bulletin"}
        onClose={() => setSelected(null)}
      >
        {selected ? (
          <div className="space-y-3">
            <StatusBadge status={selected.status} />
            <TechnicalRef label="Total SMV" value={String(selected.totalSmv)} />
            <TechnicalRef label="Operations" value={String(selected.operationCount)} />
            <div className="flex flex-wrap gap-2">
              <ActionButton onClick={() => setConfirm("approve")}>Approve</ActionButton>
              <ActionButton onClick={() => setConfirm("clone")}>Clone</ActionButton>
              <Link
                className="rounded border border-grid-border px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                href={`/technical/operation-bulletins/${selected.id}/routing`}
              >
                Open routing
              </Link>
            </div>
          </div>
        ) : null}
      </RightDrawer>
      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm === "approve" ? "Approve bulletin" : "Clone bulletin"}
        message={confirm === "approve" ? "Approved bulletins become read-only." : "A new draft version will be created."}
        confirmLabel={confirm === "approve" ? "Approve" : "Clone"}
        onConfirm={() => {
          if (!selected) return;
          if (confirm === "approve") approve.mutate(selected.id);
          if (confirm === "clone") clone.mutate(selected);
        }}
        onCancel={() => setConfirm(null)}
      />
    </section>
  );
}

export function RoutingBuilderPage({ bulletinId }: { bulletinId: string }) {
  const bulletin = useQuery({
    queryKey: [...queryKeys.operationBulletins, bulletinId],
    queryFn: () => getOperationBulletin(bulletinId),
  });
  const [selected, setSelected] = useState<OperationBulletinLine | null>(null);
  const columns: ColumnDef<OperationBulletinLine>[] = [
    { accessorKey: "sequenceNo", header: "Seq" },
    { accessorKey: "operationName", header: "Operation" },
    { accessorKey: "operationGroup", header: "Group" },
    { accessorKey: "machineType", header: "Machine" },
    { accessorKey: "skillLevel", header: "Skill" },
    { accessorKey: "smv", header: "SMV" },
    { accessorKey: "criticalOperation", header: "Critical", cell: ({ row }) => <StatusBadge status={row.original.criticalOperation ? "CRITICAL" : "NORMAL"} /> },
  ];

  return (
    <section>
      <Breadcrumbs items={["Technical", "Operation Bulletins", "Routing"]} />
      <ModuleHeader
        eyebrow="Routing builder"
        title={bulletin.data ? `${bulletin.data.styleCode} routing` : "Routing builder"}
        description="Operation sequence, machine type, skill level, QC checkpoints, and SMV summary."
      />
      <MetricBand
        metrics={[
          { label: "Total SMV", value: bulletin.data?.totalSmv ?? "-", tone: "ON_TRACK" },
          { label: "Operations", value: bulletin.data?.operationCount ?? "-" },
          { label: "Critical", value: bulletin.data?.criticalOperationCount ?? "-", tone: "WATCH" },
          { label: "Status", value: bulletin.data?.status ?? "-" },
        ]}
      />
      <DataGrid
        data={bulletin.data?.operations ?? []}
        columns={columns}
        isLoading={bulletin.isLoading}
        error={bulletin.error ? "Routing failed to load." : null}
        onRowClick={setSelected}
      />
      <RightDrawer
        open={Boolean(selected)}
        title={selected?.operationName ?? "Operation"}
        onClose={() => setSelected(null)}
      >
        {selected ? (
          <div className="space-y-3 text-sm text-slate-700">
            <StatusBadge status={selected.operationGroup} />
            <p>Machine: {selected.machineType ?? "Unassigned"}</p>
            <p>Skill: {selected.skillLevel}</p>
            <p>Target PPH: {selected.targetPph}</p>
            <p>QC checkpoint: {selected.qcCheckpoint ? "Yes" : "No"}</p>
          </div>
        ) : null}
      </RightDrawer>
    </section>
  );
}

export function OperatorSkillCapacityPage() {
  const capability = useQuery({ queryKey: queryKeys.lineCapability, queryFn: getLineCapability });
  const machines = useQuery({ queryKey: queryKeys.machines, queryFn: getMachines });
  const capacity = useQuery({ queryKey: queryKeys.capacityDays, queryFn: getCapacityDays });
  const machineRows = machines.data ?? [];
  const capabilityColumns: ColumnDef<LineCapability>[] = [
    { accessorKey: "lineCode", header: "Line" },
    { accessorKey: "currentManpower", header: "Manpower" },
    { accessorKey: "baselineEfficiency", header: "Efficiency" },
    { accessorKey: "availableMinutes", header: "Available min" },
    { accessorKey: "machineCount", header: "Machines" },
    { accessorKey: "allowedProductTypes", header: "Products", cell: ({ row }) => row.original.allowedProductTypes.join(", ") },
  ];
  const machineColumns: ColumnDef<Machine>[] = [
    { accessorKey: "code", header: "Machine" },
    { accessorKey: "machineTypeCode", header: "Type" },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
  ];
  const capacityColumns: ColumnDef<WorkcenterCapacityDay>[] = [
    { accessorKey: "workcenterCode", header: "Workcenter" },
    { accessorKey: "capacityDate", header: "Date" },
    { accessorKey: "availableMinutes", header: "Minutes" },
    { accessorKey: "capacityValue", header: "Capacity" },
  ];

  return (
    <section>
      <Breadcrumbs items={["Technical", "Operator Skill & Capacity"]} />
      <ModuleHeader
        eyebrow="Line capability foundation"
        title="Operator Skill and Capacity"
        description="Baseline manpower, machine coverage, skill-matrix surface, and workcenter capacity days."
      />
      <MetricBand
        metrics={[
          { label: "Lines", value: capability.data?.length ?? 0 },
          { label: "Machines", value: machineRows.length },
          { label: "Assigned", value: machineRows.filter((machine) => machine.status === "ASSIGNED").length, tone: "ON_TRACK" },
          { label: "Capacity days", value: capacity.data?.length ?? 0 },
        ]}
      />
      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <DataGrid
          data={capability.data ?? []}
          columns={capabilityColumns}
          isLoading={capability.isLoading}
          error={capability.error ? "Line capability failed to load." : null}
        />
        <DataGrid
          data={machineRows}
          columns={machineColumns}
          isLoading={machines.isLoading}
          error={machines.error ? "Machines failed to load." : null}
        />
      </div>
      <div className="mt-4">
        <DataGrid
          data={capacity.data ?? []}
          columns={capacityColumns}
          isLoading={capacity.isLoading}
          error={capacity.error ? "Capacity days failed to load." : null}
        />
      </div>
    </section>
  );
}

export function WashRouteStatusPanel() {
  const washRoutes = useQuery({ queryKey: queryKeys.washRoutes, queryFn: getWashRoutes });
  const rows = washRoutes.data ?? [];
  const columns: ColumnDef<WashRoute>[] = [
    { accessorKey: "code", header: "Route" },
    { accessorKey: "complexity", header: "Complexity" },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    { accessorKey: "stepCount", header: "Steps" },
  ];
  return <DataGrid data={rows} columns={columns} isLoading={washRoutes.isLoading} error={washRoutes.error ? "Wash routes failed to load." : null} />;
}

export function MaterialReadinessPanel() {
  const materials = useQuery({ queryKey: queryKeys.materials, queryFn: getMaterials });
  const vendors = useQuery({ queryKey: queryKeys.vendors, queryFn: getVendors });
  const thresholds = useQuery({ queryKey: queryKeys.thresholds, queryFn: getThresholds });
  const materialColumns: ColumnDef<Material>[] = [
    { accessorKey: "code", header: "Material" },
    { accessorKey: "materialType", header: "Type" },
    { accessorKey: "uom", header: "UOM" },
    { accessorKey: "inspectionRequired", header: "QC", cell: ({ row }) => <StatusBadge status={row.original.inspectionRequired ? "QC" : "NO QC"} /> },
  ];
  const thresholdColumns: ColumnDef<PlanningThreshold>[] = [
    { accessorKey: "code", header: "Threshold" },
    { accessorKey: "thresholdType", header: "Type" },
    { accessorKey: "value", header: "Value" },
    { accessorKey: "unit", header: "Unit" },
  ];
  const vendorCount = vendors.data?.length ?? 0;

  return (
    <div className="space-y-4">
      <MetricBand metrics={[{ label: "Materials", value: materials.data?.length ?? 0 }, { label: "Vendors", value: vendorCount }]} />
      <DataGrid data={materials.data ?? []} columns={materialColumns} isLoading={materials.isLoading} error={materials.error ? "Materials failed to load." : null} />
      <DataGrid data={thresholds.data ?? []} columns={thresholdColumns} isLoading={thresholds.isLoading} error={thresholds.error ? "Thresholds failed to load." : null} />
    </div>
  );
}
