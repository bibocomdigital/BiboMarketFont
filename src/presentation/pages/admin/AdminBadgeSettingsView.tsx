"use client";

import React, { useEffect, useState } from "react";
import { BadgeCheck, Clock3, Package, Store } from "lucide-react";
import { getUserErrorMessage } from "@domain/errors/app-error";
import { confirmAction } from "@/components/feedback/confirm-dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  deleteShopPlan,
  getBadgeSettings,
  listAdminShopPlans,
  saveShopPlan,
  updateBadgeSettings,
  type BadgeSettings,
  type ShopPlan,
} from "@/services/badgeService";
import { GhostButton, Panel, StateMessage } from "./ui";

const fieldClass =
  "mt-1.5 w-full rounded-xl border border-white/10 bg-[#16141f] px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#7ee8d8]/70";

const emptyDraft = {
  name: "",
  priceCfa: "",
  durationDays: "",
  maxProducts: "",
  active: true,
  sortOrder: 0,
};

function formatFcfa(value: number) {
  return `${value.toLocaleString("fr-FR")} FCFA`;
}

function planPrice(value: number) {
  return value === 0 ? "Gratuit" : formatFcfa(value);
}

export function AdminBadgeSettingsView({ enabled }: { enabled: boolean }) {
  const { toast } = useToast();
  const [settings, setSettings] = useState<BadgeSettings | null>(null);
  const [plans, setPlans] = useState<ShopPlan[]>([]);
  const [draft, setDraft] = useState(emptyDraft);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    return Promise.all([getBadgeSettings(), listAdminShopPlans()])
      .then(([data, rows]) => {
        setSettings(data);
        setPlans(rows);
        setError("");
      })
      .catch((err) => setError(getUserErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!enabled) return;
    void load();
  }, [enabled]);

  const save = async () => {
    if (!settings) return;
    setSavingSettings(true);
    try {
      const next = await updateBadgeSettings(settings);
      setSettings(next);
      toast({ title: "Tarif enregistré" });
    } catch (err) {
      toast({ title: getUserErrorMessage(err), variant: "destructive" });
    } finally {
      setSavingSettings(false);
    }
  };

  const resetDraft = () => {
    setEditingId(null);
    setDraft(emptyDraft);
  };

  const savePlan = async () => {
    setSavingPlan(true);
    try {
      await saveShopPlan(
        {
          name: draft.name,
          priceCfa: Number(draft.priceCfa),
          durationDays: Number(draft.durationDays),
          maxProducts: Number(draft.maxProducts),
          active: draft.active,
          sortOrder: draft.sortOrder,
        },
        editingId ?? undefined,
      );
      const updated = Boolean(editingId);
      resetDraft();
      setPlans(await listAdminShopPlans());
      toast({ title: updated ? "Formule mise à jour" : "Formule créée" });
    } catch (err) {
      toast({ title: getUserErrorMessage(err), variant: "destructive" });
    } finally {
      setSavingPlan(false);
    }
  };

  const removePlan = async (plan: ShopPlan) => {
    const accepted = await confirmAction({
      title: `Retirer ${plan.name} ?`,
      description: "Une formule déjà utilisée par une boutique sera masquée.",
      confirmLabel: "Retirer",
      variant: "danger",
    });
    if (!accepted) return;
    try {
      await deleteShopPlan(plan.id);
      if (editingId === plan.id) resetDraft();
      setPlans(await listAdminShopPlans());
    } catch (err) {
      toast({ title: getUserErrorMessage(err), variant: "destructive" });
    }
  };

  if (loading) return <StateMessage>Chargement du tarif…</StateMessage>;
  if (error || !settings) return <StateMessage>{error || "Tarif indisponible"}</StateMessage>;

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
      <div className="space-y-4">
      <Panel className="p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#7ee8d8]/15 text-[#7ee8d8]">
            <BadgeCheck className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-semibold">Tarif du badge</h2>
            <p className="mt-1 text-sm text-white/50">
              Ces prix s’appliquent aux prochains achats. Un badge déjà payé conserve le montant de sa facture.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm text-white/70">
            Prix commerçant
            <input
              type="number"
              min={0}
              value={settings.priceCfa}
              onChange={(event) => setSettings({ ...settings, priceCfa: Number(event.target.value) })}
              className={fieldClass}
            />
          </label>
          <label className="block text-sm text-white/70">
            Prix livreur
            <input
              type="number"
              min={0}
              value={settings.supplierPriceCfa ?? 0}
              onChange={(event) => setSettings({ ...settings, supplierPriceCfa: Number(event.target.value) })}
              className={fieldClass}
            />
          </label>
          <label className="block text-sm text-white/70">
            Durée (jours)
            <input
              type="number"
              min={1}
              value={settings.durationDays}
              onChange={(event) => setSettings({ ...settings, durationDays: Number(event.target.value) })}
              className={fieldClass}
            />
          </label>
          <label className="block text-sm text-white/70">
            Grâce (jours)
            <input
              type="number"
              min={0}
              value={settings.graceDays}
              onChange={(event) => setSettings({ ...settings, graceDays: Number(event.target.value) })}
              className={fieldClass}
            />
          </label>
        </div>

        <label className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-white/5 px-3 py-3 text-sm">
          <span>
            <span className="block text-white/90">Vente ouverte</span>
            <span className="block text-xs text-white/40">Les comptes peuvent acheter le badge</span>
          </span>
          <input
            type="checkbox"
            checked={settings.saleOpen}
            onChange={(event) => setSettings({ ...settings, saleOpen: event.target.checked })}
            className="h-4 w-4 accent-[#7ee8d8]"
          />
        </label>

        <button
          type="button"
          onClick={() => void save()}
          disabled={savingSettings}
          className="mt-4 w-full rounded-xl bg-[#7ee8d8] px-4 py-2.5 text-sm font-medium text-[#12101a] disabled:opacity-50"
        >
          {savingSettings ? "Enregistrement…" : "Enregistrer le tarif"}
        </button>
      </Panel>

      <Panel className="p-5">
        <div className="flex items-center gap-2">
          <Store className="h-4 w-4 text-[#7ee8d8]" />
          <h3 className="text-sm font-medium">
            {editingId ? `Modifier ${draft.name || "la formule"}` : "Nouvelle formule"}
          </h3>
        </div>
        <div className="mt-4 grid gap-3">
          <label className="block text-sm text-white/70">
            Nom
            <input
              value={draft.name}
              placeholder="Nom de la formule"
              onChange={(event) => setDraft({ ...draft, name: event.target.value })}
              className={fieldClass}
            />
          </label>
          <label className="block text-sm text-white/70">
            Prix (FCFA)
            <input
              type="number"
              min={0}
              value={draft.priceCfa}
              placeholder="0 si gratuit"
              onChange={(event) => setDraft({ ...draft, priceCfa: event.target.value })}
              className={fieldClass}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm text-white/70">
              Durée (jours)
              <input
                type="number"
                min={1}
                value={draft.durationDays}
                placeholder="365"
                onChange={(event) => setDraft({ ...draft, durationDays: event.target.value })}
                className={fieldClass}
              />
            </label>
            <label className="block text-sm text-white/70">
              Produits
              <input
                type="number"
                min={1}
                value={draft.maxProducts}
                placeholder="10"
                onChange={(event) => setDraft({ ...draft, maxProducts: event.target.value })}
                className={fieldClass}
              />
            </label>
          </div>
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm text-white/80">
          <input
            type="checkbox"
            checked={draft.active}
            onChange={(event) => setDraft({ ...draft, active: event.target.checked })}
            className="h-4 w-4 accent-[#7ee8d8]"
          />
          Proposée à la création d’une boutique
        </label>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void savePlan()}
            disabled={savingPlan}
            className="rounded-xl bg-[#7ee8d8] px-4 py-2 text-sm font-medium text-[#12101a] disabled:opacity-50"
          >
            {savingPlan ? "Enregistrement…" : editingId ? "Mettre à jour" : "Ajouter la formule"}
          </button>
          {editingId ? <GhostButton onClick={resetDraft}>Annuler</GhostButton> : null}
        </div>
      </Panel>
      </div>

      <div className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Formules boutique</h2>
            <p className="mt-1 text-sm text-white/50">
              Prix, durée et nombre de produits. Une boutique déjà ouverte sans formule reste illimitée.
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-white/5 px-2.5 py-1 text-xs text-white/50">
            {plans.length} formule{plans.length > 1 ? "s" : ""}
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {plans.map((plan) => {
            const selected = editingId === plan.id;
            return (
              <article
                key={plan.id}
                className={cn(
                  "rounded-2xl border bg-[#221e30] p-4",
                  selected ? "border-[#7ee8d8]/60" : "border-white/10",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-medium">{plan.name}</h3>
                    <p className={cn("mt-1 text-lg font-semibold", plan.priceCfa === 0 ? "text-[#7ee8d8]" : "text-white")}>
                      {planPrice(plan.priceCfa)}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-medium",
                      plan.active ? "bg-emerald-400/15 text-emerald-300" : "bg-white/10 text-white/45",
                    )}
                  >
                    {plan.active ? "Proposée" : "Masquée"}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <p className="flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-2 text-white/70">
                    <Clock3 className="h-3.5 w-3.5 text-white/35" />
                    {plan.durationDays} jours
                  </p>
                  <p className="flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-2 text-white/70">
                    <Package className="h-3.5 w-3.5 text-white/35" />
                    {plan.maxProducts} produits
                  </p>
                </div>
                <div className="mt-3 flex gap-2">
                  <GhostButton
                    onClick={() => {
                      setEditingId(plan.id);
                      setDraft({
                        name: plan.name,
                        priceCfa: String(plan.priceCfa),
                        durationDays: String(plan.durationDays),
                        maxProducts: String(plan.maxProducts),
                        active: plan.active,
                        sortOrder: plan.sortOrder,
                      });
                    }}
                  >
                    Modifier
                  </GhostButton>
                  <GhostButton onClick={() => void removePlan(plan)}>Supprimer</GhostButton>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
