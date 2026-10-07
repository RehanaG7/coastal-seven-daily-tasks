import { test, expect } from "@playwright/test";

test.describe("Day 17: Full-Stack Integration & Real-Time Features Suite (6 Scenarios)", () => {
  test.beforeEach(async ({ page }) => {
    // Configure default customer state
    await page.addInitScript(() => {
      window.localStorage.setItem("rmart_skip_intro", "true");
      window.localStorage.setItem(
        "rmart_user",
        JSON.stringify({
          name: "Siddharth Verma",
          email: "customer@rmart.com",
          role: "customer",
          token: "jwt_token_day17_sample",
        })
      );
    });
  });

  test("Scenario 1: Real-time Notifications Panel opens from Header and displays status", async ({ page }) => {
    await page.goto("/catalog");
    await page.waitForLoadState("domcontentloaded");

    // Click Notification Bell in Header
    const notifBtn = page.locator("header button:has-text('🔔')");
    await expect(notifBtn).toBeVisible({ timeout: 10000 });
    await notifBtn.click();

    // Notifications panel should be visible
    const panel = page.locator("[data-testid='notifications-panel']");
    await expect(panel).toBeVisible({ timeout: 6000 });
    await expect(panel.locator("text=/Notifications|Live Feed/i").first()).toBeVisible();

    // Click Clear All Notifications
    const clearBtn = panel.locator("button:has-text('Clear All Notifications')").first();
    if (await clearBtn.isVisible()) {
      await clearBtn.click();
      await page.waitForTimeout(300);
      // Verify empty state is displayed
      await expect(panel.locator("text=/All caught up|No notifications/i").first()).toBeVisible();
    }

    // Close panel
    const closeBtn = panel.locator("button:has-text('✕')").first();
    await closeBtn.click();
    await expect(panel).not.toBeVisible({ timeout: 5000 });

    // Verify header badge reflects 0
    const badge = page.locator("[data-testid='notification-badge-count']");
    await expect(badge).toHaveText("0");
  });

  test("Scenario 2: Live Support Chat Modal opens from Header Chat button and sends customer message", async ({ page }) => {
    await page.goto("/catalog");
    await page.waitForLoadState("domcontentloaded");

    // Click Chat button
    const chatBtn = page.locator("[data-testid='live-chat-toggle-btn']");
    await expect(chatBtn).toBeVisible({ timeout: 10000 });
    await chatBtn.click();

    // Verify modal and presence badge are visible
    const chatModal = page.locator("[data-testid='live-chat-modal']");
    await expect(chatModal).toBeVisible({ timeout: 6000 });
    await expect(chatModal.locator("[data-testid='admin-presence-badge']")).toBeVisible();

    // Type a message in chat input
    const chatInput = page.locator("[data-testid='chat-input']");
    await chatInput.fill("Hi, I have a question regarding fast express delivery!");

    // Click Send
    const sendBtn = page.locator("[data-testid='chat-send-btn']");
    await expect(sendBtn).toBeEnabled();
    await sendBtn.click();

    // Verify message appears in chat thread without duplicate (count is exactly 1)
    const userMsg = chatModal.locator("text=Hi, I have a question regarding fast express delivery!");
    await expect(userMsg).toBeVisible();
    await expect(userMsg).toHaveCount(1);

    // Verify user receives instant reply from Admin Support / Concierge
    await expect(
      chatModal.locator("text=/express|Orders page|Support|Concierge|checking/i").last()
    ).toBeVisible({ timeout: 8000 });

    // Close modal
    const closeBtn = chatModal.locator("button:has-text('✕')").first();
    await closeBtn.click();
    await expect(chatModal).not.toBeVisible({ timeout: 5000 });
  });

  test("Scenario 3: Admin Dashboard Live Support tab displays live support console", async ({ page }) => {
    // Authenticate as Admin
    await page.addInitScript(() => {
      window.localStorage.setItem("user_role", "admin");
      window.localStorage.setItem(
        "rmart_user",
        JSON.stringify({
          name: "System Admin",
          email: "admin@rmart.com",
          role: "admin",
          token: "jwt_admin_token_sample",
        })
      );
    });

    await page.goto("/admin");
    await page.waitForLoadState("domcontentloaded");

    // Click Live Support & Chat tab
    const liveSupportTab = page.locator("[data-testid='admin-live-support-tab']");
    await expect(liveSupportTab).toBeVisible({ timeout: 10000 });
    await liveSupportTab.click();

    // Verify Live Support panel rendered
    const supportPanel = page.locator("[data-testid='admin-live-support-panel']");
    await expect(supportPanel).toBeVisible({ timeout: 6000 });
    await expect(supportPanel.locator("text=/Real-Time Customer Concierge Desk|Bi-directional WebSockets/i").first()).toBeVisible();
  });

  test("Scenario 4: Admin Broadcast Flash Sale triggers announcement broadcast", async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("user_role", "admin");
      window.localStorage.setItem(
        "rmart_user",
        JSON.stringify({
          name: "System Admin",
          email: "admin@rmart.com",
          role: "admin",
          token: "jwt_admin_token_sample",
        })
      );
    });

    await page.goto("/admin");
    await page.waitForLoadState("domcontentloaded");

    const liveSupportTab = page.locator("[data-testid='admin-live-support-tab']");
    await liveSupportTab.click();

    // Click Broadcast Flash Sale button
    const broadcastBtn = page.locator("[data-testid='broadcast-flash-btn']");
    await expect(broadcastBtn).toBeVisible({ timeout: 6000 });
    await broadcastBtn.click();

    // Check broadcast confirmation message
    await expect(page.locator("text=/Broadcast sent successfully|Flash Sale/i").first()).toBeVisible({ timeout: 6000 });
  });

  test("Scenario 5: Live Order Tracker Modal opens and connects to order stream", async ({ page }) => {
    // Seed an order into localStorage
    await page.addInitScript(() => {
      window.localStorage.setItem(
        "rmart_orders",
        JSON.stringify([
          {
            id: 101,
            orderId: "ORD-101",
            fullName: "Siddharth Verma",
            email: "customer@rmart.com",
            address: "Plot 42 Cyber Valley",
            city: "Hyderabad",
            postalCode: "500081",
            totalAmount: 149.99,
            status: "PROCESSING",
            paymentMethod: "Credit Card",
            items: [
              {
                id: 1,
                name: "Mechanical Keyboard",
                price: 149.99,
                quantity: 1,
              },
            ],
          },
        ])
      );
    });

    await page.goto("/orders");
    await page.waitForLoadState("domcontentloaded");

    // Verify order card is rendered
    await expect(page.locator("text=#ORD-101").first()).toBeVisible({ timeout: 10000 });

    // Click Track Live Telemetry button
    const trackBtn = page.locator("button:has-text('Track Live Telemetry')").first();
    await expect(trackBtn).toBeVisible();
    await trackBtn.click();

    // Verify Order Tracker modal opens
    const trackerModal = page.locator("[data-testid='order-tracker-modal']");
    await expect(trackerModal).toBeVisible({ timeout: 6000 });
    await expect(trackerModal.locator("text=/Live Order Tracking Telemetry|Celery Background Worker/i").first()).toBeVisible();

    // Close tracker modal
    const closeBtn = trackerModal.locator("button:has-text('✕')").first();
    await closeBtn.click();
    await expect(trackerModal).not.toBeVisible({ timeout: 5000 });
  });

  test("Scenario 6: End-to-End Real-Time Journey - Catalog -> Cart -> Checkout -> Tracker", async ({ page }) => {
    await page.goto("/catalog");
    await page.waitForLoadState("domcontentloaded");

    // 1. Add product to cart
    const addBtn = page.locator("button:has-text('Add to Cart')").first();
    await expect(addBtn).toBeVisible({ timeout: 10000 });
    await addBtn.click();

    // 2. Open Cart drawer
    const cartBtn = page.locator("header button:has-text('Cart')");
    await cartBtn.click();

    // 3. Navigate to Checkout
    const checkoutLink = page.locator("button:has-text('Proceed to Checkout'), a:has-text('Proceed to Checkout')").first();
    await expect(checkoutLink).toBeVisible({ timeout: 6000 });
    await checkoutLink.click();
    await expect(page).toHaveURL(/checkout/);

    // 4. Fill required checkout details
    await page.fill("input[name='fullName']", "Aditya Rao");
    await page.fill("input[name='email']", "aditya@example.com");
    await page.fill("input[name='address']", "404 Tech Boulevard");
    await page.fill("input[name='city']", "Bengaluru");
    await page.fill("input[name='postalCode']", "560001");

    // Select COD or payment method
    const paymentRadio = page.locator("input[value='cod'], input[value='cash'], label:has-text('Cash on Delivery')").first();
    if (await paymentRadio.isVisible()) {
      await paymentRadio.click();
    }

    // Submit Order
    const placeOrderBtn = page.locator("button:has-text('Place Order'), button:has-text('Complete Purchase')").first();
    await expect(placeOrderBtn).toBeEnabled();
    await placeOrderBtn.click();

    // Confirmation page / modal should appear
    await expect(page.locator("text=/Order Placed Successfully|Thank you for your order|Order Confirmed/i").first()).toBeVisible({ timeout: 12000 });
  });
});
