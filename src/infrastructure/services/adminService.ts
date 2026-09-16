import { AppError } from "@domain/errors/app-error";
import { parseApiError } from "../api/fetch-error";
import {
  unwrapApi,
  unwrapPaged,
  unwrapRecord,
} from "../api/api-envelope";
import { backendUrl, getAuthToken } from "./configService";
import { logout } from "./authService";

export type AdminRole = "ADMIN" | "MERCHANT" | "CLIENT" | "SUPPLIER";
export type ProductStatus = "DRAFT" | "PUBLISHED";
export type OrderStatus = "PENDING" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELED";
export type PaymentMethod = "CASH_ON_DELIVERY" | "MOBILE_MONEY";

export type AdminDashboard = {
  currency: string;
  periodMonths: number;
  soldStatuses: string[];
  kpis: {
    totalUsers: number;
    usersByRole: Record<AdminRole, number>;
    totalShops: number;
    activeShops: number;
    verifiedShops: number;
    totalProducts: number;
    publishedProducts: number;
    draftProducts: number;
    lowStockCount: number;
    lowStockThreshold: number;
    totalOrders: number;
    pendingOrders: number;
    confirmedOrders: number;
    shippedOrders: number;
    deliveredOrders: number;
    canceledOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    deliveryRate: number;
    paymentMethods: Record<PaymentMethod, number>;
  };
  charts: {
    registrations: Array<{ month: string; count: number }>;
    revenue: Array<{ month: string; revenue: number; orderCount: number }>;
  };
  demographics: {
    cities: Array<{ city: string; country: string | null; count: number }>;
    genders: Record<string, number>;
  };
  topProducts: Array<{
    productId: number;
    productName: string;
    price: number;
    imageUrl: string | null;
    totalSold: number;
    totalRevenue: number;
    orderCount: number;
  }>;
  recentOrders: Array<{
    id: number;
    clientName: string;
    totalAmount: number;
    status: OrderStatus | string;
    paymentMethod: PaymentMethod | string;
    createdAt: string;
  }>;
};

export type AdminUser = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string | null;
  whatsappNumber?: string | null;
  gender?: string | null;
  country?: string | null;
  city?: string | null;
  department?: string | null;
  commune?: string | null;
  photo?: string | null;
  role: AdminRole | string;
  isVerified: boolean;
  isProfileCompleted?: boolean;
  onboardingStep?: string | null;
  createdAt?: string;
  updatedAt?: string;
  lastLogin?: string | null;
  shop?: {
    id: number;
    name: string;
    verifiedBadge: boolean;
    status: boolean;
  } | null;
};

export type AdminShop = {
  id: number;
  name: string;
  description?: string | null;
  logo?: string | null;
  phoneNumber?: string | null;
  address?: string | null;
  userId: number;
  status?: boolean;
  verifiedBadge?: boolean;
  categorieShopId?: number | null;
  owner?: {
    id?: number;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    phoneNumber?: string | null;
    photo?: string | null;
    city?: string | null;
  } | null;
  categorieShop?: { id: number; name: string; description?: string | null } | null;
  _count?: { products?: number; feedbacks?: number; contactMessages?: number };
};

export type AdminProduct = {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  stock: number;
  status: ProductStatus | string;
  shopId: number;
  images?: Array<{ id: number; imageUrl: string }>;
  shop?: { id: number; name: string; verifiedBadge?: boolean; status?: boolean };
  categorieProd?: {
    id: number;
    name: string;
    shopCategory?: { id: number; name: string } | null;
  } | null;
  owner?: { id: number; firstName?: string | null; lastName?: string | null; email?: string | null };
};

export type AdminOrderItem = {
  id?: number;
  quantity: number;
  price: number;
  product?: {
    id: number;
    name: string;
    price?: number;
    images?: Array<{ imageUrl: string }>;
    shop?: { id: number; name: string; userId?: number; phoneNumber?: string | null };
  } | null;
};

export type AdminOrder = {
  id: number;
  totalAmount: number;
  status: OrderStatus | string;
  paymentMethod: PaymentMethod | string;
  createdAt: string;
  client?: {
    id: number;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    phoneNumber?: string | null;
    city?: string | null;
  } | null;
  orderItems?: AdminOrderItem[];
  feedbacks?: unknown[];
};

export type AdminFeedback = {
  id: number;
  rating: number;
  comment?: string | null;
  contactSuccessful?: boolean;
  createdAt?: string;
  client?: { id: number; firstName?: string | null; lastName?: string | null } | null;
  merchant?: { id: number; firstName?: string | null; lastName?: string | null } | null;
  shop?: { id: number; name: string } | null;
  order?: { id: number; status: string; totalAmount: number } | null;
};

export type AdminUsersQuery = {
  page?: number;
  limit?: number;
  role?: string;
  search?: string;
};

export type AdminShopsQuery = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  verified?: string;
};

export type AdminProductsQuery = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  shopId?: number;
  lowStock?: boolean;
  lowStockThreshold?: number;
};

export type AdminOrdersQuery = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  paymentMethod?: string;
};

export type AdminFeedbacksQuery = {
  page?: number;
  limit?: number;
  search?: string;
};

function toQuery(params: Record<string, string | number | boolean | undefined | null>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

async function adminRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAuthToken();
  if (!token) {
    throw new AppError(
      "Votre session a expiré. Veuillez vous reconnecter.",
      "UNAUTHORIZED",
      401
    );
  }

  const response = await fetch(`${backendUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      logout();
    }
    throw await parseApiError(response, "Erreur administrateur");
  }

  return unwrapApi(await response.json()) as T;
}

function paged<T>(raw: unknown, listKey: string, page = 1, limit = 20) {
  return unwrapPaged<T>(raw, listKey, { page, limit });
}

export async function getAdminDashboard(months = 12, lowStockThreshold = 10): Promise<AdminDashboard> {
  const payload = await adminRequest<AdminDashboard>(
    `/admin/dashboard${toQuery({ months, lowStockThreshold })}`
  );
  return payload;
}

export async function getAdminUsers(query: AdminUsersQuery = {}) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const raw = await adminRequest(`/admin/users${toQuery({ ...query, page, limit })}`);
  const { items, pagination } = paged<AdminUser>(raw, "users", page, limit);
  return { users: items, pagination };
}

export async function getAdminUser(id: number) {
  const payload = unwrapRecord(await adminRequest(`/admin/users/${id}`));
  return (payload.user ?? payload) as AdminUser;
}

export async function patchAdminUser(id: number, body: { role?: string; isVerified?: boolean }) {
  const payload = unwrapRecord(await adminRequest(`/admin/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  }));
  return payload;
}

export async function deleteAdminUser(id: number) {
  return unwrapRecord(await adminRequest(`/admin/users/${id}`, { method: "DELETE" }));
}

export async function getAdminShops(query: AdminShopsQuery = {}) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const raw = await adminRequest(`/admin/shops${toQuery({ ...query, page, limit })}`);
  const { items, pagination } = paged<AdminShop>(raw, "shops", page, limit);
  return { shops: items, pagination };
}

export async function getAdminShop(id: number) {
  const payload = unwrapRecord(await adminRequest(`/admin/shops/${id}`));
  return (payload.shop ?? payload) as AdminShop;
}

export async function patchAdminShop(
  id: number,
  body: { status?: boolean; verifiedBadge?: boolean }
) {
  return unwrapRecord(
    await adminRequest(`/admin/shops/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    })
  );
}

export async function deleteAdminShop(id: number) {
  return unwrapRecord(await adminRequest(`/admin/shops/${id}`, { method: "DELETE" }));
}

export async function getAdminProducts(query: AdminProductsQuery = {}) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const raw = await adminRequest(
    `/admin/products${toQuery({
      page,
      limit,
      search: query.search,
      status: query.status,
      shopId: query.shopId,
      lowStock: query.lowStock ? true : undefined,
      lowStockThreshold: query.lowStock ? query.lowStockThreshold ?? 10 : undefined,
    })}`
  );
  const { items, pagination } = paged<AdminProduct>(raw, "products", page, limit);
  return { products: items, pagination };
}

export async function getAdminProduct(id: number) {
  const payload = unwrapRecord(await adminRequest(`/admin/products/${id}`));
  return (payload.product ?? payload) as AdminProduct;
}

export async function patchAdminProduct(
  id: number,
  body: { status?: string; stock?: number }
) {
  return unwrapRecord(
    await adminRequest(`/admin/products/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    })
  );
}

export async function deleteAdminProduct(id: number) {
  return unwrapRecord(await adminRequest(`/admin/products/${id}`, { method: "DELETE" }));
}

export async function getAdminOrders(query: AdminOrdersQuery = {}) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const raw = await adminRequest(`/admin/orders${toQuery({ ...query, page, limit })}`);
  const { items, pagination } = paged<AdminOrder>(raw, "orders", page, limit);
  return { orders: items, pagination };
}

export async function getAdminOrder(id: number) {
  const payload = unwrapRecord(await adminRequest(`/admin/orders/${id}`));
  return (payload.order ?? payload) as AdminOrder;
}

export async function patchAdminOrderStatus(id: number, status: string) {
  return unwrapRecord(
    await adminRequest(`/admin/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    })
  );
}

export async function getAdminFeedbacks(query: AdminFeedbacksQuery = {}) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const raw = await adminRequest(`/admin/feedbacks${toQuery({ ...query, page, limit })}`);
  const { items, pagination } = paged<AdminFeedback>(raw, "feedbacks", page, limit);
  return { feedbacks: items, pagination };
}
