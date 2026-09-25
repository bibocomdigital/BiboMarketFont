import { AppError } from "@domain/errors/app-error";
import { parseApiError } from "../api/fetch-error";
import { unwrapApi } from "../api/api-envelope";
import { backendUrl, getAuthToken } from "./configService";

async function request<T>(path: string, init?: RequestInit, auth = true): Promise<T> {
  const headers = new Headers(init?.headers);
  if (auth) {
    const token = getAuthToken();
    if (!token) throw new AppError("Votre session a expiré. Veuillez vous reconnecter.", "UNAUTHORIZED", 401);
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (init?.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const response = await fetch(`${backendUrl}${path}`, { ...init, cache: "no-store", headers });
  if (!response.ok) {
    throw await parseApiError(response, "Erreur");
  }
  const type = response.headers.get("content-type") || "";
  if (type.includes("text/csv") || path.endsWith(".csv")) {
    return (await response.text()) as T;
  }
  return unwrapApi(await response.json()) as T;
}

export type DeliveryService = {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  zone?: string | null;
  active?: boolean;
  provider?: { firstName?: string | null; lastName?: string | null; phoneNumber?: string | null; city?: string | null };
};

export function listDeliveryServices() {
  return request<DeliveryService[]>("/services", undefined, false);
}

export function listMyServices() {
  return request<DeliveryService[]>("/services/mine");
}

export function createService(body: { name: string; description?: string; price: number; zone?: string }) {
  return request<DeliveryService>("/services", { method: "POST", body: JSON.stringify(body) });
}

export function updateService(id: number, body: { active?: boolean; price?: number; zone?: string }) {
  return request(`/services/${id}`, { method: "PATCH", body: JSON.stringify(body) });
}

export function deleteService(id: number) {
  return request(`/services/${id}`, { method: "DELETE" });
}

export function reportStory(id: number, reason: string) {
  return request(`/stories/${id}/report`, { method: "POST", body: JSON.stringify({ reason }) });
}

export function askSupport(message: string) {
  return request<{ ticketId: number; reply: string }>("/support/ask", {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}

export type Ticket = {
  id: number;
  subject: string;
  status: string;
  satisfaction?: number | null;
  user?: { firstName?: string | null; lastName?: string | null; phoneNumber?: string | null };
  messages: Array<{ id: number; body: string; authorId: number; createdAt: string }>;
};

export function listMyTickets() {
  return request<Ticket[]>("/support/tickets");
}

export function listAdminTickets() {
  return request<Ticket[]>("/admin/tickets");
}

export function replyTicket(id: number, body: string) {
  return request(`/support/tickets/${id}/messages`, { method: "POST", body: JSON.stringify({ body }) });
}

export function setTicketStatus(id: number, status: string, satisfaction?: number) {
  return request(`/support/tickets/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status, satisfaction }),
  });
}

export type PublicAd = { id: number; title: string; imageUrl: string; linkUrl?: string | null };

export function listPublicAds() {
  return request<PublicAd[]>("/ads", undefined, false);
}

export type AdminAd = PublicAd & { status: "PENDING" | "PUBLISHED" | "REJECTED" | string };

export function listAdminAds() {
  return request<AdminAd[]>("/admin/ads");
}

export function createAd(body: { title: string; imageUrl: string; linkUrl?: string }) {
  return request("/admin/ads", { method: "POST", body: JSON.stringify(body) });
}

export function updateAd(
  id: number,
  body: { title?: string; imageUrl?: string; linkUrl?: string | null; status?: string },
) {
  return request(`/admin/ads/${id}`, { method: "PATCH", body: JSON.stringify(body) });
}

export function deleteAd(id: number) {
  return request(`/admin/ads/${id}`, { method: "DELETE" });
}

export function setAdStatus(id: number, status: string) {
  return updateAd(id, { status });
}

export type StoryReport = {
  id: number;
  reason: string;
  status: string;
  story: { id: number; userId: number; status: string };
  reporter: { firstName?: string | null; lastName?: string | null };
};

export function listReports() {
  return request<StoryReport[]>("/admin/reports");
}

export function reviewReport(id: number) {
  return request(`/admin/reports/${id}`, { method: "PATCH" });
}

export function warnUser(id: number, message: string) {
  return request(`/admin/users/${id}/warn`, { method: "POST", body: JSON.stringify({ message }) });
}

export function setSuspended(id: number, suspended: boolean) {
  return request(`/admin/users/${id}/suspension`, {
    method: "PATCH",
    body: JSON.stringify({ suspended }),
  });
}

export type FinanceSummary = {
  badgeTotal: number;
  badgeCount: number;
  monthRevenue: number;
  monthOrders: number;
  yearRevenue: number;
  yearOrders: number;
  badges: Array<{
    id: number;
    priceCfa: number;
    paidAt: string | null;
    user: { firstName?: string | null; lastName?: string | null; phoneNumber?: string | null };
  }>;
};

export function getFinance() {
  return request<FinanceSummary>("/admin/finance");
}

export function downloadFinanceCsv() {
  return request<string>("/admin/finance/export.csv");
}

export function setupTwoFactor() {
  return request<{ secret: string; otpauth: string }>("/auth/2fa/setup", { method: "POST" });
}

export function enableTwoFactor(code: string) {
  return request("/auth/2fa/enable", { method: "POST", body: JSON.stringify({ code }) });
}

export function verifyTwoFactor(challenge: string, code: string) {
  return request<{ token: string; user: { role: string } }>("/auth/2fa/verify", {
    method: "POST",
    body: JSON.stringify({ challenge, code }),
  }, false);
}
