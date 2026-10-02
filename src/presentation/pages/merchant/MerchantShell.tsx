"use client";

import React, { useState } from "react";
import {
  LayoutDashboard,
  Store,
  Package,
  ShoppingBag,
  Receipt,
  MessageSquare,
  User,
  BadgeCheck,
  LogOut,
  Menu,
  Search,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUnreadMessagesQuery } from "@/hooks/queries/use-messages-query";
import { NavUnreadBadge } from "@/components/messages/NavUnreadBadge";
import { AppLogo } from "@/components/brand/AppLogo";

export type MerchantSection =
  | "dashboard"
  | "boutique"
  | "products"
  | "comptoir"
  | "orders"
  | "messages"
  | "profile"
  | "badge";

const NAV_ITEMS: Array<{
  id: MerchantSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: "dashboard", label: "Accueil", icon: LayoutDashboard },
  { id: "products", label: "Produits", icon: Package },
  { id: "orders", label: "Mes commandes", icon: ShoppingBag },
  { id: "messages", label: "Messagerie", icon: MessageSquare },
  { id: "boutique", label: "Boutique", icon: Store },
  { id: "comptoir", label: "Comptoir", icon: Receipt },
  { id: "badge", label: "Badge", icon: BadgeCheck },
  { id: "profile", label: "Profil", icon: User },
];

const TITLES: Record<MerchantSection, string> = {
  dashboard: "Accueil",
  boutique: "Ma boutique",
  products: "Mes produits",
  comptoir: "Vente au comptoir",
  orders: "Mes commandes",
  messages: "Messagerie",
  profile: "Mon profil",
  badge: "Badge et stories",
};

type MerchantShellProps = {
  section: MerchantSection;
  onSectionChange: (section: MerchantSection) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
  displayName: string;
  photoUrl?: string | null;
  onLogout: () => void;
  onSearch?: (term: string) => void;
  headerExtra?: React.ReactNode;
  children: React.ReactNode;
};

function NavButton({
  item,
  active,
  collapsed,
  onClick,
  badge = 0,
}: {
  item: (typeof NAV_ITEMS)[number];
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
  badge?: number;
}) {
  const Icon = item.icon;
  const title =
    collapsed && badge > 0
      ? `${item.label} (${badge > 99 ? "99+" : badge} non lu${badge > 1 ? "s" : ""})`
      : collapsed
        ? item.label
        : undefined;
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={badge > 0 ? `${item.label}, ${badge} non lu${badge > 1 ? "s" : ""}` : item.label}
      className={cn(
        "flex w-full items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200",
        collapsed && "justify-center px-0",
        active
          ? "bg-bibocom-primary text-white shadow-sm"
          : "text-slate-600 hover:translate-x-0.5 hover:bg-orange-50 hover:text-bibocom-primary"
      )}
    >
      <span className="relative shrink-0">
        <Icon className="h-4 w-4" />
        {collapsed ? <NavUnreadBadge count={badge} collapsed /> : null}
      </span>
      {!collapsed && (
        <>
          <span className="truncate">{item.label}</span>
          <NavUnreadBadge count={badge} collapsed={false} />
        </>
      )}
    </button>
  );
}

function SidebarBody({
  collapsed,
  section,
  onSectionChange,
  onLogout,
}: {
  collapsed: boolean;
  section: MerchantSection;
  onSectionChange: (section: MerchantSection) => void;
  onLogout: () => void;
}) {
  const { data: unreadCount = 0 } = useUnreadMessagesQuery();
  const itemClass = cn(
    "flex w-full items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition-all duration-200 hover:translate-x-0.5 hover:bg-orange-50 hover:text-bibocom-primary",
    collapsed && "justify-center px-0"
  );
  return (
    <nav aria-label="Menu commerçant" className="rounded-[24px] bg-white p-3 shadow-[0_12px_40px_-24px_rgba(10,37,64,0.45)] ring-1 ring-slate-100">
      {!collapsed ? (
        <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Menu</p>
      ) : null}
      <ul className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <li key={item.id}>
            <NavButton
              item={item}
              active={section === item.id}
              collapsed={collapsed}
              badge={item.id === "messages" ? unreadCount : 0}
              onClick={() => onSectionChange(item.id)}
            />
          </li>
        ))}
      </ul>
      {!collapsed ? (
        <p className="mt-3 px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Options</p>
      ) : null}
      <ul className="mt-1 flex flex-col gap-1">
        <li>
          <button type="button" onClick={onLogout} title={collapsed ? "Déconnexion" : undefined} className={itemClass}>
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed ? <span>Déconnexion</span> : null}
          </button>
        </li>
      </ul>
    </nav>
  );
}

export function MerchantShell({
  section,
  onSectionChange,
  collapsed,
  mobileOpen,
  onMobileOpenChange,
  displayName,
  photoUrl,
  onLogout,
  onSearch,
  headerExtra,
  children,
}: MerchantShellProps) {
  const isMessages = section === "messages";
  const [term, setTerm] = useState("");

  return (
    <div
      className={cn(
        "bg-[#f6f7fb] text-bibocom-primary",
        isMessages ? "h-dvh overflow-hidden" : "min-h-screen"
      )}
    >
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-bibocom-primary/40"
            aria-label="Fermer le menu"
            onClick={() => onMobileOpenChange(false)}
          />
          <div className="relative flex h-full w-[min(100%,20rem)] max-w-full flex-col bg-[#f6f7fb] shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3">
              <p className="text-base font-semibold text-bibocom-primary">Menu</p>
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-bibocom-primary ring-1 ring-slate-200"
                onClick={() => onMobileOpenChange(false)}
                aria-label="Fermer le menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-6">
              <SidebarBody
                collapsed={false}
                section={section}
                onSectionChange={(next) => {
                  onSectionChange(next);
                  onMobileOpenChange(false);
                }}
                onLogout={onLogout}
              />
            </div>
          </div>
        </div>
      )}

      <div className={cn("flex min-h-dvh flex-col", isMessages && "h-dvh overflow-hidden")}>
        <header className="sticky top-0 z-30 flex shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-3 py-3 sm:px-4">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-bibocom-primary ring-1 ring-slate-200 md:hidden"
            onClick={() => onMobileOpenChange(true)}
            aria-label="Ouvrir le menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <AppLogo className="h-8 max-w-[120px] shrink-0" />
          <p className="hidden text-sm font-semibold text-bibocom-primary lg:block">{TITLES[section]}</p>
          <form
            className="relative min-w-0 flex-1"
            onSubmit={(event) => {
              event.preventDefault();
              onSearch?.(term.trim());
            }}
          >
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="Rechercher un produit"
              aria-label="Rechercher un produit"
              className="w-full rounded-full border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm outline-none focus:border-bibocom-accent focus:bg-white"
            />
          </form>
          <div className="flex shrink-0 items-center gap-2">
            {headerExtra}
            <button
              type="button"
              onClick={() => onSectionChange("profile")}
              className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-slate-50"
            >
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-bibocom-primary text-white">
                  <User className="h-4 w-4" />
                </span>
              )}
              <span className="hidden text-left lg:block">
                <span className="block max-w-[9rem] truncate text-sm font-semibold leading-tight">
                  {displayName || "Commerçant"}
                </span>
                <span className="block text-[11px] text-slate-400">Commerçant</span>
              </span>
            </button>
          </div>
        </header>
        <div
          className={cn(
            "grid min-w-0 flex-1 gap-3 px-3 py-3 md:grid-cols-[280px_minmax(0,1fr)] md:items-start",
            isMessages && "min-h-0"
          )}
        >
          <aside className="hidden self-start md:sticky md:top-20 md:z-20 md:block">
            <SidebarBody
              collapsed={collapsed}
              section={section}
              onSectionChange={onSectionChange}
              onLogout={onLogout}
            />
          </aside>
          <main
            className={cn(
              "min-w-0",
              isMessages ? "flex min-h-0 flex-col overflow-hidden" : "pb-6"
            )}
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
