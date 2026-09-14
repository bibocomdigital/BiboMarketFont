"use client";

import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

export function AuthBrand({ light = false }: { light?: boolean }) {
  return (
    <Link to="/" className="inline-flex items-center gap-2.5 group">
      <span
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105",
          light ? "bg-white/15 text-white" : "bg-bibocom-primary text-white"
        )}
      >
        <ShoppingCart size={18} />
      </span>
      <span
        className={cn(
          "text-[1.05rem] font-semibold tracking-tight",
          light ? "text-white" : "text-bibocom-primary"
        )}
      >
        BibocomMarket
      </span>
    </Link>
  );
}
