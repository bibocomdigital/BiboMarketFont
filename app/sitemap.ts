import type { MetadataRoute } from "next";
import { getSiteUrl } from "@domain/constants/seo.constants";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const site = getSiteUrl();

  return [
    { url: site, lastModified, changeFrequency: "daily", priority: 1 },
    { url: `${site}/boutique`, lastModified, changeFrequency: "daily", priority: 0.9 },
    { url: `${site}/boutiques`, lastModified, changeFrequency: "daily", priority: 0.8 },
    { url: `${site}/about`, lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: `${site}/contact`, lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: `${site}/register`, lastModified, changeFrequency: "monthly", priority: 0.5 },
    { url: `${site}/login`, lastModified, changeFrequency: "yearly", priority: 0.3 },
  ];
}
