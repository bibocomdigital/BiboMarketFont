"use client";

import React, { useState, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

// Ce composant affiche une icône de messagerie avec un badge pour les messages non lus
// et peut rediriger vers notre composant WhatsAppClone

const MessageCenter = ({ onRedirect }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  // Simuler le chargement des messages non lus depuis une API
  useEffect(() => {
    const fetchUnreadMessages = async () => {
      try {
        // Dans une implémentation réelle, vous feriez un appel API ici
        // const response = await fetch('/api/messages/unread');
        // const data = await response.json();
        // setUnreadCount(data.count);

        // Simulation avec un délai et un nombre aléatoire
        setTimeout(() => {
          setUnreadCount(Math.floor(Math.random() * 10) + 1); // Entre 1 et 10 messages
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Erreur lors du chargement des messages:', error);
        setIsLoading(false);
      }
    };

    fetchUnreadMessages();

    // Configurer un intervalle pour vérifier les nouveaux messages
    const interval = setInterval(fetchUnreadMessages, 60000); // Vérifier toutes les minutes

    return () => clearInterval(interval); // Nettoyer l'intervalle lors du démontage
  }, []);

  // Gérer le clic sur l'icône
  const handleClick = () => {
    setIsOpen(!isOpen);
    // Si vous avez besoin d'actualiser les messages à chaque clic
    // fetchUnreadMessages();
  };

  // Gérer la redirection vers le composant WhatsAppClone
  const handleRedirect = () => {
    setIsOpen(false);
    // Utiliser le callback pour naviguer vers le composant WhatsAppClone
    if (onRedirect) {
      onRedirect();
    }
  };

  // Prévisualisation rapide des derniers messages
  const recentMessages = [
    {
      id: 1,
      sender: 'Papis GUEYE',
      content: 'mais dis moi je dois faire les fichiers et la connexion a la base...',
      time: '20:20',
      unread: true,
      chatId: 1 // ID pour identifier le chat dans WhatsAppClone
    },
    {
      id: 2,
      sender: 'Grande Mere',
      content: 'Salam qui peux m\'aider là-dessus',
      time: '09:44',
      unread: true,
      chatId: 5 // ID pour identifier le chat dans WhatsAppClone
    },
    {
      id: 3,
      sender: 'CODER AVEC 2MD SERVICES',
      content: 'Impossible d\'afficher ce message',
      time: '09:13',
      unread: false,
      chatId: 8 // ID pour identifier le chat dans WhatsAppClone
    }
  ];

  return (
    <div className="relative">
      {/* Icône avec badge */}
      <button
        onClick={handleClick}
        className="relative p-2 text-gray-600 hover:text-orange-500 hover:bg-gray-100 rounded-full transition-colors focus:outline-none"
        aria-label="Messages"
      >
        <MessageSquare size={20} />
        
        {/* Badge pour les messages non lus */}
        {!isLoading && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown pour l'aperçu des messages */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg overflow-hidden z-50">
          <div className="p-3 bg-orange-500 text-white font-medium flex justify-between items-center">
            <h3>Messages</h3>
            <span className="text-sm bg-orange-600 rounded-full px-2 py-0.5">
              {unreadCount} non lu{unreadCount > 1 ? 's' : ''}
            </span>
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {/* Liste de prévisualisation des messages */}
            {recentMessages.map(message => (
              <div 
                key={message.id} 
                className={`p-3 border-b hover:bg-gray-50 cursor-pointer ${message.unread ? 'bg-orange-50' : ''}`}
                onClick={() => handleRedirect(message.chatId)}
              >
                <div className="flex justify-between items-start">
                  <span className="font-medium text-gray-800">{message.sender}</span>
                  <span className="text-xs text-gray-500">{message.time}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1 truncate">{message.content}</p>
              </div>
            ))}
          </div>
          
          <div className="p-3 bg-gray-50 border-t">
            <Link 
              to="/whatsapp"
              className="block w-full py-2 bg-orange-500 text-white text-center rounded-md hover:bg-orange-600 transition-colors"
              onClick={(e) => {
                e.preventDefault();
                handleRedirect();
              }}
            >
              Voir tous les messages
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageCenter;

