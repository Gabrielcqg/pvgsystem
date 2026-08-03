import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/@supabase")) return "supabase";
          if (id.includes("node_modules/@tanstack")) return "query";
          if (id.includes("node_modules/react-router")) return "router";
          if (id.includes("node_modules/react") || id.includes("node_modules/scheduler")) return "react";
          if (id.includes("node_modules")) return "vendor";
          return undefined;
        },
      },
    },
  },
  test: {
    environment: "jsdom",
    include: ["src/test/**/*.test.{js,jsx}"],
    setupFiles: "./src/test/setup.js",
  },
  server: {
    host: "0.0.0.0",
  },
});
