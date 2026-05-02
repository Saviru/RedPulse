export type ScreenType = "total" | "alerts";

/** Whole days left from now (local) until expiryDateTime; negative if already expired. */
export function calculateDaysLeft(expiryDateTime: Date): number {
  const now = new Date();
  const diffMs = expiryDateTime.getTime() - now.getTime();
  const dayMs = 1000 * 60 * 60 * 24;
  
  return Math.floor(diffMs / dayMs);
}

export function isExpiryAlert(daysLeft: number): boolean {
  return daysLeft < 0 || daysLeft <= 10;
}

const HOUR_MS = 1000 * 60 * 60;
const DAY_MS = HOUR_MS * 24;


function remainingLabel(msLeft: number): string | null {
  if (msLeft <= 0) return null; // expired 

  if (msLeft >= DAY_MS) {
    const daysLeft = Math.floor(msLeft / DAY_MS);
    return `${daysLeft}d left`;
  }

  
  const rawHours = Math.floor(msLeft / HOUR_MS);
  const hoursLeft = Math.max(1, rawHours);
  return `${hoursLeft}h left`;
}

export interface StatusFields {
  daysLeft: number;
   /** Primary badge: Available | Expiring Soon*/
  status: string | null;
  expiryAlert: boolean;
  /** e.g. "10d left" when expiring soon; null for Available / Expired */
  daysLeftLabel: string | null;
}

/**
 * Total Units (active only): >10d → Available; 0–10d → Expiring Soon + daysLeftLabel.
 * Alerts: expired → Expired; 0–10d → Expiring Soon + daysLeftLabel. (>10d not shown — filtered in controller.)
 */
export function computeStatusForScreen(expiryDateTime: Date, screen: ScreenType): StatusFields {
  const msLeft = expiryDateTime.getTime() - Date.now();
  const daysLeft = Math.floor(msLeft / DAY_MS);
  const expired = msLeft <= 0;
  const label = remainingLabel(msLeft);

  if (screen === "total") {
    if (expired) {
      return { daysLeft, status: null, expiryAlert: true, daysLeftLabel: null };
    }
    if (daysLeft > 10) {
      return { daysLeft, status: "Available", expiryAlert: false, daysLeftLabel: null };
    }
    return {
      daysLeft,
      status: "Expiring Soon",
      expiryAlert: true,
      daysLeftLabel: label,
    };
  }

  if (expired) {
    return { daysLeft, status: "Expired", expiryAlert: true, daysLeftLabel: null };
  }
  return {
    daysLeft,
    status: "Expiring Soon",
    expiryAlert: true,
    daysLeftLabel: label,
  };
}

/** Expiry Alerts list: expired or expiry within 10 days. Excludes more than 10 days left. */
export function shouldIncludeInAlerts(daysLeft: number): boolean {
  return daysLeft <= 10;
}



export type StockLevel = "Critical Low" | "Normal Stock";

export function stockLevelForCount(count: number): StockLevel {
  return count <= 5 ? "Critical Low" : "Normal Stock";
}

export function lowStockAlertForCount(count: number): boolean {
  return count <= 5;
}
