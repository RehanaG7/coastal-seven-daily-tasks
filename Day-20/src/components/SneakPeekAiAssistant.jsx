import React, { useState, useEffect, useRef } from "react";
import { useCartStore, useUIStore, useAuthStore } from "../store/useStore";
import { env } from "../config/env";

const DEFAULT_SUGGESTIONS = [
  "What's new in R-Mart Sparkyyy? 🎁",
  "Where is my order & history? 🚚",
  "What is my saved address & profile? 📍",
  "What is currently in my cart? 🛒",
  "Tell me a shopping joke! 😂"
];

const FUN_JOKES = [
  "Why do programmers prefer dark mode? Because light attracts bugs! 🌙",
  "Why did the smartphone need glasses? Because it lost all its contacts! 📱",
  "Why was the JavaScript developer sad? Because they didn't Node how to Express themselves! ☕",
  "There are 10 types of people: those who understand binary, and those who don't! 💻",
  "Why do computers overheat? Because they have too many fans! ❄️"
];

export default function SneakPeekAiAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeProvider, setActiveProvider] = useState("Store Knowledge Engine");
  const [viewedProducts, setViewedProducts] = useState([]);
  const [isHovered, setIsHovered] = useState(false);

  // Speech Recognition (Mic) & Speech Synthesis (Voice)
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  const theme = useUIStore((s) => s.theme);
  const isDark = theme === "dark";
  const addToCart = useCartStore((s) => s.addToCart);
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "admin" || localStorage.getItem("user_role") === "admin";

  const messagesEndRef = useRef(null);

  // Load viewed products history from localStorage
  const refreshWatchHistory = () => {
    try {
      const stored = localStorage.getItem("rmart_viewed_products");
      if (stored) {
        setViewedProducts(JSON.parse(stored));
      }
    } catch {
      setViewedProducts([]);
    }
  };

  useEffect(() => {
    refreshWatchHistory();
  }, [isOpen]);

  // Natural Accent Speech Synthesis (No squeaky or robotic voice)
  const speakTextInNaturalAccent = (text) => {
    if (!("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const clean = text
        .replace(/\[Source:[^\]]+\]/g, "")
        .replace(/[*_#`~]/g, "")
        .replace(/•/g, "");

      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.pitch = 1.0; // Natural, mature human pitch
      utterance.rate = 0.98; // Natural, articulate cadence

      // Pick the best natural English voice available
      const voices = window.speechSynthesis.getVoices();
      const naturalVoice = voices.find(
        (v) =>
          (v.lang.startsWith("en") && (v.name.includes("Natural") || v.name.includes("Google") || v.name.includes("Samantha") || v.name.includes("Jenny") || v.name.includes("US"))) ||
          v.lang === "en-US"
      );
      if (naturalVoice) {
        utterance.voice = naturalVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("TTS voice error:", e);
    }
  };

  // Toggle Voice Input (Mic)
  const handleToggleMic = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please try Chrome or Edge!");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event) => {
        const spoken = event.results[0][0].transcript;
        if (spoken) {
          setInput(spoken);
          handleSendMessage(spoken);
        }
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn("Speech recognition error:", err);
      setIsListening(false);
    }
  };

  // Live Inventory Audit
  const getCatalogAudit = () => {
    try {
      const custom = JSON.parse(localStorage.getItem("rmart_custom_products") || "[]");
      const overrides = JSON.parse(localStorage.getItem("rmart_stock_overrides") || "{}");
      const deleted = new Set(JSON.parse(localStorage.getItem("rmart_deleted_product_ids") || "[]").map(String));

      const sample = [
        { id: 1, name: "Apple iPhone 15 Pro Max", stock: 0, price: 1199.99 },
        { id: 2, name: "Sony WH-1000XM5 Headphones", stock: 15, price: 349.99 },
        { id: 3, name: "Samsung Galaxy S24 Ultra", stock: 8, price: 1299.99 },
        { id: 4, name: "Samsung Odyssey 4K Gaming Monitor", stock: 5, price: 699.99 },
        { id: 5, name: "Logitech MX Mechanical Keyboard", stock: 20, price: 169.99 },
        ...custom
      ].filter((p) => !deleted.has(String(p.id)));

      const outOfStock = sample.filter((p) => (overrides[p.id] !== undefined ? overrides[p.id] : p.stock) === 0);
      const lowStock = sample.filter((p) => {
        const s = overrides[p.id] !== undefined ? overrides[p.id] : p.stock;
        return s > 0 && s < 5;
      });

      return { outOfStock, lowStock, totalCount: sample.length };
    } catch {
      return { outOfStock: [], lowStock: [], totalCount: 5 };
    }
  };

  // Support tickets / customer inquiries
  const getCustomerComplaints = () => {
    try {
      return JSON.parse(localStorage.getItem("rmart_support_tickets") || "[]");
    } catch {
      return [];
    }
  };

  // Quick Restock Helper for Admin
  const handleQuickRestock = (productName, qty = 20) => {
    try {
      const overrides = JSON.parse(localStorage.getItem("rmart_stock_overrides") || "{}");
      overrides[productName] = (overrides[productName] || 0) + qty;
      localStorage.setItem("rmart_stock_overrides", JSON.stringify(overrides));

      setMessages((prev) => [
        ...prev,
        {
          id: `restock_${Date.now()}`,
          role: "assistant",
          content: `Stock successfully replenished! Added **+${qty} units** to **${productName}**. Shoppers can now complete their purchases.`,
          sources: [],
          provider: "Admin Inventory Manager"
        }
      ]);
    } catch (e) {
      console.warn("Restock error:", e);
    }
  };

  // Initialize Greeting based on User Scroll & Browse History (No Beep-Boop!)
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      if (isAdmin) {
        const audit = getCatalogAudit();
        const tickets = getCustomerComplaints();
        const orders = JSON.parse(localStorage.getItem("rmart_orders") || "[]");

        let adminGreeting = `Welcome, Administrator. Sparky Store Intelligence is active with full access to live inventory and customer data.\n\n`;

        if (audit.outOfStock.length > 0) {
          adminGreeting += `🚨 **DEPLETED STOCK ALERT:**\n` +
            audit.outOfStock.map((p) => `• **${p.name || p.title}** ($${p.price}) — 0 units in stock`).join("\n") +
            `\n\nYou can use the one-click restock buttons below to replenish items.\n\n`;
        } else {
          adminGreeting += `✅ All catalog items currently have active inventory.\n\n`;
        }

        if (tickets.length > 0) {
          adminGreeting += `📩 **CUSTOMER INQUIRIES (${tickets.length}):**\n` +
            tickets.slice(0, 3).map((t) => `• ${t.subject || "Order inquiry"} (${t.user || "Customer"})`).join("\n") +
            `\n\n`;
        }

        adminGreeting += `📦 **Total Orders:** ${orders.length} orders recorded across the store.\n` +
          `What management action would you like to take today?`;

        setMessages([
          {
            id: "greet_admin",
            role: "assistant",
            content: adminGreeting,
            sources: [],
            provider: "Boss Store Intelligence",
            adminActions: audit.outOfStock.map((p) => p.name || p.title)
          }
        ]);
      } else {
        // Greet customer intelligently based on scroll & watch history
        let greeting = "";
        let sources = [];

        if (viewedProducts && viewedProducts.length > 0) {
          const latest = viewedProducts[0];
          greeting = `Hello! Welcome to R-Mart. I noticed you were exploring **${latest.title}** ($${latest.price}) while browsing our catalog.\n\n` +
            `Would you like to review its technical specifications, check delivery availability, or compare it with similar options? Let me know how I can help!`;
          sources = [latest];
        } else {
          greeting = `Hello! I'm Sparky, your AI shopping concierge at R-Mart.\n\n` +
            `I have complete knowledge of our live product catalog, active discount codes (such as **FLASH50**), and direct access to your order history. What can I find for you today?`;
        }

        setMessages([
          {
            id: "greet_customer",
            role: "assistant",
            content: greeting,
            sources,
            provider: "Sparky Concierge"
          }
        ]);
      }
    }
  }, [isOpen, messages.length, isAdmin, viewedProducts]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (typeof messagesEndRef.current?.scrollIntoView === "function") {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Dynamic Suggestion Chips
  const getSuggestions = () => {
    if (isAdmin) {
      return [
        "Report all out-of-stock items 📦",
        "Review customer inquiries & complaints 📩",
        "Review all customers orders 🚚",
        "Restock depleted inventory ⚡",
        "Tell me a boss joke 😄"
      ];
    }

    if (viewedProducts && viewedProducts.length > 0) {
      const latest = viewedProducts[0];
      const shortTitle = latest.title ? latest.title.split(" ").slice(0, 6).join(" ") : "this product";
      return [
        "What's new in R-Mart Sparkyyy? 🎁",
        `Tell me about ${shortTitle} 🏷️`,
        "Where is my order & history? 🚚",
        "What is my saved address & profile? 📍",
        "Tell me a shopping joke! 😂"
      ];
    }
    return DEFAULT_SUGGESTIONS;
  };

  // Send Chat Message via SSE Streaming with Intelligent Fallback (No robotic cliché)
  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || input).trim();
    if (!query || isStreaming) return;

    setInput("");
    const userMsgId = `user_${Date.now()}`;
    const botMsgId = `bot_${Date.now()}`;

    // Auto-log inquiry for Boss Admin if shopper asks about new items/offers
    const qLower = query.toLowerCase();
    if (!isAdmin && (qLower.includes("what's new") || qLower.includes("whats new") || qLower.includes("sparkyyy") || qLower.includes("offer") || qLower.includes("discount"))) {
      try {
        const existing = JSON.parse(localStorage.getItem("rmart_support_tickets") || "[]");
        const newTicket = {
          id: `TCK-${Date.now().toString().slice(-4)}`,
          subject: "Customer asked: What's new in R-Mart & latest offers?",
          user: user?.name || "Shopper (via Sparky)",
          text: query,
          date: new Date().toLocaleDateString()
        };
        localStorage.setItem("rmart_support_tickets", JSON.stringify([newTicket, ...existing]));
      } catch (e) {
        console.warn("Failed to log admin inquiry ticket:", e);
      }
    }

    const newMessages = [
      ...messages,
      { id: userMsgId, role: "user", content: query }
    ];

    setMessages([
      ...newMessages,
      {
        id: botMsgId,
        role: "assistant",
        content: "",
        sources: [],
        provider: "Connecting..."
      }
    ]);

    setIsStreaming(true);

    try {
      const apiBase = env.API_BASE_URL || (env.API_URL || "http://localhost:8000").replace(/\/api\/v1\/?$/, "");
      const historyPayload = messages.slice(-4).map((m) => ({
        role: m.role,
        content: m.content
      }));

      const response = await fetch(`${apiBase}/api/v1/ai/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: query, history: historyPayload })
      });

      if (!response.ok) {
        throw new Error(`SSE endpoint returned status ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = "";
      let collectedSources = [];
      let detectedProvider = "R-Mart AI Intelligence";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunkText = decoder.decode(value, { stream: true });
        const lines = chunkText.split("\n");

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line.startsWith("event: metadata")) {
            const nextLine = lines[i + 1]?.trim();
            if (nextLine?.startsWith("data:")) {
              try {
                const data = JSON.parse(nextLine.slice(5).trim());
                if (data.sources) collectedSources = data.sources;
              } catch {}
            }
          } else if (line.startsWith("event: provider")) {
            const nextLine = lines[i + 1]?.trim();
            if (nextLine?.startsWith("data:")) {
              try {
                const data = JSON.parse(nextLine.slice(5).trim());
                if (data.provider) {
                  detectedProvider = data.provider;
                  setActiveProvider(data.provider);
                }
              } catch {}
            }
          } else if (line.startsWith("event: token")) {
            const nextLine = lines[i + 1]?.trim();
            if (nextLine?.startsWith("data:")) {
              try {
                const data = JSON.parse(nextLine.slice(5).trim());
                if (data.token) {
                  accumulatedText += data.token;
                }
              } catch {}
            }
          }

          setMessages((prev) =>
            prev.map((m) =>
              m.id === botMsgId
                ? {
                    ...m,
                    content: accumulatedText,
                    sources: collectedSources,
                    provider: detectedProvider
                  }
                : m
            )
          );
        }
      }
    } catch (err) {
      console.warn("[Sparky AI] Server stream fallback engaged:", err);

      // Articulate, Thoughtful Local Knowledge Engine (No "Beep-Boop", No Question Parroting)
      const randomJoke = FUN_JOKES[Math.floor(Math.random() * FUN_JOKES.length)];
      let fallbackReply = "";
      let fallbackSources = [];

      if (isAdmin) {
        const audit = getCatalogAudit();
        const tickets = getCustomerComplaints();
        const orders = JSON.parse(localStorage.getItem("rmart_orders") || "[]");

        if (qLower.includes("stock") || qLower.includes("out of stock") || qLower.includes("inventory")) {
          fallbackReply = `Here is the current live warehouse stock status:\n\n` +
            (audit.outOfStock.length > 0
              ? `🚨 **${audit.outOfStock.length} Product(s) Depleted:**\n` + audit.outOfStock.map((p) => `• ${p.name || p.title} ($${p.price}) — 0 units available`).join("\n") +
                `\n\nTap the action buttons below to replenish stock immediately.`
              : `✅ All products currently have active stock. No shortages detected.`);
        } else if (qLower.includes("complaint") || qLower.includes("inquir") || qLower.includes("ticket")) {
          fallbackReply = `Here are the active customer inquiries and support tickets:\n\n` +
            (tickets.length > 0
              ? `📩 **${tickets.length} Ticket(s) on File:**\n` + tickets.map((t) => `• [${t.id || "TCK"}] ${t.subject || "Issue"} (${t.user || "Customer"})`).join("\n")
              : `💬 There are currently no open customer complaints.`);
        } else if (qLower.includes("order") || qLower.includes("customer")) {
          fallbackReply = `Here is your customer order fulfillment overview:\n\n` +
            (orders.length > 0
              ? `📦 **${orders.length} Order(s) Processed:**\n` + orders.slice(0, 4).map((o, i) => `• Order #${o.orderId || o.id || (1000 + i)}: $${Number(o.total || o.total_amount || 0).toFixed(2)} (${o.status || "Processing"})`).join("\n") +
                `\n\nYou can inspect fulfillment stages and generate invoices from the Admin Console.`
              : `📦 No customer orders placed yet.`);
        } else if (qLower.includes("joke")) {
          fallbackReply = `Here is a lighthearted joke for you:\n\n${randomJoke}`;
        } else {
          fallbackReply = `Administrator briefing for **"${query}"**:\n\n` +
            `• Out-of-stock items: ${audit.outOfStock.length}\n` +
            `• Open customer tickets: ${tickets.length}\n` +
            `• Total customer orders: ${orders.length}\n\n` +
            `You can review individual orders and restock inventory directly through this console.`;
        }
      } else {
        // Customer Shopping Intelligence with Full State Access
        if (qLower.includes("order") || qLower.includes("track") || qLower.includes("shipment") || qLower.includes("delivery") || qLower.includes("purchased") || qLower.includes("receipt") || qLower.includes("history")) {
          const localOrders = JSON.parse(localStorage.getItem("rmart_orders") || "[]");
          if (localOrders.length > 0) {
            const recent = localOrders.slice(0, 3);
            let ordersText = `You have **${localOrders.length} order(s)** on record. Here is your recent order activity:\n\n`;
            recent.forEach((ord, i) => {
              const id = ord.orderId || ord.id || `#RM-${1000 + i}`;
              const status = ord.status || "Processing";
              const total = ord.total || ord.total_amount || 0;
              const date = ord.date || ord.created_at || "Recent";
              const items = (ord.items || []).map((it) => `${it.product_name || it.name || it.title || "Item"} (${it.quantity || it.qty || 1}x)`).join(", ") || "Electronics Package";
              ordersText += `**${i + 1}. Order ${id}**\n• Status: **${status}** 🚚\n• Total: **$${Number(total).toFixed(2)}**\n• Items: ${items}\n• Placed: ${date}\n\n`;
            });
            ordersText += `You can download official PDF invoices or review delivery stages anytime under **My Orders** in the top navigation.`;
            fallbackReply = ordersText;
          } else {
            fallbackReply = `You haven't placed any orders yet in R-Mart.\n\nOnce an order is confirmed, you can track delivery progress and download PDF receipts here. You can also use code **FLASH50** for 50% off your first purchase!`;
          }
        } else if (qLower.includes("address") || qLower.includes("profile") || qLower.includes("my name") || qLower.includes("my email") || qLower.includes("phone number") || qLower.includes("my phone") || qLower.includes("my account") || qLower.includes("who am i")) {
          const uName = user?.name || "Valued Shopper";
          const uEmail = user?.email || "customer@rmart.com";
          const uPhone = localStorage.getItem("rmart_user_phone") || user?.phone || "+91 98765 43210";
          const uAddress = localStorage.getItem("rmart_user_address") || user?.address || "Flat 402, Guntur Main Road, Andhra Pradesh";

          fallbackReply = `Here are your registered account and delivery details:\n\n` +
            `• **Name:** ${uName}\n` +
            `• **Email:** ${uEmail}\n` +
            `• **Phone:** ${uPhone}\n` +
            `• **Shipping Address:** ${uAddress}\n\n` +
            `You can edit your delivery address and contact phone anytime using the top menu under **Edit Profile & Address**.`;
        } else if (qLower.includes("cart") || qLower.includes("bag") || qLower.includes("subtotal") || qLower.includes("basket")) {
          const cartItems = useCartStore.getState().cart || [];
          if (cartItems.length > 0) {
            const subtotal = cartItems.reduce((acc, it) => acc + (Number(it.price || 0) * (it.quantity || 1)), 0);
            let cartText = `You currently have **${cartItems.length} item(s)** in your shopping bag:\n\n`;
            cartItems.forEach((it) => {
              cartText += `• **${it.name || it.title}** (x${it.quantity || 1}) — $${(Number(it.price || 0) * (it.quantity || 1)).toFixed(2)}\n`;
            });
            cartText += `\n💰 **Estimated Subtotal:** $${subtotal.toFixed(2)}\n\nYou can proceed to checkout by clicking the cart icon in the top navigation!`;
            fallbackReply = cartText;
          } else {
            fallbackReply = `Your shopping bag is currently empty. Feel free to ask me for product recommendations like the Sony WH-1000XM5 headphones or Samsung Galaxy S24 Ultra!`;
          }
        } else if (qLower.includes("what's new") || qLower.includes("whats new") || qLower.includes("sparkyyy") || qLower.includes("offer") || qLower.includes("deal") || qLower.includes("discount") || qLower.includes("coupon")) {
          const banner = useUIStore.getState().newsBannerText || "⚡ Flash Sale: 50% OFF with code FLASH50";
          fallbackReply = `Here is what is currently trending and newly stocked at R-Mart:\n\n` +
            `🔥 **LATEST ARRIVALS:**\n` +
            `• **Samsung Galaxy S24 Ultra AI** ($1299.99) — Live Translation & Titanium Armor\n` +
            `• **Sony WH-1000XM5 Wireless Headphones** ($349.99) — 30hr battery & active noise cancelling\n` +
            `• **Apple iPhone 15 Pro Max 256GB** ($1199.99) — Aerospace titanium with A17 Pro chip\n\n` +
            `🎉 **ACTIVE DISCOUNT CODES:**\n` +
            `• **FLASH50**: 50% OFF on select high-demand electronics\n` +
            `• **FREESHIP**: Zero-cost express delivery on orders over $99\n\n` +
            `📢 **STORE ANNOUNCEMENT:**\n` +
            `"${banner}"\n\n` +
            `I have also logged your interest with the Boss Admin so they can review demand and drop even more promotions! 🚀\n\n` +
            `[Source: Samsung Galaxy S24 Ultra (ID: #3, $1299.99)]\n` +
            `[Source: Sony WH-1000XM5 Wireless Headphones (ID: #2, $349.99)]`;
          fallbackSources = [
            { id: 3, title: "Samsung Galaxy S24 Ultra", price: 1299.99, stock: 8 },
            { id: 2, title: "Sony WH-1000XM5 Wireless Headphones", price: 349.99, stock: 15 },
            { id: 1, title: "Apple iPhone 15 Pro Max 256GB", price: 1199.99, stock: 0 }
          ];
        } else if (qLower.includes("joke") || qLower.includes("funny") || qLower.includes("laugh")) {
          fallbackReply = `Here is a quick joke for you:\n\n${randomJoke}`;
        } else if (qLower.includes("iphone") || qLower.includes("apple")) {
          fallbackReply = `Here is the current status for the **Apple iPhone 15 Pro Max 256GB** ($1199.99):\n\n` +
            `⚠️ Note: This item currently has **0 units in stock**.\n` +
            `Don't worry though — **I will say my boss admin to add stock as soon as possible - make it available!** 🚀\n\n` +
            `[Source: Apple iPhone 15 Pro Max 256GB (ID: #1, $1199.99)]`;
          fallbackSources = [{ id: 1, title: "Apple iPhone 15 Pro Max 256GB", price: 1199.99, stock: 0 }];
        } else if (qLower.includes("headphone") || qLower.includes("audio") || qLower.includes("sony") || qLower.includes("sound")) {
          fallbackReply = `Here are the top-rated headphones ready in our warehouse:\n\n` +
            `• **Sony WH-1000XM5 Wireless Headphones** ($349.99) — In Stock & ready to ship!\n` +
            `Features industry-leading noise cancellation with 30-hour battery life and multi-device pairing.\n\n` +
            `[Source: Sony WH-1000XM5 Wireless Headphones (ID: #2, $349.99)]`;
          fallbackSources = [{ id: 2, title: "Sony WH-1000XM5 Wireless Headphones", price: 349.99, stock: 15 }];
        } else if (qLower.includes("samsung") || qLower.includes("galaxy") || qLower.includes("s24")) {
          fallbackReply = `Here are details on the **Samsung Galaxy S24 Ultra 5G AI** ($1299.99):\n\n` +
            `• In Stock (8 units ready for express dispatch)\n` +
            `• Features built-in S Pen, Titanium chassis, and on-device AI live translation.\n\n` +
            `[Source: Samsung Galaxy S24 Ultra (ID: #3, $1299.99)]`;
          fallbackSources = [{ id: 3, title: "Samsung Galaxy S24 Ultra", price: 1299.99, stock: 8 }];
        } else {
          fallbackReply = `I reviewed our warehouse inventory regarding **"${query}"**.\n\n` +
            `All in-stock products are eligible for express checkout and same-day handling. If an item runs out of stock, **I will say my boss admin to add stock as soon as possible - make it available!** 🚀\n\n` +
            `You can ask me to look up specific product specs, review your order history, or check active promo codes.`;
        }
      }

      let currentText = "";
      const words = fallbackReply.split(" ");
      for (const w of words) {
        currentText += (currentText ? " " : "") + w;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === botMsgId
              ? {
                  ...m,
                  content: currentText,
                  sources: fallbackSources,
                  provider: isAdmin ? "Boss Executive AI" : "Sparky Store Knowledge Engine"
                }
              : m
          )
        );
        await new Promise((r) => setTimeout(r, 12));
      }
    } finally {
      setIsStreaming(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  return (
    <>
      {/* 1. SCREEN GOES PITCH DARK OVERLAY WHEN BOT IS CLICKED */}
      {isOpen && (
        <div
          data-testid="ai-dark-backdrop"
          onClick={() => setIsOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.94)",
            backdropFilter: "blur(28px)",
            WebkitBackdropFilter: "blur(28px)",
            zIndex: 9998,
            animation: "fadeInBackdrop 0.25s ease-out forwards",
            transition: "all 0.3s ease"
          }}
        />
      )}

      {/* 2. SLEEK, UNOBTRUSIVE BOT TRIGGER (Docked in Corner - Never Occupies Space on Screen) */}
      {!isOpen && (
        <div
          data-testid="sneakpeek-robo-container"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={() => setIsOpen(true)}
          title="Open Sparky AI Assistant"
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            zIndex: 999,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            userSelect: "none",
            transform: isHovered ? "scale(1.08)" : "scale(1)",
            transition: "transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)"
          }}
        >
          {/* Compact Pill Badge */}
          <div
            data-testid="robo-speech-bubble"
            style={{
              backgroundColor: isDark ? "#0F172A" : "#FFFFFF",
              color: isAdmin ? "#F59E0B" : "#38BDF8",
              border: `1.5px solid ${isAdmin ? "#F59E0B" : "#38BDF8"}`,
              padding: "5px 12px",
              borderRadius: "20px",
              fontSize: "11px",
              fontWeight: "800",
              boxShadow: "0 4px 14px rgba(0, 0, 0, 0.35)",
              whiteSpace: "nowrap",
              transition: "all 0.2s ease"
            }}
          >
            {isAdmin ? "Admin AI 🛡️" : "Sparky AI 🤖"}
          </div>

          {/* Compact 56px Sleek Circular Mascot Trigger */}
          <div
            data-testid="sneakpeek-robo-avatar"
            style={{
              width: "58px",
              height: "58px",
              borderRadius: "50%",
              backgroundColor: isDark ? "#0A0E1A" : "#FFFFFF",
              border: `2.5px solid ${isAdmin ? "#F59E0B" : "#38BDF8"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: isAdmin
                ? "0 8px 25px rgba(245, 158, 11, 0.5), inset 0 0 12px rgba(245, 158, 11, 0.2)"
                : "0 8px 25px rgba(56, 189, 248, 0.45), inset 0 0 12px rgba(56, 189, 248, 0.2)",
              position: "relative"
            }}
          >
            <svg viewBox="0 0 100 100" width="76%" height="76%">
              {/* Antenna */}
              <line x1="50" y1="20" x2="50" y2="8" stroke={isAdmin ? "#F59E0B" : "#38BDF8"} strokeWidth="4" strokeLinecap="round" />
              <circle cx="50" cy="7" r="5" fill={isAdmin ? "#F59E0B" : "#38BDF8"} />

              {/* Head */}
              <rect x="22" y="18" width="56" height="42" rx="14" fill="#0F172A" stroke={isAdmin ? "#F59E0B" : "#38BDF8"} strokeWidth="3.5" />

              {/* Eyes Visor Screen */}
              <rect x="28" y="26" width="44" height="20" rx="8" fill="#030712" />

              {/* Glowing Eyes */}
              <circle cx="40" cy="36" r="4.5" fill={isAdmin ? "#F59E0B" : "#38BDF8"} />
              <circle cx="60" cy="36" r="4.5" fill={isAdmin ? "#F59E0B" : "#38BDF8"} />

              {/* Cheerful Smile */}
              <path d="M 44 44 Q 50 48 56 44" stroke={isAdmin ? "#F59E0B" : "#38BDF8"} strokeWidth="2.5" fill="none" strokeLinecap="round" />

              {/* Body */}
              <rect x="28" y="60" width="44" height="26" rx="10" fill="#1E293B" stroke={isAdmin ? "#F59E0B" : "#38BDF8"} strokeWidth="3" />
              <circle cx="50" cy="72" r="5" fill={isAdmin ? "#F59E0B" : "#38BDF8"} />
            </svg>

            {/* Online Green Indicator Dot */}
            <span
              style={{
                position: "absolute",
                top: "2px",
                right: "2px",
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                backgroundColor: "#10B981",
                border: "2px solid #0A0E1A"
              }}
            />
          </div>
        </div>
      )}

      {/* 3. FULL DARK SCREEN AI CHAT MODAL - SPARKY JUMPS ON SCREEN */}
      {isOpen && (
        <div
          data-testid="ai-chat-modal"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            backgroundColor: "rgba(5, 8, 18, 0.96)",
            backdropFilter: "blur(28px)",
            WebkitBackdropFilter: "blur(28px)",
            color: "#FFFFFF",
            padding: "16px",
            overflow: "hidden",
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
          }}
        >
          {/* Centered Command Console */}
          <div
            style={{
              maxWidth: "980px",
              width: "100%",
              height: "100%",
              margin: "0 auto",
              display: "flex",
              flexDirection: "column",
              backgroundColor: "rgba(11, 15, 25, 0.94)",
              border: `1px solid ${isAdmin ? "rgba(245, 158, 11, 0.35)" : "rgba(56, 189, 248, 0.3)"}`,
              borderRadius: "24px",
              boxShadow: "0 25px 70px rgba(0, 0, 0, 0.95)",
              overflow: "hidden"
            }}
          >
            {/* Immersive Header (Jumping Robot & Clean Controls - Voice Toggle Removed from Top!) */}
            <div
              style={{
                padding: "16px 24px",
                backgroundColor: "rgba(15, 23, 42, 0.85)",
                borderBottom: `1px solid ${isAdmin ? "rgba(245, 158, 11, 0.2)" : "rgba(56, 189, 248, 0.2)"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                {/* SPARKY JUMPS ON SCREEN ANIMATED AVATAR */}
                <div
                  style={{
                    width: "50px",
                    height: "50px",
                    borderRadius: "16px",
                    backgroundColor: isAdmin ? "#F59E0B" : "#38BDF8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "26px",
                    boxShadow: isAdmin
                      ? "0 4px 18px rgba(245, 158, 11, 0.5)"
                      : "0 4px 18px rgba(56, 189, 248, 0.5)",
                    animation: "sparkyLeap 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)"
                  }}
                >
                  {isAdmin ? "🛡️" : "🤖"}
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <h3 style={{ margin: 0, fontSize: "19px", fontWeight: "900", letterSpacing: "-0.3px", color: "#FFFFFF" }}>
                      {isAdmin ? "Boss Store Command Intelligence" : "Sparky AI Assistant"}
                    </h3>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: "800",
                        padding: "2px 8px",
                        borderRadius: "8px",
                        backgroundColor: isAdmin ? "rgba(245, 158, 11, 0.25)" : "rgba(16, 185, 129, 0.25)",
                        color: isAdmin ? "#F59E0B" : "#10B981"
                      }}
                    >
                      {isAdmin ? "ADMIN CONSOLE" : "ONLINE • FULL KNOWLEDGE"}
                    </span>
                  </div>
                  <div style={{ fontSize: "12px", color: "#94A3B8", marginTop: "2px" }}>
                    {isAdmin
                      ? "Direct control over inventory, customer tickets, and orders"
                      : "Grounded in live store catalog, your order stream & delivery profile"}
                  </div>
                </div>
              </div>

              {/* Clean Top Controls (Voice toggle removed from top!) */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <button
                  onClick={handleClearChat}
                  title="Clear Conversation"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "#94A3B8",
                    fontSize: "14px",
                    cursor: "pointer",
                    padding: "7px 12px",
                    borderRadius: "10px",
                    fontWeight: "700"
                  }}
                >
                  Clear Chat
                </button>

                <button
                  onClick={() => setIsOpen(false)}
                  title="Close Assistant"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.12)",
                    border: "none",
                    color: "#FFFFFF",
                    borderRadius: "50%",
                    width: "36px",
                    height: "36px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "17px",
                    fontWeight: "bold",
                    cursor: "pointer"
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Messages Stream with Highly Legible Typography & Sparky Message Cards */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "20px"
              }}
            >
              {messages.map((m) => {
                const isUser = m.role === "user";
                return (
                  <div
                    key={m.id}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: isUser ? "flex-end" : "flex-start",
                      width: "100%"
                    }}
                  >
                    {/* SPARKY MESSAGE CARD */}
                    <div
                      style={{
                        maxWidth: isUser ? "75%" : "88%",
                        backgroundColor: isUser
                          ? (isAdmin ? "#D97706" : "#0284C7")
                          : "rgba(15, 23, 42, 0.88)",
                        border: isUser
                          ? "none"
                          : `1px solid ${isAdmin ? "rgba(245, 158, 11, 0.3)" : "rgba(56, 189, 248, 0.25)"}`,
                        borderRadius: "20px",
                        padding: "20px 24px",
                        boxShadow: isUser
                          ? "0 6px 20px rgba(2, 132, 199, 0.35)"
                          : "0 8px 30px rgba(0, 0, 0, 0.4)",
                        color: "#FFFFFF",
                        position: "relative"
                      }}
                    >
                      {/* Card Header Tag */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: "12px",
                          borderBottom: isUser ? "1px solid rgba(255,255,255,0.2)" : "1px solid rgba(255,255,255,0.08)",
                          paddingBottom: "8px"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "16px" }}>{isUser ? "👤" : isAdmin ? "🛡️" : "🤖"}</span>
                          <span style={{ fontSize: "13px", fontWeight: "900", color: isUser ? "#FFFFFF" : isAdmin ? "#F59E0B" : "#38BDF8" }}>
                            {isUser ? "You" : isAdmin ? "Boss Executive AI" : "Sparky AI Assistant"}
                          </span>
                        </div>

                        {!isUser && (
                          <span style={{ fontSize: "11px", color: "#94A3B8" }}>
                            {m.provider || "Store Intelligence"}
                          </span>
                        )}
                      </div>

                      {/* Card Body with Highly Legible Font & Clear Spacing */}
                      <div
                        style={{
                          fontSize: "14.5px",
                          lineHeight: "1.7",
                          whiteSpace: "pre-wrap",
                          fontWeight: isUser ? "500" : "400",
                          color: "#F8FAFC",
                          letterSpacing: "0.2px"
                        }}
                      >
                        {m.content || (isStreaming ? "Analyzing catalog and reasoning... ⚡" : "")}
                      </div>

                      {/* VOICE SPEAKER: PLACED NATURALLY UNDER SPARKY REPLIES ONLY */}
                      {!isUser && m.content && (
                        <div style={{ marginTop: "14px", paddingTop: "10px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                          <button
                            onClick={() => speakTextInNaturalAccent(m.content)}
                            title="Listen to this response in a natural English accent"
                            style={{
                              backgroundColor: "rgba(56, 189, 248, 0.12)",
                              border: "1px solid rgba(56, 189, 248, 0.3)",
                              color: "#38BDF8",
                              borderRadius: "10px",
                              padding: "6px 14px",
                              fontSize: "12px",
                              fontWeight: "700",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              transition: "all 0.15s ease"
                            }}
                          >
                            <span>🔊</span>
                            <span>Listen in Natural Accent</span>
                          </button>
                        </div>
                      )}

                      {/* Admin Quick Restock Action Buttons */}
                      {!isUser && m.adminActions && m.adminActions.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "14px" }}>
                          {m.adminActions.map((name, i) => (
                            <button
                              key={i}
                              onClick={() => handleQuickRestock(name, 20)}
                              style={{
                                padding: "8px 14px",
                                borderRadius: "10px",
                                border: "none",
                                backgroundColor: "#10B981",
                                color: "#FFFFFF",
                                fontSize: "12px",
                                fontWeight: "800",
                                cursor: "pointer",
                                boxShadow: "0 2px 10px rgba(16, 185, 129, 0.4)",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px"
                              }}
                            >
                              <span>➕</span>
                              <span>Add 20 Stock to {name.split(" ").slice(0, 3).join(" ")}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Interactive Product Source Citations */}
                      {!isUser && m.sources && m.sources.length > 0 && (
                        <div style={{ marginTop: "16px", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "12px" }}>
                          <div style={{ fontSize: "11px", fontWeight: "800", color: "#94A3B8", marginBottom: "8px" }}>
                            🏷️ Referenced Catalog Items ({m.sources.length}):
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "10px" }}>
                            {m.sources.map((src) => (
                              <div
                                key={src.id}
                                style={{
                                  backgroundColor: "rgba(30, 41, 59, 0.6)",
                                  border: "1px solid rgba(255, 255, 255, 0.1)",
                                  borderRadius: "14px",
                                  padding: "12px 14px",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  gap: "10px"
                                }}
                              >
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: "13px", fontWeight: "800", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                    {src.title}
                                  </div>
                                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                                    <span style={{ color: "#F59E0B", fontWeight: "900", fontSize: "13px" }}>
                                      ${src.price?.toFixed(2)}
                                    </span>
                                    <span style={{ fontSize: "10px", fontWeight: "800", color: src.stock > 0 ? "#10B981" : "#EF4444" }}>
                                      {src.stock > 0 ? `In Stock (${src.stock})` : "Out of Stock"}
                                    </span>
                                  </div>
                                </div>

                                {src.stock > 0 ? (
                                  <button
                                    onClick={() => addToCart({ id: src.id, name: src.title, price: src.price, stock: src.stock }, 1)}
                                    style={{
                                      backgroundColor: "#F59E0B",
                                      color: "#030712",
                                      border: "none",
                                      padding: "6px 12px",
                                      borderRadius: "8px",
                                      fontSize: "11px",
                                      fontWeight: "900",
                                      cursor: "pointer",
                                      whiteSpace: "nowrap"
                                    }}
                                  >
                                    + Cart
                                  </button>
                                ) : isAdmin ? (
                                  <button
                                    onClick={() => handleQuickRestock(src.title, 20)}
                                    style={{
                                      backgroundColor: "#10B981",
                                      color: "#FFFFFF",
                                      border: "none",
                                      padding: "6px 10px",
                                      borderRadius: "8px",
                                      fontSize: "11px",
                                      fontWeight: "800",
                                      cursor: "pointer"
                                    }}
                                  >
                                    + Restock
                                  </button>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestion Chips */}
            <div
              style={{
                padding: "10px 24px",
                display: "flex",
                gap: "8px",
                overflowX: "auto",
                whiteSpace: "nowrap",
                borderTop: "1px solid rgba(255,255,255,0.08)",
                backgroundColor: "rgba(15, 23, 42, 0.5)"
              }}
            >
              {getSuggestions().map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(chip)}
                  disabled={isStreaming}
                  style={{
                    padding: "7px 14px",
                    borderRadius: "999px",
                    border: `1px solid ${isAdmin ? "rgba(245, 158, 11, 0.4)" : "rgba(56, 189, 248, 0.4)"}`,
                    backgroundColor: "rgba(30, 41, 59, 0.7)",
                    color: isAdmin ? "#FDE68A" : "#38BDF8",
                    fontSize: "12px",
                    fontWeight: "700",
                    cursor: isStreaming ? "not-allowed" : "pointer",
                    transition: "all 0.15s ease",
                    flexShrink: 0
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Input Bar with Voice Mic */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              style={{
                padding: "16px 24px",
                backgroundColor: "rgba(15, 23, 42, 0.9)",
                borderTop: "1px solid rgba(255,255,255,0.08)",
                display: "flex",
                alignItems: "center",
                gap: "12px"
              }}
            >
              <button
                type="button"
                onClick={handleToggleMic}
                title={isListening ? "Listening... Click to stop" : "Speak to Sparky (Mic)"}
                style={{
                  width: "46px",
                  height: "46px",
                  borderRadius: "14px",
                  border: "none",
                  backgroundColor: isListening ? "#EF4444" : "rgba(30, 41, 59, 0.8)",
                  color: isListening ? "#FFFFFF" : "#38BDF8",
                  fontSize: "20px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  animation: isListening ? "pulse 1s infinite" : "none"
                }}
              >
                🎙️
              </button>

              <input
                data-testid="ai-chat-input"
                type="text"
                placeholder={
                  isListening
                    ? "Listening to your voice..."
                    : isAdmin
                    ? "Ask Boss Intelligence about stock, tickets, or orders..."
                    : "Ask Sparky about products, your orders, delivery address, cart, or deals..."
                }
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isStreaming}
                style={{
                  flex: 1,
                  padding: "14px 18px",
                  borderRadius: "14px",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  backgroundColor: "rgba(3, 7, 18, 0.8)",
                  color: "#FFFFFF",
                  fontSize: "14.5px",
                  outline: "none"
                }}
              />

              <button
                data-testid="ai-chat-send-btn"
                type="submit"
                disabled={!input.trim() || isStreaming}
                style={{
                  width: "46px",
                  height: "46px",
                  borderRadius: "14px",
                  border: "none",
                  backgroundColor: isAdmin ? "#F59E0B" : "#38BDF8",
                  color: "#030712",
                  fontWeight: "900",
                  fontSize: "18px",
                  cursor: !input.trim() || isStreaming ? "not-allowed" : "pointer",
                  opacity: !input.trim() || isStreaming ? 0.4 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                ➤
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
