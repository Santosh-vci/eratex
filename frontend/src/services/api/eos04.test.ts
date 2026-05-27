import { afterEach, expect, test, vi } from "vitest";

import {
  getWeeklyPlanning,
  previewPlanImpact,
  validateRelease,
} from "@/services/api/eos04";

afterEach(() => {
  vi.unstubAllGlobals();
});

test("EOS-04 API loads weekly planning payload", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        data: {
          horizon: {
            id: "horizon-1",
            code: "WEEK-20260525",
            name: "Weekly plan",
            startDate: "2026-05-25",
            endDate: "2026-05-31",
            status: "ACTIVE",
            isCurrent: true,
          },
          plan: {
            id: "plan-1",
            horizonId: "horizon-1",
            versionNo: 2,
            status: "DRAFT",
            riskStatus: "WATCH",
            frozenAt: null,
            notes: "",
          },
          backlog: [],
          workItems: [],
          workcenterLoads: [],
          changeRequests: [],
        },
        meta: {},
        errors: [],
      }),
    }),
  );

  const weekly = await getWeeklyPlanning();

  expect(weekly.plan?.status).toBe("DRAFT");
  expect(weekly.horizon?.code).toBe("WEEK-20260525");
});

test("EOS-04 API posts impact preview without write", async () => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({
      data: {
        planVersionId: "plan-1",
        orderId: "order-1",
        workcenterId: "wc-1",
        addedMinutes: 600,
        before: {
          availableMinutes: 90000,
          plannedLoadMinutes: 1000,
          utilizationPercent: 1.1,
          constraintStatus: "NORMAL",
          riskStatus: "ON_TRACK",
        },
        after: {
          availableMinutes: 90000,
          plannedLoadMinutes: 1600,
          utilizationPercent: 1.78,
          constraintStatus: "NORMAL",
          riskStatus: "ON_TRACK",
        },
        writeApplied: false,
      },
      meta: {},
      errors: [],
    }),
  });
  vi.stubGlobal("fetch", fetchMock);

  const impact = await previewPlanImpact("plan-1", {
    orderId: "order-1",
    workcenterId: "wc-1",
    plannedQuantity: 100,
  });

  expect(impact.writeApplied).toBe(false);
  expect(fetchMock).toHaveBeenCalledWith(
    "http://localhost:8000/api/v1/planning/weekly/plan-1/impact-preview",
    expect.objectContaining({ method: "POST" }),
  );
});

test("EOS-04 API validates release blockers", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        data: {
          id: "validation-1",
          releaseId: "release-1",
          plannedWorkItemId: "item-1",
          orderId: "order-1",
          orderNo: "ORD-FABQC-001",
          isValid: false,
          riskStatus: "CRITICAL",
          checkedAt: "2026-05-27T00:00:00Z",
          checks: [{ code: "FABRIC_QC_CLEAR", passed: false, owner: "Fabric QC" }],
          blockers: [
            {
              code: "FABRIC_QC_CLEAR",
              message: "Fabric QC is FAILED.",
              severity: "CRITICAL",
              owner: "Fabric QC",
            },
          ],
        },
        meta: {},
        errors: [],
      }),
    }),
  );

  const validation = await validateRelease({ releaseId: "release-1" });

  expect(validation.isValid).toBe(false);
  expect(validation.blockers[0].code).toBe("FABRIC_QC_CLEAR");
});
