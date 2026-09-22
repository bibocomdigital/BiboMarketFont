"use client";

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Loader, 
  Phone, 
  MapPin, 
  Mail, 
  User, 
  Calendar, 
  Heart, 
  MessageCircle, 
  ThumbsDown, 
  ShoppingCart, 
  Globe, 
  ArrowLeft, 
  Info, 
  UserCheck,
  Award,
  ShoppingBag,
  Users,
  UserPlus
} from 'lucide-react';

// Import des services
import { contactMerchant, respondToMessage } from '@/services/shopService';
import { getUserErrorMessage } from '@domain/errors/app-error';
import { useShopMerchantQuery, useShopProductsQuery, useShopQuery } from '@/hooks/queries/use-shops-query';
import { useAddToCartMutation } from '@/hooks/mutations/use-cart-mutations';
import { useAuthSession } from '@/hooks/use-auth-session';
import ProductDetailModal from '@/components/ProductDetailModal';
import MerchantProfileView from './MerchantProfileView';

const ShopProfile = () => {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const parsedShopId = shopId ? parseInt(shopId, 10) : null;
  const shopQuery = useShopQuery(parsedShopId);
  const productsQuery = useShopProductsQuery(parsedShopId);
  const merchantQuery = useShopMerchantQuery(parsedShopId, shopQuery.isSuccess);
  const shop = shopQuery.data ?? null;
  const products = (productsQuery.data ?? []).filter(
    (product) => product.status !== 'DRAFT',
  );
  const loading = (shopQuery.isPending && !shopQuery.data) || (productsQuery.isPending && !productsQuery.data);
  const error = shopQuery.isError && !shopQuery.data ? getUserErrorMessage(shopQuery.error) : null;
  const [currentTab, setCurrentTab] = useState('products');
  const { isAuthenticated, user } = useAuthSession();
  const addToCartMutation = useAddToCartMutation();
  const [previewProduct, setPreviewProduct] = useState(null); 
  
  // États pour le formulaire de contact
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: ''
  });
  const [messageSending, setMessageSending] = useState(false);
  const [messageSuccess, setMessageSuccess] = useState(false);
  const [messageError, setMessageError] = useState(null);
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [currentContactId, setCurrentContactId] = useState(null);
  const [responseSuccess, setResponseSuccess] = useState(false);
  const [responseError, setResponseError] = useState(null);

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  // Déterminer la page précédente ou la page de retour appropriée
  const handleGoBack = () => {
    // Si on a un state avec une URL de retour dans la navigation, l'utiliser
    if (location.state && location.state.from) {
      navigate(location.state.from);
    } else {
      // Sinon, essayer de revenir en arrière dans l'historique de navigation
      navigate(-1);
    }
  };

  const handleOpenResponseForm = (contactId) => {
    setCurrentContactId(contactId);
    setShowResponseForm(true);
  };

  // Méthode pour gérer la réponse
  const handleMessageResponse = async (response) => {
    if (!currentContactId) return;
  
    try {
      const result = await respondToMessage(currentContactId, response);
      
      // Vérifier si une URL de redirection est fournie
      if (result.redirectUrl) {
        navigate(result.redirectUrl);
      } else {
        // Logique de repli si pas d'URL
        navigate('/dashboard/messages');
      }
  
      // Réinitialiser les états
      setShowResponseForm(false);
      setCurrentContactId(null);
      setResponseSuccess(true);
      
      // Masquer le message de succès après 3 secondes
      setTimeout(() => {
        setResponseSuccess(false);
      }, 3000);
    } catch (err) {
      setResponseError(err.message || "Une erreur est survenue lors de l'envoi de la réponse");
    }
  };
  
  const merchantDetails = merchantQuery.data ?? null;
  
  // Helper function to format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Helper function to handle image URLs
  const getImageUrl = (product, imageIndex = 0) => {
    if (!product.images || !product.images.length || imageIndex >= product.images.length) {
      return null;
    }

    const imageInfo = product.images[imageIndex];
    let imageUrl = '';

    // Check different possible structures
    if (typeof imageInfo === 'string') {
      imageUrl = imageInfo;
    } else if (imageInfo && typeof imageInfo === 'object') {
      // IMPORTANT: Remove the leading slash from imageUrl
      imageUrl = (imageInfo.url || imageInfo.imageUrl || imageInfo.path || '').replace(/^\/uploads\//, '');
    }

    if (!imageUrl) {
      return null;
    }
    
    // Create full URL without double slashes
    const fullUrl = `${backendUrl}/uploads/${imageUrl}`;
    return fullUrl;
  };
  
  // Handle image loading error
  const handleImageError = (e) => {
    // Use a local image instead of external placeholder service
    e.currentTarget.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22300%22%20height%3D%22200%22%20viewBox%3D%220%200%20300%20200%22%3E%3Crect%20fill%3D%22%23E0E0E0%22%20width%3D%22300%22%20height%3D%22200%22%2F%3E%3Ctext%20fill%3D%22%23757575%22%20font-family%3D%22Arial%2CVerdana%2CSans-serif%22%20font-size%3D%2216%22%20text-anchor%3D%22middle%22%20x%3D%22150%22%20y%3D%22100%22%3EImage%20non%20disponible%3C%2Ftext%3E%3C%2Fsvg%3E';
  };
  
  const handleAddToCart = async (product, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!isAuthenticated) {
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    try {
      await addToCartMutation.mutateAsync({ productId: product.id });
    } catch (cartError) {
      alert(getUserErrorMessage(cartError));
    }
  };

  // Gestion de l'envoi de message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    // Vérifier que le sujet et le message ne sont pas vides
    if (!contactForm.subject.trim() || !contactForm.message.trim()) {
      setMessageError('Veuillez remplir tous les champs.');
      return;
    }
    
    setMessageSending(true);
    setMessageError(null);
    
    try {
      // Utiliser le service contactMerchant pour envoyer le message
      await contactMerchant(parseInt(shopId), {
        subject: contactForm.subject,
        message: contactForm.message
      });
      
      // Réinitialiser le formulaire et afficher un message de succès
      setContactForm({ subject: '', message: '' });
      setMessageSuccess(true);
      
      // Masquer le message de succès après 3 secondes
      setTimeout(() => {
        setMessageSuccess(false);
      }, 3000);
    } catch (err) {
      // Gérer les erreurs d'envoi de message
      setMessageError(err.message || "Une erreur est survenue lors de l'envoi du message.");
    } finally {
      setMessageSending(false);
    }
  };
  
  // Mettre à jour le formulaire de contact
  const handleContactFormChange = (e) => {
    const { id, value } = e.target;
    setContactForm(prev => ({
      ...prev,
      [id]: value
    }));
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader className="animate-spin text-green-500" size={32} />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Erreur !</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
        <div className="mt-4">
          <button onClick={handleGoBack} className="text-blue-500 hover:underline flex items-center">
            <ArrowLeft size={16} className="mr-1" /> Retour
          </button>
        </div>
      </div>
    );
  }
  
  if (!shop) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-100 border border-yellow-200 text-yellow-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Attention !</strong>
          <span className="block sm:inline"> Boutique non trouvée.</span>
        </div>
        <div className="mt-4">
          <button onClick={handleGoBack} className="text-blue-500 hover:underline flex items-center">
            <ArrowLeft size={16} className="mr-1" /> Retour
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Bouton de retour */}
      <button 
        onClick={handleGoBack} 
        className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6"
      >
        <ArrowLeft size={20} className="mr-2" />
        Retour
      </button>
      
      {/* Layout principal avec deux colonnes */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Colonne principale */}
        <div className="lg:w-2/3">
          {/* En-tête de la boutique */}
          <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
            {/* Bannière/Image de couverture */}
            <div className="h-48 bg-gradient-to-r from-purple-500 to-pink-500 relative">
              {shop.logo ? (
                <img 
                  src={`${backendUrl}/${shop.logo.replace(/^\//, '')}`} 
                  alt={`Bannière de ${shop.name}`}
                  className="w-full h-full object-cover"
                  onError={handleImageError}
                />
              ) : null}
              
              {/* Photo de profil */}
              <div className="absolute bottom-0 left-8 transform translate-y-1/2">
                <div className="w-24 h-24 rounded-full border-4 border-white bg-white overflow-hidden shadow-lg">
                  {shop.logo ? (
                    <img 
                      src={`${backendUrl}/${shop.logo.replace(/^\//, '')}`}
                      alt={shop.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2264%22%20height%3D%2264%22%20viewBox%3D%220%200%2064%2064%22%3E%3Crect%20fill%3D%22%23E0E0E0%22%20width%3D%2264%22%20height%3D%2264%22%2F%3E%3Ctext%20fill%3D%22%23757575%22%20font-family%3D%22Arial%22%20font-size%3D%2224%22%20text-anchor%3D%22middle%22%20x%3D%2232%22%20y%3D%2236%22%3E%3F%3C%2Ftext%3E%3C%2Fsvg%3E';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-purple-600 flex items-center justify-center text-white font-bold text-2xl">
                      {shop.name?.charAt(0)?.toUpperCase() || 'B'}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Informations de la boutique */}
            <div className="pt-16 pb-6 px-8">
              <h1 className="text-2xl font-bold text-gray-800">
                {shop.name}
              </h1>
              
              <div className="flex flex-wrap items-center mt-2 text-gray-600 text-sm">
                {shop.address && (
                  <div className="flex items-center mr-6 mb-2">
                    <MapPin size={16} className="mr-1 text-gray-400" />
                    <span>{shop.address}</span>
                  </div>
                )}
                
                {shop.phoneNumber && (
                  <div className="flex items-center mr-6 mb-2">
                    <Phone size={16} className="mr-1 text-gray-400" />
                    <span>{shop.phoneNumber}</span>
                  </div>
                )}
                
                {shop.email && (
                  <div className="flex items-center mr-6 mb-2">
                    <Mail size={16} className="mr-1 text-gray-400" />
                    <span>{shop.email}</span>
                  </div>
                )}
                
                <div className="flex items-center mr-6 mb-2">
                  <Calendar size={16} className="mr-1 text-gray-400" />
                  <span>Membre depuis {formatDate(shop.createdAt)}</span>
                </div>
                
                <div className="flex items-center mr-6 mb-2">
                  <ShoppingCart size={16} className="mr-1 text-gray-400" />
                  <span>{products.length} produits</span>
                </div>
              </div>
              
              {shop.description && (
                <p className="mt-4 text-gray-600">{shop.description}</p>
              )}
            </div>
            
            {/* Navigation des onglets */}
            <div className="border-t border-gray-200">
              <div className="flex">
                <button 
                  className={`px-6 py-3 text-sm font-medium ${currentTab === 'products' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => setCurrentTab('products')}
                >
                  Produits
                </button>
                <button 
                  className={`px-6 py-3 text-sm font-medium ${currentTab === 'about' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => setCurrentTab('about')}
                >
                  À propos
                </button>
                <button 
                  className={`px-6 py-3 text-sm font-medium ${currentTab === 'contact' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => setCurrentTab('contact')}
                >
                  Contact
                </button>
              </div>
            </div>
          </div>
          
          {/* Contenu principal basé sur l'onglet sélectionné */}
          {currentTab === 'products' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Produits de {shop.name}</h2>
              
              {/* Grille de produits */}
              {products.length === 0 ? (
                <div className="bg-gray-50 p-6 rounded-lg text-center">
                  <p className="text-gray-500">Aucun produit disponible pour le moment</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-6">
                  {products.map((product) => (
                    <div 
                      key={`product-${product.id}`} 
                      className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden cursor-pointer"
                      onClick={() => setPreviewProduct(product)}
                    >
                      {/* Image du produit */}
                      <div className="relative h-48 overflow-hidden bg-gray-100">
                        {product.images && product.images.length > 0 ? (
                          <img
                            src={getImageUrl(product)}
                            alt={product.name}
                            className="w-full h-full object-cover transition-opacity duration-500"
                            onError={handleImageError}
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <span className="text-gray-400">Image non disponible</span>
                          </div>
                        )}
                        
                        {/* Bouton Ajouter au Panier */}
                        <button
                          className="absolute bottom-2 right-2 bg-orange-500 hover:bg-orange-600 text-white p-2 rounded-full shadow-md transition-colors z-10"
                          onClick={(e) => handleAddToCart(product, e)}
                          title="Ajouter au panier"
                        >
                          <ShoppingCart size={18} />
                        </button>
                      </div>
                      
                      {/* Détails du produit */}
                      <div className="p-4">
                        <h3 className="font-medium text-gray-800 mb-2">{product.name}</h3>
                        <p className="text-gray-500 mb-3 text-sm line-clamp-2">{product.description}</p>
                        <div className="flex justify-between items-center">
                          <div className="text-lg font-bold text-gray-900">{product.price} FCFA</div>
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center">
                              <Heart size={18} className="text-gray-500 mr-1" />
                              <span className="text-xs text-gray-500">{product.likesCount || 0}</span>
                            </div>
                            
                            <div className="flex items-center">
                              <MessageCircle size={18} className="text-gray-500 mr-1" />
                              <span className="text-xs text-gray-500">{product.commentsCount || 0}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {currentTab === 'about' && (
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">À propos de {shop.name}</h2>
              
              {shop.description ? (
                <div className="prose max-w-none">
                  <p>{shop.description}</p>
                </div>
              ) : (
                <p className="text-gray-500">Aucune information disponible pour le moment.</p>
              )}
            </div>
          )}
          
          {currentTab === 'contact' && (
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Contacter {shop.name}</h2>
              
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-3">Informations de contact</h3>
                  
                  <ul className="space-y-3">
                    {shop.phoneNumber && (
                      <li className="flex items-start">
                        <Phone className="text-gray-400 mr-2 flex-shrink-0 mt-0.5" size={18} />
                        <div>
                          <p className="font-medium text-gray-700">Téléphone</p>
                          <p className="text-gray-600">{shop.phoneNumber}</p>
                        </div>
                      </li>
                    )}
                    
                    {shop.email && (
                      <li className="flex items-start">
                        <Mail className="text-gray-400 mr-2 flex-shrink-0 mt-0.5" size={18} />
                        <div>
                          <p className="font-medium text-gray-700">Email</p>
                          <p className="text-gray-600">{shop.email}</p>
                        </div>
                      </li>
                    )}
                    
                    {shop.address && (
                      <li className="flex items-start">
                        <MapPin className="text-gray-400 mr-2 flex-shrink-0 mt-0.5" size={18} />
                        <div>
                          <p className="font-medium text-gray-700">Adresse</p>
                          <p className="text-gray-600">{shop.address}</p>
                        </div>
                      </li>
                    )}
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-3">Envoyer un message</h3>
                  
                  {/* Message de succès */}
                  {messageSuccess && (
                    <div className="bg-green-100 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
                      Votre message a été envoyé avec succès !
                    </div>
                  )}
                  
                  {/* Message d'erreur */}
                  {messageError && (
                    <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                      {messageError}
                    </div>
                  )}
                  
                  {/* Message de succès de réponse */}
                  {responseSuccess && (
                    <div className="bg-green-100 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
                      Votre réponse a été envoyée avec succès !
                    </div>
                  )}
                  
                  {/* Message d'erreur de réponse */}
                  {responseError && (
                    <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                      {responseError}
                    </div>
                  )}
                  
                  {/* Formulaire de message initial */}
                  {!showResponseForm && (
                    <form onSubmit={handleSendMessage} className="space-y-4">
                      <div>
                        <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">Sujet</label>
                        <input
                          type="text"
                          id="subject"
                          value={contactForm.subject}
                          onChange={handleContactFormChange}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="Sujet de votre message"
                          required
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                        <textarea
                          id="message"
                          rows={5}
                          value={contactForm.message}
                          onChange={handleContactFormChange}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="Votre message..."
                          required
                        ></textarea>
                      </div>
                      
                      <button
                        type="submit"
                        disabled={messageSending}
                        className={`
                          bg-purple-600 text-white px-4 py-2 rounded-lg 
                          hover:bg-purple-700 transition-colors
                          ${messageSending ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                      >
                        {messageSending ? 'Envoi en cours...' : 'Envoyer le message'}
                      </button>
                    </form>
                  )}
                  
                  {/* Formulaire de réponse */}
                  {showResponseForm && currentContactId && (
                    <div className="mt-4">
                      <h3 className="text-lg font-medium mb-3">Répondre au message</h3>
                      <form 
                        onSubmit={(e) => {
                          e.preventDefault();
                          const responseText = e.target.response.value;
                          handleMessageResponse(responseText);
                        }} 
                        className="space-y-4"
                      >
                        <textarea 
                          name="response" 
                          rows={4} 
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500" 
                          placeholder="Votre réponse..." 
                          required 
                        ></textarea>
                        <div className="flex space-x-2">
                          <button 
                            type="submit" 
                            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                          >
                            Envoyer la réponse
                          </button>
                          <button 
                            type="button" 
                            onClick={() => {
                              setShowResponseForm(false);
                              setCurrentContactId(null);
                            }} 
                            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                          >
                            Annuler
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Colonne latérale avec les informations du commerçant */}
        <div className="lg:w-1/3">
  {merchantDetails && (
    <MerchantProfileView
      merchant={merchantDetails} 
      onClose={() => {}} 
    />
  )}
</div>
      </div>
      {previewProduct && (
        <ProductDetailModal
          product={{
            ...previewProduct,
            status: previewProduct.status || 'PUBLISHED',
            shopId: previewProduct.shopId || shop?.id,
            userId: previewProduct.userId || shop?.userId,
            shop,
            images: (previewProduct.images || []).map((image) => ({
              id: image.id,
              productId: previewProduct.id,
              imageUrl: image.imageUrl || image.url,
            })),
          }}
          isLoggedIn={isAuthenticated}
          currentUserId={user?.id}
          onClose={() => setPreviewProduct(null)}
          onAddToCart={(product) => void handleAddToCart(product)}
        />
      )}
    </div>
  );
};

export default ShopProfile;