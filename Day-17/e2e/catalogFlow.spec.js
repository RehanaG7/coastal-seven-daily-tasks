import { test, expect } from "@playwright/test";

test.describe("R-MART Complete End-to-End User Experience", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/catalog");
    await page.waitForLoadState("domcontentloaded");
  });

  test("Critical User Journey 1: Catalog browsing & real-time search filtering", async ({ page }) => {
    await expect(page.getByRole("link", { name: /R-MART/i })).toBeVisible();

    const productCards = page.locator("[data-testid^='product-card-']");
    await expect(productCards.first()).toBeVisible({ timeout: 10000 });

    const searchInput = page.locator("input[placeholder*='Search']");
    if (await searchInput.isVisible()) {
      await searchInput.fill("Gaming");
      await page.waitForTimeout(300);
      const filteredCards = page.locator("[data-testid^='product-card-']");
      const count = await filteredCards.count();
      expect(count).toBeGreaterThanOrEqual(1);
    }
  });

  test("Critical User Journey 2: Add to cart, reactive badge, and cart drawer interaction", async ({ page }) => {
    const addBtn = page.locator("button:has-text('Add to Cart')").first();
    await expect(addBtn).toBeVisible({ timeout: 15000 });
    await addBtn.click({ force: true });

    const cartBadge = page.locator("header button:has-text('Cart')");
    await expect(cartBadge).toBeVisible();
    await expect(cartBadge).toContainText(/1/);

    await cartBadge.click();
    const cartDrawer = page.locator("aside, [role='dialog'], [data-testid='cart-drawer']").first();
    await expect(cartDrawer).toBeVisible({ timeout: 5000 });
  });

  test("Critical User Journey 3: Full checkout transition & order placement preview", async ({ page }) => {
    const addBtn = page.locator("button:has-text('Add to Cart')").first();
    await expect(addBtn).toBeVisible({ timeout: 15000 });
    await addBtn.click({ force: true });

    const cartButton = page.locator("header button:has-text('Cart')");
    await cartButton.click();

    const checkoutBtn = page.locator("button:has-text('Proceed to Checkout'), a:has-text('Checkout'), button:has-text('Checkout')").first();
    await expect(checkoutBtn).toBeVisible();
    await checkoutBtn.click();

    await page.waitForURL(/\/checkout/, { timeout: 7000 });
    await expect(page.getByRole("heading", { name: "Order Summary" })).toBeVisible({ timeout: 5000 });
  });

  test("Critical User Journey 4: UI personalization & dark/light theme switching", async ({ page }) => {
    const themeBtn = page.locator("button[title*='Switch to']");
    await expect(themeBtn).toBeVisible({ timeout: 10000 });

    const initialText = await themeBtn.innerText();
    await themeBtn.click({ force: true });
    await page.waitForTimeout(300);

    const updatedText = await themeBtn.innerText();
    expect(initialText).not.toBe(updatedText);
  });
});
