import { useQuery } from "@tanstack/react-query";
import { getCart, isCartAccessible } from "@/services/cartService";
import { cartKeys } from "@/lib/query-keys";
import { withTimeout } from "@infrastructure/api/with-timeout";

export function useCartQuery() {
  return useQuery({
    queryKey: cartKeys.current(),
    queryFn: () => withTimeout(getCart()),
    enabled: typeof window !== "undefined" && isCartAccessible(),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

export function getCartItemsCount(items: { quantity: number }[] | undefined): number {
  if (!items) return 0;
  return items.reduce((total, item) => total + item.quantity, 0);
}
