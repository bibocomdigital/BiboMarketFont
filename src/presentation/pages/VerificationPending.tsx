"use client";


import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Progress } from "@/components/ui/progress";
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Loader } from 'lucide-react';

const VerificationPending = () => {
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState<'checking' | 'verified' | 'redirecting'>('checking');
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // Récupérer le type d'utilisateur depuis la navigation
  const userRole = location.state?.role || 'client';
  
  useEffect(() => {
    // Simuler un progrès de vérification
    const timer = setInterval(() => {
      setProgress(prevProgress => {
        if (prevProgress >= 100) {
          clearInterval(timer);
          return 100;
        }
        
        // Accélérer progressivement
        const increment = 1 + Math.floor(prevProgress / 20);
        const newProgress = prevProgress + increment;
        
        // Changer l'étape lorsque le progrès atteint certains seuils
        if (newProgress >= 60 && step === 'checking') {
          setStep('verified');
        }
        if (newProgress >= 90 && step === 'verified') {
          setStep('redirecting');
        }
        
        return newProgress > 100 ? 100 : newProgress;
      });
    }, 150);
    
    // Quand le progrès atteint 100%, rediriger vers la page appropriée
    const redirectTimer = setTimeout(() => {
      toast({
        title: "Vérification réussie",
        description: "Votre compte a été vérifié avec succès"
      });
      
      // Rediriger selon le rôle
      if (userRole === 'commercant' || userRole === 'MERCHANT') {
        navigate('/merchant-dashboard');
      } else if (userRole === 'fournisseur' || userRole === 'SUPPLIER') {
        navigate('/supplier-dashboard'); 
      } else {
        navigate('/client-dashboard');
      }
    }, 5000); // 5 secondes
    
    return () => {
      clearInterval(timer);
      clearTimeout(redirectTimer);
    };
  }, [navigate, userRole, toast, step]);
  
  const getStatusMessage = () => {
    switch (step) {
      case 'checking':
        return "Vérification de votre compte...";
      case 'verified':
        return "Compte vérifié! Préparation de votre espace...";
      case 'redirecting':
        return "Redirection vers votre tableau de bord...";
      default:
        return "Traitement en cours...";
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-gray-50">
      <div className="flex-1 flex flex-col justify-center items-center p-6">
        <div className="w-full max-w-md">
          <div className="bg-white shadow-xl rounded-2xl p-8 mb-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-bibocom-primary">Vérification en cours</h2>
              <p className="text-gray-500 mt-2">
                {getStatusMessage()}
              </p>
            </div>
            
            <div className="mb-6">
              <Progress value={progress} className="h-2" />
              <p className="text-right text-sm text-gray-500 mt-1">{progress}%</p>
            </div>
            
            <div className="py-4 text-center">
              {step === 'verified' || step === 'redirecting' ? (
                <div className="transition-all duration-500 ease-in-out">
                  <div className="h-16 w-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                  <p className="mt-4 text-sm text-green-600 font-medium">
                    {step === 'verified' ? "Vérification réussie!" : "Préparation de votre expérience personnalisée..."}
                  </p>
                </div>
              ) : (
                <div className="animate-pulse">
                  <div className="h-16 w-16 mx-auto rounded-full bg-bibocom-accent/20 flex items-center justify-center">
                    <Loader className="h-8 w-8 text-bibocom-accent animate-spin" />
                  </div>
                  <p className="mt-4 text-sm text-gray-500">
                    Vérification de vos informations...
                  </p>
                </div>
              )}
            </div>
            
            {progress >= 80 && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-sm text-blue-800 text-center">
                  Votre tableau de bord sera disponible dans quelques instants...
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationPending;
