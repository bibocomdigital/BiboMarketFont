"use client";

import React from "react";
import { ChevronLeft } from "lucide-react";
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
        "overflow-hidden rounded-[18px] bg-white text-bibocom-primary shadow-[0_8px_30px_rgba(10,37,64,0.04)] ring-1 ring-slate-100",
        className
      )}
    >
      {children}
    </section>
  );
}

export function BackButton({
  onClick,
  label = "Retour",
  className,
}: {
  onClick: () => void;
  label?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-bibocom-accent/10 px-3 py-1.5 text-sm font-medium text-bibocom-accent transition-colors hover:bg-bibocom-accent/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bibocom-accent/40",
        className
      )}
    >
      <ChevronLeft className="h-4 w-4" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

export function StatusPill({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
  children: React.ReactNode;
}) {
  const styles = {
    neutral: "bg-slate-100 text-slate-600",
    success: "bg-bibocom-success/15 text-bibocom-success",
    warning: "bg-bibocom-warning/20 text-amber-700",
    danger: "bg-bibocom-error/10 text-bibocom-error",
    info: "bg-bibocom-secondary/30 text-bibocom-primary",
  } as const;
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", styles[tone])}>
      {children}
    </span>
  );
}

export function StateMessage({ children }: { children: React.ReactNode }) {
  return <p className="px-5 py-12 text-center text-sm text-slate-500">{children}</p>;
}

export function ClientInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-bibocom-primary placeholder:text-slate-400 outline-none transition-shadow focus:border-bibocom-accent/40 focus:bg-white focus:ring-2 focus:ring-bibocom-accent/20 disabled:opacity-50",
        className
      )}
    />
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
        "rounded-full bg-bibocom-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-bibocom-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bibocom-accent/40 disabled:cursor-not-allowed disabled:opacity-40",
        className
      )}
    >
      {children}
    </button>
  );
}

export function queryErrorMessage(error: unknown, fallback = "Impossible de charger les données.") {
  const status = getErrorStatus(error);
  if (status === 404) return "Ressource introuvable.";
  if (status === 403) return "Accès refusé.";
  return getUserErrorMessage(error) || fallback;
}
