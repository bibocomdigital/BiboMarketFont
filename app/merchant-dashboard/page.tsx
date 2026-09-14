"use client";

import { clientOnly } from "@/presentation/lib/dynamic-page";

const MerchantDashboard = clientOnly(() => import("@/presentation/pages/MerchantDashboard"));

export default function MerchantDashboardPage() {
  return <MerchantDashboard />;
}
