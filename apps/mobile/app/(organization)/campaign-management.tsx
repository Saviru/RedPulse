import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet, View, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { Button, Divider, Typo, Card } from "@/packages/ui/components/ui";
import { useThemeColor } from "@/packages/ui/hooks";
import {
  getMyCampaignOverviewById,
  getMyLatestCampaignOverview,
  LatestCampaignOverview,
} from "@/apps/mobile/src/services/organizationService";
import { getApiErrorMessage } from "@/apps/mobile/src/services/apiClient";

export default function CampaignManagementScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const { colors } = useThemeColor();
  const [overview, setOverview] = useState<LatestCampaignOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOverview = async () => {
      try {
        setLoading(true);
        const campaignId = Array.isArray(params.id) ? params.id[0] : params.id;
        const data = campaignId
          ? await getMyCampaignOverviewById(campaignId)
          : await getMyLatestCampaignOverview();
        setOverview(data);
      } catch (error) {
        alert(`Failed to load campaign details: ${getApiErrorMessage(error)}`);
      } finally {
        setLoading(false);
      }
    };
    loadOverview();
  }, [params.id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted": return "#4ade80";
      case "pending": return "#fbbf24";
      case "rejected": return "#f87171";
      default: return colors.textMuted;
    }
  };

  const hospital = overview?.hospital;
  const campaign = overview?.campaign;
  const crew = overview?.crew ?? [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Typo variant="h2">Campaign Management</Typo>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <Typo variant="body" style={{ color: colors.textMuted }}>
            Loading campaign data...
          </Typo>
        ) : (
          <View style={styles.list}>
            <Typo variant="h2" style={{ marginBottom: 10 }}>Managing Hospital</Typo>
            <Typo variant="body" style={{ color: colors.textMuted, marginBottom: 20 }}>
              The selected hospital responsible for collecting and storing blood units from this campaign.
            </Typo>
            {!campaign || !hospital ? (
              <Card style={styles.card}>
                <Typo variant="body" style={{ color: colors.textMuted }}>
                  No campaign/hospital data found yet.
                </Typo>
              </Card>
            ) : (
              <Card style={styles.card}>
                <View style={styles.cardRow}>
                  <View style={{ flex: 1 }}>
                    <Typo variant="h2">{hospital.name}</Typo>
                    <Typo variant="body" style={{ color: colors.textMuted, marginTop: 4 }}>
                      {hospital.address}
                    </Typo>
                    <View style={styles.statusRow}>
                      <View style={[styles.statusDot, { backgroundColor: getStatusColor(hospital.status) }]} />
                      <Typo variant="caption" style={{ color: getStatusColor(hospital.status), textTransform: "capitalize" }}>
                        Connection {hospital.status}
                      </Typo>
                    </View>
                  </View>
                  <Ionicons
                    name={hospital.status === "accepted" ? "checkmark-circle" : "ellipse"}
                    size={32}
                    color={getStatusColor(hospital.status)}
                  />
                </View>

                <Divider spacing={20} />

                <View style={styles.syncRow}>
                  <Ionicons name="sync" size={16} color={colors.textMuted} />
                  <Typo variant="caption" style={{ color: colors.textMuted, marginLeft: 6 }}>
                    Last synced: {new Date(campaign.updatedAt).toLocaleString()}
                  </Typo>
                </View>

                <Button
                  label="Change Hospital"
                  variant="secondary"
                  onPress={() =>
                    router.push({
                      pathname: "/(organization)/campaign-change-hospital",
                      params: {
                        campaignId: campaign.id,
                        campaignName: campaign.name,
                        location: campaign.location,
                        hospital: hospital.name,
                      },
                    })
                  }
                  style={{ marginTop: 20 }}
                />
                <Button
                  label={`View Registered Volunteers (${crew.length})`}
                  variant="primary"
                  onPress={() =>
                    router.push({
                      pathname: "/(organization)/campaign-volunteers",
                      params: {
                        id: campaign.id,
                        name: campaign.name,
                      },
                    } as any)
                  }
                  style={{ marginTop: 10 }}
                />
              </Card>
            )}
          </View>
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
  backButton: { marginRight: 15 },
  content: { padding: 24 },
  list: { gap: 15 },
  card: { padding: 20 },
  cardRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  statusRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  syncRow: { flexDirection: "row", alignItems: "center" },
});
