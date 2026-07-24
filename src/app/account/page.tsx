import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";
import { listWatchlist, listAlertRules, listAlertHistory } from "@/domain/alerts/watchlists";
import { signOut, removeRule } from "@/app/actions";
import { formatCents, variantDescriptor } from "@/lib/format";
import { variantPath } from "@/lib/catalog-slug";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Your account", robots: { index: false } };

const pathFor = (slug: string, concentration: string, sizeMl: number, presentation: string) =>
  `/fragrances/${slug}/${variantPath(
    concentration as Parameters<typeof variantPath>[0],
    sizeMl,
    presentation as Parameters<typeof variantPath>[2],
  )}`;

function SectionHeading({ label, count }: { label: string; count?: number }) {
  return (
    <h2 className="border-b border-line pb-3 eyebrow">
      {label}
      {count !== undefined ? ` · ${count}` : ""}
    </h2>
  );
}

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [watchlist, rules, history] = await Promise.all([
    listWatchlist(user.id),
    listAlertRules(user.id),
    listAlertHistory(user.id),
  ]);

  return (
    <div className="space-y-14">
      <header className="flex flex-wrap items-end gap-4 border-b border-line pb-8">
        <div>
          <p className="eyebrow">Signed in as</p>
          <h1 className="mt-3 font-display text-[2.5rem] leading-tight text-ink">{user.email}</h1>
        </div>
        <form action={signOut} className="ml-auto">
          <button className="border-b border-line-strong pb-0.5 text-xs uppercase tracking-[0.12em] text-muted transition-colors hover:border-accent hover:text-accent">
            Sign out
          </button>
        </form>
      </header>

      <section>
        <SectionHeading label="Alerts" count={rules.length} />
        {rules.length === 0 ? (
          <p className="py-8 text-sm text-muted">
            No alerts yet. Open any exact variant and set a target delivered price.
          </p>
        ) : (
          <ul>
            {rules.map((r) => (
              <li key={r.id} className="flex flex-wrap items-baseline gap-x-5 gap-y-2 border-b border-line py-5">
                <div className="min-w-0">
                  <p className="eyebrow">{r.brandName}</p>
                  <Link
                    href={pathFor(r.fragranceSlug, r.concentration, r.sizeMl, r.presentation)}
                    className="mt-1 block font-display text-xl text-ink transition-colors hover:text-accent"
                  >
                    {r.fragranceName}
                  </Link>
                  <p className="mt-1 text-xs text-muted">
                    {variantDescriptor(r.concentration, r.sizeMl, r.presentation)}
                  </p>
                </div>
                <div className="ml-auto flex shrink-0 items-baseline gap-6">
                  <span className="text-right text-xs text-muted">
                    {r.maximumDeliveredPriceCents === null ? (
                      "any in-stock offer"
                    ) : (
                      <>
                        at or below{" "}
                        <span className="font-display text-lg tabular text-ink">
                          {formatCents(r.maximumDeliveredPriceCents)}
                        </span>{" "}
                        delivered
                      </>
                    )}
                    {r.lastTriggeredAt && <span className="block text-faint">already triggered</span>}
                  </span>
                  <form action={removeRule}>
                    <input type="hidden" name="ruleId" value={r.id} />
                    <button className="border-b border-line-strong pb-0.5 text-[11px] uppercase tracking-[0.12em] text-muted transition-colors hover:border-critical hover:text-critical">
                      Remove
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 max-w-prose text-xs leading-relaxed text-faint">
          Alerts fire only on a fresh, in-stock, exactly-matched offer. If a retailer doesn&apos;t
          publish shipping we cannot prove a delivered-price target, so we won&apos;t alert on it.
        </p>
      </section>

      <section>
        <SectionHeading label="Watchlist" count={watchlist.length} />
        {watchlist.length === 0 ? (
          <p className="py-8 text-sm text-muted">Nothing tracked yet.</p>
        ) : (
          <ul>
            {watchlist.map((w) => (
              <li key={w.productVariantId}>
                <Link
                  href={pathFor(w.fragranceSlug, w.concentration, w.sizeMl, w.presentation)}
                  className="group flex flex-wrap items-baseline gap-x-5 gap-y-2 border-b border-line py-4"
                >
                  <span className="eyebrow w-36 shrink-0 truncate">{w.brandName}</span>
                  <span className="font-display text-xl text-ink transition-colors group-hover:text-accent">
                    {w.fragranceName}
                  </span>
                  <span className="ml-auto text-xs text-muted">
                    {variantDescriptor(w.concentration, w.sizeMl, w.presentation)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <SectionHeading label="Alert history" />
        {history.length === 0 ? (
          <p className="py-8 text-sm text-muted">No alerts have fired yet.</p>
        ) : (
          <ul>
            {history.map((h) => (
              <li key={h.id} className="flex items-baseline gap-5 border-b border-line py-4 text-sm">
                <span className="eyebrow w-36 shrink-0 truncate">{h.brandName}</span>
                <span className="text-body">{h.fragranceName}</span>
                <span className="ml-auto text-[11px] uppercase tracking-[0.1em] text-faint">
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
