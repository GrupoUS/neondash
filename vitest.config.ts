import path from "path";
import { defineConfig } from "vitest/config";

const templateRoot = path.resolve(import.meta.dirname);

export default defineConfig({
  root: templateRoot,
  resolve: {
    alias: {
      "@": path.resolve(templateRoot, "client", "src"),
      "@shared": path.resolve(templateRoot, "shared"),
      "@assets": path.resolve(templateRoot, "attached_assets"),
    },
  },
  test: {
    // Use project workspaces for different environments
    projects: [
      {
        name: "server",
        root: templateRoot,
        test: {
          environment: "node",
          include: ["server/**/*.test.ts", "server/**/*.spec.ts"],
          exclude: ["**/node_modules/**"],
          setupFiles: ["./server/test/setup.ts"],
        },
        resolve: {
          alias: {
            "@": path.resolve(templateRoot, "client", "src"),
            "@shared": path.resolve(templateRoot, "shared"),
            "@assets": path.resolve(templateRoot, "attached_assets"),
          },
        },
      },
      {
        name: "client",
        root: templateRoot,
        test: {
          environment: "jsdom",
          include: ["client/src/**/*.test.tsx", "client/src/**/*.test.ts"],
          exclude: ["**/node_modules/**"],
          setupFiles: ["./client/src/test/setup.ts"],
        },
        resolve: {
          alias: {
            "@": path.resolve(templateRoot, "client", "src"),
            "@shared": path.resolve(templateRoot, "shared"),
            "@assets": path.resolve(templateRoot, "attached_assets"),
          },
        },
      },
    ],
    fileParallelism: false,
    isolate: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      reportsDirectory: "./coverage",
      include: [
        "server/**/*.ts",
        "client/src/**/*.{ts,tsx}",
      ],
      exclude: [
        "**/*.test.{ts,tsx}",
        "**/*.spec.{ts,tsx}",
        "**/test/**",
        "**/__tests__/**",
        "**/node_modules/**",
        "**/dist/**",
        "**/_core/**",
        "**/seeds/**",
        "**/scripts/**",
        "**/types/**",
      ],
      thresholds: {
        statements: 70,
        branches: 70,
        functions: 70,
        lines: 70,
      },
    },
  },
});
