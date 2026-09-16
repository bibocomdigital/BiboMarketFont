/**
 * Service dédié à la gestion des boutiques côté frontend
 */

// Importer les fonctions du service de configuration
import { backendUrl, getAuthToken, getAuthHeaders, handleApiError } from './configService';
import { unwrapList, unwrapRecord } from '../api/api-envelope';

// Définition des constantes pour les rôles utilisateur
export enum UserRole {
  CLIENT = 'CLIENT',
  MERCHANT = 'MERCHANT',
  SUPPLIER = 'SUPPLIER'
}

// Types pour les boutiques
export interface ShopImage {
  id: number;
  url: string;
  productId: number;
}

export interface ShopProduct {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  shopId: number;
  videoUrl?: string;
  category?: string; 
  createdAt: string;
  updatedAt: string;
  images: ShopImage[];
}

export interface Shop {
  id: number;
  name: string;
  description: string;
  phoneNumber: string;
  address: string;
  
  logo: string | null;
  userId: number;
  createdAt: string;
  updatedAt: string;
  user?: {
    firstName?: string;
    lastName?: string;
  };
}

export interface ShopWithProducts extends Shop {
  products: ShopProduct[];
}

function mapShopWithProducts(raw: unknown): ShopWithProducts {
  const payload = unwrapRecord(raw);
  const shop = (payload.shop ?? payload) as Shop;
  const products = Array.isArray(payload.products) ? (payload.products as ShopProduct[]) : [];
  return { ...shop, products };
}

function unwrapShopEntity(raw: unknown): Shop {
  const payload = unwrapRecord(raw);
  return (payload.shop ?? payload) as Shop;
}

export interface MerchantDetails {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  photo: string | null;
  createdAt: string;
}

export interface MerchantContactData {
  subject: string;
  message: string;
}

export interface ShopWithDetails extends Shop {
  owner: MerchantDetails;
  merchantStats: {
    totalProducts: number;
    memberSince: string;
  };
}

/**
 * Formate une URL d'image Cloudinary ou une URL locale
 * @param {string|null} imageUrl L'URL de l'image
 * @returns {string|null} L'URL formatée
 */
export const formatImageUrl = (imageUrl: string | null): string | null => {
  if (!imageUrl) return null;
  
  // Si c'est déjà une URL Cloudinary, la retourner telle quelle
  if (imageUrl.includes('cloudinary.com')) {
    return imageUrl;
  }
  
  // Si c'est une URL relative ou un chemin de fichier local, construire l'URL complète
  if (!imageUrl.startsWith('http')) {
    return `${backendUrl}/uploads/${imageUrl.split('/').pop()}`;
  }
  
  // Sinon, retourner l'URL originale
  return imageUrl;
};

/**
 * Vérifie si l'utilisateur actuellement connecté est un commerçant
 * @returns {boolean} true si l'utilisateur est un commerçant, sinon false
 */
export const isMerchant = (): boolean => {
  try {
    // Vérifier si l'utilisateur est connecté
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      console.error('❌ [SHOP] Aucun utilisateur connecté');
      return false;
    }
    
    // Récupérer les informations de l'utilisateur
    const user = JSON.parse(userStr);
    
    // Vérifier si l'utilisateur a le rôle commerçant
    if (user.role === UserRole.MERCHANT) {
      console.log('✅ [SHOP] L\'utilisateur est un commerçant');
      return true;
    }
    
    console.error(`❌ [SHOP] L'utilisateur a le rôle ${user.role}, mais le rôle requis est ${UserRole.MERCHANT}`);
    return false;
  } catch (error) {
    console.error('❌ [SHOP] Erreur lors de la vérification du rôle:', error);
    return false;
  }
};

/**
 * Récupère les informations de la boutique pour l'utilisateur connecté
 * @returns {Promise<ShopWithProducts>} Les informations de la boutique avec ses produits
 */
export const getMyShop = async (): Promise<ShopWithProducts> => {
  try {
    console.log('🔄 [SHOP] Récupération de la boutique du commerçant');
    
    // Vérifier si l'utilisateur est un commerçant
    if (!isMerchant()) {
      throw new Error('Seuls les commerçants peuvent accéder à leur boutique');
    }
    
    // Récupérer le token d'authentification
    const token = getAuthToken();
    if (!token) {
      throw new Error('Vous devez être connecté pour accéder à votre boutique');
    }
    
    // Appeler l'API pour récupérer la boutique
    const response = await fetch(`${backendUrl}/shop/my-shop`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    // Vérifier si la réponse est au format texte ou JSON
    const contentType = response.headers.get('content-type');
    let errorMessage = 'Erreur lors de la récupération de la boutique';
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
      if (!response.ok) {
        errorMessage = data.message || errorMessage;
        console.error('❌ [SHOP] Erreur lors de la récupération de la boutique:', errorMessage);
        throw new Error(errorMessage);
      }
    } else {
      const textResponse = await response.text();
      console.error('❌ [SHOP] Réponse non-JSON:', textResponse);
      throw new Error(errorMessage);
    }
    
    const shop = mapShopWithProducts(data);
    console.log('✅ [SHOP] Boutique récupérée avec succès:', shop.name);
    
    return shop;
  } catch (error) {
    console.error('❌ [SHOP] Erreur:', error);
    throw error;
  }
};

/**
 * Crée une nouvelle boutique pour l'utilisateur connecté
 * @param {Object} shopData Les données de la nouvelle boutique
 * @returns {Promise<Shop>} La boutique créée
 */
export const createShop = async (shopData: FormData): Promise<Shop> => {
  try {
    console.log('🔄 [SHOP] Création d\'une nouvelle boutique');
    
    // Vérifier si l'utilisateur est un commerçant
    if (!isMerchant()) {
      throw new Error('Seuls les commerçants peuvent créer une boutique');
    }
    
    // Récupérer le token d'authentification
    const token = getAuthToken();
    if (!token) {
      throw new Error('Vous devez être connecté pour créer une boutique');
    }
    
    // Log du contenu de FormData pour débugger
    console.log('📋 [SHOP] Contenu du FormData:');
    shopData.forEach((value, key) => {
      console.log(`   ${key}: ${value instanceof File ? `File: ${value.name}` : value}`);
    });
    
    // Appeler l'API pour créer la boutique
    const response = await fetch(`${backendUrl}/shop`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Ne pas définir Content-Type car FormData le fait automatiquement avec la boundary
      },
      body: shopData
    });
    
    // Log de la réponse pour débugger
    console.log('🔄 [SHOP] Statut de la réponse:', response.status);
    
    // Récupérer le texte brut de la réponse
    const responseText = await response.text();
    console.log('🔄 [SHOP] Réponse brute:', responseText);
    
    // Essayer de parser la réponse comme du JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('❌ [SHOP] Erreur lors du parsing de la réponse JSON:', e);
      throw new Error('Format de réponse invalide depuis le serveur');
    }
    
    // Vérifier si la requête a réussi
    if (!response.ok) {
      console.error('❌ [SHOP] Erreur lors de la création de la boutique:', data.message);
      throw new Error(data.message || 'Erreur lors de la création de la boutique');
    }
    
    const shop = unwrapShopEntity(data);
    console.log('✅ [SHOP] Boutique créée avec succès:', shop.name);
    
    return shop;
  } catch (error) {
    console.error('❌ [SHOP] Erreur:', error);
    throw error;
  }
};

/**
 * Met à jour les informations d'une boutique existante
 * @param {number} shopId L'ID de la boutique à mettre à jour
 * @param {Object} shopData Les nouvelles données de la boutique
 * @returns {Promise<Shop>} La boutique mise à jour
 */
export const updateShop = async (shopId: number, shopData: FormData): Promise<Shop> => {
  try {
    console.log(`🔄 [SHOP] Mise à jour de la boutique ID ${shopId}`);
    
    // Vérifier si l'utilisateur est un commerçant
    if (!isMerchant()) {
      throw new Error('Seuls les commerçants peuvent mettre à jour une boutique');
    }
    
    // Récupérer le token d'authentification
    const token = getAuthToken();
    if (!token) {
      throw new Error('Vous devez être connecté pour mettre à jour une boutique');
    }
    
    // Appeler l'API pour mettre à jour la boutique
    const response = await fetch(`${backendUrl}/shop/${shopId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Ne pas définir Content-Type car FormData le fait automatiquement avec la boundary
      },
      body: shopData
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erreur lors de la mise à jour de la boutique');
    }
    
    const shop = unwrapShopEntity(await response.json());
    console.log('✅ [SHOP] Boutique mise à jour avec succès:', shop.name);
    
    return shop;
  } catch (error) {
    console.error('❌ [SHOP] Erreur:', error);
    throw error;
  }
};

/**
 * Récupère une boutique spécifique par son ID
 * @param {number} shopId L'ID de la boutique à récupérer
 * @returns {Promise<ShopWithProducts>} Les informations de la boutique avec ses produits
 */
export const getShopById = async (shopId: number): Promise<ShopWithProducts> => {
  try {
    console.log(`🔄 [SHOP] Récupération de la boutique ID ${shopId}`);
    
    // Appeler l'API pour récupérer la boutique
    const response = await fetch(`${backendUrl}/shop/${shopId}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erreur lors de la récupération de la boutique');
    }
    
    const data = await response.json();
    const shop = mapShopWithProducts(data);
    console.log('✅ [SHOP] Boutique récupérée avec succès:', shop.name);
    
    return shop;
  } catch (error) {
    console.error('❌ [SHOP] Erreur:', error);
    throw error;
  }
};

/**
 * Récupère tous les produits d'une boutique
 * @param {number} shopId L'ID de la boutique
 * @returns {Promise<ShopProduct[]>} La liste des produits de la boutique
 */
export const getShopProducts = async (shopId: number): Promise<ShopProduct[]> => {
  try {
    console.log(`🔄 [SHOP] Récupération des produits de la boutique ID ${shopId}`);
    
    // Appeler l'API pour récupérer les produits de la boutique
    const response = await fetch(`${backendUrl}/shop/${shopId}/products`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erreur lors de la récupération des produits');
    }
    
    const data = await response.json();
    const products = unwrapList(data, ['products']) as ShopProduct[];
    console.log('✅ [SHOP] Produits récupérés avec succès:', products.length);
    
    return products;
  } catch (error) {
    console.error('❌ [SHOP] Erreur:', error);
    throw error;
  }
};

/**
 * Récupère toutes les boutiques disponibles
 * @returns {Promise<Shop[]>} La liste de toutes les boutiques
 */
export const getAllShops = async (): Promise<Shop[]> => {
  try {
    console.log('🔄 [SHOP] Récupération de toutes les boutiques');
    
    // Appeler l'API pour récupérer les boutiques
    const response = await fetch(`${backendUrl}/shop`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erreur lors de la récupération des boutiques');
    }
    
    const data = await response.json();
    const shops = unwrapList(data, ['shops']) as Shop[];
    console.log('✅ [SHOP] Boutiques récupérées avec succès:', shops.length);
    
    return shops;
  } catch (error) {
    console.error('❌ [SHOP] Erreur:', error);
    throw error;
  }
};

/**
 * Supprime une boutique et tous ses produits
 * @param {number} shopId L'ID de la boutique à supprimer
 * @returns {Promise<void>}
 */
export const deleteShop = async (shopId: number): Promise<void> => {
  try {
    console.log(`🔄 [SHOP] Suppression de la boutique ID ${shopId}`);
    
    // Vérifier si l'utilisateur est un commerçant
    if (!isMerchant()) {
      throw new Error('Seuls les commerçants peuvent supprimer une boutique');
    }
    
    // Récupérer le token d'authentification
    const token = getAuthToken();
    if (!token) {
      throw new Error('Vous devez être connecté pour supprimer une boutique');
    }
    
    // Appeler l'API pour supprimer la boutique
    const response = await fetch(`${backendUrl}/shop/${shopId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erreur lors de la suppression de la boutique');
    }
    
    console.log('✅ [SHOP] Boutique supprimée avec succès');
  } catch (error) {
    console.error('❌ [SHOP] Erreur:', error);
    throw error;
  }
};

/**
 * Récupère les détails d'une boutique avec les informations du commerçant
 * @param {number} shopId L'ID de la boutique
 * @returns {Promise<ShopWithDetails>} Les détails de la boutique avec les informations du commerçant
 */
export const getShopWithMerchantDetails = async (shopId: number): Promise<ShopWithDetails> => {
  try {
    console.log(`🔄 [SHOP] Récupération des détails de la boutique ID ${shopId}`);
    
    // Appeler l'API pour récupérer les détails de la boutique
    const response = await fetch(`${backendUrl}/shop/${shopId}/details`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erreur lors de la récupération des détails de la boutique');
    }
    
    const payload = unwrapRecord(await response.json());
    const shop = (payload.shop ?? payload) as ShopWithDetails;
    console.log('✅ [SHOP] Détails de la boutique récupérés avec succès:', shop?.name);

    return {
      ...shop,
      owner: shop?.owner,
      merchantStats: (payload.merchantStats ?? shop?.merchantStats) as ShopWithDetails['merchantStats'],
    };
  } catch (error) {
    console.error('❌ [SHOP] Erreur:', error);
    throw error;
  }
};

/**
 * Envoie un message à un commerçant
 * @param {number} shopId L'ID de la boutique
 * @param {MerchantContactData} messageData Les données du message
 * @returns {Promise<{success: boolean; message: string; contact?: {id: number; createdAt: string;}}>}
 */
export const contactMerchant = async (
  shopId: number, 
  messageData: MerchantContactData
): Promise<{ success: boolean; message: string; contact?: { id: number; createdAt: string } }> => {
  try {
    console.log(`🔄 [SHOP] Envoi d'un message au marchand de la boutique ID ${shopId}`);
    
    // Récupérer le token d'authentification
    const token = getAuthToken();
    if (!token) {
      throw new Error('Vous devez être connecté pour contacter un marchand');
    }
    
    // Vérifier que les champs obligatoires sont présents
    const { subject, message } = messageData;
    if (!subject || !message) {
      throw new Error('Le sujet et le message sont obligatoires');
    }
    
    // Appeler l'API pour envoyer le message
    const response = await fetch(`${backendUrl}/shop/${shopId}/contact`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        subject,
        message
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erreur lors de l\'envoi du message');
    }
    
    const payload = unwrapRecord(await response.json());
    console.log('✅ [SHOP] Message envoyé avec succès');
    
    return {
      success: payload.success !== false,
      message: String(payload.message ?? 'Message envoyé'),
      contact: payload.contact as { id: number; createdAt: string } | undefined,
    };
  } catch (error) {
    console.error('❌ [SHOP] Erreur:', error);
    throw error;
  }
};

/**
 * Récupère tous les messages d'un utilisateur
 * @returns {Promise<any>} Les messages de l'utilisateur
 */
export const getAllUserMessages = async () => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Vous devez être connecté');
    }

    const response = await fetch(`${backendUrl}/dashboard/messages`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erreur lors de la récupération des messages');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ [SHOP] Erreur:', error);
    throw error;
  }
};

/**
 * Répond à un message
 * @param {number} contactId L'ID du contact
 * @param {string} response La réponse au message
 * @returns {Promise<{success: boolean; message: string; contact?: {id: number; createdAt: string; redirectUrl?: string;}}>}
 */
export const respondToMessage = async (
  contactId: number, 
  response: string
): Promise<{ 
  success: boolean; 
  message: string; 
  contact?: { 
    id: number; 
    createdAt: string;
    redirectUrl?: string;
  } 
}> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Vous devez être connecté pour répondre à un message');
    }

    const apiResponse = await fetch(`${backendUrl}/contact/${contactId}/respond`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ response })
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      throw new Error(errorData.message || 'Erreur lors de l\'envoi de la réponse');
    }

    const data = await apiResponse.json();
    return {
      ...data,
      contact: {
        ...data.contact,
        redirectUrl: `/dashboard/messages/${contactId}`
      }
    };
  } catch (error) {
    console.error('❌ [SHOP] Erreur lors de la réponse:', error);
    throw error;
  }
};

/**
 * Utilitaire pour vérifier et afficher les informations de l'utilisateur
 * Utile pour déboguer les problèmes d'autorisation
 */
export const debugUserInfo = (): void => {
  try {
    console.log('🔍 [SHOP] Débogage des informations utilisateur');
    
    // Vérifier le token
    const token = localStorage.getItem('token');
    console.log('🔑 [SHOP] Token présent:', !!token);
    if (token) {
      console.log('🔑 [SHOP] Aperçu du token:', token.substring(0, 20) + '...');
      
      // Décodage basique du JWT (sans vérification)
      try {
        const [header, payload] = token.split('.');
        const decodedPayload = JSON.parse(atob(payload));
        console.log('🔑 [SHOP] Contenu du token:', decodedPayload);
      } catch (e) {
        console.error('❌ [SHOP] Impossible de décoder le token:', e);
      }
    }
    
    // Vérifier les informations utilisateur
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      console.log('👤 [SHOP] Informations utilisateur:', {
        id: user.id,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified
      });
      
      if (user.role === UserRole.MERCHANT) {
        console.log('✅ [SHOP] L\'utilisateur a le rôle requis: MERCHANT');
      } else {
        console.log('❌ [SHOP] L\'utilisateur n\'a pas le rôle requis. Actuel:', user.role, 'Requis:', UserRole.MERCHANT);
      }
    } else {
      console.log('❌ [SHOP] Aucune information utilisateur trouvée dans localStorage');
    }
  } catch (error) {
    console.error('❌ [SHOP] Erreur lors du débogage:', error);
  }
};