import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3004";

/**
 * Private and non-canonical surfaces are kept out of the index:
 * `/admin` is operator tooling, `/account` is per-user, and `/search` produces
 * unbounded query-string URLs that would dilute the canonical variant pages.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/", "/account", "/login", "/search"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
