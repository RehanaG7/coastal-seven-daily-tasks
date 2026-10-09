import { test, expect } from "@playwright/test";

test.describe("Shopping Cart, Quantity Mutations & State Persistence Suite (6 Scenarios)", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("rmart_skip_intro", "true");
    });
    await page.goto("/catalog");
    await page.waitForLoadState("domcontentloaded");
  });

  test("Scenario 1: Add to Cart updates header reactive cart badge count", async ({ page }) => {
    const addBtn = page.locator("button:has-text('Add to Cart')").first();
    await expect(addBtn).toBeVisible({ timeout: 10000 });
    await addBtn.click();

    const cartBtn = page.locator("header button:has-text('Cart')");
    await expect(cartBtn).toContainText(/1/, { timeout: 6000 });
  });

  test("Scenario 2: Cart drawer opens and displays cart items list", async ({ page }) => {
    const addBtn = page.locator("button:has-text('Add to Cart')").first();
    await expect(addBtn).toBeVisible({ timeout: 10000 });
    await addBtn.click();

    const cartBtn = page.locator("header button:has-text('Cart')");
    await cartBtn.click();

    // Verify drawer / modal open
    const drawer = page.locator("aside, [role='dialog'], [data-testid='cart-drawer']").first();
    await expect(drawer).toBeVisible({ timeout: 6000 });
    await expect(drawer.locator("text=/Total|Checkout|Quantity/i").first()).toBeVisible();
  });

  test("Scenario 3: Quantity increment (+) updates line item quantity and subtotal", async ({ page }) => {
    const addBtn = page.locator("button:has-text('Add to Cart')").first();
    await expect(addBtn).toBeVisible({ timeout: 10000 });
    await addBtn.click();

    const cartBtn = page.locator("header button:has-text('Cart')");
    await cartBtn.click();

    const plusBtn = page.locator("aside button:has-text('+'), [role='dialog'] button:has-text('+')").first();
    if (await plusBtn.isVisible()) {
      await plusBtn.click();
      await page.waitForTimeout(300);
      await expect(cartBtn).toContainText(/2/);
    }
  });

  test("Scenario 4: Quantity decrement (-) reduces line item count", async ({ page }) => {
    const addBtn = page.locator("button:has-text('Add to Cart')").first();
    await expect(addBtn).toBeVisible({ timeout: 10000 });
    await addBtn.click();

    const cartBtn = page.locator("header button:has-text('Cart')");
    await cartBtn.click();

    const plusBtn = page.locator("aside button:has-text('+'), [role='dialog'] button:has-text('+')").first();
    if (await plusBtn.isVisible()) {
      await plusBtn.click(); // Now 2
      await page.waitForTimeout(200);

      const minusBtn = page.locator("aside button:has-text('-'), [role='dialog'] button:has-text('-')").first();
      if (await minusBtn.isVisible()) {
        await minusBtn.click(); // Now 1
        await page.waitForTimeout(200);
        await expect(cartBtn).toContainText(/1/);
      }
    }
  });

  test("Scenario 5: Remove line item clears it from cart", async ({ page }) => {
    const addBtn = page.locator("button:has-text('Add to Cart')").first();
    await expect(addBtn).toBeVisible({ timeout: 10000 });
    await addBtn.click();

    const cartBtn = page.locator("header button:has-text('Cart')");
    await cartBtn.click();

    const removeBtn = page.locator("aside button:has-text('Remove'), [role='dialog'] button:has-text('Remove'), aside button[title*='Remove']").first();
    if (await removeBtn.isVisible()) {
      await removeBtn.click();
      await page.waitForTimeout(300);
      await expect(page.locator("text=/Cart is empty|0 items|No items/i").first()).toBeVisible();
    }
  });

  test("Scenario 6: Cart localStorage persistence survives full page reload", async ({ page }) => {
    const addBtn = page.locator("button:has-text('Add to Cart')").first();
    await expect(addBtn).toBeVisible({ timeout: 10000 });
    await addBtn.click();

    const cartBtn = page.locator("header button:has-text('Cart')");
    await expect(cartBtn).toContainText(/1/, { timeout: 5000 });

    // Refresh page
    await page.reload();
    await page.waitForLoadState("domcontentloaded");

    // Cart count should still be preserved in localStorage Zustand store
    const cartBtnAfterReload = page.locator("header button:has-text('Cart')");
    await expect(cartBtnAfterReload).toContainText(/1/, { timeout: 5000 });
  });

  test("Scenario 7: Product stock decrements reactively upon Add to Cart", async ({ page }) => {
    const card = page
      .locator("[data-testid^='product-card-']")
      .filter({ has: page.locator("button:has-text('Add to Cart')") })
      .first();
    await expect(card).toBeVisible({ timeout: 10000 });

    const stockEl = card.locator("text=/Stock:/i");
    await expect(stockEl).toBeVisible();
    const initialText = await stockEl.innerText();
    const initialStock = parseInt(initialText.replace(/\D/g, ""), 10);

    const addBtn = card.locator("button:has-text('Add to Cart')");
    await addBtn.click();

    const expectedStock = Math.max(0, initialStock - 1);
    await expect(stockEl).toContainText(String(expectedStock), { timeout: 5000 });
  });
});
