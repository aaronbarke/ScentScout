import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";
import { listWatchlist, listAlertRules, listAlertHistory } from "@/domain/alerts/watchlists";
import { signOut, removeRule } from "@/app/actions";
import { formatCents, variantDescriptor } from "@/lib/format";
import { variantPath } from "@/lib/catalog-slug";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your account",
  robots: { index: false },
};

const pathFor = (slug: string, concentration: string, sizeMl: number, presentation: string) =>
  `/fragrances/${slug}/${variantPath(
    concentration as Parameters<typeof variantPath>[0],
    sizeMl,
    presentation as Parameters<typeof variantPath>[2],
  )}`;

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [watchlist, rules, history] = await Promise.all([
    listWatchlist(user.id),
    listAlertRules(user.id),
    listAlertHistory(user.id),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold">Your account</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
        </div>
        <form action={signOut} className="ml-auto">
          <button className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">
            Sign out
          </button>
        </form>
      </div>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Alerts ({rules.length})</h2>
        {rules.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700">
            No alerts yet. Open any exact variant and set a target delivered price.
          </p>
        ) : (
          <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
            {rules.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-3 bg-white p-4 dark:bg-slate-900">
                <div className="min-w-0">
                  <Link
                    href={pathFor(r.fragranceSlug, r.concentration, r.sizeMl, r.presentation)}
                    className="font-medium hover:underline"
                  >
                    {r.brandName} — {r.fragranceName}
                  </Link>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {variantDescriptor(r.concentration, r.sizeMl, r.presentation)}
                  </div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {r.maximumDeliveredPriceCents === null
                      ? "Any in-stock offer (restock alert)"
                      : `Alert at or below ${formatCents(r.maximumDeliveredPriceCents)} delivered`}
                    {r.lastTriggeredAt && " · already triggered once"}
                  </div>
                </div>
                <form action={removeRule} className="ml-auto">
                  <input type="hidden" name="ruleId" value={r.id} />
                  <button className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">
                    Remove
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-xs text-slate-400">
          Alerts only fire on a fresh, in-stock, exactly-matched offer. If a retailer doesn&apos;t
          publish shipping, we can&apos;t prove a delivered-price target and won&apos;t alert on it.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Watchlist ({watchlist.length})</h2>
        {watchlist.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700">
            Nothing tracked yet.
          </p>
        ) : (
          <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
            {watchlist.map((w) => (
              <li key={w.productVariantId} className="bg-white p-4 dark:bg-slate-900">
                <Link
                  href={pathFor(w.fragranceSlug, w.concentration, w.sizeMl, w.presentation)}
                  className="font-medium hover:underline"
                >
                  {w.brandName} — {w.fragranceName}
                </Link>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {variantDescriptor(w.concentration, w.sizeMl, w.presentation)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Alert history</h2>
        {history.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">No alerts have fired yet.</p>
        ) : (
          <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
            {history.map((h) => (
              <li key={h.id} className="flex items-center gap-3 bg-white p-3 text-sm dark:bg-slate-900">
                <span>
                  {h.brandName} — {h.fragranceName}
                </span>
                <span className="ml-auto text-xs text-slate-400">
                  {h.deliveryStatus}
                  {h.sentAt ? ` · ${h.sentAt.toLocaleDateString()}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
