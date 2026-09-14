"use client";

import { clientOnly } from "@/presentation/lib/dynamic-page";

const CartPage = clientOnly(() => import("@/components/CartPage"));

export default function Cart() {
  return <CartPage />;
}
