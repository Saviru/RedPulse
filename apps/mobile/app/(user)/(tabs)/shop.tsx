import React, { useRef } from "react";
import { View, StyleSheet, Animated, TouchableOpacity, ScrollView, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";

import { useThemeColor } from "@/packages/ui/hooks";
import { Typo, Card, Button, AnimatedHeader, Divider, ProgressBar, Badge, Input } from "@/packages/ui/components/ui";
import { useScroll } from "@/packages/ui/context/ScrollContext";
import { pointsService, Offer, Fundraising } from "@/apps/mobile/src/services/pointsService";
import { useAuth } from "../../../src/context/AuthContext";
import { Alert, Modal } from "react-native";

export default function UserShopScreen() {
  const { colors, theme } = useThemeColor();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const { handleScroll } = useScroll();

  const { user, refreshUser } = useAuth();
  const [offers, setOffers] = React.useState<Offer[]>([]);
  const [events, setEvents] = React.useState<Fundraising[]>([]);
  const [userTransactions, setUserTransactions] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  
  const [donationModalVisible, setDonationModalVisible] = React.useState(false);
  const [selectedEvent, setSelectedEvent] = React.useState<Fundraising | null>(null);
  const [donationAmount, setDonationAmount] = React.useState("");

  const fetchData = async () => {
    try {
      const [offersData, eventsData, transactionsData] = await Promise.all([
        pointsService.getOffers(),
        pointsService.getFundraisings(),
        pointsService.getTransactions()
      ]);
      setOffers(offersData);
      setEvents(eventsData);
      setUserTransactions(transactionsData);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  const handleRedeem = async (offer: Offer) => {
    if ((user?.points || 0) < offer.pointsCost) {
      Alert.alert("Insufficient Points", "You don't have enough points for this reward.");
      return;
    }

    Alert.alert(
      "Confirm Redemption",
      `Use ${offer.pointsCost} points for "${offer.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Redeem", 
          onPress: async () => {
            try {
              await pointsService.redeemOffer(offer._id);
              await refreshUser();
              Alert.alert("Success", "Reward redeemed successfully!");
            } catch (error: any) {
              const msg = error.response?.data?.message || error.message || "Failed to redeem reward.";
              Alert.alert("Error", msg);
            }
          }
        }
      ]
    );
  };

  const handleDonate = async () => {
    if (!selectedEvent || !donationAmount) return;
    const amount = parseInt(donationAmount);
    if (isNaN(amount) || amount <= 0) return;

    if ((user?.points || 0) < amount) {
      Alert.alert("Insufficient Points", "You don't have enough points for this donation.");
      return;
    }

    try {
       await pointsService.donatePoints(selectedEvent._id, amount);
       await refreshUser();
       await fetchData();
       setDonationModalVisible(false);
       setDonationAmount("");
       Alert.alert("Thank You!", `You successfully donated ${amount} points to "${selectedEvent.title}"`);
    } catch (error: any) {
       const msg = error.response?.data?.message || error.message || "Failed to process donation.";
       Alert.alert("Error", msg);
    }
  };

  const renderOfferCard = (offer: Offer) => {
    const isRedeemed = userTransactions.some(t => t.type === 'REDEMPTION' && t.targetId === offer._id);

    return (
      <Card key={offer._id} variant="elevated" style={styles.horizontalCard}>
        <View style={[styles.offerIconWrap, { backgroundColor: `${colors.tint}1A` }]}>
          <MaterialIcons name={offer.type === "Checkup" ? "medical-services" : "local-offer"} size={32} color={colors.tint} />
        </View>
        <Typo variant="caption" color={colors.textMuted} style={{ marginTop: 12 }}>Hospital Partner</Typo>
        <Typo variant="body" style={{ fontWeight: "bold", marginTop: 4 }} numberOfLines={1}>{offer.title}</Typo>
        <View style={styles.pointsBadge}>
          <Typo variant="caption" color={colors.tint} style={{ fontWeight: "900" }}>{offer.pointsCost} PTS</Typo>
        </View>
        <Button 
          label={isRedeemed ? "Redeemed" : "Redeem"} 
          variant={isRedeemed ? "secondary" : "secondary"} 
          style={{ marginTop: 12 }} 
          onPress={() => !isRedeemed && handleRedeem(offer)} 
          disabled={isRedeemed}
        />
      </Card>
    );
  };

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
        <View style={[styles.balanceCard, { backgroundColor: colors.surface, borderWidth: theme === "light" ? 1 : 0, borderColor: colors.border }]}>
          <View style={{ flex: 1 }}>
            <Typo variant="caption" color={colors.textMuted}>YOUR BALANCE</Typo>
            <View style={styles.balanceRow}>
              <Typo variant="h1" color={colors.text}>{(user?.points || 0).toLocaleString()}</Typo>
              <Typo variant="h2" color={colors.tint}>pts</Typo>
            </View>
            <TouchableOpacity 
              style={[styles.historyBtn, { backgroundColor: `${colors.tint}1A` }]} 
              onPress={() => router.push('/(user)/(tabs)/rewards')}
            >
              <MaterialIcons name="history" size={16} color={colors.tint} />
              <Typo variant="caption" color={colors.tint} style={{ marginLeft: 4, fontWeight: "bold" }}>Show Redeems</Typo>
            </TouchableOpacity>
          </View>
          <MaterialIcons name="account-balance-wallet" size={48} color={theme === 'dark' ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"} />
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
            {offers.map(renderOfferCard)}
            {offers.length === 0 && !isLoading && (
              <Typo variant="caption" color={colors.textMuted} style={{ padding: 20 }}>No offers available</Typo>
            )}
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

          {events.map((event) => {
            const pointsGoal = event.goalLKR * 10;
            const progress = event.currentPoints / pointsGoal;
            
            return (
              <Card key={event._id} variant="elevated" style={styles.fundCard}>
                <View style={styles.fundInfo}>
                  <Typo variant="caption" color={colors.tint} style={{ fontWeight: "bold" }}>Impact Project</Typo>
                  <Typo variant="h2" style={{ marginTop: 4 }}>{event.title}</Typo>
                  <Typo variant="body" color={colors.textMuted} style={{ marginTop: 8 }} numberOfLines={2}>
                    {event.description}
                  </Typo>
                </View>

                <View style={styles.progressArea}>
                  <View style={styles.progressLabels}>
                    <Typo variant="caption" style={{ fontWeight: "bold" }}>
                      {event.currentPoints.toLocaleString()} / {pointsGoal.toLocaleString()} pts
                    </Typo>
                    <Typo variant="caption" color={colors.textMuted}>{Math.round(progress * 100)}%</Typo>
                  </View>
                  <ProgressBar progress={progress} color={colors.tint} />
                </View>

                <Button 
                  label="Donate Points" 
                  variant="primary" 
                  style={{ marginTop: 16 }} 
                  onPress={() => {
                    setSelectedEvent(event);
                    setDonationModalVisible(true);
                  }}
                />
              </Card>
            );
          })}
        </View>
      </Animated.ScrollView>

      {/* Donation Modal */}
      <Modal visible={donationModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
             <View style={styles.modalHeader}>
               <Typo variant="h2">Donate Points</Typo>
               <TouchableOpacity onPress={() => setDonationModalVisible(false)}>
                 <MaterialIcons name="close" size={24} color={colors.text} />
               </TouchableOpacity>
             </View>
             
             <Typo variant="body" color={colors.textMuted} style={{ marginBottom: 20 }}>
               Contributing to: <Typo variant="body" style={{ fontWeight: "bold" }}>{selectedEvent?.title}</Typo>
             </Typo>

             <Input 
                label="Amount of Points"
                placeholder="e.g. 50"
                keyboardType="numeric"
                value={donationAmount}
                onChangeText={setDonationAmount}
                helperText={`Your balance: ${(user?.points || 0)} pts`}
             />

             <Button 
                label="Confirm Donation"
                variant="primary"
                style={{ marginTop: 24, marginBottom: 40 }}
                onPress={handleDonate}
                disabled={!donationAmount || parseInt(donationAmount) <= 0 || parseInt(donationAmount) > (user?.points || 0)}
             />
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  historyBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
});
