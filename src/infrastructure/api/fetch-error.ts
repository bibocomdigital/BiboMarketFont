import { AppError, toAppError } from "@domain/errors/app-error";

/** Message technique (pile, Prisma, HTML) : on garde le libellé prévu pour l'utilisateur. */
function presentableMessage(
  raw: string | undefined,
  fallback: string,
  status: number,
): string {
  if (!raw) return fallback;
  const text = raw.replace(/\s+/g, " ").trim();
  if (!text) return fallback;
  const technical =
    /internal server error|prisma|exception|at \S+\(|<!doctype|<html|econn|syntaxerror|typeerror|cannot read propert/i.test(
      text,
    );
  if (technical) return fallback;
  if (text.length > 280) {
    return status >= 500 ? fallback : `${text.slice(0, 277)}…`;
  }
  return text;
}

/**
 * Convertit une réponse HTTP en échec (Response non-ok) en AppError lisible.
 * Gère les corps JSON (objet ou array), les corps en texte brut et les corps vides,
 * afin d'éviter les crashs sur `response.json()` et les messages `undefined`.
 * @returns refinement de l'AppError
 */
export async function parseApiError(
  response: Response,
  fallback: string
): Promise<AppError> {
  const status = response.status || 500;
  let body: Record<string, unknown> = {};

  try {
    const text = await response.text();
    if (text) {
      try {
        const parsed = JSON.parse(text) as unknown;
        if (parsed && typeof parsed === "object") {
          body = parsed as Record<string, unknown>;
        } else if (typeof parsed === "string" && parsed.trim()) {
          body = { message: parsed.trim().slice(0, 500) };
        }
      } catch {
        body = { message: text.trim().slice(0, 500) };
      }
    }
  } catch {
    body = {};
  }

  const nestedError =
    body.error && typeof body.error === "object"
      ? (body.error as { message?: unknown }).message
      : undefined;
  const raw = body.message ?? nestedError ?? body.error;
  let rawMessage: string | undefined;
  if (typeof raw === "string" && raw.trim()) {
    rawMessage = raw.trim();
  } else if (Array.isArray(raw)) {
    rawMessage = raw.filter(Boolean).map(String).join(", ");
  }

  const message = presentableMessage(rawMessage, fallback, status);
  const mapped = toAppError(status, { ...body, message });

  return new AppError(mapped.message, mapped.code, status, body);
}