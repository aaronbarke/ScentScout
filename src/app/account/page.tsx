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
          <h1 className="font-display text-[2.1rem] leading-tight text-ink">Your account</h1>
          <p className="text-sm text-muted">{user.email}</p>
        </div>
        <form action={signOut} className="ml-auto">
          <button className="rounded-lg border border-line-strong px-3 py-1.5 text-sm hover:bg-raised">
            Sign out
          </button>
        </form>
      </div>

      <section>
        <h2 className="mb-3 font-display text-xl text-ink">Alerts ({rules.length})</h2>
        {rules.length === 0 ? (
          <p className="rounded-lg border border-dashed border-line-strong p-4 text-sm text-muted">
            No alerts yet. Open any exact variant and set a target delivered price.
          </p>
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
            {rules.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-3 bg-surface p-4">
                <div className="min-w-0">
                  <Link
                    href={pathFor(r.fragranceSlug, r.concentration, r.sizeMl, r.presentation)}
                    className="font-medium hover:underline"
                  >
                    {r.brandName} — {r.fragranceName}
                  </Link>
                  <div className="text-xs text-muted">
                    {variantDescriptor(r.concentration, r.sizeMl, r.presentation)}
                  </div>
                  <div className="mt-1 text-xs text-muted">
                    {r.maximumDeliveredPriceCents === null
                      ? "Any in-stock offer (restock alert)"
                      : `Alert at or below ${formatCents(r.maximumDeliveredPriceCents)} delivered`}
                    {r.lastTriggeredAt && " · already triggered once"}
                  </div>
                </div>
                <form action={removeRule} className="ml-auto">
                  <input type="hidden" name="ruleId" value={r.id} />
                  <button className="rounded-lg border border-line-strong px-3 py-1.5 text-xs hover:bg-raised">
                    Remove
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-xs text-faint">
          Alerts only fire on a fresh, in-stock, exactly-matched offer. If a retailer doesn&apos;t
          publish shipping, we can&apos;t prove a delivered-price target and won&apos;t alert on it.
        </p>
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl text-ink">Watchlist ({watchlist.length})</h2>
        {watchlist.length === 0 ? (
          <p className="rounded-lg border border-dashed border-line-strong p-4 text-sm text-muted">
            Nothing tracked yet.
          </p>
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
            {watchlist.map((w) => (
              <li key={w.productVariantId} className="bg-surface p-4">
                <Link
                  href={pathFor(w.fragranceSlug, w.concentration, w.sizeMl, w.presentation)}
                  className="font-medium hover:underline"
                >
                  {w.brandName} — {w.fragranceName}
                </Link>
                <div className="text-xs text-muted">
                  {variantDescriptor(w.concentration, w.sizeMl, w.presentation)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl text-ink">Alert history</h2>
        {history.length === 0 ? (
          <p className="text-sm text-muted">No alerts have fired yet.</p>
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
            {history.map((h) => (
              <li key={h.id} className="flex items-center gap-3 bg-surface p-3 text-sm">
                <span>
                  {h.brandName} — {h.fragranceName}
                </span>
                <span className="ml-auto text-xs text-faint">
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
