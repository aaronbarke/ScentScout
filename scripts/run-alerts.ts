import "dotenv/config";
import { queryClient } from "@/db/client";
import { runAlerts, listPendingAlerts } from "@/domain/alerts/run";
import { renderAlertEmail } from "@/email/alerts";
import { deliverPendingAlerts } from "@/domain/alerts/deliver";

/**
 *   npm run alerts               evaluate rules and record pending alerts
 *   npm run alerts -- --pending  show recorded alerts awaiting delivery
 *   npm run alerts -- --deliver  drain the queue (needs RESEND_API_KEY)
 */
async function main() {
  const argv = process.argv.slice(2);

  if (argv.includes("--deliver")) {
    const s = await deliverPendingAlerts();
    console.log("Delivery:");
    console.log(`  considered: ${s.considered}`);
    console.log(`  sent:       ${s.sent}`);
    console.log(`  failed:     ${s.failed}`);
    console.log(`  skipped:    ${s.skipped}`);
    for (const [reason, n] of Object.entries(s.reasons)) console.log(`    ${reason}: ${n}`);
    if (s.sent === 0 && s.considered > 0) {
      console.log("\n  Nothing was marked delivered — alerts remain queued and retryable.");
    }
    return;
  }

  if (argv.includes("--pending")) {
    const pending = await listPendingAlerts();
    console.log(`pending alerts: ${pending.length}`);
    for (const p of pending) {
      const { subject } = renderAlertEmail(p, "http://localhost:3004");
      console.log(`  ${subject}`);
    }
    return;
  }

  const s = await runAlerts();
  console.log("Alert run:");
  console.log(`  rules evaluated:      ${s.rulesEvaluated}`);
  console.log(`  candidates evaluated: ${s.candidatesEvaluated}`);
  console.log(`  alerts created:       ${s.alertsCreated}`);
  console.log(`  duplicates suppressed:${s.suppressedDuplicates}`);
  const blocked = Object.entries(s.blockedReasons);
  if (blocked.length) {
    console.log("  not fired:");
    for (const [reason, n] of blocked.sort((a, b) => b[1] - a[1])) {
      console.log(`    ${reason}: ${n}`);
    }
  }
}

main()
  .catch((err) => {
    console.error("run-alerts failed:", (err as Error).message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await queryClient.end();
  });
