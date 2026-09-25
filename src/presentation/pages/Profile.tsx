"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  User, 
  Settings, 
  LogOut, 
  Camera, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar,
  Edit,
  Save,
  X,
  Loader2,
  UserPlus,
  UserMinus,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  logout, 
  ProfileData
} from '@/services/authService';
import { useAuthSession } from '@/hooks/use-auth-session';
import { useFollowersQuery, useFollowingQuery, useFollowStatusQuery, useProfileQuery } from '@/hooks/queries/use-user-query';
import { useUpdateProfileMutation } from '@/hooks/mutations/use-auth-mutations';
import { useToggleFollowMutation } from '@/hooks/mutations/use-catalog-mutations';

const Profile = () => {
  const navigate = useNavigate();
  const { userId } = useParams();
  const { toast } = useToast();
  const { user: sessionUser, isReady, isAuthenticated } = useAuthSession();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const profileQuery = useProfileQuery();
  const updateProfileMutation = useUpdateProfileMutation();
  const toggleFollowMutation = useToggleFollowMutation();
  const isSaving = updateProfileMutation.isPending;
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const sessionUserId = sessionUser?.id ?? 0;
  const isOwnProfile = !userId || parseInt(userId, 10) === sessionUserId;
  const isMerchantRole =
    (sessionUser?.role || "").toUpperCase() === "MERCHANT" ||
    (sessionUser?.role || "").toUpperCase() === "COMMERCANT";

  const [userInfo, setUserInfo] = useState({
    id: sessionUser?.id || 0,
    firstName: sessionUser?.firstName || '',
    lastName: sessionUser?.lastName || '',
    email: sessionUser?.email || '',
    phone: sessionUser?.phoneNumber || '',
    address: `${sessionUser?.city || ''}, ${sessionUser?.country || ''}`.replace(/^, |, $/g, ''),
    bio: '', 
    birthdate: '', 
    avatar: sessionUser?.photo || '',
    role: sessionUser?.role || '',
  });

  const [editInfo, setEditInfo] = useState({ ...userInfo });
  const followProfileId = !isOwnProfile && userId ? parseInt(userId, 10) : userInfo.id;
  const followersQuery = useFollowersQuery(followProfileId || null);
  const followingQuery = useFollowingQuery(followProfileId || null);
  const followStatusQuery = useFollowStatusQuery(userId ? parseInt(userId, 10) : null, !isOwnProfile);
  const followerCount = followersQuery.data?.pagination?.total ?? followersQuery.data?.followers?.length ?? 0;
  const followingCount = followingQuery.data?.pagination?.total ?? followingQuery.data?.following?.length ?? 0;
  const isFollowing = followStatusQuery.data?.isFollowing ?? false;
  const isLoadingFollow = toggleFollowMutation.isPending;
  const isLoading = profileQuery.isPending && !profileQuery.data && !sessionUser;

  useEffect(() => {
    if (!isReady) return;
    if (!isAuthenticated) {
      navigate("/login", { replace: true });
      return;
    }
    if (isMerchantRole && isOwnProfile) {
      navigate("/merchant-dashboard?view=profile", { replace: true });
    }
  }, [isReady, isAuthenticated, isMerchantRole, isOwnProfile, navigate]);

  useEffect(() => {
    const userData = profileQuery.data;
    if (!userData) return;
    const mapped = {
      id: userData.id || (!isOwnProfile && userId ? parseInt(userId, 10) : sessionUserId) || 0,
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      email: userData.email || '',
      phone: userData.phoneNumber || '',
      address: `${userData.city || ''}, ${userData.country || ''}`.replace(/^, |, $/g, ''),
      bio: userData.bio || '',
      birthdate: userData.birthdate || '',
      avatar: userData.photo?.toString() || '',
      role: userData.role || sessionUser?.role || '',
    };
    setUserInfo(mapped);
    setEditInfo(mapped);
  }, [profileQuery.data, isOwnProfile, userId, sessionUserId, sessionUser?.role]);

  const handleLogout = () => {
    logout();
    toast({
      title: "Déconnexion réussie",
      description: "Vous avez été déconnecté avec succès.",
    });
    navigate("/", { replace: true });
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditInfo({ ...userInfo });
  };

  const handleSave = async () => {
    try {
      console.log('Début de la sauvegarde du profil...');
      
      const addressParts = editInfo.address.split(',').map(part => part.trim());
      const city = addressParts[0] || '';
      const country = addressParts[1] || '';
      
      const profileData: ProfileData = {
        firstName: editInfo.firstName,
        lastName: editInfo.lastName,
        email: editInfo.email,
        phoneNumber: editInfo.phone,
        city,
        country,
      };
      
      if (avatarFile) {
        profileData.photo = avatarFile;
      }
      
      console.log('Données de profil à envoyer:', profileData);
      
      const updatedUser = await updateProfileMutation.mutateAsync(profileData);
      console.log('Profil mis à jour avec succès:', updatedUser);
      
      setUserInfo({
        ...userInfo,
        firstName: editInfo.firstName,
        lastName: editInfo.lastName,
        email: editInfo.email,
        phone: editInfo.phone,
        address: editInfo.address,
        bio: editInfo.bio,
        birthdate: editInfo.birthdate,
        avatar: avatarPreview || editInfo.avatar,
      });
      
      setIsEditing(false);
      
      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été mises à jour avec succès.",
      });
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      toast({
        title: "Erreur de mise à jour",
        description: error.message || "Impossible de mettre à jour votre profil",
        variant: "destructive",
      });
    }
  };

  const handleFollow = async () => {
    if (!userId) return;
    
    try {
      const response = await toggleFollowMutation.mutateAsync(parseInt(userId, 10));
      
      toast({
        title: response.action === 'followed' ? "Abonnement ajouté" : "Abonnement retiré",
        description: response.message,
      });
    } catch (error: any) {
      console.error('Erreur lors de la gestion de l\'abonnement:', error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setAvatarPreview(null);
    setAvatarFile(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditInfo({ ...editInfo, [name]: value });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      toast({
        title: "Image sélectionnée",
        description: "N'oubliez pas d'enregistrer pour appliquer les changements.",
      });
    }
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarClick = () => {
    if (!isEditing) setIsEditing(true);
    triggerFileInput();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-bibocom-light to-white pt-24 pb-10 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-4 inline-flex items-center gap-1 rounded-full bg-bibocom-accent/10 px-3 py-1.5 text-sm font-medium text-bibocom-accent transition-colors hover:bg-bibocom-accent/20"
        >
          ← Retour
        </button>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-bibocom-primary" />
            <span className="ml-2 text-lg text-bibocom-primary">Chargement du profil...</span>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-1/4">
              <Card className="sticky top-24">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center mb-6">
                    <div className="relative mb-4">
                      <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
                        <AvatarImage 
                          src={avatarPreview || userInfo.avatar || undefined} 
                          alt={`${userInfo.firstName} ${userInfo.lastName}`} 
                        />
                        <AvatarFallback className="bg-bibocom-primary text-white text-2xl">
                          {(userInfo.firstName?.[0] || "").toUpperCase()}
                          {(userInfo.lastName?.[0] || "").toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {isOwnProfile && (
                        <>
                          <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleAvatarChange}
                          />
                          <button
                            type="button"
                            className="absolute bottom-0 right-0 bg-bibocom-primary rounded-full p-1.5 text-white shadow-md hover:bg-bibocom-accent transition-colors"
                            onClick={handleAvatarClick}
                            aria-label="Changer la photo"
                          >
                            <Camera size={16} />
                          </button>
                        </>
                      )}
                    </div>
                    <h3 className="text-xl font-bold">{userInfo.firstName} {userInfo.lastName}</h3>
                    <p className="text-gray-500">{userInfo.email}</p>
                    
                    {userInfo.role && (
                      <Badge variant="outline" className="mt-2 bg-bibocom-primary/10 text-bibocom-primary">
                        {userInfo.role}
                      </Badge>
                    )}
                    
                    <div className="flex gap-8 mt-4">
                      <div className="text-center">
                        <p className="font-semibold text-lg">{followerCount}</p>
                        <p className="text-sm text-gray-500">Abonnés</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-lg">{followingCount}</p>
                        <p className="text-sm text-gray-500">Abonnements</p>
                      </div>
                    </div>
                    
                    {/* Bouton Suivre/Ne plus suivre pour les profils des autres utilisateurs */}
                    {!isOwnProfile && (
                      <Button 
                        variant={isFollowing ? "destructive" : "default"}
                        className="mt-4 w-full gap-2"
                        onClick={handleFollow}
                        disabled={isLoadingFollow}
                      >
                        {isLoadingFollow ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : isFollowing ? (
                          <UserMinus size={16} />
                        ) : (
                          <UserPlus size={16} />
                        )}
                        {isFollowing ? "Ne plus suivre" : "Suivre"}
                      </Button>
                    )}
                  </div>

                  {isOwnProfile && (
                    <nav className="space-y-1">
                      <button 
                        onClick={() => setActiveTab('profile')}
                        className={`flex items-center w-full p-3 rounded-lg transition-colors ${activeTab === 'profile' ? 'bg-bibocom-primary/10 text-bibocom-primary' : 'hover:bg-gray-100'}`}
                      >
                        <User className="mr-3" size={20} />
                        <span>Mon profil</span>
                      </button>
                      <button 
                        onClick={() => setActiveTab('followers')}
                        className={`flex items-center w-full p-3 rounded-lg transition-colors ${activeTab === 'followers' ? 'bg-bibocom-primary/10 text-bibocom-primary' : 'hover:bg-gray-100'}`}
                      >
                        <Users className="mr-3" size={20} />
                        <span>Abonnés</span>
                      </button>
                      <button 
                        onClick={() => setActiveTab('settings')}
                        className={`flex items-center w-full p-3 rounded-lg transition-colors ${activeTab === 'settings' ? 'bg-bibocom-primary/10 text-bibocom-primary' : 'hover:bg-gray-100'}`}
                      >
                        <Settings className="mr-3" size={20} />
                        <span>Paramètres</span>
                      </button>
                      <button 
                        onClick={handleLogout}
                        className="flex items-center w-full p-3 rounded-lg hover:bg-gray-100 text-red-500 hover:text-red-600 transition-colors"
                      >
                        <LogOut className="mr-3" size={20} />
                        <span>Déconnexion</span>
                      </button>
                    </nav>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="w-full md:w-3/4">
              {activeTab === 'profile' && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div>
                      <CardTitle className="text-2xl">
                        {isOwnProfile ? "Mon profil" : `Profil de ${userInfo.firstName}`}
                      </CardTitle>
                      <CardDescription>
                        {isOwnProfile 
                          ? "Consultez et modifiez vos informations personnelles" 
                          : `Informations du profil de ${userInfo.firstName} ${userInfo.lastName}`}
                      </CardDescription>
                    </div>
                    {isOwnProfile && !isEditing ? (
                      <Button 
                        variant="outline" 
                        className="gap-1" 
                        onClick={handleEdit}
                      >
                        <Edit size={16} />
                        Modifier
                      </Button>
                    ) : isOwnProfile && isEditing ? (
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          className="gap-1" 
                          onClick={handleCancel}
                          disabled={isSaving}
                        >
                          <X size={16} />
                          Annuler
                        </Button>
                        <Button 
                          className="gap-1" 
                          onClick={handleSave}
                          disabled={isSaving}
                        >
                          {isSaving ? (
                            <>
                              <Loader2 size={16} className="mr-2 animate-spin" />
                              Enregistrement...
                            </>
                          ) : (
                            <>
                              <Save size={16} />
                              Enregistrer
                            </>
                          )}
                        </Button>
                      </div>
                    ) : null}
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <label className="text-sm font-medium">Prénom</label>
                        {isEditing ? (
                          <Input 
                            name="firstName" 
                            value={editInfo.firstName} 
                            onChange={handleChange} 
                          />
                        ) : (
                          <p className="p-2 border rounded-md">{userInfo.firstName}</p>
                        )}
                      </div>
                      <div className="space-y-3">
                        <label className="text-sm font-medium">Nom</label>
                        {isEditing ? (
                          <Input 
                            name="lastName" 
                            value={editInfo.lastName} 
                            onChange={handleChange} 
                          />
                        ) : (
                          <p className="p-2 border rounded-md">{userInfo.lastName}</p>
                        )}
                      </div>
                      <div className="space-y-3">
                        <label className="text-sm font-medium flex items-center gap-2">
                          <Mail size={16} /> Email
                        </label>
                        {isEditing ? (
                          <Input 
                            name="email" 
                            value={editInfo.email} 
                            onChange={handleChange} 
                          />
                        ) : (
                          <p className="p-2 border rounded-md">{userInfo.email}</p>
                        )}
                      </div>
                      <div className="space-y-3">
                        <label className="text-sm font-medium flex items-center gap-2">
                          <Phone size={16} /> Téléphone
                        </label>
                        {isEditing ? (
                          <Input 
                            name="phone" 
                            value={editInfo.phone} 
                            onChange={handleChange} 
                          />
                        ) : (
                          <p className="p-2 border rounded-md">{userInfo.phone || "Non renseigné"}</p>
                        )}
                      </div>
                      <div className="space-y-3">
                        <label className="text-sm font-medium flex items-center gap-2">
                          <Calendar size={16} /> Date de naissance
                        </label>
                        {isEditing ? (
                          <Input 
                            name="birthdate" 
                            value={editInfo.birthdate} 
                            onChange={handleChange} 
                          />
                        ) : (
                          <p className="p-2 border rounded-md">{userInfo.birthdate || "Non renseignée"}</p>
                        )}
                      </div>
                      <div className="space-y-3">
                        <label className="text-sm font-medium flex items-center gap-2">
                          <MapPin size={16} /> Adresse
                        </label>
                        {isEditing ? (
                          <Input 
                            name="address" 
                            value={editInfo.address} 
                            onChange={handleChange} 
                          />
                        ) : (
                          <p className="p-2 border rounded-md">{userInfo.address || "Non renseignée"}</p>
                        )}
                      </div>
                      <div className="space-y-3 md:col-span-2">
                        <label className="text-sm font-medium">Biographie</label>
                        {isEditing ? (
                          <Textarea 
                            name="bio" 
                            value={editInfo.bio} 
                            onChange={handleChange} 
                            rows={4}
                          />
                        ) : (
                          <p className="p-2 border rounded-md min-h-[100px]">{userInfo.bio || "Aucune biographie renseignée."}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeTab === 'followers' && isOwnProfile && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">Mes abonnés</CardTitle>
                    <CardDescription>Personnes qui vous suivent ({followerCount})</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {followersQuery.isPending ? (
                      <p className="py-8 text-center text-gray-500">Chargement de vos abonnés…</p>
                    ) : (followersQuery.data?.followers || []).length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                        <p className="text-gray-500">Vous n'avez pas encore d'abonnés</p>
                      </div>
                    ) : (
                      <ul className="space-y-3">
                        {(followersQuery.data?.followers || []).map((person) => (
                          <li key={person.id} className="flex items-center gap-3 rounded-lg border p-3">
                            <span className="font-medium">
                              {person.firstName} {person.lastName}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              )}

              {activeTab === 'settings' && isOwnProfile && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">Paramètres</CardTitle>
                    <CardDescription>Gérez vos préférences et paramètres de compte</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <Tabs defaultValue="notifications">
                      <TabsList className="mb-6">
                        <TabsTrigger value="notifications">Notifications</TabsTrigger>
                        <TabsTrigger value="security">Sécurité</TabsTrigger>
                        <TabsTrigger value="preferences">Préférences</TabsTrigger>
                      </TabsList>
                      <TabsContent value="notifications" className="space-y-6">
                        <div className="space-y-4">
                          <h3 className="text-lg font-medium">Préférences de notifications</h3>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between border-b pb-2">
                              <div>
                                <p className="font-medium">Nouvelles commandes</p>
                                <p className="text-sm text-gray-500">Recevoir des notifications pour les nouvelles commandes</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <input type="checkbox" id="order-email" className="rounded text-bibocom-primary" checked readOnly />
                                <label htmlFor="order-email" className="text-sm">Email</label>
                                
                                <input type="checkbox" id="order-sms" className="ml-4 rounded text-bibocom-primary" checked readOnly />
                                <label htmlFor="order-sms" className="text-sm">SMS</label>
                              </div>
                            </div>
                            <div className="flex items-center justify-between border-b pb-2">
                              <div>
                                <p className="font-medium">Nouveaux abonnés</p>
                                <p className="text-sm text-gray-500">Recevoir des notifications quand quelqu'un vous suit</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <input type="checkbox" id="follow-email" className="rounded text-bibocom-primary" checked readOnly />
                                <label htmlFor="follow-email" className="text-sm">Email</label>
                                
                                <input type="checkbox" id="follow-sms" className="ml-4 rounded text-bibocom-primary" />
                                <label htmlFor="follow-sms" className="text-sm">SMS</label>
                              </div>
                            </div>
                            <div className="flex items-center justify-between border-b pb-2">
                              <div>
                                <p className="font-medium">Promotions</p>
                                <p className="text-sm text-gray-500">Recevoir des offres et promotions spéciales</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <input type="checkbox" id="promo-email" className="rounded text-bibocom-primary" checked readOnly />
                                <label htmlFor="promo-email" className="text-sm">Email</label>
                                
                                <input type="checkbox" id="promo-sms" className="ml-4 rounded text-bibocom-primary" />
                                <label htmlFor="promo-sms" className="text-sm">SMS</label>
                              </div>
                            </div>
                            <div className="flex items-center justify-between pb-2">
                              <div>
                                <p className="font-medium">Newsletter mensuelle</p>
                                <p className="text-sm text-gray-500">Recevoir notre newsletter mensuelle</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <input type="checkbox" id="newsletter" className="rounded text-bibocom-primary" checked readOnly />
                                <label htmlFor="newsletter" className="text-sm">Email</label>
                              </div>
                            </div>
                          </div>

                          <Button className="mt-4">Enregistrer les préférences</Button>
                        </div>
                      </TabsContent>
                      <TabsContent value="security" className="space-y-6">
                        <div className="space-y-4">
                          <h3 className="text-lg font-medium">Sécurité du compte</h3>
                          <div className="space-y-6">
                            <div className="space-y-2">
                              <p className="font-medium">Changer le mot de passe</p>
                              <div className="grid gap-4">
                                <div>
                                  <label className="text-sm">Mot de passe actuel</label>
                                  <Input type="password" placeholder="••••••••" />
                                </div>
                                <div>
                                  <label className="text-sm">Nouveau mot de passe</label>
                                  <Input type="password" placeholder="••••••••" />
                                </div>
                                <div>
                                  <label className="text-sm">Confirmer le nouveau mot de passe</label>
                                  <Input type="password" placeholder="••••••••" />
                                </div>
                                <Button className="w-full sm:w-auto">Mettre à jour le mot de passe</Button>
                              </div>
                            </div>
                            <div className="pt-4 border-t">
                              <p className="font-medium mb-2">Sessions actives</p>
                              <div className="space-y-2">
                                <div className="bg-gray-50 p-3 rounded-md">
                                  <div className="flex justify-between">
                                    <div>
                                      <p className="font-medium">Chrome sur Windows</p>
                                      <p className="text-sm text-gray-500">Paris, France • Actif maintenant</p>
                                    </div>
                                    <p className="text-xs text-gray-500">Session actuelle</p>
                                  </div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-md">
                                  <div className="flex justify-between">
                                    <div>
                                      <p className="font-medium">Safari sur iPhone</p>
                                      <p className="text-sm text-gray-500">Paris, France • Dernière activité il y a 2 heures</p>
                                    </div>
                                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50">Déconnecter</Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                      <TabsContent value="preferences" className="space-y-6">
                        <div className="space-y-4">
                          <h3 className="text-lg font-medium">Préférences de langue et région</h3>
                          <div className="grid gap-4">
                            <div>
                              <label className="text-sm font-medium">Langue</label>
                              <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2">
                                <option>Français</option>
                                <option>English</option>
                                <option>Español</option>
                                <option>Deutsch</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Fuseau horaire</label>
                              <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2">
                                <option>Europe/Paris (UTC+01:00)</option>
                                <option>America/New_York (UTC-05:00)</option>
                                <option>Asia/Tokyo (UTC+09:00)</option>
                                <option>Australia/Sydney (UTC+10:00)</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Format de date</label>
                              <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2">
                                <option>DD/MM/YYYY</option>
                                <option>MM/DD/YYYY</option>
                                <option>YYYY-MM-DD</option>
                              </select>
                            </div>
                            <Button className="w-full sm:w-auto">Enregistrer les préférences</Button>
                          </div>
                        </div>
                        
                        <div className="space-y-4 pt-6 border-t">
                          <h3 className="text-lg font-medium">Préférences d'abonnement</h3>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">Recevoir des notifications sur les nouveaux abonnés</p>
                                <p className="text-sm text-gray-500">Être notifié quand quelqu'un commence à vous suivre</p>
                              </div>
                              <div className="flex items-center">
                                <input type="checkbox" id="notify-followers" className="rounded text-bibocom-primary" checked readOnly />
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">Afficher mes abonnements</p>
                                <p className="text-sm text-gray-500">Permettre aux autres utilisateurs de voir qui vous suivez</p>
                              </div>
                              <div className="flex items-center">
                                <input type="checkbox" id="show-following" className="rounded text-bibocom-primary" checked readOnly />
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">Afficher mes abonnés</p>
                                <p className="text-sm text-gray-500">Permettre aux autres utilisateurs de voir qui vous suit</p>
                              </div>
                              <div className="flex items-center">
                                <input type="checkbox" id="show-followers" className="rounded text-bibocom-primary" checked readOnly />
                              </div>
                            </div>
                            <Button className="mt-2">Enregistrer la visibilité</Button>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;