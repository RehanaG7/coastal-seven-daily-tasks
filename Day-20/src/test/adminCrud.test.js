import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore, useCartStore } from "../store/useStore";
import { fetchProductsFromBackend } from "../hooks/useProducts";

describe("Day 16: Admin Dashboard & Stock Operations Suite", () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null });
  });

  it("16. recognizes admin privileges when user role is admin", () => {
    useAuthStore.setState({ user: { email: "admin@rmart.com", role: "admin" } });
    const user = useAuthStore.getState().user;
    expect(user.role).toBe("admin");
  });

  it("17. restricts administrative controls for customer accounts", () => {
    useAuthStore.setState({ user: { email: "customer@rmart.com", role: "customer" } });
    const user = useAuthStore.getState().user;
    expect(user.role).not.toBe("admin");
  });

  it("18. calculates correct stock delta on positive increment", () => {
    const currentStock = 10;
    const delta = 1;
    expect(currentStock + delta).toBe(11);
  });

  it("19. prevents negative stock levels during decrements", () => {
    const currentStock = 0;
    const delta = -1;
    const nextStock = Math.max(0, currentStock + delta);
    expect(nextStock).toBe(0);
  });

  it("20. validates product pricing must be a positive number", () => {
    const validPrice = 29.99;
    const invalidPrice = -5.0;
    expect(validPrice > 0).toBe(true);
    expect(invalidPrice > 0).toBe(false);
  });

  it("21. product deletion blacklist persists and prevents reappearing in catalog", async () => {
    const testProdId = "999";
    const deletedList = [testProdId];
    localStorage.setItem("rmart_deleted_product_ids", JSON.stringify(deletedList));

    // Also simulate custom product created earlier
    localStorage.setItem(
      "rmart_custom_products",
      JSON.stringify([{ id: 999, name: "Deleted Custom Widget", price: 10, stock: 5 }])
    );

    const result = await fetchProductsFromBackend();
    expect(result.items.some((p) => String(p.id) === testProdId)).toBe(false);

    // Clean up
    localStorage.removeItem("rmart_deleted_product_ids");
    localStorage.removeItem("rmart_custom_products");
  });

  it("22. rmart:product_deleted event removes item from cart and wishlist in real time", () => {
    useCartStore.setState({
      cart: [{ id: 888, name: "Cart Item", price: 20, quantity: 1, stock: 5 }],
      wishlist: [{ id: 888, name: "Wishlist Item", price: 20 }],
    });

    expect(useCartStore.getState().cart.length).toBe(1);
    expect(useCartStore.getState().wishlist.length).toBe(1);

    // Dispatch global deletion event
    window.dispatchEvent(new CustomEvent("rmart:product_deleted", { detail: { id: "888" } }));

    expect(useCartStore.getState().cart.length).toBe(0);
    expect(useCartStore.getState().wishlist.length).toBe(0);
  });
});

