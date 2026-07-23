import type { PendingAlert } from "@/domain/alerts/run";

/**
 * Alert email rendering + delivery.
 *
 * Delivery goes through Resend's REST API (no extra dependency). With no
 * RESEND_API_KEY configured we return `skipped` — we never pretend an email was
 * sent, so alert_events stays `pending` and nothing is silently lost.
 */

export type SendResult = { status: "sent" | "skipped" | "failed"; detail?: string };

const money = (cents: number | null) =>
  cents === null ? null : `$${(cents / 100).toFixed(2)}`;

export function renderAlertEmail(alert: PendingAlert, siteUrl: string) {
  const delivered = money(alert.deliveredPriceCents);
  const listed = money(alert.listedPriceCents);
  const price = delivered ?? listed ?? "—";
  // Honesty rule: never present a listed price as a delivered total.
  const priceNote = delivered
    ? "estimated delivered price before tax"
    : "plus unknown shipping — delivered total not shown";

  const title = `${alert.brandName} ${alert.fragranceName}`;
  const subject = `${title} — ${price} at ${alert.retailerName}`;
  const url = `${siteUrl}/fragrances`;

  const text = [
    `${title}`,
    `${price} at ${alert.retailerName} (${priceNote})`,
    ``,
    `This matches your alert for the exact variant ${alert.canonicalSku}.`,
    `Prices are estimates and may change — always confirm at checkout.`,
    ``,
    `View on ScentScout: ${url}`,
  ].join("\n");

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:520px">
      <h2 style="margin:0 0 4px">${title}</h2>
      <p style="margin:0 0 16px;color:#475569">${alert.canonicalSku}</p>
      <p style="font-size:24px;font-weight:600;margin:0">${price}
        <span style="font-size:13px;font-weight:400;color:#64748b">at ${alert.retailerName}</span>
      </p>
      <p style="margin:4px 0 20px;font-size:12px;color:#64748b">${priceNote}</p>
      <a href="${url}" style="background:#4f46e5;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">View on ScentScout</a>
      <p style="margin-top:24px;font-size:12px;color:#94a3b8">
        Prices are estimates before tax and may change — always confirm at checkout.
      </p>
    </div>`;

  return { subject, text, html };
}

export async function sendAlertEmail(
  to: string,
  alert: PendingAlert,
  opts: { siteUrl?: string; apiKey?: string; from?: string } = {},
): Promise<SendResult> {
  const apiKey = opts.apiKey ?? process.env.RESEND_API_KEY;
  const siteUrl = opts.siteUrl ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3004";
  const from = opts.from ?? process.env.ALERT_FROM_EMAIL ?? "ScentScout <alerts@example.com>";

  const { subject, text, html } = renderAlertEmail(alert, siteUrl);

  if (!apiKey) {
    return { status: "skipped", detail: "RESEND_API_KEY not set — email not sent" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, text, html }),
    });
    if (!res.ok) {
      return { status: "failed", detail: `Resend responded ${res.status}` };
    }
    return { status: "sent" };
  } catch (err) {
    return { status: "failed", detail: (err as Error).message };
  }
}
