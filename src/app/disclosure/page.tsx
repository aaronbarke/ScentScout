import type { Metadata } from "next";
import { Prose } from "@/components/Prose";

export const metadata: Metadata = {
  title: "Affiliate disclosure",
  description:
    "How ScentScout makes money, and why commission never affects how offers are ranked.",
};

export default function DisclosurePage() {
  return (
    <Prose eyebrow="Transparency" title="Affiliate disclosure" updated="24 July 2026">
      <h2>How we make money</h2>
      <p>
        ScentScout is free to use. We intend to earn commission through retailer affiliate
        programmes: if you follow a link from here to a retailer and buy something, that retailer
        may pay us a small percentage. You never pay more because of it — the price is the same as
        going to the retailer directly.
      </p>
      <p>
        Where a link is an affiliate link, we mark it. At the time of writing we are still applying
        to these programmes, so some or all outbound links currently earn us nothing.
      </p>

      <h2>Commission never affects ranking</h2>
      <p>
        This is the commitment that matters, so we want to be precise about it. Offers are ordered
        by, in this order: whether the item is actually in stock, whether we can establish a real
        delivered total, that delivered total, delivery speed, how fresh our data is, and a
        retailer trust score. <strong>Commission rate is not an input.</strong> We do not accept
        payment for placement, and a retailer cannot buy a better position.
      </p>
      <p>
        A retailer paying us more will not appear above a cheaper one. If we ever changed that, this
        page would say so.
      </p>

      <h2>What we will not do</h2>
      <ul>
        <li>Show a delivered total we cannot substantiate. If a retailer does not publish its
          shipping cost, we say shipping is unknown rather than assuming it is free.</li>
        <li>Apply an unverified discount code to a headline price.</li>
        <li>Present a pre-tax estimate as your exact total at checkout.</li>
        <li>Combine a tester, refill or gift set with a retail bottle to make a price look better.</li>
      </ul>

      <h2>Prices are estimates</h2>
      <p>
        Prices and availability come from data we collect periodically and can be out of date or
        wrong. Always confirm the final price at the retailer&apos;s checkout before buying. We are
        not the seller and are not party to your purchase.
      </p>
    </Prose>
  );
}
