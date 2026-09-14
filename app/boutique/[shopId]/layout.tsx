import type { Metadata } from "next";
import { buildPageMetadata } from "@/presentation/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Boutique",
  description: "Découvrez une boutique BiboMarket et ses produits.",
  path: "/boutique",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
