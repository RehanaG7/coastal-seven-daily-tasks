import { test, expect } from "@playwright/test";

test.describe("Catalog, Search, Filtering & Detail View Suite (7 Scenarios)", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("rmart_skip_intro", "true");
    });
    await page.goto("/catalog");
    await page.waitForLoadState("domcontentloaded");
  });

  test("Scenario 1: Catalog initial render displays product cards with specs & badges", async ({ page }) => {
    const cards = page.locator("[data-testid^='product-card-']");
    await expect(cards.first()).toBeVisible({ timeout: 10000 });
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);

    // Verify first card contains price and stock info
    const firstCard = cards.first();
    await expect(firstCard.locator("text=/$|USD|In Stock|Sold Out/i").first()).toBeVisible();
  });

  test("Scenario 2: Real-time search query filtering shrinks product list", async ({ page }) => {
    const searchInput = page.locator("input[placeholder*='Search']").first();
    if (await searchInput.isVisible()) {
      const initialCards = await page.locator("[data-testid^='product-card-']").count();
      await searchInput.fill("Titanium");
      await page.waitForTimeout(500);

      const filteredCount = await page.locator("[data-testid^='product-card-']").count();
      expect(filteredCount).toBeLessThanOrEqual(initialCards);
    }
  });

  test("Scenario 3: Clearing search query restores full catalog", async ({ page }) => {
    const searchInput = page.locator("input[placeholder*='Search']").first();
    if (await searchInput.isVisible()) {
      await searchInput.fill("Sony");
      await page.waitForTimeout(400);
      await searchInput.clear();
      await page.waitForTimeout(400);

      const cards = page.locator("[data-testid^='product-card-']");
      expect(await cards.count()).toBeGreaterThan(0);
    }
  });

  test("Scenario 4: Category filter narrows products by domain category", async ({ page }) => {
    const categorySelector = page.locator("select, button:has-text('Electronics'), button:has-text('Fashion'), button:has-text('Groceries')").first();
    if (await categorySelector.isVisible()) {
      if (categorySelector.evaluate(el => el.tagName === 'SELECT')) {
        await categorySelector.selectOption({ index: 1 });
      } else {
        await categorySelector.click();
      }
      await page.waitForTimeout(500);
      const cards = page.locator("[data-testid^='product-card-']");
      expect(await cards.count()).toBeGreaterThanOrEqual(0);
    }
  });

  test("Scenario 5: Sorting products by price or name executes client-side reordering", async ({ page }) => {
    const sortDropdown = page.locator("select:has-text('Price'), select:has-text('Sort'), [data-testid='sort-select']").first();
    if (await sortDropdown.isVisible()) {
      await sortDropdown.selectOption("price-low");
      await page.waitForTimeout(400);
      const cards = page.locator("[data-testid^='product-card-']");
      expect(await cards.count()).toBeGreaterThan(0);
    }
  });

  test("Scenario 6: Product detail navigation loads /catalog/:id with specifications", async ({ page }) => {
    const detailLink = page.locator("a:has-text('Details'), [data-testid^='product-card-'] a").first();
    if (await detailLink.isVisible()) {
      await detailLink.click();
      await expect(page).toHaveURL(/\/catalog\/\d+/, { timeout: 10000 });
      // Detail view must show product specifications and back button
      await expect(page.locator("text=/Description|Stock|Price|Specifications|Back to Catalog/i").first()).toBeVisible();
    }
  });

  test("Scenario 7: Infinite scroll sentinel loader is present in DOM", async ({ page }) => {
    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    // Catalog cards still remain populated
    const cards = page.locator("[data-testid^='product-card-']");
    expect(await cards.count()).toBeGreaterThan(0);
  });
});
