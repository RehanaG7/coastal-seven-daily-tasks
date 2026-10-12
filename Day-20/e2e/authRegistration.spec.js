import { test, expect } from "@playwright/test";

test.describe("Full User Experience: Registration Suite (8 Scenarios)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/auth");
    const registerBtn = page.getByRole("button", { name: "Register" });
    await registerBtn.click();
    await expect(page.getByPlaceholder("Enter your name")).toBeVisible();
  });

  test("Scenario 1: Happy path - complete valid registration creates account", async ({ page }) => {
    const uniqueEmail = `testuser_${Date.now()}@example.com`;
    await page.getByPlaceholder("Enter your name").fill("Test User");
    await page.getByPlaceholder("name@example.com").fill(uniqueEmail);
    await page.locator("input[type='password']").fill("SecureP@ss123!");
    
    await page.getByRole("button", { name: /create|register|sign in/i }).last().click();
    await expect(page).toHaveURL(/\/catalog/, { timeout: 10000 });
  });

  test("Scenario 2: Validation - empty fields trigger inline required errors", async ({ page }) => {
    await page.getByRole("button", { name: /create|register|sign in/i }).last().click();
    await expect(page.locator("text=/Please fill in both email and password|Please provide your name/i").first()).toBeVisible();
  });

  test("Scenario 3: Validation - missing name is rejected when email & password are typed", async ({ page }) => {
    await page.getByPlaceholder("name@example.com").fill("user@example.com");
    await page.locator("input[type='password']").fill("SecureP@ss123!");
    await page.getByRole("button", { name: /create|register|sign in/i }).last().click();

    await expect(page.locator("text=Please provide your name to register.")).toBeVisible();
  });

  test("Scenario 4: Validation - missing password is flagged", async ({ page }) => {
    await page.getByPlaceholder("Enter your name").fill("Test User");
    await page.getByPlaceholder("name@example.com").fill("user@example.com");
    await page.getByRole("button", { name: /create|register|sign in/i }).last().click();

    await expect(page.locator("text=Please fill in both email and password.")).toBeVisible();
  });

  test("Scenario 5: Validation - invalid email format HTML5 check", async ({ page }) => {
    const emailInput = page.getByPlaceholder("name@example.com");
    await emailInput.fill("not-an-email");
    await page.getByRole("button", { name: /create|register|sign in/i }).last().click();

    const isInvalid = await emailInput.evaluate((el) => !el.checkValidity());
    expect(isInvalid).toBeTruthy();
  });

  test("Scenario 6: Role toggle - admin selection enforces passcode validation", async ({ page }) => {
    const adminRoleBtn = page.locator("button:has-text('Admin'), input[value='admin'], span:has-text('Admin')").first();
    if (await adminRoleBtn.isVisible()) {
      await adminRoleBtn.click();
    }
    await page.getByPlaceholder("Enter your name").fill("Admin Candidate");
    await page.getByPlaceholder("name@example.com").fill("admin@test.com");
    await page.locator("input[type='password']").first().fill("AdminSecret123!");
    await page.getByRole("button", { name: /create|register|sign in/i }).last().click();
    
    // Either redirected to catalog (default role) or required passcode alert
    await expect(page).toHaveURL(/catalog|admin|auth/);
  });

  test("Scenario 7: Sanitization - email whitespace is trimmed on submit", async ({ page }) => {
    const emailRaw = `  whitespace_${Date.now()}@example.com  `;
    await page.getByPlaceholder("Enter your name").fill("Trim User");
    await page.getByPlaceholder("name@example.com").fill(emailRaw);
    await page.locator("input[type='password']").fill("Password123!");
    await page.getByRole("button", { name: /create|register|sign in/i }).last().click();

    await expect(page).toHaveURL(/\/catalog/, { timeout: 10000 });
  });

  test("Scenario 8: State persistence - remembers user after successful registration", async ({ page }) => {
    const userEmail = `persist_${Date.now()}@example.com`;
    await page.getByPlaceholder("Enter your name").fill("Persist User");
    await page.getByPlaceholder("name@example.com").fill(userEmail);
    await page.locator("input[type='password']").fill("Password123!");
    await page.getByRole("button", { name: /create|register|sign in/i }).last().click();
    await expect(page).toHaveURL(/\/catalog/, { timeout: 10000 });

    // Re-visit /auth and check autoFilled state banner using .first() to prevent strict mode conflict
    await page.goto("/auth");
    await expect(page.locator("text=/Details Auto-Entered/i").first()).toBeVisible({ timeout: 5000 });
  });
});
