"use client";

import { clientOnly } from "@/presentation/lib/dynamic-page";

const ClientDashboard = clientOnly(() => import("@/presentation/pages/ClientDashboard"));

export default function ClientDashboardPage() {
  return <ClientDashboard />;
}
