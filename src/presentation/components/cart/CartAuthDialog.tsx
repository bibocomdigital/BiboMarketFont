"use client";

import { useId } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { rememberPendingCart } from "@/presentation/lib/pending-cart";

export function CartAuthDialog({
  productId,
  productName,
  onClose,
}: {
  productId: number;
  productName: string;
  onClose: () => void;
}) {
  const titleId = useId();
  const navigate = useNavigate();

  const go = (path: string) => {
    rememberPendingCart({ productId, quantity: 1, name: productName });
    navigate(path);
  };

  return (
    <div className="fixed inset-0 z-[95] flex items-end justify-center p-4 sm:items-center">
      <button type="button" className="absolute inset-0 bg-bibocom-primary/45" aria-label="Fermer" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="relative w-full max-w-md rounded-[22px] bg-white p-5 shadow-2xl">
        <button type="button" onClick={onClose} className="absolute right-3 top-3 rounded-full p-1.5 text-slate-400 hover:bg-slate-100" aria-label="Fermer">
          <X className="h-4 w-4" />
        </button>
        <h2 id={titleId} className="pr-8 text-lg font-semibold text-bibocom-primary">Connexion requise</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Pour ajouter <span className="font-medium text-bibocom-primary">{productName}</span> au panier, connectez-vous ou créez un compte. Le produit sera ajouté dès l’ouverture du compte.
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => go("/register?role=client")}
            className="rounded-full border border-slate-200 px-4 py-2.5 text-sm font-semibold text-bibocom-primary"
          >
            Créer un compte
          </button>
          <button
            type="button"
            onClick={() => go("/login")}
            className="rounded-full bg-bibocom-accent px-4 py-2.5 text-sm font-semibold text-white"
          >
            Se connecter
          </button>
        </div>
      </div>
    </div>
  );
}
