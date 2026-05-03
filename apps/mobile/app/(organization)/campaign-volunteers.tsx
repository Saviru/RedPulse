import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import {
  getMyCampaignOverviewById,
  LatestCampaignOverview,
  markVolunteerAttendance,
  rejectCampaignVolunteer,
} from "@/apps/mobile/src/lib/organizationService";
import { Badge, Button, Card, Divider, Input, Typo } from "@/packages/ui/components/ui";
import { useThemeColor } from "@/packages/ui/hooks";

type CrewMember = LatestCampaignOverview["crew"][number];

function firstParam(value: string | string[] | undefined) {
  if (value === undefined) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

function memberHasAssignedTask(member: CrewMember): boolean {
  const t = member.assignedTask;
  if (!t) return false;
  return (
    Boolean(t.title?.trim()) ||
    Boolean(t.description?.trim()) ||
    t.assignedAt != null
  );
}

function ProfileRow({
  icon,
  label,
  value,
  colors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  colors: { text: string; textMuted: string; border: string };
}) {
  if (!value.trim()) return null;
  return (
    <View style={styles.profileRow}>
      <View style={[styles.profileIconWrap, { backgroundColor: `${colors.text}0C` }]}>
        <Ionicons name={icon} size={18} color={colors.textMuted} />
      </View>
      <View style={styles.profileRowText}>
        <Typo variant="caption" style={{ color: colors.textMuted, marginBottom: 2 }}>
          {label}
        </Typo>
        <Typo variant="body" style={{ color: colors.text }}>
          {value}
        </Typo>
      </View>
    </View>
  );
}

export default function CampaignVolunteersScreen() {
  const router = useRouter();
  const { colors, theme } = useThemeColor();
  const params = useLocalSearchParams<{ id?: string; name?: string }>();
  const campaignId = firstParam(params.id);
  const campaignName = firstParam(params.name) ?? "Campaign";
  const [overview, setOverview] = useState<LatestCampaignOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [attendanceBusy, setAttendanceBusy] = useState<{
    registrationId: string;
    status: "ATTENDED" | "ABSENT";
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const loadOverview = useCallback(async () => {
    if (!campaignId) return;
    try {
      setLoading(true);
      const data = await getMyCampaignOverviewById(campaignId);
      setOverview(data);
    } catch (error) {
      alert(`Failed to load volunteers: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useFocusEffect(
    useCallback(() => {
      loadOverview();
    }, [loadOverview]),
  );

  const crew = overview?.crew ?? [];

  const filteredCrew = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return crew;
    return crew.filter((m) => {
      const name = (m.name ?? "").toLowerCase();
      const volId = (m.volunteerPublicId ?? "").toLowerCase();
      return name.includes(q) || volId.includes(q);
    });
  }, [crew, searchQuery]);

  const markAttendance = async (registrationId: string, status: "ATTENDED" | "ABSENT") => {
    if (!campaignId) return;
    try {
      setAttendanceBusy({ registrationId, status });
      await markVolunteerAttendance(campaignId, registrationId, status);
      const data = await getMyCampaignOverviewById(campaignId);
      setOverview(data);
    } catch (error) {
      alert(`Failed to update attendance: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setAttendanceBusy(null);
    }
  };

  const cardSurface = colors.surface;
  const innerMuted =
    theme === "dark" ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.045)";

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Typo variant="h2">Registered Volunteers</Typo>
          <Typo variant="caption" style={{ color: colors.textMuted, marginTop: 4 }}>
            {campaignName}
          </Typo>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Input
          label="Search"
          placeholder="Search by name or volunteer ID"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {loading ? (
          <Typo variant="body" style={{ color: colors.textMuted }}>
            Loading volunteers...
          </Typo>
        ) : crew.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Typo variant="body" style={{ color: colors.textMuted }}>
              No registered volunteers yet.
            </Typo>
          </Card>
        ) : filteredCrew.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Typo variant="body" style={{ color: colors.textMuted }}>
              No volunteers match your search.
            </Typo>
          </Card>
        ) : (
          filteredCrew.map((member) => {
            const hasTask = memberHasAssignedTask(member);
            const attendance = member.taskAttendance;
            const attendanceDone =
              attendance?.status === "ATTENDED" || attendance?.status === "ABSENT";
            const pts = member.assignedTask?.points ?? member.points ?? 0;

            return (
              <Card
                key={member.id}
                style={[
                  styles.volunteerCard,
                  {
                    backgroundColor: cardSurface,
                    borderColor: colors.border,
                  },
                ]}
              >
                {/* Header */}
                <View style={styles.cardHeader}>
                  <View style={[styles.avatar, { borderColor: colors.border, backgroundColor: innerMuted }]}>
                    <Ionicons name="person" size={26} color={colors.tint} />
                  </View>
                  <View style={styles.headerText}>
                    <Typo variant="h2" style={{ color: colors.text }}>
                      {member.name}
                    </Typo>
                    <Typo variant="caption" style={{ color: colors.textMuted, marginTop: 4 }}>
                      Volunteer · {member.points ?? 0} pts earned
                    </Typo>
                    {member.volunteerPublicId ? (
                      <View style={[styles.idChip, { borderColor: colors.border, marginTop: 10 }]}>
                        <Ionicons name="id-card-outline" size={14} color={colors.textMuted} />
                        <Typo variant="caption" style={{ color: colors.text, marginLeft: 6, flex: 1 }} numberOfLines={2}>
                          {member.volunteerPublicId}
                        </Typo>
                      </View>
                    ) : null}
                  </View>
                  {attendanceDone ? (
                    <Badge
                      label={attendance!.status === "ATTENDED" ? "Attended" : "Absent"}
                      variant={attendance!.status === "ATTENDED" ? "success" : "danger"}
                    />
                  ) : null}
                </View>

                {/* Task */}
                {hasTask && member.assignedTask ? (
                  <View style={[styles.taskPanel, { backgroundColor: innerMuted, borderColor: colors.border }]}>
                    <View style={styles.taskPanelHeader}>
                      <View style={[styles.taskIconWrap, { backgroundColor: `${colors.tint}22` }]}>
                        <Ionicons name="clipboard-outline" size={20} color={colors.tint} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Typo variant="caption" style={{ color: colors.textMuted, fontWeight: "600" }}>
                          Assigned task
                        </Typo>
                        <Typo variant="h2" style={{ color: colors.text, marginTop: 6, fontSize: 18 }}>
                          {member.assignedTask.title}
                        </Typo>
                      </View>
                      <View style={[styles.pointsPill, { backgroundColor: `${colors.tint}18` }]}>
                        <Typo variant="caption" style={{ color: colors.tint, fontWeight: "700" }}>
                          +{pts} pts
                        </Typo>
                      </View>
                    </View>
                    {member.assignedTask.description?.trim() ? (
                      <Typo variant="body" style={{ color: colors.textMuted, marginTop: 12, lineHeight: 22 }}>
                        {member.assignedTask.description}
                      </Typo>
                    ) : null}
                  </View>
                ) : null}

                <Divider spacing={hasTask ? 18 : 14} />

                <Typo variant="caption" style={{ color: colors.textMuted, fontWeight: "700", marginBottom: 10 }}>
                  Profile
                </Typo>
                <View style={styles.profileBlock}>
                  <ProfileRow
                    icon="home-outline"
                    label="Home town"
                    value={member.homeTown ?? ""}
                    colors={colors}
                  />
                  <ProfileRow
                    icon="call-outline"
                    label="Phone"
                    value={member.phoneNumber ?? ""}
                    colors={colors}
                  />
                  <ProfileRow
                    icon="school-outline"
                    label="Education"
                    value={member.educationalQualification ?? ""}
                    colors={colors}
                  />
                  <ProfileRow
                    icon="ribbon-outline"
                    label="Other qualification"
                    value={member.otherQualification ?? ""}
                    colors={colors}
                  />
                  <ProfileRow
                    icon="chatbubble-ellipses-outline"
                    label="Concerns / notes"
                    value={member.concerns ?? ""}
                    colors={colors}
                  />
                </View>

                <Divider spacing={20} />

                {/* Actions — full width, equal weight */}
                {!hasTask ? (
                  <View style={styles.dualActions}>
                    <Button
                      label="Assign task"
                      variant="primary"
                      icon={<Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />}
                      onPress={() =>
                        router.push({
                          pathname: "/(organization)/campaign-assign-task",
                          params: {
                            name: member.name,
                            campaign: campaignName,
                            campaignId: campaignId ?? "",
                            registrationId: member.id,
                          },
                        } as any)
                      }
                      style={styles.flexBtn}
                    />
                    <Button
                      label="Remove volunteer"
                      variant="danger"
                      icon={<Ionicons name="person-remove-outline" size={18} color={colors.error} />}
                      onPress={async () => {
                        if (!campaignId) return;
                        try {
                          setRejectingId(member.id);
                          await rejectCampaignVolunteer(
                            campaignId,
                            member.id,
                            "Volunteer registration rejected by organization.",
                          );
                          alert("Volunteer removed and notified.");
                          const data = await getMyCampaignOverviewById(campaignId);
                          setOverview(data);
                        } catch (error) {
                          alert(`Failed to remove volunteer: ${error instanceof Error ? error.message : String(error)}`);
                        } finally {
                          setRejectingId(null);
                        }
                      }}
                      disabled={rejectingId === member.id}
                      style={styles.flexBtn}
                    />
                  </View>
                ) : !attendanceDone ? (
                  <View>
                    <Typo variant="caption" style={{ color: colors.textMuted, marginBottom: 12, textAlign: "center" }}>
                      Record whether they showed up for this task
                    </Typo>
                    <View style={styles.dualActions}>
                      <Button
                        label="Attended"
                        variant="primary"
                        icon={<Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />}
                        onPress={() => markAttendance(member.id, "ATTENDED")}
                        disabled={
                          attendanceBusy?.registrationId === member.id
                        }
                        isLoading={
                          attendanceBusy?.registrationId === member.id &&
                          attendanceBusy.status === "ATTENDED"
                        }
                        style={styles.flexBtn}
                      />
                      <Button
                        label="Absent"
                        variant="danger"
                        icon={<Ionicons name="close-circle-outline" size={20} color={colors.error} />}
                        onPress={() => markAttendance(member.id, "ABSENT")}
                        disabled={
                          attendanceBusy?.registrationId === member.id
                        }
                        isLoading={
                          attendanceBusy?.registrationId === member.id &&
                          attendanceBusy.status === "ABSENT"
                        }
                        style={styles.flexBtn}
                      />
                    </View>
                  </View>
                ) : (
                  <View style={styles.doneRow}>
                    <Ionicons
                      name={attendance!.status === "ATTENDED" ? "checkmark-done-circle" : "remove-circle-outline"}
                      size={22}
                      color={attendance!.status === "ATTENDED" ? colors.success : colors.error}
                    />
                    <Typo variant="body" style={{ color: colors.textMuted, marginLeft: 10, flex: 1 }}>
                      {attendance!.status === "ATTENDED"
                        ? "Attendance saved as present."
                        : "Attendance saved as absent."}
                    </Typo>
                  </View>
                )}
              </Card>
            );
          })
        )}
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
  backButton: { marginRight: 12 },
  content: { padding: 20, paddingBottom: 32, gap: 16 },
  emptyCard: { padding: 20 },
  volunteerCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  idChip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    maxWidth: "100%",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  taskPanel: {
    marginTop: 16,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  taskPanelHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  taskIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  pointsPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  profileBlock: {
    gap: 4,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 10,
  },
  profileIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  profileRowText: {
    flex: 1,
    minWidth: 0,
  },
  dualActions: {
    flexDirection: "row",
    gap: 12,
  },
  flexBtn: {
    flex: 1,
    minHeight: 48,
  },
  doneRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
  },
});
