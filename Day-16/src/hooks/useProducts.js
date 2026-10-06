import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const API_BASE_URL = "http://127.0.0.1:8000";

export const productKeys = {
  all: ["products"],
  lists: () => [...productKeys.all, "list"],
  list: (filters) => [...productKeys.lists(), filters],
  details: () => [...productKeys.all, "detail"],
  detail: (id) => [...productKeys.details(), id],
};

export const ALL_CATEGORIES = [
  "All",
  "Mobiles and Electronics",
  "Deals and Savings",
  "Fashion",
  "Home and Furniture"
];

export const MOCK_CATALOG = [
  {
    id: 1,
    title: "Quantum Sound Pro Headphones",
    name: "Quantum Sound Pro Headphones",
    price: 299.99,
    stock: 12,
    category: "Mobiles and Electronics",
    description: "Spatial audio with ANC.",
    image: "https://picsum.photos/seed/product-1/400/300"
  },
  {
    id: 2,
    title: "Apex Mechanical Keyboard",
    name: "Apex Mechanical Keyboard",
    price: 149.50,
    stock: 25,
    category: "Mobiles and Electronics",
    description: "Hot-swappable RGB keyboard.",
    image: "https://picsum.photos/seed/product-2/400/300"
  },
  {
    id: 3,
    title: "Ultra Gaming Monitor 4K",
    name: "Ultra Gaming Monitor 4K",
    price: 649.00,
    stock: 8,
    category: "Mobiles and Electronics",
    description: "144Hz IPS display.",
    image: "https://picsum.photos/seed/product-3/400/300"
  }
];

export async function fetchProductsFromBackend({ query = "", category = "All" } = {}) {
  try {
    const res = await fetch(`${API_BASE_URL}/products/`);
    if (!res.ok) throw new Error("Backend response error");
    const data = await res.json();
    let products = data.map((item) => ({
      id: item.id,
      name: item.title,
      title: item.title,
      price: Number(item.price),
      stock: item.stock,
      category: item.category || "Mobiles and Electronics",
      description: item.description || "",
      image: item.image || `https://picsum.photos/seed/product-${item.id}/400/300`
    }));

    if (category && category !== "All") {
      products = products.filter((p) => p.category?.toLowerCase() === category.toLowerCase());
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      products = products.filter(
        (p) => p.title?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)
      );
    }
    return { items: products, nextPage: null };
  } catch (e) {
    let prods = [...MOCK_CATALOG];
    if (category && category !== "All") {
      prods = prods.filter((p) => p.category.toLowerCase() === category.toLowerCase());
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      prods = prods.filter(
        (p) => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
      );
    }
    return { items: prods, nextPage: null };
  }
}

export function useInfiniteProducts({ query = "", category = "All" } = {}) {
  const queryResult = useQuery({
    queryKey: ["products", query, category],
    queryFn: () => fetchProductsFromBackend({ query, category }),
    staleTime: 1000 * 30,
  });

  return {
    ...queryResult,
    data: queryResult.data ? { pages: [queryResult.data] } : undefined,
    fetchNextPage: async () => {},
    hasNextPage: false,
    isFetchingNextPage: false,
  };
}

export function useOptimisticStockUpdate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, newStock }) => ({ productId, newStock }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newProduct) => {
      const payload = {
        title: newProduct.title || newProduct.name,
        description: newProduct.description || "Created from UI",
        price: parseFloat(newProduct.price),
        stock: parseInt(newProduct.stock, 10) || 1,
        owner_id: 1
      };
      const res = await fetch(`${API_BASE_URL}/products/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || "Failed to create product");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
