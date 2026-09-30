"use client";

import React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BadgeCheck, Package, Store } from "lucide-react";
import { formatImageUrl, type ShopWithProducts } from "@/services/shopService";
import type { MerchantProductStats, MerchantRevenuePoint, MerchantStats } from "@/services/merchantService";
import { formatDateFr, formatFcfa, orderStatusLabel } from "@/lib/admin-analytics";
import { GhostButton, Panel, queryErrorMessage } from "./ui";

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <Panel className={`p-5 ${className}`}>{children}</Panel>;
}

function Kpi({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <Card>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-bibocom-primary">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-400">{hint}</p> : null}
    </Card>
  );
}

function dayLabel(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

type MerchantOverviewProps = {
  stats?: MerchantStats;
  chart?: MerchantRevenuePoint[];
  productStats?: MerchantProductStats;
  shop?: ShopWithProducts | null;
  displayName?: string;
  loading: boolean;
  error: unknown;
  days: number;
  onDaysChange: (days: number) => void;
  onOpenOrder: (id: number) => void;
  onOpenSection: (section: "products" | "orders" | "boutique" | "badge" | "comptoir" | "messages") => void;
};

export function MerchantOverview({
  stats,
  chart,
  productStats,
  shop,
  displayName,
  loading,
  error,
  days,
  onDaysChange,
  onOpenOrder,
  onOpenSection,
}: MerchantOverviewProps) {
  if (loading && !stats) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="h-28 animate-pulse rounded-2xl bg-white" />
        <div className="h-28 animate-pulse rounded-2xl bg-white" />
        <div className="h-72 animate-pulse rounded-2xl bg-white" />
        <div className="h-72 animate-pulse rounded-2xl bg-white" />
      </div>
    );
  }

  if (error && !stats) {
    return (
      <Card>
        <p className="text-sm text-slate-500">{queryErrorMessage(error)}</p>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <p className="text-sm text-slate-400">Données indisponibles.</p>
      </Card>
    );
  }

  const series = (
    chart && chart.length > 0 ? chart : days === 7 ? stats.revenueChart || [] : []
  ).map((row) => ({
    ...row,
    label: dayLabel(row.date),
  }));
  const categories = productStats?.categoryStats || [];

  const topProducts = stats.topProducts || [];
  const shopLogo = formatImageUrl(shop?.logo || null);

  return (
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0 space-y-4">
        <section className="overflow-hidden rounded-2xl bg-gradient-to-r from-bibocom-primary to-[#16385c] p-5 text-white sm:p-6">
          <p className="text-sm text-white/70">{shop?.name || "Votre boutique"}</p>
          <h2 className="mt-1 max-w-xl text-2xl font-semibold leading-tight">
            {displayName ? `Bonjour ${displayName.split(" ")[0]}` : "Espace commerçant"}
          </h2>
          <p className="mt-2 max-w-lg text-sm text-white/75">
            Les commandes se règlent à la livraison. Le badge se paie à part et s’affiche sur la boutique.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onOpenSection("orders")}
              className="rounded-full bg-bibocom-accent px-4 py-2 text-sm font-semibold text-white"
            >
              Voir les commandes
            </button>
            <button
              type="button"
              onClick={() => onOpenSection("boutique")}
              className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white"
            >
              Ma boutique
            </button>
          </div>
        </section>

        {categories.length > 0 ? (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map((row) => (
              <button
                key={`${row.categorieProdId || row.category}-${row.count}`}
                type="button"
                onClick={() => onOpenSection("products")}
                className="shrink-0 rounded-full bg-white px-3 py-1.5 text-sm font-medium text-bibocom-primary ring-1 ring-slate-200"
              >
                {row.category} · {row.count}
              </button>
            ))}
          </div>
        ) : null}

        <section className="rounded-2xl bg-white p-4 ring-1 ring-slate-100 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold">Produits les plus vendus</h3>
            <button type="button" onClick={() => onOpenSection("products")} className="text-sm font-medium text-bibocom-accent">
              Voir tout
            </button>
          </div>
          {topProducts.length === 0 ? (
            <p className="mt-4 text-sm text-slate-400">Aucun produit vendu pour le moment.</p>
          ) : (
            <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {topProducts.slice(0, 4).map((item, index) => (
                <li key={item.productId ?? item.product?.id ?? index} className="flex gap-3 rounded-xl bg-slate-50 p-3">
                  {item.product?.images?.[0]?.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.product.images[0].imageUrl} alt="" className="h-16 w-16 rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-white">
                      <Package className="h-5 w-5 text-slate-300" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{item.productName || item.product?.name || "Produit"}</p>
                    <p className="mt-1 text-sm font-semibold text-bibocom-accent">{formatFcfa(item.totalRevenue)}</p>
                    <p className="text-xs text-slate-400">{item.totalSold} vendu(s)</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

      <div className="flex justify-end">
        <div className="flex rounded-xl bg-white p-1 shadow-sm ring-1 ring-slate-100">
          {[7, 30].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => onDaysChange(value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                days === value ? "bg-bibocom-accent text-white" : "text-slate-500"
              }`}
            >
              {value} jours
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Chiffre d'affaires"
          value={formatFcfa(stats.totalRevenue)}
          hint={`Panier moyen ${formatFcfa(stats.averageOrderValue)}`}
        />
        <Kpi
          label="Commandes"
          value={stats.totalOrders}
          hint={`${stats.pendingOrders} en attente`}
        />
        <Kpi
          label="Taux de livraison"
          value={`${Math.round(stats.successRate || 0)} %`}
          hint={`${stats.deliveredOrders} livrée(s)`}
        />
        <Kpi
          label="Produits"
          value={productStats?.totalProducts ?? shop?.products?.length ?? "—"}
          hint={
            productStats
              ? `${productStats.lowStockCount} stock bas`
              : shop?.products
                ? `${shop.products.length} dans la boutique`
                : undefined
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card className="min-h-[320px]">
          <h2 className="text-lg font-semibold text-bibocom-primary">Commandes</h2>
          <p className="mt-1 text-sm text-slate-500">Évolution sur {days} jours</p>
          {series.length === 0 ? (
            <p className="mt-8 text-sm text-slate-400">Aucune commande sur la période.</p>
          ) : (
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="merchantOrdersFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8DD1E0" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#8DD1E0" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(15, 23, 42, 0.06)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    interval={days > 14 ? 4 : 0}
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={36}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const row = payload[0].payload as { label: string; orderCount: number };
                      return (
                        <div className="rounded-lg border border-slate-100 bg-white px-3 py-2 text-xs text-bibocom-primary shadow-xl">
                          <p className="font-medium">{row.label}</p>
                          <p className="text-bibocom-secondary">Commandes : {row.orderCount}</p>
                        </div>
                      );
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="orderCount"
                    stroke="#8DD1E0"
                    strokeWidth={2.5}
                    fill="url(#merchantOrdersFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card className="min-h-[320px]">
          <h2 className="text-lg font-semibold text-bibocom-accent">Chiffre d'affaires</h2>
          <p className="mt-1 text-sm text-slate-500">Revenus journaliers · FCFA</p>
          {series.length === 0 ? (
            <p className="mt-8 text-sm text-slate-400">Données indisponibles.</p>
          ) : (
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(15, 23, 42, 0.06)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    interval={days > 14 ? 4 : 0}
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} width={48} />
                  <Tooltip
                    cursor={{ fill: "rgba(10, 37, 64, 0.04)" }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const row = payload[0].payload as {
                        label: string;
                        revenue: number;
                        orderCount: number;
                      };
                      return (
                        <div className="rounded-lg border border-slate-100 bg-white px-3 py-2 text-xs text-bibocom-primary shadow-xl">
                          <p className="font-medium">{row.label}</p>
                          <p className="text-bibocom-accent">Revenu : {formatFcfa(row.revenue)}</p>
                          <p className="text-slate-500">{row.orderCount} commande(s)</p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="revenue" fill="#FF7E5F" radius={[6, 6, 0, 0]} maxBarSize={42} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      <div>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
          Activité de la boutique
        </h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <Package className="h-4 w-4 text-slate-400" />
              <h3 className="text-lg font-semibold">Statuts commandes</h3>
            </div>
            <ul className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-1">
              {[
                ["En attente", stats.pendingOrders],
                ["Confirmées", stats.confirmedOrders],
                ["Expédiées", stats.shippedOrders],
                ["Livrées", stats.deliveredOrders],
                ["Annulées", stats.canceledOrders],
              ].map(([label, value]) => (
                <li key={String(label)} className="flex justify-between rounded-lg bg-bibocom-light px-3 py-2">
                  <span className="text-slate-500">{label}</span>
                  <span className="font-semibold">{value}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <div className="mb-4 flex items-center gap-2">
              <Store className="h-4 w-4 text-slate-400" />
              <h3 className="text-lg font-semibold">Boutique</h3>
            </div>
            {shop ? (
              <ul className="space-y-3 text-sm">
                <li className="flex justify-between gap-3">
                  <span className="text-slate-500">Nom</span>
                  <span className="truncate font-semibold">{shop.name}</span>
                </li>
                <li className="flex justify-between gap-3">
                  <span className="text-slate-500">Catégorie</span>
                  <span className="font-semibold">{shop.categorieShop?.name || "—"}</span>
                </li>
                <li className="flex justify-between gap-3">
                  <span className="text-slate-500">Adresse</span>
                  <span className="truncate text-right font-semibold">{shop.address || "—"}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-500">Vérifiée</span>
                  <span className="font-semibold">{shop.verifiedBadge ? "Oui" : "Non"}</span>
                </li>
              </ul>
            ) : (
              <p className="text-sm text-slate-400">Aucune boutique renseignée.</p>
            )}
          </Card>

          <Card>
            <div className="mb-4 flex items-center gap-2">
              <BadgeCheck className="h-4 w-4 text-slate-400" />
              <h3 className="text-lg font-semibold">Santé catalogue</h3>
            </div>
            <ul className="space-y-3 text-sm">
              <li className="flex justify-between">
                <span className="text-slate-500">Produits</span>
                <span className="font-semibold">{productStats?.totalProducts ?? "—"}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-slate-500">Stock bas (&lt; 10)</span>
                <span className="font-semibold">{productStats?.lowStockCount ?? "—"}</span>
              </li>
              {categories.length === 0 ? (
                <li className="text-slate-400">Aucune catégorie renseignée.</li>
              ) : (
                categories.slice(0, 4).map((row) => (
                  <li key={`${row.categorieProdId || row.category}-${row.count}`} className="flex justify-between">
                    <span className="truncate text-slate-500">{row.category}</span>
                    <span className="font-semibold">{row.count}</span>
                  </li>
                ))
              )}
            </ul>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <h3 className="text-lg font-semibold">Top produits</h3>
          {(stats.topProducts || []).length === 0 ? (
            <p className="mt-4 text-sm text-slate-400">Aucun produit vendu pour le moment.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {stats.topProducts.map((item, index) => (
                <li key={item.productId ?? item.product?.id ?? index} className="flex items-center gap-3">
                  {item.product?.images?.[0]?.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.product.images[0].imageUrl}
                      alt=""
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-bibocom-light">
                      <Package className="h-4 w-4 text-slate-400" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {item.productName || item.product?.name || "Produit"}
                    </p>
                    <p className="text-xs text-slate-400">
                      {item.totalSold} vendu(s) · {formatFcfa(item.totalRevenue)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <h3 className="text-lg font-semibold">Commandes récentes</h3>
          {(stats.recentOrders || []).length === 0 ? (
            <p className="mt-4 text-sm text-slate-400">Aucune commande récente.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {stats.recentOrders.map((order) => (
                <li key={order.id} className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">
                      #{order.id} · {order.clientName || "—"}
                    </p>
                    <p className="text-xs text-slate-400">
                      {orderStatusLabel(order.status)} · {formatDateFr(order.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{formatFcfa(order.totalAmount)}</span>
                    <GhostButton onClick={() => onOpenOrder(order.id)}>Détail</GhostButton>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
      </div>

      <aside className="space-y-4">
        <section className="rounded-2xl bg-white p-4 ring-1 ring-slate-100">
          <div className="flex items-center gap-3">
            {shopLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={shopLogo} alt="" className="h-12 w-12 rounded-full object-cover" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-50 text-bibocom-accent">
                <Store className="h-5 w-5" />
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate font-semibold">{displayName || "Commerçant"}</p>
              <p className="truncate text-sm text-slate-500">{shop?.name || "Sans boutique"}</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-500">Chiffre d’affaires</p>
          <p className="text-xl font-semibold">{formatFcfa(stats.totalRevenue)}</p>
          <p className="mt-1 text-xs text-slate-400">
            Badge boutique : {shop?.verifiedBadge ? "actif" : "inactif"}
          </p>
          <button
            type="button"
            onClick={() => onOpenSection("badge")}
            className="mt-4 w-full rounded-full bg-bibocom-accent px-4 py-2 text-sm font-semibold text-white"
          >
            {shop?.verifiedBadge ? "Gérer le badge" : "Obtenir le badge"}
          </button>
        </section>

        <section className="rounded-2xl bg-white p-4 ring-1 ring-slate-100">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Mes commandes</h3>
            <button type="button" onClick={() => onOpenSection("orders")} className="text-sm text-bibocom-accent">
              Voir tout
            </button>
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            {[
              ["En attente", stats.pendingOrders],
              ["Confirmées", stats.confirmedOrders],
              ["Expédiées", stats.shippedOrders],
              ["Livrées", stats.deliveredOrders],
              ["Annulées", stats.canceledOrders],
            ].map(([label, value]) => (
              <li key={String(label)} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                <span className="text-slate-500">{label}</span>
                <span className="font-semibold">{value}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl bg-white p-4 ring-1 ring-slate-100">
          <h3 className="font-semibold">Raccourcis</h3>
          <div className="mt-3 grid gap-2">
            {(
              [
                ["products", "Mes produits"],
                ["comptoir", "Vente au comptoir"],
                ["boutique", "Ma boutique"],
                ["messages", "Messagerie"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => onOpenSection(id)}
                className="rounded-xl bg-slate-50 px-3 py-2 text-left text-sm font-medium hover:bg-orange-50 hover:text-bibocom-accent"
              >
                {label}
              </button>
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
}
