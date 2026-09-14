"use client";

import { clientOnly } from "@/presentation/lib/dynamic-page";

const MerchantOrdersPage = clientOnly(() => import("@/presentation/pages/MerchantOrdersPage"));

export default function MerchantOrders() {
  return <MerchantOrdersPage />;
}
