// ============================================================================
// DAY 15: TYPESCRIPT FUNDAMENTALS & TYPED API RESPONSES
// ============================================================================

// 1. Core Domain Entities
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

// 2. React Component Props, State, and Ref Types
export interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product, quantity?: number) => void;
}

export interface TiltState {
  rotX: number;
  rotY: number;
  glareX: number;
  glareY: number;
  isHovered: boolean;
}

// 3. Zustand Global Cart Store Types
export interface CartItem {
  id: number;
  name?: string;
  title?: string;
  price: number;
  quantity: number;
  image?: string;
  category?: string;
}

export interface CartStoreState {
  cart: CartItem[];
  wishlist: number[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (id: number) => void;
  updateQuantity: (id: number, delta: number) => void;
  clearCart: () => void;
  toggleWishlist: (product: Product) => void;
  isWishlisted: (id: number) => boolean;
  getCartTotal: () => number;
  getCartCount: () => number;
}

// 4. Generic Typed API Request & Response Contracts (FastAPI & MSW)
export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
  role?: "customer" | "admin";
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface StockUpdateRequest {
  productId: number;
  delta: number;
}
