import type { Metadata } from "next";
import {
  SEO_DEFAULT_DESCRIPTION,
  SEO_DEFAULT_KEYWORDS,
  SEO_DEFAULT_TITLE,
  SEO_LOCALE,
  SEO_OG_IMAGE_ALT,
  SEO_OG_IMAGE_PATH,
  SEO_SITE_NAME,
  absoluteUrl,
  getSiteUrl,
} from "@domain/constants/seo.constants";

export type SeoRobotsMode = "public" | "private";

export interface BuildPageMetadataInput {
  title?: string;
  description?: string;
  path?: string;
  keywords?: string[];
  imagePath?: string;
  imageAlt?: string;
  robots?: SeoRobotsMode;
  noTitleTemplate?: boolean;
}

function robotsFor(mode: SeoRobotsMode): Metadata["robots"] {
  if (mode === "private") {
    return {
      index: false,
      follow: false,
      googleBot: { index: false, follow: false, noimageindex: true },
    };
  }

  return {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  };
}

export function buildPageMetadata(input: BuildPageMetadataInput = {}): Metadata {
  const title = input.title?.trim() || SEO_DEFAULT_TITLE;
  const description = input.description?.trim() || SEO_DEFAULT_DESCRIPTION;
  const path = input.path ?? "/";
  const canonical = absoluteUrl(path);
  const imagePath = input.imagePath ?? SEO_OG_IMAGE_PATH;
  const imageUrl =
    imagePath.startsWith("http://") || imagePath.startsWith("https://")
      ? imagePath
      : absoluteUrl(imagePath);

  return {
    title: input.noTitleTemplate ? title : { default: title, template: `%s | ${SEO_SITE_NAME}` },
    description,
    keywords: input.keywords ?? [...SEO_DEFAULT_KEYWORDS],
    alternates: { canonical },
    robots: robotsFor(input.robots ?? "public"),
    openGraph: {
      type: "website",
      locale: SEO_LOCALE,
      url: canonical,
      siteName: SEO_SITE_NAME,
      title,
      description,
      images: [{ url: imageUrl, alt: input.imageAlt ?? SEO_OG_IMAGE_ALT }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export function buildRootMetadata(): Metadata {
  return {
    metadataBase: new URL(getSiteUrl()),
    ...buildPageMetadata({
      title: SEO_DEFAULT_TITLE,
      description: SEO_DEFAULT_DESCRIPTION,
      path: "/",
      noTitleTemplate: true,
    }),
    applicationName: SEO_SITE_NAME,
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/icon.svg", type: "image/svg+xml" },
      ],
      apple: [{ url: "/apple-icon.png" }],
    },
  };
}

export const pageSeo = {
  home: buildPageMetadata({
    title: SEO_DEFAULT_TITLE,
    description: SEO_DEFAULT_DESCRIPTION,
    path: "/",
    noTitleTemplate: true,
  }),
  login: buildPageMetadata({
    title: "Connexion",
    description: "Connectez-vous à votre compte BiboMarket pour acheter, vendre ou gérer votre boutique.",
    path: "/login",
    robots: "private",
  }),
  register: buildPageMetadata({
    title: "Inscription",
    description: "Créez un compte client, commerçant ou fournisseur sur BiboMarket.",
    path: "/register",
  }),
  boutiques: buildPageMetadata({
    title: "Boutiques",
    description: "Explorez les boutiques vérifiées de BiboMarket au Sénégal.",
    path: "/boutique",
  }),
  boutiquesList: buildPageMetadata({
    title: "Toutes les boutiques",
    description: "Parcourez l'annuaire des boutiques BiboMarket.",
    path: "/boutiques",
  }),
  about: buildPageMetadata({
    title: "À propos",
    description: "Découvrez BiboMarket, la plateforme de Bibocom Digital au Sénégal.",
    path: "/about",
  }),
  contact: buildPageMetadata({
    title: "Contact",
    description: "Contactez l'équipe BiboMarket pour un support ou un partenariat.",
    path: "/contact",
  }),
  cart: buildPageMetadata({
    title: "Panier",
    description: "Consultez les articles de votre panier BiboMarket.",
    path: "/cart",
    robots: "private",
  }),
  profile: buildPageMetadata({
    title: "Mon profil",
    path: "/profile",
    robots: "private",
  }),
  clientDashboard: buildPageMetadata({
    title: "Espace client",
    path: "/client-dashboard",
    robots: "private",
  }),
  merchantDashboard: buildPageMetadata({
    title: "Espace commerçant",
    path: "/merchant-dashboard",
    robots: "private",
  }),
  supplierDashboard: buildPageMetadata({
    title: "Espace fournisseur",
    path: "/supplier-dashboard",
    robots: "private",
  }),
  verifyCode: buildPageMetadata({
    title: "Vérification du compte",
    path: "/verify-code",
    robots: "private",
  }),
  verificationPending: buildPageMetadata({
    title: "Vérification en cours",
    path: "/verification-pending",
    robots: "private",
  }),
  completeProfile: buildPageMetadata({
    title: "Compléter le profil",
    path: "/complete-profile",
    robots: "private",
  }),
  messages: buildPageMetadata({
    title: "Messages",
    path: "/dashboard/messages",
    robots: "private",
  }),
  merchantOrders: buildPageMetadata({
    title: "Commandes reçues",
    path: "/commandes-recues",
    robots: "private",
  }),
  whatsapp: buildPageMetadata({
    title: "Messagerie",
    path: "/whatsapp",
    robots: "private",
  }),
};
