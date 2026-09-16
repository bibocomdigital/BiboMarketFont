import { useQuery } from "@tanstack/react-query";
import { getAllProducts, getProductCategories } from "@/services/productService";
import { getProductComments } from "@/services/commentService";
import { productKeys } from "@/lib/query-keys";
import { withTimeout } from "@infrastructure/api/with-timeout";

export function useProductsQuery(
  page: number,
  limit: number,
  filters?: {
    categoryId?: number;
    searchTerm?: string;
    status?: string;
    enabled?: boolean;
  }
) {
  return useQuery({
    queryKey: productKeys.list({
      page,
      limit,
      category: filters?.categoryId,
      search: filters?.searchTerm,
      status: filters?.status,
    }),
    queryFn: () =>
      withTimeout(
        getAllProducts(page, limit, filters?.categoryId, filters?.searchTerm ?? "", {
          status: filters?.status,
        })
      ),
    enabled: filters?.enabled ?? true,
    staleTime: 30_000,
  });
}

export function useProductCategoriesQuery(enabled = true) {
  return useQuery({
    queryKey: productKeys.categories(),
    queryFn: () => withTimeout(getProductCategories()),
    enabled,
    staleTime: 10 * 60_000,
  });
}

export function useProductCommentsQuery(productId: number | null, page = 1, enabled = true) {
  return useQuery({
    queryKey: productKeys.comments(productId ?? 0, page),
    queryFn: () => withTimeout(getProductComments(productId as number, page)),
    enabled: enabled && productId !== null,
    staleTime: 20_000,
  });
}
