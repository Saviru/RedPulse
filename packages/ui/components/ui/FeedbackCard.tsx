import React, { useCallback } from "react";
import {
  Alert,
  Linking,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Image } from "expo-image";
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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type ThemeColors = ReturnType<typeof useThemeColor>["colors"];

type BadgeVariant = "default" | "info" | "success" | "warning" | "danger";

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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const toFeedbackLabel = (type: FeedbackType) =>
  type === "complaint" ? "Complaint" : "Feedback";

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const getStatusBadgeVariant = (status: ComplaintStatus): BadgeVariant => {
  switch (status) {
    case "pending": return "warning";
    case "in_progress": return "info";
    case "resolved": return "success";
    case "rejected": return "danger";
    default: return "default";
  }
};

const getPriorityBadgeVariant = (priority: ComplaintPriority): BadgeVariant => {
  switch (priority) {
    case "low": return "success";
    case "medium": return "warning";
    case "high":
    case "critical":
      return "danger";
    default: return "default";
  }
};

const formatCategoryLabel = (category: string) =>
  category.charAt(0).toUpperCase() + category.slice(1).replace("_", " ");

// File-name based detection. The server only ever stores .jpg/.png/.pdf so
// these checks are sufficient for our current allow-list.
const isPdfAttachment = (uri: string) => uri.toLowerCase().endsWith(".pdf");
const isImageAttachment = (uri: string) =>
  /\.(jpg|jpeg|png|gif|webp)$/i.test(uri);

const getApiBaseUrl = () => {
  const env = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (typeof env === "string" && env.trim().length > 0) {
    return env.replace(/\/$/, "");
  }
  return Platform.OS === "android"
    ? "http://10.0.2.2:5000/api"
    : "http://127.0.0.1:5000/api";
};

const resolveAttachmentUrl = (attachment: string): string =>
  attachment.startsWith("http") ? attachment : `${getApiBaseUrl()}${attachment}`;

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
const StarRating: React.FC<{ rating: number; colors: ThemeColors }> = ({
  rating,
  colors,
}) => (
  <View style={styles.row}>
    {[1, 2, 3, 4, 5].map(star => (
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

interface IconActionProps {
  name: keyof typeof MaterialIcons.glyphMap;
  color: string;
  label: string;
  onPress: () => void;
  size?: number;
}

const IconAction: React.FC<IconActionProps> = ({
  name,
  color,
  label,
  onPress,
  size = 20,
}) => (
  <TouchableOpacity
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={label}
    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    style={styles.iconButton}
  >
    <MaterialIcons name={name} size={size} color={color} />
  </TouchableOpacity>
);

interface AttachmentTileProps {
  attachment: string;
  colors: ThemeColors;
}

const AttachmentTile: React.FC<AttachmentTileProps> = ({ attachment, colors }) => {
  const url = resolveAttachmentUrl(attachment);

  const handleOpen = useCallback(async () => {
    try {
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert(
        "Couldn't open file",
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  }, [url]);

  const isImage = isImageAttachment(attachment);
  const isPdf = isPdfAttachment(attachment);

  let iconName: keyof typeof MaterialIcons.glyphMap = "attachment";
  let label = "Tap to download";
  if (isPdf) {
    iconName = "picture-as-pdf";
    label = "Tap to open PDF";
  }

  return (
    <TouchableOpacity
      onPress={handleOpen}
      accessibilityRole="button"
      accessibilityLabel={`Open attachment ${attachment.split("/").pop() ?? ""}`}
      style={styles.attachmentTile}
    >
      {isImage ? (
        <Image
          source={{ uri: url }}
          style={[styles.attachmentThumb, { backgroundColor: colors.border }]}
          contentFit="cover"
        />
      ) : (
        <View
          style={[
            styles.attachmentThumb,
            styles.attachmentIconBox,
            { backgroundColor: colors.border },
          ]}
        >
          <MaterialIcons name={iconName} size={40} color={colors.tint} />
        </View>
      )}
      <Typo
        variant="caption"
        style={{ color: colors.tint, textAlign: "center", fontSize: 10 }}
      >
        {isImage ? "Tap to view" : label}
      </Typo>
    </TouchableOpacity>
  );
};

// ---------------------------------------------------------------------------
// FeedbackCard
// ---------------------------------------------------------------------------
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

  // Defensive defaults — the API can in theory return partial objects.
  const safe = {
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
    currentUserRole === safe.targetType;

  const showOwnerActions = isUser && (onEditFeedback || onDeleteFeedback);

  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Typo variant="h2" style={styles.title}>
            {safe.title}
          </Typo>

          <Typo variant="caption" style={{ color: colors.textMuted, marginBottom: 8 }}>
            {safe.isAnonymous ? "Anonymous" : safe.userName}
            {" • "}
            {toFeedbackLabel(safe.type)}
            {" • To: "}
            {safe.targetName}
            {" • "}
            {formatDate(safe.createdAt)}
          </Typo>

          <View style={styles.badgeRow}>
            {safe.category && (
              <Badge label={formatCategoryLabel(safe.category)} variant="info" />
            )}
            {safe.type === "complaint" && safe.status && (
              <Badge
                label={`Status: ${safe.status}`}
                variant={getStatusBadgeVariant(safe.status)}
              />
            )}
            {safe.type === "complaint" && safe.priority && (
              <Badge
                label={`Priority: ${safe.priority}`}
                variant={getPriorityBadgeVariant(safe.priority)}
              />
            )}
          </View>
        </View>

        {showOwnerActions && (
          <View style={styles.iconActions}>
            {onEditFeedback && (
              <IconAction
                name="edit"
                color={colors.tint}
                label="Edit feedback"
                onPress={() => onEditFeedback(safe)}
              />
            )}
            {onDeleteFeedback && (
              <IconAction
                name="delete"
                color={colors.error}
                label="Delete feedback"
                onPress={() => onDeleteFeedback(safe.id)}
              />
            )}
          </View>
        )}
      </View>

      <Typo variant="body" style={styles.description}>
        {safe.description}
      </Typo>

      {safe.type === "feedback" && safe.rating ? (
        <View style={{ marginTop: 8 }}>
          <StarRating rating={safe.rating} colors={colors} />
        </View>
      ) : null}

      {safe.attachments.length > 0 && (
        <View style={{ marginTop: 12 }}>
          <Typo
            variant="caption"
            style={{ color: colors.textMuted, marginBottom: 8, fontWeight: "600" }}
          >
            Attachments ({safe.attachments.length})
          </Typo>
          <View style={styles.attachmentRow}>
            {safe.attachments.map((attachment, index) => (
              <AttachmentTile
                key={`${attachment}-${index}`}
                attachment={attachment}
                colors={colors}
              />
            ))}
          </View>
        </View>
      )}

      {safe.type === "complaint" && safe.status === "resolved" && (
        <View
          style={[
            styles.resolutionBox,
            { backgroundColor: colors.success + "15" },
          ]}
        >
          <Typo
            variant="caption"
            style={{ color: colors.success, fontWeight: "600", marginBottom: 4 }}
          >
            Resolved
          </Typo>
          {safe.resolutionFeedback && (
            <Typo variant="caption" style={{ color: colors.text }}>
              {safe.resolutionFeedback}
            </Typo>
          )}
        </View>
      )}

      {safe.replies.length > 0 && (
        <View style={styles.repliesWrap}>
          <Divider spacing={12} color={colors.border} />
          {safe.replies.map(reply => (
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
                    <IconAction
                      name="edit"
                      color={colors.tint}
                      label="Edit reply"
                      onPress={() => onEditReply(safe.id, reply)}
                      size={18}
                    />
                  )}
                  {onDeleteReply && (
                    <IconAction
                      name="delete"
                      color={colors.error}
                      label="Delete reply"
                      onPress={() => onDeleteReply(safe.id, reply.id)}
                      size={18}
                    />
                  )}
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {canActAsTarget && onAddReply && safe.status !== "rejected" && (
        <View style={styles.addReplyRow}>
          <Button
            label="Add Reply"
            variant="secondary"
            onPress={() => onAddReply(safe.id)}
          />
        </View>
      )}

      {isUser &&
        safe.type === "complaint" &&
        safe.status === "resolved" &&
        !safe.rating &&
        onRateResolution && (
          <View style={styles.addReplyRow}>
            <Button
              label="Rate This Resolution (1-5 stars)"
              variant="secondary"
              onPress={() => onRateResolution(safe.id, 5, "")}
            />
          </View>
        )}

      {canActAsTarget &&
        safe.type === "complaint" &&
        safe.status === "pending" && (
          <View style={[styles.addReplyRow, styles.actionRow]}>
            <Button
              label="Approve"
              variant="primary"
              onPress={() => onApproveComplaint?.(safe.id)}
              style={{ flex: 1 }}
            />
            <Button
              label="Reject"
              variant="secondary"
              onPress={() => onRejectComplaint?.(safe.id)}
              style={{ flex: 1 }}
            />
          </View>
        )}
    </Card>
  );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  card: { marginBottom: 12 },
  row: { flexDirection: "row", alignItems: "center" },
  headerRow: { flexDirection: "row", alignItems: "flex-start" },
  title: { marginBottom: 2 },
  description: { marginTop: 8 },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 4,
  },
  repliesWrap: { marginTop: 12 },
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
    minWidth: 28,
    minHeight: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  addReplyRow: {
    marginTop: 12,
    alignItems: "flex-end",
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
  },
  attachmentRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  attachmentTile: {
    marginRight: 8,
    marginBottom: 8,
    alignItems: "center",
  },
  attachmentThumb: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginBottom: 4,
  },
  attachmentIconBox: {
    justifyContent: "center",
    alignItems: "center",
  },
  resolutionBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
  },
});
