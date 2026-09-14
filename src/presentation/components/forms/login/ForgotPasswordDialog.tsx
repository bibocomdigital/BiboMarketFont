"use client";


import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader, AlertCircle, Check } from 'lucide-react';
import { z } from 'zod';

// API URL configuration - matching the one in authService
import { useForgotPasswordMutation, useResetPasswordMutation } from '@/hooks/mutations/use-auth-mutations';

interface ForgotPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resetEmail: string;
  setResetEmail: (email: string) => void;
}

// Define schemas for validation
const emailSchema = z.string().email("Veuillez entrer une adresse email valide");
const codeSchema = z.string().min(6, "Le code doit contenir au moins 6 caractères");
const passwordSchema = z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères");

const ForgotPasswordDialog = ({ open, onOpenChange, resetEmail, setResetEmail }: ForgotPasswordDialogProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState<'email' | 'code' | 'password' | 'success'>('email');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const forgotMutation = useForgotPasswordMutation();
  const resetMutation = useResetPasswordMutation();
  const isLoading = forgotMutation.isPending || resetMutation.isPending;
  const [error, setError] = useState<string | null>(null);

  // Function to request a password reset code
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      
      // Validate email
      const validationResult = emailSchema.safeParse(resetEmail);
      if (!validationResult.success) {
        console.error('❌ [PASSWORD RESET] Email invalide:', validationResult.error);
        setError("Veuillez entrer une adresse email valide");
        return;
      }
      
      await forgotMutation.mutateAsync(resetEmail);
      
      console.log('✅ [PASSWORD RESET] Code de réinitialisation envoyé avec succès');
      toast({
        title: "Code envoyé",
        description: "Si un compte existe avec cet email, vous recevrez un code de réinitialisation.",
      });
      
      setStep('code');
    } catch (error) {
      
      setError(error instanceof Error ? error.message : "Une erreur est survenue lors de l'envoi du code");
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive",
      });
    }
  };

  // Function to verify the reset code
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      
      // Validate code
      const validationResult = codeSchema.safeParse(verificationCode);
      if (!validationResult.success) {
        console.error('❌ [PASSWORD RESET] Code invalide:', validationResult.error);
        setError("Le code de vérification doit contenir au moins 6 caractères");
        return;
      }
      
      // Here we only validate the code format - actual verification happens with the new password
      setStep('password');
    } catch (error) {
      setError(error instanceof Error ? error.message : "Une erreur est survenue lors de la vérification du code");
    }
  };

  // Function to set a new password
  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      
      // Validate password
      const validationResult = passwordSchema.safeParse(newPassword);
      if (!validationResult.success) {
        console.error('❌ [PASSWORD RESET] Mot de passe invalide:', validationResult.error);
        setError("Le mot de passe doit contenir au moins 8 caractères");
        return;
      }
      
      // Check if passwords match
      if (newPassword !== confirmPassword) {
        console.error('❌ [PASSWORD RESET] Les mots de passe ne correspondent pas');
        setError("Les mots de passe ne correspondent pas");
        return;
      }
      
      await resetMutation.mutateAsync({
        email: resetEmail,
        code: verificationCode,
        newPassword,
      });
      
      console.log('✅ [PASSWORD RESET] Mot de passe réinitialisé avec succès');
      toast({
        title: "Mot de passe réinitialisé",
        description: "Votre mot de passe a été modifié avec succès.",
      });
      
      setStep('success');
      
      // Redirection vers la page de connexion avec un délai
      console.log('🔄 [PASSWORD RESET] Préparation de la redirection dans 2 secondes...');
      setTimeout(() => {
        console.log('🔄 [PASSWORD RESET] Exécution de la redirection...');
        handleClose();
        navigate('/login');
      }, 2000);
      
    } catch (error) {
      console.error('❌ [PASSWORD RESET] Erreur détaillée de réinitialisation:', error);
      console.error('❌ [PASSWORD RESET] Type d\'erreur:', typeof error);
      console.error('❌ [PASSWORD RESET] Message d\'erreur:', error instanceof Error ? error.message : String(error));
      
      // Handle specific error cases
      if (error instanceof Error) {
        if (error.message.includes("Code de réinitialisation incorrect")) {
          console.log('🔄 [PASSWORD RESET] Code incorrect détecté, retour à l\'étape de saisie du code');
          setError("Code de vérification incorrect. Veuillez vérifier et réessayer.");
          setStep('code'); // Return to code step
          setVerificationCode(''); // Clear the code
        } else if (error.message.includes("Code de réinitialisation expiré")) {
          console.log('🔄 [PASSWORD RESET] Code expiré détecté, retour à l\'étape de demande de code');
          setError("Le code de réinitialisation a expiré. Veuillez demander un nouveau code.");
          setStep('email'); // Return to email step
          setVerificationCode(''); // Clear the code
        } else {
          setError(error.message);
        }
      } else {
        setError("Une erreur est survenue lors de la réinitialisation du mot de passe");
      }
      
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    console.log('🔄 [PASSWORD RESET] Fermeture de la boîte de dialogue');
    onOpenChange(false);
    // Reset state when dialog closes
    setStep('email');
    setVerificationCode('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    console.log('🔄 [PASSWORD RESET] État de la boîte de dialogue réinitialisé');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center mb-2">
            {step === 'email' && "Mot de passe oublié"}
            {step === 'code' && "Vérification du code"}
            {step === 'password' && "Nouveau mot de passe"}
            {step === 'success' && "Réinitialisation réussie"}
          </DialogTitle>
        </DialogHeader>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center mb-4">
            <AlertCircle size={16} className="mr-2 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        {step === 'email' ? (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="reset-email" className="text-sm font-medium">Email</label>
              <Input 
                id="reset-email" 
                placeholder="Votre adresse email" 
                type="text" 
                value={resetEmail}
                onChange={(e) => {
                  console.log('🔄 [PASSWORD RESET] Mise à jour de l\'email:', e.target.value);
                  setResetEmail(e.target.value);
                }}
                disabled={isLoading}
              />
              <p className="text-sm text-gray-500">
                Nous vous enverrons un code pour réinitialiser votre mot de passe.
              </p>
            </div>
            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                disabled={isLoading}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader size={16} className="animate-spin mr-2" />
                    Envoi en cours...
                  </>
                ) : (
                  "Envoyer"
                )}
              </Button>
            </div>
          </form>
        ) : step === 'code' ? (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="verification-code" className="text-sm font-medium">Code de vérification</label>
              <Input 
                id="verification-code" 
                placeholder="Entrez le code reçu par email" 
                value={verificationCode}
                onChange={(e) => {
                  console.log('🔄 [PASSWORD RESET] Mise à jour du code:', e.target.value);
                  setVerificationCode(e.target.value);
                }}
                disabled={isLoading}
              />
              <p className="text-sm text-gray-500">
                Entrez le code que nous avons envoyé à {resetEmail}
              </p>
            </div>
            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                disabled={isLoading}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader size={16} className="animate-spin mr-2" />
                    Vérification...
                  </>
                ) : (
                  "Continuer"
                )}
              </Button>
            </div>
          </form>
        ) : step === 'password' ? (
          <form onSubmit={handleSetNewPassword} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="new-password" className="text-sm font-medium">Nouveau mot de passe</label>
              <Input 
                id="new-password" 
                type="password"
                placeholder="Votre nouveau mot de passe" 
                value={newPassword}
                onChange={(e) => {
                  console.log('🔄 [PASSWORD RESET] Mise à jour du nouveau mot de passe (longueur):', e.target.value.length);
                  setNewPassword(e.target.value);
                }}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="confirm-password" className="text-sm font-medium">Confirmer le mot de passe</label>
              <Input 
                id="confirm-password" 
                type="password"
                placeholder="Confirmez votre mot de passe" 
                value={confirmPassword}
                onChange={(e) => {
                  console.log('🔄 [PASSWORD RESET] Mise à jour de la confirmation du mot de passe');
                  console.log('🔄 [PASSWORD RESET] Les mots de passe correspondent:', newPassword === e.target.value);
                  setConfirmPassword(e.target.value);
                }}
                disabled={isLoading}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                disabled={isLoading}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader size={16} className="animate-spin mr-2" />
                    Réinitialisation...
                  </>
                ) : (
                  "Réinitialiser"
                )}
              </Button>
            </div>
          </form>
        ) : (
          <div className="py-4 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">Mot de passe réinitialisé avec succès</h3>
            <p className="mt-2 text-sm text-gray-500">
              Vous allez être redirigé vers la page de connexion dans quelques instants.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ForgotPasswordDialog;
