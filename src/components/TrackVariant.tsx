import Link from "next/link";
import { toggleWatch, createRule } from "@/app/actions";

/**
 * Watch/alert controls for one exact variant. Rendered server-side; signed-out
 * users get a prompt to sign in rather than a control that fails.
 */
export function TrackVariant({
  variantId,
  path,
  signedIn,
  watching,
}: {
  variantId: string;
  path: string;
  signedIn: boolean;
  watching: boolean;
}) {
  if (!signedIn) {
    return (
      <div className="rounded-xl border border-line bg-surface p-4 text-sm">
        <Link href="/login" className="font-medium text-accent hover:underline">
          Sign in
        </Link>{" "}
        <span className="text-muted">
          to track this exact variant and get alerted when it hits your price.
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-line bg-surface p-4">
      <form action={toggleWatch}>
        <input type="hidden" name="variantId" value={variantId} />
        <input type="hidden" name="watching" value={String(watching)} />
        <input type="hidden" name="path" value={path} />
        <button className="rounded-lg border border-line-strong px-3 py-2 text-sm font-medium hover:bg-raised">
          {watching ? "★ Watching" : "☆ Watch"}
        </button>
      </form>

      <form action={createRule} className="flex flex-wrap items-end gap-2">
        <input type="hidden" name="variantId" value={variantId} />
        <div>
          <label htmlFor="maximumPrice" className="mb-1 block text-xs text-muted">
            Alert me at or below (delivered, $)
          </label>
          <input
            id="maximumPrice"
            name="maximumPrice"
            type="number"
            min="1"
            step="0.01"
            placeholder="250.00"
            className="w-36 rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>
        <button className="rounded-lg bg-accent px-5 py-2 text-sm font-medium text-accent-contrast hover:bg-accent-strong">
          Create alert
        </button>
      </form>

      <p className="w-full text-xs text-faint">
        Leave the price blank for a restock alert on any in-stock offer.
      </p>
    </div>
  );
}
