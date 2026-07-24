import { describe, it, expect } from "vitest";
import { matchProduct, THRESHOLDS, isHumanDecision } from "@/domain/matching";
import type { CandidateVariant } from "@/domain/matching";

const v = (over: Partial<CandidateVariant> & { canonicalSku: string }): CandidateVariant => ({
  variantId: `id-${over.canonicalSku}`,
  brandName: "BDK Parfums",
  fragranceName: "Gris Charnel",
  flankerName: null,
  concentration: "eau_de_parfum",
  sizeMl: 100,
  presentation: "retail",
  ...over,
});

const GRIS_EDP_100_RETAIL = v({ canonicalSku: "bdk-parfums-gris-charnel-edp-100ml-retail" });
const GRIS_EDP_100_TESTER = v({
  canonicalSku: "bdk-parfums-gris-charnel-edp-100ml-tester",
  presentation: "tester",
});
const GRIS_EXTRAIT_100 = v({
  canonicalSku: "bdk-parfums-gris-charnel-extrait-extrait-100ml-retail",
  fragranceName: "Gris Charnel Extrait",
  flankerName: "Extrait",
  concentration: "extrait_de_parfum",
});
const KILIAN_50_RETAIL = v({
  canonicalSku: "kilian-angels-share-edp-50ml-retail",
  brandName: "Kilian",
  fragranceName: "Angels' Share",
  sizeMl: 50,
});
const KILIAN_50_REFILL = v({
  canonicalSku: "kilian-angels-share-edp-50ml-refill",
  brandName: "Kilian",
  fragranceName: "Angels' Share",
  sizeMl: 50,
  presentation: "refill",
});
const MFK_GRAND_SOIR_70 = v({
  canonicalSku: "maison-francis-kurkdjian-grand-soir-edp-70ml-retail",
  brandName: "Maison Francis Kurkdjian",
  fragranceName: "Grand Soir",
  sizeMl: 70,
});

describe("never combine presentations", () => {
  it("does not match a TESTER listing to a retail bottle", () => {
    const d = matchProduct(
      {
        rawTitle: "BDK Parfums Gris Charnel EDP 100ml Tester",
        brand: "BDK Parfums",
        fragranceName: "Gris Charnel",
        sizeMl: 100,
      },
      [GRIS_EDP_100_RETAIL],
    );
    expect(d.status).toBe("rejected");
    expect(d.reasons.some((r) => r.code === "presentation_contradiction")).toBe(true);
  });

  it("routes a tester listing to the tester variant, not the retail one", () => {
    const d = matchProduct(
      {
        rawTitle: "BDK Parfums Gris Charnel Eau de Parfum 100ml Tester",
        brand: "BDK Parfums",
        fragranceName: "Gris Charnel",
        sizeMl: 100,
      },
      [GRIS_EDP_100_RETAIL, GRIS_EDP_100_TESTER],
    );
    expect(d.canonicalSku).toBe(GRIS_EDP_100_TESTER.canonicalSku);
    expect(d.status).toBe("exact");
  });

  it("does not match a REFILL listing to a complete bottle", () => {
    const d = matchProduct(
      {
        rawTitle: "Kilian Angels' Share 50ml Refill",
        brand: "Kilian",
        fragranceName: "Angels' Share",
        sizeMl: 50,
      },
      [KILIAN_50_RETAIL],
    );
    expect(d.status).toBe("rejected");
    expect(d.reasons.some((r) => r.code === "presentation_contradiction")).toBe(true);
  });

  it("matches a refill listing to the refill variant", () => {
    const d = matchProduct(
      {
        rawTitle: "By Kilian Angels' Share Eau de Parfum 50ml Refill",
        brand: "By Kilian",
        fragranceName: "Angels' Share",
        sizeMl: 50,
      },
      [KILIAN_50_RETAIL, KILIAN_50_REFILL],
    );
    expect(d.canonicalSku).toBe(KILIAN_50_REFILL.canonicalSku);
  });

  it("does not match a GIFT SET to an individual bottle", () => {
    const d = matchProduct(
      {
        rawTitle: "BDK Parfums Gris Charnel Eau de Parfum 100ml Gift Set",
        brand: "BDK Parfums",
        fragranceName: "Gris Charnel",
        sizeMl: 100,
      },
      [GRIS_EDP_100_RETAIL],
    );
    expect(d.status).toBe("rejected");
  });
});

describe("never combine body products with fragrances", () => {
  it.each([
    "BDK Parfums Gris Charnel Body Lotion 200ml",
    "BDK Parfums Gris Charnel Shower Gel 100ml",
    "BDK Parfums Gris Charnel Hair Mist 100ml",
    "BDK Parfums Gris Charnel Deodorant 100ml",
  ])("rejects %s", (title) => {
    const d = matchProduct(
      { rawTitle: title, brand: "BDK Parfums", fragranceName: "Gris Charnel", sizeMl: 100 },
      [GRIS_EDP_100_RETAIL],
    );
    expect(d.status).toBe("rejected");
    expect(d.reasons.some((r) => r.code === "body_product_contradiction")).toBe(true);
  });
});

describe("attribute contradictions", () => {
  it("rejects on brand mismatch", () => {
    const d = matchProduct(
      { rawTitle: "Creed Gris Charnel 100ml", brand: "Creed", fragranceName: "Gris Charnel", sizeMl: 100 },
      [GRIS_EDP_100_RETAIL],
    );
    expect(d.status).toBe("rejected");
    expect(d.reasons.some((r) => r.code === "brand_contradiction")).toBe(true);
  });

  it("rejects on size mismatch — a 10ml decant never matches the 100ml bottle", () => {
    const d = matchProduct(
      {
        rawTitle: "Gris Charnel - 10ml Travel Size",
        brand: "BDK Parfums",
        fragranceName: "Gris Charnel",
        sizeMl: 10,
      },
      [GRIS_EDP_100_RETAIL],
    );
    expect(d.status).toBe("rejected");
    expect(d.reasons.some((r) => r.code === "size_contradiction")).toBe(true);
  });

  it("rejects on concentration mismatch — Extrait never matches EDP", () => {
    const d = matchProduct(
      {
        rawTitle: "BDK Parfums Gris Charnel Extrait de Parfum 100ml",
        brand: "BDK Parfums",
        fragranceName: "Gris Charnel",
        concentration: "Extrait de Parfum",
        sizeMl: 100,
      },
      [GRIS_EDP_100_RETAIL],
    );
    expect(d.status).toBe("rejected");
    expect(d.reasons.some((r) => r.code === "concentration_contradiction")).toBe(true);
  });

  it("rejects on flanker mismatch", () => {
    const d = matchProduct(
      {
        rawTitle: "Byredo Bal d'Afrique Absolu 100ml",
        brand: "Byredo",
        fragranceName: "Bal d'Afrique",
        flankerName: "Absolu",
        sizeMl: 100,
      },
      [v({ canonicalSku: "byredo-bal-dafrique-edp-100ml-retail", brandName: "Byredo", fragranceName: "Bal d'Afrique" })],
    );
    expect(d.status).toBe("rejected");
    expect(d.reasons.some((r) => r.code === "flanker_contradiction")).toBe(true);
  });
});

describe("alias and unit normalization", () => {
  it("resolves brand abbreviations (MFK → Maison Francis Kurkdjian)", () => {
    const d = matchProduct(
      {
        rawTitle: "MFK Grand Soir EDP 70ml",
        brand: "MFK",
        fragranceName: "Grand Soir",
        sizeMl: 70,
        presentation: "retail",
      },
      [MFK_GRAND_SOIR_70],
    );
    expect(d.status).toBe("exact");
  });

  it("resolves EDP/EDT abbreviations", () => {
    const d = matchProduct(
      { rawTitle: "MFK Grand Soir EDP 70ml", brand: "MFK", fragranceName: "Grand Soir", sizeMl: 70 },
      [MFK_GRAND_SOIR_70],
    );
    expect(d.reasons.some((r) => r.code === "concentration_exact")).toBe(true);
  });

  it("converts ounces and tolerates rounding (2.4 fl oz ≈ 70ml)", () => {
    const d = matchProduct(
      {
        rawTitle: "Maison Francis Kurkdjian Grand Soir Eau De Parfum Spray 2.4 oz",
        brand: "Maison Francis Kurkdjian",
        fragranceName: "Grand Soir",
        presentation: "retail",
      },
      [MFK_GRAND_SOIR_70],
    );
    expect(d.reasons.some((r) => r.code === "size_exact")).toBe(true);
    expect(d.status).toBe("exact");
  });

  it("handles accents and apostrophes (Angels' Share, L'Homme Idéal)", () => {
    const d = matchProduct(
      {
        rawTitle: "By Kilian Angels Share Eau de Parfum 50ml",
        brand: "by kilian",
        fragranceName: "Angels Share",
        sizeMl: 50,
        presentation: "retail",
      },
      [KILIAN_50_RETAIL],
    );
    expect(d.status).toBe("exact");
  });
});

describe("uncertainty is never resolved by guessing", () => {
  it("sends a listing with no published concentration to manual review", () => {
    // The real Luckyscent case: Gris Charnel exists as both EDP and Extrait at
    // 100ml, and the page publishes no concentration.
    const d = matchProduct(
      {
        rawTitle: "Gris Charnel - 100ml",
        brand: "BDK Parfums",
        fragranceName: "Gris Charnel",
        sizeMl: 100,
        presentation: "retail",
      },
      [GRIS_EDP_100_RETAIL],
    );
    expect(d.status).toBe("manual_review");
    expect(d.confidence).toBeLessThan(THRESHOLDS.exact);
    expect(d.confidence).toBeGreaterThanOrEqual(THRESHOLDS.review);
    expect(d.reasons.some((r) => r.code === "concentration_unknown")).toBe(true);
  });

  it("does NOT assume 'retail' when no presentation is published", () => {
    // Absence of a tester/refill keyword is not evidence of a retail bottle;
    // adapters must assert presentation from retailer knowledge instead.
    const d = matchProduct(
      {
        rawTitle: "Maison Francis Kurkdjian Grand Soir Eau De Parfum 70ml",
        brand: "MFK",
        fragranceName: "Grand Soir",
        concentration: "Eau de Parfum",
        sizeMl: 70,
      },
      [MFK_GRAND_SOIR_70],
    );
    expect(d.status).toBe("manual_review");
    expect(d.reasons.some((r) => r.code === "presentation_unknown")).toBe(true);
  });

  it("forces manual review when two candidates tie", () => {
    const twinA = v({ canonicalSku: "twin-a" });
    const twinB = v({ canonicalSku: "twin-b" });
    const d = matchProduct(
      { rawTitle: "Gris Charnel - 100ml", brand: "BDK Parfums", fragranceName: "Gris Charnel", sizeMl: 100 },
      [twinA, twinB],
    );
    expect(d.status).toBe("manual_review");
    expect(d.reasons.some((r) => r.code === "ambiguous_candidates")).toBe(true);
  });

  it("returns unmatched when there are no candidates at all", () => {
    const d = matchProduct({ rawTitle: "Something Unknown 100ml" }, []);
    expect(d.status).toBe("unmatched");
    expect(d.variantId).toBeNull();
  });
});

describe("full-confidence match", () => {
  it("auto-matches when every attribute agrees", () => {
    const d = matchProduct(
      {
        rawTitle: "BDK Parfums Gris Charnel Eau de Parfum 100ml",
        brand: "BDK Parfums",
        fragranceName: "Gris Charnel",
        concentration: "Eau de Parfum",
        sizeMl: 100,
        presentation: "retail",
      },
      [GRIS_EDP_100_RETAIL, GRIS_EXTRAIT_100],
    );
    expect(d.status).toBe("exact");
    expect(d.confidence).toBe(1);
    expect(d.canonicalSku).toBe(GRIS_EDP_100_RETAIL.canonicalSku);
  });

  it("always records an auditable reason list and a deterministic method", () => {
    const d = matchProduct(
      {
        rawTitle: "BDK Parfums Gris Charnel Eau de Parfum 100ml",
        brand: "BDK Parfums",
        fragranceName: "Gris Charnel",
        concentration: "Eau de Parfum",
        sizeMl: 100,
        presentation: "retail",
      },
      [GRIS_EDP_100_RETAIL],
    );
    expect(d.method).toBe("deterministic");
    expect(d.reasons.length).toBeGreaterThan(0);
    for (const r of d.reasons) {
      expect(typeof r.code).toBe("string");
      expect(typeof r.detail).toBe("string");
    }
  });
});

describe("human decisions outrank the automatic matcher", () => {
  // Guards the regression where re-running the matcher discarded an
  // administrator's approval, unbinding a listing that had been approved.
  it("counts approved and rejected reviews as a human ruling", () => {
    expect(isHumanDecision("approved")).toBe(true);
    expect(isHumanDecision("rejected")).toBe(true);
  });

  it("leaves a pending review open to re-matching", () => {
    expect(isHumanDecision("pending")).toBe(false);
  });

  it("treats a listing with no review as undecided", () => {
    expect(isHumanDecision(null)).toBe(false);
    expect(isHumanDecision(undefined)).toBe(false);
  });
});
