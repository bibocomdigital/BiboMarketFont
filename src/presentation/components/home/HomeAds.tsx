"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Sparkles, Tag } from "lucide-react";
import { listPublicAds, type PublicAd } from "@/services/platformService";

const BADGES = [
  { label: "Nouveau", Icon: Sparkles },
  { label: "Promo", Icon: Tag },
] as const;

function badgeFor(index: number) {
  return BADGES[index % BADGES.length];
}

export function HomeAds() {
  const reduceMotion = useReducedMotion();
  const scroller = useRef<HTMLDivElement>(null);
  const [ads, setAds] = useState<PublicAd[] | null>(null);
  const [active, setActive] = useState(0);
  const [edges, setEdges] = useState({ left: false, right: false });
  const [ready, setReady] = useState<Record<number, boolean>>({});
  const [paused, setPaused] = useState(false);
  const activeRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    listPublicAds()
      .then((rows) => {
        if (!cancelled) setAds(Array.isArray(rows) ? rows : []);
      })
      .catch(() => {
        if (!cancelled) setAds([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const sync = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    const cards = Array.from(el.querySelectorAll<HTMLElement>("[data-ad-card]"));
    const origin = el.getBoundingClientRect().left;
    let next = 0;
    let best = Number.POSITIVE_INFINITY;
    cards.forEach((card, index) => {
      const distance = Math.abs(card.getBoundingClientRect().left - origin);
      if (distance < best) {
        best = distance;
        next = index;
      }
    });
    activeRef.current = next;
    setActive(next);
    setEdges({
      left: el.scrollLeft > 8,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 8,
    });
  }, []);

  useEffect(() => {
    sync();
  }, [ads, sync]);

  useEffect(() => {
    if (!ads || ads.length < 2 || paused || reduceMotion) return;
    const timer = window.setInterval(() => {
      const el = scroller.current;
      const cards = el?.querySelectorAll<HTMLElement>("[data-ad-card]");
      if (!el || !cards || cards.length < 2) return;
      scrollToCard((activeRef.current + 1) % cards.length);
    }, 3200);
    return () => window.clearInterval(timer);
  }, [ads, paused, reduceMotion]);

  const scrollToCard = (index: number) => {
    const el = scroller.current;
    const card = el?.querySelectorAll<HTMLElement>("[data-ad-card]")[index];
    if (!el || !card) return;
    const left = card.getBoundingClientRect().left - el.getBoundingClientRect().left + el.scrollLeft;
    el.scrollTo({ left, behavior: "smooth" });
  };

  const scrollByCard = (direction: -1 | 1) => {
    const el = scroller.current;
    const cards = el?.querySelectorAll<HTMLElement>("[data-ad-card]");
    if (!el || !cards?.length) return;
    const next = Math.min(cards.length - 1, Math.max(0, activeRef.current + direction));
    scrollToCard(next);
  };

  if (ads && ads.length === 0) return null;

  const items = ads ?? [0, 1, 2, 3];

  return (
    <section
      className="group/rail relative mx-auto max-w-7xl px-4 py-6"
      aria-label="Publicités"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="mb-3 flex items-end justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-bibocom-primary/70">
          À la une
        </h2>
      </div>

      <div className="relative">
        <button
          type="button"
          aria-label="Publicités précédentes"
          disabled={!edges.left}
          onClick={() => scrollByCard(-1)}
          className="absolute top-1/2 left-1 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-bibocom-primary shadow-md opacity-0 transition-opacity duration-200 group-hover/rail:opacity-100 disabled:pointer-events-none disabled:opacity-0 md:flex"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          type="button"
          aria-label="Publicités suivantes"
          disabled={!edges.right}
          onClick={() => scrollByCard(1)}
          className="absolute top-1/2 right-1 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-bibocom-primary shadow-md opacity-0 transition-opacity duration-200 group-hover/rail:opacity-100 disabled:pointer-events-none disabled:opacity-0 md:flex"
        >
          <ChevronRight size={18} />
        </button>

        <div
          ref={scroller}
          onScroll={sync}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {ads
            ? ads.map((ad, index) => {
                const { label, Icon } = badgeFor(index);
                const cardClass =
                  "group/card relative h-[168px] w-[220px] shrink-0 snap-start overflow-hidden rounded-2xl bg-white shadow-[0_10px_28px_-16px_rgba(10,37,64,0.55)] ring-1 ring-black/5 sm:h-[188px] sm:w-[280px]";
                const motionProps = {
                  "data-ad-card": true,
                  initial: reduceMotion ? false : { opacity: 0, y: 18 },
                  animate: { opacity: 1, y: 0 },
                  transition: { duration: 0.45, delay: index * 0.08, ease: "easeOut" as const },
                };
                const body = (
                  <>
                    {!ready[ad.id] ? (
                      <div className="absolute inset-0 animate-pulse bg-slate-200" />
                    ) : null}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={ad.imageUrl}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      onLoad={() => setReady((current) => ({ ...current, [ad.id]: true }))}
                      className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover/card:scale-105"
                    />
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />
                    <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[11px] font-semibold text-bibocom-primary shadow-sm">
                      <Icon size={12} className="text-bibocom-accent" />
                      {label}
                    </span>
                    {index === active ? (
                      <motion.span
                        aria-hidden
                        className="absolute top-3.5 right-3.5 h-2.5 w-2.5 rounded-full bg-bibocom-accent shadow-[0_0_0_4px_rgba(255,126,95,0.35)]"
                        animate={reduceMotion ? undefined : { scale: [1, 1.28, 1], opacity: [1, 0.72, 1] }}
                        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                      />
                    ) : null}
                    <p className="absolute inset-x-0 bottom-0 px-3 pb-3 text-sm font-semibold text-white">
                      {ad.title}
                    </p>
                  </>
                );
                return ad.linkUrl ? (
                  <motion.a
                    key={ad.id}
                    href={ad.linkUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={cardClass}
                    {...motionProps}
                  >
                    {body}
                  </motion.a>
                ) : (
                  <motion.article key={ad.id} className={cardClass} {...motionProps}>
                    {body}
                  </motion.article>
                );
              })
            : items.map((item) => (
                <div
                  key={item}
                  className="h-[168px] w-[220px] shrink-0 animate-pulse snap-start rounded-2xl bg-slate-200 sm:h-[188px] sm:w-[280px]"
                />
              ))}
        </div>
      </div>

      {ads && ads.length > 1 ? (
        <div className="mt-3 flex justify-center gap-2" role="tablist" aria-label="Publicité affichée">
          {ads.map((ad, index) => (
            <button
              key={ad.id}
              type="button"
              role="tab"
              aria-selected={index === active}
              aria-label={ad.title}
              onClick={() => scrollToCard(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === active ? "w-6 animate-pulse bg-bibocom-accent" : "w-2 bg-bibocom-primary/20"
              }`}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
