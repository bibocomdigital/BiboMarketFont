"use client";

import React from "react";
import { CheckCircle2, ChevronRight, Clock, ShoppingBag, Truck, User, XCircle } from "lucide-react";
import ProductsGrid from "@/components/ProductsGrid";
import { orderStatusLabel } from "@/lib/admin-analytics";
import { Panel } from "./ui";

type OrderLike = {
  id?: number;
  status: string;
  totalAmount?: number;
  createdAt?: string;
};

const STATUS_ROWS = [
  {
    label: "En attente",
    statuses: ["PENDING"],
    icon: Clock,
    iconClass: "bg-orange-50 text-orange-500",
    countClass: "text-orange-500",
  },
  {
    label: "En cours",
    statuses: ["CONFIRMED", "SHIPPED"],
    icon: Truck,
    iconClass: "bg-sky-50 text-sky-600",
    countClass: "text-sky-600",
  },
  {
    label: "Livrées",
    statuses: ["DELIVERED"],
    icon: CheckCircle2,
    iconClass: "bg-emerald-50 text-emerald-600",
    countClass: "text-emerald-600",
  },
  {
    label: "Annulées",
    statuses: ["CANCELED"],
    icon: XCircle,
    iconClass: "bg-red-50 text-red-500",
    countClass: "text-red-500",
  },
] as const;

function countFor(orders: OrderLike[], statuses: readonly string[]) {
  return orders.filter((order) => statuses.includes(order.status)).length;
}

function formatDate(iso?: string) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("fr-FR");
}

export function ClientOverview({
  orders,
  loading,
  onOpenOrders,
  onOpenProducts,
  onOpenProfile,
  onOpenOrder,
}: {
  orders: OrderLike[];
  loading: boolean;
  onOpenOrders: () => void;
  onOpenProducts: () => void;
  onOpenProfile: () => void;
  onOpenOrder?: (orderId: number) => void;
}) {
  const recent = [...orders]
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 3);

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
      <section className="min-w-0">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Produits populaires</h2>
          <button type="button" onClick={onOpenProducts} className="text-sm font-medium text-bibocom-accent hover:underline">
            Voir tout
          </button>
        </div>
        <ProductsGrid hideSearchBar />
      </section>

      <aside className="space-y-4">
        <Panel className="p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold">Mes commandes</h2>
            <button
              type="button"
              onClick={onOpenOrders}
              className="inline-flex items-center gap-0.5 text-sm font-medium text-bibocom-accent hover:underline"
            >
              Voir tout
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <ul className="mt-2 divide-y divide-slate-100">
            {STATUS_ROWS.map((row) => {
              const Icon = row.icon;
              const count = countFor(orders, row.statuses);
              return (
                <li key={row.label}>
                  <button
                    type="button"
                    onClick={onOpenOrders}
                    className="flex w-full items-center gap-3 py-3 text-left"
                  >
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${row.iconClass}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="flex-1 text-sm text-slate-600">{row.label}</span>
                    <span className={`text-lg font-semibold tabular-nums ${row.countClass}`}>
                      {loading ? "…" : count}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Panel>
        <Panel className="p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold">Commandes récentes</h2>
            <button
              type="button"
              onClick={onOpenOrders}
              className="inline-flex items-center gap-0.5 text-sm font-medium text-bibocom-accent hover:underline"
            >
              Voir tout
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          {loading ? (
            <p className="py-6 text-center text-sm text-slate-500">Chargement…</p>
          ) : recent.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">Aucune commande pour le moment.</p>
          ) : (
            <ul className="mt-2 divide-y divide-slate-100">
              {recent.map((order) => (
                <li key={order.id ?? order.createdAt}>
                  <button
                    type="button"
                    onClick={() => (order.id && onOpenOrder ? onOpenOrder(order.id) : onOpenOrders())}
                    className="flex w-full items-center justify-between gap-3 py-3 text-left"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-bibocom-primary">
                        {order.id ? `COMMANDE-${order.id}` : "Commande"}
                      </span>
                      <span className="block text-xs text-slate-500">{orderStatusLabel(order.status)}</span>
                    </span>
                    <span className="shrink-0 text-xs text-slate-400">{formatDate(order.createdAt)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel className="p-4">
          <button type="button" onClick={onOpenProfile} className="flex w-full items-center gap-3 text-left">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-bibocom-accent">
              <User className="h-4 w-4" />
            </span>
            <span>
              <span className="block text-sm font-semibold">Mon profil</span>
              <span className="block text-xs text-slate-500">Informations personnelles</span>
            </span>
          </button>
          <button
            type="button"
            onClick={onOpenOrders}
            className="mt-3 flex w-full items-center gap-3 rounded-xl bg-slate-50 px-3 py-2 text-left text-sm font-medium"
          >
            <ShoppingBag className="h-4 w-4 text-bibocom-accent" />
            Suivre une commande
          </button>
        </Panel>
      </aside>
    </div>
  );
}
