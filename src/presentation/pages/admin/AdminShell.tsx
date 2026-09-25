"use client";

import React from "react";
import {
  LayoutDashboard,
  Users,
  Store,
  Package,
  ShoppingBag,
  Star,
  Tags,
  MessageSquare,
  BadgeCheck,
  Clapperboard,
  Megaphone,
  LifeBuoy,
  Wallet,
  Shield,
  LogOut,
  ChevronLeft,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUnreadMessagesQuery } from "@/hooks/queries/use-messages-query";
import { NavUnreadBadge } from "@/components/messages/NavUnreadBadge";

export type AdminSection =
  | "dashboard"
  | "users"
  | "shops"
  | "products"
  | "orders"
  | "messages"
  | "feedbacks"
  | "categories"
  | "stories"
  | "reports"
  | "ads"
  | "tickets"
  | "finance"
  | "security"
  | "badge";

export type AdminAudience = "super" | "admin" | "moderator";

const NAV_ITEMS: Array<{
  id: AdminSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "users", label: "Utilisateurs", icon: Users },
  { id: "shops", label: "Boutiques", icon: Store },
  { id: "products", label: "Produits", icon: Package },
  { id: "orders", label: "Commandes", icon: ShoppingBag },
  { id: "messages", label: "Messages", icon: MessageSquare },
  { id: "feedbacks", label: "Avis", icon: Star },
  { id: "categories", label: "Catégories", icon: Tags },
  { id: "stories", label: "Stories", icon: Clapperboard },
  { id: "reports", label: "Signalements", icon: Clapperboard },
  { id: "ads", label: "Publicités", icon: Megaphone },
  { id: "tickets", label: "Support", icon: LifeBuoy },
  { id: "finance", label: "Finances", icon: Wallet },
  { id: "security", label: "Sécurité", icon: Shield },
  { id: "badge", label: "Badge", icon: BadgeCheck },
];

const MODERATOR_SECTIONS = new Set<AdminSection>(["shops", "products", "stories", "reports", "messages", "security"]);

const TITLES: Record<AdminSection, string> = {
  dashboard: "Dashboard analytique",
  users: "Utilisateurs",
  shops: "Boutiques",
  products: "Produits",
  orders: "Commandes",
  messages: "Messages",
  feedbacks: "Avis commerçants",
  categories: "Catégories",
  stories: "Stories",
  reports: "Signalements",
  ads: "Publicités",
  tickets: "Support",
  finance: "Finances badges",
  security: "Double authentification",
  badge: "Badge et formules",
};

const SUBTITLES: Partial<Record<AdminSection, string>> = {
  messages: "Échangez avec les commerçants de la plateforme",
  badge: "Prix commerçant, prix livreur et formules des boutiques",
};

type AdminShellProps = {
  section: AdminSection;
  onSectionChange: (section: AdminSection) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
  displayName: string;
  audience: AdminAudience;
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
          ? "bg-[#7ee8d8] text-[#12101a]"
          : "text-white/70 hover:bg-white/5 hover:text-white"
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
  audience,
  onSectionChange,
  onLogout,
  onToggleCollapsed,
  showCollapse,
}: {
  collapsed: boolean;
  section: AdminSection;
  audience: AdminAudience;
  onSectionChange: (section: AdminSection) => void;
  onLogout: () => void;
  onToggleCollapsed?: () => void;
  showCollapse?: boolean;
}) {
  const { data: unreadCount = 0 } = useUnreadMessagesQuery();
  const items = NAV_ITEMS.filter((item) => {
    if (audience === "moderator") return MODERATOR_SECTIONS.has(item.id);
    if (item.id === "badge" || item.id === "finance") return audience === "super";
    return true;
  });
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
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2a2438] text-white/80 hover:bg-[#352f46]"
            aria-label={collapsed ? "Ouvrir le menu" : "Réduire le menu"}
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        {items.map((item) => (
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

      <div className="mt-auto border-t border-white/5 px-3 py-4">
        <button
          type="button"
          onClick={onLogout}
          title={collapsed ? "Déconnexion" : undefined}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/70 hover:bg-white/5 hover:text-white",
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

export function AdminShell({
  section,
  onSectionChange,
  collapsed,
  onToggleCollapsed,
  mobileOpen,
  onMobileOpenChange,
  displayName,
  audience,
  onLogout,
  headerExtra,
  children,
}: AdminShellProps) {
  const isMessages = section === "messages";
  return (
    <div className={cn("bg-[#16141f] text-white", isMessages ? "h-dvh overflow-hidden" : "min-h-screen")}>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden border-r border-white/5 bg-[#12101a] transition-[width] duration-200 md:block",
          collapsed ? "w-[72px]" : "w-[240px]"
        )}
      >
        <SidebarBody
          collapsed={collapsed}
          section={section}
          audience={audience}
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
            className="absolute inset-0 bg-black/50"
            aria-label="Fermer le menu"
            onClick={() => onMobileOpenChange(false)}
          />
          <aside className="relative z-50 h-full w-[240px] bg-[#12101a] shadow-2xl">
            <SidebarBody
              collapsed={false}
              audience={audience}
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
              className="mt-1 flex h-9 w-9 items-center justify-center rounded-lg bg-[#221e30] text-white md:hidden"
              onClick={() => onMobileOpenChange(true)}
              aria-label="Ouvrir le menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{TITLES[section]}</h1>
              {SUBTITLES[section] ? (
                <p className="mt-1 text-sm text-white/50">{SUBTITLES[section]}</p>
              ) : displayName ? (
                <p className="mt-1 text-sm text-white/50">{displayName}</p>
              ) : null}
            </div>
          </div>
          {headerExtra}
        </header>
        <main
          className={cn(
            isMessages
              ? "flex min-h-0 flex-1 flex-col overflow-hidden p-0"
              : "px-4 pb-10 pt-4 sm:px-6 lg:px-8"
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
