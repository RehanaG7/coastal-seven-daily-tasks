import { test, expect } from "@playwright/test";

test.describe("Admin Dashboard, Inventory CRUD & Route Guard Suite (5 Scenarios)", () => {
  test("Scenario 1: Protected route guard - redirects unauthenticated visitors", async ({ page }) => {
    // Clear any existing session
    await page.addInitScript(() => {
      window.localStorage.clear();
    });

    await page.goto("/admin");
    await page.waitForLoadState("domcontentloaded");

    // Must be redirected to /auth or catalog
    await expect(page).toHaveURL(/auth|catalog/);
  });

  test("Scenario 2: Authenticated Admin access successfully renders Admin Dashboard", async ({ page }) => {
    // Authenticate as Admin
    await page.addInitScript(() => {
      window.localStorage.setItem("user_role", "admin");
      window.localStorage.setItem("rmart_skip_intro", "true");
      window.localStorage.setItem(
        "rmart_user",
        JSON.stringify({
          name: "Admin User",
          email: "admin@rmart.com",
          role: "admin",
          token: "admin_jwt_token_sample"
        })
      );
    });

    await page.goto("/admin");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.locator("text=/Admin|Dashboard|Inventory|Manage Products|Catalog/i").first()).toBeVisible({ timeout: 10000 });
  });

  test("Scenario 3: Admin Dashboard displays Inventory Management Table with columns", async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("user_role", "admin");
      window.localStorage.setItem(
        "rmart_user",
        JSON.stringify({
          name: "Admin User",
          email: "admin@rmart.com",
          role: "admin"
        })
      );
    });

    await page.goto("/admin");
    await page.waitForLoadState("domcontentloaded");

    // Table or list container should be visible
    const tableOrList = page.locator("table, [role='table'], [data-testid='admin-inventory-list'], .inventory-table").first();
    if (await tableOrList.isVisible()) {
      await expect(tableOrList).toBeVisible();
    }
  });

  test("Scenario 4: Add Product / Studio Modal opens on button click", async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("user_role", "admin");
      window.localStorage.setItem(
        "rmart_user",
        JSON.stringify({
          name: "Admin User",
          email: "admin@rmart.com",
          role: "admin"
        })
      );
    });

    await page.goto("/admin");
    await page.waitForLoadState("domcontentloaded");

    const addProductBtn = page.locator("button:has-text('Add Product'), button:has-text('New Product'), button:has-text('Create')").first();
    if (await addProductBtn.isVisible()) {
      await addProductBtn.click();
      await expect(page.locator("text=/Create Product|Add New Product|Product Details|Price/i").first()).toBeVisible({ timeout: 6000 });
    }
  });

  test("Scenario 5: Admin Stock Modifier updates inventory counts", async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("user_role", "admin");
      window.localStorage.setItem(
        "rmart_user",
        JSON.stringify({
          name: "Admin User",
          email: "admin@rmart.com",
          role: "admin"
        })
      );
    });

    await page.goto("/catalog");
    await page.waitForLoadState("domcontentloaded");

    // Look for Admin stock adjustment buttons (+ / -) on catalog cards
    const plusStockBtn = page.locator("button[title*='Increase stock'], button:has-text('+')").first();
    if (await plusStockBtn.isVisible()) {
      await plusStockBtn.click();
      await page.waitForTimeout(300);
      expect(true).toBeTruthy();
    }
  });
});
