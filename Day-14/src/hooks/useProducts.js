import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const MOCK_CATALOG = [
  // 1. Electronics & Gadgets
  { id: 1, name: "Mechanical Gaming Keyboard RGB", price: 89.99, stock: 12, category: "Peripherals", image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500", description: "Hot-swappable tactile switches with RGB per-key backlighting." },
  { id: 2, name: "Pro Precision Wireless Mouse", price: 49.99, stock: 8, category: "Peripherals", image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500", description: "Ultra-low latency 2.4GHz wireless sensor with 20,000 DPI." },
  { id: 3, name: "27-Inch 165Hz Curved Gaming Monitor", price: 299.99, stock: 4, category: "Electronics", image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500", description: "Immersive 1500R curvature QHD display with 1ms GTG response time." },
  { id: 4, name: "Active Noise-Cancelling Headphones", price: 179.99, stock: 6, category: "Electronics", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500", description: "Hybrid ANC technology with high-resolution drivers and 40h battery." },
  { id: 5, name: "Ultra-Thin OLED Smart Watch", price: 199.99, stock: 14, category: "Electronics", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500", description: "AMOLED always-on display, heart-rate, SPO2 and GPS workout tracking." },
  { id: 6, name: "Ultra-Fast NVMe M.2 2TB SSD", price: 139.99, stock: 5, category: "Electronics", image: "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=500", description: "PCIe Gen 4.0 read speeds up to 7450 MB/s for lightning load times." },

  // 2. Groceries & Fresh Mart
  { id: 7, name: "Organic Raw Wildflower Honey (500g)", price: 16.99, stock: 25, category: "Groceries", image: "https://images.unsplash.com/photo-1587049352847-4a222e784d38?w=500", description: "Pure unfiltered wildflower honey harvested directly from mountain apiaries." },
  { id: 8, name: "Premium California Whole Almonds (1kg)", price: 21.99, stock: 30, category: "Groceries", image: "https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?w=500", description: "Crunchy non-GMO oven-roasted whole almonds rich in protein and fiber." },
  { id: 9, name: "Cold-Pressed Extra Virgin Olive Oil (1L)", price: 24.50, stock: 18, category: "Groceries", image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500", description: "Single-estate cold pressed Greek extra virgin olive oil with low acidity." },
  { id: 10, name: "Artisan Arabica Whole Bean Coffee (500g)", price: 18.99, stock: 22, category: "Groceries", image: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=500", description: "Medium-dark roasted Ethiopian single origin beans with notes of cocoa." },
  { id: 11, name: "85% Dark Belgian Artisan Chocolate (200g)", price: 8.99, stock: 40, category: "Groceries", image: "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=500", description: "Velvety smooth rich dark chocolate crafted by master chocolatiers." },

  // 3. Fashion & Apparel
  { id: 12, name: "Waterproof All-Weather Tech Jacket", price: 119.99, stock: 9, category: "Fashion", image: "https://images.unsplash.com/photo-1548883354-7622d03aca27?w=500", description: "Breathable windproof shell with taped seams and waterproof zippers." },
  { id: 13, name: "Air-Cushioned Lightweight Running Shoes", price: 89.99, stock: 15, category: "Fashion", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500", description: "Responsive foam midsole providing all-day energy return and comfort." },
  { id: 14, name: "Polarized Classic Aviator Sunglasses", price: 44.99, stock: 20, category: "Fashion", image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500", description: "UV400 scratch-resistant polarized lenses with lightweight metal frame." },
  { id: 15, name: "Minimalist Urban Commuter Backpack 24L", price: 64.99, stock: 11, category: "Fashion", image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500", description: "Padded 16-inch laptop compartment with water-repellent ballistic nylon." },

  // 4. Home & Kitchen
  { id: 16, name: "Barista Touch Espresso Machine", price: 349.99, stock: 5, category: "Home & Kitchen", image: "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=500", description: "15-bar Italian pump with integrated conical burr grinder and steam wand." },
  { id: 17, name: "Digital Dual-Basket Air Fryer XL (8L)", price: 129.99, stock: 8, category: "Home & Kitchen", image: "https://images.unsplash.com/photo-1585515320310-259814833e62?w=500", description: "Rapid 360-degree heat circulation with 8 one-touch cooking presets." },
  { id: 18, name: "Nordic Minimalist Smart Desk Lamp", price: 39.99, stock: 16, category: "Home & Kitchen", image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500", description: "Dimmable touch sensor with 5 color temperatures and wireless phone charger." },
  { id: 19, name: "Pre-Seasoned Cast Iron Skillet Set (3-Piece)", price: 54.99, stock: 13, category: "Home & Kitchen", image: "https://images.unsplash.com/photo-1584990347449-a2e6189ef941?w=500", description: "Heavy-duty cast iron retaining heat evenly for perfect searing and baking." },

  // 5. Peripherals & Accessories
  { id: 20, name: "Studio USB Condenser Microphone", price: 69.99, stock: 15, category: "Peripherals", image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500", description: "Cardioid pickup pattern with built-in metal shock mount and pop filter." },
  { id: 21, name: "Braided 100W USB-C PD Cable (2m)", price: 14.99, stock: 35, category: "Accessories", image: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=500", description: "Double-braided nylon cord supporting 100W PD and 480 Mbps data transfer." },
  { id: 22, name: "Ergonomic Memory Foam Wrist Rest", price: 22.99, stock: 19, category: "Accessories", image: "https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=500", description: "Cooling-gel infused memory foam wrist support to prevent strain." },
  { id: 23, name: "Foldable Aluminum Laptop Cooling Stand", price: 29.99, stock: 24, category: "Accessories", image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500", description: "CNC-machined aluminum with 6 adjustable height angles and heat dissipation." },
];

export const productKeys = {
  all: ["products"],
  infinite: (filters) => ["products", "infinite", filters],
};

const fetchProductsPage = async ({ pageParam = 0, query = "", category = "All" }) => {
  try {
    const res = await fetch(`http://127.0.0.1:8000/products?page=${pageParam}&limit=4`);
    if (res.ok) {
      const data = await res.json();
      return { items: data.items || data, nextPage: data.hasMore ? pageParam + 1 : undefined };
    }
  } catch (err) {
    // Backend offline fallback
  }

  await new Promise((r) => setTimeout(r, 200));
  let customProducts = [];
  try {
    customProducts = JSON.parse(localStorage.getItem("rmart_custom_products") || "[]");
  } catch (e) {
    customProducts = [];
  }
  const fullCatalog = [...customProducts, ...MOCK_CATALOG];

  let filtered = fullCatalog.filter((p) => {
    const matchQ = (p.name || p.title || "").toLowerCase().includes(query.toLowerCase());
    const matchC = category === "All" || p.category === category;
    return matchQ && matchC;
  });

  const pageSize = 8;
  const start = pageParam * pageSize;
  const items = filtered.slice(start, start + pageSize);
  const nextPage = start + pageSize < filtered.length ? pageParam + 1 : undefined;

  return { items, nextPage };
};

export const useInfiniteProducts = ({ query = "", category = "All" } = {}) => {
  return useInfiniteQuery({
    queryKey: productKeys.infinite({ query, category }),
    queryFn: ({ pageParam = 0 }) => fetchProductsPage({ pageParam, query, category }),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
  });
};

export const useOptimisticStockUpdate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, delta }) => {
      await new Promise((r) => setTimeout(r, 400));
      return { productId, delta };
    },
    onMutate: async ({ productId, delta }) => {
      await queryClient.cancelQueries({ queryKey: productKeys.all });
      const previousData = queryClient.getQueriesData({ queryKey: productKeys.all });

      queryClient.setQueriesData({ queryKey: productKeys.all }, (old) => {
        if (!old || !old.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            items: page.items.map((item) =>
              item.id === productId
                ? { ...item, stock: Math.max(0, item.stock + delta) }
                : item
            ),
          })),
        };
      });

      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
};
