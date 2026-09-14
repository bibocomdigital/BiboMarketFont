// src/services/orderService.ts
import { backendUrl, isLoggedIn, getAuthHeaders, handleApiError, getAuthToken } from './configService';

export interface OrderItem {
  id: number;
  quantity: number;
  price: number;
  product: {
    id: number;
    name: string;
    price: number;
    images: Array<{
      id: number;
      imageUrl: string;
    }>;
    shop: {
      id: number;
      name: string;
      phoneNumber: string;
    };
  };
}

export interface DetailedOrder {
  id: number;
  status: string;
  createdAt: string;
  updatedAt?: string;
  clientId: number;
  orderItems: OrderItem[];
  client?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
  };
}

export interface Order {
  id: number;
  clientId: number;
  status: string;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  orderItems: OrderItem[];
  client?: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    email: string;
  };
}

export interface WhatsAppLink {
  shopName: string;
  link: string;
}

export interface ConfirmationCheckResponse {
  message: string;
  orderId: number;
  status: string;
  whatsappLinks?: WhatsAppLink[];
}

export interface MerchantFeedback {
  merchantId: number;
  shopId: number;
  shopName: string;
}

export interface FeedbackRequestResponse {
  message: string;
  orderId: number;
  merchants: MerchantFeedback[];
}

export interface AutoConfirmResponse {
  message: string;
  totalProcessed: number;
  confirmed: number;
  failed: number;
  results: Array<{
    orderId: number;
    clientName: string;
    status: 'SUCCESS' | 'ERROR';
    error?: string;
  }>;
}

/**
 * Récupérer toutes les commandes de l'utilisateur
 */
export const getOrders = async (): Promise<Order[]> => {
  try {
    if (!isLoggedIn()) {
      throw new Error('Vous devez être connecté pour accéder à vos commandes');
    }

    const response = await fetch(`${backendUrl}/orders`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Erreur lors de la récupération des commandes');
    }
    
    return data.orders;
  } catch (error) {
    return handleApiError(error, 'Erreur lors de la récupération des commandes');
  }
};

/**
 * Récupérer les détails d'une commande spécifique
 * @param orderId - ID de la commande à récupérer
 */
export const getOrderById = async (orderId: number): Promise<Order> => {
  try {
    if (!isLoggedIn()) {
      throw new Error('Vous devez être connecté pour accéder aux détails de la commande');
    }

    const response = await fetch(`${backendUrl}/orders/${orderId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Erreur lors de la récupération des détails de la commande');
    }
    
    return data.order;
  } catch (error) {
    return handleApiError(error, 'Erreur lors de la récupération des détails de la commande');
  }
};

/**
 * Vérifier le statut de confirmation d'une commande
 * @param orderId - ID de la commande à vérifier
 */
export const checkOrderConfirmation = async (orderId: number): Promise<ConfirmationCheckResponse> => {
  try {
    if (!isLoggedIn()) {
      throw new Error('Vous devez être connecté pour vérifier le statut de la commande');
    }

    const response = await fetch(`${backendUrl}/orders/${orderId}/check-confirmation`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Erreur lors de la vérification de la commande');
    }
    
    return data;
  } catch (error) {
    return handleApiError(error, 'Erreur lors de la vérification de la commande');
  }
};

/**
 * Demander un feedback sur les marchands d'une commande
 * @param orderId - ID de la commande pour laquelle demander un feedback
 */
export const requestMerchantFeedback = async (orderId: number): Promise<FeedbackRequestResponse> => {
  try {
    if (!isLoggedIn()) {
      throw new Error('Vous devez être connecté pour demander un feedback');
    }

    const response = await fetch(`${backendUrl}/orders/${orderId}/request-feedback`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Erreur lors de la demande de feedback');
    }
    
    return data;
  } catch (error) {
    return handleApiError(error, 'Erreur lors de la demande de feedback');
  }
};

/**
 * Récupérer les commandes pour un marchand
 */
export const getMerchantOrders = async (): Promise<Order[]> => {
  try {
    if (!isLoggedIn()) {
      throw new Error('Vous devez être connecté comme marchand pour accéder à ces commandes');
    }

    const response = await fetch(`${backendUrl}/merchant/orders`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Erreur lors de la récupération des commandes marchandes');
    }
    
    return data.orders;
  } catch (error) {
    return handleApiError(error, 'Erreur lors de la récupération des commandes marchandes');
  }
};

/**
 * Récupère les détails complets d'une commande par son ID
 * @param orderId L'ID de la commande
 * @returns Les détails complets de la commande
 */
export const getOrderDetails = async (orderId: number): Promise<DetailedOrder> => {
  try {
    console.log(`🔄 [ORDER] Récupération des détails de la commande ID ${orderId}`);
    
    // Récupérer le token d'authentification
    const token = getAuthToken();
    if (!token) {
      throw new Error('Vous devez être connecté pour consulter les détails de la commande');
    }

    // Récupérer le rôle utilisateur pour déterminer quelle approche utiliser
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const userRole = user?.role || 'CLIENT';

    if (userRole === 'MERCHANT') {
      // Pour les commerçants, récupérer toutes leurs commandes et trouver celle demandée
      console.log('🔄 [ORDER] Récupération en tant que commerçant via merchant/orders');
      
      const merchantOrdersResponse = await fetch(`${backendUrl}/merchant/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!merchantOrdersResponse.ok) {
        const errorData = await merchantOrdersResponse.json();
        throw new Error(errorData.message || 'Erreur lors de la récupération des commandes du marchand');
      }
      
      const merchantData = await merchantOrdersResponse.json();
      const targetOrder = merchantData.orders.find((order: any) => order.id === parseInt(orderId.toString()));
      
      if (!targetOrder) {
        throw new Error('Commande introuvable ou vous n\'avez pas l\'autorisation de la consulter');
      }
      
      // Adapter la structure pour correspondre à ce que la page attend
      const adaptedOrder = {
        ...targetOrder,
        orderItems: targetOrder.items || [], // Convertir "items" en "orderItems"
        client: targetOrder.client || null
      };
      
      console.log('✅ [ORDER] Commande trouvée via merchant/orders');
      return adaptedOrder;
      
    } else {
      // Pour les clients, utiliser la route normale
      console.log('🔄 [ORDER] Récupération en tant que client');
      
      const response = await fetch(`${backendUrl}/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Commande introuvable');
        }
        if (response.status === 403) {
          throw new Error('Vous n\'avez pas l\'autorisation de consulter cette commande');
        }
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la récupération des détails de la commande');
      }
      
      const data = await response.json();
      console.log('✅ [ORDER] Détails de la commande récupérés avec succès');
      
      return data.order;
    }
  } catch (error) {
    console.error('❌ [ORDER] Erreur:', error);
    throw error;
  }
};

/**
 * Annule une commande (pour les clients)
 * @param orderId L'ID de la commande
 * @returns La commande mise à jour
 */
export const cancelOrder = async (orderId: number): Promise<DetailedOrder> => {
  try {
    console.log(`🔄 [ORDER] Annulation de la commande ID ${orderId}`);
    
    // Récupérer le token d'authentification
    const token = getAuthToken();
    if (!token) {
      throw new Error('Vous devez être connecté pour annuler une commande');
    }
    
    // Appeler l'API pour annuler la commande
    const response = await fetch(`${backendUrl}/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'CANCELED' })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erreur lors de l\'annulation de la commande');
    }
    
    const data = await response.json();
    console.log('✅ [ORDER] Commande annulée avec succès');
    
    return data.order;
  } catch (error) {
    console.error('❌ [ORDER] Erreur:', error);
    throw error;
  }
};

/**
 * Met à jour le statut d'une commande (pour les commerçants)
 * ✨ AVEC NOTIFICATIONS PERSONNALISÉES
 * @param orderId L'ID de la commande
 * @param newStatus Le nouveau statut
 * @returns La commande mise à jour avec notifications
 */
export const updateOrderStatus = async (orderId: number, newStatus: string): Promise<DetailedOrder> => {
  try {
    console.log(`🔄 [ORDER] Mise à jour du statut de la commande ID ${orderId} vers ${newStatus}`);
    
    // Récupérer le token d'authentification
    const token = getAuthToken();
    if (!token) {
      throw new Error('Vous devez être connecté pour mettre à jour le statut');
    }
    
    // Appeler l'API pour mettre à jour le statut (AVEC NOTIFICATIONS PERSONNALISÉES)
    const response = await fetch(`${backendUrl}/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: newStatus })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erreur lors de la mise à jour du statut');
    }
    
    const data = await response.json();
    console.log('✅ [ORDER] Statut mis à jour avec succès');
    console.log('📨 [ORDER] Notifications envoyées:', data.notifications || 'Notifications créées');
    
    return data.order;
  } catch (error) {
    console.error('❌ [ORDER] Erreur:', error);
    throw error;
  }
};

/**
 * 🚀 NOUVELLE FONCTION: Auto-confirmer les livraisons après 48h
 * @returns Résultats de l'auto-confirmation
 */
export const autoConfirmDeliveries = async (): Promise<AutoConfirmResponse> => {
  try {
    console.log('🔄 [ORDER] Lancement de l\'auto-confirmation des livraisons...');
    
    // Récupérer le token d'authentification
    const token = getAuthToken();
    if (!token) {
      throw new Error('Vous devez être connecté pour lancer l\'auto-confirmation');
    }
    
    // Appeler l'API pour auto-confirmer les livraisons
    const response = await fetch(`${backendUrl}/orders/auto-confirm-deliveries`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erreur lors de l\'auto-confirmation');
    }
    
    const data = await response.json();
    console.log(`✅ [ORDER] Auto-confirmation terminée: ${data.confirmed}/${data.totalProcessed} commandes confirmées`);
    
    return data;
  } catch (error) {
    console.error('❌ [ORDER] Erreur lors de l\'auto-confirmation:', error);
    throw error;
  }
};

/**
 * 🎯 NOUVELLE FONCTION: Confirmer manuellement la réception d'une commande (pour les clients)
 * @param orderId L'ID de la commande
 * @returns La commande mise à jour
 */
export const confirmDelivery = async (orderId: number): Promise<DetailedOrder> => {
  try {
    console.log(`🔄 [ORDER] Confirmation de réception de la commande ID ${orderId}`);
    
    // Utiliser la même fonction updateOrderStatus mais avec le statut DELIVERED
    return await updateOrderStatus(orderId, 'DELIVERED');
  } catch (error) {
    console.error('❌ [ORDER] Erreur lors de la confirmation de réception:', error);
    throw error;
  }
};

/**
 * 📱 FONCTION AMÉLIORÉE: Créer message WhatsApp pour commerçant
 * @param order Les détails de la commande
 * @param clientName Le nom du client
 * @returns Message WhatsApp formaté pour le paiement
 */
export const createMerchantWhatsAppMessage = (order: DetailedOrder, clientName: string): string => {
  const orderItems = order.orderItems || [];
  const total = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  let message = `Bonjour ${clientName}, concernant votre commande #COMANDE-${order.id} sur BibocomMarket.\n\n`;
  message += `Produits commandés :\n`;
  
  orderItems.forEach((item, index) => {
    message += `${index + 1}. ${item.product.name} - ${item.quantity} x ${item.price.toLocaleString('fr-FR')} FCFA = ${(item.price * item.quantity).toLocaleString('fr-FR')} FCFA\n`;
  });
  
  message += `\nTotal : ${total.toLocaleString('fr-FR')} FCFA\n\n`;
  message += `Pour confirmer votre commande, veuillez effectuer le paiement via :\n`;
  message += `💳 Wave : [Votre numéro Wave]\n`;
  message += `📱 Orange Money : [Votre numéro OM]\n`;
  message += `💰 Espèces à la livraison\n\n`;
  message += `Une fois le paiement effectué, envoyez-moi une capture d'écran ou confirmez par message.\n`;
  message += `Merci ! 😊`;
  
  return message;
};