"use client";

import React, { useMemo, useState } from "react";
import { getUserErrorMessage } from "@domain/errors/app-error";
import { useToast } from "@/hooks/use-toast";
import {
  ORDER_STATUSES,
  formatDateFr,
  formatFcfa,
  fullName,
  orderStatusLabel,
} from "@/lib/admin-analytics";
import { merchantOrderItems, type MerchantOrder } from "@/services/merchantService";
import { useMerchantOrdersQuery } from "@/hooks/queries/use-orders-query";
import { useUpdateOrderStatusMutation } from "@/hooks/mutations/use-order-mutations";
import NoShop from "@/components/shop/NoShop";
import {
  ConfirmBar,
  GhostButton,
  MerchantInput,
  MerchantSelect,
  Panel,
  StateMessage,
  Td,
  Th,
  queryErrorMessage,
} from "./ui";

function asMerchantOrders(raw: unknown): MerchantOrder[] {
  return Array.isArray(raw) ? (raw as MerchantOrder[]) : [];
}

export function MerchantOrderDialog({
  order,
  onClose,
}: {
  order: MerchantOrder | null;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const patchStatus = useUpdateOrderStatusMutation();
  if (!order) return null;
  const items = merchantOrderItems(order);

  return (
    <ConfirmBar
      title={`Commande #${order.id}`}
      message={
        <div className="space-y-3">
          <p>
            {fullName(order.client)} · {formatFcfa(order.totalAmount)}
          </p>
          <MerchantSelect
            value={String(order.status)}
            onChange={(event) =>
              patchStatus.mutate(
                { orderId: order.id, status: event.target.value },
                {
                  onError: (error) =>
                    toast({
                      title: "Statut non mis à jour",
                      description: getUserErrorMessage(error),
                      variant: "destructive",
                    }),
                }
              )
            }
          >
            {ORDER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {orderStatusLabel(status)}
              </option>
            ))}
          </MerchantSelect>
          <ul className="space-y-2">
            {items.length === 0 ? (
              <li className="text-slate-400">Aucun article de votre boutique.</li>
            ) : (
              items.map((item, index) => (
                <li key={item.id ?? index} className="rounded-lg bg-bibocom-light px-3 py-2">
                  {item.product?.name || "Produit"} × {item.quantity} · {formatFcfa(item.price)}
                </li>
              ))
            )}
          </ul>
        </div>
      }
      confirmLabel="Fermer"
      onCancel={onClose}
      onConfirm={onClose}
    />
  );
}

export function MerchantOrdersView({
  enabled,
  hasShop,
  selectedOrderId,
  onSelectOrder,
  onShopCreated,
  onMessageClient,
}: {
  enabled: boolean;
  hasShop: boolean;
  selectedOrderId: number | null;
  onSelectOrder: (id: number | null) => void;
  onShopCreated: () => void;
  onMessageClient?: (clientId: number) => void;
}) {
  const { toast } = useToast();
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const query = useMerchantOrdersQuery(enabled && hasShop);
  const patchStatus = useUpdateOrderStatusMutation();
  const orders = asMerchantOrders(query.data);
  const selected = orders.find((order) => order.id === selectedOrderId) || null;

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return orders.filter((order) => {
      const client = fullName(order.client).toLowerCase();
      const matchesSearch = !term || client.includes(term) || String(order.id).includes(term);
      const matchesStatus = !status || String(order.status).toUpperCase() === status;
      return matchesSearch && matchesStatus;
    });
  }, [orders, search, status]);

  if (!hasShop) {
    return <NoShop onShopCreated={onShopCreated} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <MerchantInput
          value={draft}
          placeholder="Rechercher client ou n° commande"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") setSearch(draft.trim());
          }}
          className="sm:max-w-sm"
        />
        <GhostButton onClick={() => setSearch(draft.trim())}>Rechercher</GhostButton>
        <MerchantSelect
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="">Tous les statuts</option>
          {ORDER_STATUSES.map((item) => (
            <option key={item} value={item}>
              {orderStatusLabel(item)}
            </option>
          ))}
        </MerchantSelect>
      </div>

      <Panel>
        {query.isPending && orders.length === 0 ? (
          <StateMessage>Chargement des commandes…</StateMessage>
        ) : query.isError ? (
          <StateMessage>{queryErrorMessage(query.error)}</StateMessage>
        ) : filtered.length === 0 ? (
          <StateMessage>Aucune commande trouvée.</StateMessage>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <Th>N°</Th>
                  <Th>Client</Th>
                  <Th>Articles</Th>
                  <Th>Montant</Th>
                  <Th>Statut</Th>
                  <Th>Date</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => {
                  const items = merchantOrderItems(order);
                  return (
                    <tr key={order.id} className="border-b border-slate-100 last:border-0">
                      <Td>
                        <GhostButton onClick={() => onSelectOrder(order.id)}>#{order.id}</GhostButton>
                      </Td>
                      <Td>{fullName(order.client)}</Td>
                      <Td className="max-w-[240px] truncate">
                        {items.map((item) => item.product?.name || "Produit").join(", ") || "—"}
                      </Td>
                      <Td>{formatFcfa(order.totalAmount)}</Td>
                      <Td>
                        <MerchantSelect
                          value={String(order.status)}
                          onChange={(event) =>
                            patchStatus.mutate(
                              { orderId: order.id, status: event.target.value },
                              {
                                onError: (error) =>
                                  toast({
                                    title: "Statut non mis à jour",
                                    description: getUserErrorMessage(error),
                                    variant: "destructive",
                                  }),
                              }
                            )
                          }
                        >
                          {ORDER_STATUSES.map((item) => (
                            <option key={item} value={item}>
                              {orderStatusLabel(item)}
                            </option>
                          ))}
                        </MerchantSelect>
                      </Td>
                      <Td>{formatDateFr(order.createdAt)}</Td>
                      <Td>
                        {onMessageClient && Number(order.client?.id || order.clientId) ? (
                          <GhostButton onClick={() => onMessageClient(Number(order.client?.id || order.clientId))}>
                            Écrire
                          </GhostButton>
                        ) : (
                          "—"
                        )}
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <MerchantOrderDialog order={selected} onClose={() => onSelectOrder(null)} />
    </div>
  );
}
