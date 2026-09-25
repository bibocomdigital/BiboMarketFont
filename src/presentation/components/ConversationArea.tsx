"use client";

import React, { useRef, useEffect } from 'react';
import { Send, Mic, Smile, Paperclip, Check, CheckCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageBody } from '@/components/messages/MessageBody';

/**
 * Composant réutilisable pour la zone de conversation
 * Avec distinction visuelle claire entre messages envoyés et reçus
 */
const ConversationArea = ({
  // Données
  messages = [],
  messageText = '',
  currentUser = null,
  recipient = null,
  mediaFile = null,
  showMediaPreview = false,
  sending = false,
  error = null,
  
  // Callbacks
  setMessageText,
  handleSendMessage,
  handleOpenFileSelector,
  handleRemoveMedia,
  handleMessageClick,
  
  // Fonctions utilitaires
  formatTime,
  getPhotoUrl,
  
  // Configuration
  isDarkMode = true,
  variant = "default",
  
  // Options d'édition
  editingMessage = null,
  setEditingMessage = null,
  handleEditMessage = null,
  handleSaveEdit = null,
  handleCancelEdit = null,
  selectedMessage = null,
  canModifyMessage = null,
  handleDeleteMessage = null,
}) => {
  const merchant = variant === "merchant";
  const messageEndRef = useRef(null);
  const editInputRef = useRef(null);

  // Effet pour faire défiler vers le dernier message
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Effet pour concentrer l'input d'édition
  useEffect(() => {
    if (editingMessage && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingMessage]);
  
  // Wrapper pour le formulaire d'envoi de message
  const onSubmitMessage = (e) => {
    e.preventDefault();
    handleSendMessage(e);
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Message d'erreur */}
      {error && (
        <div className={`${isDarkMode ? 'bg-red-900/50 text-red-200' : 'bg-red-100 text-red-600'} p-3 rounded-md text-sm mb-4 mx-4 mt-4`}>
          {error}
        </div>
      )}
      
      {/* Zone des messages */}
      <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${
          merchant ? "bg-bibocom-light" : isDarkMode ? "bg-gray-900" : "bg-gray-100"
        }`}
           style={merchant ? undefined : {backgroundImage: isDarkMode ? "none" : "url('/api/placeholder/400/400')",
                  backgroundSize: "contain",
                  backgroundRepeat: "repeat",
                  opacity: isDarkMode ? 1 : 0.95}}>
        {messages.length === 0 ? (
          <>
            <div className={`text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} text-sm my-4`}>
              Vous n'avez encore échangé aucun message avec cette personne.
            </div>
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-4 rounded-lg text-center text-sm`}>
              <p className="mb-2">Invitez {recipient?.username || recipient?.firstName || 'cette personne'} à discuter</p>
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Assurez-vous de suivre nos <span className="text-blue-400 hover:underline cursor-pointer">Règles de la communauté</span> et de faire preuve de respect quand vous envoyez des messages pour la première fois.
              </p>
            </div>
          </>
        ) : (
          <>
            {/* Marge supplémentaire en haut pour éviter que les messages ne touchent le header */}
            <div className="h-6"></div>
            
            {messages.map((msg) => {
              // Si le message a été supprimé, ne pas l'afficher
              if (!msg.content && !msg.mediaUrl && !msg.text && !msg.audio) return null;
              
              const messageText = msg.content || msg.text || "";
              
              // Déterminer si le message a été envoyé par l'utilisateur actuel
              const isCurrentUser = 
                (msg.sentByMe === true) || 
                (msg.senderId === currentUser?.id) || 
                (currentUser && currentUser.id === msg.senderId);
              
              const isEditing = editingMessage?.id === msg.id;
              const isSelected = selectedMessage?.id === msg.id;
              
              // Vérifier si le message peut être modifié
              const canEdit = canModifyMessage ? canModifyMessage(msg) : (isCurrentUser && messageText);
              
              return (
                <div 
                  key={msg.id} 
                  className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} message-container`}
                >
                  {/* Avatar pour les messages du destinataire */}
                  {!isCurrentUser && !isEditing && recipient && (
                    <div className="h-8 w-8 rounded-full overflow-hidden bg-gray-600 mr-2 flex-shrink-0">
                      {recipient.photo ? (
                        <img 
                          src={getPhotoUrl ? getPhotoUrl(recipient.photo) : recipient.photo} 
                          alt={recipient.username || `${recipient.firstName}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target;
                            target.onerror = null;
                            target.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22128%22%20height%3D%22128%22%20viewBox%3D%220%200%20128%20128%22%3E%3Crect%20fill%3D%22%23555555%22%20width%3D%22128%22%20height%3D%22128%22%2F%3E%3Ctext%20fill%3D%22%23FFFFFF%22%20font-family%3D%22Arial%22%20font-size%3D%2224%22%20text-anchor%3D%22middle%22%20x%3D%2264%22%20y%3D%2264%22%3E%3F%3C%2Ftext%3E%3C%2Fsvg%3E';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-600 text-white">
                          {recipient.firstName ? recipient.firstName.charAt(0) : 'U'}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {isEditing ? (
                    /* Mode édition */
                    <div className={`max-w-[70%] p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-white'}`}>
                      <input 
                        type="text"
                        ref={editInputRef}
                        value={editingMessage.content}
                        onChange={(e) => setEditingMessage({ ...editingMessage, content: e.target.value })}
                        className={`w-full outline-none border-b pb-1 ${
                          isDarkMode ? 'bg-transparent text-white border-gray-500' : 'bg-transparent text-gray-800 border-gray-300'
                        }`}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && handleSaveEdit) handleSaveEdit();
                          if (e.key === 'Escape' && handleCancelEdit) handleCancelEdit();
                        }}
                      />
                      <div className="flex justify-end space-x-2 mt-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className={isDarkMode ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-gray-800"}
                          onClick={handleCancelEdit}
                        >
                          Annuler
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-blue-400 hover:text-blue-300"
                          onClick={handleSaveEdit}
                        >
                          Enregistrer
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* Contenu du message normal - Avec des couleurs distinctes */
                    <div className="relative max-w-[70%] group">
                      <div 
                        className={`rounded-lg p-3 ${
                          isCurrentUser 
                            ? merchant
                              ? 'bg-bibocom-primary text-white rounded-tr-none'
                              : isDarkMode 
                              ? 'bg-green-600 text-white rounded-tr-none'
                              : 'bg-green-500 text-white rounded-tr-none'
                            : merchant
                              ? 'bg-white text-bibocom-primary rounded-tl-none shadow-sm'
                              : isDarkMode 
                              ? 'bg-gray-700 text-white rounded-tl-none'
                              : 'bg-white text-gray-800 rounded-tl-none'
                        } relative`}
                      >
                        {/* Indicateur de suppression en cours */}
                        {msg.isDeleting && (
                          <div className="absolute inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center rounded-lg z-10">
                            <div className="animate-pulse text-sm text-white flex items-center">
                              <div className="mr-2 animate-spin h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></div>
                              Suppression...
                            </div>
                          </div>
                        )}

                        {/* Texte du message (si présent) */}
                        {messageText && (
                          <div className="text-sm">
                            <MessageBody content={messageText} />
                          </div>
                        )}
                        
                        {/* Message audio (si présent) */}
                        {(msg.audio || msg.isVoiceMessage) && (
                          <div                             className={`flex items-center gap-2 py-1 ${
                            isCurrentUser 
                              ? merchant || !isDarkMode
                                ? 'text-white' 
                                : 'text-green-100'
                              : isDarkMode 
                                ? 'text-gray-300' 
                                : 'text-gray-600'
                          }`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className={`h-8 w-8 rounded-full ${
                                isCurrentUser 
                                  ? merchant
                                    ? 'text-white hover:bg-white/10'
                                    : isDarkMode
                                    ? 'text-green-200 hover:bg-green-700'
                                    : 'text-white hover:bg-green-600' 
                                  : isDarkMode
                                    ? 'text-gray-300 hover:bg-gray-600'
                                    : 'text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              <Mic size={16} />
                            </Button>
                            <div className="flex-1">
                              <div className={`h-1 rounded-full ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`}>
                                <div 
                                  className={`h-1 rounded-full ${
                                    isCurrentUser 
                                      ? merchant
                                        ? 'bg-bibocom-secondary'
                                        : isDarkMode 
                                        ? 'bg-green-400' 
                                        : 'bg-green-300' 
                                      : isDarkMode 
                                        ? 'bg-gray-400' 
                                        : 'bg-gray-500'
                                  }`} 
                                  style={{ width: '30%' }}
                                ></div>
                              </div>
                            </div>
                            <span className="text-xs">
                              {msg.audio?.duration || 
                                (msg.isVoiceMessage && msg.text) || "0:00"}
                            </span>
                          </div>
                        )}
                        
                        {/* Média (image ou vidéo) si présent */}
                        {msg.mediaUrl && (
                          <div className="mt-1 mb-2 relative">
                            {msg.mediaType === 'image' ? (
                              <div className="relative group/media">
                                <button 
                                  onClick={(e) => {
                                    const imageModal = document.createElement('div');
                                    imageModal.innerHTML = `
                                      <div class="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center">
                                        <div class="relative max-w-full max-h-full flex flex-col">
                                          <button class="absolute top-4 right-4 text-white bg-gray-800 bg-opacity-50 rounded-full p-2 z-60">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="close-modal">
                                              <line x1="18" y1="6" x2="6" y2="18"></line>
                                              <line x1="6" y1="6" x2="18" y2="18"></line>
                                            </svg>
                                          </button>
                                          <img 
                                            src="${msg.mediaUrl}" 
                                            alt="Image partagée en plein écran" 
                                            class="max-w-full max-h-full object-contain"
                                          />
                                          <div class="flex justify-center mt-4 space-x-4">
                                            <a href="${msg.mediaUrl}" download="image.jpg" class="text-white bg-gray-800 bg-opacity-50 px-4 py-2 rounded-md flex items-center">
                                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                                <polyline points="7 10 12 15 17 10"></polyline>
                                                <line x1="12" y1="15" x2="12" y2="3"></line>
                                              </svg>
                                              Télécharger
                                            </a>
                                          </div>
                                        </div>
                                      </div>
                                    `;
                                    document.body.appendChild(imageModal);
                                    
                                    const closeModal = imageModal.querySelector('.close-modal');
                                    closeModal?.addEventListener('click', () => {
                                      document.body.removeChild(imageModal);
                                    });
                                    
                                    imageModal.addEventListener('click', (event) => {
                                      if (event.target === imageModal) {
                                        document.body.removeChild(imageModal);
                                      }
                                    });
                                  }}
                                  className="block"
                                >
                                  <img 
                                    src={msg.mediaUrl} 
                                    alt="Image partagée" 
                                    className="rounded-md object-contain cursor-pointer"
                                    style={{ maxHeight: '200px', maxWidth: '100%' }}
                                    loading="lazy"
                                    onError={(e) => {
                                      const target = e.target;
                                      target.onerror = null;
                                      console.error("❌ [MEDIA] Erreur de chargement de l'image:", msg.mediaUrl);
                                      target.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22300%22%20height%3D%22200%22%20viewBox%3D%220%200%20300%20200%22%3E%3Crect%20fill%3D%22%23555555%22%20width%3D%22300%22%20height%3D%22200%22%2F%3E%3Ctext%20fill%3D%22%23FFFFFF%22%20font-family%3D%22Arial%22%20font-size%3D%2224%22%20text-anchor%3D%22middle%22%20x%3D%22150%22%20y%3D%22100%22%3EImage%20indisponible%3C%2Ftext%3E%3C%2Fsvg%3E';
                                    }}
                                  />
                                </button>
                              </div>
                            ) : msg.mediaType === 'video' ? (
                              <div className="relative group/media">
                                <video 
                                  src={msg.mediaUrl} 
                                  controls 
                                  preload="metadata"
                                  className="rounded-md"
                                  style={{ maxHeight: '200px', maxWidth: '100%' }}
                                  onError={(e) => {
                                    const videoEl = e.target;
                                    videoEl.onerror = null;
                                    console.error("❌ [MEDIA] Erreur de chargement de la vidéo:", msg.mediaUrl);
                                    // Créer un élément de remplacement
                                    const parent = videoEl.parentElement;
                                    if (parent) {
                                      parent.innerHTML = '<div class="p-3 bg-gray-600 text-white text-sm rounded-md">La vidéo n\'est pas disponible</div>';
                                    }
                                  }}
                                />
                              </div>
                            ) : (
                              <div className="bg-gray-600 p-3 rounded-md text-sm">
                                <a href={msg.mediaUrl} target="_blank" rel="noopener noreferrer" 
                                  className="flex items-center text-blue-300 hover:underline">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" 
                                      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" 
                                      strokeLinejoin="round" className="mr-2">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                    <polyline points="14 2 14 8 20 8"></polyline>
                                    <line x1="16" y1="13" x2="8" y2="13"></line>
                                    <line x1="16" y1="17" x2="8" y2="17"></line>
                                    <polyline points="10 9 9 9 8 9"></polyline>
                                  </svg>
                                  Fichier joint
                                </a>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Horodatage et statut de lecture */}
                        <div className={`text-xs flex justify-end items-center mt-1 ${
                          isCurrentUser 
                            ? merchant
                              ? 'text-white/70'
                              : 'text-green-100'
                            : isDarkMode 
                              ? 'text-gray-300' 
                              : 'text-gray-500'
                        }`}>
                          {formatTime(msg.timestamp || msg.createdAt)}
                          {isCurrentUser && (
                            <span className="ml-1">{msg.isRead ? '✓✓' : '✓'}</span>
                          )}
                          
                          {/* Icône de trois points verticaux (menu) */}
                          {handleMessageClick && (
                            <button 
                              className={`ml-2 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity message-options-button ${
                                isDarkMode 
                                  ? 'bg-gray-700 text-white' 
                                  : isCurrentUser 
                                    ? merchant
                                      ? 'bg-bibocom-primary text-white'
                                      : 'bg-green-600 text-white'
                                    : 'bg-gray-200 text-gray-600'
                              }`}
                              onClick={(e) => handleMessageClick(e, msg.id)}
                              aria-label="Options du message"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" 
                                  fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" 
                                  strokeLinejoin="round">
                                <circle cx="12" cy="5" r="1"></circle>
                                <circle cx="12" cy="12" r="1"></circle>
                                <circle cx="12" cy="19" r="1"></circle>
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {/* Menu d'options */}
                      {isSelected && handleEditMessage && handleDeleteMessage && (
                        <div className={`absolute z-10 rounded-md shadow-lg message-options-menu ${
                          isDarkMode ? 'bg-gray-800' : 'bg-white'
                        }`} 
                             style={{ 
                               bottom: '-5px',
                               right: isCurrentUser ? '0' : 'auto',
                               left: isCurrentUser ? 'auto' : '0',
                               transform: 'translateY(100%)',
                               width: '200px'
                             }}>
                          <div className="py-1">
                            <div className={`px-4 py-2 text-sm border-b ${
                              isDarkMode 
                                ? 'text-gray-300 border-gray-700' 
                                : 'text-gray-600 border-gray-200'
                            }`}>
                              Options du message
                            </div>
                            
                            <button 
                              className={`block w-full text-left px-4 py-2 text-sm ${
                                isDarkMode 
                                  ? 'text-white hover:bg-gray-700' 
                                  : 'text-gray-700 hover:bg-gray-100'
                              }`}
                              onClick={() => {/* Fonctionnalité à implémenter */}}
                            >
                              Répondre
                            </button>
                            
                            {/* Afficher les options de modification uniquement pour l'expéditeur */}
                            {canEdit && (
                              <button 
                                className={`block w-full text-left px-4 py-2 text-sm ${
                                  isDarkMode 
                                    ? 'text-white hover:bg-gray-700' 
                                    : 'text-gray-700 hover:bg-gray-100'
                                }`}
                                onClick={() => handleEditMessage(msg.id, messageText || '')}
                              >
                                Modifier
                              </button>
                            )}
                            
                            {/* Supprimer pour moi - disponible pour tout le monde */}
                            <button 
                              className={`block w-full text-left px-4 py-2 text-sm ${
                                isDarkMode 
                                  ? 'text-white hover:bg-gray-700' 
                                  : 'text-gray-700 hover:bg-gray-100'
                              }`}
                              onClick={() => handleDeleteMessage(msg.id, false)}
                            >
                              Supprimer pour moi
                            </button>
                            
                            {/* Supprimer pour tous - uniquement pour l'expéditeur */}
                            {isCurrentUser && (
                              <button 
                                className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700"
                                onClick={() => handleDeleteMessage(msg.id, true)}
                              >
                                Supprimer pour tous
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
        
        {/* Élément invisible pour faire défiler vers le dernier message */}
        <div ref={messageEndRef}></div>
      </div>
      
      {/* Prévisualisation du média */}
      {showMediaPreview && mediaFile && (
        <div className={`p-3 border-t ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-gray-200 border-gray-300'
        }`}>
          <div className="flex items-center">
            <div className="relative">
              {mediaFile.type.startsWith('image/') ? (
                <img 
                  src={URL.createObjectURL(mediaFile)} 
                  alt="Preview" 
                  className="h-20 w-20 object-cover rounded-md"
                />
              ) : mediaFile.type.startsWith('video/') ? (
                <video 
                  src={URL.createObjectURL(mediaFile)} 
                  className="h-20 w-20 object-cover rounded-md"
                />
              ) : (
                <div className="h-20 w-20 flex items-center justify-center bg-gray-700 rounded-md">
                  <span className="text-xs text-gray-300">Fichier</span>
                </div>
              )}
              <button 
                onClick={handleRemoveMedia} 
                className={`absolute -top-2 -right-2 p-1 rounded-full ${
                  isDarkMode 
                    ? 'bg-gray-900 text-gray-300 hover:text-white' 
                    : 'bg-gray-100 text-gray-500 hover:text-gray-700'
                }`}
                aria-label="Supprimer le média"
              >
                <X size={16} />
              </button>
            </div>
            <div className={`ml-3 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <p className="truncate max-w-xs">{mediaFile.name}</p>
              <p>{(mediaFile.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          </div>
        </div>
      )}

      {/* Formulaire pour envoyer un message */}
      <div className={`border-t p-4 ${
        merchant
          ? 'border-slate-100 bg-white'
          : isDarkMode 
          ? 'border-gray-800 bg-gray-800' 
          : 'border-gray-200 bg-gray-100'
      }`}>
        <form onSubmit={onSubmitMessage} className="flex items-center">
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Votre message..."
            className={`flex-1 p-3 rounded-full focus:outline-none focus:ring-1 ${
              merchant
                ? 'bg-white text-bibocom-primary focus:ring-bibocom-secondary'
                : isDarkMode 
                ? 'bg-gray-700 text-white focus:ring-green-500' 
                : 'bg-white text-gray-800 focus:ring-green-500'
            }`}
            disabled={sending}
          />
          
          {/* Bouton pour ajouter un média */}
          {handleOpenFileSelector && (
            <Button
              type="button"
              variant="ghost"
              onClick={handleOpenFileSelector}
              className={`ml-2 ${
                isDarkMode 
                  ? 'text-gray-400 hover:text-gray-300' 
                  : 'text-gray-500 hover:text-gray-600'
              }`}
              disabled={sending}
              aria-label="Joindre un média"
            >
              <Paperclip size={20} />
            </Button>
          )}
          
          {/* Bouton pour les emoji */}
          <Button
            type="button"
            variant="ghost"
            className={`ml-2 ${
              isDarkMode 
                ? 'text-gray-400 hover:text-gray-300' 
                : 'text-gray-500 hover:text-gray-600'
            }`}
            disabled={sending}
          >
            <Smile size={20} />
          </Button>
          
          {/* Bouton d'envoi */}
          <Button
            type="submit"
            variant="ghost"
            className={`ml-2 ${
              merchant
                ? 'text-bibocom-accent hover:text-bibocom-accent/80'
                : isDarkMode 
                ? 'text-green-400 hover:text-green-300' 
                : 'text-green-600 hover:text-green-700'
            }`}
            disabled={(!messageText.trim() && !mediaFile) || sending}
          >
            {sending ? (
              <div className="animate-pulse">...</div>
            ) : messageText.trim() ? (
              <Send size={20} />
            ) : (
              <Mic size={20} />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ConversationArea;