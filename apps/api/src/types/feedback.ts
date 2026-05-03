export type FeedbackType = "feedback" | "complaint";

export type ReplierRole = "user" | "hospital" | "organization";

export type FeedbackTargetType = "hospital" | "organization";

export type ComplaintCategory =
  | "technical"
  | "service"
  | "donation"
  | "staff"
  | "emergency"
  | "other";

export type FeedbackCategory =
  | "suggestion"
  | "compliment"
  | "general"
  | "feature_request";

export type ComplaintStatus = "pending" | "in_progress" | "resolved" | "rejected";

export type ComplaintPriority = "low" | "medium" | "high" | "critical";

export interface FeedbackReply {
  id: string;
  replierUsername: string;
  replierName: string;
  replierRole: ReplierRole;
  content: string;
  createdAt: string;
}

export interface FeedbackItem {
  id: string;
  username: string;
  userName: string;
  userRole: ReplierRole;
  targetType: FeedbackTargetType;
  targetId: string;
  targetName: string;
  type: FeedbackType;
  title: string;
  description: string;
  /** Holds a FeedbackCategory or a ComplaintCategory depending on `type`. */
  category?: FeedbackCategory | ComplaintCategory;
  attachments?: string[];
  status?: ComplaintStatus;
  priority?: ComplaintPriority;
  assignToUsername?: string;
  rating?: number;
  resolutionFeedback?: string;
  isAnonymous: boolean;
  createdAt: string;
  replies: FeedbackReply[];
}

export type CreateFeedbackInput = Pick<
  FeedbackItem,
  | "username"
  | "userName"
  | "userRole"
  | "targetType"
  | "targetId"
  | "targetName"
  | "type"
  | "title"
  | "description"
  | "category"
  | "priority"
  | "status"
  | "attachments"
  | "isAnonymous"
> & {
  // Rating only applies to feedback, not complaints.
  rating?: number;
};

export type UpdateFeedbackInput = Pick<
  FeedbackItem,
  "type" | "title" | "description" | "category" | "attachments"
>;

export type UpdateComplaintInput = Partial<
  Pick<
    FeedbackItem,
    "status" | "priority" | "assignToUsername" | "rating" | "resolutionFeedback"
  >
>;

export type CreateReplyInput = Pick<
  FeedbackReply,
  "replierUsername" | "replierName" | "replierRole" | "content"
>;

export type UpdateReplyInput = Pick<FeedbackReply, "content">;
