import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

const apiDirectory = path.resolve(import.meta.dirname, "../nicabliss_api");

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.e2e.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: "npm run e2e:server",
      cwd: apiDirectory,
      url: "http://127.0.0.1:4100/health",
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: "npm run dev -- --host 127.0.0.1 --port 4173",
      cwd: import.meta.dirname,
      env: { VITE_API_URL: "http://127.0.0.1:4100/api/v1" },
      url: "http://127.0.0.1:4173/login",
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
