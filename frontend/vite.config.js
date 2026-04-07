import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const rawBasename = env.VITE_APP_BASENAME || "/";
  const normalizedBase =
    rawBasename === "/" ? "/" : `/${rawBasename.replace(/^\/+|\/+$/g, "")}/`;

  return {
    base: normalizedBase,
    plugins: [react()],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes("node_modules")) {
              return;
            }

            if (id.includes("react") || id.includes("scheduler")) {
              return "react-vendor";
            }

            if (id.includes("framer-motion")) {
              return "motion-vendor";
            }

            if (id.includes("three")) {
              return "three-vendor";
            }

            return "vendor";
          },
        },
      },
    },
    server: {
      port: 5173,
      open: true,
    },
  };
});
