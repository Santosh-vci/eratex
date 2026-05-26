import { expect, test } from "@playwright/test";

test("home route renders the foundation shell", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Planning Foundation" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Eratex Operating Spine" })).toBeVisible();
});

