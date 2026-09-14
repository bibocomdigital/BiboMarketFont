"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Link, useLocation } from "react-router-dom";
import { Headphones, ShieldCheck, Truck } from "lucide-react";
import RegisterForm from "@/components/forms/RegisterForm";
import { AuthBrand } from "@/components/auth/AuthBrand";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { UserRole } from "@/types/user";

const features = [
  {
    icon: ShieldCheck,
    title: "Produits de qualité",
    text: "Des articles vérifiés et fiables",
  },
  {
    icon: Truck,
    title: "Livraison rapide",
    text: "Recevez vos commandes en toute sécurité",
  },
  {
    icon: Headphones,
    title: "Support 24/7",
    text: "Une équipe toujours à votre écoute",
  },
];

const Register = () => {
  const location = useLocation();
  const [role, setRole] = useState<UserRole>(UserRole.CLIENT);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const roleParam = params.get("role");

    if (roleParam) {
      if (roleParam.toLowerCase() === "commercant" || roleParam.toLowerCase() === "merchant") {
        setRole(UserRole.MERCHANT);
      } else if (roleParam.toLowerCase() === "fournisseur" || roleParam.toLowerCase() === "supplier") {
        setRole(UserRole.SUPPLIER);
      } else if (roleParam.toLowerCase() === "client") {
        setRole(UserRole.CLIENT);
      }
    }
  }, [location]);

  return (
    <AuthSplitLayout
      contentClassName="max-w-[480px]"
      left={
        <div className="flex w-full flex-col px-10 xl:px-16 py-10">
          <AuthBrand light />

          <div className="flex flex-1 items-center gap-6">
            <div className="max-w-md animate-login-slide-up">
              <h1 className="auth-hero-title text-white">
                Rejoignez
                <span className="block">BibocomMarket</span>
              </h1>

              <p className="mt-6 max-w-sm text-base leading-relaxed text-white/75 xl:text-lg">
                Inscrivez-vous et découvrez une nouvelle façon d&apos;acheter,
                vendre ou fournir des produits.
              </p>

              <ul className="mt-10 space-y-5">
                {features.map((feature) => (
                  <li key={feature.title} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white">
                      <feature.icon size={18} />
                    </span>
                    <div>
                      <p className="font-semibold text-white">{feature.title}</p>
                      <p className="text-sm text-white/70">{feature.text}</p>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-10 max-w-sm rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-sm italic text-white/85">
                  “BibocomMarket m&apos;a permis de trouver exactement ce dont
                  j&apos;avais besoin. Service rapide et fiable !”
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-xs font-semibold text-white">
                    MT
                  </span>
                  <div>
                    <p className="text-sm font-medium text-white">Mamadou T.</p>
                    <p className="text-xs text-white/60">Client satisfait</p>
                  </div>
                  <span className="ml-auto text-sm text-amber-300">★★★★★</span>
                </div>
              </div>
            </div>

            <div className="relative flex min-h-[480px] flex-1 items-center justify-center animate-login-slide-up [animation-delay:160ms]">
              <Image
                src="/images/telephone.png"
                alt="Application BibocomMarket sur smartphone"
                width={520}
                height={640}
                priority
                className="h-auto w-[min(100%,400px)] select-none drop-shadow-2xl animate-login-float"
              />
            </div>
          </div>
        </div>
      }
    >
      <div className="w-full">
        <div className="mb-8">
          <AuthBrand />
          <h2 className="auth-form-title mt-6 text-bibocom-primary">Inscription</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            Créez votre compte et commencez dès maintenant
          </p>
        </div>

        <RegisterForm initialRole={role} />

        <p className="pt-5 text-sm text-slate-500">
          Déjà un compte ?{" "}
          <Link
            to="/login"
            className="font-medium text-bibocom-primary transition-colors duration-300 hover:text-bibocom-accent"
          >
            Se connecter
          </Link>
        </p>
      </div>
    </AuthSplitLayout>
  );
};

export default Register;
