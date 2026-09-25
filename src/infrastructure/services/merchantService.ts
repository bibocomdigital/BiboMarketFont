import { AppError } from "@domain/errors/app-error";
import { parseApiError } from "../api/fetch-error";
import { unwrapRecord } from "../api/api-envelope";
import { backendUrl, getAuthHeaders, getAuthToken } from "./configService";

export type MerchantRevenuePoint = {
  date: string;
  revenue: number;
  orderCount: number;
};

export type MerchantTopProduct = {
  productId?: number;
  productName?: string;
  totalSold: number;
  totalRevenue: number;
  orderCount: number;
  product?: {
    id: number;
    name: string;
    price?: number;
    images?: Array<{ imageUrl?: string }>;
  } | null;
};

export type MerchantRecentOrder = {
  id: number;
  clientName: string;
  totalAmount: number;
  status: string;
  createdAt: string;
};

export type MerchantStats = {
  totalRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  confirmedOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  canceledOrders: number;
  successRate: number;
  averageOrderValue: number;
  topProducts: MerchantTopProduct[];
  recentOrders: MerchantRecentOrder[];
  revenueChart: MerchantRevenuePoint[];
};

export type MerchantProductStats = {
  totalProducts: number;
  lowStockCount: number;
  categoryStats: Array<{
    category?: string;
    count: number;
    categorieProdId?: number;
    categorieProd?: { name: string } | null;
  }>;
};

export type MerchantOrderItem = {
  id: number;
  quantity: number;
  price: number;
  subtotal?: number;
  product?: {
    id: number;
    name: string;
    images?: Array<{ imageUrl?: string }>;
    shop?: { id: number; name: string; phoneNumber?: string };
  } | null;
};

export type MerchantOrder = {
  id: number;
  status: string;
  createdAt: string;
  totalAmount: number;
  clientId?: number;
  client?: {
    id?: number;
    firstName?: string;
    lastName?: string;
    email?: string;
    phoneNumber?: string;
  } | null;
  items?: MerchantOrderItem[];
  orderItems?: MerchantOrderItem[];
};

async function merchantGet<T>(path: string, fallback: string): Promise<T> {
  const token = getAuthToken();
  if (!token) {
    throw new AppError(
      "Votre session a expiré. Veuillez vous reconnecter.",
      "UNAUTHORIZED",
      401
    );
  }
  const response = await fetch(`${backendUrl}${path}`, {
    cache: "no-store",
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw await parseApiError(response, fallback);
  }
  return unwrapRecord(await response.json()) as T;
}

function asNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function getMerchantStats(): Promise<MerchantStats> {
  const payload = await merchantGet<MerchantStats>(
    "/merchant/stats",
    "Impossible de charger les statistiques de la boutique"
  );
  return {
    totalRevenue: asNumber(payload.totalRevenue),
    totalOrders: asNumber(payload.totalOrders),
    pendingOrders: asNumber(payload.pendingOrders),
    confirmedOrders: asNumber(payload.confirmedOrders),
    shippedOrders: asNumber(payload.shippedOrders),
    deliveredOrders: asNumber(payload.deliveredOrders),
    canceledOrders: asNumber(payload.canceledOrders),
    successRate: asNumber(payload.successRate),
    averageOrderValue: asNumber(payload.averageOrderValue),
    topProducts: Array.isArray(payload.topProducts) ? payload.topProducts : [],
    recentOrders: Array.isArray(payload.recentOrders) ? payload.recentOrders : [],
    revenueChart: Array.isArray(payload.revenueChart) ? payload.revenueChart : [],
  };
}

export async function getMerchantRevenueChart(days = 7): Promise<MerchantRevenuePoint[]> {
  const payload = await merchantGet<{ chartData?: MerchantRevenuePoint[] }>(
    `/merchant/revenue-chart?days=${days}`,
    "Impossible de charger le graphique de revenus"
  );
  return Array.isArray(payload.chartData) ? payload.chartData : [];
}

export async function getMerchantTopProducts(): Promise<MerchantTopProduct[]> {
  const payload = await merchantGet<{ topProducts?: MerchantTopProduct[] }>(
    "/merchant/top-products",
    "Impossible de charger les produits les plus vendus"
  );
  return Array.isArray(payload.topProducts) ? payload.topProducts : [];
}

export async function getMerchantProductStats(): Promise<MerchantProductStats> {
  const payload = await merchantGet<MerchantProductStats>(
    "/produit/stats",
    "Impossible de charger les statistiques produits"
  );
  return {
    totalProducts: Number(payload.totalProducts) || 0,
    lowStockCount: Number(payload.lowStockCount) || 0,
    categoryStats: (payload.categoryStats || []).map((row) => ({
      ...row,
      category: row.category || row.categorieProd?.name || "Sans catégorie",
      count: Number(row.count) || 0,
    })),
  };
}

export function merchantOrderItems(order: MerchantOrder): MerchantOrderItem[] {
  return order.items || order.orderItems || [];
}
