import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addToCart, createOrderFromCart, removeFromCart, shareCartViaWhatsApp, updateCartItem } from "@/services/cartService";
import { cartKeys } from "@/lib/query-keys";
import { orderKeys } from "@/lib/query-keys";

export function useAddToCartMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, quantity = 1 }: { productId: number; quantity?: number }) =>
      addToCart(productId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
}

export function useUpdateCartItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: number; quantity: number }) =>
      updateCartItem(itemId, quantity),
    onSuccess: (data) => {
      if (data?.cart) {
        queryClient.setQueryData(cartKeys.current(), data.cart);
        return;
      }
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
}

export function useRemoveCartItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId: number) => removeFromCart(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
}

export function useCreateOrderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (message?: string) => createOrderFromCart(message ?? ""),
    retry: false,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
  });
}

export function useShareCartMutation() {
  return useMutation({
    mutationFn: (message?: string) => shareCartViaWhatsApp(message ?? ""),
    retry: false,
  });
}
