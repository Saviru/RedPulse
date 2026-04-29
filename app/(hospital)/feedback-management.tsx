import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

import {
  Button,
  FeedbackCard,
  ReplyFormModal,
  SegmentedControl,
  Typo,
} from "@/packages/ui/components/ui";
import { useFeedback, useThemeColor } from "@/packages/ui/hooks";
import type { FeedbackReply } from "@/packages/ui/constants/mockFeedback";

// TODO: replace with the authenticated hospital identity once auth lands.
const HOSPITAL_ID = "h1";
const HOSPITAL_NAME = "Colombo General Hospital";

const TAB_OPTIONS = ["Feedbacks", "Complaints"] as const;

export default function HospitalFeedbackManagementScreen() {
  const router = useRouter();
  const { colors } = useThemeColor();
  const {
    feedbacks,
    isLoading,
    error,
    refresh,
    addReply,
    updateReply,
    deleteReply,
  } = useFeedback();

  const [tabIndex, setTabIndex] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [activeFeedbackId, setActiveFeedbackId] = useState<string | null>(null);
  const [editingReply, setEditingReply] = useState<FeedbackReply | null>(null);

  // -------------------------------------------------------------------------
  // Derived state
  // -------------------------------------------------------------------------
  const hospitalFeedbacks = useMemo(
    () =>
      feedbacks.filter(
        f => f.targetType === "hospital" && f.targetId === HOSPITAL_ID,
      ),
    [feedbacks],
  );

  const visibleFeedbacks = useMemo(() => {
    const targetType = tabIndex === 0 ? "feedback" : "complaint";
    return hospitalFeedbacks.filter(f => f.type === targetType);
  }, [hospitalFeedbacks, tabIndex]);

  // -------------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------------
  const handleAddReplyClick = (feedbackId: string) => {
    setActiveFeedbackId(feedbackId);
    setEditingReply(null);
    setModalVisible(true);
  };

  const handleEditReplyClick = (feedbackId: string, reply: FeedbackReply) => {
    setActiveFeedbackId(feedbackId);
    setEditingReply(reply);
    setModalVisible(true);
  };

  const handleSubmitReply = (content: string) => {
    if (!activeFeedbackId) return;

    if (editingReply) {
      updateReply(activeFeedbackId, editingReply.id, content);
    } else {
      addReply(activeFeedbackId, {
        replierId: HOSPITAL_ID,
        replierName: HOSPITAL_NAME,
        replierRole: "hospital",
        content,
      });
    }
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  const renderListBody = () => {
    if (isLoading) {
      return (
        <Typo variant="body" style={[styles.emptyText, { color: colors.textMuted }]}>
          Loading feedback...
        </Typo>
      );
    }

    if (error) {
      return (
        <View style={styles.errorBox}>
          <Typo variant="body" style={[styles.emptyText, { color: colors.textMuted }]}>
            {error}
          </Typo>
          <Button label="Retry" variant="secondary" onPress={refresh} />
        </View>
      );
    }

    if (visibleFeedbacks.length === 0) {
      return (
        <Typo variant="body" style={[styles.emptyText, { color: colors.textMuted }]}>
          No records found.
        </Typo>
      );
    }

    return visibleFeedbacks.map(f => (
      <FeedbackCard
        key={f.id}
        feedback={f}
        currentUserRole="hospital"
        onAddReply={handleAddReplyClick}
        onEditReply={handleEditReplyClick}
        onDeleteReply={deleteReply}
      />
    ));
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top", "bottom"]}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Typo variant="h2" style={styles.headerTitle}>
          Feedback Dashboard
        </Typo>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.tabsContainer}>
        <SegmentedControl
          options={[...TAB_OPTIONS]}
          selectedIndex={tabIndex}
          onChange={setTabIndex}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {renderListBody()}
      </ScrollView>

      <ReplyFormModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleSubmitReply}
        initialData={editingReply}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: { padding: 8 },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 20 },
  tabsContainer: { paddingHorizontal: 16, marginBottom: 8 },
  content: { padding: 16, paddingBottom: 32 },
  emptyText: { textAlign: "center", marginTop: 40 },
  errorBox: { alignItems: "center", marginTop: 40, gap: 12 },
});
