import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Heart, Clock } from 'lucide-react';

/**
 * Composant pour afficher des liens rapides vers les services
 */
const QuickServiceLinks = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <div className="bg-orange-500/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
          <ShoppingBag className="text-orange-500" size={24} />
        </div>
        <h3 className="text-lg font-semibold mb-2">Mes commandes</h3>
        <p className="text-gray-600 mb-4">Consultez et suivez vos commandes en cours</p>
        <Link to="/commandes" className="text-orange-500 font-medium hover:underline">
          Voir mes commandes
        </Link>
      </div>
      
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <div className="bg-red-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
          <Heart className="text-red-500" size={24} />
        </div>
        <h3 className="text-lg font-semibold mb-2">Mes favoris</h3>
        <p className="text-gray-600 mb-4">Retrouvez tous vos produits préférés</p>
        <Link to="/favoris" className="text-orange-500 font-medium hover:underline">
          Voir mes favoris
        </Link>
      </div>
      
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
          <Clock className="text-blue-500" size={24} />
        </div>
        <h3 className="text-lg font-semibold mb-2">Historique</h3>
        <p className="text-gray-600 mb-4">Consultez votre historique d'achats</p>
        <Link to="/historique" className="text-orange-500 font-medium hover:underline">
          Voir mon historique
        </Link>
      </div>
    </div>
  );
};

export default QuickServiceLinks;