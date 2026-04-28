import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, View, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { Button, Divider, Typo, Input, Select } from "@/packages/ui/components/ui";
import { useThemeColor } from "@/packages/ui/hooks";
import { assignVolunteerTask } from "@/apps/mobile/src/services/organizationService";
import { getApiErrorMessage } from "@/apps/mobile/src/services/apiClient";

function firstParam(value: string | string[] | undefined) {
  if (value === undefined) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

export default function CampaignAssignTaskScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    name?: string;
    campaign?: string;
    campaignId?: string;
    registrationId?: string;
  }>();
  const { colors } = useThemeColor();

  const volunteerName = firstParam(params.name) ?? "Volunteer";
  const campaignName = firstParam(params.campaign) ?? "Campaign";
  const campaignId = firstParam(params.campaignId);
  const registrationId = firstParam(params.registrationId);

  const [taskTitle, setTaskTitle] = useState("");
  const [description, setDescription] = useState("");
  const [points, setPoints] = useState("50");
  const [submitting, setSubmitting] = useState(false);

  const commonRoles = [
    "Registration Assistant",
    "Logistics Help",
    "Refreshment Manager",
    "First Aid Support",
    "Crowd Control",
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Typo variant="h2">Assign Task</Typo>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.infoSection}>
          <Typo variant="body" style={{ color: colors.textMuted }}>Assigning a task to:</Typo>
          <Typo variant="h2">{volunteerName}</Typo>
          <Typo variant="caption" style={{ color: colors.tint }}>Campaign: {campaignName}</Typo>
        </View>

        <Divider spacing={24} />

        <View style={styles.formSection}>
          <Typo variant="h2" style={styles.sectionTitle}>Task Details</Typo>

          <Select
            label="Common Roles"
            placeholder="Select a common role"
            value={taskTitle}
            options={commonRoles}
            onSelect={setTaskTitle}
          />

          <View style={{ height: 10 }} />

          <Input
            label="Custom Title"
            placeholder="Or enter a custom title"
            value={taskTitle}
            onChangeText={setTaskTitle}
          />

          <Input
            label="Description / Instructions"
            placeholder="Explain what the volunteer needs to do..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            style={{ height: 100, textAlignVertical: "top" }}
          />

          <Input
            label="Reward Points"
            placeholder="e.g. 50"
            value={points}
            onChangeText={setPoints}
            keyboardType="numeric"
          />
        </View>

        <View style={{ height: 40 }} />

        <Button
          label="Confirm Assignment"
          onPress={async () => {
            if (!campaignId || !registrationId) {
              alert("Missing campaign or volunteer registration. Open Assign from the volunteer list.");
              return;
            }
            if (!taskTitle.trim()) {
              alert("Please provide a task title.");
              return;
            }
            const pts = Number.parseInt(points, 10);
            try {
              setSubmitting(true);
              await assignVolunteerTask(campaignId, registrationId, {
                title: taskTitle.trim(),
                description: description.trim(),
                points: Number.isNaN(pts) ? 0 : pts,
              });
              alert(`Task "${taskTitle.trim()}" assigned to ${volunteerName}.`);
              router.back();
            } catch (error) {
              alert(`Assignment failed: ${getApiErrorMessage(error)}`);
            } finally {
              setSubmitting(false);
            }
          }}
          style={styles.submitButton}
          disabled={submitting}
        />
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
  infoSection: { marginBottom: 10 },
  formSection: { gap: 15 },
  sectionTitle: { marginBottom: 5 },
  submitButton: { marginTop: 20, marginBottom: 40 },
});
