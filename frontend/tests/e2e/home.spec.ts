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
    "planning.create",
    "planning.assign",
    "planning.impact_preview",
    "planning.freeze",
    "planning.request_change",
    "workcenters.view_load",
    "workcenters.view_queue",
    "release.view",
    "release.validate",
    "release.create",
    "release.request_override",
    "release.complete",
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
    "planning.approve_change",
    "workcenters.adjust_capacity",
    "release.approve_override",
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

async function setupEos04Mocks(page: Page) {
  const horizon = {
    id: "horizon-1",
    code: "WEEK-20260525",
    name: "Weekly plan",
    startDate: "2026-05-25",
    endDate: "2026-05-31",
    status: "ACTIVE",
    isCurrent: true,
  };
  const plan = {
    id: "plan-1",
    horizonId: "horizon-1",
    versionNo: 2,
    status: "DRAFT",
    riskStatus: "WATCH",
    frozenAt: null,
    notes: "",
  };
  const backlogOrder = {
    id: "order-ready-1",
    orderNo: "ORD-HP-001",
    poNumber: "PO-HP-001",
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
    orderQty: 1000,
    plannedPcdDate: "2026-05-30",
    plannedShipDate: "2026-06-20",
    committedShipDate: "2026-06-20",
    currentStage: "PCD_READY",
    lifecycleStatus: "PCD_READY",
    riskStatus: "ON_TRACK",
    pcdStatus: "READY",
    materialReadinessStatus: "READY",
    fabricQcStatus: "PASSED",
    shipmentReadinessStatus: "NOT_STARTED",
    owner: { id: 1, displayName: "Production Planner" },
    nextAction: "Plan order",
    openExceptionCount: 0,
    releaseAllowed: true,
    releaseBlockers: [],
    lastUpdatedAt: "2026-05-27T00:00:00Z",
  };
  const workItem = {
    id: "work-item-1",
    planVersionId: "plan-1",
    orderId: "order-ready-2",
    orderNo: "ORD-REL-001",
    styleCode: "STY-DEN-BASIC",
    customerName: "Northstar Retail",
    workcenterId: "wc-cutting",
    workcenterCode: "CUTTING",
    workcenterName: "Cutting",
    lineId: null,
    lineCode: null,
    plannedStartDate: "2026-05-25",
    plannedEndDate: "2026-05-25",
    plannedQuantity: 500,
    loadMinutes: 2500,
    sequenceNo: 10,
    status: "RELEASE_READY",
    riskStatus: "ON_TRACK",
    locked: false,
  };
  const loads = [
    {
      id: "load-1",
      workcenterId: "wc-cutting",
      workcenterCode: "CUTTING",
      workcenterName: "Cutting",
      workcenterType: "CUTTING",
      factoryCode: "UNIT-04",
      snapshotDate: "2026-05-25",
      availableMinutes: 90000,
      plannedLoadMinutes: 2500,
      actualLoadMinutes: 0,
      utilizationPercent: 2.78,
      queueQuantity: 500,
      oldestQueueAgeHours: 4,
      constraintStatus: "NORMAL",
      riskStatus: "ON_TRACK",
      topAffectedOrderId: "order-ready-2",
      topAffectedOrderNo: "ORD-REL-001",
      suggestedAction: "Keep plan.",
    },
    {
      id: "load-2",
      workcenterId: "wc-wash",
      workcenterCode: "WASH-WC",
      workcenterName: "Wet Wash",
      workcenterType: "WASH",
      factoryCode: "UNIT-04",
      snapshotDate: "2026-05-25",
      availableMinutes: 25000,
      plannedLoadMinutes: 42000,
      actualLoadMinutes: 0,
      utilizationPercent: 168,
      queueQuantity: 7000,
      oldestQueueAgeHours: 28,
      constraintStatus: "CRITICAL",
      riskStatus: "CRITICAL",
      topAffectedOrderId: "order-fab-1",
      topAffectedOrderNo: "ORD-FABQC-001",
      suggestedAction: "Approve capacity action before daily release.",
    },
  ];
  const validation = {
    id: "validation-1",
    releaseId: "release-1",
    plannedWorkItemId: "work-item-1",
    orderId: "order-ready-2",
    orderNo: "ORD-REL-001",
    isValid: true,
    riskStatus: "ON_TRACK",
    checkedAt: "2026-05-27T00:00:00Z",
    checks: [
      { code: "PCD_READY", passed: true, owner: "Planning" },
      { code: "MATERIAL_READY", passed: true, owner: "Procurement" },
    ],
    blockers: [],
  };
  const releases = [
    {
      id: "release-1",
      releaseNo: "REL-ORD-REL-001-20260525",
      plannedWorkItemId: "work-item-1",
      orderId: "order-ready-2",
      orderNo: "ORD-REL-001",
      workcenterId: "wc-cutting",
      workcenterCode: "CUTTING",
      workcenterName: "Cutting",
      releaseDate: "2026-05-25",
      releaseType: "CUTTING",
      status: "READY",
      riskStatus: "ON_TRACK",
      releasedAt: null,
      completedAt: null,
      overrideReason: "",
      validation,
    },
  ];

  await page.route("**/api/v1/planning/weekly", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      headers: corsHeaders(route),
      body: JSON.stringify({
        data: {
          horizon,
          plan,
          backlog: [backlogOrder],
          workItems: [workItem],
          workcenterLoads: loads,
          changeRequests: [],
        },
        meta: {},
        errors: [],
      }),
    });
  });
  await page.route("**/api/v1/planning/weekly/plan-1/impact-preview", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      headers: corsHeaders(route),
      body: JSON.stringify({
        data: {
          planVersionId: "plan-1",
          orderId: "order-ready-1",
          workcenterId: "wc-cutting",
          addedMinutes: 2500,
          before: {
            availableMinutes: 90000,
            plannedLoadMinutes: 2500,
            utilizationPercent: 2.78,
            constraintStatus: "NORMAL",
            riskStatus: "ON_TRACK",
          },
          after: {
            availableMinutes: 90000,
            plannedLoadMinutes: 5000,
            utilizationPercent: 5.56,
            constraintStatus: "NORMAL",
            riskStatus: "ON_TRACK",
          },
          writeApplied: false,
        },
        meta: {},
        errors: [],
      }),
    });
  });
  await page.route("**/api/v1/planning/weekly/plan-1/assign-item", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      headers: corsHeaders(route),
      body: JSON.stringify({ data: { ...workItem, id: "work-item-2", orderNo: "ORD-HP-001" }, meta: {}, errors: [] }),
      status: 201,
    });
  });
  await page.route("**/api/v1/planning/weekly/plan-1/freeze", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      headers: corsHeaders(route),
      body: JSON.stringify({ data: { ...plan, status: "FROZEN" }, meta: {}, errors: [] }),
    });
  });
  await page.route("**/api/v1/workcenters/load", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      headers: corsHeaders(route),
      body: JSON.stringify({ data: loads, meta: {}, errors: [] }),
    });
  });
  await page.route("**/api/v1/workcenters/current-constraint", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      headers: corsHeaders(route),
      body: JSON.stringify({ data: loads[1], meta: {}, errors: [] }),
    });
  });
  await page.route("**/api/v1/workcenters/wc-wash/queue", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      headers: corsHeaders(route),
      body: JSON.stringify({
        data: [
          {
            id: "queue-1",
            workcenterId: "wc-wash",
            workcenterCode: "WASH-WC",
            snapshotDate: "2026-05-25",
            orderId: "order-fab-1",
            orderNo: "ORD-FABQC-001",
            queueStage: "WASH_QUEUE",
            queueQuantity: 7000,
            ageHours: 28,
            riskStatus: "CRITICAL",
            ownerLabel: "Wash",
            nextAction: "Resolve blocker",
          },
        ],
        meta: {},
        errors: [],
      }),
    });
  });
  await page.route("**/api/v1/releases/daily", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      headers: corsHeaders(route),
      body: JSON.stringify({ data: releases, meta: {}, errors: [] }),
    });
  });
  await page.route("**/api/v1/releases/validate", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      headers: corsHeaders(route),
      body: JSON.stringify({ data: validation, meta: {}, errors: [] }),
    });
  });
  await page.route("**/api/v1/releases", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      headers: corsHeaders(route),
      body: JSON.stringify({ data: { ...releases[0], status: "RELEASED" }, meta: {}, errors: [] }),
      status: 201,
    });
  });
  await page.route("**/api/v1/releases/release-1/request-override", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      headers: corsHeaders(route),
      body: JSON.stringify({ data: { ...releases[0], status: "OVERRIDE_REQUESTED" }, meta: {}, errors: [] }),
    });
  });
  await page.route("**/api/v1/releases/release-1/approve-override", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      headers: corsHeaders(route),
      body: JSON.stringify({ data: { ...releases[0], status: "OVERRIDE_APPROVED" }, meta: {}, errors: [] }),
    });
  });
  await page.route("**/api/v1/releases/release-1/complete", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      headers: corsHeaders(route),
      body: JSON.stringify({ data: { ...releases[0], status: "COMPLETED" }, meta: {}, errors: [] }),
    });
  });
}

test("home route renders the foundation shell", async ({ page }) => {
  await setupAuthMocks(page, plannerUser);
  await login(page);

  await expect(page.getByText("ERATEX OPS CONTROL")).toBeVisible();
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
  await expect(page.getByRole("heading", { name: "PCD Readiness" })).toBeVisible();
  await page.getByRole("row", { name: /ORD-PCD-001/ }).click();
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
  await expect(page.getByText("Approved BOM")).toBeVisible();

  await page.getByRole("link", { name: /Bulletins/ }).click();
  await expect(page.getByRole("heading", { name: "Operation Bulletins" })).toBeVisible();
  await page.locator("tbody tr").first().click();
  await page.getByRole("link", { name: "Open routing" }).click();
  await expect(page.getByRole("heading", { name: "STY-DEN-BASIC routing" })).toBeVisible();
  await expect(page.getByText("Front pocket attach")).toBeVisible();
});

test("planner can use EOS-04 planning load and release surfaces", async ({ page }) => {
  await setupAuthMocks(page, plannerUser);
  await setupEos04Mocks(page);
  await login(page);

  await page.getByRole("link", { name: /Planning/ }).click();
  await expect(page.getByRole("heading", { name: "Weekly Planning" })).toBeVisible();
  await page.getByRole("button", { name: /ORD-HP-001/ }).click();
  await expect(page.getByText("Write applied")).toBeVisible();
  await page.getByRole("button", { name: "Assign Selected" }).click();
  await expect(page.getByRole("status")).toContainText("Backlog order assigned");

  await page.getByRole("link", { name: /Workcenters/ }).click();
  await expect(page.getByRole("heading", { name: "Workcenter Load" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "WASH-WC" })).toBeVisible();
  await page.getByRole("link", { name: "Open Queue" }).click();
  await expect(page.getByRole("heading", { name: "Workcenter Queue" })).toBeVisible();
  await expect(page.getByText("ORD-FABQC-001")).toBeVisible();

  await page.getByRole("link", { name: /Daily Release/ }).click();
  await expect(page.getByRole("heading", { level: 2, name: "Daily Release" })).toBeVisible();
  await page.getByRole("row", { name: /REL-ORD-REL-001/ }).click();
  await page.getByRole("button", { name: "Validate" }).click();
  await expect(page.getByText("PCD READY")).toBeVisible();
});
