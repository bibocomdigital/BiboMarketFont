"use client";

import { clientOnly } from "@/presentation/lib/dynamic-page";

const WhatsAppLinksPage = clientOnly(() => import("@/components/WhatsAppLinksPage"));

export default function WhatsAppLinks() {
  return <WhatsAppLinksPage />;
}
