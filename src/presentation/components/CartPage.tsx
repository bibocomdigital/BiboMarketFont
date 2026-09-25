"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag,
  CreditCard,
  Truck,
  Loader,
  AlertTriangle,
  RefreshCw,
  Package,
  CheckCircle
} from 'lucide-react';
// Importez les fonctions du service
import { updateCartItem } from '@/services/cartService';
import { chargedPrice, ProductPrice } from '@/components/product/ProductPrice';
import { getUserErrorMessage } from '@domain/errors/app-error';
import { useCartQuery } from '@/hooks/queries/use-cart-query';
import {
  useCreateOrderMutation,
  useRemoveCartItemMutation,
  useShareCartMutation,
  useUpdateCartItemMutation,
} from '@/hooks/mutations/use-cart-mutations';

// Composant Toast pour les notifications
const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    // Fermer automatiquement le toast après 5 secondes
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';

  return (
    <div className={`fixed bottom-5 right-5 ${bgColor} text-white py-3 px-4 rounded-lg shadow-lg flex items-center gap-2 z-50 animate-fade-in-up`}>
      {type === 'success' ? (
        <CheckCircle size={20} />
      ) : (
        <AlertTriangle size={20} />
      )}
      <span>{message}</span>
    </div>
  );
};

const CartPage = () => {
  const navigate = useNavigate();
  
  const { data: cart, isPending, isError, error: queryError, refetch } = useCartQuery();
  const updateItemMutation = useUpdateCartItemMutation();
  const removeItemMutation = useRemoveCartItemMutation();
  const createOrderMutation = useCreateOrderMutation();
  const shareCartMutation = useShareCartMutation();
  const actionBusy = createOrderMutation.isPending || shareCartMutation.isPending;
  const cartItems = cart?.items || [];
  const loading = isPending && !cart;
  const [actionError, setActionError] = useState(null);
  const error = actionError || (isError && !cart ? getUserErrorMessage(queryError) : null);
  
  // État pour le code promo et son application
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [promoError, setPromoError] = useState('');
  const [promoSuccess, setPromoSuccess] = useState('');
  const [applyingPromo, setApplyingPromo] = useState(false);
  const [localQty, setLocalQty] = useState<Record<number, number>>({});
  const latestQty = useRef<Record<number, number>>({});
  const saveTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  const quantityOf = (item: { id: number; quantity: number }) =>
    localQty[item.id] ?? item.quantity;

  // États pour le panier
  const shippingFee = 0;
  const calculatedSubtotal = cartItems.reduce((sum, item) => {
    return sum + chargedPrice(item.product.price, item.product.promoPrice) * quantityOf(item);
  }, 0);
  const subtotal = calculatedSubtotal;
  const total = Math.max(0, calculatedSubtotal - discount);
  const [refreshing, setRefreshing] = useState(false);
  
  // État pour le toast
  const [toast, setToast] = useState(null);

  useEffect(() => {
    return () => {
      Object.values(saveTimers.current).forEach(clearTimeout);
      Object.entries(latestQty.current).forEach(([itemId, quantity]) => {
        if (quantity != null) {
          void updateCartItem(Number(itemId), quantity);
        }
      });
    };
  }, []);

  const refreshCart = async () => {
    setRefreshing(true);
    setActionError(null);
    await refetch();
    setRefreshing(false);
  };

  const persistQuantity = async (id: number) => {
    const quantity = latestQty.current[id];
    if (quantity == null) return;
    try {
      await updateItemMutation.mutateAsync({ itemId: id, quantity });
      if (latestQty.current[id] === quantity) {
        delete latestQty.current[id];
      }
      setLocalQty((prev) => {
        if (prev[id] !== quantity) return prev;
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch (err) {
      console.error('Erreur lors de la mise à jour de la quantité:', err);
      setActionError('Erreur lors de la mise à jour. Veuillez réessayer.');
      setLocalQty((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      delete latestQty.current[id];
      await refreshCart();
    }
  };

  const schedulePersist = (id: number) => {
    if (saveTimers.current[id]) clearTimeout(saveTimers.current[id]);
    saveTimers.current[id] = setTimeout(() => {
      void persistQuantity(id);
    }, 450);
  };

  const flushPendingQuantities = async () => {
    const ids = Object.keys(saveTimers.current).map(Number);
    ids.forEach((id) => {
      if (saveTimers.current[id]) {
        clearTimeout(saveTimers.current[id]);
        delete saveTimers.current[id];
      }
    });
    const pending = Object.keys(latestQty.current).map(Number);
    await Promise.all(pending.map((id) => persistQuantity(id)));
  };

  const changeQuantity = (id: number, delta: number, event?: React.MouseEvent) => {
    if (event) event.preventDefault();
    const item = cartItems.find((entry) => entry.id === id);
    if (!item) return;
    const current = quantityOf(item);
    const stock = Number(item.product.stock);
    const max = Number.isFinite(stock) && stock > 0 ? stock : Number.POSITIVE_INFINITY;
    const next = Math.max(1, Math.min(current + delta, max));
    if (next === current) return;
    latestQty.current[id] = next;
    setLocalQty((prev) => ({ ...prev, [id]: next }));
    schedulePersist(id);
  };

  const increaseQuantity = (id, event) => changeQuantity(id, 1, event);

  const decreaseQuantity = (id, event) => changeQuantity(id, -1, event);
  
  // Fonction pour supprimer un article
  const removeItem = async (id, event) => {
    // Empêcher le comportement par défaut
    if (event) event.preventDefault();
    if (saveTimers.current[id]) {
      clearTimeout(saveTimers.current[id]);
      delete saveTimers.current[id];
    }
    delete latestQty.current[id];
    setLocalQty((prev) => {
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });

    try {
      await removeItemMutation.mutateAsync(id);
    } catch (err) {
      console.error('Erreur lors de la suppression de l\'article:', err);
      setActionError('Erreur lors de la suppression. Veuillez réessayer.');
      await refreshCart();
    }
  };
  
  const contactSellers = async (event) => {
    if (event) event.preventDefault();
    if (actionBusy) return;

    if (cartItems.length === 0) {
      setActionError('Votre panier est vide. Veuillez ajouter des articles avant de contacter un vendeur.');
      return;
    }

    try {
      setActionError(null);
      await flushPendingQuantities();
      const result = await shareCartMutation.mutateAsync(
        "J'aimerais discuter de ma commande. Merci!",
      );
      const sent = result.results.filter((item) => item.success);
      if (!sent.length) {
        throw new Error(result.results[0]?.error || 'Impossible de contacter les vendeurs');
      }

      setToast({
        message: sent.length === 1
          ? `Message envoyé à ${sent[0].shopName}`
          : `Messages envoyés à ${sent.length} vendeurs`,
        type: 'success',
      });
      navigate(`/client-dashboard?view=messages&partner=${sent[0].merchantId}`);
    } catch (err) {
      console.error('Erreur lors du contact des vendeurs:', err);
      const message = getUserErrorMessage(err) || 'Impossible de contacter les vendeurs. Veuillez réessayer.';
      setActionError(message);
      setToast({ message, type: 'error' });
    }
  };

  const placeOrder = async (event) => {
    if (event) event.preventDefault();
    if (actionBusy) return;

    if (cartItems.length === 0) {
      setActionError('Votre panier est vide. Veuillez ajouter des articles avant de passer commande.');
      return;
    }

    try {
      setActionError(null);
      await flushPendingQuantities();
      const result = await createOrderMutation.mutateAsync();

      setToast({
        message: `Commande #${result.order.id} créée. Les vendeurs ont été prévenus.`,
        type: 'success',
      });
      navigate(`/commandes/${result.order.id}`);
    } catch (err) {
      console.error('Erreur lors de la création de la commande:', err);
      const message = getUserErrorMessage(err) || 'Impossible de créer la commande. Veuillez réessayer.';
      setActionError(message);
      setToast({ message, type: 'error' });
    }
  };
  
  // Adaptation du code pour gérer les codes promo localement
  const applyPromoCode = async (event) => {
    // Empêcher le comportement par défaut
    if (event) event.preventDefault();
    
    if (!promoCode.trim()) {
      setPromoError('Veuillez entrer un code promo');
      return;
    }
    
    try {
      setApplyingPromo(true);
      setPromoError('');
      setPromoSuccess('');
      
      // Simulation locale d'un code promo (à remplacer par l'API quand disponible)
      if (promoCode.toUpperCase() === 'BIBOSPRING20') {
        // Calculer la remise de 20% sur le sous-total
        const discountAmount = subtotal * 0.2;
        setDiscount(discountAmount);
        setDiscount(discountAmount);
        setPromoSuccess('Code promo BIBOSPRING20 appliqué avec succès!');
      } else {
        setPromoError('Code promo invalide');
      }
    } catch (err) {
      console.error('Erreur lors de l\'application du code promo:', err);
      setPromoError('Une erreur est survenue lors de l\'application du code promo');
    } finally {
      setApplyingPromo(false);
    }
  };
  
  // Fonction pour retourner à la page précédente
  const goBack = (event) => {
    if (event) event.preventDefault();
    navigate(-1); // Retourne à la page précédente
  };
  
  // Formater un prix en FCFA
  const formatPrice = (price) => {
    const n = Number(price);
    if (!Number.isFinite(n)) return '—';
    return `${Math.round(n).toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, ' ')} FCFA`;
  };
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* Toast de notification */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
      
      <div className="container mx-auto px-4">
        {/* Titre et bouton retour */}
        <div className="flex items-center mb-8">
          <a 
            href="#" 
            onClick={goBack}
            className="inline-flex items-center rounded-full bg-bibocom-accent/10 px-3 py-1.5 text-sm font-medium text-bibocom-accent transition-colors hover:bg-bibocom-accent/20"
          >
            <ChevronLeft size={20} />
            <span className="ml-1">Retour</span>
          </a>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mx-auto pr-10">Mon Panier</h1>
        </div>
        
        {/* État de chargement */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm p-20 flex flex-col items-center justify-center">
            <Loader size={40} className="text-orange-500 animate-spin mb-4" />
            <p className="text-gray-600">Chargement de votre panier...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={28} className="text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Erreur</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button 
              onClick={(e) => { e.preventDefault(); refreshCart(); }}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 bg-orange-500 text-white font-medium px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors disabled:bg-orange-300"
            >
              {refreshing ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  <span>Chargement...</span>
                </>
              ) : (
                <>
                  <RefreshCw size={18} />
                  <span>Réessayer</span>
                </>
              )}
            </button>
          </div>
        ) : cartItems.length === 0 ? (
          // Panier vide
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag size={28} className="text-orange-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Votre panier est vide</h2>
            <p className="text-gray-600 mb-6">Vous n'avez pas encore ajouté de produits à votre panier.</p>
            <Link 
              to="/" 
              className="inline-flex items-center bg-orange-500 text-white font-medium px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
            >
              Découvrir nos produits
            </Link>
          </div>
        ) : (
          // Panier avec articles
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Liste des articles */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-800">Articles ({cartItems.length})</h2>
                  <button 
                    onClick={(e) => { e.preventDefault(); refreshCart(); }}
                    disabled={refreshing}
                    className="text-orange-500 hover:text-orange-600 flex items-center gap-1 text-sm"
                    title="Rafraîchir le panier"
                  >
                    <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                    <span>Rafraîchir</span>
                  </button>
                </div>
                
                {/* Articles du panier */}
                <div className="divide-y divide-gray-100">
                  {cartItems.map(item => {
                    const qty = quantityOf(item);
                    const atMin = qty <= 1;
                    const atMax = Boolean(item.product.stock) && qty >= item.product.stock;
                    return (
                    <div key={item.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:gap-4 sm:p-6">
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100 sm:h-24 sm:w-24">
                        {item.product.images && item.product.images.length > 0 ? (
                          <img
                            src={item.product.images[0].imageUrl || '/placeholder-image.jpg'}
                            alt={item.product.name || 'Produit'}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gray-200 text-gray-400">
                            <Package size={24} />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="break-words font-medium text-gray-800">{item.product.name}</h3>
                            {item.product.description && item.product.description !== item.product.name && (
                              <p className="mt-0.5 line-clamp-2 text-sm text-gray-500">
                                {item.product.description}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={(e) => removeItem(item.id, e)}
                            disabled={removeItemMutation.isPending}
                            className={`shrink-0 rounded-full p-2 transition-colors ${
                              removeItemMutation.isPending
                                ? 'cursor-not-allowed text-gray-400'
                                : 'text-red-500 hover:bg-red-50'
                            }`}
                            type="button"
                            aria-label="Supprimer l'article"
                          >
                            {removeItemMutation.isPending ? (
                              <Loader size={18} className="animate-spin" />
                            ) : (
                              <Trash2 size={18} />
                            )}
                          </button>
                        </div>

                        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="inline-flex w-fit shrink-0 items-center overflow-hidden rounded-lg border border-gray-200">
                            <button
                              onClick={(e) => decreaseQuantity(item.id, e)}
                              disabled={atMin}
                              className={`flex h-10 w-10 items-center justify-center ${
                                atMin
                                  ? 'cursor-not-allowed bg-gray-100 text-gray-400'
                                  : 'bg-gray-50 hover:bg-gray-100'
                              }`}
                              type="button"
                              aria-label="Diminuer la quantité"
                            >
                              <Minus size={16} />
                            </button>
                            <span className="flex h-10 min-w-[2.75rem] items-center justify-center border-x border-gray-200 px-2 text-center font-semibold tabular-nums">
                              {qty}
                            </span>
                            <button
                              onClick={(e) => increaseQuantity(item.id, e)}
                              disabled={atMax}
                              className={`flex h-10 w-10 items-center justify-center ${
                                atMax
                                  ? 'cursor-not-allowed bg-gray-100 text-gray-400'
                                  : 'bg-gray-50 hover:bg-gray-100'
                              }`}
                              type="button"
                              aria-label="Augmenter la quantité"
                            >
                              <Plus size={16} />
                            </button>
                          </div>

                          <div className="sm:text-right">
                            <div className="font-semibold text-gray-900">
                              <ProductPrice
                                price={item.product.price * qty}
                                promoPrice={
                                  item.product.promoPrice != null
                                    ? item.product.promoPrice * qty
                                    : null
                                }
                                size="sm"
                              />
                            </div>
                            {qty > 1 && (
                              <div className="text-xs text-gray-500">
                                <ProductPrice
                                  price={item.product.price}
                                  promoPrice={item.product.promoPrice}
                                  size="sm"
                                />
                                {" "}/ pièce
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Code promo */}
              <div className="bg-white rounded-xl shadow-sm mt-6 p-6">
                <h3 className="font-bold text-gray-800 mb-4">Code promo</h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input 
                    type="text" 
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Entrez votre code promo" 
                    className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                  <button 
                    onClick={(e) => applyPromoCode(e)}
                    disabled={applyingPromo || !promoCode.trim()}
                    className="bg-orange-500 text-white font-medium px-6 py-2.5 rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 disabled:bg-orange-300"
                    type="button"
                  >
                    {applyingPromo ? (
                      <>
                        <Loader size={16} className="animate-spin" />
                        <span>Application...</span>
                      </>
                    ) : (
                      <span>Appliquer</span>
                    )}
                  </button>
                </div>
                {promoError && (
                  <div className="flex items-center gap-2 text-red-500 text-sm mt-2">
                    <AlertTriangle size={14} />
                    <span>{promoError}</span>
                  </div>
                )}
                {promoSuccess && (
                  <div className="flex items-center gap-2 text-green-500 text-sm mt-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span>{promoSuccess}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Résumé de la commande */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
                <h2 className="text-xl font-bold text-gray-800 mb-6">Résumé de la commande</h2>
                
                {/* Détails du coût */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Sous-total</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Frais de livraison</span>
                    <span>{formatPrice(shippingFee)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-500">
                      <span>Remise</span>
                      <span>-{formatPrice(discount)}</span>
                    </div>
                  )}
                  <div className="border-t pt-3 mt-3 flex justify-between font-bold text-gray-800">
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>
                
                {/* Boutons d'action */}
                <button 
                  onClick={placeOrder}
                  disabled={actionBusy || cartItems.length === 0}
                  className="block w-full py-3 bg-orange-500 text-white text-center rounded-lg hover:bg-orange-600 transition-colors mb-3 disabled:bg-orange-300"
                  type="button"
                >
                  {createOrderMutation.isPending ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader size={18} className="animate-spin" />
                      Création de la commande...
                    </span>
                  ) : (
                    'Passer la commande'
                  )}
                </button>
                
                <button 
                  onClick={contactSellers}
                  disabled={actionBusy || cartItems.length === 0}
                  className="block w-full py-3 mb-3 bg-green-500 text-white text-center rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2 disabled:bg-green-300"
                  type="button"
                >
                  {shareCartMutation.isPending ? (
                    <>
                      <Loader size={18} className="animate-spin" />
                      <span>Envoi des messages...</span>
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="mr-1">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                      </svg>
                      <span>Contacter les vendeurs</span>
                    </>
                  )}
                </button>
                
                {/* Informations supplémentaires */}
                <div className="mt-6 pt-6 border-t">
                  <div className="flex items-center gap-3 mb-3 text-gray-600">
                    <Truck size={18} />
                    <span>Livraison gratuite à partir de 50 000 FCFA</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                    <CreditCard size={18} />
                    <span>Paiement sécurisé</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;