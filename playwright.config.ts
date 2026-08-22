import "dotenv/config";
import { defineConfig, devices } from "@playwright/test";
import { MUNICIPALITY_URL, USER_URL } from "./helpers/targets";

const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: "./e2e",
  outputDir: "./test-results",
  // The local Vinext target has shown same-URL state resets and detached click
  // targets under concurrent journeys. Acceptance evidence favors a stable,
  // reviewable run over throughput, so browser scenarios are intentionally
  // serialized in both local and CI execution.
  fullyParallel: false,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: 1,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  globalSetup: "./helpers/global-setup.ts",
  reporter: [
    ["list"],
    ["html", { outputFolder: "evidence/reports/html", open: "never" }],
    ["./helpers/evidence/reporter.ts"],
  ],
  use: {
    baseURL: USER_URL,
    actionTimeout: 10_000,
    navigationTimeout: 20_000,
    locale: "ja-JP",
    timezoneId: "Asia/Tokyo",
    serviceWorkers: "block",
  },
  projects: [
    {
      name: "functional",
      testMatch: /.*\.spec\.ts/,
      grepInvert: /@evidence/,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: USER_URL,
        trace: "retain-on-failure",
        screenshot: "only-on-failure",
        video: "retain-on-failure",
      },
    },
    {
      name: "evidence-mobile",
      testMatch: /persona-a\/full-journey\.spec\.ts/,
      grep: /@evidence/,
      use: {
        ...devices["iPhone 13"],
        baseURL: USER_URL,
        browserName: "chromium",
        viewport: { width: 390, height: 844 },
        trace: "on",
        screenshot: "only-on-failure",
        video: { mode: "on", size: { width: 390, height: 844 } },
      },
    },
    {
      name: "evidence-admin",
      testMatch: /crisis\/full-journey\.spec\.ts/,
      grep: /@evidence/,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: MUNICIPALITY_URL,
        viewport: { width: 1440, height: 900 },
        trace: "on",
        screenshot: "only-on-failure",
        video: { mode: "on", size: { width: 1440, height: 900 } },
      },
    },
  ],
});
