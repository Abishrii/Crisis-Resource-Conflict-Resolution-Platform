import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// The browser talks to the backend through same-origin "/api" so the HTTP-only session cookie works
// with no CORS setup. In development Vite forwards /api and /health to the FastAPI server.
const backend = process.env.VITE_BACKEND_URL || "http://127.0.0.1:8000";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": { target: backend, changeOrigin: false },
      "/health": { target: backend, changeOrigin: false },
    },
  },
  preview: {
    proxy: {
      "/api": { target: backend, changeOrigin: false },
      "/health": { target: backend, changeOrigin: false },
    },
  },
});
