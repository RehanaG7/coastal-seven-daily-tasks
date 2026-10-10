import React, { useState, useEffect, useRef } from "react";
import { useCartStore, useUIStore, useAuthStore } from "../store/useStore";
import { env } from "../config/env";

const INITIAL_GREETINGS = [
  "Beep-boop! 🤖 Hey there shopper! I'm Sparky, your 24/7 AI shopping buddy at R-Mart. How can I help you today?",
  "Bzzzt! ⚡ Greetings human friend! Looking for epic gadgets, secret discounts, or specs? I've indexed every single item in the store!",
  "Greetings! 🤖 I was just playing hide-and-seek around the warehouse! What deals can I dig up for you today?",
  "Beep! 🤖 Ready to assist! Tell me what you're shopping for, and I'll find the best in-stock products with exact prices!"
];

const DEFAULT_SUGGESTIONS = [
  "What's new in R-Mart Sparkyyy? 🎁",
  "Show me smartphones under $800 📱",
  "Any noise-cancelling wireless headphones? 🎧",
  "Tell me a funny shopping joke! 😂"
];

// Screen positions for the roaming peek-a-boo robot
const PEEK_POSITIONS = [
  { id: "bottom-right", style: { bottom: "0px", right: "28px" } },
  { id: "bottom-left", style: { bottom: "0px", left: "28px" } },
  { id: "top-right", style: { top: "84px", right: "28px" } },
  { id: "mid-left", style: { top: "50%", left: "10px", transform: "translateY(-50%)" } },
  { id: "mid-right", style: { top: "50%", right: "10px", transform: "translateY(-50%)" } }
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
  const [activeProvider, setActiveProvider] = useState("RAG Assistant");
  const [viewedProducts, setViewedProducts] = useState([]);

  // Hide and Seek animation state
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

  // Hide-and-seek interval: Bot roams around different screen edges
  useEffect(() => {
    if (isOpen) return;

    const phrases = [
      "Peek-a-boo! Can't catch me! 👀",
      "I'm over here now! Tap me! 🤖",
      "Boo! Looking for discounts? ✨",
      "Hide & Seek champion of R-Mart! 🎮",
      "Psst! Click me for shopping magic! 💡"
    ];

    const interval = setInterval(() => {
      setIsHiding(true);
      // After hiding slide, teleport to next screen position and pop back up
      setTimeout(() => {
        setPositionIndex((prev) => (prev + 1) % PEEK_POSITIONS.length);
        const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
        setSpeechBubbleText(randomPhrase);
        setIsHiding(false);
      }, 500);
    }, 7000);

    return () => clearInterval(interval);
  }, [isOpen]);

  // Text to Speech
  const speakText = (text) => {
    if (!("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const clean = text.replace(/\[Source:[^\]]+\]/g, "").replace(/[*_#`~]/g, "");
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.pitch = 1.25;
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
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
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

  // Check store inventory for out of stock items
  const getCatalogAudit = () => {
    try {
      const custom = JSON.parse(localStorage.getItem("rmart_custom_products") || "[]");
      const overrides = JSON.parse(localStorage.getItem("rmart_stock_overrides") || "{}");
      const deleted = new Set(JSON.parse(localStorage.getItem("rmart_deleted_product_ids") || "[]").map(String));

      // Quick sample of items
      const sample = [
        { id: 1, name: "Apple iPhone 15 Pro Max", stock: 0, price: 1199.99 },
        { id: 2, name: "Sony WH-1000XM5 Headphones", stock: 15, price: 349.99 },
        { id: 3, name: "Samsung Galaxy S24 Ultra", stock: 8, price: 1299.99 },
        ...custom
      ].filter((p) => !deleted.has(String(p.id)));

      const outOfStock = sample.filter((p) => (overrides[p.id] !== undefined ? overrides[p.id] : p.stock) === 0);
      const lowStock = sample.filter((p) => {
        const s = overrides[p.id] !== undefined ? overrides[p.id] : p.stock;
        return s > 0 && s < 5;
      });

      return { outOfStock, lowStock };
    } catch {
      return { outOfStock: [], lowStock: [] };
    }
  };

  // Check support tickets / customer queries
  const getCustomerComplaints = () => {
    try {
      const tickets = JSON.parse(localStorage.getItem("rmart_support_tickets") || "[]");
      return tickets;
    } catch {
      return [];
    }
  };

  // Add stock helper for Admin directly from chat
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

  // Initialize greeting on chat open (Distinct for Admin vs Customer)
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      if (isAdmin) {
        const audit = getCatalogAudit();
        const tickets = getCustomerComplaints();

        let adminGreeting = `Greetings Boss Admin! 🫡 Sparky Operational Assistant reporting for duty.\n\n`;

        if (audit.outOfStock.length > 0) {
          adminGreeting += `🚨 **STOCK DEPLETION ALERT:**\nThe following product(s) have **RUN OUT OF STOCK (0 units)**:\n`;
          audit.outOfStock.forEach((p) => {
            adminGreeting += `• **${p.name || p.title}** ($${p.price}) — *Shoppers are asking for this!*\n`;
          });
          adminGreeting += `\nTap below to replenish stock immediately!\n\n`;
        } else {
          adminGreeting += `✅ All catalog items currently have active inventory.\n\n`;
        }

        if (tickets.length > 0) {
          adminGreeting += `📩 **CUSTOMER INQUIRIES:**\nYou have **${tickets.length} open customer tickets/complaints** waiting for review:\n`;
          tickets.slice(0, 2).forEach((t) => {
            adminGreeting += `• *${t.subject || "Order inquiry"}* (from ${t.user || "Customer"})\n`;
          });
        } else {
          adminGreeting += `💬 Customer inquiries: All clear, no pending complaints!`;
        }

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
        `Is ${shortTitle} in stock? 📦`,
        "Show similar products in this category 🔍",
        "Tell me a shopping joke! 😂"
      ];
    }
    return DEFAULT_SUGGESTIONS;
  };

  // Send Chat Message via SSE Streaming with Fallback
  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || input).trim();
    if (!query || isStreaming) return;

    setInput("");
    const userMsgId = `user_${Date.now()}`;
    const botMsgId = `bot_${Date.now()}`;

    // If shopper asks "what's new" or about offers, immediately file an inquiry ticket for Boss Admin
    const qLower = query.toLowerCase();
    if (!isAdmin && (qLower.includes("what's new") || qLower.includes("whats new") || qLower.includes("sparkyyy") || qLower.includes("offer") || qLower.includes("discount"))) {
      try {
        const existing = JSON.parse(localStorage.getItem("rmart_support_tickets") || "[]");
        const newTicket = {
          id: `TCK-${Date.now().toString().slice(-4)}`,
          subject: "Customer asked: What's new in R-Mart & latest offers?",
          user: "Shopper (via Sparky)",
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
      // Connect to backend SSE endpoint (Correct non-duplicate URL)
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

      if (!response.ok || !response.body) {
        throw new Error(`HTTP ${response.status}: Failed to connect to AI stream.`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let accumulatedText = "";
      let collectedSources = [];
      let detectedProvider = "AI Assistant";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        let eventType = "message";
        for (const line of lines) {
          if (line.startsWith("event: ")) {
            eventType = line.replace("event: ", "").trim();
          } else if (line.startsWith("data: ")) {
            const dataStr = line.replace("data: ", "").trim();
            if (dataStr) {
              try {
                const parsed = JSON.parse(dataStr);
                if (eventType === "metadata" && parsed.sources) {
                  collectedSources = parsed.sources;
                } else if (eventType === "provider" && parsed.provider) {
                  detectedProvider = parsed.provider;
                  setActiveProvider(parsed.provider);
                } else if (eventType === "token" && parsed.token) {
                  accumulatedText += parsed.token;
                } else if (eventType === "done") {
                  if (parsed.provider) detectedProvider = parsed.provider;
                }
              } catch {
                // Ignore non-JSON lines
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
      }

      if (isVoiceEnabled && accumulatedText) {
        speakText(accumulatedText);
      }
    } catch (err) {
      console.warn("[Sparky AI] Server stream fallback:", err);

      // Dynamic Contextual Local Fallback (Never repeats exact same static text)
      const randomJoke = FUN_JOKES[Math.floor(Math.random() * FUN_JOKES.length)];
      const qLower = query.toLowerCase();

      let fallbackReply = "";
      let fallbackSources = [];

      if (isAdmin) {
        const audit = getCatalogAudit();
        const tickets = getCustomerComplaints();
        if (qLower.includes("stock") || qLower.includes("out of stock") || qLower.includes("inventory")) {
          fallbackReply = `Boss! Here is your live stock status:\n\n` +
            (audit.outOfStock.length > 0
              ? `🚨 **${audit.outOfStock.length} Products OUT OF STOCK:**\n` + audit.outOfStock.map((p) => `• ${p.name || p.title} ($${p.price})`).join("\n") +
                `\n\nI recommend replenishing stock now so customers can complete purchases!`
              : `✅ All products have active inventory. No stock shortages detected!`);
        } else if (qLower.includes("complaint") || qLower.includes("inquir") || qLower.includes("ticket")) {
          fallbackReply = `Boss! Here are current customer inquiries:\n\n` +
            (tickets.length > 0
              ? `📩 **${tickets.length} Tickets on File:**\n` + tickets.map((t) => `• [${t.id || "TCK"}] ${t.subject || "Issue"} (${t.user || "Customer"})`).join("\n")
              : `💬 No open complaints! Customers are satisfied.`);
        } else if (qLower.includes("joke")) {
          fallbackReply = `Here's a joke for the Boss! 😂\n\n**${randomJoke}**\n\nReady for more store management tasks! 🫡`;
        } else {
          fallbackReply = `Salute, Boss Admin! 🫡 I scanned the store regarding **"${query}"**.\n\n` +
            `• Out-of-stock items: ${audit.outOfStock.length}\n` +
            `• Open customer tickets: ${tickets.length}\n\n` +
            `Let me know if you want me to alert you to restock or review customer queries!`;
        }
      } else {
        // Customer Shopping Fallback
        if (qLower.includes("what's new") || qLower.includes("whats new") || qLower.includes("sparkyyy") || qLower.includes("offer") || qLower.includes("deal")) {
          fallbackReply = `✨ **Fresh Arrivals & Hot Deals in R-Mart!** 🎁\n\n` +
            `Here's what just dropped in our store:\n` +
            `• **Samsung Galaxy S24 Ultra AI** ($1299.99) — Live Translation & Titanium Armor!\n` +
            `• **Sony WH-1000XM5 Wireless Headphones** ($349.99) — 30hr battery & active noise cancelling!\n` +
            `• **Apple iPhone 15 Pro Max 256GB** ($1199.99) — Aerospace titanium with A17 Pro chip!\n\n` +
            `🎉 **ACTIVE OFFERS & DISCOUNTS:**\n` +
            `• Use promo code **FLASH50** for **50% OFF** on select electronics!\n` +
            `• Use code **FREESHIP** for zero-cost express delivery on orders over $99!\n\n` +
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
        } else if (qLower.includes("joke") || qLower.includes("funny")) {
          fallbackReply = `Beep-boop! 🤖 Here's a tech joke to brighten your shopping:\n\n**${randomJoke}**\n\nAsk me about any product or specs! ✨`;
        } else if (qLower.includes("iphone") || qLower.includes("phone")) {
          fallbackReply = `I checked our inventory for **"${query}"**! 📱\n\n` +
            `• **Apple iPhone 15 Pro Max 256GB** ($1199.99) — *Stock: 0 units*\n` +
            `Don't worry! **I will say my boss admin to add stock as soon as possible - make it available!** 🚀\n\n` +
            `[Source: Apple iPhone 15 Pro Max 256GB (ID: #1, $1199.99)]\n\n` +
            `P.S. *${randomJoke}*`;
          fallbackSources = [{ id: 1, title: "Apple iPhone 15 Pro Max 256GB", price: 1199.99, stock: 0 }];
        } else if (qLower.includes("headphone") || qLower.includes("audio") || qLower.includes("sony")) {
          fallbackReply = `Awesome choice! 🎧 Here's what is ready in our warehouse:\n\n` +
            `• **Sony WH-1000XM5 Wireless Headphones** ($349.99) — In Stock & ready to ship!\n` +
            `Industry-leading noise cancelling with 30-hour battery.\n\n` +
            `[Source: Sony WH-1000XM5 Wireless Headphones (ID: #2, $349.99)]\n\n` +
            `😄 *${randomJoke}*`;
          fallbackSources = [{ id: 2, title: "Sony WH-1000XM5 Wireless Headphones", price: 349.99, stock: 15 }];
        } else {
          fallbackReply = `Beep-boop! 🤖 I searched our live warehouse for **"${query}"**.\n\n` +
            `All in-stock products are eligible for instant checkout and fast delivery! ` +
            `If any item runs out of stock, **I will say my boss admin to add stock as soon as possible - make it available!** 🚀\n\n` +
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
                  provider: isAdmin ? "Boss Executive AI" : "Sparky Local Intelligence"
                }
              : m
          )
        );
        await new Promise((r) => setTimeout(r, 15));
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
      {/* 1. SCREEN GOES DARK OVERLAY WHEN BOT IS CLICKED */}
      {isOpen && (
        <div
          data-testid="ai-dark-backdrop"
          onClick={() => setIsOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.72)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            zIndex: 998,
            animation: "fadeInBackdrop 0.25s ease-out forwards",
            transition: "all 0.3s ease"
          }}
        />
      )}

      {/* 2. SNEAKPEEK ROBO ROAMING PEEK-A-BOO TRIGGER (Moves all over screen) */}
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
              transform: isHiding && !isHovered ? "scale(0.7) translateY(16px)" : "scale(1) translateY(0)",
              opacity: isHiding && !isHovered ? 0 : 1,
              transition: "all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
              position: "relative",
              whiteSpace: "nowrap"
            }}
          >
            {isHovered ? (isAdmin ? "🫡 Click for Boss Briefing!" : "🤖 Click to chat with Sparky!") : speechBubbleText}
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

          {/* SNEAKPEEK ROBO AVATAR */}
          <div
            data-testid="sneakpeek-robo-avatar"
            style={{
              width: "74px",
              height: "74px",
              transform: isHiding && !isHovered ? "translateY(40px) scale(0.85)" : "translateY(0px) scale(1)",
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
              <rect x="22" y="18" width="56" height="42" rx="14" fill={isDark ? "#0F172A" : "#FFFFFF"} stroke={isAdmin ? "#F59E0B" : "#38BDF8"} strokeWidth="3.5" />

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
              <rect x="28" y="60" width="44" height="26" rx="10" fill={isDark ? "#1E293B" : "#E2E8F0"} stroke={isAdmin ? "#F59E0B" : "#38BDF8"} strokeWidth="3" />
              {/* Chest Badge */}
              <circle cx="50" cy="72" r="6" fill={isAdmin ? "#F59E0B" : "#38BDF8"} />
              <text x="50" y="75" fontSize="8" fontWeight="bold" textAnchor="middle" fill="#000">
                {isAdmin ? "A" : "R"}
              </text>
            </svg>
          </div>
        </div>
      )}

      {/* 3. AI CHAT MODAL WINDOW */}
      {isOpen && (
        <div
          data-testid="ai-chat-modal"
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            width: "420px",
            maxWidth: "calc(100vw - 48px)",
            height: "640px",
            maxHeight: "calc(100vh - 48px)",
            backgroundColor: isDark ? "rgba(11, 15, 25, 0.94)" : "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderRadius: "24px",
            boxShadow: isDark
              ? "0 25px 60px -12px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(56, 189, 248, 0.25)"
              : "0 25px 60px -12px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(14, 165, 233, 0.2)",
            display: "flex",
            flexDirection: "column",
            zIndex: 999,
            overflow: "hidden",
            animation: "slideUpChat 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards"
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "16px 20px",
              backgroundColor: isDark ? "#0F172A" : "#F8FAFC",
              borderBottom: `1px solid ${isDark ? "#1E293B" : "#E2E8F0"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "14px",
                  backgroundColor: isAdmin ? "#F59E0B" : "#38BDF8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "22px",
                  boxShadow: isAdmin
                    ? "0 4px 12px rgba(245, 158, 11, 0.4)"
                    : "0 4px 12px rgba(56, 189, 248, 0.4)"
                }}
              >
                {isAdmin ? "🛡️" : "🤖"}
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "900", color: isDark ? "#FFFFFF" : "#0F172A" }}>
                    {isAdmin ? "Boss Store Intelligence" : "Sparky AI Assistant"}
                  </h3>
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: "800",
                      padding: "2px 6px",
                      borderRadius: "6px",
                      backgroundColor: isAdmin ? "rgba(245, 158, 11, 0.2)" : "rgba(16, 185, 129, 0.2)",
                      color: isAdmin ? "#F59E0B" : "#10B981"
                    }}
                  >
                    {isAdmin ? "BOSS ADMIN" : "ONLINE"}
                  </span>
                </div>
                <div style={{ fontSize: "11px", color: isDark ? "#94A3B8" : "#64748B", marginTop: "2px" }}>
                  Provider: <span style={{ color: isAdmin ? "#F59E0B" : "#38BDF8", fontWeight: "700" }}>{activeProvider}</span>
                </div>
              </div>
            </div>

            {/* Header Controls (Voice Toggle + Clear + Close) */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              {/* Voice Output Toggle */}
              <button
                onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
                title={isVoiceEnabled ? "Mute Bot Speech" : "Enable Bot Speech (TTS)"}
                style={{
                  background: isVoiceEnabled ? (isAdmin ? "#F59E0B" : "#38BDF8") : "transparent",
                  color: isVoiceEnabled ? "#030712" : isDark ? "#94A3B8" : "#64748B",
                  border: `1px solid ${isDark ? "#334155" : "#CBD5E1"}`,
                  borderRadius: "8px",
                  padding: "5px 8px",
                  fontSize: "12px",
                  cursor: "pointer",
                  fontWeight: "800"
                }}
              >
                {isVoiceEnabled ? "🔊 ON" : "🔇 OFF"}
              </button>

              <button
                onClick={handleClearChat}
                title="Clear Chat History"
                style={{
                  background: "none",
                  border: "none",
                  color: isDark ? "#94A3B8" : "#64748B",
                  fontSize: "15px",
                  cursor: "pointer",
                  padding: "6px"
                }}
              >
                🗑️
              </button>

              <button
                onClick={() => setIsOpen(false)}
                title="Close Assistant"
                style={{
                  background: isDark ? "#1E293B" : "#E2E8F0",
                  border: "none",
                  color: isDark ? "#FFFFFF" : "#0F172A",
                  borderRadius: "50%",
                  width: "28px",
                  height: "28px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "14px",
                  fontWeight: "bold",
                  cursor: "pointer"
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "14px"
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
                    gap: "6px"
                  }}
                >
                  <div
                    style={{
                      maxWidth: "85%",
                      padding: "12px 16px",
                      borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                      backgroundColor: isUser
                        ? (isAdmin ? "#F59E0B" : "#38BDF8")
                        : isDark
                        ? "#1E293B"
                        : "#F1F5F9",
                      color: isUser ? "#030712" : isDark ? "#F8FAFC" : "#0F172A",
                      fontSize: "13px",
                      lineHeight: "1.55",
                      fontWeight: isUser ? "700" : "500",
                      boxShadow: isUser
                        ? "0 4px 12px rgba(56, 189, 248, 0.3)"
                        : "0 2px 8px rgba(0, 0, 0, 0.05)",
                      whiteSpace: "pre-wrap",
                      position: "relative"
                    }}
                  >
                    {m.content || (isStreaming ? "Thinking and searching catalog... ⚡" : "")}

                    {/* Speaker icon to re-speak this message aloud */}
                    {!isUser && m.content && (
                      <button
                        onClick={() => speakText(m.content)}
                        title="Speak aloud"
                        style={{
                          display: "inline-block",
                          marginLeft: "8px",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "12px",
                          opacity: 0.7
                        }}
                      >
                        🔊
                      </button>
                    )}
                  </div>

                  {/* Quick Admin Actions (Add Stock buttons right inside chat) */}
                  {!isUser && m.adminActions && m.adminActions.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "4px" }}>
                      {m.adminActions.map((name, i) => (
                        <button
                          key={i}
                          onClick={() => handleQuickRestock(name, 20)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "8px",
                            border: "none",
                            backgroundColor: "#10B981",
                            color: "#FFFFFF",
                            fontSize: "11px",
                            fontWeight: "800",
                            cursor: "pointer",
                            boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px"
                          }}
                        >
                          <span>➕</span>
                          <span>Add 20 Stock to {name.split(" ")[0]}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Interactive Product Source Citations */}
                  {!isUser && m.sources && m.sources.length > 0 && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                        width: "100%",
                        marginTop: "4px"
                      }}
                    >
                      <div style={{ fontSize: "11px", fontWeight: "800", color: isDark ? "#94A3B8" : "#64748B", display: "flex", alignItems: "center", gap: "4px" }}>
                        <span>🏷️</span>
                        <span>Referenced Catalog Items ({m.sources.length}):</span>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "8px" }}>
                        {m.sources.map((src) => (
                          <div
                            key={src.id}
                            style={{
                              backgroundColor: isDark ? "rgba(15, 23, 42, 0.7)" : "#FFFFFF",
                              border: `1px solid ${isDark ? "#334155" : "#E2E8F0"}`,
                              borderRadius: "12px",
                              padding: "10px 14px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: "10px"
                            }}
                          >
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div
                                style={{
                                  fontSize: "12px",
                                  fontWeight: "800",
                                  color: isDark ? "#FFFFFF" : "#0F172A",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis"
                                }}
                              >
                                {src.title}
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "3px" }}>
                                <span style={{ color: "#F59E0B", fontWeight: "900", fontSize: "12px" }}>
                                  ${src.price?.toFixed(2)}
                                </span>
                                <span
                                  style={{
                                    fontSize: "10px",
                                    fontWeight: "800",
                                    color: src.stock > 0 ? "#10B981" : "#EF4444"
                                  }}
                                >
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
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Quick Prompt Chips */}
          <div
            style={{
              padding: "8px 16px",
              display: "flex",
              gap: "8px",
              overflowX: "auto",
              whiteSpace: "nowrap",
              borderTop: `1px solid ${isDark ? "#1E293B" : "#F1F5F9"}`,
              backgroundColor: isDark ? "rgba(15, 23, 42, 0.4)" : "rgba(248, 250, 252, 0.7)"
            }}
          >
            {getSuggestions().map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(chip)}
                disabled={isStreaming}
                style={{
                  padding: "6px 12px",
                  borderRadius: "999px",
                  border: `1px solid ${isDark ? "#334155" : "#CBD5E1"}`,
                  backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
                  color: isDark ? "#38BDF8" : "#0284C7",
                  fontSize: "11px",
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

          {/* Input Box with Voice Mic */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            style={{
              padding: "14px 16px",
              backgroundColor: isDark ? "#0F172A" : "#FFFFFF",
              borderTop: `1px solid ${isDark ? "#1E293B" : "#E2E8F0"}`,
              display: "flex",
              alignItems: "center",
              gap: "10px"
            }}
          >
            {/* Mic Button */}
            <button
              type="button"
              onClick={handleToggleMic}
              title={isListening ? "Listening... Click to stop" : "Speak to Sparky (Mic)"}
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                border: "none",
                backgroundColor: isListening
                  ? "#EF4444"
                  : isDark
                  ? "#1E293B"
                  : "#F1F5F9",
                color: isListening ? "#FFFFFF" : isDark ? "#38BDF8" : "#0284C7",
                fontSize: "18px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                animation: isListening ? "pulse 1s infinite" : "none",
                transition: "all 0.2s ease"
              }}
            >
              🎙️
            </button>

            <input
              data-testid="ai-chat-input"
              type="text"
              placeholder={isListening ? "Listening to your voice..." : isAdmin ? "Ask Boss Intelligence about stock or complaints..." : "Ask Sparky about products, specs, deals..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isStreaming}
              style={{
                flex: 1,
                padding: "10px 14px",
                borderRadius: "12px",
                border: `1px solid ${isDark ? "#334155" : "#CBD5E1"}`,
                backgroundColor: isDark ? "#070A10" : "#F8FAFC",
                color: isDark ? "#FFFFFF" : "#0F172A",
                fontSize: "13px",
                outline: "none"
              }}
            />

            <button
              data-testid="ai-chat-send-btn"
              type="submit"
              disabled={!input.trim() || isStreaming}
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                border: "none",
                backgroundColor: isAdmin ? "#F59E0B" : "#38BDF8",
                color: "#030712",
                fontWeight: "900",
                fontSize: "16px",
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
      )}
    </>
  );
}
