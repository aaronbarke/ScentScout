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
      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-900">
        <Link href="/login" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
          Sign in
        </Link>{" "}
        <span className="text-slate-500 dark:text-slate-400">
          to track this exact variant and get alerted when it hits your price.
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <form action={toggleWatch}>
        <input type="hidden" name="variantId" value={variantId} />
        <input type="hidden" name="watching" value={String(watching)} />
        <input type="hidden" name="path" value={path} />
        <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">
          {watching ? "★ Watching" : "☆ Watch"}
        </button>
      </form>

      <form action={createRule} className="flex flex-wrap items-end gap-2">
        <input type="hidden" name="variantId" value={variantId} />
        <div>
          <label htmlFor="maximumPrice" className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
            Alert me at or below (delivered, $)
          </label>
          <input
            id="maximumPrice"
            name="maximumPrice"
            type="number"
            min="1"
            step="0.01"
            placeholder="250.00"
            className="w-36 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900"
          />
        </div>
        <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
          Create alert
        </button>
      </form>

      <p className="w-full text-xs text-slate-400">
        Leave the price blank for a restock alert on any in-stock offer.
      </p>
    </div>
  );
}
