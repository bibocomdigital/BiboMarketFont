"use client";

import { useEffect } from "react";
import { getUserErrorMessage } from "@domain/errors/app-error";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-6">
      <div className="text-center max-w-md">
        <h1 className="text-3xl font-bold text-bibocom-primary mb-4">Une erreur est survenue</h1>
        <p className="text-gray-600 mb-6">{getUserErrorMessage(error)}</p>
        <button
          type="button"
          onClick={reset}
          className="bg-bibocom-primary text-white px-6 py-3 rounded-lg hover:bg-bibocom-primary/90 transition-colors"
        >
          Réessayer
        </button>
      </div>
    </div>
  );
}
