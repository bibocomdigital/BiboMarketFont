"use client";

import React, { Suspense, useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster as SonnerToaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { makeQueryClient } from "@infrastructure/api/query-client";
import { AppBootstrap } from "@/presentation/providers/app-bootstrap";
import { AuthSessionProvider } from "@/presentation/providers/auth-session-provider";
import { RealtimeProvider } from "@/presentation/providers/realtime-provider";
import { CartProvider } from "@/components/CartContext";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(makeQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <AppBootstrap />
      <AuthSessionProvider>
        <CartProvider>
          <RealtimeProvider>
            <TooltipProvider>
              <Suspense fallback={null}>{children}</Suspense>
              <SonnerToaster />
              <Toaster />
            </TooltipProvider>
          </RealtimeProvider>
        </CartProvider>
      </AuthSessionProvider>
    </QueryClientProvider>
  );
}
