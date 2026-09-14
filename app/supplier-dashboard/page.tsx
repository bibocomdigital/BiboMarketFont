"use client";

import { clientOnly } from "@/presentation/lib/dynamic-page";

const SupplierDashboard = clientOnly(() => import("@/presentation/pages/SupplierDashboard"));

export default function SupplierDashboardPage() {
  return <SupplierDashboard />;
}
