"use client";

import React, { useEffect, useState } from "react";
import { getUserErrorMessage } from "@domain/errors/app-error";
import { formatFcfa } from "@/lib/admin-analytics";
import {
  createAd,
  deleteAd,
  downloadFinanceCsv,
  enableTwoFactor,
  getFinance,
  listAdminAds,
  listAdminTickets,
  listReports,
  replyTicket,
  reviewReport,
  setSuspended,
  setTicketStatus,
  setupTwoFactor,
  updateAd,
  warnUser,
  type AdminAd,
  type FinanceSummary,
  type StoryReport,
  type Ticket,
} from "@/services/platformService";
import { useToast } from "@/hooks/use-toast";
import { AdminInput, AdminSelect, GhostButton, Panel, StateMessage } from "./ui";

function useLoad<T>(enabled: boolean, load: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const refresh = () => {
    if (!enabled) return;
    setLoading(true);
    load()
      .then(setData)
      .catch((err) => setError(getUserErrorMessage(err)))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);
  return { data, error, loading, refresh };
}

export function AdminFinanceView({ enabled }: { enabled: boolean }) {
  const { data, error, loading } = useLoad<FinanceSummary>(enabled, getFinance);
  const print = () => window.print();
  const csv = async () => {
    const text = await downloadFinanceCsv();
    const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "bibocom-badges.csv";
    link.click();
    URL.revokeObjectURL(url);
  };
  if (loading) return <StateMessage>Chargement des chiffres…</StateMessage>;
  if (error || !data) return <StateMessage>{error || "Indisponible"}</StateMessage>;
  return (
    <div className="space-y-4 print:text-black">
      <div className="flex gap-2 print:hidden">
        <GhostButton onClick={() => void csv()}>Excel (CSV)</GhostButton>
        <GhostButton onClick={print}>PDF</GhostButton>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <Panel className="p-4"><p className="text-xs text-white/50">Badges encaissés</p><p className="text-xl">{formatFcfa(data.badgeTotal)}</p><p className="text-xs text-white/40">{data.badgeCount} paiements</p></Panel>
        <Panel className="p-4"><p className="text-xs text-white/50">Ventes du mois</p><p className="text-xl">{formatFcfa(data.monthRevenue)}</p><p className="text-xs text-white/40">{data.monthOrders} commandes</p></Panel>
        <Panel className="p-4"><p className="text-xs text-white/50">Ventes de l’année</p><p className="text-xl">{formatFcfa(data.yearRevenue)}</p><p className="text-xs text-white/40">{data.yearOrders} commandes</p></Panel>
      </div>
      <Panel className="p-4">
        <p className="mb-2 text-sm text-white/70">Historique des badges</p>
        <ul className="space-y-1 text-sm">
          {data.badges.map((row) => (
            <li key={row.id} className="flex justify-between gap-3 text-white/80">
              <span>{`${row.user.firstName || ""} ${row.user.lastName || ""}`.trim() || row.user.phoneNumber}</span>
              <span>{formatFcfa(row.priceCfa)}</span>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

export function AdminReportsView({ enabled }: { enabled: boolean }) {
  const { data, error, loading, refresh } = useLoad<StoryReport[]>(enabled, listReports);
  const [message, setMessage] = useState("");
  if (loading) return <StateMessage>Chargement des signalements…</StateMessage>;
  if (error) return <StateMessage>{error}</StateMessage>;
  return (
    <div className="space-y-3">
      {(data ?? []).length === 0 ? <StateMessage>Aucun signalement.</StateMessage> : null}
      {(data ?? []).map((report) => (
        <Panel key={report.id} className="space-y-2 p-4">
          <p className="text-sm text-white">{report.reason}</p>
          <p className="text-xs text-white/50">Story {report.story.id} · {report.status}</p>
          <div className="flex flex-wrap gap-2">
            <GhostButton onClick={() => void reviewReport(report.id).then(refresh)}>Marquer traité</GhostButton>
            <GhostButton onClick={() => void warnUser(report.story.userId, message || report.reason).then(refresh)}>Avertir</GhostButton>
            <GhostButton onClick={() => void setSuspended(report.story.userId, true).then(refresh)}>Suspendre</GhostButton>
          </div>
          <input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Texte de l’avertissement" className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm" />
        </Panel>
      ))}
    </div>
  );
}

const AD_STATUS: Record<string, { label: string; className: string }> = {
  PENDING: { label: "En attente", className: "bg-amber-400/15 text-amber-200" },
  PUBLISHED: { label: "Publiée", className: "bg-emerald-400/15 text-emerald-300" },
  REJECTED: { label: "Refusée", className: "bg-rose-400/15 text-rose-300" },
};

function adStatusMeta(status: string) {
  return AD_STATUS[status] ?? { label: status, className: "bg-white/10 text-white/60" };
}

export function AdminAdsView({ enabled }: { enabled: boolean }) {
  const { toast } = useToast();
  const { data, error, loading, refresh } = useLoad<AdminAd[]>(enabled, listAdminAds);
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [editing, setEditing] = useState<AdminAd | null>(null);
  const [busy, setBusy] = useState(false);

  const fail = (err: unknown) => {
    toast({ title: "Action impossible", description: getUserErrorMessage(err), variant: "destructive" });
  };

  const propose = async () => {
    setBusy(true);
    try {
      await createAd({ title, imageUrl, linkUrl });
      setTitle("");
      setImageUrl("");
      setLinkUrl("");
      toast({ title: "Publicité proposée", description: "Elle est en attente de publication." });
      refresh();
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    if (!editing) return;
    setBusy(true);
    try {
      await updateAd(editing.id, {
        title: editing.title,
        imageUrl: editing.imageUrl,
        linkUrl: editing.linkUrl || null,
        status: editing.status,
      });
      setEditing(null);
      toast({ title: "Publicité mise à jour" });
      refresh();
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (ad: AdminAd) => {
    if (!window.confirm(`Supprimer « ${ad.title} » ?`)) return;
    setBusy(true);
    try {
      await deleteAd(ad.id);
      if (editing?.id === ad.id) setEditing(null);
      toast({ title: "Publicité supprimée" });
      refresh();
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <StateMessage>Chargement des publicités…</StateMessage>;
  if (error) return <StateMessage>{error}</StateMessage>;
  return (
    <div className="space-y-4">
      <Panel className="space-y-2 p-4">
        <h2 className="text-sm font-semibold text-white">Nouvelle publicité</h2>
        <AdminInput value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Titre" />
        <AdminInput value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="URL de l’image" />
        <AdminInput value={linkUrl} onChange={(event) => setLinkUrl(event.target.value)} placeholder="Lien (facultatif)" />
        <GhostButton disabled={busy} onClick={() => void propose()}>
          {busy ? "Envoi…" : "Proposer"}
        </GhostButton>
      </Panel>
      {(data ?? []).length === 0 ? <StateMessage>Aucune publicité.</StateMessage> : null}
      {(data ?? []).map((ad) => {
        const status = adStatusMeta(ad.status);
        const open = editing?.id === ad.id;
        return (
          <Panel key={ad.id} className="space-y-3 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                {ad.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={ad.imageUrl} alt="" className="h-12 w-16 shrink-0 rounded-lg object-cover" />
                ) : null}
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">{ad.title}</p>
                  <span className={`mt-1 inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${status.className}`}>
                    {status.label}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <GhostButton disabled={busy} onClick={() => setEditing(open ? null : { ...ad })}>
                  {open ? "Fermer" : "Modifier"}
                </GhostButton>
                <GhostButton disabled={busy} onClick={() => void remove(ad)} className="text-rose-200">
                  Supprimer
                </GhostButton>
              </div>
            </div>
            {open && editing ? (
              <div className="grid gap-2 border-t border-white/5 pt-3 md:grid-cols-2">
                <AdminInput
                  value={editing.title}
                  onChange={(event) => setEditing({ ...editing, title: event.target.value })}
                  placeholder="Titre"
                />
                <AdminSelect
                  value={editing.status}
                  onChange={(event) => setEditing({ ...editing, status: event.target.value })}
                >
                  <option value="PENDING">En attente</option>
                  <option value="PUBLISHED">Publiée</option>
                  <option value="REJECTED">Refusée</option>
                </AdminSelect>
                <AdminInput
                  className="md:col-span-2"
                  value={editing.imageUrl}
                  onChange={(event) => setEditing({ ...editing, imageUrl: event.target.value })}
                  placeholder="URL de l’image"
                />
                <AdminInput
                  className="md:col-span-2"
                  value={editing.linkUrl || ""}
                  onChange={(event) => setEditing({ ...editing, linkUrl: event.target.value })}
                  placeholder="Lien (facultatif)"
                />
                <div className="md:col-span-2">
                  <GhostButton disabled={busy} onClick={() => void save()}>
                    Enregistrer
                  </GhostButton>
                </div>
              </div>
            ) : null}
          </Panel>
        );
      })}
    </div>
  );
}

export function AdminTicketsView({ enabled }: { enabled: boolean }) {
  const { data, error, loading, refresh } = useLoad<Ticket[]>(enabled, listAdminTickets);
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  if (loading) return <StateMessage>Chargement des tickets…</StateMessage>;
  if (error) return <StateMessage>{error}</StateMessage>;
  return (
    <div className="space-y-3">
      {(data ?? []).map((ticket) => (
        <Panel key={ticket.id} className="space-y-2 p-4">
          <p className="font-medium text-white">{ticket.subject}</p>
          <p className="text-xs text-white/50">{ticket.status}</p>
          {ticket.messages.map((message) => (
            <p key={message.id} className="text-sm text-white/80">{message.body}</p>
          ))}
          <textarea value={drafts[ticket.id] || ""} onChange={(event) => setDrafts({ ...drafts, [ticket.id]: event.target.value })} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm" />
          <div className="flex flex-wrap gap-2">
            <GhostButton onClick={() => void replyTicket(ticket.id, drafts[ticket.id] || "").then(refresh)}>Répondre</GhostButton>
            <GhostButton onClick={() => void setTicketStatus(ticket.id, "ESCALATED").then(refresh)}>Transférer</GhostButton>
            <GhostButton onClick={() => void setTicketStatus(ticket.id, "CLOSED").then(refresh)}>Fermer</GhostButton>
          </div>
        </Panel>
      ))}
    </div>
  );
}

export function AdminSecurityView() {
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  return (
    <Panel className="max-w-lg space-y-3 p-5">
      <p className="text-sm text-white/70">Double authentification par code à 6 chiffres, à ajouter dans une application d’authentification.</p>
      <GhostButton onClick={() => void setupTwoFactor().then((data) => setSecret(data.secret)).catch((err) => setMessage(getUserErrorMessage(err)))}>Générer une clé</GhostButton>
      {secret ? <p className="break-all text-sm text-white">{secret}</p> : null}
      <input value={code} onChange={(event) => setCode(event.target.value)} placeholder="Code à 6 chiffres" className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm" />
      <GhostButton onClick={() => void enableTwoFactor(code).then(() => setMessage("Double authentification activée")).catch((err) => setMessage(getUserErrorMessage(err)))}>Activer</GhostButton>
      {message ? <p className="text-sm text-white/70">{message}</p> : null}
    </Panel>
  );
}
