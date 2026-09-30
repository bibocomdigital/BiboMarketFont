"use client";

import { useEffect, useRef } from "react";
import { useAddToCartMutation } from "@/hooks/mutations/use-cart-mutations";
import { useAuthSession } from "@/hooks/use-auth-session";
import { useToast } from "@/hooks/use-toast";
import { getUserErrorMessage } from "@domain/errors/app-error";
import { clearPendingCart, readPendingCart } from "@/presentation/lib/pending-cart";
import { flyToCart } from "@/presentation/lib/fly-to-cart";

/** Ajoute le produit mémorisé dès qu'une session existe. */
export function PendingCartSync() {
  const { isAuthenticated, isReady, user } = useAuthSession();
  const addToCart = useAddToCartMutation();
  const { toast } = useToast();
  const tried = useRef("");

  useEffect(() => {
    if (!isReady || !isAuthenticated) return;
    const pending = readPendingCart();
    if (!pending) return;
    const stamp = `${pending.productId}:${user?.phoneVerified ? "1" : "0"}`;
    if (tried.current === stamp) return;
    tried.current = stamp;
    addToCart
      .mutateAsync({ productId: pending.productId, quantity: pending.quantity })
      .then(() => {
        clearPendingCart();
        flyToCart();
        toast({ title: "Ajouté au panier", description: pending.name });
      })
      .catch((error) => {
        toast({
          title: "Ajout impossible",
          description: getUserErrorMessage(error),
          variant: "destructive",
        });
      });
  }, [addToCart, isAuthenticated, isReady, toast, user?.phoneVerified]);

  return null;
}
