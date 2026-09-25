"use client";

import React, { useEffect, useState } from "react";
import { getUserErrorMessage } from "@domain/errors/app-error";
import { useToast } from "@/hooks/use-toast";
import { formatFcfa } from "@/lib/admin-analytics";
import {
  useAdjustStockMutation,
  useCounterDeskQuery,
  useMerchantCatalogQuery,
  useStockMovementsQuery,
} from "@/hooks/queries/use-merchant-query";
import type { StockAdjustKind, StockMovementRow } from "@/services/productService";
import NoShop from "@/components/shop/NoShop";
import {
  AccentButton,
  GhostButton,
  MerchantInput,
  MerchantSelect,
  Panel,
  StateMessage,
  queryErrorMessage,
} from "./ui";

const KIND_LABEL: Record<StockMovementRow["kind"], string> = {
  RECEPTION: "Réception",
  COMPTOIR: "Vente comptoir",
  INVENTAIRE: "Inventaire",
  COMMANDE: "Commande en ligne",
  ANNULATION: "Annulation",
};

function formatWhen(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
}

export function MerchantComptoirView({
  merchantId,
  hasShop,
  enabled,
  productId,
  onShopCreated,
}: {
  merchantId: number | null;
  hasShop: boolean;
  enabled: boolean;
  productId: number | null;
  onShopCreated: () => void;
}) {
  const { toast } = useToast();
  const catalog = useMerchantCatalogQuery(merchantId, 1, 100, enabled && hasShop);
  const desk = useCounterDeskQuery(enabled && hasShop);
  const movements = useStockMovementsQuery(enabled && hasShop);
  const adjust = useAdjustStockMutation();
  const products = catalog.data?.products ?? [];
  const [selectedId, setSelectedId] = useState(productId ? String(productId) : "");
  const [quantity, setQuantity] = useState("1");
  const [counted, setCounted] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (productId) setSelectedId(String(productId));
  }, [productId]);

  const selected = products.find((product) => String(product.id) === selectedId);

  const run = async (kind: StockAdjustKind, amount: number) => {
    const id = Number(selectedId);
    if (!id) {
      toast({ title: "Choisissez un produit", variant: "destructive" });
      return;
    }
    try {
      const result = await adjust.mutateAsync({ productId: id, kind, quantity: amount, note });
      setNote("");
      toast({
        title: KIND_LABEL[kind],
        description: `Stock actuel : ${result.stock}`,
      });
    } catch (error) {
      toast({
        title: "Stock non mis à jour",
        description: getUserErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  if (!hasShop) return <NoShop onShopCreated={onShopCreated} />;

  const today = desk.data?.today;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Panel className="p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Ventes comptoir du jour</p>
          <p className="mt-1 text-2xl font-semibold">{today?.count ?? "—"}</p>
        </Panel>
        <Panel className="p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Pièces vendues</p>
          <p className="mt-1 text-2xl font-semibold">{today?.quantity ?? "—"}</p>
        </Panel>
        <Panel className="p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Encaissé au comptoir</p>
          <p className="mt-1 text-2xl font-semibold">{today ? formatFcfa(today.total) : "—"}</p>
        </Panel>
      </div>

      <Panel className="space-y-3 p-5">
        <h2 className="text-lg font-semibold">Mouvement de stock</h2>
        <p className="text-sm text-slate-600">
          Une réception augmente le stock. Une vente au comptoir le baisse et enregistre la vente.
          L’inventaire remplace le chiffre par ce que vous avez compté.
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          <MerchantSelect value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>
            <option value="">Choisir un produit</option>
            {productId && !products.some((product) => product.id === productId) ? (
              <option value={String(productId)}>Produit #{productId}</option>
            ) : null}
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} · stock {product.stock}
              </option>
            ))}
          </MerchantSelect>
          <MerchantInput
            value={quantity}
            inputMode="numeric"
            onChange={(event) => setQuantity(event.target.value)}
            placeholder="Quantité"
          />
          <MerchantInput
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Note, optionnelle"
            className="md:col-span-2"
          />
        </div>
        {selected ? (
          <p className="text-sm text-slate-500">
            Stock actuel : <span className={selected.stock < 10 ? "font-medium text-amber-600" : "font-medium"}>{selected.stock}</span>
            {selected.stock < 10 ? " · bas" : ""}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <AccentButton
            disabled={adjust.isPending}
            onClick={() => void run("RECEPTION", parseInt(quantity, 10))}
          >
            Réception
          </AccentButton>
          <AccentButton
            disabled={adjust.isPending}
            onClick={() => void run("COMPTOIR", parseInt(quantity, 10))}
          >
            Vente au comptoir
          </AccentButton>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
          <MerchantInput
            value={counted}
            inputMode="numeric"
            onChange={(event) => setCounted(event.target.value)}
            placeholder="Quantité comptée"
            className="max-w-[180px]"
          />
          <GhostButton
            disabled={adjust.isPending}
            onClick={() => void run("INVENTAIRE", parseInt(counted, 10))}
          >
            Enregistrer l’inventaire
          </GhostButton>
        </div>
      </Panel>

      <Panel>
        <h2 className="px-5 pt-5 text-lg font-semibold">Ventes au comptoir</h2>
        {desk.isPending ? (
          <StateMessage>Chargement…</StateMessage>
        ) : desk.isError ? (
          <StateMessage>{queryErrorMessage(desk.error)}</StateMessage>
        ) : (desk.data?.sales.length ?? 0) === 0 ? (
          <StateMessage>Aucune vente au comptoir pour le moment.</StateMessage>
        ) : (
          <ul className="divide-y divide-slate-100">
            {desk.data?.sales.map((sale) => (
              <li key={sale.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm">
                <div>
                  <p className="font-medium">{sale.product.name}</p>
                  <p className="text-slate-500">
                    {sale.quantity} × {formatFcfa(sale.unitPrice)} · {formatWhen(sale.createdAt)}
                  </p>
                </div>
                <p className="font-semibold">{formatFcfa(sale.total)}</p>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel>
        <h2 className="px-5 pt-5 text-lg font-semibold">Historique du stock</h2>
        {movements.isPending ? (
          <StateMessage>Chargement…</StateMessage>
        ) : movements.isError ? (
          <StateMessage>{queryErrorMessage(movements.error)}</StateMessage>
        ) : (movements.data?.length ?? 0) === 0 ? (
          <StateMessage>Aucun mouvement enregistré.</StateMessage>
        ) : (
          <ul className="divide-y divide-slate-100">
            {movements.data?.map((movement) => (
              <li key={movement.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm">
                <div>
                  <p className="font-medium">
                    {KIND_LABEL[movement.kind]} · {movement.product.name}
                  </p>
                  <p className="text-slate-500">
                    {formatWhen(movement.createdAt)}
                    {movement.note ? ` · ${movement.note}` : ""}
                    {movement.orderId ? ` · commande #${movement.orderId}` : ""}
                  </p>
                </div>
                <p className={movement.delta < 0 ? "font-medium text-amber-600" : "font-medium text-bibocom-success"}>
                  {movement.delta > 0 ? `+${movement.delta}` : movement.delta} · reste {movement.stockAfter}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
