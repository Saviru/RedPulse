import React, { useRef } from "react";
import { View, StyleSheet, Animated, TouchableOpacity, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { useThemeColor } from "@/packages/ui/hooks";
import { Typo, Card, Button, AnimatedHeader, Divider, Badge } from "@/packages/ui/components/ui";
import { useScroll } from "@/packages/ui/context/ScrollContext";

export default function HospitalHomeScreen() {
  const { colors, theme } = useThemeColor();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const { handleScroll } = useScroll();

  const inventorySummary = [
    { type: "O+", status: "Critical", count: "2 Units" },
    { type: "A-", status: "Stable", count: "8 Units" },
    { type: "B+", status: "Low", count: "3 Units" },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AnimatedHeader
        title="Hospital Admin"
        scrollY={scrollY}
        rightElement={
          <TouchableOpacity style={styles.iconButton}>
            <MaterialIcons name="settings" size={24} color={colors.text} />
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
        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={[styles.actionBox, { backgroundColor: `${colors.tint}1A` }]}>
            <MaterialIcons name="add-alert" size={32} color={colors.tint} />
            <Typo variant="caption" style={{ marginTop: 8, fontWeight: "bold" }}>Request Blood</Typo>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBox, { backgroundColor: `${colors.success || '#4CAF50'}1A` }]}>
            <MaterialIcons name="inventory" size={32} color={colors.success || '#4CAF50'} />
            <Typo variant="caption" style={{ marginTop: 8, fontWeight: "bold" }}>Update Stock</Typo>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBox, { backgroundColor: `#FF98001A` }]}>
            <MaterialIcons name="campaign" size={32} color="#FF9800" />
            <Typo variant="caption" style={{ marginTop: 8, fontWeight: "bold" }}>Host Camp</Typo>
          </TouchableOpacity>
        </View>

        {/* Critical Inventory */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Typo variant="h2">Inventory Snapshot</Typo>
            <TouchableOpacity>
              <Typo variant="caption" color={colors.tint}>Manage All</Typo>
            </TouchableOpacity>
          </View>
          
          <Card style={styles.inventoryCard}>
            {inventorySummary.map((item, i) => (
              <View key={i}>
                <View style={styles.inventoryRow}>
                  <View style={styles.typeBox}>
                    <Typo variant="h2">{item.type}</Typo>
                  </View>
                  <View style={{ flex: 1, marginLeft: 16 }}>
                    <Typo variant="body" style={{ fontWeight: "600" }}>{item.count}</Typo>
                    <Typo variant="caption" color={colors.textMuted}>{item.status}</Typo>
                  </View>
                  <Badge 
                    label={item.status} 
                    variant={item.status === "Critical" ? "danger" : item.status === "Low" ? "warning" : "success"} 
                  />
                </View>
                {i < inventorySummary.length - 1 && <Divider spacing={24} />}
              </View>
            ))}
          </Card>
        </View>

        {/* Pending Requests */}
        <View style={styles.section}>
          <Typo variant="h2" style={{ marginBottom: 16 }}>Recent Requests</Typo>
          {[1, 2].map((_, i) => (
            <Card key={i} variant="outlined" style={styles.missionCard}>
              <View style={styles.missionHeader}>
                <Typo variant="body" style={{ fontWeight: "bold" }}>Urgent O+ Needed</Typo>
                <Typo variant="caption" color={colors.textMuted}>Posted 2h ago</Typo>
              </View>
              <Typo variant="caption" color={colors.textMuted} style={{ marginTop: 4 }}>
                Status: Awaiting Donor Matching
              </Typo>
              <View style={styles.missionFooter}>
                <View style={styles.donorsFound}>
                  <MaterialIcons name="people" size={16} color={colors.tint} />
                  <Typo variant="caption" style={{ marginLeft: 4 }}>3 potential donors detected</Typo>
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
  quickActions: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 32,
  },
  actionBox: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
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
  inventoryCard: {
    padding: 16,
    borderRadius: 24,
  },
  inventoryRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  typeBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  missionCard: {
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
  },
  missionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  missionFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  donorsFound: {
    flexDirection: "row",
    alignItems: "center",
  },
});
