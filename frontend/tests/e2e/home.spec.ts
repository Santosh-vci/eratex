import { expect, type Page, type Route, test } from "@playwright/test";

function corsHeaders(route: Route) {
  return {
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "Content-Type, X-CSRFToken",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Origin": route.request().headers().origin ?? "http://127.0.0.1:3000",
  };
}

const plannerUser = {
  id: 1,
  username: "planner",
  email: "planner@example.com",
  firstName: "Production",
  lastName: "Planner",
  displayName: "Production Planner",
  isStaff: true,
  isSuperuser: false,
  roles: [{ id: "role-1", code: "PLANNER", name: "Planner", factoryId: null }],
  permissions: [
    "foundation.view",
    "orders.view",
    "planning.view",
    "master_data.view",
    "bulletin.view",
    "skill_matrix.view",
    "procurement.view",
    "fabric_qc.view",
    "pcd.view",
    "pcd.request_conditional_release",
    "pcd.release_to_cutting",
  ],
  scopes: [],
  featureFlags: {},
};

const ieUser = {
  ...plannerUser,
  id: 3,
  username: "ie_user",
  email: "ie@example.com",
  firstName: "Industrial",
  lastName: "Engineer",
  displayName: "Industrial Engineer",
  roles: [{ id: "role-3", code: "IE_USER", name: "Industrial Engineering", factoryId: null }],
  permissions: ["foundation.view", "master_data.view", "bulletin.view", "skill_matrix.view"],
};

const planningHeadUser = {
  ...plannerUser,
  id: 4,
  username: "planning_head",
  email: "planning.head@example.com",
  firstName: "Planning",
  lastName: "Head",
  displayName: "Planning Head",
  roles: [{ id: "role-4", code: "PLANNING_HEAD", name: "Planning Head", factoryId: null }],
  permissions: [
    ...plannerUser.permissions,
    "orders.release_to_cutting",
    "procurement.update_eta",
    "procurement.close_shortage",
    "fabric_qc.create_inspection",
    "fabric_qc.waive",
    "pcd.update_item",
    "pcd.approve_conditional_release",
    "pcd.view_audit",
  ],
};

async function setupAuthMocks(page: Page, currentUser: typeof plannerUser) {
  let isAuthenticated = false;

  await page.route("**/api/v1/me", async (route) => {
    if (isAuthenticated) {
      await route.fulfill({
        contentType: "application/json",
        headers: corsHeaders(route),
        body: JSON.stringify({ data: currentUser, meta: {}, errors: [] }),
      });
      return;
    }

    await route.fulfill({
      contentType: "application/json",
      headers: corsHeaders(route),
      body: JSON.stringify({
        data: null,
        meta: {},
        errors: [{ code: "AUTH_REQUIRED", message: "Authentication is required.", field: null, details: {} }],
      }),
      status: 401,
    });
  });
  await page.route("**/api/v1/auth/csrf", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      headers: corsHeaders(route),
      body: JSON.stringify({ data: { csrfToken: "test-csrf" }, meta: {}, errors: [] }),
    });
  });
  await page.route("**/api/v1/auth/login", async (route) => {
    if (route.request().method() === "OPTIONS") {
      await route.fulfill({ status: 204, headers: corsHeaders(route), body: "" });
      return;
    }

    isAuthenticated = true;
    await route.fulfill({
      contentType: "application/json",
      headers: corsHeaders(route),
      body: JSON.stringify({ data: currentUser, meta: {}, errors: [] }),
    });
  });
}

async function login(page: Page, username = "planner") {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await page.getByLabel("Username").fill(username);
  await page.getByRole("button", { name: "Sign in" }).click();
}

async function setupTechnicalMocks(page: Page) {
  const styleList = [
    {
      id: "style-1",
      styleCode: "STY-DEN-BASIC",
      customerName: "Northstar Retail",
      customerCode: "NSR",
      buyerName: "Denim Buyer",
      productType: "DENIM",
      washComplexity: "BASIC",
      sewingComplexity: "BASIC",
      overallComplexity: "MEDIUM",
      status: "APPROVED",
      planningReady: true,
      missingItems: [],
    },
    {
      id: "style-2",
      styleCode: "STY-DEN-NO-BULLETIN",
      customerName: "Northstar Retail",
      customerCode: "NSR",
      buyerName: "Denim Buyer",
      productType: "DENIM",
      washComplexity: "BASIC",
      sewingComplexity: "BASIC",
      overallComplexity: "LOW",
      status: "APPROVED",
      planningReady: false,
      missingItems: ["APPROVED_BOM", "APPROVED_OPERATION_BULLETIN", "APPROVED_WASH_ROUTE"],
    },
  ];
  const styleDetail = {
    ...styleList[0],
    description: "Five pocket denim basic",
    fitType: "Straight",
    fabricCategory: "Denim",
    season: "Core",
    referenceSampleNo: "SMP-001",
    defaultWashRouteId: "wash-1",
    readiness: {
      styleId: "style-1",
      styleCode: "STY-DEN-BASIC",
      planningReady: true,
      missingItems: [],
      approvedBomId: "bom-1",
      approvedOperationBulletinId: "bulletin-1",
      approvedWashRouteId: "wash-1",
    },
  };
  const bulletin = {
    id: "bulletin-1",
    styleId: "style-1",
    styleCode: "STY-DEN-BASIC",
    customerName: "Northstar Retail",
    productType: "DENIM",
    version: "V1",
    status: "APPROVED",
    totalSmv: 21.5,
    operationCount: 2,
    criticalOperationCount: 1,
    approvedAt: "2026-05-27T00:00:00Z",
    operations: [
      {
        id: "op-line-1",
        sequenceNo: 10,
        operationMasterId: "op-1",
        operationCode: "OP-FRONT-POCKET",
        operationName: "Front pocket attach",
        operationGroup: "SEWING",
        machineTypeId: "machine-type-1",
        machineType: "SNLS",
        attachmentRequired: "Folder",
        skillLevel: "L2",
        smv: 8.25,
        targetPph: 7.27,
        qcCheckpoint: true,
        criticalOperation: true,
        parallelAllowed: false,
        reworkSensitive: true,
      },
      {
        id: "op-line-2",
        sequenceNo: 20,
        operationMasterId: "op-2",
        operationCode: "OP-WAIST",
        operationName: "Waistband attach",
        operationGroup: "SEWING",
        machineTypeId: "machine-type-2",
        machineType: "DNLS",
        attachmentRequired: "",
        skillLevel: "L3",
        smv: 13.25,
        targetPph: 4.53,
        qcCheckpoint: false,
        criticalOperation: false,
        parallelAllowed: false,
        reworkSensitive: false,
      },
    ],
  };

  await page.route("**/api/v1/styles", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      headers: corsHeaders(route),
      body: JSON.stringify({ data: styleList, meta: {}, errors: [] }),
    });
  });
  await page.route("**/api/v1/styles/style-1", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      headers: corsHeaders(route),
      body: JSON.stringify({ data: styleDetail, meta: {}, errors: [] }),
    });
  });
  await page.route("**/api/v1/master/product-types", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      headers: corsHeaders(route),
      body: JSON.stringify({ data: [{ id: "ptype-1", code: "DENIM", name: "Denim", isActive: true }], meta: {}, errors: [] }),
    });
  });
  await page.route("**/api/v1/operation-bulletins", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      headers: corsHeaders(route),
      body: JSON.stringify({ data: [{ ...bulletin, operations: undefined }], meta: {}, errors: [] }),
    });
  });
  await page.route("**/api/v1/operation-bulletins/bulletin-1", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      headers: corsHeaders(route),
      body: JSON.stringify({ data: bulletin, meta: {}, errors: [] }),
    });
  });
}

async function setupPreProductionMocks(page: Page) {
  let pcdStatus = "BLOCKED";
  let releaseAllowed = false;
  let releaseBlockers = ["TRIMS_AVAILABLE: PENDING"];
  const pcdItems = [
    {
      id: "pcd-item-1",
      itemCode: "FABRIC_QC_PASSED",
      itemLabel: "Fabric QC passed",
      isMandatory: true,
      status: "PASSED",
      ownerId: null,
      dueDate: "2026-06-01",
      waiverReason: "",
      evidenceUrl: "",
      remarks: "Passed by QC",
    },
    {
      id: "pcd-item-2",
      itemCode: "TRIMS_AVAILABLE",
      itemLabel: "Trims available",
      isMandatory: true,
      status: "PENDING",
      ownerId: null,
      dueDate: "2026-06-01",
      waiverReason: "",
      evidenceUrl: "",
      remarks: "Awaiting zipper ETA",
    },
  ];

  const pcdRecord = () => ({
    id: "pcd-1",
    orderId: "order-pcd-1",
    orderNo: "ORD-PCD-001",
    styleCode: "STY-DEN-BASIC",
    customerName: "Northstar Retail",
    plannedPcdDate: "2026-06-01",
    readinessStatus: pcdStatus,
    conditionalRelease: pcdStatus === "CONDITIONALLY_READY",
    conditionalReleaseReason: pcdStatus === "CONDITIONALLY_READY" ? "Approved for cutting only." : "",
    conditionalReleaseExpiry: pcdStatus === "CONDITIONALLY_READY" ? "2099-01-01" : null,
    approvedBy: pcdStatus === "CONDITIONALLY_READY" ? 4 : null,
    approvedAt: pcdStatus === "CONDITIONALLY_READY" ? "2026-05-27T00:00:00Z" : null,
    releasedToCuttingAt: pcdStatus === "RELEASED" ? "2026-05-27T00:10:00Z" : null,
    releaseAllowed,
    releaseBlockers,
    items: pcdItems,
    conditionalReleases: [],
  });

  const orderRecord = () => ({
    id: "order-pcd-1",
    orderNo: "ORD-PCD-001",
    poNumber: "PO-PCD-001",
    customer: { id: "cust-1", code: "NSR", name: "Northstar Retail", isActive: true },
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
    riskStatus: releaseAllowed ? "WATCH" : "ACTION",
    pcdStatus,
    materialReadinessStatus: "READY",
    fabricQcStatus: "PASSED",
    shipmentReadinessStatus: "NOT_STARTED",
    owner: { id: 1, displayName: "Production Planner" },
    nextAction: releaseAllowed ? "Release to cutting" : releaseBlockers[0],
    openExceptionCount: 0,
    releaseAllowed,
    releaseBlockers,
    lastUpdatedAt: "2026-05-27T00:00:00Z",
  });

  await page.route("**/api/v1/orders", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      headers: corsHeaders(route),
      body: JSON.stringify({ data: [orderRecord()], meta: {}, errors: [] }),
    });
  });
  await page.route("**/api/v1/orders/order-pcd-1", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      headers: corsHeaders(route),
      body: JSON.stringify({
        data: { ...orderRecord(), lines: [{ id: "line-1", size: "32", color: "Indigo", quantity: 1200 }], pcdReadiness: pcdRecord() },
        meta: {},
        errors: [],
      }),
    });
  });
  await page.route("**/api/v1/orders/order-pcd-1/timeline", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      headers: corsHeaders(route),
      body: JSON.stringify({
        data: [
          {
            id: "evt-1",
            eventCode: "ORDER_CREATED",
            fromStage: "",
            toStage: "PCD_PENDING",
            message: "Order created",
            metadata: {},
            performedBy: { id: 1, displayName: "Production Planner" },
            createdAt: "2026-05-27T00:00:00Z",
          },
        ],
        meta: {},
        errors: [],
      }),
    });
  });
  await page.route("**/api/v1/pcd-readiness", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      headers: corsHeaders(route),
      body: JSON.stringify({ data: [pcdRecord()], meta: {}, errors: [] }),
    });
  });
  await page.route("**/api/v1/pcd-readiness/pcd-1/approve-conditional-release", async (route) => {
    if (route.request().method() === "OPTIONS") {
      await route.fulfill({ status: 204, headers: corsHeaders(route), body: "" });
      return;
    }
    pcdStatus = "CONDITIONALLY_READY";
    releaseAllowed = true;
    releaseBlockers = [];
    await route.fulfill({
      contentType: "application/json",
      headers: corsHeaders(route),
      body: JSON.stringify({ data: pcdRecord(), meta: {}, errors: [] }),
    });
  });
  await page.route("**/api/v1/orders/order-pcd-1/release-to-cutting", async (route) => {
    if (route.request().method() === "OPTIONS") {
      await route.fulfill({ status: 204, headers: corsHeaders(route), body: "" });
      return;
    }
    pcdStatus = "RELEASED";
    releaseAllowed = false;
    releaseBlockers = ["Order already released to cutting"];
    await route.fulfill({
      contentType: "application/json",
      headers: corsHeaders(route),
      body: JSON.stringify({ data: pcdRecord(), meta: {}, errors: [] }),
    });
  });
  await page.route("**/api/v1/material-readiness", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      headers: corsHeaders(route),
      body: JSON.stringify({ data: [], meta: {}, errors: [] }),
    });
  });
  await page.route("**/api/v1/procurement/purchase-orders", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      headers: corsHeaders(route),
      body: JSON.stringify({ data: [], meta: {}, errors: [] }),
    });
  });
  await page.route("**/api/v1/fabric-qc", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      headers: corsHeaders(route),
      body: JSON.stringify({ data: { lots: [], inspections: [] }, meta: {}, errors: [] }),
    });
  });
}

test("home route renders the foundation shell", async ({ page }) => {
  await setupAuthMocks(page, plannerUser);
  await login(page);

  await expect(page.getByRole("heading", { name: "Order Readiness Foundation" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Eratex Operating Spine" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Orders/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Planning/ })).toBeVisible();
});

test("planner can inspect blocked order and PCD readiness gate", async ({ page }) => {
  await setupAuthMocks(page, plannerUser);
  await setupPreProductionMocks(page);
  await login(page);

  await page.getByRole("link", { name: /Orders/ }).click();
  await expect(page.getByRole("heading", { name: "Order Lifecycle Explorer" })).toBeVisible();
  await expect(page.getByRole("link", { name: "ORD-PCD-001" })).toBeVisible();

  await page.getByRole("link", { name: "ORD-PCD-001" }).click();
  await expect(page.getByRole("heading", { name: "ORD-PCD-001" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "TRIMS_AVAILABLE: PENDING" })).toBeVisible();

  await page.getByRole("link", { name: "PCD", exact: true }).click();
  await expect(page.getByRole("heading", { name: "PCD Readiness" })).toBeVisible();
  await page.locator("tbody tr").first().click();
  await expect(page.getByText("Awaiting zipper ETA")).toBeVisible();
  await expect(page.getByRole("button", { name: "Release to cutting" })).toBeDisabled();
});

test("planning head can approve conditional release and release order gate", async ({ page }) => {
  await setupAuthMocks(page, planningHeadUser);
  await setupPreProductionMocks(page);
  await login(page, "planning_head");

  await page.getByRole("link", { name: "PCD", exact: true }).click();
  await page.locator("tbody tr").first().click();
  await page.getByRole("button", { name: "Approve conditional" }).click();
  await page.getByRole("button", { name: "Confirm" }).click();
  await expect(page.getByRole("status")).toContainText("Conditional release approved.");
  await expect(page.getByRole("button", { name: "Release to cutting" })).toBeEnabled();

  await page.getByRole("button", { name: "Release to cutting" }).click();
  await page.getByRole("button", { name: "Release", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Order released to cutting.");
});

test("ie user can open technical style and routing workbenches", async ({ page }) => {
  await setupAuthMocks(page, ieUser);
  await setupTechnicalMocks(page);
  await login(page, "ie_user");

  await page.getByRole("link", { name: /Styles/ }).click();
  await expect(page.getByRole("heading", { name: "Style Technical File" })).toBeVisible();
  await expect(page.getByRole("link", { name: "STY-DEN-BASIC" })).toBeVisible();

  await page.getByRole("link", { name: "STY-DEN-BASIC" }).click();
  await expect(page.getByRole("heading", { name: "STY-DEN-BASIC" })).toBeVisible();
  await expect(page.getByText("bom-1")).toBeVisible();

  await page.getByRole("link", { name: /Bulletins/ }).click();
  await expect(page.getByRole("heading", { name: "Operation Bulletins" })).toBeVisible();
  await page.locator("tbody tr").first().click();
  await page.getByRole("link", { name: "Open routing" }).click();
  await expect(page.getByRole("heading", { name: "STY-DEN-BASIC routing" })).toBeVisible();
  await expect(page.getByText("Front pocket attach")).toBeVisible();
});
