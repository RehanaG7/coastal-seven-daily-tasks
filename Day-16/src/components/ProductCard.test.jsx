import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import ProductCard from "./ProductCard";
import * as storeModule from "../store/useStore";
import * as productsHook from "../hooks/useProducts";

// Mock react-query hook
vi.mock("../hooks/useProducts", () => ({
  useOptimisticStockUpdate: vi.fn(),
}));

describe("ProductCard Component (Real Antigravity Implementation)", () => {
  const mockProduct = {
    id: 10,
    name: "Mechanical RGB Keyboard",
    price: 89.99,
    stock: 5,
    category: "Hardware",
    image: "https://example.com/keyboard.jpg",
    description: "Tactile gaming keyboard.",
  };

  const mockAddToCart = vi.fn();
  const mockToggleWishlist = vi.fn();
  const mockMutate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    productsHook.useOptimisticStockUpdate.mockReturnValue({
      mutate: mockMutate,
    });

    vi.spyOn(storeModule, "useUIStore").mockImplementation((selector) =>
      selector({ theme: "dark" })
    );
  });

  it("renders product name, price, and category properly", () => {
    vi.spyOn(storeModule, "useAuthStore").mockImplementation((selector) =>
      selector({ user: { role: "customer" } })
    );
    vi.spyOn(storeModule, "useCartStore").mockImplementation((selector) =>
      selector({
        addToCart: mockAddToCart,
        toggleWishlist: mockToggleWishlist,
        isWishlisted: () => false,
      })
    );

    render(
      <MemoryRouter>
        <ProductCard product={mockProduct} />
      </MemoryRouter>
    );

    expect(screen.getByText("Mechanical RGB Keyboard")).toBeInTheDocument();
    expect(screen.getByText("$89.99")).toBeInTheDocument();
    expect(screen.getByText("Hardware")).toBeInTheDocument();
  });

  it("triggers addToCart when customer clicks Add to Cart", () => {
    vi.spyOn(storeModule, "useAuthStore").mockImplementation((selector) =>
      selector({ user: { role: "customer" } })
    );
    vi.spyOn(storeModule, "useCartStore").mockImplementation((selector) =>
      selector({
        addToCart: mockAddToCart,
        toggleWishlist: mockToggleWishlist,
        isWishlisted: () => false,
      })
    );

    render(
      <MemoryRouter>
        <ProductCard product={mockProduct} />
      </MemoryRouter>
    );

    const addBtn = screen.getByRole("button", { name: /add to cart/i });
    fireEvent.click(addBtn);

    expect(mockAddToCart).toHaveBeenCalledTimes(1);
    expect(mockAddToCart).toHaveBeenCalledWith(mockProduct, 1);
  });

  it("disables button and shows Sold Out when stock is zero", () => {
    const zeroStockProduct = { ...mockProduct, stock: 0 };

    vi.spyOn(storeModule, "useAuthStore").mockImplementation((selector) =>
      selector({ user: { role: "customer" } })
    );
    vi.spyOn(storeModule, "useCartStore").mockImplementation((selector) =>
      selector({
        addToCart: mockAddToCart,
        toggleWishlist: mockToggleWishlist,
        isWishlisted: () => false,
      })
    );

    render(
      <MemoryRouter>
        <ProductCard product={zeroStockProduct} />
      </MemoryRouter>
    );

    const soldOutBtn = screen.getByRole("button", { name: /sold out/i });
    expect(soldOutBtn).toBeDisabled();
  });

  it("renders Admin Stock modifier controls when logged in as admin", () => {
    vi.spyOn(storeModule, "useAuthStore").mockImplementation((selector) =>
      selector({ user: { role: "admin" } })
    );
    vi.spyOn(storeModule, "useCartStore").mockImplementation((selector) =>
      selector({
        addToCart: mockAddToCart,
        toggleWishlist: mockToggleWishlist,
        isWishlisted: () => false,
      })
    );

    render(
      <MemoryRouter>
        <ProductCard product={mockProduct} />
      </MemoryRouter>
    );

    // In admin mode, Add to Cart is hidden, and Add Stock is displayed
    expect(screen.queryByText(/add to cart/i)).not.toBeInTheDocument();
    expect(screen.getByText(/add stock:/i)).toBeInTheDocument();

    const increaseBtn = screen.getByTitle("Increase stock by 1");
    fireEvent.click(increaseBtn);

    expect(mockMutate).toHaveBeenCalledWith({ productId: 10, delta: 1 });
  });
});
