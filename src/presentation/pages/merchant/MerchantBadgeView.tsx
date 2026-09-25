"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getUserErrorMessage } from "@domain/errors/app-error";
import { useToast } from "@/hooks/use-toast";
import {
  checkoutBadge,
  confirmBadge,
  getMyBadge,
  publishStory,
  type MyBadge,
} from "@/services/badgeService";
import { formatDateFr, formatFcfa } from "@/lib/admin-analytics";

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

export function MerchantBadgeView() {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [badge, setBadge] = useState<MyBadge | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

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
          if (!cancelled) toast({ title: getUserErrorMessage(err), variant: "destructive" });
        }
      }
      if (cancelled) return;
      try {
        const next = await getMyBadge();
        if (!cancelled) setBadge(next);
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
      toast({ title: getUserErrorMessage(err), variant: "destructive" });
      setBusy(false);
    }
  };

  const onFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setBusy(true);
    try {
      let duration: number | undefined;
      if (file.type.startsWith("video/")) {
        duration = await readVideoDuration(file);
        if (duration > 30) {
          toast({ title: "La vidéo doit durer au plus 30 secondes", variant: "destructive" });
          return;
        }
        duration = Math.ceil(duration);
      }
      await publishStory(file, duration);
      toast({ title: "Story publiée pour 24 heures" });
    } catch (err) {
      toast({ title: getUserErrorMessage(err), variant: "destructive" });
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
        </p>
        <label className="mt-4 inline-flex cursor-pointer rounded-xl bg-bibocom-primary px-4 py-2 text-sm font-medium text-white">
          {badge.active ? "Publier une story" : "Badge requis"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
            className="hidden"
            disabled={!badge.active || busy}
            onChange={(event) => void onFile(event)}
          />
        </label>
      </section>
    </div>
  );
}
