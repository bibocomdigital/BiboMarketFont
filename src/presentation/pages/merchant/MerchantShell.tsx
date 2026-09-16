"use client";

import React from "react";
import {
  LayoutDashboard,
  Store,
  Package,
  ShoppingBag,
  MessageSquare,
  User,
  LogOut,
  ChevronLeft,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUnreadMessagesQuery } from "@/hooks/queries/use-messages-query";
import { NavUnreadBadge } from "@/components/messages/NavUnreadBadge";

export type MerchantSection =
  | "dashboard"
  | "boutique"
  | "products"
  | "orders"
  | "messages"
  | "profile";

const NAV_ITEMS: Array<{
  id: MerchantSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "boutique", label: "Boutique", icon: Store },
  { id: "products", label: "Produits", icon: Package },
  { id: "orders", label: "Commandes", icon: ShoppingBag },
  { id: "messages", label: "Messages", icon: MessageSquare },
  { id: "profile", label: "Profil", icon: User },
];

const TITLES: Record<MerchantSection, string> = {
  dashboard: "Dashboard boutique",
  boutique: "Ma boutique",
  products: "Mes produits",
  orders: "Commandes reçues",
  messages: "Messages",
  profile: "Mon profil",
};

const SUBTITLES: Partial<Record<MerchantSection, string>> = {
  messages: "Échangez avec vos clients et gérez vos conversations",
};

type MerchantShellProps = {
  section: MerchantSection;
  onSectionChange: (section: MerchantSection) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
  displayName: string;
  onLogout: () => void;
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
          ? "bg-bibocom-accent text-white"
          : "text-white/70 hover:bg-white/10 hover:text-white"
      )}
    >
      <span className="relative shrink-0">
        <Icon className="h-4 w-4" />
        {collapsed ? <NavUnreadBadge count={badge} collapsed /> : null}
      </span>
      {!collapsed && (
        <>
          <span>{item.label}</span>
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
    <div className="flex h-full flex-col">
      <div className={cn("flex items-center px-4 pt-5 pb-6", collapsed ? "justify-center" : "justify-between")}>
        {!collapsed && (
          <p className="text-sm font-semibold tracking-wide text-white/90">Bibo Market</p>
        )}
        {showCollapse && onToggleCollapsed && (
          <button
            type="button"
            onClick={onToggleCollapsed}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/80 hover:bg-white/20"
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

      <div className="mt-auto border-t border-white/10 px-3 py-4">
        <button
          type="button"
          onClick={onLogout}
          title={collapsed ? "Déconnexion" : undefined}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/70 hover:bg-white/10 hover:text-white",
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
  onLogout,
  headerExtra,
  children,
}: MerchantShellProps) {
  const isMessages = section === "messages";
  return (
    <div
      className={cn(
        "bg-bibocom-light text-bibocom-primary",
        isMessages ? "h-dvh overflow-hidden" : "min-h-screen"
      )}
    >
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden border-r border-white/10 bg-bibocom-primary transition-[width] duration-200 md:block",
          collapsed ? "w-[72px]" : "w-[240px]"
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
            className="absolute inset-0 bg-bibocom-primary/50"
            aria-label="Fermer le menu"
            onClick={() => onMobileOpenChange(false)}
          />
          <aside className="relative z-50 h-full w-[240px] bg-bibocom-primary shadow-2xl">
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
          collapsed ? "md:pl-[72px]" : "md:pl-[240px]",
          isMessages ? "h-full min-h-0" : "min-h-screen"
        )}
      >
        <header className="flex shrink-0 flex-col gap-4 px-4 pb-2 pt-6 sm:flex-row sm:items-start sm:justify-between sm:px-6 lg:px-8">
          <div className="flex items-start gap-3">
            <button
              type="button"
              className="mt-1 flex h-9 w-9 items-center justify-center rounded-lg bg-white text-bibocom-primary shadow-sm md:hidden"
              onClick={() => onMobileOpenChange(true)}
              aria-label="Ouvrir le menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{TITLES[section]}</h1>
              {SUBTITLES[section] ? (
                <p className="mt-1 text-sm text-slate-500">{SUBTITLES[section]}</p>
              ) : displayName ? (
                <p className="mt-1 text-sm text-slate-500">{displayName}</p>
              ) : null}
            </div>
          </div>
          {headerExtra}
        </header>
        <main
          className={cn(
            isMessages
              ? "flex min-h-0 flex-1 flex-col overflow-hidden p-0"
              : "flex-1 px-4 pb-10 pt-4 sm:px-6 lg:px-8"
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
