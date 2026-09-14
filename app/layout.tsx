import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AppProviders } from "@/presentation/providers/app-providers";
import { JsonLd, organizationJsonLd, websiteJsonLd } from "@/presentation/seo/json-ld";
import { buildRootMetadata } from "@/presentation/seo/metadata";
import { SEO_HTML_LANG } from "@domain/constants/seo.constants";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = buildRootMetadata();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang={SEO_HTML_LANG} className={`${inter.variable} h-full antialiased`}>
      <body className={`${inter.className} min-h-full flex flex-col bg-white`}>
        <JsonLd data={organizationJsonLd()} />
        <JsonLd data={websiteJsonLd()} />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
