import { retailers } from "@/db/schema";

type RetailerInsert = typeof retailers.$inferInsert;

/**
 * Retailer registry. Only retailers whose access has been verified in
 * docs/RETAILER_RESEARCH.md are `enabled`. Everything else is seeded disabled
 * so it appears in admin tooling without being ingested.
 */
export const retailerSeeds: RetailerInsert[] = [
  {
    name: "Luckyscent",
    slug: "luckyscent",
    baseUrl: "https://www.luckyscent.com",
    retailerType: "authorized_boutique",
    affiliateProgram: null,
    enabled: true,
    trustScore: 85,
    defaultShippingPolicy: "Shipping not published on product pages; treated as unknown.",
  },
  {
    name: "FragranceNet",
    slug: "fragrancenet",
    baseUrl: "https://www.fragrancenet.com",
    retailerType: "gray_market_discounter",
    affiliateProgram: "rakuten",
    // Access verified and adapter shipped (Phase 7).
    enabled: true,
    trustScore: 60,
    defaultShippingPolicy: null,
  },
  {
    name: "FragranceX",
    slug: "fragrancex",
    baseUrl: "https://www.fragrancex.com",
    retailerType: "gray_market_discounter",
    affiliateProgram: "cj",
    enabled: false,
    trustScore: 60,
    defaultShippingPolicy: null,
  },
  {
    name: "Jomashop",
    slug: "jomashop",
    baseUrl: "https://www.jomashop.com",
    retailerType: "gray_market_discounter",
    affiliateProgram: "cj",
    enabled: false,
    trustScore: 60,
    defaultShippingPolicy: null,
  },
  {
    name: "Nordstrom",
    slug: "nordstrom",
    baseUrl: "https://www.nordstrom.com",
    retailerType: "department_store",
    affiliateProgram: "rakuten",
    enabled: false,
    trustScore: 90,
    defaultShippingPolicy: null,
  },
];
