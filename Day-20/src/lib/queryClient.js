import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 3, // 3 minutes stale time
      gcTime: 1000 * 60 * 15,    // 15 minutes garbage collection
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
