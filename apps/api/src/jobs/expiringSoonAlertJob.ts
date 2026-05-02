import cron from "node-cron";
import { Blood, IBloodDocument } from "../blood-inventory/models/Blood";
import { calculateDaysLeft } from "../blood-inventory/utils/bloodStatus";
import { sendExpiringSoonEmail } from "../blood-inventory/services/emailService";
import { getActiveHospitalEmailsByUsernames } from "../blood-inventory/services/hospitalUserService";

function getCollectionDateTime(unit: IBloodDocument): Date {
  return (unit.collectionDateTime ?? unit.collectionDate) as Date;
}

function getExpiryDateTime(unit: IBloodDocument): Date {
  return (unit.expiryDateTime ?? unit.expiryDate) as Date;
}

export async function runExpiringSoonAlertJob(): Promise<void> {
  try {
    const units = await Blood.find().exec();
    const warningWindowUnits = units
      .map((unit) => {
        const expiryDateTime = getExpiryDateTime(unit);
        const daysLeft = calculateDaysLeft(expiryDateTime);
        return {
          id: unit._id,
          username: unit.username ?? "",
          unitId: unit.unitId,
          bloodType: unit.bloodType,
          component: unit.component,
          collectionDateTime: getCollectionDateTime(unit),
          expiryDateTime,
          daysLeft,
          expiringSoonAlertSent: Boolean(unit.expiringSoonAlertSent),
        };
      })
      .filter((unit) => unit.daysLeft <= 14 && unit.daysLeft > 0 && !unit.expiringSoonAlertSent)
      .sort((a, b) => a.expiryDateTime.getTime() - b.expiryDateTime.getTime());

    if (warningWindowUnits.length === 0) {
      return;
    }

    const byUsername = new Map<string, typeof warningWindowUnits>();
    for (const unit of warningWindowUnits) {
      const username = unit.username.trim();
      const list = byUsername.get(username) ?? [];
      list.push(unit);
      byUsername.set(username, list);
    }

    const usernames = Array.from(byUsername.keys());
    const hospitalEmailMap = await getActiveHospitalEmailsByUsernames(usernames);
    const fallbackEmail = process.env.EXPIRY_ALERT_HOSPITAL_EMAIL?.trim() || "";

    let totalSentUnits = 0;
    for (const username of usernames) {
      const groupUnits = byUsername.get(username) ?? [];
      if (groupUnits.length === 0) continue;

      const recipientEmail = hospitalEmailMap.get(username) || fallbackEmail;
      if (!recipientEmail) {
        console.warn(
          `[ExpiryAlertJob] Skipped ${groupUnits.length} unit(s) for username "${username}" (no hospital email found and no fallback configured).`
        );
        continue;
      }

      try {
        await sendExpiringSoonEmail({
          toEmail: recipientEmail,
          hospitalUsername: username || undefined,
          rows: groupUnits.map((unit) => ({
            unitId: unit.unitId,
            bloodType: unit.bloodType,
            component: unit.component,
            collectionDateTime: unit.collectionDateTime,
            expiryDateTime: unit.expiryDateTime,
            daysLeft: unit.daysLeft,
          })),
        });

        await Blood.updateMany(
          { _id: { $in: groupUnits.map((unit) => unit.id) } },
          { $set: { expiringSoonAlertSent: true } }
        ).exec();

        totalSentUnits += groupUnits.length;
      } catch (sendError) {
        console.error(
          `[ExpiryAlertJob] Failed to send expiring-soon alert for username "${username}" to "${recipientEmail}".`,
          sendError
        );
      }
    }

    if (totalSentUnits > 0) {
      console.log(`[ExpiryAlertJob] Sent one-time expiring-soon alert for ${totalSentUnits} unit(s).`);
    }
  } catch (error) {
    console.error("[ExpiryAlertJob] Failed to send expiring soon alert:", error);
  }
}

export function startExpiringSoonAlertScheduler(): void {
  const enabled = String(process.env.EXPIRY_ALERT_JOB_ENABLED ?? "true").toLowerCase() === "true";
  if (!enabled) {
    console.log("[ExpiryAlertJob] Scheduler disabled by EXPIRY_ALERT_JOB_ENABLED.");
    return;
  }

  const cronExpression = process.env.EXPIRY_ALERT_CRON?.trim() || "0 8 * * *";
  cron.schedule(cronExpression, () => {
    void runExpiringSoonAlertJob();
  });

  console.log(`[ExpiryAlertJob] Scheduler started with cron "${cronExpression}".`);
}
