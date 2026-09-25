"use client";

import React, { createContext, useContext, useEffect, useState, type ComponentType, type ReactNode } from "react";

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

const GoogleReadyContext = createContext(false);

export function useGoogleAuthReady() {
  return useContext(GoogleReadyContext);
}

type GoogleProviderProps = {
  clientId: string;
  children: ReactNode;
};

/**
 * Charge @react-oauth/google uniquement côté client.
 * Évite le crash Turbopack « module factory is not available » au boot du layout.
 */
export function GoogleAuthGate({ children }: { children: ReactNode }) {
  const [Provider, setProvider] = useState<ComponentType<GoogleProviderProps> | null>(null);

  useEffect(() => {
    if (!googleClientId) return;
    let cancelled = false;
    import("@react-oauth/google")
      .then((mod) => {
        if (!cancelled) setProvider(() => mod.GoogleOAuthProvider);
      })
      .catch(() => {
        if (!cancelled) setProvider(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!googleClientId || !Provider) {
    return <GoogleReadyContext.Provider value={false}>{children}</GoogleReadyContext.Provider>;
  }

  return (
    <GoogleReadyContext.Provider value>
      <Provider clientId={googleClientId}>{children}</Provider>
    </GoogleReadyContext.Provider>
  );
}
