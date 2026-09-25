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

export function hasStoredCredentials(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(localStorage.getItem("token") && localStorage.getItem("user"));
}

const PRIVATE_PREFIXES = [
  "/client-dashboard",
  "/merchant-dashboard",
  "/admin-dashboard",
  "/supplier-dashboard",
  "/profile",
  "/dashboard/messages",
  "/commandes-recues",
  "/notifications",
  "/verify-phone",
];

function isPrivatePath(pathname: string): boolean {
  return PRIVATE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function leavePrivatePageIfLoggedOut() {
  if (typeof window === "undefined") return;
  if (!isPrivatePath(window.location.pathname)) return;
  if (hasStoredCredentials()) return;
  window.location.replace("/login");
}

export function dashboardPathFor(role?: string): string {
  const normalized = (role || "").toUpperCase();
  if (
    normalized === "ADMIN" ||
    normalized === "ADMINISTRATEUR" ||
    normalized === "SUPER_ADMIN" ||
    normalized === "MODERATOR"
  ) {
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

function readSession(): { user: User | null; token: string | null; stale: boolean } {
  const token = getAuthToken();
  const user = getCurrentUser();
  if (!token || !user || isTokenExpired(token)) {
    return { user: null, token: null, stale: Boolean(token || user) };
  }
  return { user, token, stale: false };
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
  const [isReady, setIsReady] = useState(false);
  const [session, setSession] = useState<{ user: User | null; token: string | null }>({
    user: null,
    token: null,
  });

  const hydrate = useCallback(() => {
    const next = readSession();
    if (next.stale) clearStoredSession();
    setSession({ user: next.stale ? null : next.user, token: next.stale ? null : next.token });
    setIsReady(true);
  }, []);

  useEffect(() => {
    hydrate();
    const onPageShow = (event: PageTransitionEvent) => {
      hydrate();
      if (event.persisted) leavePrivatePageIfLoggedOut();
    };
    const onPopState = () => {
      hydrate();
      window.setTimeout(leavePrivatePageIfLoggedOut, 0);
    };
    window.addEventListener(AUTH_CHANGED_EVENT, hydrate);
    window.addEventListener("storage", hydrate);
    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, hydrate);
      window.removeEventListener("storage", hydrate);
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("popstate", onPopState);
    };
  }, [hydrate]);

  useEffect(() => {
    if (!isReady) return;
    const isClient =
      !!session.user &&
      !!session.token &&
      String(session.user.role || "").toUpperCase() === "CLIENT";
    if (!isClient) {
      queryClient.removeQueries({ queryKey: cartKeys.all });
    }
  }, [isReady, session.user, session.token, queryClient]);

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
