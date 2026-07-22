import { test, expect } from "@playwright/test";

test("Discover tab shows the topic input", async ({ page }) => {
  await page.goto("/app/");
  await page.locator(".tab", { hasText: "Discover" }).click();
  await expect(page.locator(".lesson-bar input")).toBeVisible();
  await expect(page.locator("button.send", { hasText: "Discover" })).toBeVisible();
});

// Hits the LLM (qwen3:8b, a thinking model); give it room.
test("discovers a topic and renders the six stages", async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto("/app/");
  await page.locator(".tab", { hasText: "Discover" }).click();
  await page.locator(".lesson-bar input").fill("why a 2x2 determinant measures area");
  await page.locator("button.send", { hasText: "Discover" }).click();

  // All six stage headers appear.
  await expect(page.locator(".dstage-h").first()).toBeVisible({ timeout: 170_000 });
  await expect(page.locator(".dstage")).toHaveCount(6);
  await expect(page.locator(".dconnect")).toBeVisible();

  // At least some connection chips are clickable (climb the ladder).
  const chips = page.locator(".dchip");
  expect(await chips.count()).toBeGreaterThan(0);
});
