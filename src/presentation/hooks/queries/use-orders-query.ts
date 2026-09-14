import { useQuery } from "@tanstack/react-query";
import { getMerchantOrders, getOrderDetails, getOrders, requestMerchantFeedback } from "@/services/orderServices";
import { isLoggedIn } from "@/services/configService";
import { orderKeys } from "@/lib/query-keys";
import { withTimeout } from "@infrastructure/api/with-timeout";

export function useOrdersQuery() {
  return useQuery({
    queryKey: orderKeys.list(),
    queryFn: () => withTimeout(getOrders()),
    enabled: typeof window !== "undefined" && isLoggedIn(),
    staleTime: 30_000,
  });
}

export function useMerchantOrdersQuery() {
  return useQuery({
    queryKey: orderKeys.merchant(),
    queryFn: () => withTimeout(getMerchantOrders()),
    enabled: typeof window !== "undefined" && isLoggedIn(),
    staleTime: 20_000,
  });
}

export function useOrderDetailsQuery(orderId: number | null) {
  return useQuery({
    queryKey: orderKeys.detail(orderId ?? 0),
    queryFn: () => withTimeout(getOrderDetails(orderId as number)),
    enabled: orderId !== null && !Number.isNaN(orderId),
    staleTime: 20_000,
  });
}

export function useOrderFeedbackQuery(orderId: number | null) {
  return useQuery({
    queryKey: orderKeys.feedback(orderId ?? 0),
    queryFn: () => withTimeout(requestMerchantFeedback(orderId as number)),
    enabled: orderId !== null && !Number.isNaN(orderId),
    staleTime: 60_000,
  });
}
