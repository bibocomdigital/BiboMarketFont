export type AppErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION"
  | "NETWORK"
  | "TIMEOUT"
  | "SERVER"
  | "CONFLICT"
  | "UNKNOWN";

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly status?: number;
  readonly details?: unknown;

  constructor(
    message: string,
    code: AppErrorCode = "UNKNOWN",
    status?: number,
    details?: unknown
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

const STATUS_MESSAGES: Record<number, string> = {
  400: "Les informations envoyées sont incorrectes.",
  401: "Votre session a expiré. Veuillez vous reconnecter.",
  403: "Vous n'avez pas les droits pour effectuer cette action.",
  404: "La ressource demandée est introuvable.",
  409: "Cette action entre en conflit avec une donnée existante.",
  422: "Veuillez vérifier les informations saisies.",
  429: "Trop de tentatives. Veuillez réessayer dans un instant.",
  500: "Un problème est survenu. Veuillez réessayer plus tard.",
  502: "Le service est temporairement indisponible.",
  503: "Le service est temporairement indisponible.",
  504: "Le service met trop de temps à répondre.",
};

const STATUS_CODES: Record<number, AppErrorCode> = {
  400: "VALIDATION",
  401: "UNAUTHORIZED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  409: "CONFLICT",
  422: "VALIDATION",
  408: "TIMEOUT",
  429: "VALIDATION",
  500: "SERVER",
  502: "SERVER",
  503: "SERVER",
  504: "TIMEOUT",
};

function isNetworkError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as { message?: string; code?: string; name?: string };
  return (
    err.code === "ERR_NETWORK" ||
    err.code === "ECONNABORTED" ||
    err.name === "AbortError" ||
    /failed to fetch|networkerror|load failed|network|timeout|aborted|etimedout/i.test(
      err.message || ""
    )
  );
}

function isTimeoutError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as { message?: string; code?: string; name?: string };
  return (
    err.code === "ECONNABORTED" ||
    err.code === "ETIMEDOUT" ||
    err.name === "AbortError" ||
    /timeout|aborted|timed out/i.test(err.message || "")
  );
}

export function getErrorStatus(error: unknown): number | undefined {
  if (error instanceof AppError) return error.status;
  if (!error || typeof error !== "object") return undefined;

  const err = error as {
    status?: number;
    statusCode?: number;
    response?: { status?: number };
  };

  if (typeof err.status === "number") return err.status;
  if (typeof err.statusCode === "number") return err.statusCode;
  if (typeof err.response?.status === "number") return err.response.status;
  return undefined;
}

export function getUserErrorMessage(error: unknown): string {
  if (error instanceof AppError) return error.message;

  if (error instanceof Error && error.message) {
    if (isTimeoutError(error)) {
      return "Le serveur met trop de temps à répondre. Veuillez réessayer.";
    }
    if (isNetworkError(error)) {
      return "Impossible de joindre le serveur. Vérifiez votre connexion.";
    }
    if (/axioserror|request failed|status code/i.test(error.message)) {
      return "Une erreur est survenue. Veuillez réessayer.";
    }
    return error.message;
  }

  return "Une erreur inattendue est survenue. Veuillez réessayer.";
}

export function toAppError(status?: number, source?: unknown): AppError {
  if (source instanceof AppError) return source;

  if (isTimeoutError(source)) {
    return new AppError(
      "Le serveur met trop de temps à répondre. Veuillez réessayer.",
      "TIMEOUT",
      status ?? 408,
      source
    );
  }

  if (isNetworkError(source)) {
    return new AppError(
      "Impossible de joindre le serveur. Vérifiez votre connexion.",
      "NETWORK"
    );
  }

  const body =
    source && typeof source === "object"
      ? (source as { message?: string; error?: string; response?: { data?: { message?: string } } })
      : undefined;

  const apiMessage =
    body?.response?.data?.message ||
    (typeof body?.message === "string" && body.message) ||
    (typeof body?.error === "string" && body.error) ||
    (source instanceof Error ? source.message : undefined);

  if (status && STATUS_CODES[status]) {
    const fallback = STATUS_MESSAGES[status] || STATUS_MESSAGES[500];
    const message =
      apiMessage && !/axioserror|request failed|status code/i.test(apiMessage)
        ? apiMessage
        : fallback;
    return new AppError(message, STATUS_CODES[status], status, source);
  }

  if (apiMessage && !/axioserror|request failed|status code/i.test(apiMessage)) {
    return new AppError(apiMessage, "UNKNOWN", status, source);
  }

  return new AppError(
    "Une erreur inattendue est survenue. Veuillez réessayer.",
    "UNKNOWN",
    status,
    source
  );
}
