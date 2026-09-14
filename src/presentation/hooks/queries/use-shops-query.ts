import { useQuery } from "@tanstack/react-query";
import {
  getAllShops,
  getMyShop,
  getShopById,
  getShopProducts,
  getShopWithMerchantDetails,
} from "@/services/shopService";
import { shopKeys } from "@/lib/query-keys";
import { withTimeout } from "@infrastructure/api/with-timeout";
import { shouldRetryQuery } from "@infrastructure/api/query-retry";

export function useShopsQuery() {
  return useQuery({
    queryKey: shopKeys.list(),
    queryFn: () => withTimeout(getAllShops()),
    staleTime: 2 * 60_000,
  });
}

export function useMyShopQuery() {
  return useQuery({
    queryKey: shopKeys.mine(),
    queryFn: () => withTimeout(getMyShop()),
    staleTime: 60_000,
    retry: (failureCount, error) => {
      const message = error instanceof Error ? error.message.toLowerCase() : "";
      if (message.includes("boutique") && (message.includes("trouvé") || message.includes("aucune"))) {
        return false;
      }
      return shouldRetryQuery(failureCount, error);
    },
  });
}

export function useShopQuery(shopId: number | null) {
  return useQuery({
    queryKey: shopKeys.detail(shopId ?? 0),
    queryFn: () => withTimeout(getShopById(shopId as number)),
    enabled: shopId !== null && !Number.isNaN(shopId),
    staleTime: 60_000,
  });
}

export function useShopProductsQuery(shopId: number | null) {
  return useQuery({
    queryKey: shopKeys.products(shopId ?? 0),
    queryFn: () => withTimeout(getShopProducts(shopId as number)),
    enabled: shopId !== null && !Number.isNaN(shopId),
    staleTime: 30_000,
  });
}

export function useShopMerchantQuery(shopId: number | null, enabled = true) {
  return useQuery({
    queryKey: shopKeys.merchant(shopId ?? 0),
    queryFn: () => withTimeout(getShopWithMerchantDetails(shopId as number)),
    enabled: enabled && shopId !== null && !Number.isNaN(shopId),
    staleTime: 2 * 60_000,
  });
}
