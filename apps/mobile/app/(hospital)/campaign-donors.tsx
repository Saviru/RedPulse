import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

import { getHospitalVerifiedDonors, HospitalVerifiedDonor } from "@/apps/mobile/src/lib/organizationService";
import { Badge, Button, Card, Divider, Input, Typo } from "@/packages/ui/components/ui";
import { useThemeColor } from "@/packages/ui/hooks";

function firstParam(value: string | string[] | undefined) {
  if (value === undefined) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

export default function CampaignDonorsScreen() {
  const router = useRouter();
  const { colors, theme } = useThemeColor();
  const params = useLocalSearchParams<{ campaignId?: string; campaignName?: string }>();
  const campaignId = firstParam(params.campaignId);
  const campaignName = firstParam(params.campaignName) ?? "Campaign";
  
  const [donors, setDonors] = useState<HospitalVerifiedDonor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const loadDonors = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getHospitalVerifiedDonors();
      // Filter by campaign if ID is provided
      if (campaignId) {
        setDonors(data.filter(d => d.campaignId === campaignId));
      } else {
        setDonors(data);
      }
    } catch (error) {
      console.error("Failed to load donors:", error);
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useFocusEffect(
    useCallback(() => {
      loadDonors();
    }, [loadDonors]),
  );

  const filteredDonors = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return donors;
    return donors.filter((d) => {
      const name = (d.fullName ?? "").toLowerCase();
      const donorId = (d.donorPublicId ?? "").toLowerCase();
      return name.includes(q) || donorId.includes(q);
    });
  }, [donors, searchQuery]);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "DONATION_COMPLETED": return "success";
      case "READY_FOR_DONATION": return "info";
      case "REJECTED_SCREENING":
      case "REJECTED_DOCTOR_VERIFICATION":
      case "REJECTED_FINAL_VERIFICATION": return "danger";
      default: return "warning";
    }
  };

  const getStatusLabel = (status: string) => {
    return status.replace(/_/g, " ");
  };

  const innerMuted = theme === "dark" ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.045)";

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Typo variant="h2">Verified Donors</Typo>
          <Typo variant="caption" style={{ color: colors.textMuted, marginTop: 4 }}>
            {campaignName}
          </Typo>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Input
          placeholder="Search by name or donor ID"
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<Ionicons name="search" size={20} color={colors.textMuted} />}
        />

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={colors.tint} />
            <Typo variant="body" style={{ color: colors.textMuted, marginTop: 12 }}>
              Loading donors...
            </Typo>
          </View>
        ) : donors.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="people-outline" size={48} color={colors.border} />
            <Typo variant="body" style={{ color: colors.textMuted, marginTop: 12, textAlign: "center" }}>
              No verified donors registered for this campaign yet.
            </Typo>
          </Card>
        ) : filteredDonors.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Typo variant="body" style={{ color: colors.textMuted }}>
              No donors match your search.
            </Typo>
          </Card>
        ) : (
          filteredDonors.map((donor) => (
            <Card
              key={donor.id}
              style={[
                styles.donorCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <TouchableOpacity 
                activeOpacity={0.7}
                onPress={() => router.push({
                  pathname: "/(hospital)/donor-donation-details",
                  params: { registrationId: donor.id }
                } as any)}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.bloodBadge, { backgroundColor: `${colors.tint}15` }]}>
                    <Typo variant="h2" style={{ color: colors.tint, fontWeight: "bold" }}>
                      {donor.bloodType}
                    </Typo>
                  </View>
                  <View style={styles.headerText}>
                    <Typo variant="h2" style={{ color: colors.text }}>
                      {donor.fullName}
                    </Typo>
                    <Typo variant="caption" style={{ color: colors.textMuted, marginTop: 4 }}>
                      {donor.phoneNumber}
                    </Typo>
                    {donor.donorPublicId ? (
                      <View style={[styles.idChip, { borderColor: colors.border, marginTop: 8 }]}>
                        <Ionicons name="id-card-outline" size={14} color={colors.textMuted} />
                        <Typo variant="caption" style={{ color: colors.text, marginLeft: 6 }}>
                          {donor.donorPublicId}
                        </Typo>
                      </View>
                    ) : null}
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Badge
                      label={getStatusLabel(donor.donationStatus)}
                      variant={getStatusVariant(donor.donationStatus)}
                    />
                    <Typo variant="caption" style={{ color: colors.textMuted, marginTop: 8 }}>
                      {new Date(donor.createdAt).toLocaleDateString()}
                    </Typo>
                  </View>
                </View>
                
                <Divider spacing={16} />
                
                <View style={styles.cardFooter}>
                  <Typo variant="caption" color={colors.tint} style={{ fontWeight: "600" }}>
                    PROCESS DONATION →
                  </Typo>
                </View>
              </TouchableOpacity>
            </Card>
          ))
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
  loadingBox: { padding: 40, alignItems: "center" },
  emptyCard: { padding: 40, alignItems: "center" },
  donorCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  bloodBadge: {
    width: 50,
    height: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
  },
  idChip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  cardFooter: {
    alignItems: "flex-end",
  },
});
