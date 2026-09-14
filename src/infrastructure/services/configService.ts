import { getUserErrorMessage, toAppError } from "@domain/errors/app-error";

export const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api";

export interface ApiError {
  message?: string;
  status?: number;
  error?: string;
  code?: string;
  details?: Record<string, unknown>;
}

export const isLoggedIn = (): boolean => {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem("token");
};

export const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
};

export const getAuthHeaders = (): HeadersInit => {
  const token = getAuthToken();
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

export const handleApiError = (
  error: unknown,
  defaultMessage: string = "Une erreur est survenue"
): never => {
  const appError = toAppError(
    typeof error === "object" && error && "status" in error
      ? Number((error as ApiError).status)
      : undefined,
    error
  );
  console.error(`${defaultMessage}:`, getUserErrorMessage(appError));
  throw appError;
};
