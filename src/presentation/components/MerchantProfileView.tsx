"use client";

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  UserPlus,
  UserMinus,
  Loader,
  LogIn,
  MessageSquare
} from 'lucide-react';

// Services
import { getPhotoUrl, getCurrentUser } from '@/services/authService';
import { getUserErrorMessage } from '@domain/errors/app-error';
import { useFollowersQuery, useFollowingQuery, useFollowStatusQuery } from '@/hooks/queries/use-user-query';
import { useToggleFollowMutation } from '@/hooks/mutations/use-catalog-mutations';

// Composant UI Button
import { Button } from '@/components/ui/button';

const MerchantProfileView = ({ merchant, onClose, isModal = false, compact = false }) => {
  // Hook de navigation pour rediriger vers la page de connexion
  const navigate = useNavigate();
  
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const ownerId = Number(merchant?.owner?.id) || null;
  const followersQuery = useFollowersQuery(ownerId);
  const followingQuery = useFollowingQuery(ownerId);
  const followStatusQuery = useFollowStatusQuery(ownerId, isUserLoggedIn);
  const toggleFollowMutation = useToggleFollowMutation();
  const isOwnProfile = currentUserId != null && ownerId != null && currentUserId === ownerId;
  const followData = {
    isFollowing: followStatusQuery.data?.isFollowing ?? false,
    followerCount: toggleFollowMutation.data?.followerCount
      ?? followersQuery.data?.pagination.total
      ?? 0,
    followingCount: followingQuery.data?.pagination.total ?? 0,
  };
  const loading = (followersQuery.isPending && !followersQuery.data) || (followingQuery.isPending && !followingQuery.data);
  const actionLoading = toggleFollowMutation.isPending;
  const [error, setError] = useState(null);
  const [showFollowing, setShowFollowing] = useState(false);
  const followingList = followingQuery.data?.following ?? [];

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
    setCurrentUserId(user?.id != null ? Number(user.id) : null);
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
    
   
    navigate(`/client-dashboard?view=messages&partner=${owner.id}`);
  };

  // Gérer l'abonnement / désabonnement
  const handleToggleFollow = async () => {
    if (!ownerId) return;
    if (!isUserLoggedIn) {
      redirectToLogin();
      return;
    }
    if (isOwnProfile) {
      setError('Vous ne pouvez pas suivre votre propre profil');
      return;
    }

    setError(null);
    try {
      await toggleFollowMutation.mutateAsync(ownerId);
    } catch (err) {
      console.error('Erreur lors du changement d\'abonnement:', err);
      setError(getUserErrorMessage(err) || 'Impossible de mettre à jour l’abonnement');
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

  const renderFollowButton = () => {
    if (isOwnProfile) {
      return (
        <Button variant="secondary" className="flex-1 bg-gray-100 text-gray-500" disabled>
          Votre boutique
        </Button>
      );
    }

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
        {followData.isFollowing ? (
          <>
            {actionLoading ? <Loader size={16} className="mr-2 animate-spin" /> : <UserMinus size={16} className="mr-2" />}
            Se désabonner
          </>
        ) : (
          <>
            {actionLoading ? <Loader size={16} className="mr-2 animate-spin" /> : <UserPlus size={16} className="mr-2" />}
            Suivre
          </>
        )}
      </Button>
    );
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
          <div className={compact ? "p-0" : "p-6"}>
            <div className="flex items-center gap-3">
              {/* Photo */}
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full border-2 border-orange-500 p-0.5">
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
              
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-lg font-bold text-gray-800">
                  {owner.firstName || ''} {owner.lastName || ''}
                </h2>
                <p className="truncate text-sm text-gray-500">{merchant.name || ''}</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="min-w-0 rounded-xl bg-slate-50 px-1 py-2">
                <p className="font-bold text-gray-800">{stats.totalProducts || 0}</p>
                <p className="text-[11px] leading-tight text-gray-500">Produits</p>
              </div>
              <div className="min-w-0 rounded-xl bg-slate-50 px-1 py-2">
                <p className="font-bold text-gray-800">{followData.followerCount}</p>
                <p className="text-[11px] leading-tight text-gray-500">Abonnés</p>
              </div>
              <button
                type="button"
                onClick={() => setShowFollowing((open) => !open)}
                className={`min-w-0 rounded-xl px-1 py-2 ${showFollowing ? "bg-orange-50" : "bg-slate-50 hover:bg-orange-50"}`}
                aria-expanded={showFollowing}
              >
                <p className="font-bold text-gray-800">{followData.followingCount}</p>
                <p className="text-[11px] leading-tight text-bibocom-accent">Abonnements</p>
              </button>
            </div>

            {showFollowing && (
              <div className="mt-4 rounded-2xl bg-slate-50 p-3">
                <p className="text-sm font-semibold text-bibocom-primary">Abonnements</p>
                {followingQuery.isPending ? (
                  <p className="mt-2 text-xs text-slate-500">Chargement…</p>
                ) : followingQuery.isError ? (
                  <p className="mt-2 text-xs text-red-500">Impossible de charger les abonnements.</p>
                ) : followingList.length === 0 ? (
                  <p className="mt-2 text-xs text-slate-500">Cette boutique ne suit encore personne.</p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {followingList.map((person) => {
                      const name = `${person.firstName || ""} ${person.lastName || ""}`.trim() || "Utilisateur";
                      const photo = person.photo ? getPhotoUrl(person.photo) : "";
                      return (
                        <li key={person.id} className="flex items-center gap-2">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-orange-100 text-xs font-semibold text-orange-600">
                            {photo ? (
                              <img src={photo} alt="" className="h-full w-full object-cover" />
                            ) : (
                              name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <span className="min-w-0 truncate text-sm text-gray-800">{name}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
            
            {/* Message d'erreur */}
            {error && (
              <div className="mt-2 p-2 bg-red-50 text-red-600 text-sm rounded-md">
                {error}
              </div>
            )}
            
            <div className="mt-4 flex gap-2">
              {isUserLoggedIn ? (
                <>
                  {renderFollowButton()}
                  <Button
                    variant="secondary"
                    className="flex-1 bg-gray-100 text-gray-800 hover:bg-gray-200"
                    onClick={handleMessageClick}
                  >
                    <MessageSquare size={16} className="mr-2" />
                    Message
                  </Button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={redirectToLogin}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-bibocom-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-bibocom-accent/90"
                >
                  <LogIn size={16} />
                  Se connecter pour suivre
                </button>
              )}
            </div>
            
            {isModal && merchant.description && (
              <div className="mt-4 text-sm text-gray-700">
                {merchant.description}
              </div>
            )}
          </div>
          
          {!compact && (
          <>
          <div className="space-y-4 border-t border-gray-100 bg-gray-50 p-6">
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
          
          </>
          )}
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
  return <div className="merchant-profile-content">{profileContent}</div>;
};

export default MerchantProfileView;