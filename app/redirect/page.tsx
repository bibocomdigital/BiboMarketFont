"use client";

import { clientOnly } from "@/presentation/lib/dynamic-page";

const Redirector = clientOnly(() => import("@/presentation/pages/Redirector"));

export default function RedirectPage() {
  return <Redirector />;
}
