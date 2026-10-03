import React, { useState, useMemo, useRef, useEffect } from "react";
import { useInfiniteProducts } from "../hooks/useProducts";
import { useUIStore, useAuthStore } from "../store/useStore";
import ProductCard from "../components/ProductCard";

export default function ProductsPage() {
  const user = useAuthStore((s) => s.user);
  const openRightMenu = useUIStore((s) => s.openRightMenu);
  const isAdmin = user?.role === "admin";

  // Search & Category Filters
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [sortBy, setSortBy] = useState("default");

  // TanStack Infinite Query v5
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useInfiniteProducts({ query, category });

  // Flattened products with useMemo
  const allProducts = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.items || []);
  }, [data]);

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

  const categories = ["All", "Electronics", "Peripherals", "Accessories"];

  return (
    <div
      style={{
        backgroundColor: "#000000",
        minHeight: "100vh",
        padding: "24px 20px 80px 20px",
        fontFamily: "'Inter', system-ui, sans-serif",
        color: "#FFFFFF",
      }}
    >
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        {/* Welcome Admin Banner (shown only when Admin logs in) */}
        {isAdmin ? (
          <div
            style={{
              backgroundColor: "rgba(245, 158, 11, 0.1)",
              border: "1px solid rgba(245, 158, 11, 0.35)",
              borderRadius: "16px",
              padding: "16px 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "24px",
              boxShadow: "0 4px 20px rgba(245, 158, 11, 0.15)",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "28px" }}>🛡️</span>
              <div>
                <div style={{ fontSize: "16px", fontWeight: "900", color: "#F59E0B" }}>
                  Welcome Admin!
                </div>
                <div style={{ fontSize: "12px", color: "#94A3B8" }}>
                  Catalog View Active (No Cart Mode) • Adjust stock per product or open Admin Toggle to add products & offers.
                </div>
              </div>
            </div>

            <button
              onClick={openRightMenu}
              style={{
                backgroundColor: "#F59E0B",
                color: "#030712",
                border: "none",
                borderRadius: "10px",
                padding: "8px 16px",
                fontSize: "12px",
                fontWeight: "900",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>☰ Open Admin Studio</span>
              <span>→</span>
            </button>
          </div>
        ) : (
          /* Subtle Customer Assurance Bar */
          <div
            style={{
              backgroundColor: "#0B0F19",
              border: "1px solid #1E293B",
              borderRadius: "14px",
              padding: "12px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "20px",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: "800", color: "#FFFFFF" }}>
              <span style={{ color: "#F59E0B" }}>⚡</span>
              <span>R-MART OFFICIAL 3D STORE</span>
              <span style={{ fontSize: "11px", color: "#10B981", backgroundColor: "rgba(16, 185, 129, 0.15)", padding: "2px 8px", borderRadius: "999px" }}>
                100% Trusted
              </span>
              <span style={{ fontSize: "11px", color: "#38BDF8", backgroundColor: "rgba(56, 189, 248, 0.15)", padding: "2px 8px", borderRadius: "999px" }}>
                Delivered in 24-48 hrs
              </span>
            </div>

            <button
              onClick={openRightMenu}
              style={{
                backgroundColor: "#1E293B",
                color: "#38BDF8",
                border: "1px solid rgba(56, 189, 248, 0.3)",
                padding: "6px 14px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: "800",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>☰ User Hub</span>
              <span>→</span>
            </button>
          </div>
        )}

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
            {/* Search Input */}
            <div style={{ flex: "1 1 280px" }}>
              <input
                type="text"
                placeholder="Search products by name or category..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{
                  width: "100%",
                  backgroundColor: "#0B0F19",
                  border: "1px solid #1E293B",
                  borderRadius: "12px",
                  padding: "12px 16px",
                  color: "#FFFFFF",
                  fontSize: "14px",
                  outline: "none",
                  boxSizing: "border-box",
                  boxShadow: "inset 0 1px 3px rgba(0,0,0,0.6)",
                }}
              />
            </div>

            {/* Category Filter Pills */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  style={{
                    backgroundColor: category === cat ? "#38BDF8" : "#0B0F19",
                    color: category === cat ? "#030712" : "#94A3B8",
                    border: `1px solid ${category === cat ? "#38BDF8" : "#1E293B"}`,
                    padding: "8px 16px",
                    borderRadius: "10px",
                    fontWeight: "800",
                    fontSize: "12px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
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
                backgroundColor: "#0B0F19",
                border: "1px solid #1E293B",
                borderRadius: "10px",
                padding: "8px 14px",
                color: "#FFFFFF",
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
                  backgroundColor: "#0B0F19",
                  border: "1px solid #1E293B",
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
              backgroundColor: "#0B0F19",
              border: "1px solid #DC2626",
              borderRadius: "18px",
            }}
          >
            <h3 style={{ color: "#DC2626", fontSize: "18px", fontWeight: "900", marginBottom: "8px" }}>
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
              backgroundColor: "#0B0F19",
              border: "1px solid #1E293B",
              borderRadius: "18px",
            }}
          >
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>🔍</div>
            <h3 style={{ color: "#FFFFFF", fontSize: "18px", fontWeight: "900", margin: "0 0 6px 0" }}>
              No products found
            </h3>
            <p style={{ color: "#94A3B8", fontSize: "14px", margin: 0 }}>
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
            padding: "48px 0 24px 0",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
          }}
        >
          {isFetchingNextPage ? (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#38BDF8", fontWeight: "800", fontSize: "13px" }}>
              <span className="animate-spin">⚡</span> Loading next batch with TanStack infinite stream...
            </div>
          ) : hasNextPage ? (
            <button
              onClick={() => fetchNextPage()}
              style={{
                backgroundColor: "#0B0F19",
                color: "#38BDF8",
                border: "1px solid rgba(56, 189, 248, 0.4)",
                padding: "12px 28px",
                borderRadius: "12px",
                fontWeight: "900",
                fontSize: "13px",
                cursor: "pointer",
                boxShadow: "0 4px 15px rgba(0,0,0,0.4)",
              }}
            >
              Load More Products ↓
            </button>
          ) : (
            <div style={{ color: "#64748B", fontSize: "12px", fontWeight: "700" }}>
              ✔ All authentic catalog items loaded into memory
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
