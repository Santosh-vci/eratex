import { expect, type Page, type Route, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";

test.setTimeout(60000);

function corsHeaders(route: Route) {
  return {
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "Content-Type, X-CSRFToken",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Origin": route.request().headers().origin ?? "http://127.0.0.1:3000",
  };
}

const executionUser = {
  id: 8,
  username: "line_supervisor",
  email: "line.supervisor@example.com",
  firstName: "Line",
  lastName: "Supervisor",
  displayName: "Line Supervisor",
  isStaff: true,
  isSuperuser: false,
  roles: [{ id: "role-exec", code: "LINE_SUPERVISOR", name: "Line Supervisor", factoryId: null }],
  permissions: [
    "foundation.view",
    "cutting.view",
    "cutting.record_output",
    "cutting.handover_to_sewing",
    "wip.view",
    "sewing.view",
    "sewing.load_line",
    "sewing.record_output",
    "sewing.realign_line",
    "sewing.approve_realignment",
    "sewing.apply_realignment",
    "sewing.view_efficiency",
    "bulletin.view",
  ],
  scopes: [],
  featureFlags: {},
};

const cuttingJob = {
  id: "cut-job-1",
  jobNo: "CUT-ORD-REL-001",
  releaseId: "release-1",
  releaseNo: "REL-ORD-REL-001-20260525",
  orderId: "order-1",
  orderNo: "ORD-REL-001",
  styleCode: "STY-DEN-BASIC",
  workcenterId: "wc-cutting",
  workcenterCode: "CUTTING",
  plannedQuantity: 500,
  markerNo: "MRK-001",
  colorCode: "INDIGO",
  shadeLot: "SHADE-A",
  status: "COMPLETED",
  riskStatus: "ON_TRACK",
  startedAt: "2026-05-27T08:00:00Z",
  completedAt: "2026-05-27T10:00:00Z",
  handedOverAt: "2026-05-27T11:00:00Z",
  outputQty: 505,
  netCutQty: 498,
  bundleCount: 5,
};

const lineLoading = {
  id: "loading-1",
  loadingNo: "LOAD-001",
  releaseId: "release-1",
  releaseNo: "REL-ORD-REL-001-20260525",
  orderId: "order-1",
  orderNo: "ORD-REL-001",
  styleCode: "STY-DEN-BASIC",
  lineId: "line-1",
  lineCode: "LINE-04-A",
  lineName: "Sewing Line 04A",
  workcenterId: "wc-sewing",
  workcenterCode: "SEWING",
  bulletinId: "bulletin-1",
  bulletinVersion: "v1",
  plannedQuantity: 500,
  targetOutputPerDay: 420,
  targetEfficiency: 82,
  expectedDefectRate: 2.5,
  planningZone: "FIRM_ZONE",
  plannedShift: "DAY",
  colorCode: "INDIGO",
  shadeLot: "SHADE-A",
  fitStatus: "FIT_WITH_GAPS",
  status: "ACTIVE",
  riskStatus: "WATCH",
  activatedAt: "2026-05-27T11:30:00Z",
  closedAt: null,
};

function boardRow(lineNo: number, overrides: Record<string, unknown> = {}) {
  const lineCode = `LINE ${String(lineNo).padStart(2, "0")}`;
  const status = String(overrides.status ?? "RUNNING");
  const riskStatus = String(overrides.riskStatus ?? "ON_TRACK");
  const target = Number(overrides.target ?? 1500);
  const actual = Number(overrides.actual ?? 1120);
  const netGood = Number(overrides.netGood ?? 1111);
  const defectPercent = Number(overrides.defectPercent ?? 0.8);
  return {
    id: String(overrides.id ?? `loading-${lineNo}`),
    lineLoadingId: String(overrides.id ?? `loading-${lineNo}`),
    lineCode,
    rawLineCode: lineCode.replace(" ", "-"),
    poNo: String(overrides.poNo ?? `PO-9200${String(lineNo).padStart(2, "0")}`),
    orderNo: String(overrides.orderNo ?? "ORD-REL-001"),
    style: String(overrides.style ?? "SKU-MODERN"),
    smv: Number(overrides.smv ?? 18.5),
    target,
    actual,
    efficiencyPercent: Number(overrides.efficiencyPercent ?? Math.round((netGood / target) * 100)),
    defectPercent,
    netGood,
    plannedManpower: Number(overrides.plannedManpower ?? 28),
    actualManpower: Number(overrides.actualManpower ?? 28),
    status,
    riskStatus,
    analysis: {
      title: `${lineCode} - Analysis`,
      subtitle: "Unit 04 - Denim Production",
      hourlyOutput: [
        { time: "08:00", target: 150, actual: status === "DOWN" ? 60 : 115 },
        { time: "09:00", target: 150, actual: status === "DOWN" ? 52 : 117 },
        { time: "10:00", target: 150, actual: status === "DOWN" ? 75 : 113 },
        { time: "11:00", target: 150, actual: status === "DOWN" ? 63 : 111 },
        { time: "12:00", target: 150, actual: status === "DOWN" ? 15 : 108 },
      ],
      bottleneckOperation: {
        operationName: String(overrides.operationName ?? "Waistband Attach"),
        smv: Number(overrides.operationSmv ?? 1.2),
        station: String(overrides.station ?? "#08"),
        wipAccumulation: Number(overrides.wipAccumulation ?? target - actual),
      },
      operatorAllocation:
        overrides.operatorAllocation ??
        [
          { code: "A1", name: "M. Rahim", role: "Lead Sewer", status: "PRESENT" },
          { code: "B4", name: "T. Akter", role: "Inline Op", status: "PRESENT" },
        ],
      absenceImpact: String(overrides.absenceImpact ?? "No critical absenteeism impact recorded."),
      recoveryAction: {
        label: "Recovery Action",
        description: String(overrides.recoveryDescription ?? "Hold current operator allocation and keep monitoring hourly net-good output."),
        actionLabel: "Approve Reassignment",
      },
    },
  };
}

const lineLoadingBoardRows = [
  boardRow(8, {
    id: "loading-08",
    poNo: "PO-88291",
    style: "DENIM-S24",
    smv: 22.4,
    target: 1200,
    actual: 580,
    efficiencyPercent: 48,
    defectPercent: 4.2,
    netGood: 555,
    plannedManpower: 32,
    actualManpower: 29,
    status: "DOWN",
    riskStatus: "ACTION",
    operationName: "Front Pocket Attachment",
    operationSmv: 1.4,
    station: "#14",
    wipAccumulation: 450,
    operatorAllocation: [
      { code: "A1", name: "M. Rahim", role: "Lead Sewer", status: "PRESENT" },
      { code: "S2", name: "S. Khatun", role: "Overlock Op", status: "ABSENT" },
    ],
    absenceImpact: "+ 2 more absences today. Total Capacity Impact: -18%",
    recoveryDescription: "Reassign 2 floaters from Line 22 (High Inventory) to Line 08 Station #14 and #15.",
  }),
  boardRow(1, { id: "loading-01", poNo: "PO-91023", style: "SHIRT-A1", smv: 14.8, target: 2000, actual: 1540, netGood: 1521 }),
  boardRow(14, {
    id: "loading-14",
    poNo: "PO-77312",
    style: "JEAN-SLIM",
    smv: 26.1,
    target: 900,
    actual: 580,
    efficiencyPercent: 64,
    defectPercent: 2.8,
    netGood: 563,
    plannedManpower: 38,
    actualManpower: 38,
    status: "CHANGEOVER",
    riskStatus: "WATCH",
  }),
  ...[2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 15, 16, 17].map((lineNo) => boardRow(lineNo)),
];

const lineLoadingBoard = {
  summary: {
    activeLines: lineLoadingBoardRows.length,
    overloadedLines: 4,
    underloadedLines: 2,
    avgNetGoodEfficiency: 72,
    highestRisk: {
      lineId: "loading-08",
      lineCode: "LINE 08",
      efficiencyPercent: 48,
      defectPercent: 4.2,
      riskStatus: "ACTION",
    },
  },
  lines: lineLoadingBoardRows,
  selectedLineId: "loading-08",
};

const realignmentPreview = {
  lineId: "line-1",
  lineCode: "LINE-04-A",
  lineLoadingId: "loading-1",
  orderId: "order-1",
  orderNo: "ORD-REL-001",
  styleCode: "STY-DEN-BASIC",
  bulletinId: "bulletin-1",
  bulletinVersion: "v1",
  fitStatus: "FIT_WITH_GAPS",
  expectedOutputBefore: 360,
  expectedOutputAfter: 430,
  changeoverMinutes: 45,
  machineGaps: [{ machineType: "SNLS", gap: 1, recommendation: "Move one spare SNLS from LINE-02." }],
  skillGaps: [{ operationName: "Front pocket attach", gap: 2, recommendation: "Assign two L2 operators." }],
  bottleneckOperations: [{ operationName: "Front pocket attach", loadPercent: 118 }],
  recommendations: ["Approve realignment before the next shift."],
  approvalRequired: true,
  riskStatus: "WATCH",
};

const realignment = {
  ...realignmentPreview,
  id: "realign-1",
  requestNo: "REALIGN-001",
  status: "REQUESTED",
  targetOutput: 430,
  gaps: [...realignmentPreview.machineGaps, ...realignmentPreview.skillGaps],
};

async function setupAuthMocks(page: Page) {
  let authenticated = false;

  await page.route("**/api/v1/me", async (route) => {
    if (!authenticated) {
      await route.fulfill({
        contentType: "application/json",
        headers: corsHeaders(route),
        status: 401,
        body: JSON.stringify({ data: null, meta: {}, errors: [{ code: "AUTH_REQUIRED", message: "Login required." }] }),
      });
      return;
    }

    await route.fulfill({
      contentType: "application/json",
      headers: corsHeaders(route),
      body: JSON.stringify({ data: executionUser, meta: {}, errors: [] }),
    });
  });

  await page.route("**/api/v1/auth/csrf", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      headers: corsHeaders(route),
      body: JSON.stringify({ data: { csrfToken: "csrf" }, meta: {}, errors: [] }),
    });
  });

  await page.route("**/api/v1/auth/login", async (route) => {
    authenticated = true;
    await route.fulfill({
      contentType: "application/json",
      headers: corsHeaders(route),
      body: JSON.stringify({ data: executionUser, meta: {}, errors: [] }),
    });
  });
}

async function setupExecutionMocks(page: Page) {
  const calls = {
    lineLoadingBoard: 0,
    realignmentRequests: 0,
    lastRealignmentPayload: null as unknown,
  };

  await page.route("**/api/v1/cutting/jobs", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      headers: corsHeaders(route),
      body: JSON.stringify({ data: [cuttingJob], meta: {}, errors: [] }),
    });
  });
  await page.route("**/api/v1/wip/orders/order-1/summary", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      headers: corsHeaders(route),
      body: JSON.stringify({
        data: {
          orderId: "order-1",
          orderNo: "ORD-REL-001",
          totalAvailable: 498,
          stages: {
            CUT_PANEL: { quantity: 498, availableQuantity: 120, heldQuantity: 0, riskStatus: "WATCH" },
            SEWING_ACTIVE: { quantity: 378, availableQuantity: 378, heldQuantity: 0, riskStatus: "ON_TRACK" },
          },
        },
        meta: {},
        errors: [],
      }),
    });
  });
  await page.route("**/api/v1/wip/movements", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      headers: corsHeaders(route),
      body: JSON.stringify({
        data: [
          {
            id: "move-1",
            movementNo: "MOVE-001",
            orderId: "order-1",
            orderNo: "ORD-REL-001",
            sourceLotId: "lot-cut",
            targetLotId: "lot-sew",
            fromStage: "CUT_PANEL",
            toStage: "SEWING_ACTIVE",
            quantity: 378,
            movementType: "HANDOVER",
            reason: "Cutting handover to sewing",
            createdAt: "2026-05-27T11:00:00Z",
          },
        ],
        meta: {},
        errors: [],
      }),
    });
  });
  await page.route("**/api/v1/sewing/line-loadings", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      headers: corsHeaders(route),
      body: JSON.stringify({ data: [lineLoading], meta: {}, errors: [] }),
    });
  });
  await page.route("**/api/v1/sewing/line-loading-board", async (route) => {
    calls.lineLoadingBoard += 1;
    await route.fulfill({
      contentType: "application/json",
      headers: corsHeaders(route),
      body: JSON.stringify({ data: lineLoadingBoard, meta: {}, errors: [] }),
    });
  });
  await page.route("**/api/v1/sewing/line-efficiency", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      headers: corsHeaders(route),
      body: JSON.stringify({
        data: [
          {
            lineLoadingId: "loading-1",
            loadingNo: "LOAD-001",
            orderNo: "ORD-REL-001",
            lineCode: "LINE-04-A",
            targetOutput: 420,
            grossQty: 130,
            defectQty: 4,
            reworkQty: 6,
            netGoodQty: 120,
            efficiencyPercent: 76,
            riskStatus: "WATCH",
          },
        ],
        meta: {},
        errors: [],
      }),
    });
  });
  await page.route("**/api/v1/sewing/output", async (route) => {
    if (route.request().method() === "POST") {
      await route.fulfill({
        contentType: "application/json",
        headers: corsHeaders(route),
        body: JSON.stringify({
          data: {
            id: "output-2",
            lineLoadingId: "loading-1",
            loadingNo: "LOAD-001",
            clientEventId: "ui-test",
            orderId: "order-1",
            orderNo: "ORD-REL-001",
            lineId: "line-1",
            lineCode: "LINE-04-A",
            entryTime: "2026-05-27T12:00:00Z",
            timeSlot: "CURRENT",
            grossQty: 120,
            defectQty: 0,
            reworkQty: 0,
            netGoodQty: 120,
            source: "DESKTOP",
            remarks: "Desktop output capture.",
          },
          meta: {},
          errors: [],
        }),
      });
      return;
    }
    await route.fulfill({
      contentType: "application/json",
      headers: corsHeaders(route),
      body: JSON.stringify({
        data: [
          {
            id: "output-1",
            lineLoadingId: "loading-1",
            loadingNo: "LOAD-001",
            clientEventId: "seed-output-1",
            orderId: "order-1",
            orderNo: "ORD-REL-001",
            lineId: "line-1",
            lineCode: "LINE-04-A",
            entryTime: "2026-05-27T11:45:00Z",
            timeSlot: "HOUR_01",
            grossQty: 130,
            defectQty: 4,
            reworkQty: 6,
            netGoodQty: 120,
            source: "DESKTOP",
            remarks: "Seeded execution output.",
          },
        ],
        meta: {},
        errors: [],
      }),
    });
  });
  await page.route("**/api/v1/sewing/line-realignment/preview", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      headers: corsHeaders(route),
      body: JSON.stringify({ data: realignmentPreview, meta: {}, errors: [] }),
    });
  });
  await page.route("**/api/v1/sewing/line-realignment", async (route) => {
    calls.realignmentRequests += 1;
    calls.lastRealignmentPayload = route.request().postDataJSON();
    await route.fulfill({
      contentType: "application/json",
      headers: corsHeaders(route),
      body: JSON.stringify({ data: realignment, meta: {}, errors: [] }),
    });
  });
  await page.route("**/api/v1/sewing/line-realignment/realign-1/approve", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      headers: corsHeaders(route),
      body: JSON.stringify({ data: { ...realignment, status: "APPROVED" }, meta: {}, errors: [] }),
    });
  });
  await page.route("**/api/v1/sewing/line-realignment/realign-1/apply", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      headers: corsHeaders(route),
      body: JSON.stringify({ data: { ...realignment, status: "APPLIED" }, meta: {}, errors: [] }),
    });
  });
  return calls;
}

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Username").fill("line_supervisor");
  await Promise.all([
    page.waitForURL((url) => url.pathname !== "/login", { timeout: 15000 }),
    page.getByRole("button", { name: "Sign in" }).click(),
  ]);
}

async function captureParity(page: Page, name: string) {
  await mkdir("test-results/ui-parity", { recursive: true });
  await page.screenshot({ path: `test-results/ui-parity/${name}.png`, fullPage: true });
}

test("execution user can inspect cutting, loading, realignment, and output capture surfaces", async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 996 });
  await setupAuthMocks(page);
  const apiCalls = await setupExecutionMocks(page);
  await login(page);

  await page.goto("/cutting/room");
  await expect(page.getByRole("heading", { name: "Cutting Room Management" })).toBeVisible();
  await page.getByRole("cell", { name: "CUT-ORD-REL-001" }).click();
  await expect(page.getByRole("heading", { name: "Marker and Release" }).first()).toBeVisible();
  await captureParity(page, "cutting-room");

  await page.goto("/sewing/line-loading");
  await expect(page.getByText("Sewing Line Loading").first()).toBeVisible();
  for (const label of ["Active Lines", "Overloaded Lines", "Underloaded", "Avg. Net-Good Eff.", "Highest Risk"]) {
    await expect(page.getByText(label)).toBeVisible();
  }
  const lineBoard = page.getByRole("table", { name: "Sewing line loading board" });
  for (const header of ["LINE ID", "PO#", "STYLE", "SMV", "TARGET", "ACTUAL", "EFF %", "DEFECT %", "NET GOOD", "MANPOWER (P/A)", "STATUS", "RISK"]) {
    await expect(lineBoard.getByRole("columnheader", { name: header })).toBeVisible();
  }
  await expect(lineBoard.locator("tbody tr")).toHaveCount(17);
  await expect(lineBoard.getByText("DOWN")).toBeVisible();
  await expect(lineBoard.getByText("RUNNING").first()).toBeVisible();
  await expect(lineBoard.getByText("CHANGEOVER")).toBeVisible();
  await expect(page.getByRole("dialog", { name: /LINE 08 - Analysis/ })).toHaveCount(0);
  await captureParity(page, "sewing-line-loading-board");
  await expect.poll(() => apiCalls.lineLoadingBoard).toBeGreaterThan(0);
  await lineBoard.getByRole("row", { name: /LINE 08/ }).click();
  await expect(page.getByRole("dialog", { name: "LINE 08 - Analysis" })).toBeVisible();
  await expect(page.getByText("Today's Hourly Output")).toBeVisible();
  await expect(page.getByText("Bottleneck Operation")).toBeVisible();
  await expect(page.getByText("Front Pocket Attachment")).toBeVisible();
  await expect(page.getByText("Operator Allocation")).toBeVisible();
  await expect(page.getByText("Recovery Action")).toBeVisible();
  await expect(page.getByRole("button", { name: "Approve Reassignment" })).toBeVisible();
  await page.getByRole("button", { name: "Approve Reassignment" }).click();
  await expect(page.getByRole("status")).toContainText("Realignment request REALIGN-001 created through API.");
  await expect.poll(() => apiCalls.realignmentRequests).toBe(1);
  expect(apiCalls.lastRealignmentPayload).toMatchObject({
    lineLoadingId: "loading-08",
    targetOutput: 1200,
  });
  await captureParity(page, "sewing-line-loading-action-drawer");
  await page.getByLabel("Close drawer").click();
  await expect(page.getByRole("dialog", { name: /LINE 08 - Analysis/ })).toHaveCount(0);
  await lineBoard.getByRole("row", { name: /LINE 14/ }).click();
  await expect(page.getByRole("heading", { name: "LINE 14 - Analysis" })).toBeVisible();

  await page.goto("/sewing/line-realignment");
  await expect(page.getByRole("heading", { name: "Line Realignment Workbench" })).toBeVisible();
  await page.getByRole("button", { name: /LINE-04-A/ }).click();
  await expect(page.getByRole("heading", { name: "Current Line" })).toBeVisible();
  await page.getByRole("button", { name: "Request" }).click();
  await expect(page.getByRole("status")).toContainText("Line realignment request created.");
  await captureParity(page, "sewing-line-realignment");

  await page.goto("/sewing/output");
  await expect(page.getByRole("heading", { name: "Sewing Output Capture" })).toBeVisible();
  await expect(page.getByText("Net Good Quantity")).toBeVisible();
  await page.getByRole("button", { name: "Submit Output" }).click();
  await page.getByRole("button", { name: "Submit", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Output submitted: 120 net-good pcs.");
  await captureParity(page, "sewing-output");
});
