"use client";

import { clientOnly } from "@/presentation/lib/dynamic-page";

const AdminDashboard = clientOnly(() => import("@/presentation/pages/AdminDashboard"));

export default function AdminDashboardPage() {
  return <AdminDashboard />;
}
