import React, { useEffect, useMemo, useState } from "react";
import { Modal, StyleSheet, View, ScrollView, TouchableOpacity, Platform } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { MaterialIcons } from "@expo/vector-icons";

import { Button } from "./Button";
import { Input } from "./Input";
import { Typo } from "./Typo";
import { Toggle } from "./Toggle";
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
import { SegmentedControl } from "./SegmentedControl";

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

interface FeedbackFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: {
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
  }) => void;
  initialData?: FeedbackItem | null;
  /** Used when creating feedback; defaults to demo hospital + organization. */
  targetOptions?: FeedbackTargetSelection[];
}

export const FeedbackFormModal: React.FC<FeedbackFormModalProps> = ({
  visible,
  onClose,
  onSubmit,
  initialData,
  targetOptions,
}) => {
  const { colors } = useThemeColor();

  const targets = useMemo(
    () => (targetOptions?.length ? targetOptions : [...FEEDBACK_TARGET_PRESETS]),
    [targetOptions],
  );

  const [type, setType] = useState<FeedbackType>("feedback");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<FeedbackCategory | ComplaintCategory | undefined>();
  const [priority, setPriority] = useState<ComplaintPriority | undefined>();
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [targetIndex, setTargetIndex] = useState(0);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [rating, setRating] = useState<number | undefined>();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  const isValidFileType = (mimeType: string): boolean => {
    const validTypes = ["image/jpeg", "image/png", "application/pdf"];
    return validTypes.includes(mimeType);
  };

  const validateForm = (): Record<string, string> => {
    const newErrors: Record<string, string> = {};

    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();

    if (!trimmedTitle) {
      newErrors.title = "Title is required";
    }

    if (!trimmedDescription) {
      newErrors.description = "Description is required";
    }

    if (type === "feedback" && !rating) {
      newErrors.rating = "Rating is required for feedback";
    }

    if (type === "complaint" && !category) {
      newErrors.category = "Category is required for complaints";
    }

    if (type === "complaint" && !priority) {
      newErrors.priority = "Priority is required for complaints";
    }

    return newErrors;
  };

  const isFormValid = (): boolean => {
    const formErrors = validateForm();
    return Object.keys(formErrors).length === 0;
  };

  useEffect(() => {
    // Convert backend attachment URIs (string[]) to FileAttachment[] for the UI.
    const uris: string[] = initialData?.attachments ?? [];

    if (initialData) {
      setType(initialData.type);
      setTitle(initialData.title);
      setDescription(initialData.description);
      setCategory(initialData.category);
      setPriority(initialData.priority);

      const mimeFromName = (name: string): string => {
        const ext = name.split('.').pop()?.toLowerCase() ?? '';
        switch (ext) {
          case 'jpg':
          case 'jpeg':
            return 'image/jpeg';
          case 'png':
            return 'image/png';
          case 'gif':
            return 'image/gif';
          case 'webp':
            return 'image/webp';
          case 'pdf':
            return 'application/pdf';
          case 'txt':
            return 'text/plain';
          default:
            return 'application/octet-stream';
        }
      };

      const fileAttachments: FileAttachment[] = uris.map((uri) => {
        const name = uri.split('/').pop() || uri;
        return {
          uri,
          name,
          type: name.endsWith('.pdf') ? 'application/pdf' : mimeFromName(name),
          size: 0, // size is unknown from backend URIs
        };
      });

      setAttachments(fileAttachments);

      setIsAnonymous(initialData.isAnonymous);
      setRating(initialData.rating);
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

  const handleSubmit = () => {
    // Simple guard to prevent empty submissions
    if (!title || !description || !title.trim() || !description.trim()) {
      const missingErrors: Record<string, string> = {};
      if (!title || !title.trim()) missingErrors.title = "Title is required";
      if (!description || !description.trim()) missingErrors.description = "Description is required";
      setErrors(missingErrors);
      return;
    }

    const formErrors = validateForm();
    
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();

    const targetFields = initialData
      ? {
          targetType: initialData.targetType,
          targetId: initialData.targetId,
          targetName: initialData.targetName,
        }
      : targets[targetIndex];

    onSubmit({
      type,
      title: trimmedTitle,
      description: trimmedDescription,
      category,
      priority: type === "complaint" ? priority : undefined,
      attachments: attachments.length > 0 ? attachments : undefined,
      rating: type === "feedback" ? rating : undefined,
      isAnonymous,
      ...targetFields,
    });
    onClose();
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const fileName = asset.uri.split("/").pop() || `image_${Date.now()}.jpg`;
        const mimeType = asset.type === "image" ? "image/jpeg" : "image/png";
        const fileSize = asset.fileSize || 0;

        if (!isValidFileType(mimeType)) {
          alert("Invalid file type. Only images (JPG, PNG) and PDFs are allowed.");
          return;
        }

        if (fileSize > MAX_FILE_SIZE) {
          alert("File is too large. Maximum size is 5MB.");
          return;
        }

        const newFile: FileAttachment = {
          uri: asset.uri,
          name: fileName,
          type: mimeType,
          size: fileSize,
        };

        setAttachments([...attachments, newFile]);
      }
    } catch (error) {
      alert("Error picking image: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const fileSize = asset.size || 0;

        if (asset.mimeType !== "application/pdf") {
          alert("Invalid file type. Only PDFs are allowed.");
          return;
        }

        if (fileSize > MAX_FILE_SIZE) {
          alert("File is too large. Maximum size is 5MB.");
          return;
        }

        const newFile: FileAttachment = {
          uri: asset.uri,
          name: asset.name,
          type: "application/pdf",
          size: fileSize,
        };

        setAttachments([...attachments, newFile]);
      }
    } catch (error) {
      alert("Error picking document: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <ScrollView 
          style={[styles.container, { backgroundColor: colors.surface }]}
          contentContainerStyle={{ paddingBottom: 16 }}
          keyboardShouldPersistTaps="handled"
        >
          <Typo variant="h2" style={styles.title}>
            {initialData ? "Edit Feedback" : "New Feedback"}
          </Typo>

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

          {type === "feedback" && (
            <View style={{ marginTop: 12 }}>
              <Typo variant="caption" style={{ marginBottom: 8, color: colors.textMuted }}>
                Category
              </Typo>
              <SegmentedControl
                options={["Suggestion", "Compliment", "General", "Feature Request"]}
                selectedIndex={
                  category === "suggestion" ? 0 :
                  category === "compliment" ? 1 :
                  category === "general" ? 2 :
                  category === "feature_request" ? 3 : -1
                }
                onChange={(idx) => setCategory(
                  idx === 0 ? "suggestion" :
                  idx === 1 ? "compliment" :
                  idx === 2 ? "general" : "feature_request"
                )}
              />
            </View>
          )}

          {type === "complaint" && (
            <View style={{ marginTop: 12 }}>
              <Typo variant="caption" style={{ marginBottom: 8, color: colors.textMuted }}>
                Category <Typo style={{ color: "red" }}>*</Typo>
              </Typo>
              <SegmentedControl
                options={["Technical", "Service", "Donation", "Staff", "Emergency", "Other"]}
                selectedIndex={
                  category === "technical" ? 0 :
                  category === "service" ? 1 :
                  category === "donation" ? 2 :
                  category === "staff" ? 3 :
                  category === "emergency" ? 4 :
                  category === "other" ? 5 : -1
                }
                onChange={(idx) => {
                  setCategory(
                    idx === 0 ? "technical" :
                    idx === 1 ? "service" :
                    idx === 2 ? "donation" :
                    idx === 3 ? "staff" :
                    idx === 4 ? "emergency" : "other"
                  );
                  if (errors.category) {
                    setErrors({ ...errors, category: "" });
                  }
                }}
              />
              {errors.category && (
                <Typo style={{ color: "#E74C3C", fontSize: 12, marginTop: 4 }}>
                  {errors.category}
                </Typo>
              )}
            </View>
          )}

          {type === "complaint" && (
            <View style={{ marginTop: 12 }}>
              <Typo variant="caption" style={{ marginBottom: 8, color: colors.textMuted }}>
                Priority <Typo style={{ color: "red" }}>*</Typo>
              </Typo>
              <SegmentedControl
                options={["Low", "Medium", "High", "Critical"]}
                selectedIndex={
                  priority === "low" ? 0 :
                  priority === "medium" ? 1 :
                  priority === "high" ? 2 :
                  priority === "critical" ? 3 : -1
                }
                onChange={(idx) => {
                  setPriority(
                    idx === 0 ? "low" :
                    idx === 1 ? "medium" :
                    idx === 2 ? "high" : "critical"
                  );
                  if (errors.priority) {
                    setErrors({ ...errors, priority: "" });
                  }
                }}
              />
              {errors.priority && (
                <Typo style={{ color: "#E74C3C", fontSize: 12, marginTop: 4 }}>
                  {errors.priority}
                </Typo>
              )}
            </View>
          )}

          {type === "complaint" && (
            <View style={{ marginTop: 12 }}>
              <Typo variant="caption" style={{ marginBottom: 8, color: colors.textMuted }}>
                Attachments (Images & PDFs)
              </Typo>
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
                <Button
                  label="📷 Add Image"
                  variant="secondary"
                  onPress={handlePickImage}
                  style={{ flex: 1 }}
                />
                <Button
                  label="📄 Add PDF"
                  variant="secondary"
                  onPress={handlePickDocument}
                  style={{ flex: 1 }}
                />
              </View>

              {attachments.length > 0 && (
                <View style={{ 
                  backgroundColor: colors.border, 
                  borderRadius: 8, 
                  padding: 8,
                  marginBottom: 8 
                }}>
                  {attachments.map((file, index) => (
                    <View
                      key={index}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingVertical: 6,
                        paddingHorizontal: 8,
                        backgroundColor: colors.surface,
                        marginBottom: index < attachments.length - 1 ? 6 : 0,
                        borderRadius: 6,
                      }}
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
                        <Typo variant="caption" style={{ color: colors.textMuted, fontSize: 11 }}>
                          {formatFileSize(file.size)}
                        </Typo>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleRemoveAttachment(index)}
                        style={{ padding: 4 }}
                      >
                        <MaterialIcons
                          name="close"
                          size={18}
                          color={colors.textMuted}
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {initialData ? (
            <Typo variant="caption" style={{ marginTop: 12, color: colors.textMuted }}>
              To: {initialData.targetName}
            </Typo>
          ) : (
            <View style={{ marginTop: 12 }}>
              <Typo variant="caption" style={{ marginBottom: 8, color: colors.textMuted }}>
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

          <Input
            label="Title"
            value={title}
            onChangeText={(val) => {
              setTitle(val);
              if (errors.title) {
                setErrors({ ...errors, title: "" });
              }
            }}
            placeholder="Enter a short title"
            style={errors.title ? { borderColor: "#E74C3C", borderWidth: 1 } : undefined}
            containerStyle={{ marginTop: 12 }}
          />
          {errors.title && (
            <Typo style={{ color: "#E74C3C", fontSize: 12, marginTop: 4 }}>
              {errors.title}
            </Typo>
          )}

          <Input
            label="Description"
            value={description}
            onChangeText={(val) => {
              setDescription(val);
              if (errors.description) {
                setErrors({ ...errors, description: "" });
              }
            }}
            placeholder="Describe your experience"
            multiline
            style={[
              { height: 120, marginTop: 12 },
              errors.description && { borderColor: "#E74C3C", borderWidth: 1 }
            ]}
          />
          {errors.description && (
            <Typo style={{ color: "#E74C3C", fontSize: 12, marginTop: 4 }}>
              {errors.description}
            </Typo>
          )}

          {type === "feedback" && (
            <View style={{ marginTop: 12 }}>
              <Typo variant="caption" style={{ marginBottom: 8, color: colors.textMuted }}>
                Rating <Typo style={{ color: "red" }}>*</Typo>
              </Typo>
              <SegmentedControl
                options={["1", "2", "3", "4", "5"]}
                selectedIndex={rating ? rating - 1 : -1}
                onChange={(idx) => {
                  setRating(idx + 1);
                  if (errors.rating) {
                    setErrors({ ...errors, rating: "" });
                  }
                }}
              />
              {errors.rating && (
                <Typo style={{ color: "#E74C3C", fontSize: 12, marginTop: 4 }}>
                  {errors.rating}
                </Typo>
              )}
            </View>
          )}

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
              disabled={!isFormValid()}
            />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  container: {
    maxHeight: "90%",
    borderRadius: 16,
    padding: 16,
  },
  title: {
    marginBottom: 12,
  },
  typeRow: {
    flexDirection: "row",
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 16,
  },
});
