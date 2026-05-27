"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo, useState } from "react";

import {
  getCustomers,
  getMachines,
  getMaterials,
  getProductTypes,
  getThresholds,
  getVendors,
} from "@/services/api/master-data";
import { getOperationBulletinPerformance } from "@/services/api/execution";
import { getMaterialReadiness } from "@/services/api/pre-production";
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
import { RiskBadge, StatusBadge } from "@/shared/badges";
import { ActionButton, Panel } from "@/shared/layout";
import {
  ChecklistRows,
  InfoRow,
  KpiGrid,
  KpiTile,
  ProgressBar,
  PrototypeHeader,
  PrototypeTabs,
  SectionLabel,
  Timeline,
} from "@/shared/prototype";
import { EmptyState } from "@/shared/states/EmptyState";
import { LoadingState } from "@/shared/states/LoadingState";
import type {
  BOMHeader,
  BOMLine,
  LineCapability,
  Machine,
  Material,
  MaterialReadiness,
  OperationBulletin,
  OperationBulletinLine,
  PlanningThreshold,
  RiskStatus,
  StyleDetail,
  StyleListItem,
  WashRoute,
} from "@/types/domain";

type OperatorRow = {
  id: string;
  name: string;
  primarySkill: string;
  skillLevel: string;
  efficiency: number;
  dhu: number;
  attendance: number;
  allocation: string;
  status: "ACTIVE" | "TRAINING" | "ABSENT";
  tag: string;
};

function readinessRisk(item: StyleListItem | StyleDetail): RiskStatus {
  return item.planningReady ? "ON_TRACK" : item.missingItems.length > 2 ? "ACTION" : "WATCH";
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "2-digit" });
}

function readinessRows(style: StyleListItem | StyleDetail) {
  const missing = new Set(style.missingItems);
  return [
    ["Approved style", "APPROVED_STYLE"],
    ["Approved BOM", "APPROVED_BOM"],
    ["Approved operation bulletin", "APPROVED_OPERATION_BULLETIN"],
    ["Approved wash route", "APPROVED_WASH_ROUTE"],
  ].map(([label, code]) => ({
    label,
    status: missing.has(code) ? "PENDING" : "VERIFIED",
    passed: !missing.has(code),
    note: code,
  }));
}

function Feedback({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div role="status" className="mb-3 border border-emerald-200 bg-emerald-50 px-3 py-2 text-[13px] text-emerald-800">
      {message}
    </div>
  );
}

function TechnicalRef({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="border border-grid-border bg-white p-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.05em] text-slate-500">{label}</p>
      <p className="mt-2 break-all font-mono text-xs font-semibold text-slate-900">{value ?? "Missing"}</p>
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
  const selectedStyle = selected ?? rows.find((style) => !style.planningReady) ?? rows[0] ?? null;
  const missingRows = rows.filter((style) => !style.planningReady);
  const staleParameters = (thresholds.data ?? []).filter((threshold) => threshold.isActive).length;
  const columns: ColumnDef<StyleListItem>[] = [
    { accessorKey: "styleCode", header: "Style code" },
    { accessorKey: "customerName", header: "Customer" },
    { accessorKey: "productType", header: "Product type" },
    { accessorKey: "overallComplexity", header: "Complexity" },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    { accessorKey: "planningReady", header: "Readiness", cell: ({ row }) => <RiskBadge risk={readinessRisk(row.original)} /> },
    { accessorKey: "missingItems", header: "Open controls", cell: ({ row }) => row.original.missingItems.length },
  ];

  return (
    <section>
      <PrototypeHeader
        title="Master Data Governance"
        subtitle="Style, workcenter, machine, and recipe records under governed readiness control."
        actions={<button className="ops-button" type="button">Audit Log</button>}
      />
      <PrototypeTabs
        tabs={[
          { label: "Style Master", active: true },
          { label: "Workcenter Capacity" },
          { label: "Machine Master" },
          { label: "Wash Recipes" },
        ]}
      />
      <KpiGrid>
        <KpiTile label="Total styles" value={rows.length} risk="ON_TRACK" />
        <KpiTile label="Readiness blockers" value={missingRows.length} risk={missingRows.length ? "ACTION" : "ON_TRACK"} />
        <KpiTile label="Stale parameters (>90d)" value={staleParameters} risk={staleParameters ? "WATCH" : "ON_TRACK"} />
        <KpiTile label="Materials governed" value={materials.data?.length ?? 0} />
      </KpiGrid>
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_400px]">
        <Panel
          title="Style Master"
          actions={<span className="font-mono text-[11px] uppercase text-slate-500">{customers.data?.length ?? 0} customers</span>}
        >
          <DataGrid
            data={rows}
            columns={columns}
            isLoading={styles.isLoading}
            error={styles.error ? "Style governance records failed to load." : null}
            onRowClick={setSelected}
            heightClassName="max-h-[calc(100vh-330px)]"
          />
        </Panel>
        <Panel title="Parameter Detail">
          {selectedStyle ? (
            <div className="space-y-5">
              <div>
                <h2 className="text-[16px] font-semibold text-primary">{selectedStyle.styleCode}</h2>
                <p className="font-mono text-[11px] text-slate-500">
                  {selectedStyle.customerName} / {selectedStyle.productType}
                </p>
              </div>
              <ChecklistRows rows={readinessRows(selectedStyle)} />
              <section>
                <SectionLabel>Governance Audit</SectionLabel>
                <Timeline
                  rows={[
                    { title: "Record verified", meta: "Governance Bot / current version", tone: "ON_TRACK" },
                    { title: selectedStyle.planningReady ? "Ready for planning" : "Readiness control open", meta: "Master data owner", tone: readinessRisk(selectedStyle) },
                    { title: "Admin correction surface", meta: "Django Admin", tone: "WATCH" },
                  ]}
                />
              </section>
            </div>
          ) : (
            <EmptyState title="No style records" message="Seed Phase 2 data to review governed masters." />
          )}
        </Panel>
      </div>
    </section>
  );
}

export function StyleTechnicalListPage() {
  const styles = useQuery({ queryKey: queryKeys.styles, queryFn: getStyles });
  const productTypes = useQuery({ queryKey: queryKeys.productTypes, queryFn: getProductTypes });
  const [selected, setSelected] = useState<StyleListItem | null>(null);
  const rows = styles.data ?? [];
  const selectedStyle = selected ?? rows[0] ?? null;
  const columns: ColumnDef<StyleListItem>[] = [
    {
      accessorKey: "styleCode",
      header: "Style code",
      cell: ({ row }) => (
        <Link className="font-semibold text-primary underline-offset-2 hover:underline" href={`/technical/styles/${row.original.id}`}>
          {row.original.styleCode}
        </Link>
      ),
    },
    { accessorKey: "customerName", header: "Customer" },
    { accessorKey: "buyerName", header: "Buyer" },
    { accessorKey: "productType", header: "Product" },
    { accessorKey: "washComplexity", header: "Wash" },
    { accessorKey: "sewingComplexity", header: "Sewing" },
    { accessorKey: "status", header: "Version status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    { accessorKey: "planningReady", header: "Planning gate", cell: ({ row }) => <RiskBadge risk={readinessRisk(row.original)} /> },
  ];

  return (
    <section>
      <PrototypeHeader
        title="Style Technical File"
        subtitle="Approved technical records with BOM, operation bulletin, wash route, and version readiness."
      />
      <KpiGrid>
        <KpiTile label="Style files" value={rows.length} />
        <KpiTile label="Planning ready" value={rows.filter((style) => style.planningReady).length} risk="ON_TRACK" />
        <KpiTile label="Open technical controls" value={rows.filter((style) => !style.planningReady).length} risk={rows.some((style) => !style.planningReady) ? "ACTION" : "ON_TRACK"} />
        <KpiTile label="Product types" value={productTypes.data?.length ?? 0} />
      </KpiGrid>
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_400px]">
        <Panel title="Technical file register">
          <DataGrid
            data={rows}
            columns={columns}
            isLoading={styles.isLoading}
            error={styles.error ? "Styles failed to load." : null}
            onRowClick={setSelected}
            heightClassName="max-h-[calc(100vh-300px)]"
          />
        </Panel>
        <Panel title="Style Technical Specs">
          {selectedStyle ? (
            <div className="space-y-5">
              <div>
                <h2 className="text-[16px] font-semibold text-primary">{selectedStyle.styleCode}</h2>
                <p className="font-mono text-[11px] text-slate-500">{selectedStyle.customerName}</p>
              </div>
              <section>
                <SectionLabel>Technical Summary</SectionLabel>
                <InfoRow label="Product type" value={selectedStyle.productType} />
                <InfoRow label="Sewing complexity" value={selectedStyle.sewingComplexity} />
                <InfoRow label="Wash complexity" value={selectedStyle.washComplexity} />
                <InfoRow label="Overall complexity" value={selectedStyle.overallComplexity} />
              </section>
              <section>
                <SectionLabel>Readiness Checklist</SectionLabel>
                <ChecklistRows rows={readinessRows(selectedStyle)} />
              </section>
              <Link className="ops-button ops-button-primary w-full justify-center" href={`/technical/styles/${selectedStyle.id}`}>
                Open technical file
              </Link>
            </div>
          ) : (
            <EmptyState title="No style selected" message="Select a style file to review technical controls." />
          )}
        </Panel>
      </div>
    </section>
  );
}

export function StyleTechnicalDetailPage({ styleId }: { styleId: string }) {
  const style = useQuery({ queryKey: [...queryKeys.styles, styleId], queryFn: () => getStyle(styleId) });
  const bulletins = useQuery({ queryKey: queryKeys.operationBulletins, queryFn: getOperationBulletins });
  const [selectedLine, setSelectedLine] = useState<OperationBulletinLine | null>(null);
  const matchingBulletin = (bulletins.data ?? []).find((bulletin) => bulletin.styleId === styleId || bulletin.styleCode === style.data?.styleCode) ?? null;
  const bulletinDetail = useQuery({
    queryKey: [...queryKeys.operationBulletins, matchingBulletin?.id],
    queryFn: () => getOperationBulletin(matchingBulletin?.id ?? ""),
    enabled: Boolean(matchingBulletin?.id),
  });
  const operations = bulletinDetail.data?.operations ?? [];
  const selectedOperation = selectedLine ?? operations[0] ?? null;
  const operationColumns: ColumnDef<OperationBulletinLine>[] = [
    { accessorKey: "sequenceNo", header: "Seq" },
    { accessorKey: "operationName", header: "Operation name" },
    { accessorKey: "smv", header: "SMV" },
    { accessorKey: "machineType", header: "Machine type" },
    { accessorKey: "skillLevel", header: "Skill grade" },
    { accessorKey: "qcCheckpoint", header: "QC point", cell: ({ row }) => <StatusBadge status={row.original.qcCheckpoint ? "QC" : "NO QC"} /> },
  ];

  if (style.isLoading) return <LoadingState label="Loading style technical file" />;
  if (!style.data) return <EmptyState title="Style not available" message="The selected style could not be loaded." />;

  return (
    <section>
      <PrototypeHeader
        title={style.data.styleCode}
        subtitle={`${style.data.description} / ${style.data.customerName}`}
        actions={<StatusBadge status={style.data.status} />}
      />
      <KpiGrid>
        <KpiTile label="Operation count" value={matchingBulletin?.operationCount ?? operations.length} />
        <KpiTile label="Total SMV" value={matchingBulletin?.totalSmv ?? "-"} risk="ON_TRACK" />
        <KpiTile label="Critical operations" value={matchingBulletin?.criticalOperationCount ?? operations.filter((operation) => operation.criticalOperation).length} risk="WATCH" />
        <KpiTile label="Latest version" value={matchingBulletin?.version ?? "Missing"} risk={matchingBulletin ? "ON_TRACK" : "ACTION"} />
      </KpiGrid>
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_400px]">
        <Panel title="Operation Bulletin Grid">
          <DataGrid
            data={operations}
            columns={operationColumns}
            isLoading={bulletinDetail.isLoading}
            error={bulletinDetail.error ? "Operation bulletin failed to load." : null}
            onRowClick={setSelectedLine}
            heightClassName="max-h-[calc(100vh-315px)]"
          />
        </Panel>
        <Panel title="Style Technical Specs">
          <div className="space-y-5">
            <section>
              <SectionLabel>Technical Summary</SectionLabel>
              <InfoRow label="Fit type" value={style.data.fitType || "-"} />
              <InfoRow label="Fabric category" value={style.data.fabricCategory || "-"} />
              <InfoRow label="Season" value={style.data.season || "-"} />
              <InfoRow label="Reference sample" value={style.data.referenceSampleNo || "-"} />
            </section>
            <section>
              <SectionLabel>Machine Requirements</SectionLabel>
              <div className="space-y-2 bg-surface-container-low p-3">
                {[...new Set(operations.map((operation) => operation.machineType).filter(Boolean))].slice(0, 4).map((machine) => (
                  <div key={machine} className="flex items-center justify-between text-[13px]">
                    <span>{machine}</span>
                    <StatusBadge status="Required" />
                  </div>
                ))}
                {!operations.length ? <p className="text-sm text-slate-500">No approved operation bulletin linked.</p> : null}
              </div>
            </section>
            <section>
              <SectionLabel>Critical Operations</SectionLabel>
              <div className="space-y-2">
                {(operations.filter((operation) => operation.criticalOperation).slice(0, 3)).map((operation) => (
                  <button
                    key={operation.id}
                    type="button"
                    onClick={() => setSelectedLine(operation)}
                    className="w-full border-l-4 border-risk-action bg-risk-action/5 p-3 text-left"
                  >
                    <p className="font-semibold text-primary">{operation.operationName}</p>
                    <p className="text-[12px] text-slate-600">SMV {operation.smv} / {operation.machineType ?? "No machine"}</p>
                  </button>
                ))}
              </div>
            </section>
            <section>
              <SectionLabel>Version History</SectionLabel>
              <Timeline
                rows={[
                  { title: `Version ${matchingBulletin?.version ?? "pending"}`, meta: matchingBulletin?.approvedAt ? `Approved ${formatDate(matchingBulletin.approvedAt)}` : "Awaiting approval", tone: matchingBulletin ? "ON_TRACK" : "ACTION" },
                  { title: "Technical file verified", meta: style.data.planningReady ? "All planning gates closed" : "Open technical controls remain", tone: readinessRisk(style.data) },
                ]}
              />
            </section>
            {selectedOperation ? (
              <section className="border border-grid-border bg-white p-3">
                <SectionLabel>Selected Operation</SectionLabel>
                <InfoRow label="Operation" value={selectedOperation.operationName} />
                <InfoRow label="Skill" value={selectedOperation.skillLevel} />
                <InfoRow label="Target PPH" value={selectedOperation.targetPph} />
              </section>
            ) : null}
          </div>
        </Panel>
      </div>
    </section>
  );
}

export function BomTechnicalPage() {
  const boms = useQuery({ queryKey: queryKeys.boms, queryFn: getBoms });
  const readiness = useQuery({ queryKey: queryKeys.materialReadiness, queryFn: getMaterialReadiness });
  const [selectedBom, setSelectedBom] = useState<BOMHeader | null>(null);
  const [selectedReadiness, setSelectedReadiness] = useState<MaterialReadiness | null>(null);
  const activeBom = selectedBom ?? boms.data?.[0] ?? null;
  const detail = useQuery({
    queryKey: [...queryKeys.boms, activeBom?.id],
    queryFn: () => getBom(activeBom?.id ?? ""),
    enabled: Boolean(activeBom?.id),
  });
  const readinessRowsData = readiness.data ?? [];
  const columns: ColumnDef<BOMHeader>[] = [
    { accessorKey: "styleCode", header: "Style" },
    { accessorKey: "version", header: "Version" },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    { accessorKey: "lineCount", header: "Material lines" },
    { accessorKey: "effectiveDate", header: "Effective" },
    { accessorKey: "approvedAt", header: "Approved" },
  ];
  const materialColumns: ColumnDef<MaterialReadiness>[] = [
    { accessorKey: "orderNo", header: "Order ID" },
    { accessorKey: "readinessStatus", header: "Material status", cell: ({ row }) => <StatusBadge status={row.original.readinessStatus} /> },
    { accessorKey: "blockedCount", header: "Shortage" },
    { accessorKey: "riskStatus", header: "PCD impact", cell: ({ row }) => <RiskBadge risk={row.original.riskStatus} /> },
  ];

  return (
    <section>
      <PrototypeHeader
        title="BOM & Material Planning"
        subtitle="Material readiness explorer with shortage and PCD impact visibility."
        actions={<button className="ops-button" type="button">Export</button>}
      />
      <KpiGrid>
        <KpiTile label="BOM versions" value={boms.data?.length ?? 0} />
        <KpiTile label="Shortage items" value={readinessRowsData.reduce((sum, row) => sum + row.blockedCount, 0)} risk="ACTION" />
        <KpiTile label="Critical PCD impact" value={readinessRowsData.filter((row) => row.riskStatus === "CRITICAL" || row.riskStatus === "ACTION").length} risk="WATCH" />
        <KpiTile label="Approved BOMs" value={(boms.data ?? []).filter((bom) => bom.status === "APPROVED").length} risk="ON_TRACK" />
      </KpiGrid>
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_430px]">
        <div className="space-y-3">
          <Panel title="BOM Version Register">
            <DataGrid
              data={boms.data ?? []}
              columns={columns}
              isLoading={boms.isLoading}
              error={boms.error ? "BOMs failed to load." : null}
              onRowClick={setSelectedBom}
              heightClassName="max-h-72"
            />
          </Panel>
          <Panel
            title="Material Readiness Explorer"
            actions={
              <div className="flex gap-2">
                <span className="rounded bg-primary px-2 py-1 text-[11px] font-bold uppercase text-white">All Categories</span>
                <button className="ops-button" type="button">Filter</button>
              </div>
            }
          >
            <DataGrid
              data={readinessRowsData}
              columns={materialColumns}
              isLoading={readiness.isLoading}
              error={readiness.error ? "Material readiness failed to load." : null}
              onRowClick={setSelectedReadiness}
              heightClassName="max-h-[calc(100vh-560px)]"
            />
          </Panel>
        </div>
        <Panel title="Material Detail">
          <div className="space-y-5">
            <section>
              <SectionLabel>Material Summary</SectionLabel>
              <InfoRow label="Style" value={activeBom?.styleCode ?? "-"} />
              <InfoRow label="BOM version" value={activeBom?.version ?? "-"} />
              <InfoRow label="Lines" value={detail.data?.lineCount ?? activeBom?.lineCount ?? "-"} />
              <InfoRow label="Status" value={activeBom ? <StatusBadge status={activeBom.status} /> : "-"} />
            </section>
            {detail.isLoading ? <LoadingState label="Loading BOM lines" /> : <BomLines lines={detail.data?.lines ?? []} />}
            <section>
              <SectionLabel>Shortage Impact</SectionLabel>
              {selectedReadiness ? (
                <div className="space-y-2">
                  <InfoRow label="Order" value={selectedReadiness.orderNo} />
                  <InfoRow label="Blocked lines" value={selectedReadiness.blockedCount} />
                  <RiskBadge risk={selectedReadiness.riskStatus} />
                </div>
              ) : (
                <p className="text-sm text-slate-500">Select a material readiness row to view PCD impact.</p>
              )}
            </section>
          </div>
        </Panel>
      </div>
    </section>
  );
}

function BomLines({ lines }: { lines: BOMLine[] }) {
  if (!lines.length) {
    return <EmptyState title="No BOM lines" message="No material lines are available for the selected BOM." />;
  }
  return (
    <section>
      <SectionLabel>BOM Material Lines</SectionLabel>
      <div className="space-y-2">
        {lines.map((line) => (
          <div key={line.id} className="border border-grid-border bg-white p-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-primary">{line.material.name}</p>
                <p className="font-mono text-[11px] text-slate-500">{line.material.code}</p>
              </div>
              <StatusBadge status={line.requiredStage} />
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-[12px] text-slate-600">
              <span>{line.consumptionPerPiece} {line.uom} / pc</span>
              <span>{line.wastagePercent}% wastage</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function OperationBulletinsPage() {
  const queryClient = useQueryClient();
  const bulletins = useQuery({ queryKey: queryKeys.operationBulletins, queryFn: getOperationBulletins });
  const styles = useQuery({ queryKey: queryKeys.styles, queryFn: getStyles });
  const [selected, setSelected] = useState<OperationBulletin | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<"approve" | "clone" | null>(null);
  const activeBulletin = selected ?? bulletins.data?.[0] ?? null;
  const detail = useQuery({
    queryKey: [...queryKeys.operationBulletins, activeBulletin?.id],
    queryFn: () => getOperationBulletin(activeBulletin?.id ?? ""),
    enabled: Boolean(activeBulletin?.id),
  });
  const performance = useQuery({
    queryKey: activeBulletin?.id
      ? queryKeys.operationBulletinPerformance(activeBulletin.id)
      : ["execution", "operation-bulletin-performance", "none"],
    queryFn: () => getOperationBulletinPerformance(activeBulletin?.id ?? ""),
    enabled: Boolean(activeBulletin?.id),
  });
  const operations = detail.data?.operations ?? [];
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
  const missingObCount = (styles.data ?? []).filter((style) => !style.planningReady && style.missingItems.includes("APPROVED_OPERATION_BULLETIN")).length;
  const columns: ColumnDef<OperationBulletin>[] = [
    { accessorKey: "id", header: "Bulletin ID", cell: ({ row }) => <span className="font-mono">{row.original.id.slice(0, 8)}</span> },
    { accessorKey: "styleCode", header: "Style code" },
    { accessorKey: "productType", header: "Type" },
    { accessorKey: "version", header: "Version" },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    { accessorKey: "totalSmv", header: "SMV" },
    { accessorKey: "criticalOperationCount", header: "Bottlenecks" },
  ];

  return (
    <section>
      <PrototypeHeader
        title="Operation Bulletins (OB)"
        subtitle="Manage technical routing, machine allocation, and SMV for governed styles."
        actions={<button className="ops-button ops-button-primary" type="button">Create New Bulletin</button>}
      />
      <Feedback message={feedback} />
      <KpiGrid>
        <KpiTile label="Approved bulletins" value={(bulletins.data ?? []).filter((bulletin) => bulletin.status === "APPROVED").length} risk="ON_TRACK" />
        <KpiTile label="Draft / review" value={(bulletins.data ?? []).filter((bulletin) => bulletin.status !== "APPROVED").length} risk={(bulletins.data ?? []).some((bulletin) => bulletin.status !== "APPROVED") ? "WATCH" : "ON_TRACK"} />
        <KpiTile label="Styles without OB" value={missingObCount} risk={missingObCount ? "ACTION" : "ON_TRACK"} />
        <KpiTile label="Critical operations" value={(bulletins.data ?? []).reduce((sum, bulletin) => sum + bulletin.criticalOperationCount, 0)} risk="WATCH" />
      </KpiGrid>
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_430px]">
        <Panel title="Bulletin Register">
          <DataGrid
            data={bulletins.data ?? []}
            columns={columns}
            isLoading={bulletins.isLoading}
            error={bulletins.error ? "Operation bulletins failed to load." : null}
            onRowClick={setSelected}
            heightClassName="max-h-[calc(100vh-330px)]"
          />
        </Panel>
        <Panel title={activeBulletin ? `${activeBulletin.styleCode} Detail` : "Bulletin Detail"}>
          {activeBulletin ? (
            <div className="space-y-5">
              <section className="border border-outline-variant bg-surface-container p-3">
                <SectionLabel>Active Production Performance</SectionLabel>
                <div className="grid grid-cols-2 gap-3">
                  <TechnicalRef label="Active loads" value={performance.data?.activeLineLoadings ?? 0} />
                  <TechnicalRef label="Net good" value={performance.data?.netGoodQty ?? 0} />
                  <TechnicalRef label="Efficiency" value={`${performance.data?.efficiencyPercent ?? 0}%`} />
                  <TechnicalRef label="SMV" value={activeBulletin.totalSmv} />
                </div>
              </section>
              <section>
                <SectionLabel>Readiness Checklist</SectionLabel>
                <ChecklistRows
                  rows={[
                    { label: "Operations sequenced", status: operations.length ? "VERIFIED" : "PENDING", passed: Boolean(operations.length) },
                    { label: "Machine types assigned", status: operations.every((operation) => operation.machineType) ? "VERIFIED" : "PENDING", passed: operations.every((operation) => operation.machineType) },
                    { label: "Skill levels assigned", status: operations.every((operation) => operation.skillLevel) ? "VERIFIED" : "PENDING", passed: operations.every((operation) => operation.skillLevel) },
                  ]}
                />
              </section>
              <section>
                <SectionLabel>Top Bottleneck Operations</SectionLabel>
                <div className="space-y-2">
                  {operations.filter((operation) => operation.criticalOperation).slice(0, 3).map((operation) => (
                    <div key={operation.id} className="border-l-4 border-risk-watch bg-risk-watch/5 p-2">
                      <p className="text-sm font-semibold text-primary">{operation.operationName}</p>
                      <p className="text-[12px] text-slate-600">SMV {operation.smv} / {operation.machineType ?? "No machine"}</p>
                    </div>
                  ))}
                  {!operations.length ? <p className="text-sm text-slate-500">Open routing to inspect operation details.</p> : null}
                </div>
              </section>
              <div className="grid grid-cols-2 gap-2">
                <ActionButton onClick={() => setConfirm("approve")}>Approve Bulletin</ActionButton>
                <ActionButton onClick={() => setConfirm("clone")} variant="ghost">Clone</ActionButton>
              </div>
              <Link className="ops-button w-full justify-center" href={`/technical/operation-bulletins/${activeBulletin.id}/routing`}>
                Open routing
              </Link>
            </div>
          ) : (
            <EmptyState title="No bulletin selected" message="Select a bulletin to review readiness." />
          )}
        </Panel>
      </div>
      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm === "approve" ? "Approve bulletin" : "Clone bulletin"}
        message={confirm === "approve" ? "Approved bulletins become read-only." : "A new draft version will be created."}
        confirmLabel={confirm === "approve" ? "Approve" : "Clone"}
        onConfirm={() => {
          if (!activeBulletin) return;
          if (confirm === "approve") approve.mutate(activeBulletin.id);
          if (confirm === "clone") clone.mutate(activeBulletin);
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
  const operations = bulletin.data?.operations ?? [];
  const selectedOperation = selected ?? operations[0] ?? null;

  if (bulletin.isLoading) return <LoadingState label="Loading routing builder" />;

  return (
    <section className="grid min-h-[calc(100vh-112px)] overflow-hidden border border-grid-border bg-surface-muted xl:grid-cols-[300px_minmax(0,1fr)_400px]">
      <aside className="border-r border-grid-border bg-white">
        <div className="flex h-11 items-center justify-between border-b border-grid-border bg-surface-container-low px-3">
          <span className="text-[11px] font-bold uppercase tracking-[0.05em] text-slate-500">Sequence Operations</span>
          <StatusBadge status={bulletin.data?.status ?? "Loading"} />
        </div>
        <div className="max-h-[calc(100vh-170px)] overflow-y-auto p-3">
          {operations.map((operation) => (
            <button
              key={operation.id}
              type="button"
              onClick={() => setSelected(operation)}
              className={`mb-2 w-full border p-3 text-left ${selectedOperation?.id === operation.id ? "border-primary bg-primary-fixed" : "border-grid-border bg-white hover:bg-slate-50"}`}
            >
              <div className="flex justify-between gap-2">
                <span className="font-mono text-[11px] text-slate-500">OP-{operation.sequenceNo}</span>
                <StatusBadge status={operation.criticalOperation ? "Critical" : "Normal"} />
              </div>
              <p className="mt-2 text-sm font-semibold text-primary">{operation.operationName}</p>
              <div className="mt-2 flex justify-between text-[11px] text-slate-500">
                <span>SMV: {operation.smv}</span>
                <span className="font-medium">Skill: {operation.skillLevel}</span>
              </div>
            </button>
          ))}
        </div>
      </aside>
      <main className="relative flex flex-col overflow-hidden bg-surface-muted">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(#1e293b 1px, transparent 0)", backgroundSize: "24px 24px" }} />
        <div className="relative z-10 flex h-12 items-center justify-between border-b border-grid-border bg-white px-4">
          <div>
            <h1 className="text-[18px] font-semibold text-primary">{bulletin.data ? `Routing: ${bulletin.data.styleCode}` : "Routing Builder"}</h1>
            <p className="font-mono text-[11px] text-slate-500">SYNC: 42s ago</p>
          </div>
          <button className="ops-button ops-button-primary" type="button">Release Routing</button>
        </div>
        <div className="relative z-10 flex-1 overflow-auto p-6">
          <div className="mx-auto flex max-w-3xl flex-col gap-4">
            {operations.map((operation, index) => (
              <button
                key={operation.id}
                type="button"
                onClick={() => setSelected(operation)}
                className="grid grid-cols-[48px_1fr_auto] items-center gap-3 border border-grid-border bg-white p-3 text-left shadow-sm"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">{index + 1}</span>
                <div>
                  <p className="font-semibold text-primary">{operation.operationName}</p>
                  <p className="text-[12px] text-slate-500">{operation.operationGroup} / {operation.machineType ?? "Machine pending"}</p>
                </div>
                <span className="font-mono text-sm">{operation.smv} min</span>
              </button>
            ))}
          </div>
        </div>
        <div className="relative z-10 flex min-h-16 items-center justify-between bg-primary px-4 text-white">
          <div>
            <span className="text-[10px] font-bold uppercase opacity-70">Total Style SMV</span>
            <p className="font-mono text-xl leading-none">{bulletin.data?.totalSmv ?? "-"} min</p>
          </div>
          <div className="text-right text-[12px] text-white/70">
            {bulletin.data?.operationCount ?? 0} operations / {bulletin.data?.criticalOperationCount ?? 0} critical
          </div>
        </div>
      </main>
      <aside className="border-l border-grid-border bg-white">
        <div className="flex h-11 items-center justify-between border-b border-grid-border bg-surface-container-low px-4">
          <h2 className="text-[16px] font-semibold text-primary">Operation Details</h2>
        </div>
        <div className="max-h-[calc(100vh-170px)] space-y-5 overflow-y-auto p-4">
          {selectedOperation ? (
            <>
              <div>
                <p className="font-mono text-[11px] text-slate-500">{selectedOperation.operationCode}</p>
                <h3 className="text-lg font-semibold text-primary">{selectedOperation.operationName}</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <TechnicalRef label="SMV / SAM" value={selectedOperation.smv} />
                <TechnicalRef label="Target PPH" value={selectedOperation.targetPph} />
              </div>
              <section>
                <SectionLabel>Machine Type</SectionLabel>
                <div className="border border-grid-border bg-surface-container-low p-3 text-sm">{selectedOperation.machineType ?? "Machine pending"}</div>
              </section>
              <section>
                <SectionLabel>Skill Level Requirement</SectionLabel>
                <div className="grid grid-cols-4 gap-2">
                  {["L1", "L2", "L3", "L4"].map((level) => (
                    <span key={level} className={`border px-2 py-1 text-center text-sm font-bold ${selectedOperation.skillLevel === level ? "border-primary bg-primary text-white" : "border-grid-border bg-white"}`}>
                      {level}
                    </span>
                  ))}
                </div>
              </section>
              <section className="border border-risk-watch/30 bg-risk-watch/5 p-3">
                <SectionLabel>Impact Preview</SectionLabel>
                <p className="text-sm text-slate-700">
                  Rescheduling this operation affects downstream sequence balance and line idle time at the selected workcenter.
                </p>
              </section>
            </>
          ) : (
            <EmptyState title="No operation selected" message="Select a sequence operation to review details." />
          )}
        </div>
      </aside>
    </section>
  );
}

function buildOperatorRows(capability: LineCapability[], machines: Machine[]): OperatorRow[] {
  const skills = ["Back Pocket", "Side Seam", "Bartack", "Button Hole", "Chainstitch", "Overlock"];
  const names = ["Maria Garcia", "Ahmed Hassan", "Priya Singh", "Kenji Sato", "Lucia Rossi", "David Park"];
  return capability.slice(0, 8).map((line, index) => ({
    id: `OP-${2000 + index}`,
    name: names[index % names.length],
    primarySkill: skills[index % skills.length],
    skillLevel: index % 3 === 0 ? "Grade A" : index % 3 === 1 ? "Grade B" : "Grade C",
    efficiency: Math.round(line.baselineEfficiency),
    dhu: 2.1 + index / 10,
    attendance: index % 4 === 0 ? 88 : 96,
    allocation: line.lineCode,
    status: index % 5 === 0 ? "TRAINING" : "ACTIVE",
    tag: machines[index % Math.max(machines.length, 1)]?.machineTypeCode ?? "Multi-Skilled",
  }));
}

export function OperatorSkillCapacityPage() {
  const capability = useQuery({ queryKey: queryKeys.lineCapability, queryFn: getLineCapability });
  const machines = useQuery({ queryKey: queryKeys.machines, queryFn: getMachines });
  const capacity = useQuery({ queryKey: queryKeys.capacityDays, queryFn: getCapacityDays });
  const operatorRows = useMemo(() => buildOperatorRows(capability.data ?? [], machines.data ?? []), [capability.data, machines.data]);
  const [selected, setSelected] = useState<OperatorRow | null>(null);
  const activeOperator = selected ?? operatorRows[0] ?? null;
  const operatorColumns: ColumnDef<OperatorRow>[] = [
    { accessorKey: "name", header: "Operator name" },
    { accessorKey: "id", header: "ID" },
    { accessorKey: "primarySkill", header: "Primary skill" },
    { accessorKey: "skillLevel", header: "Skill level" },
    { accessorKey: "efficiency", header: "Eff % (L30D)" },
    { accessorKey: "dhu", header: "DHU" },
    { accessorKey: "attendance", header: "Att %" },
    { accessorKey: "allocation", header: "Allocation" },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    { accessorKey: "tag", header: "Tags" },
  ];

  return (
    <section>
      <PrototypeHeader
        title="Operator Skill & Capacity Monitor"
        subtitle={`Managing ${operatorRows.length} active operators across ${(capability.data ?? []).length} sewing lines.`}
        actions={
          <>
            <button className="ops-button ops-button-primary" type="button">Add Operator</button>
            <button className="ops-button" type="button">Export Report</button>
          </>
        }
      />
      <KpiGrid>
        <KpiTile label="Total headcount" value={operatorRows.length} meta="92% Att." />
        <KpiTile label="Avg. line efficiency" value={`${Math.round((capability.data ?? []).reduce((sum, line) => sum + line.baselineEfficiency, 0) / Math.max((capability.data ?? []).length, 1))}%`} risk="WATCH" />
        <KpiTile label="Top skill gap" value="Waistband Att." risk="ACTION" />
        <KpiTile label="Capacity days" value={capacity.data?.length ?? 0} />
      </KpiGrid>
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_400px]">
        <Panel title="Operator Register">
          <DataGrid
            data={operatorRows}
            columns={operatorColumns}
            isLoading={capability.isLoading || machines.isLoading}
            error={capability.error || machines.error ? "Operator skill matrix failed to load." : null}
            onRowClick={setSelected}
            heightClassName="max-h-[calc(100vh-310px)]"
          />
          <div className="mt-2 flex h-9 items-center justify-between bg-surface-container px-3 text-[10px] font-bold uppercase text-slate-500">
            <span>Showing {operatorRows.length} of {operatorRows.length} operators</span>
            <span className="font-mono">SYNC: 2m ago</span>
          </div>
        </Panel>
        <Panel title={activeOperator ? `Operator Detail: ${activeOperator.name}` : "Operator Detail"}>
          {activeOperator ? (
            <div className="space-y-5">
              <p className="font-mono text-[11px] text-slate-500">ID: {activeOperator.id} / {activeOperator.allocation}</p>
              <section>
                <SectionLabel>Performance Overview</SectionLabel>
                <div className="grid grid-cols-2 gap-3">
                  <TechnicalRef label="Efficiency" value={`${activeOperator.efficiency}%`} />
                  <TechnicalRef label="Attendance" value={`${activeOperator.attendance}%`} />
                </div>
              </section>
              <section className="border border-outline-variant bg-surface-container-low p-3">
                <SectionLabel>Allocation Management</SectionLabel>
                <InfoRow label="Current line" value={activeOperator.allocation} />
                <InfoRow label="Primary skill" value={activeOperator.primarySkill} />
                <InfoRow label="Recommended action" value={activeOperator.status === "TRAINING" ? "Training follow-up" : "Keep allocation"} />
              </section>
              <section>
                <SectionLabel>Skill Matrix (Ops Proficiency)</SectionLabel>
                <div className="space-y-2">
                  {[activeOperator.primarySkill, "Inseam Join", "Hemming"].map((skill, index) => (
                    <div key={skill} className={`border border-grid-border bg-white p-2 ${index === 2 ? "opacity-60" : ""}`}>
                      <div className="flex justify-between">
                        <span className="text-sm font-semibold text-primary">{skill}</span>
                        <StatusBadge status={index === 0 ? activeOperator.skillLevel : index === 1 ? "Grade B" : "Training"} />
                      </div>
                      <ProgressBar value={index === 0 ? activeOperator.efficiency : index === 1 ? 72 : 42} risk={index === 2 ? "WATCH" : "ON_TRACK"} />
                    </div>
                  ))}
                </div>
              </section>
            </div>
          ) : (
            <EmptyState title="No operators" message="Seed line capability to inspect operator skills." />
          )}
        </Panel>
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

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <Panel title={`Materials (${vendors.data?.length ?? 0} vendors)`}>
        <DataGrid data={materials.data ?? []} columns={materialColumns} isLoading={materials.isLoading} error={materials.error ? "Materials failed to load." : null} />
      </Panel>
      <Panel title="Planning Thresholds">
        <DataGrid data={thresholds.data ?? []} columns={thresholdColumns} isLoading={thresholds.isLoading} error={thresholds.error ? "Thresholds failed to load." : null} />
      </Panel>
    </div>
  );
}
