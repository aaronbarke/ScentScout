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
      className="group flex flex-col rounded-xl border border-slate-200 bg-white p-4 transition hover:border-indigo-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-700"
    >
      <div className="text-xs font-medium uppercase tracking-wide text-slate-400">{fragrance.brandName}</div>
      <div className="mt-0.5 font-semibold text-slate-900 group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
        {fragrance.name}
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {presentations.map((p) => (
          <PresentationTag key={p} presentation={p} label={presentationLabel(p)} />
        ))}
      </div>
      <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
        {fragrance.variants.length} variant{fragrance.variants.length === 1 ? "" : "s"} ·{" "}
        {sizes.map((s) => `${s}ml`).join(" / ")}
      </div>
    </Link>
  );
}
