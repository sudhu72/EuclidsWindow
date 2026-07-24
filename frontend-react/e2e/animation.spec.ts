import { test, expect } from "@playwright/test";

// Builds a lesson, then renders an on-demand Manim animation for a scene.
// Uses a template-backed topic (Pythagorean) so the render is fast + reliable.
test("a lesson scene can render an on-demand animation", async ({ page }) => {
  test.setTimeout(300_000);
  await page.goto("/app/");
  await page.locator(".lesson-bar input").fill("the Pythagorean theorem");
  await page.locator('button.send:has-text("Build Lesson")').click();
  await page.locator(".scene").waitFor({ timeout: 200_000 });

  const animBtn = page.locator("button.anim-btn").first();
  await expect(animBtn).toBeVisible();
  await animBtn.click();

  const media = page.locator(".anim-media img, .anim-media video").first();
  await media.waitFor({ timeout: 200_000 });
  const src = await media.getAttribute("src");
  expect(src).toMatch(/\.(gif|mp4)$/);
});
