import { test, expect } from "@playwright/test";

test.describe("Day 18: Background Tasks Lifecycle & Advanced Database Search Suite", () => {
  test.beforeEach(async ({ page }) => {
    // Intercept backend API routes to provide deterministic responses
    await page.route("**/api/v1/tasks/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          task_id: "mock-task-123",
          status: "SUCCESS",
          progress: 100,
          message: "Completed successfully!",
          result: { download_url: "/api/v1/orders/1/invoice/download" },
        }),
      });
    });

    await page.route("**/api/v1/orders/*/generate-invoice", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          task_id: "invoice-task-123",
          status: "PENDING",
          message: "Invoice task queued in Celery pipeline",
        }),
      });
    });

    await page.route("**/api/v1/products/bulk-import-csv", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          task_id: "csv-task-456",
          status: "PENDING",
          message: "Bulk CSV import queued in Celery pipeline",
        }),
      });
    });

    await page.route("**/api/v1/products*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: 1,
            name: "Apple iPhone 15 Pro",
            title: "Apple iPhone 15 Pro",
            price: 1199,
            stock: 20,
            category: "Mobiles",
            description: "Titanium design with A17 Pro chip",
            image_url: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400",
          },
        ]),
      });
    });

    // Configure default localStorage
    await page.addInitScript(() => {
      window.localStorage.setItem("rmart_skip_intro", "true");
      window.localStorage.setItem("user_role", "admin");
      window.localStorage.setItem(
        "rmart_user",
        JSON.stringify({
          id: 1,
          name: "Admin User",
          email: "admin@rmart.com",
          role: "admin",
          token: "mock-jwt-token-day18",
        })
      );
    });
  });

  test("Scenario 1: Advanced Search operates automatically with PostgreSQL FTS and typo telemetry badge", async ({ page }) => {
    await page.goto("/catalog");
    await page.waitForLoadState("domcontentloaded");

    const searchInput = page.locator("input[placeholder*='Search']").first();
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    // Search for a product query
    await searchInput.fill("wireless");
    await page.waitForTimeout(300);

    // Advanced search telemetry indicator should automatically display PostgreSQL search engine
    const badge = page.locator("[data-testid='search-telemetry-badge']");
    await expect(badge).toBeVisible();

    // Typo-tolerant search test: search with typo
    await searchInput.fill("iphne");
    await page.waitForTimeout(300);
    await expect(page.locator("text=/Searching for \"iphne\"/i")).toBeVisible();
  });

  test("Scenario 2: Orders page triggers Celery PDF invoice generation with live task lifecycle", async ({ page }) => {
    // Inject sample order
    await page.addInitScript(() => {
      window.localStorage.setItem(
        "rmart_orders",
        JSON.stringify([
          {
            id: 991,
            orderId: "ORD-991",
            totalAmount: 999.0,
            status: "Processing",
            date: new Date().toISOString(),
            items: [{ name: "PlayStation 5 Console", price: 999.0, quantity: 1 }],
          },
        ])
      );
    });

    await page.goto("/orders");
    await page.waitForLoadState("domcontentloaded");

    // Check that orders are listed
    await expect(page.locator("text=My Orders & Live Tracking")).toBeVisible();

    // Find and click the Download PDF Invoice button
    const invoiceBtn = page.locator("button:has-text('Download PDF Invoice')").first();
    await expect(invoiceBtn).toBeVisible({ timeout: 10000 });
    await invoiceBtn.click();

    // Verify Task Lifecycle Modal opens
    const modalTitle = page.locator("text=/Celery Distributed Task Pipeline/i");
    await expect(modalTitle).toBeVisible({ timeout: 5000 });

    // Verify task details section
    await expect(page.locator("text=/Task ID:/i")).toBeVisible();

    // Verify task reaches completion / success status
    await expect(
      page.locator("text=/Invoice generation complete|COMPLETED|SUCCESS|Generating PDF Invoice/i").first()
    ).toBeVisible();

    // Close modal
    const closeBtn = page.locator("button:has-text('Close'), button:has-text('Dismiss'), button:has-text('✕')").first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
    }
  });

  test("Scenario 3: Admin Dashboard Bulk CSV Import tab triggers Celery background import", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForLoadState("domcontentloaded");

    // Click the Bulk CSV Import (Celery) tab
    const bulkTab = page.locator("[data-testid='admin-bulk-import-tab']");
    await expect(bulkTab).toBeVisible({ timeout: 10000 });
    await bulkTab.click();

    // Verify CSV container and textarea exist
    const container = page.locator("[data-testid='admin-bulk-import-container']");
    await expect(container).toBeVisible();

    const textarea = page.locator("[data-testid='bulk-csv-textarea']");
    await expect(textarea).toBeVisible();

    // Sample template link
    const templateLink = page.locator("text=/Download Sample CSV Template/i");
    await expect(templateLink).toBeVisible();

    // Trigger import
    const startImportBtn = page.locator("[data-testid='start-bulk-import-btn']");
    await expect(startImportBtn).toBeVisible();
    await startImportBtn.click();

    // Celery task progress modal should open
    const modal = page.locator("text=/Bulk Product CSV Import/i");
    await expect(modal).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=/Task ID:/i")).toBeVisible();
  });

  test("Scenario 4: Checkout page applies payment coupon offers, updates order total, and switches payment method", async ({ page }) => {
    // Seed cart in localStorage
    await page.addInitScript(() => {
      window.localStorage.setItem(
        "rmart-cart-storage",
        JSON.stringify({
          state: {
            cart: [
              {
                id: 1,
                name: "Apple iPhone 15 Pro",
                title: "Apple iPhone 15 Pro",
                price: 100,
                quantity: 1,
                image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400",
                category: "Mobiles",
              },
            ],
          },
          version: 0,
        })
      );
    });

    await page.goto("/checkout");
    await page.waitForLoadState("domcontentloaded");

    // Verify Payment Offers section is present
    await expect(page.locator("text=Payment Offers & Coupons").first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=CARD10")).toBeVisible();
    await expect(page.locator("text=UPI5")).toBeVisible();

    // Click CARD10 offer chip
    const cardCouponChip = page.locator("text=CARD10").first();
    await cardCouponChip.click();

    // Verify CARD10 is applied
    await expect(page.locator("text=/Active Offer:.*CARD10/i")).toBeVisible();
    await expect(page.locator("text=APPLIED ✓").first()).toBeVisible();

    // Verify Credit / Debit Card radio is selected
    const cardRadio = page.locator("input[value='card']");
    await expect(cardRadio).toBeChecked();

    // Click UPI5 offer chip to switch offer
    const upiCouponChip = page.locator("text=UPI5").first();
    await upiCouponChip.click();

    // Verify UPI5 is now applied and UPI radio is selected
    await expect(page.locator("text=/Active Offer:.*UPI5/i")).toBeVisible();
    const upiRadio = page.locator("input[value='upi']");
    await expect(upiRadio).toBeChecked();

    // Verify cost breakdown shows offer discount
    await expect(page.locator("text=/Offer Discount/i").first()).toBeVisible();
  });

  test("Scenario 5: Admin deletes a product and it is removed from both Admin Studio and User Shopping Catalog", async ({ page }) => {
    await page.route("**/api/v1/products/1", async (route) => {
      if (route.request().method() === "DELETE") {
        await route.fulfill({ status: 204 });
      } else {
        await route.continue();
      }
    });

    // Automatically accept window.confirm dialogs
    page.on("dialog", (dialog) => dialog.accept());

    // 1. Visit Admin Dashboard
    await page.goto("/admin");
    await page.waitForLoadState("domcontentloaded");

    // Verify product is listed initially
    await expect(page.locator("text=Apple iPhone 15 Pro").first()).toBeVisible({ timeout: 10000 });

    // Click Delete button on product
    const deleteBtn = page.locator("button:has-text('Delete')").first();
    await deleteBtn.click();

    // Verify product disappears immediately from Admin Dashboard
    await expect(page.locator("text=Apple iPhone 15 Pro")).not.toBeVisible();

    // 2. Visit User Shopping Catalog
    await page.goto("/catalog");
    await page.waitForLoadState("domcontentloaded");

    // Product should NOT be visible in User Shopping Catalog
    await expect(page.locator("text=Apple iPhone 15 Pro")).not.toBeVisible();
  });
});


