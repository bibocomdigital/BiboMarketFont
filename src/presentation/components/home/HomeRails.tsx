"use client";

import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  LayoutGrid,
  Store,
  Clapperboard,
  Truck,
  Info,
  Mail,
  ShoppingCart,
  LogIn,
  UserPlus,
  Package,
  ArrowRight,
} from "lucide-react";
import { useAuthSession } from "@/hooks/use-auth-session";
import { useCart } from "@/components/CartContext";
import { cachedStories, listStories, storyDisplayUrl, type StoryItem } from "@/services/badgeService";
import { listDeliveryServices, type DeliveryService } from "@/services/platformService";
import { formatImageUrl } from "@/services/productService";

const MENU = [
  { to: "/", label: "Accueil", icon: Home, end: true },
  { to: "/boutique", label: "Boutiques", icon: Store },
  { to: "/stories", label: "Stories", icon: Clapperboard },
  { to: "/livraisons", label: "Livraisons", icon: Truck },
  { to: "/about", label: "À propos", icon: Info },
  { to: "/contact", label: "Contact", icon: Mail },
] as const;

function shopLabel(story: StoryItem): string {
  return (
    story.author.shop?.name ||
    `${story.author.firstName || ""} ${story.author.lastName || ""}`.trim() ||
    "Boutique"
  );
}

function storyGroups(stories: StoryItem[]) {
  const map = new Map<string, { key: string; name: string; logo: string | null }>();
  for (const story of stories) {
    const shopId = story.author.shop?.id;
    const key = shopId ? `shop-${shopId}` : `user-${story.author.id}`;
    if (map.has(key)) continue;
    const raw = formatImageUrl(story.author.shop?.logo || story.author.photo || null);
    map.set(key, {
      key,
      name: shopLabel(story),
      logo: raw ? storyDisplayUrl(raw, 96) : null,
    });
  }
  return [...map.values()].slice(0, 4);
}

export function HomeMenu({
  onNavigate,
  stacked = false,
}: {
  onNavigate?: () => void;
  stacked?: boolean;
}) {
  const location = useLocation();
  const { isAuthenticated, user, dashboardPath } = useAuthSession();
  const { itemsCount } = useCart();
  const role = (user?.role || "").toUpperCase();
  const isMerchant = role === "MERCHANT" || role === "COMMERCANT";
  const isSupplier = role === "SUPPLIER" || role === "FOURNISSEUR";

  const itemClass = (active: boolean) =>
    `flex items-center gap-2 whitespace-nowrap px-3 py-2 text-sm font-medium transition-all duration-200 ${
      stacked ? "w-full rounded-xl py-3" : "shrink-0 rounded-full md:w-full md:rounded-xl"
    } ${
      active
        ? "bg-bibocom-primary text-white shadow-sm"
        : "text-slate-600 hover:translate-x-0.5 hover:bg-orange-50 hover:text-bibocom-primary"
    }`;

  const listClass = stacked
    ? "flex flex-col gap-1"
    : "flex gap-1 overflow-x-auto [scrollbar-width:none] md:flex-col md:overflow-visible [&::-webkit-scrollbar]:hidden";

  return (
    <nav aria-label="Menu de l'accueil" className="rounded-[24px] bg-white p-3 shadow-[0_12px_40px_-24px_rgba(10,37,64,0.45)] ring-1 ring-slate-100">
      <p className={`${stacked ? "block" : "hidden md:block"} px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400`}>Menu</p>
      <ul className={listClass}>
        {MENU.map((item) => {
          const active = item.end ? location.pathname === item.to : location.pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <li key={item.to}>
              <Link to={item.to} className={itemClass(active)} aria-current={active ? "page" : undefined} onClick={onNavigate}>
                <Icon size={16} />
                {item.label}
              </Link>
            </li>
          );
        })}
        <li>
          <a href="#produits" className={itemClass(false)} onClick={onNavigate}>
            <LayoutGrid size={16} />
            Produits
          </a>
        </li>
      </ul>

      <p className={`${stacked ? "block" : "hidden md:block"} mt-3 px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400`}>Options</p>
      <ul className={stacked ? "mt-0 flex flex-col gap-1" : "mt-1 flex gap-1 overflow-x-auto [scrollbar-width:none] md:mt-0 md:flex-col md:overflow-visible [&::-webkit-scrollbar]:hidden"}>
        <li>
          <Link to="/cart" className={itemClass(location.pathname === "/cart")} onClick={onNavigate}>
            <ShoppingCart size={16} />
            Panier
            {itemsCount > 0 ? (
              <span className="ml-auto rounded-full bg-bibocom-accent px-1.5 text-[10px] font-semibold text-white">{itemsCount}</span>
            ) : null}
          </Link>
        </li>
        {isAuthenticated ? (
          <li>
            <Link to={dashboardPath} className={itemClass(false)} onClick={onNavigate}>
              <Package size={16} />
              Mon espace
            </Link>
          </li>
        ) : (
          <>
            <li>
              <Link to="/login" className={itemClass(location.pathname === "/login")} onClick={onNavigate}>
                <LogIn size={16} />
                Se connecter
              </Link>
            </li>
            <li>
              <Link to="/register?role=client" className={itemClass(false)} onClick={onNavigate}>
                <UserPlus size={16} />
                S'inscrire
              </Link>
            </li>
          </>
        )}
        {isMerchant ? null : (
          <li>
            <Link to="/register?role=merchant" className={itemClass(false)} onClick={onNavigate}>
              <Store size={16} />
              Créer une boutique
            </Link>
          </li>
        )}
        {isSupplier ? null : (
          <li>
            <Link to="/register?role=supplier" className={itemClass(false)} onClick={onNavigate}>
              <Truck size={16} />
              Proposer une livraison
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
}

export function HomeRightRail() {
  const { isAuthenticated } = useAuthSession();
  const [stories, setStories] = useState<StoryItem[] | null>(() => cachedStories());
  const [services, setServices] = useState<DeliveryService[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const hadCache = Boolean(cachedStories());
    listStories(hadCache)
      .then((rows) => {
        if (!cancelled) setStories(rows);
      })
      .catch(() => {
        if (!cancelled) setStories((current) => current ?? []);
      });
    listDeliveryServices()
      .then((rows) => {
        if (!cancelled) setServices(Array.isArray(rows) ? rows : []);
      })
      .catch(() => {
        if (!cancelled) setServices([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const groups = storyGroups(stories ?? []);
  const deliveries = (services ?? []).slice(0, 3);
  const storiesReady = stories !== null;
  const servicesReady = services !== null;

  return (
    <div className="space-y-3">
      {!isAuthenticated ? (
        <section className="overflow-hidden rounded-[24px] bg-bibocom-primary p-4 text-white shadow-[0_12px_40px_-24px_rgba(10,37,64,0.55)]">
          <p className="text-sm font-semibold">Commandez avec un compte</p>
          <p className="mt-1 text-xs leading-relaxed text-white/75">
            Le paiement des produits se fait à la livraison. Créez un compte pour remplir le panier.
          </p>
          <div className="mt-3 flex gap-2">
            <Link to="/login" className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-bibocom-primary">
              Se connecter
            </Link>
            <Link to="/register?role=client" className="rounded-full bg-bibocom-accent px-3 py-1.5 text-xs font-semibold text-white">
              S'inscrire
            </Link>
          </div>
        </section>
      ) : null}

      <section className="rounded-[24px] bg-white p-4 shadow-[0_12px_40px_-24px_rgba(10,37,64,0.45)] ring-1 ring-slate-100">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-bibocom-primary">Stories</h2>
          <Link to="/stories" className="inline-flex items-center gap-1 text-xs font-medium text-bibocom-accent">
            Voir <ArrowRight size={12} />
          </Link>
        </div>
        {!storiesReady ? (
          <div className="flex justify-center py-6">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-bibocom-accent border-t-transparent" role="status" aria-label="Chargement des stories" />
          </div>
        ) : groups.length === 0 ? (
          <p className="mt-3 text-xs text-slate-500">Aucune story publiée pour le moment.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {groups.map((group) => (
              <li key={group.key}>
                <Link to="/stories" className="flex items-center gap-3 rounded-2xl px-1 py-1 transition-colors hover:bg-orange-50">
                  <span className="rounded-full bg-bibocom-accent p-[2px]">
                    {group.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={group.logo} alt="" className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-bibocom-primary text-[10px] font-semibold text-white">
                        {group.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </span>
                  <span className="min-w-0 truncate text-sm font-medium text-bibocom-primary">{group.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-[24px] bg-white p-4 shadow-[0_12px_40px_-24px_rgba(10,37,64,0.45)] ring-1 ring-slate-100">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-bibocom-primary">Livraisons</h2>
          <Link to="/livraisons" className="inline-flex items-center gap-1 text-xs font-medium text-bibocom-accent">
            Voir <ArrowRight size={12} />
          </Link>
        </div>
        {!servicesReady ? (
          <div className="flex justify-center py-6">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-bibocom-accent border-t-transparent" role="status" aria-label="Chargement des livraisons" />
          </div>
        ) : deliveries.length === 0 ? (
          <p className="mt-3 text-xs text-slate-500">Aucun service de livraison publié pour le moment.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {deliveries.map((service) => (
              <li key={service.id}>
                <Link to="/livraisons" className="block rounded-2xl bg-slate-50 px-3 py-2 transition-colors hover:bg-orange-50">
                  <span className="flex items-start justify-between gap-2">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-bibocom-primary">{service.name}</span>
                      <span className="mt-0.5 block truncate text-[11px] text-slate-500">{service.zone || "Zone au choix du fournisseur"}</span>
                    </span>
                    <span className="shrink-0 text-xs font-semibold text-bibocom-accent">{Math.round(service.price).toLocaleString("fr-FR")} F</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
