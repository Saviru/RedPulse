import React from "react";
import { View, StyleSheet, TouchableOpacity, Linking, Image, Platform } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import { Card } from "./Card";
import { Divider } from "./Divider";
import { Button } from "./Button";
import { Badge } from "./Badge";
import { Typo } from "./Typo";
import { useThemeColor } from "@/packages/ui/hooks/useThemeColor";
import {
  type FeedbackItem,
  type FeedbackReply,
  type FeedbackType,
  type ReplierRole,
  type ComplaintStatus,
  type ComplaintPriority,
} from "@/packages/ui/constants/mockFeedback";

export interface FeedbackCardProps {
  feedback: FeedbackItem;
  currentUserRole: ReplierRole;
  onEditFeedback?: (feedback: FeedbackItem) => void;
  onDeleteFeedback?: (feedbackId: string) => void;
  onAddReply?: (feedbackId: string) => void;
  onEditReply?: (feedbackId: string, reply: FeedbackReply) => void;
  onDeleteReply?: (feedbackId: string, replyId: string) => void;
  onRateResolution?: (feedbackId: string, rating: number, feedback: string) => void;
  onRejectComplaint?: (feedbackId: string) => void;
  onApproveComplaint?: (feedbackId: string) => void;
}

const toFeedbackLabel = (type: FeedbackType) =>
  type === "complaint" ? "Complaint" : "Feedback";

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const getStatusBadgeVariant = (status: ComplaintStatus) => {
  switch (status) {
    case "pending":
      return "warning";
    case "in_progress":
      return "info";
    case "resolved":
      return "success";
    case "rejected":
      return "danger";
    default:
      return "default";
  }
};

const getPriorityBadgeVariant = (priority: ComplaintPriority) => {
  switch (priority) {
    case "low":
      return "success";
    case "medium":
      return "warning";
    case "high":
      return "danger";
    case "critical":
      return "danger";
    default:
      return "default";
  }
};

const renderStars = (rating: number, colors: any) => {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <MaterialIcons
          key={star}
          name={star <= rating ? "star" : "star-border"}
          size={16}
          color={star <= rating ? colors.tint : colors.textMuted}
        />
      ))}
      <Typo variant="caption" style={{ color: colors.textMuted, marginLeft: 4 }}>
        {rating}/5
      </Typo>
    </View>
  );
};

const renderAttachment = (attachment: string, index: number, colors: any) => {
  const isPdf = attachment.toLowerCase().endsWith(".pdf");
  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(attachment);

  const getApiBaseUrl = () => {
    const env = process.env.EXPO_PUBLIC_API_BASE_URL;
    if (typeof env === "string" && env.trim().length > 0) return env.replace(/\/$/, "");
    return Platform.OS === "android" ? "http://10.0.2.2:4000" : "http://127.0.0.1:4000";
  };

  const handleOpen = async () => {
    try {
      const url = attachment.startsWith("http") 
        ? attachment 
        : `${getApiBaseUrl()}${attachment}`;
      await Linking.openURL(url);
    } catch (error) {
      alert("Could not open file: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

  const getImageUri = () => {
    if (attachment.startsWith("http")) return attachment;
    return `${getApiBaseUrl()}${attachment}`;
  };

  return (
    <TouchableOpacity
      key={index}
      onPress={handleOpen}
      style={{
        marginRight: 8,
        marginBottom: 8,
        alignItems: "center",
      }}
    >
      {isImage ? (
        <View>
          <Image
            source={{ uri: getImageUri() }}
            style={{
              width: 80,
              height: 80,
              borderRadius: 8,
              marginBottom: 4,
              backgroundColor: colors.border,
            }}
          />
          <Typo variant="caption" style={{ color: colors.tint, textAlign: "center", fontSize: 10 }}>
            Tap to view
          </Typo>
        </View>
      ) : isPdf ? (
        <View style={{ alignItems: "center" }}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 8,
              backgroundColor: colors.border,
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 4,
            }}
          >
            <MaterialIcons name="picture-as-pdf" size={40} color={colors.tint} />
          </View>
          <Typo variant="caption" style={{ color: colors.tint, textAlign: "center", fontSize: 10 }}>
            Tap to open PDF
          </Typo>
        </View>
      ) : (
        <View style={{ alignItems: "center" }}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 8,
              backgroundColor: colors.border,
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 4,
            }}
          >
            <MaterialIcons name="attachment" size={40} color={colors.tint} />
          </View>
          <Typo variant="caption" style={{ color: colors.tint, textAlign: "center", fontSize: 10 }}>
            Tap to download
          </Typo>
        </View>
      )}
    </TouchableOpacity>
  );
};

export const FeedbackCard: React.FC<FeedbackCardProps> = ({
  feedback,
  currentUserRole,
  onEditFeedback,
  onDeleteFeedback,
  onAddReply,
  onEditReply,
  onDeleteReply,
  onRateResolution,
  onRejectComplaint,
  onApproveComplaint,
}) => {
  const { colors } = useThemeColor();

  // Defensive defaults in case backend returns partial objects
  const safeFeedback = {
    ...feedback,
    userName: feedback.userName || "Unknown",
    createdAt: feedback.createdAt || new Date().toISOString(),
    replies: Array.isArray(feedback.replies) ? feedback.replies : [],
    attachments: Array.isArray(feedback.attachments) ? feedback.attachments : [],
  };

  const isUser = currentUserRole === "user";
  const canActAsTarget =
    !isUser &&
    (currentUserRole === "hospital" || currentUserRole === "organization") &&
    currentUserRole === safeFeedback.targetType;

  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Typo variant="h2" style={styles.title}>
            {safeFeedback.title}
          </Typo>
          <Typo variant="caption" style={{ color: colors.textMuted, marginBottom: 8 }}>
            {safeFeedback.isAnonymous ? "Anonymous" : safeFeedback.userName} • {toFeedbackLabel(safeFeedback.type)} • To:{" "}
            {safeFeedback.targetName} • {formatDate(safeFeedback.createdAt)}
          </Typo>
          
          {/* Badges row */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
            {safeFeedback.category && (
              <Badge 
                label={safeFeedback.category.charAt(0).toUpperCase() + safeFeedback.category.slice(1).replace('_', ' ')}
                variant="info"
              />
            )}
            {safeFeedback.type === "complaint" && safeFeedback.status && (
              <Badge 
                label={`Status: ${safeFeedback.status}`}
                variant={getStatusBadgeVariant(safeFeedback.status as any)}
              />
            )}
            {safeFeedback.type === "complaint" && safeFeedback.priority && (
              <Badge 
                label={`Priority: ${safeFeedback.priority}`}
                variant={getPriorityBadgeVariant(safeFeedback.priority as any)}
              />
            )}
          </View>
        </View>

        {isUser && (onEditFeedback || onDeleteFeedback) && (
          <View style={styles.iconActions}>
            {onEditFeedback && (
              <MaterialIcons
                name="edit"
                size={20}
                color={colors.tint}
                style={styles.iconButton}
                onPress={() => onEditFeedback(safeFeedback)}
              />
            )}
            {onDeleteFeedback && (
              <MaterialIcons
                name="delete"
                size={20}
                color={colors.error}
                style={styles.iconButton}
                onPress={() => onDeleteFeedback(safeFeedback.id)}
              />
            )}
          </View>
        )}
      </View>

      <Typo variant="body" style={styles.description}>
        {safeFeedback.description}
      </Typo>

      {safeFeedback.type === "feedback" && safeFeedback.rating ? (
        <View style={{ marginTop: 8 }}>
          {renderStars(safeFeedback.rating, colors)}
        </View>
      ) : null}

      {safeFeedback.attachments && safeFeedback.attachments.length > 0 && (
        <View style={{ marginTop: 12 }}>
          <Typo variant="caption" style={{ color: colors.textMuted, marginBottom: 8, fontWeight: "600" }}>
            📎 Attachments ({safeFeedback.attachments.length})
          </Typo>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {safeFeedback.attachments.map((attachment, index) => renderAttachment(attachment, index, colors))}
          </View>
        </View>
      )}

      {safeFeedback.type === "complaint" && safeFeedback.status === "resolved" && (
        <View style={{ marginTop: 12, backgroundColor: colors.success + "15", padding: 12, borderRadius: 8 }}>
          <Typo variant="caption" style={{ color: colors.success, fontWeight: "600", marginBottom: 4 }}>
            ✓ Resolved
          </Typo>
          {safeFeedback.resolutionFeedback && (
            <Typo variant="caption" style={{ color: colors.text }}>
              {safeFeedback.resolutionFeedback}
            </Typo>
          )}
        </View>
      )}

      {safeFeedback.replies.length > 0 && (
        <View style={styles.repliesWrap}>
          <Divider spacing={12} color={colors.border} />
          {safeFeedback.replies.map(reply => (
            <View key={reply.id} style={styles.replyRow}>
              <View style={{ flex: 1 }}>
                <Typo variant="caption" style={{ color: colors.textMuted, marginBottom: 2 }}>
                  {reply.replierName}
                </Typo>
                <Typo variant="body" style={{ marginTop: 2 }}>
                  {reply.content}
                </Typo>
                <Typo variant="caption" style={{ color: colors.textMuted, marginTop: 4 }}>
                  {formatDate(reply.createdAt)}
                </Typo>
              </View>

              {(onEditReply || onDeleteReply) && canActAsTarget && (
                <View style={styles.iconActions}>
                  {onEditReply && (
                    <MaterialIcons
                      name="edit"
                      size={18}
                      color={colors.tint}
                      style={styles.iconButton}
                      onPress={() => onEditReply(safeFeedback.id, reply)}
                    />
                  )}
                  {onDeleteReply && (
                    <MaterialIcons
                      name="delete"
                      size={18}
                      color={colors.error}
                      style={styles.iconButton}
                      onPress={() => onDeleteReply(safeFeedback.id, reply.id)}
                    />
                  )}
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {canActAsTarget && onAddReply && safeFeedback.status !== "rejected" && (
        <View style={styles.addReplyRow}>
          <Button
            label="Add Reply"
            variant="secondary"
            onPress={() => onAddReply(safeFeedback.id)}
          />
        </View>
      )}

      {isUser && safeFeedback.type === "complaint" && safeFeedback.status === "resolved" && !safeFeedback.rating && onRateResolution && (
        <View style={styles.addReplyRow}>
          <Button
            label="Rate This Resolution (1-5 stars)"
            variant="secondary"
            onPress={() => onRateResolution(safeFeedback.id, 5, "")}
          />
        </View>
      )}

      {canActAsTarget && safeFeedback.type === "complaint" && safeFeedback.status === "pending" && (
        <View style={[styles.addReplyRow, { flexDirection: 'row', gap: 8 }]}>
          <Button
            label="Approve"
            variant="primary"
            onPress={() => onApproveComplaint?.(safeFeedback.id)}
            style={{ flex: 1 }}
          />
          <Button
            label="Reject"
            variant="secondary"
            onPress={() => onRejectComplaint?.(safeFeedback.id)}
            style={{ flex: 1 }}
          />
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  title: {
    marginBottom: 2,
  },
  description: {
    marginTop: 8,
  },
  repliesWrap: {
    marginTop: 12,
  },
  replyRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingTop: 8,
    gap: 8,
  },
  iconActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginLeft: 8,
  },
  iconButton: {
    paddingHorizontal: 4,
  },
  addReplyRow: {
    marginTop: 12,
    alignItems: "flex-end",
  },
});
