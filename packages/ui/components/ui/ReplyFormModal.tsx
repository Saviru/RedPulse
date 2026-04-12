import React, { useEffect, useState } from "react";
import { Modal, StyleSheet, View } from "react-native";

import { Button } from "./Button";
import { Input } from "./Input";
import { Typo } from "./Typo";
import { useThemeColor } from "@/packages/ui/hooks/useThemeColor";
import type { FeedbackReply } from "@/packages/ui/constants/mockFeedback";

interface ReplyFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (content: string) => void;
  initialData?: FeedbackReply | null;
}

export const ReplyFormModal: React.FC<ReplyFormModalProps> = ({
  visible,
  onClose,
  onSubmit,
  initialData,
}) => {
  const { colors } = useThemeColor();
  const [content, setContent] = useState("");

  useEffect(() => {
    if (initialData) {
      setContent(initialData.content);
    } else {
      setContent("");
    }
  }, [initialData, visible]);

  const handleSubmit = () => {
    const trimmed = content.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    onClose();
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[styles.backdrop, { backgroundColor: "rgba(0,0,0,0.5)" }]}>
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
          <Typo variant="h2" style={styles.title}>
            {initialData ? "Edit Reply" : "Add Reply"}
          </Typo>

          <Input
            label="Reply"
            value={content}
            onChangeText={setContent}
            placeholder="Type your reply"
            multiline
            style={{ height: 120 }}
          />

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
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  container: {
    width: "100%",
    borderRadius: 16,
    padding: 16,
  },
  title: {
    marginBottom: 12,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12,
  },
});
