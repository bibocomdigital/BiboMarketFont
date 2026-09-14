"use client";

import { clientOnly } from "@/presentation/lib/dynamic-page";

const MessagePage = clientOnly(() => import("@/components/MessagePage"));

export default function ConversationPage() {
  return <MessagePage />;
}
