"use client";

import React, { Suspense, useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Toaster as SonnerToaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { makeQueryClient } from "@infrastructure/api/query-client";
import { AppBootstrap } from "@/presentation/providers/app-bootstrap";
import { AuthSessionProvider } from "@/presentation/providers/auth-session-provider";
import { PhoneVerificationGate } from "@/presentation/providers/phone-verification-gate";
import { RealtimeProvider } from "@/presentation/providers/realtime-provider";
import { CartProvider } from "@/components/CartContext";

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(makeQueryClient);

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <QueryClientProvider client={queryClient}>
        <AppBootstrap />
        <AuthSessionProvider>
          <PhoneVerificationGate />
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
    </GoogleOAuthProvider>
  );
}
