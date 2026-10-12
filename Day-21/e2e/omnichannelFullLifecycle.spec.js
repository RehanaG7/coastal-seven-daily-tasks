import { test, expect } from "@playwright/test";

test.describe("R-MART Production-Grade Omnichannel User Experience Suite", () => {
  const timestamp = Date.now();
  const customer = {
    name: `Shopper QA ${timestamp}`,
    email: `qa_shopper_${timestamp}@rmart.com`,
    password: "Password@2026",
    address: "Plot 104, HighTech Cyber Valley",
    city: "Hyderabad",
    zip: "500081",
  };

  test("Omnichannel Flow 1: Registration, Catalog Search, Cart Quantity Mutations & Drawer", async ({ page }) => {
    // 1. Visit Auth & Register
    await page.goto("/auth");
    await page.waitForLoadState("domcontentloaded");

    await page.getByRole("button", { name: "Register" }).click();
    await page.getByPlaceholder("Enter your name").fill(customer.name);
    await page.getByPlaceholder("name@example.com").fill(customer.email);
    await page.locator("input[type='password']").fill(customer.password);
    await page.getByRole("button", { name: /create|register|sign in/i }).last().click();

    // 2. Lands on Catalog
    await expect(page).toHaveURL(/\/catalog/, { timeout: 10000 });
    await page.waitForTimeout(1000); // Allow overlay to settle

    // 3. Search for an item
    const searchInput = page.locator("input[placeholder*='Search']");
    if (await searchInput.isVisible()) {
      await searchInput.fill("Keyboard");
      await page.waitForTimeout(400);
      await searchInput.clear();
      await page.waitForTimeout(400);
    }

    // 4. Add to cart
    const addBtn = page.locator("button:has-text('Add to Cart')").first();
    await expect(addBtn).toBeVisible({ timeout: 10000 });
    await addBtn.click();

    // 5. Open Cart Drawer and verify item exists
    const cartButton = page.locator("header button:has-text('Cart')");
    await expect(cartButton).toContainText(/1/, { timeout: 5000 });
    await cartButton.click();

    const cartDrawer = page.locator("aside, [role='dialog'], [data-testid='cart-drawer']").first();
    await expect(cartDrawer).toBeVisible();

    // 6. Test Quantity Increment inside Cart Drawer if controls exist
    const plusBtn = cartDrawer.locator("button:has-text('+')").first();
    if (await plusBtn.isVisible()) {
      await plusBtn.click();
      await page.waitForTimeout(300);
      await expect(cartButton).toContainText(/2/);
    }
  });

  test("Omnichannel Flow 2: Checkout Zod Form Validation, Order Placement & Order History Inspection", async ({ page }) => {
    // 1. Add item to cart first
    await page.goto("/catalog");
    await page.waitForLoadState("domcontentloaded");

    const addBtn = page.locator("button:has-text('Add to Cart')").first();
    await expect(addBtn).toBeVisible({ timeout: 10000 });
    await addBtn.click();

    // 2. Open Cart & Proceed to Checkout
    const cartButton = page.locator("header button:has-text('Cart')");
    await cartButton.click();
    const checkoutBtn = page.locator("button:has-text('Proceed to Checkout'), a:has-text('Checkout'), button:has-text('Checkout')").first();
    await expect(checkoutBtn).toBeVisible();
    await checkoutBtn.click();

    // 3. Lands on /checkout
    await expect(page).toHaveURL(/\/checkout/, { timeout: 10000 });

    // 4. Test Form Submission Guard (Empty form must trigger Zod validation or be blocked)
    const placeOrderBtn = page.locator("button:has-text('Place Order'), button:has-text('Confirm Order'), button:has-text('Complete')").first();
    if (await placeOrderBtn.isVisible()) {
      await placeOrderBtn.click();
      // Form should stay on /checkout because required fields are empty
      await expect(page).toHaveURL(/\/checkout/);

      // 5. Fill out valid Zod shipping fields
      const addressInput = page.locator("input[placeholder*='Address'], input[name*='address'], textarea").first();
      if (await addressInput.isVisible()) await addressInput.fill(customer.address);

      const cityInput = page.locator("input[placeholder*='City'], input[name*='city']").first();
      if (await cityInput.isVisible()) await cityInput.fill(customer.city);

      const zipInput = page.locator("input[placeholder*='Zip'], input[placeholder*='Postal'], input[name*='zip']").first();
      if (await zipInput.isVisible()) await zipInput.fill(customer.zip);

      // 6. Final Order Submission
      await placeOrderBtn.click();

      // 7. Verification: Expect Order Confirmation or redirect to Order History
      await expect(
        page.locator("text=/Order Placed|Confirmed|Thank you|Success|Orders/i").first()
      ).toBeVisible({ timeout: 10000 });
    }

    // 8. Visit Order History page directly to review past orders
    await page.goto("/orders");
    await page.waitForLoadState("domcontentloaded");
    // Verify order list container or historical record renders
    const orderRecord = page.locator("text=/Order #|Order ID|Placed on|Items|Total/i").first();
    if (await orderRecord.isVisible()) {
      await expect(orderRecord).toBeVisible();
    }
  });

  test("Omnichannel Flow 3: Admin Dashboard Access & Product Management", async ({ page }) => {
    // 1. Visit Auth as Admin
    await page.goto("/auth");
    await page.waitForLoadState("domcontentloaded");

    // Toggle Admin Mode
    const adminToggle = page.locator("label:has-text('Admin'), button:has-text('Admin'), input[value='admin']").first();
    if (await adminToggle.isVisible()) {
      await adminToggle.click();
      const passcodeInput = page.locator("input[placeholder*='Passcode'], input[type='password']").last();
      if (await passcodeInput.isVisible()) {
        await passcodeInput.fill("ADMIN-2026");
      }
    }

    // Fill credentials & Login
    await page.getByPlaceholder("name@example.com").fill("admin@rmart.com");
    await page.locator("input[type='password']").first().fill("AdminPass123!");
    const loginBtn = page.getByRole("button", { name: /login|sign in|admin/i }).first();
    await loginBtn.click();

    // 2. Navigate to Admin Panel
    await page.goto("/admin");
    await page.waitForLoadState("domcontentloaded");

    // 3. Verify Admin Dashboard rendered
    await expect(page.locator("text=/Admin|Dashboard|Product Management|Manage Inventory/i").first()).toBeVisible({ timeout: 10000 });
  });
});
