/**
 * Service dédié à la gestion des abonnements entre utilisateurs côté frontend
 */

// Importer les fonctions du service de configuration
import { backendUrl, getAuthToken, getAuthHeaders, handleApiError } from './configService';

// Types pour les abonnements
export interface User {
  id: number;
  firstName: string;
  lastName: string;
  photo: string | null;
  role: string;
}

export interface Follower extends User {
  followedAt: string;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface FollowResponse {
  message: string;
  action: 'followed' | 'unfollowed';
  followerCount: number;
  userToFollow: User;
}

export interface FollowersResponse {
  followers: Follower[];
  pagination: Pagination;
}

export interface FollowingResponse {
  following: Follower[];
  pagination: Pagination;
}

export interface IsFollowingResponse {
  isFollowing: boolean;
}

export interface SuggestedUsersResponse {
  suggestions: Array<User & { followerCount: number }>;
}

/**
 * Suivre ou ne plus suivre un utilisateur (toggle)
 * @param {number} userId L'ID de l'utilisateur à suivre ou ne plus suivre
 * @returns {Promise<FollowResponse>} La réponse avec les informations sur l'action effectuée
 */
export const toggleFollow = async (userId: number): Promise<FollowResponse> => {
  try {
    console.log(`🔄 [SUBSCRIPTION] Basculement du suivi pour l'utilisateur ID ${userId}`);
    
    // Récupérer le token d'authentification
    const token = getAuthToken();
    if (!token) {
      throw new Error('Vous devez être connecté pour suivre ou ne plus suivre un utilisateur');
    }
    
    // Appeler l'API pour basculer le suivi
    const response = await fetch(`${backendUrl}/users/${userId}/toggle-follow`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return handleApiError(errorData, 'Erreur lors du basculement du suivi');
    }
    
    const data = await response.json();
    console.log(`✅ [SUBSCRIPTION] Suivi basculé avec succès: ${data.action}`);
    
    return data;
  } catch (error) {
    console.error('❌ [SUBSCRIPTION] Erreur:', error);
    throw error;
  }
};

/**
 * Récupère la liste des abonnés d'un utilisateur
 * @param {number} userId L'ID de l'utilisateur
 * @param {number} page La page à récupérer
 * @param {number} limit Le nombre d'abonnés par page
 * @returns {Promise<FollowersResponse>} La liste des abonnés avec la pagination
 */
export const getUserFollowers = async (
  userId: number, 
  page: number = 1, 
  limit: number = 20
): Promise<FollowersResponse> => {
  try {
    console.log(`🔄 [SUBSCRIPTION] Récupération des abonnés de l'utilisateur ID ${userId}`);
    
    // Appeler l'API pour récupérer les abonnés
    const response = await fetch(
      `${backendUrl}/users/${userId}/followers?page=${page}&limit=${limit}`
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      return handleApiError(errorData, 'Erreur lors de la récupération des abonnés');
    }
    
    const data = await response.json();
    console.log(`✅ [SUBSCRIPTION] Abonnés récupérés avec succès: ${data.followers.length}`);
    
    return data;
  } catch (error) {
    console.error('❌ [SUBSCRIPTION] Erreur:', error);
    throw error;
  }
};

/**
 * Récupère la liste des abonnements d'un utilisateur
 * @param {number} userId L'ID de l'utilisateur
 * @param {number} page La page à récupérer
 * @param {number} limit Le nombre d'abonnements par page
 * @returns {Promise<FollowingResponse>} La liste des abonnements avec la pagination
 */
export const getUserFollowing = async (
  userId: number, 
  page: number = 1, 
  limit: number = 20
): Promise<FollowingResponse> => {
  try {
    console.log(`🔄 [SUBSCRIPTION] Récupération des abonnements de l'utilisateur ID ${userId}`);
    
    // Appeler l'API pour récupérer les abonnements
    const response = await fetch(
      `${backendUrl}/users/${userId}/following?page=${page}&limit=${limit}`
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      return handleApiError(errorData, 'Erreur lors de la récupération des abonnements');
    }
    
    const data = await response.json();
    console.log(`✅ [SUBSCRIPTION] Abonnements récupérés avec succès: ${data.following.length}`);
    
    return data;
  } catch (error) {
    console.error('❌ [SUBSCRIPTION] Erreur:', error);
    throw error;
  }
};

/**
 * Vérifie si l'utilisateur connecté suit un autre utilisateur
 * @param {number} userId L'ID de l'utilisateur à vérifier
 * @returns {Promise<IsFollowingResponse>} Le résultat de la vérification
 */
export const checkIfFollowing = async (userId: number): Promise<IsFollowingResponse> => {
  try {
    console.log(`🔄 [SUBSCRIPTION] Vérification si l'utilisateur suit l'ID ${userId}`);
    
    // Récupérer le token d'authentification
    const token = getAuthToken();
    if (!token) {
      throw new Error('Vous devez être connecté pour vérifier si vous suivez un utilisateur');
    }
    
    // Appeler l'API pour vérifier le suivi
    const response = await fetch(`${backendUrl}/users/${userId}/isFollowing`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return handleApiError(errorData, 'Erreur lors de la vérification du suivi');
    }
    
    const data = await response.json();
    console.log(`✅ [SUBSCRIPTION] Vérification de suivi réussie: ${data.isFollowing ? 'Suit' : 'Ne suit pas'}`);
    
    return data;
  } catch (error) {
    console.error('❌ [SUBSCRIPTION] Erreur:', error);
    throw error;
  }
};

/**
 * Récupère des suggestions d'utilisateurs à suivre
 * @param {number} limit Le nombre de suggestions à récupérer
 * @returns {Promise<SuggestedUsersResponse>} La liste des utilisateurs suggérés
 */
export const getSuggestedUsers = async (limit: number = 10): Promise<SuggestedUsersResponse> => {
  try {
    console.log(`🔄 [SUBSCRIPTION] Récupération de ${limit} suggestions d'utilisateurs à suivre`);
    
    // Récupérer le token d'authentification
    const token = getAuthToken();
    if (!token) {
      throw new Error('Vous devez être connecté pour obtenir des suggestions d\'utilisateurs');
    }
    
    // Appeler l'API pour récupérer les suggestions
    const response = await fetch(`${backendUrl}/users/suggestions?limit=${limit}`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return handleApiError(errorData, 'Erreur lors de la récupération des suggestions');
    }
    
    const data = await response.json();
    console.log(`✅ [SUBSCRIPTION] Suggestions récupérées avec succès: ${data.suggestions.length}`);
    
    return data;
  } catch (error) {
    console.error('❌ [SUBSCRIPTION] Erreur:', error);
    throw error;
  }
};

/**
 * Utilitaire pour vérifier et afficher les statistiques de suivi pour un utilisateur
 * @param {number} userId L'ID de l'utilisateur
 */
export const debugFollowStats = async (userId: number): Promise<void> => {
  try {
    console.log(`🔍 [SUBSCRIPTION] Débogage des statistiques de suivi pour l'utilisateur ID ${userId}`);
    
    // Récupérer le nombre d'abonnés
    const followersResponse = await getUserFollowers(userId, 1, 1);
    console.log(`👥 [SUBSCRIPTION] Nombre total d'abonnés: ${followersResponse.pagination.total}`);
    
    // Récupérer le nombre d'abonnements
    const followingResponse = await getUserFollowing(userId, 1, 1);
    console.log(`👥 [SUBSCRIPTION] Nombre total d'abonnements: ${followingResponse.pagination.total}`);
    
    // Vérifier si l'utilisateur est connecté
    const token = getAuthToken();
    if (token) {
      // Obtenir les informations de l'utilisateur connecté
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        
        // Si l'utilisateur connecté est différent de l'utilisateur demandé, vérifier s'il le suit
        if (user.id !== userId) {
          const isFollowingResponse = await checkIfFollowing(userId);
          console.log(`👥 [SUBSCRIPTION] L'utilisateur connecté ${isFollowingResponse.isFollowing ? 'suit' : 'ne suit pas'} cet utilisateur`);
        }
      }
    }
  } catch (error) {
    console.error('❌ [SUBSCRIPTION] Erreur lors du débogage:', error);
  }
};