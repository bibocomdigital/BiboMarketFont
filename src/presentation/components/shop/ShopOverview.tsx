"use client";

import React, { useState, useEffect } from 'react';
import { 
  Store, 
  Phone, 
  MapPin, 
  Package, 
  ShoppingCart, 
  Users, 
  Settings,
  Edit,
  Search,
  Filter
} from 'lucide-react';
import { Shop, ShopProduct, formatImageUrl } from '@/services/shopService';
import { getProductCategories } from '@/services/productService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Badge from '@/components/ui-custom/Badge';
import CreateProductModal from './CreateProductModal';
import ProductsGrid from '@/components/ProductsGrid';

interface ShopOverviewProps {
  shop: Shop;
  products: ShopProduct[];
  onEditClick?: () => void;
}

const ShopOverview: React.FC<ShopOverviewProps> = ({ 
  shop, 
  products: initialProducts,
  onEditClick 
}) => {
  console.log("ShopOverview rendered", { shopName: shop.name, productsCount: initialProducts.length });
  
  // État pour contrôler l'ouverture/fermeture du modal
  const [isCreateProductModalOpen, setIsCreateProductModalOpen] = useState(false);
  
  // États pour le filtrage (à passer au ProductsGrid)
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Fonction pour fermer le modal
  const closeCreateProductModal = () => {
    console.log("closeCreateProductModal called");
    setIsCreateProductModalOpen(false);
  };
  
  return (
    <div className="space-y-6">
      {/* Modal d'ajout de produit */}
      <CreateProductModal 
        isOpen={isCreateProductModalOpen} 
        onClose={closeCreateProductModal} 
      />

      {/* En-tête de la boutique */}
      <div className="bg-gradient-to-r from-bibocom-primary/10 to-bibocom-accent/10 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="relative">
            <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
              {shop.logo ? (
                <AvatarImage 
                  src={formatImageUrl(shop.logo)}
                  alt={shop.name} 
                />
              ) : (
                <AvatarFallback className="bg-bibocom-primary text-white text-xl">
                  {shop.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
          </div>
          
          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-bibocom-primary">{shop.name}</h1>
                <div className="mt-1 flex items-center">
                  <Badge variant="accent" className="mr-2">Boutique vérifiée</Badge>
                  <p className="text-sm text-gray-600">
                    Créée le {new Date(shop.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              {onEditClick && (
                <Button 
                  onClick={onEditClick} 
                  variant="outline" 
                  className="flex items-center"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier ma boutique
                </Button>
              )}
            </div>
            
            <p className="mt-3 text-gray-700">{shop.description}</p>
            
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center text-gray-600">
                <Phone className="h-4 w-4 mr-2 text-bibocom-accent" />
                <span>{shop.phoneNumber}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <MapPin className="h-4 w-4 mr-2 text-bibocom-accent" />
                <span>{shop.address}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Statistiques de la boutique */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Produits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="bg-bibocom-accent/10 w-10 h-10 rounded-lg flex items-center justify-center">
                <Package className="text-bibocom-accent" size={20} />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold">{initialProducts.length}</p>
                <p className="text-xs text-gray-500">En catalogue</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Commandes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="bg-green-100 w-10 h-10 rounded-lg flex items-center justify-center">
                <ShoppingCart className="text-green-500" size={20} />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold">0</p>
                <p className="text-xs text-gray-500">En attente</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="bg-purple-100 w-10 h-10 rounded-lg flex items-center justify-center">
                <Users className="text-purple-500" size={20} />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold">0</p>
                <p className="text-xs text-gray-500">Clients</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Actions rapides */}
      <Card>
        <CardHeader>
          <CardTitle>Actions rapides</CardTitle>
          <CardDescription>Gérez efficacement votre boutique</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Action d'ajout de produit */}
          <div 
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            onClick={() => {
              console.log("Add product card clicked");
              setIsCreateProductModalOpen(true);
            }}
          >
            <div className="bg-bibocom-accent/10 w-10 h-10 rounded-lg flex items-center justify-center mr-3">
              <Package className="text-bibocom-accent" size={20} />
            </div>
            <div>
              <h3 className="font-medium">Ajouter un produit</h3>
              <p className="text-sm text-gray-500">Créez et publiez un nouveau produit</p>
            </div>
          </div>
          
          <div className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="bg-green-100 w-10 h-10 rounded-lg flex items-center justify-center mr-3">
              <ShoppingCart className="text-green-500" size={20} />
            </div>
            <div>
              <h3 className="font-medium">Gérer les commandes</h3>
              <p className="text-sm text-gray-500">Voir et traiter les commandes</p>
            </div>
          </div>
          
          <div className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="bg-blue-100 w-10 h-10 rounded-lg flex items-center justify-center mr-3">
              <Settings className="text-blue-500" size={20} />
            </div>
            <div>
              <h3 className="font-medium">Paramètres boutique</h3>
              <p className="text-sm text-gray-500">Personnalisez votre boutique</p>
            </div>
          </div>
          
          <div className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="bg-purple-100 w-10 h-10 rounded-lg flex items-center justify-center mr-3">
              <Users className="text-purple-500" size={20} />
            </div>
            <div>
              <h3 className="font-medium">Clients fidèles</h3>
              <p className="text-sm text-gray-500">Gérez vos clients et fidélisez-les</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Liste des produits avec filtres */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Gestion des produits</CardTitle>
              <CardDescription>Visualisez et gérez tous vos produits</CardDescription>
            </div>
            <Button 
              onClick={() => {
                setIsCreateProductModalOpen(true);
              }}
              className="flex items-center"
            >
              <Package className="h-4 w-4 mr-2" />
              Ajouter un produit
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="pt-4">
          {initialProducts.length > 0 ? (
            <div className="shop-products-grid">
              <ProductsGrid
                shopId={shop.id}
                isOwner={true}
                customPagination={{ limit: 12 }}
                filterOptions={{
                  showSearch: true,
                  showCategories: true,
                  initialSearchTerm: searchTerm,
                  initialCategory: selectedCategory
                }}
              />
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Aucun produit</h3>
              <p className="mt-1 text-sm text-gray-500">
                Vous n'avez pas encore ajouté de produits à votre boutique.
              </p>
              <div className="mt-6">
                <Button 
                  onClick={() => {
                    setIsCreateProductModalOpen(true);
                  }}
                >
                  Ajouter un produit
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ShopOverview;