import React, { useState } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

import {
  Button,
  Typo,
  FeedbackCard,
  FeedbackFormModal,
  SegmentedControl,
  type FileAttachment,
} from "@/packages/ui/components/ui";
import { useThemeColor, useFeedback } from "@/packages/ui/hooks";
import {
  FEEDBACK_TARGET_OPTIONS,
  type FeedbackItem,
} from "@/packages/ui/constants/mockFeedback";

export default function UserFeedbackScreen() {
  const router = useRouter();
  const { colors } = useThemeColor();
  const {
    feedbacks,
    isLoading,
    error,
    refresh,
    addFeedback,
    updateFeedback,
    deleteFeedback,
  } = useFeedback();

  const CURRENT_USER_ID = "u123";
  const userFeedbacks = feedbacks.filter(f => f.userId === CURRENT_USER_ID);

  const [tabIndex, setTabIndex] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);
  const [ratingFilter, setRatingFilter] = useState<number | undefined>(undefined);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingFeedback, setEditingFeedback] = useState<FeedbackItem | null>(null);

  const handleOpenModal = (feedback?: FeedbackItem) => {
    setEditingFeedback(feedback ?? null);
    setModalVisible(true);
  };

  const handleSubmit = (data: {
    type: "feedback" | "complaint";
    title: string;
    description: string;
    category?: "suggestion" | "compliment" | "general" | "feature_request";
    priority?: "low" | "medium" | "high" | "critical";
    attachments?: FileAttachment[];
    rating?: number;
    targetType: "hospital" | "organization";
    targetId: string;
    targetName: string;
    isAnonymous: boolean;
  }) => {
    if (editingFeedback) {
      updateFeedback(editingFeedback.id, {
        type: data.type,
        title: data.title,
        description: data.description,
      });
    } else {
      addFeedback({
        ...data,
        userId: CURRENT_USER_ID,
        userName: "Savidu Jayaweeera",
        userRole: "user",
      });
    }
  };

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
          {tabIndex === 0 ? "My Feedbacks" : "My Complaints"}
        </Typo>
        <View style={{ width: 40 }} />
      </View>

      {/* Tab Toggle */}
      <View style={styles.tabContainer}>
        <SegmentedControl
          options={["My Feedbacks", "My Complaints"]}
          selectedIndex={tabIndex}
          onChange={setTabIndex}
        />
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <View style={styles.filterRow}>
          <Typo variant="caption" style={{ color: colors.textMuted, marginBottom: 8 }}>
            Category
          </Typo>
          <SegmentedControl
            options={["All", "Suggestion", "Compliment", "General", "Feature Request"]}
            selectedIndex={
              categoryFilter === undefined ? 0 :
              categoryFilter === "suggestion" ? 1 :
              categoryFilter === "compliment" ? 2 :
              categoryFilter === "general" ? 3 :
              categoryFilter === "feature_request" ? 4 : 0
            }
            onChange={(idx) => setCategoryFilter(
              idx === 0 ? undefined :
              idx === 1 ? "suggestion" :
              idx === 2 ? "compliment" :
              idx === 3 ? "general" : "feature_request"
            )}
          />
        </View>

        <View style={styles.filterRow}>
          <Typo variant="caption" style={{ color: colors.textMuted, marginBottom: 8 }}>
            Minimum Rating
          </Typo>
          <SegmentedControl
            options={["All", "1+", "2+", "3+", "4+", "5"]}
            selectedIndex={ratingFilter === undefined ? 0 : ratingFilter}
            onChange={(idx) => setRatingFilter(idx === 0 ? undefined : idx)}
          />
        </View>
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
        ) : (() => {
          // Filter by tab type first
          const feedbackOnly = userFeedbacks.filter(f => f.type === "feedback");
          const complaintsOnly = userFeedbacks.filter(f => f.type === "complaint");
          const tabData = tabIndex === 0 ? feedbackOnly : complaintsOnly;

          if (tabData.length === 0) {
            return (
              <Typo
                variant="body"
                style={{
                  textAlign: "center",
                  color: colors.textMuted,
                  marginTop: 40,
                }}
              >
                {tabIndex === 0
                  ? "You have not submitted any feedback yet."
                  : "You have not submitted any complaints yet."}
              </Typo>
            );
          }

          // Apply category and rating filters
          const filteredData = tabData.filter(f => {
            if (categoryFilter && f.category !== categoryFilter) return false;
            if (ratingFilter !== undefined && (!f.rating || f.rating < ratingFilter)) return false;
            return true;
          });

          return filteredData.length === 0 ? (
            <Typo
              variant="body"
              style={{
                textAlign: "center",
                color: colors.textMuted,
                marginTop: 40,
              }}
            >
              No {tabIndex === 0 ? "feedback" : "complaints"} matches the selected filters.
            </Typo>
          ) : (
            filteredData.map(f => (
              <FeedbackCard
                key={f.id}
                feedback={f}
                currentUserRole="user"
                onEditFeedback={handleOpenModal}
                onDeleteFeedback={deleteFeedback}
              />
            ))
          );
        })()}
      </ScrollView>

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.tint }]}
        onPress={() => handleOpenModal()}
      >
        <MaterialIcons name="add" size={28} color="#FFF" />
      </TouchableOpacity>

      <FeedbackFormModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleSubmit}
        initialData={editingFeedback}
        targetOptions={FEEDBACK_TARGET_OPTIONS}
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
  content: { padding: 16, paddingBottom: 80 },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  filtersContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 16,
  },
  filterRow: {
    gap: 8,
  },
  tabContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
