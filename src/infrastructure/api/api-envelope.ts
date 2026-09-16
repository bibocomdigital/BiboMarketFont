export type ApiPagination = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export function unwrapApi(raw: unknown): unknown {
  let current = raw;
  for (let hops = 0; hops < 3; hops += 1) {
    if (
      current &&
      typeof current === "object" &&
      !Array.isArray(current) &&
      (current as { success?: unknown }).success === true &&
      "data" in current
    ) {
      current = (current as { data: unknown }).data;
      continue;
    }
    break;
  }
  return current;
}

export function unwrapRecord(raw: unknown): Record<string, unknown> {
  const unwrapped = unwrapApi(raw);
  if (unwrapped && typeof unwrapped === "object" && !Array.isArray(unwrapped)) {
    return unwrapped as Record<string, unknown>;
  }
  return {};
}

export function apiErrorMessage(raw: unknown, fallback: string): string {
  if (!raw || typeof raw !== "object") return fallback;
  const rec = raw as Record<string, unknown>;
  if (typeof rec.message === "string" && rec.message.trim()) return rec.message;
  const error = rec.error;
  if (error && typeof error === "object") {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
}

export function unwrapAuthSession<TUser>(raw: unknown): { token: string; user: TUser } {
  const payload = unwrapRecord(raw);
  const token = typeof payload.token === "string" ? payload.token : "";
  const user = payload.user as TUser | undefined;
  if (!token || !user) {
    throw new Error("Réponse d'authentification invalide");
  }
  return { token, user };
}

export function unwrapList(raw: unknown, keys: string[]): unknown[] {
  const unwrapped = unwrapApi(raw);
  if (Array.isArray(unwrapped)) return unwrapped;
  const record = unwrapRecord(raw);
  for (const key of keys) {
    if (Array.isArray(record[key])) return record[key] as unknown[];
  }
  return [];
}

export function unwrapPaged<T>(
  raw: unknown,
  listKey: string,
  fallback: { page: number; limit: number }
): { items: T[]; pagination: ApiPagination } {
  const items = unwrapList(raw, [listKey]) as T[];
  const record = unwrapRecord(raw);
  const pagination = record.pagination as ApiPagination | undefined;
  return {
    items,
    pagination: pagination ?? {
      total: items.length,
      page: fallback.page,
      limit: fallback.limit,
      totalPages: Math.max(1, Math.ceil(items.length / fallback.limit) || 1),
    },
  };
}
