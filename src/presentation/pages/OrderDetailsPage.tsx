"use client";

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Package, 
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  Clock, 
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
import { confirmAction } from '@/components/feedback/confirm-dialog';

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
    const accepted = await confirmAction({
      title: "Annuler cette commande ?",
      description: "Cette action est définitive. Le vendeur sera informé de l’annulation.",
      confirmLabel: "Oui, annuler",
      cancelLabel: "Garder",
      variant: "danger",
    });
    if (!accepted) return;

    try {
      setActionError(null);
      await cancelMutation.mutateAsync(order.id);
    } catch (err) {
      console.error("Erreur lors de l'annulation:", err);
      setActionError(err instanceof Error ? err.message : "Erreur lors de l'annulation");
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!order) return;
    const prompts: Record<string, { title: string; description: string; confirmLabel: string; variant?: "danger" | "default" }> = {
      CONFIRMED: {
        title: "Confirmer cette commande ?",
        description: "Le client sera informé que vous avez accepté la commande.",
        confirmLabel: "Confirmer",
      },
      SHIPPED: {
        title: "Marquer comme expédiée ?",
        description: "Le client verra que sa commande est en cours de livraison.",
        confirmLabel: "Expédier",
      },
      DELIVERED: {
        title: "Confirmer la réception ?",
        description: "Vous confirmez avoir bien reçu cette commande.",
        confirmLabel: "J’ai reçu",
      },
      CANCELED: {
        title: "Annuler cette commande ?",
        description: "Le client sera informé. Cette action est définitive.",
        confirmLabel: "Oui, annuler",
        variant: "danger",
      },
    };
    const prompt = prompts[newStatus];
    if (prompt) {
      const accepted = await confirmAction({
        title: prompt.title,
        description: prompt.description,
        confirmLabel: prompt.confirmLabel,
        cancelLabel: "Retour",
        variant: prompt.variant ?? "default",
      });
      if (!accepted) return;
    }

    try {
      setActionError(null);
      await statusMutation.mutateAsync({ orderId: order.id, status: newStatus });
    } catch (err) {
      console.error("Erreur lors de la mise à jour:", err);
      setActionError(err instanceof Error ? err.message : "Erreur lors de la mise à jour");
    }
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return 'Date inconnue';
    const day = date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const time = date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `${day} à ${time}`;
  };

  const formatPrice = (price: number) => {
    const n = Number(price);
    if (!Number.isFinite(n)) return '—';
    return `${Math.round(n).toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, ' ')} FCFA`;
  };

  const shopNameOf = (item: { product?: { shop?: { name?: string; shopName?: string } } }) =>
    item.product?.shop?.name || item.product?.shop?.shopName || 'Boutique';

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
  const orderItems = order.orderItems || [];
  const orderTotal = orderItems.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
    0,
  );
  const shops = Object.values(
    orderItems.reduce((acc, item) => {
      const shop = item.product?.shop;
      const shopId = shop?.id;
      if (!shopId) return acc;
      if (!acc[shopId]) {
        acc[shopId] = { shop, itemCount: 0 };
      }
      acc[shopId].itemCount += Number(item.quantity || 0);
      return acc;
    }, {} as Record<number, { shop: NonNullable<(typeof orderItems)[number]['product']>['shop']; itemCount: number }>),
  );
  const clientName = `${order.client?.firstName || ''} ${order.client?.lastName || ''}`.trim() || 'Client';
  const clientPhone = order.client?.phoneNumber || null;

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <div className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-3 inline-flex items-center gap-1 rounded-full bg-bibocom-accent/10 px-3 py-1.5 text-sm font-medium text-bibocom-accent transition-colors hover:bg-bibocom-accent/20"
          >
            <ArrowLeft size={16} />
            <span>Retour</span>
          </button>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
                Commande n° {order.id}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Créée le {order.createdAt ? formatDate(order.createdAt) : 'date inconnue'}
              </p>
            </div>
            <span className={`inline-flex w-fit shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium ${statusInfo.color}`}>
              {statusInfo.icon}
              <span>{statusInfo.label}</span>
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <section className="rounded-xl bg-white p-4 shadow-sm sm:p-6">
              <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-900 sm:text-lg">
                <Package className="h-5 w-5 shrink-0 text-orange-500" />
                <span>Produits commandés ({orderItems.length})</span>
              </h2>

              {orderItems.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {orderItems.map((item) => {
                    const qty = Number(item.quantity || 0);
                    const unit = Number(item.price || 0);
                    const line = unit * qty;
                    const imageUrl = item.product?.images?.[0]?.imageUrl
                      ? formatImageUrl(item.product.images[0].imageUrl)
                      : null;
                    return (
                      <article key={item.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-start">
                        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={item.product?.name || 'Produit'}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <Package className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium text-gray-900">{item.product?.name || 'Produit inconnu'}</h3>
                          <p className="mt-0.5 text-sm text-gray-500">{shopNameOf(item)}</p>
                          <div className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
                            <div>
                              <p className="text-xs text-gray-400">Quantité</p>
                              <p className="font-medium text-gray-800">{qty}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400">Prix unitaire</p>
                              <p className="font-medium text-gray-800">{formatPrice(unit)}</p>
                            </div>
                            <div className="col-span-2 sm:col-span-1 sm:text-right">
                              <p className="text-xs text-gray-400">Sous-total</p>
                              <p className="font-semibold text-gray-900">{formatPrice(line)}</p>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <Package className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                  <p className="text-sm text-gray-500">Aucun produit dans cette commande</p>
                </div>
              )}

              <div className="mt-4 flex items-center justify-between border-t pt-4">
                <span className="font-semibold text-gray-800">Total</span>
                <span className="text-lg font-bold text-orange-600">{formatPrice(orderTotal)}</span>
              </div>
            </section>

            <section className="rounded-xl bg-white p-4 shadow-sm sm:p-6">
              <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-900 sm:text-lg">
                <MapPin className="h-5 w-5 shrink-0 text-orange-500" />
                <span>Livraison et statut</span>
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Phone className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">Téléphone de contact</p>
                    <p className="break-all text-sm text-gray-600">{clientPhone || 'Numéro non renseigné'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FileText className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Statut</p>
                    <p className="text-sm text-gray-600">{statusInfo.label}</p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-xl bg-white p-4 shadow-sm sm:p-6">
              <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-900 sm:text-lg">
                <User className="h-5 w-5 shrink-0 text-orange-500" />
                <span>Client</span>
              </h2>
              <p className="font-medium text-gray-900">{clientName}</p>
              {userRole === 'MERCHANT' ? (
                <div className="mt-3 space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 shrink-0 text-gray-400" />
                    <span className="break-all">{order.client?.email || 'Email non renseigné'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 shrink-0 text-gray-400" />
                    <span className="break-all">{clientPhone || 'Téléphone non renseigné'}</span>
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-sm text-gray-500">Vos informations restent visibles uniquement par le vendeur.</p>
              )}
            </section>

            <section className="rounded-xl bg-white p-4 shadow-sm sm:p-6">
              <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-900 sm:text-lg">
                <Store className="h-5 w-5 shrink-0 text-orange-500" />
                <span>Boutiques</span>
              </h2>
              {shops.length > 0 ? (
                <div className="space-y-3">
                  {shops.map((shopData) => (
                    <div key={shopData.shop.id} className="flex items-start gap-3 rounded-lg border border-gray-100 p-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-50">
                        <Store className="h-5 w-5 text-orange-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900">{shopData.shop.name || shopNameOf({ product: { shop: shopData.shop } })}</p>
                        <p className="text-sm text-gray-500">
                          {shopData.itemCount} article{shopData.itemCount > 1 ? 's' : ''}
                          {shopData.shop.phoneNumber ? ` · ${shopData.shop.phoneNumber}` : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Aucune boutique associée</p>
              )}
            </section>

            <section className="rounded-xl bg-white p-4 shadow-sm sm:p-6">
              <h2 className="mb-4 text-base font-semibold text-gray-900 sm:text-lg">Actions</h2>
              <div className="space-y-3">
                {userRole === 'CLIENT' ? (
                  <>
                    {order.status === 'SHIPPED' && (
                      <button
                        type="button"
                        onClick={() => handleStatusUpdate('DELIVERED')}
                        disabled={updating}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-500 px-4 py-2.5 text-white transition-colors hover:bg-green-600 disabled:opacity-50"
                      >
                        <CheckCircle size={16} />
                        <span>{updating ? 'Confirmation…' : 'J’ai reçu ma commande'}</span>
                      </button>
                    )}
                    {order.status === 'PENDING' && (
                      <button
                        type="button"
                        onClick={handleCancelOrder}
                        disabled={updating}
                        className="w-full rounded-lg bg-red-500 px-4 py-2.5 text-white transition-colors hover:bg-red-600 disabled:opacity-50"
                      >
                        {updating ? 'Annulation…' : 'Annuler la commande'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => navigate('/client-dashboard?view=orders')}
                      className="w-full rounded-lg bg-gray-100 px-4 py-2.5 font-medium text-gray-800 transition-colors hover:bg-gray-200"
                    >
                      Retour à mes commandes
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/client-dashboard?view=messages')}
                      className="w-full rounded-lg border border-orange-500 px-4 py-2.5 font-medium text-orange-500 transition-colors hover:bg-orange-50"
                    >
                      Contacter le vendeur
                    </button>
                  </>
                ) : (
                  <>
                    {order.client?.id && (
                      <button
                        type="button"
                        onClick={() => navigate(`/merchant-dashboard?view=messages&partner=${order.client.id}`)}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-500 px-4 py-2.5 text-white transition-colors hover:bg-green-600"
                      >
                        <Phone size={16} />
                        <span>Contacter le client</span>
                      </button>
                    )}
                    {order.status === 'PENDING' && (
                      <button
                        type="button"
                        onClick={() => handleStatusUpdate('CONFIRMED')}
                        disabled={updating}
                        className="w-full rounded-lg bg-blue-500 px-4 py-2.5 text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
                      >
                        {updating ? 'Mise à jour…' : 'Confirmer la commande'}
                      </button>
                    )}
                    {order.status === 'CONFIRMED' && (
                      <button
                        type="button"
                        onClick={() => handleStatusUpdate('SHIPPED')}
                        disabled={updating}
                        className="w-full rounded-lg bg-purple-500 px-4 py-2.5 text-white transition-colors hover:bg-purple-600 disabled:opacity-50"
                      >
                        {updating ? 'Mise à jour…' : 'Marquer comme expédiée'}
                      </button>
                    )}
                    {['PENDING', 'CONFIRMED'].includes(order.status || '') && (
                      <button
                        type="button"
                        onClick={() => handleStatusUpdate('CANCELED')}
                        disabled={updating}
                        className="w-full rounded-lg bg-red-500 px-4 py-2.5 text-white transition-colors hover:bg-red-600 disabled:opacity-50"
                      >
                        {updating ? 'Mise à jour…' : 'Annuler la commande'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => navigate('/merchant-dashboard?view=orders')}
                      className="w-full rounded-lg bg-gray-100 px-4 py-2.5 font-medium text-gray-800 transition-colors hover:bg-gray-200"
                    >
                      Retour au tableau de bord
                    </button>
                  </>
                )}
              </div>
            </section>

            <section className="rounded-xl bg-white p-4 shadow-sm sm:p-6">
              <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-900 sm:text-lg">
                <Clock className="h-5 w-5 shrink-0 text-orange-500" />
                <span>Historique</span>
              </h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Commande créée</p>
                    <p className="text-xs text-gray-500">
                      {order.createdAt ? formatDate(order.createdAt) : 'Date inconnue'}
                    </p>
                  </div>
                </div>
                {order.updatedAt && order.updatedAt !== order.createdAt && (
                  <div className="flex items-start gap-3">
                    <Edit className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Dernière mise à jour</p>
                      <p className="text-xs text-gray-500">{formatDate(order.updatedAt)}</p>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsPage;