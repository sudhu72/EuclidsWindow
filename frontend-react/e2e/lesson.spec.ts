import { test, expect } from "@playwright/test";

test("Learn tab shows the lesson builder", async ({ page }) => {
  await page.goto("/app/");
  // Learn is the default tab.
  await expect(page.locator(".lesson-bar input")).toBeVisible();
  await expect(page.locator("button.send", { hasText: "Build Lesson" })).toBeVisible();
  await expect(page.locator(".lesson select")).toBeVisible();
});

// Full build hits the local LLM (slow); give it room.
test("builds a lesson and renders scenes with KaTeX", async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto("/app/");
  await page.locator(".lesson-bar input").fill("the Pythagorean theorem");
  await page.locator("button.send", { hasText: "Build Lesson" }).click();

  // Scene player appears once the build completes.
  await expect(page.locator(".scene")).toBeVisible({ timeout: 170_000 });
  await expect(page.locator(".chips .chip").first()).toBeVisible();

  // Walk to a couple of scenes and confirm math typesets somewhere.
  const sceneText = (await page.locator(".scene").textContent()) ?? "";
  expect(sceneText.length).toBeGreaterThan(40);

  // Navigate through scenes; at least one should contain KaTeX-rendered math.
  const chips = page.locator(".chips .chip");
  const n = await chips.count();
  let sawKatex = false;
  for (let i = 0; i < n; i++) {
    await chips.nth(i).click();
    await page.waitForTimeout(300);
    if ((await page.locator(".scene .katex").count()) > 0) {
      sawKatex = true;
      break;
    }
  }
  expect(sawKatex).toBeTruthy();
});
