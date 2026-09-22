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
    <section className={cn("overflow-hidden rounded-2xl bg-[#221e30] shadow-sm", className)}>
      {children}
    </section>
  );
}

export function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-white/40">
      {children}
    </th>
  );
}

export function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={cn("whitespace-nowrap px-4 py-3 text-sm text-white/80", className)}>{children}</td>
  );
}

export function StateMessage({ children }: { children: React.ReactNode }) {
  return <p className="px-5 py-10 text-sm text-white/50">{children}</p>;
}

export function MobileCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("rounded-2xl bg-white/5 p-4", className)}>{children}</div>;
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
        active ? "bg-emerald-400/15 text-emerald-300" : "bg-white/10 text-white/50"
      }`}
    >
      {active ? yes : no}
    </span>
  );
}

export function AdminInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "rounded-lg border border-white/10 bg-[#16141f] px-3 py-2 text-sm text-white placeholder:text-white/30",
        className
      )}
    />
  );
}

export function AdminSelect({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "rounded-lg border border-white/10 bg-[#16141f] px-3 py-2 text-sm text-white",
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
        "rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80 hover:bg-white/10 disabled:opacity-40",
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
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/5 px-4 py-3 text-sm text-white/50">
      <span>{total} résultat{total > 1 ? "s" : ""}</span>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-[#221e30] p-5 text-white shadow-2xl">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="mt-2 text-sm text-white/70">{message}</div>
        <div className="mt-5 flex justify-end gap-2">
          <GhostButton onClick={onCancel}>{cancelLabel}</GhostButton>
          <button
            type="button"
            onClick={onConfirm}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium",
              danger ? "bg-red-500/80 text-white" : "bg-[#7ee8d8] text-[#12101a]"
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
