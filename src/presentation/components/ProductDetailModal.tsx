"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Heart,
  Loader,
  MessageCircle,
  Play,
  ThumbsDown,
  X,
} from "lucide-react";
import { getUserErrorMessage } from "@domain/errors/app-error";
import { ProductPrice } from "@/components/product/ProductPrice";
import { resolveProductVideo } from "@/lib/product-video";
import { formatImageUrl, type Product } from "@/services/productService";
import {
  getProductLikesCount,
  getUserProductReaction,
  nonNegativeCount,
  toggleProductDislike,
  toggleProductLike,
} from "@/services/likeService";
import {
  addComment,
  deleteComment,
  deleteReply,
  getProductComments,
  replyToComment,
  type Comment,
} from "@/services/commentService";
import { useToast } from "@/hooks/use-toast";
import { confirmAction } from "@/components/feedback/confirm-dialog";
import ProductMiniPlayer from "@/components/ProductMiniPlayer";

type ShopInfo = {
  id?: number;
  name?: string;
  logo?: string | null;
  phoneNumber?: string;
  address?: string;
};

type ProductUser = {
  id?: number;
  firstName?: string;
  lastName?: string;
  photo?: string | null;
  phone?: string;
  address?: string;
};

export type ProductDetail = Product & {
  shop?: ShopInfo;
  user?: ProductUser;
  category?: { id?: number; name?: string } | string;
  details?: Record<string, unknown>;
};

type ReactionChange = {
  liked: boolean;
  disliked: boolean;
  likesCount: number;
  dislikesCount: number;
  commentsCount: number;
};

type Props = {
  product: ProductDetail;
  isLoggedIn: boolean;
  currentUserId?: number | null;
  onClose: () => void;
  onAddToCart?: (product: ProductDetail) => void;
  cartMessage?: boolean;
  onReactionChange?: (productId: number, state: ReactionChange) => void;
};

function sameUser(currentUserId: number | null | undefined, ownerId?: number | null) {
  if (currentUserId == null || ownerId == null) return false;
  return Number(currentUserId) === Number(ownerId);
}

function categoryName(category: ProductDetail["category"]): string | null {
  if (!category) return null;
  if (typeof category === "string") return category;
  return category.name ?? null;
}

export default function ProductDetailModal({
  product,
  isLoggedIn,
  currentUserId,
  onClose,
  onAddToCart,
  cartMessage,
  onReactionChange,
}: Props) {
  const { toast } = useToast();
  const video = resolveProductVideo(product.videoUrl);
  const playingVideo = resolveProductVideo(product.videoUrl, { autoplay: true });
  const isPublished = product.status !== "DRAFT";
  const inlineVideoRef = useRef<HTMLVideoElement | null>(null);
  const [mediaTab, setMediaTab] = useState<"images" | "video">(
    video && (!product.images || product.images.length === 0) ? "video" : "images",
  );
  const [miniVisible, setMiniVisible] = useState(Boolean(video));
  const [imageIndex, setImageIndex] = useState(0);
  const [liked, setLiked] = useState(Boolean(product.isLiked));
  const [disliked, setDisliked] = useState(false);
  const [likesCount, setLikesCount] = useState(
    nonNegativeCount(product.likesCount ?? product._count?.likes),
  );
  const [dislikesCount, setDislikesCount] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsTotal, setCommentsTotal] = useState(
    product.commentsCount ?? product._count?.comments ?? 0,
  );
  const [commentsPage, setCommentsPage] = useState({ page: 1, totalPages: 0 });
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [busy, setBusy] = useState(false);

  const notifyChange = (next: Partial<ReactionChange>) => {
    onReactionChange?.(product.id, {
      liked,
      disliked,
      likesCount,
      dislikesCount,
      commentsCount: commentsTotal,
      ...next,
    });
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [counts, reaction] = await Promise.all([
          getProductLikesCount(product.id),
          isLoggedIn
            ? getUserProductReaction(product.id)
            : Promise.resolve({ hasLiked: false, hasDisliked: false }),
        ]);
        if (cancelled) return;
        setLikesCount(nonNegativeCount(counts.likesCount));
        setDislikesCount(nonNegativeCount(counts.dislikesCount));
        setLiked(reaction.hasLiked);
        setDisliked(reaction.hasDisliked);
        notifyChange({
          liked: reaction.hasLiked,
          disliked: reaction.hasDisliked,
          likesCount: nonNegativeCount(counts.likesCount),
          dislikesCount: nonNegativeCount(counts.dislikesCount),
        });
      } catch {
        /* les compteurs du produit restent affichés */
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id, isLoggedIn]);

  const loadComments = async (page = 1) => {
    setLoadingComments(true);
    try {
      const result = await getProductComments(product.id, page);
      setComments(result.comments);
      setCommentsTotal(result.pagination.total);
      setCommentsPage({
        page: result.pagination.page,
        totalPages: result.pagination.totalPages,
      });
      notifyChange({ commentsCount: result.pagination.total });
    } catch (error) {
      toast({
        title: "Commentaires indisponibles",
        description: getUserErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setLoadingComments(false);
    }
  };

  useEffect(() => {
    void loadComments(1);
    const hasVideo = Boolean(resolveProductVideo(product.videoUrl));
    setMiniVisible(hasVideo);
    setMediaTab(
      hasVideo && (!product.images || product.images.length === 0) ? "video" : "images",
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  useEffect(() => {
    if (mediaTab !== "video" || !inlineVideoRef.current) return;
    const play = inlineVideoRef.current.play();
    if (play) play.catch(() => undefined);
  }, [mediaTab, product.id]);

  const openInlineVideo = () => {
    setMediaTab("video");
    setMiniVisible(false);
  };

  const requireAuth = () => {
    if (isLoggedIn) return true;
    window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
    return false;
  };

  const requirePublished = () => {
    if (isPublished) return true;
    toast({
      title: "Produit en brouillon",
      description: "Publiez le produit pour aimer ou commenter.",
    });
    return false;
  };

  const handleToggleLike = async () => {
    if (!requireAuth() || !requirePublished() || busy) return;
    const previous = { liked, disliked, likesCount, dislikesCount };
    const nextLiked = !liked;
    setLiked(nextLiked);
    if (disliked) {
      setDisliked(false);
      setDislikesCount((count) => nonNegativeCount(count - 1));
    }
    setLikesCount((count) => (nextLiked ? count + 1 : nonNegativeCount(count - 1)));
    setBusy(true);
    try {
      const result = await toggleProductLike(product.id);
      const isLiked = result.action === "liked";
      setLiked(isLiked);
      setDisliked(false);
      setLikesCount(nonNegativeCount(result.likesCount));
      setDislikesCount(nonNegativeCount(result.dislikesCount));
      notifyChange({
        liked: isLiked,
        disliked: false,
        likesCount: nonNegativeCount(result.likesCount),
        dislikesCount: nonNegativeCount(result.dislikesCount),
      });
    } catch (error) {
      setLiked(previous.liked);
      setDisliked(previous.disliked);
      setLikesCount(previous.likesCount);
      setDislikesCount(previous.dislikesCount);
      toast({
        title: "Like impossible",
        description: getUserErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const handleToggleDislike = async () => {
    if (!requireAuth() || !requirePublished() || busy) return;
    const previous = { liked, disliked, likesCount, dislikesCount };
    const nextDisliked = !disliked;
    setDisliked(nextDisliked);
    if (liked) {
      setLiked(false);
      setLikesCount((count) => nonNegativeCount(count - 1));
    }
    setDislikesCount((count) => (nextDisliked ? count + 1 : nonNegativeCount(count - 1)));
    setBusy(true);
    try {
      const result = await toggleProductDislike(product.id);
      const isDisliked = result.action === "disliked";
      setDisliked(isDisliked);
      setLiked(false);
      setLikesCount(nonNegativeCount(result.likesCount));
      setDislikesCount(nonNegativeCount(result.dislikesCount));
      notifyChange({
        liked: false,
        disliked: isDisliked,
        likesCount: nonNegativeCount(result.likesCount),
        dislikesCount: nonNegativeCount(result.dislikesCount),
      });
    } catch (error) {
      setLiked(previous.liked);
      setDisliked(previous.disliked);
      setLikesCount(previous.likesCount);
      setDislikesCount(previous.dislikesCount);
      toast({
        title: "Action impossible",
        description: getUserErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const handleAddComment = async () => {
    if (!requireAuth() || !requirePublished() || !newComment.trim()) return;
    try {
      const result = await addComment(product.id, { comment: newComment.trim() });
      if (result.comment) {
        setComments((prev) => [result.comment, ...prev]);
      } else {
        await loadComments(1);
      }
      setNewComment("");
      setCommentsTotal((total) => total + 1);
      notifyChange({ commentsCount: commentsTotal + 1 });
    } catch (error) {
      toast({
        title: "Commentaire non publié",
        description: getUserErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!isLoggedIn) return;
    const accepted = await confirmAction({
      title: "Supprimer ce commentaire ?",
      description: "Le commentaire et ses réponses disparaîtront définitivement.",
      confirmLabel: "Supprimer",
      cancelLabel: "Annuler",
      variant: "danger",
    });
    if (!accepted) return;
    try {
      await deleteComment(commentId);
      setComments((prev) => prev.filter((comment) => comment.id !== commentId));
      setCommentsTotal((total) => Math.max(0, total - 1));
      notifyChange({ commentsCount: Math.max(0, commentsTotal - 1) });
    } catch (error) {
      toast({
        title: "Suppression impossible",
        description: getUserErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const handleReply = async (commentId: number) => {
    if (!requireAuth() || !requirePublished() || !replyText.trim()) return;
    try {
      const result = await replyToComment(commentId, { reply: replyText.trim() });
      setComments((prev) =>
        prev.map((comment) =>
          comment.id === commentId
            ? { ...comment, replies: [...(comment.replies || []), result.reply] }
            : comment,
        ),
      );
      setReplyText("");
      setReplyingTo(null);
    } catch (error) {
      toast({
        title: "Réponse non envoyée",
        description: getUserErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const handleDeleteReply = async (commentId: number, replyId: number) => {
    const accepted = await confirmAction({
      title: "Supprimer cette réponse ?",
      description: "Cette réponse sera définitivement retirée.",
      confirmLabel: "Supprimer",
      cancelLabel: "Annuler",
      variant: "danger",
    });
    if (!accepted) return;
    try {
      await deleteReply(replyId);
      setComments((prev) =>
        prev.map((comment) =>
          comment.id === commentId
            ? {
                ...comment,
                replies: (comment.replies || []).filter((reply) => reply.id !== replyId),
              }
            : comment,
        ),
      );
    } catch (error) {
      toast({
        title: "Suppression impossible",
        description: getUserErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const shop = product.shop;
  const owner = product.user;
  const shopId = product.shopId || shop?.id || product.userId || owner?.id;
  const shopName =
    shop?.name || (owner && `${owner.firstName ?? ""} ${owner.lastName ?? ""}`.trim()) || "Boutique";
  const images = (product.images ?? []).map((image) => ({
    ...image,
    imageUrl: image.imageUrl || (image as { url?: string }).url || "",
  }));
  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative flex h-full items-stretch justify-center sm:items-center sm:p-4 pointer-events-none">
        <div
          role="dialog"
          aria-modal="true"
          className="pointer-events-auto flex h-[100dvh] w-full max-w-5xl flex-col overflow-hidden bg-white shadow-[0_8px_30px_rgba(0,0,0,0.35)] sm:h-auto sm:max-h-[90vh] sm:rounded-xl"
        >
          <div className="flex shrink-0 items-start justify-between gap-3 border-b px-4 py-3">
            <div className="min-w-0">
              <h3 className="text-base font-bold leading-snug text-gray-900 sm:text-lg break-words">
                {product.name}
              </h3>
              {product.status === "DRAFT" && (
                <p className="mt-0.5 text-xs text-amber-600">Brouillon — non visible comme publié</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="shrink-0 rounded-full p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              aria-label="Fermer"
            >
              <X size={22} />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 gap-5 p-4 md:grid-cols-2">
              <div className="space-y-3">
                {video && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setMediaTab("images")}
                      className={`rounded-full px-3 py-1.5 text-sm ${
                        mediaTab === "images" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      Photos
                    </button>
                    <button
                      type="button"
                      onClick={openInlineVideo}
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm ${
                        mediaTab === "video" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <Play size={14} />
                      Vidéo
                    </button>
                  </div>
                )}

                <div className="relative aspect-video max-h-[40vh] overflow-hidden rounded-lg bg-black sm:max-h-[28rem]">
                  {mediaTab === "video" && playingVideo ? (
                    playingVideo.kind === "youtube" ? (
                      <iframe
                        src={playingVideo.src}
                        title={`Vidéo de ${product.name}`}
                        className="absolute inset-0 h-full w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <video
                        ref={inlineVideoRef}
                        src={playingVideo.src}
                        controls
                        autoPlay
                        loop
                        playsInline
                        className="absolute inset-0 h-full w-full bg-black object-contain"
                      >
                        Votre navigateur ne peut pas lire cette vidéo.
                      </video>
                    )
                  ) : images.length > 0 ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={formatImageUrl(images[imageIndex]?.imageUrl) || ""}
                      alt={product.name}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-gray-400">
                      Image non disponible
                    </div>
                  )}
                </div>

                {mediaTab === "images" && images.length > 1 && (
                  <div className="flex space-x-2 overflow-x-auto pb-1">
                    {images.map((image, idx) => (
                      <button
                        key={`${image.id ?? idx}`}
                        type="button"
                        className={`h-14 w-14 shrink-0 overflow-hidden rounded-md border-2 ${
                          idx === imageIndex ? "border-blue-500" : "border-transparent"
                        }`}
                        onClick={() => setImageIndex(idx)}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={formatImageUrl(image.imageUrl) || ""}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {(shop || owner || shopId) && (
                  <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
                    <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-gray-200">
                      {shop?.logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={formatImageUrl(shop.logo) || ""} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-purple-500 text-lg font-bold text-white">
                          {shopName.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold text-gray-900">{shopName}</div>
                    </div>
                    {shopId && (
                      <button
                        className="shrink-0 whitespace-nowrap rounded-full bg-green-500 px-3 py-1 text-xs text-white hover:bg-green-600"
                        onClick={() => {
                          window.location.href = `/boutique/${shopId}`;
                        }}
                      >
                        Voir la boutique
                      </button>
                    )}
                  </div>
                )}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <ProductPrice price={product.price} promoPrice={product.promoPrice} size="lg" />
                  {onAddToCart && (
                    <button
                      className="w-full whitespace-nowrap rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-orange-600 sm:w-auto"
                      onClick={() => onAddToCart(product)}
                    >
                      Ajouter au panier
                    </button>
                  )}
                </div>
                {cartMessage && (
                  <div className="rounded bg-green-500 px-2 py-1 text-center text-sm text-white">
                    Produit ajouté au panier
                  </div>
                )}

                {categoryName(product.category) && (
                  <div className="text-sm text-gray-500">
                    Catégorie : <span className="font-medium text-gray-700">{categoryName(product.category)}</span>
                  </div>
                )}
                <p className="break-words text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {product.description}
                </p>

                <div className="flex flex-wrap items-center gap-2 border-t pt-4">
                  <button
                    type="button"
                    onClick={() => void handleToggleLike()}
                    className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-slate-50 px-3 py-1.5 text-sm text-gray-700"
                    title={isLoggedIn ? "J'aime" : "Connectez-vous pour aimer ce produit"}
                  >
                    <Heart size={16} className={liked ? "fill-red-500 text-red-500" : "text-gray-500"} />
                    <span>{nonNegativeCount(likesCount)}</span>
                    <span>j&apos;aime</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleToggleDislike()}
                    className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-slate-50 px-3 py-1.5 text-sm text-gray-700"
                  >
                    <ThumbsDown
                      size={16}
                      className={disliked ? "fill-blue-500 text-blue-500" : "text-gray-500"}
                    />
                    <span>{nonNegativeCount(dislikesCount)}</span>
                    <span>je n&apos;aime pas</span>
                  </button>
                  <div className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-slate-50 px-3 py-1.5 text-sm text-gray-700">
                    <MessageCircle size={16} className="text-gray-500" />
                    <span>{nonNegativeCount(commentsTotal)}</span>
                    <span>commentaires</span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="mb-3 font-medium">
                    Commentaires ({nonNegativeCount(commentsTotal)})
                  </h4>
                  {loadingComments ? (
                    <div className="flex justify-center py-4">
                      <Loader className="animate-spin text-blue-500" size={24} />
                    </div>
                  ) : (
                    <div className="max-h-56 space-y-3 overflow-y-auto">
                      {comments.length === 0 ? (
                        <p className="py-2 text-center text-gray-500">Aucun commentaire pour le moment</p>
                      ) : (
                        comments.map((comment) => (
                          <div key={comment.id} className="border-b pb-3 last:border-b-0">
                            <div className="flex gap-2">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100 font-bold text-blue-500">
                                {comment.user?.photo ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={formatImageUrl(comment.user.photo) || ""}
                                    alt=""
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  comment.user?.firstName?.charAt(0).toUpperCase() || "?"
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0 truncate text-sm font-medium">
                                    {comment.user?.firstName} {comment.user?.lastName}
                                  </div>
                                  {sameUser(currentUserId, comment.userId ?? comment.user?.id) && (
                                    <button
                                      type="button"
                                      onClick={() => void handleDeleteComment(comment.id)}
                                      className="shrink-0 text-xs text-gray-400 hover:text-red-500"
                                    >
                                      Supprimer
                                    </button>
                                  )}
                                </div>
                                <p className="break-words text-sm leading-relaxed text-gray-600">
                                  {comment.comment}
                                </p>
                                {isLoggedIn && isPublished && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setReplyingTo(replyingTo === comment.id ? null : comment.id);
                                      setReplyText("");
                                    }}
                                    className="mt-1 text-xs text-blue-500 hover:underline"
                                  >
                                    {replyingTo === comment.id ? "Annuler" : "Répondre"}
                                  </button>
                                )}
                                {replyingTo === comment.id && (
                                  <div className="mt-2 flex min-w-0">
                                    <input
                                      type="text"
                                      value={replyText}
                                      onChange={(event) => setReplyText(event.target.value)}
                                      placeholder="Votre réponse..."
                                      className="min-w-0 flex-1 rounded-l-lg border px-2 py-1 text-sm"
                                      onKeyDown={(event) => {
                                        if (event.key === "Enter") void handleReply(comment.id);
                                      }}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => void handleReply(comment.id)}
                                      className="shrink-0 rounded-r-lg bg-blue-500 px-2 py-1 text-sm text-white"
                                    >
                                      Envoyer
                                    </button>
                                  </div>
                                )}
                                {comment.replies?.map((reply) => (
                                  <div key={reply.id} className="mt-2 border-l-2 border-gray-100 pl-4">
                                    <div className="flex justify-between gap-2">
                                      <div className="min-w-0 truncate text-xs font-medium">
                                        {reply.user?.firstName} {reply.user?.lastName}
                                      </div>
                                      {sameUser(currentUserId, reply.userId ?? reply.user?.id) && (
                                        <button
                                          type="button"
                                          className="shrink-0 text-xs text-gray-400 hover:text-red-500"
                                          onClick={() => void handleDeleteReply(comment.id, reply.id)}
                                        >
                                          Supprimer
                                        </button>
                                      )}
                                    </div>
                                    <p className="break-words text-xs leading-relaxed text-gray-600">
                                      {reply.reply}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                      {commentsPage.totalPages > 1 && (
                        <div className="flex justify-center gap-2 text-xs">
                          <button
                            type="button"
                            disabled={commentsPage.page === 1}
                            onClick={() => void loadComments(commentsPage.page - 1)}
                            className="rounded bg-gray-200 px-2 py-1 disabled:opacity-50"
                          >
                            Précédent
                          </button>
                          <span className="self-center text-gray-500">
                            Page {commentsPage.page} / {commentsPage.totalPages}
                          </span>
                          <button
                            type="button"
                            disabled={commentsPage.page === commentsPage.totalPages}
                            onClick={() => void loadComments(commentsPage.page + 1)}
                            className="rounded bg-gray-200 px-2 py-1 disabled:opacity-50"
                          >
                            Suivant
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-4 flex min-w-0">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(event) => setNewComment(event.target.value)}
                      placeholder={isPublished ? "Ajouter un commentaire..." : "Publiez le produit pour commenter"}
                      disabled={!isPublished}
                      className="min-w-0 flex-1 rounded-l-lg border px-3 py-2 disabled:bg-gray-50"
                      onKeyDown={(event) => {
                        if (event.key === "Enter") void handleAddComment();
                      }}
                      onClick={() => {
                        if (!isLoggedIn) {
                          window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="shrink-0 rounded-r-lg bg-blue-500 px-4 py-2 text-white disabled:opacity-50"
                      onClick={() => void handleAddComment()}
                      disabled={!isLoggedIn || !isPublished || !newComment.trim()}
                    >
                      Publier
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {miniVisible && video && mediaTab !== "video" && product.videoUrl && (
        <ProductMiniPlayer
          title={product.name}
          url={product.videoUrl}
          onClose={() => setMiniVisible(false)}
        />
      )}
    </div>
  );
}
