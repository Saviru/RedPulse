import Constants from "expo-constants";
import { Platform } from "react-native";

import { getAccessToken } from "./session";

const API_PORT = "5000";

/**
 * Metro / Expo Go expose the dev machine as host:port (e.g. 192.168.1.10:8081).
 * Using that host for the API fixes "Failed to fetch" on physical devices.
 */
const getDevMachineHost = (): string | null => {
  const dbg =
    Constants.expoGoConfig?.debuggerHost ??
    (Constants.manifest as { debuggerHost?: string } | null)?.debuggerHost ??
    null;
  if (typeof dbg === "string" && dbg.includes(":")) {
    return dbg.split(":")[0] ?? null;
  }
  if (typeof dbg === "string" && dbg.length > 0) return dbg;
  return null;
};

const getDefaultBaseUrl = (): string => {
  const explicit = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");

  const hostOverride = process.env.EXPO_PUBLIC_API_HOST?.trim();
  if (hostOverride) {
    return `http://${hostOverride}:${API_PORT}/api`;
  }

  const lan = getDevMachineHost();
  if (lan) {
    return `http://${lan}:${API_PORT}/api`;
  }

  if (Platform.OS === "android") {
    return `http://10.0.2.2:${API_PORT}/api`;
  }

  if (Platform.OS === "web") {
    return `http://localhost:${API_PORT}/api`;
  }

  return `http://localhost:${API_PORT}/api`;
};

export const API_BASE_URL = getDefaultBaseUrl();

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export type RequestJsonInit = RequestInit & { auth?: boolean };

export const requestJson = async <T>(path: string, init?: RequestJsonInit): Promise<T> => {
  const url = `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const method = init?.method || "GET";

  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  if (init?.headers) {
    Object.entries(init.headers).forEach(([k, v]) => headers.set(k, String(v)));
  }

  if (init?.auth) {
    const token = await getAccessToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
      console.log(`API [Auth]: Token attached to ${path} (len: ${token.length})`);
    } else {
      console.warn(`API [Auth Warning]: No token found for authenticated request to ${url}`);
    }
  }

  console.log(`API [Request]: ${method} ${url}`);

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      method,
      headers,
    });
  } catch (cause) {
    const hint =
      Platform.OS === "web"
        ? " If the API runs on another origin, enable CORS on the server."
        : " On a real phone, ensure EXPO_PUBLIC_API_HOST or EXPO_PUBLIC_API_BASE_URL points to your PC IP and the phone is on the same Wi‑Fi.";
    const msg =
      cause instanceof Error ? cause.message : "Network request failed";
    
    console.warn(`API [Connection Error]: ${method} ${url} - ${msg}`);
    
    throw new ApiError(
      `${msg} (${url}).${hint} Current base: ${API_BASE_URL}`,
      0,
      cause
    );
  }

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      (typeof payload === "object" &&
      payload !== null &&
      "message" in (payload as Record<string, unknown>)
        ? String((payload as Record<string, unknown>).message)
        : null) || `Request failed with status ${response.status}`;
    
    console.warn(`API [Error]: ${method} ${url} - Status ${response.status}`);
    if (payload) console.warn(`API [Error Data]:`, JSON.stringify(payload));
    
    throw new ApiError(message, response.status, payload);
  }

  console.log(`API [Success]: ${method} ${url} - Status ${response.status}`);
  
  // Automatically unwrap the standard backend envelope { success: true, data: T, message: string }
  if (payload && typeof payload === 'object' && 'data' in payload && (payload as any).success === true) {
    return (payload as any).data as T;
  }
  
  return payload as T;
};

export default function Ignore() { return null; }
