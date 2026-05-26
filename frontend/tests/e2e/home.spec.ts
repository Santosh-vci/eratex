import { expect, test } from "@playwright/test";

test("home route renders the foundation shell", async ({ page }) => {
  let isAuthenticated = false;
  const corsHeaders = {
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "Content-Type, X-CSRFToken",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Origin": "http://127.0.0.1:3000",
  };
  const currentUser = {
    id: 1,
    username: "planner",
    email: "planner@example.com",
    firstName: "Production",
    lastName: "Planner",
    displayName: "Production Planner",
    isStaff: true,
    isSuperuser: false,
    roles: [{ id: "role-1", code: "PLANNER", name: "Planner", factoryId: null }],
    permissions: ["foundation.view", "orders.view", "planning.view"],
    scopes: [],
    featureFlags: {},
  };

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
      body: JSON.stringify({
        data: currentUser,
        meta: {},
        errors: [],
      }),
    });
  });

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page.getByRole("heading", { name: "Common Platform Foundation" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Eratex Operating Spine" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Orders/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Planning/ })).toBeVisible();
});
