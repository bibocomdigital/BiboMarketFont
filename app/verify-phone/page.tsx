"use client";

import { clientOnly } from "@/presentation/lib/dynamic-page";

const VerifyPhone = clientOnly(() => import("@/presentation/pages/VerifyPhone"));

export default function VerifyPhonePage() {
  return <VerifyPhone />;
}