"use client";

import React from "react";
import { useProductCategoriesQuery } from "@/hooks/queries/use-products-query";
import { useShopCategoriesQuery } from "@/hooks/queries/use-shop-categories-query";
import { Panel, StateMessage } from "./ui";

export function ClientCategoriesView({
  onOpenProducts,
  onOpenBoutiques,
}: {
  onOpenProducts: (categoryId?: number) => void;
  onOpenBoutiques: (categoryId?: number) => void;
}) {
  const products = useProductCategoriesQuery();
  const shops = useShopCategoriesQuery();
  const productItems = products.data ?? [];
  const shopItems = shops.data ?? [];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Panel className="p-5">
        <h2 className="text-lg font-semibold">Catégories produits</h2>
        <p className="mt-1 text-sm text-slate-500">Filtrez le catalogue par type de produit.</p>
        {products.isPending && productItems.length === 0 ? (
          <StateMessage>Chargement…</StateMessage>
        ) : productItems.length === 0 ? (
          <StateMessage>Aucune catégorie produit.</StateMessage>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {productItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onOpenProducts(item.id)}
                className="rounded-2xl bg-slate-50 px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-bibocom-accent/10 hover:text-bibocom-accent"
              >
                {item.name}
              </button>
            ))}
          </div>
        )}
      </Panel>
      <Panel className="p-5">
        <h2 className="text-lg font-semibold">Catégories boutiques</h2>
        <p className="mt-1 text-sm text-slate-500">Explorez les boutiques par activité.</p>
        {shops.isPending && shopItems.length === 0 ? (
          <StateMessage>Chargement…</StateMessage>
        ) : shopItems.length === 0 ? (
          <StateMessage>Aucune catégorie boutique.</StateMessage>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {shopItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onOpenBoutiques(item.id)}
                className="rounded-2xl bg-slate-50 px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-bibocom-accent/10 hover:text-bibocom-accent"
              >
                {item.name}
              </button>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
