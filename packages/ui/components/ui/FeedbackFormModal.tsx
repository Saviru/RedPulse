import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { MaterialIcons } from "@expo/vector-icons";

import { Button } from "./Button";
import { Input } from "./Input";
import { Typo } from "./Typo";
import { Toggle } from "./Toggle";
import { SegmentedControl } from "./SegmentedControl";
import { useThemeColor } from "@/packages/ui/hooks/useThemeColor";
import {
  FEEDBACK_TARGET_PRESETS,
  type FeedbackItem,
  type FeedbackTargetType,
  type FeedbackType,
  type FeedbackCategory,
  type ComplaintCategory,
  type ComplaintPriority,
} from "@/packages/ui/constants/mockFeedback";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type FeedbackTargetSelection = {
  targetType: FeedbackTargetType;
  targetId: string;
  targetName: string;
};

export type FileAttachment = {
  uri: string;
  name: string;
  type: string;
  size: number;
};

export type FeedbackFormPayload = {
  type: FeedbackType;
  title: string;
  description: string;
  category?: FeedbackCategory | ComplaintCategory;
  priority?: ComplaintPriority;
  attachments?: FileAttachment[];
  rating?: number;
  targetType: FeedbackTargetType;
  targetId: string;
  targetName: string;
  isAnonymous: boolean;
};

interface FeedbackFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: FeedbackFormPayload) => void;
  initialData?: FeedbackItem | null;
  /** Used when creating feedback; defaults to demo hospital + organization. */
  targetOptions?: FeedbackTargetSelection[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "application/pdf",
]);

const FEEDBACK_CATEGORIES: { label: string; value: FeedbackCategory }[] = [
  { label: "Suggestion", value: "suggestion" },
  { label: "Compliment", value: "compliment" },
  { label: "General", value: "general" },
  { label: "Feature Request", value: "feature_request" },
];

const COMPLAINT_CATEGORIES: { label: string; value: ComplaintCategory }[] = [
  { label: "Technical", value: "technical" },
  { label: "Service", value: "service" },
  { label: "Donation", value: "donation" },
  { label: "Staff", value: "staff" },
  { label: "Emergency", value: "emergency" },
  { label: "Other", value: "other" },
];

const PRIORITY_OPTIONS: ComplaintPriority[] = ["low", "medium", "high", "critical"];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function mimeFromName(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "pdf":
      return "application/pdf";
    default:
      return "application/octet-stream";
  }
}

function formatFileSize(bytes: number): string {
  if (bytes <= 0) return "—";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export const FeedbackFormModal: React.FC<FeedbackFormModalProps> = ({
  visible,
  onClose,
  onSubmit,
  initialData,
  targetOptions,
}) => {
  const { colors } = useThemeColor();

  const targets = useMemo(
    () => (targetOptions?.length ? targetOptions : FEEDBACK_TARGET_PRESETS),
    [targetOptions],
  );

  const [type, setType] = useState<FeedbackType>("feedback");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<
    FeedbackCategory | ComplaintCategory | undefined
  >();
  const [priority, setPriority] = useState<ComplaintPriority | undefined>();
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [targetIndex, setTargetIndex] = useState(0);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [rating, setRating] = useState<number | undefined>();
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form whenever the modal opens or the editing target changes.
  useEffect(() => {
    if (!visible) return;

    if (initialData) {
      setType(initialData.type);
      setTitle(initialData.title);
      setDescription(initialData.description);
      setCategory(initialData.category);
      setPriority(initialData.priority);
      setIsAnonymous(initialData.isAnonymous);
      setRating(initialData.rating);

      const uris = initialData.attachments ?? [];
      setAttachments(
        uris.map<FileAttachment>(uri => {
          const name = uri.split("/").pop() || uri;
          return { uri, name, type: mimeFromName(name), size: 0 };
        }),
      );

      const idx = targets.findIndex(
        t =>
          t.targetId === initialData.targetId &&
          t.targetType === initialData.targetType,
      );
      setTargetIndex(idx >= 0 ? idx : 0);
    } else {
      setType("feedback");
      setTitle("");
      setDescription("");
      setCategory(undefined);
      setPriority(undefined);
      setAttachments([]);
      setIsAnonymous(false);
      setRating(undefined);
      setTargetIndex(0);
    }
    setErrors({});
  }, [initialData, visible, targets]);

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = "Title is required";
    if (!description.trim()) e.description = "Description is required";
    if (type === "feedback" && !rating) e.rating = "Rating is required for feedback";
    if (type === "complaint" && !category) e.category = "Category is required for complaints";
    if (type === "complaint" && !priority) e.priority = "Priority is required for complaints";
    return e;
  };

  const isFormValid = Object.keys(validate()).length === 0;

  const handleSubmit = () => {
    const formErrors = validate();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    const target = initialData
      ? {
          targetType: initialData.targetType,
          targetId: initialData.targetId,
          targetName: initialData.targetName,
        }
      : targets[targetIndex];

    onSubmit({
      type,
      title: title.trim(),
      description: description.trim(),
      category,
      priority: type === "complaint" ? priority : undefined,
      attachments: attachments.length > 0 ? attachments : undefined,
      rating: type === "feedback" ? rating : undefined,
      isAnonymous,
      ...target,
    });
    onClose();
  };

  const validateAndAddFile = (file: FileAttachment): boolean => {
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      Alert.alert(
        "Unsupported file type",
        "Only JPG, PNG, and PDF files can be attached.",
      );
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      Alert.alert("File too large", "Maximum attachment size is 5 MB.");
      return false;
    }
    setAttachments(prev => [...prev, file]);
    return true;
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 0.8,
      });
      if (result.canceled || !result.assets[0]) return;

      const asset = result.assets[0];
      const fileName = asset.fileName || asset.uri.split("/").pop() || `image_${Date.now()}.jpg`;
      const mimeType = asset.mimeType ?? mimeFromName(fileName);

      validateAndAddFile({
        uri: asset.uri,
        name: fileName,
        type: mimeType,
        size: asset.fileSize ?? 0,
      });
    } catch (e) {
      Alert.alert("Couldn't add image", e instanceof Error ? e.message : "Unknown error");
    }
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets[0]) return;

      const asset = result.assets[0];
      validateAndAddFile({
        uri: asset.uri,
        name: asset.name,
        type: "application/pdf",
        size: asset.size ?? 0,
      });
    } catch (e) {
      Alert.alert(
        "Couldn't add document",
        e instanceof Error ? e.message : "Unknown error",
      );
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  const renderCategoryChips = (
    options: { label: string; value: FeedbackCategory | ComplaintCategory }[],
  ) => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.chipRow}>
        {options.map(({ label, value }) => {
          const selected = category === value;
          return (
            <TouchableOpacity
              key={value}
              onPress={() => setCategory(value)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              style={[
                styles.chip,
                { borderColor: colors.tint },
                selected && { backgroundColor: colors.tint },
              ]}
            >
              <Typo
                variant="caption"
                style={[
                  styles.chipText,
                  { color: selected ? "#FFFFFF" : colors.text },
                ]}
              >
                {label}
              </Typo>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );

  const renderRequiredAsterisk = () => (
    <Typo style={{ color: colors.error }}>*</Typo>
  );

  console.log("[FeedbackFormModal] Rendering, visible:", visible);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableOpacity 
        style={styles.backdrop} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <TouchableOpacity 
          activeOpacity={1} 
          style={[styles.container, { backgroundColor: colors.surface }]}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 16 }}
          >
            <View style={styles.headerRow}>
              <Typo variant="h2" style={styles.title}>
                {initialData ? "Edit Feedback" : "New Feedback"}
              </Typo>
              <TouchableOpacity onPress={onClose}>
                <MaterialIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

          {/* Type toggle */}
          <View style={styles.typeRow}>
            <Button
              label="Feedback"
              variant={type === "feedback" ? "primary" : "secondary"}
              onPress={() => setType("feedback")}
              style={{ flex: 1 }}
            />
            <Button
              label="Complaint"
              variant={type === "complaint" ? "primary" : "secondary"}
              onPress={() => setType("complaint")}
              style={{ flex: 1, marginLeft: 8 }}
            />
          </View>

          <View style={{ marginTop: 12 }}>
            <Toggle
              value={isAnonymous}
              onToggle={setIsAnonymous}
              label="Submit anonymously"
            />
          </View>

          {/* Category */}
          {type === "feedback" && (
            <View style={{ marginTop: 12 }}>
              <Typo variant="caption" style={[styles.fieldLabel, { color: colors.textMuted }]}>
                Category
              </Typo>
              {renderCategoryChips(FEEDBACK_CATEGORIES)}
            </View>
          )}

          {type === "complaint" && (
            <View style={{ marginTop: 12 }}>
              <Typo variant="caption" style={[styles.fieldLabel, { color: colors.textMuted }]}>
                Category {renderRequiredAsterisk()}
              </Typo>
              {renderCategoryChips(COMPLAINT_CATEGORIES)}
              {errors.category && (
                <Typo variant="caption" style={{ color: colors.error, marginTop: 4 }}>
                  {errors.category}
                </Typo>
              )}
            </View>
          )}

          {/* Priority */}
          {type === "complaint" && (
            <View style={{ marginTop: 12 }}>
              <Typo variant="caption" style={[styles.fieldLabel, { color: colors.textMuted }]}>
                Priority {renderRequiredAsterisk()}
              </Typo>
              <SegmentedControl
                options={["Low", "Medium", "High", "Critical"]}
                selectedIndex={priority ? PRIORITY_OPTIONS.indexOf(priority) : -1}
                onChange={idx => setPriority(PRIORITY_OPTIONS[idx])}
              />
              {errors.priority && (
                <Typo variant="caption" style={{ color: colors.error, marginTop: 4 }}>
                  {errors.priority}
                </Typo>
              )}
            </View>
          )}

          {/* Attachments — only for complaints */}
          {type === "complaint" && (
            <View style={{ marginTop: 12 }}>
              <Typo variant="caption" style={[styles.fieldLabel, { color: colors.textMuted }]}>
                Attachments (Images & PDFs)
              </Typo>
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
                <Button
                  label="Add Image"
                  variant="secondary"
                  onPress={handlePickImage}
                  style={{ flex: 1 }}
                />
                <Button
                  label="Add PDF"
                  variant="secondary"
                  onPress={handlePickDocument}
                  style={{ flex: 1 }}
                />
              </View>

              {attachments.length > 0 && (
                <View
                  style={{
                    backgroundColor: colors.border,
                    borderRadius: 8,
                    padding: 8,
                    marginBottom: 8,
                  }}
                >
                  {attachments.map((file, index) => (
                    <View
                      key={`${file.uri}-${index}`}
                      style={[
                        styles.attachmentRow,
                        {
                          backgroundColor: colors.surface,
                          marginBottom: index < attachments.length - 1 ? 6 : 0,
                        },
                      ]}
                    >
                      <MaterialIcons
                        name={file.type === "application/pdf" ? "picture-as-pdf" : "image"}
                        size={20}
                        color={colors.tint}
                        style={{ marginRight: 8 }}
                      />
                      <View style={{ flex: 1 }}>
                        <Typo variant="caption" style={{ color: colors.text }}>
                          {file.name}
                        </Typo>
                        <Typo
                          variant="caption"
                          style={{ color: colors.textMuted, fontSize: 11 }}
                        >
                          {formatFileSize(file.size)}
                        </Typo>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleRemoveAttachment(index)}
                        accessibilityRole="button"
                        accessibilityLabel={`Remove attachment ${file.name}`}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        style={{ padding: 4 }}
                      >
                        <MaterialIcons name="close" size={18} color={colors.textMuted} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Target */}
          {initialData ? (
            <Typo variant="caption" style={{ marginTop: 12, color: colors.textMuted }}>
              To: {initialData.targetName}
            </Typo>
          ) : (
            <View style={{ marginTop: 12 }}>
              <Typo variant="caption" style={[styles.fieldLabel, { color: colors.textMuted }]}>
                Send to
              </Typo>
              <SegmentedControl
                options={targets.map(t =>
                  t.targetType === "hospital" ? "Hospital" : "Organization",
                )}
                selectedIndex={targetIndex}
                onChange={setTargetIndex}
              />
            </View>
          )}

          {/* Title */}
          <Input
            label="Title"
            value={title}
            onChangeText={setTitle}
            placeholder="Enter a short title"
            containerStyle={{ marginTop: 12 }}
          />
          {errors.title && (
            <Typo variant="caption" style={{ color: colors.error }}>
              {errors.title}
            </Typo>
          )}

          {/* Description */}
          <Input
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="Describe your experience"
            multiline
            style={{ height: 120, marginTop: 12 }}
          />
          {errors.description && (
            <Typo variant="caption" style={{ color: colors.error }}>
              {errors.description}
            </Typo>
          )}

          {/* Rating — feedback only */}
          {type === "feedback" && (
            <View style={{ marginTop: 12 }}>
              <Typo variant="caption" style={[styles.fieldLabel, { color: colors.textMuted }]}>
                Rating {renderRequiredAsterisk()}
              </Typo>
              <SegmentedControl
                options={["1", "2", "3", "4", "5"]}
                selectedIndex={rating ? rating - 1 : -1}
                onChange={idx => setRating(idx + 1)}
              />
              {errors.rating && (
                <Typo variant="caption" style={{ color: colors.error, marginTop: 4 }}>
                  {errors.rating}
                </Typo>
              )}
            </View>
          )}

          {/* Actions */}
          <View style={styles.actionsRow}>
            <Button
              label="Cancel"
              variant="secondary"
              onPress={onClose}
              style={{ marginRight: 8 }}
            />
            <Button
              label={initialData ? "Save" : "Submit"}
              onPress={handleSubmit}
              disabled={!isFormValid}
            />
          </View>
        </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    paddingHorizontal: 16,
    zIndex: 999,
  },
  container: {
    width: "100%",
    maxHeight: "85%",
    borderRadius: 24,
    padding: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  title: {
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  typeRow: {
    flexDirection: "row",
  },
  fieldLabel: {
    marginBottom: 8,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 16,
  },
  chipRow: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  chipText: {
    fontWeight: "600",
    fontSize: 13,
  },
  attachmentRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
});
