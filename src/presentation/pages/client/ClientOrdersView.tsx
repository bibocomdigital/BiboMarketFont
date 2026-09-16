"use client";

import React from "react";
import { useNavigate } from "react-router-dom";
import { getUserErrorMessage } from "@domain/errors/app-error";
import { useOrdersQuery } from "@/hooks/queries/use-orders-query";
import { Panel, StateMessage, StatusPill } from "./ui";

function statusTone(status: string): "neutral" | "success" | "warning" | "danger" | "info" {
  if (status === "DELIVERED" || status === "CONFIRMED") return "success";
  if (status === "PENDING") return "warning";
  if (status === "CANCELED") return "danger";
  if (status === "SHIPPED") return "info";
  return "neutral";
}

function statusLabel(status: string) {
  if (status === "PENDING") return "En attente";
  if (status === "CONFIRMED") return "Confirmée";
  if (status === "SHIPPED") return "Expédiée";
  if (status === "DELIVERED") return "Livrée";
  if (status === "CANCELED") return "Annulée";
  return status;
}

export function ClientOrdersView() {
  const navigate = useNavigate();
  const { data: ordersData = [], isPending, isError, error } = useOrdersQuery();
  const orders = Array.isArray(ordersData) ? ordersData : [];
  const loading = isPending && orders.length === 0;

  return (
    <Panel>
      {loading ? (
        <StateMessage>Chargement des commandes…</StateMessage>
      ) : isError && orders.length === 0 ? (
        <StateMessage>{getUserErrorMessage(error) || "Impossible de charger les commandes."}</StateMessage>
      ) : orders.length === 0 ? (
        <StateMessage>Aucune commande pour le moment.</StateMessage>
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-5 py-3">Commande</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Statut</th>
                  <th className="px-5 py-3">Total</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium">COMMANDE-{order.id}</td>
                    <td className="px-5 py-3 text-slate-500">
                      {new Date(order.createdAt).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-5 py-3">
                      <StatusPill tone={statusTone(order.status)}>{statusLabel(order.status)}</StatusPill>
                    </td>
                    <td className="px-5 py-3">{Number(order.totalAmount || 0).toLocaleString("fr-FR")} FCFA</td>
                    <td className="px-5 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => navigate(`/commandes/${order.id}`)}
                        className="text-sm font-medium text-bibocom-accent hover:underline"
                      >
                        Détails
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="space-y-3 p-4 md:hidden">
            {orders.map((order) => (
              <button
                key={order.id}
                type="button"
                onClick={() => navigate(`/commandes/${order.id}`)}
                className="flex w-full flex-col gap-2 rounded-2xl bg-slate-50 p-4 text-left"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">COMMANDE-{order.id}</span>
                  <StatusPill tone={statusTone(order.status)}>{statusLabel(order.status)}</StatusPill>
                </div>
                <p className="text-sm text-slate-500">{new Date(order.createdAt).toLocaleDateString("fr-FR")}</p>
                <p className="text-sm font-medium">{Number(order.totalAmount || 0).toLocaleString("fr-FR")} FCFA</p>
              </button>
            ))}
          </div>
        </>
      )}
    </Panel>
  );
}
