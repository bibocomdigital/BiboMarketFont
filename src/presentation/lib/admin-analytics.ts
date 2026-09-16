import { USER_ROLE_LABELS, UserRole } from "@/types/user";

export const ROLE_ORDER = ["CLIENT", "MERCHANT", "SUPPLIER", "ADMIN"] as const;

export const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "SHIPPED",
  "DELIVERED",
  "CANCELED",
] as const;

export function formatFcfa(amount: number | null | undefined): string {
  if (typeof amount !== "number" || Number.isNaN(amount)) return "—";
  return `${Math.round(amount).toLocaleString("fr-FR")} FCFA`;
}

export function formatDateFr(iso?: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function monthLabel(month: string): string {
  const [year, mm] = month.split("-").map(Number);
  if (!year || !mm) return month;
  return new Date(year, mm - 1, 1).toLocaleDateString("fr-FR", {
    month: "short",
    year: "numeric",
  });
}

export function fullName(user?: {
  firstName?: string | null;
  lastName?: string | null;
} | null): string {
  return `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "—";
}

export function roleLabel(role?: string | null): string {
  const key = String(role || "").toUpperCase() as UserRole;
  return USER_ROLE_LABELS[key] || role || "—";
}

export function orderStatusLabel(status?: string | null): string {
  switch (String(status || "").toUpperCase()) {
    case "PENDING":
      return "En attente";
    case "CONFIRMED":
      return "Confirmée";
    case "SHIPPED":
      return "Expédiée";
    case "DELIVERED":
      return "Livrée";
    case "CANCELED":
      return "Annulée";
    default:
      return status || "—";
  }
}

export function paymentLabel(method?: string | null): string {
  switch (String(method || "").toUpperCase()) {
    case "CASH_ON_DELIVERY":
      return "Paiement à la livraison";
    case "MOBILE_MONEY":
      return "Mobile money";
    default:
      return method || "—";
  }
}

export function productStatusLabel(status?: string | null): string {
  switch (String(status || "").toUpperCase()) {
    case "PUBLISHED":
      return "Publié";
    case "DRAFT":
      return "Brouillon";
    default:
      return status || "—";
  }
}
