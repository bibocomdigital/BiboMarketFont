"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getShopCategories,
  readCachedShopCategories,
} from "@/services/shopService";
import { shopKeys } from "@/lib/query-keys";
import { withTimeout } from "@infrastructure/api/with-timeout";

export function useShopCategoriesQuery(enabled = true) {
  const cached = readCachedShopCategories();

  return useQuery({
    queryKey: shopKeys.categories(),
    queryFn: () => withTimeout(getShopCategories()),
    enabled,
    staleTime: 30 * 60_000,
    gcTime: 24 * 60 * 60_000,
    placeholderData: cached.length ? cached : undefined,
  });
}
