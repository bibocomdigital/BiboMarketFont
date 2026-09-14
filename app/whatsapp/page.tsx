"use client";

import { clientOnly } from "@/presentation/lib/dynamic-page";

const WhatsAppClone = clientOnly(() => import("@/components/ WhatsAppClone"));

export default function WhatsAppPage() {
  return <WhatsAppClone />;
}
