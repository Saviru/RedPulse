import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

import { Typo, FeedbackCard, FeedbackFormModal, SegmentedControl, type FileAttachment, type FeedbackFormPayload } from "@/packages/ui/components/ui";
import { useThemeColor, useFeedback } from "@/packages/ui/hooks";
import {
  FEEDBACK_TARGET_OPTIONS,
  type FeedbackItem,
} from "@/packages/ui/constants/mockFeedback";
import { useAuth } from "@/apps/mobile/src/context/AuthContext";

const CATEGORY_OPTIONS = ["All", "Suggestion", "Compliment", "General", "Feature Request"];
const RATING_OPTIONS = ["All", "1+", "2+", "3+", "4+", "5"];
const TAB_OPTIONS = ["My Feedback", "My Complaints"];

export default function UserFeedbackScreen() {
  const router = useRouter();
  const { colors } = useThemeColor();
  const { user } = useAuth();
  const { feedbacks, addFeedback, updateFeedback, deleteFeedback, updateComplaint, isLoading, refresh } = useFeedback();

  const [tabIndex, setTabIndex] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);
  const [ratingFilter, setRatingFilter] = useState<number | undefined>(undefined);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingFeedback, setEditingFeedback] = useState<FeedbackItem | null>(null);

  // Filter feedbacks for current user
  const userFeedbacks = feedbacks.filter(f => f.username === user?.username);
  const complaints = userFeedbacks.filter(f => f.type === "complaint");
  const feedbacksOnly = userFeedbacks.filter(f => f.type === "feedback");

  const handleOpenModal = (feedback?: FeedbackItem) => {
    setEditingFeedback(feedback ?? null);
    setModalVisible(true);
  };

  const handleRateResolution = async (feedbackId: string, rating: number, feedback: string) => {
    try {
      await updateComplaint(feedbackId, { rating, resolutionFeedback: feedback });
      Alert.alert("Success", "Thank you for your rating!");
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to submit rating");
    }
  };

  const handleSubmit = async (data: FeedbackFormPayload) => {
    try {
      if (editingFeedback) {
        await updateFeedback(editingFeedback.id, {
          type: data.type,
          title: data.title,
          description: data.description,
          category: data.category,
        });
      } else {
        if (!user) {
          Alert.alert("Error", "You must be logged in to submit feedback");
          return;
        }
        await addFeedback({
          ...data,
          username: user.username,
          userName: user.fullName || user.username,
          userRole: "user",
        });
      }
      Alert.alert("Success", editingFeedback ? "Feedback updated" : "Feedback submitted successfully");
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to save feedback");
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      "Delete Feedback",
      "Are you sure you want to delete this feedback?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              await deleteFeedback(id);
            } catch (error) {
              Alert.alert("Error", error instanceof Error ? error.message : "Failed to delete");
            }
          }
        }
      ]
    );
  };

  return (
    <React.Fragment>
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
            options={TAB_OPTIONS}
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
                options={CATEGORY_OPTIONS}
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
              options={RATING_OPTIONS}
              selectedIndex={ratingFilter === undefined ? 0 : ratingFilter}
              onChange={(idx) => setRatingFilter(idx === 0 ? undefined : idx)}
            />
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refresh} />
          }
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
                  onDeleteFeedback={handleDelete}
                  onRateResolution={handleRateResolution}
                />
              ))
            );
          })()}
        </ScrollView>

        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.tint }]}
          onPress={() => {
            console.log("[Feedback] FAB pressed");
            handleOpenModal();
          }}
        >
          <MaterialIcons name="add" size={28} color="#FFF" />
        </TouchableOpacity>
      </SafeAreaView>

      <FeedbackFormModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleSubmit}
        initialData={editingFeedback}
        targetOptions={FEEDBACK_TARGET_OPTIONS}
      />
    </React.Fragment>
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
    zIndex: 10,
  },
});
