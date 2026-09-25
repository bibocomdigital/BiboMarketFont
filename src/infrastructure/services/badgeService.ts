import { AppError } from "@domain/errors/app-error";
import { parseApiError } from "../api/fetch-error";
import { unwrapApi } from "../api/api-envelope";
import { backendUrl, getAuthToken } from "./configService";

export type BadgeSettings = {
  priceCfa: number;
  supplierPriceCfa: number;
  durationDays: number;
  graceDays: number;
  saleOpen: boolean;
};

export type ShopPlan = {
  id: number;
  name: string;
  priceCfa: number;
  durationDays: number;
  maxProducts: number;
  active: boolean;
  sortOrder: number;
};

export type BadgeSubscription = {
  id: number;
  userId: number;
  status: "PENDING_PAYMENT" | "ACTIVE" | "EXPIRED";
  priceCfa: number;
  startsAt: string | null;
  endsAt: string | null;
  graceEndsAt: string | null;
  paidAt: string | null;
};

export type MyBadge = {
  settings: BadgeSettings;
  quotedPriceCfa: number;
  subscription: BadgeSubscription | null;
  active: boolean;
};

export type StoryItem = {
  id: number;
  userId: number;
  mediaType: "PHOTO" | "VIDEO";
  durationSeconds: number | null;
  status: "PUBLISHED" | "REJECTED";
  createdAt: string;
  expiresAt: string;
  mediaUrl: string;
  author: {
    id: number;
    firstName: string | null;
    lastName: string | null;
    photo: string | null;
    role: string;
    shop: { id: number; name: string; logo: string | null } | null;
  };
};

async function authRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAuthToken();
  if (!token) {
    throw new AppError("Votre session a expiré. Veuillez vous reconnecter.", "UNAUTHORIZED", 401);
  }
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (init?.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const response = await fetch(`${backendUrl}${path}`, { ...init, cache: "no-store", headers });
  if (!response.ok) {
    throw await parseApiError(response, "Erreur badge");
  }
  return unwrapApi(await response.json()) as T;
}

export function getMyBadge() {
  return authRequest<MyBadge>("/badges/me");
}

export function checkoutBadge() {
  return authRequest<{ checkoutUrl: string; priceCfa: number }>("/badges/checkout", {
    method: "POST",
  });
}

export function confirmBadge(token: string) {
  return authRequest<{ paid: boolean; status?: string }>("/badges/confirm", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export function getBadgeSettings() {
  return authRequest<BadgeSettings>("/admin/badges/settings");
}

export function updateBadgeSettings(body: Partial<BadgeSettings>) {
  return authRequest<BadgeSettings>("/admin/badges/settings", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function listShopPlans() {
  return authRequest<ShopPlan[]>("/badges/plans");
}

export function listAdminShopPlans() {
  return authRequest<ShopPlan[]>("/admin/badges/plans");
}

export function saveShopPlan(body: Partial<ShopPlan> & { name: string }, id?: number) {
  return authRequest<ShopPlan>(id ? `/admin/badges/plans/${id}` : "/admin/badges/plans", {
    method: id ? "PATCH" : "POST",
    body: JSON.stringify(body),
  });
}

export function deleteShopPlan(id: number) {
  return authRequest(`/admin/badges/plans/${id}`, { method: "DELETE" });
}

export function grantBadge(userId: number) {
  return authRequest<{ message: string }>(`/admin/badges/${userId}/grant`, { method: "POST" });
}

export function revokeBadge(userId: number) {
  return authRequest<{ message: string }>(`/admin/badges/${userId}/revoke`, { method: "POST" });
}

export async function listStories(): Promise<StoryItem[]> {
  const response = await fetch(`${backendUrl}/stories`);
  if (!response.ok) throw await parseApiError(response, "Impossible de charger les stories");
  const payload = unwrapApi(await response.json()) as { stories?: StoryItem[] };
  return payload.stories ?? [];
}

export function listModerationStories() {
  return authRequest<{ stories: StoryItem[] }>("/stories/moderation/queue");
}

export function setStoryStatus(id: number, status: "PUBLISHED" | "REJECTED") {
  return authRequest(`/stories/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function deleteStory(id: number) {
  return authRequest(`/stories/${id}`, { method: "DELETE" });
}

export function publishStory(file: File, durationSeconds?: number) {
  const body = new FormData();
  body.set("media", file);
  if (durationSeconds !== undefined) body.set("durationSeconds", String(durationSeconds));
  return authRequest("/stories", { method: "POST", body });
}
