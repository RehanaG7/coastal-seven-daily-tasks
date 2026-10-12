export interface Product {
  id: number;
  name?: string;
  title?: string;
  price: number;
  stock: number;
  category?: string;
  image?: string;
  image_url?: string;
  description?: string;
}

export interface User {
  id: string | number;
  email: string;
  role: "admin" | "customer" | "user";
  name?: string;
}

export interface CartStoreState {
  cart: Array<{ product: Product; quantity: number }>;
  wishlist: number[];
  addToCart: (product: Product, quantity?: number) => void;
  toggleWishlist: (product: Product) => void;
  isWishlisted: (id: number) => boolean;
}
