import { listPendingAlerts, markAlertDelivered, type PendingAlert } from "./run";
import { sendAlertEmail, type SendResult } from "@/email/alerts";

export interface DeliverySummary {
  considered: number;
  sent: number;
  failed: number;
  /** Not attempted — no API key configured, or no address for the user. */
  skipped: number;
  reasons: Record<string, number>;
}

const note = (s: DeliverySummary, reason: string) => {
  s.reasons[reason] = (s.reasons[reason] ?? 0) + 1;
};

/**
 * Drain the pending alert queue.
 *
 * The queue is the source of truth: an alert stays `pending` unless we have
 * positive confirmation it went out. That means a missing API key, a missing
 * address, or a provider error all leave the row untouched and retryable —
 * we never mark an unsent alert as delivered, and we never drop one silently.
 */
export async function deliverPendingAlerts(
  limit = 50,
  send: (to: string, alert: PendingAlert) => Promise<SendResult> = sendAlertEmail,
): Promise<DeliverySummary> {
  const summary: DeliverySummary = {
    considered: 0,
    sent: 0,
    failed: 0,
    skipped: 0,
    reasons: {},
  };

  const pending = await listPendingAlerts(limit);
  summary.considered = pending.length;

  for (const alert of pending) {
    if (!alert.email) {
      // We never captured an address for this user. Not a delivery failure —
      // leave it queued so it goes out once we have one.
      summary.skipped++;
      note(summary, "no_address_on_file");
      continue;
    }

    const result = await send(alert.email, alert);

    if (result.status === "sent") {
      await markAlertDelivered(alert.alertEventId, "sent");
      summary.sent++;
      continue;
    }

    if (result.status === "skipped") {
      summary.skipped++;
      note(summary, result.detail ?? "skipped");
      continue;
    }

    // A provider error is counted so it is visible, but the row stays `pending`
    // so a transient outage does not lose the alert.
    //
    // Known limitation: there is no attempt counter or backoff yet, so a
    // *permanent* failure (a dead address) would be retried on every run. The
    // `failed` delivery status exists for that path and is deliberately not
    // used until we can tell the two kinds of error apart.
    summary.failed++;
    note(summary, result.detail ?? "send_failed");
  }

  return summary;
}
