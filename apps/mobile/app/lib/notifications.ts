/**
 * Notification service for RedPulse
 *
 * Uses Expo Push Notifications (which uses FCM under the hood on Android).
 * Expo Push Tokens are registered with the backend so the server can send
 * targeted FCM alerts for emergency blood requests.
 */
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import Constants from "expo-constants";
import { requestJson } from "./api";

// ─── Configure how notifications look when app is in foreground ──────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ─── Request permissions and get the Expo Push Token ─────────────────────────
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  // Push notifications only work on physical devices, unless we are in development
  if (!Device.isDevice && !__DEV__) {
    console.warn("[Notifications] Push notifications require a physical device.");
    return null;
  }

  // Check/request permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.warn("[Notifications] Push notification permission not granted.");
    return null;
  }

  // Set Android notification channel
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("emergency-alerts", {
      name: "Emergency Blood Alerts",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#DC2626",
    });

    await Notifications.setNotificationChannelAsync("general", {
      name: "General Notifications",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  // Get the Expo push token (acts as FCM token proxy)
  try {
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    if (!projectId) {
      // Silently skip if there's no project ID to avoid spamming the console with warnings
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    return tokenData.data;
  } catch (e) {
    console.log("[Notifications] Push token generation skipped (Local/Dev Mode).");
    return null;
  }
}

// ─── Register the token with the backend ─────────────────────────────────────
export async function registerDeviceTokenWithBackend(token: string): Promise<void> {
  try {
    await requestJson("/auth/device-token", {
      method: "POST",
      body: JSON.stringify({
        pushToken: token,
        platform: Platform.OS === "ios" ? "ios" : "android",
      }),
      auth: true,
    });
    console.log("[Notifications] Device token registered with backend.");
  } catch (e) {
    console.error("[Notifications] Failed to register device token:", e);
  }
}

// ─── Add a notification received listener ────────────────────────────────────
export function addNotificationReceivedListener(
  handler: (notification: Notifications.Notification) => void
) {
  return Notifications.addNotificationReceivedListener(handler);
}

// ─── Add a notification response listener (user tapped notification) ─────────
export function addNotificationResponseReceivedListener(
  handler: (response: Notifications.NotificationResponse) => void
) {
  return Notifications.addNotificationResponseReceivedListener(handler);
}

// ─── Get last notification response (app opened from notification) ────────────
export function getLastNotificationResponse() {
  return Notifications.getLastNotificationResponseAsync();
}
// ─── Trigger a local test notification ────────────────────────────────────────
export async function scheduleTestNotification(): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "RedPulse Test Alert 🩸",
      body: "This is a test notification to verify that the notification system is working on your device.",
      data: { type: "TEST" },
    },
    trigger: null, // trigger immediately
  });
}

export default function Ignore() { return null; }
