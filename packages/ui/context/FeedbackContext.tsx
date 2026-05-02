import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Platform } from "react-native";
import { getAccessToken } from "@/apps/mobile/src/lib/session";

import {
  type FeedbackItem,
  type FeedbackReply,
  type FeedbackTargetType,
  type FeedbackType,
  type ReplierRole,
  type FeedbackCategory,
  type ComplaintCategory,
  type ComplaintStatus,
  type ComplaintPriority,
} from "@/packages/ui/constants/mockFeedback";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type FileAttachment = {
  uri: string;
  name: string;
  type: string;
  size: number;
};

type FeedbackSubmit = {
  type: FeedbackType;
  title: string;
  description: string;
  category?: FeedbackCategory | ComplaintCategory;
  priority?: ComplaintPriority;
  status?: ComplaintStatus;
  attachments?: FileAttachment[];
  rating?: number;
  isAnonymous: boolean;
};

type CreateFeedbackPayload = FeedbackSubmit & {
  username: string;
  userName: string;
  userRole: ReplierRole;
  targetType: FeedbackTargetType;
  targetId: string;
  targetName: string;
};

type ComplaintUpdate = Partial<{
  status: ComplaintStatus;
  priority: ComplaintPriority;
  assignToUsername: string;
  rating: number;
  resolutionFeedback: string;
}>;

type AnalyticsSummary = {
  totalComplaints: number;
  complaintsByCategory: Record<string, number>;
  complaintsByStatus: Record<string, number>;
  totalFeedbacks: number;
  averageFeedbackRating: number;
  feedbackRatingDistribution: Record<number, number>;
};

export type FeedbackContextValue = {
  feedbacks: FeedbackItem[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addFeedback: (data: CreateFeedbackPayload) => Promise<void>;
  updateFeedback: (
    feedbackId: string,
    data: Partial<FeedbackSubmit> & Pick<FeedbackSubmit, "type" | "title" | "description">,
  ) => Promise<void>;
  updateComplaint: (feedbackId: string, data: ComplaintUpdate) => Promise<void>;
  deleteFeedback: (feedbackId: string) => Promise<void>;
  addReply: (
    feedbackId: string,
    reply: Omit<FeedbackReply, "id" | "createdAt">,
  ) => Promise<void>;
  updateReply: (feedbackId: string, replyId: string, content: string) => Promise<void>;
  deleteReply: (feedbackId: string, replyId: string) => Promise<void>;
  getAnalytics: () => Promise<AnalyticsSummary>;
  resetMockData: () => Promise<void>;
};

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

// ---------------------------------------------------------------------------
// API client
// ---------------------------------------------------------------------------
function getApiBaseUrl(): string {
  const env = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (typeof env === "string" && env.trim().length > 0) {
    return env.replace(/\/$/, "");
  }
  // Safe defaults for development. Android emulator must NOT use localhost.
  return Platform.OS === "android"
    ? "http://10.0.2.2:5000/api"
    : "http://127.0.0.1:5000/api";
}

const DEFAULT_TIMEOUT_MS = 15_000;
const UPLOAD_TIMEOUT_MS = 30_000;

/**
 * Single request helper. Handles URL building, abort-based timeout, JSON
 * parsing, error normalization, and consistent network-error messaging for
 * every request — JSON or multipart.
 */
async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<T> {
  const url = `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;

  const token = await getAccessToken();
  const headers = {
    ...init.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { ...init, headers, signal: controller.signal });
    const text = await res.text();

    let payload: unknown;
    if (text && text.trim()) {
      try {
        payload = JSON.parse(text);
      } catch (parseError) {
        throw new Error(
          `Invalid JSON response from server: ${text.slice(0, 100)}`,
        );
      }
    }

    if (!res.ok) {
      const message =
        (payload as { error?: unknown, message?: string } | undefined)?.message ??
        (payload as { error?: unknown } | undefined)?.error ??
        `Request failed with status ${res.status}`;
      throw new Error(String(message));
    }

    return payload as T;
  } catch (error) {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error(
        `Network error: cannot reach ${getApiBaseUrl()}. Is the API server running?`,
      );
    }
    if ((error as Error)?.name === "AbortError") {
      throw new Error(`Request timed out after ${timeoutMs}ms.`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

function jsonRequest<T>(path: string, method: string, body?: unknown): Promise<T> {
  return apiFetch<T>(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

function multipartRequest<T>(path: string, formData: FormData): Promise<T> {
  return apiFetch<T>(
    path,
    { method: "POST", body: formData as unknown as BodyInit },
    UPLOAD_TIMEOUT_MS,
  );
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
function assertCreatePayload(data: CreateFeedbackPayload): void {
  const required: (keyof CreateFeedbackPayload)[] = [
    "username",
    "userName",
    "userRole",
    "type",
    "title",
    "description",
    "targetType",
    "targetId",
    "targetName",
  ];
  for (const field of required) {
    if (!data[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
  if (typeof data.isAnonymous !== "boolean") {
    throw new Error("isAnonymous must be a boolean");
  }
  if (data.type === "feedback") {
    if (
      typeof data.rating !== "number" ||
      data.rating < 1 ||
      data.rating > 5
    ) {
      throw new Error("Rating is required for feedback (1-5)");
    }
  }
}

/** Build the JSON payload sent to the API. */
function buildCreatePayload(data: CreateFeedbackPayload): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    username: data.username,
    userName: data.userName,
    userRole: data.userRole,
    type: data.type,
    title: data.title,
    description: data.description,
    targetType: data.targetType,
    targetId: data.targetId,
    targetName: data.targetName,
    isAnonymous: data.isAnonymous,
  };

  if (data.category) payload.category = data.category;

  if (data.type === "feedback") {
    payload.rating = data.rating;
  } else {
    // complaint
    payload.priority = data.priority ?? "medium";
  }

  return payload;
}

/** Append a primitive payload object to FormData (booleans stringified). */
function appendPayloadToFormData(
  formData: FormData,
  payload: Record<string, unknown>,
): void {
  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined || value === null) continue;
    formData.append(key, typeof value === "boolean" ? String(value) : String(value));
  }
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{ data: FeedbackItem[] }>("/feedback");
      setFeedbacks(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load feedback.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /**
   * Wraps a mutation: clears error, executes, refreshes the list, surfaces
   * the error message to consumers, and rethrows so callers can react.
   */
  const runMutation = useCallback(
    async (label: string, action: () => Promise<unknown>): Promise<void> => {
      setError(null);
      try {
        await action();
        await refresh();
      } catch (e) {
        const message = e instanceof Error ? e.message : `Failed to ${label}.`;
        setError(message);
        throw e;
      }
    },
    [refresh],
  );

  const addFeedback = useCallback(
    (data: CreateFeedbackPayload) =>
      runMutation("submit feedback", async () => {
        assertCreatePayload(data);
        const payload = buildCreatePayload(data);

        if (data.attachments && data.attachments.length > 0) {
          const formData = new FormData();
          appendPayloadToFormData(formData, payload);
          for (const file of data.attachments) {
            // RN's FormData accepts the { uri, type, name } shape natively.
            formData.append("attachments", {
              uri: file.uri,
              type: file.type,
              name: file.name,
            } as unknown as Blob);
          }
          await multipartRequest<{ data: FeedbackItem }>("/feedback", formData);
        } else {
          await jsonRequest<{ data: FeedbackItem }>("/feedback", "POST", payload);
        }
      }),
    [runMutation],
  );

  const updateFeedback = useCallback(
    (
      feedbackId: string,
      data: Partial<FeedbackSubmit> &
        Pick<FeedbackSubmit, "type" | "title" | "description">,
    ) =>
      runMutation("update feedback", async () => {
        await jsonRequest<{ data: FeedbackItem }>(
          `/feedback/${feedbackId}`,
          "PUT",
          {
            type: data.type,
            title: data.title,
            description: data.description,
            category: data.category,
          },
        );
      }),
    [runMutation],
  );

  const deleteFeedback = useCallback(
    (feedbackId: string) =>
      runMutation("delete feedback", () =>
        jsonRequest<unknown>(`/feedback/${feedbackId}`, "DELETE"),
      ),
    [runMutation],
  );

  const addReply = useCallback(
    (feedbackId: string, reply: Omit<FeedbackReply, "id" | "createdAt">) =>
      runMutation("add reply", async () => {
        if (
          !reply.replierUsername ||
          !reply.replierName ||
          !reply.replierRole ||
          !reply.content
        ) {
          throw new Error(
            "Missing required fields: replierUsername, replierName, replierRole, content",
          );
        }
        await jsonRequest<{ data: FeedbackReply }>(
          `/feedback/${feedbackId}/replies`,
          "POST",
          reply,
        );
      }),
    [runMutation],
  );

  const updateReply = useCallback(
    (feedbackId: string, replyId: string, content: string) =>
      runMutation("update reply", async () => {
        if (!content || !content.trim()) {
          throw new Error("Reply content cannot be empty.");
        }
        await jsonRequest<{ data: FeedbackReply }>(
          `/feedback/${feedbackId}/replies/${replyId}`,
          "PUT",
          { content },
        );
      }),
    [runMutation],
  );

  const deleteReply = useCallback(
    (feedbackId: string, replyId: string) =>
      runMutation("delete reply", () =>
        jsonRequest<unknown>(
          `/feedback/${feedbackId}/replies/${replyId}`,
          "DELETE",
        ),
      ),
    [runMutation],
  );

  const updateComplaint = useCallback(
    (feedbackId: string, data: ComplaintUpdate) =>
      runMutation("update complaint", () =>
        jsonRequest<{ data: FeedbackItem }>(
          `/feedback/${feedbackId}/complaint`,
          "PUT",
          data,
        ),
      ),
    [runMutation],
  );

  const getAnalytics = useCallback(
    () => apiFetch<AnalyticsSummary>("/analytics"),
    [],
  );

  // Phase 2: behave the same as a refresh. Real "reset" semantics will need
  // a dedicated endpoint once we move to a database.
  const resetMockData = useCallback(() => refresh(), [refresh]);

  const value = useMemo<FeedbackContextValue>(
    () => ({
      feedbacks,
      isLoading,
      error,
      refresh,
      addFeedback,
      updateFeedback,
      updateComplaint,
      deleteFeedback,
      addReply,
      updateReply,
      deleteReply,
      getAnalytics,
      resetMockData,
    }),
    [
      feedbacks,
      isLoading,
      error,
      refresh,
      addFeedback,
      updateFeedback,
      updateComplaint,
      deleteFeedback,
      addReply,
      updateReply,
      deleteReply,
      getAnalytics,
      resetMockData,
    ],
  );

  return (
    <FeedbackContext.Provider value={value}>{children}</FeedbackContext.Provider>
  );
}

export function useFeedback(): FeedbackContextValue {
  const ctx = useContext(FeedbackContext);
  if (!ctx) {
    throw new Error("useFeedback must be used within a FeedbackProvider.");
  }
  return ctx;
}
