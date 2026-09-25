"use client";


import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { 
  InputOTP, 
  InputOTPGroup, 
  InputOTPSlot 
} from "@/components/ui/input-otp";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { UserRole, mapStringToUserRole } from '@/types/user';
import { verifyCode, login, resendVerificationCode } from '@/services/authService';
import { dashboardPathFor } from '@/hooks/use-auth-session';

type VerificationScenario = 'success' | 'incorrect' | 'expired' | 'error';

const VerifyCode = () => {
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<VerificationScenario | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  console.log('🔄 [VERIFY] Initialisation de la page de vérification');
  console.log('🔍 [VERIFY] Location state complet:', location.state);
  
  const userEmail = location.state?.email || '';
  const userPassword = location.state?.password || '';
  const userRoleString = location.state?.role || 'CLIENT';
  const userRole = mapStringToUserRole(userRoleString);
  
  console.log('📧 [VERIFY] Email reçu:', userEmail);
  console.log('🔑 [VERIFY] Mot de passe reçu:', userPassword ? '[PRÉSENT - ' + userPassword.length + ' caractères]' : '[ABSENT]');
  console.log('🔑 [VERIFY] Mot de passe détails pour debug:', userPassword);
  console.log('👤 [VERIFY] Rôle reçu:', userRoleString);
  
  useEffect(() => {
    if (!userEmail) {
      console.warn('⚠️ [VERIFY] Email manquant, redirection vers l\'inscription');
      toast({
        title: "Données manquantes",
        description: "L'email est requis pour la vérification",
        variant: "destructive"
      });
      
      setTimeout(() => {
        navigate('/register');
        console.log('✅ [VERIFY] Redirection vers /register effectuée');
      }, 500);
    }
  }, [userEmail, navigate, toast]);
  
  const handleVerify = async () => {
    if (code.length !== 6) {
      console.warn('⚠️ [VERIFY] Code incomplet');
      toast({
        title: "Code incomplet",
        description: "Veuillez entrer les 6 caractères du code",
        variant: "destructive"
      });
      return;
    }
    
    setIsVerifying(true);
    setError(null);
    setErrorType(null);
    
    console.log('🔄 [VERIFY] Vérification du code en cours...');
    console.log('📧 [VERIFY] Email utilisé:', userEmail);
    console.log('🔑 [VERIFY] Code soumis:', code);
    
    toast({
      title: "Vérification en cours",
      description: "Nous vérifions votre code..."
    });
    
    try {
      console.log('🔍 [VERIFY] Appel de verifyCode avec email:', userEmail, 'et code:', code);
      const response = await verifyCode(userEmail, code);
      console.log('✅ [VERIFY] Vérification réussie! Réponse:', response);
      
      setSuccess(true);
      
      toast({
        title: "Compte vérifié",
        description: "Votre compte a été vérifié avec succès!"
      });
      
      try {
        console.log('🔄 [VERIFY] Tentative de connexion automatique...');
        console.log('📧 [VERIFY] Email utilisé pour la connexion:', userEmail);
        console.log('🔑 [VERIFY] Mot de passe disponible:', userPassword ? 'Oui' : 'Non');
        console.log('🔑 [VERIFY] Longueur du mot de passe:', userPassword ? userPassword.length : 0);
        console.log('👤 [VERIFY] Rôle attendu de l\'utilisateur:', userRoleString);
        
        if (!userPassword) {
          console.warn('⚠️ [VERIFY] Mot de passe non disponible, redirection vers la page de connexion');
          throw new Error('Mot de passe non disponible');
        }
        
        console.log('🔄 [VERIFY] Appel de login avec email:', userEmail);
        const loginResult = await login({
          email: userEmail,
          password: userPassword
        });
        
        if (!loginResult.user) {
          navigate("/login", { replace: true });
          return;
        }
        console.log('✅ [VERIFY] Connexion automatique réussie!', loginResult);
        console.log('👤 [VERIFY] Rôle de l\'utilisateur connecté:', loginResult.user.role);
        
        console.log('🔄 [VERIFY] Préparation de la redirection après connexion...');
        console.log('👤 [VERIFY] Rôle transmis lors de l\'inscription:', userRoleString);
        
        setTimeout(() => {
          navigate(dashboardPathFor(loginResult.user.role), { replace: true });
        }, 3000);
      } catch (loginError) {
        console.error('❌ [VERIFY] Erreur lors de la connexion automatique:', loginError);
        
        console.log('🔄 [VERIFY] Redirection vers la page de connexion avec indication de succès de vérification');
        setTimeout(() => {
          console.log('⏱️ [VERIFY] Délai de redirection vers login démarré (3s)');
          
          navigate('/login', { 
            state: { 
              verificationSuccessful: true,
              email: userEmail
            },
            replace: true
          });
          console.log('✅ [VERIFY] Redirection vers la page de connexion effectuée!');
        }, 3000);
      }
      
    } catch (error: any) {
      console.error('❌ [VERIFY] Erreur lors de la vérification du code:', error);
      console.error('❌ [VERIFY] Message d\'erreur:', error.message);
      console.error('❌ [VERIFY] Détails de l\'erreur:', error);
      
      if (error.message && error.message.includes('expiré')) {
        console.log('⏰ [VERIFY] Code expiré');
        setError("Code de vérification expiré. Veuillez vous réinscrire.");
        setErrorType('expired');
        
        toast({
          title: "Code expiré",
          description: "Votre code de vérification a expiré",
          variant: "destructive"
        });
      } else if (error.message && error.message.includes('incorrect')) {
        console.log('❌ [VERIFY] Code incorrect');
        setError("Code de vérification incorrect. Veuillez réessayer.");
        setErrorType('incorrect');
        
        toast({
          title: "Code incorrect",
          description: "Le code de vérification est incorrect",
          variant: "destructive"
        });
      } else {
        console.log('❌ [VERIFY] Erreur générique lors de la vérification');
        setError("Une erreur est survenue lors de la vérification");
        setErrorType('error');
        
        toast({
          title: "Erreur",
          description: "Une erreur est survenue lors de la vérification",
          variant: "destructive"
        });
      }
    } finally {
      setIsVerifying(false);
      console.log('🔄 [VERIFY] Fin du processus de vérification');
    }
  };
  
  const handleResendCode = async () => {
    if (isResending) return;
    
    setIsResending(true);
    console.log('🔄 [VERIFY] Demande de renvoi de code pour:', userEmail);
    
    try {
      console.log('🔄 [VERIFY] Appel de resendVerificationCode avec email:', userEmail);
      const response = await resendVerificationCode(userEmail);
      console.log('✅ [VERIFY] Renvoi de code réussi:', response);
      
      toast({
        title: "Code renvoyé",
        description: "Un nouveau code a été envoyé à votre adresse email"
      });
      
      setError(null);
      setErrorType(null);
      setCode("");
      
      console.log('✅ [VERIFY] Interface réinitialisée pour nouveau code');
    } catch (error) {
      console.error('❌ [VERIFY] Erreur lors du renvoi du code:', error);
      
      toast({
        title: "Erreur",
        description: "Impossible de renvoyer le code. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setIsResending(false);
    }
  };
  
  const handleReturnToRegister = () => {
    console.log('🔄 [VERIFY] Retour à l\'inscription demandé');
    navigate('/register', { replace: true });
    console.log('✅ [VERIFY] Redirection vers /register effectuée');
  };
  
  const handleCodeChange = (value: string) => {
    setCode(value);
    console.log('🔢 [VERIFY] Code mis à jour:', value);
    
    if (error) {
      setError(null);
      setErrorType(null);
      console.log('🔄 [VERIFY] Réinitialisation des erreurs suite à modification du code');
    }
    
    if (value.length === 6) {
      console.log('🔄 [VERIFY] Code complet (6 caractères), vérification automatique dans 500ms');
      setTimeout(() => {
        if (!isVerifying && !success) {
          console.log('🔄 [VERIFY] Déclenchement automatique de la vérification');
          handleVerify();
        }
      }, 500);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-gray-50">
      <div className="flex-1 flex flex-col justify-center items-center p-6">
        <div className="w-full max-w-md">
          <Link to="/register" className="inline-flex items-center text-bibocom-primary hover:text-bibocom-accent mb-8 transition-colors">
            <ArrowLeft size={16} className="mr-2" />
            Retour à l'inscription
          </Link>
          
          <div className="bg-white shadow-xl rounded-2xl p-8 mb-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-bibocom-primary">Vérification</h2>
              <p className="text-gray-500 mt-2">
                Veuillez entrer le code à 6 caractères que nous avons envoyé à 
                <span className="font-medium block mt-1">{userEmail || "votre email"}</span>
              </p>
            </div>
            
            {success ? (
              <div className="flex flex-col items-center justify-center py-4">
                <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                <h3 className="text-xl font-semibold text-green-700">Code vérifié</h3>
                <p className="text-gray-600 text-center mt-2">
                  Votre compte a été vérifié avec succès!
                </p>
                <p className="text-gray-600 text-center mt-2">
                  Vous allez être redirigé vers votre tableau de bord...
                </p>
              </div>
            ) : (
              <>
                <div className="mb-8">
                  <InputOTP 
                    maxLength={6} 
                    value={code} 
                    onChange={handleCodeChange}
                    pattern="^[a-zA-Z0-9]*$"
                    className={error ? "border-red-300" : ""}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} className={error ? "border-red-300" : ""} />
                      <InputOTPSlot index={1} className={error ? "border-red-300" : ""} />
                      <InputOTPSlot index={2} className={error ? "border-red-300" : ""} />
                      <InputOTPSlot index={3} className={error ? "border-red-300" : ""} />
                      <InputOTPSlot index={4} className={error ? "border-red-300" : ""} />
                      <InputOTPSlot index={5} className={error ? "border-red-300" : ""} />
                    </InputOTPGroup>
                  </InputOTP>
                  
                  {error && (
                    <div className="flex items-center mt-2 text-red-600">
                      <AlertCircle size={16} className="mr-1" />
                      <p className="text-sm">{error}</p>
                    </div>
                  )}
                  
                  {errorType === 'expired' ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mt-4">
                      <p className="text-sm text-amber-800">
                        Votre code a expiré. Cliquez sur "Retourner à l'inscription" pour vous réinscrire.
                      </p>
                      <Button 
                        className="w-full mt-2 bg-amber-600 hover:bg-amber-700 text-white" 
                        onClick={handleReturnToRegister}
                      >
                        Retourner à l'inscription
                      </Button>
                    </div>
                  ) : errorType === 'incorrect' ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mt-4">
                      <p className="text-sm text-amber-800">
                        Code incorrect. Vous pouvez réessayer ou demander un nouveau code.
                      </p>
                      <Button 
                        className="w-full mt-2 flex items-center justify-center"
                        variant="outline" 
                        onClick={handleResendCode}
                        disabled={isResending}
                      >
                        <RefreshCw size={16} className={`mr-2 ${isResending ? 'animate-spin' : ''}`} />
                        {isResending ? 'Envoi en cours...' : 'Demander un nouveau code'}
                      </Button>
                    </div>
                  ) : (
                    <p className="text-center text-sm text-gray-500 mt-4">
                      Vous n'avez pas reçu de code? 
                      <button 
                        className={`text-bibocom-accent ml-1 hover:underline ${isResending ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={handleResendCode}
                        disabled={isResending}
                      >
                        {isResending ? 'Envoi en cours...' : 'Renvoyer'}
                      </button>
                    </p>
                  )}
                </div>
                
                <Button 
                  onClick={handleVerify} 
                  className="w-full bg-bibocom-primary text-white"
                  disabled={isVerifying || code.length !== 6}
                >
                  {isVerifying ? 'Vérification en cours...' : 'Vérifier'}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyCode;
