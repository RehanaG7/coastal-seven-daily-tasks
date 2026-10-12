import { describe, it, expect, beforeEach } from "vitest";
import { useCartStore } from "../store/useStore";

describe("Day 16: Zustand Cart Store Suite", () => {
  beforeEach(() => {
    useCartStore.setState({ cart: [], wishlist: [] });
  });

  it("1. initializes with an empty shopping cart and wishlist", () => {
    const { cart, wishlist } = useCartStore.getState();
    expect(cart).toEqual([]);
    expect(wishlist).toEqual([]);
  });

  it("2. adds a new product to cart with initial quantity", () => {
    const product = { id: 1, name: "Mechanical Keyboard", price: 99.99, stock: 10 };
    useCartStore.getState().addToCart(product, 1);

    const cart = useCartStore.getState().cart;
    expect(cart).toHaveLength(1);
    expect(cart[0].id).toBe(1);
    expect(cart[0].name).toBe("Mechanical Keyboard");
    expect(cart[0].quantity).toBe(1);
  });

  it("3. increments quantity when adding existing item", () => {
    const product = { id: 2, name: "Gaming Mouse", price: 49.99, stock: 5 };
    useCartStore.getState().addToCart(product, 1);
    useCartStore.getState().addToCart(product, 2);

    const cart = useCartStore.getState().cart;
    expect(cart).toHaveLength(1);
    expect(cart[0].quantity).toBe(3);
  });

  it("4. updates quantity and calculates cart total correctly", () => {
    const p1 = { id: 10, name: "Monitor", price: 200 };
    useCartStore.getState().addToCart(p1, 1);
    expect(useCartStore.getState().getCartTotal()).toBe(200);

    useCartStore.getState().updateQuantity(10, 1);
    expect(useCartStore.getState().getCartTotal()).toBe(400);

    useCartStore.getState().removeFromCart(10);
    expect(useCartStore.getState().cart).toHaveLength(0);
  });

  it("5. toggles wishlist status for a product", () => {
    const product = { id: 5, name: "Headset" };
    useCartStore.getState().toggleWishlist(product);
    expect(useCartStore.getState().isWishlisted(5)).toBe(true);

    useCartStore.getState().toggleWishlist(product);
    expect(useCartStore.getState().isWishlisted(5)).toBe(false);
  });

  it("6. clears all items from cart after checkout", () => {
    useCartStore.getState().addToCart({ id: 1, name: "Item 1", price: 10 }, 2);
    useCartStore.getState().addToCart({ id: 2, name: "Item 2", price: 20 }, 1);
    expect(useCartStore.getState().cart).toHaveLength(2);

    useCartStore.getState().clearCart();
    expect(useCartStore.getState().cart).toHaveLength(0);
    expect(useCartStore.getState().getCartTotal()).toBe(0);
  });
});
