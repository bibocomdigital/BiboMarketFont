"use client";

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  LogOut, 
  User, 
  ShoppingBag, 
  Heart, 
  Clock, 
  Settings, 
  Bell, 
  Search, 
  Menu, 
  X, 
  ChevronRight,
  Package,
  CreditCard
} from 'lucide-react';
import CartIcon from '../components/CartIcon';
import ProductsGrid from '../components/ProductsGrid'; 
import RecentOrders from '@/components/RecentOrders';
import Footer from '@/components/Footer';
import { logout } from '@/services/authService';
import NotificationCenter from '@/components/notification/NotificationCenter ';
import MessageCenter from '@/components/MessageCenter';
// 🆕 Importer le service des commandes
import { Order } from '@/services/orderServices';
import { useOrdersQuery } from '@/hooks/queries/use-orders-query';

// 🆕 Interface pour les statistiques
interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  totalSpent: number;
  favoriteItems: number;
}

const ClientDashboard = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // États pour les produits en vedette
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const { data: orders = [], isPending: statsPending } = useOrdersQuery();
  const statsLoading = statsPending && orders.length === 0;

  // 🆕 Fonction pour calculer les statistiques des commandes
  const calculateOrderStats = (ordersList: Order[]): OrderStats => {
    const totalOrders = ordersList.filter(order => 
      !['CANCELED'].includes(order.status) // Exclure les commandes annulées
    ).length;

    const pendingOrders = ordersList.filter(order => 
      order.status === 'PENDING'
    ).length;

    const totalSpent = ordersList
      .filter(order => ['CONFIRMED', 'SHIPPED', 'DELIVERED'].includes(order.status))
      .reduce((total, order) => {
        const orderTotal = order.orderItems?.reduce((sum, item) => 
          sum + (item.price * item.quantity), 0
        ) || order.totalAmount || 0;
        return total + orderTotal;
      }, 0);

    return {
      totalOrders,
      pendingOrders,
      totalSpent,
      favoriteItems: 17 // Valeur statique pour l'instant
    };
  };

  const orderStats = calculateOrderStats(orders);

  useEffect(() => {
    setLoading(false);
  }, []);

  // Fonction pour naviguer vers la page des boutiques
  const handleBoutiquesClick = (e) => {
    e.preventDefault();
    navigate('/boutiques');
  };
  
  // Fonction pour gérer la déconnexion
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  const navigateToWhatsAppClone = () => {
    navigate('/whatsapp');
  };

  // 🆕 Fonction pour formater le montant en FCFA
  const formatCurrency = (amount: number): string => {
    return `${amount.toLocaleString('fr-FR')} FCFA`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header avec menu - IDENTIQUE */}
      <header className="bg-white shadow-md py-3 sticky top-0 z-40">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold text-orange-500">
              BibocomMarket
            </Link>
          </div>
          
          {/* Barre de recherche (visible uniquement sur Desktop) */}
          <div className="hidden md:flex items-center relative w-1/3">
            <input 
              type="text" 
              placeholder="Rechercher des produits..." 
              className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            <Search size={18} className="absolute left-3 text-gray-400" />
          </div>
          
          {/* Navigation desktop */}
          <nav className="hidden md:flex space-x-6">
            <Link 
              to="#" 
              onClick={() => setActiveTab('dashboard')}
              className={`${activeTab === 'dashboard' ? 'text-orange-500' : 'text-gray-600 hover:text-orange-500'} transition-colors`}
            >
              Tableau de bord
            </Link>
            <Link 
              to="#" 
              onClick={() => setActiveTab('products')}
              className={`${activeTab === 'products' ? 'text-orange-500' : 'text-gray-600 hover:text-orange-500'} transition-colors`}
            >
              Produits
            </Link>
            <Link 
              to="/boutiques" 
              onClick={handleBoutiquesClick}
              className={`${activeTab === 'boutiques' ? 'text-orange-500' : 'text-gray-600 hover:text-orange-500'} transition-colors`}
            >
              Boutiques
            </Link>
          </nav>
          
          {/* Icons */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <div className="relative">
              <NotificationCenter />
            </div>
            
            <div className="relative">
              <MessageCenter onRedirect={navigateToWhatsAppClone} />
            </div>
            
            {/* Panier remplacé par CartIcon */}
            <div className="relative">
              <CartIcon 
                onClick={() => setCartOpen(!cartOpen)}
              />
              
              {/* Dropdown panier */}
              {cartOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg overflow-hidden z-50">
                  <div className="max-h-96 overflow-y-auto">
                    
                  </div>
                  <div className="p-4 border-t">
                    <Link 
                      to="/cart" 
                      className="block w-full py-2 mt-2 border border-gray-200 text-gray-700 text-center rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Voir le panier
                    </Link>
                  </div>
                </div>
              )}
            </div>
            
            {/* Bouton menu mobile */}
            <button 
              className="md:hidden p-1.5 rounded-full hover:bg-gray-100 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X size={24} className="text-gray-600" />
              ) : (
                <Menu size={24} className="text-gray-600" />
              )}
            </button>
          </div>
        </div>
        
        {/* Menu mobile */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t mt-2 py-4">
            <div className="container mx-auto px-4">
              <div className="relative mb-4">
                <input 
                  type="text" 
                  placeholder="Rechercher des produits..." 
                  className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
              
              <nav className="flex flex-col space-y-3">
                <Link 
                  to="#" 
                  onClick={() => {
                    setActiveTab('dashboard');
                    setMobileMenuOpen(false);
                  }}
                  className="text-gray-600 hover:text-orange-500 transition-colors py-2"
                >
                  Tableau de bord
                </Link>
                <Link 
                  to="#" 
                  onClick={() => {
                    setActiveTab('products');
                    setMobileMenuOpen(false);
                  }}
                  className="text-gray-600 hover:text-orange-500 transition-colors py-2"
                >
                  Produits
                </Link>
                <Link 
                  to="/boutiques" 
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/boutiques');
                    setMobileMenuOpen(false);
                  }}
                  className="text-gray-600 hover:text-orange-500 transition-colors py-2"
                >
                  Boutiques
                </Link>
                <Link to="/apropos" className="text-gray-600 hover:text-orange-500 transition-colors py-2">
                  À propos
                </Link>
              </nav>
            </div>
          </div>
        )}
      </header>
      
      {/* Contenu principal */}
      <main className="flex-1 bg-gray-50 pt-6 pb-12">
        {activeTab === 'dashboard' && (
          <div className="container mx-auto px-4">
            {/* Message de bienvenue et bannière */}
            <div className="relative bg-gradient-to-r from-orange-500 to-orange-400 rounded-2xl mb-8 overflow-hidden">
              <div className="absolute inset-0 opacity-10 bg-pattern"></div>
              <div className="relative z-10 px-6 py-8 md:px-10 md:py-12 text-white max-w-2xl">
                <h1 className="text-2xl md:text-3xl font-bold mb-2">Bienvenue sur votre espace client</h1>
                <p className="text-white/90 mb-6">Découvrez nos produits et services adaptés à vos besoins</p>
              </div>
            </div>
            
            {/* 🆕 Grille de statistiques AVEC DONNÉES RÉELLES */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Commandes totales (excluant les annulées) */}
              <div className="bg-white rounded-xl shadow-sm p-6 flex gap-4 items-center">
                <div className="bg-orange-500/10 w-12 h-12 rounded-full flex items-center justify-center">
                  <Package className="text-orange-500" size={24} />
                </div>
                <div>
                  <h3 className="text-sm text-gray-500 mb-1">Commandes totales</h3>
                  {statsLoading ? (
                    <div className="h-8 w-8 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    <p className="text-2xl font-bold">{orderStats.totalOrders}</p>
                  )}
                  <p className="text-xs text-gray-400">(Hors annulées)</p>
                </div>
              </div>
              
              {/* Total dépensé (commandes confirmées, expédiées, livrées) */}
              <div className="bg-white rounded-xl shadow-sm p-6 flex gap-4 items-center">
                <div className="bg-orange-500/10 w-12 h-12 rounded-full flex items-center justify-center">
                  <CreditCard className="text-orange-500" size={24} />
                </div>
                <div>
                  <h3 className="text-sm text-gray-500 mb-1">Total dépensé</h3>
                  {statsLoading ? (
                    <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    <p className="text-xl font-bold">{formatCurrency(orderStats.totalSpent)}</p>
                  )}
                  <p className="text-xs text-gray-400">(Commandes validées)</p>
                </div>
              </div>
              
              {/* Articles favoris (statique pour l'instant) */}
              <div className="bg-white rounded-xl shadow-sm p-6 flex gap-4 items-center">
                <div className="bg-red-100 w-12 h-12 rounded-full flex items-center justify-center">
                  <Heart className="text-red-500" size={24} />
                </div>
                <div>
                  <h3 className="text-sm text-gray-500 mb-1">Articles favoris</h3>
                  <p className="text-2xl font-bold">{orderStats.favoriteItems}</p>
                </div>
              </div>
              
              {/* Commandes en attente */}
              <div className="bg-white rounded-xl shadow-sm p-6 flex gap-4 items-center">
                <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center">
                  <Clock className="text-blue-500" size={24} />
                </div>
                <div>
                  <h3 className="text-sm text-gray-500 mb-1">En attente</h3>
                  {statsLoading ? (
                    <div className="h-8 w-6 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    <p className="text-2xl font-bold">{orderStats.pendingOrders}</p>
                  )}
                  <p className="text-xs text-gray-400">(Statut PENDING)</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
              {/* Dernières commandes */}
              <div className="lg:col-span-2">
                <div className="mb-6">
                  <RecentOrders />
                </div>
                
                {/* Services rapides */}
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
              </div>
              
              {/* Bloc latéral - IDENTIQUE */}
              <div className="lg:col-span-1">
                {/* Paramètres de compte */}
                <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Paramètres du compte</h2>
                    <Settings className="text-gray-400" size={20} />
                  </div>
                  <div className="border-t border-gray-100 pt-4">
                    <Link to="/profile" className="flex items-center py-3 text-gray-700 hover:text-orange-500 transition-colors">
                      <User size={18} className="mr-3" />
                      Modifier mon profil
                    </Link>
                    <Link to="/preferences" className="flex items-center py-3 text-gray-700 hover:text-orange-500 transition-colors">
                      <Bell size={18} className="mr-3" />
                      Préférences de notification
                    </Link>
                    <Link to="/securite" className="flex items-center py-3 text-gray-700 hover:text-orange-500 transition-colors">
                      <ShoppingBag size={18} className="mr-3" />
                      Méthodes de paiement
                    </Link>
                    <Link to="/securite" className="flex items-center py-3 text-gray-700 hover:text-orange-500 transition-colors">
                      <Settings size={18} className="mr-3" />
                      Sécurité du compte
                    </Link>
                    <button 
                      onClick={handleLogout}
                      className="flex items-center py-3 text-red-500 hover:text-red-600 transition-colors w-full text-left"
                    >
                      <LogOut size={18} className="mr-3" />
                      Se déconnecter
                    </button>
                  </div>
                </div>
                
                {/* Promotion */}
                <div className="bg-gradient-to-br from-orange-500 to-yellow-500 p-6 rounded-xl shadow-sm text-white">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-bold">Offre spéciale</h3>
                    <span className="bg-white text-orange-500 text-xs font-bold px-2 py-1 rounded">-20%</span>
                  </div>
                  <p className="mb-4">Profitez de 20% de réduction sur votre prochaine commande avec le code :</p>
                  <div className="bg-white/20 py-2 px-3 rounded text-center font-mono font-bold mb-4">
                    BIBOSPRING20
                  </div>
                  <Link 
                    to="#"
                    onClick={() => setActiveTab('products')} 
                    className="block w-full py-2 bg-white text-orange-500 text-center rounded-lg hover:bg-orange-50 transition-colors"
                  >
                    Découvrir
                  </Link>
                </div>
              </div>
            </div>

            {/* Produits populaires - Utilisation du composant ProductsGrid */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Produits populaires</h2>
                <Link 
                  to="#" 
                  onClick={() => setActiveTab('products')}
                  className="text-orange-500 hover:underline flex items-center"
                >
                  Voir tous les produits
                  <ChevronRight size={16} className="ml-1" />
                </Link>
              </div>
              
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
                </div>
              ) : (
                <ProductsGrid />
              )}
            </div>
          </div>
        )}

        {/* Page de produits - Utilisation du composant ProductsGrid */}
        {activeTab === 'products' && (
          <ProductsGrid />
        )}
      </main>
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default ClientDashboard;