"use client";

import { clientOnly } from "@/presentation/lib/dynamic-page";

const OrderDetailsPage = clientOnly(() => import("@/presentation/pages/OrderDetailsPage"));

export default function OrderDetails() {
  return <OrderDetailsPage />;
}
