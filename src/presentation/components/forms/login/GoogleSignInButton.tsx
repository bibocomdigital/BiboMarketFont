"use client";

import React from "react";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useGoogleLoginMutation } from "@/presentation/hooks/mutations/use-auth-mutations";
import { dashboardPathFor } from "@/hooks/use-auth-session";

interface GoogleSignInButtonProps {
  className?: string;
  onClose?: () => void;
}

const GoogleSignInButton = ({ className, onClose }: GoogleSignInButtonProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const googleLogin = useGoogleLoginMutation();
  const isLoading = googleLogin.isPending;

  const handleSuccess = async (credentialResponse: CredentialResponse) => {
    const idToken = credentialResponse.credential;
    if (!idToken) {
      toast({
        title: "Connexion impossible",
        description: "Google n'a pas renvoyé de jeton. Réessayez.",
        variant: "destructive",
      });
      return;
    }

    try {
      onClose?.();
      const session = await googleLogin.mutateAsync(idToken);
      const destination = session.needsCompletion
        ? `/complete-profile?token=${session.token}`
        : dashboardPathFor(session.user.role);
      navigate(destination);
    } catch (error) {
      toast({
        title: "Connexion Google impossible",
        description:
          error instanceof Error
            ? error.message
            : "L'authentification Google a échoué. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className={`relative w-full ${className ?? ""}`}>
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/80">
          <Loader2 className="h-5 w-5 animate-spin text-slate-600" />
        </div>
      )}
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => {
          toast({
            title: "Connexion annulée",
            description: "La fenêtre Google a été fermée ou a échoué.",
            variant: "destructive",
          });
        }}
        useOneTap={false}
        text="continue_with"
        locale="fr"
        width="100%"
      />
    </div>
  );
};

export default GoogleSignInButton;
