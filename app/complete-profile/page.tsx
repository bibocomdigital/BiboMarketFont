"use client";

import { clientOnly } from "@/presentation/lib/dynamic-page";

const CompleteProfile = clientOnly(() => import("@/presentation/pages/CompleteProfile"));

export default function CompleteProfilePage() {
  return <CompleteProfile />;
}
