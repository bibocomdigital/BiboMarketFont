"use client";

import React, { useEffect, useState } from "react";
import {
  Heart,
  Loader,
  MessageCircle,
  Play,
  ThumbsDown,
  X,
} from "lucide-react";
import { getUserErrorMessage } from "@domain/errors/app-error";
import { formatFcfa } from "@/lib/admin-analytics";
import { resolveProductVideo } from "@/lib/product-video";
import { formatImageUrl, type Product } from "@/services/productService";
import {
  getProductLikesCount,
  getUserProductReaction,
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
  const isPublished = product.status !== "DRAFT";
  const [mediaTab, setMediaTab] = useState<"images" | "video">(
    video && (!product.images || product.images.length === 0) ? "video" : "images",
  );
  const [imageIndex, setImageIndex] = useState(0);
  const [liked, setLiked] = useState(Boolean(product.isLiked));
  const [disliked, setDisliked] = useState(false);
  const [likesCount, setLikesCount] = useState(product.likesCount ?? product._count?.likes ?? 0);
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
        setLikesCount(counts.likesCount);
        setDislikesCount(counts.dislikesCount);
        setLiked(reaction.hasLiked);
        setDisliked(reaction.hasDisliked);
        notifyChange({
          liked: reaction.hasLiked,
          disliked: reaction.hasDisliked,
          likesCount: counts.likesCount,
          dislikesCount: counts.dislikesCount,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

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
      setDislikesCount((count) => Math.max(0, count - 1));
    }
    setLikesCount((count) => (nextLiked ? count + 1 : Math.max(0, count - 1)));
    setBusy(true);
    try {
      const result = await toggleProductLike(product.id);
      const isLiked = result.action === "liked";
      setLiked(isLiked);
      setDisliked(false);
      setLikesCount(result.likesCount);
      setDislikesCount(result.dislikesCount);
      notifyChange({
        liked: isLiked,
        disliked: false,
        likesCount: result.likesCount,
        dislikesCount: result.dislikesCount,
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
      setLikesCount((count) => Math.max(0, count - 1));
    }
    setDislikesCount((count) => (nextDisliked ? count + 1 : Math.max(0, count - 1)));
    setBusy(true);
    try {
      const result = await toggleProductDislike(product.id);
      const isDisliked = result.action === "disliked";
      setDisliked(isDisliked);
      setLiked(false);
      setLikesCount(result.likesCount);
      setDislikesCount(result.dislikesCount);
      notifyChange({
        liked: false,
        disliked: isDisliked,
        likesCount: result.likesCount,
        dislikesCount: result.dislikesCount,
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
    if (!window.confirm("Supprimer ce commentaire ?")) return;
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
    if (!window.confirm("Supprimer cette réponse ?")) return;
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
      <div className="relative flex h-full items-center justify-center p-4 pointer-events-none">
        <div
          role="dialog"
          aria-modal="true"
          className="pointer-events-auto bg-white rounded-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-[0_8px_30px_rgba(0,0,0,0.35)]"
        >
          <div className="flex items-center justify-between p-4 border-b">
            <div>
              <h3 className="font-bold text-lg">{product.name}</h3>
              {product.status === "DRAFT" && (
                <p className="text-xs text-amber-600 mt-0.5">Brouillon — non visible comme publié</p>
              )}
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700" aria-label="Fermer">
              <X size={24} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
            <div className="space-y-3">
              {video && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setMediaTab("images")}
                    className={`px-3 py-1.5 text-sm rounded-full ${
                      mediaTab === "images" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    Photos
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaTab("video")}
                    className={`px-3 py-1.5 text-sm rounded-full inline-flex items-center gap-1 ${
                      mediaTab === "video" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    <Play size={14} />
                    Vidéo
                  </button>
                </div>
              )}

              <div className="relative h-64 md:h-96 bg-gray-100 rounded-lg overflow-hidden">
                {mediaTab === "video" && video ? (
                  video.kind === "youtube" ? (
                    <iframe
                      src={video.src}
                      title={`Vidéo de ${product.name}`}
                      className="h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <video src={video.src} controls className="h-full w-full object-contain bg-black">
                      Votre navigateur ne peut pas lire cette vidéo.
                    </video>
                  )
                ) : images.length > 0 ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={formatImageUrl(images[imageIndex]?.imageUrl) || ""}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-400">
                    Image non disponible
                  </div>
                )}
              </div>

              {mediaTab === "images" && images.length > 1 && (
                <div className="flex overflow-x-auto space-x-2 pb-2">
                  {images.map((image, idx) => (
                    <button
                      key={`${image.id ?? idx}`}
                      type="button"
                      className={`w-16 h-16 flex-shrink-0 rounded-md overflow-hidden border-2 ${
                        idx === imageIndex ? "border-blue-500" : "border-transparent"
                      }`}
                      onClick={() => setImageIndex(idx)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={formatImageUrl(image.imageUrl) || ""}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4">
              {(shop || owner || shopId) && (
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                    {shop?.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={formatImageUrl(shop.logo) || ""} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-purple-500 flex items-center justify-center text-white font-bold text-lg">
                        {shop?.name?.charAt(0) || owner?.firstName?.charAt(0) || "B"}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 truncate">
                      {shop?.name || (owner && `${owner.firstName ?? ""} ${owner.lastName ?? ""}`.trim()) || "Boutique"}
                    </div>
                    {(shop?.phoneNumber || owner?.phone) && (
                      <div className="text-sm text-gray-600">📞 {shop?.phoneNumber || owner?.phone}</div>
                    )}
                  </div>
                  {shopId && (
                    <button
                      className="bg-green-500 text-white px-3 py-1 rounded-full text-xs hover:bg-green-600"
                      onClick={() => {
                        window.location.href = `/boutique/${shopId}`;
                      }}
                    >
                      Voir la boutique
                    </button>
                  )}
                </div>
              )}

              <div className="flex justify-between items-center">
                <div className="text-2xl font-bold text-gray-900">{formatFcfa(product.price)}</div>
                {onAddToCart && (
                  <button
                    className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg"
                    onClick={() => onAddToCart(product)}
                  >
                    Ajouter au panier
                  </button>
                )}
              </div>
              {cartMessage && (
                <div className="bg-green-500 text-white py-1 px-2 rounded text-sm text-center">
                  Produit ajouté au panier
                </div>
              )}

              {categoryName(product.category) && (
                <div className="text-sm text-gray-500">
                  Catégorie: <span className="font-medium text-gray-700">{categoryName(product.category)}</span>
                </div>
              )}
              <p className="text-gray-700 whitespace-pre-wrap">{product.description}</p>

              <div className="flex items-center space-x-4 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => void handleToggleLike()}
                  className="flex items-center space-x-1"
                  title={isLoggedIn ? "J'aime" : "Connectez-vous pour aimer ce produit"}
                >
                  <Heart size={20} className={liked ? "fill-red-500 text-red-500" : "text-gray-500"} />
                  <span className="text-sm">{likesCount} j&apos;aime</span>
                </button>
                <button
                  type="button"
                  onClick={() => void handleToggleDislike()}
                  className="flex items-center space-x-1"
                >
                  <ThumbsDown
                    size={20}
                    className={disliked ? "fill-blue-500 text-blue-500" : "text-gray-500"}
                  />
                  <span className="text-sm">{dislikesCount} je n&apos;aime pas</span>
                </button>
                <div className="flex items-center space-x-1">
                  <MessageCircle size={20} className="text-gray-500" />
                  <span className="text-sm">{commentsTotal} commentaires</span>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Commentaires ({commentsTotal})</h4>
                {loadingComments ? (
                  <div className="flex justify-center py-4">
                    <Loader className="animate-spin text-blue-500" size={24} />
                  </div>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {comments.length === 0 ? (
                      <p className="text-gray-500 text-center py-2">Aucun commentaire pour le moment</p>
                    ) : (
                      comments.map((comment) => (
                        <div key={comment.id} className="border-b pb-3 last:border-b-0">
                          <div className="flex space-x-2">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex-shrink-0 overflow-hidden flex items-center justify-center text-blue-500 font-bold">
                              {comment.user?.photo ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={formatImageUrl(comment.user.photo) || ""}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                comment.user?.firstName?.charAt(0).toUpperCase() || "?"
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <div className="font-medium text-sm">
                                  {comment.user?.firstName} {comment.user?.lastName}
                                </div>
                                {sameUser(currentUserId, comment.userId ?? comment.user?.id) && (
                                  <button
                                    type="button"
                                    onClick={() => void handleDeleteComment(comment.id)}
                                    className="text-gray-400 hover:text-red-500 text-xs"
                                  >
                                    Supprimer
                                  </button>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">{comment.comment}</p>
                              {isLoggedIn && isPublished && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReplyingTo(replyingTo === comment.id ? null : comment.id);
                                    setReplyText("");
                                  }}
                                  className="text-xs text-blue-500 mt-1 hover:underline"
                                >
                                  {replyingTo === comment.id ? "Annuler" : "Répondre"}
                                </button>
                              )}
                              {replyingTo === comment.id && (
                                <div className="mt-2 flex">
                                  <input
                                    type="text"
                                    value={replyText}
                                    onChange={(event) => setReplyText(event.target.value)}
                                    placeholder="Votre réponse..."
                                    className="flex-1 border rounded-l-lg px-2 py-1 text-sm"
                                    onKeyDown={(event) => {
                                      if (event.key === "Enter") void handleReply(comment.id);
                                    }}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => void handleReply(comment.id)}
                                    className="bg-blue-500 text-white px-2 py-1 rounded-r-lg text-sm"
                                  >
                                    Envoyer
                                  </button>
                                </div>
                              )}
                              {comment.replies?.map((reply) => (
                                <div key={reply.id} className="mt-2 pl-4 border-l-2 border-gray-100">
                                  <div className="flex justify-between">
                                    <div className="font-medium text-xs">
                                      {reply.user?.firstName} {reply.user?.lastName}
                                    </div>
                                    {sameUser(currentUserId, reply.userId ?? reply.user?.id) && (
                                      <button
                                        type="button"
                                        className="text-gray-400 hover:text-red-500 text-xs"
                                        onClick={() => void handleDeleteReply(comment.id, reply.id)}
                                      >
                                        Supprimer
                                      </button>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-600">{reply.reply}</p>
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
                          className="px-2 py-1 rounded bg-gray-200 disabled:opacity-50"
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
                          className="px-2 py-1 rounded bg-gray-200 disabled:opacity-50"
                        >
                          Suivant
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-4 flex">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(event) => setNewComment(event.target.value)}
                    placeholder={isPublished ? "Ajouter un commentaire..." : "Publiez le produit pour commenter"}
                    disabled={!isPublished}
                    className="flex-1 border rounded-l-lg px-3 py-2 disabled:bg-gray-50"
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
                    className="bg-blue-500 text-white px-4 py-2 rounded-r-lg disabled:opacity-50"
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
  );
}
