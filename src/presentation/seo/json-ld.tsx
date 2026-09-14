import {
  SEO_SITE_NAME,
  getSiteUrl,
} from "@domain/constants/seo.constants";

export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SEO_SITE_NAME,
    url: getSiteUrl(),
    logo: `${getSiteUrl()}/images/logo-mark.png`,
    email: "contact@bibocommarket.com",
    address: {
      "@type": "PostalAddress",
      streetAddress: "123 Rue Commerciale",
      addressLocality: "Dakar",
      addressCountry: "SN",
    },
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SEO_SITE_NAME,
    url: getSiteUrl(),
    potentialAction: {
      "@type": "SearchAction",
      target: `${getSiteUrl()}/boutique?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}
