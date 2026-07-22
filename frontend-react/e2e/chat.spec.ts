import { test, expect } from "@playwright/test";

test("shell renders with Learn + Chat tabs", async ({ page }) => {
  await page.goto("/app/");
  await expect(page.locator(".brand")).toContainText("Euclid");
  await expect(page.locator(".tab", { hasText: "Learn" })).toBeVisible();
  await expect(page.locator(".tab", { hasText: "Chat" })).toBeVisible();
});

test("chat streams a reply and renders KaTeX", async ({ page }) => {
  await page.goto("/app/");
  await page.locator(".tab", { hasText: "Chat" }).click();
  await expect(page.locator(".composer input")).toBeVisible();
  await expect(page.locator("button.icon", { hasText: "🎤" })).toBeVisible();
  await expect(page.locator("button.icon", { hasText: "🔊" })).toBeVisible();
  await expect(page.locator(".vhint")).toContainText("Voice:");

  await page.locator(".composer input").fill("State the Pythagorean theorem and give its formula.");
  await page.locator("button.send").click();

  const assistant = page.locator(".bubble.assistant").last();
  await expect(assistant).toBeVisible();
  await page.locator(".composer input:not([disabled])").waitFor();

  const text = (await assistant.textContent()) ?? "";
  expect(text.length).toBeGreaterThan(50);
  expect(text).toMatch(/pythag/i);
  await expect(assistant.locator(".katex").first()).toBeVisible();
});
