"use client";

import React, { useState, useEffect } from 'react';
import { ProductPrice } from '@/components/product/ProductPrice';
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
import { formatImageUrl } from '@/services/productService';
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

  // Déterminer la page précédente ou la page de retour appropriée
  const handleGoBack = () => {
    if (location.state?.from) {
      navigate(location.state.from);
      return;
    }
    const referrer = typeof document !== "undefined" ? document.referrer : "";
    const sameSite = referrer.startsWith(window.location.origin);
    if (sameSite && window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/boutiques");
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
  
  const getImageUrl = (product, imageIndex = 0) => {
    if (!product.images || !product.images.length || imageIndex >= product.images.length) {
      return null;
    }
    const imageInfo = product.images[imageIndex];
    const imageUrl = typeof imageInfo === 'string'
      ? imageInfo
      : (imageInfo?.url || imageInfo?.imageUrl || imageInfo?.path || '');
    return formatImageUrl(imageUrl || null);
  };

  const formatPrice = (price) => {
    const n = Number(price);
    if (!Number.isFinite(n)) return '—';
    return `${Math.round(n).toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, ' ')} FCFA`;
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
  
  const shopLogo = formatImageUrl(shop.logo || null);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <button 
        type="button"
        onClick={handleGoBack} 
        className="mb-4 inline-flex items-center gap-1 rounded-full bg-bibocom-accent/10 px-3 py-1.5 text-sm font-medium text-bibocom-accent hover:bg-bibocom-accent/20"
      >
        <ArrowLeft size={16} />
        Retour
      </button>
      
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="min-w-0 flex-1">
          <div className="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="h-24 bg-gradient-to-r from-orange-400 to-orange-500 sm:h-32" />
            <div className="px-4 pb-4 sm:px-6">
              <div className="-mt-8 flex flex-col gap-4 sm:-mt-10 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex min-w-0 items-end gap-3">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border-4 border-white bg-orange-100 shadow sm:h-20 sm:w-20">
                    {shopLogo ? (
                      <img src={shopLogo} alt={shop.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xl font-bold text-orange-600">
                        {shop.name?.charAt(0)?.toUpperCase() || 'B'}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 pb-1">
                    <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">{shop.name}</h1>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 sm:text-sm">
                      {shop.address && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin size={14} className="text-gray-400" />
                          {shop.address}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <Calendar size={14} className="text-gray-400" />
                        Depuis {formatDate(shop.createdAt)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <ShoppingBag size={14} className="text-gray-400" />
                        {products.length} produit{products.length > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              {shop.description && (
                <p className="mt-3 line-clamp-3 text-sm text-gray-600">{shop.description}</p>
              )}
              {merchantDetails && (
                <div className="mt-4 lg:hidden">
                  <MerchantProfileView merchant={merchantDetails} onClose={() => {}} compact />
                </div>
              )}
            </div>
            
            <div className="flex border-t border-gray-100">
              {['products', 'about', 'contact'].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={`flex-1 px-3 py-3 text-sm font-medium sm:flex-none sm:px-6 ${
                    currentTab === tab
                      ? 'border-b-2 border-orange-500 text-orange-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setCurrentTab(tab)}
                >
                  {tab === 'products' ? 'Produits' : tab === 'about' ? 'À propos' : 'Contact'}
                </button>
              ))}
            </div>
          </div>
          
          {/* Contenu principal basé sur l'onglet sélectionné */}
          {currentTab === 'products' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Produits de {shop.name}</h2>
              
              {products.length === 0 ? (
                <div className="rounded-xl bg-gray-50 p-8 text-center text-sm text-gray-500">
                  Aucun produit disponible pour le moment
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {products.map((product) => {
                    const imageUrl = getImageUrl(product);
                    return (
                    <div 
                      key={`product-${product.id}`} 
                      className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md cursor-pointer"
                      onClick={() => setPreviewProduct(product)}
                    >
                      <div className="relative aspect-[4/3] bg-gray-100">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={product.name}
                            className="h-full w-full object-cover"
                            onError={handleImageError}
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-gray-400">
                            Pas d’image
                          </div>
                        )}
                        <button
                          className="absolute bottom-2 right-2 z-10 rounded-full bg-orange-500 p-2 text-white shadow-md hover:bg-orange-600"
                          onClick={(e) => handleAddToCart(product, e)}
                          title="Ajouter au panier"
                          type="button"
                        >
                          <ShoppingCart size={16} />
                        </button>
                      </div>
                      <div className="p-3">
                        <h3 className="line-clamp-2 text-sm font-medium text-gray-800">{product.name}</h3>
                        {product.description && product.description !== product.name && (
                          <p className="mt-1 line-clamp-2 text-xs text-gray-500">{product.description}</p>
                        )}
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <ProductPrice price={product.price} promoPrice={product.promoPrice} size="sm" />
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <span className="inline-flex items-center gap-0.5">
                              <Heart size={13} />
                              {Math.max(0, Number(product.likesCount) || 0)}
                            </span>
                            <span className="inline-flex items-center gap-0.5">
                              <MessageCircle size={13} />
                              {product.commentsCount || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    );
                  })}
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
        
        {merchantDetails && (
          <aside className="hidden w-full shrink-0 lg:block lg:w-80">
            <div className="sticky top-24 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              <MerchantProfileView merchant={merchantDetails} onClose={() => {}} />
            </div>
          </aside>
        )}
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