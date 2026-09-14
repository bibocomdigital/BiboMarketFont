"use client";


import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PackageOpen, Truck, Settings, ShoppingBag, Users, BarChart } from 'lucide-react';
import { logout } from '@/services/authService';
import { useToast } from '@/hooks/use-toast';

const SupplierDashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    toast({
      title: 'Déconnexion réussie',
      description: 'Vous avez été déconnecté avec succès.'
    });
    navigate('/login');
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-bibocom-success/90 text-white">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold">Tableau de bord Fournisseur</h1>
          <Button variant="outline" onClick={handleLogout} className="bg-white text-bibocom-success">
            Se déconnecter
          </Button>
        </div>
      </div>
      
      <main className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Bienvenue sur votre espace fournisseur</h2>
          <p className="text-gray-600">
            Gérez vos produits, services et relations avec les commerçants depuis cette interface.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">Statistiques</h3>
              <span className="p-2 bg-bibocom-success/10 rounded-full text-bibocom-success">
                <BarChart size={20} />
              </span>
            </div>
            <p className="text-2xl font-bold">0</p>
            <p className="text-sm text-gray-500">Commandes en cours</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">Produits</h3>
              <span className="p-2 bg-bibocom-success/10 rounded-full text-bibocom-success">
                <PackageOpen size={20} />
              </span>
            </div>
            <p className="text-2xl font-bold">0</p>
            <p className="text-sm text-gray-500">Produits disponibles</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">Commerçants</h3>
              <span className="p-2 bg-bibocom-success/10 rounded-full text-bibocom-success">
                <Users size={20} />
              </span>
            </div>
            <p className="text-2xl font-bold">0</p>
            <p className="text-sm text-gray-500">Clients commerçants</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-medium mb-4">Actions rapides</h3>
            <div className="space-y-4">
              <button className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <span>Ajouter un produit</span>
                <PackageOpen size={18} />
              </button>
              
              <button className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <span>Gérer les livraisons</span>
                <Truck size={18} />
              </button>
              
              <button className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <span>Paramètres du compte</span>
                <Settings size={18} />
              </button>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-medium mb-4">Notifications récentes</h3>
            <div className="text-center py-6">
              <p className="text-gray-500">Aucune notification pour le moment</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SupplierDashboard;
