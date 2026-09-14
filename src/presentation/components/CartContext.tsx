"use client";

import React, { createContext, useContext } from 'react';
import { getCartItemsCount, useCartQuery } from '@/hooks/queries/use-cart-query';

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
  const { data: cart, refetch } = useCartQuery();
  const itemsCount = getCartItemsCount(cart?.items);

  const refreshCart = async () => {
    await refetch();
  };

  return (
    <CartContext.Provider value={{ itemsCount, refreshCart }}>
      {children}
    </CartContext.Provider>
  );
};