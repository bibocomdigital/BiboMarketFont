"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ConfirmVariant = "danger" | "default";

export type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
};

type ConfirmRequest = ConfirmOptions & {
  resolve: (accepted: boolean) => void;
};

const ConfirmContext = createContext<(options: ConfirmOptions) => Promise<boolean>>(
  async () => false,
);

let confirmImpl: (options: ConfirmOptions) => Promise<boolean> = async (options) => {
  if (typeof window === "undefined") return false;
  return window.confirm(options.description ? `${options.title}\n\n${options.description}` : options.title);
};

/** Confirmation personnalisée (promesse), utilisable hors hook. */
export function confirmAction(options: ConfirmOptions): Promise<boolean> {
  return confirmImpl(options);
}

export function useConfirm() {
  return useContext(ConfirmContext);
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);
  const resolveRef = useRef<((accepted: boolean) => void) | null>(null);

  const finish = useCallback((accepted: boolean) => {
    resolveRef.current?.(accepted);
    resolveRef.current = null;
    setRequest(null);
  }, []);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current?.(false);
      resolveRef.current = resolve;
      setRequest({ ...options, resolve });
    });
  }, []);

  useEffect(() => {
    confirmImpl = confirm;
    return () => {
      confirmImpl = async (options) => {
        if (typeof window === "undefined") return false;
        return window.confirm(
          options.description ? `${options.title}\n\n${options.description}` : options.title,
        );
      };
    };
  }, [confirm]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {request ? (
        <ConfirmModal
          title={request.title}
          description={request.description}
          confirmLabel={request.confirmLabel}
          cancelLabel={request.cancelLabel}
          variant={request.variant}
          onConfirm={() => finish(true)}
          onCancel={() => finish(false)}
        />
      ) : null}
    </ConfirmContext.Provider>
  );
}

function ConfirmModal({
  title,
  description,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  variant = "default",
  onConfirm,
  onCancel,
}: ConfirmOptions & { onConfirm: () => void; onCancel: () => void }) {
  const confirmRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const danger = variant === "danger";

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    (danger ? cancelRef : confirmRef).current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancel();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [danger, onCancel]);

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-bibocom-primary/45 backdrop-blur-[2px]"
        aria-label="Fermer"
        onClick={onCancel}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby={description ? "confirm-description" : undefined}
        className="relative w-full max-w-md rounded-[22px] bg-white p-5 shadow-2xl sm:p-6"
      >
        <button
          type="button"
          onClick={onCancel}
          className="absolute right-3 top-3 rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex gap-3 pr-6">
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
              danger ? "bg-red-50 text-red-500" : "bg-bibocom-accent/12 text-bibocom-accent",
            )}
          >
            {danger ? <AlertTriangle className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
          </div>
          <div className="min-w-0">
            <h2 id="confirm-title" className="text-lg font-semibold text-bibocom-primary">
              {title}
            </h2>
            {description ? (
              <p id="confirm-description" className="mt-1.5 text-sm leading-relaxed text-slate-500">
                {description}
              </p>
            ) : null}
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-2.5">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            className={cn(
              "rounded-full px-4 py-2.5 text-sm font-semibold text-white transition-colors",
              danger
                ? "bg-red-500 hover:bg-red-600"
                : "bg-bibocom-accent hover:bg-bibocom-accent/90",
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
