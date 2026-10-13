import React, { useState, useMemo, useRef, useEffect } from "react";
import { useInfiniteProducts, ALL_CATEGORIES, MOCK_CATALOG } from "../hooks/useProducts";
import { useUIStore, useAuthStore } from "../store/useStore";
import ProductCard from "../components/ProductCard";
import Footer from "../components/Footer";

import { env } from "../config/env";

// Lightweight Levenshtein Distance for typo tolerance
export function levenshteinDistance(s1 = "", s2 = "") {
  const a = (s1 || "").toLowerCase();
  const b = (s2 || "").toLowerCase();
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[a.length][b.length];
}

export const COMMON_TYPOS = {
  "tv": "tv television monitor display screen",
  "televison": "tv television",
  "telivision": "tv television",
  "televisn": "tv television",
  "smarttv": "tv television",
  "headfones": "headphones audio",
  "hedphones": "headphones audio",
  "headphon": "headphones audio",
  "hedphone": "headphones audio",
  "earfones": "headphones earphones",
  "samung": "samsung galaxy",
  "samsng": "samsung galaxy",
  "samusng": "samsung galaxy",
  "ipone": "iphone apple",
  "iphne": "iphone apple",
  "iphon": "iphone apple",
  "aple": "apple iphone",
  "appel": "apple iphone",
  "labtop": "laptop macbook",
  "lapotp": "laptop macbook",
  "laptp": "laptop macbook",
  "macbok": "macbook apple",
  "computr": "computer pc laptop",
  "shose": "shoes sneaker running",
  "shooes": "shoes sneaker running",
  "sneekers": "sneakers shoes",
  "sneker": "sneakers shoes",
  "runing": "running shoes",
  "snoy": "sony audio headphones",
  "soony": "sony audio headphones",
  "keybord": "keyboard mechanical",
  "keybaord": "keyboard mechanical",
  "moniter": "monitor gaming display",
  "monitr": "monitor gaming display",
  "wirless": "wireless bluetooth",
  "wireles": "wireless bluetooth",
  "blutooth": "bluetooth wireless",
  "bluetoth": "bluetooth wireless",
  "camer": "camera sony photo",
  "camra": "camera sony photo",
  "coffe": "coffee nespresso",
  "espreso": "espresso coffee nespresso",
  "nespreso": "nespresso coffee",
  "logitec": "logitech mouse keyboard",
  "logtech": "logitech mouse keyboard",
};

export function resolveProductImage(item) {
  if (!item) return "";
  const nameStr = (item.name || item.title || "").toLowerCase().trim();
  const catalogMatch = MOCK_CATALOG.find((m) => {
    const mName = (m.name || m.title || "").toLowerCase().trim();
    return (nameStr && mName && nameStr === mName) || String(m.id) === String(item.id);
  });
  if (item.image_url && !item.image_url.includes("picsum.photos")) return item.image_url;
  if (item.image && !item.image.includes("picsum.photos")) return item.image;
  if (catalogMatch?.image_url && !catalogMatch.image_url.includes("picsum.photos")) return catalogMatch.image_url;
  if (catalogMatch?.image && !catalogMatch.image.includes("picsum.photos")) return catalogMatch.image;
  return item.image || item.image_url || `https://picsum.photos/seed/product-${item.id}/400/300`;
}

export default function ProductsPage() {
  const user = useAuthStore((s) => s.user);
  const theme = useUIStore((s) => s.theme);
  const isDark = theme === "dark";
  const openRightMenu = useUIStore((s) => s.openRightMenu);
  const openRightMenuView = useUIStore((s) => s.openRightMenuView);
  const isAdmin = user?.role === "admin";

  // Search & Category Filters
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [sortBy, setSortBy] = useState("default");
  const [searchMode, setSearchMode] = useState("auto"); // "auto" | "fts" | "fuzzy"

  // Voice Search (Speech Recognition Mic) State
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const recognitionRef = useRef(null);

  const handleToggleVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Chrome or Edge!");
      return;
    }

    if (isVoiceListening) {
      recognitionRef.current?.stop();
      setIsVoiceListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => setIsVoiceListening(true);
      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((r) => r[0].transcript)
          .join("");
        if (transcript) {
          setQuery(transcript);
        }
      };
      recognition.onerror = () => setIsVoiceListening(false);
      recognition.onend = () => setIsVoiceListening(false);

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn("Voice search error:", err);
      setIsVoiceListening(false);
    }
  };

  // Day 21 - Dense Vector Semantic Search State (Native to search input)
  const [semanticProducts, setSemanticProducts] = useState([]);
  const [isSemanticLoading, setIsSemanticLoading] = useState(false);
  const [semanticMode, setSemanticMode] = useState(null);
  const [semanticCached, setSemanticCached] = useState(false);
  const [aiAlertMessage, setAiAlertMessage] = useState("");

  // TanStack Infinite Query v5 with PostgreSQL Full-Text & Fuzzy Trigram Search
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useInfiniteProducts({ query, category, searchMode });

  // Debounced Semantic Search Hook: natively executes vector search when query is entered
  useEffect(() => {
    if (!query.trim()) {
      setSemanticProducts([]);
      setSemanticMode(null);
      setSemanticCached(false);
      setAiAlertMessage("");
      return;
    }

    const timer = setTimeout(async () => {
      setIsSemanticLoading(true);
      setAiAlertMessage("");

      const apiBase = env.API_BASE_URL || (env.API_URL || "http://localhost:8000").replace(/\/api\/v1\/?$/, "");
      const token = localStorage.getItem("token") || localStorage.getItem("access_token");
      const headers = token ? { "Authorization": `Bearer ${token}` } : {};

      try {
        let res;
        try {
          res = await fetch(`/api/v1/ai/semantic-search?q=${encodeURIComponent(query.trim())}&limit=12`, { headers });
          if (!res.ok && res.status !== 422 && res.status !== 429) {
            throw new Error(`Proxy error ${res.status}`);
          }
        } catch (proxyErr) {
          try {
            res = await fetch(`http://127.0.0.1:8000/api/v1/ai/semantic-search?q=${encodeURIComponent(query.trim())}&limit=12`, { headers });
          } catch (netErr2) {
            res = await fetch(`${apiBase}/api/v1/ai/semantic-search?q=${encodeURIComponent(query.trim())}&limit=12`, { headers });
          }
        }

        if (res.status === 429) {
          // Search bar is free, public, and unthrottled - gracefully fall back without showing 429 alert banner
          return;
        }

        if (res.status === 422) {
          return;
        }

        if (res.ok) {
          const json = await res.json();
          let deletedIds = new Set();
          try {
            deletedIds = new Set(JSON.parse(localStorage.getItem("rmart_deleted_product_ids") || "[]").map(String));
          } catch (e) {}
          const filteredSemantic = (json.items || []).filter((it) => it && !deletedIds.has(String(it.id)));
          setSemanticProducts(filteredSemantic);
          setSemanticMode(json.search_mode);
          setSemanticCached(Boolean(json.cached));
        }
      } catch (err) {
        console.error("[Semantic Search Error]", err);
      } finally {
        setIsSemanticLoading(false);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [query]);


  // Flattened products with useMemo and instant blacklist exclusion
  const allProducts = useMemo(() => {
    if (!data?.pages) return [];
    let deletedIds = new Set();
    try {
      deletedIds = new Set(JSON.parse(localStorage.getItem("rmart_deleted_product_ids") || "[]").map(String));
    } catch (e) {}
    const items = data.pages.flatMap((page) => page.items || []);
    return items.filter((p) => p && !deletedIds.has(String(p.id)));
  }, [data]);

  // Real-time synchronization when admin deletes products
  useEffect(() => {
    const handleProductDeleted = () => {
      try {
        sessionStorage.removeItem("rmart_cached_products");
      } catch (e) {}
      refetch();
    };
    window.addEventListener("rmart:product_deleted", handleProductDeleted);
    return () => window.removeEventListener("rmart:product_deleted", handleProductDeleted);
  }, [refetch]);

  // Session storage caching for instantaneous (0ms) ProductDetailPage transitions
  useEffect(() => {
    if (allProducts.length > 0) {
      try {
        sessionStorage.setItem("rmart_cached_products", JSON.stringify(allProducts));
      } catch (e) {}
    }
  }, [allProducts]);

  // Client-side sorting with useMemo
  const sortedProducts = useMemo(() => {
    let prods = [...allProducts];
    if (sortBy === "price-low") prods.sort((a, b) => a.price - b.price);
    if (sortBy === "price-high") prods.sort((a, b) => b.price - a.price);
    if (sortBy === "name") prods.sort((a, b) => a.name.localeCompare(b.name));
    return prods;
  }, [allProducts, sortBy]);

  // Integrated Amazon-Grade Fast Semantic, Typo-Tolerant & Fuzzy Intent Search (Zero Ghost / Deleted Products)
  const displayedProducts = useMemo(() => {
    let deletedIds = new Set();
    try {
      deletedIds = new Set(JSON.parse(localStorage.getItem("rmart_deleted_product_ids") || "[]").map(String));
    } catch (e) {}

    const baseList = sortedProducts.filter((p) => p && !deletedIds.has(String(p.id)));

    if (!query.trim()) {
      return baseList;
    }

    const q = query.trim().toLowerCase();
    const qWords = q.split(/\s+/).filter((w) => w.length > 0);
    const validSemantic = (semanticProducts || []).filter((it) => it && !deletedIds.has(String(it.id)));

    const scoredList = baseList.map((p) => {
      let score = 0;
      const title = (p.name || p.title || "").toLowerCase();
      const desc = (p.description || "").toLowerCase();
      const cat = (p.category || "").toLowerCase();
      const fullText = `${title} ${desc} ${cat}`;
      const productWords = fullText.split(/[^a-zA-Z0-9]+/).filter((w) => w.length > 1);

      // 1. Direct Substring Match
      if (title.includes(q)) score += 120;
      if (cat.includes(q)) score += 60;
      if (desc.includes(q)) score += 35;

      // 2. Word Token & Fuzzy Levenshtein Match
      qWords.forEach((qw) => {
        // Direct word hit
        if (title.includes(qw)) score += 30;
        if (desc.includes(qw)) score += 15;
        if (cat.includes(qw)) score += 20;

        // Check dictionary typo expansion
        const typoExpansion = COMMON_TYPOS[qw];
        if (typoExpansion) {
          typoExpansion.split(" ").forEach((expWord) => {
            if (fullText.includes(expWord)) score += 40;
          });
        }

        // Fuzzy Levenshtein comparison against words in title and category
        if (qw.length >= 3) {
          for (const pw of productWords) {
            if (pw.length >= 3) {
              const maxDist = qw.length <= 4 ? 1 : 2;
              const dist = levenshteinDistance(qw, pw);
              if (dist <= maxDist) {
                // Closer distance gets higher score
                score += dist === 0 ? 30 : 25 - dist * 5;
                break;
              }
            }
          }
        }
      });

      // 3. Semantic Intent Synonyms (Amazon Search behavior)
      // TV & Display intent
      if ((q.includes("tv") || q.includes("television") || q.includes("screen") || q.includes("display") || q.includes("oled") || q.includes("qled") || q.includes("bravia")) && (fullText.includes("tv") || fullText.includes("television") || fullText.includes("monitor") || fullText.includes("display"))) {
        score += 55;
      }
      // Audio & Headphones
      if ((q.includes("noise") || q.includes("cancelling") || q.includes("anc") || q.includes("audio") || q.includes("sound") || q.includes("headphone") || q.includes("earphone") || q.includes("buds")) && (fullText.includes("headphone") || fullText.includes("sony") || fullText.includes("bose") || fullText.includes("audio") || fullText.includes("earphone"))) {
        score += 50;
      }
      // Programming & Laptops
      if ((q.includes("programming") || q.includes("coding") || q.includes("developer") || q.includes("software") || q.includes("laptop") || q.includes("macbook") || q.includes("pc")) && (fullText.includes("macbook") || fullText.includes("laptop") || fullText.includes("keyboard") || fullText.includes("monitor") || fullText.includes("computer"))) {
        score += 50;
      }
      // Shoes & Footwear
      if ((q.includes("shoe") || q.includes("sneaker") || q.includes("running") || q.includes("footwear") || q.includes("durable") || q.includes("athletic")) && (fullText.includes("shoe") || fullText.includes("sneaker") || fullText.includes("running") || fullText.includes("fitness") || fullText.includes("apparel"))) {
        score += 50;
      }
      // Phones & 5G
      if ((q.includes("phone") || q.includes("smartphone") || q.includes("5g") || q.includes("mobile") || q.includes("galaxy") || q.includes("iphone")) && (fullText.includes("iphone") || fullText.includes("galaxy") || fullText.includes("phone") || fullText.includes("s24") || fullText.includes("mobile"))) {
        score += 50;
      }

      // ChromaDB Vector Search Semantic Hit
      const pName = (p.name || p.title || "").toLowerCase().trim();
      const semanticMatch = validSemantic.find((s) => {
        if (!s) return false;
        if (String(s.id) === String(p.id)) return true;
        const sName = (s.name || s.title || "").toLowerCase().trim();
        return Boolean(sName && pName && sName === pName);
      });
      if (semanticMatch) {
        score += 350 + Math.round((semanticMatch.relevance_score || 0.85) * 150);
      }

      const enhancedProduct = semanticMatch?.relevance_score
        ? {
            ...p,
            relevance_score: semanticMatch.relevance_score,
            image: resolveProductImage(p),
          }
        : {
            ...p,
            image: resolveProductImage(p),
          };

      return { product: enhancedProduct, score };
    });

    // Also include any semantic products returned by ChromaDB that are genuinely new (not already in baseList by ID or Name)
    const baseIds = new Set(baseList.map((p) => String(p.id)));
    const baseNames = new Set(baseList.map((p) => (p.name || p.title || "").toLowerCase().trim()).filter(Boolean));
    const additionalSemantic = validSemantic
      .filter((s) => {
        if (!s) return false;
        const sId = String(s.id);
        const sName = (s.name || s.title || "").toLowerCase().trim();
        return !baseIds.has(sId) && (!sName || !baseNames.has(sName));
      })
      .map((s) => {
        const bestImage = resolveProductImage(s);
        return {
          product: {
            ...s,
            name: s.name || s.title,
            image: bestImage,
            image_url: bestImage,
            relevance_score: s.relevance_score || 0.85,
          },
          score: 350 + Math.round((s.relevance_score || 0.85) * 150),
        };
      });

    const combinedList = [...scoredList, ...additionalSemantic];

    const matches = combinedList
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.product);

    if (matches.length > 0) {
      return matches;
    }

    if (validSemantic.length > 0) {
      return validSemantic.map((s) => ({
        ...s,
        name: s.name || s.title,
        image: s.image || `https://picsum.photos/seed/product-${s.id}/400/300`,
      }));
    }

    return [];
  }, [query, semanticProducts, sortedProducts]);

  // Detected typo auto-correction suggestion
  const typoCorrection = useMemo(() => {
    if (!query.trim()) return null;
    const words = query.trim().toLowerCase().split(/\s+/);
    let hasCorrection = false;
    const correctedWords = words.map((w) => {
      if (COMMON_TYPOS[w]) {
        hasCorrection = true;
        return COMMON_TYPOS[w].split(" ")[0];
      }
      return w;
    });
    if (hasCorrection) {
      return correctedWords.join(" ");
    }
    return null;
  }, [query]);

  // Infinite Scroll Intersection Observer
  const loadMoreRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const categories = ALL_CATEGORIES;

  return (
    <div
      style={{
        backgroundColor: isDark ? "#060913" : "#F8FAFC",
        backgroundImage: isDark
          ? "radial-gradient(ellipse at 20% 0%, rgba(56, 189, 248, 0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 0%, rgba(147, 51, 234, 0.08) 0%, transparent 50%), radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.04) 0%, transparent 60%)"
          : "radial-gradient(ellipse at 20% 0%, rgba(56, 189, 248, 0.05) 0%, transparent 50%), radial-gradient(ellipse at 80% 100%, rgba(245, 158, 11, 0.05) 0%, transparent 50%)",
        minHeight: "100vh",
        padding: "24px 20px 0 20px",
        fontFamily: "'Inter', system-ui, sans-serif",
        color: isDark ? "#FFFFFF" : "#0F172A",
        transition: "background-color 0.25s ease, color 0.25s ease",
      }}
    >
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>


        {/* Catalog Section Header & Search/Filter Controls */}
        <div style={{ marginBottom: "28px" }}>
          {/* Search, Category Filters & Sort Controls */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            {/* Search Input & Engine Mode Selector */}
            <div style={{ flex: "1 1 360px", display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <div style={{ position: "relative", flex: 1 }}>
                  <input
                    type="text"
                    placeholder={isVoiceListening ? "🎙️ Listening... Speak now to search..." : "Search products by title, category, or brand..."}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    style={{
                      width: "100%",
                      backgroundColor: isDark ? "rgba(11, 15, 25, 0.85)" : "#FFFFFF",
                      border: isVoiceListening
                        ? "2px solid #EF4444"
                        : (isDark ? "1.5px solid rgba(56, 189, 248, 0.35)" : "1.5px solid #CBD5E1"),
                      borderRadius: "14px",
                      padding: "13px 76px 13px 44px",
                      color: isDark ? "#FFFFFF" : "#0F172A",
                      fontSize: "14px",
                      fontWeight: "500",
                      outline: "none",
                      boxSizing: "border-box",
                      boxShadow: isVoiceListening
                        ? "0 0 16px rgba(239, 68, 68, 0.45)"
                        : (isDark ? "0 4px 20px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.04)" : "0 4px 16px rgba(0,0,0,0.04)"),
                      transition: "all 0.2s ease",
                    }}
                  />
                  <span
                    style={{
                      position: "absolute",
                      left: "14px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      fontSize: "16px",
                      opacity: 0.6,
                    }}
                  >
                    🔍
                  </span>

                  {/* Mic Button: Voice Search with Speech Recognition */}
                  <button
                    type="button"
                    data-testid="voice-search-mic-btn"
                    title={isVoiceListening ? "Listening... Click to stop" : "Speak to search (Voice Input)"}
                    onClick={handleToggleVoiceSearch}
                    style={{
                      position: "absolute",
                      right: query ? "38px" : "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      backgroundColor: isVoiceListening ? "rgba(239, 68, 68, 0.2)" : (isDark ? "rgba(56, 189, 248, 0.12)" : "rgba(2, 132, 199, 0.08)"),
                      border: isVoiceListening ? "1.5px solid #EF4444" : (isDark ? "1px solid rgba(56, 189, 248, 0.3)" : "1px solid rgba(2, 132, 199, 0.2)"),
                      borderRadius: "50%",
                      width: "32px",
                      height: "32px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: isVoiceListening ? "#EF4444" : (isDark ? "#38BDF8" : "#0284C7"),
                      cursor: "pointer",
                      padding: 0,
                      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                      boxShadow: isVoiceListening ? "0 0 10px rgba(239, 68, 68, 0.5)" : "none",
                    }}
                  >
                    {isVoiceListening ? (
                      <span style={{ display: "flex", alignItems: "center", gap: "2px", height: "14px" }}>
                        <span style={{ width: "3px", height: "8px", backgroundColor: "#EF4444", borderRadius: "2px" }} />
                        <span style={{ width: "3px", height: "14px", backgroundColor: "#EF4444", borderRadius: "2px" }} />
                        <span style={{ width: "3px", height: "6px", backgroundColor: "#EF4444", borderRadius: "2px" }} />
                      </span>
                    ) : (
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                        <line x1="12" x2="12" y1="19" y2="22" />
                        <line x1="8" x2="16" y1="22" y2="22" />
                      </svg>
                    )}
                  </button>

                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      title="Clear search"
                      style={{
                        position: "absolute",
                        right: "10px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        color: isDark ? "#94A3B8" : "#64748B",
                        cursor: "pointer",
                        fontSize: "14px",
                        padding: "4px",
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
                {/* Advanced Search is applied automatically under the hood (FTS + Typo Fuzzy) */}
                <select
                  value={searchMode}
                  onChange={(e) => setSearchMode(e.target.value)}
                  title="Select PostgreSQL Search Algorithm"
                  style={{ display: "none" }}
                  aria-hidden="true"
                >
                  <option value="auto">⚡ Smart Auto (FTS + Typo)</option>
                  <option value="fts">📖 PostgreSQL FTS (GIN)</option>
                  <option value="fuzzy">🎯 Typo-Tolerant Trigram (pg_trgm)</option>
                </select>
              </div>

              {/* Voice Listening Active Message */}
              {isVoiceListening && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#EF4444", fontWeight: "700" }}>
                  <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#EF4444" }}></span>
                  <span>Listening... Speak product name now (e.g. "Smart TV", "Sony Headphones")</span>
                </div>
              )}

              {/* Did you mean typo auto-correction pill */}
              {typoCorrection && typoCorrection !== query.trim().toLowerCase() && (
                <div
                  data-testid="typo-correction-hint"
                  style={{
                    fontSize: "12px",
                    color: isDark ? "#94A3B8" : "#64748B",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    marginTop: "2px",
                  }}
                >
                  <span>💡 Did you mean:</span>
                  <button
                    type="button"
                    onClick={() => setQuery(typoCorrection)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#60A5FA",
                      fontWeight: "800",
                      cursor: "pointer",
                      padding: 0,
                      textDecoration: "underline",
                      fontSize: "12px",
                    }}
                  >
                    "{typoCorrection}"
                  </button>
                </div>
              )}

              {/* Search Engine & Vector Telemetry Indicator */}
              {query.trim() && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: isDark ? "#94A3B8" : "#64748B", flexWrap: "wrap" }}>
                  <span
                    data-testid="semantic-search-telemetry-badge"
                    style={{
                      backgroundColor: "rgba(147, 51, 234, 0.2)",
                      color: "#C084FC",
                      padding: "2px 8px",
                      borderRadius: "6px",
                      fontWeight: "800",
                      fontSize: "11px",
                      border: "1px solid rgba(147, 51, 234, 0.4)",
                    }}
                  >
                    {isSemanticLoading ? "⏳ ChromaDB Vector Embedding..." : `🧠 Semantic Vector Search (${semanticMode || "all-MiniLM-L6-v2"})`}
                  </span>
                  {semanticCached && (
                    <span
                      style={{
                        backgroundColor: "rgba(16, 185, 129, 0.15)",
                        color: "#34D399",
                        padding: "2px 6px",
                        borderRadius: "6px",
                        fontWeight: "700",
                        fontSize: "10px",
                      }}
                    >
                      ⚡ Redis Cache Hit (&lt;3ms)
                    </span>
                  )}
                  <span
                    data-testid="search-telemetry-badge"
                    style={{
                      backgroundColor: "rgba(56, 189, 248, 0.15)",
                      color: "#38BDF8",
                      padding: "2px 8px",
                      borderRadius: "6px",
                      fontWeight: "800",
                      fontSize: "11px",
                    }}
                  >
                    {searchMode === "fts"
                      ? "PostgreSQL tsvector + GIN Ranking"
                      : searchMode === "fuzzy"
                      ? "pg_trgm Trigram Similarity Match"
                      : "PostgreSQL Auto FTS & pg_trgm Typo Fallback"}
                  </span>
                  <span>
                    Searching for "<strong>{query}</strong>" • {displayedProducts.length} {displayedProducts.length === 1 ? "product" : "products"} found
                  </span>
                </div>
              )}



              {/* Safety Moderation 422 Alert Notification Only */}
              {aiAlertMessage && !aiAlertMessage.includes("429") && (
                <div
                  data-testid="ai-alert-banner"
                  style={{
                    marginTop: "8px",
                    padding: "10px 14px",
                    borderRadius: "12px",
                    backgroundColor: "rgba(234, 179, 8, 0.2)",
                    border: "1px solid #EAB308",
                    color: "#FDE047",
                    fontSize: "12px",
                    fontWeight: "800",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "10px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "16px" }}>🛡️</span>
                    <span>{aiAlertMessage}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAiAlertMessage("")}
                    style={{
                      background: "none",
                      border: "none",
                      color: "inherit",
                      fontSize: "14px",
                      fontWeight: "900",
                      cursor: "pointer",
                    }}
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>


            {/* Category Filter Pills (Horizontal Scrollable Bar) */}
            <div
              style={{
                width: "100%",
                display: "flex",
                gap: "8px",
                overflowX: "auto",
                scrollbarWidth: "none",
                padding: "6px 2px 10px 2px",
                whiteSpace: "nowrap",
                WebkitOverflowScrolling: "touch",
              }}
            >
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  style={{
                    background:
                      category === cat
                        ? "linear-gradient(135deg, #0284C7 0%, #38BDF8 100%)"
                        : isDark
                        ? "rgba(15, 23, 42, 0.75)"
                        : "#FFFFFF",
                    color:
                      category === cat
                        ? "#FFFFFF"
                        : isDark
                        ? "#94A3B8"
                        : "#475569",
                    border: `1.5px solid ${
                      category === cat
                        ? "#38BDF8"
                        : isDark
                        ? "rgba(255, 255, 255, 0.08)"
                        : "#E2E8F0"
                    }`,
                    padding: "8px 18px",
                    borderRadius: "12px",
                    fontWeight: "800",
                    fontSize: "12px",
                    cursor: "pointer",
                    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                    flexShrink: 0,
                    boxShadow:
                      category === cat
                        ? "0 4px 14px rgba(56, 189, 248, 0.35)"
                        : isDark
                        ? "0 2px 6px rgba(0,0,0,0.3)"
                        : "0 1px 3px rgba(0,0,0,0.05)",
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Sorting Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                backgroundColor: isDark ? "rgba(15, 23, 42, 0.85)" : "#FFFFFF",
                border: isDark ? "1.5px solid rgba(56, 189, 248, 0.25)" : "1.5px solid #CBD5E1",
                borderRadius: "12px",
                padding: "9px 16px",
                color: isDark ? "#FFFFFF" : "#0F172A",
                fontSize: "13px",
                fontWeight: "700",
                cursor: "pointer",
                outline: "none",
                boxShadow: isDark ? "0 2px 8px rgba(0,0,0,0.3)" : "0 2px 6px rgba(0,0,0,0.04)",
              }}
            >
              <option value="default">Sort: Default</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name">Name: Alphabetical</option>
            </select>
          </div>
        </div>

        {/* 3D Product Grid */}
        {isLoading ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "24px",
            }}
          >
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                style={{
                  height: "380px",
                  backgroundColor: isDark ? "#0B0F19" : "#F1F5F9",
                  border: isDark ? "1px solid #1E293B" : "1px solid #E2E8F0",
                  borderRadius: "18px",
                  animation: "pulse 1.5s infinite",
                }}
              />
            ))}
          </div>
        ) : isError ? (
          <div
            style={{
              padding: "48px 24px",
              textAlign: "center",
              backgroundColor: isDark ? "#0B0F19" : "#FFFFFF",
              border: "1px solid #DC2626",
              borderRadius: "18px",
            }}
          >
            <h3
              style={{
                color: "#DC2626",
                fontSize: "18px",
                fontWeight: "900",
                marginBottom: "8px",
              }}
            >
              Unable to load products
            </h3>
            <button
              onClick={() => refetch()}
              style={{
                backgroundColor: "#DC2626",
                color: "#FFF",
                border: "none",
                padding: "10px 20px",
                borderRadius: "8px",
                fontWeight: "800",
                cursor: "pointer",
              }}
            >
              Retry
            </button>
          </div>
        ) : displayedProducts.length === 0 ? (
          <div
            style={{
              padding: "60px 24px",
              textAlign: "center",
              backgroundColor: isDark ? "#0B0F19" : "#FFFFFF",
              border: isDark ? "1px solid #1E293B" : "1px solid #E2E8F0",
              borderRadius: "18px",
              boxShadow: isDark ? "none" : "0 4px 16px rgba(0,0,0,0.05)",
            }}
          >
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>🔍</div>
            <h3
              style={{
                color: isDark ? "#FFFFFF" : "#0F172A",
                fontSize: "18px",
                fontWeight: "900",
                margin: "0 0 6px 0",
              }}
            >
              No products found
            </h3>
            <p
              style={{
                color: isDark ? "#94A3B8" : "#64748B",
                fontSize: "14px",
                margin: 0,
              }}
            >
              Try searching with different terms or selecting another category.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "24px",
            }}
          >
            {displayedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* Infinite Scroll Load More Trigger / Sentinel */}
        <div
          ref={loadMoreRef}
          style={{
            padding: "48px 0 36px 0",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
          }}
        >
          {isFetchingNextPage ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: isDark ? "#38BDF8" : "#0284C7",
                fontWeight: "800",
                fontSize: "13px",
              }}
            >
              <span className="animate-spin">⚡</span> Loading next batch with
              TanStack infinite stream...
            </div>
          ) : hasNextPage ? (
            <button
              onClick={() => fetchNextPage()}
              style={{
                backgroundColor: isDark ? "#0B0F19" : "#FFFFFF",
                color: isDark ? "#38BDF8" : "#0284C7",
                border: isDark
                  ? "1px solid rgba(56, 189, 248, 0.4)"
                  : "1px solid #38BDF8",
                padding: "12px 28px",
                borderRadius: "12px",
                fontWeight: "900",
                fontSize: "13px",
                cursor: "pointer",
                boxShadow: isDark
                  ? "0 4px 15px rgba(0,0,0,0.4)"
                  : "0 4px 12px rgba(56,189,248,0.15)",
              }}
            >
              Load More Products ↓
            </button>
          ) : (
            <div
              style={{
                color: isDark ? "#64748B" : "#94A3B8",
                fontSize: "12px",
                fontWeight: "700",
              }}
            >
              ✔ All authentic catalog items loaded into memory
            </div>
          )}
        </div>
      </div>

      {/* Modern Superstore Footer with Copyrights */}
      <Footer />
    </div>
  );
}
