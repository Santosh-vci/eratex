"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";

import { AuditTrailPanel } from "@/shared/AuditTrailPanel";
import { ConfirmDialog } from "@/shared/ConfirmDialog";
import { DataGrid } from "@/shared/DataGrid";
import { PermissionGate } from "@/shared/PermissionGate";
import { RightDrawer } from "@/shared/RightDrawer";
import { Timeline } from "@/shared/Timeline";
import { OwnerBadge, RiskBadge, SeverityBadge, StaleDataBadge, StatusBadge, SyncStatusBadge } from "@/shared/badges";
import { ActionButton, FilterBar, ModuleHeader, Panel } from "@/shared/layout";
import { EmptyState } from "@/shared/states/EmptyState";
import { ErrorState } from "@/shared/states/ErrorState";
import { LoadingState } from "@/shared/states/LoadingState";
import type { AuditEvent } from "@/types/domain";

type Row = {
  code: string;
  surface: string;
  status: string;
  risk: "ON_TRACK" | "WATCH" | "ACTION" | "CRITICAL";
  owner: string;
};

const rows: Row[] = [
  { code: "API", surface: "API Client", status: "READY", risk: "ON_TRACK", owner: "Tech Lead" },
  { code: "RBAC", surface: "Permission Gate", status: "READY", risk: "WATCH", owner: "Backend Lead" },
  { code: "QA", surface: "Test Harness", status: "READY", risk: "ACTION", owner: "QA Lead" },
];

const columns: ColumnDef<Row>[] = [
  { accessorKey: "code", header: "EOS" },
  { accessorKey: "surface", header: "Surface" },
  { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
  { accessorKey: "risk", header: "Risk", cell: ({ row }) => <RiskBadge risk={row.original.risk} /> },
  { accessorKey: "owner", header: "Owner", cell: ({ row }) => <OwnerBadge owner={row.original.owner} /> },
];

const auditEvents: AuditEvent[] = [
  {
    id: "audit-1",
    eventCode: "foundation.component_viewed",
    entityType: "Foundation",
    entityId: "COMPONENTS",
    entityDisplayCode: "COMPONENTS",
    action: "viewed",
    oldValueJson: {},
    newValueJson: {},
    reason: "Component sandbox",
    metadata: {},
    performedBy: null,
    source: "WEB",
    createdAt: "2026-05-27T00:00:00+07:00",
  },
];

export default function ComponentFoundationPage() {
  const [selectedRow, setSelectedRow] = useState<Row | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <section>
      <ModuleHeader
        title="Component Foundation"
        description="Shared operational primitives for future Eratex workbenches."
        actions={<ActionButton onClick={() => setConfirmOpen(true)}>Test confirm</ActionButton>}
      />
      <FilterBar>
        <StatusBadge status="READY" />
        <RiskBadge risk="ON_TRACK" />
        <RiskBadge risk="WATCH" />
        <RiskBadge risk="ACTION" />
        <RiskBadge risk="CRITICAL" />
        <SeverityBadge severity="HIGH" />
        <StaleDataBadge minutes={3} />
        <SyncStatusBadge status="SYNCED" />
      </FilterBar>
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_360px]">
        <DataGrid data={rows} columns={columns} onRowClick={setSelectedRow} />
        <div className="space-y-3">
          <PermissionGate permission="foundation.view" fallback={<ErrorState title="Blocked" message="Permission missing." />}>
            <EmptyState title="Empty state" message="Future workbenches reuse this state for clear operational absence." />
          </PermissionGate>
          <LoadingState label="Loading state" />
          <Panel title="Timeline" eyebrow="Interaction">
            <Timeline
              items={[
                { label: "Session loaded", status: "READY", timestamp: "08:00" },
                { label: "Permissions resolved", status: "READY", timestamp: "08:01" },
              ]}
            />
          </Panel>
          <Panel title="Audit" eyebrow="Governance">
            <AuditTrailPanel events={auditEvents} />
          </Panel>
        </div>
      </div>
      <RightDrawer
        open={Boolean(selectedRow)}
        title={selectedRow?.surface ?? "Detail"}
        onClose={() => setSelectedRow(null)}
      >
        <p className="text-sm text-slate-600">Selected row details stay in context.</p>
        {selectedRow ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusBadge status={selectedRow.status} />
            <RiskBadge risk={selectedRow.risk} />
          </div>
        ) : null}
      </RightDrawer>
      <ConfirmDialog
        open={confirmOpen}
        title="Confirm foundation action"
        message="This validates the shared confirmation dialog pattern."
        onConfirm={() => setConfirmOpen(false)}
        onCancel={() => setConfirmOpen(false)}
      />
    </section>
  );
}
