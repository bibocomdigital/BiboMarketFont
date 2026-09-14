import type { MetadataRoute } from "next";
import { getSiteUrl } from "@domain/constants/seo.constants";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/client-dashboard",
          "/merchant-dashboard",
          "/supplier-dashboard",
          "/profile",
          "/cart",
          "/dashboard/",
          "/complete-profile",
          "/verify-code",
          "/verification-pending",
          "/redirect",
          "/commandes-recues",
          "/whatsapp",
        ],
      },
    ],
    sitemap: `${getSiteUrl()}/sitemap.xml`,
    host: getSiteUrl(),
  };
}
