import { create } from "zustand";
import { persist } from "zustand/middleware";

// ============================================================================
// 1. AUTHENTICATION STORE (ZUSTAND + PERSIST)
// ============================================================================
export const useAuthStore = create(
  persist(
    (set) => ({
      user: JSON.parse(localStorage.getItem("rmart_user")) || null,
      token: localStorage.getItem("token") || null,
      setUser: (user, token) => {
        if (token) localStorage.setItem("token", token);
        if (user) {
          localStorage.setItem("user_role", user.role || "user");
          localStorage.setItem("rmart_user", JSON.stringify(user));
        }
        set({ user, token: token || null });
      },
      logout: () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user_role");
        localStorage.removeItem("rmart_user");
        set({ user: null, token: null });
      },
    }),
    { name: "rmart-auth-storage" }
  )
);

// ============================================================================
// 2. SHOPPING CART, WISHLIST & OFFERS STORE
// ============================================================================
export const useCartStore = create(
  persist(
    (set, get) => ({
      cart: [],
      wishlist: [],
      isOpen: false,
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      // Cart Actions
      addToCart: (product, qty = 1) =>
        set((state) => {
          const existing = state.cart.find((item) => item.id === product.id);
          if (existing) {
            return {
              cart: state.cart.map((item) =>
                item.id === product.id
                  ? { ...item, quantity: item.quantity + qty }
                  : item
              ),
              isOpen: true,
            };
          }
          return {
            cart: [...state.cart, { ...product, quantity: qty }],
            isOpen: state.isOpen,
          };
        }),

      updateQuantity: (id, delta) =>
        set((state) => ({
          cart: state.cart
            .map((item) => {
              if (item.id === id) {
                const newQty = item.quantity + delta;
                return newQty > 0 ? { ...item, quantity: newQty } : null;
              }
              return item;
            })
            .filter(Boolean),
        })),

      removeFromCart: (id) =>
        set((state) => ({
          cart: state.cart.filter((item) => item.id !== id),
        })),

      clearCart: () => set({ cart: [] }),

      getCartTotal: () => {
        return get().cart.reduce(
          (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
          0
        );
      },
      getCartCount: () => {
        return get().cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
      },

      // Wishlist Actions
      toggleWishlist: (product) =>
        set((state) => {
          const exists = state.wishlist.some((item) => item.id === product.id);
          if (exists) {
            return {
              wishlist: state.wishlist.filter((item) => item.id !== product.id),
            };
          }
          return {
            wishlist: [...state.wishlist, product],
          };
        }),

      isWishlisted: (productId) => {
        return get().wishlist.some((item) => item.id === productId);
      },

      // Admin Offers
      offers: [
        { id: "OF-1", code: "RMART20", discount: "20% OFF", desc: "20% instant discount on gaming peripherals" },
        { id: "OF-2", code: "EXPRESS48", discount: "FREE DELIVERY", desc: "Zero delivery fees on all orders" },
        { id: "OF-3", code: "FLASH50", discount: "$50 OFF", desc: "Flat $50 off on orders over $250" },
      ],
      addOffer: (newOffer) =>
        set((state) => ({
          offers: [{ ...newOffer, id: `OF-${Date.now()}` }, ...state.offers],
        })),
      removeOffer: (offerId) =>
        set((state) => ({
          offers: state.offers.filter((o) => o.id !== offerId),
        })),
    }),
    { name: "rmart-cart-storage" }
  )
);

// ============================================================================
// 3. UI, 3D INTRO, SCROLLING NEWS BANNER & RIGHT DRAWER STORE
// ============================================================================
export const useUIStore = create(
  persist(
    (set) => ({
      theme: "dark",
      toggleTheme: () => set((state) => ({ theme: state.theme === "dark" ? "light" : "dark" })),
      setTheme: (theme) => set({ theme }),

      // Admin Controlled Scrolling News Banner
      newsBannerText:
        "⚡ Flash Sale: 20% OFF with code RMART20 • 🛡️ 100% Trusted Genuine Hardware • 🚀 Express Guaranteed Delivery in 24-48 Hours Across All Hubs • 24/7 Live Support Chat Active • Free Return Guarantee on All Electronics",
      setNewsBannerText: (text) => set({ newsBannerText: text }),

      // 3D Cinematic Animation Flow
      isIntroActive: false,
      triggerIntro: () => set({ isIntroActive: true }),
      dismissIntro: () => set({ isIntroActive: false }),

      // Right Toggle Drawer (User & Admin Side)
      isRightMenuOpen: false,
      rightMenuView: "menu",
      openRightMenu: () => set({ isRightMenuOpen: true, rightMenuView: "menu" }),
      openRightMenuView: (view) => set({ isRightMenuOpen: true, rightMenuView: view }),
      closeRightMenu: () => set({ isRightMenuOpen: false }),
      toggleRightMenu: () => set((state) => ({ isRightMenuOpen: !state.isRightMenuOpen })),

      // Active Track Order Modal
      trackingOrder: null,
      openTracker: (order) => set({ trackingOrder: order }),
      closeTracker: () => set({ trackingOrder: null }),

      // Backend Connection Health (Day 10 FastAPI Status)
      backendHealth: {
        status: "checking",
        latencyMs: 0,
        lastChecked: null,
      },
      setBackendHealth: (health) => set({ backendHealth: health }),
    }),
    {
      name: "rmart-ui-storage",
      partialize: (state) => ({ newsBannerText: state.newsBannerText, theme: state.theme }),
    }
  )
);
