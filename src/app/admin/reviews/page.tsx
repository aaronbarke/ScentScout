import type { Metadata } from "next";
import { getAdminUser } from "@/lib/admin";
import { listPendingReviews, listSiblingVariants } from "@/domain/matching/review";
import { approveMatch, rejectMatch } from "@/app/admin/actions";
import { variantDescriptor } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Match review queue",
  // Admin tooling must never be indexed.
  robots: { index: false, follow: false },
};

export default async function AdminReviewsPage() {
  const admin = await getAdminUser();

  // Deliberately vague: an unauthorized visitor learns nothing about whether
  // this route exists or who is an admin.
  if (!admin) {
    return (
      <div className="mx-auto max-w-lg py-16">
        <p className="eyebrow">Restricted</p>
        <h1 className="mt-4 font-display text-[2rem] leading-tight text-ink">Not available</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          You don&apos;t have access to this page.
        </p>
      </div>
    );
  }

  const reviews = await listPendingReviews();
  const siblingsByReview = new Map(
    await Promise.all(
      reviews.map(
        async (r) =>
          [r.reviewId, r.suggestedVariantId ? await listSiblingVariants(r.suggestedVariantId) : []] as const,
      ),
    ),
  );

  return (
    <div className="space-y-12">
      <header className="grid gap-x-12 gap-y-4 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <p className="eyebrow">Admin</p>
          <h1 className="mt-4 font-display text-[2.75rem] leading-tight text-ink">
            Match review
          </h1>
        </div>
        <div className="flex items-end lg:col-span-5">
          <p className="max-w-sm text-sm leading-relaxed text-muted">
            Listings the matcher would not approve on its own. Approving binds the listing to one
            exact variant; rejecting leaves it unmatched. Either way the decision is final — a
            later matching run will not overwrite it.
          </p>
        </div>
      </header>

      {reviews.length === 0 ? (
        <p className="border-t border-line py-10 text-sm text-muted">
          Nothing awaiting review.
        </p>
      ) : (
        <ul className="border-t border-line">
          {reviews.map((r) => {
            const siblings = siblingsByReview.get(r.reviewId) ?? [];
            return (
              <li key={r.reviewId} className="border-b border-line py-8">
                <div className="grid gap-x-12 gap-y-6 lg:grid-cols-12">
                  {/* What the retailer published */}
                  <div className="lg:col-span-7">
                    <p className="eyebrow">Listing</p>
                    <p className="mt-2 font-display text-xl leading-snug text-ink">{r.rawTitle}</p>
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="mt-2 inline-block text-xs text-accent underline-offset-2 hover:underline"
                    >
                      View on retailer ↗
                    </a>

                    {r.reviewNotes && (
                      <>
                        <p className="eyebrow mt-6">Why it needs a human</p>
                        <pre className="mt-2 max-w-prose overflow-x-auto whitespace-pre-wrap font-sans text-xs leading-relaxed text-muted">
                          {r.reviewNotes}
                        </pre>
                      </>
                    )}
                  </div>

                  {/* The decision */}
                  <div className="lg:col-span-5">
                    <p className="eyebrow">
                      Suggested
                      {r.originalConfidence !== null && (
                        <span className="tabular"> · confidence {r.originalConfidence}</span>
                      )}
                    </p>
                    <p className="mt-2 text-sm text-body">{r.suggestedSku ?? "— none —"}</p>

                    <form action={approveMatch} className="mt-5 space-y-3">
                      <input type="hidden" name="reviewId" value={r.reviewId} />
                      {siblings.length > 0 && (
                        <div>
                          <label
                            htmlFor={`variant-${r.reviewId}`}
                            className="eyebrow block"
                          >
                            Bind to variant
                          </label>
                          <select
                            id={`variant-${r.reviewId}`}
                            name="variantId"
                            defaultValue={r.suggestedVariantId ?? ""}
                            className="mt-2 w-full border-b border-line-strong bg-transparent py-2 text-sm text-ink outline-none focus:border-accent"
                          >
                            {siblings.map((s) => (
                              <option key={s.variantId} value={s.variantId}>
                                {variantDescriptor(s.concentration, s.sizeMl, s.presentation)}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      <button className="bg-accent px-6 py-2.5 text-xs uppercase tracking-[0.14em] text-accent-contrast transition-colors hover:bg-accent-strong">
                        Approve
                      </button>
                    </form>

                    <form action={rejectMatch} className="mt-4">
                      <input type="hidden" name="reviewId" value={r.reviewId} />
                      <button className="border-b border-line-strong pb-0.5 text-[11px] uppercase tracking-[0.12em] text-muted transition-colors hover:border-critical hover:text-critical">
                        Reject — not this product
                      </button>
                    </form>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
