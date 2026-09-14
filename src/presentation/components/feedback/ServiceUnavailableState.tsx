"use client";

import { CloudOff, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

type ServiceUnavailableStateProps = {
  title?: string;
  description?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
  showPlaceholders?: boolean;
  className?: string;
};

export function ServiceUnavailableState({
  title = "Service temporairement indisponible",
  description = "Nous n'arrivons pas à joindre le serveur pour le moment. Réessayez dans un instant.",
  onRetry,
  isRetrying = false,
  showPlaceholders = false,
  className,
}: ServiceUnavailableStateProps) {
  return (
    <div
      className={cn(
        "flex w-full flex-col items-center justify-center px-6 py-14 text-center",
        className
      )}
    >
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-bibocom-primary/10 text-bibocom-primary">
        <CloudOff size={28} strokeWidth={1.7} />
      </div>

      <h3 className="text-xl font-semibold tracking-tight text-bibocom-primary">
        {title}
      </h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">
        {description}
      </p>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          disabled={isRetrying}
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-bibocom-primary px-5 text-sm font-medium text-white transition-all duration-200 hover:bg-[#081c30] disabled:cursor-not-allowed disabled:opacity-70"
        >
          <RefreshCw size={16} className={isRetrying ? "animate-spin" : undefined} />
          {isRetrying ? "Nouvelle tentative…" : "Réessayer"}
        </button>
      )}

      {showPlaceholders && (
        <div className="pointer-events-none mt-12 grid w-full max-w-3xl grid-cols-2 gap-4 opacity-40 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-36 rounded-2xl bg-slate-100 ring-1 ring-slate-200/80"
            />
          ))}
        </div>
      )}
    </div>
  );
}
