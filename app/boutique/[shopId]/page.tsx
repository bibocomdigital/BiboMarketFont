"use client";

import { clientOnly } from "@/presentation/lib/dynamic-page";
import { PublicShell } from "@/components/home/PublicShell";

const ShopProfile = clientOnly(() => import("@/components/StoreProfile"));

export default function BoutiquePage() {
  return (
    <PublicShell>
      <ShopProfile />
    </PublicShell>
  );
}
