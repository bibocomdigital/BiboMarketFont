"use client";


import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { processSocialAuthToken } from '@/services/socialAuthService';

const Redirector = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(true);
  
  useEffect(() => {
    console.log('📍 Redirector activated with URL:', location.pathname, location.search);
    
    // Retrieve URL parameters
    const params = new URLSearchParams(location.search);
    const code = params.get('code');
    const scope = params.get('scope');
    const urlToken = params.get('token');
    const needsCompletion = params.get('needsCompletion') === 'true';
    
    // Debug info
    console.log('🔍 URL parameters:', {
      code: code ? `${code.substring(0, 10)}...` : 'null',
      scope: scope || 'null',
      token: urlToken ? `${urlToken.substring(0, 10)}...` : 'null',
      needsCompletion: needsCompletion
    });
    
    // If we have a token in the URL, use it directly
    if (urlToken) {
      console.log('🔑 Token found in URL:', urlToken.substring(0, 15) + '...');
      
      // Process the token through our service
      if (processSocialAuthToken(urlToken)) {
        toast({
          title: "Authentification réussie",
          description: "Vous allez être redirigé pour compléter votre profil.",
        });
        
        // Always redirect to complete profile for social auth
        navigate(`/complete-profile?token=${urlToken}`);
      } else {
        toast({
          title: "Problème d'authentification",
          description: "Impossible de traiter votre jeton d'authentification.",
          variant: "destructive"
        });
        navigate('/');
      }
      return;
    }
    
    // Check localStorage for a recent token
    const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
    if (token) {
      console.log('🔑 Token found in localStorage:', token.substring(0, 15) + '...');
      toast({
        title: "Authentification réussie",
        description: "Vous allez être redirigé pour compléter votre profil.",
      });
      // Always redirect to complete profile for social login
      navigate(`/complete-profile?token=${token}`);
      return;
    }
    
    // If no token, try to handle Google auth redirection
    if (code && scope) {
      console.log('🔍 Google code and scope detected, redirecting to API...');
      
      // Redirect to the API to finalize authentication
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3007/api';
      const redirectUrl = `${backendUrl}/api/auth/google/callback?code=${code}&scope=${scope}`;
      
      console.log('🔄 Redirecting to backend:', redirectUrl);
      
      // Store current origin for callback
      localStorage.setItem('auth_redirect_url', window.location.origin + '/redirect');
      
      // Redirect to backend
      window.location.href = redirectUrl;
      return;
    }
    
    // If no previous case, check localStorage again after a short delay
    setTimeout(() => {
      const retryToken = localStorage.getItem('token') || localStorage.getItem('auth_token');
      if (retryToken) {
        console.log('🔑 Token found after waiting:', retryToken.substring(0, 15) + '...');
        navigate(`/complete-profile?token=${retryToken}`);
      } else {
        console.log('❌ No token found - redirecting to home');
        setIsProcessing(false);
        toast({
          title: "Problème d'authentification",
          description: "Impossible de récupérer votre jeton d'authentification.",
          variant: "destructive"
        });
        navigate('/');
      }
    }, 2000);
  }, [navigate, location, toast]);
  
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
        <p className="mt-4 text-lg">Redirection en cours...</p>
        <p className="text-sm text-gray-500 mt-2">Traitement de votre authentification...</p>
        {!isProcessing && (
          <p className="text-amber-600 mt-4">
            Aucun jeton d'authentification trouvé. Si le problème persiste, contactez l'administrateur.
          </p>
        )}
      </div>
    </div>
  );
};

export default Redirector;
