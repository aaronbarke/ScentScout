import Link from "next/link";
import type { FragranceSummary } from "@/domain/catalog/queries";
import { PresentationTag } from "./GuidanceBadge";
import { presentationLabel } from "@/lib/format";

export function FragranceCard({ fragrance }: { fragrance: FragranceSummary }) {
  const presentations = [...new Set(fragrance.variants.map((v) => v.presentation))];
  const sizes = [...new Set(fragrance.variants.map((v) => v.sizeMl))].sort((a, b) => a - b);

  return (
    <Link
      href={`/fragrances/${fragrance.slug}`}
      className="group flex flex-col rounded-xl border border-line bg-surface p-4 transition hover:border-accent hover:shadow-sm"
    >
      <div className="eyebrow">{fragrance.brandName}</div>
      <div className="mt-1 font-display text-xl text-ink transition-colors group-hover:text-accent">
        {fragrance.name}
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {presentations.map((p) => (
          <PresentationTag key={p} presentation={p} label={presentationLabel(p)} />
        ))}
      </div>
      <div className="mt-2 text-xs text-muted">
        {fragrance.variants.length} variant{fragrance.variants.length === 1 ? "" : "s"} ·{" "}
        {sizes.map((s) => `${s}ml`).join(" / ")}
      </div>
    </Link>
  );
}
