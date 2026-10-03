import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const MOCK_CATALOG = [
  { id: 1, name: "Mechanical Gaming Keyboard RGB", price: 89.99, stock: 12, category: "Peripherals", image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500", description: "Hot-swappable tactile switches with RGB lighting." },
  { id: 2, name: "Pro Precision Wireless Mouse", price: 49.99, stock: 8, category: "Peripherals", image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500", description: "Ultra-low latency 2.4GHz wireless gaming mouse with 20K DPI." },
  { id: 3, name: "27-Inch 165Hz Curved Monitor", price: 299.99, stock: 2, category: "Electronics", image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500", description: "Immersive 1500R curvature QHD display with 1ms response time." },
  { id: 4, name: "Active Noise-Cancelling Headphones", price: 179.99, stock: 0, category: "Electronics", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500", description: "Hybrid ANC technology with 40-hour battery life." },
  { id: 5, name: "Studio USB Condenser Microphone", price: 69.99, stock: 15, category: "Accessories", image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500", description: "Cardioid pickup pattern with built-in pop filter." },
  { id: 6, name: "Ultra-Fast NVMe M.2 2TB SSD", price: 139.99, stock: 5, category: "Electronics", image: "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=500", description: "PCIe Gen 4.0 read speeds up to 7450 MB/s." },
  { id: 7, name: "Braided 100W USB-C PD Cable", price: 14.99, stock: 35, category: "Accessories", image: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=500", description: "Reinforced nylon cord supporting 100W power delivery." },
  { id: 8, name: "Ergonomic Memory Foam Wrist Rest", price: 22.99, stock: 19, category: "Accessories", image: "https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=500", description: "Cooling-gel infused wrist support to prevent fatigue." }
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
