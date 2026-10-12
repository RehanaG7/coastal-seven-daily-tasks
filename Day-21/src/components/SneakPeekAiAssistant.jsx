import React, { useState, useEffect, useRef } from "react";
import { useCartStore, useUIStore, useAuthStore } from "../store/useStore";
import { env } from "../config/env";
import { checkContentSafety, logAdminModerationAlert } from "../utils/moderationGuardrail";

const DEFAULT_SUGGESTIONS = [
  "What's new in R-Mart Sparkyyy? 🎁",
  "Where is my order & history? 🚚",
  "Chat with Admin (Live Support) 💬",
  "What is my saved address & profile? 📍",
  "What is currently in my cart? 🛒",
  "What offers are active today? 🏷️"
];

// Helper to filter out synthetic test fixtures (e.g. N+1 Item 2, Invoice Test Laptop)
export const isLegitimateProduct = (item) => {
  if (!item) return false;
  const name = (item.title || item.name || "").toLowerCase().trim();
  if (!name) return false;
  if (
    name.includes("n+1") ||
    name.includes("test") ||
    name.includes("dummy") ||
    name.includes("mock") ||
    name.startsWith("item ") ||
    name === "product"
  ) {
    return false;
  }
  return true;
};

// Formatter to clearly display which AI model/engine is actively responding or analyzing
export const getDisplayAiEngine = (provider) => {
  if (!provider || provider === "Connecting..." || provider === "Store Intelligence") {
    return "Grok & Gemini RAG Intelligence";
  }
  const p = provider.toLowerCase();
  if (p.includes("groq") || p.includes("llama")) {
    return "Grok & Llama-3.3-70B AI Engine";
  }
  if (p.includes("gemini")) {
    return "Google Gemini 2.0 Flash AI";
  }
  if (p.includes("boss")) {
    return "Boss Executive AI Intelligence";
  }
  if (p.includes("local") || p.includes("rag") || p.includes("knowledge")) {
    return "Grok & Gemini RAG Intelligence";
  }
  if (p.includes("concierge") || p.includes("support")) {
    return "Sparky AI Support Concierge";
  }
  return provider;
};

export default function SneakPeekAiAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(() => {
    try {
      const stored = localStorage.getItem("rmart_ai_chat_history");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [];
  });
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeProvider, setActiveProvider] = useState("Store Knowledge Engine");
  const [viewedProducts, setViewedProducts] = useState([]);
  const [isHovered, setIsHovered] = useState(false);
  const [activeSupportOrder, setActiveSupportOrder] = useState(null);

  // Automatically persist conversation history to localStorage (Amazon Rufus style)
  useEffect(() => {
    if (messages && messages.length > 0) {
      try {
        localStorage.setItem("rmart_ai_chat_history", JSON.stringify(messages.slice(-40)));
      } catch (e) {}
    }
  }, [messages]);

  // Speech Recognition (Mic) & Speech Synthesis (Voice)
  const [isListening, setIsListening] = useState(false);
  const [chatRateLimitWarning, setChatRateLimitWarning] = useState(null);
  const recognitionRef = useRef(null);
  const hasInitializedGreeting = useRef(false);

  const theme = useUIStore((s) => s.theme);
  const isDark = theme === "dark";
  const addToCart = useCartStore((s) => s.addToCart);
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "admin" || localStorage.getItem("user_role") === "admin";

  const [supportFlow, setSupportFlow] = useState(null);
  const fileInputRef = useRef(null);

  // Handle image upload for damaged product complaints
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fileName = file.name || "damage_evidence.jpg";
    const userMsgId = `user_${Date.now()}`;
    const botMsgId = `bot_${Date.now()}`;

    // 1. Alert Admin Boss immediately
    try {
      const existingNotifs = JSON.parse(localStorage.getItem("rmart_admin_notifications") || "[]");
      const orderContextStr = activeSupportOrder?.orderId ? ` regarding Order #${activeSupportOrder.orderId}` : "";
      const urgentNotif = {
        id: `admin-photo-${Date.now()}`,
        title: "🚨 URGENT: Damaged Item Photo Uploaded",
        message: `Customer ${user?.name || "Shopper"} uploaded damage evidence (${fileName})${orderContextStr}. Claim verified as valid. 100% full refund approved. Admin boss confirm payout immediately.`,
        category: "query",
        badge: "🚨 ADMIN BOSS URGENT",
        is_read: 0,
        timestamp: "Just now",
        user: user?.name || "Shopper",
        actionRequired: "Confirm refund payout immediately"
      };
      localStorage.setItem("rmart_admin_notifications", JSON.stringify([urgentNotif, ...existingNotifs]));
    } catch {}

    // 2. Register refund ticket for Admin Customer Queries
    try {
      const existingTickets = JSON.parse(localStorage.getItem("rmart_support_tickets") || "[]");
      const newTicket = {
        id: `TCK-${Date.now().toString().slice(-4)}`,
        subject: `🚨 Damaged Item Verified: ${fileName} - Refund Approved`,
        user: `${user?.name || "Shopper"} (${user?.email || "customer@rmart.com"})`,
        text: `Customer uploaded damage proof: ${fileName}. Claim confirmed valid by Concierge. 100% refund initiated.`,
        status: "Approved",
        date: new Date().toLocaleDateString()
      };
      localStorage.setItem("rmart_support_tickets", JSON.stringify([newTicket, ...existingTickets]));
    } catch {}

    setMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        role: "user",
        content: `📸 Uploaded damage proof: ${fileName}`,
        isPhoto: true,
        fileName
      },
      {
        id: botMsgId,
        role: "assistant",
        content:
          "Thank you for sharing the photo! We have reviewed the image and confirmed your claim is valid. ✅\n\nYour 100% full refund has been approved and will be credited to your original payment method promptly!",
        sources: [],
        provider: "Sparky Support Concierge",
        isDamageResolved: true
      }
    ]);
    setSupportFlow("damage_confirmed");
    if (e.target) e.target.value = "";
  };

  const messagesEndRef = useRef(null);

  // Close assistant, cancel speech synthesis immediately, and halt microphone
  const handleCloseChat = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      setIsListening(false);
    }
    setIsOpen(false);
  };

  // Ensure speech synthesis stops immediately whenever chat closes
  useEffect(() => {
    if (!isOpen) {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
        setIsListening(false);
      }
    }
  }, [isOpen]);

  // Clean up speech synthesis on component unmount
  useEffect(() => {
    return () => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, []);

  // Escape key closes modal & halts speech
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        handleCloseChat();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

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

  // Handle incoming order support or external trigger
  const handleIncomingTrigger = (detail) => {
    if (!detail) return;
    if (detail.orderId || detail.type === "order_support") {
      setActiveSupportOrder(detail);
      const userMsgId = `user_${Date.now()}`;
      const botMsgId = `bot_${Date.now()}`;
      const userText = detail.message || `Customer Support: Reporting problem with Order #${detail.orderId}`;
      const orderSummaryReply =
        `Hello! I am Sparky, your dedicated customer support concierge. I have retrieved your records for **Order #${detail.orderId}**! 📦\n\n` +
        `• **Current Status:** **${detail.status || "In Transit"}**\n` +
        `• **Order Total:** **$${detail.total || "0.00"}**\n\n` +
        `I am here to resolve any issues with this order immediately. What would you like assistance with?\n` +
        `1️⃣ **Track Delivery & ETA** — Live courier updates & telemetry\n` +
        `2️⃣ **Report Damaged or Missing Item** — Free expedited replacement or 100% full refund\n` +
        `3️⃣ **Cancel or Return Order** — Hassle-free 30-day return policy\n` +
        `4️⃣ **Connect to Store Admin Boss** — Direct live escalation\n\n` +
        `💡 *If my solution doesn't resolve your issue, simply reply "Problem not resolved" or click "Talk to Admin" and I will immediately connect you with our Admin Boss via Live Chat!*`;

      setMessages((prev) => [
        ...prev,
        { id: userMsgId, role: "user", content: userText },
        {
          id: botMsgId,
          role: "assistant",
          content: orderSummaryReply,
          sources: [],
          provider: "R-Mart Order Concierge",
          orderId: detail.orderId,
          orderData: detail.order
        }
      ]);
    }
  };

  // Listen for top navbar chat button trigger and orders customer support trigger
  useEffect(() => {
    const handleOpen = (e) => {
      setIsOpen(true);
      if (e?.detail) {
        handleIncomingTrigger(e.detail);
      }
    };
    window.addEventListener("rmart:open_chat", handleOpen);
    return () => window.removeEventListener("rmart:open_chat", handleOpen);
  }, []);

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
    if (isOpen && messages.length === 0 && !hasInitializedGreeting.current) {
      hasInitializedGreeting.current = true;
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

  // Check if shopper wants to talk to admin or problem is unresolved
  const isAdminHandoverIntent = (text = "") => {
    const t = text.toLowerCase();
    const triggers = [
      "problem not resolved",
      "problem isn't resolved",
      "problem is not resolved",
      "issue not resolved",
      "not resolved",
      "unresolved",
      "not solved",
      "didn't solve",
      "did not solve",
      "didn't help",
      "did not help",
      "not helping",
      "not fixed",
      "talk to admin",
      "speak to admin",
      "chat with admin",
      "connect to admin",
      "connect me to admin",
      "need admin",
      "contact admin",
      "call admin",
      "ask admin",
      "talk with admin",
      "admin live chat",
      "admin support",
      "human support",
      "human agent",
      "human admin",
      "talk to human",
      "speak to human",
      "talk to a human",
      "speak to a human",
      "real person",
      "talk to a person",
      "speak to a person",
      "talk to someone",
      "speak to someone",
      "live support",
      "live agent",
      "live chat with admin",
      "support agent",
      "customer care",
      "representative",
      "escalate"
    ];
    return triggers.some((tr) => t.includes(tr));
  };

  // Check if query is unrelated to our website or asking for jokes
  const isOffTopicQuery = (text = "") => {
    const q = text.toLowerCase().trim();
    if (!q) return false;

    // Joke requests are strictly off-topic
    if (["joke", "funny", "laugh", "humor", "riddle", "comedy", "entertain"].some((k) => q.includes(k))) {
      return true;
    }

    // Explicit non-ecommerce questions
    const offTopicTriggers = [
      "who is ", "who was ", "what is the capital", "how do airplanes", "how to code",
      "solve ", "write python", "write code", "write an essay", "write a poem", "write a story",
      "weather", "sing a song", "tell a story", "what is photosynthesis",
      "quantum", "president of", "cricket match", "football match", "math problem",
      "homework", "translate to"
    ];
    if (offTopicTriggers.some((k) => q.includes(k))) {
      return true;
    }

    // E-commerce store allowed topics
    const ecommerceKeywords = [
      "product", "item", "buy", "cart", "bag", "order", "track", "ship", "deliver",
      "price", "cost", "stock", "discount", "offer", "deal", "coupon", "code",
      "flash50", "freeship", "rmart", "store", "catalog", "catalogue", "phone",
      "headphone", "audio", "keyboard", "monitor", "laptop", "apple", "iphone",
      "samsung", "galaxy", "sony", "logitech", "address", "profile", "account",
      "admin", "boss", "support", "ticket", "hello", "hi", "hey", "help",
      "recommend", "what's new", "whats new", "sparky", "specs", "specification",
      "refund", "return", "warranty", "replace", "cancel", "payment", "checkout",
      "inquiry", "unresolved", "problem", "solve", "damaged", "damage", "missing",
      "concierge", "customer support", "complaint", "wrong", "broken", "cracked",
      "defective", "scratched", "faulty", "not received", "received", "delivery partner",
      "invoice", "photo", "image", "upload", "proof", "re-order", "reorder"
    ];

    if (ecommerceKeywords.some((kw) => q.includes(kw))) {
      return false;
    }

    // If query has 3 or more words and doesn't match any e-commerce keyword, it's unrelated
    const words = q.split(/\s+/);
    if (words.length >= 3) {
      return true;
    }

    return false;
  };

  // Dynamic Suggestion Chips (Strictly E-Commerce - No Jokes!)
  const getSuggestions = () => {
    if (isAdmin) {
      return [
        "Report all out-of-stock items 📦",
        "Review customer inquiries & complaints 📩",
        "Review all customers orders 🚚",
        "Restock depleted inventory ⚡",
        "Review catalogue metrics 📊"
      ];
    }

    if (activeSupportOrder?.orderId) {
      const oid = activeSupportOrder.orderId;
      return [
        `Where is Order #${oid}? 🚚`,
        `Report Damaged Item for #${oid} ⚠️`,
        `Request Refund for #${oid} 💵`,
        `Problem not resolved - Talk to Admin 👨‍💼`,
        `What offers are active today? 🏷️`
      ];
    }

    if (viewedProducts && viewedProducts.length > 0) {
      const latest = viewedProducts[0];
      const shortTitle = latest.title ? latest.title.split(" ").slice(0, 6).join(" ") : "this product";
      return [
        "What's new in R-Mart Sparkyyy? 🎁",
        `Tell me about ${shortTitle} 🏷️`,
        "Where is my order & history? 🚚",
        "Chat with Admin (Live Support) 💬",
        "What is my saved address & profile? 📍",
        "What offers are active today? 🏷️"
      ];
    }
    return [
      "What's new in R-Mart Sparkyyy? 🎁",
      "Check coupon FLASH50 🏷️",
      "Is iPhone in stock? 📦",
      "Where is my order & history? 🚚",
      "Compare top rated headphones 🎧",
      "What offers are active today? 🏷️"
    ];
  };

  // Send Chat Message via SSE Streaming with Intelligent Fallback (No robotic cliché)
  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || input).trim();
    if (!query || isStreaming) return;

    setInput("");

    // Test 429 Rate Limit Quick Trigger
    if (query.includes("Test 429 Rate Limit") || query.includes("Spam 6x")) {
      const userMsgId = `user_${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        { id: userMsgId, role: "user", content: query },
        { id: `bot_${Date.now()}`, role: "assistant", content: "⚡ Firing 6 rapid requests to test sliding window rate limit (anonymous quota: 5 req/min)...", provider: "Rate Limit Tester" }
      ]);
      const apiBase = env.API_BASE_URL || (env.API_URL || "http://localhost:8000").replace(/\/api\/v1\/?$/, "");
      for (let i = 1; i <= 6; i++) {
        try {
          const res = await fetch(`${apiBase}/api/v1/ai/generate-description`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: `Rate Limit Test ${i}`, category: "Test", features: ["Spam test"] }),
          });
          if (res.status === 429) {
            const err429 = "Too Many Requests (HTTP 429): You have exceeded your AI request limit. Please wait a moment before trying again.";
            setChatRateLimitWarning(err429);
            setMessages((prev) => [
              ...prev,
              {
                id: `bot_429_${Date.now()}`,
                role: "assistant",
                content: `🛑 ${err429}`,
                sources: [],
                provider: "Rate Limiter (HTTP 429)"
              }
            ]);
            return;
          }
        } catch (e) {}
      }
      return;
    }

    // 1. Quick In-Chat Clear Command
    const qLower = query.toLowerCase();
    if (["clear", "clear chat", "clean chat", "reset", "reset chat", "cls"].includes(qLower)) {
      handleClearChat();
      return;
    }

    const userMsgId = `user_${Date.now()}`;
    const botMsgId = `bot_${Date.now()}`;

    // AI Content Moderation & Guardrails: Block harassing, abusive, or offensive comments
    const safety = checkContentSafety(query);
    if (!safety.isSafe) {
      logAdminModerationAlert("AI Bot Chat (Sparky)", query, user?.name || "Shopper");
      const warningReply =
        "🛡️ **Content Moderation Warning:**\n\n" +
        "Harassing, offensive, or abusive comments are strictly prohibited on R-Mart. " +
        "Your message has been blocked and flagged for store administration.\n\n" +
        "Please keep all queries respectful and focused on shopping, orders, or customer service.";

      setMessages((prev) => [
        ...prev,
        { id: userMsgId, role: "user", content: query },
        {
          id: botMsgId,
          role: "assistant",
          content: warningReply,
          sources: [],
          provider: "AI Content Moderation Guardrail",
          isModerationWarning: true,
        },
      ]);
      return;
    }

    // 2. Off-Topic & Joke Guardrail: Strictly E-Commerce Shopping Answers Only
    if (!isAdmin && isOffTopicQuery(query)) {
      const offTopicReply =
        "Apologise, I only can solve queries regarding our website!\n\n" +
        "What would you like to buy today? Here are some trending products and exciting offers you might like:\n\n" +
        "🔥 **TRENDING PRODUCTS:**\n" +
        "• **Samsung Galaxy S24 Ultra 5G AI** ($1299.99) — Next-gen Galaxy AI with built-in S Pen!\n" +
        "• **Sony WH-1000XM5 Wireless Headphones** ($349.99) — Industry-leading 30hr active noise cancelling\n" +
        "• **Apple iPhone 15 Pro Max 256GB** ($1199.99) — Aerospace titanium with A17 Pro chip\n\n" +
        "🎉 **ACTIVE STORE OFFERS:**\n" +
        "• 🏷️ **FLASH50**: 50% discount on select high-demand electronics!\n" +
        "• 🚚 **FREESHIP**: Instant zero-cost express delivery on orders over $99!\n\n" +
        "What items would you like to explore or add to your shopping bag? 🛒";

      setMessages((prev) => [
        ...prev,
        { id: userMsgId, role: "user", content: query },
        {
          id: botMsgId,
          role: "assistant",
          content: offTopicReply,
          sources: [
            { id: 3, title: "Samsung Galaxy S24 Ultra", price: 1299.99, stock: 8 },
            { id: 2, title: "Sony WH-1000XM5 Wireless Headphones", price: 349.99, stock: 15 },
            { id: 1, title: "Apple iPhone 15 Pro Max 256GB", price: 1199.99, stock: 0 }
          ],
          provider: "R-Mart Store Guide"
        }
      ]);
      return;
    }

    // 2. Direct Admin Live Chat Handover for Unresolved Problems or Requests to Talk to Admin
    if (!isAdmin && isAdminHandoverIntent(query)) {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
        setIsListening(false);
      }

      // Find previous assistant response to summarize what Sparky tried
      const prevAssistant = [...messages].reverse().find((m) => m.role === "assistant");
      const sparkyAttempt = prevAssistant?.content
        ? prevAssistant.content.replace(/\[Source:[^\]]+\]/g, "").replace(/\n+/g, " ").slice(0, 160) + "..."
        : "Assisted with store catalog specifications and shopping guidelines";

      const customerName = user?.name || "Shopper";
      const customerEmail = user?.email || "customer@rmart.com";

      // 1. Dispatch urgent alert to Admin Boss in rmart_admin_notifications
      try {
        const existingAdminNotifs = JSON.parse(localStorage.getItem("rmart_admin_notifications") || "[]");
        const orderContextStr = activeSupportOrder?.orderId ? ` regarding Order #${activeSupportOrder.orderId}` : "";
        const urgentAdminNotif = {
          id: `admin-urgent-${Date.now()}`,
          title: "🚨 URGENT: Customer Escalation to Admin Boss!",
          message: `Customer ${customerName} (${customerEmail})${orderContextStr} problem not resolved: "${query}". Sparky attempted: "${sparkyAttempt}". Status: Unresolved. Admin boss, resolve this immediately!`,
          category: "query",
          badge: "🚨 ADMIN BOSS URGENT",
          is_read: 0,
          timestamp: "Just now",
          user: customerName,
          query,
          sparkyAttempt,
          actionRequired: "Admin boss resolve this immediately"
        };
        localStorage.setItem("rmart_admin_notifications", JSON.stringify([urgentAdminNotif, ...existingAdminNotifs]));
      } catch (e) {
        console.warn("Failed to log urgent admin notification:", e);
      }

      // 2. Log high-priority escalation ticket into localStorage for Boss Admin Customer Queries desk
      try {
        const existing = JSON.parse(localStorage.getItem("rmart_support_tickets") || "[]");
        const newTicket = {
          id: `TCK-${Date.now().toString().slice(-4)}`,
          subject: activeSupportOrder?.orderId
            ? `🚨 Unresolved Issue: Order #${activeSupportOrder.orderId} Escalation to Admin Boss`
            : "🚨 Unresolved Issue: Customer Escalation to Admin Boss",
          user: `${customerName} (${customerEmail})`,
          text: `Customer Problem: "${query}"\n\n${activeSupportOrder?.orderId ? `Order Context: #${activeSupportOrder.orderId} (Status: ${activeSupportOrder.status}, Total: $${activeSupportOrder.total})\n\n` : ""}Sparky AI Attempted Solution: "${sparkyAttempt}"\n\nStatus: Unresolved - Shopper requested live human admin assistance.\n\n⚠️ URGENT INSTRUCTION: Admin boss, resolve this immediately via Live Support Chat!`,
          status: "Urgent",
          date: new Date().toLocaleDateString()
        };
        localStorage.setItem("rmart_support_tickets", JSON.stringify([newTicket, ...existing]));
      } catch (e) {
        console.warn("Failed to log escalation ticket:", e);
      }

      // 3. Add to notification store
      try {
        useNotificationStore.getState().addNotification({
          id: Date.now(),
          title: "👨‍💼 Transferred to Live Admin Support",
          message: `Your query has been escalated to Store Admin Boss. Sparky briefed the admin with your details.`,
          category: "order",
          is_read: 0,
          timestamp: "Just now"
        });
      } catch {}

      const handoverReply =
        `I completely understand! Since your query requires personal attention from our store management, I am connecting you directly to our human Store Administrator right away via Live Support Chat. 👨‍💼💬\n\n` +
        `📋 **Admin Briefing Sent:**\n` +
        `• **Your Problem:** "${query}"\n` +
        `• **Sparky's Attempt:** ${sparkyAttempt}\n` +
        `• **Status:** Unresolved — Alert sent: *"Admin boss, resolve this immediately!"* 🚨\n\n` +
        `Transferring you to Live Support Chat with Admin right now...`;

      // Show immediate empathetic handover notice
      setMessages((prev) => [
        ...prev,
        { id: userMsgId, role: "user", content: query },
        {
          id: botMsgId,
          role: "assistant",
          content: handoverReply,
          sources: [],
          provider: "Admin Escalation Desk",
          isAdminHandover: true
        }
      ]);

      // Close Sparky assistant and directly open Live Support Chat with admin
      setTimeout(() => {
        handleCloseChat();
        const openLiveChat = useUIStore.getState().openLiveChat;
        if (typeof openLiveChat === "function") {
          openLiveChat("general");
        }
      }, 900);

      return;
    }

    // Auto-log inquiry for Boss Admin if shopper asks about new items/offers
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

    // 3. Exception Handler: Return Inquiry & Pickup / Invoice / Re-Order Registration
    const isReturnQuery = ["return", "want to return", "returning", "exchange"].some((k) => qLower.includes(k));
    const returnReasonKeywords = ["reason", "because", "size", "not working", "defective", "damaged", "broken", "quality", "wrong item", "mind", "changed", "color", "colour", "fit"];
    const hasReturnReason = returnReasonKeywords.some((k) => qLower.includes(k)) || qLower.startsWith("return reason:");

    if (!isAdmin && (isReturnQuery || supportFlow === "awaiting_return_reason")) {
      if (hasReturnReason || supportFlow === "awaiting_return_reason") {
        const returnItem =
          activeSupportOrder?.order?.items?.[0] ||
          activeSupportOrder?.order ||
          (viewedProducts && viewedProducts[0]) ||
          { id: 3, name: "Samsung Galaxy S24 Ultra", title: "Samsung Galaxy S24 Ultra", price: 1299.99, stock: 8 };

        const returnReply =
          "Your return complaint has been registered! 📦\n\n" +
          "We are reviewing this and will assign a delivery partner to receive it.\n\n" +
          "Kindly pack it with your invoice, and our delivery partner will check and receive it.\n\n" +
          "Would you like to place the same order again?";

        try {
          const existingTickets = JSON.parse(localStorage.getItem("rmart_support_tickets") || "[]");
          const newTicket = {
            id: `TCK-${Date.now().toString().slice(-4)}`,
            subject: `📦 Return Complaint: ${returnItem.name || returnItem.title || "Order Item"}`,
            user: `${user?.name || "Shopper"} (${user?.email || "customer@rmart.com"})`,
            text: `Customer Return Reason: "${query}". Delivery partner scheduled to check and receive with invoice. Re-order option presented.`,
            status: "Registered",
            date: new Date().toLocaleDateString()
          };
          localStorage.setItem("rmart_support_tickets", JSON.stringify([newTicket, ...existingTickets]));
        } catch {}

        try {
          const existingNotifs = JSON.parse(localStorage.getItem("rmart_admin_notifications") || "[]");
          const returnNotif = {
            id: `admin-return-${Date.now()}`,
            title: "📦 Return Complaint Registered",
            message: `Customer ${user?.name || "Shopper"} registered return for ${returnItem.name || returnItem.title}. Delivery partner assigned to receive with invoice check.`,
            category: "order",
            badge: "RETURN REGISTERED",
            is_read: 0,
            timestamp: "Just now",
            user: user?.name || "Shopper"
          };
          localStorage.setItem("rmart_admin_notifications", JSON.stringify([returnNotif, ...existingNotifs]));
        } catch {}

        setMessages((prev) => [
          ...prev,
          { id: userMsgId, role: "user", content: query },
          {
            id: botMsgId,
            role: "assistant",
            content: returnReply,
            sources: [],
            provider: "Sparky Support Concierge",
            isReturnRegistered: true,
            returnItem
          }
        ]);
        setSupportFlow("return_registered");
        return;
      } else {
        const askReasonReply =
          "We are sorry for the inconvenience! 📦\n\n" +
          "Could you please tell us the reason for returning the item so we can register your return complaint?";

        setMessages((prev) => [
          ...prev,
          { id: userMsgId, role: "user", content: query },
          {
            id: botMsgId,
            role: "assistant",
            content: askReasonReply,
            sources: [],
            provider: "Sparky Support Concierge",
            returnReasonPrompt: true
          }
        ]);
        setSupportFlow("awaiting_return_reason");
        return;
      }
    }

    // 4. Exception Handler: Damaged Product Complaint
    const isDamagedQuery = !isReturnQuery && supportFlow !== "awaiting_return_reason" && ["damage", "damaged", "broken", "cracked", "defect", "defective", "scratched", "faulty"].some((k) => qLower.includes(k));
    const hasPhotoIndicator = ["photo", "image", "upload", "pic", "attached", "proof", "picture"].some((k) => qLower.includes(k));

    if (!isAdmin && isDamagedQuery) {
      if (hasPhotoIndicator || supportFlow === "damage_confirmed") {
        const replyText =
          "Thank you for sharing the photo! We have reviewed the details and verified your claim as valid. ✅\n\n" +
          "Your 100% full refund has been approved and will be credited to your original payment method promptly!";

        try {
          const existingNotifs = JSON.parse(localStorage.getItem("rmart_admin_notifications") || "[]");
          const urgentNotif = {
            id: `admin-damage-${Date.now()}`,
            title: "🚨 URGENT: Damaged Item Claim Validated",
            message: `Customer ${user?.name || "Shopper"} reported damaged item: "${query}". Claim validated. 100% refund approved. Admin boss confirm payout immediately.`,
            category: "query",
            badge: "🚨 ADMIN BOSS URGENT",
            is_read: 0,
            timestamp: "Just now",
            user: user?.name || "Shopper"
          };
          localStorage.setItem("rmart_admin_notifications", JSON.stringify([urgentNotif, ...existingNotifs]));
        } catch {}

        try {
          const existingTickets = JSON.parse(localStorage.getItem("rmart_support_tickets") || "[]");
          const newTicket = {
            id: `TCK-${Date.now().toString().slice(-4)}`,
            subject: "🚨 Damaged Item Verified - Refund Approved",
            user: `${user?.name || "Shopper"} (${user?.email || "customer@rmart.com"})`,
            text: `Customer Claim: "${query}". Verified valid. 100% refund initiated.`,
            status: "Approved",
            date: new Date().toLocaleDateString()
          };
          localStorage.setItem("rmart_support_tickets", JSON.stringify([newTicket, ...existingTickets]));
        } catch {}

        setMessages((prev) => [
          ...prev,
          { id: userMsgId, role: "user", content: query },
          {
            id: botMsgId,
            role: "assistant",
            content: replyText,
            sources: [],
            provider: "Sparky Support Concierge",
            isDamageResolved: true
          }
        ]);
        setSupportFlow("damage_confirmed");
        return;
      } else {
        const replyText =
          "We are so sorry your item arrived damaged! ⚠️\n\n" +
          "Please upload or share images of the damaged product so we can verify the issue and approve your refund immediately.";

        setMessages((prev) => [
          ...prev,
          { id: userMsgId, role: "user", content: query },
          {
            id: botMsgId,
            role: "assistant",
            content: replyText,
            sources: [],
            provider: "Sparky Support Concierge",
            isDamageAwaiting: true
          }
        ]);
        setSupportFlow("awaiting_damage_photo");
        return;
      }
    }

    // 5. Exception Handler: Not Received Order
    const isNotReceivedQuery = [
      "not received", "didn't receive", "did not receive", "haven't received",
      "have not received", "never received", "order missing", "package missing",
      "order not delivered", "not arrived", "haven't got my"
    ].some((k) => qLower.includes(k));

    if (!isAdmin && isNotReceivedQuery) {
      const replyText =
        "We are truly sorry for the delay and inconvenience! 🚚\n\n" +
        "We will talk to our Admin Boss about this right away to investigate your shipment immediately. 🚨";

      try {
        const existingNotifs = JSON.parse(localStorage.getItem("rmart_admin_notifications") || "[]");
        const urgentNotif = {
          id: `admin-not-received-${Date.now()}`,
          title: "🚨 URGENT: Order Not Received",
          message: `Customer ${user?.name || "Shopper"} reported order not received: "${query}". Admin boss, investigate shipment immediately!`,
          category: "query",
          badge: "🚨 ADMIN BOSS URGENT",
          is_read: 0,
          timestamp: "Just now",
          user: user?.name || "Shopper",
          actionRequired: "Investigate shipment immediately"
        };
        localStorage.setItem("rmart_admin_notifications", JSON.stringify([urgentNotif, ...existingNotifs]));
      } catch {}

      try {
        const existingTickets = JSON.parse(localStorage.getItem("rmart_support_tickets") || "[]");
        const newTicket = {
          id: `TCK-${Date.now().toString().slice(-4)}`,
          subject: "🚨 Order Not Received Escalation",
          user: `${user?.name || "Shopper"} (${user?.email || "customer@rmart.com"})`,
          text: `Customer reported order not received: "${query}". Admin boss alerted to investigate shipment immediately.`,
          status: "Urgent",
          date: new Date().toLocaleDateString()
        };
        localStorage.setItem("rmart_support_tickets", JSON.stringify([newTicket, ...existingTickets]));
      } catch {}

      setMessages((prev) => [
        ...prev,
        { id: userMsgId, role: "user", content: query },
        {
          id: botMsgId,
          role: "assistant",
          content: replyText,
          sources: [],
          provider: "Sparky Escalation Concierge",
          isAdminHandover: true
        }
      ]);
      return;
    }

    // 6. Exception Handler: Generic Complaint
    const isComplaintQuery = [
      "complaint", "bad service", "poor service", "unhappy", "terrible", "disappointed",
      "problem with order", "issue with order", "file a complaint", "not satisfied"
    ].some((k) => qLower.includes(k));

    if (!isAdmin && isComplaintQuery) {
      const complaintReply =
        "We are sorry for the inconvenience! 😔\n\n" +
        "Could you please share more details about the issue so we can help you right away?";

      try {
        const existingTickets = JSON.parse(localStorage.getItem("rmart_support_tickets") || "[]");
        const newTicket = {
          id: `TCK-${Date.now().toString().slice(-4)}`,
          subject: "Customer Feedback / Complaint Filed",
          user: `${user?.name || "Shopper"} (${user?.email || "customer@rmart.com"})`,
          text: query,
          status: "Open",
          date: new Date().toLocaleDateString()
        };
        localStorage.setItem("rmart_support_tickets", JSON.stringify([newTicket, ...existingTickets]));
      } catch {}

      setMessages((prev) => [
        ...prev,
        { id: userMsgId, role: "user", content: query },
        {
          id: botMsgId,
          role: "assistant",
          content: complaintReply,
          sources: [],
          provider: "Sparky Support Concierge"
        }
      ]);
      return;
    }

    // Day 21 Autonomous AI Agent Tool Calling
    const hasAgentToolIntent = /(?:coupon|promo\s*code|voucher|discount|track\s*order|order\s*#?\d+|create\s*ticket|file\s*ticket|stock|inventory|how\s*many|available|in\s*stock)/i.test(query);

    const apiBase = env.API_BASE_URL || (env.API_URL || "http://localhost:8000").replace(/\/api\/v1\/?$/, "");
    const token = localStorage.getItem("token") || localStorage.getItem("access_token") || localStorage.getItem("rmart_token");
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    if (hasAgentToolIntent) {
      try {
        let agentRes;
        try {
          agentRes = await fetch(`${apiBase}/api/v1/ai/agent/chat`, {
            method: "POST",
            headers,
            body: JSON.stringify({ message: query }),
          });
        } catch (e) {
          agentRes = await fetch(`/api/v1/ai/agent/chat`, {
            method: "POST",
            headers,
            body: JSON.stringify({ message: query }),
          });
        }

        if (agentRes?.status === 429) {
          const rateMsg = "Too Many Requests (HTTP 429): You have exceeded your AI request limit. Please wait a moment before trying again.";
          setChatRateLimitWarning(rateMsg);
          setMessages((prev) => [
            ...prev,
            { id: userMsgId, role: "user", content: query },
            {
              id: botMsgId,
              role: "assistant",
              content: `🛑 ${rateMsg}`,
              sources: [],
              provider: "Rate Limiter (HTTP 429)"
            }
          ]);
          return;
        }

        if (agentRes?.status === 422) {
          setMessages((prev) => [
            ...prev,
            { id: userMsgId, role: "user", content: query },
            {
              id: botMsgId,
              role: "assistant",
              content: "🛡️ Content Moderation Guardrail: Your message was blocked for violating safety policy (Prompt Injection / Inappropriate Content).",
              sources: [],
              provider: "Safety Moderation Guardrail"
            }
          ]);
          return;
        }

        if (agentRes && agentRes.ok) {
          const agentData = await agentRes.json();
          if (agentData?.has_tool_call) {
            setMessages((prev) => [
              ...prev,
              { id: userMsgId, role: "user", content: query },
              {
                id: botMsgId,
                role: "assistant",
                content: agentData.answer,
                sources: [],
                provider: `Sparky Agent • 🔧 ${agentData.tool_name}`,
                toolCall: {
                  name: agentData.tool_name,
                  result: agentData.tool_result,
                },
              },
            ]);
            speakTextInNaturalAccent(agentData.answer);
            return;
          }
        }
      } catch (err) {
        console.warn("[Agent Tool Execution Fallback]", err);
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
      const historyPayload = messages.slice(-4).map((m) => ({
        role: m.role,
        content: m.content
      }));

      let response;
      try {
        response = await fetch(`${apiBase}/api/v1/ai/chat/stream`, {
          method: "POST",
          headers,
          body: JSON.stringify({ message: query, history: historyPayload })
        });
      } catch (e) {
        response = await fetch(`/api/v1/ai/chat/stream`, {
          method: "POST",
          headers,
          body: JSON.stringify({ message: query, history: historyPayload })
        });
      }

      if (response?.status === 429) {
        const rateMsg = "Too Many Requests (HTTP 429): You have exceeded your AI request limit. Please wait a moment before trying again.";
        setChatRateLimitWarning(rateMsg);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === botMsgId
              ? {
                  ...m,
                  content: `🛑 ${rateMsg}`,
                  sources: [],
                  provider: "Rate Limiter (HTTP 429)"
                }
              : m
          )
        );
        setIsStreaming(false);
        return;
      }

      if (response?.status === 422) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === botMsgId
              ? {
                  ...m,
                  content: "🛡️ Content Moderation Guardrail: Your query was flagged for AI policy violations.",
                  sources: [],
                  provider: "Safety Moderation Guardrail"
                }
              : m
          )
        );
        setIsStreaming(false);
        return;
      }

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
                if (data.sources) collectedSources = data.sources.filter(isLegitimateProduct);
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

      // Articulate, Thoughtful Local Knowledge Engine (Strictly E-Commerce - No Jokes!)
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
        } else {
          fallbackReply = `Administrator briefing for **"${query}"**:\n\n` +
            `• Out-of-stock items: ${audit.outOfStock.length}\n` +
            `• Open customer tickets: ${tickets.length}\n` +
            `• Total customer orders: ${orders.length}\n\n` +
            `You can review individual orders and restock inventory directly through this console.`;
        }
      } else {
        // Customer Shopping & Order Support Intelligence with Full State Access
        if (activeSupportOrder?.orderId && (qLower.includes("where") || qLower.includes("track") || qLower.includes("delivery") || qLower.includes("status") || qLower.includes("delayed") || qLower.includes("when"))) {
          fallbackReply =
            `Here is the latest live status for **Order #${activeSupportOrder.orderId}**:\n\n` +
            `• **Current Stage:** **${activeSupportOrder.status || "In Transit"}** 🚚\n` +
            `• **Order Total:** **$${activeSupportOrder.total || "0.00"}**\n` +
            `• **Fulfillment Telemetry:** Nominal — express dispatch confirmed.\n\n` +
            `You can also open the live satellite telemetry view by clicking 'Track Order' in your Orders tab.\n\n` +
            `If your delivery is delayed past expectations or you want human escalation, simply reply *"Problem not resolved"* or click *"Talk to Admin"* below!`;
        } else if (qLower.includes("damage") || qLower.includes("broken") || qLower.includes("cracked") || qLower.includes("defect")) {
          fallbackReply =
            `We are so sorry your item arrived damaged! ⚠️\n\n` +
            `Please upload or share images of the damaged product so we can verify the issue and approve your refund immediately.`;
        } else if (qLower.includes("not received") || qLower.includes("didn't receive") || qLower.includes("never received")) {
          fallbackReply =
            `We are truly sorry for the delay and inconvenience! 🚚\n\n` +
            `We will talk to our Admin Boss about this right away to investigate your shipment immediately. 🚨`;
        } else if (qLower.includes("return") || qLower.includes("exchange")) {
          fallbackReply =
            `Your return complaint has been registered! 📦\n\n` +
            `We are reviewing this and will assign a delivery partner to receive it.\n\n` +
            `Kindly pack it with your invoice, and our delivery partner will check and receive it.\n\n` +
            `Would you like to place the same order again?`;
        } else if (qLower.includes("order") || qLower.includes("track") || qLower.includes("shipment") || qLower.includes("delivery") || qLower.includes("purchased") || qLower.includes("receipt") || qLower.includes("history")) {
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
        } else if (
          qLower === "hi" || qLower === "hello" || qLower === "hey" ||
          qLower.startsWith("hi ") || qLower.startsWith("hello ") || qLower.startsWith("hey ")
        ) {
          fallbackReply =
            "Hello! I am Sparky, your R-Mart assistant. ⚡\n\n" +
            "How can I help you today? You can ask me about our products, check order status, or get support with returns and refunds.";
          fallbackSources = [];
        } else {
          fallbackReply =
            "Apologise, I only can solve queries regarding our website!\n\n" +
            "What would you like to buy today? Here are some trending products and active offers you might like:\n\n" +
            "🔥 **TRENDING PRODUCTS:**\n" +
            "• **Samsung Galaxy S24 Ultra 5G AI** ($1299.99) — Next-gen Galaxy AI with built-in S Pen!\n" +
            "• **Sony WH-1000XM5 Wireless Headphones** ($349.99) — Industry-leading 30hr active noise cancelling\n" +
            "• **Apple iPhone 15 Pro Max 256GB** ($1199.99) — Aerospace titanium with A17 Pro chip\n\n" +
            "🎉 **ACTIVE STORE OFFERS:**\n" +
            "• 🏷️ **FLASH50**: 50% discount on select high-demand electronics!\n" +
            "• 🚚 **FREESHIP**: Instant zero-cost express delivery on orders over $99!\n\n" +
            "What would you like to buy or explore in our store today?";
          fallbackSources = [];
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
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      setIsListening(false);
    }
    setIsStreaming(false);
    setInput("");
    try {
      localStorage.removeItem("rmart_ai_chat_history");
    } catch (e) {}
    hasInitializedGreeting.current = false;

    setMessages([
      {
        id: `cleared_${Date.now()}`,
        role: "assistant",
        content: isAdmin
          ? "How can I assist you with store inventory, tickets, or orders today?"
          : "How can I assist you with products, orders, or store offers today?",
        sources: [],
        provider: "Sparky Concierge"
      }
    ]);
  };

  return (
    <>
      {/* 1. SCREEN GOES PITCH DARK OVERLAY WHEN BOT IS CLICKED */}
      {isOpen && (
        <div
          data-testid="ai-dark-backdrop"
          onClick={handleCloseChat}
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
          {/* ONLY WHEN HOVERED: says "sparkyyy here !" for user and "bosss" for admin - no more side texts */}
          {isHovered && (
            <div
              data-testid="robo-speech-bubble"
              style={{
                backgroundColor: isDark ? "#0F172A" : "#FFFFFF",
                color: isAdmin ? "#F59E0B" : "#38BDF8",
                border: `1.5px solid ${isAdmin ? "#F59E0B" : "#38BDF8"}`,
                padding: "6px 14px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: "900",
                boxShadow: "0 4px 16px rgba(0, 0, 0, 0.4)",
                whiteSpace: "nowrap",
                animation: "fadeIn 0.2s ease-out"
              }}
            >
              {isAdmin ? "bosss" : "sparkyyy here !"}
            </div>
          )}

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
            backgroundColor: "rgba(4, 7, 15, 0.95)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            color: "#FFFFFF",
            padding: "16px",
            overflow: "hidden",
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
          }}
        >
          {/* Centered Command Console */}
          <div
            style={{
              maxWidth: "960px",
              width: "100%",
              height: "100%",
              margin: "0 auto",
              display: "flex",
              flexDirection: "column",
              backgroundColor: "#0B1120",
              backgroundImage: "radial-gradient(circle at 50% 0%, rgba(30, 58, 138, 0.12) 0%, transparent 65%)",
              border: `1px solid ${isAdmin ? "rgba(245, 158, 11, 0.25)" : "rgba(59, 130, 246, 0.25)"}`,
              borderRadius: "22px",
              boxShadow: "0 25px 65px rgba(0, 0, 0, 0.85), 0 0 1px 1px rgba(255, 255, 255, 0.05)",
              overflow: "hidden"
            }}
          >
            {/* Immersive Header (Jumping Robot & Clean Controls) */}
            <div
              style={{
                padding: "16px 24px",
                backgroundColor: "rgba(15, 23, 42, 0.85)",
                borderBottom: `1px solid ${isAdmin ? "rgba(245, 158, 11, 0.15)" : "rgba(59, 130, 246, 0.15)"}`,
                backdropFilter: "blur(12px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                {/* SPARKY JUMPS ON SCREEN ANIMATED AVATAR */}
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "14px",
                    backgroundColor: isAdmin ? "#D97706" : "#2563EB",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "24px",
                    boxShadow: isAdmin
                      ? "0 4px 18px rgba(217, 119, 6, 0.35)"
                      : "0 4px 18px rgba(37, 99, 235, 0.35)",
                    animation: "sparkyLeap 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)"
                  }}
                >
                  {isAdmin ? "🛡️" : "🤖"}
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", letterSpacing: "-0.2px", color: "#FFFFFF" }}>
                      {isAdmin ? "Boss Store Command Intelligence" : "Sparky AI Assistant • Amazon Rufus"}
                    </h3>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: "700",
                        padding: "2px 8px",
                        borderRadius: "8px",
                        backgroundColor: isAdmin ? "rgba(245, 158, 11, 0.15)" : "rgba(37, 99, 235, 0.15)",
                        border: `1px solid ${isAdmin ? "rgba(245, 158, 11, 0.3)" : "rgba(37, 99, 235, 0.3)"}`,
                        color: isAdmin ? "#FBBF24" : "#60A5FA"
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

              {/* Clean Top Controls */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <button
                  data-testid="clear-chat-history-btn"
                  onClick={handleClearChat}
                  title="Clear Conversation"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "#94A3B8",
                    fontSize: "13px",
                    cursor: "pointer",
                    padding: "7px 14px",
                    borderRadius: "10px",
                    fontWeight: "600",
                    transition: "all 0.15s ease"
                  }}
                >
                  Clear Chat
                </button>

                <button
                  onClick={handleCloseChat}
                  title="Close Assistant"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.08)",
                    border: "none",
                    color: "#E2E8F0",
                    borderRadius: "50%",
                    width: "36px",
                    height: "36px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "16px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    transition: "all 0.15s ease"
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
                        background: isUser
                          ? (isAdmin ? "linear-gradient(135deg, #D97706 0%, #B45309 100%)" : "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)")
                          : "rgba(17, 24, 39, 0.82)",
                        border: isUser
                          ? `1px solid ${isAdmin ? "rgba(245, 158, 11, 0.4)" : "rgba(96, 165, 250, 0.3)"}`
                          : `1px solid ${isAdmin ? "rgba(245, 158, 11, 0.22)" : "rgba(59, 130, 246, 0.2)"}`,
                        borderRadius: isUser ? "20px 20px 4px 20px" : "20px 20px 20px 4px",
                        padding: "18px 22px",
                        boxShadow: isUser
                          ? "0 6px 20px rgba(37, 99, 235, 0.3)"
                          : "0 8px 30px rgba(0, 0, 0, 0.45)",
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
                          marginBottom: "10px",
                          borderBottom: isUser ? "1px solid rgba(255,255,255,0.2)" : "1px solid rgba(255,255,255,0.06)",
                          paddingBottom: "8px"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "15px" }}>{isUser ? "👤" : isAdmin ? "🛡️" : "🤖"}</span>
                          <span style={{ fontSize: "13px", fontWeight: "800", color: isUser ? "#FFFFFF" : isAdmin ? "#FBBF24" : "#60A5FA" }}>
                            {isUser ? "You" : isAdmin ? "Boss Executive AI" : "Sparky AI Assistant"}
                          </span>
                        </div>

                        {!isUser && (
                          <span style={{ fontSize: "11px", color: "#94A3B8" }}>
                            {getDisplayAiEngine(m.provider || activeProvider)}
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
                          letterSpacing: "0.15px"
                        }}
                      >
                        {m.content ? (
                          m.content
                        ) : isStreaming ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "6px 0", color: "#93C5FD" }}>
                            <span style={{ fontSize: "16px" }}>⚡</span>
                            <span>
                              Analyzing catalog via <strong style={{ color: "#FBBF24" }}>{getDisplayAiEngine(m.provider || activeProvider)}</strong>...
                            </span>
                          </div>
                        ) : (
                          ""
                        )}
                      </div>

                      {/* AI MODEL STATUS BADGE & VOICE SPEAKER (UNDER MESSAGE) */}
                      {!isUser && (
                        <div
                          style={{
                            marginTop: "12px",
                            paddingTop: "8px",
                            borderTop: "1px solid rgba(255,255,255,0.06)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            flexWrap: "wrap",
                            gap: "8px"
                          }}
                        >
                          <div
                            data-testid="ai-provider-badge"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              backgroundColor: m.isModerationWarning ? "rgba(239, 68, 68, 0.2)" : "rgba(59, 130, 246, 0.12)",
                              border: m.isModerationWarning ? "1px solid rgba(239, 68, 68, 0.4)" : "1px solid rgba(59, 130, 246, 0.28)",
                              borderRadius: "20px",
                              padding: "3px 10px",
                              fontSize: "11.5px",
                              fontWeight: "700",
                              color: m.isModerationWarning ? "#FCA5A5" : "#93C5FD",
                              letterSpacing: "0.2px"
                            }}
                          >
                            <span style={{ fontSize: "12px" }}>{m.isModerationWarning ? "🛡️" : "⚡"}</span>
                            <span>{m.isModerationWarning ? "Safety Moderation Guardrail Active" : `Powered by: ${getDisplayAiEngine(m.provider || activeProvider)}`}</span>
                          </div>

                          {m.content && (
                            <button
                              onClick={() => speakTextInNaturalAccent(m.content)}
                              title="Listen to response"
                              aria-label="Listen"
                              style={{
                                backgroundColor: "rgba(59, 130, 246, 0.15)",
                                border: "1px solid rgba(59, 130, 246, 0.3)",
                                color: "#60A5FA",
                                borderRadius: "50%",
                                width: "30px",
                                height: "30px",
                                fontSize: "13px",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)"
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = "rgba(59, 130, 246, 0.28)";
                                e.currentTarget.style.transform = "scale(1.1)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "rgba(59, 130, 246, 0.15)";
                                e.currentTarget.style.transform = "scale(1)";
                              }}
                            >
                              🔊
                            </button>
                          )}
                        </div>
                      )}

                      {/* Live Admin Handover Direct Action Button */}
                      {!isUser && (m.isAdminHandover || m.showLiveChatBtn) && (
                        <div style={{ marginTop: "14px", paddingTop: "10px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                          <button
                            data-testid="live-admin-chat-btn"
                            onClick={() => {
                              handleCloseChat();
                              useUIStore.getState().openLiveChat("general");
                            }}
                            title="Directly connect with our human administrator in real-time"
                            style={{
                              backgroundColor: "#10B981",
                              color: "#FFFFFF",
                              border: "none",
                              borderRadius: "10px",
                              padding: "9px 18px",
                              fontSize: "13px",
                              fontWeight: "800",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "8px",
                              boxShadow: "0 4px 14px rgba(16, 185, 129, 0.45)",
                              transition: "all 0.15s ease"
                            }}
                          >
                            <span>👨‍💼</span>
                            <span>Talk to Admin on Live Chat</span>
                          </button>
                        </div>
                      )}

                      {/* Upload Damaged Product Photo Action Button */}
                      {!isUser && m.isDamageAwaiting && (
                        <div style={{ marginTop: "14px", paddingTop: "10px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                          <button
                            data-testid="upload-damage-photo-card-btn"
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                              backgroundColor: "#2563EB",
                              color: "#FFFFFF",
                              border: "none",
                              borderRadius: "10px",
                              padding: "9px 18px",
                              fontSize: "13px",
                              fontWeight: "800",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "8px",
                              boxShadow: "0 4px 14px rgba(37, 99, 235, 0.4)",
                              transition: "all 0.15s ease"
                            }}
                          >
                            <span>📸</span>
                            <span>Upload Photos of Damaged Item</span>
                          </button>
                        </div>
                      )}

                      {/* Clickable Return Reason Options */}
                      {!isUser && m.returnReasonPrompt && (
                        <div style={{ marginTop: "14px", paddingTop: "10px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                          <div style={{ fontSize: "11px", fontWeight: "700", color: "#94A3B8", marginBottom: "8px" }}>
                            Select return reason:
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                            {[
                              "Defective / Damaged",
                              "Wrong Item / Size",
                              "Item Not as Described",
                              "Changed Mind",
                              "Other Reason"
                            ].map((reason, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleSendMessage(`Return reason: ${reason}`)}
                                style={{
                                  backgroundColor: "rgba(30, 41, 59, 0.7)",
                                  border: "1px solid rgba(148, 163, 184, 0.3)",
                                  color: "#93C5FD",
                                  borderRadius: "8px",
                                  padding: "6px 12px",
                                  fontSize: "12px",
                                  fontWeight: "600",
                                  cursor: "pointer",
                                  transition: "all 0.15s ease"
                                }}
                              >
                                {reason}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Return Registered Item Card & Place Same Order Again Button */}
                      {!isUser && m.isReturnRegistered && m.returnItem && (
                        <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                          <div style={{ fontSize: "11.5px", fontWeight: "700", color: "#FDE68A", marginBottom: "8px" }}>
                            📦 Registered Return Item:
                          </div>
                          <div
                            style={{
                              backgroundColor: "rgba(30, 41, 59, 0.6)",
                              border: "1px solid rgba(245, 158, 11, 0.3)",
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
                                {m.returnItem.name || m.returnItem.title}
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                                <span style={{ color: "#F59E0B", fontWeight: "900", fontSize: "13px" }}>
                                  ${Number(m.returnItem.price || 0).toFixed(2)}
                                </span>
                                <span style={{ fontSize: "10px", fontWeight: "800", color: "#10B981" }}>
                                  Pickup Partner Assigned
                                </span>
                              </div>
                            </div>

                            <button
                              data-testid="reorder-item-btn"
                              onClick={() => {
                                addToCart({ id: m.returnItem.id, name: m.returnItem.name || m.returnItem.title, price: m.returnItem.price, stock: m.returnItem.stock || 10 }, 1);
                                setMessages((prev) => [
                                  ...prev,
                                  {
                                    id: `bot_reorder_${Date.now()}`,
                                    role: "assistant",
                                    content: `Great! I have re-added **${m.returnItem.name || m.returnItem.title}** to your shopping bag. 🛒 You can review your cart or checkout whenever you are ready!`,
                                    sources: [],
                                    provider: "Sparky Support Concierge"
                                  }
                                ]);
                              }}
                              style={{
                                backgroundColor: "#F59E0B",
                                color: "#030712",
                                border: "none",
                                padding: "8px 14px",
                                borderRadius: "10px",
                                fontSize: "12px",
                                fontWeight: "900",
                                cursor: "pointer",
                                whiteSpace: "nowrap",
                                boxShadow: "0 3px 10px rgba(245, 158, 11, 0.4)",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px"
                              }}
                            >
                              <span>🔄</span>
                              <span>Place Same Order Again (+ Cart)</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Day 21 Autonomous Tool Call Result Pill */}
                      {!isUser && m.toolCall && (
                        <div
                          data-testid="agent-tool-pill"
                          style={{
                            marginTop: "12px",
                            padding: "8px 12px",
                            borderRadius: "10px",
                            backgroundColor: "rgba(147, 51, 234, 0.15)",
                            border: "1px solid rgba(147, 51, 234, 0.4)",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            fontSize: "11px",
                            color: "#E9D5FF",
                            fontWeight: "700"
                          }}
                        >
                          <span>🔧 Action Executed:</span>
                          <span style={{ backgroundColor: "rgba(147, 51, 234, 0.35)", padding: "2px 8px", borderRadius: "6px", color: "#FFF" }}>
                            {m.toolCall.name}
                          </span>
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

                      {/* Interactive Product Source Citations (Cleaned of synthetic fixtures) */}
                      {!isUser && (() => {
                        const cleanSources = (m.sources || []).filter(isLegitimateProduct);
                        if (cleanSources.length === 0) return null;
                        return (
                          <div style={{ marginTop: "16px", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "12px" }}>
                            <div style={{ fontSize: "11px", fontWeight: "800", color: "#94A3B8", marginBottom: "8px" }}>
                              🏷️ Referenced Catalog Items ({cleanSources.length}):
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "10px" }}>
                              {cleanSources.map((src) => (
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
                                      {src.title || src.name}
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                                      <span style={{ color: "#F59E0B", fontWeight: "900", fontSize: "13px" }}>
                                        ${Number(src.price || 0).toFixed(2)}
                                      </span>
                                      <span style={{ fontSize: "10px", fontWeight: "800", color: src.stock > 0 ? "#10B981" : "#EF4444" }}>
                                        {src.stock > 0 ? `In Stock (${src.stock})` : "Out of Stock"}
                                      </span>
                                    </div>
                                  </div>

                                  {src.stock > 0 ? (
                                    <button
                                      onClick={() => addToCart({ id: src.id, name: src.title || src.name, price: src.price, stock: src.stock }, 1)}
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
                                      onClick={() => handleQuickRestock(src.title || src.name, 20)}
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
                        );
                      })()}
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
                borderTop: "1px solid rgba(148, 163, 184, 0.1)",
                backgroundColor: "rgba(11, 15, 25, 0.7)"
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
                    border: `1px solid ${isAdmin ? "rgba(245, 158, 11, 0.3)" : "rgba(148, 163, 184, 0.2)"}`,
                    backgroundColor: "rgba(30, 41, 59, 0.55)",
                    color: isAdmin ? "#FDE68A" : "#93C5FD",
                    fontSize: "12px",
                    fontWeight: "600",
                    cursor: isStreaming ? "not-allowed" : "pointer",
                    transition: "all 0.15s ease",
                    flexShrink: 0
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* HTTP 429 Rate Limit Warning Banner */}
            {chatRateLimitWarning && (
              <div
                data-testid="chat-429-warning-banner"
                style={{
                  margin: "10px 24px 0 24px",
                  padding: "12px 16px",
                  backgroundColor: "rgba(220, 38, 38, 0.25)",
                  border: "1px solid #DC2626",
                  borderRadius: "14px",
                  color: "#FCA5A5",
                  fontSize: "12px",
                  fontWeight: "800",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                  boxShadow: "0 4px 16px rgba(220, 38, 38, 0.25)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "18px" }}>🛑</span>
                  <span>{chatRateLimitWarning}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setChatRateLimitWarning(null)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#FCA5A5",
                    fontSize: "16px",
                    fontWeight: "900",
                    cursor: "pointer",
                  }}
                >
                  ✕
                </button>
              </div>
            )}

            {/* Input Bar with Voice Mic & Photo Attachment */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              style={{
                padding: "16px 24px",
                backgroundColor: "rgba(11, 15, 25, 0.95)",
                borderTop: "1px solid rgba(148, 163, 184, 0.12)",
                display: "flex",
                alignItems: "center",
                gap: "12px"
              }}
            >
              <input
                data-testid="damage-photo-input"
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                accept="image/*"
                style={{ display: "none" }}
              />

              <button
                type="button"
                data-testid="upload-photo-btn"
                onClick={() => fileInputRef.current?.click()}
                title="Upload photo / proof of damaged item"
                style={{
                  width: "46px",
                  height: "46px",
                  borderRadius: "14px",
                  border: "1px solid rgba(148, 163, 184, 0.2)",
                  backgroundColor: "rgba(30, 41, 59, 0.7)",
                  color: "#60A5FA",
                  fontSize: "18px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.15s ease"
                }}
              >
                📸
              </button>

              <button
                type="button"
                onClick={handleToggleMic}
                title={isListening ? "Listening... Click to stop" : "Speak to Sparky (Mic)"}
                style={{
                  width: "46px",
                  height: "46px",
                  borderRadius: "14px",
                  border: isListening ? "1px solid #DC2626" : "1px solid rgba(148, 163, 184, 0.2)",
                  backgroundColor: isListening ? "#EF4444" : "rgba(30, 41, 59, 0.7)",
                  color: isListening ? "#FFFFFF" : "#60A5FA",
                  fontSize: "20px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  animation: isListening ? "pulse 1s infinite" : "none",
                  transition: "all 0.15s ease"
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
                  border: "1px solid rgba(148, 163, 184, 0.2)",
                  backgroundColor: "rgba(17, 24, 39, 0.9)",
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
                  backgroundColor: isAdmin ? "#D97706" : "#2563EB",
                  color: "#FFFFFF",
                  fontWeight: "900",
                  fontSize: "18px",
                  cursor: !input.trim() || isStreaming ? "not-allowed" : "pointer",
                  opacity: !input.trim() || isStreaming ? 0.4 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: !input.trim() || isStreaming ? "none" : (isAdmin ? "0 4px 14px rgba(217, 119, 6, 0.4)" : "0 4px 14px rgba(37, 99, 235, 0.4)"),
                  transition: "all 0.15s ease"
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
