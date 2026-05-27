import { expect, type Page, type Route, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";

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
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await page.getByLabel("Username").fill(username);
  await page.getByRole("button", { name: "Sign in" }).click();
}

async function captureParity(page: Page, name: string) {
  await mkdir("test-results/ui-parity", { recursive: true });
  await page.screenshot({ path: `test-results/ui-parity/${name}.png`, fullPage: true });
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
  const bom = {
    id: "bom-1",
    styleId: "style-1",
    styleCode: "STY-DEN-BASIC",
    version: "V1",
    status: "APPROVED",
    effectiveDate: "2026-05-20",
    approvedAt: "2026-05-21T00:00:00Z",
    lineCount: 2,
    lines: [
      {
        id: "bom-line-1",
        material: {
          id: "mat-1",
          code: "FAB-DEN-12OZ",
          name: "12oz Indigo Denim",
          materialType: "FABRIC",
          uom: "M",
          standardLeadTimeDays: 14,
          defaultVendorId: "vendor-1",
          nominatedVendorRequired: true,
          inspectionRequired: true,
          isActive: true,
        },
        consumptionPerPiece: 1.65,
        wastagePercent: 3,
        uom: "M",
        requiredStage: "PCD",
        nominatedVendorRequired: true,
      },
      {
        id: "bom-line-2",
        material: {
          id: "mat-2",
          code: "TRM-ZIP-05",
          name: "Metal zipper #5",
          materialType: "TRIMS",
          uom: "PCS",
          standardLeadTimeDays: 10,
          defaultVendorId: "vendor-2",
          nominatedVendorRequired: true,
          inspectionRequired: false,
          isActive: true,
        },
        consumptionPerPiece: 1,
        wastagePercent: 1,
        uom: "PCS",
        requiredStage: "PCD",
        nominatedVendorRequired: true,
      },
    ],
  };
  const materialReadiness = [
    {
      orderId: "order-pcd-1",
      orderNo: "ORD-PCD-001",
      readinessStatus: "BLOCKED",
      riskStatus: "ACTION",
      blockedCount: 1,
      items: [
        {
          id: "req-1",
          orderId: "order-pcd-1",
          orderNo: "ORD-PCD-001",
          materialId: "mat-2",
          materialCode: "TRM-ZIP-05",
          materialName: "Metal zipper #5",
          requiredQty: 1200,
          shortageQty: 400,
          requiredDate: "2026-06-01",
          requiredStage: "PCD",
          status: "SHORT",
          latestEta: "2026-06-05",
          etaAfterPcd: true,
          vendorCode: "YKK",
        },
      ],
    },
  ];

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
  await page.route("**/api/v1/master/customers", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      headers: corsHeaders(route),
      body: JSON.stringify({ data: [{ id: "cust-1", code: "NSR", name: "Northstar Retail", priorityLevel: "HIGH", defaultAqlLevel: "2.5", isActive: true }], meta: {}, errors: [] }),
    });
  });
  await page.route("**/api/v1/master/materials", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      headers: corsHeaders(route),
      body: JSON.stringify({ data: bom.lines.map((line) => line.material), meta: {}, errors: [] }),
    });
  });
  await page.route("**/api/v1/master/vendors", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      headers: corsHeaders(route),
      body: JSON.stringify({
        data: [
          { id: "vendor-1", code: "CONE", name: "Cone Denim", vendorType: "FABRIC", nominated: true, standardLeadTimeDays: 14, isActive: true },
          { id: "vendor-2", code: "YKK", name: "YKK Zippers", vendorType: "TRIMS", nominated: true, standardLeadTimeDays: 10, isActive: true },
        ],
        meta: {},
        errors: [],
      }),
    });
  });
  await page.route("**/api/v1/master/thresholds", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      headers: corsHeaders(route),
      body: JSON.stringify({ data: [{ id: "threshold-1", code: "PCD_BLOCKER_DAYS", name: "PCD blocker days", thresholdType: "PCD", value: 3, unit: "DAYS", isActive: true }], meta: {}, errors: [] }),
    });
  });
  await page.route("**/api/v1/master/machines", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      headers: corsHeaders(route),
      body: JSON.stringify({
        data: [
          { id: "machine-1", code: "SNLS-01", name: "Single Needle 01", machineTypeId: "machine-type-1", machineTypeCode: "SNLS", factoryId: "factory-1", status: "ASSIGNED", currentLineId: "line-1", isActive: true },
          { id: "machine-2", code: "DNLS-01", name: "Double Needle 01", machineTypeId: "machine-type-2", machineTypeCode: "DNLS", factoryId: "factory-1", status: "ASSIGNED", currentLineId: "line-1", isActive: true },
        ],
        meta: {},
        errors: [],
      }),
    });
  });
  await page.route("**/api/v1/boms", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      headers: corsHeaders(route),
      body: JSON.stringify({ data: [{ ...bom, lines: undefined }], meta: {}, errors: [] }),
    });
  });
  await page.route("**/api/v1/boms/bom-1", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      headers: corsHeaders(route),
      body: JSON.stringify({ data: bom, meta: {}, errors: [] }),
    });
  });
  await page.route("**/api/v1/material-readiness", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      headers: corsHeaders(route),
      body: JSON.stringify({ data: materialReadiness, meta: {}, errors: [] }),
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
  await page.route("**/api/v1/wash-routes", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      headers: corsHeaders(route),
      body: JSON.stringify({ data: [{ id: "wash-1", code: "WASH-RINSE", name: "Rinse wash", productType: "DENIM", complexity: "LOW", status: "APPROVED", approvedAt: "2026-05-21T00:00:00Z", stepCount: 3, isActive: true }], meta: {}, errors: [] }),
    });
  });
  await page.route("**/api/v1/workcenters/line-capability", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      headers: corsHeaders(route),
      body: JSON.stringify({
        data: [
          { lineId: "line-1", lineCode: "Line 01", lineName: "Sewing Line 01", workingMinutes: 480, currentManpower: 42, baselineEfficiency: 74, availableMinutes: 14918, allowedProductTypes: ["DENIM"], machineCount: 28, machineTypes: ["SNLS", "DNLS"] },
          { lineId: "line-2", lineCode: "Line 04", lineName: "Sewing Line 04", workingMinutes: 480, currentManpower: 38, baselineEfficiency: 68, availableMinutes: 12403, allowedProductTypes: ["DENIM"], machineCount: 24, machineTypes: ["SNLS", "OL"] },
        ],
        meta: {},
        errors: [],
      }),
    });
  });
  await page.route("**/api/v1/workcenters/capacity-days", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      headers: corsHeaders(route),
      body: JSON.stringify({ data: [{ id: "cap-1", workcenterId: "wc-1", workcenterCode: "SEW-WC", capacityDate: "2026-05-27", availableMinutes: 14918, capacityUnit: "MINUTES", capacityValue: 14918, source: "SHIFT" }], meta: {}, errors: [] }),
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
      body: JSON.stringify({
        data: [
          {
            orderId: "order-pcd-1",
            orderNo: "ORD-PCD-001",
            readinessStatus: "BLOCKED",
            riskStatus: "ACTION",
            blockedCount: 1,
            items: [
              {
                id: "req-1",
                orderId: "order-pcd-1",
                orderNo: "ORD-PCD-001",
                materialId: "mat-zip",
                materialCode: "TRM-ZIP-05",
                materialName: "Metal zipper #5",
                requiredQty: 1200,
                shortageQty: 400,
                requiredDate: "2026-06-01",
                requiredStage: "PCD",
                status: "SHORT",
                latestEta: "2026-06-05",
                etaAfterPcd: true,
                vendorCode: "YKK",
              },
            ],
          },
        ],
        meta: {},
        errors: [],
      }),
    });
  });
  await page.route("**/api/v1/procurement/purchase-orders", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      headers: corsHeaders(route),
      body: JSON.stringify({
        data: [
          {
            id: "po-1",
            poNo: "PO-YKK-001",
            orderId: "order-pcd-1",
            orderNo: "ORD-PCD-001",
            vendorCode: "YKK",
            vendorName: "YKK Zippers",
            materialCode: "TRM-ZIP-05",
            materialName: "Metal zipper #5 Antique Brass",
            orderedQty: 1200,
            acknowledgedQty: 800,
            expectedArrivalDate: "2026-06-01",
            revisedEta: "2026-06-05",
            actualArrivalDate: null,
            status: "DELAYED",
          },
        ],
        meta: {},
        errors: [],
      }),
    });
  });
  await page.route("**/api/v1/fabric-qc", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      headers: corsHeaders(route),
      body: JSON.stringify({
        data: {
          lots: [
            {
              id: "lot-1",
              orderId: "order-pcd-1",
              orderNo: "ORD-PCD-001",
              lotNo: "LOT-A2",
              shadeLot: "A2",
              receivedQty: 8520,
              receivedDate: "2026-05-27",
              status: "RECEIVED",
              rolls: [
                { id: "roll-1", rollNo: "R-2024-012", rollLength: 100, width: 58, gsm: 340, shade: "INDIGO", qcStatus: "PASSED" },
                { id: "roll-2", rollNo: "R-2024-013", rollLength: 98, width: 57.5, gsm: 336, shade: "INDIGO", qcStatus: "HOLD" },
              ],
            },
          ],
          inspections: [
            {
              id: "insp-1",
              fabricRollId: "roll-1",
              rollNo: "R-2024-012",
              lotNo: "LOT-A2",
              orderNo: "ORD-PCD-001",
              inspectionDate: "2026-05-27",
              fourPointScore: 18,
              widthResult: 58,
              gsmResult: 340,
              shrinkagePercent: 2.5,
              status: "PASSED",
              remarks: "Within tolerance",
              waiverReason: "",
            },
          ],
        },
        meta: {},
        errors: [],
      }),
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
    orderNo: "ORD-PLAN-001",
    poNumber: "PO-PLAN-001",
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
    plannedShift: "DAY",
    planningZone: "FROZEN_ZONE",
    productionStage: "CUTTING",
    colorCode: "INDIGO",
    shadeLot: "SHADE-A",
    approvalRequired: true,
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
      capacityDefinition: {
        id: "cap-def-cutting",
        workcenterType: "CUTTING",
        capacityUnit: "PIECES_PER_DAY",
        planningBucket: "DAY",
        primaryConstraintResource: "MANPOWER",
        secondaryConstraintResource: "",
        normalCapacityValue: 90000,
        normalCapacityUnit: "minutes",
        overtimeAllowed: true,
        approvedOvertimeCapacityValue: 13500,
        capacityLossTriggers: ["absenteeism"],
        recoveryLevers: ["overtime"],
      },
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
      capacityDefinition: {
        id: "cap-def-wash",
        workcenterType: "WASH",
        capacityUnit: "BATCH_MINUTES",
        planningBucket: "DAY",
        primaryConstraintResource: "WASHER_TIME",
        secondaryConstraintResource: "",
        normalCapacityValue: 25000,
        normalCapacityUnit: "minutes",
        overtimeAllowed: true,
        approvedOvertimeCapacityValue: 3750,
        capacityLossTriggers: ["machine_breakdown"],
        recoveryLevers: ["overtime", "load_move"],
      },
    },
  ];
  const boundaryCases = [
    {
      id: "boundary-1",
      eventNo: "SCN-017",
      eventType: "CAPACITY_LOSS",
      status: "IMPACT_PREVIEWED",
      severity: "HIGH",
      linkedOrderId: null,
      linkedOrderNo: null,
      linkedWorkcenterId: "wc-wash",
      linkedWorkcenterCode: "WASH-WC",
      eventStage: "WASH",
      triggerSource: "SYSTEM",
      affectedQuantity: 0,
      affectedCapacityMinutes: -3600,
      affectedShipmentDate: "2026-05-25",
      riskBefore: "WATCH",
      riskAfter: "ACTION",
      recommendedAction: "Move load or approve recovery capacity",
      approvalRequired: true,
      ownerId: 1,
      ownerName: "Production Planner",
      metadata: {},
      createdAt: "2026-05-27T00:00:00Z",
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
          planningZone: "FROZEN_ZONE",
          approvalRequired: true,
          autoRescheduleAllowed: false,
          schedulingGrain: {
            orderId: "order-ready-1",
            styleId: "style-1",
            colorCode: "INDIGO",
            shadeLot: "SHADE-A",
            productionStage: "CUTTING",
            workcenterId: "wc-cutting",
            lineId: null,
            plannedDate: "2026-05-25",
            plannedShift: "DAY",
            quantity: 500,
          },
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
          warnings: ["Approval required before applying changes in this planning zone."],
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
      body: JSON.stringify({ data: { ...workItem, id: "work-item-2", orderNo: "ORD-PLAN-001" }, meta: {}, errors: [] }),
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
  await page.route("**/api/v1/boundary-cases", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      headers: corsHeaders(route),
      body: JSON.stringify({ data: boundaryCases, meta: {}, errors: [] }),
    });
  });
  await page.route("**/api/v1/boundary-cases/impact-preview", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      headers: corsHeaders(route),
      body: JSON.stringify({
        data: {
          canApply: false,
          approvalRequired: true,
          riskBefore: "WATCH",
          riskAfter: "ACTION",
          affectedOrders: [],
          affectedWorkcenters: [{ workcenterCode: "WASH-WC" }],
          affectedWip: [],
          affectedShipments: [],
          capacityImpact: { minutesDelta: -3600 },
          recommendedActions: ["Move load or approve recovery capacity"],
          warnings: [],
          blockingReasons: ["Capacity drops below active planned load."],
        },
        meta: {},
        errors: [],
      }),
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

  await page.goto("/orders");
  await expect(page.getByRole("heading", { name: "Order Lifecycle Explorer" })).toBeVisible();
  await expect(page.getByRole("link", { name: "ORD-PCD-001" })).toBeVisible();
  await captureParity(page, "orders");

  await page.getByRole("link", { name: "ORD-PCD-001" }).click();
  await expect(page.getByRole("heading", { name: "ORD-PCD-001" })).toBeVisible();
  await expect(page.getByText("Awaiting zipper ETA")).toBeVisible();
  await captureParity(page, "order-detail");

  await page.goto("/orders/order-pcd-1/trace");
  await expect(page.getByRole("heading", { name: "Lifecycle Trace" })).toBeVisible();
  await captureParity(page, "order-trace");

  await page.goto("/pcd-readiness");
  await expect(page.getByRole("heading", { name: "PCD Readiness Gate" })).toBeVisible();
  await page.getByRole("button", { name: /ORD-PCD-001/ }).click();
  await expect(page.getByText("Awaiting zipper ETA")).toBeVisible();
  await expect(page.getByRole("button", { name: /Release to Cutting/i })).toBeDisabled();
  await captureParity(page, "pcd-readiness");

  await page.goto("/procurement/vendor-follow-up");
  await expect(page.getByRole("heading", { name: "Procurement & Vendor Follow-Up" })).toBeVisible();
  await page.getByText("PO-YKK-001").click();
  await expect(page.getByText("PO Status Timeline")).toBeVisible();
  await captureParity(page, "procurement-vendor-follow-up");

  await page.goto("/fabric/qc");
  await expect(page.getByRole("heading", { name: "Fabric Inward & QC Monitor" })).toBeVisible();
  await page.getByRole("cell", { name: "R-2024-012" }).click();
  await expect(page.getByText("4-Point Result Map")).toBeVisible();
  await captureParity(page, "fabric-qc");
});

test("planning head can approve conditional release and release order gate", async ({ page }) => {
  await setupAuthMocks(page, planningHeadUser);
  await setupPreProductionMocks(page);
  await login(page, "planning_head");

  await page.goto("/pcd-readiness");
  await expect(page.getByRole("heading", { name: "PCD Readiness Gate" })).toBeVisible();
  await page.getByRole("button", { name: /ORD-PCD-001/ }).click();
  await page.getByRole("button", { name: /Approve Conditional Release/i }).click();
  await page.getByRole("button", { name: "Confirm" }).click();
  await expect(page.getByRole("status")).toContainText("Conditional release approved.");
  await expect(page.getByRole("button", { name: /Release to Cutting/i })).toBeEnabled();

  await page.getByRole("button", { name: /Release to Cutting/i }).click();
  await page.getByRole("button", { name: "Release", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Order released to cutting.");
});

test("ie user can open technical style and routing workbenches", async ({ page }) => {
  await setupAuthMocks(page, ieUser);
  await setupTechnicalMocks(page);
  await login(page, "ie_user");

  await page.goto("/master-data/governance");
  await expect(page.getByRole("heading", { name: "Master Data Governance" })).toBeVisible();
  await expect(page.getByText("Parameter Detail")).toBeVisible();
  await captureParity(page, "master-data-governance");

  await page.goto("/technical/styles");
  await expect(page.getByRole("heading", { name: "Style Technical File" })).toBeVisible();
  await expect(page.getByRole("link", { name: "STY-DEN-BASIC" })).toBeVisible();
  await captureParity(page, "technical-styles");

  await page.getByRole("link", { name: "STY-DEN-BASIC" }).click();
  await expect(page.getByRole("heading", { name: "STY-DEN-BASIC" })).toBeVisible();
  await expect(page.getByText("Operation Bulletin Grid")).toBeVisible();
  await captureParity(page, "technical-style-detail");

  await page.goto("/technical/bom");
  await expect(page.getByRole("heading", { name: "BOM & Material Planning" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Material Readiness Explorer" })).toBeVisible();
  await captureParity(page, "technical-bom");

  await page.goto("/technical/operation-bulletins");
  await expect(page.getByRole("heading", { name: "Operation Bulletins (OB)" })).toBeVisible();
  await page.locator("tbody tr").first().click();
  await page.getByRole("link", { name: "Open routing" }).click();
  await expect(page.getByRole("heading", { name: "Routing: STY-DEN-BASIC" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Front pocket attach" })).toBeVisible();
  await captureParity(page, "routing-builder");

  await page.goto("/technical/operation-bulletins");
  await captureParity(page, "technical-operation-bulletins");

  await page.goto("/technical/operator-skill-capacity");
  await expect(page.getByRole("heading", { name: "Operator Skill & Capacity Monitor" })).toBeVisible();
  await expect(page.getByText("Skill Matrix (Ops Proficiency)")).toBeVisible();
  await captureParity(page, "operator-skill-capacity");
});

test("planner can use EOS-04 planning load and release surfaces", async ({ page }) => {
  await setupAuthMocks(page, plannerUser);
  await setupEos04Mocks(page);
  await login(page);

  await page.goto("/planning/weekly");
  await expect(page.getByRole("heading", { name: /May Week/ })).toBeVisible();
  await page
    .getByRole("button", { name: /ORD-PLAN-001/ })
    .dragTo(page.getByLabel("Plan MON 25 swim lane"));
  await expect(page.getByText("Write applied")).toBeVisible();
  await captureParity(page, "planning-weekly");
  await page.getByRole("button", { name: "Assign Selected" }).click();
  await expect(page.getByRole("status")).toContainText("Backlog order assigned");

  await page.goto("/workcenters/load");
  await expect(page.getByRole("heading", { name: "Workcenter Load & Constraint Monitor" })).toBeVisible();
  await expect(page.getByRole("button", { name: /WASH-WC/ })).toBeVisible();
  await captureParity(page, "workcenters-load");
  await page.getByRole("link", { name: "Open Queue" }).click();
  await expect(page.getByRole("heading", { name: "Workcenter Queue" })).toBeVisible();
  await expect(page.getByText("ORD-FABQC-001")).toBeVisible();
  await captureParity(page, "workcenter-queue");

  await page.goto("/releases/daily");
  await expect(page.getByRole("heading", { name: "Daily Production Release" })).toBeVisible();
  await page.getByRole("row", { name: /REL-ORD-REL-001/ }).click();
  await page.getByRole("button", { name: "Validate" }).click();
  await expect(page.getByText("PCD READY")).toBeVisible();
  await captureParity(page, "releases-daily");
});
