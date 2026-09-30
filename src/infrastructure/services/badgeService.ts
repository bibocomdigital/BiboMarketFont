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

export type StoryProduct = {
  id: number;
  name: string;
  price: number;
  promoPrice: number | null;
  stock: number;
  imageUrl: string | null;
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
  products?: StoryProduct[];
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
    throw await parseApiError(response, "Le paiement du badge a échoué. Réessayez dans un instant.");
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

const STORIES_CACHE_KEY = "bibocom-stories-feed";
const STORIES_MEMORY_MS = 20_000;
const STORIES_SESSION_MS = 60_000;

let storiesMemory: { at: number; stories: StoryItem[] } | null = null;

function rememberStories(stories: StoryItem[]) {
  storiesMemory = { at: Date.now(), stories };
  try {
    sessionStorage.setItem(STORIES_CACHE_KEY, JSON.stringify(storiesMemory));
  } catch {
    // Le quota du navigateur n'empêche pas l'affichage.
  }
}

/** Dernier fil déjà reçu, pour afficher les cartes sans attendre le réseau. */
export function cachedStories(): StoryItem[] | null {
  if (storiesMemory && Date.now() - storiesMemory.at < STORIES_SESSION_MS) return storiesMemory.stories;
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORIES_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { at?: number; stories?: StoryItem[] };
    if (!parsed.at || !Array.isArray(parsed.stories) || Date.now() - parsed.at > STORIES_SESSION_MS) return null;
    storiesMemory = { at: parsed.at, stories: parsed.stories };
    return parsed.stories;
  } catch {
    return null;
  }
}

/**
 * URL affichable d'un média de story.
 * Les fichiers locaux vont directement à l'API (le proxy Next force no-store).
 * Les images Cloudinary sont réduites pour la grille.
 */
export function storyDisplayUrl(url: string, width?: number): string {
  const absolute = url.startsWith("/api/")
    ? `${backendUrl.replace(/\/$/, "")}${url.slice(4)}`
    : url;
  if (!width || !absolute.includes("res.cloudinary.com/")) return absolute;
  const marker = "/upload/";
  const index = absolute.indexOf(marker);
  if (index < 0) return absolute;
  const rest = absolute.slice(index + marker.length);
  if (!/^v\d+\//.test(rest)) return absolute;
  return `${absolute.slice(0, index)}${marker}w_${width},c_limit,q_auto,f_auto/${rest}`;
}

export async function listStories(fresh = false): Promise<StoryItem[]> {
  if (!fresh && storiesMemory && Date.now() - storiesMemory.at < STORIES_MEMORY_MS) {
    return storiesMemory.stories;
  }
  const response = await fetch(`${backendUrl}/stories`);
  if (!response.ok) throw await parseApiError(response, "Impossible de charger les stories");
  const payload = unwrapApi(await response.json()) as { stories?: StoryItem[] };
  const stories = payload.stories ?? [];
  rememberStories(stories);
  return stories;
}

export async function listMyStories(): Promise<StoryItem[]> {
  const payload = await authRequest<{ stories?: StoryItem[] }>("/stories/mine");
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

export function setStoryProducts(id: number, productIds: number[]) {
  return authRequest<{ story: StoryItem }>(`/stories/${id}/products`, {
    method: "PATCH",
    body: JSON.stringify({ productIds }),
  });
}

export function deleteStory(id: number) {
  return authRequest(`/stories/${id}`, { method: "DELETE" });
}

export function publishStory(file: File, durationSeconds?: number, productIds: number[] = []) {
  const body = new FormData();
  body.set("media", file);
  if (durationSeconds !== undefined) body.set("durationSeconds", String(durationSeconds));
  if (productIds.length > 0) body.set("productIds", productIds.join(","));
  return authRequest("/stories", { method: "POST", body });
}
