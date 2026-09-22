/**
 * Service dédié à la gestion des likes et réactions côté frontend
 */

// Importer les fonctions du service de configuration
import { backendUrl, getAuthToken, getAuthHeaders } from './configService';
import { unwrapPaged, unwrapRecord } from '../api/api-envelope';
import { parseApiError } from '../api/fetch-error';

function asToggleResponse(raw: unknown): ToggleLikeResponse {
  const data = unwrapRecord(raw);
  return {
    message: typeof data.message === 'string' ? data.message : 'Réaction mise à jour',
    action: typeof data.action === 'string' ? data.action : 'toggled',
    likesCount: Number(data.likesCount ?? 0),
    dislikesCount: Number(data.dislikesCount ?? 0),
  };
}

function asUserReaction(raw: unknown): UserReaction {
  const data = unwrapRecord(raw);
  if (typeof data.hasLiked === 'boolean' || typeof data.hasDisliked === 'boolean') {
    return {
      hasLiked: Boolean(data.hasLiked),
      hasDisliked: Boolean(data.hasDisliked),
    };
  }
  return {
    hasLiked: data.hasReaction === true && data.type === 'LIKE',
    hasDisliked: data.hasReaction === true && data.type === 'DISLIKE',
  };
}

// Types pour les likes et réactions
export enum ReactionType {
  LIKE = 'LIKE',
  DISLIKE = 'DISLIKE'
}

export interface ProductLike {
  id: number;
  productId: number;
  userId: number;
  type: ReactionType;
  createdAt: string;
}

export interface LikesCount {
  likesCount: number;
  dislikesCount: number;
}

export interface UserReaction {
  hasLiked: boolean;
  hasDisliked: boolean;
}

export interface ToggleLikeResponse {
  message: string;
  action: string;
  likesCount: number;
  dislikesCount: number;
}

export interface ToggleDislikeResponse {
  message: string;
  action: string;
  likesCount: number;
  dislikesCount: number;
}

/**
 * Vérifie si l'utilisateur peut accéder aux fonctionnalités de likes
 * @returns {boolean} true si l'utilisateur est connecté
 */
export const isLikesAccessible = (): boolean => {
  try {
    const token = getAuthToken();
    const hasAccess = !!token;
    
    if (hasAccess) {
      console.log('✅ [LIKES] Utilisateur connecté, accès aux likes autorisé');
    } else {
      console.log('❌ [LIKES] Utilisateur non connecté, accès aux likes refusé');
    }
    
    return hasAccess;
  } catch (error) {
    console.error('❌ [LIKES] Erreur lors de la vérification d\'accès aux likes:', error);
    return false;
  }
};

/**
 * Déconnecte l'utilisateur en cas d'erreur d'authentification
 * et redirige vers la page de connexion
 */
export const handleAuthError = (): void => {
  try {
    console.log('🔄 [LIKES] Déconnexion et redirection suite à erreur d\'authentification');
    
    // Supprimer les données d'authentification
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Rediriger vers la page de connexion
    window.location.href = '/login';
  } catch (error) {
    console.error('❌ [LIKES] Erreur lors de la gestion de l\'erreur d\'authentification:', error);
  }
};

/**
 * Ajoute/retire un like à un produit
 * @param {number} productId - L'ID du produit à liker/unliker
 * @returns {Promise<ToggleLikeResponse>} Le résultat de l'opération
 */
export const toggleProductLike = async (productId: number): Promise<ToggleLikeResponse> => {
  try {
    console.log('🔄 [LIKES] Toggle like d\'un produit');
    console.log('📦 [LIKES] ID du produit:', productId);
    
    // Vérifier si l'utilisateur est connecté
    const token = getAuthToken();
    if (!token) {
      throw new Error('Vous devez être connecté pour aimer un produit');
    }
    
    // Appeler l'API pour liker/unliker le produit
    const response = await fetch(`${backendUrl}/products/${productId}/like`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    
    console.log('📊 [LIKES] Statut de la réponse de toggle like:', response.status);
    
    if (response.status === 401) {
      // Si l'authentification a échoué, déconnecter l'utilisateur et rediriger
      console.error('❌ [LIKES] Erreur d\'authentification, déconnexion forcée');
      handleAuthError();
      throw new Error('Session expirée, veuillez vous reconnecter');
    }
    
    if (!response.ok) {
      throw await parseApiError(response, 'Erreur lors de la gestion du like');
    }

    return asToggleResponse(await response.json());
  } catch (error) {
    console.error('❌ [LIKES] Erreur:', error);
    throw error;
  }
};

/**
 * Ajoute/retire un dislike à un produit
 * @param {number} productId - L'ID du produit à disliker/undisliker
 * @returns {Promise<ToggleDislikeResponse>} Le résultat de l'opération
 */
export const toggleProductDislike = async (productId: number): Promise<ToggleDislikeResponse> => {
  try {
    console.log('🔄 [LIKES] Toggle dislike d\'un produit');
    console.log('📦 [LIKES] ID du produit:', productId);
    
    // Vérifier si l'utilisateur est connecté
    const token = getAuthToken();
    if (!token) {
      // Rediriger vers la page de connexion
      window.location.href = '/login';
      throw new Error('Vous devez être connecté pour ne pas aimer un produit');
    }
    
    // Appeler l'API pour disliker/undisliker le produit
    const response = await fetch(`${backendUrl}/products/${productId}/dislike`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    
    console.log('📊 [LIKES] Statut de la réponse de toggle dislike:', response.status);
    
    if (response.status === 401) {
      // Si l'authentification a échoué, déconnecter l'utilisateur et rediriger
      console.error('❌ [LIKES] Erreur d\'authentification, déconnexion forcée');
      handleAuthError();
      throw new Error('Session expirée, veuillez vous reconnecter');
    }
    
    if (!response.ok) {
      throw await parseApiError(response, 'Erreur lors de la gestion du dislike');
    }

    return asToggleResponse(await response.json());
  } catch (error) {
    console.error('❌ [LIKES] Erreur:', error);
    throw error;
  }
};

/**
 * Récupère le nombre de likes et dislikes d'un produit
 * @param {number} productId - L'ID du produit
 * @returns {Promise<LikesCount>} Le nombre de likes et dislikes
 */
export const getProductLikesCount = async (productId: number): Promise<LikesCount> => {
  try {
    console.log('🔄 [LIKES] Récupération du nombre de likes');
    console.log('📦 [LIKES] ID du produit:', productId);
    
    const [likesResponse, dislikesResponse] = await Promise.all([
      fetch(`${backendUrl}/products/${productId}/likes?type=LIKE&page=1&limit=1`),
      fetch(`${backendUrl}/products/${productId}/likes?type=DISLIKE&page=1&limit=1`),
    ]);

    const likesPage = likesResponse.ok
      ? unwrapPaged(await likesResponse.json(), 'likes', { page: 1, limit: 1 })
      : { items: [], pagination: { total: 0, page: 1, limit: 1, totalPages: 0 } };
    const dislikesPage = dislikesResponse.ok
      ? unwrapPaged(await dislikesResponse.json(), 'likes', { page: 1, limit: 1 })
      : { items: [], pagination: { total: 0, page: 1, limit: 1, totalPages: 0 } };

    return {
      likesCount: likesPage.pagination.total,
      dislikesCount: dislikesPage.pagination.total,
    };
  } catch (error) {
    console.error('❌ [LIKES] Erreur lors de la récupération des compteurs:', error);
    
    // En cas d'erreur, retourner des valeurs par défaut
    return {
      likesCount: 0,
      dislikesCount: 0
    };
  }
};

/**
 * Vérifie si l'utilisateur a aimé ou non un produit
 * @param {number} productId - L'ID du produit
 * @returns {Promise<UserReaction>} La réaction de l'utilisateur
 */
export const getUserProductReaction = async (productId: number): Promise<UserReaction> => {
  try {
    console.log('🔄 [LIKES] Vérification de la réaction utilisateur');
    console.log('📦 [LIKES] ID du produit:', productId);
    
    // Vérifier si l'utilisateur est connecté
    if (!isLikesAccessible()) {
      console.log('⚠️ [LIKES] Utilisateur non connecté, retour par défaut');
      return {
        hasLiked: false,
        hasDisliked: false
      };
    }
    
    // Récupérer le token d'authentification
    const token = getAuthToken();
    if (!token) {
      return {
        hasLiked: false,
        hasDisliked: false
      };
    }
    
    // Appeler l'API pour vérifier la réaction de l'utilisateur
    const response = await fetch(`${backendUrl}/products/${productId}/user-reaction`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    console.log('📊 [LIKES] Statut de la réponse de vérification de réaction:', response.status);
    
    if (response.status === 401) {
      // Si l'authentification a échoué, déconnecter l'utilisateur et rediriger
      console.error('❌ [LIKES] Erreur d\'authentification, déconnexion forcée');
      handleAuthError();
      throw new Error('Session expirée, veuillez vous reconnecter');
    }
    
    if (!response.ok) {
      throw await parseApiError(response, 'Erreur lors de la vérification de la réaction');
    }

    return asUserReaction(await response.json());
  } catch (error) {
    console.error('❌ [LIKES] Erreur lors de la vérification de la réaction:', error);
    
    // En cas d'erreur, on suppose que l'utilisateur n'a pas réagi
    return {
      hasLiked: false,
      hasDisliked: false
    };
  }
};

/**
 * Obtenir les statistiques complètes de likes d'un produit
 * @param {number} productId - L'ID du produit
 * @returns {Promise<{likesCount: LikesCount, userReaction: UserReaction}>} Statistiques complètes
 */
export const getProductLikesStats = async (productId: number): Promise<{likesCount: LikesCount, userReaction: UserReaction}> => {
  try {
    console.log('🔄 [LIKES] Récupération des statistiques complètes de likes');
    console.log('📦 [LIKES] ID du produit:', productId);
    
    // Récupérer les compteurs et la réaction utilisateur en parallèle
    const [likesCount, userReaction] = await Promise.all([
      getProductLikesCount(productId),
      getUserProductReaction(productId)
    ]);
    
    console.log('✅ [LIKES] Statistiques complètes récupérées avec succès');
    
    return {
      likesCount,
      userReaction
    };
  } catch (error) {
    console.error('❌ [LIKES] Erreur lors de la récupération des statistiques complètes:', error);
    
    // En cas d'erreur, retourner des valeurs par défaut
    return {
      likesCount: {
        likesCount: 0,
        dislikesCount: 0
      },
      userReaction: {
        hasLiked: false,
        hasDisliked: false
      }
    };
  }
};

/**
 * Réinitialiser la réaction d'un utilisateur (retirer like et dislike)
 * @param {number} productId - L'ID du produit
 * @returns {Promise<ToggleLikeResponse>} Le résultat de l'opération
 */
export const resetUserReaction = async (productId: number): Promise<ToggleLikeResponse> => {
  try {
    console.log('🔄 [LIKES] Réinitialisation de la réaction utilisateur');
    console.log('📦 [LIKES] ID du produit:', productId);
    
    // Vérifier si l'utilisateur est connecté
    const token = getAuthToken();
    if (!token) {
      throw new Error('Vous devez être connecté pour réinitialiser votre réaction');
    }
    
    // Récupérer d'abord la réaction actuelle
    const currentReaction = await getUserProductReaction(productId);
    
    // Si l'utilisateur a liké, retirer le like
    if (currentReaction.hasLiked) {
      return await toggleProductLike(productId);
    }
    
    // Si l'utilisateur a disliké, retirer le dislike
    if (currentReaction.hasDisliked) {
      return await toggleProductDislike(productId);
    }
    
    // Si l'utilisateur n'a pas de réaction, retourner les compteurs actuels
    const likesCount = await getProductLikesCount(productId);
    
    console.log('✅ [LIKES] Aucune réaction à réinitialiser');
    
    return {
      message: 'Aucune réaction à réinitialiser',
      action: 'none',
      likesCount: likesCount.likesCount,
      dislikesCount: likesCount.dislikesCount
    };
  } catch (error) {
    console.error('❌ [LIKES] Erreur lors de la réinitialisation de la réaction:', error);
    throw error;
  }
};

/**
 * Vérifier si un utilisateur peut interagir avec les likes
 * @returns {boolean} true si l'utilisateur peut interagir avec les likes
 */
export const canInteractWithLikes = (): boolean => {
  try {
    const hasAccess = isLikesAccessible();
    
    console.log('🔍 [LIKES] Vérification des droits d\'interaction avec les likes:', hasAccess);
    
    return hasAccess;
  } catch (error) {
    console.error('❌ [LIKES] Erreur lors de la vérification des droits d\'interaction:', error);
    return false;
  }
};

/**
 * Obtenir le pourcentage de likes positifs
 * @param {LikesCount} likesCount - Les compteurs de likes
 * @returns {number} Pourcentage de likes positifs (0-100)
 */
export const getLikesPercentage = (likesCount: LikesCount): number => {
  try {
    const total = likesCount.likesCount + likesCount.dislikesCount;
    
    if (total === 0) {
      console.log('📊 [LIKES] Aucune réaction, pourcentage = 0');
      return 0;
    }
    
    const percentage = Math.round((likesCount.likesCount / total) * 100);
    console.log('📊 [LIKES] Pourcentage de likes positifs:', percentage + '%');
    
    return percentage;
  } catch (error) {
    console.error('❌ [LIKES] Erreur lors du calcul du pourcentage:', error);
    return 0;
  }
};

/**
 * Utilitaire pour vérifier et afficher les informations des likes
 * Utile pour déboguer les problèmes liés aux likes
 * @param {number} productId - L'ID du produit
 */
export const debugLikesInfo = async (productId: number): Promise<void> => {
  try {
    console.log('🔍 [LIKES] Débogage des informations des likes');
    console.log('📦 [LIKES] ID du produit:', productId);
    
    // Vérifier l'accès aux likes
    const hasAccess = isLikesAccessible();
    console.log('🔐 [LIKES] Accès aux likes:', hasAccess);
    
    // Vérifier le token
    const token = getAuthToken();
    console.log('🔑 [LIKES] Token présent:', !!token);
    
    if (token) {
      console.log('🔑 [LIKES] Aperçu du token:', token.substring(0, 20) + '...');
    }
    
    // Vérifier les droits d'interaction
    const canInteract = canInteractWithLikes();
    console.log('🤝 [LIKES] Peut interagir avec les likes:', canInteract);
    
    // Récupérer les informations utilisateur
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      console.log('👤 [LIKES] Utilisateur connecté:', {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      });
    } else {
      console.log('❌ [LIKES] Aucune information utilisateur trouvée');
    }
    
    // Récupérer les statistiques complètes
    try {
      const stats = await getProductLikesStats(productId);
      const percentage = getLikesPercentage(stats.likesCount);
      
      console.log('📊 [LIKES] Statistiques complètes:', {
        likesCount: stats.likesCount.likesCount,
        dislikesCount: stats.likesCount.dislikesCount,
        total: stats.likesCount.likesCount + stats.likesCount.dislikesCount,
        percentage: percentage + '%',
        userHasLiked: stats.userReaction.hasLiked,
        userHasDisliked: stats.userReaction.hasDisliked
      });
    } catch (e) {
      console.error('❌ [LIKES] Erreur lors de la récupération des statistiques pour le debug:', e);
    }
  } catch (error) {
    console.error('❌ [LIKES] Erreur lors du débogage:', error);
  }
};