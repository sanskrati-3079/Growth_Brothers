import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// Vite dev proxy: anything calling `/api/*` is forwarded to the FastAPI backend
// with the `/api` prefix stripped. Override via VITE_BACKEND_URL in .env.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backend = env.VITE_BACKEND_URL || "http://localhost:8000";

  return {
    plugins: [
      react({
        babel: {
          plugins: [["babel-plugin-react-compiler"]],
        },
      }),
    ],
    server: {
      port: 5173,
      strictPort: false,
      proxy: {
        "/api": {
          target: backend,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
      },
    },
  };
});
