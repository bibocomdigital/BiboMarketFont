"use client";


import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const ApiNotFound = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    console.log('🔍 API route détectée:', location.pathname);
    
    // Extraction du chemin API complet
    const apiPath = location.pathname;
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3007/api';
    const fullBackendUrl = `${backendUrl}${apiPath}${location.search}`;
    
    // Si c'est une route d'authentification Google, on redirige directement vers le backend
    if (apiPath.includes('/api/auth/google')) {
      console.log('🔄 Redirection de Google Auth vers le backend:', fullBackendUrl);
      
      toast({
        title: "Redirection vers l'authentification",
        description: "Connexion au service Google en cours...",
      });
      
      // Stocker l'URL actuelle pour la redirection après authentification
      localStorage.setItem('auth_redirect_url', window.location.origin + '/redirect');
      
      // Vérifier si l'utilisateur est sur localhost 
      const isLocalhost = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1';
                        
      if (isLocalhost) {
        console.log('⚠️ Détection de localhost, ouverture dans une nouvelle fenêtre pour éviter les problèmes CORS');
        // Sur localhost, on ouvre dans une nouvelle fenêtre pour éviter les problèmes CORS
        window.open(fullBackendUrl, '_blank');
        
        // Reste sur la page actuelle un moment puis redirige vers la page d'accueil
        setTimeout(() => {
          navigate('/');
        }, 5000);
      } else {
        // En production, redirection directe
        window.location.href = fullBackendUrl;
      }
      
      return;
    }
    
    // Pour les autres routes API non trouvées
    toast({
      title: "API Route non trouvée",
      description: "Redirection vers la page d'accueil...",
      variant: "destructive"
    });
    
    // Rediriger vers la page d'accueil après un court délai
    setTimeout(() => {
      navigate('/');
    }, 3000);
  }, [navigate, toast, location]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50">
      <div className="text-center max-w-md p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-amber-600 mb-4">Traitement de la Requête</h1>
        <p className="mb-4">
          {location.pathname.includes('/api/auth/google') 
            ? "Redirection vers le serveur d'authentification Google..."
            : "L'API demandée n'est pas disponible. Cela peut être dû à une configuration incorrecte."}
        </p>
        <p className="text-sm text-gray-600 mb-6">
          {location.pathname.includes('/api/auth/google')
            ? "Veuillez patienter pendant que nous traitons votre demande d'authentification. Si rien ne se passe, vérifiez que votre backend est en cours d'exécution sur le port 8001."
            : "Assurez-vous que votre backend est correctement configuré pour gérer les requêtes API."}
        </p>
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] mx-auto"></div>
        <p className="mt-4 text-sm text-gray-500">
          {location.pathname.includes('/api/auth/google')
            ? "Redirection vers le service d'authentification..."
            : "Redirection vers la page d'accueil..."}
        </p>
      </div>
    </div>
  );
};

export default ApiNotFound;
