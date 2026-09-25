import React from "react";
import { formatFcfa } from "@/lib/admin-analytics";
import { cn } from "@/lib/utils";

export function isPromoPrice(price: number, promoPrice?: number | null): promoPrice is number {
  return promoPrice != null && promoPrice > 0 && promoPrice < price;
}

export function chargedPrice(price: number, promoPrice?: number | null): number {
  return isPromoPrice(price, promoPrice) ? promoPrice : price;
}

export function ProductPrice({
  price,
  promoPrice,
  className,
  size = "md",
}: {
  price: number;
  promoPrice?: number | null;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const promo = isPromoPrice(price, promoPrice);
  const current = chargedPrice(price, promoPrice);
  const currentClass =
    size === "lg" ? "text-2xl font-bold" : size === "sm" ? "text-sm font-semibold" : "text-lg font-bold";

  if (!promo) {
    return <span className={cn(currentClass, "text-gray-900", className)}>{formatFcfa(current)}</span>;
  }

  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-x-2 gap-y-0.5", className)}>
      <span className={cn(currentClass, "text-bibocom-accent")}>{formatFcfa(current)}</span>
      <span className="text-sm text-slate-400 line-through">{formatFcfa(price)}</span>
    </span>
  );
}
