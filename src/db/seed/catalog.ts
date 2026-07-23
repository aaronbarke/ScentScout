import type { Concentration, Presentation } from "@/lib/catalog-slug";

/**
 * Canonical seed catalog for ScentScout.
 *
 * Attributes (brand, fragrance, flanker, concentration, size, presentation)
 * are based on publicly documented product listings from official brand sites
 * and major authorized retailers (see docs/PROJECT_STATUS.md for the Phase 1
 * verification notes). Presentations are modeled as distinct variants and
 * never combined: `retail`, `tester`, and `refill` each get their own row and
 * their own canonical SKU.
 *
 * This dataset demonstrates all three separation types:
 *  - Flanker:       Bal d'Afrique vs. Bal d'Afrique Absolu; Gris Charnel vs. Extrait
 *  - Concentration: L'Homme Idéal EDT vs. EDP
 *  - Presentation:  retail / tester / refill throughout
 */

export type Gender = "masculine" | "feminine" | "unisex";

export interface SeedVariant {
  concentration: Concentration;
  sizeMl: number;
  presentation: Presentation;
}

export interface SeedFragrance {
  name: string;
  /** Brand-prefixed, URL-safe, globally unique. */
  slug: string;
  flankerName?: string;
  releaseYear?: number;
  gender: Gender;
  variants: SeedVariant[];
}

export interface SeedBrand {
  name: string;
  slug: string;
  normalizedName: string;
  officialUrl?: string;
  fragrances: SeedFragrance[];
}

// Terse variant constructors keep the data readable and auditable.
const retail = (concentration: Concentration, sizeMl: number): SeedVariant => ({
  concentration,
  sizeMl,
  presentation: "retail",
});
const tester = (concentration: Concentration, sizeMl: number): SeedVariant => ({
  concentration,
  sizeMl,
  presentation: "tester",
});
const refill = (concentration: Concentration, sizeMl: number): SeedVariant => ({
  concentration,
  sizeMl,
  presentation: "refill",
});

export const catalog: SeedBrand[] = [
  {
    name: "Le Labo",
    slug: "le-labo",
    normalizedName: "le labo",
    officialUrl: "https://www.lelabofragrances.com",
    fragrances: [
      {
        name: "Santal 33",
        slug: "le-labo-santal-33",
        releaseYear: 2011,
        gender: "unisex",
        variants: [retail("eau_de_parfum", 50), retail("eau_de_parfum", 100), tester("eau_de_parfum", 100)],
      },
      {
        name: "Another 13",
        slug: "le-labo-another-13",
        releaseYear: 2010,
        gender: "unisex",
        variants: [retail("eau_de_parfum", 50), retail("eau_de_parfum", 100), tester("eau_de_parfum", 100)],
      },
    ],
  },
  {
    name: "Byredo",
    slug: "byredo",
    normalizedName: "byredo",
    officialUrl: "https://www.byredo.com",
    fragrances: [
      {
        name: "Bal d'Afrique",
        slug: "byredo-bal-dafrique",
        releaseYear: 2009,
        gender: "unisex",
        variants: [retail("eau_de_parfum", 50), retail("eau_de_parfum", 100), tester("eau_de_parfum", 100)],
      },
      {
        name: "Bal d'Afrique Absolu",
        slug: "byredo-bal-dafrique-absolu",
        flankerName: "Absolu",
        releaseYear: 2025,
        gender: "unisex",
        variants: [retail("absolu", 100), tester("absolu", 100)],
      },
    ],
  },
  {
    name: "Parfums de Marly",
    slug: "parfums-de-marly",
    normalizedName: "parfums de marly",
    officialUrl: "https://www.parfums-de-marly.com",
    fragrances: [
      {
        name: "Layton",
        slug: "parfums-de-marly-layton",
        releaseYear: 2016,
        gender: "masculine",
        variants: [retail("eau_de_parfum", 75), retail("eau_de_parfum", 125), tester("eau_de_parfum", 125)],
      },
      {
        name: "Althaïr",
        slug: "parfums-de-marly-althair",
        releaseYear: 2020,
        gender: "masculine",
        variants: [retail("eau_de_parfum", 75), retail("eau_de_parfum", 125), tester("eau_de_parfum", 125)],
      },
    ],
  },
  {
    name: "Xerjoff",
    slug: "xerjoff",
    normalizedName: "xerjoff",
    officialUrl: "https://www.xerjoff.com",
    fragrances: [
      {
        name: "Naxos",
        slug: "xerjoff-naxos",
        releaseYear: 2015,
        gender: "masculine",
        variants: [retail("eau_de_parfum", 50), retail("eau_de_parfum", 100), tester("eau_de_parfum", 100)],
      },
    ],
  },
  {
    name: "Maison Francis Kurkdjian",
    slug: "maison-francis-kurkdjian",
    normalizedName: "maison francis kurkdjian",
    officialUrl: "https://www.franciskurkdjian.com",
    fragrances: [
      {
        name: "Grand Soir",
        slug: "maison-francis-kurkdjian-grand-soir",
        releaseYear: 2016,
        gender: "unisex",
        variants: [retail("eau_de_parfum", 70), retail("eau_de_parfum", 200), tester("eau_de_parfum", 70)],
      },
      {
        name: "Gentle Fluidity Silver",
        slug: "maison-francis-kurkdjian-gentle-fluidity-silver",
        releaseYear: 2019,
        gender: "unisex",
        variants: [retail("eau_de_parfum", 70), retail("eau_de_parfum", 200), tester("eau_de_parfum", 70)],
      },
    ],
  },
  {
    name: "Guerlain",
    slug: "guerlain",
    normalizedName: "guerlain",
    officialUrl: "https://www.guerlain.com",
    fragrances: [
      {
        name: "L'Homme Idéal",
        slug: "guerlain-lhomme-ideal",
        releaseYear: 2014,
        gender: "masculine",
        // Same fragrance family, two concentrations — never combined.
        variants: [retail("eau_de_toilette", 100), tester("eau_de_toilette", 100), retail("eau_de_parfum", 100)],
      },
    ],
  },
  {
    name: "Creed",
    slug: "creed",
    normalizedName: "creed",
    officialUrl: "https://www.creedboutique.com",
    fragrances: [
      {
        name: "Aventus",
        slug: "creed-aventus",
        releaseYear: 2010,
        gender: "masculine",
        variants: [retail("eau_de_parfum", 50), retail("eau_de_parfum", 100), tester("eau_de_parfum", 100)],
      },
      {
        name: "Green Irish Tweed",
        slug: "creed-green-irish-tweed",
        releaseYear: 1985,
        gender: "masculine",
        variants: [retail("eau_de_parfum", 50), retail("eau_de_parfum", 100), tester("eau_de_parfum", 100)],
      },
    ],
  },
  {
    name: "Kilian",
    slug: "kilian",
    normalizedName: "kilian",
    officialUrl: "https://www.bykilian.com",
    fragrances: [
      {
        name: "Angels' Share",
        slug: "kilian-angels-share",
        releaseYear: 2020,
        gender: "unisex",
        // Refillable house — refill is its own variant/presentation.
        variants: [
          retail("eau_de_parfum", 50),
          retail("eau_de_parfum", 100),
          refill("eau_de_parfum", 50),
          tester("eau_de_parfum", 50),
        ],
      },
    ],
  },
  {
    name: "Diptyque",
    slug: "diptyque",
    normalizedName: "diptyque",
    officialUrl: "https://www.diptyqueparis.com",
    fragrances: [
      {
        name: "Orphéon",
        slug: "diptyque-orpheon",
        releaseYear: 2021,
        gender: "unisex",
        variants: [retail("eau_de_parfum", 75), tester("eau_de_parfum", 75)],
      },
    ],
  },
  {
    name: "Maison Margiela",
    slug: "maison-margiela",
    normalizedName: "maison margiela",
    officialUrl: "https://www.maisonmargiela-fragrances.com",
    fragrances: [
      {
        name: "Replica Jazz Club",
        slug: "maison-margiela-replica-jazz-club",
        releaseYear: 2013,
        gender: "masculine",
        variants: [retail("eau_de_toilette", 30), retail("eau_de_toilette", 100), tester("eau_de_toilette", 100)],
      },
    ],
  },
  {
    name: "Amouage",
    slug: "amouage",
    normalizedName: "amouage",
    officialUrl: "https://www.amouage.com",
    fragrances: [
      {
        name: "Reflection Man",
        slug: "amouage-reflection-man",
        releaseYear: 2007,
        gender: "masculine",
        variants: [retail("eau_de_parfum", 100), tester("eau_de_parfum", 100)],
      },
    ],
  },
  {
    name: "BDK Parfums",
    slug: "bdk-parfums",
    normalizedName: "bdk parfums",
    officialUrl: "https://www.bdkparfums.com",
    fragrances: [
      {
        name: "Gris Charnel",
        slug: "bdk-parfums-gris-charnel",
        releaseYear: 2020,
        gender: "unisex",
        variants: [retail("eau_de_parfum", 100), tester("eau_de_parfum", 100)],
      },
      {
        name: "Gris Charnel Extrait",
        slug: "bdk-parfums-gris-charnel-extrait",
        flankerName: "Extrait",
        releaseYear: 2022,
        gender: "unisex",
        variants: [retail("extrait_de_parfum", 100), tester("extrait_de_parfum", 100)],
      },
    ],
  },
  {
    name: "Initio Parfums Privés",
    slug: "initio",
    normalizedName: "initio parfums prives",
    officialUrl: "https://www.initioparfums.com",
    fragrances: [
      {
        name: "Side Effect",
        slug: "initio-side-effect",
        releaseYear: 2017,
        gender: "unisex",
        variants: [retail("eau_de_parfum", 90), tester("eau_de_parfum", 90)],
      },
    ],
  },
];
