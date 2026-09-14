// src/services/feedbackService.ts
import { backendUrl, isLoggedIn, getAuthHeaders, handleApiError } from './configService';

interface FeedbackItem {
  merchantId: number;
  shopId: number;
  rating: number;
  comment?: string;
}

/**
 * Soumet les évaluations des marchands pour une commande spécifique
 * @param orderId - ID de la commande évaluée
 * @param feedbackItems - Liste des évaluations pour chaque marchand
 */
export const submitMerchantFeedback = async (
  orderId: number,
  feedbackItems: FeedbackItem[]
): Promise<{ success: boolean; message: string }> => {
  try {
    if (!isLoggedIn()) {
      throw new Error('Vous devez être connecté pour soumettre des évaluations');
    }

    const response = await fetch(`${backendUrl}/orders/${orderId}/request-feedback`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ feedbackItems }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Erreur lors de la soumission des évaluations');
    }
    
    return data;
  } catch (error) {
    return handleApiError(error, 'Erreur lors de la soumission des évaluations');
  }
};

/**
 * Récupère l'historique des évaluations soumises par l'utilisateur
 */
export const getUserFeedbackHistory = async (): Promise<FeedbackItem[]> => {
  try {
    if (!isLoggedIn()) {
      throw new Error('Vous devez être connecté pour accéder à votre historique d\'évaluations');
    }

    const response = await fetch(`${backendUrl}/user/feedback`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Erreur lors de la récupération de l\'historique des évaluations');
    }
    
    return data.feedbackItems;
  } catch (error) {
    return handleApiError(error, 'Erreur lors de la récupération de l\'historique des évaluations');
  }
};

export default {
  submitMerchantFeedback,
  getUserFeedbackHistory
};