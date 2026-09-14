import React from 'react';
import { Store, ShoppingBag, Users, CheckCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import CreateShopDialog from './CreateShopDialog';

interface NoShopProps {
  onShopCreated: () => void;
}

const NoShop: React.FC<NoShopProps> = ({ onShopCreated }) => {
  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-bibocom-primary/10 to-bibocom-accent/10 rounded-xl p-8 text-center space-y-4 shadow-sm">
        <Store className="mx-auto h-16 w-16 text-bibocom-primary" />
        <h1 className="text-2xl md:text-3xl font-bold text-bibocom-primary">Créez votre boutique en ligne</h1>
        <p className="text-gray-600 max-w-3xl mx-auto">
          Bienvenue sur BibocomMarket! En tant que commerçant, vous pouvez créer votre propre boutique en ligne pour vendre vos produits et services à une clientèle plus large.
        </p>
        
        <Alert className="max-w-xl mx-auto bg-amber-50 border-amber-200 mt-4">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">Important</AlertTitle>
          <AlertDescription className="text-amber-700">
            Chaque commerçant ne peut créer qu'une seule boutique. Une fois créée, vous pourrez la personnaliser et y ajouter vos produits.
          </AlertDescription>
        </Alert>
        
        <div className="pt-4">
          <CreateShopDialog onSuccess={onShopCreated} />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-t-4 border-t-bibocom-primary">
          <CardHeader>
            <div className="bg-bibocom-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <Store className="h-6 w-6 text-bibocom-primary" />
            </div>
            <CardTitle>Gérez votre boutique</CardTitle>
            <CardDescription>
              Personnalisez votre boutique selon votre image de marque
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-sm">Interface intuitive et facile à utiliser</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-sm">Tableau de bord complet avec statistiques</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-sm">Personnalisez les informations et logo</span>
              </li>
            </ul>
          </CardContent>
        </Card>
        
        <Card className="border-t-4 border-t-bibocom-accent">
          <CardHeader>
            <div className="bg-bibocom-accent/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <ShoppingBag className="h-6 w-6 text-bibocom-accent" />
            </div>
            <CardTitle>Vendez vos produits</CardTitle>
            <CardDescription>
              Proposez vos produits à une clientèle plus large
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-sm">Ajoutez des photos, descriptions et prix</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-sm">Gestion des stocks et des inventaires</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-sm">Suivez vos ventes en temps réel</span>
              </li>
            </ul>
          </CardContent>
        </Card>
        
        <Card className="border-t-4 border-t-purple-500">
          <CardHeader>
            <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-purple-500" />
            </div>
            <CardTitle>Gérez vos clients</CardTitle>
            <CardDescription>
              Développez une relation durable avec vos clients
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-sm">Recevez et gérez les commandes</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-sm">Communication simplifiée avec les clients</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-sm">Programmes de fidélité et promotions</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Comment ça marche ?</CardTitle>
          <CardDescription>
            Suivez ces étapes simples pour démarrer avec votre boutique en ligne
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col items-center text-center p-4">
              <div className="bg-bibocom-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <span className="text-bibocom-primary font-bold text-xl">1</span>
              </div>
              <h3 className="font-semibold mb-2">Créez votre boutique</h3>
              <p className="text-sm text-gray-600">
                Remplissez le formulaire avec les informations de votre entreprise et téléchargez votre logo.
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center p-4">
              <div className="bg-bibocom-accent/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <span className="text-bibocom-accent font-bold text-xl">2</span>
              </div>
              <h3 className="font-semibold mb-2">Ajoutez vos produits</h3>
              <p className="text-sm text-gray-600">
                Créez votre catalogue en ajoutant des produits avec photos, descriptions et prix.
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center p-4">
              <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <span className="text-purple-500 font-bold text-xl">3</span>
              </div>
              <h3 className="font-semibold mb-2">Commencez à vendre</h3>
              <p className="text-sm text-gray-600">
                Recevez des commandes, gérez vos livraisons et développez votre activité en ligne.
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <CreateShopDialog onSuccess={onShopCreated} />
        </CardFooter>
      </Card>
    </div>
  );
};

export default NoShop;
