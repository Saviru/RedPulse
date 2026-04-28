import React, { useRef } from "react";
import { View, StyleSheet, Animated, FlatList, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { useThemeColor } from "@/packages/ui/hooks";
import { Typo, Card, StatCard, Avatar, Button, AnimatedHeader, Divider, Badge } from "@/packages/ui/components/ui";

const DONORS = [
  { id: "1", name: "John Doe", nic: "951234567V", bloodType: "A+", status: "pending", avatar: "JD" },
  { id: "2", name: "Jane Smith", nic: "982345678V", bloodType: "O-", status: "pending", avatar: "JS" },
  { id: "3", name: "Robert Brown", nic: "923456789V", bloodType: "B+", status: "approved", avatar: "RB" },
  { id: "4", name: "Emily Davis", nic: "994567890V", bloodType: "AB+", status: "pending", avatar: "ED" },
];

export default function DonorManagementScreen() {
  const { colors, theme } = useThemeColor();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scrollY = useRef(new Animated.Value(0)).current;

  const renderDonorItem = ({ item }: { item: typeof DONORS[0] }) => (
    <Card 
      variant="outlined" 
      style={styles.donorCard}
      onPress={() => router.push({
        pathname: "/(organization)/donor-profile-detail",
        params: { id: item.id }
      } as any)}
    >
      <View style={styles.donorInfo}>
        <Avatar fallbackText={item.avatar} size={48} />
        <View style={styles.donorText}>
          <Typo variant="h2">{item.name}</Typo>
          <Typo variant="caption" color={colors.textMuted}>NIC: {item.nic}</Typo>
        </View>
        <View style={styles.donorStatus}>
          <Badge 
            label={item.bloodType} 
            variant={item.bloodType.includes("+") ? "success" : "info"} 
          />
          <View style={{ marginTop: 4 }}>
            <Badge 
              label={item.status.toUpperCase()} 
              variant={item.status === "pending" ? "warning" : "success"}
            />
          </View>
        </View>
      </View>
    </Card>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AnimatedHeader
        title="Donor Management"
        scrollY={scrollY}
        headerHeight={64}
      />

      <Animated.ScrollView
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: Platform.OS !== "web" }
        )}
        scrollEventThrottle={16}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: 80 + insets.top, paddingBottom: insets.bottom + 16 }
        ]}
      >
        <Typo variant="h2" style={styles.sectionTitle}>Dashboard Stats</Typo>
        <View style={styles.statsRow}>
          <StatCard 
            label="Total Donors" 
            value={DONORS.length} 
            icon="people"
            style={{ flex: 1 }}
          />
          <StatCard 
            label="Pending" 
            value={DONORS.filter(d => d.status === "pending").length} 
            icon="time"
            accentColor="#FF9500"
            style={{ flex: 1 }}
          />
        </View>
        
        <Divider spacing={24} />

        <View style={styles.listHeader}>
          <Typo variant="h2">Recently Registered</Typo>
          <Button label="View All" variant="secondary" style={styles.viewAllBtn} />
        </View>

        {DONORS.map((donor) => (
          <View key={donor.id}>
            {renderDonorItem({ item: donor })}
          </View>
        ))}
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 16 },
  sectionTitle: { marginBottom: 16 },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 8,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  donorCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  donorInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  donorText: {
    flex: 1,
    marginLeft: 12,
  },
  donorStatus: {
    alignItems: "flex-end",
  },
  viewAllBtn: {
    height: 32,
    paddingHorizontal: 12,
  },
});
