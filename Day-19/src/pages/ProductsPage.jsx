import React, { useState, useMemo, useRef, useEffect } from "react";
import { useInfiniteProducts, ALL_CATEGORIES } from "../hooks/useProducts";
import { useUIStore, useAuthStore } from "../store/useStore";
import ProductCard from "../components/ProductCard";
import Footer from "../components/Footer";

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
        backgroundColor: isDark ? "#000000" : "#F8FAFC",
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
                    placeholder="Search products by title, category, or brand..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    style={{
                      width: "100%",
                      backgroundColor: isDark ? "#0B0F19" : "#FFFFFF",
                      border: isDark ? "1px solid #1E293B" : "1px solid #CBD5E1",
                      borderRadius: "12px",
                      padding: "12px 16px 12px 40px",
                      color: isDark ? "#FFFFFF" : "#0F172A",
                      fontSize: "14px",
                      outline: "none",
                      boxSizing: "border-box",
                      boxShadow: isDark
                        ? "inset 0 1px 3px rgba(0,0,0,0.6)"
                        : "0 2px 6px rgba(0,0,0,0.03)",
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
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      style={{
                        position: "absolute",
                        right: "12px",
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

              {/* Day 18 Search Engine Telemetry Indicator */}
              {query.trim() && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: isDark ? "#94A3B8" : "#64748B" }}>
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
                    Searching for "<strong>{query}</strong>" • {allProducts.length} {allProducts.length === 1 ? "product" : "products"} found
                  </span>
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
                    backgroundColor:
                      category === cat
                        ? "#38BDF8"
                        : isDark
                        ? "#0B0F19"
                        : "#FFFFFF",
                    color:
                      category === cat
                        ? "#030712"
                        : isDark
                        ? "#94A3B8"
                        : "#475569",
                    border: `1px solid ${
                      category === cat
                        ? "#38BDF8"
                        : isDark
                        ? "#1E293B"
                        : "#CBD5E1"
                    }`,
                    padding: "8px 16px",
                    borderRadius: "10px",
                    fontWeight: "800",
                    fontSize: "12px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    flexShrink: 0,
                    boxShadow:
                      !isDark && category !== cat
                        ? "0 1px 3px rgba(0,0,0,0.05)"
                        : "none",
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
                backgroundColor: isDark ? "#0B0F19" : "#FFFFFF",
                border: isDark ? "1px solid #1E293B" : "1px solid #CBD5E1",
                borderRadius: "10px",
                padding: "8px 14px",
                color: isDark ? "#FFFFFF" : "#0F172A",
                fontSize: "13px",
                fontWeight: "700",
                cursor: "pointer",
                outline: "none",
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
        ) : sortedProducts.length === 0 ? (
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
            {sortedProducts.map((product) => (
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
