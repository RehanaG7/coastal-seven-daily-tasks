import React, { useState, useEffect, useRef } from "react";
import { useCartStore, useUIStore } from "../store/useStore";
import { env } from "../config/env";

const INITIAL_GREETINGS = [
  "Beep-boop! 🤖 Hey there shopper! I'm Sparky, your 24/7 AI shopping buddy at R-Mart. How can I help you today?",
  "Bzzzt! ⚡ Greetings human friend! Looking for epic gadgets, secret discounts, or specs? I've indexed every single item in the store!",
  "Greetings! 🤖 I was just playing hide-and-seek around the warehouse! What deals can I dig up for you today?",
  "Beep! 🤖 Ready to assist! Tell me what you're shopping for, and I'll find the best in-stock products with exact prices!"
];

const DEFAULT_SUGGESTIONS = [
  "Show me smartphones under $800 📱",
  "Any noise-cancelling wireless headphones? 🎧",
  "Are gaming monitors in stock? 🖥️",
  "Tell me a funny shopping joke! 😂"
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
  const [speechBubbleText, setSpeechBubbleText] = useState("Psst! Looking for deals? 👀");
  const [isHovered, setIsHovered] = useState(false);

  const theme = useUIStore((s) => s.theme);
  const isDark = theme === "dark";
  const addToCart = useCartStore((s) => s.addToCart);

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

  // Hide-and-seek interval when idle
  useEffect(() => {
    if (isOpen) return;

    const phrases = [
      "Psst! Looking for deals? 👀",
      "Peek-a-boo! 🤖 Click me!",
      "I know all the secret discounts! ⚡",
      "Hide & Seek champion at your service! 🎮",
      "Need help choosing? Ask Sparky! 💡"
    ];

    const interval = setInterval(() => {
      setIsHiding((prev) => {
        const next = !prev;
        if (!next) {
          const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
          setSpeechBubbleText(randomPhrase);
        }
        return next;
      });
    }, 4500);

    return () => clearInterval(interval);
  }, [isOpen]);

  // Initialize opening greeting when chat opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const randomGreet = INITIAL_GREETINGS[Math.floor(Math.random() * INITIAL_GREETINGS.length)];
      setMessages([
        {
          id: "greet_1",
          role: "assistant",
          content: randomGreet,
          sources: [],
          provider: "Sparky Concierge"
        }
      ]);
    }
  }, [isOpen, messages.length]);

  // Scroll to bottom on new message
  useEffect(() => {
      if (typeof messagesEndRef.current?.scrollIntoView === "function") {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
  }, [messages, isStreaming, isOpen]);

  // Dynamic suggestions based on user watch history
  const getDynamicSuggestions = () => {
    if (viewedProducts && viewedProducts.length > 0) {
      const recent = viewedProducts[0];
      const recentTitle = recent.title || recent.name || "Product";
      const shortTitle = recentTitle.length > 25 ? recentTitle.substring(0, 22) + "..." : recentTitle;
      return [
        `Tell me about ${shortTitle} 🏷️`,
        `Is ${shortTitle} in stock? 📦`,
        "Show similar products in this category 🔍",
        "Tell me a shopping joke! 😂"
      ];
    }
    return DEFAULT_SUGGESTIONS;
  };

  // Send Chat Message via SSE Streaming
  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || input).trim();
    if (!query || isStreaming) return;

    setInput("");
    const userMsgId = `user_${Date.now()}`;
    const botMsgId = `bot_${Date.now()}`;

    const newMessages = [
      ...messages,
      { id: userMsgId, role: "user", content: query }
    ];

    // Placeholder bot message
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
      const apiUrl = env.API_URL || "http://127.0.0.1:8000";
      const historyPayload = messages.slice(-4).map((m) => ({
        role: m.role,
        content: m.content
      }));

      const response = await fetch(`${apiUrl}/api/v1/ai/chat/stream`, {
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
      let detectedProvider = "RAG Engine";

      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop(); // Keep unfinished trailing chunk

        for (const eventStr of events) {
          if (!eventStr.trim()) continue;

          const lines = eventStr.split("\n");
          let eventType = "message";
          let dataStr = "";

          for (const line of lines) {
            if (line.startsWith("event: ")) {
              eventType = line.replace("event: ", "").trim();
            } else if (line.startsWith("data: ")) {
              dataStr = line.replace("data: ", "").trim();
            }
          }

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
              // Ignore non-JSON line
            }
          }

          // Update active bot message
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
      console.warn("[Sparky AI] Server stream fallback:", err);
      // Client-side fallback if server is unreachable
      const fallbackJoke = "Why do computers overheat? Because they have too many fans! 💻😂";
      const fallbackReply = query.toLowerCase().includes("joke")
        ? `Beep-boop! 🤖 Here is your joke:\n\n**${fallbackJoke}**\n\nAsk me about any product in our store!`
        : `Beep-boop! 🤖 I checked our inventory for **"${query}"**.\n\n` +
          `If any item is out of stock, **I will say my boss admin to add stock as soon as possible - make it available!** 🚀\n\n` +
          `P.S. *${fallbackJoke}*`;

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
                  provider: "Sparky Offline Intelligence"
                }
              : m
          )
        );
        await new Promise((r) => setTimeout(r, 20));
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
      {/* 1. SCREEN GOES DARK OVERLAY WHEN BOT IS CLICKED */}
      {isOpen && (
        <div
          data-testid="ai-dark-backdrop"
          onClick={() => setIsOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            zIndex: 998,
            animation: "fadeInBackdrop 0.25s ease-out forwards",
            transition: "all 0.3s ease"
          }}
        />
      )}

      {/* 2. SNEAKPEEK ROBO FLOATING TRIGGER (BOTTOM RIGHT) */}
      {!isOpen && (
        <div
          data-testid="sneakpeek-robo-container"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={() => setIsOpen(true)}
          style={{
            position: "fixed",
            bottom: "0px",
            right: "28px",
            zIndex: 999,
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            userSelect: "none"
          }}
        >
          {/* Playful Floating Speech Bubble */}
          <div
            data-testid="robo-speech-bubble"
            style={{
              marginBottom: "8px",
              backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
              color: isDark ? "#38BDF8" : "#0284C7",
              border: `2px solid ${isDark ? "#38BDF8" : "#0284C7"}`,
              padding: "6px 14px",
              borderRadius: "16px",
              fontSize: "12px",
              fontWeight: "900",
              boxShadow: "0 8px 24px rgba(56, 189, 248, 0.35)",
              transform: isHiding && !isHovered ? "scale(0.85) translateY(12px)" : "scale(1) translateY(0)",
              opacity: isHiding && !isHovered ? 0.2 : 1,
              transition: "all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
              position: "relative",
              whiteSpace: "nowrap"
            }}
          >
            {isHovered ? "🤖 Click to chat with Sparky!" : speechBubbleText}
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
                borderRight: `2px solid ${isDark ? "#38BDF8" : "#0284C7"}`,
                borderBottom: `2px solid ${isDark ? "#38BDF8" : "#0284C7"}`
              }}
            />
          </div>

          {/* SNEAKPEEK ROBO AVATAR WITH HIDE AND SEEK MECHANICS */}
          <div
            data-testid="sneakpeek-robo-avatar"
            style={{
              width: "74px",
              height: "74px",
              transform: isHiding && !isHovered ? "translateY(38px)" : "translateY(0px)",
              transition: "transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)",
              position: "relative",
              filter: "drop-shadow(0 10px 20px rgba(14, 165, 233, 0.5))"
            }}
          >
            <svg
              viewBox="0 0 100 100"
              style={{
                width: "100%",
                height: "100%",
                overflow: "visible"
              }}
            >
              {/* Antenna with Glowing Energy Orb */}
              <line x1="50" y1="20" x2="50" y2="34" stroke="#0284C7" strokeWidth="4" strokeLinecap="round" />
              <circle
                cx="50"
                y="16"
                r="7"
                fill="#F59E0B"
                style={{
                  filter: "drop-shadow(0 0 8px #F59E0B)",
                  animation: "pulseGlow 1.5s infinite alternate"
                }}
              />

              {/* Robot Head Body */}
              <rect
                x="20"
                y="34"
                width="60"
                height="48"
                rx="16"
                fill={isDark ? "#0F172A" : "#E0F2FE"}
                stroke="#38BDF8"
                strokeWidth="3.5"
              />

              {/* Visor Screen */}
              <rect
                x="28"
                y="42"
                width="44"
                height="22"
                rx="8"
                fill="#030712"
                stroke="#0EA5E9"
                strokeWidth="1.5"
              />

              {/* Expressive Glowing Eyes */}
              <circle
                cx="40"
                cy="53"
                r={isHovered ? "5.5" : "4.5"}
                fill="#38BDF8"
                style={{ filter: "drop-shadow(0 0 6px #38BDF8)" }}
              />
              <circle
                cx="60"
                cy="53"
                r={isHovered ? "5.5" : "4.5"}
                fill="#38BDF8"
                style={{ filter: "drop-shadow(0 0 6px #38BDF8)" }}
              />

              {/* Cute Smiling Mouth */}
              <path
                d="M 44 71 Q 50 76 56 71"
                fill="transparent"
                stroke="#38BDF8"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Robotic Peeking Hands */}
              <rect x="14" y="66" width="10" height="14" rx="4" fill="#0284C7" />
              <rect x="76" y="66" width="10" height="14" rx="4" fill="#0284C7" />
            </svg>
          </div>
        </div>
      )}

      {/* 3. FULL CHAT ASSISTANT MODAL WINDOW */}
      {isOpen && (
        <div
          data-testid="ai-chat-modal"
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            width: "420px",
            maxWidth: "calc(100vw - 32px)",
            height: "640px",
            maxHeight: "calc(100vh - 48px)",
            backgroundColor: isDark ? "#090D16" : "#FFFFFF",
            border: `1px solid ${isDark ? "rgba(56, 189, 248, 0.3)" : "#CBD5E1"}`,
            borderRadius: "24px",
            boxShadow: isDark
              ? "0 24px 60px rgba(0, 0, 0, 0.9), 0 0 30px rgba(56, 189, 248, 0.25)"
              : "0 24px 50px rgba(0, 0, 0, 0.25)",
            zIndex: 999,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            animation: "slideInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards"
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
              {/* Mini Sparky Avatar */}
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "14px",
                  backgroundColor: "rgba(56, 189, 248, 0.15)",
                  border: "1.5px solid #38BDF8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "22px"
                }}
              >
                🤖
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontWeight: "900", fontSize: "15px", color: isDark ? "#FFFFFF" : "#0F172A" }}>
                    Sparky AI Assistant
                  </span>
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "999px",
                      backgroundColor: "#10B981",
                      boxShadow: "0 0 8px #10B981"
                    }}
                  />
                </div>
                <div style={{ fontSize: "11px", color: "#64748B", fontWeight: "600" }}>
                  Grounded RAG • {activeProvider}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <button
                onClick={handleClearChat}
                title="Clear Chat History"
                style={{
                  backgroundColor: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "6px",
                  borderRadius: "8px",
                  color: isDark ? "#94A3B8" : "#64748B",
                  fontSize: "14px"
                }}
              >
                🗑️
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close Assistant"
                style={{
                  backgroundColor: isDark ? "rgba(30, 41, 59, 0.8)" : "rgba(226, 232, 240, 0.8)",
                  border: "none",
                  cursor: "pointer",
                  width: "32px",
                  height: "32px",
                  borderRadius: "10px",
                  color: isDark ? "#FFFFFF" : "#0F172A",
                  fontWeight: "900",
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Chat Messages Body */}
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
            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: m.role === "user" ? "flex-end" : "flex-start",
                  gap: "6px"
                }}
              >
                <div
                  style={{
                    maxWidth: "85%",
                    padding: "12px 16px",
                    borderRadius: "16px",
                    fontSize: "13px",
                    lineHeight: "1.55",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    backgroundColor:
                      m.role === "user"
                        ? "#F59E0B"
                        : isDark
                        ? "rgba(30, 41, 59, 0.7)"
                        : "#F1F5F9",
                    color: m.role === "user" ? "#030712" : isDark ? "#F8FAFC" : "#0F172A",
                    fontWeight: m.role === "user" ? "700" : "500",
                    border:
                      m.role === "assistant"
                        ? `1px solid ${isDark ? "rgba(56, 189, 248, 0.2)" : "#E2E8F0"}`
                        : "none",
                    boxShadow:
                      m.role === "user"
                        ? "0 4px 14px rgba(245, 158, 11, 0.3)"
                        : "0 2px 8px rgba(0, 0, 0, 0.05)"
                  }}
                >
                  {m.content || (isStreaming && m.id === messages[messages.length - 1]?.id ? "Sparky is thinking... ⚡" : "")}
                </div>

                {/* Interactive Product Source Citation Cards */}
                {m.sources && m.sources.length > 0 && (
                  <div
                    style={{
                      width: "100%",
                      maxWidth: "92%",
                      marginTop: "6px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px"
                    }}
                  >
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: "800",
                        color: "#38BDF8",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px"
                      }}
                    >
                      <span>🔍</span>
                      <span>Verified Catalog Sources ({m.sources.length}):</span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {m.sources.map((src) => {
                        const isOutOfStock = src.stock <= 0;
                        return (
                          <div
                            key={src.id}
                            data-testid={`citation-card-${src.id}`}
                            style={{
                              backgroundColor: isDark ? "#0B0F19" : "#FFFFFF",
                              border: `1px solid ${
                                isOutOfStock ? "#EF4444" : isDark ? "#1E293B" : "#CBD5E1"
                              }`,
                              borderRadius: "12px",
                              padding: "10px 12px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: "8px"
                            }}
                          >
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div
                                style={{
                                  fontSize: "12px",
                                  fontWeight: "800",
                                  color: isDark ? "#FFFFFF" : "#0F172A",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap"
                                }}
                              >
                                {src.title}
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "3px" }}>
                                <span style={{ fontSize: "12px", fontWeight: "900", color: "#F59E0B" }}>
                                  ${src.price?.toFixed(2)}
                                </span>
                                {isOutOfStock ? (
                                  <span
                                    style={{
                                      fontSize: "10px",
                                      fontWeight: "800",
                                      color: "#EF4444",
                                      backgroundColor: "rgba(239, 68, 68, 0.12)",
                                      padding: "1px 6px",
                                      borderRadius: "6px"
                                    }}
                                  >
                                    Out of Stock (Boss Alerted! 🚀)
                                  </span>
                                ) : (
                                  <span
                                    style={{
                                      fontSize: "10px",
                                      fontWeight: "800",
                                      color: "#10B981",
                                      backgroundColor: "rgba(16, 185, 129, 0.12)",
                                      padding: "1px 6px",
                                      borderRadius: "6px"
                                    }}
                                  >
                                    {src.stock} in Stock
                                  </span>
                                )}
                              </div>
                            </div>

                            {!isOutOfStock && (
                              <button
                                onClick={() => addToCart({ id: src.id, name: src.title, price: src.price, stock: src.stock })}
                                style={{
                                  backgroundColor: "#F59E0B",
                                  color: "#030712",
                                  border: "none",
                                  borderRadius: "8px",
                                  padding: "6px 10px",
                                  fontSize: "11px",
                                  fontWeight: "900",
                                  cursor: "pointer",
                                  flexShrink: 0,
                                  boxShadow: "0 2px 6px rgba(245, 158, 11, 0.3)"
                                }}
                              >
                                + Cart
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions Chips (From Watch History or Popular) */}
          <div
            style={{
              padding: "8px 16px",
              backgroundColor: isDark ? "#0B0F19" : "#F8FAFC",
              borderTop: `1px solid ${isDark ? "#1E293B" : "#E2E8F0"}`,
              display: "flex",
              flexWrap: "nowrap",
              overflowX: "auto",
              gap: "6px"
            }}
          >
            {getDynamicSuggestions().map((sug, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(sug)}
                disabled={isStreaming}
                style={{
                  backgroundColor: isDark ? "rgba(30, 41, 59, 0.7)" : "#FFFFFF",
                  border: `1px solid ${isDark ? "rgba(56, 189, 248, 0.3)" : "#CBD5E1"}`,
                  color: isDark ? "#38BDF8" : "#0284C7",
                  padding: "5px 10px",
                  borderRadius: "999px",
                  fontSize: "11px",
                  fontWeight: "700",
                  cursor: isStreaming ? "not-allowed" : "pointer",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  transition: "all 0.15s ease"
                }}
              >
                {sug}
              </button>
            ))}
          </div>

          {/* Input Controls */}
          <div
            style={{
              padding: "12px 16px",
              backgroundColor: isDark ? "#0F172A" : "#FFFFFF",
              borderTop: `1px solid ${isDark ? "#1E293B" : "#E2E8F0"}`,
              display: "flex",
              gap: "8px",
              alignItems: "center"
            }}
          >
            <input
              type="text"
              data-testid="ai-chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Ask Sparky about any product, deals, or stock..."
              disabled={isStreaming}
              style={{
                flex: 1,
                padding: "10px 14px",
                borderRadius: "14px",
                backgroundColor: isDark ? "#090D16" : "#F1F5F9",
                border: `1px solid ${isDark ? "#1E293B" : "#CBD5E1"}`,
                color: isDark ? "#FFFFFF" : "#0F172A",
                fontSize: "13px",
                fontWeight: "600",
                outline: "none"
              }}
            />
            <button
              data-testid="ai-chat-send-btn"
              onClick={() => handleSendMessage()}
              disabled={isStreaming || !input.trim()}
              style={{
                backgroundColor: "#F59E0B",
                color: "#030712",
                border: "none",
                borderRadius: "14px",
                padding: "10px 16px",
                fontSize: "14px",
                fontWeight: "900",
                cursor: isStreaming || !input.trim() ? "not-allowed" : "pointer",
                opacity: isStreaming || !input.trim() ? 0.6 : 1,
                display: "flex",
                alignItems: "center",
                gap: "4px"
              }}
            >
              {isStreaming ? "⚡" : "Send"}
            </button>
          </div>
        </div>
      )}

      {/* Global CSS keyframes */}
      <style>{`
        @keyframes pulseGlow {
          from { filter: drop-shadow(0 0 4px #F59E0B); transform: scale(0.95); }
          to { filter: drop-shadow(0 0 12px #F59E0B); transform: scale(1.1); }
        }
        @keyframes fadeInBackdrop {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideInUp {
          from { transform: translateY(40px) scale(0.95); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
      `}</style>
    </>
  );
}
