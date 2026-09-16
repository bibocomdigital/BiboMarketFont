/**
 * Service dédié à la gestion du panier côté frontend
 */

// Importer les fonctions du service de configuration
import { backendUrl, getAuthToken, getAuthHeaders, handleApiError } from './configService';
import { unwrapList, unwrapRecord } from '../api/api-envelope';

// Types pour les articles et le panier
export interface CartItem {
  id: number;
  cartId: number;
  productId: number;
  quantity: number;
  product: {
    id: number;
    name: string;
    price: number;
    stock: number;
    images?: { imageUrl: string }[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface Cart {
  id: number;
  userId: number;
  items: CartItem[];
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
}

// Mise à jour de l'interface pour inclure tous les champs nécessaires
export interface WhatsAppLink {
  shopName: string;
  link: string;
  totalAmount?: number;
  itemCount?: number;
  logo?: string;
  productImages?: string[];
  orderNumber?: number;
}

export interface OrderResponse {
  message: string;
  order: {
    id: number;
    totalAmount: number;
    status: string;
    createdAt: string;
  };
  whatsappLinks: WhatsAppLink[];
}

export interface AddToCartResponse {
  message: string;
  cart: Cart;
}

export interface UpdateCartResponse {
  message: string;
  cart: Cart;
}

export interface RemoveFromCartResponse {
  message: string;
}

export interface ClearCartResponse {
  message: string;
}

export interface ShareCartResponse {
  message: string;
  whatsappLinks: WhatsAppLink[];
}

function emptyCart(): Cart {
  return {
    id: 0,
    userId: 0,
    items: [],
    totalPrice: 0,
    createdAt: "",
    updatedAt: "",
  };
}

function unwrapCart(raw: unknown): Cart {
  const payload = unwrapRecord(raw);
  const cart = (payload.cart ?? payload) as Cart;
  return {
    ...cart,
    items: Array.isArray(cart?.items) ? cart.items : [],
    totalPrice: Number(cart?.totalPrice ?? 0),
  };
}

/**
 * Vérifie si l'utilisateur est connecté pour accéder au panier
 * @returns {boolean} true si l'utilisateur est connecté
 */
export const isCartAccessible = (): boolean => {
  try {
    return !!getAuthToken();
  } catch {
    return false;
  }
};

/**
 * Déclenche un événement de mise à jour du panier
 * Utile pour synchroniser l'UI avec les changements du panier
 */
export const triggerCartUpdate = (): void => {
  try {
    console.log('🔄 [CART] Déclenchement de l\'événement cart-updated');
    window.dispatchEvent(new CustomEvent('cart-updated'));
  } catch (error) {
    console.error('❌ [CART] Erreur lors du déclenchement de l\'événement:', error);
  }
};

/**
 * Ajouter un produit au panier
 * @param {number} productId - ID du produit à ajouter
 * @param {number} quantity - Quantité à ajouter (défaut: 1)
 * @returns {Promise<AddToCartResponse>} Réponse avec message et panier mis à jour
 */
export const addToCart = async (productId: number, quantity: number = 1): Promise<AddToCartResponse> => {
  try {
    console.log('🔄 [CART] Ajout d\'un produit au panier');
    console.log('📦 [CART] ID du produit:', productId);
    console.log('🔢 [CART] Quantité:', quantity);
    
    // Vérifier si l'utilisateur est connecté
    if (!isCartAccessible()) {
      throw new Error('Vous devez être connecté pour ajouter au panier');
    }
    
    // Appeler l'API pour ajouter au panier
    const response = await fetch(`${backendUrl}/cart`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ productId, quantity }),
    });
    
    console.log('📊 [CART] Statut de la réponse d\'ajout:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ [CART] Erreur lors de l\'ajout au panier:', errorData);
      throw new Error(errorData.message || 'Erreur lors de l\'ajout au panier');
    }
    
    const payload = unwrapRecord(await response.json());
    const cart = unwrapCart(payload);
    console.log('✅ [CART] Produit ajouté avec succès au panier');
    console.log('📊 [CART] Nombre total d\'articles dans le panier:', cart.items.length);
    
    triggerCartUpdate();
    
    return {
      message: String(payload.message ?? 'Produit ajouté'),
      cart,
    };
  } catch (error) {
    console.error('❌ [CART] Erreur:', error);
    throw error;
  }
};

/**
 * Récupérer le contenu du panier
 * @returns {Promise<Cart>} Le panier de l'utilisateur
 */
export const getCart = async (): Promise<Cart> => {
  if (!isCartAccessible()) {
    return emptyCart();
  }

  try {
    const response = await fetch(`${backendUrl}/cart`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (response.status === 401 || response.status === 403) {
      return emptyCart();
    }

    if (!response.ok) {
      return emptyCart();
    }

    return unwrapCart(await response.json());
  } catch {
    return emptyCart();
  }
};

/**
 * Mettre à jour la quantité d'un article dans le panier
 * @param {number} itemId - ID de l'article à mettre à jour
 * @param {number} quantity - Nouvelle quantité
 * @returns {Promise<UpdateCartResponse>} Réponse avec message et panier mis à jour
 */
export const updateCartItem = async (itemId: number, quantity: number): Promise<UpdateCartResponse> => {
  try {
    console.log('🔄 [CART] Mise à jour d\'un article du panier');
    console.log('🆔 [CART] ID de l\'article:', itemId);
    console.log('🔢 [CART] Nouvelle quantité:', quantity);
    
    // Vérifier si l'utilisateur est connecté
    if (!isCartAccessible()) {
      throw new Error('Vous devez être connecté pour modifier le panier');
    }
    
    // Appeler l'API pour mettre à jour l'article
    const response = await fetch(`${backendUrl}/cart/items/${itemId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ quantity }),
    });
    
    console.log('📊 [CART] Statut de la réponse de mise à jour:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ [CART] Erreur lors de la mise à jour du panier:', errorData);
      throw new Error(errorData.message || 'Erreur lors de la mise à jour du panier');
    }
    
    const payload = unwrapRecord(await response.json());
    console.log('✅ [CART] Article mis à jour avec succès');
    
    triggerCartUpdate();
    
    return {
      message: String(payload.message ?? 'Panier mis à jour'),
      cart: unwrapCart(payload),
    };
  } catch (error) {
    console.error('❌ [CART] Erreur:', error);
    throw error;
  }
};

/**
 * Supprimer un article du panier
 * @param {number} itemId - ID de l'article à supprimer
 * @returns {Promise<RemoveFromCartResponse>} Réponse avec message de confirmation
 */
export const removeFromCart = async (itemId: number): Promise<RemoveFromCartResponse> => {
  try {
    console.log('🔄 [CART] Suppression d\'un article du panier');
    console.log('🆔 [CART] ID de l\'article à supprimer:', itemId);
    
    // Vérifier si l'utilisateur est connecté
    if (!isCartAccessible()) {
      throw new Error('Vous devez être connecté pour modifier le panier');
    }
    
    // Appeler l'API pour supprimer l'article
    const response = await fetch(`${backendUrl}/cart/items/${itemId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    
    console.log('📊 [CART] Statut de la réponse de suppression:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ [CART] Erreur lors de la suppression de l\'article:', errorData);
      throw new Error(errorData.message || 'Erreur lors de la suppression de l\'article');
    }
    
    const payload = unwrapRecord(await response.json());
    console.log('✅ [CART] Article supprimé avec succès');
    
    triggerCartUpdate();
    
    return { message: String(payload.message ?? 'Article supprimé') };
  } catch (error) {
    console.error('❌ [CART] Erreur:', error);
    throw error;
  }
};

/**
 * Vider le panier
 * @returns {Promise<ClearCartResponse>} Réponse avec message de confirmation
 */
export const clearCart = async (): Promise<ClearCartResponse> => {
  try {
    console.log('🔄 [CART] Vidage du panier');
    
    // Vérifier si l'utilisateur est connecté
    if (!isCartAccessible()) {
      throw new Error('Vous devez être connecté pour vider le panier');
    }
    
    // Appeler l'API pour vider le panier
    const response = await fetch(`${backendUrl}/cart`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    
    console.log('📊 [CART] Statut de la réponse de vidage:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ [CART] Erreur lors du vidage du panier:', errorData);
      throw new Error(errorData.message || 'Erreur lors du vidage du panier');
    }
    
    const payload = unwrapRecord(await response.json());
    console.log('✅ [CART] Panier vidé avec succès');
    
    triggerCartUpdate();
    
    return { message: String(payload.message ?? 'Panier vidé') };
  } catch (error) {
    console.error('❌ [CART] Erreur:', error);
    throw error;
  }
};

/**
 * Partager le panier via WhatsApp
 * @param {string} message - Message additionnel à inclure
 * @returns {Promise<ShareCartResponse>} Réponse avec liens WhatsApp
 */
export const shareCartViaWhatsApp = async (message: string = ''): Promise<ShareCartResponse> => {
  try {
    console.log('🔄 [CART] Partage du panier via WhatsApp');
    console.log('💬 [CART] Message additionnel:', message || 'Aucun');
    
    // Vérifier si l'utilisateur est connecté
    if (!isCartAccessible()) {
      throw new Error('Vous devez être connecté pour partager le panier');
    }
    
    // Appeler l'API pour partager le panier
    const response = await fetch(`${backendUrl}/cart/share/whatsapp`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ message }),
    });
    
    console.log('📊 [CART] Statut de la réponse de partage:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ [CART] Erreur lors du partage du panier:', errorData);
      throw new Error(errorData.message || 'Erreur lors du partage du panier');
    }
    
    const payload = unwrapRecord(await response.json());
    const whatsappLinks = unwrapList(payload, ['whatsappLinks']) as WhatsAppLink[];
    
    if (!whatsappLinks.length) {
      console.error('❌ [CART] Format de réponse invalide:', payload);
      throw new Error('Format de réponse invalide pour les liens WhatsApp');
    }
    
    console.log('✅ [CART] Liens WhatsApp générés avec succès');
    
    return {
      message: String(payload.message ?? ''),
      whatsappLinks,
    };
  } catch (error) {
    console.error('❌ [CART] Erreur:', error);
    throw error;
  }
};

/**
 * Créer une commande à partir du panier
 * @param {string} message - Message additionnel à inclure
 * @returns {Promise<OrderResponse>} Réponse avec détails de la commande
 */
export const createOrderFromCart = async (message: string = ''): Promise<OrderResponse> => {
  try {
    console.log('🔄 [CART] Création d\'une commande à partir du panier');
    console.log('💬 [CART] Message additionnel:', message || 'Aucun');
    
    // Vérifier si l'utilisateur est connecté
    if (!isCartAccessible()) {
      throw new Error('Vous devez être connecté pour créer une commande');
    }
    
    // Appeler l'API pour créer la commande
    const response = await fetch(`${backendUrl}/cart/order`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ message }),
    });
    
    console.log('📊 [CART] Statut de la réponse de création de commande:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ [CART] Erreur lors de la création de la commande:', errorData);
      throw new Error(errorData.message || 'Erreur lors de la création de la commande');
    }
    
    const payload = unwrapRecord(await response.json());
    const order = payload.order as OrderResponse['order'];
    console.log('✅ [CART] Commande créée avec succès');
    
    triggerCartUpdate();
    
    return {
      message: String(payload.message ?? 'Commande créée'),
      order,
      whatsappLinks: unwrapList(payload, ['whatsappLinks']) as WhatsAppLink[],
    };
  } catch (error) {
    console.error('❌ [CART] Erreur:', error);
    throw error;
  }
};

/**
 * Obtenir le nombre d'articles dans le panier
 * Utile pour afficher un badge sur l'icône du panier
 * @returns {Promise<number>} Nombre total d'articles dans le panier
 */
export const getCartItemsCount = async (): Promise<number> => {
  try {
    console.log('🔄 [CART] Calcul du nombre d\'articles dans le panier');
    
    // Si l'utilisateur n'est pas connecté, retourner 0
    if (!isCartAccessible()) {
      console.log('❌ [CART] Utilisateur non connecté, nombre d\'articles = 0');
      return 0;
    }
    
    // Récupérer le panier
    const cart = await getCart();
    
    // Calculer le nombre total d'articles
    const itemsCount = cart.items.reduce((total, item) => {
      return total + item.quantity;
    }, 0);
    
    console.log('✅ [CART] Nombre total d\'articles calculé:', itemsCount);
    return itemsCount;
  } catch (error) {
    console.error('❌ [CART] Erreur lors du comptage des articles:', error);
    return 0;
  }
};

/**
 * Obtenir le prix total du panier
 * @returns {Promise<number>} Prix total du panier en FCFA
 */
export const getCartTotal = async (): Promise<number> => {
  try {
    console.log('🔄 [CART] Calcul du prix total du panier');
    
    // Si l'utilisateur n'est pas connecté, retourner 0
    if (!isCartAccessible()) {
      console.log('❌ [CART] Utilisateur non connecté, prix total = 0');
      return 0;
    }
    
    // Récupérer le panier
    const cart = await getCart();
    
    console.log('✅ [CART] Prix total du panier:', cart.totalPrice, 'FCFA');
    return cart.totalPrice;
  } catch (error) {
    console.error('❌ [CART] Erreur lors du calcul du prix total:', error);
    return 0;
  }
};

/**
 * Vérifier si le panier est vide
 * @returns {Promise<boolean>} true si le panier est vide
 */
export const isCartEmpty = async (): Promise<boolean> => {
  try {
    console.log('🔄 [CART] Vérification si le panier est vide');
    
    // Si l'utilisateur n'est pas connecté, considérer le panier comme vide
    if (!isCartAccessible()) {
      console.log('❌ [CART] Utilisateur non connecté, panier considéré comme vide');
      return true;
    }
    
    const itemsCount = await getCartItemsCount();
    const isEmpty = itemsCount === 0;
    
    console.log('✅ [CART] Panier vide:', isEmpty);
    return isEmpty;
  } catch (error) {
    console.error('❌ [CART] Erreur lors de la vérification du panier vide:', error);
    return true;
  }
};

/**
 * Utilitaire pour vérifier et afficher les informations du panier
 * Utile pour déboguer les problèmes liés au panier
 */
export const debugCartInfo = async (): Promise<void> => {
  try {
    console.log('🔍 [CART] Débogage des informations du panier');
    
    // Vérifier l'accès au panier
    const hasAccess = isCartAccessible();
    console.log('🔐 [CART] Accès au panier:', hasAccess);
    
    if (!hasAccess) {
      console.log('❌ [CART] Impossible de déboguer le panier : utilisateur non connecté');
      return;
    }
    
    // Récupérer les informations du panier
    const cart = await getCart();
    const itemsCount = await getCartItemsCount();
    const totalPrice = await getCartTotal();
    const isEmpty = await isCartEmpty();
    
    console.log('📊 [CART] Informations détaillées du panier:', {
      cartId: cart.id,
      userId: cart.userId,
      itemsCount: itemsCount,
      totalPrice: totalPrice,
      isEmpty: isEmpty,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt
    });
    
    // Détails des articles
    console.log('📦 [CART] Détails des articles:');
    cart.items.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.product.name} - Quantité: ${item.quantity} - Prix: ${item.product.price} FCFA`);
    });
  } catch (error) {
    console.error('❌ [CART] Erreur lors du débogage:', error);
  }
};