"use client";

import React, { useState } from 'react';
import { respondToMessage } from '@/services/shopService'; // Assurez-vous d'importer le service approprié

interface RespondToMessageProps {
  contactId: number;
  onRespond?: (response: string) => void;
}

const RespondToMessage: React.FC<RespondToMessageProps> = ({ contactId, onRespond }) => {
  const [response, setResponse] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!response.trim()) {
      setError('La réponse ne peut pas être vide');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await respondToMessage(contactId, response);
      
      // Réinitialiser le formulaire
      setResponse('');
      
      // Appeler le callback si fourni
      if (onRespond) {
        onRespond(response);
      }

      // Afficher un message de succès (vous pouvez personnaliser)
      alert('Réponse envoyée avec succès !');
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors de l\'envoi de la réponse');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label 
          htmlFor="response" 
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Votre réponse
        </label>
        <textarea
          id="response"
          rows={4}
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="Saisissez votre réponse..."
          required
        ></textarea>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className={`
          bg-purple-600 text-white px-4 py-2 rounded-lg 
          hover:bg-purple-700 transition-colors
          ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {isLoading ? 'Envoi en cours...' : 'Envoyer la réponse'}
      </button>
    </form>
  );
};

export default RespondToMessage;