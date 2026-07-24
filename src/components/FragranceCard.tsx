import Link from "next/link";
import type { FragranceSummary } from "@/domain/catalog/queries";
import { PresentationTag } from "./GuidanceBadge";
import { presentationLabel } from "@/lib/format";

/**
 * An index row rather than a boxed card — a hairline directory reads as a
 * fragrance catalogue, where a grid of bordered boxes reads as a dashboard.
 */
export function FragranceCard({
  fragrance,
  showBrand = true,
}: {
  fragrance: FragranceSummary;
  showBrand?: boolean;
}) {
  const presentations = [...new Set(fragrance.variants.map((v) => v.presentation))];
  const sizes = [...new Set(fragrance.variants.map((v) => v.sizeMl))].sort((a, b) => a - b);

  return (
    <Link
      href={`/fragrances/${fragrance.slug}`}
      className="group flex flex-wrap items-baseline gap-x-5 gap-y-2 border-b border-line py-5"
    >
      {showBrand && <span className="eyebrow w-40 shrink-0 truncate">{fragrance.brandName}</span>}
      <span className="font-display text-2xl text-ink transition-colors group-hover:text-accent">
        {fragrance.name}
      </span>
      <span className="flex flex-wrap gap-1.5">
        {presentations.map((p) => (
          <PresentationTag key={p} presentation={p} label={presentationLabel(p)} />
        ))}
      </span>
      <span className="ml-auto shrink-0 text-xs tabular text-faint">
        {sizes.map((s) => `${s}ml`).join(" / ")}
      </span>
    </Link>
  );
}
