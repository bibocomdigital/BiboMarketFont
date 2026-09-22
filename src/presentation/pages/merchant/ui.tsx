"use client";

import React from "react";
import { getErrorStatus, getUserErrorMessage } from "@domain/errors/app-error";
import { cn } from "@/lib/utils";

export function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl bg-white text-bibocom-primary shadow-sm ring-1 ring-slate-100",
        className
      )}
    >
      {children}
    </section>
  );
}

export function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-slate-400">
      {children}
    </th>
  );
}

export function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={cn("whitespace-nowrap px-4 py-3 text-sm text-slate-700", className)}>{children}</td>
  );
}

export function StateMessage({ children }: { children: React.ReactNode }) {
  return <p className="px-5 py-10 text-sm text-slate-500">{children}</p>;
}

export function MobileCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("rounded-2xl bg-slate-50 p-4", className)}>{children}</div>;
}

export function StatusPill({
  active,
  yes = "Oui",
  no = "Non",
}: {
  active: boolean;
  yes?: string;
  no?: string;
}) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
        active ? "bg-bibocom-success/15 text-bibocom-success" : "bg-slate-100 text-slate-500"
      }`}
    >
      {active ? yes : no}
    </span>
  );
}

export function MerchantInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-bibocom-primary placeholder:text-slate-400 focus:border-bibocom-secondary focus:outline-none",
        className
      )}
    />
  );
}

export function MerchantSelect({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-bibocom-primary focus:border-bibocom-secondary focus:outline-none",
        className
      )}
    >
      {children}
    </select>
  );
}

export function GhostButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-bibocom-primary hover:bg-slate-200 disabled:opacity-40",
        className
      )}
    >
      {children}
    </button>
  );
}

export function AccentButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "rounded-lg bg-bibocom-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-bibocom-accent/90 disabled:opacity-40",
        className
      )}
    >
      {children}
    </button>
  );
}

export function PaginationBar({
  page,
  totalPages,
  total,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-sm text-slate-500">
      <span>
        {total} résultat{total > 1 ? "s" : ""}
      </span>
      {totalPages > 1 ? (
        <div className="flex items-center gap-2">
          <GhostButton disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
            Précédent
          </GhostButton>
          <span>
            {page} / {totalPages}
          </span>
          <GhostButton disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
            Suivant
          </GhostButton>
        </div>
      ) : null}
    </div>
  );
}

export function ConfirmBar({
  title,
  message,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  onConfirm,
  onCancel,
  danger,
}: {
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bibocom-primary/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 text-bibocom-primary shadow-2xl">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="mt-2 text-sm text-slate-600">{message}</div>
        <div className="mt-5 flex justify-end gap-2">
          <GhostButton onClick={onCancel}>{cancelLabel}</GhostButton>
          <button
            type="button"
            onClick={onConfirm}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium text-white",
              danger ? "bg-bibocom-error" : "bg-bibocom-accent"
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function queryErrorMessage(error: unknown, fallback = "Impossible de charger les données.") {
  const status = getErrorStatus(error);
  if (status === 404) return "Ressource introuvable.";
  if (status === 403) return "Accès refusé.";
  return getUserErrorMessage(error) || fallback;
}

export function isShopMissingError(error: unknown) {
  const status = getErrorStatus(error);
  if (status === 404 || status === 403) return true;
  const message = getUserErrorMessage(error).toLowerCase();
  return (
    message.includes("aucune boutique") ||
    message.includes("pas un marchand") ||
    (message.includes("boutique") && message.includes("trouv"))
  );
}
