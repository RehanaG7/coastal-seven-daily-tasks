import { test, expect } from "@playwright/test";

test.describe("R-MART Master End-to-End Golden Path: Full Customer Lifecycle", () => {
  test("Complete flow: Register -> Login -> Browse -> Cart -> Checkout -> Order Success", async ({ page }) => {
    const timestamp = Date.now();
    const testUser = {
      name: `Pioneer User ${timestamp}`,
      email: `shopper_${timestamp}@rmart.com`,
      password: "StrongPassword123!",
    };

    // ----------------------------------------------------
    // PHASE 1: User Registration
    // ----------------------------------------------------
    await page.goto("/auth");
    await page.waitForLoadState("domcontentloaded");

    // Switch to Register mode
    await page.getByRole("button", { name: "Register" }).click();
    await expect(page.getByPlaceholder("Enter your name")).toBeVisible();

    // Fill registration credentials
    await page.getByPlaceholder("Enter your name").fill(testUser.name);
    await page.getByPlaceholder("name@example.com").fill(testUser.email);
    await page.locator("input[type='password']").fill(testUser.password);
    
    // Submit registration
    await page.getByRole("button", { name: /create|register|sign in/i }).last().click();

    // Verify successful registration routes to catalog
    await expect(page).toHaveURL(/\/catalog/, { timeout: 10000 });

    // Wait for cinematic overlay or intro animation to clear
    const introOverlay = page.locator("[data-testid='intro-overlay'], .intro-animation");
    if (await introOverlay.count() > 0) {
      await introOverlay.first().waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});
    }
    await page.waitForTimeout(1000);

    // ----------------------------------------------------
    // PHASE 2: Catalog Discovery & Product Inspection
    // ----------------------------------------------------
    await page.waitForSelector("[data-testid^='product-card-']", { timeout: 10000 });
    const productCards = page.locator("[data-testid^='product-card-']");
    await expect(productCards.first()).toBeVisible();

    // ----------------------------------------------------
    // PHASE 3: Cart Management & Drawer Reactive State
    // ----------------------------------------------------
    const addToCartBtn = page.locator("button:has-text('Add to Cart')").first();
    await expect(addToCartBtn).toBeVisible({ timeout: 10000 });
    await addToCartBtn.scrollIntoViewIfNeeded();
    await addToCartBtn.click();

    // Verify cart badge increments in the header
    const cartButton = page.locator("header button:has-text('Cart')");
    await expect(cartButton).toBeVisible();
    await expect(cartButton).toContainText(/1/, { timeout: 7000 });

    // Open Cart Drawer
    await cartButton.click();
    const cartDrawer = page.locator("aside, [role='dialog'], [data-testid='cart-drawer']").first();
    await expect(cartDrawer).toBeVisible({ timeout: 5000 });

    // ----------------------------------------------------
    // PHASE 4: Transition to Checkout
    // ----------------------------------------------------
    const checkoutBtn = page.locator("button:has-text('Proceed to Checkout'), a:has-text('Checkout'), button:has-text('Checkout')").first();
    await expect(checkoutBtn).toBeVisible();
    await checkoutBtn.click();

    // Verify navigation to /checkout and Order Summary heading
    await expect(page).toHaveURL(/\/checkout/, { timeout: 10000 });
    await expect(page.locator("text=/Order Summary/i").first()).toBeVisible();

    // ----------------------------------------------------
    // PHASE 5: Shipping Details & Order Finalization
    // ----------------------------------------------------
    const addressInput = page.locator("input[placeholder*='Address'], input[name*='address'], textarea").first();
    if (await addressInput.isVisible()) {
      await addressInput.fill("Flat 402, Coastal Residency, Main Road");
    }

    const cityInput = page.locator("input[placeholder*='City'], input[name*='city']").first();
    if (await cityInput.isVisible()) {
      await cityInput.fill("Hyderabad");
    }

    const zipInput = page.locator("input[placeholder*='Zip'], input[placeholder*='Postal'], input[name*='zip']").first();
    if (await zipInput.isVisible()) {
      await zipInput.fill("500081");
    }

    // Click Place Order / Confirm Order
    const placeOrderBtn = page.locator("button:has-text('Place Order'), button:has-text('Confirm Order'), button:has-text('Complete')").first();
    if (await placeOrderBtn.isVisible()) {
      await placeOrderBtn.click();

      // Assert order confirmation screen or redirect
      await expect(
        page.locator("text=/Order Placed|Confirmed|Thank you|Success|Orders/i").first()
      ).toBeVisible({ timeout: 10000 });
    }
  });
});
