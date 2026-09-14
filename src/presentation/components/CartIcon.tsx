"use client";

import React, { useEffect } from 'react';
import { ShoppingCart } from 'lucide-react';
import { getCartItemsCount, useCartQuery } from '@/hooks/queries/use-cart-query';

interface CartIconProps {
  className?: string;
  onClick?: () => void;
}

const CartIcon: React.FC<CartIconProps> = ({ className, onClick }) => {
  const { data: cart, isPending, isError, refetch } = useCartQuery();
  const itemsCount = getCartItemsCount(cart?.items);
  const loading = isPending && !cart;
  const error = isError && !cart;

  useEffect(() => {
    const handleCartUpdate = () => {
      void refetch();
    };
    window.addEventListener('cart-updated', handleCartUpdate);
    return () => {
      window.removeEventListener('cart-updated', handleCartUpdate);
    };
  }, [refetch]);

  return (
    <div className={`relative ${className || ''}`}>
      <button 
        className="relative p-1.5 rounded-full hover:bg-gray-100 transition-colors"
        onClick={onClick}
        aria-label="Panier"
      >
        <ShoppingCart size={20} className="text-gray-600" />
        {!loading && !error && itemsCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
            {itemsCount > 99 ? '99+' : itemsCount}
          </span>
        )}
      </button>
    </div>
  );
};

export default CartIcon;