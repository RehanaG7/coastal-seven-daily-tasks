import React from "react";
import { useCartStore, useAuthStore, useUIStore } from "../store/useStore";

// Backward-compatible hook mapping old Context calls to Zustand
export const useStore = () => {
  const cart = useCartStore((s) => s.cart);
  const addToCart = useCartStore((s) => s.addToCart);
  const removeFromCart = useCartStore((s) => s.removeFromCart);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const clearCart = useCartStore((s) => s.clearCart);
  const openCart = useCartStore((s) => s.openCart);
  const closeCart = useCartStore((s) => s.closeCart);
  const isCartOpen = useCartStore((s) => s.isOpen);

  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);

  const theme = useUIStore((s) => s.theme);
  const toggleTheme = useUIStore((s) => s.toggleTheme);

  return {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    openCart,
    closeCart,
    isCartOpen,
    user,
    setUser,
    logout,
    theme,
    toggleTheme,
    products: [],
  };
};

export const INITIAL_PRODUCTS = [];
