"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  AUTH_CHANGED_EVENT,
  getCurrentUser,
  logout as clearStoredSession,
  type User,
} from "@/services/authService";
import { getAuthToken } from "@/services/configService";
import { cartKeys, notificationKeys, orderKeys, userKeys, adminKeys, merchantKeys, messageKeys } from "@/lib/query-keys";

export function dashboardPathFor(role?: string): string {
  const normalized = (role || "").toUpperCase();
  if (normalized === "ADMIN" || normalized === "ADMINISTRATEUR") {
    return "/admin-dashboard";
  }
  if (normalized === "MERCHANT" || normalized === "COMMERCANT") {
    return "/merchant-dashboard";
  }
  if (normalized === "SUPPLIER" || normalized === "FOURNISSEUR") {
    return "/supplier-dashboard";
  }
  return "/client-dashboard";
}

function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (typeof payload.exp === "number") {
      return Date.now() >= payload.exp * 1000;
    }
  } catch {
    return false;
  }
  return false;
}

function readSession(): { user: User | null; token: string | null } {
  const token = getAuthToken();
  const user = getCurrentUser();
  if (!token || !user || isTokenExpired(token)) {
    if (token || user) clearStoredSession();
    return { user: null, token: null };
  }
  return { user, token };
}

type AuthSessionValue = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isReady: boolean;
  dashboardPath: string;
  logout: () => void;
};

const AuthSessionContext = createContext<AuthSessionValue | null>(null);

const emptySession: AuthSessionValue = {
  user: null,
  token: null,
  isAuthenticated: false,
  isReady: false,
  dashboardPath: "/client-dashboard",
  logout: () => {},
};

export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [isReady, setIsReady] = useState(typeof window !== "undefined");
  const [session, setSession] = useState<{ user: User | null; token: string | null }>(() =>
    typeof window === "undefined" ? { user: null, token: null } : readSession()
  );

  const hydrate = useCallback(() => {
    setSession(readSession());
    setIsReady(true);
  }, []);

  useEffect(() => {
    hydrate();
    window.addEventListener(AUTH_CHANGED_EVENT, hydrate);
    window.addEventListener("storage", hydrate);
    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, hydrate);
      window.removeEventListener("storage", hydrate);
    };
  }, [hydrate]);

  const logout = useCallback(() => {
    clearStoredSession();
    queryClient.removeQueries({ queryKey: cartKeys.all });
    queryClient.removeQueries({ queryKey: orderKeys.all });
    queryClient.removeQueries({ queryKey: notificationKeys.all });
    queryClient.removeQueries({ queryKey: userKeys.all });
    queryClient.removeQueries({ queryKey: adminKeys.all });
    queryClient.removeQueries({ queryKey: merchantKeys.all });
    queryClient.removeQueries({ queryKey: messageKeys.all });
  }, [queryClient]);

  const value = useMemo<AuthSessionValue>(
    () => ({
      user: session.user,
      token: session.token,
      isAuthenticated: !!session.user && !!session.token,
      isReady,
      dashboardPath: dashboardPathFor(session.user?.role),
      logout,
    }),
    [session.user, session.token, isReady, logout]
  );

  return (
    <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>
  );
}

export function useAuthSession(): AuthSessionValue {
  return useContext(AuthSessionContext) ?? emptySession;
}
