import { defineConfig } from "@playwright/test";

// Runs against the app served by FastAPI at /app. Start the backend
// (docker compose up) first, then: npm run test:e2e
export default defineConfig({
  testDir: "./e2e",
  timeout: 200_000,
  expect: { timeout: 90_000 },
  // Serial: the tests share one local GPU, so parallel workers would starve the
  // slow LLM-backed builds (lesson/discover) and flake on timeouts.
  workers: 1,
  use: { baseURL: process.env.E2E_BASE_URL || "http://localhost:8010" },
});
