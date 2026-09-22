"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import { useLocation } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import LoginFormContent from "@/components/forms/login/LoginFormContent";
import { BackButton } from "@/components/auth/BackButton";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const location = useLocation();
  const { toast } = useToast();
  const locationState = location.state as {
    verificationSuccessful?: boolean;
    email?: string;
  } | null;
  const verificationSuccessful = locationState?.verificationSuccessful || false;
  const verifiedEmail = locationState?.email || "";

  useEffect(() => {
    if (verificationSuccessful) {
      toast({
        title: "Inscription réussie",
        description:
          "Votre compte a été vérifié avec succès. Vous pouvez maintenant vous connecter.",
      });
    }
  }, [verificationSuccessful, toast]);

  return (
    <AuthSplitLayout
      left={
        <div className="flex w-full items-center gap-6 px-10 xl:px-16 py-12">
          <div className="max-w-md animate-login-slide-up">
            <h1 className="auth-hero-title text-white">
              Bienvenue sur
              <span className="block">BibocomMarket</span>
            </h1>

            <p className="mt-6 max-w-sm text-base leading-relaxed text-white/75 xl:text-lg">
              La première marketplace qui réunit commerçants, clients et
              fournisseurs dans un écosystème complet.
            </p>

            <blockquote className="mt-10 border-l-2 border-white/25 pl-4 text-white/80 italic">
              “Une plateforme simple et efficace pour tous vos achats.”
              <footer className="mt-2 not-italic text-sm text-white/55">
                — Notre communauté
              </footer>
            </blockquote>
          </div>

          <div className="relative flex min-h-[520px] flex-1 items-center justify-center animate-login-slide-up [animation-delay:160ms]">
            <Image
              src="/images/telephone.png"
              alt="Application BibocomMarket sur smartphone"
              width={520}
              height={640}
              priority
              className="h-auto w-[min(100%,420px)] select-none drop-shadow-2xl animate-login-float"
            />
          </div>
        </div>
      }
    >
      <div className="w-full">
        <div className="mb-8">
          <BackButton />
          <h2 className="auth-form-title text-bibocom-primary">Connexion</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            Accédez à votre compte BibocomMarket
          </p>
        </div>

        {verificationSuccessful && (
          <div className="mb-6 flex items-start rounded-2xl border border-green-200 bg-green-50 p-4">
            <CheckCircle
              className="mr-3 mt-0.5 shrink-0 text-green-500"
              size={20}
            />
            <div>
              <h3 className="font-medium text-green-800">Inscription réussie</h3>
              <p className="mt-1 text-sm text-green-700">
                Votre compte a été vérifié avec succès. Vous pouvez maintenant
                vous connecter
                {verifiedEmail ? ` avec ${verifiedEmail}` : ""}.
              </p>
            </div>
          </div>
        )}

        <LoginFormContent initialEmail={verifiedEmail} />
      </div>
    </AuthSplitLayout>
  );
};

export default Login;
