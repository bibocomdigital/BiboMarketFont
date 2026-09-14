"use client";

import { clientOnly } from "@/presentation/lib/dynamic-page";

const VerifyCode = clientOnly(() => import("@/presentation/pages/VerifyCode"));

export default function VerifyCodePage() {
  return <VerifyCode />;
}
