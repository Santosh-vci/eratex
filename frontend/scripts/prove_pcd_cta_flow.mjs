import { chromium } from "playwright";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, "..", "..");
const evidenceDir = path.join(workspaceRoot, "docs", "audit_evidence", "pcd_cta_proof");

const baseUrl = process.env.CTA_BASE_URL ?? "http://localhost:3000";
const apiBaseUrl = process.env.CTA_API_BASE_URL ?? "http://localhost:8000/api/v1";
const password = process.env.CTA_PASSWORD ?? "planning123";

const chromeCandidates = [
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
].filter(Boolean);

function launchOptions() {
  const executablePath = chromeCandidates.find((candidate) => existsSync(candidate));
  return executablePath ? { headless: true, executablePath } : { headless: true };
}

function apiPath(url) {
  const parsed = new URL(url);
  return parsed.pathname.replace("/api/v1", "") || "/";
}

async function login(page) {
  await page.goto("/login");
  await page.getByLabel("Username").fill("planning_head");
  await page.getByLabel("Password").fill(password);
  await Promise.all([
    page.waitForURL((url) => url.pathname !== "/login", { timeout: 15000 }),
    page.getByRole("button", { name: "Sign in", exact: true }).click(),
  ]);
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
}

async function apiGet(page, pathName) {
  const response = await page.request.get(`${apiBaseUrl}${pathName}`);
  if (!response.ok()) {
    throw new Error(`GET ${pathName} failed with ${response.status()}`);
  }
  return (await response.json()).data;
}

async function readinessByOrder(page, orderNo) {
  const rows = await apiGet(page, "/pcd-readiness");
  const row = rows.find((candidate) => candidate.orderNo === orderNo);
  if (!row) throw new Error(`${orderNo} was not found in PCD readiness.`);
  return row;
}

function hasOpenMandatoryItems(row) {
  return row.items.some((item) =>
    item.isMandatory &&
    ["PENDING", "FAILED", "WAIVED"].includes(item.status),
  );
}

function hasActiveConditional(row) {
  return row.conditionalReleases.some((conditional) =>
    ["REQUESTED", "APPROVED"].includes(conditional.status),
  );
}

async function clickOrderCard(page, orderNo) {
  const card = page.locator("button").filter({ hasText: orderNo }).first();
  await card.waitFor({ state: "visible", timeout: 15000 });
  await card.click();
}

async function clickButton(page, name) {
  const button = page.getByRole("button", { name, exact: true }).first();
  await button.waitFor({ state: "visible", timeout: 15000 });
  await button.click();
}

async function confirmAndCapture(page, expectedMethod, expectedPathPart, label) {
  const [response] = await Promise.all([
    page.waitForResponse(
      (candidate) =>
        candidate.url().includes("/api/v1/") &&
        candidate.url().includes(expectedPathPart) &&
        candidate.request().method() === expectedMethod,
      { timeout: 15000 },
    ),
    page.getByRole("dialog").getByRole("button", { name: label, exact: true }).click(),
  ]);
  if (!response.ok()) {
    throw new Error(`${expectedMethod} ${expectedPathPart} failed with ${response.status()}`);
  }
  return {
    method: response.request().method(),
    path: apiPath(response.url()),
    status: response.status(),
  };
}

async function run() {
  await mkdir(evidenceDir, { recursive: true });
  const browser = await chromium.launch(launchOptions());
  const context = await browser.newContext({ baseURL: baseUrl, viewport: { width: 1440, height: 960 } });
  const page = await context.newPage();
  const captured = [];
  page.on("response", (response) => {
    if (!response.url().includes("/api/v1/")) return;
    captured.push({
      method: response.request().method(),
      path: apiPath(response.url()),
      status: response.status(),
    });
  });

  await login(page);
  await page.goto("/pcd-readiness");
  await page.getByRole("heading", { name: "PCD Readiness Gate" }).waitFor({ timeout: 15000 });

  const readyOrder = await readinessByOrder(page, "OPS-ORD-001");
  await clickOrderCard(page, readyOrder.orderNo);
  const readyRequestDisabled = !(await page.getByRole("button", { name: "Request Conditional Release", exact: true }).isEnabled());
  const readyApproveDisabled = !(await page.getByRole("button", { name: "Approve Conditional Release", exact: true }).isEnabled());
  const readyReleaseEnabled = await page.getByRole("button", { name: "Release to Cutting", exact: true }).isEnabled();
  await page.screenshot({ path: path.join(evidenceDir, "01_ready_order_state.png"), fullPage: true });

  const rows = await apiGet(page, "/pcd-readiness");
  const flowOrder = rows.find((row) =>
    row.readinessStatus !== "RELEASED" &&
    hasOpenMandatoryItems(row) &&
    !hasActiveConditional(row),
  );
  if (!flowOrder) throw new Error("No PCD order is available for request, approval, and release proof.");

  await clickOrderCard(page, flowOrder.orderNo);
  await page.screenshot({ path: path.join(evidenceDir, "02_conditional_order_before_request.png"), fullPage: true });

  await clickButton(page, "Request Conditional Release");
  const requestEndpoint = await confirmAndCapture(page, "POST", `/pcd-readiness/${flowOrder.id}/request-conditional-release`, "Confirm");
  await page.getByRole("status").filter({ hasText: "Conditional release requested." }).waitFor({ timeout: 15000 });
  const afterRequest = await readinessByOrder(page, flowOrder.orderNo);
  if (!afterRequest.conditionalReleases.some((conditional) => conditional.status === "REQUESTED")) {
    throw new Error("Request proof failed: no requested conditional release was returned by API.");
  }
  await page.screenshot({ path: path.join(evidenceDir, "03_after_request.png"), fullPage: true });

  await clickButton(page, "Approve Conditional Release");
  const approveEndpoint = await confirmAndCapture(page, "POST", `/pcd-readiness/${flowOrder.id}/approve-conditional-release`, "Confirm");
  await page.getByRole("status").filter({ hasText: "Conditional release approved." }).waitFor({ timeout: 15000 });
  const afterApproval = await readinessByOrder(page, flowOrder.orderNo);
  if (afterApproval.readinessStatus !== "CONDITIONALLY_READY" || !afterApproval.releaseAllowed) {
    throw new Error("Approval proof failed: order is not conditionally ready for release.");
  }
  await page.screenshot({ path: path.join(evidenceDir, "04_after_approval.png"), fullPage: true });

  await clickButton(page, "Release to Cutting");
  const releaseEndpoint = await confirmAndCapture(page, "POST", `/orders/${flowOrder.orderId}/release-to-cutting`, "Release");
  await page.getByRole("status").filter({ hasText: "Cutting release created and job sent to cutting room." }).waitFor({ timeout: 15000 });
  const afterRelease = await readinessByOrder(page, flowOrder.orderNo);
  if (afterRelease.readinessStatus !== "RELEASED" || !afterRelease.releasedToCuttingAt) {
    throw new Error("Release proof failed: order was not released to cutting.");
  }
  await page.screenshot({ path: path.join(evidenceDir, "05_after_release.png"), fullPage: true });

  await page.goto("/cutting/room");
  await page.getByRole("heading", { name: "Cutting Room Management" }).waitFor({ timeout: 15000 });
  await page.getByRole("cell", { name: flowOrder.orderNo, exact: true }).waitFor({ timeout: 15000 });
  const cuttingJobs = await apiGet(page, "/cutting/jobs");
  const cuttingJob = cuttingJobs.find((job) => job.orderNo === flowOrder.orderNo);
  if (!cuttingJob) {
    throw new Error("Cutting proof failed: released order is not visible in cutting jobs API.");
  }
  await page.screenshot({ path: path.join(evidenceDir, "06_cutting_grid_contains_released_order.png"), fullPage: true });

  const proof = {
    readyOrder: {
      orderNo: readyOrder.orderNo,
      readinessStatus: readyOrder.readinessStatus,
      openMandatoryItemCount: readyOrder.items.filter((item) =>
        item.isMandatory &&
        ["PENDING", "FAILED", "WAIVED"].includes(item.status),
      ).length,
      requestDisabled: readyRequestDisabled,
      approveDisabled: readyApproveDisabled,
      releaseEnabled: readyReleaseEnabled,
    },
    flowOrder: {
      orderNo: flowOrder.orderNo,
      before: {
        readinessStatus: flowOrder.readinessStatus,
        releaseAllowed: flowOrder.releaseAllowed,
        openMandatoryItems: flowOrder.items
          .filter((item) => item.isMandatory && ["PENDING", "FAILED", "WAIVED"].includes(item.status))
          .map((item) => `${item.itemCode}:${item.status}`),
      },
      requestEndpoint,
      afterRequest: {
        readinessStatus: afterRequest.readinessStatus,
        requestedCount: afterRequest.conditionalReleases.filter((conditional) => conditional.status === "REQUESTED").length,
      },
      approveEndpoint,
      afterApproval: {
        readinessStatus: afterApproval.readinessStatus,
        releaseAllowed: afterApproval.releaseAllowed,
      },
      releaseEndpoint,
      afterRelease: {
        readinessStatus: afterRelease.readinessStatus,
        releasedToCuttingAt: afterRelease.releasedToCuttingAt,
        releaseAllowed: afterRelease.releaseAllowed,
      },
      cuttingGrid: {
        jobNo: cuttingJob.jobNo,
        releaseNo: cuttingJob.releaseNo,
        status: cuttingJob.status,
        plannedQuantity: cuttingJob.plannedQuantity,
      },
    },
    captured,
    screenshots: [
      "01_ready_order_state.png",
      "02_conditional_order_before_request.png",
      "03_after_request.png",
      "04_after_approval.png",
      "05_after_release.png",
      "06_cutting_grid_contains_released_order.png",
    ],
  };

  await writeFile(path.join(evidenceDir, "pcd_cta_proof.json"), JSON.stringify(proof, null, 2));
  await writeFile(
    path.join(evidenceDir, "pcd_cta_proof_summary.txt"),
    [
      `Ready order ${proof.readyOrder.orderNo}: requestDisabled=${proof.readyOrder.requestDisabled}, approveDisabled=${proof.readyOrder.approveDisabled}, releaseEnabled=${proof.readyOrder.releaseEnabled}`,
      `Flow order ${proof.flowOrder.orderNo}: ${proof.flowOrder.before.readinessStatus} -> ${proof.flowOrder.afterRequest.requestedCount} requested -> ${proof.flowOrder.afterApproval.readinessStatus} -> ${proof.flowOrder.afterRelease.readinessStatus}`,
      `${proof.flowOrder.requestEndpoint.method} ${proof.flowOrder.requestEndpoint.path} ${proof.flowOrder.requestEndpoint.status}`,
      `${proof.flowOrder.approveEndpoint.method} ${proof.flowOrder.approveEndpoint.path} ${proof.flowOrder.approveEndpoint.status}`,
      `${proof.flowOrder.releaseEndpoint.method} ${proof.flowOrder.releaseEndpoint.path} ${proof.flowOrder.releaseEndpoint.status}`,
      `Cutting grid job ${proof.flowOrder.cuttingGrid.jobNo} for ${proof.flowOrder.orderNo}`,
    ].join("\n"),
  );

  await context.close();
  await browser.close();
  console.log(JSON.stringify({
    readyOrder: proof.readyOrder,
    flowOrder: {
      orderNo: proof.flowOrder.orderNo,
      request: proof.flowOrder.requestEndpoint,
      approve: proof.flowOrder.approveEndpoint,
      release: proof.flowOrder.releaseEndpoint,
      finalStatus: proof.flowOrder.afterRelease.readinessStatus,
      cuttingGrid: proof.flowOrder.cuttingGrid,
    },
    evidenceDir,
  }, null, 2));
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
