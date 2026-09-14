"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

export function clientOnly<T extends ComponentType<unknown>>(
  loader: () => Promise<{ default: T }>
) {
  return dynamic(loader, {
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-bibocom-primary border-r-transparent" />
      </div>
    ),
  });
}
