import { AppError } from "@domain/errors/app-error";

export const DEFAULT_REQUEST_TIMEOUT_MS = 15_000;
export const UPLOAD_REQUEST_TIMEOUT_MS = 60_000;

export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = DEFAULT_REQUEST_TIMEOUT_MS
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(
        new AppError(
          "Le serveur met trop de temps à répondre. Veuillez réessayer.",
          "TIMEOUT",
          408
        )
      );
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}
