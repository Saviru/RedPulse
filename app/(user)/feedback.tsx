import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

import {
  Button,
  FeedbackCard,
  FeedbackFormModal,
  SegmentedControl,
  Typo,
  type FeedbackFormPayload,
} from "@/packages/ui/components/ui";
import { useFeedback, useThemeColor } from "@/packages/ui/hooks";
import {
  FEEDBACK_TARGET_OPTIONS,
  type FeedbackCategory,
  type FeedbackItem,
} from "@/packages/ui/constants/mockFeedback";

// TODO: replace with the authenticated user once auth lands.
const CURRENT_USER_ID = "u123";
const CURRENT_USER_NAME = "Savidu Jayaweeera";

const TAB_OPTIONS = ["My Feedbacks", "My Complaints"] as const;

const CATEGORY_FILTER_LABELS = [
  "All",
  "Suggestion",
  "Compliment",
  "General",
  "Feature Request",
] as const;

const CATEGORY_FILTER_VALUES: (FeedbackCategory | undefined)[] = [
  undefined,
  "suggestion",
  "compliment",
  "general",
  "feature_request",
];

const RATING_FILTER_LABELS = ["All", "1+", "2+", "3+", "4+", "5"] as const;

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

  const [tabIndex, setTabIndex] = useState(0);
  const [categoryIndex, setCategoryIndex] = useState(0);
  const [ratingIndex, setRatingIndex] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingFeedback, setEditingFeedback] = useState<FeedbackItem | null>(null);

  const userFeedbacks = useMemo(
    () => feedbacks.filter(f => f.userId === CURRENT_USER_ID),
    [feedbacks],
  );

  const tabbedFeedbacks = useMemo(() => {
    const targetType = tabIndex === 0 ? "feedback" : "complaint";
    return userFeedbacks.filter(f => f.type === targetType);
  }, [userFeedbacks, tabIndex]);

  const filteredFeedbacks = useMemo(() => {
    const categoryFilter = CATEGORY_FILTER_VALUES[categoryIndex];
    const minRating = ratingIndex === 0 ? undefined : ratingIndex;

    return tabbedFeedbacks.filter(f => {
      if (categoryFilter && f.category !== categoryFilter) return false;
      if (minRating !== undefined && (!f.rating || f.rating < minRating)) {
        return false;
      }
      return true;
    });
  }, [tabbedFeedbacks, categoryIndex, ratingIndex]);

  const openCreateModal = () => {
    setEditingFeedback(null);
    setModalVisible(true);
  };

  const openEditModal = (feedback: FeedbackItem) => {
    setEditingFeedback(feedback);
    setModalVisible(true);
  };

  const handleSubmit = (data: FeedbackFormPayload) => {
    if (editingFeedback) {
      updateFeedback(editingFeedback.id, {
        type: data.type,
        title: data.title,
        description: data.description,
        category: data.category,
        attachments: data.attachments,
        priority: data.priority,
        rating: data.rating,
        isAnonymous: data.isAnonymous,
      });
    } else {
      addFeedback({
        ...data,
        userId: CURRENT_USER_ID,
        userName: CURRENT_USER_NAME,
        userRole: "user",
      });
    }
  };

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

    if (tabbedFeedbacks.length === 0) {
      return (
        <Typo variant="body" style={[styles.emptyText, { color: colors.textMuted }]}>
          {tabIndex === 0
            ? "You have not submitted any feedback yet."
            : "You have not submitted any complaints yet."}
        </Typo>
      );
    }

    if (filteredFeedbacks.length === 0) {
      return (
        <Typo variant="body" style={[styles.emptyText, { color: colors.textMuted }]}>
          No {tabIndex === 0 ? "feedback" : "complaints"} match the selected filters.
        </Typo>
      );
    }

    return filteredFeedbacks.map(f => (
      <FeedbackCard
        key={f.id}
        feedback={f}
        currentUserRole="user"
        onEditFeedback={openEditModal}
        onDeleteFeedback={deleteFeedback}
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
          {TAB_OPTIONS[tabIndex]}
        </Typo>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.tabContainer}>
        <SegmentedControl
          options={[...TAB_OPTIONS]}
          selectedIndex={tabIndex}
          onChange={setTabIndex}
        />
      </View>

      {tabIndex === 0 && (
        <View style={styles.filtersContainer}>
          <View style={styles.filterRow}>
            <Typo
              variant="caption"
              style={[styles.filterLabel, { color: colors.textMuted }]}
            >
              Category
            </Typo>
            {/* Category labels can be too long for a SegmentedControl's equal
                segments (they wrap onto multiple lines), so use a horizontally
                scrollable chip row instead — chips stay at their natural width
                and the user can scroll if they overflow. */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              {CATEGORY_FILTER_LABELS.map((label, idx) => {
                const selected = categoryIndex === idx;
                return (
                  <TouchableOpacity
                    key={label}
                    onPress={() => setCategoryIndex(idx)}
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
            </ScrollView>
          </View>

          <View style={styles.filterRow}>
            <Typo
              variant="caption"
              style={[styles.filterLabel, { color: colors.textMuted }]}
            >
              Minimum Rating
            </Typo>
            <SegmentedControl
              options={[...RATING_FILTER_LABELS]}
              selectedIndex={ratingIndex}
              onChange={setRatingIndex}
            />
          </View>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {renderListBody()}
      </ScrollView>

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.tint }]}
        onPress={openCreateModal}
        accessibilityRole="button"
        accessibilityLabel="Submit new feedback"
      >
        <MaterialIcons name="add" size={28} color="#FFFFFF" />
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
  emptyText: { textAlign: "center", marginTop: 40 },
  errorBox: { alignItems: "center", marginTop: 40, gap: 12 },
  tabContainer: { paddingHorizontal: 16, paddingVertical: 12 },
  filtersContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 16,
  },
  filterRow: { gap: 8 },
  filterLabel: { marginBottom: 4 },
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
