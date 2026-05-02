export type FeedbackType = "feedback" | "complaint";

export type ReplierRole = "user" | "organization" | "hospital";

export type ComplaintCategory = "technical" | "service" | "donation" | "staff" | "emergency" | "other";
export type FeedbackCategory = "suggestion" | "compliment" | "general" | "feature_request";
export type ComplaintStatus = "pending" | "in_progress" | "resolved" | "rejected";
export type ComplaintPriority = "low" | "medium" | "high" | "critical";

/** Who this feedback is addressed to (ownership / routing). */
export type FeedbackTargetType = "hospital" | "organization";

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

/** Demo targets (keep IDs aligned with hospital/org dashboards). */
export const EXAMPLE_HOSPITAL_TARGET = {
  targetType: "hospital" as const,
  targetId: "h1",
  targetName: "Colombo General Hospital",
};

export const EXAMPLE_ORGANIZATION_TARGET = {
  targetType: "organization" as const,
  targetId: "o1",
  targetName: "Lions Club Blood Drive",
};

export const FEEDBACK_TARGET_PRESETS = [
  EXAMPLE_HOSPITAL_TARGET,
  EXAMPLE_ORGANIZATION_TARGET,
] as const;

/** Stable reference for form pickers (avoid new array each render). */
export const FEEDBACK_TARGET_OPTIONS = [
  EXAMPLE_HOSPITAL_TARGET,
  EXAMPLE_ORGANIZATION_TARGET,
];

export const mockFeedbacks: FeedbackItem[] = [
  {
    id: "f1",
    username: "u123",
    userName: "Savidu Jayaweeera",
    userRole: "user",
    ...EXAMPLE_HOSPITAL_TARGET,
    type: "feedback",
    title: "Great experience at the last camp",
    description:
      "The staff were friendly and the registration process was smooth. Parking guidance could be improved.",
    category: "suggestion",
    rating: 4,
    isAnonymous: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    replies: [
      {
        id: "r1",
        replierUsername: "h1",
        replierName: "Colombo General Hospital",
        replierRole: "hospital",
        content: "Thank you! We appreciate the suggestion about parking guidance.",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
      },
    ],
  },
  {
    id: "f2",
    username: "u456",
    userName: "Jane Doe",
    userRole: "user",
    ...EXAMPLE_ORGANIZATION_TARGET,
    type: "complaint",
    title: "Waiting time was too long",
    description:
      "I had to wait for more than 2 hours before my turn. It would be helpful to have better time slots.",
    isAnonymous: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    replies: [],
  },
];
