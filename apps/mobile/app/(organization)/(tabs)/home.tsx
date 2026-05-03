import React, { useRef } from "react";
import { View, StyleSheet, Animated, TouchableOpacity, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { useThemeColor } from "@/packages/ui/hooks";
import { Typo, Card, Button, AnimatedHeader, Divider, Badge } from "@/packages/ui/components/ui";
import { useScroll } from "@/packages/ui/context/ScrollContext";

export default function OrgHomeScreen() {
  const { colors, theme } = useThemeColor();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const { handleScroll } = useScroll();

  const metrics = [
    { label: "Active Camps", value: "3", icon: "event" },
    { label: "Volunteers", value: "158", icon: "groups" },
    { label: "Donations", value: "420", icon: "bloodtype" },
  ];

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

        {/* Current Fundraising Campaign */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Typo variant="h2">Active Fundraising</Typo>
            <Badge label="10 pts = 1 LKR" variant="info" />
          </View>
          
          <Card style={styles.campaignCard}>
            <Typo variant="h2">City Wide Blood Drive 2024</Typo>
            <Typo variant="body" color={colors.textMuted} style={{ marginTop: 4 }}>
              Goal: 100,000 pts (10,000 LKR)
            </Typo>
            
            <View style={styles.progressArea}>
              <View style={styles.progressLabels}>
                <Typo variant="caption" style={{ fontWeight: "bold" }}>65,000 pts raised</Typo>
                <Typo variant="caption" color={colors.textMuted}>65%</Typo>
              </View>
              <View style={[styles.progressBar, { backgroundColor: "rgba(0,0,0,0.05)" }]}>
                <View style={[styles.progressFill, { backgroundColor: colors.tint, width: "65%" }]} />
              </View>
            </View>

            <Button label="Campaign Details" variant="secondary" style={{ marginTop: 16 }} />
          </Card>
        </View>

        {/* Upcoming Donation Camps */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Typo variant="h2">Upcoming Camps</Typo>
            <TouchableOpacity>
              <Typo variant="caption" color={colors.tint}>Schedule New</Typo>
            </TouchableOpacity>
          </View>
          
          {[1, 2].map((_, i) => (
            <Card key={i} variant="outlined" style={styles.campCard}>
              <View style={styles.campInfo}>
                <View style={styles.dateBox}>
                  <Typo variant="caption" style={{ fontWeight: "900" }}>OCT</Typo>
                  <Typo variant="h2">15</Typo>
                </View>
                <View style={{ flex: 1, marginLeft: 16 }}>
                  <Typo variant="h2">Central Plaza Drive</Typo>
                  <Typo variant="caption" color={colors.textMuted}>9:00 AM - 4:00 PM • 32 Registrations</Typo>
                </View>
              </View>
            </Card>
          ))}
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
