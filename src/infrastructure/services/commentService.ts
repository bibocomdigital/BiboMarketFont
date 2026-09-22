/**
 * Service dédié à la gestion des commentaires côté frontend
 */

// Importer les fonctions du service de configuration
import { backendUrl, getAuthToken, getAuthHeaders } from './configService';
import { unwrapPaged, unwrapRecord } from '../api/api-envelope';
import { parseApiError } from '../api/fetch-error';

// Types pour les commentaires
export interface Comment {
  id: number;
  productId: number;
  userId: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    photo?: string;
  };
  replies?: Reply[];
}

export interface Reply {
  id: number;
  commentId: number;
  userId: number;
  reply: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    photo?: string;
  };
}

export interface NewComment {
  comment: string;
}

export interface NewReply {
  reply: string;
}

export interface PaginatedComments {
  comments: Comment[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AddCommentResponse {
  message: string;
  comment: Comment;
}

export interface AddReplyResponse {
  message: string;
  reply: Reply;
}

export interface UpdateCommentResponse {
  message: string;
  comment: Comment;
}

export interface DeleteResponse {
  message: string;
}

/**
 * Vérifie si l'utilisateur peut accéder aux fonctionnalités de commentaires
 * @returns {boolean} true si l'utilisateur est connecté
 */
export const isCommentsAccessible = (): boolean => {
  try {
    const token = getAuthToken();
    const hasAccess = !!token;
    
    if (hasAccess) {
      console.log('✅ [COMMENTS] Utilisateur connecté, accès aux commentaires autorisé');
    } else {
      console.log('❌ [COMMENTS] Utilisateur non connecté, accès aux commentaires refusé');
    }
    
    return hasAccess;
  } catch (error) {
    console.error('❌ [COMMENTS] Erreur lors de la vérification d\'accès aux commentaires:', error);
    return false;
  }
};

/**
 * Déconnecte l'utilisateur en cas d'erreur d'authentification
 * et redirige vers la page de connexion
 */
export const handleAuthError = (): void => {
  try {
    console.log('🔄 [COMMENTS] Déconnexion et redirection suite à erreur d\'authentification');
    
    // Supprimer les données d'authentification
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Rediriger vers la page de connexion
    window.location.href = '/login';
  } catch (error) {
    console.error('❌ [COMMENTS] Erreur lors de la gestion de l\'erreur d\'authentification:', error);
  }
};

/**
 * Ajoute un commentaire à un produit
 * @param {number} productId - L'ID du produit à commenter
 * @param {NewComment} commentData - Le contenu du commentaire à ajouter
 * @returns {Promise<AddCommentResponse>} Le résultat de l'opération avec le commentaire ajouté
 */
export const addComment = async (productId: number, commentData: NewComment): Promise<AddCommentResponse> => {
  try {
    console.log('🔄 [COMMENTS] Ajout d\'un commentaire');
    console.log('📦 [COMMENTS] ID du produit:', productId);
    console.log('💬 [COMMENTS] Contenu du commentaire:', commentData.comment.substring(0, 50) + '...');
    
    // Vérifier si l'utilisateur est connecté
    const token = getAuthToken();
    if (!token) {
      throw new Error('Vous devez être connecté pour commenter un produit');
    }
    
    // Appeler l'API pour ajouter le commentaire
    const response = await fetch(`${backendUrl}/products/${productId}/comments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(commentData)
    });
    
    console.log('📊 [COMMENTS] Statut de la réponse d\'ajout:', response.status);
    
    if (response.status === 401) {
      // Si l'authentification a échoué, déconnecter l'utilisateur et rediriger
      console.error('❌ [COMMENTS] Erreur d\'authentification, déconnexion forcée');
      handleAuthError();
      throw new Error('Session expirée, veuillez vous reconnecter');
    }
    
    if (!response.ok) {
      throw await parseApiError(response, "Erreur lors de l'ajout du commentaire");
    }

    const data = unwrapRecord(await response.json());
    return {
      message: typeof data.message === 'string' ? data.message : 'Commentaire ajouté',
      comment: data.comment as Comment,
    };
  } catch (error) {
    console.error('❌ [COMMENTS] Erreur:', error);
    throw error;
  }
};

/**
 * Récupère les commentaires d'un produit avec pagination
 * @param {number} productId - L'ID du produit
 * @param {number} page - Numéro de la page (défaut: 1)
 * @param {number} limit - Nombre de commentaires par page (défaut: 10)
 * @returns {Promise<PaginatedComments>} La liste paginée des commentaires
 */
export const getProductComments = async (productId: number, page: number = 1, limit: number = 10): Promise<PaginatedComments> => {
  try {
    console.log('🔄 [COMMENTS] Récupération des commentaires');
    console.log('📦 [COMMENTS] ID du produit:', productId);
    console.log('📄 [COMMENTS] Page:', page, '- Limite:', limit);
    
    // Appeler l'API pour récupérer les commentaires avec pagination
    const response = await fetch(`${backendUrl}/products/${productId}/comments?page=${page}&limit=${limit}`);
    
    console.log('📊 [COMMENTS] Statut de la réponse de récupération:', response.status);
    
    if (!response.ok) {
      return {
        comments: [],
        pagination: {
          total: 0,
          page,
          limit,
          totalPages: 0,
        },
      };
    }

    const { items, pagination } = unwrapPaged<Comment>(
      await response.json(),
      'comments',
      { page, limit },
    );
    return { comments: items, pagination };
  } catch (error) {
    console.error('❌ [COMMENTS] Erreur lors de la récupération des commentaires:', error);
    
    // En cas d'erreur, retourner un objet avec tableau vide et pagination par défaut
    return {
      comments: [],
      pagination: {
        total: 0,
        page: page,
        limit: limit,
        totalPages: 0
      }
    };
  }
};

/**
 * Ajoute une réponse à un commentaire
 * @param {number} commentId - L'ID du commentaire auquel répondre
 * @param {NewReply} replyData - Le contenu de la réponse
 * @returns {Promise<AddReplyResponse>} Le résultat de l'opération avec la réponse ajoutée
 */
export const replyToComment = async (commentId: number, replyData: NewReply): Promise<AddReplyResponse> => {
  try {
    console.log('🔄 [COMMENTS] Ajout d\'une réponse à un commentaire');
    console.log('🆔 [COMMENTS] ID du commentaire:', commentId);
    console.log('💬 [COMMENTS] Contenu de la réponse:', replyData.reply.substring(0, 50) + '...');
    
    // Vérifier si l'utilisateur est connecté
    const token = getAuthToken();
    if (!token) {
      throw new Error('Vous devez être connecté pour répondre à un commentaire');
    }
    
    // Appeler l'API pour ajouter la réponse
    const response = await fetch(`${backendUrl}/comments/${commentId}/replies`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(replyData)
    });
    
    console.log('📊 [COMMENTS] Statut de la réponse d\'ajout de réponse:', response.status);
    
    if (response.status === 401) {
      // Si l'authentification a échoué, déconnecter l'utilisateur et rediriger
      console.error('❌ [COMMENTS] Erreur d\'authentification, déconnexion forcée');
      handleAuthError();
      throw new Error('Session expirée, veuillez vous reconnecter');
    }
    
    if (!response.ok) {
      throw await parseApiError(response, "Erreur lors de l'ajout de la réponse");
    }

    const data = unwrapRecord(await response.json());
    return {
      message: typeof data.message === 'string' ? data.message : 'Réponse ajoutée',
      reply: data.reply as Reply,
    };
  } catch (error) {
    console.error('❌ [COMMENTS] Erreur:', error);
    throw error;
  }
};

/**
 * Met à jour un commentaire
 * @param {number} commentId - L'ID du commentaire à mettre à jour
 * @param {NewComment} commentData - Le nouveau contenu du commentaire
 * @returns {Promise<UpdateCommentResponse>} Le résultat de l'opération avec le commentaire mis à jour
 */
export const updateComment = async (commentId: number, commentData: NewComment): Promise<UpdateCommentResponse> => {
  try {
    console.log('🔄 [COMMENTS] Mise à jour d\'un commentaire');
    console.log('🆔 [COMMENTS] ID du commentaire:', commentId);
    console.log('💬 [COMMENTS] Nouveau contenu:', commentData.comment.substring(0, 50) + '...');
    
    // Vérifier si l'utilisateur est connecté
    const token = getAuthToken();
    if (!token) {
      throw new Error('Vous devez être connecté pour modifier un commentaire');
    }
    
    // Appeler l'API pour mettre à jour le commentaire
    const response = await fetch(`${backendUrl}/comments/${commentId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(commentData)
    });
    
    console.log('📊 [COMMENTS] Statut de la réponse de mise à jour:', response.status);
    
    if (response.status === 401) {
      // Si l'authentification a échoué, déconnecter l'utilisateur et rediriger
      console.error('❌ [COMMENTS] Erreur d\'authentification, déconnexion forcée');
      handleAuthError();
      throw new Error('Session expirée, veuillez vous reconnecter');
    }
    
    if (!response.ok) {
      throw await parseApiError(response, 'Erreur lors de la mise à jour du commentaire');
    }

    const data = unwrapRecord(await response.json());
    return {
      message: typeof data.message === 'string' ? data.message : 'Commentaire mis à jour',
      comment: data.comment as Comment,
    };
  } catch (error) {
    console.error('❌ [COMMENTS] Erreur:', error);
    throw error;
  }
};

/**
 * Supprime un commentaire
 * @param {number} commentId - L'ID du commentaire à supprimer
 * @returns {Promise<DeleteResponse>} Le résultat de l'opération
 */
export const deleteComment = async (commentId: number): Promise<DeleteResponse> => {
  try {
    console.log('🔄 [COMMENTS] Suppression d\'un commentaire');
    console.log('🆔 [COMMENTS] ID du commentaire à supprimer:', commentId);
    
    // Vérifier si l'utilisateur est connecté
    const token = getAuthToken();
    if (!token) {
      throw new Error('Vous devez être connecté pour supprimer un commentaire');
    }
    
    // Appeler l'API pour supprimer le commentaire
    const response = await fetch(`${backendUrl}/comments/${commentId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    console.log('📊 [COMMENTS] Statut de la réponse de suppression:', response.status);
    
    if (response.status === 401) {
      // Si l'authentification a échoué, déconnecter l'utilisateur et rediriger
      console.error('❌ [COMMENTS] Erreur d\'authentification, déconnexion forcée');
      handleAuthError();
      throw new Error('Session expirée, veuillez vous reconnecter');
    }
    
    if (!response.ok) {
      throw await parseApiError(response, 'Erreur lors de la suppression du commentaire');
    }

    const data = unwrapRecord(await response.json());
    return {
      message: typeof data.message === 'string' ? data.message : 'Commentaire supprimé',
    };
  } catch (error) {
    console.error('❌ [COMMENTS] Erreur:', error);
    throw error;
  }
};

/**
 * Supprime une réponse à un commentaire
 * @param {number} replyId - L'ID de la réponse à supprimer
 * @returns {Promise<DeleteResponse>} Le résultat de l'opération
 */
export const deleteReply = async (replyId: number): Promise<DeleteResponse> => {
  try {
    console.log('🔄 [COMMENTS] Suppression d\'une réponse');
    console.log('🆔 [COMMENTS] ID de la réponse à supprimer:', replyId);
    
    // Vérifier si l'utilisateur est connecté
    const token = getAuthToken();
    if (!token) {
      throw new Error('Vous devez être connecté pour supprimer une réponse');
    }
    
    // Appeler l'API pour supprimer la réponse
    const response = await fetch(`${backendUrl}/replies/${replyId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    console.log('📊 [COMMENTS] Statut de la réponse de suppression de réponse:', response.status);
    
    if (response.status === 401) {
      // Si l'authentification a échoué, déconnecter l'utilisateur et rediriger
      console.error('❌ [COMMENTS] Erreur d\'authentification, déconnexion forcée');
      handleAuthError();
      throw new Error('Session expirée, veuillez vous reconnecter');
    }
    
    if (!response.ok) {
      throw await parseApiError(response, 'Erreur lors de la suppression de la réponse');
    }

    const data = unwrapRecord(await response.json());
    return {
      message: typeof data.message === 'string' ? data.message : 'Réponse supprimée',
    };
  } catch (error) {
    console.error('❌ [COMMENTS] Erreur:', error);
    throw error;
  }
};

/**
 * Obtenir le nombre total de commentaires d'un produit
 * @param {number} productId - L'ID du produit
 * @returns {Promise<number>} Nombre total de commentaires
 */
export const getCommentsCount = async (productId: number): Promise<number> => {
  try {
    console.log('🔄 [COMMENTS] Calcul du nombre de commentaires');
    console.log('📦 [COMMENTS] ID du produit:', productId);
    
    // Récupérer les commentaires avec pagination pour obtenir le total
    const result = await getProductComments(productId, 1, 1);
    const count = result.pagination.total;
    
    console.log('✅ [COMMENTS] Nombre total de commentaires:', count);
    return count;
  } catch (error) {
    console.error('❌ [COMMENTS] Erreur lors du calcul du nombre de commentaires:', error);
    return 0;
  }
};

/**
 * Vérifier si un utilisateur peut modifier un commentaire
 * @param {Comment} comment - Le commentaire à vérifier
 * @returns {boolean} true si l'utilisateur peut modifier le commentaire
 */
export const canEditComment = (comment: Comment): boolean => {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      console.log('❌ [COMMENTS] Aucun utilisateur connecté pour vérifier les droits d\'édition');
      return false;
    }
    
    const user = JSON.parse(userStr);
    const canEdit = Number(user.id) === Number(comment.userId);
    
    console.log('🔍 [COMMENTS] Vérification des droits d\'édition:', {
      userId: user.id,
      commentUserId: comment.userId,
      canEdit: canEdit
    });
    
    return canEdit;
  } catch (error) {
    console.error('❌ [COMMENTS] Erreur lors de la vérification des droits d\'édition:', error);
    return false;
  }
};

/**
 * Vérifier si un utilisateur peut supprimer un commentaire
 * @param {Comment} comment - Le commentaire à vérifier
 * @returns {boolean} true si l'utilisateur peut supprimer le commentaire
 */
export const canDeleteComment = (comment: Comment): boolean => {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      console.log('❌ [COMMENTS] Aucun utilisateur connecté pour vérifier les droits de suppression');
      return false;
    }
    
    const user = JSON.parse(userStr);
    const canDelete = Number(user.id) === Number(comment.userId);
    
    console.log('🔍 [COMMENTS] Vérification des droits de suppression:', {
      userId: user.id,
      commentUserId: comment.userId,
      canDelete: canDelete
    });
    
    return canDelete;
  } catch (error) {
    console.error('❌ [COMMENTS] Erreur lors de la vérification des droits de suppression:', error);
    return false;
  }
};

/**
 * Utilitaire pour vérifier et afficher les informations des commentaires
 * Utile pour déboguer les problèmes liés aux commentaires
 * @param {number} productId - L'ID du produit
 */
export const debugCommentsInfo = async (productId: number): Promise<void> => {
  try {
    console.log('🔍 [COMMENTS] Débogage des informations des commentaires');
    console.log('📦 [COMMENTS] ID du produit:', productId);
    
    // Vérifier l'accès aux commentaires
    const hasAccess = isCommentsAccessible();
    console.log('🔐 [COMMENTS] Accès aux commentaires:', hasAccess);
    
    // Vérifier le token
    const token = getAuthToken();
    console.log('🔑 [COMMENTS] Token présent:', !!token);
    
    if (token) {
      console.log('🔑 [COMMENTS] Aperçu du token:', token.substring(0, 20) + '...');
    }
    
    // Récupérer les informations utilisateur
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      console.log('👤 [COMMENTS] Utilisateur connecté:', {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      });
    } else {
      console.log('❌ [COMMENTS] Aucune information utilisateur trouvée');
    }
    
    // Récupérer les commentaires
    try {
      const result = await getProductComments(productId);
      console.log('📊 [COMMENTS] Statistiques des commentaires:', {
        total: result.pagination.total,
        pages: result.pagination.totalPages,
        commentairesAffiches: result.comments.length
      });
      
      // Afficher les détails de chaque commentaire
      result.comments.forEach((comment, index) => {
        console.log(`📝 [COMMENTS] Commentaire #${index + 1}:`, {
          id: comment.id,
          utilisateur: comment.user ? `${comment.user.firstName} ${comment.user.lastName}` : 'Inconnu',
          texte: comment.comment.substring(0, 50) + (comment.comment.length > 50 ? '...' : ''),
          date: new Date(comment.createdAt).toLocaleString(),
          reponses: comment.replies ? comment.replies.length : 0
        });
      });
    } catch (e) {
      console.error('❌ [COMMENTS] Erreur lors de la récupération des commentaires pour le debug:', e);
    }
  } catch (error) {
    console.error('❌ [COMMENTS] Erreur lors du débogage:', error);
  }
};