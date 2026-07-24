import { test, expect } from "@playwright/test";

test("Library has file upload, web URL, and crawl options", async ({ page }) => {
  await page.goto("/app/");
  await page.locator('.tab', { hasText: "Library" }).click();

  await expect(page.locator('input[type="file"]')).toBeVisible();
  await expect(page.locator("h4", { hasText: "Add from the web" })).toBeVisible();
  await expect(page.locator('button.send', { hasText: "Add URL" })).toBeVisible();

  // Crawl controls (depth / breadth / max pages / same-domain) live in the
  // collapsible section.
  await page.locator(".crawl-box summary").click();
  await expect(page.locator(".crawl-form input")).toHaveCount(5);
  await expect(page.locator("button.send", { hasText: "Crawl" })).toBeVisible();
});
