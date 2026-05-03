import cron from "node-cron";
import { Blood } from "../blood-inventory/models/Blood";
import { stockLevelForCount } from "../blood-inventory/utils/bloodStatus";
import { sendLowStockEmail } from "../blood-inventory/services/emailService";
import { getActiveHospitalEmailsByUsernames, listActiveHospitalUsernames } from "../blood-inventory/services/hospitalUserService";

export async function runLowInventoryAlertJob(): Promise<void> {
  try {
    const hospitalUsernames = await listActiveHospitalUsernames();
    const hospitalEmailMap = await getActiveHospitalEmailsByUsernames(hospitalUsernames);
    const fallbackEmail = process.env.LOW_STOCK_HOSPITAL_EMAIL?.trim() || "";

    for (const username of hospitalUsernames) {
      const units = await Blood.find({ username, expiryDateTime: { $gte: new Date() } }).exec();
      
      // Group by blood type and component
      const counts: Record<string, number> = {};
      const componentMap: Record<string, string> = {};
      
      for (const unit of units) {
        const key = `${unit.bloodType}|${unit.component}`;
        counts[key] = (counts[key] ?? 0) + 1;
        componentMap[key] = unit.component;
      }

      const lowStockRows = [];
      // Define expected blood types and components to check even if count is 0
      const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
      const components = ["Whole Blood", "Red Cells", "Plasma", "Platelets"];

      for (const bt of bloodTypes) {
        for (const comp of components) {
          const key = `${bt}|${comp}`;
          const count = counts[key] ?? 0;
          if (count <= 5) {
            lowStockRows.push({
              bloodType: bt,
              component: comp,
              count,
              stockLevel: stockLevelForCount(count)
            });
          }
        }
      }

      if (lowStockRows.length === 0) continue;

      const recipientEmail = hospitalEmailMap.get(username) || fallbackEmail;
      if (!recipientEmail) continue;

      try {
        await sendLowStockEmail({
          toEmail: recipientEmail,
          hospitalUsername: username,
          rows: lowStockRows
        });
        console.log(`[LowInventoryJob] Sent alert to ${username} (${recipientEmail}) for ${lowStockRows.length} items.`);
      } catch (sendError) {
        console.error(`[LowInventoryJob] Failed to send alert to ${username}:`, sendError);
      }
    }
  } catch (error) {
    console.error("[LowInventoryJob] Failed to run job:", error);
  }
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
