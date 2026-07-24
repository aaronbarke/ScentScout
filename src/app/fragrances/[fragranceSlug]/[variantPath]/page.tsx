import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getVariantHeader } from "@/domain/catalog/queries";
import { getVariantOfferBoard } from "@/domain/pricing/offers";
import { OfferBoard } from "@/components/OfferBoard";
import { PresentationTag } from "@/components/GuidanceBadge";
import { TrackVariant } from "@/components/TrackVariant";
import { VariantJsonLd } from "@/components/VariantJsonLd";
import { getCurrentUser } from "@/lib/supabase/server";
import { isWatching } from "@/domain/alerts/watchlists";
import { variantDescriptor, presentationLabel } from "@/lib/format";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ fragranceSlug: string; variantPath: string }> };

const skuOf = (fragranceSlug: string, variantPath: string) => `${fragranceSlug}-${variantPath}`;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { fragranceSlug, variantPath } = await params;
  const header = await getVariantHeader(skuOf(fragranceSlug, variantPath));
  if (!header) return { title: "Variant not found" };
  const title = `${header.brandName} ${header.fragranceName} — ${variantDescriptor(
    header.concentration,
    header.sizeMl,
    header.presentation,
  )}`;
  return {
    title,
    description: `Where to buy ${header.brandName} ${header.fragranceName} (${header.sizeMl}ml ${presentationLabel(
      header.presentation,
    )}) at the best delivered price, with price history and buy-now guidance.`,
  };
}

export default async function VariantPage({ params }: Params) {
  const { fragranceSlug, variantPath } = await params;
  const sku = skuOf(fragranceSlug, variantPath);

  const [header, board, user] = await Promise.all([
    getVariantHeader(sku),
    getVariantOfferBoard(sku),
    getCurrentUser(),
  ]);
  if (!header || !board) notFound();

  const watching = user ? await isWatching(user.id, board.variantId) : false;

  return (
    <div className="space-y-6">
      <VariantJsonLd
        board={board}
        url={`${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3004"}/fragrances/${fragranceSlug}/${variantPath}`}
        concentration={header.concentration}
        sizeMl={header.sizeMl}
        presentation={header.presentation}
      />
      <nav className="text-sm text-faint">
        <Link href="/fragrances" className="hover:underline">
          Fragrances
        </Link>{" "}
        /{" "}
        <Link href={`/fragrances/${header.fragranceSlug}`} className="hover:underline">
          {header.fragranceName}
        </Link>{" "}
        / <span className="text-body">{header.sizeMl}ml</span>
      </nav>

      <header>
        <div className="eyebrow">
          {header.brandName}
        </div>
        <h1 className="font-display text-[2.6rem] leading-tight text-ink">{header.fragranceName}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-body">
          <span>{variantDescriptor(header.concentration, header.sizeMl, header.presentation)}</span>
          <PresentationTag presentation={header.presentation} label={presentationLabel(header.presentation)} />
        </div>
      </header>

      <OfferBoard
        board={board}
        chartPoints={board.series}
        rail={
          <TrackVariant
            variantId={board.variantId}
            path={`/fragrances/${fragranceSlug}/${variantPath}`}
            signedIn={user !== null}
            watching={watching}
          />
        }
      />
    </div>
  );
}
