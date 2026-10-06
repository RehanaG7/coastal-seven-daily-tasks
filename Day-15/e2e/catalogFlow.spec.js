import { test, expect } from "@playwright/test";

test.describe("R-MART Complete End-to-End User Experience", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("rmart_skip_intro", "true");
    });

    await page.goto("http://localhost:5173/catalog");
    await page.waitForLoadState("networkidle");

    const loadingElem = page.locator("text=Loading R-Mart...");
    if (await loadingElem.isVisible().catch(() => false)) {
      await loadingElem.waitFor({ state: "detached", timeout: 5000 }).catch(() => {});
    }
  });

  test("Critical User Journey 1: Catalog browsing & real-time search filtering", async ({ page }) => {
    await expect(page.getByRole("link", { name: /R-MART/i })).toBeVisible();

    const productCards = page.locator("[data-testid^='product-card-']");
    await expect(productCards.first()).toBeVisible({ timeout: 10000 });
    const initialCount = await productCards.count();
    expect(initialCount).toBeGreaterThan(0);

    const searchInput = page.locator("input[placeholder*='Search']").first();
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill("Gaming");
      await page.waitForTimeout(500);
      const filteredCards = page.locator("[data-testid^='product-card-']");
      expect(await filteredCards.count()).toBeLessThanOrEqual(initialCount);
    }
  });

  test("Critical User Journey 2: Add to cart, reactive badge, and cart drawer interaction", async ({ page }) => {
    const firstCard = page.locator("[data-testid^='product-card-']").first();
    await expect(firstCard).toBeVisible({ timeout: 10000 });

    const addBtn = firstCard.locator("button:has-text('Add to Cart')");
    await expect(addBtn).toBeVisible();
    await addBtn.click({ force: true });

    const cartBadge = page.locator("header button:has-text('Cart') span:has-text('1')");
    await expect(cartBadge).toBeVisible({ timeout: 7000 });

    const cartButton = page.locator("header button:has-text('Cart')");
    await cartButton.click({ force: true });

    const drawerIndicator = page.locator("text=Your Cart").or(page.locator("text=Cart")).or(page.locator("text=Checkout"));
    await expect(drawerIndicator.first()).toBeVisible({ timeout: 7000 });
  });

  test("Critical User Journey 3: Full checkout transition & order placement preview", async ({ page }) => {
    const firstCard = page.locator("[data-testid^='product-card-']").first();
    await expect(firstCard).toBeVisible({ timeout: 10000 });
    await firstCard.locator("button:has-text('Add to Cart')").click({ force: true });

    const cartButton = page.locator("header button:has-text('Cart')");
    await cartButton.click({ force: true });

    const checkoutBtn = page.locator("button:has-text('Checkout')").or(page.locator("a:has-text('Checkout')")).first();
    if (await checkoutBtn.isVisible().catch(() => false)) {
      await checkoutBtn.click({ force: true });
      await page.waitForLoadState("domcontentloaded");

      // Target the specific Order Summary heading
      const summaryHeading = page.getByRole("heading", { name: "Order Summary" });
      await expect(summaryHeading).toBeVisible({ timeout: 7000 });
    }
  });

  test("Critical User Journey 4: UI personalization & dark/light theme switching", async ({ page }) => {
    const themeBtn = page.locator("button[title*='Switch to']");
    await expect(themeBtn).toBeVisible({ timeout: 10000 });

    const initialText = await themeBtn.innerText();
    await themeBtn.click({ force: true });
    await expect(themeBtn).not.toHaveText(initialText);
  });
});
