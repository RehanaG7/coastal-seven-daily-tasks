import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const ALL_CATEGORIES = [
  "All",
  "Mobiles and Electronics",
  "Deals and Savings",
  "Fashion",
  "Home and Furniture",
  "Groceries and Pet Supplies",
  "Books and Education",
  "Games and Live Shopping",
  "Pharmacy and Household",
  "Travel and Auto",
  "Toys and Kids",
  "Sports and Fitness",
  "Beauty",
  "Gifting",
  "Business Purchases",
  "Everyday Needs",
  "Bills and Recharges",
];

export const MOCK_CATALOG = [
  // 1. Mobiles and Electronics
  {
    id: 1,
    name: "Apple iPhone 15 Pro Max 256GB Titanium",
    price: 1199.99,
    stock: 14,
    category: "Mobiles and Electronics",
    image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600",
    description: "Aerospace-grade titanium design with A17 Pro chip, 48MP main camera, and USB-C with USB 3 speeds.",
  },
  {
    id: 2,
    name: "Samsung Galaxy S24 Ultra 5G AI Phone",
    price: 1299.99,
    stock: 10,
    category: "Mobiles and Electronics",
    image: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600",
    description: "Built-in S Pen, Snapdragon 8 Gen 3 with Galaxy AI, 200MP camera, and titanium frame.",
  },
  {
    id: 3,
    name: "27-Inch 165Hz QHD Curved Gaming Monitor",
    price: 299.99,
    stock: 8,
    category: "Mobiles and Electronics",
    image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600",
    description: "Immersive 1500R curvature with 1ms GTG response time, HDR400, and AMD FreeSync Premium.",
  },
  {
    id: 4,
    name: "Sony WH-1000XM5 Wireless Noise-Cancelling Headphones",
    price: 349.99,
    stock: 12,
    category: "Mobiles and Electronics",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600",
    description: "Industry-leading active noise canceling with two processors, 8 microphones, and 30-hour battery life.",
  },
  {
    id: 5,
    name: "Ultra-Slim AMOLED GPS Smartwatch",
    price: 199.99,
    stock: 16,
    category: "Mobiles and Electronics",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600",
    description: "Brilliant always-on AMOLED display, heart rate, SpO2 monitoring, and 12-day battery life.",
  },
  {
    id: 6,
    name: "Custom Mechanical RGB Gaming Keyboard",
    price: 89.99,
    stock: 20,
    category: "Mobiles and Electronics",
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600",
    description: "Hot-swappable tactile switches with customizable per-key RGB backlighting and PBT double-shot keycaps.",
  },

  // 2. Deals and Savings
  {
    id: 7,
    name: "Mega Deal: Anker 65W GaN Fast Charger Combo",
    price: 39.99,
    stock: 45,
    category: "Deals and Savings",
    image: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600",
    description: "Ultra-compact 3-port high-speed GaN fast charger with 100W braided USB-C cable included.",
  },
  {
    id: 8,
    name: "Lightning Deal: IPX7 Waterproof Bluetooth Speaker 40W",
    price: 49.99,
    stock: 30,
    category: "Deals and Savings",
    image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600",
    description: "Rugged waterproof outdoor stereo speaker with 360-degree punchy bass and 24-hour battery playback.",
  },

  // 3. Fashion
  {
    id: 9,
    name: "All-Weather Waterproof Tech Windbreaker Jacket",
    price: 119.99,
    stock: 15,
    category: "Fashion",
    image: "https://images.unsplash.com/photo-1548883354-7622d03aca27?w=600",
    description: "Breathable windproof shell with seam-sealed waterproof zippers and ergonomic utility pockets.",
  },
  {
    id: 10,
    name: "Nike Air Breathable Athletic Running Sneakers",
    price: 99.99,
    stock: 18,
    category: "Fashion",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600",
    description: "Responsive Zoom Air foam midsole providing superior all-day energy return and plush comfort.",
  },
  {
    id: 11,
    name: "Ray-Ban Polarized Classic Metal Aviator Sunglasses",
    price: 149.99,
    stock: 22,
    category: "Fashion",
    image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600",
    description: "Timeless teardrop aviator frame with crystal polarized UV400 anti-glare scratch-resistant lenses.",
  },
  {
    id: 12,
    name: "Urban Commuter 16-Inch Water-Resistant Laptop Backpack",
    price: 69.99,
    stock: 25,
    category: "Fashion",
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600",
    description: "High-density ballistic nylon with dedicated padded tech sleeve, hidden anti-theft pocket, and USB port.",
  },

  // 4. Home and Furniture
  {
    id: 13,
    name: "Velvet Mid-Century Modern Accent Armchair",
    price: 249.99,
    stock: 6,
    category: "Home and Furniture",
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600",
    description: "High-density memory cushioning wrapped in stain-resistant velvet with matte brass steel legs.",
  },
  {
    id: 14,
    name: "Nordic Solid Oak Minimalist Coffee Table",
    price: 189.99,
    stock: 9,
    category: "Home and Furniture",
    image: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=600",
    description: "Sustainably sourced natural solid oak coffee table with protective organic matte varnish finish.",
  },
  {
    id: 15,
    name: "De'Longhi Barista Touch Espresso Machine & Steamer",
    price: 349.99,
    stock: 5,
    category: "Home and Furniture",
    image: "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=600",
    description: "15-bar Italian pressure pump with integrated stainless steel burr grinder and manual microfoam steam wand.",
  },
  {
    id: 16,
    name: "Digital Touchscreen Dual-Basket Air Fryer XL (8L)",
    price: 129.99,
    stock: 12,
    category: "Home and Furniture",
    image: "https://images.unsplash.com/photo-1585515320310-259814833e62?w=600",
    description: "Dual cooking zones with independent temperature controls and 360-degree rapid crisp heat circulation.",
  },

  // 5. Groceries and Pet Supplies
  {
    id: 17,
    name: "100% Pure Organic Raw Mountain Wildflower Honey (500g)",
    price: 16.99,
    stock: 35,
    category: "Groceries and Pet Supplies",
    image: "https://images.unsplash.com/photo-1587049352847-4a222e784d38?w=600",
    description: "Pure unfiltered raw wildflower honey harvested directly from pesticide-free mountain apiaries.",
  },
  {
    id: 18,
    name: "Extra Virgin Cold-Pressed Single-Estate Olive Oil (1L)",
    price: 24.50,
    stock: 28,
    category: "Groceries and Pet Supplies",
    image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600",
    description: "First cold-extracted Greek Koroneiki olives with ultra-low acidity and rich peppery antioxidant notes.",
  },
  {
    id: 19,
    name: "Grain-Free Wild Salmon & Sweet Potato Dry Dog Food (5kg)",
    price: 44.99,
    stock: 20,
    category: "Groceries and Pet Supplies",
    image: "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=600",
    description: "High-protein recipe formulated with real deboned salmon, omega fatty acids, and zero corn or wheat.",
  },
  {
    id: 20,
    name: "Multi-Tier Wooden Cat Tree & Scratching Post Lounge",
    price: 79.99,
    stock: 11,
    category: "Groceries and Pet Supplies",
    image: "https://images.unsplash.com/photo-1545249390-6bdfa286032f?w=600",
    description: "Durable natural sisal rope posts with plush velvet hammock perches for claw care and restful sleep.",
  },

  // 6. Books and Education
  {
    id: 21,
    name: "Bestseller Hardcover Box Set: Deep Work & Psychology",
    price: 49.99,
    stock: 24,
    category: "Books and Education",
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600",
    description: "Collection of top masterworks on cognitive focus, productivity, and modern mental resilience.",
  },
  {
    id: 22,
    name: "Kindle Paperwhite E-Reader 16GB Glare-Free Display",
    price: 139.99,
    stock: 15,
    category: "Books and Education",
    image: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=600",
    description: "300 ppi glare-free display that reads like real paper, with adjustable warm light and 10-week battery life.",
  },

  // 7. Games and Live Shopping
  {
    id: 23,
    name: "Sony PS5 DualSense Wireless Haptic Controller",
    price: 69.99,
    stock: 18,
    category: "Games and Live Shopping",
    image: "https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?w=600",
    description: "Immersive haptic feedback, dynamic adaptive triggers, and a built-in microphone in an iconic ergonomic design.",
  },
  {
    id: 24,
    name: "4K Ultra-HD Live Streaming Studio Creator Webcam",
    price: 119.99,
    stock: 14,
    category: "Games and Live Shopping",
    image: "https://images.unsplash.com/photo-1587826080692-f439cd0b70da?w=600",
    description: "Sony STARVIS sensor with custom fixed-focus prime lens and dual noise-canceling stereo mics.",
  },

  // 8. Pharmacy and Household
  {
    id: 25,
    name: "Medical Emergency Trauma & First-Aid Hospital Kit (150-Piece)",
    price: 34.99,
    stock: 40,
    category: "Pharmacy and Household",
    image: "https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=600",
    description: "FDA-compliant comprehensive medical emergency pack for immediate wound care, antiseptics, and burn relief.",
  },
  {
    id: 26,
    name: "Ultrasonic Whisper-Quiet Cool Mist Room Humidifier",
    price: 39.99,
    stock: 22,
    category: "Pharmacy and Household",
    image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600",
    description: "4L top-fill cool mist humidifier with essential oil aroma tray and automatic low-water shutoff.",
  },

  // 9. Travel and Auto
  {
    id: 27,
    name: "Samsonite Hard-Shell 360° Spinner Luggage Suitcase (28\")",
    price: 179.99,
    stock: 9,
    category: "Travel and Auto",
    image: "https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?w=600",
    description: "Lightweight polycarbonate impact-resistant shell with TSA-approved combination lock and silent wheels.",
  },
  {
    id: 28,
    name: "Digital High-Power Auto Car Tire Inflator & Pump",
    price: 54.99,
    stock: 19,
    category: "Travel and Auto",
    image: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=600",
    description: "150 PSI cordless electric air compressor with digital pressure gauge and emergency LED flashlight.",
  },

  // 10. Toys and Kids
  {
    id: 29,
    name: "STEM Programmable Robotics Educational Building Kit",
    price: 89.99,
    stock: 16,
    category: "Toys and Kids",
    image: "https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?w=600",
    description: "Over 400 snap-together blocks with Bluetooth app controller for teaching coding, logic, and engineering.",
  },
  {
    id: 30,
    name: "Organic Soft Cotton Huggable Giant Plush Teddy Bear",
    price: 29.99,
    stock: 28,
    category: "Toys and Kids",
    image: "https://images.unsplash.com/photo-1559454403-b8fb88521f11?w=600",
    description: "Ultra-plush hypoallergenic cotton construction with hand-stitched detailing, safe for all ages.",
  },

  // 11. Sports and Fitness
  {
    id: 31,
    name: "Bowflex SelectTech Adjustable Quick-Select Dumbbell Pair",
    price: 269.99,
    stock: 8,
    category: "Sports and Fitness",
    image: "https://images.unsplash.com/photo-1586401100295-7a8096fd231a?w=600",
    description: "Rapid dial adjustment from 5 to 52.5 lbs per dumbbell, replacing 15 sets of weights in one compact stand.",
  },
  {
    id: 32,
    name: "High-Density Non-Slip Natural Tree Rubber Yoga Mat",
    price: 49.99,
    stock: 25,
    category: "Sports and Fitness",
    image: "https://images.unsplash.com/photo-1592432678016-e910b452f9a2?w=600",
    description: "6mm thick dual-layer cushioning with laser-engraved alignment lines for joint protection and zero slip.",
  },

  // 12. Beauty
  {
    id: 33,
    name: "Organic Hyaluronic Acid & Rosehip Facial Hydration Serum",
    price: 24.99,
    stock: 35,
    category: "Beauty",
    image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600",
    description: "Ultra-pure botanical hydration with Vitamin C and peptides to restore skin radiance and elasticity.",
  },
  {
    id: 34,
    name: "Professional Salon Ionic Ceramic Hair Dryer & Diffuser",
    price: 89.99,
    stock: 14,
    category: "Beauty",
    image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600",
    description: "2200W salon-grade brushless motor with negative ion technology to eliminate frizz and dry hair in half the time.",
  },

  // 13. Gifting
  {
    id: 35,
    name: "Godiva Gourmet Artisan Belgian Chocolate Gift Box (36-Piece)",
    price: 44.99,
    stock: 30,
    category: "Gifting",
    image: "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=600",
    description: "Luxurious assortment of milk, dark, and white Belgian pralines in an embossed gold satin ribbon box.",
  },
  {
    id: 36,
    name: "Aromatherapy Organic Soy Scented Candle Trio Set",
    price: 32.99,
    stock: 26,
    category: "Gifting",
    image: "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=600",
    description: "Hand-poured 100% soy wax candles infused with lavender, sandalwood, and fresh cedar essential oils.",
  },

  // 14. Business Purchases
  {
    id: 37,
    name: "Ergonomic Executive High-Back Breathable Mesh Office Chair",
    price: 219.99,
    stock: 7,
    category: "Business Purchases",
    image: "https://images.unsplash.com/photo-1580481077195-c3c137456722?w=600",
    description: "Adjustable 3D lumbar support, multi-angle tilt lock, 4D armrests, and certified heavy-duty gas lift.",
  },
  {
    id: 38,
    name: "Logitech MX Master Pro Precision Wireless Laser Mouse",
    price: 99.99,
    stock: 19,
    category: "Business Purchases",
    image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600",
    description: "MagSpeed electromagnetic scrolling, 8K DPI sensor on glass, and cross-computer multi-device control.",
  },

  // 15. Everyday Needs
  {
    id: 39,
    name: "Hydro Flask 32oz Wide Mouth Insulated Stainless Steel Bottle",
    price: 39.99,
    stock: 32,
    category: "Everyday Needs",
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600",
    description: "Double-wall vacuum TempShield insulation keeps drinks ice cold for 24 hours or piping hot for 12 hours.",
  },
  {
    id: 40,
    name: "Eco-Friendly Organic Bamboo Kitchen Towel & Cloth Set (8-Pack)",
    price: 19.99,
    stock: 50,
    category: "Everyday Needs",
    image: "https://images.unsplash.com/photo-1584634731339-252c581abfc5?w=600",
    description: "Ultra-absorbent lint-free bamboo fiber cloths that naturally resist odors and withstand 200+ washes.",
  },

  // 16. Bills and Recharges
  {
    id: 41,
    name: "R-Mart Instant Mobile Recharge & 5G Fiber Bill Card ($50)",
    price: 50.00,
    stock: 100,
    category: "Bills and Recharges",
    image: "https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=600",
    description: "Instant digital redemption for all major prepaid & postpaid telecom networks with 5% wallet cashback.",
  },
  {
    id: 42,
    name: "Electricity, Gas & Water Utility Bill Pay Voucher ($100)",
    price: 100.00,
    stock: 80,
    category: "Bills and Recharges",
    image: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600",
    description: "Direct instant credit into municipal and private utility accounts with zero convenience fees.",
  },
];

export const productKeys = {
  all: ["products"],
  infinite: (filters) => ["products", "infinite", filters],
};

const fetchProductsPage = async ({ pageParam = 0, query = "", category = "All" }) => {
  // If a remote backend API is explicitly configured via VITE_API_URL:
  if (import.meta.env?.VITE_API_URL) {
    try {
      const base = import.meta.env.VITE_API_URL.replace(/\/$/, "");
      const res = await fetch(`${base}/products?page=${pageParam}&limit=8`);
      if (res.ok) {
        const data = await res.json();
        return { items: data.items || data, nextPage: data.hasMore ? pageParam + 1 : undefined };
      }
    } catch (err) {
      // Backend offline fallback to local catalog
    }
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
    const matchQ =
      (p.name || p.title || "").toLowerCase().includes(query.toLowerCase()) ||
      (p.description || "").toLowerCase().includes(query.toLowerCase());
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
    staleTime: 1000 * 60 * 5, // 5 min TanStack caching
  });
};

export const useAddProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newProduct) => {
      const existing = JSON.parse(localStorage.getItem("rmart_custom_products") || "[]");
      const updated = [newProduct, ...existing];
      localStorage.setItem("rmart_custom_products", JSON.stringify(updated));
      return newProduct;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
};

export const useOptimisticStockUpdate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, delta }) => {
      const custom = JSON.parse(localStorage.getItem("rmart_custom_products") || "[]");
      const updated = custom.map((p) => (p.id === id ? { ...p, stock: Math.max(0, p.stock + delta) } : p));
      localStorage.setItem("rmart_custom_products", JSON.stringify(updated));
      return { id, delta };
    },
    onMutate: async ({ id, delta }) => {
      await queryClient.cancelQueries({ queryKey: productKeys.all });
      const previousData = queryClient.getQueryData(productKeys.all);
      queryClient.setQueriesData({ queryKey: productKeys.all }, (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            items: page.items.map((item) =>
              item.id === id ? { ...item, stock: Math.max(0, item.stock + delta) } : item
            ),
          })),
        };
      });
      return { previousData };
    },
    onError: (err, newTodo, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(productKeys.all, context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
};

export const useUpdateStock = useOptimisticStockUpdate;

