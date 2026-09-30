"use client";

import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Baby,
  Car,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Home,
  Laptop,
  ShieldCheck,
  Shirt,
  Smartphone,
  Sparkles,
  Store,
  Tag,
  Truck,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { listPublicAds } from "@/services/platformService";
import { useProductCategoriesQuery } from "@/hooks/queries/use-products-query";
import type { ProductCategory } from "@/services/productService";

type HeroSlide = {
  key: string;
  src: string;
  alt: string;
  title?: string;
  href?: string | null;
};

const SERVER_SLIDES: HeroSlide[] = [
  { key: "saa1", src: "/images/saa1.jpeg", alt: "Groupe de femmes shopping" },
  { key: "image2", src: "/images/image2.jpeg", alt: "Trois femmes avec des sacs shopping" },
  { key: "chaussures", src: "/images/chaussures.jpeg", alt: "Chaussures" },
  { key: "iphone1", src: "/images/iphone1.jpeg", alt: "iPhone et Apple Watch" },
  { key: "iphone2", src: "/images/iphone2.jpeg", alt: "iPhone avec coque transparente" },
  { key: "iphone3", src: "/images/iphone3.jpeg", alt: "iPhone avec coque blanche" },
  { key: "iphone4", src: "/images/iphone4.jpeg", alt: "iPhone avec coque rose" },
  { key: "iphone6", src: "/images/iphone6.jpeg", alt: "iPhone 16 Pro Rose Pink" },
  { key: "iphonne13", src: "/images/iphonne13.jpeg", alt: "iPhone 13 series" },
  { key: "iphonne", src: "/images/iphonne.jpeg", alt: "iPhone avec coque rouge" },
  { key: "robes2", src: "/images/robes2.jpeg", alt: "Robe de soirée rouge" },
  { key: "chau", src: "/images/chau.jpeg", alt: "Tenue" },
  { key: "sac2", src: "/images/sac2.jpeg", alt: "Sac" },
  { key: "pullld", src: "/images/pullld.jpeg", alt: "Pull" },
  { key: "chauss", src: "/images/chauss.jpeg", alt: "Chaussures" },
];

const PILLS = [
  { label: "Paiement à la livraison", Icon: ShieldCheck },
  { label: "Boutiques locales", Icon: Store },
  { label: "Livraison par le commerçant", Icon: Truck },
] as const;

function iconForCategory(name: string): LucideIcon {
  const value = name.toLowerCase();
  if (/tel|phone/.test(value)) return Smartphone;
  if (/mode|vêt|vet|robe|habit/.test(value)) return Shirt;
  if (/maison|meuble|jardin/.test(value)) return Home;
  if (/beaut|sant/.test(value)) return Sparkles;
  if (/sport|loisir/.test(value)) return Dumbbell;
  if (/aliment|céré|cere|nourrit/.test(value)) return UtensilsCrossed;
  if (/auto|voiture|moto/.test(value)) return Car;
  if (/b[eé]b[eé]|enfant/.test(value)) return Baby;
  if (/electro|électro|info/.test(value)) return Laptop;
  return Tag;
}

function scrollToProducts() {
  document.getElementById("produits")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

const Hero = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoriesQuery = useProductCategoriesQuery();
  const categories = categoriesQuery.data ?? [];
  const selectedCategory = Number(searchParams.get("category") || "");
  const [activeImage, setActiveImage] = useState(0);
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [showingAds, setShowingAds] = useState(false);
  const [loadingSlides, setLoadingSlides] = useState(true);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listPublicAds()
      .then((rows) => {
        if (cancelled) return;
        const ads = (Array.isArray(rows) ? rows : []).filter((ad) => ad.imageUrl);
        if (ads.length === 0) {
          setSlides(SERVER_SLIDES);
          setShowingAds(false);
          return;
        }
        setSlides(ads.map((ad) => ({
          key: `ad-${ad.id}`,
          src: ad.imageUrl,
          alt: ad.title,
          title: ad.title,
          href: ad.linkUrl,
        })));
        setShowingAds(true);
      })
      .catch(() => {
        if (cancelled) return;
        setSlides(SERVER_SLIDES);
        setShowingAds(false);
      })
      .finally(() => {
        if (!cancelled) setLoadingSlides(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setActiveImage(0);
  }, [slides]);

  useEffect(() => {
    if (loadingSlides || paused || slides.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const interval = window.setInterval(() => {
      setActiveImage((prev) => (prev + 1) % slides.length);
    }, 4500);
    return () => window.clearInterval(interval);
  }, [loadingSlides, paused, slides.length]);

  const goTo = (index: number) => {
    if (slides.length === 0) return;
    setActiveImage((index + slides.length) % slides.length);
  };

  const current = slides[activeImage];
  const headline = showingAds && current?.title
    ? current.title
    : "Tout ce dont vous avez besoin, au meilleur prix !";

  const selectCategory = (category: ProductCategory) => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      if (params.get("category") === String(category.id)) params.delete("category");
      else params.set("category", String(category.id));
      return params;
    });
    scrollToProducts();
  };

  return (
    <section className="min-w-0">
      <div
        className="relative overflow-hidden rounded-[28px] bg-bibocom-primary text-white shadow-[0_24px_60px_-32px_rgba(10,37,64,0.8)]"
        aria-roledescription="carrousel"
        aria-label={showingAds ? "Publicités" : "Sélection"}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
      >
        <div className="absolute inset-y-0 right-0 hidden w-[48%] overflow-hidden lg:block">
          {loadingSlides ? null : (
            <div
              className="flex h-full transition-transform duration-700 ease-out"
              style={{
                width: `${slides.length * 100}%`,
                transform: `translateX(-${(activeImage * 100) / slides.length}%)`,
              }}
            >
              {slides.map((slide) => {
                const image = (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={slide.src} alt="" className="h-full w-full object-cover" />
                );
                const className = "relative h-full shrink-0";
                const style = { width: `${100 / slides.length}%` };
                return slide.href ? (
                  <a key={slide.key} href={slide.href} className={className} style={style}>{image}</a>
                ) : (
                  <div key={slide.key} className={className} style={style}>{image}</div>
                );
              })}
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-bibocom-primary via-bibocom-primary/75 to-bibocom-primary/10" />
        </div>

        <div className="relative z-10 grid lg:min-h-[420px] lg:grid-cols-2">
          <div className="flex flex-col justify-center px-4 py-6 sm:px-8 lg:px-10">
            <p className="text-sm font-medium text-bibocom-secondary">Bibocom Market</p>
            <h1 className="mt-2 max-w-xl text-2xl font-bold leading-tight sm:text-3xl xl:text-4xl">{headline}</h1>
            {showingAds ? null : (
              <p className="mt-3 max-w-lg text-sm text-white/75 sm:text-base">
                Parcourez les produits des boutiques locales. Le règlement se fait à la livraison.
              </p>
            )}
            <ul className="mt-5 flex flex-wrap gap-2">
              {PILLS.map(({ label, Icon }) => (
                <li key={label} className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white/90">
                  <Icon size={14} className="text-bibocom-secondary" />
                  {label}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative aspect-[16/10] w-full min-w-0 overflow-hidden lg:hidden">
            {loadingSlides ? (
              <div className="flex h-full items-center justify-center">
                <span className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" role="status" aria-label="Chargement" />
              </div>
            ) : (
              <div
                className="flex h-full transition-transform duration-700 ease-out"
                style={{
                  width: `${slides.length * 100}%`,
                  transform: `translateX(-${(activeImage * 100) / slides.length}%)`,
                }}
              >
                {slides.map((slide) => (
                  <div key={slide.key} className="h-full shrink-0" style={{ width: `${100 / slides.length}%` }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={slide.src} alt={slide.alt} className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {slides.length > 1 ? (
          <>
            <button
              type="button"
              aria-label="Image précédente"
              onClick={() => goTo(activeImage - 1)}
              className="absolute bottom-14 right-14 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-bibocom-primary shadow lg:bottom-auto lg:right-16 lg:top-1/2 lg:h-10 lg:w-10 lg:-translate-y-1/2"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              aria-label="Image suivante"
              onClick={() => goTo(activeImage + 1)}
              className="absolute bottom-14 right-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-bibocom-primary shadow lg:bottom-auto lg:top-1/2 lg:h-10 lg:w-10 lg:-translate-y-1/2"
            >
              <ChevronRight size={18} />
            </button>
            <div className="absolute bottom-3 left-0 right-0 z-20 flex justify-center gap-1.5 lg:justify-end lg:pr-8">
              {slides.map((slide, index) => (
                <button
                  key={slide.key}
                  type="button"
                  aria-label={slide.alt}
                  aria-current={index === activeImage}
                  onClick={() => goTo(index)}
                  className={`h-2 rounded-full transition-all ${index === activeImage ? "w-6 bg-bibocom-accent" : "w-2 bg-white/60"}`}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>

      {categories.length > 0 ? (
        <ul className="mt-5 flex min-w-0 gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Catégories">
          {categories.map((category) => {
            const Icon = iconForCategory(category.name);
            const selected = selectedCategory === category.id;
            return (
              <li key={category.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => selectCategory(category)}
                  className={`flex w-[5.5rem] flex-col items-center gap-2 rounded-2xl px-2 py-3 text-center ${
                    selected ? "bg-white shadow-md ring-2 ring-bibocom-accent" : "bg-white/80 hover:bg-white"
                  }`}
                >
                  <span className={`flex h-11 w-11 items-center justify-center rounded-full ${selected ? "bg-bibocom-accent text-white" : "bg-orange-50 text-bibocom-accent"}`}>
                    <Icon size={18} />
                  </span>
                  <span className="line-clamp-2 text-[11px] font-medium leading-tight text-bibocom-primary">{category.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
};

export function HomeCategoryCards() {
  const [, setSearchParams] = useSearchParams();
  const categoriesQuery = useProductCategoriesQuery();
  const categories = (categoriesQuery.data ?? []).slice(0, 6);
  if (categories.length === 0) return null;

  const tones = ["bg-orange-50", "bg-sky-50", "bg-emerald-50", "bg-rose-50", "bg-amber-50", "bg-violet-50"];

  return (
    <section className="min-w-0 py-4">
      <h2 className="text-xl font-semibold text-bibocom-primary">Nos catégories</h2>
      <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {categories.map((category, index) => {
          const Icon = iconForCategory(category.name);
          const count = category._count?.products;
          return (
            <li key={category.id}>
              <button
                type="button"
                onClick={() => {
                  setSearchParams((prev) => {
                    const params = new URLSearchParams(prev);
                    params.set("category", String(category.id));
                    return params;
                  });
                  scrollToProducts();
                }}
                className={`flex h-full w-full flex-col items-start gap-3 rounded-2xl p-4 text-left ${tones[index % tones.length]}`}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-bibocom-accent shadow-sm">
                  <Icon size={18} />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-bibocom-primary">{category.name}</span>
                  {typeof count === "number" ? (
                    <span className="mt-0.5 block text-xs text-slate-500">{count} produit{count > 1 ? "s" : ""}</span>
                  ) : null}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function HomeSellerBanner() {
  return (
    <section className="min-w-0 py-6">
      <div className="flex flex-col items-start justify-between gap-4 rounded-[28px] bg-bibocom-primary px-6 py-6 text-white sm:flex-row sm:items-center sm:px-8">
        <div>
          <h2 className="text-xl font-semibold">Ouvrez votre boutique</h2>
          <p className="mt-1 max-w-xl text-sm text-white/75">
            Publiez vos produits. Le client paie à la livraison.
          </p>
        </div>
        <Link
          to="/register?role=merchant"
          className="inline-flex shrink-0 rounded-full bg-bibocom-accent px-5 py-2.5 text-sm font-semibold text-white"
        >
          Créer ma boutique
        </Link>
      </div>
    </section>
  );
}

export default Hero;
