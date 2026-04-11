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

import {
  type FeedbackItem,
  type FeedbackReply,
  type FeedbackTargetType,
  type FeedbackType,
  type ReplierRole,
  type FeedbackCategory,
  type ComplaintStatus,
  type ComplaintPriority,
} from "@/packages/ui/constants/mockFeedback";

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
  category?: FeedbackCategory;
  priority?: ComplaintPriority;
  attachments?: FileAttachment[];
  rating?: number;
  isAnonymous: boolean;
};

type CreateFeedbackPayload = FeedbackSubmit & {
  userId: string;
  userName: string;
  userRole: ReplierRole;
  targetType: FeedbackTargetType;
  targetId: string;
  targetName: string;
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
  updateComplaint: (
    feedbackId: string,
    data: Partial<{
      status: ComplaintStatus;
      priority: ComplaintPriority;
      assignToId?: string;
      rating?: number;
      resolutionFeedback?: string;
    }>,
  ) => Promise<void>;
  deleteFeedback: (feedbackId: string) => Promise<void>;
  addReply: (
    feedbackId: string,
    reply: Omit<FeedbackReply, "id" | "createdAt">,
  ) => Promise<void>;
  updateReply: (feedbackId: string, replyId: string, content: string) => Promise<void>;
  deleteReply: (feedbackId: string, replyId: string) => Promise<void>;
  getAnalytics: () => Promise<{
    totalComplaints: number;
    complaintsByCategory: Record<string, number>;
    complaintsByStatus: Record<string, number>;
  }>;
  resetMockData: () => Promise<void>;
};

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

function getApiBaseUrl() {
  const env = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (typeof env === "string" && env.trim().length > 0) return env.replace(/\/$/, "");
  // Safe defaults for development:
  // - Android emulator must NOT use localhost.
  // - iOS simulator / web can use localhost.
  return Platform.OS === "android" ? "http://10.0.2.2:4000" : "http://127.0.0.1:4000";
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    const url = `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
    
    // Create abort controller for timeout (15 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    try {
      const res = await fetch(url, {
        ...init,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          ...(init?.headers ?? {}),
        },
      });

      clearTimeout(timeoutId);

      const text = await res.text();
      
      let payload: unknown;
      if (text && text.trim()) {
        try {
          payload = JSON.parse(text);
        } catch (parseError) {
          console.error("JSON parse error:", parseError, "Response text:", text);
          throw new Error(`Invalid JSON response from server: ${text.substring(0, 100)}`);
        }
      } else {
        payload = undefined;
      }

      if (!res.ok) {
        const msg =
          (payload as { error?: unknown } | undefined)?.error ??
          `Request failed with status ${res.status}`;
        throw new Error(String(msg));
      }

      return payload as T;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        throw new Error(`Network error: Cannot reach ${getApiBaseUrl()}. Please check if the API server is running.`);
      }
      throw error;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("Request failed:", message);
    throw error;
  }
}

async function requestFormData<T>(path: string, formData: FormData): Promise<T> {
  try {
    const url = `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
    
    // Create abort controller for timeout (30 seconds for file uploads)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    try {
      const res = await fetch(url, {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const text = await res.text();
      
      let payload: unknown;
      if (text && text.trim()) {
        try {
          payload = JSON.parse(text);
        } catch (parseError) {
          console.error("JSON parse error:", parseError, "Response text:", text);
          throw new Error(`Invalid JSON response from server: ${text.substring(0, 100)}`);
        }
      } else {
        payload = undefined;
      }

      if (!res.ok) {
        const msg =
          (payload as { error?: unknown } | undefined)?.error ??
          `Request failed with status ${res.status}`;
        throw new Error(String(msg));
      }

      return payload as T;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        throw new Error(`Network error: Cannot reach ${getApiBaseUrl()}. Please check if the API server is running.`);
      }
      throw error;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("Request failed:", message);
    throw error;
  }
}

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await requestJson<{ data: FeedbackItem[] }>("/feedback");
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

  const addFeedback = useCallback(
    async (data: CreateFeedbackPayload) => {
      setError(null);
      try {
        // Validate all required fields
        if (!data.userId || !data.userName || !data.userRole || !data.type || !data.title || !data.description || !data.targetType || !data.targetId || !data.targetName || typeof data.isAnonymous !== "boolean") {
          throw new Error("Missing required fields: userId, userName, userRole, type, title, description, targetType, targetId, targetName, and isAnonymous are required");
        }
        
        // Validate rating for feedback type
        if (data.type === "feedback" && (typeof data.rating !== "number" || data.rating < 1 || data.rating > 5)) {
          throw new Error("Rating is required for feedback and must be between 1 and 5");
        }
        
        // Build payload with all required and optional fields
        const payload: any = {
          userId: data.userId,
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
        
        // Add optional fields based on type
        if (data.category) {
          payload.category = data.category;
        }
        if (data.type === "feedback" && data.rating !== undefined) {
          payload.rating = data.rating;
        }
        
        // Add priority field (required for complaints, optional for feedback)
        if (data.type === "complaint") {
          payload.priority = data.priority || "medium";
        } else if (data.priority) {
          payload.priority = data.priority;
        }
        
        console.log("Submitting payload:", payload);
        
        // If there are file attachments, use FormData
        if (data.attachments && data.attachments.length > 0) {
          const formData = new FormData();
          
          // Append all required fields to FormData
          Object.entries(payload).forEach(([key, value]) => {
            formData.append(key, String(value));
          });

          // Add files to FormData
          // In React Native, we can pass the file object with uri directly
          data.attachments.forEach((file) => {
            formData.append("attachments", {
              uri: file.uri,
              type: file.type,
              name: file.name,
            } as any);
          });

          await requestFormData<{ data: FeedbackItem }>("/feedback", formData);
        } else {
          // Use regular JSON for submissions without files
          await requestJson<{ data: FeedbackItem }>("/feedback", {
            method: "POST",
            body: JSON.stringify(payload),
          });
        }
        await refresh();
      } catch (e) {
        const errorMsg = e instanceof Error ? e.message : "Failed to submit feedback";
        setError(errorMsg);
        throw e;
      }
    },
    [refresh],
  );

  const updateFeedback = useCallback(
    async (
      feedbackId: string,
      data: Partial<FeedbackSubmit> &
        Pick<FeedbackSubmit, "type" | "title" | "description">,
    ) => {
      setError(null);
      try {
        await requestJson<{ data: FeedbackItem }>(`/feedback/${feedbackId}`, {
          method: "PUT",
          body: JSON.stringify({
            type: data.type,
            title: data.title,
            description: data.description,
          }),
        });
        await refresh();
      } catch (e) {
        const errorMsg = e instanceof Error ? e.message : "Failed to update feedback";
        setError(errorMsg);
        throw e;
      }
    },
    [refresh],
  );

  const deleteFeedback = useCallback(
    async (feedbackId: string) => {
      setError(null);
      try {
        await requestJson<unknown>(`/feedback/${feedbackId}`, { method: "DELETE" });
        await refresh();
      } catch (e) {
        const errorMsg = e instanceof Error ? e.message : "Failed to delete feedback";
        setError(errorMsg);
        throw e;
      }
    },
    [refresh],
  );

  const addReply = useCallback(
    async (feedbackId: string, reply: Omit<FeedbackReply, "id" | "createdAt">) => {
      setError(null);
      try {
        // Validate required fields before sending
        if (!reply.replierId || !reply.replierName || !reply.replierRole || !reply.content) {
          throw new Error("Missing required fields: replierId, replierName, replierRole, and content are required");
        }
        await requestJson<{ data: FeedbackReply }>(`/feedback/${feedbackId}/replies`, {
          method: "POST",
          body: JSON.stringify(reply),
        });
        await refresh();
      } catch (e) {
        const errorMsg = e instanceof Error ? e.message : "Failed to add reply";
        setError(errorMsg);
        throw e;
      }
    },
    [refresh],
  );

  const updateReply = useCallback(
    async (feedbackId: string, replyId: string, content: string) => {
      setError(null);
      try {
        if (!content || content.trim().length === 0) {
          throw new Error("Reply content cannot be empty");
        }
        await requestJson<{ data: FeedbackReply }>(
          `/feedback/${feedbackId}/replies/${replyId}`,
          {
            method: "PUT",
            body: JSON.stringify({ content }),
          },
        );
        await refresh();
      } catch (e) {
        const errorMsg = e instanceof Error ? e.message : "Failed to update reply";
        setError(errorMsg);
        throw e;
      }
    },
    [refresh],
  );

  const deleteReply = useCallback(
    async (feedbackId: string, replyId: string) => {
      setError(null);
      try {
        await requestJson<unknown>(`/feedback/${feedbackId}/replies/${replyId}`, {
          method: "DELETE",
        });
        await refresh();
      } catch (e) {
        const errorMsg = e instanceof Error ? e.message : "Failed to delete reply";
        setError(errorMsg);
        throw e;
      }
    },
    [refresh],
  );

  const updateComplaint = useCallback(
    async (
      feedbackId: string,
      data: Partial<{
        status: ComplaintStatus;
        priority: ComplaintPriority;
        assignToId?: string;
        rating?: number;
        resolutionFeedback?: string;
      }>,
    ) => {
      setError(null);
      try {
        await requestJson<{ data: FeedbackItem }>(`/feedback/${feedbackId}/complaint`, {
          method: "PUT",
          body: JSON.stringify(data),
        });
        await refresh();
      } catch (e) {
        const errorMsg = e instanceof Error ? e.message : "Failed to update complaint";
        setError(errorMsg);
        throw e;
      }
    },
    [refresh],
  );

  const getAnalytics = useCallback(async () => {
    try {
      return await requestJson<{
        totalComplaints: number;
        complaintsByCategory: Record<string, number>;
        complaintsByStatus: Record<string, number>;
      }>("/analytics");
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : "Failed to fetch analytics";
      console.error("Analytics error:", errorMsg);
      throw e;
    }
  }, []);

  const resetMockData = useCallback(() => {
    // Phase 2: treat this as a simple refresh from backend seed data.
    return refresh();
  }, [refresh]);

  const value = useMemo(
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
