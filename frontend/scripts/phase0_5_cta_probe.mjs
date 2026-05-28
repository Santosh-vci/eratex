import { chromium } from "playwright";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, "..", "..");
const evidenceDir = path.join(workspaceRoot, "docs", "audit_evidence", "phase5_cta_validation");

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

function endpoint(method, pattern) {
  return { method, pattern, label: `${method} ${pattern}` };
}

function classify(captured, expects, outcome) {
  if (outcome?.status) {
    return {
      status: outcome.status,
      missing: [],
      failures: [],
      notes: outcome.notes,
    };
  }

  if (!expects.length) {
    const mutating = captured.filter((event) => !["GET", "OPTIONS"].includes(event.method));
    return {
      status: mutating.length ? "UNEXPECTED_ENDPOINT" : "INERT_CONFIRMED",
      missing: [],
      failures: mutating.filter((event) => event.status >= 400),
      notes: mutating.length ? "Control reached an API even though no handler was expected." : undefined,
    };
  }

  const matched = expects.map((expectation) =>
    captured.find((event) => event.method === expectation.method && expectation.pattern.test(event.path)),
  );
  const missing = expects.filter((_, index) => !matched[index]).map((expectation) => expectation.label);
  const failures = matched.filter(Boolean).filter((event) => event.status >= 400);

  if (missing.length) {
    return { status: "MISSING_ENDPOINT", missing, failures: [] };
  }
  if (failures.length) {
    return { status: "API_FAILED", missing: [], failures };
  }
  return { status: "PASS", missing: [], failures: [] };
}

function resultRecord(meta, expects, captured, outcome) {
  const classification = classify(captured, expects, outcome);
  const matched = expects
    .map((expectation) =>
      captured.find((event) => event.method === expectation.method && expectation.pattern.test(event.path)),
    )
    .filter(Boolean);

  return {
    phase: meta.phase,
    surface: meta.surface,
    cta: meta.cta,
    role: meta.role ?? null,
    expects: expects.map((expectation) => expectation.label),
    notes: classification.notes ?? meta.notes ?? "",
    captured,
    matched,
    status: classification.status,
    missing: classification.missing,
    failures: classification.failures,
    screenshot: meta.screenshot ?? null,
  };
}

async function clickFirst(locator, description) {
  await locator.first().waitFor({ state: "visible", timeout: 15000 });
  const count = await locator.count();
  if (!count) {
    throw new Error(`${description} was not found.`);
  }
  await locator.first().click();
}

function isIgnoredConsoleError(message) {
  return message.startsWith("Failed to load resource:");
}

async function clickButton(page, name, options = {}) {
  await clickFirst(page.getByRole("button", { name, exact: options.exact ?? true }), `Button ${name}`);
}

async function confirmDialog(page, name = "Confirm") {
  await clickFirst(page.getByRole("dialog").getByRole("button", { name, exact: true }), `Dialog button ${name}`);
}

async function waitForApp(page) {
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
}

async function apiGet(page, pathName) {
  const response = await page.request.get(`${apiBaseUrl}${pathName}`);
  if (!response.ok()) {
    throw new Error(`GET ${pathName} failed with ${response.status()}`);
  }
  return (await response.json()).data;
}

async function chooseOrder(page, predicate, fallback) {
  const orders = await apiGet(page, "/orders");
  const order = orders.find(predicate) ?? orders.find((candidate) => candidate.orderNo === fallback);
  if (!order) throw new Error(`Order ${fallback} was not found.`);
  return order;
}

async function createSession(browser, role, consoleIssues) {
  const context = await browser.newContext({ baseURL: baseUrl });
  const page = await context.newPage();
  const captured = [];

  page.on("response", (response) => {
    try {
      if (!response.url().includes("/api/v1/")) return;
      captured.push({
        method: response.request().method(),
        path: apiPath(response.url()),
        status: response.status(),
      });
    } catch {
      // Ignore non-standard response URLs.
    }
  });
  page.on("console", (message) => {
    if (message.type() === "error" && !isIgnoredConsoleError(message.text())) {
      consoleIssues.push({ role, type: "console", message: message.text(), url: page.url() });
    }
  });
  page.on("pageerror", (error) => {
    consoleIssues.push({ role, type: "pageerror", message: error.message, url: page.url() });
  });

  await page.goto("/login");
  await page.getByLabel("Username").fill(role);
  await page.getByLabel("Password").fill(password);
  await Promise.all([
    page.waitForURL((url) => url.pathname !== "/login", { timeout: 15000 }),
    page.getByRole("button", { name: "Sign in", exact: true }).click(),
  ]);
  await waitForApp(page);

  return { context, page, captured, role };
}

async function recordAction(session, results, meta, expects, action) {
  const start = session.captured.length;
  let outcome;
  try {
    outcome = await action();
    await session.page.waitForTimeout(800);
  } catch (error) {
    results.push({
      phase: meta.phase,
      surface: meta.surface,
      cta: meta.cta,
      role: meta.role ?? session.role ?? null,
      expects: expects.map((expectation) => expectation.label),
      notes: meta.notes ?? "",
      captured: session.captured.slice(start),
      matched: [],
      status: "UI_ERROR",
      missing: [],
      failures: [],
      error: error.message,
      screenshot: meta.screenshot ?? null,
    });
    return;
  }

  const captured = session.captured.slice(start);
  results.push(resultRecord({ ...meta, role: meta.role ?? session.role }, expects, captured, outcome));

  if (meta.screenshot) {
    await session.page.screenshot({ path: path.join(evidenceDir, meta.screenshot), fullPage: true });
  }
}

async function gotoAndWait(page, pathName, visibleText) {
  await page.goto(pathName);
  if (visibleText) {
    await page.getByText(visibleText, { exact: false }).first().waitFor({ state: "visible", timeout: 15000 });
  }
  await waitForApp(page);
}

async function loginCase(browser, results, consoleIssues) {
  const context = await browser.newContext({ baseURL: baseUrl });
  const page = await context.newPage();
  const captured = [];
  page.on("response", (response) => {
    if (response.url().includes("/api/v1/")) {
      captured.push({ method: response.request().method(), path: apiPath(response.url()), status: response.status() });
    }
  });
  page.on("console", (message) => {
    if (message.type() === "error" && !isIgnoredConsoleError(message.text())) {
      consoleIssues.push({ role: "login", type: "console", message: message.text(), url: page.url() });
    }
  });
  await page.goto("/login");
  await page.getByLabel("Username").fill("planner");
  await page.getByLabel("Password").fill(password);
  await Promise.all([
    page.waitForURL((url) => url.pathname !== "/login", { timeout: 15000 }),
    page.getByRole("button", { name: "Sign in", exact: true }).click(),
  ]);
  await page.waitForTimeout(500);
  results.push(resultRecord(
    { phase: "Phase 1", surface: "Login", cta: "Sign in", role: null },
    [endpoint("GET", /^\/auth\/csrf$/), endpoint("POST", /^\/auth\/login$/)],
    captured,
  ));
  await context.close();
}

async function runPhase2(browser, results, consoleIssues) {
  const session = await createSession(browser, "business_admin", consoleIssues);
  const { page } = session;

  await gotoAndWait(page, "/master-data/governance", "Master Data Governance");
  await recordAction(session, results, { phase: "Phase 2", surface: "Master Data Governance", cta: "Audit Log", notes: "No handler implemented." }, [], async () => {
    await clickButton(page, "Audit Log");
  });

  await gotoAndWait(page, "/technical/styles", "Style Technical File");
  await recordAction(session, results, { phase: "Phase 2", surface: "Technical Styles", cta: "Open technical file", screenshot: "cta_technical_style_detail.png" }, [endpoint("GET", /^\/styles\/[0-9a-f-]+$/)], async () => {
    await clickFirst(page.getByRole("link", { name: "Open technical file" }), "Open technical file link");
    await page.waitForURL((url) => url.pathname.includes("/technical/styles/"), { timeout: 15000 });
    await waitForApp(page);
  });

  await gotoAndWait(page, "/technical/bom", "BOM & Material Planning");
  await recordAction(session, results, { phase: "Phase 2", surface: "BOM", cta: "Export", notes: "No handler implemented." }, [], async () => {
    await clickButton(page, "Export");
  });
  await recordAction(session, results, { phase: "Phase 2", surface: "BOM", cta: "Filter", notes: "No handler implemented." }, [], async () => {
    await clickButton(page, "Filter");
  });

  await gotoAndWait(page, "/technical/operation-bulletins", "Operation Bulletins");
  await recordAction(session, results, { phase: "Phase 2", surface: "Operation Bulletins", cta: "Create New Bulletin", notes: "No handler implemented." }, [], async () => {
    await clickButton(page, "Create New Bulletin");
  });
  await recordAction(session, results, { phase: "Phase 2", surface: "Operation Bulletins", cta: "Clone" }, [endpoint("POST", /^\/operation-bulletins\/[0-9a-f-]+\/clone$/)], async () => {
    await clickButton(page, "Clone");
    await confirmDialog(page, "Clone");
  });
  await gotoAndWait(page, "/technical/operation-bulletins", "Operation Bulletins");
  await recordAction(session, results, { phase: "Phase 2", surface: "Operation Bulletins", cta: "Approve Bulletin" }, [endpoint("POST", /^\/operation-bulletins\/[0-9a-f-]+\/approve$/)], async () => {
    const draftRows = page.locator("tbody tr").filter({ hasText: "DRAFT" });
    if ((await draftRows.count()) > 0) {
      await draftRows.first().click();
    }
    await clickButton(page, "Approve Bulletin");
    await confirmDialog(page, "Approve");
  });
  await gotoAndWait(page, "/technical/operation-bulletins", "Operation Bulletins");
  await recordAction(session, results, { phase: "Phase 2", surface: "Operation Bulletins", cta: "Open routing", screenshot: "cta_routing_builder.png" }, [endpoint("GET", /^\/operation-bulletins\/[0-9a-f-]+$/)], async () => {
    await clickFirst(page.getByRole("link", { name: "Open routing" }), "Open routing link");
    await page.waitForURL((url) => url.pathname.includes("/routing"), { timeout: 15000 });
    await waitForApp(page);
  });
  await recordAction(session, results, { phase: "Phase 2", surface: "Routing Builder", cta: "Release Routing", notes: "No handler implemented." }, [], async () => {
    await clickButton(page, "Release Routing");
  });

  await gotoAndWait(page, "/technical/operator-skill-capacity", "Operator Skill");
  await recordAction(session, results, { phase: "Phase 2", surface: "Operator Skill", cta: "Add Operator", notes: "No handler implemented." }, [], async () => {
    await clickButton(page, "Add Operator");
  });
  await recordAction(session, results, { phase: "Phase 2", surface: "Operator Skill", cta: "Export Report", notes: "No handler implemented." }, [], async () => {
    await clickButton(page, "Export Report");
  });

  await session.context.close();
}

async function runPhase3(browser, results, consoleIssues) {
  let session = await createSession(browser, "planning_head", consoleIssues);
  let { page } = session;

  await gotoAndWait(page, "/orders", "Order Lifecycle Explorer");
  await recordAction(session, results, { phase: "Phase 3", surface: "Orders", cta: "Open order detail", screenshot: "cta_order_detail.png" }, [endpoint("GET", /^\/orders\/[0-9a-f-]+$/)], async () => {
    await clickFirst(page.getByRole("link", { name: "OPS-ORD-001" }), "OPS-ORD-001 link");
    await page.waitForURL((url) => url.pathname.includes("/orders/"), { timeout: 15000 });
    await waitForApp(page);
  });
  await recordAction(session, results, { phase: "Phase 3", surface: "Orders", cta: "Open Trace" }, [endpoint("GET", /^\/orders\/[0-9a-f-]+\/timeline$/)], async () => {
    await clickFirst(page.getByRole("link", { name: "Open Trace" }), "Open Trace link");
    await page.waitForURL((url) => url.pathname.includes("/trace"), { timeout: 15000 });
    await waitForApp(page);
  });
  const releasableOrder = await chooseOrder(
    page,
    (order) => order.releaseAllowed && order.currentStage === "PCD_READY" && order.orderNo.startsWith("OPS-ORD-"),
    "OPS-ORD-012",
  );
  await gotoAndWait(page, `/orders/${releasableOrder.id}`, releasableOrder.orderNo);
  await recordAction(session, results, { phase: "Phase 3", surface: "Orders", cta: "Release to Cutting" }, [endpoint("POST", /^\/orders\/[0-9a-f-]+\/release-to-cutting$/)], async () => {
    await clickButton(page, "Release to Cutting");
    await confirmDialog(page, "Release");
  });
  await session.context.close();

  session = await createSession(browser, "procurement_user", consoleIssues);
  page = session.page;
  await gotoAndWait(page, "/procurement/vendor-follow-up", "Procurement");
  await recordAction(session, results, { phase: "Phase 3", surface: "Procurement", cta: "Export Report", notes: "No handler implemented." }, [], async () => {
    await clickButton(page, "Export Report");
  });
  await recordAction(session, results, { phase: "Phase 3", surface: "Procurement", cta: "Log Follow-Up", notes: "No handler implemented." }, [], async () => {
    await clickButton(page, "Log Follow-Up");
  });
  await clickFirst(page.locator("tbody tr"), "First procurement row");
  await recordAction(session, results, { phase: "Phase 3", surface: "Procurement", cta: "Escalate", notes: "No handler implemented." }, [], async () => {
    await clickButton(page, "Escalate");
  });
  await recordAction(session, results, { phase: "Phase 3", surface: "Procurement", cta: "Expedite", notes: "No handler implemented." }, [], async () => {
    await clickButton(page, "Expedite");
  });
  await recordAction(session, results, { phase: "Phase 3", surface: "Procurement", cta: "Save Updates" }, [endpoint("POST", /^\/procurement\/purchase-orders\/[0-9a-f-]+\/eta-updates$/)], async () => {
    await clickButton(page, "Save Updates");
  });
  await session.context.close();

  session = await createSession(browser, "fabric_qc_user", consoleIssues);
  page = session.page;
  await gotoAndWait(page, "/fabric/qc", "Fabric Inward");
  await clickFirst(page.locator("tbody tr"), "First fabric QC row");
  await recordAction(session, results, { phase: "Phase 3", surface: "Fabric QC", cta: "Release to Cutting", notes: "No handler implemented." }, [], async () => {
    await clickButton(page, "Release to Cutting");
  });
  await recordAction(session, results, { phase: "Phase 3", surface: "Fabric QC", cta: "QC Exception", notes: "No handler implemented." }, [], async () => {
    await clickButton(page, "QC Exception");
  });
  await session.context.close();

  session = await createSession(browser, "planning_head", consoleIssues);
  page = session.page;
  await gotoAndWait(page, "/pcd-readiness", "PCD Readiness Gate");
  await recordAction(session, results, { phase: "Phase 3", surface: "PCD Readiness", cta: "Filter", notes: "No handler implemented." }, [], async () => {
    await clickButton(page, "Filter");
  });
  const pcdRows = await apiGet(page, "/pcd-readiness");
  const conditionalPcdRow =
    pcdRows.find((row) =>
      row.readinessStatus !== "RELEASED" &&
      row.items.some((item) =>
        item.isMandatory &&
        ["PENDING", "FAILED", "WAIVED"].includes(item.status),
      ) &&
      !row.conditionalReleases.some((conditional) =>
        ["REQUESTED", "APPROVED"].includes(conditional.status),
      ),
    ) ?? pcdRows.find((row) => row.orderNo === "OPS-ORD-004");
  if (!conditionalPcdRow) throw new Error("No PCD row is available for request/approve/release validation.");
  await clickFirst(page.locator("button").filter({ hasText: conditionalPcdRow.orderNo }), `${conditionalPcdRow.orderNo} PCD card`);
  await recordAction(session, results, { phase: "Phase 3", surface: "PCD Readiness", cta: "Request Conditional Release" }, [endpoint("POST", /^\/pcd-readiness\/[0-9a-f-]+\/request-conditional-release$/)], async () => {
    await clickButton(page, "Request Conditional Release");
    await confirmDialog(page, "Confirm");
  });
  await recordAction(session, results, { phase: "Phase 3", surface: "PCD Readiness", cta: "Approve Conditional Release" }, [endpoint("POST", /^\/pcd-readiness\/[0-9a-f-]+\/approve-conditional-release$/)], async () => {
    await clickButton(page, "Approve Conditional Release");
    await confirmDialog(page, "Confirm");
  });
  await recordAction(session, results, { phase: "Phase 3", surface: "PCD Readiness", cta: "Release to Cutting", notes: "Same order as request and approval." }, [endpoint("POST", /^\/orders\/[0-9a-f-]+\/release-to-cutting$/)], async () => {
    await clickButton(page, "Release to Cutting");
    await confirmDialog(page, "Release");
  });
  await session.context.close();
}

async function runEos04(browser, results, consoleIssues) {
  let session = await createSession(browser, "planner", consoleIssues);
  let { page } = session;
  await gotoAndWait(page, "/planning/weekly", "Backlog");
  await recordAction(session, results, { phase: "EOS-04", surface: "Weekly Planning", cta: "By Style segmented control", notes: "Visual segmented control has no state change handler." }, [], async () => {
    await clickButton(page, "By Style");
  });
  await recordAction(session, results, { phase: "EOS-04", surface: "Weekly Planning", cta: "Backlog order preview", screenshot: "cta_weekly_impact_preview.png" }, [endpoint("POST", /^\/planning\/weekly\/[0-9a-f-]+\/impact-preview$/)], async () => {
    await clickFirst(page.locator("aside button[draggable=true]"), "First backlog order");
  });
  await recordAction(session, results, { phase: "EOS-04", surface: "Weekly Planning", cta: "Assign Selected" }, [endpoint("POST", /^\/planning\/weekly\/[0-9a-f-]+\/assign-item$/)], async () => {
    await clickButton(page, "Assign Selected");
  });
  await recordAction(session, results, { phase: "EOS-04", surface: "Weekly Planning", cta: "Freeze Plan" }, [endpoint("POST", /^\/planning\/weekly\/[0-9a-f-]+\/freeze$/)], async () => {
    await clickButton(page, "Freeze Plan");
    await confirmDialog(page, "Freeze");
  });
  await recordAction(session, results, { phase: "EOS-04", surface: "Weekly Planning", cta: "Request Change" }, [endpoint("POST", /^\/planning\/change-requests$/)], async () => {
    await clickFirst(page.locator("div[role='region'] button"), "First planned work item");
    await clickButton(page, "Request Change");
  });
  await session.context.close();

  session = await createSession(browser, "planner", consoleIssues);
  page = session.page;
  await gotoAndWait(page, "/workcenters/load", "Workcenter Load");
  await recordAction(session, results, { phase: "EOS-04", surface: "Workcenter Load", cta: "Export Logs", notes: "No handler implemented." }, [], async () => {
    await clickButton(page, "Export Logs");
  });
  await recordAction(session, results, { phase: "EOS-04", surface: "Workcenter Load", cta: "Reevaluate All Loads", notes: "No handler implemented." }, [], async () => {
    await clickButton(page, "Reevaluate All Loads");
  });
  await recordAction(session, results, { phase: "EOS-04", surface: "Workcenter Load", cta: "Open Queue", screenshot: "cta_workcenter_load_queue.png" }, [endpoint("GET", /^\/workcenters\/[0-9a-f-]+\/queue$/)], async () => {
    await clickFirst(page.getByRole("link", { name: "Open Queue" }), "Open Queue link");
    await page.waitForURL((url) => url.pathname.includes("/queue"), { timeout: 15000 });
    await waitForApp(page);
  });
  await session.context.close();

  session = await createSession(browser, "planner", consoleIssues);
  page = session.page;
  await gotoAndWait(page, "/releases/daily", "Daily Production Release");
  await recordAction(session, results, { phase: "EOS-04", surface: "Daily Release", cta: "Export", notes: "No handler implemented." }, [], async () => {
    await clickButton(page, "Export");
  });
  await recordAction(session, results, { phase: "EOS-04", surface: "Daily Release", cta: "Bulk Release" }, [endpoint("POST", /^\/releases$/)], async () => {
    const button = page.getByRole("button", { name: "Bulk Release", exact: true });
    if (await button.isDisabled()) return { status: "RBAC_OR_STATE_GATED", notes: "Bulk Release disabled because no release-ready work item was available or role is not allowed." };
    await button.click();
    await confirmDialog(page, "Confirm");
  });
  await recordAction(session, results, { phase: "EOS-04", surface: "Daily Release", cta: "Validate", screenshot: "cta_daily_release_validation.png" }, [endpoint("POST", /^\/releases\/validate$/)], async () => {
    await clickFirst(page.locator("tbody tr"), "First release row");
    await clickButton(page, "Validate");
  });
  await recordAction(session, results, { phase: "EOS-04", surface: "Daily Release", cta: "Request Override" }, [endpoint("POST", /^\/releases\/[0-9a-f-]+\/request-override$/)], async () => {
    await clickButton(page, "Request Override");
    await confirmDialog(page, "Confirm");
  });
  await session.context.close();

  session = await createSession(browser, "planning_head", consoleIssues);
  page = session.page;
  await gotoAndWait(page, "/releases/daily", "Daily Production Release");
  await recordAction(session, results, { phase: "EOS-04", surface: "Daily Release", cta: "Approve Override" }, [endpoint("POST", /^\/releases\/[0-9a-f-]+\/approve-override$/)], async () => {
    const requested = page.locator("tbody tr").filter({ hasText: "OVERRIDE_REQUESTED" });
    if ((await requested.count()) > 0) await requested.first().click();
    else await clickFirst(page.locator("tbody tr"), "First release row");
    await clickButton(page, "Approve Override");
    await confirmDialog(page, "Confirm");
  });
  await session.context.close();

  session = await createSession(browser, "planning_head", consoleIssues);
  page = session.page;
  await gotoAndWait(page, "/releases/daily", "Daily Production Release");
  await recordAction(session, results, { phase: "EOS-04", surface: "Daily Release", cta: "Release to Floor" }, [endpoint("POST", /^\/releases\/[0-9a-f-]+\/complete$/)], async () => {
    const approved = page.locator("tbody tr").filter({ hasText: "OVERRIDE_APPROVED" });
    if ((await approved.count()) > 0) await approved.first().click();
    else await clickFirst(page.locator("tbody tr"), "First release row");
    await clickButton(page, "Release to Floor");
    await confirmDialog(page, "Confirm");
  });
  await session.context.close();

  session = await createSession(browser, "planning_head", consoleIssues);
  page = session.page;
  await gotoAndWait(page, "/boundary-cases", "Boundary Cases");
  await recordAction(session, results, { phase: "EOS-04", surface: "Boundary Cases", cta: "Search boundary cases", notes: "Client-side filter only." }, [], async () => {
    await page.getByLabel("Search boundary cases").fill("SCN");
  });
  await page.getByLabel("Search boundary cases").fill("");
  await recordAction(session, results, { phase: "EOS-04", surface: "Boundary Cases", cta: "Open event / Impact preview", screenshot: "cta_boundary_impact_preview.png" }, [endpoint("POST", /^\/boundary-cases\/impact-preview$/)], async () => {
    await clickFirst(page.locator("tbody tr").filter({ hasNotText: "APPLIED" }), "Open boundary event row");
  });
  await recordAction(session, results, { phase: "EOS-04", surface: "Boundary Cases", cta: "Approve" }, [endpoint("POST", /^\/boundary-cases\/[0-9a-f-]+\/approve-action$/)], async () => {
    await clickButton(page, "Approve");
  });
  await recordAction(session, results, { phase: "EOS-04", surface: "Boundary Cases", cta: "Apply" }, [endpoint("POST", /^\/boundary-cases\/[0-9a-f-]+\/apply-action$/)], async () => {
    await clickButton(page, "Apply");
  });
  await session.context.close();
}

async function runEos05(browser, results, consoleIssues) {
  let session = await createSession(browser, "cutting_user", consoleIssues);
  let { page } = session;
  await gotoAndWait(page, "/cutting/room", "Cutting Room");
  await recordAction(session, results, { phase: "EOS-05", surface: "Cutting Room", cta: "Record Output", notes: "No handler implemented." }, [], async () => {
    await clickButton(page, "Record Output");
  });
  await session.context.close();

  session = await createSession(browser, "line_supervisor", consoleIssues);
  page = session.page;
  await gotoAndWait(page, "/sewing/line-loading", "Active Lines");
  await recordAction(session, results, { phase: "EOS-05", surface: "Sewing Line Loading", cta: "Approve Reassignment" }, [endpoint("POST", /^\/sewing\/line-realignment$/)], async () => {
    await clickFirst(page.locator("tbody tr"), "First sewing line row");
    await clickFirst(page.locator("aside button").filter({ hasText: /Approve|Reassign|Realign|Recovery|Request/ }), "Line recovery action");
  });
  await session.context.close();

  session = await createSession(browser, "line_supervisor", consoleIssues);
  page = session.page;
  await gotoAndWait(page, "/sewing/line-realignment", "Line Realignment");
  await recordAction(session, results, { phase: "EOS-05", surface: "Line Realignment", cta: "Preview", screenshot: "cta_line_realignment_preview.png" }, [endpoint("POST", /^\/sewing\/line-realignment\/preview$/)], async () => {
    await clickButton(page, "Preview");
  });
  await recordAction(session, results, { phase: "EOS-05", surface: "Line Realignment", cta: "Request" }, [endpoint("POST", /^\/sewing\/line-realignment$/)], async () => {
    await clickButton(page, "Request");
  });
  await recordAction(session, results, { phase: "EOS-05", surface: "Line Realignment", cta: "Approve", role: "line_supervisor", notes: "Button should be disabled for supervisor after RBAC hardening." }, [], async () => {
    const button = page.getByRole("button", { name: "Approve", exact: true });
    return (await button.isDisabled())
      ? { status: "RBAC_GATED", notes: "Approve is disabled for line_supervisor; sewing_mgr owns approval." }
      : undefined;
  });
  await recordAction(session, results, { phase: "EOS-05", surface: "Line Realignment", cta: "Apply", role: "line_supervisor", notes: "Button should be disabled for supervisor after RBAC hardening." }, [], async () => {
    const button = page.getByRole("button", { name: "Apply", exact: true });
    return (await button.isDisabled())
      ? { status: "RBAC_GATED", notes: "Apply is disabled for line_supervisor; sewing_mgr owns application." }
      : undefined;
  });
  await session.context.close();

  session = await createSession(browser, "sewing_mgr", consoleIssues);
  page = session.page;
  await gotoAndWait(page, "/sewing/line-realignment", "Line Realignment");
  await recordAction(session, results, { phase: "EOS-05", surface: "Line Realignment", cta: "Approve as sewing manager" }, [endpoint("POST", /^\/sewing\/line-realignment\/[0-9a-f-]+\/approve$/)], async () => {
    await clickButton(page, "Preview");
    await clickButton(page, "Request");
    await page.waitForTimeout(500);
    await clickButton(page, "Approve");
  });
  await recordAction(session, results, { phase: "EOS-05", surface: "Line Realignment", cta: "Apply as sewing manager" }, [endpoint("POST", /^\/sewing\/line-realignment\/[0-9a-f-]+\/apply$/)], async () => {
    await clickButton(page, "Apply");
  });
  await session.context.close();

  session = await createSession(browser, "line_supervisor", consoleIssues);
  page = session.page;
  await gotoAndWait(page, "/sewing/output", "Sewing Output Capture");
  await recordAction(session, results, { phase: "EOS-05", surface: "Sewing Output", cta: "Submit Output", screenshot: "cta_sewing_output_submit.png" }, [endpoint("POST", /^\/sewing\/output$/)], async () => {
    await clickButton(page, "Submit Output");
    await confirmDialog(page, "Submit");
  });
  await session.context.close();
}

async function main() {
  await mkdir(evidenceDir, { recursive: true });
  const browser = await chromium.launch(launchOptions());
  const results = [];
  const consoleIssues = [];
  try {
    await loginCase(browser, results, consoleIssues);
    await runPhase2(browser, results, consoleIssues);
    await runPhase3(browser, results, consoleIssues);
    await runEos04(browser, results, consoleIssues);
    await runEos05(browser, results, consoleIssues);
  } finally {
    await browser.close();
  }

  const counts = results.reduce((acc, result) => {
    acc[result.status] = (acc[result.status] ?? 0) + 1;
    return acc;
  }, {});
  const payload = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    apiBaseUrl,
    results,
    consoleIssues,
    counts,
  };
  await writeFile(path.join(evidenceDir, "cta_results.json"), JSON.stringify(payload, null, 2));
  const summary = [
    `Total: ${results.length}`,
    ...Object.entries(counts).sort().map(([status, count]) => `${status}: ${count}`),
    `Console issues: ${consoleIssues.length}`,
  ].join("\n");
  await writeFile(path.join(evidenceDir, "cta_summary.txt"), `${summary}\n`);
  console.log(summary);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
