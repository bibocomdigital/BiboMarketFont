"use client";

import React, { Suspense, useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster as SonnerToaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { makeQueryClient } from "@infrastructure/api/query-client";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(makeQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Suspense fallback={null}>{children}</Suspense>
        <SonnerToaster />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
