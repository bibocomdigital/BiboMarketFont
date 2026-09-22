"use client";

import React from "react";
import { Clock, CreditCard, Heart, Package, ShoppingBag, User } from "lucide-react";
import RecentOrders from "@/components/RecentOrders";
import ProductsGrid from "@/components/ProductsGrid";
import { Panel } from "./ui";

type OrderLike = {
  status: string;
  totalAmount?: number;
  orderItems?: Array<{ price: number; quantity: number }>;
};

function formatFcfa(amount: number) {
  return `${amount.toLocaleString("fr-FR")} FCFA`;
}

function statsFrom(orders: OrderLike[]) {
  const totalOrders = orders.filter((order) => order.status !== "CANCELED").length;
  const pendingOrders = orders.filter((order) => order.status === "PENDING").length;
  const totalSpent = orders
    .filter((order) => ["CONFIRMED", "SHIPPED", "DELIVERED"].includes(order.status))
    .reduce((total, order) => {
      const orderTotal =
        order.orderItems?.reduce((sum, item) => sum + item.price * item.quantity, 0) ||
        order.totalAmount ||
        0;
      return total + orderTotal;
    }, 0);
  return { totalOrders, pendingOrders, totalSpent };
}

function Kpi({
  icon: Icon,
  label,
  value,
  hint,
  loading,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  hint?: string;
  loading?: boolean;
}) {
  return (
    <Panel className="flex items-center gap-4 p-5">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-bibocom-accent/10 text-bibocom-accent">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-slate-500">{label}</p>
        {loading ? (
          <div className="mt-2 h-7 w-16 animate-pulse rounded bg-slate-100" />
        ) : (
          <p className="mt-1 truncate text-xl font-semibold">{value}</p>
        )}
        {hint ? <p className="text-xs text-slate-400">{hint}</p> : null}
      </div>
    </Panel>
  );
}

export function ClientOverview({
  orders,
  loading,
  onOpenOrders,
  onOpenProducts,
  onOpenProfile,
}: {
  orders: OrderLike[];
  loading: boolean;
  onOpenOrders: () => void;
  onOpenProducts: () => void;
  onOpenProfile: () => void;
}) {
  const stats = statsFrom(orders);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={Package} label="Commandes totales" value={stats.totalOrders} hint="Hors annulées" loading={loading} />
        <Kpi icon={CreditCard} label="Total dépensé" value={formatFcfa(stats.totalSpent)} hint="Commandes validées" loading={loading} />
        <Kpi icon={Heart} label="Articles favoris" value={0} hint="Bientôt disponible" />
        <Kpi icon={Clock} label="En attente" value={stats.pendingOrders} hint="Statut PENDING" loading={loading} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <RecentOrders onSeeAll={onOpenOrders} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Panel className="p-5">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-bibocom-accent/10 text-bibocom-accent">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <h3 className="font-semibold">Mes commandes</h3>
              <p className="mt-1 text-sm text-slate-500">Consultez et suivez vos commandes en cours</p>
              <button type="button" onClick={onOpenOrders} className="mt-4 text-sm font-medium text-bibocom-accent hover:underline">
                Voir mes commandes
              </button>
            </Panel>
            <Panel className="p-5">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-bibocom-success/10 text-bibocom-success">
                <Heart className="h-5 w-5" />
              </div>
              <h3 className="font-semibold">Mes favoris</h3>
              <p className="mt-1 text-sm text-slate-500">Retrouvez tous vos produits préférés</p>
              <button type="button" onClick={onOpenProducts} className="mt-4 text-sm font-medium text-bibocom-accent hover:underline">
                Voir les produits
              </button>
            </Panel>
            <Panel className="p-5">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-bibocom-secondary/40 text-bibocom-primary">
                <User className="h-5 w-5" />
              </div>
              <h3 className="font-semibold">Mon profil</h3>
              <p className="mt-1 text-sm text-slate-500">Mettez à jour vos informations personnelles</p>
              <button type="button" onClick={onOpenProfile} className="mt-4 text-sm font-medium text-bibocom-accent hover:underline">
                Modifier mon profil
              </button>
            </Panel>
          </div>
        </div>
        <Panel className="p-5">
          <h2 className="text-lg font-semibold">Offre spéciale</h2>
          <p className="mt-2 text-sm text-slate-500">
            Profitez de 20% de réduction sur votre prochaine commande avec le code :
          </p>
          <p className="mt-4 rounded-2xl bg-bibocom-light px-3 py-2 text-center font-mono text-sm font-semibold">
            BIBOSPRING20
          </p>
          <button
            type="button"
            onClick={onOpenProducts}
            className="mt-4 w-full rounded-full bg-bibocom-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-bibocom-accent/90"
          >
            Découvrir
          </button>
        </Panel>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Produits populaires</h2>
          <button type="button" onClick={onOpenProducts} className="text-sm font-medium text-bibocom-accent hover:underline">
            Voir tous les produits
          </button>
        </div>
        <ProductsGrid />
      </div>
    </div>
  );
}
