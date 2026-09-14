"use client";

import { clientOnly } from "@/presentation/lib/dynamic-page";

const VerificationPending = clientOnly(() => import("@/presentation/pages/VerificationPending"));

export default function VerificationPendingPage() {
  return <VerificationPending />;
}
