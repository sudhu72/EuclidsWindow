import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Built with base "/app/" so FastAPI can serve the bundle at /app alongside the
// existing vanilla SPA at /. In dev, proxy /api to the backend for same-origin.
export default defineConfig({
  base: "/app/",
  plugins: [react()],
  build: { outDir: "dist", emptyOutDir: true },
  server: {
    port: 5174,
    proxy: { "/api": "http://localhost:8010" },
  },
});
