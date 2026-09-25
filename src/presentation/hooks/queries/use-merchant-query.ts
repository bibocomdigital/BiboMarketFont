import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getMerchantProductStats,
  getMerchantRevenueChart,
  getMerchantStats,
} from "@/services/merchantService";
import {
  adjustProductStock,
  getMerchantProducts,
  listCounterSales,
  listStockMovements,
  updateProductStatus,
  type StockAdjustKind,
} from "@/services/productService";
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

export function useCounterDeskQuery(enabled = true) {
  return useQuery({
    queryKey: [...merchantKeys.all, "comptoir"] as const,
    queryFn: () => withTimeout(listCounterSales()),
    enabled: ready(enabled),
    staleTime: 10_000,
  });
}

export function useStockMovementsQuery(enabled = true) {
  return useQuery({
    queryKey: [...merchantKeys.all, "mouvements"] as const,
    queryFn: () => withTimeout(listStockMovements()),
    enabled: ready(enabled),
    staleTime: 10_000,
  });
}

export function useAdjustStockMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      kind,
      quantity,
      note,
    }: {
      productId: number;
      kind: StockAdjustKind;
      quantity: number;
      note?: string;
    }) => adjustProductStock(productId, { kind, quantity, note }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: merchantKeys.all });
      void queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: shopKeys.mine() });
    },
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
