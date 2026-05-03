import React, { useRef } from "react";
import { View, StyleSheet, Animated, ScrollView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";

import { useThemeColor } from "@/packages/ui/hooks";
import { Typo, Card, Avatar, Button, AnimatedHeader, Divider, Badge } from "@/packages/ui/components/ui";

export default function DonorProfileDetailScreen() {
  const { colors, theme } = useThemeColor();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const scrollY = useRef(new Animated.Value(0)).current;

  // Dummy data lookup
  const donor = {
    name: "John Doe",
    nic: "951234567V",
    weight: "72 kg",
    bloodType: "A+",
    address: "123, Main Street, Colombo",
    phone: "077 123 4567",
    lastDonation: "6 months ago",
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AnimatedHeader
        title="Donor Profile"
        scrollY={scrollY}
        leftElement={
          <Button 
            label="Back" 
            variant="secondary" 
            onPress={() => router.back()} 
            style={styles.backButton}
          />
        }
      />

      <Animated.ScrollView
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: Platform.OS !== "web" }
        )}
        scrollEventThrottle={16}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: 80 + insets.top, paddingBottom: insets.bottom + 100 }
        ]}
      >
        <View style={styles.profileHeader}>
          <Avatar fallbackText="JD" size={100} />
          <Typo variant="h1" style={{ marginTop: 16 }}>{donor.name}</Typo>
          <View style={{ marginTop: 8 }}>
            <Badge label="PENDING APPROVAL" variant="warning" />
          </View>
        </View>

        <Divider spacing={32} />

        <Typo variant="h2" style={styles.sectionTitle}>Basic Information</Typo>
        <Card variant="outlined" style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Typo variant="body" color={colors.textMuted}>NIC Number</Typo>
            <Typo variant="body" style={{ fontWeight: "600" }}>{donor.nic}</Typo>
          </View>
          <Divider spacing={12} />
          <View style={styles.infoRow}>
            <Typo variant="body" color={colors.textMuted}>Weight</Typo>
            <Typo variant="body" style={{ fontWeight: "600" }}>{donor.weight}</Typo>
          </View>
          <Divider spacing={12} />
          <View style={styles.infoRow}>
            <Typo variant="body" color={colors.textMuted}>Blood Type</Typo>
            <Badge label={donor.bloodType} variant="success" />
          </View>
        </Card>

        <Typo variant="h2" style={[styles.sectionTitle, { marginTop: 24 }]}>Contact Details</Typo>
        <Card variant="outlined" style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Typo variant="body" color={colors.textMuted}>Phone</Typo>
            <Typo variant="body">{donor.phone}</Typo>
          </View>
          <Divider spacing={12} />
          <View style={styles.infoRow}>
            <Typo variant="body" color={colors.textMuted}>Address</Typo>
            <Typo variant="body" style={{ flex: 1, textAlign: "right" }}>{donor.address}</Typo>
          </View>
        </Card>

        <View style={styles.actionButtons}>
          <Button 
            label="Reject Donor" 
            variant="secondary" 
            style={[styles.actionBtn, { borderColor: colors.error }]}
            onPress={() => router.back()} 
          />
          <Button 
            label="Accept Donor" 
            variant="primary" 
            style={styles.actionBtn}
            onPress={() => router.back()} 
          />
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 16 },
  backButton: {
    paddingHorizontal: 8,
    height: 32,
  },
  profileHeader: {
    alignItems: "center",
    marginTop: 16,
  },
  sectionTitle: {
    marginBottom: 12,
    fontSize: 18,
  },
  infoCard: {
    padding: 16,
    borderRadius: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 32,
  },
  actionBtn: {
    flex: 1,
  },
});
