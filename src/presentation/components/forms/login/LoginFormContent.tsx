"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import EmailInput from "./EmailInput";
import PasswordInput from "./PasswordInput";
import ForgotPasswordDialog from "./ForgotPasswordDialog";
import SocialLoginButton from "./SocialLoginButton";
import { Link, useNavigate } from "react-router-dom";
import { useLoginMutation } from "@/hooks/mutations/use-auth-mutations";
import { getUserErrorMessage } from "@domain/errors/app-error";
import { appAlert } from "@/presentation/lib/swal";
import { ArrowRight } from "lucide-react";
import PhoneInput from "../register/PhoneInput";
import { cn } from "@/lib/utils";

type LoginFormContentProps = {
  initialEmail?: string;
  onClose?: () => void;
};

// Schéma de validation pour email ou téléphone
const LoginFormSchema = z.object({
  login: z.string().min(1, "L'email ou le téléphone est requis"),
  password: z.string().min(1, "Le mot de passe est requis"),
  rememberMe: z.boolean().default(true),
});

const LoginFormContent: React.FC<LoginFormContentProps> = ({
  initialEmail = "",
  onClose,
}) => {
  const loginMutation = useLoginMutation();
  const isSubmitting = loginMutation.isPending;
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginType, setLoginType] = useState<"email" | "phone">("phone");
  const navigate = useNavigate();

  const form = useForm<z.infer<typeof LoginFormSchema>>({
    resolver: zodResolver(LoginFormSchema),
    defaultValues: {
      login: initialEmail,
      password: "",
      rememberMe: true,
    },
  });

  useEffect(() => {
    if (initialEmail) {
      form.setValue("login", initialEmail);
      // Déterminer le type en fonction de l'input initial
      const isPhone = /^[\+]?[1-9][\d]{0,15}$/.test(
        initialEmail.replace(/\D/g, "")
      );
      setLoginType(isPhone ? "phone" : "email");
    }
  }, [initialEmail, form]);

  // Effacer l'erreur quand l'utilisateur commence à retaper
  useEffect(() => {
    const subscription = form.watch(() => {
      if (loginError) {
        setLoginError(null);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, loginError]);

  const toggleLoginType = () => {
    setLoginType(loginType === "email" ? "phone" : "email");
    form.setValue("login", ""); // Réinitialiser la valeur quand on change le type
  };

  const onSubmit = async (values: z.infer<typeof LoginFormSchema>) => {
    try {
      // Préparer les données selon le format attendu par le backend
      const loginData = {
        password: values.password,
        email: "",
        phoneNumber: "",
      };

      // Ajouter email OU phoneNumber selon le type de connexion
      if (loginType === "email") {
        loginData.email = values.login;
        loginData.phoneNumber = undefined;
      } else {
        loginData.phoneNumber = values.login; // Déjà formaté avec le code pays par PhoneInput
        loginData.email = undefined;
      }

      console.log("📤 [LOGIN] Données envoyées:", loginData);

      const response = await loginMutation.mutateAsync(loginData);
      const userRole = response.user.role.toUpperCase();

      if (userRole === "MERCHANT" || userRole === "COMMERCANT") {
        console.log(
          "🔄 [LOGIN] Redirection vers le tableau de bord commerçant"
        );
        navigate("/merchant-dashboard");
      } else if (userRole === "SUPPLIER" || userRole === "FOURNISSEUR") {
        console.log(
          "🔄 [LOGIN] Redirection vers le tableau de bord fournisseur"
        );
        navigate("/supplier-dashboard");
      } else {
        console.log("🔄 [LOGIN] Redirection vers le tableau de bord client");
        navigate("/client-dashboard");
      }

      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error("❌ [LOGIN] Erreur de connexion:", error);

      const errorMessage = getUserErrorMessage(error);
      const isCredentialError =
        /mot de passe|identifiant|email|téléphone|telephone|incorrect|invalide|n'existe|introuvable|unauthorized|401/i.test(
          errorMessage
        );

      if (isCredentialError) {
        setLoginError(errorMessage);
      } else {
        await appAlert.error("Connexion impossible", errorMessage);
      }
    }
  };

  const fieldClassName =
    "h-12 rounded-xl border-slate-200 bg-white shadow-none transition-all duration-300 focus-visible:ring-bibocom-primary/20 focus-visible:border-bibocom-primary";

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="login"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[13px] font-medium tracking-wide text-slate-600">
                {loginType === "email" ? "Email" : "Téléphone"}
              </FormLabel>
              <FormControl>
                {loginType === "phone" ? (
                  <PhoneInput form={form} field={field} />
                ) : (
                  <EmailInput {...field} className={fieldClassName} />
                )}
              </FormControl>
              <button
                type="button"
                onClick={toggleLoginType}
                className="text-xs font-medium text-slate-400 hover:text-bibocom-primary transition-colors duration-300"
              >
                {loginType === "email"
                  ? "Utiliser le téléphone"
                  : "Utiliser l'email"}
              </button>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[13px] font-medium tracking-wide text-slate-600">
                Mot de passe
              </FormLabel>
              <FormControl>
                <PasswordInput {...field} className={fieldClassName} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {loginError && (
          <p className="text-sm text-red-600">{loginError}</p>
        )}

        <div className="flex items-center justify-between">
          <FormField
            control={form.control}
            name="rememberMe"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-2 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="rounded border-slate-300 data-[state=checked]:bg-bibocom-primary"
                  />
                </FormControl>
                <FormLabel className="text-sm font-normal text-slate-600">
                  Se souvenir de moi
                </FormLabel>
              </FormItem>
            )}
          />
          <button
            type="button"
            className="text-sm text-slate-500 hover:text-bibocom-primary transition-colors duration-300"
            onClick={() => {
              const currentLogin = form.getValues().login;
              if (currentLogin.includes("@")) {
                setResetEmail(currentLogin);
              } else {
                setResetEmail("");
              }
              setShowForgotPassword(true);
            }}
          >
            Mot de passe oublié ?
          </button>
        </div>

        <Button
          type="submit"
          className={cn(
            "h-12 w-full rounded-xl bg-bibocom-primary text-white shadow-sm",
            "transition-all duration-300 hover:bg-[#081c30] hover:shadow-md hover:scale-[1.01]"
          )}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Connexion en cours..." : "Se connecter"}
          {!isSubmitting && <ArrowRight className="h-4 w-4" />}
        </Button>

        <div className="relative py-1">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-3 text-slate-400">
              Ou continuer avec
            </span>
          </div>
        </div>

        <SocialLoginButton
          provider="google"
          className="h-12 rounded-xl border-slate-200 text-slate-700 transition-all duration-300 hover:bg-slate-50 hover:border-slate-300"
        />

        {!onClose && (
          <p className="pt-2 text-sm text-slate-500">
            Pas encore de compte ?{" "}
            <Link
              to="/register"
              className="font-medium text-bibocom-primary transition-colors duration-300 hover:text-bibocom-accent"
            >
              S&apos;inscrire
            </Link>
          </p>
        )}
      </form>
      <ForgotPasswordDialog
        open={showForgotPassword}
        onOpenChange={setShowForgotPassword}
        resetEmail={resetEmail}
        setResetEmail={setResetEmail}
      />
    </Form>
  );
};
export default LoginFormContent;
