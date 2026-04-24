/// <reference types="vitest/config" />
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["tests/firestore.rules.test.ts"],
    exclude: ["**/node_modules/**", "**/dist/**", "e2e/**"],
  },
});
