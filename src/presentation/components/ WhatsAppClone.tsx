"use client";

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  ArrowLeft, 
  MoreVertical, 
  Mic, 
  User,
  Filter,
  Plus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Import des composants UI existants
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ConversationArea from './ConversationArea'; // Notre composant réutilisable

// Import des services
import { 
  getConversations,
  getMessages,
  sendMessage, 
  markAllAsRead,
  updateMessage,
  deleteMessage
} from '@/services/messageService';
import { getCurrentUser, getPhotoUrl as getPhotoUrlFromService } from '@/services/authService';

type WhatsAppCloneProps = {
  embedded?: boolean;
  variant?: "default" | "merchant";
};

const WhatsAppClone = ({ embedded = false, variant = "default" }: WhatsAppCloneProps) => {
  const merchant = variant === "merchant";
  // États
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChat, setSelectedChat] = useState(null);
  const [partner, setPartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [chats, setChats] = useState([]);
  const [windowWidth, setWindowWidth] = useState(typeof window === "undefined" ? 1024 : window.innerWidth);
  const [showSidebar, setShowSidebar] = useState(true);
  const [mediaFile, setMediaFile] = useState(null);
  const [showMediaPreview, setShowMediaPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  
  const navigate = useNavigate();

  // Responsivité
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      if (window.innerWidth < 768) {
        if (selectedChat) {
          setShowSidebar(false);
        } else {
          setShowSidebar(true);
        }
      } else {
        setShowSidebar(true);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [selectedChat]);

  // Charger l'utilisateur actuel et les conversations au montage du composant
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      
      try {
        // Récupérer l'utilisateur actuel
        const user = getCurrentUser();
        if (!user) {
          if (!embedded) {
            navigate('/login', { state: { returnUrl: window.location.pathname } });
          }
          return;
        }
        
        setCurrentUser(user);
        
        // Récupérer les conversations
        const conversationsResponse = await getConversations();
        
        if (conversationsResponse && conversationsResponse.success) {
          setChats(conversationsResponse.data);
          console.log('Conversations récupérées:', conversationsResponse.data);
        } else {
          setError('Erreur lors de la récupération des conversations');
        }
      } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
        setError('Erreur lors de la récupération des données');
      } finally {
        setLoading(false);
      }
    };
    
    init();
  }, [navigate, embedded]);

  // Charger les messages quand un chat est sélectionné
  useEffect(() => {
    const fetchMessages = async () => {
      if (selectedChat && selectedChat.partnerId) {
        try {
          setLoading(true);
          
          // Marquer tous les messages comme lus
          try {
            await markAllAsRead(selectedChat.partnerId);
          } catch (error) {
            console.warn('Erreur lors du marquage des messages comme lus:', error);
          }
          
          // Récupérer les messages
          const messagesResponse = await getMessages(selectedChat.partnerId);
          
          if (messagesResponse && messagesResponse.success) {
            setMessages(messagesResponse.data.messages);
            setPartner(messagesResponse.data.partner);
            
            // Mise à jour du chat dans la liste avec le compteur de messages non lus à 0
            setChats(prevChats => 
              prevChats.map(chat => 
                chat.partnerId === selectedChat.partnerId 
                  ? { ...chat, unreadCount: 0 } 
                  : chat
              )
            );
          } else {
            setError('Erreur lors de la récupération des messages');
          }
        } catch (error) {
          console.error('Erreur lors de la récupération des messages:', error);
          setError('Erreur lors de la récupération des messages');
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchMessages();
  }, [selectedChat]);

  // Filtrer les chats en fonction de la recherche
  const filteredChats = chats.filter(chat => 
    chat.partnerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (chat.lastMessage && chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Sélectionner un chat et afficher la conversation
  const openChat = (chat) => {
    setSelectedChat(chat);
    
    // Sur mobile, masquer la sidebar
    if (windowWidth < 768) {
      setShowSidebar(false);
    }
  };

  // Revenir à la liste des chats
  const backToList = () => {
    if (windowWidth < 768) {
      setShowSidebar(true);
      setSelectedChat(null);
    }
  };

  // Envoyer un message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if ((!messageText.trim() && !mediaFile) || !selectedChat) return;
    
    setSending(true);
    setError(null);
    
    try {
      // Utiliser le service pour envoyer le message avec ou sans média
      const response = await sendMessage(selectedChat.partnerId, messageText, mediaFile || undefined);
      
      // Ajouter le message à la liste des messages
      if (response && response.success && response.data) {
        setMessages(prevMessages => [...prevMessages, response.data]);
        
        // Mise à jour de la liste des chats avec le dernier message
        setChats(prevChats => 
          prevChats.map(chat => 
            chat.partnerId === selectedChat.partnerId 
              ? {
                  ...chat,
                  lastMessage: mediaFile ? '📎 Media' : messageText,
                  lastMediaUrl: mediaFile ? 'pending-upload' : null,
                  lastMediaType: mediaFile ? (mediaFile.type.startsWith('image/') ? 'image' : 'video') : null,
                  lastMessageTime: new Date().toISOString()
                }
              : chat
          )
        );
      } else {
        setError('Erreur lors de l\'envoi du message');
      }
      
      // Réinitialiser le champ après envoi
      setMessageText('');
      setMediaFile(null);
      setShowMediaPreview(false);
      
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      setError(error.message || 'Erreur lors de l\'envoi du message. Veuillez réessayer.');
    } finally {
      setSending(false);
    }
  };

  // Fonction pour ouvrir le sélecteur de fichier
  const handleOpenFileSelector = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*,video/*';
    fileInput.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        const file = target.files[0];
        
        // Vérifier la taille du fichier (limite à 10 Mo)
        if (file.size > 10 * 1024 * 1024) {
          setError('Le fichier est trop volumineux. Taille maximale: 10 Mo.');
          return;
        }
        
        // Vérifier le type du fichier
        if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
          setError('Seules les images et les vidéos sont acceptées.');
          return;
        }
        
        setMediaFile(file);
        setShowMediaPreview(true);
        setError(null);
      }
    };
    fileInput.click();
  };

  // Supprimer le média sélectionné
  const handleRemoveMedia = () => {
    setMediaFile(null);
    setShowMediaPreview(false);
  };

  // Formater la date
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  // Formater la date pour les conversations
  const formatChatDate = (date) => {
    const dateObj = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (dateObj.toDateString() === today.toDateString()) {
      return formatTime(dateObj);
    } else if (dateObj.toDateString() === yesterday.toDateString()) {
      return 'Hier';
    } else {
      return dateObj.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    }
  };

  // Obtenir l'URL de la photo de profil
  const getPhotoUrl = (photoPath) => {
    if (photoPath) {
      return photoPath; // Utiliser directement l'URL fournie par l'API
    }
    return '/api/placeholder/100/100'; // Avatar par défaut
  };

  // Liste des chats
  const renderChatList = () => (
    <div className="flex flex-col h-full w-full">
      {/* En-tête */}
      <div className={`${merchant ? "bg-bibocom-primary" : "bg-green-600"} text-white p-4 flex justify-between items-center`}>
        <h1 className="text-xl font-semibold">Discussions</h1>
        <div className="flex gap-4">
          <Button variant="ghost" size="icon" className={`text-white ${merchant ? "hover:bg-white/10" : "hover:bg-green-700"}`}>
            <Filter size={20} />
          </Button>
          <Button variant="ghost" size="icon" className={`text-white ${merchant ? "hover:bg-white/10" : "hover:bg-teal-700"}`}>
            <Search size={20} />
          </Button>
          <Button variant="ghost" size="icon" className={`text-white ${merchant ? "hover:bg-white/10" : "hover:bg-teal-700"}`}>
            <MoreVertical size={20} />
          </Button>
        </div>
      </div>
      
      {/* Barre de recherche */}
      <div className={`p-2 ${merchant ? "bg-bibocom-light" : "bg-gray-100"}`}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
          <Input
            type="text"
            placeholder="Rechercher ou démarrer une nouvelle discussion"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full rounded-full bg-white"
          />
        </div>
      </div>
      
      {/* Liste des chats */}
      {loading && chats.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className={`animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 ${merchant ? "border-bibocom-accent" : "border-teal-500"}`}></div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto bg-white">
          {filteredChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
              <div className="mb-2">
                <Search size={48} className="text-gray-300" />
              </div>
              <p className="text-center">Aucune conversation trouvée.</p>
              {searchQuery && <p className="text-center mt-1">Essayez une autre recherche.</p>}
            </div>
          ) : (
            filteredChats.map((chat) => (
              <div
                key={chat.partnerId}
                onClick={() => openChat(chat)}
                className={`flex items-start p-3 cursor-pointer border-b border-gray-100 ${
                  selectedChat?.partnerId === chat.partnerId
                    ? merchant
                      ? "bg-bibocom-light"
                      : "bg-gray-100"
                    : "hover:bg-gray-50"
                }`}
              >
                {/* Avatar */}
                <div className="relative">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                    {chat.partnerPhoto ? (
                      <img
                        src={getPhotoUrl(chat.partnerPhoto)}
                        alt={chat.partnerName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="text-gray-400" size={24} />
                    )}
                  </div>
                </div>
                
                {/* Informations du chat */}
                <div className="ml-3 flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium text-gray-900 truncate">
                      {chat.partnerName}
                      {chat.partnerRole && (
                        <span className={`ml-1 text-xs rounded px-1 py-0.5 ${
                          merchant ? "bg-bibocom-secondary/30 text-bibocom-primary" : "bg-green-100 text-green-800"
                        }`}>
                          {chat.partnerRole}
                        </span>
                      )}
                    </h3>
                    <span className="text-xs text-gray-500">
                      {formatChatDate(chat.lastMessageTime)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-sm text-gray-500 truncate flex items-center">
                      {chat.lastMediaType ? (
                        <span className="flex items-center text-gray-500">
                          <Mic size={14} className="mr-1" />
                          {chat.lastMediaType === 'audio' ? '🎵 Audio' : chat.lastMediaType === 'image' ? '🖼️ Image' : '🎬 Vidéo'}
                        </span>
                      ) : (
                        chat.lastMessage
                      )}
                    </p>
                    {chat.unreadCount > 0 && (
                      <span className={`${merchant ? "bg-bibocom-accent" : "bg-green-500"} text-white rounded-full h-5 w-5 flex items-center justify-center text-xs`}>
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
      
      {!embedded && (
      <div className="p-4 bg-gray-100 border-t border-gray-200">
        <Button 
          className="bg-green-500 hover:bg-green-600 text-white rounded-full w-full flex items-center justify-center gap-2"
          onClick={() => navigate('/contacts')}
        >
          <Plus size={18} />
          <span>Nouvelle discussion</span>
        </Button>
      </div>
      )}
    </div>
  );

  // Conversation
  const renderConversation = () => {
    if (!selectedChat) return (
      <div className={`flex-1 flex flex-col justify-center items-center hidden md:flex ${merchant ? "bg-bibocom-light" : "bg-gray-100"}`}>
        <div className="text-center p-8">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
            merchant ? "bg-bibocom-secondary/30" : "bg-green-100"
          }`}>
            <Search size={24} className={merchant ? "text-bibocom-primary" : "text-green-600"} />
          </div>
          <h2 className={`text-xl font-medium mb-2 ${merchant ? "text-bibocom-primary" : "text-gray-800"}`}>
            {merchant ? "Messagerie" : "WhatsApp Web"}
          </h2>
          <p className="text-gray-600 mb-6">
            {merchant
              ? "Sélectionnez une conversation pour échanger avec vos clients."
              : <>Envoyez et recevez des messages sans avoir à garder votre téléphone connecté.<br />
            Utilisez WhatsApp sur un maximum de 4 appareils connectés et 1 téléphone à la fois.</>}
          </p>
        </div>
      </div>
    );
    
    return (
      <div className="flex flex-col h-full flex-1">
        {/* En-tête */}
        <div className={`${merchant ? "bg-bibocom-primary" : "bg-green-600"} text-white p-2 flex items-center`}>
          {windowWidth < 768 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={backToList}
              className={`text-white mr-1 md:hidden ${merchant ? "hover:bg-white/10" : "hover:bg-teal-700"}`}
            >
              <ArrowLeft size={22} />
            </Button>
          )}
          
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden mr-3">
            {partner && partner.photo ? (
              <img
                src={getPhotoUrl(partner.photo)}
                alt={partner.firstName}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="text-gray-400" size={20} />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold truncate">
              {partner ? `${partner.firstName} ${partner.lastName}` : selectedChat.partnerName}
            </h2>
            {partner && partner.role && (
              <p className={`text-xs truncate ${merchant ? "text-bibocom-secondary" : "text-green-100"}`}>
                {partner.role}
              </p>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className={`text-white ${merchant ? "hover:bg-white/10" : "hover:bg-green-700"}`}>
              <Search size={18} />
            </Button>
            <Button variant="ghost" size="icon" className={`text-white ${merchant ? "hover:bg-white/10" : "hover:bg-teal-700"}`}>
              <MoreVertical size={18} />
            </Button>
          </div>
        </div>
        
        {/* Zone de conversation */}
        <ConversationArea
          messages={messages}
          messageText={messageText}
          setMessageText={setMessageText}
          handleSendMessage={handleSendMessage}
          formatTime={formatTime}
          isDarkMode={false}
          variant={variant}
          sending={sending}
          currentUser={currentUser}
          recipient={partner || selectedChat}
          getPhotoUrl={getPhotoUrl}
          mediaFile={mediaFile}
          showMediaPreview={showMediaPreview}
          handleOpenFileSelector={handleOpenFileSelector}
          handleRemoveMedia={handleRemoveMedia}
          error={error}
        />
      </div>
    );
  };

  return (
    <div className={`${embedded ? "h-full" : "h-screen"} flex flex-col bg-white overflow-hidden w-full ${embedded ? "" : "shadow-xl max-w-screen-2xl mx-auto"}`}>
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar liste de conversations */}
        {showSidebar && (
          <div className={`${windowWidth < 768 ? 'w-full' : 'w-1/3 border-r border-gray-200'} min-w-[320px] max-w-md md:block flex-shrink-0`}>
            {renderChatList()}
          </div>
        )}
        
        {/* Zone de conversation */}
        <div className={`${showSidebar && windowWidth >= 768 ? 'flex-1' : 'w-full'} md:block ${!showSidebar || windowWidth >= 768 ? 'block' : 'hidden'}`}>
          {renderConversation()}
        </div>
      </div>
    </div>
  );
};

export default WhatsAppClone;