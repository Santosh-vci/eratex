import { apiFetch } from "@/services/api/client";
import type {
  BoundaryCaseEvent,
  BoundaryImpactPreview,
  ExternalPlanImportBatch,
} from "@/types/domain";

export async function getBoundaryCases(): Promise<BoundaryCaseEvent[]> {
  return (await apiFetch<BoundaryCaseEvent[]>("/boundary-cases")).data;
}

export async function createBoundaryCase(payload: {
  eventType: string;
  payload: Record<string, unknown>;
  triggerSource?: string;
}): Promise<BoundaryCaseEvent> {
  return (
    await apiFetch<BoundaryCaseEvent>("/boundary-cases", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  ).data;
}

export async function previewBoundaryImpact(payload: {
  eventType: string;
  payload: Record<string, unknown>;
}): Promise<BoundaryImpactPreview> {
  return (
    await apiFetch<BoundaryImpactPreview>("/boundary-cases/impact-preview", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  ).data;
}

export async function approveBoundaryAction(eventId: string): Promise<BoundaryCaseEvent> {
  return (
    await apiFetch<BoundaryCaseEvent>(`/boundary-cases/${eventId}/approve-action`, {
      method: "POST",
    })
  ).data;
}

export async function applyBoundaryAction(eventId: string): Promise<BoundaryCaseEvent> {
  return (
    await apiFetch<BoundaryCaseEvent>(`/boundary-cases/${eventId}/apply-action`, {
      method: "POST",
    })
  ).data;
}

export async function previewCapacityEvent(payload: Record<string, unknown>): Promise<BoundaryImpactPreview> {
  return (
    await apiFetch<BoundaryImpactPreview>("/capacity-events/impact-preview", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  ).data;
}

export async function importExternalPlan(payload: {
  sourceType: "fastreact_plan" | "external_plan";
  sourceReference?: string;
  rows: Array<Record<string, unknown>>;
}): Promise<ExternalPlanImportBatch> {
  return (
    await apiFetch<ExternalPlanImportBatch>("/external-plans/import", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  ).data;
}
