"use client";

import React, { useState } from "react";
import {
  Home,
  LayoutGrid,
  Package,
  ShoppingBag,
  MessageSquare,
  Store,
  Info,
  Mail,
  Menu,
  Search,
  Crown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUnreadMessagesQuery } from "@/hooks/queries/use-messages-query";
import { NavUnreadBadge } from "@/components/messages/NavUnreadBadge";
import { getPhotoUrl } from "@/services/authService";
import { USER_ROLE_LABELS, type UserRole } from "@/types/user";

export type ClientSection =
  | "dashboard"
  | "categories"
  | "products"
  | "orders"
  | "messages"
  | "boutiques"
  | "about"
  | "contact";

const NAV_ITEMS: Array<{
  id: ClientSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: "dashboard", label: "Accueil", icon: Home },
  { id: "categories", label: "Catégories", icon: LayoutGrid },
  { id: "products", label: "Produits", icon: Package },
  { id: "orders", label: "Commandes", icon: ShoppingBag },
  { id: "messages", label: "Messages", icon: MessageSquare },
  { id: "boutiques", label: "Boutique", icon: Store },
  { id: "about", label: "À propos", icon: Info },
  { id: "contact", label: "Contact", icon: Mail },
];

const TITLES: Record<ClientSection, string> = {
  dashboard: "Tableau de bord",
  categories: "Catégories",
  products: "Produits",
  orders: "Mes commandes",
  messages: "Messages",
  boutiques: "Boutiques",
  about: "À propos",
  contact: "Contact",
};

const SUBTITLES: Partial<Record<ClientSection, string>> = {
  dashboard: "Suivez vos commandes, vos favoris et vos échanges",
  messages: "Échangez avec vos clients et gérez vos conversations",
  orders: "Consultez et suivez vos commandes",
  products: "Découvrez les produits de la marketplace",
  boutiques: "Explorez les boutiques partenaires",
};

type ClientShellProps = {
  section: ClientSection;
  onSectionChange: (section: ClientSection) => void;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
  displayName: string;
  roleLabel: string;
  photo?: string | null;
  headerExtra?: React.ReactNode;
  onSearch?: (query: string) => void;
  onPremiumClick?: () => void;
  onProfileClick?: () => void;
  children: React.ReactNode;
};

function NavButton({
  item,
  active,
  badge = 0,
  onClick,
}: {
  item: (typeof NAV_ITEMS)[number];
  active: boolean;
  badge?: number;
  onClick: () => void;
}) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={badge > 0 ? `${item.label}, ${badge} non lu${badge > 1 ? "s" : ""}` : item.label}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? "bg-bibocom-accent text-white shadow-sm"
          : "text-slate-500 hover:bg-slate-50 hover:text-bibocom-primary"
      )}
    >
      <span className="relative shrink-0">
        <Icon className="h-4 w-4" />
      </span>
      <span className="flex-1 text-left">{item.label}</span>
      <NavUnreadBadge count={badge} collapsed={false} tone={active ? "onAccent" : "accent"} />
    </button>
  );
}

function SidebarBody({
  section,
  onSectionChange,
  onPremiumClick,
}: {
  section: ClientSection;
  onSectionChange: (section: ClientSection) => void;
  onPremiumClick?: () => void;
}) {
  const { data: unreadCount = 0 } = useUnreadMessagesQuery();
  return (
    <div className="flex h-full flex-col bg-white">
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pt-4">
        {NAV_ITEMS.map((item) => (
          <NavButton
            key={item.id}
            item={item}
            active={section === item.id}
            badge={item.id === "messages" ? unreadCount : 0}
            onClick={() => onSectionChange(item.id)}
          />
        ))}
      </nav>
      <div className="px-3 pb-4">
        <div className="rounded-[18px] bg-gradient-to-br from-bibocom-accent/15 to-orange-50 p-4 ring-1 ring-bibocom-accent/10">
          <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-bibocom-accent/15 text-bibocom-accent">
            <Crown className="h-4 w-4" />
          </div>
          <p className="text-sm font-semibold text-bibocom-primary">Passez à la version Premium</p>
          <p className="mt-1 text-xs text-slate-500">Plus de visibilité, plus de ventes !</p>
          <button
            type="button"
            onClick={onPremiumClick}
            className="mt-3 w-full rounded-full bg-bibocom-accent px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-bibocom-accent/90"
          >
            Découvrir
          </button>
        </div>
        <p className="mt-3 flex items-center gap-2 px-1 text-xs text-slate-400">
          <span className="h-2 w-2 rounded-full bg-bibocom-success" />
          En ligne
        </p>
      </div>
    </div>
  );
}

export function ClientShell({
  section,
  onSectionChange,
  mobileOpen,
  onMobileOpenChange,
  displayName,
  roleLabel,
  photo,
  headerExtra,
  onSearch,
  onPremiumClick,
  onProfileClick,
  children,
}: ClientShellProps) {
  const [query, setQuery] = useState("");
  const isMessages = section === "messages";
  const src = photo ? getPhotoUrl(photo) : "";
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "C";

  return (
    <div className="min-h-dvh bg-[#f6f8fb] text-bibocom-primary">
      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/95 backdrop-blur">
        <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-bibocom-primary md:hidden"
            onClick={() => onMobileOpenChange(true)}
            aria-label="Ouvrir le menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <p className="shrink-0 text-lg font-bold tracking-tight sm:text-xl">
            BIBOCOM<span className="text-bibocom-accent">MARKET</span>
          </p>
          <form
            className="relative mx-auto hidden min-w-0 max-w-xl flex-1 md:block"
            onSubmit={(event) => {
              event.preventDefault();
              onSearch?.(query.trim());
            }}
          >
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher un produit, une commande, un client..."
              className="w-full rounded-full border border-slate-200 bg-slate-50 py-2.5 pl-11 pr-4 text-sm text-bibocom-primary outline-none placeholder:text-slate-400 focus:border-bibocom-accent/40 focus:bg-white focus:ring-2 focus:ring-bibocom-accent/15"
            />
          </form>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            {headerExtra}
            <button
              type="button"
              onClick={onProfileClick}
              className="hidden items-center gap-2 rounded-full p-1 text-left hover:bg-slate-50 sm:flex"
            >
              <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-bibocom-accent/10 text-xs font-semibold text-bibocom-accent">
                {src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={src} alt="" className="h-full w-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <div className="hidden leading-tight lg:block">
                <p className="max-w-[140px] truncate text-sm font-semibold">{displayName || "Client"}</p>
                <p className="text-[11px] text-slate-400">{roleLabel}</p>
              </div>
            </button>
          </div>
        </div>
        <form
          className="px-4 pb-3 md:hidden"
          onSubmit={(event) => {
            event.preventDefault();
            onSearch?.(query.trim());
          }}
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher..."
              className="w-full rounded-full border border-slate-200 bg-slate-50 py-2.5 pl-11 pr-4 text-sm outline-none placeholder:text-slate-400"
            />
          </div>
        </form>
      </header>

      <aside className="fixed bottom-0 left-0 top-[65px] z-30 hidden w-[248px] border-r border-slate-100 bg-white md:block">
        <SidebarBody
          section={section}
          onSectionChange={onSectionChange}
          onPremiumClick={onPremiumClick}
        />
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-bibocom-primary/40"
            aria-label="Fermer le menu"
            onClick={() => onMobileOpenChange(false)}
          />
          <aside className="relative z-10 h-full w-[248px] bg-white shadow-2xl">
            <div className="border-b border-slate-100 px-4 py-4">
              <p className="text-sm font-bold">
                BIBOCOM<span className="text-bibocom-accent">MARKET</span>
              </p>
            </div>
            <SidebarBody
              section={section}
              onSectionChange={(next) => {
                onSectionChange(next);
                onMobileOpenChange(false);
              }}
              onPremiumClick={() => {
                onPremiumClick?.();
                onMobileOpenChange(false);
              }}
            />
          </aside>
        </div>
      ) : null}

      <div className="md:pl-[248px]">
        <div
          className={cn(
            "flex flex-col",
            isMessages ? "h-[calc(100dvh-65px)] overflow-hidden" : "min-h-[calc(100dvh-65px)]"
          )}
        >
          {!isMessages ? (
            <div className="px-4 pb-2 pt-6 sm:px-6 lg:px-8">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{TITLES[section]}</h1>
              {SUBTITLES[section] ? (
                <p className="mt-1 text-sm text-slate-500">{SUBTITLES[section]}</p>
              ) : null}
            </div>
          ) : (
            <div className="px-4 pb-2 pt-5 sm:px-6 lg:px-8">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{TITLES.messages}</h1>
              <p className="mt-1 text-sm text-slate-500">{SUBTITLES.messages}</p>
            </div>
          )}
          <main
            className={cn(
              isMessages
                ? "flex min-h-0 flex-1 flex-col overflow-hidden px-4 pb-4 sm:px-6 lg:px-8"
                : "flex-1 px-4 pb-10 pt-2 sm:px-6 lg:px-8"
            )}
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

export function clientRoleLabel(role?: string) {
  const key = String(role || "CLIENT").toUpperCase() as UserRole;
  return USER_ROLE_LABELS[key] || "Client";
}
