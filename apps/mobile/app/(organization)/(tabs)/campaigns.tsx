import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, Animated, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";

import { useThemeColor } from "@/packages/ui/hooks";
import { Typo, Card, Button, AnimatedHeader, Divider } from "@/packages/ui/components/ui";
import { useScroll } from "@/packages/ui/context/ScrollContext";
import {
  getMyCampaigns,
  MyCampaignItem,
} from "@/apps/mobile/src/lib/organizationService";

export default function OrgCampaignsScreen() {
  const { colors } = useThemeColor();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const { handleScroll } = useScroll();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"active" | "past">("active");
  const [campaigns, setCampaigns] = useState<MyCampaignItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        setLoading(true);
        const data = await getMyCampaigns();
        setCampaigns(data);
      } catch (error) {
        alert(`Failed to load campaigns: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setLoading(false);
      }
    };
    loadCampaigns();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PUBLISHED": return "#4ade80";
      case "PENDING_HOSPITAL": return "#fbbf24";
      case "HOSPITAL_REJECTED": return "#f87171";
      case "CANCELLED": return colors.textMuted;
      default: return colors.textMuted;
    }
  };

  const getStatusLabel = (status: MyCampaignItem["status"]) => {
    switch (status) {
      case "PUBLISHED":
        return "Published";
      case "PENDING_HOSPITAL":
        return "Pending Hospital";
      case "HOSPITAL_REJECTED":
        return "Hospital Rejected";
      case "CANCELLED":
        return "Cancelled";
      default:
        return status;
    }
  };

  const activeCampaigns = campaigns.filter(
    (campaign) => campaign.status !== "CANCELLED",
  );
  const pastCampaigns = campaigns.filter((campaign) => campaign.status === "CANCELLED");
  const visibleCampaigns = activeTab === "active" ? activeCampaigns : pastCampaigns;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AnimatedHeader
        title="Campaigns"
        scrollY={scrollY}
        rightElement={
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => router.push("/(organization)/campaign-create" as any)}
          >
            <MaterialIcons name="add-circle" size={28} color={colors.tint} />
          </TouchableOpacity>
        }
      />

      <Animated.ScrollView
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { 
            useNativeDriver: true,
            listener: handleScroll 
          }
        )}
        scrollEventThrottle={16}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: 80 + insets.top, paddingBottom: insets.bottom + 100 }
        ]}
      >
        <View style={styles.header}>
          <Typo variant="h1">Campaigns (Camps)</Typo>
          <Typo variant="body" style={{ color: colors.textMuted }}>Manage your donation campaigns and event locations.</Typo>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            onPress={() => setActiveTab("active")}
            style={[styles.tab, activeTab === "active" && { borderBottomColor: colors.tint, borderBottomWidth: 3 }]}
          >
            <Typo variant="body" style={{ fontWeight: "700", color: activeTab === "active" ? colors.tint : colors.textMuted }}>Active</Typo>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab("past")}
            style={[styles.tab, activeTab === "past" && { borderBottomColor: colors.tint, borderBottomWidth: 3 }]}
          >
            <Typo variant="body" style={{ fontWeight: "700", color: activeTab === "past" ? colors.tint : colors.textMuted }}>Past</Typo>
          </TouchableOpacity>
        </View>

        <Divider spacing={20} />

        {loading ? (
          <Typo variant="body" style={{ color: colors.textMuted }}>
            Loading campaigns...
          </Typo>
        ) : visibleCampaigns.map((campaign) => (
          <TouchableOpacity 
            key={campaign.id} 
            onPress={() => router.push({ pathname: "/(organization)/campaign-management" as any, params: { id: campaign.id, name: campaign.name } } as any)}
          >
            <Card key={campaign.id} variant="elevated" style={styles.campCard}>
              <View style={styles.campHeader}>
                <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(campaign.status) }]} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Typo variant="h2">{campaign.name}</Typo>
                  <Typo variant="caption" style={{ color: colors.textMuted }}>
                    {new Date(campaign.date).toDateString()} • {getStatusLabel(campaign.status)}
                  </Typo>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={colors.border} />
              </View>

              <View style={styles.campStats}>
                <View style={styles.statItem}>
                  <Typo variant="caption" style={{ color: colors.textMuted }}>Registered</Typo>
                  <Typo variant="h2">{campaign.registeredDonors}</Typo>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Typo variant="caption" style={{ color: colors.textMuted }}>Volunteers</Typo>
                  <Typo variant="h2">{campaign.volunteers}</Typo>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Typo variant="caption" style={{ color: colors.textMuted }}>Goal</Typo>
                  <Typo variant="h2">
                    {campaign.maxCapacity > 0
                      ? Math.round((campaign.registeredDonors / campaign.maxCapacity) * 100)
                      : 0}
                    %
                  </Typo>
                </View>
              </View>

              <View style={styles.footer}>
                <Button 
                  label="Manage Campaign" 
                  variant="secondary" 
                  style={{ flex: 1 }} 
                  onPress={() => router.push({ pathname: "/(organization)/campaign-management" as any, params: { id: campaign.id, name: campaign.name } } as any)}
                />
              </View>
            </Card>
          </TouchableOpacity>
        ))}

        {!loading && visibleCampaigns.length === 0 && (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="event-busy" size={48} color={colors.border} />
            <Typo variant="body" style={{ color: colors.textMuted, marginTop: 12 }}>No campaigns found.</Typo>
          </View>
        )}
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  header: {
    marginBottom: 20,
  },
  tabContainer: { 
    flexDirection: "row", 
  },
  tab: { 
    flex: 1, 
    alignItems: "center", 
    paddingVertical: 12 
  },
  campCard: {
    padding: 20,
    borderRadius: 24,
    marginBottom: 16,
  },
  campHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  statusIndicator: {
    width: 6,
    height: 30,
    borderRadius: 3,
  },
  campStats: {
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.03)",
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  footer: {
    flexDirection: "row",
    gap: 12,
  },
  emptyContainer: { 
    alignItems: "center", 
    justifyContent: "center", 
    marginTop: 60 
  },
});
