import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backendUrl = env.VITE_BACKEND_URL || "https://egnaromart.com";

  return {
    plugins: [
      react(),
      tailwindcss(),
      tsconfigPaths(),
    ],

    server: {
      host: "0.0.0.0",
      port: 5173,
      proxy: {
        "/api": {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
        },
      },
    },

    build: {
      chunkSizeWarningLimit: 1000,
    },
  };
});