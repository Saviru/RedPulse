import React, { useRef } from "react";
import { View, StyleSheet, Animated, TouchableOpacity, ScrollView, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";

import { useThemeColor } from "@/packages/ui/hooks";
import { Typo, Card, Button, AnimatedHeader, Divider, ProgressBar, Badge } from "@/packages/ui/components/ui";
import { useScroll } from "@/packages/ui/context/ScrollContext";

export default function UserShopScreen() {
  const { colors, theme } = useThemeColor();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const { handleScroll } = useScroll();

  // Mock Data
  const hospitalOffers = [
    { id: "1", title: "Free CBC Checkup", points: 500, hospital: "Saint Mary's General", type: "Checkup" },
    { id: "2", title: "20% Lab Discount", points: 1000, hospital: "City Care Hospital", type: "Discount" },
    { id: "3", title: "Vision Screening", points: 300, hospital: "Eye Care Center", type: "Checkup" },
  ];

  const fundraisingEvents = [
    { id: "1", title: "Emergency Blood Drive Fuel", organizer: "Red Cross Downtown", currentPts: 12500, targetLKR: 5000, description: "Help us transport blood to rural hospitals." },
    { id: "2", title: "Winter Health Kits", organizer: "Hope Foundation", currentPts: 45000, targetLKR: 10000, description: "Providing basic medical kits to those in need." },
  ];

  const renderOfferCard = (offer: typeof hospitalOffers[0]) => (
    <Card key={offer.id} variant="elevated" style={styles.horizontalCard}>
      <View style={[styles.offerIconWrap, { backgroundColor: `${colors.tint}1A` }]}>
        <MaterialIcons name={offer.type === "Checkup" ? "medical-services" : "local-offer"} size={32} color={colors.tint} />
      </View>
      <Typo variant="caption" color={colors.textMuted} style={{ marginTop: 12 }}>{offer.hospital}</Typo>
      <Typo variant="body" style={{ fontWeight: "bold", marginTop: 4 }} numberOfLines={1}>{offer.title}</Typo>
      <View style={styles.pointsBadge}>
        <Typo variant="caption" color={colors.tint} style={{ fontWeight: "900" }}>{offer.points} PTS</Typo>
      </View>
      <Button 
        label="Redeem" 
        variant="secondary" 
        style={{ marginTop: 12 }} 
        onPress={() => {}} 
      />
    </Card>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AnimatedHeader
        title="Point Shop"
        scrollY={scrollY}
        leftElement={
          <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
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
        {/* User Points Summary */}
        <View style={[styles.balanceCard, { backgroundColor: theme === "dark" ? colors.surface : "#1a1a1a" }]}>
          <View>
            <Typo variant="caption" color="rgba(255,255,255,0.6)">YOUR BALANCE</Typo>
            <View style={styles.balanceRow}>
              <Typo variant="h1" color="#FFF">1,250</Typo>
              <Typo variant="h2" color={colors.tint}>pts</Typo>
            </View>
          </View>
          <MaterialIcons name="account-balance-wallet" size={40} color="rgba(255,255,255,0.2)" />
        </View>

        {/* Hospital Offers Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Typo variant="h2">Healthcare Offers</Typo>
            <TouchableOpacity>
              <Typo variant="caption" color={colors.tint}>View All</Typo>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
            {hospitalOffers.map(renderOfferCard)}
          </ScrollView>
        </View>

        {/* Fundraising Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Typo variant="h2">Support a Cause</Typo>
            <Badge label="10 pts = 1 LKR" variant="info" />
          </View>
          <Typo variant="caption" color={colors.textMuted} style={{ marginBottom: 16 }}>
            Donate your points to help organizations fund critical healthcare missions.
          </Typo>

          {fundraisingEvents.map((event) => {
            const pointsGoal = event.targetLKR * 10;
            const progress = event.currentPts / pointsGoal;
            
            return (
              <Card key={event.id} variant="elevated" style={styles.fundCard}>
                <View style={styles.fundInfo}>
                  <Typo variant="caption" color={colors.tint} style={{ fontWeight: "bold" }}>{event.organizer}</Typo>
                  <Typo variant="h2" style={{ marginTop: 4 }}>{event.title}</Typo>
                  <Typo variant="body" color={colors.textMuted} style={{ marginTop: 8 }} numberOfLines={2}>
                    {event.description}
                  </Typo>
                </View>

                <View style={styles.progressArea}>
                  <View style={styles.progressLabels}>
                    <Typo variant="caption" style={{ fontWeight: "bold" }}>
                      {event.currentPts.toLocaleString()} / {pointsGoal.toLocaleString()} pts
                    </Typo>
                    <Typo variant="caption" color={colors.textMuted}>{Math.round(progress * 100)}%</Typo>
                  </View>
                  <ProgressBar progress={progress} color={colors.tint} />
                </View>

                <Button 
                  label="Donate Points" 
                  variant="primary" 
                  style={{ marginTop: 16 }} 
                  onPress={() => {}}
                />
              </Card>
            );
          })}
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
  balanceCard: {
    padding: 24,
    borderRadius: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 32,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
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
  horizontalScroll: {
    paddingRight: 16,
    gap: 16,
  },
  horizontalCard: {
    width: 180,
    padding: 16,
    borderRadius: 20,
  },
  offerIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  pointsBadge: {
    alignSelf: "flex-start",
    backgroundColor: "transparent",
    marginTop: 8,
  },
  fundCard: {
    padding: 24,
    borderRadius: 24,
    marginBottom: 16,
  },
  fundInfo: {
    marginBottom: 16,
  },
  progressArea: {
    gap: 8,
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
