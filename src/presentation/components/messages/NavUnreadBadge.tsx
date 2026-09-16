"use client";

import { cn } from "@/lib/utils";

function formatCount(count: number): string | null {
  if (count <= 0) return null;
  if (count > 99) return "99+";
  if (count > 9) return "9+";
  return String(count);
}

export function NavUnreadBadge({
  count,
  collapsed,
  tone = "danger",
}: {
  count: number;
  collapsed: boolean;
  tone?: "danger" | "accent" | "onAccent";
}) {
  const label = formatCount(count);
  if (!label) return null;
  const colors =
    tone === "onAccent"
      ? "bg-white text-bibocom-accent"
      : tone === "accent"
        ? "bg-bibocom-accent text-white"
        : "bg-red-500 text-white";

  return (
    <span
      className={cn(
        "flex items-center justify-center rounded-full font-semibold",
        colors,
        collapsed
          ? "absolute -right-1.5 -top-1.5 h-4 min-w-4 px-1 text-[9px]"
          : "ml-auto h-5 min-w-5 px-1.5 text-[10px]"
      )}
      aria-hidden="true"
    >
      {label}
    </span>
  );
}
