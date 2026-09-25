import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteAdminProduct,
  deleteAdminShop,
  createAdminUser,
  deleteAdminUser,
  getAdminDashboard,
  getAdminFeedbacks,
  getAdminOrder,
  getAdminOrders,
  getAdminProduct,
  getAdminProducts,
  getAdminShop,
  getAdminShops,
  getAdminUser,
  getAdminUsers,
  patchAdminOrderStatus,
  patchAdminProduct,
  patchAdminShop,
  patchAdminUser,
  type AdminFeedbacksQuery,
  type AdminOrdersQuery,
  type AdminProductsQuery,
  type AdminShopsQuery,
  type AdminUsersQuery,
} from "@/services/adminService";
import {
  createProductCategory,
  createShopCategory,
  deleteProductCategory,
  deleteShopCategory,
} from "@/services/shopService";
import { adminKeys, shopKeys } from "@/lib/query-keys";
import { withTimeout } from "@infrastructure/api/with-timeout";
import { isLoggedIn } from "@/services/configService";

const ready = (enabled: boolean) => enabled && typeof window !== "undefined" && isLoggedIn();

export function useAdminDashboardQuery(months: number, enabled = true) {
  return useQuery({
    queryKey: adminKeys.dashboard(months),
    queryFn: () => withTimeout(getAdminDashboard(months, 10)),
    enabled: ready(enabled),
    staleTime: 20_000,
  });
}

export function useAdminUsersListQuery(filters: AdminUsersQuery, enabled = true) {
  return useQuery({
    queryKey: adminKeys.users(filters),
    queryFn: () => withTimeout(getAdminUsers(filters)),
    enabled: ready(enabled),
    staleTime: 15_000,
  });
}

export function useAdminUserQuery(id: number | null, enabled = true) {
  return useQuery({
    queryKey: adminKeys.user(id ?? 0),
    queryFn: () => withTimeout(getAdminUser(id as number)),
    enabled: ready(enabled) && id !== null,
    staleTime: 15_000,
  });
}

export function useAdminShopsListQuery(filters: AdminShopsQuery, enabled = true) {
  return useQuery({
    queryKey: adminKeys.shops(filters),
    queryFn: () => withTimeout(getAdminShops(filters)),
    enabled: ready(enabled),
    staleTime: 15_000,
  });
}

export function useAdminShopQuery(id: number | null, enabled = true) {
  return useQuery({
    queryKey: adminKeys.shop(id ?? 0),
    queryFn: () => withTimeout(getAdminShop(id as number)),
    enabled: ready(enabled) && id !== null,
  });
}

export function useAdminProductsListQuery(filters: AdminProductsQuery, enabled = true) {
  return useQuery({
    queryKey: adminKeys.products(filters),
    queryFn: () => withTimeout(getAdminProducts(filters)),
    enabled: ready(enabled),
    staleTime: 15_000,
  });
}

export function useAdminProductQuery(id: number | null, enabled = true) {
  return useQuery({
    queryKey: adminKeys.product(id ?? 0),
    queryFn: () => withTimeout(getAdminProduct(id as number)),
    enabled: ready(enabled) && id !== null,
  });
}

export function useAdminOrdersListQuery(filters: AdminOrdersQuery, enabled = true) {
  return useQuery({
    queryKey: adminKeys.orders(filters),
    queryFn: () => withTimeout(getAdminOrders(filters)),
    enabled: ready(enabled),
    staleTime: 15_000,
  });
}

export function useAdminOrderQuery(id: number | null, enabled = true) {
  return useQuery({
    queryKey: adminKeys.order(id ?? 0),
    queryFn: () => withTimeout(getAdminOrder(id as number)),
    enabled: ready(enabled) && id !== null,
  });
}

export function useAdminFeedbacksQuery(filters: AdminFeedbacksQuery, enabled = true) {
  return useQuery({
    queryKey: adminKeys.feedbacks(filters),
    queryFn: () => withTimeout(getAdminFeedbacks(filters)),
    enabled: ready(enabled),
    staleTime: 20_000,
  });
}

function useInvalidateAdmin() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: adminKeys.all });
    void queryClient.invalidateQueries({ queryKey: shopKeys.categories() });
  };
}

export function useCreateAdminUserMutation() {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: createAdminUser,
    onSuccess: invalidate,
  });
}

export function usePatchAdminUserMutation() {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: { role?: string; isVerified?: boolean } }) =>
      patchAdminUser(id, body),
    onSuccess: invalidate,
  });
}

export function useDeleteAdminUserMutation() {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: (id: number) => deleteAdminUser(id),
    onSuccess: invalidate,
  });
}

export function usePatchAdminShopMutation() {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: number;
      body: { status?: boolean; verifiedBadge?: boolean };
    }) => patchAdminShop(id, body),
    onSuccess: invalidate,
  });
}

export function useDeleteAdminShopMutation() {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: (id: number) => deleteAdminShop(id),
    onSuccess: invalidate,
  });
}

export function usePatchAdminProductMutation() {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: { status?: string; stock?: number } }) =>
      patchAdminProduct(id, body),
    onSuccess: invalidate,
  });
}

export function useDeleteAdminProductMutation() {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: (id: number) => deleteAdminProduct(id),
    onSuccess: invalidate,
  });
}

export function usePatchAdminOrderStatusMutation() {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      patchAdminOrderStatus(id, status),
    onSuccess: invalidate,
  });
}

export function useCreateShopCategoryMutation() {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: (payload: { name: string; description?: string }) => createShopCategory(payload),
    onSuccess: invalidate,
  });
}

export function useDeleteShopCategoryMutation() {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: (id: number) => deleteShopCategory(id),
    onSuccess: invalidate,
  });
}

export function useCreateProductCategoryMutation() {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: (payload: { name: string; categorieShopId: number }) =>
      createProductCategory(payload),
    onSuccess: invalidate,
  });
}

export function useDeleteProductCategoryMutation() {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: (id: number) => deleteProductCategory(id),
    onSuccess: invalidate,
  });
}
