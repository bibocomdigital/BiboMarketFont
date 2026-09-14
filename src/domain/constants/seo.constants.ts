export const SEO_SITE_NAME = "BiboMarket";
export const SEO_HTML_LANG = "fr";
export const SEO_LOCALE = "fr_SN";
export const SEO_DEFAULT_TITLE = "BiboMarket — Marketplace au Sénégal";
export const SEO_DEFAULT_DESCRIPTION =
  "BiboMarket, la marketplace sénégalaise qui réunit commerçants, clients et fournisseurs dans un écosystème e-commerce complet.";
export const SEO_DEFAULT_KEYWORDS = [
  "BiboMarket",
  "marketplace Sénégal",
  "e-commerce Dakar",
  "boutiques en ligne",
  "commerçants",
];
export const SEO_OG_IMAGE_PATH = "/placeholder.svg";
export const SEO_OG_IMAGE_ALT = "BiboMarket";

export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "https://bibocommarket.com";
}

export function absoluteUrl(path: string): string {
  const base = getSiteUrl().replace(/\/$/, "");
  if (!path || path === "/") return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
