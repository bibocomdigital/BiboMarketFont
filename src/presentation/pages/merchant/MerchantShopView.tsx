"use client";

import React, { useState } from "react";
import { MapPin, Phone, Store } from "lucide-react";
import type { ShopWithProducts } from "@/services/shopService";
import { formatImageUrl } from "@/services/shopService";
import NoShop from "@/components/shop/NoShop";
import EditShopDialog from "@/components/shop/EditShopDialog";
import { formatDateFr } from "@/lib/admin-analytics";
import { AccentButton, Panel, StateMessage, StatusPill } from "./ui";

export function MerchantShopView({
  shop,
  loading,
  onShopChanged,
}: {
  shop?: ShopWithProducts | null;
  loading: boolean;
  onShopChanged: () => void;
}) {
  const [showEdit, setShowEdit] = useState(false);

  if (loading && !shop) {
    return <StateMessage>Chargement de la boutique…</StateMessage>;
  }

  if (!shop) {
    return <NoShop onShopCreated={onShopChanged} />;
  }

  return (
    <div className="space-y-4">
      <Panel className="p-5">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            {shop.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={formatImageUrl(shop.logo) || shop.logo}
                alt=""
                className="h-16 w-16 rounded-2xl object-cover ring-1 ring-slate-100"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-bibocom-light">
                <Store className="h-7 w-7 text-bibocom-primary" />
              </div>
            )}
            <div>
              <h2 className="text-xl font-semibold">{shop.name}</h2>
              <p className="mt-1 max-w-2xl text-sm text-slate-500">
                {shop.description || "Aucune description renseignée."}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <StatusPill active={shop.status !== false} yes="Active" no="Inactive" />
                <StatusPill active={!!shop.verifiedBadge} yes="Vérifiée" no="Non vérifiée" />
              </div>
            </div>
          </div>
          <AccentButton onClick={() => setShowEdit(true)}>Modifier la boutique</AccentButton>
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel className="p-5">
          <p className="text-sm text-slate-500">Catégorie</p>
          <p className="mt-2 font-semibold">{shop.categorieShop?.name || "—"}</p>
        </Panel>
        <Panel className="p-5">
          <p className="flex items-center gap-2 text-sm text-slate-500">
            <Phone className="h-4 w-4" />
            Téléphone
          </p>
          <p className="mt-2 font-semibold">{shop.phoneNumber || "—"}</p>
        </Panel>
        <Panel className="p-5">
          <p className="flex items-center gap-2 text-sm text-slate-500">
            <MapPin className="h-4 w-4" />
            Adresse
          </p>
          <p className="mt-2 font-semibold">{shop.address || "—"}</p>
        </Panel>
      </div>

      <Panel className="p-5">
        <ul className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
          <li className="flex justify-between rounded-lg bg-bibocom-light px-3 py-2">
            <span className="text-slate-500">Produits</span>
            <span className="font-semibold">{shop.products?.length ?? 0}</span>
          </li>
          <li className="flex justify-between rounded-lg bg-bibocom-light px-3 py-2">
            <span className="text-slate-500">Créée le</span>
            <span className="font-semibold">{formatDateFr(shop.createdAt)}</span>
          </li>
          <li className="flex justify-between rounded-lg bg-bibocom-light px-3 py-2">
            <span className="text-slate-500">Mise à jour</span>
            <span className="font-semibold">{formatDateFr(shop.updatedAt)}</span>
          </li>
        </ul>
      </Panel>

      {showEdit && (
        <EditShopDialog
          shop={shop}
          open={showEdit}
          onOpenChange={setShowEdit}
          onShopUpdated={onShopChanged}
        />
      )}
    </div>
  );
}
