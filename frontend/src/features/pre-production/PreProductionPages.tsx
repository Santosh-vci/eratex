"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

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
import { Breadcrumbs, FilterBar, ModuleHeader } from "@/shared/layout";
import { EmptyState } from "@/shared/states/EmptyState";
import { LoadingState } from "@/shared/states/LoadingState";
import type {
  FabricLot,
  FabricQcInspection,
  MaterialPurchaseOrder,
  OrderTimelineEvent,
  PcdReadiness,
  PcdReadinessItem,
  ProductionOrder,
} from "@/types/domain";

type Risk = "ON_TRACK" | "WATCH" | "ACTION" | "CRITICAL";

function riskFromStatus(status: string): Risk {
  if (["READY", "PASSED", "RELEASED", "ON_TRACK", "ACKNOWLEDGED", "RECEIVED"].includes(status)) {
    return "ON_TRACK";
  }
  if (["CONDITIONALLY_READY", "WAIVED", "WATCH", "OPEN"].includes(status)) {
    return "WATCH";
  }
  if (["ESCALATED", "FAILED", "CRITICAL"].includes(status)) {
    return "CRITICAL";
  }
  return "ACTION";
}

function MetricBand({ metrics }: { metrics: Array<{ label: string; value: string | number; risk?: Risk }> }) {
  return (
    <dl className="mb-4 grid gap-2 md:grid-cols-4">
      {metrics.map((metric) => (
        <div key={metric.label} className="border border-grid-border bg-white px-3 py-2">
          <dt className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
            {metric.label}
          </dt>
          <dd className="mt-1 flex items-center justify-between text-lg font-semibold text-slate-950">
            {metric.value}
            {metric.risk ? <RiskBadge risk={metric.risk} /> : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function Feedback({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div role="status" className="mb-3 border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
      {message}
    </div>
  );
}

function PcdChecklist({ items }: { items: PcdReadinessItem[] }) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.id} className="flex items-center justify-between border-b border-grid-border py-2">
          <div>
            <p className="text-sm font-medium text-slate-800">{item.itemLabel}</p>
            <p className="text-xs text-slate-500">{item.remarks || item.itemCode}</p>
          </div>
          <RiskBadge risk={riskFromStatus(item.status)} />
        </div>
      ))}
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
      header: "Order",
      cell: ({ row }) => (
        <Link className="font-semibold text-primary underline-offset-2 hover:underline" href={`/orders/${row.original.id}`}>
          {row.original.orderNo}
        </Link>
      ),
    },
    { accessorKey: "poNumber", header: "PO" },
    { accessorKey: "customer.name", header: "Customer", cell: ({ row }) => row.original.customer.name },
    { accessorKey: "style.styleCode", header: "Style", cell: ({ row }) => row.original.style.styleCode },
    { accessorKey: "orderQty", header: "Qty" },
    { accessorKey: "committedShipDate", header: "Ship" },
    { accessorKey: "pcdStatus", header: "PCD", cell: ({ row }) => <StatusBadge status={row.original.pcdStatus} /> },
    {
      accessorKey: "riskStatus",
      header: "Risk",
      cell: ({ row }) => <RiskBadge risk={row.original.riskStatus} />,
    },
    { accessorKey: "nextAction", header: "Next action" },
  ];

  return (
    <section>
      <Breadcrumbs items={["Pre-Production", "Orders"]} />
      <ModuleHeader
        eyebrow="EOS-03"
        title="Order Lifecycle Explorer"
        description="Confirmed orders, readiness gates, blockers, and release eligibility before execution starts."
      />
      <Feedback message={feedback} />
      <MetricBand
        metrics={[
          { label: "Orders", value: rows.length },
          { label: "Ready", value: rows.filter((order) => order.releaseAllowed).length, risk: "ON_TRACK" },
          {
            label: "Blocked",
            value: rows.filter((order) => !order.releaseAllowed).length,
            risk: rows.some((order) => !order.releaseAllowed) ? "ACTION" : "ON_TRACK",
          },
          { label: "Critical", value: rows.filter((order) => order.riskStatus === "CRITICAL").length, risk: "CRITICAL" },
        ]}
      />
      <FilterBar>
        <StatusBadge status="PCD gate" />
        <StatusBadge status="Material readiness" />
        <StatusBadge status="Fabric QC" />
      </FilterBar>
      <DataGrid
        data={rows}
        columns={columns}
        isLoading={orders.isLoading}
        error={orders.error ? "Orders failed to load." : null}
        onRowClick={setSelected}
      />
      <RightDrawer open={Boolean(selected)} title={selected?.orderNo ?? "Order"} onClose={() => setSelected(null)}>
        {selected ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <StatusBadge status={selected.currentStage} />
              <RiskBadge risk={selected.riskStatus} />
            </div>
            <div className="border-y border-grid-border py-3 text-sm text-slate-700">
              <p>Style: {selected.style.styleCode}</p>
              <p>PCD: {selected.pcdStatus}</p>
              <p>Material: {selected.materialReadinessStatus}</p>
              <p>Fabric QC: {selected.fabricQcStatus}</p>
            </div>
            {selected.releaseBlockers.length ? (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                  Release blockers
                </p>
                <div className="mt-2 space-y-2">
                  {selected.releaseBlockers.map((blocker) => (
                    <p key={blocker} className="border border-red-200 bg-red-50 px-2 py-1 text-sm text-red-700">
                      {blocker}
                    </p>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Link className="rounded border border-grid-border px-3 py-2 text-sm" href={`/orders/${selected.id}`}>
                Open detail
              </Link>
              <Link className="rounded border border-grid-border px-3 py-2 text-sm" href={`/orders/${selected.id}/trace`}>
                Trace
              </Link>
              <button
                type="button"
                disabled={!selected.releaseAllowed}
                onClick={() => setConfirmRelease(true)}
                className="rounded bg-primary px-3 py-2 text-sm text-white disabled:opacity-40"
              >
                Release to cutting
              </button>
            </div>
          </div>
        ) : null}
      </RightDrawer>
      <ConfirmDialog
        open={confirmRelease}
        title="Release to cutting"
        message="This records the governed release gate only. Execution records start in a later phase."
        confirmLabel="Release"
        onConfirm={() => selected && release.mutate(selected.id)}
        onCancel={() => setConfirmRelease(false)}
      />
    </section>
  );
}

export function OrderDetailPage({ orderId }: { orderId: string }) {
  const order = useQuery({ queryKey: [...queryKeys.orders, orderId], queryFn: () => getOrder(orderId) });
  if (order.isLoading) return <LoadingState label="Loading order detail" />;
  if (!order.data) return <EmptyState title="Order not available" message="The selected order could not be loaded." />;
  return (
    <section>
      <Breadcrumbs items={["Pre-Production", "Orders", order.data.orderNo]} />
      <ModuleHeader
        eyebrow="Order detail"
        title={order.data.orderNo}
        description={`${order.data.style.styleCode} / ${order.data.customer.name}`}
      />
      <MetricBand
        metrics={[
          { label: "Quantity", value: order.data.orderQty },
          { label: "PCD", value: order.data.pcdStatus, risk: riskFromStatus(order.data.pcdStatus) },
          { label: "Material", value: order.data.materialReadinessStatus, risk: riskFromStatus(order.data.materialReadinessStatus) },
          { label: "Fabric QC", value: order.data.fabricQcStatus, risk: riskFromStatus(order.data.fabricQcStatus) },
        ]}
      />
      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <div className="border border-grid-border bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-900">PCD checklist</h3>
          <div className="mt-3">
            {order.data.pcdReadiness ? <PcdChecklist items={order.data.pcdReadiness.items} /> : null}
          </div>
        </div>
        <div className="border border-grid-border bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-900">Release blockers</h3>
          <div className="mt-3 space-y-2">
            {(order.data.releaseBlockers.length ? order.data.releaseBlockers : ["No active blockers"]).map((item) => (
              <p key={item} className="border-b border-grid-border py-2 text-sm text-slate-700">
                {item}
              </p>
            ))}
          </div>
        </div>
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
    { accessorKey: "createdAt", header: "Time" },
    { accessorKey: "eventCode", header: "Event" },
    { accessorKey: "fromStage", header: "From" },
    { accessorKey: "toStage", header: "To" },
    { accessorKey: "message", header: "Message" },
  ];
  return (
    <section>
      <Breadcrumbs items={["Pre-Production", "Orders", "Trace"]} />
      <ModuleHeader
        eyebrow="Order trace"
        title="Lifecycle Trace"
        description="Read-only order lifecycle events and gate transitions."
      />
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
  const [selected, setSelected] = useState<PcdReadiness | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<"request" | "approve" | "release" | null>(null);
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
      setSelected(updated);
      setConfirm(null);
      await queryClient.invalidateQueries({ queryKey: queryKeys.pcdReadiness });
      await queryClient.invalidateQueries({ queryKey: queryKeys.orders });
    },
  });
  const release = useMutation({
    mutationFn: (item: PcdReadiness) => releaseOrderToCutting(item.orderId),
    onSuccess: async (updated) => {
      setFeedback("Order released to cutting.");
      setSelected(updated);
      setConfirm(null);
      await queryClient.invalidateQueries({ queryKey: queryKeys.pcdReadiness });
      await queryClient.invalidateQueries({ queryKey: queryKeys.orders });
    },
  });
  const rows = readiness.data ?? [];
  const columns: ColumnDef<PcdReadiness>[] = [
    { accessorKey: "orderNo", header: "Order" },
    { accessorKey: "styleCode", header: "Style" },
    { accessorKey: "customerName", header: "Customer" },
    { accessorKey: "plannedPcdDate", header: "PCD date" },
    { accessorKey: "readinessStatus", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.readinessStatus} /> },
    { accessorKey: "releaseAllowed", header: "Release", cell: ({ row }) => <RiskBadge risk={row.original.releaseAllowed ? "ON_TRACK" : "ACTION"} /> },
  ];
  return (
    <section>
      <Breadcrumbs items={["Pre-Production", "PCD"]} />
      <ModuleHeader
        eyebrow="PCD readiness gate"
        title="PCD Readiness"
        description="Checklist blockers, conditional releases, and release-to-cutting gate state."
      />
      <Feedback message={feedback} />
      <MetricBand
        metrics={[
          { label: "PCD records", value: rows.length },
          { label: "Ready", value: rows.filter((row) => row.readinessStatus === "READY").length, risk: "ON_TRACK" },
          { label: "Blocked", value: rows.filter((row) => ["BLOCKED", "ESCALATED"].includes(row.readinessStatus)).length, risk: "ACTION" },
          { label: "Conditional", value: rows.filter((row) => row.readinessStatus === "CONDITIONALLY_READY").length, risk: "WATCH" },
        ]}
      />
      <DataGrid
        data={rows}
        columns={columns}
        isLoading={readiness.isLoading}
        error={readiness.error ? "PCD readiness failed to load." : null}
        onRowClick={setSelected}
      />
      <RightDrawer open={Boolean(selected)} title={selected?.orderNo ?? "PCD"} onClose={() => setSelected(null)}>
        {selected ? (
          <div className="space-y-4">
            <StatusBadge status={selected.readinessStatus} />
            <PcdChecklist items={selected.items} />
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setConfirm("request")} className="rounded border border-grid-border px-3 py-2 text-sm">
                Request conditional
              </button>
              <button type="button" onClick={() => setConfirm("approve")} className="rounded border border-grid-border px-3 py-2 text-sm">
                Approve conditional
              </button>
              <button
                type="button"
                disabled={!selected.releaseAllowed}
                onClick={() => setConfirm("release")}
                className="rounded bg-primary px-3 py-2 text-sm text-white disabled:opacity-40"
              >
                Release to cutting
              </button>
            </div>
            {selected.releaseBlockers.length ? (
              <div className="space-y-2">
                {selected.releaseBlockers.map((blocker) => (
                  <p key={blocker} className="border border-red-200 bg-red-50 px-2 py-1 text-sm text-red-700">
                    {blocker}
                  </p>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </RightDrawer>
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
  const columns: ColumnDef<MaterialPurchaseOrder>[] = [
    { accessorKey: "poNo", header: "PO" },
    { accessorKey: "orderNo", header: "Order" },
    { accessorKey: "vendorCode", header: "Vendor" },
    { accessorKey: "materialCode", header: "Material" },
    { accessorKey: "orderedQty", header: "Qty" },
    { accessorKey: "expectedArrivalDate", header: "Expected" },
    { accessorKey: "revisedEta", header: "Revised" },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
  ];
  return (
    <section>
      <Breadcrumbs items={["Pre-Production", "Procurement"]} />
      <ModuleHeader
        eyebrow="Material readiness"
        title="Procurement Vendor Follow-Up"
        description="Material shortages, vendor ETA risk, and PCD-impacting procurement blockers."
      />
      <Feedback message={feedback} />
      <MetricBand
        metrics={[
          { label: "Purchase orders", value: rows.length },
          { label: "Delayed", value: rows.filter((row) => row.status === "DELAYED").length, risk: "ACTION" },
          { label: "Readiness rows", value: readiness.data?.length ?? 0 },
          { label: "Blocked orders", value: readiness.data?.filter((row) => row.readinessStatus === "BLOCKED").length ?? 0, risk: "ACTION" },
        ]}
      />
      <DataGrid
        data={rows}
        columns={columns}
        isLoading={purchaseOrders.isLoading}
        error={purchaseOrders.error ? "Purchase orders failed to load." : null}
        onRowClick={setSelected}
      />
      <RightDrawer open={Boolean(selected)} title={selected?.poNo ?? "Purchase order"} onClose={() => setSelected(null)}>
        {selected ? (
          <div className="space-y-3 text-sm text-slate-700">
            <StatusBadge status={selected.status} />
            <p>Vendor: {selected.vendorName}</p>
            <p>Material: {selected.materialName}</p>
            <p>Expected: {selected.expectedArrivalDate ?? "-"}</p>
            <p>Revised: {selected.revisedEta ?? "-"}</p>
            <button type="button" className="rounded bg-primary px-3 py-2 text-sm text-white" onClick={() => eta.mutate(selected)}>
              Update ETA
            </button>
          </div>
        ) : null}
      </RightDrawer>
    </section>
  );
}

export function FabricQcWorkbenchPage() {
  const fabricQc = useQuery({ queryKey: queryKeys.fabricQc, queryFn: getFabricQc });
  const [selected, setSelected] = useState<FabricLot | FabricQcInspection | null>(null);
  const lots = fabricQc.data?.lots ?? [];
  const inspections = fabricQc.data?.inspections ?? [];
  const lotColumns: ColumnDef<FabricLot>[] = [
    { accessorKey: "orderNo", header: "Order" },
    { accessorKey: "lotNo", header: "Lot" },
    { accessorKey: "shadeLot", header: "Shade" },
    { accessorKey: "receivedQty", header: "Received" },
    { accessorKey: "receivedDate", header: "Date" },
    { accessorKey: "rolls", header: "Rolls", cell: ({ row }) => row.original.rolls.length },
  ];
  const inspectionColumns: ColumnDef<FabricQcInspection>[] = [
    { accessorKey: "orderNo", header: "Order" },
    { accessorKey: "lotNo", header: "Lot" },
    { accessorKey: "rollNo", header: "Roll" },
    { accessorKey: "fourPointScore", header: "4-point" },
    { accessorKey: "shrinkagePercent", header: "Shrinkage" },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <RiskBadge risk={riskFromStatus(row.original.status)} /> },
  ];
  return (
    <section>
      <Breadcrumbs items={["Pre-Production", "Fabric QC"]} />
      <ModuleHeader
        eyebrow="Fabric inward and QC"
        title="Fabric QC Monitor"
        description="Fabric lot status, failed rolls, holds, waivers, and PCD-impacting QC state."
      />
      <MetricBand
        metrics={[
          { label: "Lots", value: lots.length },
          { label: "Inspections", value: inspections.length },
          { label: "Failed", value: inspections.filter((item) => item.status === "FAILED").length, risk: "CRITICAL" },
          { label: "Pending", value: lots.flatMap((lot) => lot.rolls).filter((roll) => roll.qcStatus === "PENDING").length, risk: "ACTION" },
        ]}
      />
      <div className="grid gap-4 xl:grid-cols-[1fr_460px]">
        <DataGrid
          data={lots}
          columns={lotColumns}
          isLoading={fabricQc.isLoading}
          error={fabricQc.error ? "Fabric lots failed to load." : null}
          onRowClick={setSelected}
        />
        <DataGrid
          data={inspections}
          columns={inspectionColumns}
          isLoading={fabricQc.isLoading}
          error={fabricQc.error ? "Fabric inspections failed to load." : null}
          onRowClick={setSelected}
        />
      </div>
      <RightDrawer open={Boolean(selected)} title={"Fabric QC detail"} onClose={() => setSelected(null)}>
        {selected ? (
          <div className="space-y-3 text-sm text-slate-700">
            {"rolls" in selected ? (
              <>
                <p>Lot: {selected.lotNo}</p>
                <p>Order: {selected.orderNo}</p>
                <p>Rolls: {selected.rolls.length}</p>
                <div className="space-y-2">
                  {selected.rolls.map((roll) => (
                    <div key={roll.id} className="flex justify-between border-b border-grid-border py-2">
                      <span>{roll.rollNo}</span>
                      <StatusBadge status={roll.qcStatus} />
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <StatusBadge status={selected.status} />
                <p>Roll: {selected.rollNo}</p>
                <p>4-point score: {selected.fourPointScore ?? "-"}</p>
                <p>Remarks: {selected.remarks || "-"}</p>
              </>
            )}
          </div>
        ) : null}
      </RightDrawer>
    </section>
  );
}
