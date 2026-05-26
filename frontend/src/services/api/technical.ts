import { apiFetch } from "@/services/api/client";
import type {
  BOMHeader,
  LineCapability,
  OperationBulletin,
  OperationMaster,
  StyleDetail,
  StyleListItem,
  StyleReadiness,
  WashRoute,
  WorkcenterCapacityDay,
} from "@/types/domain";

export async function getStyles(): Promise<StyleListItem[]> {
  return (await apiFetch<StyleListItem[]>("/styles")).data;
}

export async function getStyle(styleId: string): Promise<StyleDetail> {
  return (await apiFetch<StyleDetail>(`/styles/${styleId}`)).data;
}

export async function getStyleReadiness(styleId: string): Promise<StyleReadiness> {
  return (await apiFetch<StyleReadiness>(`/styles/${styleId}/planning-readiness`)).data;
}

export async function getBoms(): Promise<BOMHeader[]> {
  return (await apiFetch<BOMHeader[]>("/boms")).data;
}

export async function getBom(bomId: string): Promise<BOMHeader> {
  return (await apiFetch<BOMHeader>(`/boms/${bomId}`)).data;
}

export async function getOperationMasters(): Promise<OperationMaster[]> {
  return (await apiFetch<OperationMaster[]>("/operation-masters")).data;
}

export async function getOperationBulletins(): Promise<OperationBulletin[]> {
  return (await apiFetch<OperationBulletin[]>("/operation-bulletins")).data;
}

export async function getOperationBulletin(bulletinId: string): Promise<OperationBulletin> {
  return (await apiFetch<OperationBulletin>(`/operation-bulletins/${bulletinId}`)).data;
}

export async function approveOperationBulletin(bulletinId: string): Promise<OperationBulletin> {
  return (await apiFetch<OperationBulletin>(`/operation-bulletins/${bulletinId}/approve`, { method: "POST" })).data;
}

export async function cloneOperationBulletin(
  bulletinId: string,
  version: string,
): Promise<OperationBulletin> {
  return (
    await apiFetch<OperationBulletin>(`/operation-bulletins/${bulletinId}/clone`, {
      method: "POST",
      body: JSON.stringify({ version }),
    })
  ).data;
}

export async function getWashRoutes(): Promise<WashRoute[]> {
  return (await apiFetch<WashRoute[]>("/wash-routes")).data;
}

export async function getWashRoute(routeId: string): Promise<WashRoute> {
  return (await apiFetch<WashRoute>(`/wash-routes/${routeId}`)).data;
}

export async function approveWashRoute(routeId: string): Promise<WashRoute> {
  return (await apiFetch<WashRoute>(`/wash-routes/${routeId}/approve`, { method: "POST" })).data;
}

export async function getLineCapability(): Promise<LineCapability[]> {
  return (await apiFetch<LineCapability[]>("/workcenters/line-capability")).data;
}

export async function getCapacityDays(): Promise<WorkcenterCapacityDay[]> {
  return (await apiFetch<WorkcenterCapacityDay[]>("/workcenters/capacity-days")).data;
}
