import { describe, it, expect } from "vitest";
import { catalog } from "@/db/seed/catalog";
import { canonicalSku, variantPath } from "@/lib/catalog-slug";

describe("catalog-slug helpers", () => {
  it("builds a stable variant path", () => {
    expect(variantPath("eau_de_parfum", 100, "retail")).toBe("edp-100ml-retail");
    expect(variantPath("eau_de_toilette", 30, "tester")).toBe("edt-30ml-tester");
    expect(variantPath("extrait_de_parfum", 100, "retail")).toBe("extrait-100ml-retail");
    expect(variantPath("absolu", 100, "retail")).toBe("absolu-100ml-retail");
  });

  it("builds a canonical SKU from fragrance slug + variant path", () => {
    expect(canonicalSku("le-labo-santal-33", "eau_de_parfum", 100, "retail")).toBe(
      "le-labo-santal-33-edp-100ml-retail",
    );
  });

  it("keeps presentations distinct in the SKU (retail vs tester vs refill)", () => {
    const retail = canonicalSku("kilian-angels-share", "eau_de_parfum", 50, "retail");
    const tester = canonicalSku("kilian-angels-share", "eau_de_parfum", 50, "tester");
    const refill = canonicalSku("kilian-angels-share", "eau_de_parfum", 50, "refill");
    expect(new Set([retail, tester, refill]).size).toBe(3);
  });

  it("keeps concentrations distinct in the SKU (EDT vs EDP)", () => {
    const edt = canonicalSku("guerlain-lhomme-ideal", "eau_de_toilette", 100, "retail");
    const edp = canonicalSku("guerlain-lhomme-ideal", "eau_de_parfum", 100, "retail");
    expect(edt).not.toBe(edp);
  });
});

describe("seed catalog integrity", () => {
  const allVariants = catalog.flatMap((b) =>
    b.fragrances.flatMap((f) => f.variants.map((v) => ({ f, v }))),
  );

  it("has at least 40 variants (MVP target)", () => {
    expect(allVariants.length).toBeGreaterThanOrEqual(40);
  });

  it("has globally unique brand slugs", () => {
    const slugs = catalog.map((b) => b.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("has globally unique fragrance slugs", () => {
    const slugs = catalog.flatMap((b) => b.fragrances.map((f) => f.slug));
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("has globally unique canonical SKUs", () => {
    const skus = allVariants.map(({ f, v }) =>
      canonicalSku(f.slug, v.concentration, v.sizeMl, v.presentation),
    );
    expect(new Set(skus).size).toBe(skus.length);
  });

  it("every fragrance has at least one variant", () => {
    for (const b of catalog) {
      for (const f of b.fragrances) {
        expect(f.variants.length).toBeGreaterThan(0);
      }
    }
  });

  it("every variant size is a positive integer (ml)", () => {
    for (const { v } of allVariants) {
      expect(Number.isInteger(v.sizeMl)).toBe(true);
      expect(v.sizeMl).toBeGreaterThan(0);
    }
  });

  it("separates tester from retail for the same fragrance+size (never combined)", () => {
    // For any fragrance that has both a retail and a tester at the same size,
    // they must be distinct SKUs.
    for (const b of catalog) {
      for (const f of b.fragrances) {
        const retails = f.variants.filter((v) => v.presentation === "retail");
        const testers = f.variants.filter((v) => v.presentation === "tester");
        for (const r of retails) {
          for (const t of testers) {
            if (r.sizeMl === t.sizeMl && r.concentration === t.concentration) {
              expect(
                canonicalSku(f.slug, r.concentration, r.sizeMl, "retail"),
              ).not.toBe(canonicalSku(f.slug, t.concentration, t.sizeMl, "tester"));
            }
          }
        }
      }
    }
  });
});
