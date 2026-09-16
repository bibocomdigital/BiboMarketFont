"use client";

import React from "react";
import { MerchantMessagesView } from "../merchant/MerchantMessagesView";

export function ClientMessagesView({ initialPartnerId = null }: { initialPartnerId?: number | null }) {
  return <MerchantMessagesView variant="client" initialPartnerId={initialPartnerId} />;
}
