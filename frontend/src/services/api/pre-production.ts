import { apiFetch } from "@/services/api/client";
import type {
  FabricQcDashboard,
  FabricQcInspection,
  MaterialPurchaseOrder,
  MaterialReadiness,
  OrderTimelineEvent,
  PcdReadiness,
  ProductionOrder,
} from "@/types/domain";

export async function getOrders(): Promise<ProductionOrder[]> {
  return (await apiFetch<ProductionOrder[]>("/orders")).data;
}

export async function getOrder(orderId: string): Promise<ProductionOrder> {
  return (await apiFetch<ProductionOrder>(`/orders/${orderId}`)).data;
}

export async function getOrderTimeline(orderId: string): Promise<OrderTimelineEvent[]> {
  return (await apiFetch<OrderTimelineEvent[]>(`/orders/${orderId}/timeline`)).data;
}

export async function releaseOrderToCutting(orderId: string): Promise<PcdReadiness> {
  return (await apiFetch<PcdReadiness>(`/orders/${orderId}/release-to-cutting`, { method: "POST" }))
    .data;
}

export async function getMaterialReadiness(): Promise<MaterialReadiness[]> {
  return (await apiFetch<MaterialReadiness[]>("/material-readiness")).data;
}

export async function getOrderMaterialReadiness(orderId: string): Promise<MaterialReadiness> {
  return (await apiFetch<MaterialReadiness>(`/orders/${orderId}/material-readiness`)).data;
}

export async function getPurchaseOrders(): Promise<MaterialPurchaseOrder[]> {
  return (await apiFetch<MaterialPurchaseOrder[]>("/procurement/purchase-orders")).data;
}

export async function updatePurchaseOrderEta(
  purchaseOrderId: string,
  revisedEta: string,
  reason: string,
): Promise<MaterialPurchaseOrder> {
  return (
    await apiFetch<MaterialPurchaseOrder>(
      `/procurement/purchase-orders/${purchaseOrderId}/eta-updates`,
      {
        method: "POST",
        body: JSON.stringify({ revisedEta, reason }),
      },
    )
  ).data;
}

export async function closeMaterialShortage(
  requirementId: string,
  reason: string,
): Promise<{ id: string; status: string; shortageQty: number }> {
  return (
    await apiFetch<{ id: string; status: string; shortageQty: number }>(
      `/material-readiness/${requirementId}/close-shortage`,
      {
        method: "POST",
        body: JSON.stringify({ reason }),
      },
    )
  ).data;
}

export async function getFabricQc(): Promise<FabricQcDashboard> {
  return (await apiFetch<FabricQcDashboard>("/fabric-qc")).data;
}

export async function createFabricQcInspection(payload: {
  fabricRollId: string;
  inspectionDate: string;
  fourPointScore: number;
  widthResult: number;
  gsmResult: number;
  shrinkagePercent: number;
  remarks?: string;
}): Promise<FabricQcInspection> {
  return (
    await apiFetch<FabricQcInspection>("/fabric-qc/inspections", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  ).data;
}

export async function waiveFabricQcInspection(
  inspectionId: string,
  reason: string,
): Promise<FabricQcInspection> {
  return (
    await apiFetch<FabricQcInspection>(`/fabric-qc/inspections/${inspectionId}/waive`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    })
  ).data;
}

export async function getPcdReadiness(): Promise<PcdReadiness[]> {
  return (await apiFetch<PcdReadiness[]>("/pcd-readiness")).data;
}

export async function getPcdReadinessDetail(readinessId: string): Promise<PcdReadiness> {
  return (await apiFetch<PcdReadiness>(`/pcd-readiness/${readinessId}`)).data;
}

export async function getOrderPcdReadiness(orderId: string): Promise<PcdReadiness> {
  return (await apiFetch<PcdReadiness>(`/orders/${orderId}/pcd-readiness`)).data;
}

export async function updatePcdItem(
  readinessId: string,
  itemId: string,
  status: string,
  remarks: string,
): Promise<PcdReadiness> {
  return (
    await apiFetch<PcdReadiness>(`/pcd-readiness/${readinessId}/items/${itemId}`, {
      method: "PATCH",
      body: JSON.stringify({ status, remarks }),
    })
  ).data;
}

export async function requestConditionalRelease(
  readinessId: string,
  payload: { reason: string; expiryDate: string; riskNote: string },
): Promise<{ id: string; status: string }> {
  return (
    await apiFetch<{ id: string; status: string }>(
      `/pcd-readiness/${readinessId}/request-conditional-release`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    )
  ).data;
}

export async function approveConditionalRelease(
  readinessId: string,
  payload: { reason: string; expiryDate: string; riskNote: string },
): Promise<PcdReadiness> {
  return (
    await apiFetch<PcdReadiness>(`/pcd-readiness/${readinessId}/approve-conditional-release`, {
      method: "POST",
      body: JSON.stringify(payload),
    })
  ).data;
}
