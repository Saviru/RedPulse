import React, { useRef } from "react";
import { View, StyleSheet, Animated, TouchableOpacity, ScrollView, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";

import { useThemeColor } from "@/packages/ui/hooks";
import { Typo, Card, Button, AnimatedHeader, Divider, Badge } from "@/packages/ui/components/ui";
import { useScroll } from "@/packages/ui/context/ScrollContext";

export default function UserHomeScreen() {
  const { colors, theme } = useThemeColor();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const { handleScroll } = useScroll();

  // Mock Data
  const stats = [
    { label: "Donations", value: "12", icon: "bloodtype" },
    { label: "Lives Saved", value: "36", icon: "favorite" },
    { label: "Points", value: "1,250", icon: "stars" },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AnimatedHeader
        title="RedPulse"
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
        {/* Hero Section */}
        <Card variant="elevated" style={[styles.heroCard, { backgroundColor: colors.tint }]}>
          <View style={styles.heroContent}>
            <View>
              <Typo variant="h2" color="#FFF">Next Donation</Typo>
              <Typo variant="body" color="rgba(255,255,255,0.8)" style={{ marginTop: 4 }}>
                You are eligible to donate in:
              </Typo>
              <Typo variant="h1" color="#FFF" style={{ marginTop: 8 }}>14 Days</Typo>
            </View>
            <MaterialIcons name="event-available" size={60} color="rgba(255,255,255,0.3)" />
          </View>
          <Button 
            label="Find Local Campaigns" 
            variant="secondary" 
            style={styles.heroBtn}
            onPress={() => router.push("/(user)/campaign-volunteer" as any)}
          />
        </Card>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {stats.map((stat, i) => (
            <Card key={i} style={styles.statCard}>
              <MaterialIcons name={stat.icon as any} size={24} color={colors.tint} />
              <Typo variant="h2" style={{ marginTop: 8 }}>{stat.value}</Typo>
              <Typo variant="caption" color={colors.textMuted}>{stat.label}</Typo>
            </Card>
          ))}
        </View>

        {/* Urgent Requests */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Typo variant="h2">Urgent Blood Requests</Typo>
            <Badge label="Nearby" variant="danger" />
          </View>
          
          {[1, 2].map((_, i) => (
            <Card key={i} variant="outlined" style={styles.requestCard}>
              <View style={styles.requestInfo}>
                <View style={[styles.bloodType, { backgroundColor: `${colors.error}1A` }]}>
                  <Typo variant="h2" color={colors.error}>O+</Typo>
                </View>
                <View style={{ flex: 1, marginLeft: 16 }}>
                  <Typo variant="h2">City Care Hospital</Typo>
                  <Typo variant="caption" color={colors.textMuted}>2.4 km away • 2 units needed</Typo>
                </View>
              </View>
              <Button label="Donate Now" variant="primary" style={{ marginTop: 16 }} />
            </Card>
          ))}
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Typo variant="h2" style={{ marginBottom: 16 }}>Recent Activity</Typo>
          <Card style={styles.activityCard}>
            <View style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: `${colors.tint}1A` }]}>
                <MaterialIcons name="stars" size={20} color={colors.tint} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Typo variant="body" style={{ fontWeight: "600" }}>Earned 500 Points</Typo>
                <Typo variant="caption" color={colors.textMuted}>Donation at Saint Mary's</Typo>
              </View>
              <Typo variant="caption" color={colors.textMuted}>2d ago</Typo>
            </View>
          </Card>
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
  heroCard: {
    padding: 24,
    borderRadius: 28,
    marginBottom: 24,
  },
  heroContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  heroBtn: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 0,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    padding: 16,
    alignItems: "center",
    borderRadius: 20,
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
  requestCard: {
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
  },
  requestInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  bloodType: {
    width: 50,
    height: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  activityCard: {
    padding: 16,
    borderRadius: 20,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
