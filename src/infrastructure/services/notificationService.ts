/**
 * Service dédié à la gestion des notifications côté frontend
 */

// Importer les fonctions du service de configuration
import { backendUrl, getAuthToken, getAuthHeaders, handleApiError } from './configService';

// Types pour les notifications
export interface Notification {
  id: number;
  userId: number;
  type: string;
  message: string;
  actionUrl: string | null;
  resourceId: number | null;
  resourceType: string | null;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
  priority: number;
}

export interface MarkAsReadResponse {
  message: string;
}

export interface DeleteNotificationResponse {
  message: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  read: number;
  typeBreakdown: Record<string, number>;
  priorityBreakdown: Record<number, number>;
}

export interface FormattedNotification {
  id: number;
  message: string;
  type: string;
  isRead: boolean;
  isRecent: boolean;
  formattedDate: string;
  priority: number;
  actionUrl: string | null;
}

/**
 * Vérifie si l'utilisateur peut accéder aux fonctionnalités de notifications
 * @returns {boolean} true si l'utilisateur est connecté
 */
export const isNotificationsAccessible = (): boolean => {
  try {
    const token = getAuthToken();
    const userStr = localStorage.getItem('user');
    const hasAccess = !!token && !!userStr;
    
    if (hasAccess) {
      console.log('✅ [NOTIFICATION] Utilisateur connecté, accès aux notifications autorisé');
    } else {
      console.log('❌ [NOTIFICATION] Utilisateur non connecté, accès aux notifications refusé');
    }
    
    return hasAccess;
  } catch (error) {
    console.error('❌ [NOTIFICATION] Erreur lors de la vérification d\'accès aux notifications:', error);
    return false;
  }
};

/**
 * Trie les notifications par date (les plus récentes d'abord)
 * @param {Notification[]} notifications - Liste des notifications à trier
 * @returns {Notification[]} Notifications triées
 */
export const sortNotificationsByDate = (notifications: Notification[]): Notification[] => {
  try {
    console.log('🔄 [NOTIFICATION] Tri des notifications par date');
    
    const sorted = notifications.sort((a: Notification, b: Notification) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    console.log('✅ [NOTIFICATION] Notifications triées avec succès');
    return sorted;
  } catch (error) {
    console.error('❌ [NOTIFICATION] Erreur lors du tri des notifications:', error);
    return notifications;
  }
};

/**
 * Récupère toutes les notifications de l'utilisateur connecté
 * @returns {Promise<Notification[]>} La liste des notifications
 */
export const getUserNotifications = async (): Promise<Notification[]> => {
  try {
    console.log('🔄 [NOTIFICATION] Récupération des notifications utilisateur');
    
    // Vérifier si l'utilisateur est connecté
    if (!isNotificationsAccessible()) {
      console.log('⚠️ [NOTIFICATION] Utilisateur non connecté, retour d\'un tableau vide');
      return [];
    }
    
    // Récupérer le token d'authentification
    const token = getAuthToken();
    if (!token) {
      throw new Error('Vous devez être connecté pour accéder à vos notifications');
    }
    
    // Appeler l'API pour récupérer les notifications
    const response = await fetch(`${backendUrl}/notifications`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    console.log('📊 [NOTIFICATION] Statut de la réponse de récupération:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ [NOTIFICATION] Erreur lors de la récupération des notifications:', errorData.message);
      throw new Error(errorData.message || 'Erreur lors de la récupération des notifications');
    }
    
    const data = await response.json();
    console.log('✅ [NOTIFICATION] Notifications récupérées avec succès');
    console.log('📊 [NOTIFICATION] Nombre de notifications:', data.length);
    
    // Trier les notifications par date (les plus récentes d'abord)
    return sortNotificationsByDate(data);
  } catch (error) {
    console.error('❌ [NOTIFICATION] Erreur:', error);
    throw error;
  }
};

/**
 * Marque une notification comme lue
 * @param {number} notificationId - L'ID de la notification à marquer comme lue
 * @returns {Promise<Notification>} La notification mise à jour
 */
export const markNotificationAsRead = async (notificationId: number): Promise<Notification> => {
  try {
    console.log('🔄 [NOTIFICATION] Marquage d\'une notification comme lue');
    console.log('🆔 [NOTIFICATION] ID de la notification:', notificationId);
    
    // Récupérer le token d'authentification
    const token = getAuthToken();
    if (!token) {
      throw new Error('Vous devez être connecté pour marquer une notification comme lue');
    }
    
    // Appeler l'API pour marquer la notification comme lue
    const response = await fetch(`${backendUrl}/notifications/${notificationId}`, {
      method: 'PATCH',
      headers: getAuthHeaders()
    });
    
    console.log('📊 [NOTIFICATION] Statut de la réponse de marquage:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ [NOTIFICATION] Erreur lors du marquage de la notification:', errorData.message);
      throw new Error(errorData.message || 'Erreur lors du marquage de la notification');
    }
    
    const data = await response.json();
    console.log('✅ [NOTIFICATION] Notification marquée comme lue avec succès');
    
    return data;
  } catch (error) {
    console.error('❌ [NOTIFICATION] Erreur:', error);
    throw error;
  }
};

/**
 * Marque toutes les notifications de l'utilisateur comme lues
 * @returns {Promise<MarkAsReadResponse>} Le message de confirmation
 */
export const markAllNotificationsAsRead = async (): Promise<MarkAsReadResponse> => {
  try {
    console.log('🔄 [NOTIFICATION] Marquage de toutes les notifications comme lues');
    
    // Récupérer le token d'authentification
    const token = getAuthToken();
    if (!token) {
      throw new Error('Vous devez être connecté pour marquer vos notifications comme lues');
    }
    
    // Appeler l'API pour marquer toutes les notifications comme lues
    const response = await fetch(`${backendUrl}/notifications`, {
      method: 'PATCH',
      headers: getAuthHeaders()
    });
    
    console.log('📊 [NOTIFICATION] Statut de la réponse de marquage global:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ [NOTIFICATION] Erreur lors du marquage des notifications:', errorData.message);
      throw new Error(errorData.message || 'Erreur lors du marquage des notifications');
    }
    
    const data = await response.json();
    console.log('✅ [NOTIFICATION] Toutes les notifications marquées comme lues avec succès');
    
    return data;
  } catch (error) {
    console.error('❌ [NOTIFICATION] Erreur:', error);
    throw error;
  }
};

/**
 * Supprime une notification
 * @param {number} notificationId - L'ID de la notification à supprimer
 * @returns {Promise<DeleteNotificationResponse>} Le message de confirmation
 */
export const deleteNotification = async (notificationId: number): Promise<DeleteNotificationResponse> => {
  try {
    console.log('🔄 [NOTIFICATION] Suppression d\'une notification');
    console.log('🆔 [NOTIFICATION] ID de la notification à supprimer:', notificationId);
    
    // Récupérer le token d'authentification
    const token = getAuthToken();
    if (!token) {
      throw new Error('Vous devez être connecté pour supprimer une notification');
    }
    
    // Appeler l'API pour supprimer la notification
    const response = await fetch(`${backendUrl}/notifications/${notificationId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    console.log('📊 [NOTIFICATION] Statut de la réponse de suppression:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ [NOTIFICATION] Erreur lors de la suppression de la notification:', errorData.message);
      throw new Error(errorData.message || 'Erreur lors de la suppression de la notification');
    }
    
    const data = await response.json();
    console.log('✅ [NOTIFICATION] Notification supprimée avec succès');
    
    return data;
  } catch (error) {
    console.error('❌ [NOTIFICATION] Erreur:', error);
    throw error;
  }
};

/**
 * Supprime toutes les notifications de l'utilisateur
 * @returns {Promise<DeleteNotificationResponse>} Le message de confirmation
 */
export const deleteAllNotifications = async (): Promise<DeleteNotificationResponse> => {
  try {
    console.log('🔄 [NOTIFICATION] Suppression de toutes les notifications');
    
    // Récupérer le token d'authentification
    const token = getAuthToken();
    if (!token) {
      throw new Error('Vous devez être connecté pour supprimer vos notifications');
    }
    
    // Appeler l'API pour supprimer toutes les notifications
    const response = await fetch(`${backendUrl}/notifications`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    console.log('📊 [NOTIFICATION] Statut de la réponse de suppression globale:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ [NOTIFICATION] Erreur lors de la suppression des notifications:', errorData.message);
      throw new Error(errorData.message || 'Erreur lors de la suppression des notifications');
    }
    
    const data = await response.json();
    console.log('✅ [NOTIFICATION] Toutes les notifications supprimées avec succès');
    
    return data;
  } catch (error) {
    console.error('❌ [NOTIFICATION] Erreur:', error);
    throw error;
  }
};

/**
 * Obtient le nombre de notifications non lues
 * Cette fonction peut être utilisée pour afficher un badge sur l'icône de notification
 * @returns {Promise<number>} Le nombre de notifications non lues
 */
export const getUnreadNotificationsCount = async (): Promise<number> => {
  try {
    console.log('🔄 [NOTIFICATION] Calcul du nombre de notifications non lues');
    
    // Si l'utilisateur n'est pas connecté, retourner 0
    if (!isNotificationsAccessible()) {
      console.log('❌ [NOTIFICATION] Utilisateur non connecté, nombre de notifications non lues = 0');
      return 0;
    }
    
    // Récupérer toutes les notifications
    const notifications = await getUserNotifications();
    
    // Compter les notifications non lues
    const unreadCount = notifications.filter(notification => !notification.isRead).length;
    
    console.log('✅ [NOTIFICATION] Nombre de notifications non lues calculé:', unreadCount);
    
    return unreadCount;
  } catch (error) {
    console.error('❌ [NOTIFICATION] Erreur lors de la récupération du nombre de notifications non lues:', error);
    return 0; // En cas d'erreur, retourner 0
  }
};

/**
 * Obtient les notifications non lues seulement
 * @returns {Promise<Notification[]>} Liste des notifications non lues
 */
export const getUnreadNotifications = async (): Promise<Notification[]> => {
  try {
    console.log('🔄 [NOTIFICATION] Récupération des notifications non lues');
    
    // Récupérer toutes les notifications
    const notifications = await getUserNotifications();
    
    // Filtrer les notifications non lues
    const unreadNotifications = notifications.filter(notification => !notification.isRead);
    
    console.log('✅ [NOTIFICATION] Notifications non lues récupérées:', unreadNotifications.length);
    
    return unreadNotifications;
  } catch (error) {
    console.error('❌ [NOTIFICATION] Erreur lors de la récupération des notifications non lues:', error);
    return [];
  }
};

/**
 * Obtient les notifications par type
 * @param {string} type - Type de notification à filtrer
 * @returns {Promise<Notification[]>} Liste des notifications du type spécifié
 */
export const getNotificationsByType = async (type: string): Promise<Notification[]> => {
  try {
    console.log('🔄 [NOTIFICATION] Récupération des notifications par type');
    console.log('🏷️ [NOTIFICATION] Type demandé:', type);
    
    // Récupérer toutes les notifications
    const notifications = await getUserNotifications();
    
    // Filtrer par type
    const filteredNotifications = notifications.filter(notification => notification.type === type);
    
    console.log('✅ [NOTIFICATION] Notifications filtrées par type:', filteredNotifications.length);
    
    return filteredNotifications;
  } catch (error) {
    console.error('❌ [NOTIFICATION] Erreur lors de la récupération des notifications par type:', error);
    return [];
  }
};

/**
 * Obtient les notifications par priorité
 * @param {number} priority - Priorité des notifications à filtrer
 * @returns {Promise<Notification[]>} Liste des notifications de la priorité spécifiée
 */
export const getNotificationsByPriority = async (priority: number): Promise<Notification[]> => {
  try {
    console.log('🔄 [NOTIFICATION] Récupération des notifications par priorité');
    console.log('⭐ [NOTIFICATION] Priorité demandée:', priority);
    
    // Récupérer toutes les notifications
    const notifications = await getUserNotifications();
    
    // Filtrer par priorité
    const filteredNotifications = notifications.filter(notification => notification.priority === priority);
    
    console.log('✅ [NOTIFICATION] Notifications filtrées par priorité:', filteredNotifications.length);
    
    return filteredNotifications;
  } catch (error) {
    console.error('❌ [NOTIFICATION] Erreur lors de la récupération des notifications par priorité:', error);
    return [];
  }
};

/**
 * Obtient les statistiques complètes des notifications
 * @returns {Promise<NotificationStats>} Statistiques des notifications
 */
export const getNotificationStats = async (): Promise<NotificationStats> => {
  try {
    console.log('🔄 [NOTIFICATION] Calcul des statistiques des notifications');
    
    // Récupérer toutes les notifications
    const notifications = await getUserNotifications();
    
    // Calculer les statistiques
    const stats: NotificationStats = {
      total: notifications.length,
      unread: notifications.filter(n => !n.isRead).length,
      read: notifications.filter(n => n.isRead).length,
      typeBreakdown: {},
      priorityBreakdown: {}
    };
    
    // Analyser les types de notifications
    notifications.forEach(notification => {
      stats.typeBreakdown[notification.type] = (stats.typeBreakdown[notification.type] || 0) + 1;
    });
    
    // Analyser les priorités
    notifications.forEach(notification => {
      stats.priorityBreakdown[notification.priority] = (stats.priorityBreakdown[notification.priority] || 0) + 1;
    });
    
    console.log('✅ [NOTIFICATION] Statistiques calculées avec succès');
    console.log('📊 [NOTIFICATION] Stats:', {
      total: stats.total,
      unread: stats.unread,
      read: stats.read
    });
    
    return stats;
  } catch (error) {
    console.error('❌ [NOTIFICATION] Erreur lors du calcul des statistiques:', error);
    
    // Retourner des statistiques par défaut en cas d'erreur
    return {
      total: 0,
      unread: 0,
      read: 0,
      typeBreakdown: {},
      priorityBreakdown: {}
    };
  }
};

/**
 * Vérifie si une notification est récente (moins de 24h)
 * @param {Notification} notification - La notification à vérifier
 * @returns {boolean} true si la notification est récente
 */
export const isNotificationRecent = (notification: Notification): boolean => {
  try {
    const notificationDate = new Date(notification.createdAt);
    const now = new Date();
    const diffInHours = (now.getTime() - notificationDate.getTime()) / (1000 * 60 * 60);
    
    const isRecent = diffInHours < 24;
    
    console.log('🔍 [NOTIFICATION] Vérification si notification récente:', {
      notificationId: notification.id,
      heuresEcoulees: Math.round(diffInHours),
      estRecente: isRecent
    });
    
    return isRecent;
  } catch (error) {
    console.error('❌ [NOTIFICATION] Erreur lors de la vérification de récence:', error);
    return false;
  }
};

/**
 * Formate une notification pour l'affichage
 * @param {Notification} notification - La notification à formater
 * @returns {FormattedNotification} Notification formatée pour l'affichage
 */
export const formatNotificationForDisplay = (notification: Notification): FormattedNotification => {
  try {
    const formatted: FormattedNotification = {
      id: notification.id,
      message: notification.message,
      type: notification.type,
      isRead: notification.isRead,
      isRecent: isNotificationRecent(notification),
      formattedDate: new Date(notification.createdAt).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      priority: notification.priority,
      actionUrl: notification.actionUrl
    };
    
    console.log('🎨 [NOTIFICATION] Notification formatée pour l\'affichage:', notification.id);
    
    return formatted;
  } catch (error) {
    console.error('❌ [NOTIFICATION] Erreur lors du formatage de la notification:', error);
    // En cas d'erreur, retourner une version formatée basique
    return {
      id: notification.id,
      message: notification.message,
      type: notification.type,
      isRead: notification.isRead,
      isRecent: false,
      formattedDate: 'Date invalide',
      priority: notification.priority,
      actionUrl: notification.actionUrl
    };
  }
};

/**
 * Formate une liste de notifications pour l'affichage
 * @param {Notification[]} notifications - Liste des notifications à formater
 * @returns {FormattedNotification[]} Liste des notifications formatées
 */
export const formatNotificationsForDisplay = (notifications: Notification[]): FormattedNotification[] => {
  try {
    console.log('🎨 [NOTIFICATION] Formatage d\'une liste de notifications pour l\'affichage');
    console.log('📊 [NOTIFICATION] Nombre de notifications à formater:', notifications.length);
    
    const formatted = notifications.map(notification => formatNotificationForDisplay(notification));
    
    console.log('✅ [NOTIFICATION] Liste de notifications formatée avec succès');
    
    return formatted;
  } catch (error) {
    console.error('❌ [NOTIFICATION] Erreur lors du formatage de la liste de notifications:', error);
    return [];
  }
};

/**
 * Utilitaire pour vérifier et afficher les informations des notifications
 * Utile pour déboguer les problèmes liés aux notifications
 */
export const debugNotificationInfo = async (): Promise<void> => {
  try {
    console.log('🔍 [NOTIFICATION] Débogage des informations des notifications');
    
    // Vérifier l'accès aux notifications
    const hasAccess = isNotificationsAccessible();
    console.log('🔐 [NOTIFICATION] Accès aux notifications:', hasAccess);
    
    // Vérifier le token
    const token = getAuthToken();
    console.log('🔑 [NOTIFICATION] Token présent:', !!token);
    
    if (token) {
      console.log('🔑 [NOTIFICATION] Aperçu du token:', token.substring(0, 20) + '...');
    }
    
    // Récupérer les informations utilisateur
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      console.log('👤 [NOTIFICATION] Utilisateur connecté:', {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      });
    } else {
      console.log('❌ [NOTIFICATION] Aucune information utilisateur trouvée');
    }
    
    if (!hasAccess) {
      console.log('❌ [NOTIFICATION] Impossible de déboguer les notifications : utilisateur non connecté');
      return;
    }
    
    // Récupérer les statistiques complètes
    try {
      const stats = await getNotificationStats();
      
      console.log('📊 [NOTIFICATION] Statistiques complètes:', {
        total: stats.total,
        nonLues: stats.unread,
        lues: stats.read,
        typesDeNotifications: Object.keys(stats.typeBreakdown),
        prioritesUtilisees: Object.keys(stats.priorityBreakdown)
      });
      
      console.log('📋 [NOTIFICATION] Répartition par type:', stats.typeBreakdown);
      console.log('📋 [NOTIFICATION] Répartition par priorité:', stats.priorityBreakdown);
      
      // Afficher quelques notifications récentes
      const notifications = await getUserNotifications();
      const recentNotifications = notifications.slice(0, 5);
      
      console.log('📝 [NOTIFICATION] Dernières notifications (max 5):');
      recentNotifications.forEach((notification, index) => {
        const formatted = formatNotificationForDisplay(notification);
        console.log(`   ${index + 1}. ${formatted.message} (${formatted.type}) - ${formatted.formattedDate} - ${formatted.isRead ? 'Lue' : 'Non lue'}`);
      });
    } catch (e) {
      console.error('❌ [NOTIFICATION] Erreur lors de la récupération des statistiques pour le debug:', e);
    }
  } catch (error) {
    console.error('❌ [NOTIFICATION] Erreur lors du débogage:', error);
  }
};