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
import { confirmAction } from "@/components/feedback/confirm-dialog";
import {
  AccentButton,
  ConfirmBar,
  GhostButton,
  MerchantInput,
  MerchantSelect,
  MobileCard,
  Panel,
  StateMessage,
  Td,
  Th,
  queryErrorMessage,
} from "./ui";

function asMerchantOrders(raw: unknown): MerchantOrder[] {
  return Array.isArray(raw) ? (raw as MerchantOrder[]) : [];
}

function clientIdOf(order: MerchantOrder) {
  const id = Number(order.client?.id || order.clientId);
  return Number.isFinite(id) && id > 0 ? id : null;
}

type StatusAction = {
  status: "CONFIRMED" | "SHIPPED" | "CANCELED";
  label: string;
  danger?: boolean;
  title: string;
  description: string;
  confirmLabel: string;
};

function statusActions(status: string): StatusAction[] {
  const current = String(status).toUpperCase();
  if (current === "PENDING") {
    return [
      {
        status: "CONFIRMED",
        label: "Confirmer",
        title: "Confirmer cette commande ?",
        description: "Le client sera informé que vous acceptez la commande.",
        confirmLabel: "Confirmer",
      },
      {
        status: "CANCELED",
        label: "Annuler",
        danger: true,
        title: "Annuler cette commande ?",
        description: "Le client sera informé. Cette action est définitive.",
        confirmLabel: "Oui, annuler",
      },
    ];
  }
  if (current === "CONFIRMED") {
    return [
      {
        status: "SHIPPED",
        label: "Expédier",
        title: "Marquer comme expédiée ?",
        description: "Le client verra que sa commande est en cours de livraison.",
        confirmLabel: "Expédier",
      },
      {
        status: "CANCELED",
        label: "Annuler",
        danger: true,
        title: "Annuler cette commande ?",
        description: "Le client sera informé. Cette action est définitive.",
        confirmLabel: "Oui, annuler",
      },
    ];
  }
  return [];
}

function StatusBadge({ status }: { status: string }) {
  const current = String(status).toUpperCase();
  const tone =
    current === "PENDING"
      ? "bg-amber-50 text-amber-700"
      : current === "CONFIRMED"
        ? "bg-sky-50 text-sky-700"
        : current === "SHIPPED"
          ? "bg-violet-50 text-violet-700"
          : current === "DELIVERED"
            ? "bg-emerald-50 text-emerald-700"
            : current === "CANCELED"
              ? "bg-red-50 text-red-600"
              : "bg-slate-100 text-slate-500";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>
      {orderStatusLabel(status)}
    </span>
  );
}

function OrderActions({
  order,
  busy,
  onStatus,
  onMessage,
}: {
  order: MerchantOrder;
  busy: boolean;
  onStatus: (order: MerchantOrder, action: StatusAction) => void;
  onMessage?: (clientId: number) => void;
}) {
  const actions = statusActions(order.status);
  const clientId = clientIdOf(order);
  if (actions.length === 0 && !clientId) {
    return <span className="text-slate-400">—</span>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {actions.map((action) =>
        action.danger ? (
          <button
            key={action.status}
            type="button"
            disabled={busy}
            onClick={() => onStatus(order, action)}
            className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-40"
          >
            {action.label}
          </button>
        ) : (
          <AccentButton key={action.status} disabled={busy} onClick={() => onStatus(order, action)}>
            {action.label}
          </AccentButton>
        ),
      )}
      {onMessage && clientId ? (
        <GhostButton disabled={busy} onClick={() => onMessage(clientId)}>
          Écrire
        </GhostButton>
      ) : null}
    </div>
  );
}

export function MerchantOrderDialog({
  order,
  busy,
  onClose,
  onStatus,
  onMessage,
}: {
  order: MerchantOrder | null;
  busy: boolean;
  onClose: () => void;
  onStatus: (order: MerchantOrder, action: StatusAction) => void;
  onMessage?: (clientId: number) => void;
}) {
  if (!order) return null;
  const items = merchantOrderItems(order);

  return (
    <ConfirmBar
      title={`Commande #${order.id}`}
      message={
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={order.status} />
            <span>
              {fullName(order.client)}
              {order.client?.phoneNumber ? ` · ${order.client.phoneNumber}` : ""}
              {" · "}
              {formatFcfa(order.totalAmount)}
            </span>
          </div>
          <OrderActions order={order} busy={busy} onStatus={onStatus} onMessage={onMessage} />
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

  const requestStatus = async (order: MerchantOrder, action: StatusAction) => {
    const accepted = await confirmAction({
      title: action.title,
      description: action.description,
      confirmLabel: action.confirmLabel,
      cancelLabel: "Retour",
      variant: action.danger ? "danger" : "default",
    });
    if (!accepted) return;
    patchStatus.mutate(
      { orderId: order.id, status: action.status },
      {
        onError: (error) =>
          toast({
            title: "Statut non mis à jour",
            description: getUserErrorMessage(error),
            variant: "destructive",
          }),
      },
    );
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return orders.filter((order) => {
      const client = fullName(order.client).toLowerCase();
      const phone = String(order.client?.phoneNumber || "").toLowerCase();
      const matchesSearch =
        !term || client.includes(term) || phone.includes(term) || String(order.id).includes(term);
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
          <>
          <div className="hidden overflow-x-auto lg:block">
            <table className="min-w-[920px] w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <Th>N°</Th>
                  <Th>Client</Th>
                  <Th>Téléphone</Th>
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
                  const phone = order.client?.phoneNumber;
                  return (
                    <tr key={order.id} className="border-b border-slate-100 last:border-0">
                      <Td>
                        <GhostButton onClick={() => onSelectOrder(order.id)}>#{order.id}</GhostButton>
                      </Td>
                      <Td>{fullName(order.client)}</Td>
                      <Td>
                        {phone ? (
                          <a href={`tel:${phone}`} className="text-bibocom-accent hover:underline">
                            {phone}
                          </a>
                        ) : (
                          <span className="text-slate-400">Non renseigné</span>
                        )}
                      </Td>
                      <Td className="max-w-[220px] truncate">
                        {items.map((item) => item.product?.name || "Produit").join(", ") || "—"}
                      </Td>
                      <Td>{formatFcfa(order.totalAmount)}</Td>
                      <Td>
                        <StatusBadge status={order.status} />
                      </Td>
                      <Td>{formatDateFr(order.createdAt)}</Td>
                      <Td className="whitespace-normal">
                        <OrderActions
                          order={order}
                          busy={patchStatus.isPending}
                          onStatus={(current, action) => void requestStatus(current, action)}
                          onMessage={onMessageClient}
                        />
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="space-y-3 p-3 lg:hidden">
            {filtered.map((order) => {
              const items = merchantOrderItems(order);
              const phone = order.client?.phoneNumber;
              return (
                <MobileCard key={order.id}>
                  <div className="flex items-center justify-between gap-3">
                    <GhostButton onClick={() => onSelectOrder(order.id)}>#{order.id}</GhostButton>
                    <span className="text-xs text-slate-400">{formatDateFr(order.createdAt)}</span>
                  </div>
                  <dl className="mt-3 space-y-2 text-sm">
                    <div className="flex items-start justify-between gap-3">
                      <dt className="shrink-0 text-xs text-slate-400">Client</dt>
                      <dd className="min-w-0 text-right font-medium">{fullName(order.client)}</dd>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <dt className="shrink-0 text-xs text-slate-400">Téléphone</dt>
                      <dd className="min-w-0 break-all text-right">
                        {phone ? (
                          <a href={`tel:${phone}`} className="font-medium text-bibocom-accent">
                            {phone}
                          </a>
                        ) : (
                          <span className="text-slate-400">Non renseigné</span>
                        )}
                      </dd>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <dt className="shrink-0 text-xs text-slate-400">Articles</dt>
                      <dd className="min-w-0 text-right text-slate-600">
                        {items.map((item) => item.product?.name || "Produit").join(", ") || "—"}
                      </dd>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <dt className="shrink-0 text-xs text-slate-400">Montant</dt>
                      <dd className="font-medium">{formatFcfa(order.totalAmount)}</dd>
                    </div>
                  </dl>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <StatusBadge status={order.status} />
                  </div>
                  <div className="mt-3">
                    <OrderActions
                      order={order}
                      busy={patchStatus.isPending}
                      onStatus={(current, action) => void requestStatus(current, action)}
                      onMessage={onMessageClient}
                    />
                  </div>
                </MobileCard>
              );
            })}
          </div>
          </>
        )}
      </Panel>

      <MerchantOrderDialog
        order={selected}
        busy={patchStatus.isPending}
        onClose={() => onSelectOrder(null)}
        onStatus={(current, action) => void requestStatus(current, action)}
        onMessage={onMessageClient}
      />
    </div>
  );
}
