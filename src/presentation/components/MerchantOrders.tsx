"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { getUserErrorMessage } from '@domain/errors/app-error';
import { useMerchantOrdersQuery } from '@/hooks/queries/use-orders-query';

interface FormattedMerchantOrder {
  id: number;
  orderNumber: string;
  date: string;
  status: string;
  total: string;
  clientName: string;
  clientPhone: string;
  itemsCount: number;
}

const MerchantOrders = () => {
  const { data: ordersData = [], isPending, isError, error: queryError } = useMerchantOrdersQuery();
  const orders: FormattedMerchantOrder[] = ordersData.map((order) => ({
    id: order.id,
    orderNumber: `COMMANDE-${order.id}`,
    date: new Date(order.createdAt).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }),
    status:
      order.status === 'PENDING' ? 'En attente' :
      order.status === 'CONFIRMED' ? 'Confirmée' :
      order.status === 'SHIPPED' ? 'Expédiée' :
      order.status === 'DELIVERED' ? 'Livrée' :
      order.status === 'CANCELED' ? 'Annulée' : 'Inconnue',
    total: `${order.totalAmount.toLocaleString('fr-FR')} FCFA`,
    clientName: `${order.client?.firstName || ''} ${order.client?.lastName || 'Client inconnu'}`.trim(),
    clientPhone: order.client?.phoneNumber || 'Non fourni',
    itemsCount: order.orderItems?.length || 0
  }));
  const loading = isPending && ordersData.length === 0;
  const error = isError && ordersData.length === 0 ? getUserErrorMessage(queryError) : null;

  return (
    <div className="bg-white p-6 rounded-md shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-800">Commandes reçues</h2>
        <Link to="/merchant-dashboard" className="text-orange-500 hover:text-orange-600">
          Retour au tableau de bord
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-500"></div>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-gray-500">Aucune commande reçue pour le moment.</p>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commande</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Articles</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-blue-800">{order.orderNumber}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{order.clientName}</div>
                    <div className="text-sm text-gray-500">{order.clientPhone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600">{order.date}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs font-medium rounded-full
                      ${order.status === 'Expédiée' ? 'bg-blue-100 text-blue-800' : 
                        order.status === 'Livrée' ? 'bg-green-100 text-green-800' : 
                        order.status === 'Annulée' ? 'bg-red-100 text-red-800' :
                        order.status === 'Confirmée' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600">{order.itemsCount} article(s)</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600">{order.total}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex space-x-2 justify-end">
                      <Link 
                        to={`/commandes/${order.id}`} 
                        className="text-orange-500 hover:text-orange-600 text-sm font-medium"
                      >
                        Détails
                      </Link>
                      <button
                        onClick={() => {
                          const message = `Bonjour ${order.clientName}, concernant votre commande #${order.orderNumber} sur BibocomMarket.`;
                          const whatsappLink = `https://wa.me/${order.clientPhone.replace(/\+/g, '')}?text=${encodeURIComponent(message)}`;
                          window.open(whatsappLink, '_blank');
                        }}
                        className="text-green-500 hover:text-green-600 text-sm font-medium"
                      >
                        WhatsApp
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MerchantOrders;