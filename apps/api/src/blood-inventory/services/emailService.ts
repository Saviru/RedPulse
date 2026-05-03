import { Resend } from "resend";

function readEnv(name: string): string {
  const value = process.env[name];
  if (!value || !value.trim()) {
    if (name === "RESEND_API_KEY") return "re_123456789";
    return "";
  }
  return value.trim();
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(date);
}

// --- Low Stock Alert Types ---
export interface LowStockEmailRow {
  bloodType: string;
  component: string;
  count: number;
  stockLevel: string;
}

export interface SendLowStockEmailInput {
  rows: LowStockEmailRow[];
  toEmail: string;
  hospitalUsername?: string;
}

// --- Expiring Soon Alert Types ---
export interface ExpiringSoonEmailRow {
  unitId: string;
  bloodType: string;
  component: string;
  collectionDateTime: Date;
  expiryDateTime: Date;
  daysLeft: number;
}

export interface SendExpiringSoonEmailInput {
  rows: ExpiringSoonEmailRow[];
  toEmail: string;
  hospitalUsername?: string;
}

// --- Low Stock Helpers ---
function buildLowStockRowsHtml(rows: LowStockEmailRow[]): string {
  return rows
    .map(
      (row) => `
      <tr>
        <td>${row.bloodType}</td>
        <td>${row.component}</td>
        <td>${row.count}</td>
        <td style="color: ${row.count === 0 ? 'red' : 'orange'}">${row.stockLevel}</td>
      </tr>`
    )
    .join("");
}

function buildLowStockRowsText(rows: LowStockEmailRow[]): string {
  return rows
    .map(
      (row) =>
        `- Type: ${row.bloodType}, Component: ${row.component}, Count: ${row.count}, Level: ${row.stockLevel}`
    )
    .join("\n");
}

// --- Expiring Soon Helpers ---
function buildExpiringSoonRowsHtml(rows: ExpiringSoonEmailRow[]): string {
  return rows
    .map(
      (row) => `
      <tr>
        <td>${row.unitId}</td>
        <td>${row.bloodType}</td>
        <td>${row.component}</td>
        <td>${formatDateTime(row.collectionDateTime)}</td>
        <td>${formatDateTime(row.expiryDateTime)}</td>
        <td>${row.daysLeft}</td>
      </tr>`
    )
    .join("");
}

function buildExpiringSoonRowsText(rows: ExpiringSoonEmailRow[]): string {
  return rows
    .map(
      (row) =>
        `- Unit ID: ${row.unitId}, Type: ${row.bloodType}, Component: ${row.component}, ` +
        `Collection: ${formatDateTime(row.collectionDateTime)}, Expiry: ${formatDateTime(
          row.expiryDateTime
        )}, Days Left: ${row.daysLeft}`
    )
    .join("\n");
}

// --- Exported Services ---

export async function sendLowStockEmail({
  rows,
  toEmail,
  hospitalUsername,
}: SendLowStockEmailInput): Promise<void> {
  if (rows.length === 0) return;

  const resendApiKey = readEnv("RESEND_API_KEY");
  const to = toEmail.trim();
  const from = "RedPulse <no-reply@redpulse.saviru.me>";
  const resend = new Resend(resendApiKey);

  const subject = hospitalUsername?.trim()
    ? `RedPulse Alert (${hospitalUsername.trim()}): Low Blood Stock Levels`
    : `RedPulse Alert: Low Blood Stock Levels`;
    
  const text = [
    "This is an automatically generated alert from RedPulse.",
    "",
    "The following blood components are at low or critical stock levels:",
    buildLowStockRowsText(rows),
  ].join("\n");
  
  const html = `
    <p>This is an automatically generated alert from <strong>RedPulse</strong>.</p>
    <p>The following blood components are at low or critical stock levels:</p>
    <table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse;">
      <thead>
        <tr>
          <th>Blood Type</th>
          <th>Component</th>
          <th>Current Count</th>
          <th>Stock Level</th>
        </tr>
      </thead>
      <tbody>
        ${buildLowStockRowsHtml(rows)}
      </tbody>
    </table>
    <p>Please coordinate for replenishment as soon as possible.</p>
  `;

  try {
    await resend.emails.send({ from, to, subject, text, html });
  } catch (error) {
    console.error("Failed to send low stock email:", error);
  }
}

export async function sendExpiringSoonEmail({
  rows,
  toEmail,
  hospitalUsername,
}: SendExpiringSoonEmailInput): Promise<void> {
  if (rows.length === 0) return;

  const resendApiKey = readEnv("RESEND_API_KEY");
  const to = toEmail.trim();
  const from = "RedPulse <no-reply@redpulse.saviru.me>";
  const resend = new Resend(resendApiKey);

  const subject = hospitalUsername?.trim()
    ? `RedPulse Alert (${hospitalUsername.trim()}): ${rows.length} blood unit(s) expiring within 14 days`
    : `RedPulse Alert: ${rows.length} blood unit(s) expiring within 14 days`;
    
  const text = [
    "This is an automatically generated alert from RedPulse.",
    "",
    "The following blood units are expiring in 14 days or less:",
    buildExpiringSoonRowsText(rows),
  ].join("\n");
  
  const html = `
    <p>This is an automatically generated alert from <strong>RedPulse</strong>.</p>
    <p>The following blood units are expiring in 14 days or less:</p>
    <table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse;">
      <thead>
        <tr>
          <th>Blood Unit ID</th>
          <th>Type</th>
          <th>Component</th>
          <th>Collection Date & Time</th>
          <th>Expiry Date & Time</th>
          <th>Days Left</th>
        </tr>
      </thead>
      <tbody>
        ${buildExpiringSoonRowsHtml(rows)}
      </tbody>
    </table>
  `;

  try {
    await resend.emails.send({ from, to, subject, text, html });
  } catch (error) {
    console.error("Failed to send expiring soon email:", error);
  }
}
