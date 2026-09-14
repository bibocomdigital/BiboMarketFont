"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUserErrorMessage } from '@domain/errors/app-error';
import { useOrderFeedbackQuery } from '@/hooks/queries/use-orders-query';
import { Star } from 'lucide-react';

interface Merchant {
  merchantId: number;
  shopId: number;
  shopName: string;
}

interface FeedbackForm {
  [key: number]: {
    rating: number;
    comment: string;
  };
}

const MerchantFeedback = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const parsedOrderId = orderId ? parseInt(orderId, 10) : null;
  const { data: feedbackData, isPending, isError, error: queryError } = useOrderFeedbackQuery(parsedOrderId);
  const merchants = feedbackData?.merchants ?? [];
  const loading = isPending && !feedbackData;
  const [submitError, setSubmitError] = useState<string | null>(null);
  const error = submitError || (isError && !feedbackData ? getUserErrorMessage(queryError) : null);
  const [feedback, setFeedback] = useState<FeedbackForm>({});
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (!feedbackData?.merchants) return;
    const initialFeedback: FeedbackForm = {};
    feedbackData.merchants.forEach(merchant => {
      initialFeedback[merchant.merchantId] = {
        rating: 0,
        comment: ''
      };
    });
    setFeedback(initialFeedback);
  }, [feedbackData]);

  const handleRatingChange = (merchantId: number, rating: number) => {
    setFeedback(prev => ({
      ...prev,
      [merchantId]: {
        ...prev[merchantId],
        rating
      }
    }));
  };

  const handleCommentChange = (merchantId: number, comment: string) => {
    setFeedback(prev => ({
      ...prev,
      [merchantId]: {
        ...prev[merchantId],
        comment
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!orderId) return;
    
    try {
      setSubmitting(true);
      
      // Ici, vous devriez appeler votre API pour soumettre les évaluations
      // Par exemple: await submitMerchantFeedback(orderId, feedback);
      
      // Simulation d'un appel API réussi
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/commandes');
      }, 2000);
      
    } catch (err: any) {
      console.error('Erreur lors de la soumission des évaluations:', err);
      setSubmitError(err.message || 'Une erreur est survenue lors de la soumission');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (merchantId: number, currentRating: number) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            onClick={() => handleRatingChange(merchantId, star)}
            className="focus:outline-none"
          >
            <Star
              size={24}
              className={`${
                star <= currentRating
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-gray-300'
              } cursor-pointer`}
            />
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-orange-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
        <button
          onClick={() => navigate('/commandes')}
          className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
        >
          Retour aux commandes
        </button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <p>Merci pour vos évaluations ! Elles ont été enregistrées avec succès.</p>
        </div>
        <p>Vous allez être redirigé vers la liste de vos commandes...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Évaluer les marchands</h1>
      <p className="mb-6 text-gray-600">
        Votre commande #{orderId} a été confirmée. Partagez votre expérience avec les marchands suivants :
      </p>
      
      {merchants.length === 0 ? (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <p>Aucun marchand à évaluer pour cette commande.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="space-y-8">
            {merchants.map(merchant => (
              <div key={merchant.merchantId} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-xl font-semibold mb-4">{merchant.shopName}</h2>
                
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Votre note :</label>
                  {renderStars(merchant.merchantId, feedback[merchant.merchantId]?.rating || 0)}
                </div>
                
                <div className="mb-4">
                  <label htmlFor={`comment-${merchant.merchantId}`} className="block text-gray-700 mb-2">
                    Commentaire (optionnel) :
                  </label>
                  <textarea
                    id={`comment-${merchant.merchantId}`}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Partagez votre expérience avec ce marchand..."
                    value={feedback[merchant.merchantId]?.comment || ''}
                    onChange={(e) => handleCommentChange(merchant.merchantId, e.target.value)}
                  ></textarea>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-8 flex space-x-4">
            <button
              type="button"
              onClick={() => navigate('/commandes')}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting || merchants.some(m => !feedback[m.merchantId]?.rating)}
              className={`px-4 py-2 rounded-md text-white ${
                submitting || merchants.some(m => !feedback[m.merchantId]?.rating)
                  ? 'bg-orange-300 cursor-not-allowed'
                  : 'bg-orange-500 hover:bg-orange-600'
              }`}
            >
              {submitting ? 'Envoi en cours...' : 'Soumettre les évaluations'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default MerchantFeedback;