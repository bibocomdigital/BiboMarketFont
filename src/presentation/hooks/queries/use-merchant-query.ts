import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getMerchantProductStats,
  getMerchantRevenueChart,
  getMerchantStats,
} from "@/services/merchantService";
import { getMerchantProducts, updateProductStatus } from "@/services/productService";
import { isLoggedIn } from "@/services/configService";
import { merchantKeys, orderKeys, productKeys, shopKeys } from "@/lib/query-keys";
import { withTimeout } from "@infrastructure/api/with-timeout";

const ready = (enabled: boolean) => enabled && typeof window !== "undefined" && isLoggedIn();

export function useMerchantStatsQuery(enabled = true) {
  return useQuery({
    queryKey: merchantKeys.stats(),
    queryFn: () => withTimeout(getMerchantStats()),
    enabled: ready(enabled),
    staleTime: 20_000,
    retry: false,
  });
}

export function useMerchantRevenueChartQuery(days: number, enabled = true) {
  return useQuery({
    queryKey: merchantKeys.revenueChart(days),
    queryFn: () => withTimeout(getMerchantRevenueChart(days)),
    enabled: ready(enabled),
    staleTime: 20_000,
    retry: false,
  });
}

export function useMerchantProductStatsQuery(enabled = true) {
  return useQuery({
    queryKey: merchantKeys.productStats(),
    queryFn: () => withTimeout(getMerchantProductStats()),
    enabled: ready(enabled),
    staleTime: 20_000,
    retry: false,
  });
}

export function useMerchantCatalogQuery(
  merchantId: number | null,
  page: number,
  limit: number,
  enabled = true
) {
  return useQuery({
    queryKey: merchantKeys.products(merchantId ?? 0, page, limit),
    queryFn: () => withTimeout(getMerchantProducts(merchantId as number, page, limit)),
    enabled: ready(enabled) && merchantId !== null && merchantId > 0,
    staleTime: 15_000,
  });
}

export function useUpdateProductStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, status }: { productId: number; status: "DRAFT" | "PUBLISHED" }) =>
      updateProductStatus(productId, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: merchantKeys.all });
      void queryClient.invalidateQueries({ queryKey: shopKeys.mine() });
      void queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: orderKeys.merchant() });
    },
  });
}
