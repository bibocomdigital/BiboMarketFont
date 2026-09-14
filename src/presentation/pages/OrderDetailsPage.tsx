"use client";

import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Package, 
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  Clock, 
  CreditCard,
  Store,
  Mail,
  FileText,
  Edit,
  CheckCircle,
  XCircle,
  AlertCircle,
  Truck
} from 'lucide-react';
import { getUserErrorMessage } from '@domain/errors/app-error';
import { useOrderDetailsQuery } from '@/hooks/queries/use-orders-query';
import { useCancelOrderMutation, useUpdateOrderStatusMutation } from '@/hooks/mutations/use-order-mutations';
import { formatImageUrl } from '@/services/productService';

const OrderDetailsPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const parsedOrderId = orderId ? parseInt(orderId, 10) : null;
  const { data: order = null, isPending, isError, error: queryError } = useOrderDetailsQuery(parsedOrderId);
  const cancelMutation = useCancelOrderMutation();
  const statusMutation = useUpdateOrderStatusMutation();
  const loading = isPending && !order;
  const [actionError, setActionError] = useState<string | null>(null);
  const error = actionError || (isError && !order ? getUserErrorMessage(queryError) : null);
  const updating = cancelMutation.isPending || statusMutation.isPending;

  // Fonction pour récupérer le rôle utilisateur
  const getUserRole = () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return 'CLIENT';
      const user = JSON.parse(userStr);
      return user.role || 'CLIENT';
    } catch (error) {
      console.error('Erreur lors de la récupération du rôle:', error);
      return 'CLIENT';
    }
  };

  const userRole = getUserRole();

  const handleCancelOrder = async () => {
    if (!order) return;
    
    if (!confirm('Êtes-vous sûr de vouloir annuler cette commande ?')) {
      return;
    }
    
    try {
      setActionError(null);
      await cancelMutation.mutateAsync(order.id);
    } catch (err) {
      console.error('Erreur lors de l\'annulation:', err);
      setActionError(err instanceof Error ? err.message : 'Erreur lors de l\'annulation');
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!order) return;
    
    try {
      setActionError(null);
      await statusMutation.mutateAsync({ orderId: order.id, status: newStatus });
    } catch (err) {
      console.error('Erreur lors de la mise à jour:', err);
      setActionError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
    }
  };

  // 🆕 Fonction améliorée pour contacter le client (pour les commerçants)
  const handleContactClient = () => {
    if (!order?.client?.phoneNumber) return;
    
    const clientName = `${order.client?.firstName || ''} ${order.client?.lastName || 'Client'}`.trim();
    const message = `Bonjour ${clientName}, concernant votre commande #COMANDE-${order.id} sur BibocomMarket.\n\nPour confirmer votre commande, veuillez effectuer le paiement via :\n💳 Wave : [Votre numéro Wave]\n📱 Orange Money : [Votre numéro OM]\n💰 Espèces à la livraison\n\nMerci ! 😊`;
    
    const whatsappLink = `https://wa.me/${order.client.phoneNumber.replace(/\+/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappLink, '_blank');
  };

  // Fonction pour formater le statut
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { 
          label: 'En attente', 
          color: 'bg-yellow-100 text-yellow-800', 
          icon: <Clock size={16} /> 
        };
      case 'CONFIRMED':
        return { 
          label: 'Confirmée', 
          color: 'bg-blue-100 text-blue-800', 
          icon: <CheckCircle size={16} /> 
        };
      case 'SHIPPED':
        return { 
          label: 'Expédiée', 
          color: 'bg-purple-100 text-purple-800', 
          icon: <Truck size={16} /> 
        };
      case 'DELIVERED':
        return { 
          label: 'Livrée', 
          color: 'bg-green-100 text-green-800', 
          icon: <CheckCircle size={16} /> 
        };
      case 'CANCELED':
        return { 
          label: 'Annulée', 
          color: 'bg-red-100 text-red-800', 
          icon: <XCircle size={16} /> 
        };
      default:
        return { 
          label: 'Statut inconnu', 
          color: 'bg-gray-100 text-gray-800', 
          icon: <AlertCircle size={16} /> 
        };
    }
  };

  // Fonction pour formater la date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des détails de la commande...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <XCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erreur</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-600">Commande introuvable</p>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(order.status || 'PENDING');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Commande #{`COMANDE-${order.id}`}
                </h1>
                <p className="text-gray-600">
                  Créée le {order.createdAt ? formatDate(order.createdAt) : 'Date inconnue'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-2 ${statusInfo.color}`}>
                {statusInfo.icon}
                <span>{statusInfo.label}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-6">
            {/* Produits commandés */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Package className="mr-2 h-5 w-5 text-orange-500" />
                Produits commandés ({order.orderItems?.length || 0})
              </h2>
              
              <div className="space-y-4">
                {order.orderItems && order.orderItems.length > 0 ? order.orderItems.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {item.product?.images && item.product.images.length > 0 ? (
                        <img
                          src={item.product.images[0].imageUrl || '/placeholder-image.jpg'}
                          alt={item.product.name || 'Produit'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.product?.name || 'Produit inconnu'}</h3>
                      <p className="text-sm text-gray-600">Boutique: {item.product?.shop?.name || 'Boutique inconnue'}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="text-sm text-gray-500">
                          Quantité: {item.quantity || 0}
                        </span>
                        <span className="text-sm text-gray-500">
                          Prix unitaire: {(item.price || 0).toLocaleString('fr-FR')} FCFA
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">
                        {((item.price || 0) * (item.quantity || 0)).toLocaleString('fr-FR')} FCFA
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8">
                    <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500">Aucun produit trouvé dans cette commande</p>
                  </div>
                )}
              </div>
              
              {/* Total */}
              <div className="border-t mt-6 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Total de la commande</span>
                  <span className="text-xl font-bold text-orange-600">
                    {order.orderItems ? order.orderItems.reduce((total, item) => total + (item.price * item.quantity), 0).toLocaleString('fr-FR') : '0'} FCFA
                  </span>
                </div>
              </div>
            </div>

            {/* Informations de livraison */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin className="mr-2 h-5 w-5 text-orange-500" />
                Informations de livraison
              </h2>
              
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Contact client</p>
                    <p className="text-gray-600">{order.client?.phoneNumber || 'Numéro non fourni'}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">Statut de la commande</p>
                    <p className="text-gray-600">{statusInfo.label}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Barre latérale */}
          <div className="space-y-6">
            {/* Informations client */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="mr-2 h-5 w-5 text-orange-500" />
                Informations client
              </h2>
              
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-gray-900">
                    {order.client?.firstName || ''} {order.client?.lastName || 'Client inconnu'}
                  </p>
                </div>
                
                {/* Email et téléphone - Visible seulement pour les commerçants */}
                {userRole === 'MERCHANT' && (
                  <>
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">{order.client?.email || 'Email non fourni'}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">{order.client?.phoneNumber || 'Téléphone non fourni'}</span>
                    </div>
                  </>
                )}
                
                {/* Pour les clients, afficher seulement des infos limitées */}
                {userRole === 'CLIENT' && (
                  <div className="text-sm text-gray-500">
                    Vos informations de contact sont privées
                  </div>
                )}
              </div>
            </div>

            {/* Informations des boutiques */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Store className="mr-2 h-5 w-5 text-orange-500" />
                Boutiques concernées
              </h2>
              
              <div className="space-y-4">
                {order.orderItems && order.orderItems.length > 0 ? (
                  // Grouper par boutique
                  Object.values(
                    order.orderItems.reduce((shops, item) => {
                      const shopId = item.product?.shop?.id;
                      if (!shopId) return shops;
                      
                      if (!shops[shopId]) {
                        shops[shopId] = {
                          shop: item.product.shop,
                          itemCount: 0
                        };
                      }
                      shops[shopId].itemCount += item.quantity;
                      return shops;
                    }, {})
                  ).map((shopData, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Store className="h-5 w-5 text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{shopData.shop.name}</p>
                        <p className="text-sm text-gray-600">
                          {shopData.itemCount} produit(s) • Tel: {shopData.shop.phoneNumber}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">Aucune boutique trouvée</p>
                )}
              </div>
            </div>

            {/* Actions - Différentes selon le rôle */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
              
              <div className="space-y-3">
                {userRole === 'CLIENT' ? (
                  // Actions pour les clients
                  <>
                    {/* 🆕 NOUVEAU: Confirmer la réception - seulement si SHIPPED */}
                    {order.status === 'SHIPPED' && (
                      <button
                        onClick={() => handleStatusUpdate('DELIVERED')}
                        disabled={updating}
                        className="w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                      >
                        <CheckCircle size={16} />
                        <span>{updating ? 'Confirmation en cours...' : '✅ J\'ai reçu ma commande'}</span>
                      </button>
                    )}
                    
                    {/* Annuler la commande - seulement si PENDING */}
                    {order.status === 'PENDING' && (
                      <button
                        onClick={handleCancelOrder}
                        disabled={updating}
                        className="w-full bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                      >
                        {updating ? 'Annulation en cours...' : 'Annuler la commande'}
                      </button>
                    )}
                    
                    {/* Retour aux commandes */}
                    <button
                      onClick={() => navigate('/client-dashboard')}
                      className="w-full bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      Retour à mes commandes
                    </button>
                    
                    {/* Aide */}
                    <button
                      onClick={() => {
                        console.log('Besoin d\'aide');
                      }}
                      className="w-full border border-orange-500 text-orange-500 py-2 px-4 rounded-lg hover:bg-orange-50 transition-colors"
                    >
                      Besoin d'aide ?
                    </button>
                  </>
                ) : (
                  // Actions pour les commerçants - RESTE IDENTIQUE
                  <>
                    {/* 🆕 Contacter le client avec message amélioré */}
                    {order.client?.phoneNumber && (
                      <button
                        onClick={handleContactClient}
                        className="w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center space-x-2"
                      >
                        <Phone size={16} />
                        <span>Contacter le client</span>
                      </button>
                    )}

                    {order.status === 'PENDING' && (
                      <button
                        onClick={() => handleStatusUpdate('CONFIRMED')}
                        disabled={updating}
                        className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                      >
                        {updating ? 'Mise à jour...' : 'Confirmer la commande'}
                      </button>
                    )}
                    
                    {order.status === 'CONFIRMED' && (
                      <button
                        onClick={() => handleStatusUpdate('SHIPPED')}
                        disabled={updating}
                        className="w-full bg-purple-500 text-white py-2 px-4 rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50"
                      >
                        {updating ? 'Mise à jour...' : 'Marquer comme expédiée'}
                      </button>
                    )}
                    
                    {/* Annuler - pour commerçants */}
                    {['PENDING', 'CONFIRMED'].includes(order.status || '') && (
                      <button
                        onClick={() => handleStatusUpdate('CANCELED')}
                        disabled={updating}
                        className="w-full bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                      >
                        {updating ? 'Mise à jour...' : 'Annuler la commande'}
                      </button>
                    )}
                    
                    {/* Retour au dashboard marchand */}
                    <button
                      onClick={() => navigate('/merchant-dashboard')}
                      className="w-full bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      Retour au tableau de bord
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Chronologie de la commande */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Clock className="mr-2 h-5 w-5 text-orange-500" />
                Historique
              </h2>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Commande créée</p>
                    <p className="text-xs text-gray-600">
                      {order.createdAt ? formatDate(order.createdAt) : 'Date inconnue'}
                    </p>
                  </div>
                </div>
                
                {order.updatedAt && order.updatedAt !== order.createdAt && (
                  <div className="flex items-center space-x-3">
                    <Edit className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Dernière mise à jour</p>
                      <p className="text-xs text-gray-600">{formatDate(order.updatedAt)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsPage;