/**
 * Service dédié à la gestion des messages entre utilisateurs côté frontend
 */

// Importer les fonctions du service de configuration
import { backendUrl, getAuthToken, getAuthHeaders, handleApiError } from './configService';
import type { ApiError } from './configService';
import { User } from './authService';

// Types pour les messages
export interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  mediaUrl: string | null;
  mediaType: 'image' | 'video' | null;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
  sender?: User;
  receiver?: User;
}

export interface Partner extends User {
  partnerName?: string;
  partnerPhoto?: string;
  partnerRole?: string;
}

export interface Conversation {
  partnerId: number;
  partnerName: string;
  partnerPhoto: string | null;
  partnerRole: string;
  lastMessage: string | null;
  lastMediaUrl: string | null;
  lastMediaType: string | null;
  lastMessageTime: string;
  unreadCount: number;
}

export interface ConversationsResponse {
  success: boolean;
  data: Conversation[];
}

export interface MessagesResponse {
  success: boolean;
  data: {
    partner: Partner;
    messages: Message[];
  };
}

export interface SendMessageResponse {
  success: boolean;
  message: string;
  data: Message;
}

export interface UnreadCountResponse {
  success: boolean;
  unreadCount: number;
}

export interface SearchMessagesResponse {
  success: boolean;
  data: Message[];
}

export interface MarkAsReadResponse {
  success: boolean;
  message: string;
  data?: Message;
  count?: number;
}

/**
 * Envoie un nouveau message
 * @param receiverId - ID du destinataire
 * @param content - Contenu du message (texte)
 * @param media - Fichier média à joindre (facultatif)
 * @returns Réponse contenant le message créé
 */
export const sendMessage = async (
  receiverId: number, 
  content: string, 
  media?: File
): Promise<SendMessageResponse> => {
  try {
    console.log(`🔄 [MESSAGE] Envoi d'un message à l'utilisateur ID ${receiverId}`);
    
    // Récupérer le token d'authentification
    const token = getAuthToken();
    if (!token) {
      throw new Error('Vous devez être connecté pour envoyer un message');
    }
    
    // Créer un FormData pour envoyer le contenu et le média si présent
    const formData = new FormData();
    formData.append('receiverId', receiverId.toString());
    formData.append('content', content);
    
    if (media) {
      formData.append('media', media);
      console.log(`📎 [MESSAGE] Ajout d'un fichier média: ${media.name} (${media.type})`);
    }
    
    // Appeler l'API pour envoyer le message
    const response = await fetch(`${backendUrl}/messages/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
        // Ne pas définir Content-Type, il sera automatiquement défini avec le boundary pour FormData
      },
      body: formData
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return handleApiError(errorData, 'Erreur lors de l\'envoi du message');
    }
    
    const data = await response.json();
    console.log(`✅ [MESSAGE] Message envoyé avec succès`);
    
    return data;
  } catch (error) {
    console.error('❌ [MESSAGE] Erreur:', error);
    throw error;
  }
};

/**
 * Récupère la liste des conversations de l'utilisateur
 * @returns Liste des conversations
 */
export const getConversations = async (): Promise<ConversationsResponse> => {
  try {
    console.log(`🔄 [MESSAGE] Récupération des conversations`);
    
    // Récupérer le token d'authentification
    const token = getAuthToken();
    if (!token) {
      throw new Error('Vous devez être connecté pour accéder à vos conversations');
    }
    
    // Appeler l'API pour récupérer les conversations
    const response = await fetch(
      `${backendUrl}/messages/conversations`,
      {
        headers: getAuthHeaders()
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      return handleApiError(errorData, 'Erreur lors de la récupération des conversations');
    }
    
    const data = await response.json();
    console.log(`✅ [MESSAGE] Conversations récupérées avec succès: ${data.data.length}`);
    
    return data;
  } catch (error) {
    console.error('❌ [MESSAGE] Erreur:', error);
    throw error;
  }
};

/**
 * Récupère les messages d'une conversation avec un utilisateur spécifique
 * @param partnerId - ID du partenaire de conversation
 * @returns Messages de la conversation
 */
export const getMessages = async (partnerId: number): Promise<MessagesResponse> => {
  try {
    console.log(`🔄 [MESSAGE] Récupération des messages avec l'utilisateur ID ${partnerId}`);
    
    // Récupérer le token d'authentification
    const token = getAuthToken();
    if (!token) {
      throw new Error('Vous devez être connecté pour accéder à vos messages');
    }
    
    // Appeler l'API pour récupérer les messages
    const response = await fetch(
      `${backendUrl}/messages/with/${partnerId}`,
      {
        headers: getAuthHeaders()
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      return handleApiError(errorData, 'Erreur lors de la récupération des messages');
    }
    
    const data = await response.json();
    console.log(`✅ [MESSAGE] Messages récupérés avec succès: ${data.data.messages.length}`);
    
    return data;
  } catch (error) {
    console.error('❌ [MESSAGE] Erreur:', error);
    throw error;
  }
};

/**
 * Met à jour un message
 * @param messageId - ID du message à mettre à jour
 * @param content - Nouveau contenu du message
 * @returns Message mis à jour
 */
export const updateMessage = async (messageId: number, content: string): Promise<SendMessageResponse> => {
  try {
    console.log(`🔄 [MESSAGE] Mise à jour du message ID ${messageId}`);
    
    // Récupérer le token d'authentification
    const token = getAuthToken();
    if (!token) {
      throw new Error('Vous devez être connecté pour modifier un message');
    }
    
    // Appeler l'API pour mettre à jour le message
    const response = await fetch(`${backendUrl}/messages/${messageId}`, {
      method: 'PUT',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return handleApiError(errorData, 'Erreur lors de la mise à jour du message');
    }
    
    const data = await response.json();
    console.log(`✅ [MESSAGE] Message mis à jour avec succès`);
    
    return data;
  } catch (error) {
    console.error('❌ [MESSAGE] Erreur:', error);
    throw error;
  }
};

/**
 * Supprimer un message
 * @param messageId - ID du message à supprimer
 * @param forEveryone - Si true, supprime pour tout le monde, sinon juste pour l'utilisateur
 * @returns Réponse de confirmation
 */
export const deleteMessage = async (messageId: number, forEveryone: boolean = false): Promise<{ success: boolean; message: string }> => {
  try {
    console.log(`🔄 [MESSAGE] Suppression du message ID ${messageId}, pour tous: ${forEveryone}`);
    
    // Récupérer le token d'authentification
    const token = getAuthToken();
    if (!token) {
      throw new Error('Vous devez être connecté pour supprimer un message');
    }
    
    // Appeler l'API pour supprimer le message
    const url = forEveryone 
      ? `${backendUrl}/messages/${messageId}?forEveryone=true` 
      : `${backendUrl}/messages/${messageId}`;
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return handleApiError(errorData, 'Erreur lors de la suppression du message');
    }
    
    const data = await response.json();
    console.log(`✅ [MESSAGE] Message supprimé avec succès`);
    
    return data;
  } catch (error) {
    console.error('❌ [MESSAGE] Erreur:', error);
    throw error;
  }
};

/**
 * Marque un message comme lu
 * @param messageId - ID du message à marquer comme lu
 * @returns Réponse de confirmation
 */
export const markAsRead = async (messageId: number): Promise<MarkAsReadResponse> => {
  try {
    console.log(`🔄 [MESSAGE] Marquage du message ID ${messageId} comme lu`);
    
    // Récupérer le token d'authentification
    const token = getAuthToken();
    if (!token) {
      throw new Error('Vous devez être connecté pour marquer un message comme lu');
    }
    
    // Appeler l'API pour marquer le message comme lu
    const response = await fetch(`${backendUrl}/messages/${messageId}/read`, {
      method: 'PATCH',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return handleApiError(errorData, 'Erreur lors du marquage du message comme lu');
    }
    
    const data = await response.json();
    console.log(`✅ [MESSAGE] Message marqué comme lu avec succès`);
    
    return data;
  } catch (error) {
    console.error('❌ [MESSAGE] Erreur:', error);
    throw error;
  }
};

/**
 * Marque tous les messages d'une conversation comme lus
 * @param partnerId - ID du partenaire de conversation
 * @returns Réponse de confirmation
 */
export const markAllAsRead = async (partnerId: number): Promise<MarkAsReadResponse> => {
  try {
    console.log(`🔄 [MESSAGE] Marquage de tous les messages avec l'utilisateur ID ${partnerId} comme lus`);
    
    // Récupérer le token d'authentification
    const token = getAuthToken();
    if (!token) {
      throw new Error('Vous devez être connecté pour marquer les messages comme lus');
    }
    
    // Appeler l'API pour marquer tous les messages comme lus
    const response = await fetch(`${backendUrl}/messages/read/all/${partnerId}`, {
      method: 'PATCH',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return handleApiError(errorData, 'Erreur lors du marquage des messages comme lus');
    }
    
    const data = await response.json();
    console.log(`✅ [MESSAGE] ${data.count} message(s) marqué(s) comme lu(s)`);
    
    return data;
  } catch (error) {
    console.error('❌ [MESSAGE] Erreur:', error);
    throw error;
  }
};

/**
 * Récupère le nombre de messages non lus
 * @returns Nombre de messages non lus
 */
export const getUnreadCount = async (): Promise<UnreadCountResponse> => {
  try {
    console.log(`🔄 [MESSAGE] Récupération du nombre de messages non lus`);
    
    // Récupérer le token d'authentification
    const token = getAuthToken();
    if (!token) {
      throw new Error('Vous devez être connecté pour accéder à vos messages non lus');
    }
    
    // Appeler l'API pour récupérer le nombre de messages non lus
    const response = await fetch(
      `${backendUrl}/messages/unread/count`,
      {
        headers: getAuthHeaders()
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      return handleApiError(errorData, 'Erreur lors de la récupération du nombre de messages non lus');
    }
    
    const data = await response.json();
    console.log(`✅ [MESSAGE] Nombre de messages non lus récupéré: ${data.unreadCount}`);
    
    return data;
  } catch (error) {
    console.error('❌ [MESSAGE] Erreur:', error);
    throw error;
  }
};

/**
 * Recherche des messages
 * @param query - Terme de recherche
 * @returns Messages correspondant à la recherche
 */
export const searchMessages = async (query: string): Promise<SearchMessagesResponse> => {
  try {
    console.log(`🔄 [MESSAGE] Recherche de messages contenant "${query}"`);
    
    // Récupérer le token d'authentification
    const token = getAuthToken();
    if (!token) {
      throw new Error('Vous devez être connecté pour rechercher des messages');
    }
    
    // Appeler l'API pour rechercher des messages
    const response = await fetch(
      `${backendUrl}/messages/search?query=${encodeURIComponent(query)}`,
      {
        headers: getAuthHeaders()
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      return handleApiError(errorData, 'Erreur lors de la recherche de messages');
    }
    
    const data = await response.json();
    console.log(`✅ [MESSAGE] ${data.data.length} message(s) trouvé(s)`);
    
    return data;
  } catch (error) {
    console.error('❌ [MESSAGE] Erreur:', error);
    throw error;
  }
};

/**
 * Utilitaire pour générer une clé de conversation unique
 * @param userId1 - ID du premier utilisateur
 * @param userId2 - ID du deuxième utilisateur
 * @returns Clé de conversation unique
 */
export const getConversationKey = (userId1: number, userId2: number): string => {
  // Retourne une clé unique basée sur les ID des deux utilisateurs (ordonnés)
  return [userId1, userId2].sort((a, b) => a - b).join('_');
};

/**
 * Vérifie si l'utilisateur a déjà une conversation avec ce partenaire
 * @param partnerId - ID du partenaire
 * @returns Promise<boolean> - True si la conversation existe déjà
 */
export const hasExistingConversation = async (partnerId: number): Promise<boolean> => {
  try {
    const conversations = await getConversations();
    return conversations.data.some(conv => conv.partnerId === partnerId);
  } catch (error) {
    console.error('❌ [MESSAGE] Erreur lors de la vérification des conversations existantes:', error);
    return false;
  }
};
/**
 * Met à jour un message
 * @param messageId - ID du message à mettre à jour
 * @param content - Nouveau contenu du message
 * @returns Message mis à jour
 */