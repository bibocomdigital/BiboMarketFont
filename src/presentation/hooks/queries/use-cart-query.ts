import { useQuery } from "@tanstack/react-query";
import { getCart } from "@/services/cartService";
import { cartKeys } from "@/lib/query-keys";
import { withTimeout } from "@infrastructure/api/with-timeout";
import { useAuthSession } from "@/hooks/use-auth-session";

function isClientRole(role?: string): boolean {
  return String(role || "").toUpperCase() === "CLIENT";
}

export function useCartQuery() {
  const { isAuthenticated, isReady, user } = useAuthSession();
  const enabled = isReady && isAuthenticated && isClientRole(user?.role);

  return useQuery({
    queryKey: cartKeys.current(),
    queryFn: () => withTimeout(getCart()),
    enabled,
    staleTime: 15_000,
    refetchInterval: enabled ? 30_000 : false,
    retry: false,
  });
}

export function getCartItemsCount(items: { quantity: number }[] | undefined): number {
  if (!items) return 0;
  return items.reduce((total, item) => total + item.quantity, 0);
}
