"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import GoogleSignInButton from "./GoogleSignInButton";

interface SocialLoginButtonProps {
  provider?: "google" | "facebook";
  className?: string;
  onClose?: () => void;
}

const SocialLoginButton = ({
  provider = "google",
  className,
  onClose,
}: SocialLoginButtonProps) => {
  const { toast } = useToast();

  if (provider === "google") {
    return <GoogleSignInButton className={className} onClose={onClose} />;
  }

  return (
    <Button
      type="button"
      variant="outline"
      className={`flex w-full items-center font-medium ${className}`}
      onClick={() => {
        toast({
          title: "Fonctionnalité non disponible",
          description: "La connexion avec Facebook n'est pas encore disponible.",
          variant: "destructive",
        });
      }}
    >
      Continuer avec Facebook
    </Button>
  );
};

export default SocialLoginButton;
