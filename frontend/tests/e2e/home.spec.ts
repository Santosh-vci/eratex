import { expect, type Page, test } from "@playwright/test";

const corsHeaders = {
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Headers": "Content-Type, X-CSRFToken",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Origin": "http://127.0.0.1:3000",
};

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

async function setupAuthMocks(page: Page, currentUser: typeof plannerUser) {
  let isAuthenticated = false;

  await page.route("**/api/v1/me", async (route) => {
    if (isAuthenticated) {
      await route.fulfill({
        contentType: "application/json",
        headers: corsHeaders,
        body: JSON.stringify({ data: currentUser, meta: {}, errors: [] }),
      });
      return;
    }

    await route.fulfill({
      contentType: "application/json",
      headers: corsHeaders,
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
      headers: corsHeaders,
      body: JSON.stringify({ data: { csrfToken: "test-csrf" }, meta: {}, errors: [] }),
    });
  });
  await page.route("**/api/v1/auth/login", async (route) => {
    if (route.request().method() === "OPTIONS") {
      await route.fulfill({ status: 204, headers: corsHeaders, body: "" });
      return;
    }

    isAuthenticated = true;
    await route.fulfill({
      contentType: "application/json",
      headers: corsHeaders,
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
      headers: corsHeaders,
      body: JSON.stringify({ data: styleList, meta: {}, errors: [] }),
    });
  });
  await page.route("**/api/v1/styles/style-1", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      headers: corsHeaders,
      body: JSON.stringify({ data: styleDetail, meta: {}, errors: [] }),
    });
  });
  await page.route("**/api/v1/master/product-types", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      headers: corsHeaders,
      body: JSON.stringify({ data: [{ id: "ptype-1", code: "DENIM", name: "Denim", isActive: true }], meta: {}, errors: [] }),
    });
  });
  await page.route("**/api/v1/operation-bulletins", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      headers: corsHeaders,
      body: JSON.stringify({ data: [{ ...bulletin, operations: undefined }], meta: {}, errors: [] }),
    });
  });
  await page.route("**/api/v1/operation-bulletins/bulletin-1", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      headers: corsHeaders,
      body: JSON.stringify({ data: bulletin, meta: {}, errors: [] }),
    });
  });
}

test("home route renders the foundation shell", async ({ page }) => {
  await setupAuthMocks(page, plannerUser);
  await login(page);

  await expect(page.getByRole("heading", { name: "Master Data Foundation" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Eratex Operating Spine" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Orders/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Planning/ })).toBeVisible();
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
