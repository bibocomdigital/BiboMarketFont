"use client";

import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuthSession, dashboardPathFor } from "@/hooks/use-auth-session";
import {
  useSendPhoneVerificationCodeMutation,
  useVerifyPhoneMutation,
} from "@/hooks/mutations/use-auth-mutations";
import { getUserErrorMessage } from "@domain/errors/app-error";
import { UserRole } from "@/types/user";

function maskPhone(phone?: string): string {
  if (!phone) return "votre numéro";
  const digits = phone.replace(/[^0-9]/g, "");
  if (digits.length < 7) return phone;
  const head = digits.slice(0, 3);
  const tail = digits.slice(-2);
  return `+${head}…${tail}`;
}

const VerifyPhone = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated, isReady } = useAuthSession();
  const sendCodeMutation = useSendPhoneVerificationCodeMutation();
  const verifyMutation = useVerifyPhoneMutation();
  const [code, setCode] = useState("");
  const [resendIn, setResendIn] = useState(0);
  const [testCode, setTestCode] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const redirectToDashboard = () => {
    navigate(dashboardPathFor(user?.role), { replace: true });
  };

  useEffect(() => {
    if (!isReady) return;
    if (!isAuthenticated) {
      navigate("/login", { replace: true });
      return;
    }
    if (user?.role === UserRole.ADMIN || user?.googleId || user?.phoneVerified) {
      redirectToDashboard();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, isAuthenticated, user, navigate]);

  useEffect(() => {
    if (resendIn <= 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    intervalRef.current = setInterval(() => {
      setResendIn((seconds) => Math.max(0, seconds - 1));
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [resendIn]);

  const handleSendCode = async () => {
    try {
      const result = await sendCodeMutation.mutateAsync();
      toast({
        title: "Code envoyé",
        description: "Un SMS avec votre code de vérification vient d'être envoyé.",
      });
      if (result.testCode) {
        setTestCode(result.testCode);
      }
      setResendIn(60);
    } catch (error) {
      const message = getUserErrorMessage(error);
      if (message.toLowerCase().includes("déjà vérifié")) {
        redirectToDashboard();
        return;
      }
      toast({
        title: "Envoi impossible",
        description: message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (!isReady || !isAuthenticated || !user || user.googleId || user.phoneVerified) return;
    sendCodeMutation.mutate(undefined, {
      onSuccess: (result) => {
        toast({
          title: "Code envoyé",
          description: "Un SMS avec votre code de vérification vient d'être envoyé.",
        });
        if (result.testCode) setTestCode(result.testCode);
        setResendIn(60);
      },
      onError: (error) => {
        const message = getUserErrorMessage(error);
        if (message.toLowerCase().includes("déjà vérifié")) {
          redirectToDashboard();
          return;
        }
        toast({
          title: "Envoi impossible",
          description: message,
          variant: "destructive",
        });
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, isAuthenticated, user]);

  const handleVerify = async (value: string) => {
    setCode(value);
    if (value.length !== 6) return;

    try {
      await verifyMutation.mutateAsync(value);
      toast({
        title: "Numéro vérifié",
        description: "Votre numéro de téléphone a été vérifié avec succès.",
      });
      redirectToDashboard();
    } catch (error) {
      setCode("");
      toast({
        title: "Vérification impossible",
        description: getUserErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-bibocom-light to-white pt-24 pb-10 px-4 sm:px-6">
      <div className="max-w-md mx-auto">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="mb-4 inline-flex items-center gap-1 rounded-full bg-bibocom-accent/10 px-3 py-1.5 text-sm font-medium text-bibocom-accent transition-colors hover:bg-bibocom-accent/20"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à l&apos;accueil
        </button>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-bibocom-primary/10 text-bibocom-primary">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h1 className="text-center text-2xl font-bold">Vérifiez votre numéro</h1>
          <p className="mt-2 text-center text-sm text-gray-500">
            Un code à 6 chiffres a été envoyé par SMS au numéro{" "}
            <span className="font-semibold text-gray-700">{maskPhone(user?.phoneNumber)}</span>.
          </p>

          {testCode && (
            <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-center text-sm text-amber-700">
              [Environnement de test] Code de démonstration :{" "}
              <span className="font-mono font-semibold">{testCode}</span>
            </p>
          )}

          <div className="mt-6 flex justify-center">
            <InputOTP
              maxLength={6}
              value={code}
              onChange={handleVerify}
              disabled={verifyMutation.isPending}
            >
              <InputOTPGroup>
                {Array.from({ length: 6 }).map((_, index) => (
                  <InputOTPSlot key={index} index={index} />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>

          <Button
            type="button"
            className="mt-6 w-full gap-2"
            onClick={() => {
              if (code.length !== 6) {
                toast({
                  title: "Code incomplet",
                  description: "Veuillez saisir les 6 chiffres reçus par SMS.",
                  variant: "destructive",
                });
                return;
              }
              void handleVerify(code);
            }}
            disabled={verifyMutation.isPending || sendCodeMutation.isPending}
          >
            {verifyMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Vérification...
              </>
            ) : (
              "Vérifier mon numéro"
            )}
          </Button>

          <div className="mt-4 flex items-center justify-center gap-2 text-sm">
            {resendIn > 0 ? (
              <span className="text-gray-400">
                Renvoyer le code dans {resendIn} s
              </span>
            ) : (
              <button
                type="button"
                onClick={() => void handleSendCode()}
                disabled={sendCodeMutation.isPending}
                className="inline-flex items-center gap-1 font-medium text-bibocom-primary hover:underline"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Renvoyer le code
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyPhone;