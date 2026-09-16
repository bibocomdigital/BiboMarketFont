"use client";

import React from "react";
import { MerchantMessagesView } from "../merchant/MerchantMessagesView";

export function AdminMessagesView({ initialPartnerId = null }: { initialPartnerId?: number | null }) {
  return <MerchantMessagesView variant="admin" initialPartnerId={initialPartnerId} />;
}
