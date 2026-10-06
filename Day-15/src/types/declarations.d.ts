import { CartStoreState, User } from "./index";

declare module "../store/useStore" {
  export const useCartStore: <T>(selector: (state: CartStoreState) => T) => T;
  export const useAuthStore: <T>(selector: (state: { user: User | null; token?: string }) => T) => T;
  export const useUIStore: <T>(selector: (state: { theme: "light" | "dark"; isIntroActive?: boolean }) => T) => T;
}

declare module "../hooks/useProducts" {
  export interface StockMutationPayload {
    id: number;
    delta: number;
  }

  export function useOptimisticStockUpdate(): {
    mutate: (payload: any) => void;
    isPending?: boolean;
  };
}
