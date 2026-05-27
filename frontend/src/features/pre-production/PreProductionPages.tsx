"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo, useState } from "react";

import {
  approveConditionalRelease,
  getFabricQc,
  getMaterialReadiness,
  getOrder,
  getOrders,
  getOrderTimeline,
  getPcdReadiness,
  getPurchaseOrders,
  releaseOrderToCutting,
  requestConditionalRelease,
  updatePurchaseOrderEta,
} from "@/services/api/pre-production";
import { queryKeys } from "@/services/query-keys";
import { ConfirmDialog } from "@/shared/ConfirmDialog";
import { DataGrid } from "@/shared/DataGrid";
import { RightDrawer } from "@/shared/RightDrawer";
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
  FabricLot,
  FabricQcInspection,
  FabricRoll,
  MaterialPurchaseOrder,
  OrderTimelineEvent,
  PcdReadiness,
  PcdReadinessItem,
  ProductionOrder,
  RiskStatus,
} from "@/types/domain";

type Risk = "ON_TRACK" | "WATCH" | "ACTION" | "CRITICAL";

type FabricRollRow = FabricRoll & {
  lotId: string;
  lotNo: string;
  orderNo: string | null;
  shadeLot: string;
  receivedDate: string;
  lotStatus: string;
  inspection?: FabricQcInspection;
};

function riskFromStatus(status: string): Risk {
  if (["READY", "PASSED", "RELEASED", "ON_TRACK", "ACKNOWLEDGED", "RECEIVED", "COMPLETED"].includes(status)) {
    return "ON_TRACK";
  }
  if (["CONDITIONALLY_READY", "WAIVED", "WATCH", "OPEN", "PENDING", "OVERRIDE_APPROVED"].includes(status)) {
    return "WATCH";
  }
  if (["ESCALATED", "FAILED", "CRITICAL"].includes(status)) {
    return "CRITICAL";
  }
  return "ACTION";
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "2-digit" });
}

function Feedback({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div role="status" className="mb-3 border border-emerald-200 bg-emerald-50 px-3 py-2 text-[13px] text-emerald-800">
      {message}
    </div>
  );
}

function readinessPercent(items: PcdReadinessItem[]) {
  if (!items.length) return 0;
  return Math.round((items.filter((item) => ["PASSED", "WAIVED", "NOT_APPLICABLE"].includes(item.status)).length / items.length) * 100);
}

function pcdChecklistRows(items: PcdReadinessItem[]) {
  return items.map((item) => ({
    label: item.itemLabel,
    status: item.status,
    passed: ["PASSED", "WAIVED", "NOT_APPLICABLE"].includes(item.status),
    note: item.remarks || item.itemCode,
  }));
}

function orderTimelineRows(order: ProductionOrder, timeline: OrderTimelineEvent[] = []) {
  if (timeline.length) {
    return timeline.map((event) => ({
      title: event.eventCode.replaceAll("_", " "),
      meta: `${formatDate(event.createdAt)} / ${event.toStage || event.fromStage || "Stage update"}`,
      tone: event.toStage === "ON_HOLD" ? "ACTION" as RiskStatus : "ON_TRACK" as RiskStatus,
      detail: event.message,
    }));
  }
  return [
    { title: "Order confirmed", meta: `${order.orderNo} / ${formatDate(order.plannedPcdDate)}`, tone: "ON_TRACK" as RiskStatus },
    { title: order.currentStage.replaceAll("_", " "), meta: order.nextAction, tone: order.riskStatus },
    { title: "Release gate", meta: order.releaseAllowed ? "Ready for release-to-cutting" : "Blocked", tone: order.releaseAllowed ? "ON_TRACK" as RiskStatus : "ACTION" as RiskStatus },
  ];
}

function OrderDrawerContent({
  order,
  timeline,
  onRelease,
}: {
  order: ProductionOrder;
  timeline?: OrderTimelineEvent[];
  onRelease?: () => void;
}) {
  const checklist = order.pcdReadiness?.items ?? [];
  return (
    <div className="space-y-5">
      <section>
        <SectionLabel>Order Lifecycle Timeline</SectionLabel>
        <Timeline rows={orderTimelineRows(order, timeline)} />
      </section>
      <section className="border border-grid-border bg-surface-container-low p-3">
        <SectionLabel>PCD Readiness Checklist</SectionLabel>
        {checklist.length ? (
          <ChecklistRows rows={pcdChecklistRows(checklist)} />
        ) : (
          <ChecklistRows
            rows={[
              { label: "Material readiness", status: order.materialReadinessStatus, passed: order.materialReadinessStatus === "READY" },
              { label: "Fabric QC", status: order.fabricQcStatus, passed: order.fabricQcStatus === "PASSED" },
              { label: "PCD gate", status: order.pcdStatus, passed: order.releaseAllowed },
            ]}
          />
        )}
      </section>
      <section className="border border-grid-border p-3">
        <SectionLabel>Impact Preview: Re-schedule</SectionLabel>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 p-2">
            <p className="text-[10px] font-bold uppercase text-slate-500">Current PCD</p>
            <p className="font-mono text-[16px] text-primary">{formatDate(order.plannedPcdDate)}</p>
          </div>
          <div className="bg-primary p-2 text-white">
            <p className="text-[10px] font-bold uppercase text-white/70">Proposed PCD</p>
            <p className="font-mono text-[16px]">{formatDate(order.plannedPcdDate)}</p>
          </div>
        </div>
        {order.releaseBlockers.length ? (
          <p className="mt-2 text-[11px] text-risk-action">{order.releaseBlockers[0]}</p>
        ) : null}
      </section>
      <div className="grid grid-cols-2 gap-2">
        <Link className="ops-button justify-center" href={`/orders/${order.id}/trace`}>
          Open Trace
        </Link>
        <ActionButton disabled={!order.releaseAllowed} onClick={onRelease}>
          Release to Cutting
        </ActionButton>
      </div>
    </div>
  );
}

export function OrdersWorkbenchPage() {
  const orders = useQuery({ queryKey: queryKeys.orders, queryFn: getOrders });
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<ProductionOrder | null>(null);
  const [confirmRelease, setConfirmRelease] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const release = useMutation({
    mutationFn: (orderId: string) => releaseOrderToCutting(orderId),
    onSuccess: async () => {
      setFeedback("Order released to cutting.");
      setConfirmRelease(false);
      await queryClient.invalidateQueries({ queryKey: queryKeys.orders });
      await queryClient.invalidateQueries({ queryKey: queryKeys.pcdReadiness });
    },
  });
  const rows = orders.data ?? [];
  const columns: ColumnDef<ProductionOrder>[] = [
    {
      accessorKey: "orderNo",
      header: "Order ID",
      cell: ({ row }) => (
        <Link className="font-mono font-semibold text-primary underline-offset-2 hover:underline" href={`/orders/${row.original.id}`}>
          {row.original.orderNo}
        </Link>
      ),
    },
    { accessorKey: "customer.name", header: "Customer", cell: ({ row }) => row.original.customer.name },
    { accessorKey: "style.styleCode", header: "Style", cell: ({ row }) => row.original.style.styleCode },
    { accessorKey: "orderQty", header: "Qty" },
    { accessorKey: "committedShipDate", header: "Delivery", cell: ({ row }) => formatDate(row.original.committedShipDate) },
    { accessorKey: "currentStage", header: "Current stage", cell: ({ row }) => <StatusBadge status={row.original.currentStage} /> },
    {
      accessorKey: "pcdStatus",
      header: "PCD status",
      cell: ({ row }) => <ProgressBar value={row.original.releaseAllowed ? 100 : row.original.pcdStatus === "CONDITIONALLY_READY" ? 80 : 45} risk={riskFromStatus(row.original.pcdStatus)} />,
    },
    { accessorKey: "riskStatus", header: "Risk", cell: ({ row }) => <RiskBadge risk={row.original.riskStatus} /> },
    { accessorKey: "nextAction", header: "Next action" },
    { accessorKey: "owner", header: "Owner", cell: ({ row }) => row.original.owner?.displayName ?? "-" },
  ];

  return (
    <section>
      <PrototypeHeader title="Order Lifecycle Explorer" subtitle="Confirmed orders, current gate status, lifecycle risk, and owner next action." />
      <Feedback message={feedback} />
      <KpiGrid columns={5}>
        <KpiTile label="Active orders" value={rows.length} />
        <KpiTile label="At-risk" value={rows.filter((order) => ["WATCH", "ACTION"].includes(order.riskStatus)).length} risk="WATCH" />
        <KpiTile label="Blocked" value={rows.filter((order) => order.riskStatus === "CRITICAL" || !order.releaseAllowed).length} risk="ACTION" />
        <KpiTile label="This week shipments" value={rows.filter((order) => order.committedShipDate).length} />
        <KpiTile label="PCD pending" value={rows.filter((order) => order.pcdStatus !== "READY" && order.pcdStatus !== "RELEASED").length} />
      </KpiGrid>
      <div className="mb-2 flex h-10 items-center justify-between border border-grid-border bg-surface-muted px-3">
        <div className="flex items-center gap-3">
          <span className="rounded bg-primary px-3 py-1 text-[11px] font-bold uppercase text-white">All Orders</span>
          <span className="text-[11px] font-bold uppercase text-slate-500">Sort by: delivery date</span>
        </div>
        <span className="font-mono text-[11px] uppercase text-slate-500">SYNC: 2m ago</span>
      </div>
      <DataGrid
        data={rows}
        columns={columns}
        isLoading={orders.isLoading}
        error={orders.error ? "Orders failed to load." : null}
        onRowClick={setSelected}
        heightClassName="max-h-[calc(100vh-330px)]"
      />
      <RightDrawer open={Boolean(selected)} title={selected ? `${selected.orderNo} Details` : "Order Details"} onClose={() => setSelected(null)}>
        {selected ? <OrderDrawerContent order={selected} onRelease={() => setConfirmRelease(true)} /> : null}
      </RightDrawer>
      <ConfirmDialog
        open={confirmRelease}
        title="Release to cutting"
        message="This records the governed release gate only. Execution records are handled by the execution workbenches."
        confirmLabel="Release"
        onConfirm={() => selected && release.mutate(selected.id)}
        onCancel={() => setConfirmRelease(false)}
      />
    </section>
  );
}

export function OrderDetailPage({ orderId }: { orderId: string }) {
  const order = useQuery({ queryKey: [...queryKeys.orders, orderId], queryFn: () => getOrder(orderId) });
  const timeline = useQuery({ queryKey: [...queryKeys.orders, orderId, "timeline"], queryFn: () => getOrderTimeline(orderId) });
  if (order.isLoading) return <LoadingState label="Loading order detail" />;
  if (!order.data) return <EmptyState title="Order not available" message="The selected order could not be loaded." />;
  return (
    <section>
      <PrototypeHeader
        title={order.data.orderNo}
        subtitle={`${order.data.style.styleCode} / ${order.data.customer.name}`}
        actions={<RiskBadge risk={order.data.riskStatus} />}
      />
      <KpiGrid>
        <KpiTile label="Quantity" value={order.data.orderQty.toLocaleString()} />
        <KpiTile label="PCD status" value={order.data.pcdStatus} risk={riskFromStatus(order.data.pcdStatus)} />
        <KpiTile label="Material" value={order.data.materialReadinessStatus} risk={riskFromStatus(order.data.materialReadinessStatus)} />
        <KpiTile label="Fabric QC" value={order.data.fabricQcStatus} risk={riskFromStatus(order.data.fabricQcStatus)} />
      </KpiGrid>
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_430px]">
        <Panel title="Order Lifecycle Timeline">
          <Timeline rows={orderTimelineRows(order.data, timeline.data ?? [])} />
        </Panel>
        <Panel title="Gate Detail">
          <OrderDrawerContent order={order.data} timeline={timeline.data ?? []} />
        </Panel>
      </div>
    </section>
  );
}

export function OrderTracePage({ orderId }: { orderId: string }) {
  const timeline = useQuery({
    queryKey: [...queryKeys.orders, orderId, "timeline"],
    queryFn: () => getOrderTimeline(orderId),
  });
  const columns: ColumnDef<OrderTimelineEvent>[] = [
    { accessorKey: "createdAt", header: "Time", cell: ({ row }) => formatDate(row.original.createdAt) },
    { accessorKey: "eventCode", header: "Event" },
    { accessorKey: "fromStage", header: "From" },
    { accessorKey: "toStage", header: "To" },
    { accessorKey: "message", header: "Message" },
  ];
  return (
    <section>
      <PrototypeHeader title="Lifecycle Trace" subtitle="Read-only order lifecycle events and gate transitions." />
      <DataGrid
        data={timeline.data ?? []}
        columns={columns}
        isLoading={timeline.isLoading}
        error={timeline.error ? "Timeline failed to load." : null}
      />
    </section>
  );
}

export function PcdReadinessWorkbenchPage() {
  const queryClient = useQueryClient();
  const readiness = useQuery({ queryKey: queryKeys.pcdReadiness, queryFn: getPcdReadiness });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<"request" | "approve" | "release" | null>(null);
  const rows = readiness.data ?? [];
  const selected = rows.find((row) => row.id === selectedId) ?? rows[0] ?? null;
  const request = useMutation({
    mutationFn: (item: PcdReadiness) =>
      requestConditionalRelease(item.id, {
        reason: "Trim arrival confirmed before sewing start.",
        expiryDate: "2099-01-01",
        riskNote: "Cutting only; sewing waits for trims.",
      }),
    onSuccess: async () => {
      setFeedback("Conditional release requested.");
      setConfirm(null);
      await queryClient.invalidateQueries({ queryKey: queryKeys.pcdReadiness });
    },
  });
  const approve = useMutation({
    mutationFn: (item: PcdReadiness) =>
      approveConditionalRelease(item.id, {
        reason: "Approved for cutting only.",
        expiryDate: "2099-01-01",
        riskNote: "Sewing remains blocked until open items clear.",
      }),
    onSuccess: async (updated) => {
      setFeedback("Conditional release approved.");
      setSelectedId(updated.id);
      setConfirm(null);
      await queryClient.invalidateQueries({ queryKey: queryKeys.pcdReadiness });
      await queryClient.invalidateQueries({ queryKey: queryKeys.orders });
    },
  });
  const release = useMutation({
    mutationFn: (item: PcdReadiness) => releaseOrderToCutting(item.orderId),
    onSuccess: async (updated) => {
      setFeedback("Order released to cutting.");
      setSelectedId(updated.id);
      setConfirm(null);
      await queryClient.invalidateQueries({ queryKey: queryKeys.pcdReadiness });
      await queryClient.invalidateQueries({ queryKey: queryKeys.orders });
    },
  });

  return (
    <section>
      <PrototypeHeader title="PCD Readiness Gate" subtitle="Priority orders, gatekeeper checklist status, conditional release, and cutting release control." />
      <Feedback message={feedback} />
      <KpiGrid>
        <KpiTile label="Ready for PCD" value={rows.filter((row) => row.readinessStatus === "READY").length} risk="ON_TRACK" />
        <KpiTile label="Conditional" value={rows.filter((row) => row.readinessStatus === "CONDITIONALLY_READY").length} risk="WATCH" />
        <KpiTile label="Blocked" value={rows.filter((row) => ["BLOCKED", "ESCALATED"].includes(row.readinessStatus)).length} risk="ACTION" />
        <KpiTile label="Released" value={rows.filter((row) => row.readinessStatus === "RELEASED").length} />
      </KpiGrid>
      <div className="grid min-h-[calc(100vh-310px)] border border-grid-border bg-white xl:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="border-r border-grid-border">
          <div className="sticky top-0 flex h-12 items-center justify-between border-b border-grid-border bg-white px-4">
            <h2 className="text-[16px] font-semibold text-primary">Priority Orders</h2>
            <button className="ops-button" type="button">Filter</button>
          </div>
          <div className="max-h-[calc(100vh-360px)] space-y-3 overflow-y-auto p-4">
            {rows.map((row) => (
              <button
                key={row.id}
                type="button"
                onClick={() => setSelectedId(row.id)}
                className={`w-full border p-3 text-left ${selected?.id === row.id ? "border-primary bg-primary-fixed" : "border-grid-border bg-white hover:bg-slate-50"}`}
              >
                <div className="flex justify-between gap-2">
                  <span className="font-mono text-[12px] text-primary">{row.orderNo}</span>
                  <RiskBadge risk={riskFromStatus(row.readinessStatus)} />
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-950">{row.styleCode}</p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-[12px] text-slate-600">
                  <span>PCD: {formatDate(row.plannedPcdDate)}</span>
                  <span>{readinessPercent(row.items)}% ready</span>
                </div>
              </button>
            ))}
          </div>
        </aside>
        <main className="overflow-y-auto bg-surface-muted p-5">
          {selected ? (
            <div className="mx-auto max-w-4xl space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-[0.05em] text-primary">Unit 01 / Gate 1</span>
                  <h1 className="mt-1 text-[28px] font-extrabold tracking-tight text-primary">PCD Readiness Checklist</h1>
                  <p className="mt-2 max-w-xl text-sm text-slate-600">
                    Order <span className="font-bold">{selected.orderNo}</span> is {selected.readinessStatus.toLowerCase().replaceAll("_", " ")}.
                  </p>
                </div>
                <div className="text-right">
                  <RiskBadge risk={riskFromStatus(selected.readinessStatus)} />
                  <p className="mt-2 font-mono text-[10px] uppercase text-slate-500">Gatekeepers Assigned</p>
                </div>
              </div>
              <PrototypeTabs
                tabs={[
                  { label: "01. Materials", active: true },
                  { label: "02. Approvals & Sampling" },
                  { label: "03. Technical Readiness" },
                ]}
              />
              <Panel title="Checklist Sections">
                <ChecklistRows rows={pcdChecklistRows(selected.items)} />
              </Panel>
              {selected.releaseBlockers.length ? (
                <Panel title="Release blockers">
                  <div className="space-y-2">
                    {selected.releaseBlockers.map((blocker) => (
                      <p key={blocker} className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{blocker}</p>
                    ))}
                  </div>
                </Panel>
              ) : null}
              <div className="flex flex-wrap justify-end gap-2">
                <button type="button" onClick={() => setConfirm("request")} className="ops-button">
                  Request Conditional Release
                </button>
                <button type="button" onClick={() => setConfirm("approve")} className="ops-button">
                  Approve Conditional Release
                </button>
                <ActionButton disabled={!selected.releaseAllowed} onClick={() => setConfirm("release")}>
                  Release to Cutting
                </ActionButton>
              </div>
            </div>
          ) : (
            <EmptyState title="No PCD records" message="Seed Phase 3 data to review readiness gates." />
          )}
        </main>
      </div>
      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm === "release" ? "Release to cutting" : "Conditional release"}
        message={
          confirm === "request"
            ? "Request conditional release for the current open mandatory items."
            : confirm === "approve"
              ? "Approve conditional release through the configured expiry."
              : "Release the order to cutting after backend gate validation."
        }
        confirmLabel={confirm === "release" ? "Release" : "Confirm"}
        onConfirm={() => {
          if (!selected) return;
          if (confirm === "request") request.mutate(selected);
          if (confirm === "approve") approve.mutate(selected);
          if (confirm === "release") release.mutate(selected);
        }}
        onCancel={() => setConfirm(null)}
      />
    </section>
  );
}

export function ProcurementVendorFollowUpPage() {
  const queryClient = useQueryClient();
  const purchaseOrders = useQuery({ queryKey: queryKeys.purchaseOrders, queryFn: getPurchaseOrders });
  const readiness = useQuery({ queryKey: queryKeys.materialReadiness, queryFn: getMaterialReadiness });
  const [selected, setSelected] = useState<MaterialPurchaseOrder | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const eta = useMutation({
    mutationFn: (po: MaterialPurchaseOrder) =>
      updatePurchaseOrderEta(po.id, "2099-01-01", "Vendor revised ETA from follow-up."),
    onSuccess: async () => {
      setFeedback("ETA updated.");
      await queryClient.invalidateQueries({ queryKey: queryKeys.purchaseOrders });
      await queryClient.invalidateQueries({ queryKey: queryKeys.materialReadiness });
    },
  });
  const rows = purchaseOrders.data ?? [];
  const readinessRows = readiness.data ?? [];
  const columns: ColumnDef<MaterialPurchaseOrder>[] = [
    { accessorKey: "poNo", header: "PO Number" },
    { accessorKey: "vendorName", header: "Vendor Name" },
    { accessorKey: "materialName", header: "Material Description" },
    { accessorKey: "materialCode", header: "Category" },
    { accessorKey: "orderedQty", header: "Order Qty" },
    { accessorKey: "expectedArrivalDate", header: "Promised ETA", cell: ({ row }) => formatDate(row.original.expectedArrivalDate) },
    { accessorKey: "revisedEta", header: "Current ETA", cell: ({ row }) => formatDate(row.original.revisedEta ?? row.original.expectedArrivalDate) },
    { accessorKey: "status", header: "Transit Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    {
      id: "pcdImpact",
      header: "PCD Impact",
      cell: ({ row }) => {
        const impact = readinessRows.find((item) => item.orderNo === row.original.orderNo);
        return impact ? <RiskBadge risk={impact.riskStatus} /> : <StatusBadge status="No linked order" />;
      },
    },
    { id: "actions", header: "Actions", cell: () => <span className="font-bold text-primary">Review</span> },
  ];

  return (
    <section>
      <PrototypeHeader
        title="Procurement & Vendor Follow-Up"
        subtitle={`Monitoring ${rows.length} active supply lines across nominated vendors.`}
        actions={
          <>
            <button className="ops-button" type="button">Export Report</button>
            <button className="ops-button ops-button-primary" type="button">Log Follow-Up</button>
          </>
        }
      />
      <Feedback message={feedback} />
      <KpiGrid>
        <KpiTile label="Open Vendor POs" value={rows.length} />
        <KpiTile label="Critical Material Shortages" value={readinessRows.filter((row) => row.riskStatus === "CRITICAL" || row.riskStatus === "ACTION").length} risk="CRITICAL" meta="PCD < 7d" />
        <KpiTile label="Delayed POs" value={rows.filter((row) => row.status === "DELAYED").length} risk="ACTION" />
        <KpiTile label="Acknowledged" value={rows.filter((row) => row.acknowledgedQty).length} risk="ON_TRACK" />
      </KpiGrid>
      <div className="mb-3 flex h-10 items-center gap-4 border border-grid-border bg-surface-muted px-3">
        <select className="h-7 border-none bg-transparent text-[13px] font-medium focus:ring-0">
          <option>Vendor: All Nominated</option>
        </select>
        <select className="h-7 border-none bg-transparent text-[13px] font-medium focus:ring-0">
          <option>Category: All Materials</option>
        </select>
        <select className="h-7 border-none bg-transparent text-[13px] font-medium focus:ring-0">
          <option>PCD Horizon: All</option>
        </select>
      </div>
      <DataGrid
        data={rows}
        columns={columns}
        isLoading={purchaseOrders.isLoading}
        error={purchaseOrders.error ? "Purchase orders failed to load." : null}
        onRowClick={setSelected}
        heightClassName="max-h-[calc(100vh-370px)]"
      />
      <RightDrawer open={Boolean(selected)} title={selected?.poNo ?? "Purchase order"} onClose={() => setSelected(null)}>
        {selected ? (
          <div className="space-y-5">
            <section>
              <SectionLabel>PO Status Timeline</SectionLabel>
              <Timeline
                rows={[
                  { title: "Issued", meta: `Expected ${formatDate(selected.expectedArrivalDate)}`, tone: "ON_TRACK" },
                  { title: selected.status.replaceAll("_", " "), meta: selected.revisedEta ? `Revised ${formatDate(selected.revisedEta)}` : "Vendor portal", tone: riskFromStatus(selected.status) },
                  { title: "Warehouse receipt", meta: selected.actualArrivalDate ? formatDate(selected.actualArrivalDate) : "Pending", tone: selected.actualArrivalDate ? "ON_TRACK" : "WATCH" },
                ]}
              />
            </section>
            <section>
              <SectionLabel>Affected Production Orders</SectionLabel>
              <div className="space-y-2">
                {(readinessRows.filter((row) => row.orderNo === selected.orderNo).length ? readinessRows.filter((row) => row.orderNo === selected.orderNo) : readinessRows.slice(0, 2)).map((row) => (
                  <div key={row.orderId} className="flex items-center justify-between border border-grid-border bg-white p-2">
                    <div>
                      <p className="text-sm font-bold">{row.orderNo}</p>
                      <p className="text-[11px] text-risk-action">Blocked lines: {row.blockedCount}</p>
                    </div>
                    <RiskBadge risk={row.riskStatus} />
                  </div>
                ))}
              </div>
            </section>
            <section>
              <SectionLabel>Communication Log</SectionLabel>
              <div className="space-y-3 text-[12px]">
                <div className="border-l-2 border-risk-watch bg-surface-muted p-2">
                  <div className="mb-1 flex justify-between text-[10px] font-bold text-slate-500">
                    <span>Follow-Up Call</span>
                    <span>2h ago</span>
                  </div>
                  <p>Vendor ETA reviewed and saved for planning visibility.</p>
                </div>
              </div>
            </section>
            <div className="grid grid-cols-2 gap-2">
              <button className="ops-button justify-center" type="button">Escalate</button>
              <button className="ops-button justify-center" type="button">Expedite</button>
              <ActionButton onClick={() => eta.mutate(selected)}>Save Updates</ActionButton>
            </div>
          </div>
        ) : null}
      </RightDrawer>
    </section>
  );
}

function buildRollRows(lots: FabricLot[], inspections: FabricQcInspection[]): FabricRollRow[] {
  return lots.flatMap((lot) =>
    lot.rolls.map((roll) => ({
      ...roll,
      lotId: lot.id,
      lotNo: lot.lotNo,
      orderNo: lot.orderNo,
      shadeLot: lot.shadeLot,
      receivedDate: lot.receivedDate,
      lotStatus: lot.status,
      inspection: inspections.find((inspection) => inspection.rollNo === roll.rollNo && inspection.lotNo === lot.lotNo),
    })),
  );
}

export function FabricQcWorkbenchPage() {
  const fabricQc = useQuery({ queryKey: queryKeys.fabricQc, queryFn: getFabricQc });
  const rollRows = useMemo(
    () => buildRollRows(fabricQc.data?.lots ?? [], fabricQc.data?.inspections ?? []),
    [fabricQc.data],
  );
  const [selected, setSelected] = useState<FabricRollRow | null>(null);
  const activeRoll = selected ?? rollRows[0] ?? null;
  const columns: ColumnDef<FabricRollRow>[] = [
    { accessorKey: "rollNo", header: "Roll ID" },
    { accessorKey: "shadeLot", header: "Shade Lot" },
    { accessorKey: "lotNo", header: "Specification" },
    { accessorKey: "width", header: "Width (actual)" },
    { accessorKey: "gsm", header: "GSM" },
    { accessorKey: "rollLength", header: "Length" },
    { accessorKey: "qcStatus", header: "Status", cell: ({ row }) => <RiskBadge risk={riskFromStatus(row.original.qcStatus)} /> },
    { accessorKey: "inspection", header: "Inspector", cell: ({ row }) => row.original.inspection ? "QC Team" : "Pending" },
  ];

  return (
    <section>
      <PrototypeHeader title="Fabric Inward & QC Monitor" subtitle="Fabric lot, roll inspection, shade, 4-point score, and PCD-impacting QC state." />
      <KpiGrid>
        <KpiTile label="Received fabric" value={`${rollRows.length} Rolls`} />
        <KpiTile label="Pending inspection" value={rollRows.filter((roll) => roll.qcStatus === "PENDING").length} risk="ACTION" />
        <KpiTile label="Passed" value={rollRows.filter((roll) => roll.qcStatus === "PASSED").length} risk="ON_TRACK" />
        <KpiTile label="Hold / failed" value={rollRows.filter((roll) => ["FAILED", "HOLD"].includes(roll.qcStatus)).length} risk="WATCH" />
      </KpiGrid>
      <div className="mb-3 flex h-10 items-center gap-4 border border-grid-border bg-white px-3">
        <select className="h-7 border border-outline px-2 text-[13px]">
          <option>Shade Lot: All</option>
        </select>
        <select className="h-7 border border-outline px-2 text-[13px]">
          <option>Fabric: Denim/Chino</option>
        </select>
        <span className="ml-auto font-mono text-[11px] uppercase text-slate-500">SYNC: 2m ago</span>
      </div>
      <DataGrid
        data={rollRows}
        columns={columns}
        isLoading={fabricQc.isLoading}
        error={fabricQc.error ? "Fabric QC failed to load." : null}
        onRowClick={setSelected}
        heightClassName="max-h-[calc(100vh-360px)]"
      />
      <RightDrawer open={Boolean(activeRoll)} title={activeRoll ? "Roll Inspection Detail" : "Roll Inspection Detail"} onClose={() => setSelected(null)}>
        {activeRoll ? (
          <div className="space-y-5">
            <div>
              <h2 className="text-[16px] font-semibold text-primary">{activeRoll.rollNo}</h2>
              <p className="font-mono text-[11px] text-slate-500">ID: {activeRoll.rollNo} / {activeRoll.lotNo}</p>
            </div>
            <section>
              <SectionLabel>Technical Specs</SectionLabel>
              <div className="grid grid-cols-2 gap-3">
                <InfoRow label="Width" value={activeRoll.width ?? "-"} />
                <InfoRow label="GSM" value={activeRoll.gsm ?? "-"} />
                <InfoRow label="Shade" value={activeRoll.shade} />
                <InfoRow label="Length" value={activeRoll.rollLength} />
              </div>
            </section>
            <section>
              <div className="mb-3 flex justify-between">
                <SectionLabel>4-Point Result Map</SectionLabel>
                <span className="text-[16px] font-bold text-risk-watch">{activeRoll.inspection?.fourPointScore ?? 0} pts / 100m</span>
              </div>
              <div className="grid h-24 grid-cols-5 gap-1 border border-grid-border bg-surface-muted p-2">
                {Array.from({ length: 15 }).map((_, index) => (
                  <span key={index} className={`rounded-sm ${index % 5 === 0 ? "bg-risk-watch" : "bg-slate-200"}`} />
                ))}
              </div>
            </section>
            <section className="border border-outline-variant bg-background p-3">
              <SectionLabel>Shade Check</SectionLabel>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded border border-outline-variant bg-primary" />
                <div>
                  <p className="font-semibold text-primary">{activeRoll.shadeLot}</p>
                  <p className="text-[12px] text-slate-500">Shade grouping confirmed for selected lot.</p>
                </div>
              </div>
            </section>
            <section>
              <SectionLabel>Affected Orders</SectionLabel>
              <div className="border border-risk-action/30 bg-risk-action/5 p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-bold">{activeRoll.orderNo ?? "Unassigned order"}</p>
                    <p className="text-[11px] text-risk-action">QC status: {activeRoll.qcStatus}</p>
                  </div>
                  <RiskBadge risk={riskFromStatus(activeRoll.qcStatus)} />
                </div>
              </div>
            </section>
            <div className="grid grid-cols-2 gap-2">
              <button className="ops-button ops-button-primary justify-center" type="button">Release to Cutting</button>
              <button className="ops-button justify-center" type="button">QC Exception</button>
            </div>
          </div>
        ) : null}
      </RightDrawer>
    </section>
  );
}
