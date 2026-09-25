"use client";


import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader, AlertCircle, Check } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { useForgotPasswordMutation, useResetPasswordMutation } from '@/hooks/mutations/use-auth-mutations';
import { getUserErrorMessage } from '@domain/errors/app-error';
import PhoneInput from '../register/PhoneInput';

interface ForgotPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resetIdentifier: string;
  setResetIdentifier: (identifier: string) => void;
}

const RESEND_COOLDOWN_SECONDS = 60;

const isPhoneValue = (value: string) =>
  /^\+?[0-9]{9,15}$/.test(value.replace(/\s/g, ""));

const identifierSchema = z.string().refine(isPhoneValue, {
  message: "Veuillez saisir un téléphone valide (ex : +221771234567)",
});
const codeSchema = z
  .string()
  .regex(/^\d{6}$/, "Le code doit contenir exactement 6 chiffres");
const passwordSchema = z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères");

const ForgotPasswordDialog = ({ open, onOpenChange, resetIdentifier, setResetIdentifier }: ForgotPasswordDialogProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState<'email' | 'code' | 'password' | 'success'>('email');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [testCode, setTestCode] = useState<string | null>(null);
  const [resendCountdown, setResendCountdown] = useState(0);
  const forgotMutation = useForgotPasswordMutation();
  const resetMutation = useResetPasswordMutation();
  const isLoading = forgotMutation.isPending || resetMutation.isPending;
  const [error, setError] = useState<string | null>(null);
  const phoneForm = useForm<{ phoneNumber: string }>({
    defaultValues: { phoneNumber: resetIdentifier || "+221" },
  });

  useEffect(() => {
    if (!open) return;
    const next = resetIdentifier || "+221";
    phoneForm.setValue("phoneNumber", next);
  }, [open, resetIdentifier, phoneForm]);

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setTimeout(() => {
      setResendCountdown((current) => current - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  const phoneNumber = () => phoneForm.getValues("phoneNumber").replace(/\s/g, "");

  const buildResetPayload = () => ({
    phoneNumber: phoneNumber(),
  });

  const handleResetPassword = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (forgotMutation.isPending) return;
    setError(null);

    const phone = phoneNumber();
    setResetIdentifier(phone);
    const validationResult = identifierSchema.safeParse(phone);
    if (!validationResult.success) {
      setError("Veuillez saisir un téléphone valide");
      return;
    }

    const payload = buildResetPayload();

    try {
      const data = await forgotMutation.mutateAsync(payload);

      if (data.status === "partial_success" && data.testResetCode) {
        setTestCode(data.testResetCode);
      } else {
        setTestCode(null);
      }
      setResendCountdown(RESEND_COOLDOWN_SECONDS);
      toast({
        title: "Code envoyé",
        description: "Si un compte existe avec cet identifiant, vous recevrez un code de réinitialisation.",
      });

      setStep('code');
    } catch (error) {
      const message = getUserErrorMessage(error);
      setError(message);
      toast({
        title: "Erreur",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationResult = codeSchema.safeParse(verificationCode);
    if (!validationResult.success) {
      setError("Le code de vérification doit contenir exactement 6 chiffres");
      return;
    }

    setStep('password');
  };

  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationResult = passwordSchema.safeParse(newPassword);
    if (!validationResult.success) {
      setError("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    try {
      await resetMutation.mutateAsync({
        phone: phoneNumber(),
        code: verificationCode,
        newPassword,
      });

      toast({
        title: "Mot de passe réinitialisé",
        description: "Votre mot de passe a été modifié avec succès.",
      });

      setStep('success');

      setTimeout(() => {
        handleClose();
        navigate('/login');
      }, 2000);
    } catch (error) {
      const message = getUserErrorMessage(error);

      if (message.includes("incorrect")) {
        setError("Code de vérification incorrect. Veuillez vérifier et réessayer.");
        setStep('code');
        setVerificationCode('');
      } else if (message.includes("expiré")) {
        setError("Le code de réinitialisation a expiré. Veuillez demander un nouveau code.");
        setStep('email');
        setVerificationCode('');
      } else {
        setError(message);
      }

      toast({
        title: "Erreur",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setStep('email');
    setVerificationCode('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    setTestCode(null);
    setResendCountdown(0);
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
              <label htmlFor="reset-identifier" className="text-sm font-medium">
                Téléphone
              </label>
              <PhoneInput
                form={phoneForm}
                field={{
                  name: "phoneNumber",
                  value: phoneForm.watch("phoneNumber"),
                  onChange: (value: string) => {
                    phoneForm.setValue("phoneNumber", value);
                    setResetIdentifier(value);
                  },
                }}
              />
              <p className="text-sm text-gray-500">
                Nous vous enverrons un code par SMS pour réinitialiser votre mot de passe.
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
              <label htmlFor="verification-code" className="text-sm font-medium">
                Code de vérification
              </label>
              <Input
                id="verification-code"
                placeholder="Le code à 6 chiffres"
                inputMode="numeric"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => {
                  setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                }}
                disabled={isLoading}
              />
              <p className="text-sm text-gray-500">
                Entrez le code que nous avons envoyé à {resetIdentifier}
              </p>
              {testCode && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2 rounded-md text-sm">
                  Environnement de test : utilisez le code <strong>{testCode}</strong>
                </div>
              )}
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
            <div className="flex justify-center">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleResetPassword()}
                disabled={resendCountdown > 0 || forgotMutation.isPending}
              >
                {resendCountdown > 0
                  ? `Renvoyer le code (${resendCountdown}s)`
                  : "Renvoyer le code"}
              </Button>
            </div>
          </form>
        ) : step === 'password' ? (
          <form onSubmit={handleSetNewPassword} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="new-password" className="text-sm font-medium">
                Nouveau mot de passe
              </label>
              <Input
                id="new-password"
                type="password"
                placeholder="Votre nouveau mot de passe"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="confirm-password" className="text-sm font-medium">
                Confirmer le mot de passe
              </label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Confirmez votre mot de passe"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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