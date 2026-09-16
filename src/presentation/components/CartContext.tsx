"use client";

import React, { createContext, useContext } from "react";
import { getCartItemsCount, useCartQuery } from "@/hooks/queries/use-cart-query";
import { useAuthSession } from "@/hooks/use-auth-session";

type CartContextType = {
  itemsCount: number;
  refreshCart: () => Promise<void>;
};

const CartContext = createContext<CartContextType>({
  itemsCount: 0,
  refreshCart: async () => {},
});

export const useCart = () => useContext(CartContext);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuthSession();
  const { data: cart, refetch } = useCartQuery();
  const itemsCount = getCartItemsCount(cart?.items);
  const canRefresh =
    isAuthenticated && String(user?.role || "").toUpperCase() === "CLIENT";

  const refreshCart = async () => {
    if (!canRefresh) return;
    await refetch();
  };

  return (
    <CartContext.Provider value={{ itemsCount, refreshCart }}>
      {children}
    </CartContext.Provider>
  );
};
