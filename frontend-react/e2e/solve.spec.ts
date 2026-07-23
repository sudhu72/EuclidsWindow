import { test, expect } from "@playwright/test";

test("Solve tab shows the problem input", async ({ page }) => {
  await page.goto("/app/");
  await page.locator(".tab", { hasText: "Solve" }).click();
  await expect(page.locator(".lesson-bar input")).toBeVisible();
  await expect(page.locator("button.send", { hasText: "Start" })).toBeVisible();
});

test("starting a problem shows the four Pólya phases", async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto("/app/");
  await page.locator(".tab", { hasText: "Solve" }).click();
  await page.locator(".lesson-bar input").fill("how many ways to make change for a dollar");
  await page.locator("button.send", { hasText: "Start" }).click();

  await expect(page.locator(".chips .chip").first()).toBeVisible({ timeout: 90_000 });
  await expect(page.locator(".chips .chip")).toHaveCount(4);
  await expect(page.locator(".polya-input")).toBeVisible();
});

test("Library lists uploaded documents", async ({ page }) => {
  await page.goto("/app/");
  await page.locator(".tab", { hasText: "Library" }).click();
  await expect(page.locator('input[type="file"]')).toBeVisible();
  await expect(page.locator("h4", { hasText: "Your library" })).toBeVisible();
});
