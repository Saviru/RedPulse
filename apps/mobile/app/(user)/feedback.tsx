import React, { useState } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

import { Typo, FeedbackCard, FeedbackFormModal, SegmentedControl, type FileAttachment, type FeedbackFormPayload } from "@/packages/ui/components/ui";
import { useThemeColor, useFeedback } from "@/packages/ui/hooks";
import {
  FEEDBACK_TARGET_OPTIONS,
  type FeedbackItem,
} from "@/packages/ui/constants/mockFeedback";

export default function UserFeedbackScreen() {
  const router = useRouter();
  const { colors } = useThemeColor();
  const { feedbacks, addFeedback, updateFeedback, deleteFeedback, updateComplaint } = useFeedback();

  const CURRENT_USER_ID = "u123";
  const userFeedbacks = feedbacks.filter(f => f.userId === CURRENT_USER_ID);

  const complaints = userFeedbacks.filter(f => f.type === "complaint");
  const feedbacksOnly = userFeedbacks.filter(f => f.type === "feedback");

  const [tabIndex, setTabIndex] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);
  const [ratingFilter, setRatingFilter] = useState<number | undefined>(undefined);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingFeedback, setEditingFeedback] = useState<FeedbackItem | null>(null);

  const handleOpenModal = (feedback?: FeedbackItem) => {
    setEditingFeedback(feedback ?? null);
    setModalVisible(true);
  };

  const handleRateResolution = (feedbackId: string, rating: number, feedback: string) => {
    updateComplaint(feedbackId, { rating, resolutionFeedback: feedback });
  };

  const handleSubmit = (data: FeedbackFormPayload) => {
    if (editingFeedback) {
      updateFeedback(editingFeedback.id, {
        type: data.type,
        title: data.title,
        description: data.description,
        category: data.category,
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
          My Feedbacks
        </Typo>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.tabsContainer}>
        <SegmentedControl
          options={["My Feedback", "My Complaints"]}
          selectedIndex={tabIndex}
          onChange={setTabIndex}
        />
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        {tabIndex === 0 && (
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
        )}

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
        {(() => {
          let filteredFeedbacks = tabIndex === 0 ? feedbacksOnly : complaints;
          
          // Apply category filter (only for feedback)
          if (tabIndex === 0 && categoryFilter) {
            filteredFeedbacks = filteredFeedbacks.filter(f => f.category === categoryFilter);
          }
          
          // Apply rating filter
          if (ratingFilter !== undefined) {
            filteredFeedbacks = filteredFeedbacks.filter(f => f.rating && f.rating >= ratingFilter);
          }
          
          return filteredFeedbacks.length === 0 ? (
            <Typo
              variant="body"
              style={{
                textAlign: "center",
                color: colors.textMuted,
                marginTop: 40,
              }}
            >
              {tabIndex === 0 ? "You have not submitted any feedback yet." : "You have not submitted any complaints yet."}
            </Typo>
          ) : (
            filteredFeedbacks.map(f => (
              <FeedbackCard
                key={f.id}
                feedback={f}
                currentUserRole="user"
                onEditFeedback={handleOpenModal}
                onDeleteFeedback={deleteFeedback}
                onRateResolution={handleRateResolution}
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
  tabsContainer: { paddingHorizontal: 16, paddingVertical: 12 },
  filtersContainer: { paddingHorizontal: 16, paddingBottom: 12 },
  filterRow: { marginBottom: 16 },
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
});