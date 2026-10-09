import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    target: "esnext",
    cssCodeSplit: true,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("react-router-dom") || id.includes("react-dom") || id.includes("/react/") || id.includes("\\react\\")) {
              return "vendor-react";
            }
            if (id.includes("@tanstack") || id.includes("zustand") || id.includes("axios")) {
              return "vendor-query";
            }
            if (id.includes("lucide-react") || id.includes("clsx") || id.includes("tailwind-merge")) {
              return "vendor-ui";
            }
            if (id.includes("react-hook-form") || id.includes("@hookform") || id.includes("zod")) {
              return "vendor-form";
            }
            return "vendor";
          }
        },
      },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.js",
    exclude: ["**/node_modules/**", "**/dist/**", "**/e2e/**"],
  },
});

