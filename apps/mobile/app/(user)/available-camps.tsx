import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, Animated, TouchableOpacity, Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Ionicons } from "@expo/vector-icons";

import { useThemeColor } from "@/packages/ui/hooks";
import { Typo, Card, Button, AnimatedHeader, Badge } from "@/packages/ui/components/ui";
import { getPublishedCampaigns, PublicCampaign } from "@/apps/mobile/src/lib/campaignService";
import { getLatestEligibility } from "@/apps/mobile/src/lib/eligibilityService";


export default function AvailableCampsScreen() {
  const { colors, theme } = useThemeColor();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [camps, setCamps] = useState<PublicCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [eligibilityModal, setEligibilityModal] = useState<{
    visible: boolean;
    type: "NOT_FILLED" | "NOT_ELIGIBLE";
    reasons?: string[];
  }>({ visible: false, type: "NOT_FILLED" });


  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        console.log('DEBUG: Starting to load campaigns');
        setLoading(true);
        const data = await getPublishedCampaigns();
        console.log('DEBUG: Campaigns loaded:', data);
        setCamps(data);
      } catch (error) {
        console.log('DEBUG: Error loading campaigns:', error);
        alert(`Failed to load campaigns: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setLoading(false);
      }
    };
    loadCampaigns();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AnimatedHeader
        title="Available Camps"
        scrollY={scrollY}
        leftElement={
          <TouchableOpacity onPress={() => router.back()} accessibilityRole="button">
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        }
      />

      <Animated.ScrollView
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { 
            useNativeDriver: true
          }
        )}
        scrollEventThrottle={16}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: 80 + insets.top, paddingBottom: insets.bottom + 40 }
        ]}
      >
        <View style={styles.header}>
          <Typo variant="h2">Donation Camps Near You</Typo>
          <Typo variant="body" color={colors.textMuted} style={{ marginTop: 8 }}>
            Find a convenient location and help save lives today.
          </Typo>
        </View>

        <View style={styles.campsList}>
          {loading ? (
            <Card variant="elevated" style={styles.campCard}>
              <Typo variant="body" color={colors.textMuted}>Loading campaigns...</Typo>
            </Card>
          ) : camps.map((camp) => (
            <Card key={camp._id} variant="elevated" style={styles.campCard}>
              <View style={styles.campHeader}>
                <View style={{ flex: 1 }}>
                  <Typo variant="h2">{camp.name}</Typo>
                  <Typo variant="caption" color={colors.textMuted} style={{ marginTop: 4 }}>
                    {camp.location}
                  </Typo>
                </View>
                <Badge 
                  label="Open" 
                  variant="success" 
                />
              </View>

              <View style={styles.campDetails}>
                <View style={styles.detailRow}>
                  <MaterialIcons name="event" size={16} color={colors.textMuted} />
                  <Typo variant="body" color={colors.text} style={styles.detailText}>
                    {new Date(camp.date).toDateString()}
                  </Typo>
                </View>
                <View style={styles.detailRow}>
                  <MaterialIcons name="schedule" size={16} color={colors.textMuted} />
                  <Typo variant="body" color={colors.text} style={styles.detailText}>
                    {new Date(camp.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - {new Date(camp.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </Typo>
                </View>
              </View>

              <Button
                label="Register"
                variant="primary"
                style={styles.registerBtn}
                onPress={async () => {
                  try {
                    const eligibility = await getLatestEligibility();
                    console.log("Available Camps Guard - Eligibility Result:", JSON.stringify(eligibility));

                    if (!eligibility) {
                      setEligibilityModal({ visible: true, type: "NOT_FILLED" });
                      return;
                    }
                    if (eligibility.isEligible !== true) {
                      setEligibilityModal({ 
                        visible: true, 
                        type: "NOT_ELIGIBLE", 
                        reasons: eligibility.reasonsForIneligibility 
                      });
                      return;
                    }


                    router.push({
                      pathname: "/(user)/campaign-registration",
                      params: {
                        campId: camp._id,
                        role: "donor",
                        title: camp.name,
                        organization: camp.organizationName,
                        hospital: camp.currentHospitalName,
                        date: new Date(camp.date).toDateString(),
                        time: `${new Date(camp.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - ${new Date(camp.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
                        location: camp.location,
                        volunteerPoints: "100",
                      },
                    } as any);
                  } catch (error: any) {
                    console.error("Available Camps Guard - Error:", error.message);
                    setEligibilityModal({ visible: true, type: "NOT_FILLED" });
                  }

                }}

              />
            </Card>
          ))}
        </View>
      </Animated.ScrollView>

      <Modal
        visible={eligibilityModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setEligibilityModal({ ...eligibilityModal, visible: false })}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[styles.modalIconContainer, { backgroundColor: eligibilityModal.type === "NOT_ELIGIBLE" ? "#FEF2F2" : "#EFF6FF" }]}>
              <Ionicons 
                name={eligibilityModal.type === "NOT_ELIGIBLE" ? "warning" : "clipboard-outline"} 
                size={32} 
                color={eligibilityModal.type === "NOT_ELIGIBLE" ? "#EF4444" : "#3B82F6"} 
              />
            </View>

            <Typo variant="h2" style={styles.modalTitle}>
              {eligibilityModal.type === "NOT_ELIGIBLE" ? "Ineligible to Donate" : "Assessment Required"}
            </Typo>

            <Typo variant="body" style={styles.modalDescription}>
              {eligibilityModal.type === "NOT_ELIGIBLE" 
                ? "Based on your last medical assessment, you are not currently eligible to donate blood."
                : "You must complete a brief medical eligibility assessment before you can register as a donor."}
            </Typo>

            {eligibilityModal.type === "NOT_ELIGIBLE" && eligibilityModal.reasons && (
              <View style={styles.reasonsContainer}>
                <Typo variant="caption" style={{ fontWeight: "700", color: "#991B1B", marginBottom: 4 }}>REASONS:</Typo>
                {eligibilityModal.reasons.map((r, i) => (
                  <Typo key={i} variant="caption" style={{ color: "#7F1D1D" }}>• {r}</Typo>
                ))}
              </View>
            )}

            <View style={styles.modalActions}>
              <Button
                label={eligibilityModal.type === "NOT_ELIGIBLE" ? "Re-take Quiz" : "Take Quiz Now"}
                variant="primary"
                style={{ flex: 1 }}
                onPress={() => {
                  setEligibilityModal({ ...eligibilityModal, visible: false });
                  router.push("/(user)/eligibility" as any);
                }}
              />
              <Button
                label="Close"
                variant="secondary"
                style={{ marginLeft: 8 }}
                onPress={() => setEligibilityModal({ ...eligibilityModal, visible: false })}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>

  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
  },
  header: {
    marginBottom: 24,
  },
  campsList: {
    gap: 16,
  },
  campCard: {
    padding: 16,
    borderRadius: 20,
  },
  campHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  campDetails: {
    backgroundColor: "rgba(0,0,0,0.02)",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailText: {
    marginLeft: 8,
    fontWeight: "500",
  },
  registerBtn: {
    width: "100%",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    textAlign: "center",
    marginBottom: 8,
  },
  modalDescription: {
    textAlign: "center",
    color: "#6B7280",
    marginBottom: 20,
  },
  reasonsContainer: {
    width: "100%",
    backgroundColor: "#FEF2F2",
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: "row",
    width: "100%",
  },
});

