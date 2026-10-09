# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: checkoutAndOrders.spec.js >> Checkout, Zod Form Validation & Order Lifecycle Suite (7 Scenarios) >> Scenario 7: Live order tracker stepper modal is accessible
- Location: e2e\checkoutAndOrders.spec.js:105:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=/Live Order Tracking|Confirmed|Shipped|Out for Delivery/i').first()
Expected: visible
Timeout: 6000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('text=/Live Order Tracking|Confirmed|Shipped|Out for Delivery/i').first() with timeout 6000ms
  - waiting for locator('text=/Live Order Tracking|Confirmed|Shipped|Out for Delivery/i').first()

```

```yaml
- button "←"
- text: My Orders
- button "✕"
- button "📋 Menu"
- button "✏️ Profile"
- button "📦 Orders"
- button "🔔 Inbox"
- button "🎧 Care"
- button "❤️ Wishlist"
- text: 📦 No customer orders placed yet.
- banner:
  - link "⚡ R-MART":
    - /url: /catalog
    - text: ⚡
    - strong: R
    - text: "-MART"
  - button "🌙 Dark"
  - text: "📢 NEWS ⚡ Flash Sale: 20% OFF with code RMART20 • 🛡️ 100% Trusted Genuine Hardware • 🚀 Express Guaranteed Delivery in 24-48 Hours Across All Hubs • 24/7 Live Support Chat Active • Free Return Guarantee on All Electronics"
  - button "🔔 2"
  - button "💬 Chat"
  - button "🛒 Cart 1"
  - button "☰"
- main:
  - text: 📦
  - heading "My Orders & Live Tracking" [level=1]
  - paragraph: Real-time dispatch telemetry and Celery asynchronous delivery tracking.
  - link "← Continue Shopping":
    - /url: /catalog
  - text: 🛍️
  - heading "No Orders Placed Yet" [level=2]
  - paragraph: Your order history is currently empty. Browse our catalog with 17 product categories and place your first order!
  - button "Explore Products Catalog →"
  - text: ⚡ R - M A R T
  - paragraph: Next-generation 3D hypermarket offering verified electronics, fresh gourmet groceries, tech apparel, and home essentials with guaranteed 24-48 hour delivery.
  - text: ✓ 100% Genuine 🚀 24-48h Delivery ⏳ Pay Later (0% APR)
  - heading "TOP CATEGORIES" [level=4]
  - list:
    - listitem:
      - link "Mobiles and Electronics":
        - /url: /catalog
    - listitem:
      - link "Deals and Savings":
        - /url: /catalog
    - listitem:
      - link "Fashion":
        - /url: /catalog
    - listitem:
      - link "Home and Furniture":
        - /url: /catalog
    - listitem:
      - link "Groceries and Pet Supplies":
        - /url: /catalog
    - listitem:
      - link "Games and Live Shopping":
        - /url: /catalog
  - heading "CUSTOMER SUPPORT" [level=4]
  - list:
    - listitem:
      - button "🤖 24/7 R-Bot AI Smart Assistant"
    - listitem:
      - button "📦 Live Order Tracker"
    - listitem:
      - button "🔔 Celery Background Notifications"
    - listitem: ↩️ 7-Day Doorstep Return & Refund Policy
  - heading "SECURE CHECKOUT & STACK" [level=4]
  - paragraph: Powered by FastAPI, Redis cart caching, Celery asynchronous workers, and TanStack React Query.
  - text: ⚡ UPI 💳 Visa 💳 Mastercard ⏳ Pay Later 💵 COD © 2026
  - strong: R-MART Superstore Inc.
  - text: All rights reserved. Privacy Policy Terms of Service Security Architecture
```

# Test source

```ts
  12  |     const addBtn = page.locator("button:has-text('Add to Cart')").first();
  13  |     await expect(addBtn).toBeVisible({ timeout: 10000 });
  14  |     await addBtn.click();
  15  |   });
  16  | 
  17  |   test("Scenario 1: Cart Drawer transitions directly to /checkout page", async ({ page }) => {
  18  |     const cartBtn = page.locator("header button:has-text('Cart')");
  19  |     await cartBtn.click();
  20  | 
  21  |     const checkoutBtn = page.locator("button:has-text('Proceed to Checkout'), a:has-text('Checkout'), button:has-text('Checkout')").first();
  22  |     await expect(checkoutBtn).toBeVisible({ timeout: 6000 });
  23  |     await checkoutBtn.click();
  24  | 
  25  |     await expect(page).toHaveURL(/\/checkout/, { timeout: 10000 });
  26  |     await expect(page.locator("text=/Checkout|Shipping|Order Summary/i").first()).toBeVisible();
  27  |   });
  28  | 
  29  |   test("Scenario 2: Empty form submission triggers Zod required field validations", async ({ page }) => {
  30  |     await page.goto("/checkout");
  31  |     await page.waitForLoadState("domcontentloaded");
  32  | 
  33  |     const submitBtn = page.locator("button:has-text('Place Order'), button:has-text('Confirm Order'), button:has-text('Complete')").first();
  34  |     if (await submitBtn.isVisible()) {
  35  |       await submitBtn.click();
  36  |       // URL remains on /checkout
  37  |       await expect(page).toHaveURL(/\/checkout/);
  38  |       // Validations or required attributes triggered
  39  |       const hasErrorsOrBlocked = await page.locator("text=/required|valid|enter|fill/i").first().isVisible().catch(() => false);
  40  |       expect(hasErrorsOrBlocked || page.url().includes("checkout")).toBeTruthy();
  41  |     }
  42  |   });
  43  | 
  44  |   test("Scenario 3: Invalid postal code format triggers validation error", async ({ page }) => {
  45  |     await page.goto("/checkout");
  46  |     await page.waitForLoadState("domcontentloaded");
  47  | 
  48  |     const zipInput = page.locator("input[placeholder*='Zip'], input[placeholder*='Postal'], input[name*='zip']").first();
  49  |     if (await zipInput.isVisible()) {
  50  |       await zipInput.fill("ABC"); // Invalid non-numeric zip
  51  |       const submitBtn = page.locator("button:has-text('Place Order'), button:has-text('Confirm Order')").first();
  52  |       if (await submitBtn.isVisible()) {
  53  |         await submitBtn.click();
  54  |         await expect(page).toHaveURL(/\/checkout/);
  55  |       }
  56  |     }
  57  |   });
  58  | 
  59  |   test("Scenario 4: Payment method selection supports Cash on Delivery / Pay Later", async ({ page }) => {
  60  |     await page.goto("/checkout");
  61  |     await page.waitForLoadState("domcontentloaded");
  62  | 
  63  |     const payLaterOption = page.locator("label:has-text('Cash on Delivery'), label:has-text('Pay Later'), input[value='cod']").first();
  64  |     if (await payLaterOption.isVisible()) {
  65  |       await payLaterOption.click();
  66  |       await page.waitForTimeout(200);
  67  |       expect(await payLaterOption.isChecked().catch(() => true)).toBeTruthy();
  68  |     }
  69  |   });
  70  | 
  71  |   test("Scenario 5: Valid checkout form submission succeeds and displays confirmation", async ({ page }) => {
  72  |     await page.goto("/checkout");
  73  |     await page.waitForLoadState("domcontentloaded");
  74  | 
  75  |     const nameInput = page.locator("input[placeholder*='Name'], input[name*='name']").first();
  76  |     if (await nameInput.isVisible()) await nameInput.fill("Jane Shopper");
  77  | 
  78  |     const emailInput = page.locator("input[placeholder*='Email'], input[name*='email']").first();
  79  |     if (await emailInput.isVisible()) await emailInput.fill("jane.shopper@example.com");
  80  | 
  81  |     const addressInput = page.locator("input[placeholder*='Address'], input[name*='address'], textarea").first();
  82  |     if (await addressInput.isVisible()) await addressInput.fill("456 Market Boulevard");
  83  | 
  84  |     const cityInput = page.locator("input[placeholder*='City'], input[name*='city']").first();
  85  |     if (await cityInput.isVisible()) await cityInput.fill("Metro City");
  86  | 
  87  |     const zipInput = page.locator("input[placeholder*='Zip'], input[placeholder*='Postal'], input[name*='zip']").first();
  88  |     if (await zipInput.isVisible()) await zipInput.fill("500081");
  89  | 
  90  |     const submitBtn = page.locator("button:has-text('Place Order'), button:has-text('Confirm Order'), button:has-text('Complete')").first();
  91  |     if (await submitBtn.isVisible()) {
  92  |       await submitBtn.click();
  93  |       await expect(page.locator("text=/Order Placed|Order Confirmed|Success|Thank you|Orders/i").first()).toBeVisible({ timeout: 10000 });
  94  |     }
  95  |   });
  96  | 
  97  |   test("Scenario 6: Order history /orders renders completed order details", async ({ page }) => {
  98  |     await page.goto("/orders");
  99  |     await page.waitForLoadState("domcontentloaded");
  100 | 
  101 |     // Orders page renders container or historical entries
  102 |     await expect(page.locator("text=/Orders|Order #|History|Placed|Total/i").first()).toBeVisible({ timeout: 10000 });
  103 |   });
  104 | 
  105 |   test("Scenario 7: Live order tracker stepper modal is accessible", async ({ page }) => {
  106 |     await page.goto("/orders");
  107 |     await page.waitForLoadState("domcontentloaded");
  108 | 
  109 |     const trackBtn = page.locator("button:has-text('Track'), button:has-text('Tracking'), button:has-text('Live Tracker')").first();
  110 |     if (await trackBtn.isVisible()) {
  111 |       await trackBtn.click();
> 112 |       await expect(page.locator("text=/Live Order Tracking|Confirmed|Shipped|Out for Delivery/i").first()).toBeVisible({ timeout: 6000 });
      |                                                                                                            ^ Error: expect(locator).toBeVisible() failed
  113 |     }
  114 |   });
  115 | });
  116 | 
```