import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, Animated, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";

import { useThemeColor } from "@/packages/ui/hooks";
import { Typo, Card, Button, AnimatedHeader, Divider, Badge } from "@/packages/ui/components/ui";
import { useScroll } from "@/packages/ui/context/ScrollContext";
import { getOrgDashboard } from "@/apps/mobile/src/lib/organizationService";

export default function OrgHomeScreen() {
  const { colors, theme } = useThemeColor();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scrollY = useRef(new Animated.Value(0)).current;
  const { handleScroll } = useScroll();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    metrics: { activeCamps: number; volunteers: number; donations: number };
    latestCampaign: any | null;
    upcomingCamps: any[];
  } | null>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        const dashboardData = await getOrgDashboard();
        setData(dashboardData);
      } catch (error) {
        console.error("Failed to load dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  const metrics = [
    { label: "Active Camps", value: data?.metrics.activeCamps?.toString() ?? "0", icon: "event" },
    { label: "Volunteers", value: data?.metrics.volunteers?.toString() ?? "0", icon: "groups" },
    { label: "Donations", value: data?.metrics.donations?.toString() ?? "0", icon: "bloodtype" },
  ];

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  const latest = data?.latestCampaign;
  const upcoming = data?.upcomingCamps ?? [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AnimatedHeader
        title="Org Dashboard"
        scrollY={scrollY}
        rightElement={
          <TouchableOpacity style={styles.iconButton}>
            <MaterialIcons name="notifications-none" size={24} color={colors.text} />
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
        {/* Metrics Grid */}
        <View style={styles.metricsGrid}>
          {metrics.map((metric, i) => (
            <Card key={i} variant="elevated" style={styles.metricCard}>
              <View style={[styles.iconBox, { backgroundColor: `${colors.tint}1A` }]}>
                <MaterialIcons name={metric.icon as any} size={24} color={colors.tint} />
              </View>
              <Typo variant="h1" style={{ marginTop: 12 }}>{metric.value}</Typo>
              <Typo variant="caption" color={colors.textMuted}>{metric.label}</Typo>
            </Card>
          ))}
        </View>

        {/* Latest Activity / Fundraising Section */}
        {latest && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Typo variant="h2">Latest Campaign</Typo>
              <Badge 
                label={latest.status.replace('_', ' ')} 
                variant={latest.status === 'PUBLISHED' ? 'success' : 'info'} 
              />
            </View>
            
            <Card style={styles.campaignCard}>
              <Typo variant="h2">{latest.name}</Typo>
              <Typo variant="body" color={colors.textMuted} style={{ marginTop: 4 }}>
                {latest.location} • {new Date(latest.date).toLocaleDateString()}
              </Typo>
              
              <View style={styles.progressArea}>
                <View style={styles.progressLabels}>
                  <Typo variant="caption" style={{ fontWeight: "bold" }}>{latest.registeredDonors} donors registered</Typo>
                  <Typo variant="caption" color={colors.textMuted}>
                    {Math.round((latest.registeredDonors / latest.maxCapacity) * 100)}% Capacity
                  </Typo>
                </View>
                <View style={[styles.progressBar, { backgroundColor: "rgba(0,0,0,0.05)" }]}>
                  <View style={[styles.progressFill, { backgroundColor: colors.tint, width: `${Math.min(100, (latest.registeredDonors / latest.maxCapacity) * 100)}%` }]} />
                </View>
              </View>

              <Button 
                label="Campaign Details" 
                variant="secondary" 
                style={{ marginTop: 16 }} 
                onPress={() => router.push(`/(organization)/campaign-management` as any)}
              />
            </Card>
          </View>
        )}

        {/* Upcoming Donation Camps */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Typo variant="h2">Upcoming Camps</Typo>
            <TouchableOpacity onPress={() => router.push("/(organization)/campaign-create" as any)}>
              <Typo variant="caption" color={colors.tint}>Schedule New</Typo>
            </TouchableOpacity>
          </View>
          
          {upcoming.length > 0 ? upcoming.map((camp, i) => {
            const dateObj = new Date(camp.date);
            const month = dateObj.toLocaleString('en-US', { month: 'short' }).toUpperCase();
            const day = dateObj.getDate();
            const timeStr = new Date(camp.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return (
              <TouchableOpacity key={camp.id} onPress={() => router.push("/(organization)/campaign-management" as any)}>
                <Card variant="outlined" style={styles.campCard}>
                  <View style={styles.campInfo}>
                    <View style={styles.dateBox}>
                      <Typo variant="caption" style={{ fontWeight: "900" }}>{month}</Typo>
                      <Typo variant="h2">{day}</Typo>
                    </View>
                    <View style={{ flex: 1, marginLeft: 16 }}>
                      <Typo variant="h2">{camp.name}</Typo>
                      <Typo variant="caption" color={colors.textMuted}>{timeStr} • {camp.location}</Typo>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            );
          }) : (
            <Card variant="outlined" style={[styles.campCard, { alignItems: 'center', padding: 32 }]}>
              <Typo variant="body" color={colors.textMuted}>No upcoming camps scheduled</Typo>
              <Button 
                label="Create Your First Camp" 
                variant="link" 
                onPress={() => router.push("/(organization)/campaign-create" as any)}
              />
            </Card>
          )}
          
          {upcoming.length > 0 && (
            <Button 
              label="Manage All Campaigns" 
              variant="primary" 
              onPress={() => router.push("/(organization)/campaign-management" as any)}
              style={{ marginTop: 8 }}
            />
          )}
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  metricsGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 32,
  },
  metricCard: {
    flex: 1,
    padding: 16,
    borderRadius: 24,
    alignItems: "center",
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  campaignCard: {
    padding: 24,
    borderRadius: 28,
  },
  progressArea: {
    marginTop: 20,
    gap: 8,
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 5,
  },
  campCard: {
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
  },
  campInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateBox: {
    width: 56,
    height: 64,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
});
