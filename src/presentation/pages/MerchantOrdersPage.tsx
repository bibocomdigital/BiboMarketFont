import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Package } from 'lucide-react';
import MerchantOrders from '@/components/MerchantOrders';

const MerchantOrdersPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Link
              to="/merchant-dashboard"
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </Link>
            <div className="flex items-center space-x-2">
              <Package className="h-6 w-6 text-orange-500" />
              <h1 className="text-2xl font-bold text-gray-900">
                Gestion des commandes
              </h1>
            </div>
          </div>
          <p className="text-gray-600 mt-2 ml-12">
            Consultez et gérez toutes les commandes reçues dans votre boutique
          </p>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="container mx-auto px-4 py-6">
        <MerchantOrders />
      </div>
    </div>
  );
};

export default MerchantOrdersPage;