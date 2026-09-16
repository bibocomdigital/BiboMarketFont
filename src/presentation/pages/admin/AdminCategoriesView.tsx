"use client";

import React, { useState } from "react";
import { getUserErrorMessage } from "@domain/errors/app-error";
import { useToast } from "@/hooks/use-toast";
import { useShopCategoriesQuery } from "@/hooks/queries/use-shop-categories-query";
import {
  useCreateProductCategoryMutation,
  useCreateShopCategoryMutation,
  useDeleteProductCategoryMutation,
  useDeleteShopCategoryMutation,
} from "@/hooks/queries/use-admin-query";
import { AdminInput, ConfirmBar, GhostButton, Panel, StateMessage, queryErrorMessage } from "./ui";

export function AdminCategoriesView({ enabled }: { enabled: boolean }) {
  const { toast } = useToast();
  const query = useShopCategoriesQuery(enabled);
  const createShop = useCreateShopCategoryMutation();
  const deleteShop = useDeleteShopCategoryMutation();
  const createProd = useCreateProductCategoryMutation();
  const deleteProd = useDeleteProductCategoryMutation();
  const categories = query.data ?? [];

  const [shopName, setShopName] = useState("");
  const [shopDescription, setShopDescription] = useState("");
  const [prodName, setProdName] = useState("");
  const [prodParent, setProdParent] = useState<number | "">("");
  const [confirmShop, setConfirmShop] = useState<number | null>(null);
  const [confirmProd, setConfirmProd] = useState<number | null>(null);

  const onError = (error: unknown) => {
    toast({
      title: "Action impossible",
      description: getUserErrorMessage(error),
      variant: "destructive",
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel className="p-5">
          <h3 className="font-semibold">Nouvelle catégorie boutique</h3>
          <div className="mt-3 flex flex-col gap-2">
            <AdminInput
              value={shopName}
              placeholder="Nom"
              onChange={(event) => setShopName(event.target.value)}
            />
            <AdminInput
              value={shopDescription}
              placeholder="Description (optionnel)"
              onChange={(event) => setShopDescription(event.target.value)}
            />
            <GhostButton
              onClick={() => {
                if (!shopName.trim()) return;
                createShop.mutate(
                  { name: shopName.trim(), description: shopDescription.trim() || undefined },
                  {
                    onError,
                    onSuccess: () => {
                      setShopName("");
                      setShopDescription("");
                    },
                  }
                );
              }}
            >
              Créer
            </GhostButton>
          </div>
        </Panel>
        <Panel className="p-5">
          <h3 className="font-semibold">Nouvelle catégorie produit</h3>
          <div className="mt-3 flex flex-col gap-2">
            <select
              value={prodParent}
              onChange={(event) => setProdParent(event.target.value ? Number(event.target.value) : "")}
              className="rounded-lg border border-white/10 bg-[#16141f] px-3 py-2 text-sm"
            >
              <option value="">Catégorie boutique parente</option>
              {categories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <AdminInput
              value={prodName}
              placeholder="Nom"
              onChange={(event) => setProdName(event.target.value)}
            />
            <GhostButton
              onClick={() => {
                if (!prodName.trim() || !prodParent) return;
                createProd.mutate(
                  { name: prodName.trim(), categorieShopId: Number(prodParent) },
                  {
                    onError,
                    onSuccess: () => {
                      setProdName("");
                      setProdParent("");
                    },
                  }
                );
              }}
            >
              Créer
            </GhostButton>
          </div>
        </Panel>
      </div>

      {query.isPending && categories.length === 0 ? (
        <Panel>
          <StateMessage>Chargement des catégories…</StateMessage>
        </Panel>
      ) : query.isError && categories.length === 0 ? (
        <Panel>
          <StateMessage>{queryErrorMessage(query.error)}</StateMessage>
        </Panel>
      ) : categories.length === 0 ? (
        <Panel>
          <StateMessage>Aucune catégorie.</StateMessage>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {categories.map((category) => (
            <Panel key={category.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold">{category.name}</h3>
                  {category.description ? (
                    <p className="mt-1 text-sm text-white/45">{category.description}</p>
                  ) : null}
                </div>
                <GhostButton onClick={() => setConfirmShop(category.id)}>Supprimer</GhostButton>
              </div>
              <ul className="mt-4 space-y-2">
                {(category.prodCategories || []).length === 0 ? (
                  <li className="text-sm text-white/40">Aucune sous-catégorie produit.</li>
                ) : (
                  (category.prodCategories || []).map((prod) => (
                    <li
                      key={prod.id}
                      className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-sm"
                    >
                      <span>{prod.name}</span>
                      <GhostButton onClick={() => setConfirmProd(prod.id)}>Supprimer</GhostButton>
                    </li>
                  ))
                )}
              </ul>
            </Panel>
          ))}
        </div>
      )}

      {confirmShop !== null && (
        <ConfirmBar
          title="Supprimer la catégorie boutique"
          message="Les sous-catégories liées peuvent aussi être impactées côté API."
          confirmLabel="Supprimer"
          danger
          onCancel={() => setConfirmShop(null)}
          onConfirm={() => {
            deleteShop.mutate(confirmShop, {
              onError,
              onSettled: () => setConfirmShop(null),
            });
          }}
        />
      )}
      {confirmProd !== null && (
        <ConfirmBar
          title="Supprimer la catégorie produit"
          message="Cette catégorie produit sera retirée."
          confirmLabel="Supprimer"
          danger
          onCancel={() => setConfirmProd(null)}
          onConfirm={() => {
            deleteProd.mutate(confirmProd, {
              onError,
              onSettled: () => setConfirmProd(null),
            });
          }}
        />
      )}
    </div>
  );
}
