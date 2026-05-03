import cron from "node-cron";
import { Blood } from "../blood-inventory/models/Blood";
import { stockLevelForCount } from "../blood-inventory/utils/bloodStatus";
import { sendLowStockEmail } from "../blood-inventory/services/emailService";
import { getActiveHospitalEmailsByUsernames, listActiveHospitalUsernames } from "../blood-inventory/services/hospitalUserService";

export async function runLowInventoryAlertJob(): Promise<void> {
  console.log("[LowInventoryJob] Low inventory emails are disabled by user request.");
  return;
}

export function startLowInventoryAlertScheduler(): void {
  const enabled = String(process.env.LOW_STOCK_ALERT_JOB_ENABLED ?? "true").toLowerCase() === "true";
  if (!enabled) {
    console.log("[LowInventoryJob] Scheduler disabled.");
    return;
  }

  // Run once a week or as configured
  const cronExpression = process.env.LOW_STOCK_ALERT_CRON?.trim() || "0 9 * * 1"; // Mondays at 9 AM
  cron.schedule(cronExpression, () => {
    void runLowInventoryAlertJob();
  });

  console.log(`[LowInventoryJob] Scheduler started with cron "${cronExpression}".`);
}
