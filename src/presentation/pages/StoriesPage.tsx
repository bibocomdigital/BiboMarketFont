"use client";

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Flag, MoreHorizontal, Play, X } from "lucide-react";
import { PublicShell } from "@/components/home/PublicShell";
import { getUserErrorMessage } from "@domain/errors/app-error";
import { cachedStories, listStories, storyDisplayUrl, type StoryItem, type StoryProduct } from "@/services/badgeService";
import { reportStory } from "@/services/platformService";
import { formatImageUrl } from "@/services/productService";
import { getUserFollowing } from "@/services/subscriptionService";
import { useAddToCartMutation } from "@/hooks/mutations/use-cart-mutations";
import { useAuthSession } from "@/hooks/use-auth-session";
import { CartAuthDialog } from "@/presentation/components/cart/CartAuthDialog";
import { flyToCart } from "@/presentation/lib/fly-to-cart";
import { useToast } from "@/hooks/use-toast";

const SEEN_KEY = "bibocom-seen-stories";
const PHOTO_MS = 5_000;

type StoryGroup = {
  key: string;
  userId: number;
  shopId: number | null;
  name: string;
  logo: string | null;
  stories: StoryItem[];
  unseen: boolean;
  followed: boolean;
};

function shopName(story: StoryItem): string {
  return (
    story.author.shop?.name ||
    `${story.author.firstName || ""} ${story.author.lastName || ""}`.trim() ||
    "Compte"
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = (parts[0]?.[0] || "") + (parts[1]?.[0] || "");
  return (letters || name.slice(0, 2)).toUpperCase();
}

function readSeen(): number[] {
  try {
    const raw = JSON.parse(localStorage.getItem(SEEN_KEY) || "[]") as unknown;
    return Array.isArray(raw) ? raw.filter((id) => typeof id === "number") : [];
  } catch {
    return [];
  }
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.max(1, Math.round(diff / 60_000));
  if (minutes < 60) return `Il y a ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Il y a ${hours} h`;
  return "Il y a 1 j";
}

function storyDurationMs(story: StoryItem, videoDuration?: number): number {
  if (story.mediaType !== "VIDEO") return PHOTO_MS;
  const seconds = videoDuration && Number.isFinite(videoDuration) && videoDuration > 0
    ? videoDuration
    : story.durationSeconds || 5;
  return Math.min(30, Math.max(1, seconds)) * 1000;
}

function groupStories(stories: StoryItem[], seen: number[], followedIds: number[]): StoryGroup[] {
  const followed = new Set(followedIds);
  const seenSet = new Set(seen);
  const map = new Map<string, StoryGroup>();
  for (const story of stories) {
    const shopId = story.author.shop?.id ?? null;
    const key = shopId ? `shop-${shopId}` : `user-${story.author.id}`;
    const current = map.get(key);
    if (current) {
      current.stories.push(story);
      if (!seenSet.has(story.id)) current.unseen = true;
      continue;
    }
    map.set(key, {
      key,
      userId: story.author.id,
      shopId,
      name: shopName(story),
      logo: storyDisplayUrl(formatImageUrl(story.author.shop?.logo || story.author.photo || null) || "", 128) || null,
      stories: [story],
      unseen: !seenSet.has(story.id),
      followed: followed.has(story.author.id),
    });
  }
  const groups = [...map.values()];
  for (const group of groups) {
    group.stories.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }
  groups.sort((a, b) => {
    const rank = (group: StoryGroup) => (group.unseen ? (group.followed ? 0 : 1) : 2);
    return rank(a) - rank(b);
  });
  return groups;
}

function ReportStoryDialog({
  author,
  sending,
  error,
  onClose,
  onSubmit,
}: {
  author: string;
  sending: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}) {
  const titleId = useId();
  const [reason, setReason] = useState("");
  const clean = reason.trim();
  const canSend = clean.length >= 3 && !sending;

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !sending) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose, sending]);

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center p-4 sm:items-center">
      <button type="button" className="absolute inset-0 bg-bibocom-primary/45 backdrop-blur-[2px]" aria-label="Fermer" onClick={() => { if (!sending) onClose(); }} />
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-md rounded-[22px] bg-white p-5 shadow-2xl sm:p-6"
        onSubmit={(event) => {
          event.preventDefault();
          if (canSend) onSubmit(clean);
        }}
      >
        <button type="button" onClick={onClose} disabled={sending} className="absolute right-3 top-3 rounded-full p-1.5 text-slate-400 hover:bg-slate-100" aria-label="Fermer">
          <X className="h-4 w-4" />
        </button>
        <div className="flex gap-3 pr-6">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-500">
            <Flag className="h-5 w-5" />
          </div>
          <div>
            <h2 id={titleId} className="text-lg font-semibold text-bibocom-primary">Signaler cette story</h2>
            <p className="mt-1.5 text-sm text-slate-500">Indiquez pourquoi le contenu de {author} ne respecte pas les règles.</p>
          </div>
        </div>
        <label className="mt-5 block text-sm font-medium text-bibocom-primary" htmlFor="story-report-reason">Motif</label>
        <textarea
          id="story-report-reason"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          rows={4}
          maxLength={500}
          autoFocus
          placeholder="Décrivez le problème en quelques mots"
          className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-bibocom-accent focus:bg-white"
        />
        {error ? <p className="mt-2 text-sm text-bibocom-error">{error}</p> : null}
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-full px-4 py-2 text-sm font-medium text-slate-500">Annuler</button>
          <button type="submit" disabled={!canSend} className="rounded-full bg-red-500 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
            {sending ? "Envoi…" : "Envoyer"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Bubble({ group, onOpen }: { group: StoryGroup; onOpen: () => void }) {
  return (
    <button type="button" onClick={onOpen} className="flex w-[5.5rem] shrink-0 flex-col items-center gap-1 text-center">
      <span className={`rounded-full p-[3px] ${group.unseen ? "bg-bibocom-accent" : "bg-slate-300"}`}>
        <span className="block rounded-full bg-white p-[2px]">
          {group.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={group.logo} alt="" className="h-14 w-14 rounded-full object-cover" />
          ) : (
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-bibocom-primary text-sm font-semibold text-white">
              {initials(group.name)}
            </span>
          )}
        </span>
      </span>
      <span className="line-clamp-2 w-full text-xs font-medium leading-tight text-bibocom-primary">{group.name}</span>
      <span className="text-[10px] text-slate-400">{group.stories.length} story{group.stories.length > 1 ? "s" : ""}</span>
    </button>
  );
}

function StoryViewer({
  groups,
  groupIndex,
  storyIndex,
  suspended,
  onChange,
  onClose,
  onReport,
}: {
  groups: StoryGroup[];
  groupIndex: number;
  storyIndex: number;
  suspended: boolean;
  onChange: (groupIndex: number, storyIndex: number) => void;
  onClose: () => void;
  onReport: (story: StoryItem) => void;
}) {
  const { toast } = useToast();
  const { isAuthenticated } = useAuthSession();
  const addToCart = useAddToCartMutation();
  const [authProduct, setAuthProduct] = useState<StoryProduct | null>(null);
  const group = groups[groupIndex];
  const story = group?.stories[storyIndex];
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const progressRef = useRef(0);
  const holdingRef = useRef(false);
  const holdTimerRef = useRef<number | null>(null);
  const originRef = useRef({ x: 0, y: 0 });
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [missing, setMissing] = useState(false);
  const [mediaReady, setMediaReady] = useState(false);

  const go = useCallback((delta: number) => {
    if (!group) return;
    const nextStory = storyIndex + delta;
    if (nextStory >= 0 && nextStory < group.stories.length) {
      onChange(groupIndex, nextStory);
      return;
    }
    const nextGroup = groupIndex + (delta > 0 ? 1 : -1);
    if (nextGroup < 0 || nextGroup >= groups.length) {
      if (delta > 0) onClose();
      return;
    }
    const target = groups[nextGroup];
    onChange(nextGroup, delta > 0 ? 0 : target.stories.length - 1);
  }, [group, groupIndex, groups, onChange, onClose, storyIndex]);

  useEffect(() => {
    progressRef.current = 0;
    setProgress(0);
    setPaused(false);
    setMenuOpen(false);
    setMissing(false);
    setMediaReady(false);
  }, [story?.id]);

  const frozen = paused || menuOpen || suspended || Boolean(authProduct);

  useEffect(() => {
    if (!story || frozen || missing) return;
    let last = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const videoDuration = videoRef.current?.duration;
      const duration = storyDurationMs(story, videoDuration);
      progressRef.current = Math.min(1, progressRef.current + (now - last) / duration);
      last = now;
      setProgress(progressRef.current);
      if (progressRef.current >= 1) {
        go(1);
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [frozen, go, missing, story]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || story?.mediaType !== "VIDEO") return;
    if (frozen) video.pause();
    else {
      video.muted = false;
      void video.play().catch(() => {
        video.muted = true;
        void video.play().catch(() => undefined);
      });
    }
  }, [frozen, story?.id, story?.mediaType]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (suspended) return;
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") go(1);
      if (event.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [go, onClose, suspended]);

  if (!group || !story) return null;
  const previous = groups[groupIndex - 1];
  const next = groups[groupIndex + 1];

  const clearHold = () => {
    if (holdTimerRef.current !== null) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("button, a")) return;
    originRef.current = { x: event.clientX, y: event.clientY };
    holdingRef.current = false;
    clearHold();
    event.currentTarget.setPointerCapture(event.pointerId);
    holdTimerRef.current = window.setTimeout(() => {
      holdingRef.current = true;
      setPaused(true);
    }, 220);
  };

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    clearHold();
    const dx = event.clientX - originRef.current.x;
    const dy = event.clientY - originRef.current.y;
    if (dy > 72 && Math.abs(dy) > Math.abs(dx)) {
      holdingRef.current = false;
      setPaused(false);
      onClose();
      return;
    }
    if (holdingRef.current) {
      holdingRef.current = false;
      setPaused(false);
      return;
    }
    if (Math.abs(dx) > 10 || Math.abs(dy) > 10) return;
    const rect = event.currentTarget.getBoundingClientRect();
    go(event.clientX - rect.left < rect.width * 0.33 ? -1 : 1);
  };

  const products = story?.products ?? [];

  const addProduct = async (product: StoryProduct, origin?: Element | null) => {
    if (!isAuthenticated) {
      setAuthProduct(product);
      return;
    }
    flyToCart(origin, formatImageUrl(product.imageUrl));
    try {
      await addToCart.mutateAsync({ productId: product.id });
      toast({ title: "Ajouté au panier", description: product.name });
    } catch (error) {
      toast({ title: "Ajout impossible", description: getUserErrorMessage(error), variant: "destructive" });
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-bibocom-primary/80 backdrop-blur-sm">
      <button type="button" className="absolute inset-0" aria-label="Fermer les stories" onClick={onClose} />
      <div className="relative z-10 flex h-full w-full items-center justify-center md:h-auto md:w-auto md:gap-4">
        {previous ? (
          <button type="button" onClick={() => onChange(groupIndex - 1, 0)} className="relative hidden h-[70vh] w-36 overflow-hidden rounded-2xl opacity-60 md:block" aria-label={previous.name}>
            <Cover story={previous.stories[0]} />
          </button>
        ) : <span className="hidden w-36 md:block" />}
        <article className="relative h-full w-full overflow-hidden bg-black md:aspect-[9/16] md:h-[min(86vh,760px)] md:w-auto md:rounded-[28px]">
          <div className="absolute inset-x-0 top-0 z-20 flex gap-1 px-3 pt-3">
            {group.stories.map((item, index) => (
              <span key={item.id} className="h-1 flex-1 overflow-hidden rounded-full bg-white/35">
                <span
                  className="block h-full bg-white"
                  style={{ width: `${index < storyIndex ? 100 : index === storyIndex ? progress * 100 : 0}%` }}
                />
              </span>
            ))}
          </div>
          <div className="absolute inset-x-0 top-6 z-20 flex items-center gap-2 px-3 pt-2 text-white">
            {group.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={group.logo} alt="" className="h-8 w-8 rounded-full object-cover ring-2 ring-white/80" />
            ) : (
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-bibocom-accent text-[10px] font-semibold">{initials(group.name)}</span>
            )}
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{group.name}</span>
              <span className="block text-[11px] text-white/70">{relativeTime(story.createdAt)}</span>
            </span>
            <button type="button" className="rounded-full p-1.5 hover:bg-white/10" aria-label="Plus d’actions" onClick={() => setMenuOpen((open) => !open)}>
              <MoreHorizontal className="h-5 w-5" />
            </button>
            <button type="button" className="rounded-full p-1.5 hover:bg-white/10" aria-label="Fermer" onClick={onClose}>
              <X className="h-5 w-5" />
            </button>
          </div>
          {menuOpen ? (
            <button
              type="button"
              className="absolute right-3 top-16 z-30 rounded-xl bg-white px-3 py-2 text-sm font-medium text-bibocom-primary shadow-lg"
              onClick={() => {
                setMenuOpen(false);
                onReport(story);
              }}
            >
              Signaler
            </button>
          ) : null}
          <div className="absolute inset-0" onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
            {missing ? (
              <div className="flex h-full items-center justify-center px-6 text-center text-sm text-white/80">Le média de cette story n’est plus disponible.</div>
            ) : story.mediaType === "VIDEO" ? (
              <video
                ref={videoRef}
                key={story.id}
                src={storyDisplayUrl(story.mediaUrl)}
                className="h-full w-full object-cover"
                playsInline
                autoPlay
                muted
                onLoadedData={() => setMediaReady(true)}
                onError={() => setMissing(true)}
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={story.id}
                src={storyDisplayUrl(story.mediaUrl, 1080)}
                alt=""
                className="h-full w-full object-cover"
                decoding="async"
                onLoad={() => setMediaReady(true)}
                onError={() => setMissing(true)}
              />
            )}
            {!missing && !mediaReady ? (
              <span className="absolute inset-0 z-10 flex items-center justify-center bg-black/35">
                <StorySpinner className="h-10 w-10" light />
              </span>
            ) : null}
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 space-y-2 bg-gradient-to-t from-black/80 via-black/35 to-transparent p-3 pt-16">
            {products.length > 0 ? (
              <div className="pointer-events-auto flex gap-2 overflow-x-auto">
                {products.map((product) => {
                  const image = formatImageUrl(product.imageUrl);
                  const price = product.promoPrice && product.promoPrice > 0 ? product.promoPrice : product.price;
                  const available = product.stock > 0;
                  return (
                    <div key={product.id} className="flex min-w-[11rem] items-center gap-2 rounded-2xl bg-white p-2 text-bibocom-primary">
                      {image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={image} alt="" className="h-10 w-10 rounded-lg object-cover" />
                      ) : <span className="h-10 w-10 rounded-lg bg-bibocom-light" />}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-semibold">{product.name}</span>
                        <span className="block text-[11px] text-slate-500">{Math.round(price).toLocaleString("fr-FR")} FCFA</span>
                      </span>
                      <button
                        type="button"
                        disabled={!available || addToCart.isPending}
                        onClick={(event) => void addProduct(product, event.currentTarget)}
                        className="rounded-full bg-bibocom-accent px-2.5 py-1 text-[11px] font-semibold text-white disabled:opacity-50"
                      >
                        {available ? "Ajouter" : "Rupture"}
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : null}
            {group.shopId ? (
              <Link to={`/boutique/${group.shopId}`} className="pointer-events-auto block rounded-full bg-bibocom-accent py-3 text-center text-sm font-semibold text-white">
                Voir la boutique
              </Link>
            ) : null}
          </div>
        </article>
        {next ? (
          <button type="button" onClick={() => onChange(groupIndex + 1, 0)} className="relative hidden h-[70vh] w-36 overflow-hidden rounded-2xl opacity-60 md:block" aria-label={next.name}>
            <Cover story={next.stories[0]} />
          </button>
        ) : <span className="hidden w-36 md:block" />}
      </div>
      {authProduct ? (
        <CartAuthDialog
          productId={authProduct.id}
          productName={authProduct.name}
          onClose={() => setAuthProduct(null)}
        />
      ) : null}
    </div>
  );
}

function StorySpinner({ className = "h-8 w-8", light = false }: { className?: string; light?: boolean }) {
  return (
    <span
      className={`animate-spin rounded-full border-2 border-t-transparent ${light ? "border-white" : "border-bibocom-accent"} ${className}`}
      role="status"
      aria-label="Chargement"
    />
  );
}

function Cover({
  story,
  priority = false,
  width = 640,
  fit = "cover",
}: {
  story: StoryItem;
  priority?: boolean;
  width?: number;
  fit?: "cover" | "contain";
}) {
  const [ready, setReady] = useState(false);
  const src = storyDisplayUrl(story.mediaUrl, story.mediaType === "PHOTO" ? width : undefined);
  return (
    <span className="absolute inset-0 block bg-slate-200">
      {story.mediaType === "VIDEO" ? (
        <video
          src={src}
          className={`h-full w-full ${fit === "contain" ? "object-contain" : "object-cover"}`}
          muted
          playsInline
          preload="metadata"
          onLoadedData={() => setReady(true)}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          className={`h-full w-full transition-opacity duration-200 ${fit === "contain" ? "object-contain" : "object-cover"} ${ready ? "opacity-100" : "opacity-0"}`}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          onLoad={() => setReady(true)}
          onError={() => setReady(true)}
        />
      )}
      {ready ? null : (
        <span className="absolute inset-0 flex items-center justify-center">
          <StorySpinner />
        </span>
      )}
    </span>
  );
}

function StoriesLoading() {
  return (
    <div className="mt-8" aria-busy="true">
      <p className="flex items-center gap-3 text-sm text-slate-500">
        <StorySpinner className="h-5 w-5" />
        Chargement des stories…
      </p>
      <ul className="mt-6 flex gap-3 overflow-hidden">
        {Array.from({ length: 5 }, (_, index) => (
          <li key={index} className="flex w-[4.6rem] shrink-0 flex-col items-center gap-2">
            <span className="h-14 w-14 animate-pulse rounded-full bg-slate-200" />
            <span className="h-2 w-12 animate-pulse rounded bg-slate-200" />
          </li>
        ))}
      </ul>
      <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <li key={index} className="flex aspect-[9/16] items-center justify-center rounded-2xl bg-slate-200/80">
            <StorySpinner />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function StoriesPage() {
  const { user } = useAuthSession();
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [seen, setSeen] = useState<number[]>([]);
  const [followedIds, setFollowedIds] = useState<number[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [cursor, setCursor] = useState<{ group: number; story: number } | null>(null);
  const [playback, setPlayback] = useState<StoryGroup[] | null>(null);
  const [reportStoryItem, setReportStoryItem] = useState<StoryItem | null>(null);
  const [reportError, setReportError] = useState("");
  const [reporting, setReporting] = useState(false);

  useEffect(() => {
    setSeen(readSeen());
    const cached = cachedStories();
    if (cached) {
      setStories(cached);
      setLoading(false);
    }
    listStories(Boolean(cached))
      .then(setStories)
      .catch((err) => {
        if (!cached) setError(getUserErrorMessage(err));
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    getUserFollowing(user.id, 1, 100)
      .then((data) => setFollowedIds(data.following.map((item) => item.id)))
      .catch(() => setFollowedIds([]));
  }, [user?.id]);

  const groups = useMemo(() => groupStories(stories, seen, followedIds), [followedIds, seen, stories]);
  const viewerGroups = playback ?? groups;
  const recentGroups = useMemo(
    () =>
      [...groups].sort((a, b) => {
        const latest = (group: StoryGroup) => new Date(group.stories[group.stories.length - 1]?.createdAt ?? 0).getTime();
        return latest(b) - latest(a);
      }),
    [groups],
  );

  const markSeen = (storyId: number) => {
    setSeen((current) => {
      if (current.includes(storyId)) return current;
      const next = [...current, storyId].slice(-400);
      localStorage.setItem(SEEN_KEY, JSON.stringify(next));
      return next;
    });
  };

  const openGroup = (groupIndex: number, storyIndex = 0) => {
    const story = groups[groupIndex]?.stories[storyIndex];
    if (!story) return;
    markSeen(story.id);
    setPlayback(groups);
    setCursor({ group: groupIndex, story: storyIndex });
  };

  return (
    <PublicShell>
      <div className="py-2 sm:py-4">
        <h1 className="text-2xl font-semibold text-bibocom-primary sm:text-3xl">Stories</h1>
        <p className="mt-2 max-w-xl text-sm text-slate-600">
          Photos et vidéos de 30 secondes publiées par les boutiques avec le badge. Elles disparaissent après 24 h.
        </p>
        {error ? <p className="mt-6 text-sm text-bibocom-error">{error}</p> : null}
        {notice ? <p className="mt-4 text-sm text-bibocom-primary">{notice}</p> : null}
        {loading && stories.length === 0 ? <StoriesLoading /> : null}
        {!loading && !error && stories.length === 0 ? <p className="mt-8 text-sm text-slate-500">Aucune story en ce moment.</p> : null}
        {groups.length > 0 ? (
          <ul className="mt-6 flex gap-3 overflow-x-auto pb-2">
            {groups.map((group, index) => (
              <li key={group.key}>
                <Bubble group={group} onOpen={() => openGroup(index)} />
              </li>
            ))}
          </ul>
        ) : null}
        {recentGroups.length > 0 ? (
          <section className="mt-8">
            <h2 className="text-lg font-semibold text-bibocom-primary">Publiées récemment</h2>
            <ul className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(min(100%,220px),280px))] gap-3">
              {recentGroups.map((group) => {
                const story = group.stories[group.stories.length - 1];
                const groupIndex = groups.findIndex((item) => item.key === group.key);
                if (!story || groupIndex < 0) return null;
                return (
                  <li key={group.key}>
                    <button
                      type="button"
                      onClick={() => openGroup(groupIndex, group.stories.length - 1)}
                      className="relative block aspect-[9/16] w-full overflow-hidden rounded-2xl bg-bibocom-primary text-left text-white"
                    >
                      <Cover story={story} priority={groupIndex === 0} fit="contain" />
                      <span className="absolute inset-0 bg-gradient-to-t from-bibocom-primary/85 via-transparent to-black/10" />
                      <span className="absolute left-2 top-2 inline-flex max-w-[90%] items-center gap-1 rounded-full bg-black/35 px-2 py-1 text-[11px] font-medium backdrop-blur-sm">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-bibocom-accent text-[9px]">{initials(group.name)}</span>
                        <span className="truncate">{group.name}</span>
                      </span>
                      <span className="absolute inset-x-2 bottom-2 flex items-center justify-between text-[11px]">
                        <span>{relativeTime(story.createdAt)}</span>
                        <span className="inline-flex items-center gap-1">
                          {story.mediaType === "VIDEO" ? <Play className="h-3 w-3" /> : null}
                          {story.mediaType === "VIDEO" ? "Vidéo" : "Photo"}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}
      </div>
      {cursor ? (
        <StoryViewer
          groups={viewerGroups}
          groupIndex={cursor.group}
          storyIndex={cursor.story}
          suspended={Boolean(reportStoryItem)}
          onChange={(group, story) => {
            const item = viewerGroups[group]?.stories[story];
            if (item) markSeen(item.id);
            setCursor({ group, story });
          }}
          onClose={() => {
            setCursor(null);
            setPlayback(null);
          }}
          onReport={(story) => {
            setReportError("");
            setReportStoryItem(story);
          }}
        />
      ) : null}
      {reportStoryItem ? (
        <ReportStoryDialog
          author={shopName(reportStoryItem)}
          sending={reporting}
          error={reportError}
          onClose={() => {
            if (!reporting) setReportStoryItem(null);
          }}
          onSubmit={(reason) => {
            setReporting(true);
            reportStory(reportStoryItem.id, reason)
              .then(() => {
                setReportStoryItem(null);
                setNotice("Signalement envoyé.");
              })
              .catch((err) => setReportError(getUserErrorMessage(err)))
              .finally(() => setReporting(false));
          }}
        />
      ) : null}
    </PublicShell>
  );
}
