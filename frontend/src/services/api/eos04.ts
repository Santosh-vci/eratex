import { apiFetch } from "@/services/api/client";
import type {
  PlanChangeRequest,
  PlanImpactPreview,
  PlannedWorkItem,
  PlanVersion,
  ProductionRelease,
  ReleaseValidationResult,
  WeeklyPlanningPayload,
  WorkcenterLoad,
  WorkcenterQueueItem,
} from "@/types/domain";

export async function getWeeklyPlanning(): Promise<WeeklyPlanningPayload> {
  return (await apiFetch<WeeklyPlanningPayload>("/planning/weekly")).data;
}

export async function createWeeklyPlan(): Promise<{ plan: PlanVersion }> {
  return (await apiFetch<{ plan: PlanVersion }>("/planning/weekly", { method: "POST" })).data;
}

export async function assignWeeklyPlanItem(
  planId: string,
  payload: {
    orderId: string;
    workcenterId: string;
    plannedQuantity: number;
    plannedStartDate?: string;
    plannedEndDate?: string;
  },
): Promise<PlannedWorkItem> {
  return (
    await apiFetch<PlannedWorkItem>(`/planning/weekly/${planId}/assign-item`, {
      method: "POST",
      body: JSON.stringify(payload),
    })
  ).data;
}

export async function previewPlanImpact(
  planId: string,
  payload: {
    orderId: string;
    workcenterId: string;
    plannedQuantity: number;
    plannedStartDate?: string;
    plannedEndDate?: string;
  },
): Promise<PlanImpactPreview> {
  return (
    await apiFetch<PlanImpactPreview>(`/planning/weekly/${planId}/impact-preview`, {
      method: "POST",
      body: JSON.stringify(payload),
    })
  ).data;
}

export async function freezeWeeklyPlan(planId: string): Promise<PlanVersion> {
  return (
    await apiFetch<PlanVersion>(`/planning/weekly/${planId}/freeze`, {
      method: "POST",
    })
  ).data;
}

export async function requestPlanChange(payload: {
  planId: string;
  workItemId?: string;
  reason: string;
  changeType?: string;
  payload?: Record<string, unknown>;
}): Promise<PlanChangeRequest> {
  return (
    await apiFetch<PlanChangeRequest>("/planning/change-requests", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  ).data;
}

export async function approvePlanChange(changeId: string): Promise<PlanChangeRequest> {
  return (
    await apiFetch<PlanChangeRequest>(`/planning/change-requests/${changeId}/approve`, {
      method: "POST",
    })
  ).data;
}

export async function getWorkcenterLoad(): Promise<WorkcenterLoad[]> {
  return (await apiFetch<WorkcenterLoad[]>("/workcenters/load")).data;
}

export async function getWorkcenterQueue(workcenterId: string): Promise<WorkcenterQueueItem[]> {
  return (await apiFetch<WorkcenterQueueItem[]>(`/workcenters/${workcenterId}/queue`)).data;
}

export async function getCurrentConstraint(): Promise<WorkcenterLoad | null> {
  return (await apiFetch<WorkcenterLoad | null>("/workcenters/current-constraint")).data;
}

export async function getDailyReleases(): Promise<ProductionRelease[]> {
  return (await apiFetch<ProductionRelease[]>("/releases/daily")).data;
}

export async function validateRelease(payload: {
  releaseId?: string;
  workItemId?: string;
}): Promise<ReleaseValidationResult> {
  return (
    await apiFetch<ReleaseValidationResult>("/releases/validate", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  ).data;
}

export async function createRelease(workItemId: string): Promise<ProductionRelease> {
  return (
    await apiFetch<ProductionRelease>("/releases", {
      method: "POST",
      body: JSON.stringify({ workItemId }),
    })
  ).data;
}

export async function requestReleaseOverride(
  releaseId: string,
  reason: string,
): Promise<ProductionRelease> {
  return (
    await apiFetch<ProductionRelease>(`/releases/${releaseId}/request-override`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    })
  ).data;
}

export async function approveReleaseOverride(
  releaseId: string,
  reason: string,
): Promise<ProductionRelease> {
  return (
    await apiFetch<ProductionRelease>(`/releases/${releaseId}/approve-override`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    })
  ).data;
}

export async function completeRelease(releaseId: string): Promise<ProductionRelease> {
  return (
    await apiFetch<ProductionRelease>(`/releases/${releaseId}/complete`, {
      method: "POST",
    })
  ).data;
}
