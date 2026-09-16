"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getShopCategories } from "@/services/shopService";
import { shopKeys } from "@/lib/query-keys";
import { withTimeout } from "@infrastructure/api/with-timeout";

export function AppBootstrap() {
  const queryClient = useQueryClient();

  useEffect(() => {
    void queryClient.prefetchQuery({
      queryKey: shopKeys.categories(),
      queryFn: () => withTimeout(getShopCategories()),
      staleTime: 30 * 60_000,
    });
  }, [queryClient]);

  return null;
}
