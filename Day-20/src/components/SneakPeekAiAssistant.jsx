import React, { useState, useEffect, useRef } from "react";
import { useCartStore, useUIStore, useAuthStore } from "../store/useStore";
import { env } from "../config/env";

const INITIAL_GREETINGS = [
  "Beep-boop! 🤖 Hey there shopper! I'm Sparky, your 24/7 AI shopping assistant at R-Mart with full access to your orders, profile, cart & deals. How can I help you today?",
  "Bzzzt! ⚡ Greetings human friend! Looking for epic gadgets, secret discounts, order tracking, or specs? I've indexed the entire store catalog and your profile!",
  "Greetings! 🤖 I was just playing hide-and-seek in the corners! What can I look up for you? Ask me about your orders, address, cart, or discounts!",
  "Beep! 🤖 Ready to assist! Tell me what you're shopping for, and I'll find the best in-stock products, exact prices, or check your order history!"
];

const DEFAULT_SUGGESTIONS = [
  "What's new in R-Mart Sparkyyy? 🎁",
  "Where is my order & history? 🚚",
  "What is my saved address & profile? 📍",
  "What is currently in my cart? 🛒",
  "Tell me a funny shopping joke! 😂"
];

// Screen positions strictly in the bottom corners so the bot never covers the screen
const PEEK_POSITIONS = [
  { id: "bottom-right", style: { bottom: "0px", right: "20px" } },
  { id: "bottom-left", style: { bottom: "0px", left: "20px" } }
];

const FUN_JOKES = [
  "Why do computers overheat? Because they have too many fans! 💻😂",
  "Why did the smartphone need glasses? Because it lost all its contacts! 📱👓",
  "Why do programmers prefer dark mode? Because light attracts bugs! 🐛🌙",
  "Why was the JavaScript developer sad? Because they didn't Node how to Express themselves! ☕",
  "There are 10 types of people: those who understand binary, and those who don't! 🤖"
];

export default function SneakPeekAiAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeProvider, setActiveProvider] = useState("Store Knowledge Engine");
  const [viewedProducts, setViewedProducts] = useState([]);

  // Hide and Seek animation state - Corner only!
  const [isHiding, setIsHiding] = useState(false);
  const [positionIndex, setPositionIndex] = useState(0);
  const [speechBubbleText, setSpeechBubbleText] = useState("Peek-a-boo! Can't catch me! 👀");
  const [isHovered, setIsHovered] = useState(false);

  // Speech Recognition (Mic) and Speech Synthesis (Voice)
  const [isListening, setIsListening] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
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

  // Hide-and-seek interval: Bot peeks in and out from corners ONLY
  useEffect(() => {
    if (isOpen) return;

    const phrases = [
      "Peek-a-boo! In the corner! 👀",
      "Boo! Click me for store magic! ✨",
      "Psst! I know all deals & orders! 🤖",
      "Playing hide & seek in the corner! 🎮",
      "Tap me for Sparky AI Assistant! 💡"
    ];

    const interval = setInterval(() => {
      setIsHiding(true);
      setTimeout(() => {
        setPositionIndex((prev) => (prev + 1) % PEEK_POSITIONS.length);
        const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
        setSpeechBubbleText(randomPhrase);
        setIsHiding(false);
      }, 500);
    }, 8000);

    return () => clearInterval(interval);
  }, [isOpen]);

  // Text to Speech
  const speakText = (text) => {
    if (!("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const clean = text.replace(/\[Source:[^\]]+\]/g, "").replace(/[*_#`~]/g, "");
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.pitch = 1.2;
      utterance.rate = 1.05;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("TTS error:", e);
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
          content: `✅ Done Boss! Added **+${qty} units** to **${productName}**. Stock is now active and shoppers can purchase! 🚀`,
          sources: [],
          provider: "Boss Admin Action Engine"
        }
      ]);
    } catch (e) {
      console.warn("Restock error:", e);
    }
  };

  // Initialize greeting on chat open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      if (isAdmin) {
        const audit = getCatalogAudit();
        const tickets = getCustomerComplaints();
        const orders = JSON.parse(localStorage.getItem("rmart_orders") || "[]");

        let adminGreeting = `Greetings Boss Admin! 🫡 Sparky Operational Assistant reporting for duty with full store access.\n\n`;

        if (audit.outOfStock.length > 0) {
          adminGreeting += `🚨 **LIVE INVENTORY ALERT:**\nThe following product(s) have **RUN OUT OF STOCK (0 units)**:\n`;
          audit.outOfStock.forEach((p) => {
            adminGreeting += `• **${p.name || p.title}** ($${p.price}) — *Shoppers are asking for this!*\n`;
          });
          adminGreeting += `\nTap the action buttons below to replenish stock immediately!\n\n`;
        } else {
          adminGreeting += `✅ All catalog items currently have active inventory.\n\n`;
        }

        if (tickets.length > 0) {
          adminGreeting += `📩 **CUSTOMER INQUIRIES & COMPLAINTS (${tickets.length}):**\n`;
          tickets.slice(0, 3).forEach((t) => {
            adminGreeting += `• *${t.subject || "Order inquiry"}* (from ${t.user || "Customer"})\n`;
          });
          adminGreeting += `\n`;
        } else {
          adminGreeting += `💬 Customer inquiries: All clear, no pending complaints!\n\n`;
        }

        adminGreeting += `📦 **Customer Orders:** Total **${orders.length} orders** logged across the store.\n` +
          `Ask me anything about stock, customer tickets, or customer orders!`;

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
        if (isVoiceEnabled) speakText(adminGreeting);
      } else {
        const randomGreet = INITIAL_GREETINGS[Math.floor(Math.random() * INITIAL_GREETINGS.length)];
        setMessages([
          {
            id: "greet_customer",
            role: "assistant",
            content: randomGreet,
            sources: [],
            provider: "Sparky Concierge"
          }
        ]);
        if (isVoiceEnabled) speakText(randomGreet);
      }
    }
  }, [isOpen, messages.length, isAdmin, isVoiceEnabled]);

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

  // Send Chat Message via SSE Streaming with Full Knowledge Access Fallback
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

      if (isVoiceEnabled && accumulatedText) {
        speakText(accumulatedText);
      }
    } catch (err) {
      console.warn("[Sparky AI] Server stream fallback engaged:", err);

      // ======================================================================
      // FULL COMPREHENSIVE LOCAL KNOWLEDGE ENGINE (ANSWERS ANYTHING)
      // ======================================================================
      const randomJoke = FUN_JOKES[Math.floor(Math.random() * FUN_JOKES.length)];
      let fallbackReply = "";
      let fallbackSources = [];

      if (isAdmin) {
        const audit = getCatalogAudit();
        const tickets = getCustomerComplaints();
        const orders = JSON.parse(localStorage.getItem("rmart_orders") || "[]");

        if (qLower.includes("stock") || qLower.includes("out of stock") || qLower.includes("inventory")) {
          fallbackReply = `Boss! Here is your live stock status:\n\n` +
            (audit.outOfStock.length > 0
              ? `🚨 **${audit.outOfStock.length} Products OUT OF STOCK:**\n` + audit.outOfStock.map((p) => `• ${p.name || p.title} ($${p.price})`).join("\n") +
                `\n\nTap the action buttons below to replenish stock immediately!`
              : `✅ All products have active inventory. No stock shortages detected!`);
        } else if (qLower.includes("complaint") || qLower.includes("inquir") || qLower.includes("ticket")) {
          fallbackReply = `Boss! Here are current customer inquiries & complaints:\n\n` +
            (tickets.length > 0
              ? `📩 **${tickets.length} Tickets on File:**\n` + tickets.map((t) => `• [${t.id || "TCK"}] ${t.subject || "Issue"} (${t.user || "Customer"})`).join("\n")
              : `💬 No open complaints! Customers are satisfied.`);
        } else if (qLower.includes("order") || qLower.includes("customer")) {
          fallbackReply = `Boss! Here is your customer orders summary:\n\n` +
            (orders.length > 0
              ? `📦 **${orders.length} Customer Orders on File:**\n` + orders.slice(0, 4).map((o, i) => `• Order #${o.orderId || o.id || (1000 + i)}: $${Number(o.total || o.total_amount || 0).toFixed(2)} (${o.status || "Processing"})`).join("\n") +
                `\n\nYou can review customer fulfillment and download invoices directly from the Admin Customers Orders tab!`
              : `📦 No customer orders placed yet!`);
        } else if (qLower.includes("joke")) {
          fallbackReply = `Here's a joke for the Boss! 😂\n\n**${randomJoke}**\n\nReady for more store management tasks! 🫡`;
        } else {
          fallbackReply = `Salute, Boss Admin! 🫡 I scanned the store regarding **"${query}"**.\n\n` +
            `• Out-of-stock items: ${audit.outOfStock.length}\n` +
            `• Open customer tickets: ${tickets.length}\n` +
            `• Total customer orders: ${orders.length}\n\n` +
            `I have full administrative authority over inventory, tickets, and customer orders!`;
        }
      } else {
        // Customer Shopping Intelligence with Full State Access
        if (qLower.includes("order") || qLower.includes("track") || qLower.includes("shipment") || qLower.includes("delivery") || qLower.includes("purchased") || qLower.includes("receipt") || qLower.includes("history")) {
          const localOrders = JSON.parse(localStorage.getItem("rmart_orders") || "[]");
          if (localOrders.length > 0) {
            const recent = localOrders.slice(0, 3);
            let ordersText = `📦 **You have ${localOrders.length} order(s) on file!** Here is your latest order activity:\n\n`;
            recent.forEach((ord, i) => {
              const id = ord.orderId || ord.id || `#RM-${1000 + i}`;
              const status = ord.status || "Processing";
              const total = ord.total || ord.total_amount || 0;
              const date = ord.date || ord.created_at || "Recent";
              const items = (ord.items || []).map((it) => `${it.product_name || it.name || it.title || "Item"} (${it.quantity || it.qty || 1}x)`).join(", ") || "Electronics Package";
              ordersText += `**${i + 1}. Order ${id}**\n• Status: **${status}** 🚚\n• Total: **$${Number(total).toFixed(2)}**\n• Items: ${items}\n• Placed: ${date}\n\n`;
            });
            ordersText += `💡 *Tip:* You can view your full order history or download PDF invoices by visiting **My Orders** in the top-right menu!`;
            fallbackReply = ordersText;
          } else {
            fallbackReply = `📦 **Order History Status:**\n\nYou haven't placed any orders yet in R-Mart!\n\nOnce you place an order, you can ask me anytime to track delivery stages, check shipments, or download invoices. Use coupon code **FLASH50** for **50% OFF** your first purchase! 🚀\n\n😄 *${randomJoke}*`;
          }
        } else if (qLower.includes("address") || qLower.includes("profile") || qLower.includes("my name") || qLower.includes("my email") || qLower.includes("phone number") || qLower.includes("my phone") || qLower.includes("my account") || qLower.includes("who am i")) {
          const uName = user?.name || "Valued Shopper";
          const uEmail = user?.email || "customer@rmart.com";
          const uPhone = localStorage.getItem("rmart_user_phone") || user?.phone || "+91 98765 43210";
          const uAddress = localStorage.getItem("rmart_user_address") || user?.address || "Flat 402, Guntur Main Road, Andhra Pradesh";

          fallbackReply = `👤 **Your Registered Shopper Profile & Address:**\n\n` +
            `• **Name:** ${uName}\n` +
            `• **Email:** ${uEmail}\n` +
            `• **Phone:** ${uPhone}\n` +
            `• **Shipping Address:** ${uAddress}\n\n` +
            `💡 *Tip:* You can edit your name, phone number, and delivery address anytime using the top-right menu under **Edit Profile & Address**!`;
        } else if (qLower.includes("cart") || qLower.includes("bag") || qLower.includes("subtotal") || qLower.includes("basket")) {
          const cartItems = useCartStore.getState().cart || [];
          if (cartItems.length > 0) {
            const subtotal = cartItems.reduce((acc, it) => acc + (Number(it.price || 0) * (it.quantity || 1)), 0);
            let cartText = `🛒 **Current Shopping Bag (${cartItems.length} unique items):**\n\n`;
            cartItems.forEach((it) => {
              cartText += `• **${it.name || it.title}** x${it.quantity || 1} — $${(Number(it.price || 0) * (it.quantity || 1)).toFixed(2)}\n`;
            });
            cartText += `\n💰 **Estimated Subtotal:** $${subtotal.toFixed(2)}\n\nReady to checkout? Click the cart icon in the top header or use code **FREESHIP** for zero-cost delivery! 🚀`;
            fallbackReply = cartText;
          } else {
            fallbackReply = `🛒 Your shopping bag is currently **empty**!\n\nBrowse our electronics catalog or ask me for top recommendations like the Samsung Galaxy S24 Ultra or Sony WH-1000XM5 headphones! ✨`;
          }
        } else if (qLower.includes("what's new") || qLower.includes("whats new") || qLower.includes("sparkyyy") || qLower.includes("offer") || qLower.includes("deal") || qLower.includes("discount") || qLower.includes("coupon")) {
          const banner = useUIStore.getState().newsBannerText || "⚡ Flash Sale: 50% OFF with code FLASH50";
          fallbackReply = `✨ **Fresh Arrivals & Active Deals in R-Mart!** 🎁\n\n` +
            `Here is what just dropped in our store:\n` +
            `• **Samsung Galaxy S24 Ultra AI** ($1299.99) — Live Translation & Titanium Armor!\n` +
            `• **Sony WH-1000XM5 Wireless Headphones** ($349.99) — 30hr battery & active noise cancelling!\n` +
            `• **Apple iPhone 15 Pro Max 256GB** ($1199.99) — Aerospace titanium with A17 Pro chip!\n\n` +
            `🎉 **ACTIVE OFFERS & DISCOUNTS:**\n` +
            `• Use promo code **FLASH50** for **50% OFF** on select electronics!\n` +
            `• Use code **FREESHIP** for zero-cost express delivery on orders over $99!\n\n` +
            `📢 **STORE ANNOUNCEMENT:**\n` +
            `"${banner}"\n\n` +
            `🫡 **Boss Admin Direct Link:**\n` +
            `I immediately alerted my Boss Admin about your query so they can review demand and drop even more fresh deals and stock! 🚀\n\n` +
            `[Source: Samsung Galaxy S24 Ultra (ID: #3, $1299.99)]\n` +
            `[Source: Sony WH-1000XM5 Wireless Headphones (ID: #2, $349.99)]\n\n` +
            `😄 *P.S.* ${randomJoke}`;
          fallbackSources = [
            { id: 3, title: "Samsung Galaxy S24 Ultra", price: 1299.99, stock: 8 },
            { id: 2, title: "Sony WH-1000XM5 Wireless Headphones", price: 349.99, stock: 15 },
            { id: 1, title: "Apple iPhone 15 Pro Max 256GB", price: 1199.99, stock: 0 }
          ];
        } else if (qLower.includes("joke") || qLower.includes("funny") || qLower.includes("laugh")) {
          fallbackReply = `Beep-boop! 🤖 Here's a tech joke to brighten your shopping:\n\n**${randomJoke}**\n\nAsk me about any product, specs, or your orders! ✨`;
        } else if (qLower.includes("iphone") || qLower.includes("phone") || qLower.includes("apple")) {
          fallbackReply = `I checked our inventory for **"${query}"**! 📱\n\n` +
            `• **Apple iPhone 15 Pro Max 256GB** ($1199.99) — *Stock: 0 units*\n` +
            `Don't worry! **I will say my boss admin to add stock as soon as possible - make it available!** 🚀\n\n` +
            `[Source: Apple iPhone 15 Pro Max 256GB (ID: #1, $1199.99)]\n\n` +
            `P.S. *${randomJoke}*`;
          fallbackSources = [{ id: 1, title: "Apple iPhone 15 Pro Max 256GB", price: 1199.99, stock: 0 }];
        } else if (qLower.includes("headphone") || qLower.includes("audio") || qLower.includes("sony") || qLower.includes("sound")) {
          fallbackReply = `Awesome choice! 🎧 Here's what is ready in our warehouse:\n\n` +
            `• **Sony WH-1000XM5 Wireless Headphones** ($349.99) — In Stock & ready to ship!\n` +
            `Industry-leading noise cancelling with 30-hour battery.\n\n` +
            `[Source: Sony WH-1000XM5 Wireless Headphones (ID: #2, $349.99)]\n\n` +
            `😄 *${randomJoke}*`;
          fallbackSources = [{ id: 2, title: "Sony WH-1000XM5 Wireless Headphones", price: 349.99, stock: 15 }];
        } else if (qLower.includes("samsung") || qLower.includes("galaxy") || qLower.includes("s24")) {
          fallbackReply = `Here is our top flagship Android device! ⚡\n\n` +
            `• **Samsung Galaxy S24 Ultra 5G AI** ($1299.99) — In Stock (8 units)\n` +
            `Features built-in S Pen, Titanium frame, and Live AI Translation.\n\n` +
            `[Source: Samsung Galaxy S24 Ultra (ID: #3, $1299.99)]\n\n` +
            `😄 *${randomJoke}*`;
          fallbackSources = [{ id: 3, title: "Samsung Galaxy S24 Ultra", price: 1299.99, stock: 8 }];
        } else {
          fallbackReply = `Beep-boop! 🤖 I searched our live warehouse for **"${query}"**.\n\n` +
            `All in-stock products are eligible for instant checkout and fast delivery! ` +
            `If any item runs out of stock, **I will say my boss admin to add stock as soon as possible - make it available!** 🚀\n\n` +
            `💡 You can ask me anything about:\n` +
            `• Your past orders and live tracking 📦\n` +
            `• Your registered delivery address & profile 📍\n` +
            `• Items in your shopping cart 🛒\n` +
            `• New arrivals and secret promo codes 🎁\n\n` +
            `💡 *Joke of the moment:* ${randomJoke}`;
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

      if (isVoiceEnabled && currentText) {
        speakText(currentText);
      }
    } finally {
      setIsStreaming(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  const currentPos = PEEK_POSITIONS[positionIndex] || PEEK_POSITIONS[0];

  return (
    <>
      {/* 1. FULL DARK SCREEN OVERLAY WHEN BOT IS CLICKED */}
      {isOpen && (
        <div
          data-testid="ai-dark-backdrop"
          onClick={() => setIsOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.88)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            zIndex: 9998,
            animation: "fadeInBackdrop 0.25s ease-out forwards",
            transition: "all 0.3s ease"
          }}
        />
      )}

      {/* 2. SNEAKPEEK ROBO CORNER PEEK-A-BOO (Restricted to bottom corners only) */}
      {!isOpen && (
        <div
          data-testid="sneakpeek-robo-container"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={() => setIsOpen(true)}
          style={{
            position: "fixed",
            ...currentPos.style,
            zIndex: 999,
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            userSelect: "none",
            transition: "all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)"
          }}
        >
          {/* Playful Floating Speech Bubble */}
          <div
            data-testid="robo-speech-bubble"
            style={{
              marginBottom: "8px",
              backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
              color: isAdmin ? "#F59E0B" : isDark ? "#38BDF8" : "#0284C7",
              border: `2px solid ${isAdmin ? "#F59E0B" : isDark ? "#38BDF8" : "#0284C7"}`,
              padding: "6px 14px",
              borderRadius: "16px",
              fontSize: "12px",
              fontWeight: "900",
              boxShadow: isAdmin
                ? "0 8px 24px rgba(245, 158, 11, 0.4)"
                : "0 8px 24px rgba(56, 189, 248, 0.35)",
              transform: isHiding && !isHovered ? "scale(0.7) translateY(24px)" : "scale(1) translateY(0)",
              opacity: isHiding && !isHovered ? 0 : 1,
              transition: "all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
              position: "relative",
              whiteSpace: "nowrap"
            }}
          >
            {isHovered ? (isAdmin ? "🫡 Click for Boss Command Center!" : "🤖 Click for Sparky Full Screen Assistant!") : speechBubbleText}
            {/* Bubble arrow pointer */}
            <div
              style={{
                position: "absolute",
                bottom: "-6px",
                left: "50%",
                transform: "translateX(-50%) rotate(45deg)",
                width: "10px",
                height: "10px",
                backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
                borderRight: `2px solid ${isAdmin ? "#F59E0B" : isDark ? "#38BDF8" : "#0284C7"}`,
                borderBottom: `2px solid ${isAdmin ? "#F59E0B" : isDark ? "#38BDF8" : "#0284C7"}`
              }}
            />
          </div>

          {/* SNEAKPEEK ROBO AVATAR (Corner Peek Only) */}
          <div
            data-testid="sneakpeek-robo-avatar"
            style={{
              width: "74px",
              height: "74px",
              transform: isHiding && !isHovered ? "translateY(56px) scale(0.85)" : "translateY(0px) scale(1)",
              transition: "transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)",
              position: "relative",
              filter: isAdmin
                ? "drop-shadow(0 10px 20px rgba(245, 158, 11, 0.6))"
                : "drop-shadow(0 10px 20px rgba(14, 165, 233, 0.5))"
            }}
          >
            <svg viewBox="0 0 100 100" width="100%" height="100%">
              {/* Antenna */}
              <line x1="50" y1="20" x2="50" y2="8" stroke={isAdmin ? "#F59E0B" : "#38BDF8"} strokeWidth="4" strokeLinecap="round" />
              <circle cx="50" cy="7" r="5" fill={isAdmin ? "#F59E0B" : "#38BDF8"}>
                <animate attributeName="r" values="4;6;4" dur="1.4s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.7;1;0.7" dur="1.4s" repeatCount="indefinite" />
              </circle>

              {/* Ears */}
              <rect x="18" y="32" width="6" height="12" rx="3" fill="#64748B" />
              <rect x="76" y="32" width="6" height="12" rx="3" fill="#64748B" />

              {/* Head */}
              <rect x="22" y="18" width="56" height="42" rx="14" fill="#0F172A" stroke={isAdmin ? "#F59E0B" : "#38BDF8"} strokeWidth="3.5" />

              {/* Eyes Visor Screen */}
              <rect x="28" y="26" width="44" height="20" rx="8" fill="#030712" />

              {/* Glowing Eyes */}
              <circle cx="40" cy="36" r="4.5" fill={isAdmin ? "#F59E0B" : "#38BDF8"}>
                <animate attributeName="opacity" values="1;1;0.1;1" dur="3.5s" repeatCount="indefinite" keyTimes="0;0.9;0.95;1" />
              </circle>
              <circle cx="60" cy="36" r="4.5" fill={isAdmin ? "#F59E0B" : "#38BDF8"}>
                <animate attributeName="opacity" values="1;1;0.1;1" dur="3.5s" repeatCount="indefinite" keyTimes="0;0.9;0.95;1" />
              </circle>

              {/* Cheerful Smile */}
              <path d="M 44 44 Q 50 48 56 44" stroke={isAdmin ? "#F59E0B" : "#38BDF8"} strokeWidth="2.5" fill="none" strokeLinecap="round" />

              {/* Waving Arm (When hovered) */}
              <g transform={isHovered ? "rotate(-25 24 64)" : "none"} style={{ transition: "transform 0.3s ease" }}>
                <circle cx="20" cy="62" r="5" fill={isAdmin ? "#F59E0B" : "#38BDF8"} />
              </g>

              {/* Body */}
              <rect x="28" y="60" width="44" height="26" rx="10" fill="#1E293B" stroke={isAdmin ? "#F59E0B" : "#38BDF8"} strokeWidth="3" />
              {/* Chest Badge */}
              <circle cx="50" cy="72" r="6" fill={isAdmin ? "#F59E0B" : "#38BDF8"} />
              <text x="50" y="75" fontSize="8" fontWeight="bold" textAnchor="middle" fill="#000">
                {isAdmin ? "A" : "R"}
              </text>
            </svg>
          </div>
        </div>
      )}

      {/* 3. FULL DARK SCREEN AI CHAT MODAL WITH SPARKY MESSAGE CARDS */}
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
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            color: "#FFFFFF",
            padding: "16px",
            overflow: "hidden",
            animation: "fadeInModal 0.25s ease-out forwards"
          }}
        >
          {/* Centered Command Container */}
          <div
            style={{
              maxWidth: "1000px",
              width: "100%",
              height: "100%",
              margin: "0 auto",
              display: "flex",
              flexDirection: "column",
              backgroundColor: "rgba(11, 15, 25, 0.92)",
              border: `1px solid ${isAdmin ? "rgba(245, 158, 11, 0.35)" : "rgba(56, 189, 248, 0.3)"}`,
              borderRadius: "24px",
              boxShadow: "0 25px 70px rgba(0, 0, 0, 0.95)",
              overflow: "hidden"
            }}
          >
            {/* Immersive Header */}
            <div
              style={{
                padding: "18px 24px",
                backgroundColor: "rgba(15, 23, 42, 0.85)",
                borderBottom: `1px solid ${isAdmin ? "rgba(245, 158, 11, 0.2)" : "rgba(56, 189, 248, 0.2)"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "16px",
                    backgroundColor: isAdmin ? "#F59E0B" : "#38BDF8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "24px",
                    boxShadow: isAdmin
                      ? "0 4px 16px rgba(245, 158, 11, 0.5)"
                      : "0 4px 16px rgba(56, 189, 248, 0.5)"
                  }}
                >
                  {isAdmin ? "🛡️" : "🤖"}
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <h3 style={{ margin: 0, fontSize: "19px", fontWeight: "900", letterSpacing: "-0.5px" }}>
                      {isAdmin ? "Boss Store Command Intelligence" : "Sparky AI Assistant"}
                    </h3>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: "800",
                        padding: "3px 8px",
                        borderRadius: "8px",
                        backgroundColor: isAdmin ? "rgba(245, 158, 11, 0.25)" : "rgba(16, 185, 129, 0.25)",
                        color: isAdmin ? "#F59E0B" : "#10B981"
                      }}
                    >
                      {isAdmin ? "BOSS ADMIN" : "ONLINE • FULL KNOWLEDGE ACCESS"}
                    </span>
                  </div>
                  <div style={{ fontSize: "12px", color: "#94A3B8", marginTop: "3px" }}>
                    {isAdmin
                      ? "Full access to live inventory restock, open tickets & customer orders"
                      : "Access to store catalog, your order history, delivery address, cart & discounts"}
                  </div>
                </div>
              </div>

              {/* Header Controls */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <button
                  onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
                  title={isVoiceEnabled ? "Mute Bot Speech" : "Enable Bot Voice Speech (TTS)"}
                  style={{
                    backgroundColor: isVoiceEnabled ? (isAdmin ? "#F59E0B" : "#38BDF8") : "rgba(255,255,255,0.08)",
                    color: isVoiceEnabled ? "#030712" : "#94A3B8",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: "10px",
                    padding: "6px 12px",
                    fontSize: "12px",
                    cursor: "pointer",
                    fontWeight: "800"
                  }}
                >
                  {isVoiceEnabled ? "🔊 Voice ON" : "🔇 Voice OFF"}
                </button>

                <button
                  onClick={handleClearChat}
                  title="Clear Chat History"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "#94A3B8",
                    fontSize: "14px",
                    cursor: "pointer",
                    padding: "6px 10px",
                    borderRadius: "10px"
                  }}
                >
                  🗑️
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
                    fontSize: "16px",
                    fontWeight: "bold",
                    cursor: "pointer"
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Messages Container with Sparky Message Cards */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "18px"
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
                          ? (isAdmin ? "#F59E0B" : "#0284C7")
                          : "rgba(15, 23, 42, 0.8)",
                        border: isUser
                          ? "none"
                          : `1px solid ${isAdmin ? "rgba(245, 158, 11, 0.3)" : "rgba(56, 189, 248, 0.25)"}`,
                        borderRadius: "20px",
                        padding: "18px 22px",
                        boxShadow: isUser
                          ? "0 6px 20px rgba(2, 132, 199, 0.35)"
                          : "0 8px 30px rgba(0, 0, 0, 0.4)",
                        color: isUser ? "#FFFFFF" : "#F8FAFC",
                        position: "relative"
                      }}
                    >
                      {/* Card Header Tag */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: "10px",
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

                        {!isUser && m.content && (
                          <button
                            onClick={() => speakText(m.content)}
                            title="Listen with voice"
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              fontSize: "14px",
                              color: "#38BDF8",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px"
                            }}
                          >
                            <span>🔊</span>
                            <span style={{ fontSize: "11px", fontWeight: "700" }}>Listen</span>
                          </button>
                        )}
                      </div>

                      {/* Card Body Text */}
                      <div
                        style={{
                          fontSize: "14px",
                          lineHeight: "1.65",
                          whiteSpace: "pre-wrap",
                          fontWeight: isUser ? "600" : "400"
                        }}
                      >
                        {m.content || (isStreaming ? "Thinking and searching catalog... ⚡" : "")}
                      </div>

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
                    ? "Ask Boss Intelligence about stock, customer tickets, or customer orders..."
                    : "Ask Sparky anything about products, your orders, delivery address, cart, or discounts..."
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
                  fontSize: "14px",
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
