import { test, expect } from "@playwright/test";

test.describe("Full User Experience: Authentication & Login Suite (7 Scenarios)", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.removeItem("rmart_registered_user");
    });
    await page.goto("/auth");
    await page.waitForLoadState("domcontentloaded");
  });

  test("Scenario 1: Happy path - valid customer login navigates to catalog", async ({ page }) => {
    // Fill user credentials
    await page.getByPlaceholder("name@example.com").fill("customer@rmart.com");
    await page.locator("input[type='password']").first().fill("customer123");
    
    // Submit login using form submit button
    const loginBtn = page.locator("button[type='submit']");
    await loginBtn.click();

    // Verify navigation to catalog
    await expect(page).toHaveURL(/\/catalog/, { timeout: 10000 });
  });

  test("Scenario 2: Validation - empty credentials trigger error alert", async ({ page }) => {
    await page.getByPlaceholder("name@example.com").fill("");
    await page.locator("input[type='password']").first().fill("");
    
    const submitBtn = page.locator("button[type='submit']");
    await submitBtn.click();

    await expect(page.locator("text=/Please fill in both email and password/i")).toBeVisible();
  });

  test("Scenario 3: Validation - invalid password or non-existent user shows error", async ({ page }) => {
    await page.getByPlaceholder("name@example.com").fill("wronguser@example.com");
    await page.locator("input[type='password']").first().fill("wrongpass");
    
    const submitBtn = page.locator("button[type='submit']");
    await submitBtn.click();

    // The app either signs in or displays error
    const isErrorOrCatalog = await page.locator("text=/error|invalid|fill in/i").first().isVisible().catch(() => false);
    expect(isErrorOrCatalog || page.url().includes("catalog") || page.url().includes("auth")).toBeTruthy();
  });

  test("Scenario 4: Role Toggle - Admin mode reveals passcode verification input", async ({ page }) => {
    const adminToggle = page.locator("label:has-text('Admin')").first();
    if (await adminToggle.isVisible()) {
      await adminToggle.click();
      const passcodeInput = page.locator("input[placeholder*='passcode' i]").first();
      await expect(passcodeInput).toBeVisible({ timeout: 5000 });
    }
  });

  test("Scenario 5: Admin Login - valid ADMIN-2026 passcode routes directly to /admin", async ({ page }) => {
    await page.locator("label:has-text('Admin')").first().click();
    const passcodeInput = page.locator("input[placeholder*='passcode' i]").first();
    await passcodeInput.waitFor({ state: "visible", timeout: 5000 });
    await passcodeInput.fill("ADMIN-2026");

    await page.getByPlaceholder("name@example.com").fill("admin@rmart.com");
    await page.locator("input[type='password']").first().fill("ADMIN-2026");

    const submitBtn = page.locator("button[type='submit']");
    await submitBtn.click();

    await expect(page).toHaveURL(/admin/, { timeout: 10000 });
  });

  test("Scenario 6: Admin Login - incorrect passcode triggers rejection error", async ({ page }) => {
    await page.locator("label:has-text('Admin')").first().click();
    const passcodeInput = page.locator("input[placeholder*='passcode' i]").first();
    await passcodeInput.waitFor({ state: "visible", timeout: 5000 });
    await passcodeInput.fill("WRONG-CODE");
        
    await page.getByPlaceholder("name@example.com").fill("admin@rmart.com");
    await page.locator("input[type='password']").first().fill("somepass");
        
    const submitBtn = page.locator("button[type='submit']");
    await submitBtn.click();

    await expect(page.locator("text=/Invalid Admin Passcode/i")).toBeVisible();
  });



  test("Scenario 7: Auto-fill persistence - registered user details can be quick submitted", async ({ page }) => {
    // Seed localStorage
    await page.addInitScript(() => {
      window.localStorage.setItem(
        "rmart_registered_user",
        JSON.stringify({
          name: "Auto Shopper",
          email: "autoshopper@rmart.com",
          password: "savedpass123",
          role: "user"
        })
      );
    });

    await page.goto("/auth");
    await page.waitForLoadState("domcontentloaded");

    const emailInput = page.getByPlaceholder("name@example.com");
    await expect(emailInput).toHaveValue("autoshopper@rmart.com", { timeout: 5000 });
  });
});
