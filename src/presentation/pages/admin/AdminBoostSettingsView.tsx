"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Rocket } from "lucide-react";
import { getUserErrorMessage } from "@domain/errors/app-error";
import { useToast } from "@/hooks/use-toast";
import {
  createBoostPlan,
  deleteBoostPlan,
  getBoostSettings,
  listBoostPlans,
  updateBoostPlan,
  updateBoostSettings,
  type BoostPlan,
  type BoostSettings,
} from "@/services/boostService";
import { Panel, StateMessage } from "./ui";

const fieldClass =
  "mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[#7ee8d8]";

export function AdminBoostSettingsView({ enabled }: { enabled: boolean }) {
  const { toast } = useToast();
  const [settings, setSettings] = useState<BoostSettings | null>(null);
  const [plans, setPlans] = useState<BoostPlan[]>([]);
  const [draft, setDraft] = useState({ name: "", priceCfa: "2000", durationDays: "7" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    if (!enabled) return;
    setLoading(true);
    Promise.all([getBoostSettings(), listBoostPlans()])
      .then(([nextSettings, nextPlans]) => {
        setSettings(nextSettings);
        setPlans(nextPlans.plans);
      })
      .catch((err) => setError(getUserErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [enabled]);

  useEffect(() => {
    load();
  }, [load]);

  const saveSale = async (saleOpen: boolean) => {
    if (!settings) return;
    setSaving(true);
    try {
      const next = await updateBoostSettings({ ...settings, saleOpen });
      setSettings(next);
      toast({ title: saleOpen ? "Vente de boost ouverte" : "Vente de boost fermée" });
    } catch (err) {
      toast({ title: "Enregistrement impossible", description: getUserErrorMessage(err), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const addPlan = async () => {
    setSaving(true);
    try {
      const created = await createBoostPlan({
        name: draft.name.trim(),
        priceCfa: Number(draft.priceCfa),
        durationDays: Number(draft.durationDays),
      });
      setPlans((current) => [...current, created]);
      setDraft({ name: "", priceCfa: "2000", durationDays: "7" });
      toast({ title: "Formule ajoutée" });
    } catch (err) {
      toast({ title: "Ajout impossible", description: getUserErrorMessage(err), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const savePlan = async (plan: BoostPlan) => {
    setSaving(true);
    try {
      const next = await updateBoostPlan(plan.id, plan);
      setPlans((current) => current.map((item) => (item.id === next.id ? next : item)));
      toast({ title: "Formule enregistrée" });
    } catch (err) {
      toast({ title: "Enregistrement impossible", description: getUserErrorMessage(err), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const removePlan = async (plan: BoostPlan) => {
    setSaving(true);
    try {
      await deleteBoostPlan(plan.id);
      setPlans((current) => current.filter((item) => item.id !== plan.id));
      toast({ title: "Formule supprimée" });
    } catch (err) {
      toast({ title: "Suppression impossible", description: getUserErrorMessage(err), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (!enabled) return null;
  if (loading) return <StateMessage>Chargement des formules…</StateMessage>;
  if (error || !settings) return <StateMessage>{error || "Formules indisponibles"}</StateMessage>;

  return (
    <Panel className="max-w-3xl p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#7ee8d8]/15 text-[#7ee8d8]">
          <Rocket className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-base font-semibold">Formules de boost</h2>
          <p className="mt-1 text-sm text-white/50">
            Chaque formule a son prix et sa durée. Le commerçant en choisit une avant de payer. Le prix déjà facturé ne change pas.
          </p>
        </div>
      </div>

      <label className="mt-5 flex items-center justify-between gap-3 rounded-xl bg-white/5 px-3 py-3 text-sm">
        <span>
          <span className="block text-white/90">Vente ouverte</span>
          <span className="block text-xs text-white/40">Les formules actives sont proposées aux commerçants</span>
        </span>
        <input
          type="checkbox"
          checked={settings.saleOpen}
          disabled={saving}
          onChange={(event) => void saveSale(event.target.checked)}
          className="h-4 w-4 accent-[#7ee8d8]"
        />
      </label>

      <ul className="mt-4 space-y-3">
        {plans.map((plan) => (
          <li key={plan.id} className="rounded-xl bg-white/5 p-3">
            <div className="grid gap-3 sm:grid-cols-[1fr_8rem_6rem_auto]">
              <label className="block text-xs text-white/50">
                Nom
                <input
                  value={plan.name}
                  onChange={(event) =>
                    setPlans((current) => current.map((item) => (item.id === plan.id ? { ...item, name: event.target.value } : item)))
                  }
                  className={fieldClass}
                />
              </label>
              <label className="block text-xs text-white/50">
                Prix (F CFA)
                <input
                  type="number"
                  min={0}
                  value={plan.priceCfa}
                  onChange={(event) =>
                    setPlans((current) =>
                      current.map((item) => (item.id === plan.id ? { ...item, priceCfa: Number(event.target.value) } : item)),
                    )
                  }
                  className={fieldClass}
                />
              </label>
              <label className="block text-xs text-white/50">
                Jours
                <input
                  type="number"
                  min={1}
                  max={90}
                  value={plan.durationDays}
                  onChange={(event) =>
                    setPlans((current) =>
                      current.map((item) => (item.id === plan.id ? { ...item, durationDays: Number(event.target.value) } : item)),
                    )
                  }
                  className={fieldClass}
                />
              </label>
              <label className="flex items-end gap-2 pb-2 text-sm text-white/80">
                <input
                  type="checkbox"
                  checked={plan.active}
                  onChange={(event) =>
                    setPlans((current) =>
                      current.map((item) => (item.id === plan.id ? { ...item, active: event.target.checked } : item)),
                    )
                  }
                  className="h-4 w-4 accent-[#7ee8d8]"
                />
                Proposée
              </label>
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button type="button" disabled={saving} onClick={() => void removePlan(plan)} className="rounded-lg px-3 py-1.5 text-sm text-red-300">
                Supprimer
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void savePlan(plan)}
                className="rounded-lg bg-[#7ee8d8] px-3 py-1.5 text-sm font-medium text-[#12101a] disabled:opacity-50"
              >
                Enregistrer
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-5 rounded-xl border border-dashed border-white/15 p-3">
        <p className="text-sm font-medium text-white/80">Nouvelle formule</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_8rem_6rem]">
          <input
            value={draft.name}
            onChange={(event) => setDraft({ ...draft, name: event.target.value })}
            placeholder="Ex. Semaine, Mois"
            className={fieldClass}
          />
          <input
            type="number"
            min={0}
            value={draft.priceCfa}
            onChange={(event) => setDraft({ ...draft, priceCfa: event.target.value })}
            className={fieldClass}
          />
          <input
            type="number"
            min={1}
            max={90}
            value={draft.durationDays}
            onChange={(event) => setDraft({ ...draft, durationDays: event.target.value })}
            className={fieldClass}
          />
        </div>
        <button
          type="button"
          disabled={saving || draft.name.trim().length < 2}
          onClick={() => void addPlan()}
          className="mt-3 rounded-xl bg-[#7ee8d8] px-4 py-2 text-sm font-medium text-[#12101a] disabled:opacity-50"
        >
          Ajouter la formule
        </button>
      </div>
    </Panel>
  );
}
