import React, { useRef, useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Animated, TouchableOpacity } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";

import { useThemeColor } from "@/packages/ui/hooks";
import { Typo, Card, ProgressBar, AnimatedHeader } from "@/packages/ui/components/ui";
import { useScroll } from "@/packages/ui/context/ScrollContext";
import { useAuth } from "../../../src/context/AuthContext";
import { pointsService } from "@/apps/mobile/src/services/pointsService";

export default function DonorRewardsScreen() {
  const { theme, colors } = useThemeColor();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const { handleScroll } = useScroll();
  
  const { user, isLoading: authLoading } = useAuth();
  const [redemptions, setRedemptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRedemptions = async () => {
    if (!user) return;
    try {
      const [transactions, allOffers] = await Promise.all([
        pointsService.getTransactions(),
        pointsService.getOffers()
      ]);
      
      const filtered = transactions
        .filter(t => t.type === 'REDEMPTION')
        .map(t => {
          const offer = allOffers.find(o => o._id === t.targetId);
          return {
            ...t,
            offerTitle: offer ? offer.title : 'Health Reward',
            pointsCost: offer ? offer.pointsCost : t.amount
          };
        });
      
      setRedemptions(filtered);
    } catch (error) {
      console.error('Error fetching redemptions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchRedemptions();
    }
  }, [authLoading, user]);

  const renderRewardTrophy = (iconName: keyof typeof MaterialIcons.glyphMap, title: string, desc: string, date: string, colorClass: { bg: string, border: string, icon: string }, isLocked = false) => (
    <Card variant="elevated" style={[styles.rewardCard, isLocked && { backgroundColor: theme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)", elevation: 0, shadowOpacity: 0 }, { opacity: isLocked ? 0.5 : 1 }]}>
      <View style={[styles.rewardIcon, { backgroundColor: colorClass.bg, borderColor: colorClass.border }]}>
        <MaterialIcons name={iconName} size={32} color={colorClass.icon} />
      </View>
      <Typo variant="caption" style={styles.rewardTitle}>{title}</Typo>
      <Typo variant="caption" color={colors.textMuted} style={styles.rewardDesc} align="center">{desc}</Typo>
      
      <View style={[styles.rewardDateWrap, { borderTopColor: colors.border }]}>
        <Typo variant="caption" color={colors.textMuted} style={styles.rewardDate}>{date}</Typo>
      </View>
    </Card>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AnimatedHeader
        title="REWARDS"
        scrollY={scrollY}
        leftElement={
          <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back-ios" size={20} color={colors.text} />
          </TouchableOpacity>
        }
        rightElement={
          <TouchableOpacity style={styles.iconButton}>
            <MaterialIcons name="share" size={20} color={colors.text} />
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
          { 
            paddingTop: 80 + insets.top, // Space for header
            paddingBottom: insets.bottom + 100 
          }
        ]}
        showsVerticalScrollIndicator={false}
      >
        
        <View style={[styles.pointsSection, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Typo variant="caption" color={colors.textMuted} style={styles.pointsLabel}>TOTAL POINTS</Typo>
          <View style={styles.pointsRow}>
            <Typo variant="h1" style={styles.pointsVal}>{(user?.points || 0).toLocaleString()}</Typo>
            <Typo variant="h2" color={colors.tint} style={styles.ptsText}>pts</Typo>
          </View>

          <View style={styles.progressArea}>
            <View style={styles.progressLabels}>
              <View>
                <Typo variant="caption" color={colors.textMuted} style={styles.rankLabel}>CURRENT RANK</Typo>
                <Typo variant="caption" style={{ fontWeight: "bold" }}>Gold Donor</Typo>
              </View>
              <Typo variant="caption" color={colors.textMuted} style={styles.progressText}>250 pts to Platinum</Typo>
            </View>
            <ProgressBar progress={0.78} color={colors.tint} />
          </View>
        </View>

        <View style={[styles.statsRow, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View style={[styles.statBox, { borderRightColor: colors.border, borderRightWidth: 1 }]}>
            <Typo variant="h2" style={{ fontStyle: "italic" }}>12</Typo>
            <Typo variant="caption" color={colors.textMuted} style={styles.statLabel}>Donations</Typo>
          </View>
          <View style={[styles.statBox, { borderRightColor: colors.border, borderRightWidth: 1 }]}>
            <Typo variant="h2" style={{ fontStyle: "italic" }}>5.4L</Typo>
            <Typo variant="caption" color={colors.textMuted} style={styles.statLabel}>Total</Typo>
          </View>
          <View style={styles.statBox}>
            <Typo variant="h2" style={{ fontStyle: "italic" }}>4</Typo>
            <Typo variant="caption" color={colors.textMuted} style={styles.statLabel}>Lives Saved</Typo>
          </View>
        </View>

        <View style={styles.trophyCaseSection}>
          <Typo variant="caption" color={colors.textMuted} style={styles.caseHeaderLabel}>Trophy Case</Typo>
          
          <View style={styles.grid}>
            {renderRewardTrophy("volunteer-activism", "Life Saver", "First donation completed.", "Oct 12, 2023", { bg: `${colors.tint}1A`, border: `${colors.tint}33`, icon: colors.tint })}
            {renderRewardTrophy("looks-one", "Century Club", "Reached 10 total donations.", "Jan 05, 2024", { bg: `${colors.tint}1A`, border: `${colors.tint}33`, icon: colors.tint })}
            {renderRewardTrophy("water-drop", "First Drop", "Emergency blood request met.", "Feb 21, 2024", { bg: `${colors.tint}1A`, border: `${colors.tint}33`, icon: colors.tint })}
            {renderRewardTrophy("lock", "Blood Brother", "Refer 5 new donors to the system.", "Locked", { bg: colors.border, border: "transparent", icon: colors.icon }, true)}
          </View>
        </View>

        <View style={styles.redeemedRewardsSection}>
          <Typo variant="caption" color={colors.textMuted} style={styles.caseHeaderLabel}>My Redeemed Rewards</Typo>
          
          <View style={styles.redemptionList}>
            {redemptions.length > 0 ? (
              redemptions.map((redemption) => (
                <Card key={redemption._id} variant="elevated" style={styles.redemptionCard}>
                  <View style={styles.redemptionRow}>
                    <View style={[styles.redemptionIcon, { backgroundColor: `${colors.tint}1A` }]}>
                      <MaterialIcons name="local-offer" size={24} color={colors.tint} />
                    </View>
                    <View style={styles.redemptionContentArea}>
                      <Typo variant="body" style={{ fontWeight: "bold" }}>{redemption.offerTitle}</Typo>
                      <Typo variant="caption" color={colors.textMuted}>
                        {new Date(redemption.timestamp).toLocaleDateString(undefined, { 
                          year: 'numeric', month: 'short', day: 'numeric' 
                        })}
                      </Typo>
                    </View>
                    <View style={styles.redemptionPoints}>
                      <Typo variant="body" color={colors.tint} style={{ fontWeight: "bold" }}>
                        -{redemption.pointsCost}
                      </Typo>
                      <Typo variant="caption" color={colors.textMuted}>pts</Typo>
                    </View>
                  </View>
                </Card>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <MaterialIcons name="shopping-bag" size={48} color={colors.border} />
                <Typo variant="caption" color={colors.textMuted} style={{ marginTop: 12, textAlign: "center" }}>
                  {isLoading ? "Fetching your rewards..." : "You haven't redeemed any rewards yet."}
                </Typo>
              </View>
            )}
          </View>
        </View>

        <View style={styles.redeemSection}>
          <View style={[styles.redeemCard, { backgroundColor: theme === "dark" ? colors.tint : "#1B0D0D" }]}>
            <View style={styles.redeemContent}>
              <Typo variant="h2" color="#FFF" style={styles.redeemTitle}>REDEEM POINTS</Typo>
              <Typo variant="caption" color="rgba(255,255,255,0.8)" style={styles.redeemDesc}>Use your points for partner health checkups or gift cards.</Typo>
              <TouchableOpacity 
                style={styles.shopBtn}
                onPress={() => router.push("/(user)/(tabs)/shop")}
              >
                <Typo variant="caption" style={styles.shopBtnText}>BROWSE SHOP</Typo>
              </TouchableOpacity>
            </View>
            <MaterialIcons name="shopping-bag" size={120} color="#FFF" style={styles.redeemWatermark} />
          </View>
        </View>

      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    fontStyle: "italic",
    letterSpacing: 1,
  },
  scrollContent: {
  },
  pointsSection: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    borderBottomWidth: 1,
  },
  pointsLabel: {
    fontWeight: "bold",
    letterSpacing: 2,
    marginBottom: 4,
  },
  pointsRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    marginBottom: 24,
  },
  pointsVal: {
    fontSize: 48,
    fontStyle: "italic",
    fontWeight: "900",
  },
  ptsText: {
    fontStyle: "italic",
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  progressArea: {
    gap: 12,
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  rankLabel: {
    fontWeight: "bold",
    letterSpacing: 1,
    fontSize: 10,
  },
  progressText: {
    fontStyle: "italic",
    fontWeight: "bold",
    fontSize: 10,
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    width: "100%",
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
  },
  statsRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  statBox: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
  },
  statLabel: {
    fontWeight: "bold",
    letterSpacing: 1,
    textTransform: "uppercase",
    fontSize: 10,
    marginTop: 4,
  },
  trophyCaseSection: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  caseHeaderLabel: {
    fontWeight: "900",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 24,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    justifyContent: "space-between",
  },
  rewardCard: {
    width: "47%",
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
  },
  rewardIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  rewardTitle: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  rewardDesc: {
    fontSize: 11,
    lineHeight: 14,
    marginBottom: 12,
  },
  rewardDateWrap: {
    marginTop: "auto",
    paddingTop: 12,
    borderTopWidth: 1,
    width: "100%",
    alignItems: "center",
  },
  rewardDate: {
    fontWeight: "bold",
    textTransform: "uppercase",
    fontSize: 10,
  },
  redeemSection: {
    marginTop: 40,
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  redeemCard: {
    borderRadius: 24,
    padding: 24,
    overflow: "hidden",
    position: "relative",
  },
  redeemContent: {
    zIndex: 10,
  },
  redeemTitle: {
    fontStyle: "italic",
    fontWeight: "900",
    marginBottom: 4,
  },
  redeemDesc: {
    maxWidth: 200,
  },
  shopBtn: {
    backgroundColor: "#FFF",
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 16,
  },
  shopBtnText: {
    color: "#1a1a1a",
    fontWeight: "900",
    letterSpacing: 1,
    fontSize: 10,
  },
  redeemWatermark: {
    position: "absolute",
    right: -24,
    bottom: -24,
    opacity: 0.1,
    transform: [{ rotate: "12deg" }],
  },
  redeemedRewardsSection: {
    marginTop: 40,
    paddingHorizontal: 24,
  },
  redemptionList: {
    gap: 12,
  },
  redemptionCard: {
    padding: 16,
    borderRadius: 16,
  },
  redemptionRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  redemptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  redemptionContentArea: {
    flex: 1,
    marginLeft: 16,
  },
  redemptionPoints: {
    alignItems: "flex-end",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
    backgroundColor: "transparent",
  },
});
