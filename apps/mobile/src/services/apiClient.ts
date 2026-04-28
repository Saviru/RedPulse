import { API_BASE_URL } from "@/apps/mobile/src/constants/api";

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
  details?: unknown;
};

type AuthHeaders = {
  id: string;
  role: "ORGANIZATION" | "HOSPITAL" | "USER";
};

export class ApiClientError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.details = details;
  }
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  auth?: AuthHeaders,
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (auth) {
    if (!auth.id) {
      throw new ApiClientError(
        `Missing auth id for role ${auth.role}. Set EXPO_PUBLIC_${auth.role}_ID in root .env`,
        0,
      );
    }
    headers.set("x-user-id", auth.id);
    headers.set("x-role", auth.role);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  let payload: ApiEnvelope<T> | null = null;
  try {
    payload = (await response.json()) as ApiEnvelope<T>;
  } catch {
    payload = null;
  }

  if (!response.ok || !payload?.success) {
    throw new ApiClientError(
      payload?.message ?? "API request failed",
      response.status,
      payload?.details,
    );
  }

  return payload.data;
}

export function getApiErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Unexpected error";
}
