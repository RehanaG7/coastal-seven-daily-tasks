import { defineConfig, devices } from "@playwright/test";

// Detect if headed mode is requested via CLI flag or environment variable
const isHeaded =
  process.argv.some((arg) => arg.includes("headed")) ||
  process.env.HEADED === "true" ||
  process.env.IS_HEADED === "true";

if (isHeaded) {
  process.env.IS_HEADED = "true";
  if (!process.env.SLOWMO) {
    process.env.SLOWMO = "2000"; // 2 full seconds per action so evaluators can clearly follow every click & typing
  }
}

const slowMoValue = process.env.SLOWMO ? parseInt(process.env.SLOWMO, 10) : (isHeaded ? 2000 : 0);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: !isHeaded,
  workers: isHeaded ? 1 : undefined, // Single window during headed mode so evaluator sees clean step-by-step
  timeout: isHeaded ? 60000 : 30000,
  webServer: {
    command: "npm run dev",
    port: 5173,
    reuseExistingServer: true,
  },
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
    launchOptions: {
      slowMo: slowMoValue,
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
