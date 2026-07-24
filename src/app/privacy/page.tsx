import type { Metadata } from "next";
import { Prose } from "@/components/Prose";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What ScentScout stores, why, and how to have it deleted.",
};

export default function PrivacyPage() {
  return (
    <Prose eyebrow="Your data" title="Privacy" updated="24 July 2026">
      <h2>What we store</h2>
      <p>You can browse ScentScout without an account. If you create one, we store:</p>
      <ul>
        <li>Your email address and an authentication record, handled by Supabase Auth. We never
          see or store your password — it is hashed by the authentication provider.</li>
        <li>The exact variants you watch, and the alert rules you set (for example, a target
          delivered price).</li>
        <li>A record of alerts we have sent you, so we do not send the same one twice.</li>
      </ul>

      <h2>What we do not store</h2>
      <ul>
        <li>Payment details. We never take payment, so we never handle card data.</li>
        <li>Your address. We estimate delivered prices before tax and do not ask where you live.</li>
        <li>Advertising or cross-site tracking cookies. The only cookies we set are the ones that
          keep you signed in.</li>
      </ul>

      <h2>Email</h2>
      <p>
        We email you only for alerts you created, and for account essentials such as confirming
        your address. Every alert email includes a way to stop. We do not sell or rent your email
        address, and we do not send marketing you did not ask for.
      </p>

      <h2>Third parties</h2>
      <ul>
        <li><strong>Supabase</strong> — database and authentication.</li>
        <li><strong>Resend</strong> — sends alert emails, when email delivery is enabled.</li>
      </ul>
      <p>
        Following an outbound link takes you to a retailer&apos;s own site, governed by their
        privacy policy, not this one. If the link is an affiliate link, the affiliate network may
        record the referral — see our <a href="/disclosure">affiliate disclosure</a>.
      </p>

      <h2>Deleting your data</h2>
      <p>
        You can remove individual alerts and watched variants from your account page at any time.
        To have your account and its data deleted entirely, email us and we will remove it.
      </p>
    </Prose>
  );
}
