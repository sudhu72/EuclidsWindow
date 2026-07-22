import { defineConfig } from "@playwright/test";

// Runs against the app served by FastAPI at /app. Start the backend
// (docker compose up) first, then: npm run test:e2e
export default defineConfig({
  testDir: "./e2e",
  timeout: 120_000,
  expect: { timeout: 90_000 },
  use: { baseURL: process.env.E2E_BASE_URL || "http://localhost:8010" },
});
