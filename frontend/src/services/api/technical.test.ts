import { afterEach, expect, test, vi } from "vitest";

import { cloneOperationBulletin, getStyles } from "@/services/api/technical";

afterEach(() => {
  vi.unstubAllGlobals();
});

test("technical API loads style readiness rows", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        data: [
          {
            id: "style-1",
            styleCode: "STY-DEN-BASIC",
            customerName: "Global Denim Buyer A",
            customerCode: "CUST-A",
            buyerName: "BUYER-A1",
            productType: "DENIM_BOTTOM",
            washComplexity: "MEDIUM",
            sewingComplexity: "MEDIUM",
            overallComplexity: "MEDIUM",
            status: "APPROVED",
            planningReady: true,
            missingItems: [],
          },
        ],
        meta: {},
        errors: [],
      }),
    }),
  );

  const styles = await getStyles();

  expect(styles[0].styleCode).toBe("STY-DEN-BASIC");
  expect(styles[0].planningReady).toBe(true);
});

test("technical API posts clone requests with a new version", async () => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    status: 201,
    json: async () => ({
      data: {
        id: "bulletin-2",
        styleId: "style-1",
        styleCode: "STY-DEN-BASIC",
        customerName: "Global Denim Buyer A",
        productType: "DENIM_BOTTOM",
        version: "v2",
        status: "DRAFT",
        totalSmv: 5.05,
        operationCount: 6,
        criticalOperationCount: 3,
        approvedAt: null,
        operations: [],
      },
      meta: {},
      errors: [],
    }),
  });
  vi.stubGlobal("fetch", fetchMock);

  const cloned = await cloneOperationBulletin("bulletin-1", "v2");

  expect(cloned.version).toBe("v2");
  expect(fetchMock).toHaveBeenCalledWith(
    "http://localhost:8000/api/v1/operation-bulletins/bulletin-1/clone",
    expect.objectContaining({ method: "POST", body: JSON.stringify({ version: "v2" }) }),
  );
});

