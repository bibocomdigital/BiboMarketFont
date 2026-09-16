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
  paymentLabel,
} from "@/lib/admin-analytics";
import {
  useAdminOrderQuery,
  useAdminOrdersListQuery,
  usePatchAdminOrderStatusMutation,
} from "@/hooks/queries/use-admin-query";
import {
  AdminInput,
  AdminSelect,
  ConfirmBar,
  GhostButton,
  PaginationBar,
  Panel,
  StateMessage,
  Td,
  Th,
  queryErrorMessage,
} from "./ui";

export function AdminOrderDialog({
  orderId,
  onClose,
}: {
  orderId: number | null;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const query = useAdminOrderQuery(orderId, orderId !== null);
  const patchStatus = usePatchAdminOrderStatusMutation();
  const order = query.data;

  if (orderId === null) return null;

  return (
    <ConfirmBar
      title={order ? `Commande #${order.id}` : "Commande"}
      message={
        query.isPending ? (
          "Chargement…"
        ) : query.isError ? (
          queryErrorMessage(query.error)
        ) : order ? (
          <div className="space-y-3">
            <p>
              {fullName(order.client)} · {formatFcfa(order.totalAmount)} ·{" "}
              {paymentLabel(order.paymentMethod)}
            </p>
            <AdminSelect
              value={String(order.status)}
              onChange={(event) =>
                patchStatus.mutate(
                  { id: order.id, status: event.target.value },
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
            </AdminSelect>
            <ul className="space-y-2">
              {(order.orderItems || []).map((item, index) => (
                <li key={item.id ?? index} className="rounded-lg bg-white/5 px-3 py-2">
                  {item.product?.name || "Produit"} × {item.quantity} · {formatFcfa(item.price)}
                  {item.product?.shop?.name ? ` · ${item.product.shop.name}` : ""}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          "Données indisponibles."
        )
      }
      confirmLabel="Fermer"
      onCancel={onClose}
      onConfirm={onClose}
    />
  );
}

export function AdminOrdersView({
  enabled,
  selectedOrderId,
  onSelectOrder,
}: {
  enabled: boolean;
  selectedOrderId: number | null;
  onSelectOrder: (id: number | null) => void;
}) {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");

  const filters = useMemo(
    () => ({
      page,
      limit: 20,
      search: search || undefined,
      status: status || undefined,
      paymentMethod: paymentMethod || undefined,
    }),
    [page, search, status, paymentMethod]
  );
  const query = useAdminOrdersListQuery(filters, enabled);
  const patchStatus = usePatchAdminOrderStatusMutation();
  const orders = query.data?.orders ?? [];
  const pagination = query.data?.pagination;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <AdminInput
          value={draft}
          placeholder="Rechercher client ou n° commande"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              setPage(1);
              setSearch(draft.trim());
            }
          }}
          className="sm:max-w-sm"
        />
        <GhostButton
          onClick={() => {
            setPage(1);
            setSearch(draft.trim());
          }}
        >
          Rechercher
        </GhostButton>
        <AdminSelect
          value={status}
          onChange={(event) => {
            setPage(1);
            setStatus(event.target.value);
          }}
        >
          <option value="">Tous les statuts</option>
          {ORDER_STATUSES.map((item) => (
            <option key={item} value={item}>
              {orderStatusLabel(item)}
            </option>
          ))}
        </AdminSelect>
        <AdminSelect
          value={paymentMethod}
          onChange={(event) => {
            setPage(1);
            setPaymentMethod(event.target.value);
          }}
        >
          <option value="">Tous les paiements</option>
          <option value="CASH_ON_DELIVERY">{paymentLabel("CASH_ON_DELIVERY")}</option>
          <option value="MOBILE_MONEY">{paymentLabel("MOBILE_MONEY")}</option>
        </AdminSelect>
      </div>

      <Panel>
        {query.isPending && orders.length === 0 ? (
          <StateMessage>Chargement des commandes…</StateMessage>
        ) : query.isError ? (
          <StateMessage>{queryErrorMessage(query.error)}</StateMessage>
        ) : orders.length === 0 ? (
          <StateMessage>Aucune commande trouvée.</StateMessage>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <Th>N°</Th>
                  <Th>Client</Th>
                  <Th>Articles</Th>
                  <Th>Montant</Th>
                  <Th>Paiement</Th>
                  <Th>Statut</Th>
                  <Th>Date</Th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-white/5 last:border-0">
                    <Td>
                      <GhostButton onClick={() => onSelectOrder(order.id)}>#{order.id}</GhostButton>
                    </Td>
                    <Td>{fullName(order.client)}</Td>
                    <Td className="max-w-[240px] truncate">
                      {(order.orderItems || [])
                        .map((item) => `${item.product?.name || "Produit"} (${item.product?.shop?.name || "—"})`)
                        .join(", ") || "—"}
                    </Td>
                    <Td>{formatFcfa(order.totalAmount)}</Td>
                    <Td>{paymentLabel(order.paymentMethod)}</Td>
                    <Td>
                      <AdminSelect
                        value={String(order.status)}
                        onChange={(event) =>
                          patchStatus.mutate(
                            { id: order.id, status: event.target.value },
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
                      </AdminSelect>
                    </Td>
                    <Td>{formatDateFr(order.createdAt)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pagination ? (
          <PaginationBar
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            onPageChange={setPage}
          />
        ) : null}
      </Panel>

      <AdminOrderDialog orderId={selectedOrderId} onClose={() => onSelectOrder(null)} />
    </div>
  );
}
