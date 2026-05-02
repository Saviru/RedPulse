/**
 * FCM / Push Notification Service
 *
 * Primary:  Expo Push API  — works immediately, no Firebase Admin credentials needed.
 *           Expo push tokens are formatted as "ExponentPushToken[...]"
 *
 * Fallback: Firebase Admin SDK — used when a raw FCM device token is stored
 *           AND Firebase Admin credentials are configured in .env.
 */
import { env } from "../../config/env";

// ─── Expo Push API ────────────────────────────────────────────────────────────
const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

export type ExpoPushMessage = {
  to: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  sound?: "default";
  priority?: "high" | "normal" | "default";
  channelId?: string;
};

export type ExpoPushTicket = {
  status: "ok" | "error";
  id?: string;
  message?: string;
  details?: { error?: string };
};

/**
 * Send push notifications using the Expo Push API.
 * Supports both ExponentPushToken[...] (Expo managed) and raw FCM tokens.
 */
export const sendExpoPushNotifications = async (
  messages: ExpoPushMessage[]
): Promise<ExpoPushTicket[]> => {
  if (messages.length === 0) return [];

  try {
    const response = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messages),
    });

    const result = (await response.json()) as { data: ExpoPushTicket[] };
    console.log(
      `[FCM] Expo Push API: sent ${messages.length} messages →`,
      `${result.data?.filter((t) => t.status === "ok").length ?? 0} ok,`,
      `${result.data?.filter((t) => t.status === "error").length ?? 0} failed`
    );

    // Print out the exact reasons for the failures so we can debug them (e.g. DeviceNotRegistered)
    const errors = result.data?.filter((t) => t.status === "error");
    if (errors && errors.length > 0) {
      console.error(`[FCM] Push Errors Detailed:`, JSON.stringify(errors, null, 2));
    }
    return result.data ?? [];
  } catch (err) {
    console.error("[FCM] Expo Push API request failed:", err);
    return [];
  }
};

// ─── Firebase Admin SDK (optional fallback) ───────────────────────────────────
let firebaseInitialized = false;

const initFirebase = (): boolean => {
  if (firebaseInitialized) return true;
  if (!env.firebaseProjectId || !env.firebaseClientEmail || !env.firebasePrivateKey) {
    return false; // credentials not configured — silently skip
  }
  try {
    // Dynamic import to avoid crash when firebase-admin is not configured
    const admin = require("firebase-admin");
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: env.firebaseProjectId,
        clientEmail: env.firebaseClientEmail,
        privateKey: env.firebasePrivateKey,
      }),
    });
    firebaseInitialized = true;
    console.log("[FCM] Firebase Admin SDK initialized.");
    return true;
  } catch (e) {
    console.warn("[FCM] Firebase Admin SDK init failed:", e);
    return false;
  }
};

export type EmergencyPushPayload = {
  token: string;
  title: string;
  body: string;
  data: Record<string, string>;
};

/**
 * Unified send function.
 * - Expo push tokens → Expo Push API
 * - Raw FCM tokens   → Firebase Admin SDK (if configured)
 */
export const sendEmergencyPushEach = async (
  messages: EmergencyPushPayload[]
): Promise<{ successCount: number; failureCount: number }> => {
  if (messages.length === 0) {
    console.log("[FCM] No push messages to send (empty token list).");
    return { successCount: 0, failureCount: 0 };
  }

  console.log(`[FCM] Processing push for tokens: ${messages.map(m => m.token).join(", ")}`);

  // Split by token type
  const expoMessages = messages.filter((m) =>
    m.token.startsWith("ExponentPushToken")
  );
  const fcmMessages = messages.filter(
    (m) => !m.token.startsWith("ExponentPushToken")
  );

  let successCount = 0;
  let failureCount = 0;

  // --- Expo Push API ---
  if (expoMessages.length > 0) {
    const tickets = await sendExpoPushNotifications(
      expoMessages.map((m) => ({
        to: m.token,
        title: m.title,
        body: m.body,
        data: { ...m.data, isEmergency: "true" },
        sound: "default",
        priority: "high",
        channelId: "emergency-alerts",
      }))
    );
    successCount += tickets.filter((t) => t.status === "ok").length;
    failureCount += tickets.filter((t) => t.status === "error").length;
  }

  // --- Firebase Admin SDK (raw FCM tokens) ---
  if (fcmMessages.length > 0 && initFirebase()) {
    try {
      const admin = require("firebase-admin");
      const batch = fcmMessages.map((m) => ({
        token: m.token,
        notification: { title: m.title, body: m.body },
        data: m.data,
        android: { priority: "high" as const },
        apns: { payload: { aps: { sound: "default" } } },
      }));
      const result = await admin.messaging().sendEach(batch);
      successCount += result.successCount;
      failureCount += result.failureCount;
    } catch (e) {
      console.error("[FCM] Firebase Admin sendEach failed:", e);
      failureCount += fcmMessages.length;
    }
  }

  return { successCount, failureCount };
};

// Kept for backward compatibility with old code that imports sendEmergencyPush
export const sendEmergencyPush = async (params: {
  tokens: string[];
  title: string;
  body: string;
  data: Record<string, string>;
}): Promise<{ successCount: number; failureCount: number }> => {
  const messages: EmergencyPushPayload[] = params.tokens.map((token) => ({
    token,
    title: params.title,
    body: params.body,
    data: params.data,
  }));
  return sendEmergencyPushEach(messages);
};
