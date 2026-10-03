import React, { createContext, useContext, useState, useEffect } from "react";

const StoreContext = createContext();

export const INITIAL_PRODUCTS = [
  {
    id: 1,
    name: "Mechanical RGB Gaming Keyboard",
    price: 89.99,
    stock: 0,
    category: "Peripherals",
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&auto=format&fit=crop",
    description: "Hot-swappable switches with dynamic RGB backlighting and braided USB-C cable."
  },
  {
    id: 2,
    name: "Ultra-Lightweight Ergonomic Mouse",
    price: 49.99,
    stock: 3,
    category: "Peripherals",
    image: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500&auto=format&fit=crop",
    description: "26,000 DPI sensor, honeycomb lightweight frame."
  },
  {
    id: 3,
    name: "Nebula Pro Wireless Gaming Headset",
    price: 119.99,
    stock: 15,
    category: "Peripherals",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop",
    description: "Ultra-low latency 2.4GHz wireless headset with active noise cancellation."
  },
  {
    id: 4,
    name: "Smart Stainless Steel Hydration Flask",
    price: 34.99,
    stock: 35,
    category: "Accessories",
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&auto=format&fit=crop",
    description: "Double-walled vacuum insulated flask with LED temperature display cap."
  },
  {
    id: 5,
    name: "Curved Ultra-Wide Gaming Monitor 34 inch",
    price: 399.99,
    stock: 2,
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&auto=format&fit=crop",
    description: "144Hz 1ms curved gaming display with HDR10."
  },
  {
    id: 6,
    name: "Thunderbolt 4 Workstation Docking Station",
    price: 129.99,
    stock: 12,
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1544652478-6653e09f18a2?w=500&auto=format&fit=crop",
    description: "Multi-port 100W PD charging dock for dual 4K monitors."
  },
  {
    id: 7,
    name: "Streamer Studio Condenser USB Microphone",
    price: 79.99,
    stock: 1,
    category: "Peripherals",
    image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&auto=format&fit=crop",
    description: "Cardioid pickup pattern with built-in pop filter and zero-latency monitoring."
  },
  {
    id: 8,
    name: "Ergonomic Memory Foam Lumbar Cushion",
    price: 29.99,
    stock: 24,
    category: "Accessories",
    image: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=500&auto=format&fit=crop",
    description: "High-density orthopedic posture support for desk chairs."
  }
];

export function StoreProvider({ children }) {
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [cart, setCart] = useState([]);
  const [theme, setTheme] = useState("dark");
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("rmart_user");
    return saved ? JSON.parse(saved) : { name: "Shaik", role: "admin" };
  });

  useEffect(() => {
    // Attempt standard fetch to FastAPI backend if active
    fetch("http://127.0.0.1:8000/products")
      .then((res) => {
        if (!res.ok) throw new Error("Backend not ok");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setProducts(data);
        }
      })
      .catch(() => {
        // Keeps INITIAL_PRODUCTS seamlessly
      });
  }, []);

  const toggleTheme = () => setTheme((p) => (p === "dark" ? "light" : "dark"));

  const addToCart = (product) => {
    setCart((prev) => {
      const exists = prev.find((item) => item.id === product.id);
      if (exists) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: (item.quantity || 1) + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (id) => setCart((prev) => prev.filter((item) => item.id !== id));

  const updateQuantity = (id, quantity) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => setCart([]);

  return (
    <StoreContext.Provider
      value={{
        products,
        setProducts,
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        theme,
        toggleTheme,
        user,
        setUser,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  return useContext(StoreContext);
}
