import { apiFetch } from "@/services/api/client";
import type {
  CuttingJob,
  LineLoadingPreview,
  LineRealignment,
  LineRealignmentPreview,
  OperationBulletinPerformance,
  SewingLineEfficiency,
  SewingLineLoadingBoard,
  SewingLineLoading,
  SewingOutputEntry,
  WipMovement,
  WipSummary,
} from "@/types/domain";

export async function getCuttingJobs(): Promise<CuttingJob[]> {
  return (await apiFetch<CuttingJob[]>("/cutting/jobs")).data;
}

export async function getWipOrderSummary(orderId: string): Promise<WipSummary> {
  return (await apiFetch<WipSummary>(`/wip/orders/${orderId}/summary`)).data;
}

export async function getWipMovements(): Promise<WipMovement[]> {
  return (await apiFetch<WipMovement[]>("/wip/movements")).data;
}

export async function getSewingLineLoadings(): Promise<SewingLineLoading[]> {
  return (await apiFetch<SewingLineLoading[]>("/sewing/line-loadings")).data;
}

export async function getSewingLineLoadingBoard(): Promise<SewingLineLoadingBoard> {
  return (await apiFetch<SewingLineLoadingBoard>("/sewing/line-loading-board")).data;
}

export async function previewLineLoading(payload: {
  releaseId: string;
  lineId: string;
  bulletinId: string;
  plannedQuantity?: number;
}): Promise<LineLoadingPreview> {
  return (
    await apiFetch<LineLoadingPreview>("/sewing/line-loadings/preview", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  ).data;
}

export async function getSewingOutput(): Promise<SewingOutputEntry[]> {
  return (await apiFetch<SewingOutputEntry[]>("/sewing/output")).data;
}

export async function createSewingOutput(payload: {
  lineLoadingId: string;
  clientEventId: string;
  timeSlot: string;
  grossQty: number;
  defectQty: number;
  reworkQty: number;
  source?: string;
  remarks?: string;
}): Promise<SewingOutputEntry> {
  return (
    await apiFetch<SewingOutputEntry>("/sewing/output", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  ).data;
}

export async function previewLineRealignment(payload: {
  lineLoadingId?: string;
  lineId: string;
  bulletinId: string;
  targetOutput: number;
}): Promise<LineRealignmentPreview> {
  return (
    await apiFetch<LineRealignmentPreview>("/sewing/line-realignment/preview", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  ).data;
}

export async function requestLineRealignment(payload: {
  lineLoadingId: string;
  targetOutput?: number;
}): Promise<LineRealignment> {
  return (
    await apiFetch<LineRealignment>("/sewing/line-realignment", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  ).data;
}

export async function approveLineRealignment(realignmentId: string): Promise<LineRealignment> {
  return (
    await apiFetch<LineRealignment>(`/sewing/line-realignment/${realignmentId}/approve`, {
      method: "POST",
    })
  ).data;
}

export async function applyLineRealignment(realignmentId: string): Promise<LineRealignment> {
  return (
    await apiFetch<LineRealignment>(`/sewing/line-realignment/${realignmentId}/apply`, {
      method: "POST",
    })
  ).data;
}

export async function getSewingLineEfficiency(): Promise<SewingLineEfficiency[]> {
  return (await apiFetch<SewingLineEfficiency[]>("/sewing/line-efficiency")).data;
}

export async function getOperationBulletinPerformance(
  bulletinId: string,
): Promise<OperationBulletinPerformance> {
  return (await apiFetch<OperationBulletinPerformance>(`/operation-bulletins/${bulletinId}/performance`)).data;
}
