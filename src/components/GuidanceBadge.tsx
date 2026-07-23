import { guidanceLabel } from "@/lib/format";

const STYLES: Record<string, string> = {
  exceptional_price: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  good_price: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  normal_price: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  expensive: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  insufficient_history: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
};

export function GuidanceBadge({ label }: { label: string }) {
  const cls = STYLES[label] ?? STYLES.normal_price;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {guidanceLabel(label)}
    </span>
  );
}

const PRESENTATION_STYLES: Record<string, string> = {
  tester: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
  refill: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  gift_set: "bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-300",
  unboxed: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
  retail: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
};

export function PresentationTag({ presentation, label }: { presentation: string; label: string }) {
  const cls = PRESENTATION_STYLES[presentation] ?? PRESENTATION_STYLES.retail;
  return (
    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium ${cls}`}>
      {label}
    </span>
  );
}
