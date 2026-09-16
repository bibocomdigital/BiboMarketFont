/**
 * Service dédié à la gestion des produits côté frontend
 */

// Importer les fonctions du service de configuration
import { backendUrl, getAuthToken } from './configService';
import { parseApiError } from '../api/fetch-error';
import { unwrapApi, unwrapList, unwrapPaged, unwrapRecord } from '../api/api-envelope';

// Définition des constantes pour les rôles utilisateur
export enum UserRole {
  CLIENT = 'CLIENT',
  MERCHANT = 'MERCHANT',
  SUPPLIER = 'SUPPLIER'
}

// Types pour les produits
export interface ProductImage {
  id: number;
  imageUrl: string;
  productId: number;
}

export interface Shop {
  id: number;
  name: string;
  logo: string | null;
  verifiedBadge: boolean;
}

export interface ProductCategoryRef {
  id: number;
  name: string;
  categorieShopId?: number;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  category?: string | ProductCategoryRef;
  categorieProdId?: number;
  categorieProd?: ProductCategoryRef;
  status: 'DRAFT' | 'PUBLISHED';
  videoUrl?: string;
  shopId: number;
  userId: number;
  shop?: Shop;
  images: ProductImage[];
  _count?: {
    likes: number;
    comments: number;
    shares: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ProductCategory {
  id: number;
  name: string;
  categorieShopId?: number;
  shopCategory?: {
    id: number;
    name: string;
  };
  _count?: {
    products: number;
  };
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProductsResponse {
  products: Product[];
  pagination: Pagination;
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
      console.error('❌ [PRODUCT] Aucun utilisateur connecté');
      return false;
    }
    
    // Récupérer les informations de l'utilisateur
    const user = JSON.parse(userStr);
    
    // Vérifier si l'utilisateur a le rôle commerçant
    if (user.role === UserRole.MERCHANT) {
      console.log('✅ [PRODUCT] L\'utilisateur est un commerçant');
      return true;
    }
    
    console.error(`❌ [PRODUCT] L'utilisateur a le rôle ${user.role}, mais le rôle requis est ${UserRole.MERCHANT}`);
    return false;
  } catch (error) {
    console.error('❌ [PRODUCT] Erreur lors de la vérification du rôle:', error);
    return false;
  }
};

/**
 * Vérifie si l'utilisateur actuellement connecté est authentifié
 * @returns {boolean} true si l'utilisateur est authentifié, sinon false
 */
export const isAuthenticated = (): boolean => {
  try {
    // Vérifier si l'utilisateur est connecté
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('❌ [PRODUCT] Erreur lors de la vérification de l\'authentification:', error);
    return false;
  }
};

/**
 * Récupère tous les produits disponibles (paginés)
 * @param {number} page Numéro de page pour la pagination
 * @param {number} limit Nombre de produits par page
 * @param {Object} filters Filtres supplémentaires (catégorie, prix min/max, etc.)
 * @returns {Promise<ProductsResponse>} Les produits et les informations de pagination
 */
export const getAllProducts = async (
  page: number = 1,
  limit: number = 10,
  categoryId?: number | string,
  searchTerm: string = '',
  additionalFilters: {
    minPrice?: number;
    maxPrice?: number;
    sortBy?: string;
    order?: 'asc' | 'desc';
    status?: string;
  } = {}
): Promise<ProductsResponse> => {
  try {
    console.log(`🔄 [PRODUCT] Récupération de tous les produits (page ${page}, limit ${limit})`);
    
    // Construire l'URL avec les paramètres
    let url = `${backendUrl}/produit?page=${page}&limit=${limit}`;
    
    // Ajouter la catégorie si elle est fournie
    if (categoryId) url += `&category=${categoryId}`;
    
    // Ajouter le terme de recherche si fourni
    if (searchTerm && searchTerm.trim() !== '') url += `&search=${encodeURIComponent(searchTerm.trim())}`;
    
    // Ajouter les filtres supplémentaires s'ils sont fournis
    if (additionalFilters.minPrice) url += `&minPrice=${additionalFilters.minPrice}`;
    if (additionalFilters.maxPrice) url += `&maxPrice=${additionalFilters.maxPrice}`;
    if (additionalFilters.sortBy) url += `&sortBy=${additionalFilters.sortBy}`;
    if (additionalFilters.order) url += `&order=${additionalFilters.order}`;
    if (additionalFilters.status) url += `&status=${additionalFilters.status}`;
    
    console.log(`🔄 [PRODUCT] URL de requête: ${url}`);

    const headers: HeadersInit = {};
    const token = getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      throw await parseApiError(response, 'Erreur lors de la récupération des produits');
    }
    
    const data = await response.json();
    const { items, pagination } = unwrapPaged<Product>(data, 'products', { page, limit });
    console.log('✅ [PRODUCT] Produits récupérés avec succès:', items.length);
    
    return {
      products: items,
      pagination,
    };
  } catch (error) {
    console.error('❌ [PRODUCT] Erreur:', error);
    throw error;
  }
};
/**
 * Récupère un produit spécifique par son ID
 * @param {number} productId L'ID du produit à récupérer
 * @returns {Promise<Product>} Les informations détaillées du produit
 */
export const getProductById = async (productId: number): Promise<Product> => {
  try {
    console.log(`🔄 [PRODUCT] Récupération du produit ID ${productId}`);
    
    // Appeler l'API pour récupérer le produit
    const response = await fetch(`${backendUrl}/produit/${productId}`);
    
    if (!response.ok) {
      throw await parseApiError(response, 'Erreur lors de la récupération du produit');
    }
    
    const payload = unwrapApi(await response.json());
    const record = unwrapRecord(payload);
    const product = (record.product ?? payload) as Product;
    console.log('✅ [PRODUCT] Produit récupéré avec succès:', product?.name);
    
    return product;
  } catch (error) {
    console.error('❌ [PRODUCT] Erreur:', error);
    throw error;
  }
};

/**
 * Crée un nouveau produit
 * @param {FormData} productData Les données du nouveau produit (y compris les images)
 * @returns {Promise<Product>} Le produit créé
 */
export const createProduct = async (productData: FormData): Promise<Product> => {
  try {
    console.log('🔄 [PRODUCT] Création d\'un nouveau produit');
    
    // Vérifier si l'utilisateur est un commerçant
    if (!isMerchant()) {
      throw new Error('Seuls les commerçants peuvent créer des produits');
    }
    
    // Récupérer le token d'authentification
    const token = getAuthToken();
    if (!token) {
      throw new Error('Vous devez être connecté pour créer un produit');
    }
    
    // Log du contenu de FormData pour débugger
    console.log('📋 [PRODUCT] Contenu du FormData:');
    productData.forEach((value, key) => {
      console.log(`   ${key}: ${value instanceof File ? `File: ${value.name}` : value}`);
    });
    
    // Appeler l'API pour créer le produit
    const response = await fetch(`${backendUrl}/produit`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Ne pas définir Content-Type car FormData le fait automatiquement avec la boundary
      },
      body: productData
    });
    
    // Log de la réponse pour débugger
    console.log('🔄 [PRODUCT] Statut de la réponse:', response.status);
    
    if (!response.ok) {
      throw await parseApiError(response, 'Erreur lors de la création du produit');
    }
    
    const data = await response.json();
    console.log('✅ [PRODUCT] Produit créé avec succès:', data.product.name);
    
    return data.product;
  } catch (error) {
    console.error('❌ [PRODUCT] Erreur:', error);
    throw error;
  }
};

/**
 * Met à jour un produit existant
 * @param {number} productId L'ID du produit à mettre à jour
 * @param {FormData} productData Les nouvelles données du produit
 * @returns {Promise<Product>} Le produit mis à jour
 */
export const updateProduct = async (productId: number, productData: FormData): Promise<Product> => {
  try {
    console.log(`🔄 [PRODUCT] Mise à jour du produit ID ${productId}`);
    
    // Vérifier si l'utilisateur est authentifié
    if (!isAuthenticated()) {
      throw new Error('Vous devez être connecté pour mettre à jour un produit');
    }
    
    // Récupérer le token d'authentification
    const token = getAuthToken();
    if (!token) {
      throw new Error('Vous devez être connecté pour mettre à jour un produit');
    }
    
    // Appeler l'API pour mettre à jour le produit
    const response = await fetch(`${backendUrl}/produit/${productId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Ne pas définir Content-Type car FormData le fait automatiquement avec la boundary
      },
      body: productData
    });
    
    if (!response.ok) {
      throw await parseApiError(response, 'Erreur lors de la mise à jour du produit');
    }
    
    const data = await response.json();
    console.log('✅ [PRODUCT] Produit mis à jour avec succès:', data.product.name);
    
    return data.product;
  } catch (error) {
    console.error('❌ [PRODUCT] Erreur:', error);
    throw error;
  }
};

/**
 * Met à jour uniquement le stock d'un produit
 * @param {number} productId L'ID du produit
 * @param {number} newStock La nouvelle quantité en stock
 * @returns {Promise<Product>} Le produit mis à jour
 */
export const updateProductStock = async (productId: number, newStock: number): Promise<Product> => {
  try {
    console.log(`🔄 [PRODUCT] Mise à jour du stock du produit ID ${productId}`);
    
    // Vérifier si l'utilisateur est authentifié
    if (!isAuthenticated()) {
      throw new Error('Vous devez être connecté pour mettre à jour le stock');
    }
    
    // Récupérer le token d'authentification
    const token = getAuthToken();
    if (!token) {
      throw new Error('Vous devez être connecté pour mettre à jour le stock');
    }
    
    // Appeler l'API pour mettre à jour le stock
    const response = await fetch(`${backendUrl}/produit/${productId}/stock`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ stock: newStock })
    });
    
    if (!response.ok) {
      throw await parseApiError(response, 'Erreur lors de la mise à jour du stock');
    }
    
    const data = await response.json();
    console.log('✅ [PRODUCT] Stock mis à jour avec succès:', data.product.stock);
    
    return data.product;
  } catch (error) {
    console.error('❌ [PRODUCT] Erreur:', error);
    throw error;
  }
};

/**
 * Supprime un produit
 * @param {number} productId L'ID du produit à supprimer
 * @returns {Promise<void>}
 */
export const deleteProduct = async (productId: number): Promise<void> => {
  try {
    console.log(`🔄 [PRODUCT] Suppression du produit ID ${productId}`);
    
    // Vérifier si l'utilisateur est authentifié
    if (!isAuthenticated()) {
      throw new Error('Vous devez être connecté pour supprimer un produit');
    }
    
    // Récupérer le token d'authentification
    const token = getAuthToken();
    if (!token) {
      throw new Error('Vous devez être connecté pour supprimer un produit');
    }
    
    // Appeler l'API pour supprimer le produit
    const response = await fetch(`${backendUrl}/produit/${productId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw await parseApiError(response, 'Erreur lors de la suppression du produit');
    }
    
    console.log('✅ [PRODUCT] Produit supprimé avec succès');
  } catch (error) {
    console.error('❌ [PRODUCT] Erreur:', error);
    throw error;
  }
};

/**
 * Recherche des produits selon un terme de recherche
 * @param {string} query Terme de recherche
 * @param {string} category Catégorie (facultatif)
 * @param {number} page Numéro de page
 * @param {number} limit Nombre d'éléments par page
 * @returns {Promise<ProductsResponse>} Les produits correspondants et les informations de pagination
 */
export const searchProducts = async (
  query: string,
  category?: string,
  page: number = 1,
  limit: number = 10
): Promise<ProductsResponse> => {
  try {
    console.log(`🔄 [PRODUCT] Recherche de produits: "${query}"`);
    
    if (!query) {
      throw new Error('Un terme de recherche est requis');
    }
    
    // Construire l'URL avec les paramètres
    let url = `${backendUrl}/produit/search?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`;
    
    // Ajouter la catégorie si elle est fournie
    if (category) {
      url += `&category=${encodeURIComponent(category)}`;
    }
    
    // Appeler l'API pour rechercher les produits
    const response = await fetch(url);
    
    if (!response.ok) {
      throw await parseApiError(response, 'Erreur lors de la recherche de produits');
    }
    
    const data = await response.json();
    const { items, pagination } = unwrapPaged<Product>(data, 'products', { page, limit });
    console.log('✅ [PRODUCT] Recherche réussie, produits trouvés:', items.length);
    
    return {
      products: items,
      pagination,
    };
  } catch (error) {
    console.error('❌ [PRODUCT] Erreur:', error);
    throw error;
  }
};

/**
 * Récupère les produits d'une catégorie spécifique
 * @param {string} category Nom de la catégorie
 * @param {number} page Numéro de page
 * @param {number} limit Nombre d'éléments par page
 * @returns {Promise<ProductsResponse>} Les produits de la catégorie et les informations de pagination
 */
export const getProductsByCategory = async (
  category: string,
  page: number = 1,
  limit: number = 10
): Promise<ProductsResponse> => {
  try {
    console.log(`🔄 [PRODUCT] Récupération des produits de la catégorie "${category}"`);
    
    // Appeler l'API pour récupérer les produits de la catégorie
    const response = await fetch(`${backendUrl}/produit/category/${encodeURIComponent(category)}?page=${page}&limit=${limit}`);
    
    if (!response.ok) {
      throw await parseApiError(response, 'Erreur lors de la récupération des produits par catégorie');
    }
    
    const data = await response.json();
    const { items, pagination } = unwrapPaged<Product>(data, 'products', { page, limit });
    console.log('✅ [PRODUCT] Produits de la catégorie récupérés avec succès:', items.length);
    
    return {
      products: items,
      pagination,
    };
  } catch (error) {
    console.error('❌ [PRODUCT] Erreur:', error);
    throw error;
  }
};

/**
 * Récupère les derniers produits ajoutés
 * @param {number} limit Nombre de produits à récupérer
 * @returns {Promise<Product[]>} La liste des derniers produits
 */
export const getLatestProducts = async (limit: number = 10): Promise<Product[]> => {
  try {
    console.log(`🔄 [PRODUCT] Récupération des ${limit} derniers produits`);
    
    // Appeler l'API pour récupérer les derniers produits
    const response = await fetch(`${backendUrl}/produit/latest?limit=${limit}`);
    
    if (!response.ok) {
      throw await parseApiError(response, 'Erreur lors de la récupération des derniers produits');
    }
    
    const products = unwrapList(await response.json(), ['products']) as Product[];
    console.log('✅ [PRODUCT] Derniers produits récupérés avec succès:', products.length);
    
    return products;
  } catch (error) {
    console.error('❌ [PRODUCT] Erreur:', error);
    throw error;
  }
};

/**
 * Récupère les produits en vedette
 * @param {number} limit Nombre de produits à récupérer
 * @returns {Promise<Product[]>} La liste des produits en vedette
 */
export const getFeaturedProducts = async (limit: number = 10): Promise<Product[]> => {
  try {
    console.log(`🔄 [PRODUCT] Récupération des ${limit} produits en vedette`);
    
    // Appeler l'API pour récupérer les produits en vedette
    const response = await fetch(`${backendUrl}/produit/featured?limit=${limit}`);
    
    if (!response.ok) {
      throw await parseApiError(response, 'Erreur lors de la récupération des produits en vedette');
    }
    
    const products = unwrapList(await response.json(), ['products']) as Product[];
    console.log('✅ [PRODUCT] Produits en vedette récupérés avec succès:', products.length);
    
    return products;
  } catch (error) {
    console.error('❌ [PRODUCT] Erreur:', error);
    throw error;
  }
};

/**
 * Récupère toutes les catégories de produits (CategorieProd + compteur).
 */
export const getProductCategories = async (): Promise<ProductCategory[]> => {
  try {
    console.log('🔄 [PRODUCT] Récupération des catégories de produits');
    
    const response = await fetch(`${backendUrl}/produit/categories`);
    
    if (!response.ok) {
      throw await parseApiError(response, 'Erreur lors de la récupération des catégories');
    }
    
    const categories = unwrapList(await response.json(), ['categories']) as ProductCategory[];
    console.log('✅ [PRODUCT] Catégories récupérées avec succès:', categories.length);
    
    return categories;
  } catch (error) {
    console.error('❌ [PRODUCT] Erreur:', error);
    throw error;
  }
};

/**
 * Récupère les produits d'un commerçant spécifique
 * @param {number} merchantId L'ID du commerçant
 * @param {number} page Numéro de page
 * @param {number} limit Nombre d'éléments par page
 * @returns {Promise<ProductsResponse>} Les produits du commerçant et les informations de pagination
 */
export const getMerchantProducts = async (
  merchantId: number,
  page: number = 1,
  limit: number = 10
): Promise<ProductsResponse> => {
  try {
    console.log(`🔄 [PRODUCT] Récupération des produits du commerçant ID ${merchantId}`);
    
    // Appeler l'API pour récupérer les produits du commerçant
    const response = await fetch(`${backendUrl}/produit/merchant/${merchantId}?page=${page}&limit=${limit}`);
    
    if (!response.ok) {
      throw await parseApiError(response, 'Erreur lors de la récupération des produits du commerçant');
    }
    
    const data = await response.json();
    const { items, pagination } = unwrapPaged<Product>(data, 'products', { page, limit });
    console.log('✅ [PRODUCT] Produits du commerçant récupérés avec succès:', items.length);
    
    return {
      products: items,
      pagination,
    };
  } catch (error) {
    console.error('❌ [PRODUCT] Erreur:', error);
    throw error;
  }
};

/**
 * Récupère les produits associés à un produit spécifique
 * @param {number} productId L'ID du produit
 * @param {number} limit Nombre de produits associés à récupérer
 * @returns {Promise<Product[]>} La liste des produits associés
 */
export const getRelatedProducts = async (productId: number, limit: number = 5): Promise<Product[]> => {
  try {
    console.log(`🔄 [PRODUCT] Récupération des produits associés au produit ID ${productId}`);
    
    // Appeler l'API pour récupérer les produits associés
    const response = await fetch(`${backendUrl}/produit/${productId}/related?limit=${limit}`);
    
    if (!response.ok) {
      throw await parseApiError(response, 'Erreur lors de la récupération des produits associés');
    }
    
    const relatedProducts = unwrapList(await response.json(), ['products']) as Product[];
    console.log('✅ [PRODUCT] Produits associés récupérés avec succès:', relatedProducts.length);
    
    return relatedProducts;
  } catch (error) {
    console.error('❌ [PRODUCT] Erreur:', error);
    throw error;
  }
};

/**
 * Récupère les statistiques des produits pour un commerçant
 * @returns {Promise<{totalProducts: number, lowStockCount: number, categoryStats: {category: string, count: number}[]}>} 
 * Statistiques sur les produits
 */
export const getProductStats = async (): Promise<{
  totalProducts: number;
  lowStockCount: number;
  categoryStats: {category: string; count: number}[];
}> => {
  try {
    console.log('🔄 [PRODUCT] Récupération des statistiques des produits');
    
    // Vérifier si l'utilisateur est un commerçant
    if (!isMerchant()) {
      throw new Error('Seuls les commerçants peuvent accéder aux statistiques');
    }
    
    // Récupérer le token d'authentification
    const token = getAuthToken();
    if (!token) {
      throw new Error('Vous devez être connecté pour accéder aux statistiques');
    }
    
    // Appeler l'API pour récupérer les statistiques
    const response = await fetch(`${backendUrl}/produit/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw await parseApiError(response, 'Erreur lors de la récupération des statistiques');
    }
    
    const stats = unwrapRecord(await response.json()) as {
      totalProducts: number;
      lowStockCount: number;
      categoryStats: {category: string; count: number}[];
    };
    console.log('✅ [PRODUCT] Statistiques récupérées avec succès');
    
    return stats;
  } catch (error) {
    console.error('❌ [PRODUCT] Erreur:', error);
    throw error;
  }
};

/**
 * Met à jour le statut d'un produit (brouillon ou publié)
 * @param {number} productId L'ID du produit
 * @param {'DRAFT'|'PUBLISHED'} status Le nouveau statut
 * @returns {Promise<Product>} Le produit mis à jour
 */
export const updateProductStatus = async (
  productId: number,
  status: 'DRAFT' | 'PUBLISHED'
): Promise<Product> => {
  try {
    console.log(`🔄 [PRODUCT] Mise à jour du statut du produit ID ${productId} en "${status}"`);
    
    // Vérifier si l'utilisateur est authentifié
    if (!isAuthenticated()) {
      throw new Error('Vous devez être connecté pour mettre à jour le statut');
    }
    
    // Récupérer le token d'authentification
    const token = getAuthToken();
    if (!token) {
      throw new Error('Vous devez être connecté pour mettre à jour le statut');
    }
    
    // Appeler l'API pour mettre à jour le statut
    const response = await fetch(`${backendUrl}/produit/${productId}/status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status })
    });
    
    if (!response.ok) {
      throw await parseApiError(response, 'Erreur lors de la mise à jour du statut');
    }
    
    const data = unwrapRecord(await response.json());
    const product = (data.product ?? data) as Product;
    console.log('✅ [PRODUCT] Statut mis à jour avec succès:', product.status);
    
    return product;
  } catch (error) {
    console.error('❌ [PRODUCT] Erreur:', error);
    throw error;
  }
};

/**
 * Utilitaire pour déboguer les informations utilisateur et les erreurs d'autorisation
 */
export const debugProductInfo = (): void => {
  try {
    console.log('🔍 [PRODUCT] Débogage des informations produit');
    
    // Vérifier le token
    const token = localStorage.getItem('token');
    console.log('🔑 [PRODUCT] Token présent:', !!token);
    if (token) {
      console.log('🔑 [PRODUCT] Aperçu du token:', token.substring(0, 20) + '...');
      
      // Décodage basique du JWT (sans vérification)
      try {
        const [header, payload] = token.split('.');
        const decodedPayload = JSON.parse(atob(payload));
        console.log('🔑 [PRODUCT] Contenu du token:', decodedPayload);
      } catch (e) {
        console.error('❌ [PRODUCT] Impossible de décoder le token:', e);
      }
    }
    
    // Vérifier les informations utilisateur
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      console.log('👤 [PRODUCT] Informations utilisateur:', {
        id: user.id,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified
      });
      
      if (user.role === UserRole.MERCHANT) {
        console.log('✅ [PRODUCT] L\'utilisateur a le rôle requis: MERCHANT');
      } else {
        console.log('❌ [PRODUCT] L\'utilisateur n\'a pas le rôle requis. Actuel:', user.role, 'Requis:', UserRole.MERCHANT);
      }
    } else {
      console.log('❌ [PRODUCT] Aucune information utilisateur trouvée dans localStorage');
    }
  } catch (error) {
    console.error('❌ [PRODUCT] Erreur lors du débogage:', error);
  }
};