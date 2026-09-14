import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createProduct } from "@/services/productService";
import { createShop, updateShop } from "@/services/shopService";
import { toggleFollow } from "@/services/subscriptionService";
import { addComment, replyToComment } from "@/services/commentService";
import { toggleProductDislike, toggleProductLike } from "@/services/likeService";
import { sendMessage } from "@/services/messageService";
import { productKeys, shopKeys, userKeys, messageKeys } from "@/lib/query-keys";

export function useCreateProductMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => createProduct(formData),
    retry: false,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: shopKeys.mine() });
    },
  });
}

export function useCreateShopMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => createShop(formData),
    retry: false,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shopKeys.mine() });
      queryClient.invalidateQueries({ queryKey: shopKeys.lists() });
    },
  });
}

export function useUpdateShopMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ shopId, formData }: { shopId: number; formData: FormData }) =>
      updateShop(shopId, formData),
    retry: false,
    onSuccess: (_data, { shopId }) => {
      queryClient.invalidateQueries({ queryKey: shopKeys.mine() });
      queryClient.invalidateQueries({ queryKey: shopKeys.detail(shopId) });
      queryClient.invalidateQueries({ queryKey: shopKeys.lists() });
    },
  });
}

export function useToggleFollowMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) => toggleFollow(userId),
    onSuccess: (_data, userId) => {
      queryClient.invalidateQueries({ queryKey: userKeys.followStatus(userId) });
      queryClient.invalidateQueries({ queryKey: userKeys.followers(userId) });
    },
  });
}

export function useToggleLikeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: number) => toggleProductLike(productId),
    onSuccess: (_data, productId) => {
      queryClient.invalidateQueries({ queryKey: productKeys.likes(productId) });
    },
  });
}

export function useToggleDislikeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: number) => toggleProductDislike(productId),
    onSuccess: (_data, productId) => {
      queryClient.invalidateQueries({ queryKey: productKeys.likes(productId) });
    },
  });
}

export function useAddCommentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, content }: { productId: number; content: string }) =>
      addComment(productId, { comment: content }),
    onSuccess: (_data, { productId }) => {
      queryClient.invalidateQueries({ queryKey: productKeys.detail(productId) });
    },
  });
}

export function useReplyCommentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ commentId, content }: { commentId: number; content: string; productId: number }) =>
      replyToComment(commentId, { reply: content }),
    onSuccess: (_data, { productId }) => {
      queryClient.invalidateQueries({ queryKey: productKeys.detail(productId) });
    },
  });
}

export function useSendMessageMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      receiverId,
      content,
      media,
    }: {
      receiverId: number;
      content: string;
      media?: File;
    }) => sendMessage(receiverId, content, media),
    retry: false,
    onSuccess: (_data, { receiverId }) => {
      queryClient.invalidateQueries({ queryKey: messageKeys.conversation(receiverId) });
      queryClient.invalidateQueries({ queryKey: messageKeys.inbox() });
    },
  });
}
