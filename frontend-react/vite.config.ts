import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Built with base "/app/" so the asset URLs are absolute: FastAPI serves this
// bundle both at / (the app) and at /app (kept so existing links and the
// /app#tab deep links still work). In dev, proxy /api for same-origin.
export default defineConfig({
  base: "/app/",
  plugins: [react()],
  build: { outDir: "dist", emptyOutDir: true },
  server: {
    port: 5174,
    proxy: { "/api": "http://localhost:8010" },
  },
});
