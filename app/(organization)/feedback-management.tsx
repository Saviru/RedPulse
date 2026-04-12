import React, { useState } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

import {
  Button,
  Typo,
  FeedbackCard,
  ReplyFormModal,
  SegmentedControl,
} from "@/packages/ui/components/ui";
import { useThemeColor, useFeedback } from "@/packages/ui/hooks";
import type { FeedbackReply } from "@/packages/ui/constants/mockFeedback";

export default function OrganizationFeedbackManagementScreen() {
  const router = useRouter();
  const { colors } = useThemeColor();
  const { feedbacks, isLoading, error, refresh, addReply, updateReply, deleteReply } =
    useFeedback();

  const ORG_ID = "o1";
  const ORG_NAME = "Lions Club Blood Drive";

  const [tabIndex, setTabIndex] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [activeFeedbackId, setActiveFeedbackId] = useState<string | null>(null);
  const [editingReply, setEditingReply] = useState<FeedbackReply | null>(null);

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
        replierId: ORG_ID,
        replierName: ORG_NAME,
        replierRole: "organization",
        content,
      });
    }
  };

  const forThisOrg = feedbacks.filter(
    f => f.targetType === "organization" && f.targetId === ORG_ID,
  );

  const filteredFeedbacks = forThisOrg.filter(f =>
    tabIndex === 0 ? f.type === "complaint" : f.type === "feedback",
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top", "bottom"]}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Typo variant="h2" style={styles.headerTitle}>
          Camp Feedback & Complaints
        </Typo>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.tabsContainer}>
        <SegmentedControl
          options={["Complaints", "Feedbacks"]}
          selectedIndex={tabIndex}
          onChange={setTabIndex}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <Typo
            variant="body"
            style={{
              textAlign: "center",
              color: colors.textMuted,
              marginTop: 40,
            }}
          >
            Loading feedback...
          </Typo>
        ) : error ? (
          <View style={{ alignItems: "center", marginTop: 40, gap: 12 }}>
            <Typo variant="body" style={{ textAlign: "center", color: colors.textMuted }}>
              {error}
            </Typo>
            <Button label="Retry" variant="secondary" onPress={refresh} />
          </View>
        ) : filteredFeedbacks.length === 0 ? (
          <Typo
            variant="body"
            style={{
              textAlign: "center",
              color: colors.textMuted,
              marginTop: 40,
            }}
          >
            No records found.
          </Typo>
        ) : (
          filteredFeedbacks.map(f => (
            <FeedbackCard
              key={f.id}
              feedback={f}
              currentUserRole="organization"
              onAddReply={handleAddReplyClick}
              onEditReply={handleEditReplyClick}
              onDeleteReply={deleteReply}
            />
          ))
        )}
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
});
