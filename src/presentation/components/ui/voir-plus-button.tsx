"use client";

import { ChevronDown } from "lucide-react";

type VoirPlusButtonProps = {
  remaining: number;
  onClick: () => void;
  noun?: string;
};

export function VoirPlusButton({ remaining, onClick, noun = "élément" }: VoirPlusButtonProps) {
  if (remaining <= 0) return null;

  const plural = remaining > 1;
  const label = noun.endsWith("e") || noun.endsWith("s")
    ? `${noun}${plural && !noun.endsWith("s") ? "s" : ""}`
    : `${noun}${plural ? "s" : ""}`;

  return (
    <div className="mt-8 flex flex-col items-center">
      <div className="flex w-full max-w-xl items-center gap-4">
        <span className="h-px flex-1 bg-gray-200" />
        <button
          type="button"
          onClick={onClick}
          className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-orange-600"
        >
          <ChevronDown size={16} />
          Voir plus
        </button>
        <span className="h-px flex-1 bg-gray-200" />
      </div>
      <p className="mt-2 text-sm text-gray-500">
        {remaining} {label} restante{plural ? "s" : ""}
      </p>
    </div>
  );
}
