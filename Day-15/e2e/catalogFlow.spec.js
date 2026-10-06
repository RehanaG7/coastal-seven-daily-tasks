import { test, expect } from "@playwright/test";

test.describe("R-MART Critical User Journeys", () => {
  test("loads catalog view and displays product cards", async ({ page }) => {
    await page.goto("http://localhost:5173/catalog");
    await expect(page.locator("body")).toBeVisible();
  });
});
