import { useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, View, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { Button, Divider, Typo, Card } from "@/packages/ui/components/ui";
import { useThemeColor } from "@/packages/ui/hooks";

export default function CampaignTasksScreen() {
  const router = useRouter();
  const { colors } = useThemeColor();

  const assignedTasks = [
    { id: "1", title: "Assist in Registration", campaignTitle: "Summer Blood Drive 2024", status: "In Progress", points: 50 },
    { id: "2", title: "Manage Refreshments", campaignTitle: "Summer Blood Drive 2024", status: "Not Started", points: 30 },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Typo variant="h2">My Campaign Tasks</Typo>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.pointsOverview}>
          <Typo variant="h2">Points Overview</Typo>
          <View style={styles.pointsRow}>
            <Typo variant="h1" style={{ color: colors.tint }}>450</Typo>
            <Typo variant="body" style={{ color: colors.textMuted, marginLeft: 10 }}>Total Points Earned</Typo>
          </View>
        </Card>

        <Divider spacing={24} />

        <Typo variant="h2" style={{ marginBottom: 15 }}>Assigned Tasks</Typo>

        {assignedTasks.map((task) => (
          <Card key={task.id} style={styles.taskCard}>
            <View style={styles.taskHeader}>
              <View style={{ flex: 1 }}>
                <Typo variant="body" style={{ fontWeight: "700" }}>{task.title}</Typo>
                <Typo variant="caption" style={{ color: colors.textMuted }}>{task.campaignTitle}</Typo>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: task.status === "In Progress" ? colors.tint + "15" : colors.border + "50" }]}>
                <Typo variant="caption" style={{ fontWeight: "700", color: task.status === "In Progress" ? colors.tint : colors.textMuted }}>{task.status}</Typo>
              </View>
            </View>
            
            <View style={styles.taskFooter}>
              <Typo variant="caption" style={{ color: colors.textMuted }}>Task points: {task.points}</Typo>
              {task.status === "In Progress" && (
                <Button
                  label="Complete"
                  variant="primary"
                  onPress={() => alert("Task Marked as Completed!")}
                  style={{ paddingHorizontal: 15, height: 32 }}
                />
              )}
            </View>
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: { marginRight: 15 },
  content: { padding: 20 },
  pointsOverview: { padding: 20, alignItems: "center" },
  pointsRow: { flexDirection: "row", alignItems: "baseline", marginTop: 10 },
  taskCard: { padding: 15, marginBottom: 12 },
  taskHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  taskFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 16 },
});
