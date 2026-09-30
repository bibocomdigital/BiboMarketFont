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
  ChevronLeft,
  Menu,
  Search,
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
        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
        collapsed && "justify-center px-0",
        active
          ? "bg-orange-50 text-bibocom-accent"
          : "text-slate-600 hover:bg-slate-50 hover:text-bibocom-primary"
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
  onToggleCollapsed,
  showCollapse,
}: {
  collapsed: boolean;
  section: MerchantSection;
  onSectionChange: (section: MerchantSection) => void;
  onLogout: () => void;
  onToggleCollapsed?: () => void;
  showCollapse?: boolean;
}) {
  const { data: unreadCount = 0 } = useUnreadMessagesQuery();
  return (
    <div className="flex h-full flex-col bg-white">
      <div className={cn("flex items-center gap-2 px-4 py-4", collapsed ? "justify-center" : "justify-between")}>
        {!collapsed && <AppLogo href={null} className="h-8 max-w-[150px]" />}
        {showCollapse && onToggleCollapsed && (
          <button
            type="button"
            onClick={onToggleCollapsed}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
            aria-label={collapsed ? "Ouvrir le menu" : "Réduire le menu"}
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        {NAV_ITEMS.map((item) => (
          <NavButton
            key={item.id}
            item={item}
            active={section === item.id}
            collapsed={collapsed}
            badge={item.id === "messages" ? unreadCount : 0}
            onClick={() => onSectionChange(item.id)}
          />
        ))}
      </nav>

      <div className="mt-auto border-t border-slate-100 px-3 py-4">
        <button
          type="button"
          onClick={onLogout}
          title={collapsed ? "Déconnexion" : undefined}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-500 hover:bg-slate-50 hover:text-bibocom-primary",
            collapsed && "justify-center px-0"
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Déconnexion</span>}
        </button>
      </div>
    </div>
  );
}

export function MerchantShell({
  section,
  onSectionChange,
  collapsed,
  onToggleCollapsed,
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
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden border-r border-slate-200 bg-white transition-[width] duration-200 md:block",
          collapsed ? "w-[72px]" : "w-[230px]"
        )}
      >
        <SidebarBody
          collapsed={collapsed}
          section={section}
          onSectionChange={onSectionChange}
          onLogout={onLogout}
          onToggleCollapsed={onToggleCollapsed}
          showCollapse
        />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-bibocom-primary/40"
            aria-label="Fermer le menu"
            onClick={() => onMobileOpenChange(false)}
          />
          <aside className="relative z-50 h-full w-[240px] border-r border-slate-200 bg-white shadow-2xl">
            <SidebarBody
              collapsed={false}
              section={section}
              onSectionChange={(next) => {
                onSectionChange(next);
                onMobileOpenChange(false);
              }}
              onLogout={onLogout}
            />
          </aside>
        </div>
      )}

      <div
        className={cn(
          "flex flex-col transition-[padding] duration-200",
          collapsed ? "md:pl-[72px]" : "md:pl-[230px]",
          isMessages ? "h-full min-h-0" : "min-h-screen"
        )}
      >
        <header className="sticky top-0 z-20 flex shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-bibocom-primary ring-1 ring-slate-200 md:hidden"
            onClick={() => onMobileOpenChange(true)}
            aria-label="Ouvrir le menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <AppLogo className="h-8 max-w-[140px] md:hidden" />
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
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-50 text-bibocom-accent">
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
        <main
          className={cn(
            isMessages
              ? "flex min-h-0 flex-1 flex-col overflow-hidden"
              : "flex-1 px-4 py-5 sm:px-6"
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
