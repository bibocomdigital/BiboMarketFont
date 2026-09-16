"use client";

import React, { useState, useEffect, useRef } from 'react';

import { formatImageUrl } from '@/services/productService';
import { useProductCategoriesQuery, useProductsQuery } from '@/hooks/queries/use-products-query';
import { useAddToCartMutation } from '@/hooks/mutations/use-cart-mutations';
import { 
  getProductLikesCount, 
  getUserProductReaction, 
  toggleProductLike, 
  toggleProductDislike,
  debugLikesInfo
} from '@/services/likeService';
import { 
  getProductComments, 
  addComment, 
  replyToComment, 
  deleteComment, 
  deleteReply,
  updateComment
} from '@/services/commentService';
import { Loader, Heart, MessageCircle, X, ChevronLeft, ChevronRight, ThumbsDown, Search, Filter } from 'lucide-react';
import { ServiceUnavailableState } from '@/components/feedback/ServiceUnavailableState';
import { useAuthSession } from '@/hooks/use-auth-session';
import { useSearchParams } from 'react-router-dom';

const ProductsGrid = () => {
  const { isAuthenticated: isLoggedIn } = useAuthSession();
  const [searchParams] = useSearchParams();
  const categoryFromUrl = searchParams.get('category');
  const qFromUrl = searchParams.get('q') || '';
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    category: undefined as number | undefined,
  });
  const productsQuery = useProductsQuery(pagination.page, pagination.limit);
  const categoriesQuery = useProductCategoriesQuery();
  const addToCartMutation = useAddToCartMutation();
  const categories = categoriesQuery.data ?? [];
  const [error, setError] = useState<string | null>(null);
  
  // États pour le filtrage
  const [searchTerm, setSearchTerm] = useState(qFromUrl);
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(
    categoryFromUrl ? Number(categoryFromUrl) : undefined
  );
  const [showFilters, setShowFilters] = useState(false);
  
  // États pour la modal et le produit sélectionné
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Références pour les intervalles des carrousels
  const carouselIntervals = useRef<{[key: number]: NodeJS.Timeout}>({});
  
  // Nouvel état pour suivre les images actuelles dans chaque carrousel
  const [currentImages, setCurrentImages] = useState<{[key: number]: number}>({});
  
  // États pour gérer les likes/dislikes
  const [likes, setLikes] = useState<{[key: number]: boolean}>({});
  const [dislikes, setDislikes] = useState<{[key: number]: boolean}>({});
  const [likesCount, setLikesCount] = useState<{[key: number]: number}>({});
  const [dislikesCount, setDislikesCount] = useState<{[key: number]: number}>({});
  
  // États pour gérer les likes/dislikes
  const [comments, setComments] = useState<any[]>([]);
  const [commentsPagination, setCommentsPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  });
  const [newCommentText, setNewCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [cartMessages, setCartMessages] = useState<{[key: number]: boolean}>({});

  useEffect(() => {
    if (qFromUrl) setSearchTerm(qFromUrl);
  }, [qFromUrl]);

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  
  // Fonction pour gérer l'ajout au panier
  const handleAddToCart = async (product: any, event?: React.MouseEvent) => {
    // Empêcher la propagation de l'événement pour ne pas ouvrir la modal
    if (event) {
      event.stopPropagation();
    }
    
    // Si l'utilisateur n'est pas connecté, rediriger vers la page de connexion
    if (!isLoggedIn) {
      window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
      return;
    }
    
    try {
      // Appeler le service pour ajouter au panier
      await addToCartMutation.mutateAsync({ productId: product.id });
      
      // Afficher le message de confirmation
      setCartMessages(prev => ({
        ...prev,
        [product.id]: true
      }));
      
      // Faire disparaître le message après 3 secondes
      setTimeout(() => {
        setCartMessages(prev => ({
          ...prev,
          [product.id]: false
        }));
      }, 3000);
    } catch (error: any) {
      alert(error.message || "Une erreur est survenue lors de l'ajout au panier");
    }
  };

  useEffect(() => {
    const next = categoryFromUrl ? Number(categoryFromUrl) : undefined;
    setSelectedCategory(Number.isNaN(next as number) ? undefined : next);
    setPagination((prev) => ({
      ...prev,
      page: 1,
      category: Number.isNaN(next as number) ? undefined : next,
    }));
  }, [categoryFromUrl]);

  const rawProducts = productsQuery.data?.products ?? [];
  const filteredProducts = rawProducts.filter((product) => {
    const categoryMatch = !selectedCategory || (product.category && (product.category as { id?: number }).id === selectedCategory);
    if (!categoryMatch) return false;
    if (!searchTerm.trim()) return true;
    const searchLower = searchTerm.toLowerCase().trim();
    return product.name.toLowerCase().includes(searchLower) ||
      product.description.toLowerCase().includes(searchLower);
  });
  const total = filteredProducts.length;
  const totalPages = Math.ceil(total / pagination.limit);
  const startIndex = (pagination.page - 1) * pagination.limit;
  const products = filteredProducts.slice(startIndex, startIndex + pagination.limit);
  const loading = productsQuery.isPending && !productsQuery.data;
  const isCatalogUnavailable = productsQuery.isError && !productsQuery.data;

  useEffect(() => {
    const initialCurrentImages: {[key: number]: number} = {};
    products.forEach((product) => {
      initialCurrentImages[product.id] = 0;
    });
    setCurrentImages(initialCurrentImages);
    setPagination((prev) => ({
      ...prev,
      total,
      totalPages,
    }));
    if (products.length > 0) {
      void loadLikesData(products);
    }
  }, [productsQuery.data, selectedCategory, searchTerm, pagination.page, pagination.limit]);

  // Nettoyage des intervalles au démontage
  useEffect(() => {
    return () => {
      Object.values(carouselIntervals.current).forEach(interval => clearInterval(interval));
    };
  }, []);

  // Charger les données de likes pour chaque produit
  const loadLikesData = async (products: any[]) => {
    try {
      const likesData: {[key: number]: boolean} = {};
      const dislikesData: {[key: number]: boolean} = {};
      const likesCountData: {[key: number]: number} = {};
      const dislikesCountData: {[key: number]: number} = {};
      
      // Pour chaque produit
      await Promise.all(products.map(async (product) => {
        // 1. TOUJOURS récupérer le nombre total de likes (information publique)
        try {
          const likesCountResult = await getProductLikesCount(product.id);
          likesCountData[product.id] = likesCountResult.likesCount;
          dislikesCountData[product.id] = likesCountResult.dislikesCount;
        } catch (countError) {
          console.error(`Erreur lors de la récupération du nombre de likes pour le produit ${product.id}:`, countError);
          likesCountData[product.id] = 0;
          dislikesCountData[product.id] = 0;
        }
        
        // 2. Vérifier si l'utilisateur a liké/disliké SEULEMENT s'il est connecté
        if (isLoggedIn) {
          try {
            const userReaction = await getUserProductReaction(product.id);
            likesData[product.id] = userReaction.hasLiked;
            dislikesData[product.id] = userReaction.hasDisliked;
          } catch (reactionError) {
            console.error(`Erreur lors de la vérification de la réaction pour le produit ${product.id}:`, reactionError);
            likesData[product.id] = false;
            dislikesData[product.id] = false;
          }
        } else {
          // Si l'utilisateur n'est pas connecté, définir les réactions par défaut
          likesData[product.id] = false;
          dislikesData[product.id] = false;
        }
      }));
      
      // Mettre à jour les états avec les données récupérées
      setLikes(likesData);
      setDislikes(dislikesData);
      setLikesCount(likesCountData);
      setDislikesCount(dislikesCountData);
    } catch (error) {
      console.error("Erreur lors du chargement des données de likes:", error);
    }
  };

  // Démarrer les carrousels automatiques après le chargement des produits
  useEffect(() => {
    if (!loading && products.length > 0) {
      products.forEach(product => {
        if (product.images && product.images.length > 1) {
          startCarousel(product.id);
        }
      });
    }
    
    return () => {
      // Nettoyer les intervalles au changement de produits
      Object.values(carouselIntervals.current).forEach(interval => clearInterval(interval));
    };
  }, [loading, products]);

  // Démarrer le carrousel pour un produit spécifique
  const startCarousel = (productId: number) => {
    // Nettoyer tout intervalle existant pour ce produit
    if (carouselIntervals.current[productId]) {
      clearInterval(carouselIntervals.current[productId]);
    }
    
    // Créer un nouvel intervalle
    const product = products.find(p => p.id === productId);
    if (product && product.images && product.images.length > 1) {
      carouselIntervals.current[productId] = setInterval(() => {
        setCurrentImages(prev => ({
          ...prev,
          [productId]: (prev[productId] + 1) % product.images.length
        }));
      }, 3000); // Change image every 3 seconds
    }
  };

  // Arrêter le carrousel pour un produit spécifique
  const stopCarousel = (productId: number) => {
    if (carouselIntervals.current[productId]) {
      clearInterval(carouselIntervals.current[productId]);
      delete carouselIntervals.current[productId];
    }
  };

  // Navigation manuelle du carrousel
  const navigateCarousel = (productId: number, direction: 'prev' | 'next', event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    
    const product = products.find(p => p.id === productId);
    if (product && product.images && product.images.length > 1) {
      // Stopper le carrousel automatique temporairement
      stopCarousel(productId);
      
      // Mettre à jour l'image
      setCurrentImages(prev => {
        const currentIndex = prev[productId] || 0;
        const imagesCount = product.images.length;
        let newIndex;
        
        if (direction === 'prev') {
          newIndex = (currentIndex - 1 + imagesCount) % imagesCount;
        } else {
          newIndex = (currentIndex + 1) % imagesCount;
        }
        
        return { ...prev, [productId]: newIndex };
      });
      
      // Redémarrer le carrousel après un délai
      setTimeout(() => startCarousel(productId), 5000);
    }
  };

  // Helper function to handle image URLs - Updated for Cloudinary support
  const getImageUrl = (product: any, imageIndex = 0) => {
    if (!product.images || !product.images.length || imageIndex >= product.images.length) {
      return null;
    }

    const imageInfo = product.images[imageIndex];
    let imageUrl = '';

    // Check different possible structures
    if (typeof imageInfo === 'string') {
      imageUrl = imageInfo;
    } else if (imageInfo && typeof imageInfo === 'object') {
      imageUrl = imageInfo.imageUrl || imageInfo.url || imageInfo.path || '';
    }

    if (!imageUrl) {
      return null;
    }
    
    // Use formatImageUrl to handle Cloudinary and local URLs
    return formatImageUrl(imageUrl);
  };

  // Fonction pour réinitialiser les filtres
  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategory(undefined);
    setPagination(prev => ({ ...prev, page: 1, category: undefined }));
  };

  // Fonction pour appliquer le filtre de catégorie
  const handleCategoryFilter = (categoryId: number | undefined) => {
    setSelectedCategory(categoryId);
    setPagination(prev => ({ ...prev, page: 1, category: categoryId }));
  };

  // Fonction pour gérer la recherche
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Réinitialiser à la page 1 quand on change de filtre  
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [selectedCategory, searchTerm]);

  // Pagination handlers
  const handlePrevPage = () => {
    if (pagination.page > 1) {
      setPagination((prev: any) => ({ ...prev, page: prev.page - 1 }));
    }
  };

  const handleNextPage = () => {
    if (pagination.page < pagination.totalPages) {
      setPagination((prev: any) => ({ ...prev, page: prev.page + 1 }));
    }
  };

  const goToPage = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  // Générer les numéros de pages à afficher
  const getPageNumbers = () => {
    const current = pagination.page;
    const total = pagination.totalPages;
    const delta = 2; // Nombre de pages à afficher de chaque côté de la page courante
    
    let pages: (number | string)[] = [];
    
    // Toujours inclure la première page
    if (total > 0) pages.push(1);
    
    // Ajouter "..." si nécessaire
    if (current - delta > 2) {
      pages.push('...');
    }
    
    // Ajouter les pages autour de la page courante
    for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
      if (!pages.includes(i)) {
        pages.push(i);
      }
    }
    
    // Ajouter "..." si nécessaire
    if (current + delta < total - 1) {
      pages.push('...');
    }
    
    // Toujours inclure la dernière page (si différente de la première)
    if (total > 1) {
      pages.push(total);
    }
    
    return pages;
  };

  // Handle image loading error
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.currentTarget;
    target.onerror = null;
    target.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22300%22%20height%3D%22200%22%20viewBox%3D%220%200%20300%20200%22%3E%3Crect%20fill%3D%22%23E0E0E0%22%20width%3D%22300%22%20height%3D%22200%22%2F%3E%3Ctext%20fill%3D%22%23757575%22%20font-family%3D%22Arial%2CVerdana%2CSans-serif%22%20font-size%3D%2216%22%20text-anchor%3D%22middle%22%20x%3D%22150%22%20y%3D%22100%22%3EImage%20non%20disponible%3C%2Ftext%3E%3C%2Fsvg%3E';
  };
  
  // Toggle like pour un produit
  const handleToggleLike = async (productId: number, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    
    // Vérifier si l'utilisateur est connecté en utilisant l'état isLoggedIn
    if (!isLoggedIn) {
      // Rediriger vers la page de connexion avec URL de retour
      window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
      return;
    }
    
    try {
      // Pour optimiser l'UI, mettre à jour l'interface avant la réponse du serveur
      const currentLikeStatus = likes[productId] || false;
      const currentDislikeStatus = dislikes[productId] || false;
      const currentLikesCount = likesCount[productId] || 0;
      const currentDislikesCount = dislikesCount[productId] || 0;
      
      // Si l'utilisateur a déjà disliké et qu'il like maintenant, on retire le dislike
      if (currentDislikeStatus) {
        setDislikes(prev => ({
          ...prev,
          [productId]: false
        }));
        setDislikesCount(prev => ({
          ...prev,
          [productId]: Math.max(0, currentDislikesCount - 1)
        }));
      }
      
      // Toggle le like
      const newLikeStatus = !currentLikeStatus;
      setLikes(prev => ({
        ...prev,
        [productId]: newLikeStatus
      }));
      
      // Mettre à jour le compteur: +1 si ajout d'un like, -1 si retrait
      setLikesCount(prev => ({
        ...prev,
        [productId]: newLikeStatus ? currentLikesCount + 1 : Math.max(0, currentLikesCount - 1)
      }));
      
      // Appeler l'API pour persister le changement
      const result = await toggleProductLike(productId);
      
      // Mettre à jour avec les valeurs retournées par le serveur
      setLikesCount(prev => ({
        ...prev,
        [productId]: result.likesCount
      }));
      
      setDislikesCount(prev => ({
        ...prev,
        [productId]: result.dislikesCount
      }));
      
      // Mettre à jour le statut des réactions selon l'action effectuée
      if (result.action === 'added_like') {
        setLikes(prev => ({ ...prev, [productId]: true }));
        setDislikes(prev => ({ ...prev, [productId]: false }));
      } else if (result.action === 'removed_like') {
        setLikes(prev => ({ ...prev, [productId]: false }));
      }
      
      // Pour déboguer
      // debugLikesInfo(productId);
    } catch (error: any) {
      console.error("Error toggling like:", error);
      alert(error.message || "Une erreur s'est produite");
      
      // Recharger les données en cas d'erreur pour être sûr d'avoir le bon état
      if (selectedProduct && selectedProduct.id === productId) {
        loadLikesData([selectedProduct]);
      } else {
        const product = products.find(p => p.id === productId);
        if (product) {
          loadLikesData([product]);
        }
      }
    }
  };
  
  // Toggle dislike pour un produit
  const handleToggleDislike = async (productId: number, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    
    // Vérifier si l'utilisateur est connecté en utilisant l'état isLoggedIn
    if (!isLoggedIn) {
      // Rediriger vers la page de connexion avec URL de retour
      window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
      return;
    }
    
    try {
      // Pour optimiser l'UI, mettre à jour l'interface avant la réponse du serveur
      const currentLikeStatus = likes[productId] || false;
      const currentDislikeStatus = dislikes[productId] || false;
      const currentLikesCount = likesCount[productId] || 0;
      const currentDislikesCount = dislikesCount[productId] || 0;
      
      // Si l'utilisateur a déjà liké et qu'il dislike maintenant, on retire le like
      if (currentLikeStatus) {
        setLikes(prev => ({
          ...prev,
          [productId]: false
        }));
        setLikesCount(prev => ({
          ...prev,
          [productId]: Math.max(0, currentLikesCount - 1)
        }));
      }
      
      // Toggle le dislike
      const newDislikeStatus = !currentDislikeStatus;
      setDislikes(prev => ({
        ...prev,
        [productId]: newDislikeStatus
      }));
      
      // Mettre à jour le compteur: +1 si ajout d'un dislike, -1 si retrait
      setDislikesCount(prev => ({
        ...prev,
        [productId]: newDislikeStatus ? currentDislikesCount + 1 : Math.max(0, currentDislikesCount - 1)
      }));
      
      // Appeler l'API pour persister le changement
      const result = await toggleProductDislike(productId);
      
      // Mettre à jour avec les valeurs retournées par le serveur
      setLikesCount(prev => ({
        ...prev,
        [productId]: result.likesCount
      }));
      
      setDislikesCount(prev => ({
        ...prev,
        [productId]: result.dislikesCount
      }));
      
      // Mettre à jour le statut des réactions selon l'action effectuée
      if (result.action === 'added_dislike') {
        setDislikes(prev => ({ ...prev, [productId]: true }));
        setLikes(prev => ({ ...prev, [productId]: false }));
      } else if (result.action === 'removed_dislike') {
        setDislikes(prev => ({ ...prev, [productId]: false }));
      }
      
      // Pour déboguer
      // debugLikesInfo(productId);
    } catch (error: any) {
      console.error("Error toggling dislike:", error);
      alert(error.message || "Une erreur s'est produite");
      
      // Recharger les données en cas d'erreur pour être sûr d'avoir le bon état
      if (selectedProduct && selectedProduct.id === productId) {
        loadLikesData([selectedProduct]);
      } else {
        const product = products.find(p => p.id === productId);
        if (product) {
          loadLikesData([product]);
        }
      }
    }
  };
  
  // Charger les commentaires d'un produit
  const loadProductComments = async (productId: number, page: number = 1) => {
    try {
      setLoadingComments(true);
      const result = await getProductComments(productId, page);
      setComments(result.comments);
      setCommentsPagination(result.pagination);
    } catch (error) {
      console.error('Erreur lors du chargement des commentaires:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  // Ajouter un commentaire
  const handleAddComment = async (productId: number, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    
    if (!isLoggedIn) {
      window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
      return;
    }
    
    if (!newCommentText.trim()) {
      return;
    }
    
    try {
      const result = await addComment(productId, { comment: newCommentText });
      // Ajouter le nouveau commentaire au début de la liste
      setComments(prevComments => [result.comment, ...prevComments]);
      // Réinitialiser le champ de texte
      setNewCommentText('');
      // Mettre à jour le compteur de commentaires
      setCommentsPagination(prev => ({
        ...prev,
        total: prev.total + 1
      }));
    } catch (error) {
      console.error('Erreur lors de l\'ajout du commentaire:', error);
      alert('Une erreur est survenue lors de l\'ajout du commentaire');
    }
  };

  // Ajouter une réponse à un commentaire
  const handleReplyToComment = async (commentId: number, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    
    if (!isLoggedIn) {
      window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
      return;
    }
    
    if (!replyText.trim()) {
      return;
    }
    
    try {
      const result = await replyToComment(commentId, { reply: replyText });
      // Mettre à jour le commentaire avec la nouvelle réponse
      setComments(prevComments => 
        prevComments.map(comment => 
          comment.id === commentId
            ? {
                ...comment,
                replies: [...(comment.replies || []), result.reply]
              }
            : comment
        )
      );
      // Réinitialiser le champ de texte et l'état de réponse
      setReplyText('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la réponse:', error);
      alert('Une erreur est survenue lors de l\'ajout de la réponse');
    }
  };

  // Supprimer un commentaire
  const handleDeleteComment = async (commentId: number, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    
    if (!isLoggedIn) {
      return;
    }
    
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce commentaire ?')) {
      return;
    }
    
    try {
      await deleteComment(commentId);
      // Supprimer le commentaire de la liste
      setComments(prevComments => prevComments.filter(comment => comment.id !== commentId));
      // Mettre à jour le compteur de commentaires
      setCommentsPagination(prev => ({
        ...prev,
        total: Math.max(0, prev.total - 1)
      }));
    } catch (error) {
      console.error('Erreur lors de la suppression du commentaire:', error);
      alert('Une erreur est survenue lors de la suppression du commentaire');
    }
  };

  // Supprimer une réponse
  const handleDeleteReply = async (commentId: number, replyId: number, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    
    if (!isLoggedIn) {
      return;
    }
    
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette réponse ?')) {
      return;
    }
    
    try {
      await deleteReply(replyId);
      // Mettre à jour le commentaire en supprimant la réponse
      setComments(prevComments => 
        prevComments.map(comment => 
          comment.id === commentId
            ? {
                ...comment,
                replies: (comment.replies || []).filter(reply => reply.id !== replyId)
              }
            : comment
        )
      );
    } catch (error) {
      console.error('Erreur lors de la suppression de la réponse:', error);
      alert('Une erreur est survenue lors de la suppression de la réponse');
    }
  };
  
  // Open modal with product details
  const openModal = async (product: any) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
    // Arrêter tous les carrousels quand la modal est ouverte
    Object.keys(carouselIntervals.current).forEach(id => {
      stopCarousel(Number(id));
    });
    
    // Charger les commentaires
    await loadProductComments(product.id);
  };
  
  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
    setComments([]);
    setCommentsPagination({
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0
    });
    setReplyingTo(null);
    setReplyText('');
    setNewCommentText('');
    
    // Redémarrer les carrousels quand la modal est fermée
    products.forEach(product => {
      if (product.images && product.images.length > 1) {
        startCarousel(product.id);
      }
    });
  };

  // Obtenir le nombre de commentaires
  const getCommentsCount = (productId: number) => {
    // Si le produit est sélectionné, on utilise le compteur réel des commentaires
    if (selectedProduct && selectedProduct.id === productId) {
      return commentsPagination.total;
    }
    // Sinon, on utilise le compteur de commentaires du produit s'il existe
    const product = products.find(p => p.id === productId);
    return product?.commentsCount || 0;
  };

  if (isCatalogUnavailable) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ServiceUnavailableState
          title="Catalogue temporairement indisponible"
          description="Nous n'arrivons pas à charger les produits et les boutiques pour le moment. Le serveur est injoignable — réessayez dans un instant."
          onRetry={() => {
            setError(null);
            void productsQuery.refetch();
          }}
          isRetrying={productsQuery.isFetching}
          showPlaceholders
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Barre de navigation et filtres */}
      <div className="mb-8">
        {/* Barre de recherche */}
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>

        {/* Filtres et bouton toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            {/* Select pour les catégories */}
            {categories.length > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                <label className="text-sm font-medium text-gray-700">Catégorie:</label>
                <select
                  value={selectedCategory || ''}
                  onChange={(e) => handleCategoryFilter(e.target.value ? parseInt(e.target.value) : undefined)}
                  className="border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 min-w-[200px]"
                >
                  <option value="">Toutes les catégories</option>
                  {categories.map((category, index) => (
                    <option 
                      key={category.id ? `category-${category.id}` : `category-unknown-${index}`} 
                      value={category.id}
                    >
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {/* Indicateur des filtres actifs */}
            {(selectedCategory || searchTerm) && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Filtres actifs:</span>
                {selectedCategory && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {categories.find(cat => cat.id === selectedCategory)?.name || 'Catégorie'}
                    <button
                      onClick={() => handleCategoryFilter(undefined)}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}
                {searchTerm && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    "{searchTerm}"
                    <button
                      onClick={() => handleSearch('')}
                      className="ml-1 text-green-600 hover:text-green-800"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}
                <button
                  onClick={resetFilters}
                  className="text-sm text-red-600 hover:text-red-800 underline"
                >
                  Tout effacer
                </button>
              </div>
            )}
          </div>

          {/* Informations sur les résultats */}
          <div className="text-sm text-gray-500">
            {loading ? (
              'Chargement...'
            ) : (
              `${pagination.total} produit${pagination.total > 1 ? 's' : ''} trouvé${pagination.total > 1 ? 's' : ''}`
            )}
          </div>
        </div>

        {/* Filtres collapsibles supprimés car remplacés par le select */}
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader className="animate-spin text-green-500" size={32} />
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-2">Aucun produit trouvé</div>
          <p className="text-gray-500">
            {searchTerm || selectedCategory 
              ? "Essayez de modifier vos critères de recherche" 
              : "Il n'y a pas encore de produits disponibles"}
          </p>
          {(searchTerm || selectedCategory) && (
            <button
              onClick={resetFilters}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Voir tous les produits
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {products.map((product) => (
              <div 
                key={`product-${product.id}`} 
                className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden cursor-pointer"
                onClick={() => openModal(product)}
              >
                {/* Product Image Carousel */}
                <div className="relative h-48 overflow-hidden bg-gray-100">
                  {product.images && product.images.length > 0 ? (
                    <>
                      <img
                        src={getImageUrl(product, currentImages[product.id] || 0)}
                        alt={product.name}
                        className="w-full h-full object-cover transition-opacity duration-500"
                        onError={handleImageError}
                      />
                      
                      {/* Carousel Navigation */}
                      {product.images.length > 1 && (
                        <>
                          <button 
                            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-50 rounded-full p-1 hover:bg-opacity-75 transition-all"
                            onClick={(e) => navigateCarousel(product.id, 'prev', e)}
                          >
                            <ChevronLeft size={20} />
                          </button>
                          <button 
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-50 rounded-full p-1 hover:bg-opacity-75 transition-all"
                            onClick={(e) => navigateCarousel(product.id, 'next', e)}
                          >
                            <ChevronRight size={20} />
                          </button>
                          
                          {/* Carousel Indicators */}
                          <div className="absolute bottom-2 left-0 right-0 flex justify-center space-x-1">
                            {product.images.map((_: any, idx: number) => (
                              <span 
                                key={`carousel-indicator-${product.id}-${idx}`}
                                className={`h-1.5 rounded-full transition-all ${
                                  idx === (currentImages[product.id] || 0) 
                                    ? 'w-4 bg-white' 
                                    : 'w-1.5 bg-white bg-opacity-50'
                                }`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <span className="text-gray-400">Image non disponible</span>
                    </div>
                  )}
                  <button
                    className="absolute bottom-2 right-2 bg-orange-500 hover:bg-orange-600 text-white p-2 rounded-full shadow-md transition-colors z-10"
                    onClick={(e) => handleAddToCart(product, e)}
                    title="Ajouter au panier"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </button>
                  
                  {/* Message de confirmation d'ajout au panier */}
                  {cartMessages[product.id] && (
                    <div className="absolute top-2 right-2 left-2 bg-green-500 text-white py-1 px-2 rounded text-sm text-center z-20 animate-fade-in-out">
                      Produit ajouté au panier
                    </div>
                  )}
                </div>

                {/* Product Details */}
                <div className="p-4">
                  <h3 className="font-medium text-gray-800 mb-2 line-clamp-1">{product.name}</h3>
                  <p className="text-gray-500 mb-3 text-sm line-clamp-2">{product.description}</p>
                  <div className="flex justify-between items-center">
                    <div className="text-lg font-bold text-gray-900">{product.price}</div>
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center">
                        <button 
                          onClick={(e) => handleToggleLike(product.id, e)}
                          className={`mr-1 ${!isLoggedIn ? 'opacity-70 hover:opacity-100' : ''}`}
                          title={isLoggedIn ? "J'aime" : "Connectez-vous pour aimer ce produit"}
                        >
                          <Heart 
                            size={18} 
                            className={`transition-colors ${likes[product.id] ? 'fill-red-500 text-red-500' : 'text-gray-500'}`}
                          />
                        </button>
                        <span className="text-xs text-gray-500">{likesCount[product.id] || 0}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <button 
                          onClick={(e) => handleToggleDislike(product.id, e)}
                          className={`mr-1 ${!isLoggedIn ? 'opacity-70 hover:opacity-100' : ''}`}
                          title={isLoggedIn ? "Je n'aime pas" : "Connectez-vous pour ne pas aimer ce produit"}
                        >
                          <ThumbsDown
                            size={18} 
                            className={`transition-colors ${dislikes[product.id] ? 'fill-blue-500 text-blue-500' : 'text-gray-500'}`}
                          />
                        </button>
                        <span className="text-xs text-gray-500">{dislikesCount[product.id] || 0}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <MessageCircle size={18} className="text-gray-500 mr-1" />
                        <span className="text-xs text-gray-500">{getCommentsCount(product.id)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination améliorée */}
          {pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between mt-8 space-y-4 sm:space-y-0">
              {/* Informations sur la pagination */}
              <div className="text-sm text-gray-700">
                Affichage de {((pagination.page - 1) * pagination.limit) + 1} à{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} sur{' '}
                {pagination.total} produits
              </div>
              
              {/* Contrôles de pagination */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePrevPage}
                  disabled={pagination.page === 1}
                  className={`px-3 py-2 rounded-lg text-sm font-medium ${
                    pagination.page === 1 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Précédent
                </button>
                
                {/* Numéros de pages */}
                <div className="flex items-center space-x-1">
                  {getPageNumbers().map((pageNumber, index) => (
                    <React.Fragment key={`page-${index}`}>
                      {pageNumber === '...' ? (
                        <span className="px-2 py-1 text-gray-500">...</span>
                      ) : (
                        <button
                          onClick={() => goToPage(pageNumber as number)}
                          className={`w-10 h-10 rounded-lg text-sm font-medium ${
                            pagination.page === pageNumber 
                              ? 'bg-blue-500 text-white' 
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      )}
                    </React.Fragment>
                  ))}
                </div>
                
                <button
                  onClick={handleNextPage}
                  disabled={pagination.page === pagination.totalPages}
                  className={`px-3 py-2 rounded-lg text-sm font-medium ${
                    pagination.page === pagination.totalPages 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Suivant
                </button>
              </div>
            </div>
          )}
        </>
      )}
      
      {/* Modal pour afficher les détails du produit - Reste identique */}
      {isModalOpen && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-bold text-lg">{selectedProduct.name}</h3>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
              {/* Galerie d'images */}
              <div className="space-y-4">
                <div className="relative h-64 md:h-96 bg-gray-100 rounded-lg overflow-hidden">
                  {selectedProduct.images && selectedProduct.images.length > 0 ? (
                    <img
                      src={getImageUrl(selectedProduct, currentImages[selectedProduct.id] || 0)}
                      alt={selectedProduct.name}
                      className="w-full h-full object-cover cursor-zoom-in"
                      onClick={() => {
                        // Ouvrir l'image en plein écran ou dans une modal plus grande
                        if (document.fullscreenElement) {
                          document.exitFullscreen();
                        } else {
                          const elem = document.documentElement;
                          if (elem.requestFullscreen) {
                            elem.requestFullscreen();
                          }
                        }
                      }}
                      onError={handleImageError}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <span className="text-gray-400">Image non disponible</span>
                    </div>
                  )}
                </div>
                
                {/* Miniatures des images */}
                {selectedProduct.images && selectedProduct.images.length > 1 && (
                  <div className="flex overflow-x-auto space-x-2 pb-2">
                    {selectedProduct.images.map((image: any, idx: number) => (
                      <div 
                        key={`thumbnail-${selectedProduct.id}-${idx}`}
                        className={`w-16 h-16 flex-shrink-0 rounded-md overflow-hidden cursor-pointer border-2 ${
                          idx === (currentImages[selectedProduct.id] || 0) 
                            ? 'border-blue-500' 
                            : 'border-transparent'
                        }`}
                        onClick={() => setCurrentImages(prev => ({...prev, [selectedProduct.id]: idx}))}
                      >
                        <img
                          src={getImageUrl(selectedProduct, idx)}
                          alt={`${selectedProduct.name} - Image ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Détails du produit */}
              <div className="space-y-4">
                {/* Info commerçant/boutique */}
                {(selectedProduct.user || selectedProduct.shop || selectedProduct.shopId || selectedProduct.userId) && (
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg mb-4">
                    <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                    {selectedProduct.shop?.logo ? (
  <img 
    src={formatImageUrl(selectedProduct.shop.logo)}
    alt={selectedProduct.shop.name}
    className="w-full h-full object-cover"
    onError={(e) => {
      e.currentTarget.src = 'data:image/svg+xml;charset=UTF-8,...';
    }}
  />
) : selectedProduct.user?.photo ? (
  <img 
    src={formatImageUrl(selectedProduct.user.photo)}
    alt={`${selectedProduct.user.firstName} ${selectedProduct.user.lastName}`}
    className="w-full h-full object-cover"
    onError={(e) => {
      e.currentTarget.src = 'data:image/svg+xml;charset=UTF-8,...';
    }}
  />
) : (
  <div className="w-full h-full bg-purple-500 flex items-center justify-center text-white font-bold text-lg">
    {selectedProduct.shop?.name?.charAt(0) || selectedProduct.user?.firstName?.charAt(0) || 'B'}
  </div>
)}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">
                        {selectedProduct.shop?.name || (selectedProduct.user && `${selectedProduct.user.firstName} ${selectedProduct.user.lastName}`) || 'Boutique'}
                      </div>
                      <div className="text-sm text-gray-600">
                        {(selectedProduct.shop?.phoneNumber || selectedProduct.user?.phone) && (
                          <div className="flex items-center mt-1">
                            <span className="mr-1">📞</span> {selectedProduct.shop?.phoneNumber || selectedProduct.user?.phone}
                          </div>
                        )}
                        {(selectedProduct.shop?.address || selectedProduct.user?.address) && (
                          <div className="flex items-center mt-1">
                            <span className="mr-1">📍</span> {selectedProduct.shop?.address || selectedProduct.user?.address}
                          </div>
                        )}
                      </div>
                    </div>
                    <button 
                      className="bg-green-500 text-white px-3 py-1 rounded-full text-xs hover:bg-green-600 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        const shopId = selectedProduct.shopId || selectedProduct.shop?.id || selectedProduct.userId || selectedProduct.user?.id;
                        if (shopId) {
                          window.location.href = `/boutique/${shopId}`;
                        }
                      }}
                    >
                      Voir la boutique
                    </button>
                  </div>
                )}
                
                <div className="flex justify-between items-center">
                  <div className="text-2xl font-bold text-gray-900">{selectedProduct.price}</div>
                  <button 
                    className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
                    onClick={(e) => handleAddToCart(selectedProduct, e)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span>Ajouter au panier</span>
                  </button>
                </div>
                
                {/* Message de confirmation d'ajout au panier pour la modal */}
                {selectedProduct && cartMessages[selectedProduct.id] && (
                  <div className="mt-2 bg-green-500 text-white py-1 px-2 rounded text-sm text-center animate-fade-in-out">
                    Produit ajouté au panier
                  </div>
                )}
                
                {/* Caractéristiques du produit */}
                {selectedProduct.category && (
                  <div className="text-sm text-gray-500">
                    Catégorie: <span className="font-medium text-gray-700">{selectedProduct.category.name}</span>
                  </div>
                )}
                
                <p className="text-gray-700">{selectedProduct.description}</p>
                
                {/* Détails supplémentaires */}
                {selectedProduct.details && (
                  <div className="border-t pt-3 mt-3">
                    <h4 className="font-medium mb-2">Détails</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {Object.entries(selectedProduct.details).map(([key, value]) => (
                        <div key={key} className="flex items-start">
                          <span className="font-medium w-24 flex-shrink-0">{key}:</span>
                          <span className="text-gray-600">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Interactions sociales */}
                <div className="flex items-center space-x-4 pt-4 border-t">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleLike(selectedProduct.id);
                    }}
                    className={`flex items-center space-x-1 ${!isLoggedIn ? 'opacity-70 hover:opacity-100' : ''}`}
                    title={isLoggedIn ? "J'aime" : "Connectez-vous pour aimer ce produit"}
                  >
                    <Heart 
                      size={20} 
                      className={`transition-colors ${likes[selectedProduct.id] ? 'fill-red-500 text-red-500' : 'text-gray-500'}`}
                    />
                    <span className="text-sm">{likesCount[selectedProduct.id] || 0} j'aime</span>
                  </button>
                  
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleDislike(selectedProduct.id);
                    }}
                    className={`flex items-center space-x-1 ${!isLoggedIn ? 'opacity-70 hover:opacity-100' : ''}`}
                    title={isLoggedIn ? "Je n'aime pas" : "Connectez-vous pour ne pas aimer ce produit"}
                  >
                    <ThumbsDown 
                      size={20} 
                      className={`transition-colors ${dislikes[selectedProduct.id] ? 'fill-blue-500 text-blue-500' : 'text-gray-500'}`}
                    />
                    <span className="text-sm">{dislikesCount[selectedProduct.id] || 0} je n'aime pas</span>
                  </button>
                  
                  <div className="flex items-center space-x-1">
                    <MessageCircle size={20} className="text-gray-500" />
                    <span className="text-sm">{getCommentsCount(selectedProduct.id)} commentaires</span>
                  </div>
                </div>
                
                {/* Section des commentaires */}
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Commentaires ({commentsPagination.total})</h4>
                  
                  {/* Liste des commentaires */}
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
                          <div key={`comment-${comment.id}`} className="border-b pb-3 last:border-b-0">
                            {/* Commentaire */}
                            <div className="flex space-x-2">
                              <div className="w-8 h-8 rounded-full bg-gray-300 flex-shrink-0 overflow-hidden">
                                {comment.user?.photo ? (
                                  <img 
                                  src={formatImageUrl(comment.user.photo)} 
                                  alt={comment.user.firstName}
                                  className="w-full h-full object-cover"
                                    onError={(e) => { 
                                      e.currentTarget.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2232%22%20height%3D%2232%22%20viewBox%3D%220%200%2032%2032%22%3E%3Crect%20fill%3D%22%23E0E0E0%22%20width%3D%2232%22%20height%3D%2232%22%2F%3E%3Ctext%20fill%3D%22%23757575%22%20font-family%3D%22Arial%22%20font-size%3D%2216%22%20text-anchor%3D%22middle%22%20x%3D%2216%22%20y%3D%2216%22%3E%3F%3C%2Ftext%3E%3C%2Fsvg%3E'; 
                                    }}
                                  />
                                ) : (
                                  <div className="w-full h-full bg-blue-100 flex items-center justify-center text-blue-500 font-bold">
                                    {comment.user?.firstName.charAt(0).toUpperCase() || '?'}
                                  </div>
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex justify-between items-start">
                                  <div className="font-medium text-sm">
                                    {comment.user?.firstName} {comment.user?.lastName}
                                  </div>
                                  {/* Bouton supprimer si l'utilisateur est l'auteur */}
                                  {comment.user && isLoggedIn && JSON.parse(localStorage.getItem('user') || '{}').id === comment.user.id && (
                                    <button 
                                      onClick={(e) => handleDeleteComment(comment.id, e)} 
                                      className="text-gray-400 hover:text-red-500"
                                    >
                                      <X size={16} />
                                    </button>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600">{comment.comment}</p>
                                <div className="text-xs text-gray-400 mt-1">
                                  {new Date(comment.createdAt).toLocaleDateString()} à {new Date(comment.createdAt).toLocaleTimeString()}
                                </div>
                                
                                {/* Bouton Répondre */}
                                {isLoggedIn && (
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setReplyingTo(replyingTo === comment.id ? null : comment.id);
                                      setReplyText('');
                                    }} 
                                    className="text-xs text-blue-500 mt-1 hover:underline"
                                  >
                                    {replyingTo === comment.id ? 'Annuler' : 'Répondre'}
                                  </button>
                                )}
                                
                                {/* Formulaire de réponse */}
                                {replyingTo === comment.id && (
                                  <div className="mt-2 flex">
                                    <input
                                      type="text"
                                      value={replyText}
                                      onChange={(e) => setReplyText(e.target.value)}
                                      placeholder="Votre réponse..."
                                      className="flex-1 border rounded-l-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                    <button 
                                      onClick={(e) => handleReplyToComment(comment.id, e)}
                                      className="bg-blue-500 text-white px-2 py-1 rounded-r-lg text-sm hover:bg-blue-600 transition-colors"
                                    >
                                      Envoyer
                                    </button>
                                  </div>
                                )}
                                
                                {/* Réponses au commentaire */}
                                {comment.replies && comment.replies.length > 0 && (
                                  <div className="mt-2 pl-4 border-l-2 border-gray-100 space-y-2">
                                    {comment.replies.map((reply) => (
                                      <div key={`reply-${reply.id}`} className="flex space-x-2">
                                        <div className="w-6 h-6 rounded-full bg-gray-300 flex-shrink-0 overflow-hidden">
                                          {reply.user?.photo ? (
                                            <img 
                                            src={formatImageUrl(reply.user.photo)} 
                                            alt={reply.user.firstName}
                                            className="w-full h-full object-cover"
                                              onError={(e) => { 
                                                e.currentTarget.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2232%22%20height%3D%2232%22%20viewBox%3D%220%200%2032%2032%22%3E%3Crect%20fill%3D%22%23E0E0E0%22%20width%3D%2232%22%20height%3D%2232%22%2F%3E%3Ctext%20fill%3D%22%23757575%22%20font-family%3D%22Arial%22%20font-size%3D%2216%22%20text-anchor%3D%22middle%22%20x%3D%2216%22%20y%3D%2216%22%3E%3F%3C%2Ftext%3E%3C%2Fsvg%3E'; 
                                              }}
                                            />
                                          ) : (
                                            <div className="w-full h-full bg-blue-100 flex items-center justify-center text-blue-500 font-bold text-xs">
                                              {reply.user?.firstName.charAt(0).toUpperCase() || '?'}
                                            </div>
                                          )}
                                        </div>
                                        <div className="flex-1">
                                          <div className="flex justify-between items-start">
                                          <div className="font-medium text-xs">
                                              {reply.user?.firstName} {reply.user?.lastName}
                                            </div>
                                            {/* Bouton supprimer si l'utilisateur est l'auteur */}
                                            {reply.user && isLoggedIn && JSON.parse(localStorage.getItem('user') || '{}').id === reply.user.id && (
                                              <button 
                                                onClick={(e) => handleDeleteReply(comment.id, reply.id, e)} 
                                                className="text-gray-400 hover:text-red-500"
                                              >
                                                <X size={14} />
                                              </button>
                                            )}
                                          </div>
                                          <p className="text-xs text-gray-600">{reply.reply}</p>
                                          <div className="text-xs text-gray-400 mt-1">
                                            {new Date(reply.createdAt).toLocaleDateString()} à {new Date(reply.createdAt).toLocaleTimeString()}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                      
                      {/* Pagination des commentaires */}
                      {commentsPagination.totalPages > 1 && (
                        <div className="flex justify-center mt-2 space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (commentsPagination.page > 1) {
                                loadProductComments(selectedProduct.id, commentsPagination.page - 1);
                              }
                            }}
                            disabled={commentsPagination.page === 1}
                            className={`px-2 py-1 rounded text-xs ${commentsPagination.page === 1 ? 'bg-gray-200 text-gray-400' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                          >
                            Précédent
                          </button>
                          <span className="text-xs text-gray-500">
                            Page {commentsPagination.page} sur {commentsPagination.totalPages}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (commentsPagination.page < commentsPagination.totalPages) {
                                loadProductComments(selectedProduct.id, commentsPagination.page + 1);
                              }
                            }}
                            disabled={commentsPagination.page === commentsPagination.totalPages}
                            className={`px-2 py-1 rounded text-xs ${commentsPagination.page === commentsPagination.totalPages ? 'bg-gray-200 text-gray-400' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                          >
                            Suivant
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Ajouter un commentaire */}
                  <div className="mt-4 flex">
                    <input
                      type="text"
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      placeholder="Ajouter un commentaire..."
                      className="flex-1 border rounded-l-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isLoggedIn) {
                          window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
                        }
                      }}
                    />
                    <button 
                      className="bg-blue-500 text-white px-4 py-2 rounded-r-lg hover:bg-blue-600 transition-colors"
                      onClick={(e) => handleAddComment(selectedProduct.id, e)}
                      disabled={!isLoggedIn || !newCommentText.trim()}
                    >
                      Publier
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsGrid;