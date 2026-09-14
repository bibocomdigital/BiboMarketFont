import { AppError, getErrorStatus } from "@domain/errors/app-error";

const MAX_QUERY_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000;
const MAX_RETRY_DELAY_MS = 30_000;

const NON_RETRYABLE_STATUSES = new Set([400, 401, 403, 404, 409, 422]);
const RETRYABLE_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);

function isTimeoutLike(error: unknown): boolean {
  if (error instanceof AppError) {
    return error.code === "TIMEOUT";
  }
  if (!error || typeof error !== "object") return false;
  const err = error as { code?: string; name?: string; message?: string };
  return (
    err.code === "ECONNABORTED" ||
    err.code === "ETIMEDOUT" ||
    err.name === "AbortError" ||
    /timeout|aborted|timed out/i.test(err.message || "")
  );
}

function isNetworkLike(error: unknown): boolean {
  if (error instanceof AppError) {
    return error.code === "NETWORK" || error.code === "TIMEOUT";
  }
  if (!error || typeof error !== "object") return false;
  const err = error as { code?: string; message?: string };
  return (
    err.code === "ERR_NETWORK" ||
    /failed to fetch|networkerror|load failed|network/i.test(err.message || "")
  );
}

export function shouldRetryRequest(error: unknown): boolean {
  const status = getErrorStatus(error);

  if (status !== undefined) {
    if (NON_RETRYABLE_STATUSES.has(status)) return false;
    if (RETRYABLE_STATUSES.has(status)) return true;
    return status >= 500;
  }

  if (error instanceof AppError) {
    return error.code === "NETWORK" || error.code === "TIMEOUT" || error.code === "SERVER";
  }

  return isNetworkLike(error) || isTimeoutLike(error);
}

export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (failureCount >= MAX_QUERY_RETRIES) return false;
  return shouldRetryRequest(error);
}

/** Mutations: retry only network/timeout to avoid duplicate POST/PUT side effects. */
export function shouldRetryMutation(failureCount: number, error: unknown): boolean {
  if (failureCount >= 2) return false;
  const status = getErrorStatus(error);
  if (status !== undefined) {
    return status === 408 || status === 502 || status === 503 || status === 504;
  }
  if (error instanceof AppError) {
    return error.code === "NETWORK" || error.code === "TIMEOUT";
  }
  return isNetworkLike(error) || isTimeoutLike(error);
}

export function queryRetryDelay(attemptIndex: number): number {
  return Math.min(INITIAL_RETRY_DELAY_MS * 2 ** attemptIndex, MAX_RETRY_DELAY_MS);
}

export const queryRetryConfig = {
  maxRetries: MAX_QUERY_RETRIES,
  initialDelayMs: INITIAL_RETRY_DELAY_MS,
  maxDelayMs: MAX_RETRY_DELAY_MS,
} as const;
