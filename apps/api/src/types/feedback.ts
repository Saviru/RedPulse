export type FeedbackType = "feedback" | "complaint";

export type ReplierRole = "user" | "hospital" | "organization";

export type FeedbackTargetType = "hospital" | "organization";

export type ComplaintCategory = "technical" | "service" | "donation" | "staff" | "emergency" | "other";

export type FeedbackCategory = "suggestion" | "compliment" | "general" | "feature_request";

export type ComplaintStatus = "pending" | "in_progress" | "resolved" | "rejected";

export type ComplaintPriority = "low" | "medium" | "high" | "critical";

export interface FeedbackReply {
  id: string;
  replierId: string;
  replierName: string;
  replierRole: ReplierRole;
  content: string;
  createdAt: string;
}

export interface FeedbackItem {
  id: string;
  userId: string;
  userName: string;
  userRole: ReplierRole;
  targetType: FeedbackTargetType;
  targetId: string;
  targetName: string;
  type: FeedbackType;
  title: string;
  description: string;
  category?: FeedbackCategory;
  attachments?: string[];
  status?: ComplaintStatus;
  priority?: ComplaintPriority;
  assignToId?: string;
  rating?: number;
  resolutionFeedback?: string;
  isAnonymous: boolean;
  createdAt: string;
  replies: FeedbackReply[];
}

export type CreateFeedbackInput = Pick<
  FeedbackItem,
  | "userId"
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
  // Rating only applies to feedback, not complaints
  rating?: number;
};

export type UpdateFeedbackInput = Pick<
  FeedbackItem,
  "type" | "title" | "description" | "category" | "attachments"
>;

export type UpdateComplaintInput = Partial<Pick<
  FeedbackItem,
  "status" | "priority" | "assignToId" | "rating" | "resolutionFeedback"
>>;

export type CreateReplyInput = Pick<
  FeedbackReply,
  "replierId" | "replierName" | "replierRole" | "content"
>;

export type UpdateReplyInput = Pick<FeedbackReply, "content">;

