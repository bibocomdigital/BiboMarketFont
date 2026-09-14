"use client";

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  ShoppingBag,
  Users,
  UserPlus,
  UserMinus,
  Heart,
  Loader,
  LogIn,
  MessageSquare
} from 'lucide-react';

// Services
import { getPhotoUrl, getCurrentUser } from '@/services/authService';
import { useFollowersQuery, useFollowingQuery, useFollowStatusQuery } from '@/hooks/queries/use-user-query';
import { useToggleFollowMutation } from '@/hooks/mutations/use-catalog-mutations';

// Composant UI Button
import { Button } from '@/components/ui/button';

const MerchantProfileView = ({ merchant, onClose, isModal = false }) => {
  // Hook de navigation pour rediriger vers la page de connexion
  const navigate = useNavigate();
  
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const ownerId = merchant?.owner?.id as number | undefined;
  const followersQuery = useFollowersQuery(ownerId ?? null);
  const followingQuery = useFollowingQuery(ownerId ?? null);
  const followStatusQuery = useFollowStatusQuery(ownerId ?? null, isUserLoggedIn);
  const toggleFollowMutation = useToggleFollowMutation();
  const followData = {
    isFollowing: followStatusQuery.data?.isFollowing ?? false,
    followerCount: followersQuery.data?.pagination.total ?? 0,
    followingCount: followingQuery.data?.pagination.total ?? 0,
  };
  const loading = (followersQuery.isPending && !followersQuery.data) || (followingQuery.isPending && !followingQuery.data);
  const actionLoading = toggleFollowMutation.isPending;
  const [error, setError] = useState(null);

  // S'assurer que l'objet merchant est valide
  const isValidMerchant = merchant && typeof merchant === 'object';
  const owner = isValidMerchant && merchant.owner ? merchant.owner : {};
  const stats = isValidMerchant && merchant.merchantStats ? merchant.merchantStats : {
    totalProducts: 0,
    memberSince: ''
  };

  // Vérifier si l'utilisateur est connecté au chargement du composant
  useEffect(() => {
    const user = getCurrentUser();
    setIsUserLoggedIn(!!user);
  }, []);

  // Redirection vers la page de connexion
  const redirectToLogin = () => {
    // Stocker l'URL actuelle pour y revenir après la connexion
    navigate('/login', { state: { returnUrl: window.location.pathname } });
  };

  // Gérer l'affichage de la page de message
  const handleMessageClick = () => {
    if (!isUserLoggedIn) {
      redirectToLogin();
      return;
    }
    
   
    navigate(`/messages/${owner.id}`);
  };

  // Gérer l'abonnement / désabonnement
  const handleToggleFollow = async () => {
    if (!owner.id) return;
    
    // Vérifier si l'utilisateur est connecté
    if (!isUserLoggedIn) {
      // Rediriger vers la page de connexion
      redirectToLogin();
      return;
    }
    
    try {
      await toggleFollowMutation.mutateAsync(owner.id);
      setError(null);
    } catch (err) {
      console.error('Erreur lors du changement d\'abonnement:', err);
      setError('Échec de l\'opération');
    }
  };

  // Formatage de la date
  const formatDate = (dateString) => {
    if (!dateString) return 'Non disponible';
    
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return 'Date invalide';
    }
  };

  // Rendu du bouton Suivre/Se désabonner en fonction de l'état de connexion
  const renderFollowButton = () => {
    // Si l'utilisateur n'est pas connecté
    if (!isUserLoggedIn) {
      return (
        <Button 
          variant="default"
          className="flex-1 bg-orange-500 text-white hover:bg-orange-600"
          onClick={redirectToLogin}
        >
          <LogIn size={16} className="mr-2" />
          Se connecter pour suivre
        </Button>
      );
    }
    
    // Si l'utilisateur est connecté
    return (
      <Button 
        variant={followData.isFollowing ? "secondary" : "default"}
        className={`flex-1 ${
          followData.isFollowing 
            ? 'bg-gray-200 text-gray-800 hover:bg-gray-300' 
            : 'bg-orange-500 text-white hover:bg-orange-600'
        }`}
        onClick={handleToggleFollow}
        disabled={actionLoading}
      >
        {actionLoading ? (
          <span className="flex items-center">
            <Loader size={16} className="animate-spin mr-2" />
            Chargement...
          </span>
        ) : followData.isFollowing ? (
          <>
            <UserMinus size={16} className="mr-2" />
            Se désabonner
          </>
        ) : (
          <>
            <UserPlus size={16} className="mr-2" />
            Suivre
          </>
        )}
      </Button>
    );
  };

  // Message pour les utilisateurs non connectés
  const renderConnectionMessage = () => {
    if (!isUserLoggedIn && !loading) {
      return (
        <div className="bg-yellow-50 border border-yellow-100 text-yellow-700 p-2 rounded text-sm mb-4 flex items-center justify-between">
          <span>Connectez-vous pour suivre</span>
          <button 
            onClick={redirectToLogin} 
            className="text-blue-600 hover:underline text-xs font-medium"
          >
            Se connecter
          </button>
        </div>
      );
    }
    return null;
  };

  // Contenu principal du profil
  const profileContent = (
    <>
      {loading ? (
        <div className="p-10 flex flex-col items-center justify-center">
          <Loader className="animate-spin text-orange-500 mb-4" size={40} />
          <p className="text-gray-600">Chargement des informations...</p>
        </div>
      ) : (
        <>
          {/* Profile section */}
          <div className="p-6">
            <div className="flex items-start gap-5">
              {/* Photo */}
              <div className="w-20 h-20 rounded-full border-2 border-orange-500 p-0.5 overflow-hidden flex-shrink-0">
                {owner.photo ? (
                  <img 
                    src={getPhotoUrl(owner.photo)}
                    alt={`${owner.firstName || ''} ${owner.lastName || ''}`}
                    className="w-full h-full object-cover rounded-full"
                    onError={(e) => {
                      // TypeScript cast
                      const target = e.target as HTMLImageElement;
                      // Image de fallback si l'image ne peut pas être chargée
                      target.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22128%22%20height%3D%22128%22%20viewBox%3D%220%200%20128%20128%22%3E%3Crect%20fill%3D%22%23E0E0E0%22%20width%3D%22128%22%20height%3D%22128%22%2F%3E%3Ctext%20fill%3D%22%23757575%22%20font-family%3D%22Arial%22%20font-size%3D%2224%22%20text-anchor%3D%22middle%22%20x%3D%2264%22%20y%3D%2264%22%3E%3F%3C%2Ftext%3E%3C%2Fsvg%3E';
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-orange-100 flex items-center justify-center rounded-full">
                    <User className="text-orange-500" size={30} />
                  </div>
                )}
              </div>
              
              {/* Infos */}
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-800">
                  {owner.firstName || ''} {owner.lastName || ''}
                </h2>
                
                <div className="text-sm text-gray-500">
                  {merchant.name || ''}
                </div>
                
                {/* Statistiques */}
                <div className="flex gap-4 mt-3">
                  <div className="text-center">
                    <p className="font-bold text-gray-800">{stats.totalProducts || 0}</p>
                    <p className="text-xs text-gray-500">Produits</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-gray-800">{followData.followerCount}</p>
                    <p className="text-xs text-gray-500">Abonnés</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-gray-800">{followData.followingCount}</p>
                    <p className="text-xs text-gray-500">Abonnements</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Message de connexion */}
            {renderConnectionMessage()}
            
            {/* Message d'erreur */}
            {error && (
              <div className="mt-2 p-2 bg-red-50 text-red-600 text-sm rounded-md">
                {error}
              </div>
            )}
            
            {/* Boutons action */}
            <div className="mt-4 flex gap-2">
              {renderFollowButton()}
              <Button
                variant="secondary"
                className="flex-1 bg-gray-100 text-gray-800 hover:bg-gray-200"
                onClick={handleMessageClick}
              >
                <MessageSquare size={16} className="mr-2" />
                Message
              </Button>
            </div>
            
            {/* Description */}
            {merchant.description && (
              <div className="mt-4 text-gray-700 text-sm">
                {merchant.description}
              </div>
            )}
          </div>
          
          {/* Informations de contact */}
          <div className="border-t border-gray-100 p-6 space-y-4 bg-gray-50">
            <h4 className="font-semibold text-gray-700">Informations de contact</h4>
            
            {/* Email */}
            {owner.email && (
              <div className="flex items-center">
                <Mail className="mr-3 text-orange-500" size={20} />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium text-gray-700">{owner.email}</p>
                </div>
              </div>
            )}
            
            {/* Téléphone */}
            {(owner.phone || owner.phoneNumber) && (
              <div className="flex items-center">
                <Phone className="mr-3 text-orange-500" size={20} />
                <div>
                  <p className="text-sm text-gray-500">Téléphone</p>
                  <p className="font-medium text-gray-700">{owner.phone || owner.phoneNumber}</p>
                </div>
              </div>
            )}
            
            {/* Adresse */}
            {merchant.address && (
              <div className="flex items-center">
                <MapPin className="mr-3 text-orange-500" size={20} />
                <div>
                  <p className="text-sm text-gray-500">Adresse</p>
                  <p className="font-medium text-gray-700">{merchant.address}</p>
                </div>
              </div>
            )}
            
            {/* Date de création du compte */}
            {stats.memberSince && (
              <div className="flex items-center">
                <Calendar className="mr-3 text-orange-500" size={20} />
                <div>
                  <p className="text-sm text-gray-500">Membre depuis</p>
                  <p className="font-medium text-gray-700">{formatDate(stats.memberSince)}</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Footer avec badges et statistiques */}
          <div className="bg-orange-50 p-4 flex justify-around">
            <div className="text-center">
              <ShoppingBag className="mx-auto mb-1 text-orange-500" size={20} />
              <p className="text-xs text-gray-500">Produits</p>
              <p className="font-bold text-orange-600">
                {stats.totalProducts || 0}
              </p>
            </div>
            
            <div className="text-center">
              <Users className="mx-auto mb-1 text-orange-500" size={20} />
              <p className="text-xs text-gray-500">Abonnés</p>
              <p className="font-bold text-orange-600">
                {followData.followerCount}
              </p>
            </div>
            
            <div className="text-center">
              <Heart className="mx-auto mb-1 text-orange-500" size={20} />
              <p className="text-xs text-gray-500">Likes</p>
              <p className="font-bold text-orange-600">
                {merchant.likesCount || 0}
              </p>
            </div>
          </div>
        </>
      )}
    </>
  );

  // Rendu conditionnel basé sur isModal
  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-auto overflow-hidden">
          {/* Header - seulement pour la version modal */}
          <div className="relative bg-gradient-to-r from-orange-400 to-orange-600 text-white py-3 px-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Profil du commerçant</h3>
              <button 
                onClick={onClose} 
                className="text-white hover:text-orange-100 transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
          {profileContent}
        </div>
      </div>
    );
  }

  // Rendu pour une intégration directe dans la page (non-modal)
  return <div className="merchant-profile-content overflow-hidden">{profileContent}</div>;
};

export default MerchantProfileView;