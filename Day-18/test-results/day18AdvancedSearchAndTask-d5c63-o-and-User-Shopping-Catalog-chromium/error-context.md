# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: day18AdvancedSearchAndTasks.spec.js >> Day 18: Background Tasks Lifecycle & Advanced Database Search Suite >> Scenario 5: Admin deletes a product and it is removed from both Admin Studio and User Shopping Catalog
- Location: e2e\day18AdvancedSearchAndTasks.spec.js:237:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Apple iPhone 15 Pro').first()
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('text=Apple iPhone 15 Pro').first() with timeout 10000ms
  - waiting for locator('text=Apple iPhone 15 Pro').first()

```

```yaml
- banner:
  - link "⚡ R-MART":
    - /url: /catalog
    - text: ⚡
    - strong: R
    - text: "-MART"
  - button "🌙 Dark"
  - text: "📢 NEWS ⚡ Flash Sale: 20% OFF with code RMART20 • 🛡️ 100% Trusted Genuine Hardware • 🚀 Express Guaranteed Delivery in 24-48 Hours Across All Hubs • 24/7 Live Support Chat Active • Free Return Guarantee on All Electronics 🛡️ Welcome Admin"
  - button "🔔 2"
  - button "💬 Chat"
  - button "☰"
- main:
  - text: 🛡️
  - heading "R-Mart Admin Portal" [level=1]
  - text: PASSCODE VERIFIED (ADMIN-2026)
  - paragraph: Manage inventory, live stock, incoming orders, and customer requests.
  - button "🪐 View Store Catalog"
  - button "+ Add Products"
  - button "📤 Bulk CSV Import (Celery)"
  - button "💬 Live Support & Chat"
  - heading "+ Add Product Studio" [level=2]
  - text: Product Name *
  - textbox "e.g. Ergonomic Split Mechanical Keyboard"
  - text: Price ($) *
  - spinbutton "89.99"
  - text: Stock *
  - spinbutton "15"
  - text: Category
  - combobox:
    - option "Mobiles and Electronics" [selected]
    - option "Deals and Savings"
    - option "Fashion"
    - option "Home and Furniture"
    - option "Groceries and Pet Supplies"
    - option "Books and Education"
    - option "Games and Live Shopping"
    - option "Pharmacy and Household"
    - option "Travel and Auto"
    - option "Toys and Kids"
    - option "Sports and Fitness"
    - option "Beauty"
    - option "Gifting"
    - option "Business Purchases"
    - option "Everyday Needs"
    - option "Bills and Recharges"
  - text: Description
  - textbox "Detailed specifications and key features..."
  - text: Product Photo
  - button "🔗 Paste Link"
  - button "📁 Browse & Drag"
  - textbox "Paste image link (https://...)"
  - button "Publish to Inventory"
```

# Test source

```ts
  154 |     const bulkTab = page.locator("[data-testid='admin-bulk-import-tab']");
  155 |     await expect(bulkTab).toBeVisible({ timeout: 10000 });
  156 |     await bulkTab.click();
  157 | 
  158 |     // Verify CSV container and textarea exist
  159 |     const container = page.locator("[data-testid='admin-bulk-import-container']");
  160 |     await expect(container).toBeVisible();
  161 | 
  162 |     const textarea = page.locator("[data-testid='bulk-csv-textarea']");
  163 |     await expect(textarea).toBeVisible();
  164 | 
  165 |     // Sample template link
  166 |     const templateLink = page.locator("text=/Download Sample CSV Template/i");
  167 |     await expect(templateLink).toBeVisible();
  168 | 
  169 |     // Trigger import
  170 |     const startImportBtn = page.locator("[data-testid='start-bulk-import-btn']");
  171 |     await expect(startImportBtn).toBeVisible();
  172 |     await startImportBtn.click();
  173 | 
  174 |     // Celery task progress modal should open
  175 |     const modal = page.locator("text=/Bulk Product CSV Import/i");
  176 |     await expect(modal).toBeVisible({ timeout: 5000 });
  177 |     await expect(page.locator("text=/Task ID:/i")).toBeVisible();
  178 |   });
  179 | 
  180 |   test("Scenario 4: Checkout page applies payment coupon offers, updates order total, and switches payment method", async ({ page }) => {
  181 |     // Seed cart in localStorage
  182 |     await page.addInitScript(() => {
  183 |       window.localStorage.setItem(
  184 |         "rmart-cart-storage",
  185 |         JSON.stringify({
  186 |           state: {
  187 |             cart: [
  188 |               {
  189 |                 id: 1,
  190 |                 name: "Apple iPhone 15 Pro",
  191 |                 title: "Apple iPhone 15 Pro",
  192 |                 price: 100,
  193 |                 quantity: 1,
  194 |                 image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400",
  195 |                 category: "Mobiles",
  196 |               },
  197 |             ],
  198 |           },
  199 |           version: 0,
  200 |         })
  201 |       );
  202 |     });
  203 | 
  204 |     await page.goto("/checkout");
  205 |     await page.waitForLoadState("domcontentloaded");
  206 | 
  207 |     // Verify Payment Offers section is present
  208 |     await expect(page.locator("text=Payment Offers & Coupons").first()).toBeVisible({ timeout: 10000 });
  209 |     await expect(page.locator("text=CARD10")).toBeVisible();
  210 |     await expect(page.locator("text=UPI5")).toBeVisible();
  211 | 
  212 |     // Click CARD10 offer chip
  213 |     const cardCouponChip = page.locator("text=CARD10").first();
  214 |     await cardCouponChip.click();
  215 | 
  216 |     // Verify CARD10 is applied
  217 |     await expect(page.locator("text=/Active Offer:.*CARD10/i")).toBeVisible();
  218 |     await expect(page.locator("text=APPLIED ✓").first()).toBeVisible();
  219 | 
  220 |     // Verify Credit / Debit Card radio is selected
  221 |     const cardRadio = page.locator("input[value='card']");
  222 |     await expect(cardRadio).toBeChecked();
  223 | 
  224 |     // Click UPI5 offer chip to switch offer
  225 |     const upiCouponChip = page.locator("text=UPI5").first();
  226 |     await upiCouponChip.click();
  227 | 
  228 |     // Verify UPI5 is now applied and UPI radio is selected
  229 |     await expect(page.locator("text=/Active Offer:.*UPI5/i")).toBeVisible();
  230 |     const upiRadio = page.locator("input[value='upi']");
  231 |     await expect(upiRadio).toBeChecked();
  232 | 
  233 |     // Verify cost breakdown shows offer discount
  234 |     await expect(page.locator("text=/Offer Discount/i").first()).toBeVisible();
  235 |   });
  236 | 
  237 |   test("Scenario 5: Admin deletes a product and it is removed from both Admin Studio and User Shopping Catalog", async ({ page }) => {
  238 |     await page.route("**/api/v1/products/1", async (route) => {
  239 |       if (route.request().method() === "DELETE") {
  240 |         await route.fulfill({ status: 204 });
  241 |       } else {
  242 |         await route.continue();
  243 |       }
  244 |     });
  245 | 
  246 |     // Automatically accept window.confirm dialogs
  247 |     page.on("dialog", (dialog) => dialog.accept());
  248 | 
  249 |     // 1. Visit Admin Dashboard
  250 |     await page.goto("/admin");
  251 |     await page.waitForLoadState("domcontentloaded");
  252 | 
  253 |     // Verify product is listed initially
> 254 |     await expect(page.locator("text=Apple iPhone 15 Pro").first()).toBeVisible({ timeout: 10000 });
      |                                                                    ^ Error: expect(locator).toBeVisible() failed
  255 | 
  256 |     // Click Delete button on product
  257 |     const deleteBtn = page.locator("button:has-text('Delete')").first();
  258 |     await deleteBtn.click();
  259 | 
  260 |     // Verify product disappears immediately from Admin Dashboard
  261 |     await expect(page.locator("text=Apple iPhone 15 Pro")).not.toBeVisible();
  262 | 
  263 |     // 2. Visit User Shopping Catalog
  264 |     await page.goto("/catalog");
  265 |     await page.waitForLoadState("domcontentloaded");
  266 | 
  267 |     // Product should NOT be visible in User Shopping Catalog
  268 |     await expect(page.locator("text=Apple iPhone 15 Pro")).not.toBeVisible();
  269 |   });
  270 | });
  271 | 
  272 | 
  273 | 
```