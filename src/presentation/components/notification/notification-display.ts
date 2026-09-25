import {
  Bell,
  Heart,
  Info,
  MessageSquare,
  Package,
  ShoppingBag,
  Store,
  Users,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { formatDistanceToNow, isToday, isYesterday, isValid } from "date-fns";
import { fr } from "date-fns/locale";

export function parseNotificationDate(value: string) {
  const date = new Date(value);
  return isValid(date) ? date : null;
}

export function dateGroupLabel(value: string) {
  const date = parseNotificationDate(value);
  if (!date) return "Récemment";
  if (isToday(date)) return "Aujourd'hui";
  if (isYesterday(date)) return "Hier";
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function relativeTime(value: string) {
  const date = parseNotificationDate(value);
  if (!date) return "";
  return formatDistanceToNow(date, { addSuffix: true, locale: fr });
}

export function formatNotificationMessage(message: string) {
  return String(message || "")
    .replace(/^[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\s]+/u, "")
    .replace(/#CO+MANDE-(\d+)/gi, "n° $1")
    .replace(/#(\d+)/g, "n° $1")
    .replace(/\s+/g, " ")
    .trim();
}

export function notificationIcon(
  type: string,
  message: string,
): { icon: LucideIcon; className: string } {
  const kind = String(type || "").toUpperCase();
  const text = message.toLowerCase();
  if (kind === "ORDER" && /annul/.test(text)) {
    return { icon: XCircle, className: "bg-red-50 text-red-500" };
  }
  switch (kind) {
    case "FOLLOW":
      return { icon: Users, className: "bg-sky-50 text-sky-600" };
    case "PRODUCT":
      return { icon: Package, className: "bg-emerald-50 text-emerald-600" };
    case "PRODUCT_LIKE":
      return { icon: Heart, className: "bg-rose-50 text-rose-500" };
    case "SHOP":
    case "SHOP_CREATED":
      return { icon: Store, className: "bg-violet-50 text-violet-600" };
    case "MESSAGE":
      return { icon: MessageSquare, className: "bg-amber-50 text-amber-600" };
    case "ORDER":
      return { icon: ShoppingBag, className: "bg-bibocom-accent/10 text-bibocom-accent" };
    case "INFO":
    case "SYSTEM":
      return { icon: Info, className: "bg-slate-100 text-slate-500" };
    default:
      return { icon: Bell, className: "bg-slate-100 text-slate-500" };
  }
}
