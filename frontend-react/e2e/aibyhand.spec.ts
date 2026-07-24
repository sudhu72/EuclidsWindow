import { test, expect } from "@playwright/test";

test("AI by Hand is a native React port (no iframe) with KaTeX", async ({ page }) => {
  await page.goto("/app/");
  await page.locator('.tab', { hasText: "Labs" }).click();
  await page.locator('.lab-card', { hasText: "AI by Hand" }).click();

  // Native gallery, not an embedded iframe.
  await expect(page.locator(".abh-card").first()).toBeVisible();
  await expect(page.locator("iframe.labs-frame")).toHaveCount(0);
  await expect(page.locator(".abh-card")).toHaveCount(19);
  await expect(page.locator(".abh-tier-title")).toHaveCount(4);

  // Open the first exercise; the six stages and math typeset.
  await page.locator(".abh-card").first().click();
  await expect(page.locator(".abh-stage")).toHaveCount(6);
  await expect(page.locator(".abh-stage .katex").first()).toBeVisible();
  await expect(page.locator(".abh-mat").first()).toBeVisible();
});
