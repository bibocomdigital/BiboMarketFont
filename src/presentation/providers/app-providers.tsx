"use client";

import React, { Suspense, useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster as SonnerToaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { makeQueryClient } from "@infrastructure/api/query-client";
import { AppBootstrap } from "@/presentation/providers/app-bootstrap";
import { AuthSessionProvider } from "@/presentation/providers/auth-session-provider";
import { PhoneVerificationGate } from "@/presentation/providers/phone-verification-gate";
import { RealtimeProvider } from "@/presentation/providers/realtime-provider";
import { GoogleAuthGate } from "@/presentation/providers/google-auth-gate";
import { CartProvider } from "@/components/CartContext";
import { ConfirmProvider } from "@/components/feedback/confirm-dialog";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(makeQueryClient);

  return (
    <GoogleAuthGate>
      <QueryClientProvider client={queryClient}>
        <AppBootstrap />
        <AuthSessionProvider>
          <PhoneVerificationGate />
          <CartProvider>
            <RealtimeProvider>
              <TooltipProvider>
                <ConfirmProvider>
                  <Suspense fallback={null}>{children}</Suspense>
                  <SonnerToaster />
                  <Toaster />
                </ConfirmProvider>
              </TooltipProvider>
            </RealtimeProvider>
          </CartProvider>
        </AuthSessionProvider>
      </QueryClientProvider>
    </GoogleAuthGate>
  );
}
