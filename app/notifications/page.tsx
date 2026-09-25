"use client";

import { clientOnly } from "@/presentation/lib/dynamic-page";

const NotificationsPage = clientOnly(() => import("@/presentation/pages/NotificationsPage"));

export default function Notifications() {
  return <NotificationsPage />;
}
