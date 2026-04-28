import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { StyleSheet, View, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { Button, Divider, Typo, Card } from "@/packages/ui/components/ui";
import { useThemeColor } from "@/packages/ui/hooks";
import {
  getMyCampaignRegistrations,
  getPublishedCampaigns,
  PublicCampaign,
} from "@/apps/mobile/src/services/campaignService";
import { getApiErrorMessage } from "@/apps/mobile/src/services/apiClient";

export default function CampaignVolunteerScreen() {
  const router = useRouter();
  const { colors } = useThemeColor();
  const [availableCampaigns, setAvailableCampaigns] = useState<PublicCampaign[]>([]);
  const [registrationStatuses, setRegistrationStatuses] = useState<
    Record<string, string | undefined>
  >({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [data, registrations] = await Promise.all([
        getPublishedCampaigns(),
        getMyCampaignRegistrations(),
      ]);
      setAvailableCampaigns(data);
      const nextStatuses: Record<string, string | undefined> = {};
      registrations.forEach((entry) => {
        nextStatuses[entry.campaignId] = entry.volunteer?.status;
      });
      setRegistrationStatuses(nextStatuses);
    } catch (error) {
      alert(`Failed to load campaigns: ${getApiErrorMessage(error)}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Typo variant="h2">Volunteer for Campaign</Typo>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Typo variant="body" style={{ color: colors.textMuted, marginBottom: 20 }}>
          Join as a volunteer, help the community and earn points for your service.
        </Typo>

        {loading ? (
          <Card style={styles.card}>
            <Typo variant="body" style={{ color: colors.textMuted }}>Loading campaigns...</Typo>
          </Card>
        ) : availableCampaigns.map((campaign) => {
          const registrationStatus = registrationStatuses[campaign._id];
          const disabled = registrationStatus === "REGISTERED" || registrationStatus === "CANCELLED";
          const buttonLabel =
            registrationStatus === "REGISTERED"
              ? "Already Registered"
              : registrationStatus === "CANCELLED"
                ? "Registration Rejected"
                : "Join as Volunteer";

          return (
          <Card key={campaign._id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Typo variant="h2">{campaign.name}</Typo>
                <Typo variant="caption" style={{ color: colors.textMuted }}>By {campaign.organizationName}</Typo>
              </View>
              <View style={[styles.pointsBadge, { backgroundColor: colors.tint + "20" }]}>
                <Typo variant="caption" style={{ fontWeight: "700", color: colors.tint }}>100 pts</Typo>
              </View>
            </View>
            
            <View style={styles.detailsRow}>
              <Ionicons name="location-outline" size={16} color={colors.textMuted} />
              <Typo variant="body" style={{ color: colors.textMuted, marginLeft: 5 }}>{campaign.location}</Typo>
            </View>
            
            <View style={styles.detailsRow}>
              <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
              <Typo variant="body" style={{ color: colors.textMuted, marginLeft: 5 }}>{new Date(campaign.date).toDateString()}</Typo>
            </View>

            <View style={styles.detailsRow}>
              <Ionicons name="people-outline" size={16} color={colors.textMuted} />
              <Typo variant="body" style={{ color: colors.textMuted, marginLeft: 5 }}>Open for volunteers</Typo>
            </View>

            <Divider spacing={16} />
            <Button
              label={buttonLabel}
              variant="primary"
              disabled={disabled}
              onPress={() =>
                router.push({
                  pathname: "/(user)/campaign-registration",
                  params: {
                    campId: campaign._id,
                    role: "volunteer",
                    title: campaign.name,
                    organization: campaign.organizationName,
                    hospital: campaign.currentHospitalName,
                    date: new Date(campaign.date).toDateString(),
                    time: `${new Date(campaign.startTime).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })} - ${new Date(campaign.endTime).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}`,
                    location: campaign.location,
                    volunteerPoints: "100",
                  },
                } as any)
              }
            />
          </Card>
        )})}
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
  card: { padding: 15, marginBottom: 15 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  pointsBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  detailsRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
});
