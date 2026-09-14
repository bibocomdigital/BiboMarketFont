"use client";

import { clientOnly } from "@/presentation/lib/dynamic-page";

const DashboardMessages = clientOnly(() => import("@/presentation/pages/DashboardMessages"));

export default function DashboardMessagesPage() {
  return <DashboardMessages />;
}
