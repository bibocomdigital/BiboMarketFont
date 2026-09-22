"use client";

import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthSession } from "@/presentation/providers/auth-session-provider";

const DASHBOARD_PREFIXES = [
  "/client-dashboard",
  "/merchant-dashboard",
  "/supplier-dashboard",
  "/admin-dashboard",
  "/dashboard",
];

function isDashboardPath(pathname: string): boolean {
  return DASHBOARD_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

/**
 * Bloque l'accès aux espaces connectés (dashboards) tant que le numéro
 * de téléphone n'est pas vérifié. Les administrateurs et les comptes
 * Google (googleId) sont exemptés.
 */
export function PhoneVerificationGate() {
  const { user, isAuthenticated, isReady } = useAuthSession();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isReady || !isAuthenticated || !user) return;
    if (user.role === "ADMIN" || user.googleId || user.phoneVerified) return;
    if (!isDashboardPath(location.pathname)) return;
    navigate("/verify-phone", { replace: true });
  }, [isReady, isAuthenticated, user, location.pathname, navigate]);

  return null;
}