import { test, expect } from "@playwright/test";

test("shell renders with chat + voice controls", async ({ page }) => {
  await page.goto("/app/");
  await expect(page.locator(".brand")).toContainText("Euclid");
  await expect(page.locator(".composer input")).toBeVisible();
  await expect(page.locator("button.icon", { hasText: "🎤" })).toBeVisible();
  await expect(page.locator("button.icon", { hasText: "🔊" })).toBeVisible();
  await expect(page.locator(".vhint")).toContainText("Voice:");
});

test("a question streams a reply and renders KaTeX", async ({ page }) => {
  await page.goto("/app/");
  await page.locator(".composer input").fill("State the Pythagorean theorem and give its formula.");
  await page.locator("button.send").click();

  const assistant = page.locator(".bubble.assistant").last();
  await expect(assistant).toBeVisible();

  // Stream finishes when the input re-enables (busy -> false).
  await page.locator(".composer input:not([disabled])").waitFor();

  const text = (await assistant.textContent()) ?? "";
  expect(text.length).toBeGreaterThan(50);
  expect(text).toMatch(/pythag/i);
  // The formula was typeset by KaTeX.
  await expect(assistant.locator(".katex").first()).toBeVisible();
});
