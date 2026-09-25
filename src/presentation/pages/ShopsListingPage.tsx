"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useShopsQuery } from "@/hooks/queries/use-shops-query";
import { useShopCategoriesQuery } from "@/hooks/queries/use-shop-categories-query";
import { ServiceUnavailableState } from "@/components/feedback/ServiceUnavailableState";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { VoirPlusButton } from "@/components/ui/voir-plus-button";
import { formatImageUrl, type Shop } from "@/services/shopService";
import { cn } from "@/lib/utils";
import {
  Search,
  Store,
  MapPin,
  Phone,
  Grid,
  List,
  X,
  ChevronRight,
} from "lucide-react";

const PAGE_SIZE = 12;

function merchantName(shop: Shop): string {
  const person = shop.user ?? shop.owner;
  return `${person?.firstName || ""} ${person?.lastName || ""}`.trim();
}

function matchesShopQuery(shop: Shop, raw: string): boolean {
  const term = raw.trim().toLowerCase();
  if (!term) return true;
  const person = shop.user ?? shop.owner;
  const haystack = [shop.name, person?.firstName, person?.lastName, merchantName(shop)]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return term.split(/\s+/).every((word) => haystack.includes(word));
}

function ShopLogo({ shop, size }: { shop: Shop; size: "card" | "list" }) {
  const logo = formatImageUrl(shop.logo);
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden bg-bibocom-light ring-1 ring-slate-100",
        size === "card" ? "h-24 w-24 rounded-full" : "h-14 w-14 rounded-xl"
      )}
    >
      {logo ? (
        <img src={logo} alt="" className="h-full w-full object-contain" />
      ) : (
        <Store className={size === "card" ? "h-9 w-9 text-bibocom-primary/50" : "h-6 w-6 text-bibocom-primary/50"} />
      )}
    </div>
  );
}

function ShopMeta({ shop, align }: { shop: Shop; align: "center" | "start" }) {
  return (
    <div
      className={cn(
        "flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500",
        align === "center" ? "justify-center" : "justify-start"
      )}
    >
      {shop.address ? (
        <span className="inline-flex min-w-0 items-center gap-1.5">
          <MapPin size={14} className="shrink-0 text-bibocom-accent" />
          <span className="truncate">{shop.address}</span>
        </span>
      ) : null}
      {shop.phoneNumber ? (
        <a
          href={`tel:${shop.phoneNumber}`}
          onClick={(event) => event.stopPropagation()}
          className="inline-flex items-center gap-1.5 hover:text-bibocom-accent"
        >
          <Phone size={14} className="shrink-0 text-bibocom-accent" />
          {shop.phoneNumber}
        </a>
      ) : null}
    </div>
  );
}

function openOnKey(event: React.KeyboardEvent, onOpen: () => void) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    onOpen();
  }
}

function ShopGridCard({ shop, onOpen }: { shop: Shop; onOpen: (id: number) => void }) {
  const merchant = merchantName(shop);
  return (
    <article
      role="link"
      tabIndex={0}
      onClick={() => onOpen(shop.id)}
      onKeyDown={(event) => openOnKey(event, () => onOpen(shop.id))}
      className="group flex h-full cursor-pointer flex-col items-center rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-bibocom-accent/40"
    >
      <ShopLogo shop={shop} size="card" />
      <h2 className="mt-4 text-lg font-semibold text-bibocom-primary group-hover:text-bibocom-accent">
        {shop.name}
      </h2>
      {merchant ? <p className="mt-1 text-sm text-slate-500">{merchant}</p> : null}
      {shop.description ? (
        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-600">{shop.description}</p>
      ) : null}
      <div className="mt-4">
        <ShopMeta shop={shop} align="center" />
      </div>
      <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-bibocom-accent">
        Voir la boutique
        <ChevronRight size={16} />
      </span>
    </article>
  );
}

function ShopListRow({ shop, onOpen }: { shop: Shop; onOpen: (id: number) => void }) {
  const merchant = merchantName(shop);
  return (
    <article
      role="link"
      tabIndex={0}
      onClick={() => onOpen(shop.id)}
      onKeyDown={(event) => openOnKey(event, () => onOpen(shop.id))}
      className="group flex cursor-pointer items-center gap-4 rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-slate-100 transition hover:shadow-md hover:ring-bibocom-accent/40"
    >
      <ShopLogo shop={shop} size="list" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <h2 className="truncate text-base font-semibold text-bibocom-primary group-hover:text-bibocom-accent">
            {shop.name}
          </h2>
          {merchant ? <span className="truncate text-sm text-slate-500">{merchant}</span> : null}
        </div>
        {shop.description ? (
          <p className="mt-1 line-clamp-1 text-sm text-slate-600">{shop.description}</p>
        ) : null}
        <div className="mt-2">
          <ShopMeta shop={shop} align="start" />
        </div>
      </div>
      <span className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-bibocom-accent sm:inline-flex">
        Voir
        <ChevronRight size={16} />
      </span>
    </article>
  );
}

const ShopsListingPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { data: shopsData, isPending, isError, isFetching, refetch } = useShopsQuery();
  const { data: categories = [] } = useShopCategoriesQuery();
  const shops = Array.isArray(shopsData) ? shopsData : [];
  const isLoading = isPending && shops.length === 0;
  const isUnavailable = isError && shops.length === 0;

  const queryFromUrl = searchParams.get("q") ?? searchParams.get("search") ?? "";
  const [searchTerm, setSearchTerm] = useState(queryFromUrl);
  const writtenQuery = useRef(queryFromUrl.trim());
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const categoryShopIdParam = searchParams.get("categorieShopId");
  const categoryShopId = categoryShopIdParam ? Number(categoryShopIdParam) : NaN;
  const activeCategory = categories.find((category) => category.id === categoryShopId) ?? null;

  const filteredShops = useMemo(() => {
    let filtered = [...shops];

    if (!Number.isNaN(categoryShopId)) {
      const hasCategoryField = shops.some(
        (shop) => shop.categorieShopId != null || shop.categorieShop?.id != null
      );
      if (hasCategoryField) {
        filtered = filtered.filter(
          (shop) => (shop.categorieShopId ?? shop.categorieShop?.id) === categoryShopId
        );
      }
    }

    filtered = filtered.filter((shop) => matchesShopQuery(shop, searchTerm));

    filtered.sort((a, b) => {
      const compareValue = a.name.localeCompare(b.name, "fr");
      return sortOrder === "desc" ? -compareValue : compareValue;
    });

    return filtered;
  }, [shops, searchTerm, sortOrder, categoryShopId]);

  useEffect(() => {
    if (queryFromUrl.trim() === writtenQuery.current) return;
    writtenQuery.current = queryFromUrl.trim();
    setSearchTerm(queryFromUrl);
  }, [queryFromUrl]);

  useEffect(() => {
    const next = searchTerm.trim();
    if (next === writtenQuery.current && !searchParams.has("search")) return;
    const handle = window.setTimeout(() => {
      writtenQuery.current = next;
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        if ((params.get("q") ?? "") === next && !params.has("search")) return prev;
        if (next) params.set("q", next);
        else params.delete("q");
        params.delete("search");
        return params;
      });
    }, 300);
    return () => window.clearTimeout(handle);
  }, [searchTerm, searchParams, setSearchParams]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchTerm, sortOrder, categoryShopId]);

  const currentShops = filteredShops.slice(0, visibleCount);
  const remainingShops = Math.max(0, filteredShops.length - currentShops.length);
  const filtersActive =
    searchTerm.trim().length > 0 || sortOrder !== "asc" || activeCategory !== null;

  const selectCategory = (id: number | null) => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      if (id == null) params.delete("categorieShopId");
      else params.set("categorieShopId", String(id));
      return params;
    });
  };

  const resetFilters = () => {
    setSearchTerm("");
    setSortOrder("asc");
    setVisibleCount(PAGE_SIZE);
    selectCategory(null);
  };

  const title = activeCategory ? activeCategory.name : "Toutes nos boutiques";
  const countLabel = `${filteredShops.length} boutique${filteredShops.length !== 1 ? "s" : ""}`;

  const shell = (content: React.ReactNode) => (
    <div className="flex min-h-screen flex-col bg-bibocom-light">
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-16 pt-24 sm:px-6 md:pt-28 lg:px-10">
        {content}
      </main>
      <Footer />
    </div>
  );

  if (isLoading) {
    return shell(
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-bibocom-accent" />
          <p className="text-bibocom-primary/70">Chargement des boutiques...</p>
        </div>
      </div>
    );
  }

  if (isUnavailable) {
    return shell(
      <div className="flex min-h-[40vh] items-center justify-center">
        <ServiceUnavailableState
          title="Boutiques temporairement indisponibles"
          description="Nous n'arrivons pas à afficher les commerçants pour le moment. Le serveur est injoignable — réessayez dans un instant."
          onRetry={() => {
            void refetch();
          }}
          isRetrying={isFetching}
        />
      </div>
    );
  }

  return shell(
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-bibocom-accent">Boutiques</p>
          <h1 className="mt-1 text-3xl font-bold text-bibocom-primary">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {countLabel}
            {searchTerm ? ` pour « ${searchTerm} »` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl bg-white p-1 ring-1 ring-slate-200">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              aria-label="Affichage en grille"
              aria-pressed={viewMode === "grid"}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium",
                viewMode === "grid" ? "bg-bibocom-primary text-white" : "text-slate-500 hover:text-bibocom-primary"
              )}
            >
              <Grid size={16} />
              Cartes
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              aria-label="Affichage en liste"
              aria-pressed={viewMode === "list"}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium",
                viewMode === "list" ? "bg-bibocom-primary text-white" : "text-slate-500 hover:text-bibocom-primary"
              )}
            >
              <List size={16} />
              Liste
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Nom de la boutique ou du marchand"
            aria-label="Rechercher par nom de boutique ou de marchand"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm text-bibocom-primary outline-none ring-bibocom-accent/30 placeholder:text-slate-400 focus:ring-2"
          />
          {searchTerm ? (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              aria-label="Effacer la recherche"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-bibocom-primary"
            >
              <X size={16} />
            </button>
          ) : null}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <select
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value as "asc" | "desc")}
            aria-label="Ordre"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-bibocom-primary outline-none focus:ring-2 focus:ring-bibocom-accent/30"
          >
            <option value="asc">Croissant (A-Z)</option>
            <option value="desc">Décroissant (Z-A)</option>
          </select>
          {filtersActive ? (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50"
            >
              <X size={14} />
              Réinitialiser
            </button>
          ) : null}
        </div>
      </div>

      {categories.length > 0 ? (
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => selectCategory(null)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-sm font-medium",
              activeCategory
                ? "bg-white text-slate-600 ring-1 ring-slate-200 hover:text-bibocom-primary"
                : "bg-bibocom-primary text-white"
            )}
          >
            Toutes
          </button>
          {categories.map((category) => {
            const selected = category.id === categoryShopId;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => selectCategory(selected ? null : category.id)}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1.5 text-sm font-medium",
                  selected
                    ? "bg-bibocom-primary text-white"
                    : "bg-white text-slate-600 ring-1 ring-slate-200 hover:text-bibocom-primary"
                )}
              >
                {category.name}
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="mt-6">
        {currentShops.length === 0 ? (
          <div className="rounded-2xl bg-white px-6 py-16 text-center ring-1 ring-slate-100">
            <Store className="mx-auto mb-4 h-12 w-12 text-slate-300" />
            <h2 className="text-lg font-semibold text-bibocom-primary">Aucune boutique trouvée</h2>
            <p className="mt-1 text-sm text-slate-500">Essayez de modifier vos critères de recherche.</p>
          </div>
        ) : (
          <>
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {currentShops.map((shop) => (
                  <ShopGridCard key={shop.id} shop={shop} onOpen={(id) => navigate(`/boutique/${id}`)} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {currentShops.map((shop) => (
                  <ShopListRow key={shop.id} shop={shop} onOpen={(id) => navigate(`/boutique/${id}`)} />
                ))}
              </div>
            )}
            <VoirPlusButton
              remaining={remainingShops}
              onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
              noun="boutique"
            />
          </>
        )}
      </div>
    </>
  );
};

export default ShopsListingPage;
