import { AppError } from "@domain/errors/app-error";
import { parseApiError } from "../api/fetch-error";
import { unwrapApi } from "../api/api-envelope";
import { backendUrl, getAuthToken } from "./configService";

export type BoostSettings = {
  priceCfa: number;
  durationDays: number;
  saleOpen: boolean;
};

export type BoostPlan = {
  id: number;
  name: string;
  priceCfa: number;
  durationDays: number;
  active?: boolean;
};

async function authRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAuthToken();
  if (!token) {
    throw new AppError("Votre session a expiré. Veuillez vous reconnecter.", "UNAUTHORIZED", 401);
  }
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const response = await fetch(`${backendUrl}${path}`, { ...init, cache: "no-store", headers });
  if (!response.ok) {
    throw await parseApiError(response, "Le boost a échoué. Réessayez dans un instant.");
  }
  return unwrapApi(await response.json()) as T;
}

export function getBoostSettings() {
  return authRequest<BoostSettings>("/admin/boosts/settings");
}

export function updateBoostSettings(body: BoostSettings) {
  return authRequest<BoostSettings>("/admin/boosts/settings", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function listBoostPlans() {
  return authRequest<{ plans: BoostPlan[] }>("/admin/boosts/plans");
}

export function createBoostPlan(body: { name: string; priceCfa: number; durationDays: number }) {
  return authRequest<BoostPlan>("/admin/boosts/plans", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateBoostPlan(id: number, body: Partial<Pick<BoostPlan, "name" | "priceCfa" | "durationDays" | "active">>) {
  return authRequest<BoostPlan>(`/admin/boosts/plans/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function deleteBoostPlan(id: number) {
  return authRequest<{ id: number }>(`/admin/boosts/plans/${id}`, { method: "DELETE" });
}

export function listPublicBoostPlans() {
  return fetch(`${backendUrl}/boosts/plans`, { cache: "no-store" }).then(async (response) => {
    if (!response.ok) throw await parseApiError(response, "Les formules de boost sont indisponibles.");
    return unwrapApi(await response.json()) as Promise<{ saleOpen: boolean; plans: BoostPlan[] }>;
  });
}

export function getPublicBoostSettings() {
  return fetch(`${backendUrl}/boosts/settings`, { cache: "no-store" }).then(async (response) => {
    if (!response.ok) throw await parseApiError(response, "Le tarif du boost est indisponible.");
    return unwrapApi(await response.json()) as Promise<BoostSettings>;
  });
}

export function checkoutBoost(productId: number, planId: number) {
  return authRequest<{ checkoutUrl: string; priceCfa: number; durationDays: number; planName: string }>("/boosts/checkout", {
    method: "POST",
    body: JSON.stringify({ productId, planId }),
  });
}

export function confirmBoost(token: string) {
  return authRequest<{ paid: boolean; status?: string }>("/boosts/confirm", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}
