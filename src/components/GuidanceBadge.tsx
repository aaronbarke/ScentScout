import { guidanceLabel } from "@/lib/format";

/**
 * Badges are deliberately quiet. Price guidance is advice, not a claim, so it
 * shouldn't shout in supermarket red-and-green — a soft tint plus a hairline
 * border reads as editorial rather than promotional.
 */
const GUIDANCE_STYLES: Record<string, string> = {
  exceptional_price: "bg-positive-soft text-positive border-positive/25",
  good_price: "bg-positive-soft text-positive border-positive/20",
  normal_price: "bg-raised text-body border-line-strong",
  expensive: "bg-caution-soft text-caution border-caution/25",
  insufficient_history: "bg-raised text-muted border-line",
};

export function GuidanceBadge({ label }: { label: string }) {
  const cls = GUIDANCE_STYLES[label] ?? GUIDANCE_STYLES.normal_price;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.08em] ${cls}`}
    >
      {guidanceLabel(label)}
    </span>
  );
}

/**
 * Presentation is this product's most misread attribute (a tester is not a
 * retail bottle), so each gets a visually distinct tag — separated by hue
 * temperature and weight rather than by loud fills.
 */
const PRESENTATION_STYLES: Record<string, string> = {
  retail: "border-line-strong text-muted",
  tester: "border-accent/40 text-accent bg-accent-soft",
  refill: "border-positive/30 text-positive bg-positive-soft",
  gift_set: "border-caution/30 text-caution bg-caution-soft",
  unboxed: "border-critical/25 text-critical bg-critical-soft",
};

export function PresentationTag({ presentation, label }: { presentation: string; label: string }) {
  const cls = PRESENTATION_STYLES[presentation] ?? PRESENTATION_STYLES.retail;
  return (
    <span
      className={`inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.09em] ${cls}`}
    >
      {label}
    </span>
  );
}
