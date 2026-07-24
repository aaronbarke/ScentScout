import { describe, it, expect, vi } from "vitest";
import { renderAlertEmail } from "@/email/alerts";
import type { PendingAlert } from "@/domain/alerts/run";

const alert = (over: Partial<PendingAlert> = {}): PendingAlert => ({
  alertEventId: "evt-1",
  alertRuleId: "rule-1",
  userId: "user-1",
  email: "someone@example.com",
  deduplicationKey: "v1:rule-1:retailer-1:delivered:24000",
  brandName: "BDK Parfums",
  fragranceName: "Gris Charnel",
  canonicalSku: "bdk-parfums-gris-charnel-edp-100ml-retail",
  retailerName: "Luckyscent",
  deliveredPriceCents: 24_000,
  listedPriceCents: 25_000,
  ...over,
});

describe("alert email content is honest", () => {
  it("shows the delivered total when we know shipping", () => {
    const { subject, text, html } = renderAlertEmail(alert(), "https://example.com");
    expect(subject).toContain("$240.00");
    expect(text).toContain("estimated delivered price before tax");
    expect(html).toContain("$240.00");
  });

  it("never presents a listed price as a delivered total", () => {
    // Shipping unknown → the email must say so rather than implying the
    // listed price is what lands on the card.
    const { text } = renderAlertEmail(alert({ deliveredPriceCents: null }), "https://example.com");
    expect(text).toContain("plus unknown shipping");
    expect(text).not.toContain("estimated delivered price before tax");
  });

  it("tells the reader the price is an estimate to confirm at checkout", () => {
    const { text } = renderAlertEmail(alert(), "https://example.com");
    expect(text).toMatch(/confirm at checkout/i);
  });

  it("names the exact variant, so a tester is never mistaken for a bottle", () => {
    const { text } = renderAlertEmail(alert(), "https://example.com");
    expect(text).toContain("bdk-parfums-gris-charnel-edp-100ml-retail");
  });
});

describe("the delivery queue never lies about what was sent", () => {
  // deliverPendingAlerts takes an injected sender, so these exercise the real
  // control flow without a database or a network call.
  async function runWith(
    pending: PendingAlert[],
    send: (to: string, a: PendingAlert) => Promise<{ status: "sent" | "skipped" | "failed"; detail?: string }>,
  ) {
    vi.resetModules();
    const marked: Array<[string, string]> = [];
    vi.doMock("@/domain/alerts/run", () => ({
      listPendingAlerts: async () => pending,
      markAlertDelivered: async (id: string, status: string) => {
        marked.push([id, status]);
      },
    }));
    const { deliverPendingAlerts } = await import("@/domain/alerts/deliver");
    const summary = await deliverPendingAlerts(50, send);
    return { summary, marked };
  }

  it("marks an alert sent only when the provider confirms it", async () => {
    const { summary, marked } = await runWith([alert()], async () => ({ status: "sent" }));
    expect(summary.sent).toBe(1);
    expect(marked).toEqual([["evt-1", "sent"]]);
  });

  it("leaves an alert queued when there is no API key", async () => {
    const { summary, marked } = await runWith([alert()], async () => ({
      status: "skipped",
      detail: "RESEND_API_KEY not set — email not sent",
    }));
    expect(summary.sent).toBe(0);
    expect(summary.skipped).toBe(1);
    // Nothing was written, so the alert is still deliverable later.
    expect(marked).toEqual([]);
  });

  it("leaves an alert queued when the provider errors", async () => {
    const { summary, marked } = await runWith([alert()], async () => ({
      status: "failed",
      detail: "Resend responded 503",
    }));
    expect(summary.failed).toBe(1);
    expect(marked).toEqual([]);
    expect(summary.reasons["Resend responded 503"]).toBe(1);
  });

  it("does not attempt a send when no address was ever captured", async () => {
    const send = vi.fn(async () => ({ status: "sent" as const }));
    const { summary, marked } = await runWith([alert({ email: null })], send);
    expect(send).not.toHaveBeenCalled();
    expect(summary.skipped).toBe(1);
    expect(summary.reasons["no_address_on_file"]).toBe(1);
    expect(marked).toEqual([]);
  });
});
