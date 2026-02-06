import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    include: ["shared/**/*.test.ts", "server/**/*.test.ts"],
    globals: true,
  },
  resolve: {
    alias: {
      "@shared": path.resolve(import.meta.dirname, "shared"),
    },
  },
});
