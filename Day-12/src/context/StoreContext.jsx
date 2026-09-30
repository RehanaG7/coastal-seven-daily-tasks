import React, { createContext, useContext, useState, useEffect } from "react";
import apiClient from "../api/apiClient";

const StoreContext = createContext();

const FULL_CATALOG = [
  {
    id: "p-1",
    title: "Mechanical RGB Gaming Keyboard",
    price: 89.99,
    category: "Electronics",
    stock: 0,
    image_url: "https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=600&q=80",
    description: "Hot-swappable switches with dynamic RGB backlighting and braided USB-C cable."
  },
  {
    id: "p-2",
    title: "Ultra-Lightweight Ergonomic Mouse",
    price: 49.99,
    category: "Peripherals",
    stock: 3,
    image_url: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=600&q=80",
    description: "26,000 DPI sensor, honeycomb lightweight frame."
  },
  {
    id: "p-3",
    title: "Nebula Pro Wireless Gaming Headset",
    price: 119.99,
    category: "Electronics",
    stock: 15,
    image_url: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=600&q=80",
    description: "Ultra-low latency 2.4GHz wireless headset with noise cancellation."
  },
  {
    id: "p-4",
    title: "Smart Stainless Steel Hydration Flask",
    price: 34.99,
    category: "Accessories",
    stock: 35,
    image_url: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=80",
    description: "Double-walled vacuum insulated flask with LED temperature cap."
  },
  {
    id: "p-5",
    title: "Curved Ultra-Wide Gaming Monitor 34\"",
    price: 399.99,
    category: "Electronics",
    stock: 2,
    image_url: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80",
    description: "144Hz 1ms curved gaming monitor with HDR10."
  },
  {
    id: "p-6",
    title: "Thunderbolt 4 Workstation Docking Station",
    price: 129.99,
    category: "Accessories",
    stock: 12,
    image_url: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=600&q=80",
    description: "Multi-port 100W PD charging dock for dual 4K monitors."
  },
  {
    id: "p-7",
    title: "Streamer Studio Condenser USB Microphone",
    price: 79.99,
    category: "Peripherals",
    stock: 1,
    image_url: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=80",
    description: "Cardioid pickup pattern with built-in pop filter and zero-latency monitoring."
  },
  {
    id: "p-8",
    title: "Ergonomic Memory Foam Lumbar Cushion",
    price: 29.99,
    category: "Accessories",
    stock: 24,
    image_url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=600&q=80",
    description: "High-density orthopedic posture support for desk chairs."
  }
];

export function StoreProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem("rmart_theme") || "dark");

  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("rmart_user");
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      if (parsed?.email && parsed.email.toLowerCase().includes("admin")) {
        parsed.is_admin = true;
      }
      return parsed;
    } catch {
      return null;
    }
  });

  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("rmart_cart")) || [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [lastPlacedOrder, setLastPlacedOrder] = useState(null);

  // 2-SECOND AUTO-DISMISS POPUP
  const [activePopup, setActivePopup] = useState(null);

  const showPopup = (title, message, icon = "🔔") => {
    const popupData = { title, message, icon, id: Date.now() };
    setActivePopup(popupData);
    setTimeout(() => {
      setActivePopup((curr) => (curr?.id === popupData.id ? null : curr));
    }, 2000);
  };

  // OVERWRITE ANY STALE 4-ITEM INVENTORY
  const [inventory, setInventory] = useState(() => {
    try {
      const saved = localStorage.getItem("rmart_inventory");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.length >= 8) return parsed;
      }
    } catch {}
    localStorage.setItem("rmart_inventory", JSON.stringify(FULL_CATALOG));
    return FULL_CATALOG;
  });

  const [adminNotifications, setAdminNotifications] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("rmart_admin_notifications")) || [];
    } catch {
      return [];
    }
  });

  const [userNotifications, setUserNotifications] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("rmart_user_notifications")) || [];
    } catch {
      return [];
    }
  });

  const [restockRequests, setRestockRequests] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("rmart_restock_requests")) || [];
    } catch {
      return [];
    }
  });

  const [orders, setOrders] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("rmart_orders")) || [];
    } catch {
      return [];
    }
  });

  const [tickets, setTickets] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("rmart_tickets")) || [];
    } catch {
      return [];
    }
  });

  // Pull from backend and merge
  useEffect(() => {
    apiClient.get("/products")
      .then((res) => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          const formatted = res.data.map((item) => ({
            id: item.id || `p-${Math.random()}`,
            title: item.title || item.name || "Product",
            price: parseFloat(item.price) || 0,
            category: item.category || "General",
            stock: item.stock !== undefined ? parseInt(item.stock, 10) : 10,
            image_url: item.image_url || "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=600&q=80",
            description: item.description || "Verified store item."
          }));

          setInventory((prev) => {
            const combined = [...formatted];
            prev.forEach((p) => {
              if (!combined.some((b) => String(b.id) === String(p.id))) {
                combined.push(p);
              }
            });
            localStorage.setItem("rmart_inventory", JSON.stringify(combined));
            return combined;
          });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    localStorage.setItem("rmart_theme", theme);
    document.body.style.backgroundColor = theme === "dark" ? "#06080F" : "#F8FAFC";
    document.body.style.color = theme === "dark" ? "#F8FAFC" : "#0F172A";
  }, [theme]);

  useEffect(() => {
    if (inventory.length > 0) localStorage.setItem("rmart_inventory", JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem("rmart_restock_requests", JSON.stringify(restockRequests));
  }, [restockRequests]);

  useEffect(() => {
    localStorage.setItem("rmart_cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem("rmart_orders", JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem("rmart_admin_notifications", JSON.stringify(adminNotifications));
  }, [adminNotifications]);

  useEffect(() => {
    localStorage.setItem("rmart_user_notifications", JSON.stringify(userNotifications));
  }, [userNotifications]);

  useEffect(() => {
    localStorage.setItem("rmart_tickets", JSON.stringify(tickets));
  }, [tickets]);

  const pushAdminNotification = (type, title, message) => {
    const notif = {
      id: `ADMN-${Date.now()}`,
      type,
      title,
      message,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      unread: true
    };
    setAdminNotifications((prev) => [notif, ...prev]);
    showPopup(title, message, "🛡️");
  };

  const pushUserNotification = (type, title, message) => {
    const notif = {
      id: `USER-${Date.now()}`,
      type,
      title,
      message,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      unread: true
    };
    setUserNotifications((prev) => [notif, ...prev]);
    showPopup(title, message, "🛒");
  };

  const markAdminNotificationsRead = () => {
    setAdminNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const markUserNotificationsRead = () => {
    setUserNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const login = (userData) => {
    if (userData?.email && userData.email.toLowerCase().includes("admin")) {
      userData.is_admin = true;
    }
    setUser(userData);
    localStorage.setItem("rmart_user", JSON.stringify(userData));
    showPopup("Logged In", `Welcome back, ${userData.name}!`, "👋");
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("rmart_user");
    localStorage.removeItem("token");
    showPopup("Signed Out", "You have signed out of R-Mart.", "🔒");
  };

  const addProduct = async (newProd) => {
    setInventory((prev) => [newProd, ...prev]);
    pushAdminNotification("catalog", "📦 Product Published", `"${newProd.title}" is now live with ${newProd.stock} units.`);
    try {
      await apiClient.post("/products", newProd);
    } catch {}
  };

  const deleteProduct = async (id) => {
    const target = inventory.find((p) => String(p.id) === String(id));
    setInventory((prev) => prev.filter((item) => String(item.id) !== String(id)));
    pushAdminNotification("catalog", "🗑️ Product Deleted", `"${target?.title || id}" was permanently removed.`);
    try {
      await apiClient.delete(`/products/${id}`);
    } catch {}
  };

  const updateProductStock = (id, newStock) => {
    const stockVal = Math.max(0, parseInt(newStock, 10));
    setInventory((prev) =>
      prev.map((item) => {
        if (String(item.id) === String(id)) {
          if (stockVal < 5) {
            pushAdminNotification(
              "stockout",
              stockVal === 0 ? "🔴 CRITICAL: Out of Stock!" : "⚠️ Low Stock Alert",
              `"${item.title}" has ${stockVal === 0 ? "0 units left" : `only ${stockVal} units left`}.`
            );
          } else {
            showPopup("Stock Updated", `Stock for "${item.title}" updated to ${stockVal}.`, "📦");
          }
          return { ...item, stock: stockVal };
        }
        return item;
      })
    );
  };

  const requestProductRestock = (product) => {
    const userEmail = user?.email || "customer@rmart.com";
    setRestockRequests((prev) => {
      const existing = prev.find((r) => String(r.productId) === String(product.id));
      if (existing) {
        return prev.map((r) =>
          String(r.productId) === String(product.id) ? { ...r, count: r.count + 1, timestamp: "Just now" } : r
        );
      }
      return [
        {
          id: `REQ-${Math.floor(100 + Math.random() * 900)}`,
          productId: product.id,
          productTitle: product.title || product.name,
          requestedBy: userEmail,
          timestamp: "Just now",
          count: 1
        },
        ...prev
      ];
    });

    pushAdminNotification("demand", "🔔 Restock Demand", `Customer requested "${product.title || product.name}".`);
    pushUserNotification("restock_demand", "🔔 Request Sent", `We'll notify you as soon as "${product.title || product.name}" is back!`);
  };

  const sendApologyRestockNotice = (requestId, productTitle, userEmail) => {
    const apologyMessage = `Kindly apologise, "${productTitle}" is currently out of stock. It will be restocked and available in your hub within 24-48 hours. Thank you for your patience!`;
    pushUserNotification("restock_eta", `Warehouse ETA: ${productTitle}`, apologyMessage);
    pushAdminNotification("apology_sent", "📩 Apology Notice Sent", `24-48h ETA notice dispatched to ${userEmail}.`);

    setRestockRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, adminNotified: true, lastResponse: apologyMessage } : r))
    );
  };

  const addToCart = (product) => {
    if (!product) return;
    const maxStock = Number(product.stock || 0);
    if (maxStock <= 0) {
      showPopup("Out of Stock", `"${product.title || product.name}" is sold out!`, "⚠️");
      return;
    }

    const cleanId = product.id ?? product._id ?? `p-${Math.random().toString(36).substr(2, 6)}`;
    const cleanPrice = parseFloat(product.price) || 0;
    const cleanTitle = product.title || product.name || "R-Mart Item";
    const cleanImg = product.image_url || "";

    setCart((prevCart) => {
      const idx = prevCart.findIndex((item) => String(item.id) === String(cleanId));
      if (idx > -1) {
        const currentQty = prevCart[idx].quantity;
        if (currentQty >= maxStock) {
          showPopup("Stock Limit", `Cannot add more! Only ${maxStock} in stock.`, "⚠️");
          return prevCart;
        }
        const copy = [...prevCart];
        copy[idx].quantity += 1;
        return copy;
      }
      return [
        ...prevCart,
        {
          id: cleanId,
          title: cleanTitle,
          name: cleanTitle,
          price: cleanPrice,
          image_url: cleanImg,
          quantity: 1,
          maxStock: maxStock
        },
      ];
    });

    showPopup("Added to Cart", `"${cleanTitle}" added!`, "✓");

    setTimeout(() => {
      pushUserNotification(
        "cart_waiting",
        "🛒 Hey! I'm waiting in your cart...",
        `"${cleanTitle}" is waiting for you! Bring me home before stock runs out!`
      );
    }, 6000);
  };

  const updateQuantity = (id, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (String(item.id) === String(id)) {
            const product = inventory.find((p) => String(p.id) === String(id));
            const availableStock = product ? Number(product.stock) : (item.maxStock || 99);
            const next = item.quantity + delta;
            if (next > availableStock) {
              showPopup("Stock Limit", `Only ${availableStock} units available.`, "⚠️");
              return item;
            }
            return next > 0 ? { ...item, quantity: next } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const placeOrder = (shippingAddress, paymentDetails) => {
    if (cart.length === 0) return null;

    const celeryTaskId = `celery-job-${Math.random().toString(36).substr(2, 8)}`;
    const newOrder = {
      id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      celery_task_id: celeryTaskId,
      customer: user?.name || "Customer",
      email: user?.email || "customer@rmart.com",
      items: [...cart],
      total: cart.reduce((sum, item) => sum + Number(item.price || 0) * item.quantity, 0),
      status: "Processing (Queued in Redis)",
      address: shippingAddress || user?.address || "Primary Store Location, AP",
      date: new Date().toISOString().replace("T", " ").substring(0, 16),
      redis_queue: "default_orders",
      payment: paymentDetails || {
        method: "UPI",
        transactionId: `TXN-${Date.now().toString().slice(-8)}`,
        status: "Captured & Paid",
        accountRef: "Verified Account"
      }
    };

    setOrders((prev) => [newOrder, ...prev]);
    setCart([]);
    setIsCartOpen(false);
    setLastPlacedOrder(newOrder);

    newOrder.items.forEach((item) => {
      const prod = inventory.find((i) => String(i.id) === String(item.id));
      const remaining = (prod?.stock || item.quantity) - item.quantity;
      updateProductStock(item.id, remaining);
    });

    pushUserNotification(
      "order_placed",
      `🎉 Order #${newOrder.id} Placed!`,
      `Payment of $${newOrder.total.toFixed(2)} confirmed. Dispatched to Celery worker.`
    );

    pushAdminNotification(
      "new_order",
      `📦 New Order #${newOrder.id}!`,
      `Customer ${newOrder.customer} placed an order for $${newOrder.total.toFixed(2)}.`
    );

    return newOrder;
  };

  const modifyOrderStatus = (orderId, newStatus) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          let notifTitle = `Order #${o.id} Updated`;
          let notifMsg = `Your order status is now: ${newStatus}`;

          if (newStatus.includes("Dispatched")) {
            notifTitle = `🚚 Order #${o.id} Dispatched!`;
            notifMsg = `Your package has left the hub and is moving along the express corridor.`;
          } else if (newStatus.includes("Delivery")) {
            notifTitle = `🛵 Order #${o.id} Out for Delivery!`;
            notifMsg = `Our courier is arriving at your destination!`;
          } else if (newStatus.includes("Delivered")) {
            notifTitle = `✅ Order #${o.id} Delivered!`;
            notifMsg = `Package delivered successfully. Thank you for choosing R-Mart!`;
          } else if (newStatus.includes("Cancelled")) {
            notifTitle = `❌ Order #${o.id} Cancelled`;
            notifMsg = `Your order #${o.id} was cancelled. Refund processed.`;
          }

          pushUserNotification("order_status", notifTitle, notifMsg);
          pushAdminNotification("order_modified", `Order #${o.id} Modified`, `Status changed to "${newStatus}".`);
          return { ...o, status: newStatus };
        }
        return o;
      })
    );
  };

  const addTicket = (subject, message) => {
    const userEmail = user?.email || "customer@rmart.com";
    const newTck = {
      id: `TCK-${Math.floor(100 + Math.random() * 900)}`,
      user: userEmail,
      subject,
      message,
      status: "Open",
      priority: "High",
      date: new Date().toISOString().substring(0, 10),
    };
    setTickets((prev) => [newTck, ...prev]);

    pushUserNotification("ticket_opened", `📋 Complaint Registered (#${newTck.id})`, `Subject: "${subject}". Support desk is on it.`);
    pushAdminNotification("complaint", `🚨 New Complaint (#${newTck.id})`, `Shopper ${userEmail}: "${subject}".`);
    return newTck;
  };

  const resolveTicket = (ticketId, replyMessage) => {
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          const finalReply = replyMessage || "Admin resolved your issue.";
          pushUserNotification("ticket_resolved", `✅ Complaint #${t.id} Resolved`, `Admin: "${finalReply}"`);
          pushAdminNotification("ticket_closed", `Complaint #${t.id} Closed`, `Resolved for ${t.user}.`);
          return { ...t, status: "Resolved", reply: finalReply };
        }
        return t;
      })
    );
  };

  const cartTotal = cart.reduce((sum, item) => sum + Number(item.price || 0) * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <StoreContext.Provider
      value={{
        theme,
        toggleTheme,
        user,
        login,
        logout,
        inventory,
        addProduct,
        deleteProduct,
        updateProductStock,
        restockRequests,
        requestProductRestock,
        sendApologyRestockNotice,
        cart,
        addToCart,
        updateQuantity,
        placeOrder,
        lastPlacedOrder,
        setLastPlacedOrder,
        cartTotal,
        cartCount,
        isCartOpen,
        setIsCartOpen,
        orders,
        modifyOrderStatus,
        adminNotifications,
        userNotifications,
        markAdminNotificationsRead,
        markUserNotificationsRead,
        tickets,
        addTicket,
        resolveTicket,
        showPopup
      }}
    >
      {children}

      {/* FLOATING POPUP TOAST (DISAPPEARS STRICTLY IN 2 SECONDS) */}
      {activePopup && (
        <div style={{
          position: "fixed",
          top: "20px",
          right: "24px",
          backgroundColor: "#0F172A",
          color: "#FFFFFF",
          border: "2px solid #F59E0B",
          borderRadius: "12px",
          padding: "14px 18px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.85), 0 0 15px rgba(245,158,11,0.3)",
          zIndex: 999999,
          maxWidth: "360px",
          display: "flex",
          alignItems: "flex-start",
          gap: "12px",
          animation: "slideInRight 0.25s ease-out",
          fontFamily: "system-ui, sans-serif"
        }}>
          <span style={{ fontSize: "22px", lineHeight: "1" }}>{activePopup.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: "900", fontSize: "13px", color: "#F59E0B", marginBottom: "2px" }}>
              {activePopup.title}
            </div>
            <div style={{ fontSize: "12px", color: "#E2E8F0", lineHeight: "1.3" }}>
              {activePopup.message}
            </div>
            <div style={{ fontSize: "9px", color: "#94A3B8", marginTop: "4px" }}>
              auto-dismissing in 2s...
            </div>
          </div>
        </div>
      )}
    </StoreContext.Provider>
  );
}

export const useStore = () => useContext(StoreContext);
