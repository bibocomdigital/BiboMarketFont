"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getUserErrorMessage } from "@domain/errors/app-error";
import { confirmAction } from "@/components/feedback/confirm-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  checkoutBadge,
  confirmBadge,
  deleteStory,
  getMyBadge,
  listMyStories,
  publishStory,
  setStoryProducts,
  type MyBadge,
  type StoryItem,
} from "@/services/badgeService";
import { formatDateFr, formatFcfa } from "@/lib/admin-analytics";
import { useAuthSession } from "@/hooks/use-auth-session";
import { getMerchantProducts, type Product } from "@/services/productService";

function storyStatus(story: StoryItem): { label: string; className: string } {
  if (story.status === "REJECTED") {
    return { label: "Retirée", className: "bg-red-50 text-red-600" };
  }
  const remaining = new Date(story.expiresAt).getTime() - Date.now();
  if (remaining <= 0) {
    return { label: "Expirée", className: "bg-slate-100 text-slate-500" };
  }
  const hours = Math.floor(remaining / 3_600_000);
  const minutes = Math.max(1, Math.ceil((remaining % 3_600_000) / 60_000));
  const left = hours >= 1 ? `${hours} h` : `${minutes} min`;
  return { label: `En ligne · ${left}`, className: "bg-emerald-50 text-emerald-700" };
}

function readVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      const seconds = video.duration;
      URL.revokeObjectURL(url);
      resolve(seconds);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Impossible de lire la durée de la vidéo"));
    };
    video.src = url;
  });
}

const MAX_LINKED_PRODUCTS = 3;

export function MerchantBadgeView() {
  const { toast } = useToast();
  const { user } = useAuthSession();
  const [searchParams] = useSearchParams();
  const [badge, setBadge] = useState<MyBadge | null>(null);
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [missingMedia, setMissingMedia] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [composer, setComposer] = useState<{
    storyId: number | null;
    file: File | null;
    previewUrl: string | null;
    duration?: number;
    selectedIds: number[];
  } | null>(null);

  const loadStories = useCallback(() => {
    listMyStories()
      .then(setStories)
      .catch((err) => {
        toast({
          title: "Stories indisponibles",
          description: getUserErrorMessage(err),
          variant: "destructive",
        });
      });
  }, [toast]);

  useEffect(() => {
    if (!user?.id || user.role !== "MERCHANT" || !badge?.active) return;
    let cancelled = false;
    getMerchantProducts(user.id, 1, 100)
      .then((data) => {
        if (!cancelled) setCatalog(data.products);
      })
      .catch(() => {
        if (!cancelled) setCatalog([]);
      });
    return () => {
      cancelled = true;
    };
  }, [badge?.active, user?.id, user?.role]);

  useEffect(() => {
    let cancelled = false;
    const token = searchParams.get("token");
    const run = async () => {
      if (token) {
        try {
          const result = await confirmBadge(token);
          if (!cancelled) {
            toast({ title: result.paid ? "Badge activé" : "Paiement non confirmé" });
          }
        } catch (err) {
          if (!cancelled) {
            toast({
              title: "Confirmation impossible",
              description: getUserErrorMessage(err),
              variant: "destructive",
            });
          }
        }
      }
      if (cancelled) return;
      try {
        const next = await getMyBadge();
        if (!cancelled) setBadge(next);
        if (!cancelled) {
          listMyStories()
            .then((rows) => {
              if (!cancelled) setStories(rows);
            })
            .catch((err) => {
              if (!cancelled) {
                toast({
                  title: "Stories indisponibles",
                  description: getUserErrorMessage(err),
                  variant: "destructive",
                });
              }
            });
        }
      } catch (err) {
        if (!cancelled) setError(getUserErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
    // Le retour PayDunya ne doit confirmer le jeton qu'une fois.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const buy = async () => {
    setBusy(true);
    try {
      const invoice = await checkoutBadge();
      window.location.assign(invoice.checkoutUrl);
    } catch (err) {
      toast({
        title: "Paiement impossible",
        description: getUserErrorMessage(err),
        variant: "destructive",
      });
      setBusy(false);
    }
  };

  const closeComposer = () => {
    setComposer((current) => {
      if (current?.previewUrl) URL.revokeObjectURL(current.previewUrl);
      return null;
    });
  };

  const openComposer = (story?: StoryItem) => {
    setComposer({
      storyId: story?.id ?? null,
      file: null,
      previewUrl: null,
      selectedIds: story?.products?.map((product) => product.id) ?? [],
    });
  };

  const onPickFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !composer) return;
    let duration: number | undefined;
    if (file.type.startsWith("video/")) {
      try {
        duration = await readVideoDuration(file);
      } catch (err) {
        toast({
          title: "Vidéo illisible",
          description: getUserErrorMessage(err),
          variant: "destructive",
        });
        return;
      }
      if (duration > 30) {
        toast({ title: "La vidéo doit durer au plus 30 secondes", variant: "destructive" });
        return;
      }
      duration = Math.ceil(duration);
    }
    setComposer((current) => {
      if (!current) return current;
      if (current.previewUrl) URL.revokeObjectURL(current.previewUrl);
      return { ...current, file, previewUrl: URL.createObjectURL(file), duration };
    });
  };

  const toggleLinkedProduct = (productId: number, published: boolean) => {
    if (!published) return;
    setComposer((current) => {
      if (!current) return current;
      const selected = current.selectedIds.includes(productId)
        ? current.selectedIds.filter((id) => id !== productId)
        : [...current.selectedIds, productId].slice(0, MAX_LINKED_PRODUCTS);
      return { ...current, selectedIds: selected };
    });
  };

  const submitComposer = async () => {
    if (!composer) return;
    if (!composer.storyId && !composer.file) return;
    setBusy(true);
    try {
      if (composer.storyId) {
        await setStoryProducts(composer.storyId, composer.selectedIds);
        toast({ title: "Produits de la story mis à jour" });
      } else if (composer.file) {
        await publishStory(composer.file, composer.duration, composer.selectedIds);
        toast({ title: "Story publiée pour 24 heures" });
      }
      closeComposer();
      loadStories();
    } catch (err) {
      toast({
        title: composer.storyId ? "Liaison impossible" : "Publication impossible",
        description: getUserErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const removeStory = async (story: StoryItem) => {
    const accepted = await confirmAction({
      title: "Supprimer cette story ?",
      description: "Elle disparaît tout de suite du fil public.",
      confirmLabel: "Supprimer",
      cancelLabel: "Annuler",
      variant: "danger",
    });
    if (!accepted) return;
    setBusy(true);
    try {
      await deleteStory(story.id);
      setStories((current) => current.filter((item) => item.id !== story.id));
      toast({ title: "Story supprimée" });
    } catch (err) {
      toast({
        title: "Suppression impossible",
        description: getUserErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  if (loading && !badge) {
    return <p className="text-sm text-slate-500">Chargement du badge…</p>;
  }
  if (error && !badge) {
    return <p className="text-sm text-bibocom-error">{error}</p>;
  }
  if (!badge) return null;

  const ends = badge.subscription?.endsAt;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-bibocom-accent">Badge du compte</p>
            <h2 className="mt-1 text-2xl font-semibold text-bibocom-primary">
              {badge.active ? "Badge actif" : "Badge inactif"}
            </h2>
            <p className="mt-2 max-w-xl text-sm text-slate-600">
              {formatFcfa(badge.quotedPriceCfa ?? badge.settings.priceCfa)} pour {badge.settings.durationDays} jours, puis{" "}
              {badge.settings.graceDays} jours de grâce. Le badge apparaît aussi sur la boutique.
              {ends ? ` Échéance : ${formatDateFr(ends)}.` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void buy()}
            disabled={busy || !badge.settings.saleOpen}
            className="rounded-xl bg-bibocom-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy ? "Redirection…" : badge.active ? "Renouveler" : "Obtenir le badge"}
          </button>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-bibocom-primary">Stories</h3>
        <p className="mt-1 text-sm text-slate-600">
          Photo ou vidéo de 30 secondes maximum. Visibles 24 heures, réservées aux comptes avec un badge actif.
          {user?.role === "MERCHANT"
            ? " Le choix des produits se fait dans la fenêtre de publication, avant l’envoi."
            : ""}
        </p>
        <button
          type="button"
          disabled={!badge.active || busy}
          onClick={() => openComposer()}
          className="mt-4 rounded-xl bg-bibocom-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {badge.active ? "Publier une story" : "Badge requis"}
        </button>
        {stories.length === 0 ? (
          <p className="mt-5 text-sm text-slate-500">Aucune story pour le moment.</p>
        ) : (
          <ul className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {stories.map((story) => {
              const status = storyStatus(story);
              return (
                <li key={story.id} className="overflow-hidden rounded-2xl ring-1 ring-slate-100">
                  {missingMedia.includes(story.id) ? (
                    <div className="flex h-40 items-center justify-center bg-slate-100 px-3 text-center text-sm text-slate-500">
                      Média introuvable. Vous pouvez supprimer cette story.
                    </div>
                  ) : story.mediaType === "VIDEO" ? (
                    <video
                      src={story.mediaUrl}
                      className="h-40 w-full bg-slate-900 object-cover"
                      controls
                      onError={() => setMissingMedia((current) => (current.includes(story.id) ? current : [...current, story.id]))}
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={story.mediaUrl}
                      alt=""
                      className="h-40 w-full object-cover"
                      onError={() => setMissingMedia((current) => (current.includes(story.id) ? current : [...current, story.id]))}
                    />
                  )}
                  <div className="space-y-2 p-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${status.className}`}>
                      {status.label}
                    </span>
                    <p className="text-xs text-slate-500">
                      {story.mediaType === "VIDEO" ? "Vidéo" : "Photo"}
                      {story.durationSeconds ? ` · ${story.durationSeconds} s` : ""}
                      {" · "}
                      {formatDateFr(story.createdAt)}
                    </p>
                    {story.products && story.products.length > 0 ? (
                      <p className="text-xs text-slate-600">{story.products.map((product) => product.name).join(", ")}</p>
                    ) : (
                      <p className="text-xs text-slate-400">Aucun produit lié</p>
                    )}
                    <div className="flex items-center gap-3">
                      {user?.role === "MERCHANT" ? (
                        <button
                          type="button"
                          onClick={() => openComposer(story)}
                          disabled={busy}
                          className="text-sm font-medium text-bibocom-primary hover:underline disabled:opacity-50"
                        >
                          Lier des produits
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => void removeStory(story)}
                        disabled={busy}
                        className="text-sm font-medium text-red-600 hover:underline disabled:opacity-50"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      {composer ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center">
          <button type="button" className="absolute inset-0 bg-bibocom-primary/45" aria-label="Fermer" onClick={closeComposer} />
          <div role="dialog" aria-modal="true" className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[22px] bg-white p-5 shadow-2xl">
            <h2 className="text-lg font-semibold text-bibocom-primary">
              {composer.storyId ? "Lier des produits" : "Publier une story"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {composer.storyId
                ? "Cochez jusqu’à trois produits publiés. Le lecteur affichera leur bouton Ajouter."
                : "Choisissez d’abord le média, puis les produits à afficher dans le lecteur."}
            </p>
            {composer.storyId ? null : (
              <div className="mt-4">
                <label className="inline-flex cursor-pointer rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-bibocom-primary">
                  {composer.file ? "Changer le fichier" : "Choisir une photo ou une vidéo"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
                    className="hidden"
                    onChange={(event) => void onPickFile(event)}
                  />
                </label>
                {composer.previewUrl ? (
                  composer.file?.type.startsWith("video/") ? (
                    <video src={composer.previewUrl} className="mt-3 h-40 w-full rounded-xl bg-slate-900 object-cover" muted controls />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={composer.previewUrl} alt="" className="mt-3 h-40 w-full rounded-xl object-cover" />
                  )
                ) : null}
              </div>
            )}
            <p className="mt-5 text-sm font-medium text-bibocom-primary">Produits de la boutique</p>
            {catalog.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">Aucun produit pour le moment.</p>
            ) : (
              <ul className="mt-2 max-h-52 space-y-1 overflow-y-auto">
                {catalog.map((product) => {
                  const published = product.status === "PUBLISHED";
                  const checked = composer.selectedIds.includes(product.id);
                  const price = product.promoPrice && product.promoPrice > 0 ? product.promoPrice : product.price;
                  return (
                    <li key={product.id}>
                      <label className={`flex items-center gap-3 rounded-xl px-2 py-1.5 text-sm ${published ? "cursor-pointer text-bibocom-primary hover:bg-slate-50" : "text-slate-400"}`}>
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={!published || busy || (!checked && composer.selectedIds.length >= MAX_LINKED_PRODUCTS)}
                          onChange={() => toggleLinkedProduct(product.id, published)}
                          className="accent-[#FF7E5F]"
                        />
                        <span className="min-w-0 flex-1 truncate">{product.name}</span>
                        <span className="shrink-0 text-xs">
                          {published ? `${Math.round(price).toLocaleString("fr-FR")} FCFA` : "Brouillon"}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
            {catalog.length > 0 && catalog.every((product) => product.status !== "PUBLISHED") ? (
              <p className="mt-3 text-sm text-slate-500">
                Ces produits sont en brouillon. Publiez-les dans Produits pour pouvoir les lier à la story.
              </p>
            ) : null}
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={closeComposer} className="rounded-full px-4 py-2 text-sm font-medium text-slate-500">
                Annuler
              </button>
              <button
                type="button"
                disabled={busy || (!composer.storyId && !composer.file)}
                onClick={() => void submitComposer()}
                className="rounded-full bg-bibocom-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {busy ? "Envoi…" : composer.storyId ? "Enregistrer" : "Publier"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
