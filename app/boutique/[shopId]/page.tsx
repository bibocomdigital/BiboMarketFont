"use client";

import { clientOnly } from "@/presentation/lib/dynamic-page";

const ShopProfile = clientOnly(() => import("@/components/StoreProfile"));

export default function BoutiquePage() {
  return <ShopProfile />;
}
