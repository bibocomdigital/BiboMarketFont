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
import { BadgeCheck, MapPin, Users } from "lucide-react";
import type { AdminDashboard } from "@/services/adminService";
import {
  ROLE_ORDER,
  formatDateFr,
  formatFcfa,
  monthLabel,
  orderStatusLabel,
  paymentLabel,
  roleLabel,
} from "@/lib/admin-analytics";
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
      <p className="text-sm text-white/55">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      {hint ? <p className="mt-1 text-xs text-white/40">{hint}</p> : null}
    </Card>
  );
}

type AdminOverviewProps = {
  data?: AdminDashboard;
  loading: boolean;
  error: unknown;
  months: number;
  onMonthsChange: (months: number) => void;
  onOpenOrder: (id: number) => void;
};

export function AdminOverview({
  data,
  loading,
  error,
  months,
  onMonthsChange,
  onOpenOrder,
}: AdminOverviewProps) {
  if (loading && !data) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="h-28 animate-pulse rounded-2xl bg-[#221e30]" />
        <div className="h-28 animate-pulse rounded-2xl bg-[#221e30]" />
        <div className="h-72 animate-pulse rounded-2xl bg-[#221e30]" />
        <div className="h-72 animate-pulse rounded-2xl bg-[#221e30]" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <Card>
        <p className="text-sm text-white/60">{queryErrorMessage(error)}</p>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <p className="text-sm text-white/45">Données indisponibles.</p>
      </Card>
    );
  }

  const kpis = data.kpis;
  const registrations = (data.charts?.registrations || []).map((row) => ({
    ...row,
    label: monthLabel(row.month),
  }));
  const revenue = (data.charts?.revenue || []).map((row) => ({
    ...row,
    label: monthLabel(row.month),
  }));
  const roles = kpis.usersByRole || { ADMIN: 0, MERCHANT: 0, CLIENT: 0, SUPPLIER: 0 };
  const cities = data.demographics?.cities || [];
  const payments = kpis.paymentMethods || { CASH_ON_DELIVERY: 0, MOBILE_MONEY: 0 };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <div className="flex rounded-xl bg-[#221e30] p-1">
          {[6, 12].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => onMonthsChange(value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                months === value ? "bg-[#7ee8d8] text-[#12101a]" : "text-white/60"
              }`}
            >
              {value} mois
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Utilisateurs" value={kpis.totalUsers} hint={`${roles.CLIENT} client(s)`} />
        <Kpi label="Boutiques" value={kpis.totalShops} hint={`${kpis.activeShops} active(s)`} />
        <Kpi label="CA total" value={formatFcfa(kpis.totalRevenue)} hint="Commandes confirmées, expédiées, livrées" />
        <Kpi label="Commandes" value={kpis.totalOrders} hint={`${kpis.pendingOrders} en attente`} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card className="min-h-[320px]">
          <h2 className="text-lg font-semibold text-[#8eb4ff]">Inscriptions utilisateurs</h2>
          <p className="mt-1 text-sm text-white/45">Évolution sur {data.periodMonths} mois</p>
          {registrations.length === 0 ? (
            <p className="mt-8 text-sm text-white/45">Aucune inscription sur la période.</p>
          ) : (
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={registrations} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="inscriptionsFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6b9aff" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#6b9aff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }} axisLine={false} tickLine={false} width={36} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const row = payload[0].payload as { label: string; count: number };
                      return (
                        <div className="rounded-lg border border-white/10 bg-[#1a1628] px-3 py-2 text-xs text-white shadow-xl">
                          <p className="font-medium">{row.label}</p>
                          <p className="text-[#8eb4ff]">Inscriptions : {row.count}</p>
                        </div>
                      );
                    }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#6b9aff" strokeWidth={2.5} fill="url(#inscriptionsFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card className="min-h-[320px]">
          <h2 className="text-lg font-semibold text-[#4ade80]">CA plateforme</h2>
          <p className="mt-1 text-sm text-white/45">Revenus mensuels · FCFA</p>
          {revenue.length === 0 ? (
            <p className="mt-8 text-sm text-white/45">Données indisponibles.</p>
          ) : (
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenue} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }} axisLine={false} tickLine={false} width={48} />
                  <Tooltip
                    cursor={{ fill: "rgba(255,255,255,0.04)" }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const row = payload[0].payload as {
                        label: string;
                        revenue: number;
                        orderCount: number;
                      };
                      return (
                        <div className="rounded-lg border border-white/10 bg-[#1a1628] px-3 py-2 text-xs text-white shadow-xl">
                          <p className="font-medium">{row.label}</p>
                          <p className="text-[#4ade80]">Revenu : {formatFcfa(row.revenue)}</p>
                          <p className="text-white/60">{row.orderCount} commande(s)</p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="revenue" fill="#4ade80" radius={[6, 6, 0, 0]} maxBarSize={42} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      <div>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-white/70">
          Activité de la marketplace
        </h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <Users className="h-4 w-4 text-white/50" />
              <h3 className="text-lg font-semibold">Répartition par rôle</h3>
            </div>
            <ul className="space-y-3">
              {ROLE_ORDER.map((role) => (
                <li key={role} className="flex items-center justify-between text-sm">
                  <span className="text-white/65">{roleLabel(role)}</span>
                  <span className="font-semibold">{roles[role] ?? 0}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <div className="mb-4 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-white/50" />
              <h3 className="text-lg font-semibold">Villes</h3>
            </div>
            {cities.length === 0 ? (
              <p className="text-sm text-white/45">Aucune ville renseignée.</p>
            ) : (
              <ul className="space-y-3">
                {cities.map((row) => (
                  <li key={`${row.city}-${row.country}`} className="flex items-center justify-between text-sm">
                    <span className="text-white/65">
                      {row.city}
                      {row.country ? ` · ${row.country}` : ""}
                    </span>
                    <span className="font-semibold">{row.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <div className="mb-4 flex items-center gap-2">
              <BadgeCheck className="h-4 w-4 text-white/50" />
              <h3 className="text-lg font-semibold">Santé catalogue</h3>
            </div>
            <ul className="space-y-3 text-sm">
              <li className="flex justify-between">
                <span className="text-white/65">Boutiques actives</span>
                <span className="font-semibold">{kpis.activeShops}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-white/65">Boutiques vérifiées</span>
                <span className="font-semibold">{kpis.verifiedShops}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-white/65">Produits publiés</span>
                <span className="font-semibold">{kpis.publishedProducts}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-white/65">Stock bas (&lt; {kpis.lowStockThreshold})</span>
                <span className="font-semibold">{kpis.lowStockCount}</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="text-lg font-semibold">Modes de paiement</h3>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex justify-between">
              <span className="text-white/65">{paymentLabel("CASH_ON_DELIVERY")}</span>
              <span className="font-semibold">{payments.CASH_ON_DELIVERY ?? 0}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-white/65">{paymentLabel("MOBILE_MONEY")}</span>
              <span className="font-semibold">{payments.MOBILE_MONEY ?? 0}</span>
            </li>
          </ul>
        </Card>
        <Card>
          <h3 className="text-lg font-semibold">Statuts commandes</h3>
          <ul className="mt-4 grid grid-cols-2 gap-3 text-sm">
            {[
              ["En attente", kpis.pendingOrders],
              ["Confirmées", kpis.confirmedOrders],
              ["Expédiées", kpis.shippedOrders],
              ["Livrées", kpis.deliveredOrders],
              ["Annulées", kpis.canceledOrders],
            ].map(([label, value]) => (
              <li key={String(label)} className="flex justify-between rounded-lg bg-white/5 px-3 py-2">
                <span className="text-white/65">{label}</span>
                <span className="font-semibold">{value}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <h3 className="text-lg font-semibold">Top produits</h3>
          {(data.topProducts || []).length === 0 ? (
            <p className="mt-4 text-sm text-white/45">Aucun produit vendu sur les commandes soldées.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {data.topProducts.map((item) => (
                <li key={item.productId} className="flex items-center gap-3">
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.imageUrl} alt="" className="h-12 w-12 rounded-lg object-cover" />
                  ) : (
                    <div className="h-12 w-12 rounded-lg bg-white/10" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.productName}</p>
                    <p className="text-xs text-white/45">
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
          {(data.recentOrders || []).length === 0 ? (
            <p className="mt-4 text-sm text-white/45">Aucune commande récente.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {data.recentOrders.map((order) => (
                <li key={order.id} className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">
                      #{order.id} · {order.clientName || "—"}
                    </p>
                    <p className="text-xs text-white/45">
                      {orderStatusLabel(order.status)} · {paymentLabel(order.paymentMethod)} · {formatDateFr(order.createdAt)}
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
  );
}
