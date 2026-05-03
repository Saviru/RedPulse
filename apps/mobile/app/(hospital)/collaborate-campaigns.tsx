import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, View, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { Button, Divider, Typo, Card } from "@/packages/ui/components/ui";
import { useThemeColor } from "@/packages/ui/hooks";
import {
  acceptHospitalRequest,
  getHospitalCollaborations,
  HospitalCollaboration,
  rejectHospitalRequest,
} from "@/apps/mobile/src/lib/campaignService";

type CollaborationStatus = "pending" | "accepted" | "rejected";

type CollaborationRequest = {
  id: string;
  attemptId: string;
  organization: string;
  campName: string;
  dateLabel: string;
  timeLabel: string;
  location: string;
  coordinator: string;
  coordinatorPhone: string;
  maxDonors: number;
  status: CollaborationStatus;
};

export default function CollaborateCampaignsScreen() {
  const router = useRouter();
  const { colors } = useThemeColor();
  const [requests, setRequests] = useState<CollaborationRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const mapToUi = (item: HospitalCollaboration): CollaborationRequest => {
    const date = new Date(item.date);
    const start = new Date(item.startTime);
    const end = new Date(item.endTime);
    return {
      id: item.campaignId,
      attemptId: item.attemptId,
      organization: item.organizationName,
      campName: item.campaignName,
      dateLabel: Number.isNaN(date.getTime()) ? item.date : date.toDateString(),
      timeLabel: `${start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - ${end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
      location: item.location,
      coordinator: item.coordinatorName,
      coordinatorPhone: item.coordinatorPhone,
      maxDonors: item.maxCapacity,
      status: item.status.toLowerCase() as CollaborationStatus,
    };
  };

  const loadCollaborations = useCallback(async () => {
    try {
      setLoading(true);
      const collaborations = await getHospitalCollaborations();
      setRequests(collaborations.map(mapToUi));
    } catch (error) {
      alert(`Failed to load requests: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCollaborations();
  }, [loadCollaborations]);

  const pending = useMemo(
    () => requests.filter((r) => r.status === "pending"),
    [requests],
  );

  const responded = useMemo(
    () => requests.filter((r) => r.status !== "pending"),
    [requests],
  );

  const setStatus = async (attemptId: string, id: string, status: CollaborationStatus) => {
    try {
      if (status === "accepted") {
        await acceptHospitalRequest(attemptId);
      } else {
        await rejectHospitalRequest(attemptId, "Not available for this campaign schedule");
      }
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
      alert(
        status === "accepted"
          ? "Collaboration accepted. Organizer notified."
          : "Collaboration declined. Organizer notified.",
      );
    } catch (error) {
      alert(`Action failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const renderCard = (item: CollaborationRequest, showActions: boolean) => (
    <Card key={item.id} style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Typo variant="caption" style={{ color: colors.textMuted, marginBottom: 4 }}>
            {item.organization}
          </Typo>
          <Typo variant="h2">{item.campName}</Typo>
        </View>
        {!showActions && (
          <View
            style={[
              styles.statusPill,
              {
                backgroundColor:
                  item.status === "accepted"
                    ? "rgba(52, 199, 89, 0.15)"
                    : "rgba(255, 59, 48, 0.12)",
              },
            ]}
          >
            <Typo
              variant="caption"
              style={{
                color: item.status === "accepted" ? colors.success : colors.tint,
                fontWeight: "700",
                textTransform: "capitalize",
              }}
            >
              {item.status}
            </Typo>
          </View>
        )}
      </View>

      <View style={styles.metaRow}>
        <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
        <Typo variant="body" style={[styles.metaText, { color: colors.textMuted }]}>
          {item.dateLabel} · {item.timeLabel}
        </Typo>
      </View>
      <View style={styles.metaRow}>
        <Ionicons name="location-outline" size={16} color={colors.textMuted} />
        <Typo variant="body" style={[styles.metaText, { color: colors.textMuted }]}>
          {item.location}
        </Typo>
      </View>
      <View style={styles.metaRow}>
        <Ionicons name="person-outline" size={16} color={colors.textMuted} />
        <Typo variant="body" style={[styles.metaText, { color: colors.textMuted }]}>
          {item.coordinator} · {item.coordinatorPhone}
        </Typo>
      </View>
      <Typo variant="caption" style={{ color: colors.textMuted, marginTop: 8 }}>
        Max. donor capacity: {item.maxDonors}
      </Typo>

      {showActions && (
        <>
          <Divider spacing={16} />
          <View style={styles.actions}>
            <Button
              label="Accept"
              variant="primary"
              onPress={() => setStatus(item.attemptId, item.id, "accepted")}
              style={{ flex: 1 }}
            />
            <Button
              label="Reject"
              variant="secondary"
              onPress={() => setStatus(item.attemptId, item.id, "rejected")}
              style={{ flex: 1 }}
            />
          </View>
        </>
      )}
      {!showActions && item.status === "accepted" && (
        <>
          <Divider spacing={16} />
          <Button
            label="View verified donors"
            variant="secondary"
            onPress={() => 
              router.push({
                pathname: "/(hospital)/campaign-donors",
                params: {
                  campaignId: item.id,
                  campaignName: item.campName,
                },
              } as any)
            }
          />
        </>
      )}
    </Card>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Typo variant="h2">Collaborate campaigns</Typo>
          <Typo variant="caption" style={{ color: colors.textMuted, marginTop: 4 }}>
            When organizers create a camp and choose your hospital, requests appear
            here. Accept to collaborate or reject to decline.
          </Typo>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Typo variant="body" style={{ fontWeight: "700", marginBottom: 12, color: colors.text }}>
          Pending ({pending.length})
        </Typo>
        {loading ? (
          <View style={styles.empty}>
            <Typo variant="body" style={{ color: colors.textMuted }}>
              Loading...
            </Typo>
          </View>
        ) : pending.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="mail-open-outline" size={48} color={colors.border} />
            <Typo variant="body" style={{ color: colors.textMuted, marginTop: 12, textAlign: "center" }}>
              No collaboration requests right now. New camps from organizers will show
              up here.
            </Typo>
          </View>
        ) : (
          pending.map((item) => renderCard(item, true))
        )}

        {responded.length > 0 && (
          <>
            <Typo
              variant="body"
              style={{
                fontWeight: "700",
                marginTop: 24,
                marginBottom: 12,
                color: colors.text,
              }}
            >
              Recent decisions
            </Typo>
            {responded.map((item) => renderCard(item, false))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: { marginRight: 12, marginTop: 2 },
  content: { paddingHorizontal: 20, paddingBottom: 32, gap: 12 },
  card: { padding: 16 },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  metaText: { marginLeft: 8, flex: 1 },
  actions: { flexDirection: "row", gap: 12, marginTop: 4 },
  empty: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
});
