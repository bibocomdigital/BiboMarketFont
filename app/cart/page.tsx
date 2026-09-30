"use client";

import { clientOnly } from "@/presentation/lib/dynamic-page";
import { PublicShell } from "@/components/home/PublicShell";

const CartPage = clientOnly(() => import("@/components/CartPage"));

export default function Cart() {
  return (
    <PublicShell>
      <CartPage />
    </PublicShell>
  );
}
