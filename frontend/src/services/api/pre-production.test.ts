import { afterEach, expect, test, vi } from "vitest";

import {
  approveConditionalRelease,
  getOrders,
  updatePurchaseOrderEta,
} from "@/services/api/pre-production";

afterEach(() => {
  vi.unstubAllGlobals();
});

test("pre-production API loads order readiness rows", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        data: [
          {
            id: "order-1",
            orderNo: "ORD-PCD-001",
            poNumber: "PO-PCD-001",
            customer: { id: "cust-1", code: "NSR", name: "Northstar Retail" },
            buyer: null,
            style: {
              id: "style-1",
              styleCode: "STY-DEN-BASIC",
              productType: "DENIM",
              washComplexity: "BASIC",
              sewingComplexity: "BASIC",
            },
            productType: "DENIM",
            orderQty: 1200,
            plannedPcdDate: "2026-06-01",
            plannedShipDate: "2026-06-30",
            committedShipDate: "2026-06-30",
            currentStage: "PCD_PENDING",
            lifecycleStatus: "PCD_PENDING",
            riskStatus: "ACTION",
            pcdStatus: "BLOCKED",
            materialReadinessStatus: "READY",
            fabricQcStatus: "PASSED",
            shipmentReadinessStatus: "NOT_STARTED",
            owner: null,
            nextAction: "Complete PCD readiness",
            openExceptionCount: 0,
            releaseAllowed: false,
            releaseBlockers: ["TRIMS_AVAILABLE: PENDING"],
            lastUpdatedAt: "2026-05-27T00:00:00Z",
          },
        ],
        meta: {},
        errors: [],
      }),
    }),
  );

  const orders = await getOrders();

  expect(orders[0].orderNo).toBe("ORD-PCD-001");
  expect(orders[0].releaseAllowed).toBe(false);
});

test("pre-production API posts ETA updates", async () => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({
      data: {
        id: "po-1",
        poNo: "MPO-001",
        orderId: "order-1",
        orderNo: "ORD-MAT-001",
        vendorCode: "VEN-FAB",
        vendorName: "Fabric Vendor",
        materialCode: "FAB-DEN-01",
        materialName: "Denim fabric",
        orderedQty: 1000,
        acknowledgedQty: null,
        expectedArrivalDate: "2026-06-02",
        revisedEta: "2026-06-05",
        actualArrivalDate: null,
        status: "DELAYED",
      },
      meta: {},
      errors: [],
    }),
  });
  vi.stubGlobal("fetch", fetchMock);

  const updated = await updatePurchaseOrderEta("po-1", "2026-06-05", "Vendor delay");

  expect(updated.revisedEta).toBe("2026-06-05");
  expect(fetchMock).toHaveBeenCalledWith(
    "http://localhost:8000/api/v1/procurement/purchase-orders/po-1/eta-updates",
    expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ revisedEta: "2026-06-05", reason: "Vendor delay" }),
    }),
  );
});

test("pre-production API posts conditional release approval", async () => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({
      data: {
        id: "pcd-1",
        orderId: "order-1",
        orderNo: "ORD-PCD-001",
        styleCode: "STY-DEN-BASIC",
        customerName: "Northstar Retail",
        plannedPcdDate: "2026-06-01",
        readinessStatus: "CONDITIONALLY_READY",
        conditionalRelease: true,
        conditionalReleaseReason: "Cutting only",
        conditionalReleaseExpiry: "2026-06-10",
        approvedBy: 2,
        approvedAt: "2026-05-27T00:00:00Z",
        releasedToCuttingAt: null,
        releaseAllowed: true,
        releaseBlockers: [],
        items: [],
        conditionalReleases: [],
      },
      meta: {},
      errors: [],
    }),
  });
  vi.stubGlobal("fetch", fetchMock);

  const readiness = await approveConditionalRelease("pcd-1", {
    reason: "Cutting only",
    expiryDate: "2026-06-10",
    riskNote: "Sewing remains blocked",
  });

  expect(readiness.releaseAllowed).toBe(true);
  expect(fetchMock).toHaveBeenCalledWith(
    "http://localhost:8000/api/v1/pcd-readiness/pcd-1/approve-conditional-release",
    expect.objectContaining({ method: "POST" }),
  );
});
