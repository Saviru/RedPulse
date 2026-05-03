import React, { useCallback, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Platform,
  Linking,
  Modal,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";

import { useThemeColor } from "@/packages/ui/hooks";
import { Typo, Card, Badge, Button } from "@/packages/ui/components/ui";
import api from "@/apps/mobile/src/services/api";
import {
  getPriorityBloodRequests,
  getAcceptedBloodRequests,
  respondToBloodRequest,
  BloodRequestResponse,
} from "@/apps/mobile/src/lib/bloodRequestApi";
import { useUserStore } from "@/apps/mobile/src/store/UserContext";

export default function DonorAlertsScreen() {
  const { colors } = useThemeColor();
  const router = useRouter();
  const { user } = useUserStore();
  
  const [requests, setRequests] = useState<BloodRequestResponse[]>([]);
  const [acceptedRequests, setAcceptedRequests] = useState<BloodRequestResponse[]>([]);
  const [viewTab, setViewTab] = useState<"available" | "accepted">("available");
  
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [responding, setResponding] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Fetch available priority requests
      const data = await getPriorityBloodRequests();
      console.log(`[Alerts] Received ${data.length} priority requests from API`);
      
      const filtered = data.filter(r => {
        const isOwner = String(r.requesterId) === String(user.username);
        const alreadyResponded = r.responses?.some((resp: any) => String(resp.responderId) === String(user.username));
        return !isOwner && !alreadyResponded;
      });
      
      const sorted = filtered.sort((a, b) => {
        if (a.isEmergency && !b.isEmergency) return -1;
        if (!a.isEmergency && b.isEmergency) return 1;
        return (b.priorityScore || 0) - (a.priorityScore || 0);
      });
      setRequests(sorted);

      // 2. Fetch accepted requests
      const accepted = await getAcceptedBloodRequests();
      console.log(`[Alerts] Received ${accepted.length} accepted requests`);
      setAcceptedRequests(accepted);
      
    } catch (e) {
      console.error("Failed to load requests:", e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadRequests();
    }, [loadRequests])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadRequests();
    setRefreshing(false);
  }, [loadRequests]);

  const handleRespond = async (requestId: string, status: "accepted" | "declined") => {
    setResponding(requestId);
    try {
      await respondToBloodRequest(requestId, { status });
      const title = status === "accepted" ? "Accepted!" : "Declined";
      const msg = status === "accepted"
        ? "Thank you! The requester will be notified."
        : "You have declined this request.";
      
      if (Platform.OS === 'web') window.alert(`${title}\n${msg}`);
      else Alert.alert(title, msg);
      
      await loadRequests();
    } catch (e) {
      if (Platform.OS === 'web') window.alert("Failed to respond. Please try again.");
      else Alert.alert("Error", "Failed to respond. Please try again.");
    } finally {
      setResponding(null);
    }
  };

  const formatDate = (iso?: string) => {
    if (!iso) return null;
    try {
      return new Date(iso).toLocaleDateString("en-GB", {
        day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
      });
    } catch { return null; }
  };

  const DetailRow = ({ icon, label, value }: { icon: string; label: string; value?: string | null | number }) => {
    if (value === undefined || value === null || value === "") return null;
    return (
      <View style={styles.detailRow}>
        <MaterialIcons name={icon as any} size={14} color={colors.icon} style={styles.detailIcon} />
        <Typo variant="caption" style={styles.detailLabel}>{label}</Typo>
        <Typo variant="caption" style={[styles.detailValue, { color: colors.text }]}>{String(value)}</Typo>
      </View>
    );
  };

  const currentList = viewTab === "available" ? requests : acceptedRequests;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Typo variant="h2" style={{ fontWeight: "bold", flex: 1 }}>
          Blood Requests
        </Typo>
        {user?.bloodGroup && (
          <View style={[styles.bloodChip, { backgroundColor: `${colors.error}15` }]}>
            <MaterialIcons name="water-drop" size={14} color={colors.error} />
            <Typo variant="caption" style={{ color: colors.error, fontWeight: "bold", marginLeft: 4 }}>
              {user.bloodGroup}
            </Typo>
          </View>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabSwitcher}>
        <TouchableOpacity 
          style={[styles.tabButton, viewTab === "available" && { borderBottomColor: colors.tint, borderBottomWidth: 2 }]}
          onPress={() => setViewTab("available")}
        >
          <Typo variant="caption" style={{ fontWeight: "bold", color: viewTab === "available" ? colors.tint : colors.textMuted }}>
            Available ({requests.length})
          </Typo>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabButton, viewTab === "accepted" && { borderBottomColor: colors.tint, borderBottomWidth: 2 }]}
          onPress={() => setViewTab("accepted")}
        >
          <Typo variant="caption" style={{ fontWeight: "bold", color: viewTab === "accepted" ? colors.tint : colors.textMuted }}>
            My Contributions ({acceptedRequests.length})
          </Typo>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading && !refreshing ? (
          <ActivityIndicator style={{ marginTop: 48 }} color={colors.tint} size="large" />
        ) : currentList.length === 0 ? (
          <Card variant="outlined" style={[styles.emptyCard, { borderColor: colors.border }]}>
            <MaterialIcons 
              name={viewTab === "available" ? "check-circle-outline" : "volunteer-activism"} 
              size={48} 
              color={colors.icon} 
            />
            <Typo variant="body" color={colors.textMuted} style={{ marginTop: 16, textAlign: "center" }}>
              {viewTab === "available" 
                ? "No blood requests matching your blood type right now." 
                : "You haven't accepted any requests yet."}
            </Typo>
            <Typo variant="caption" color={colors.textMuted} style={{ marginTop: 8 }}>
              Pull down to refresh.
            </Typo>
          </Card>
        ) : (
          currentList.map((request) => {
            const isEmergency = request.isEmergency;
            const urgencyColor = request.urgencyLevel === "critical" ? colors.error : request.urgencyLevel === "high" ? "#F59E0B" : "#10B981";
            const isProcessing = responding === request._id;

            return (
              <Card key={request._id} variant="elevated" style={styles.requestCard}>
                {isEmergency && (
                  <View style={[styles.emergencyBadge, { backgroundColor: colors.error }]}>
                    <Typo variant="caption" style={{ color: "#FFF", fontWeight: "bold" }}>EMERGENCY</Typo>
                  </View>
                )}

                <View style={styles.cardHeader}>
                  <View style={[styles.bloodCircle, { backgroundColor: `${colors.error}10` }]}>
                    <Typo variant="h3" style={{ color: colors.error, fontWeight: "bold" }}>{request.bloodGroup}</Typo>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Typo variant="body" style={{ fontWeight: "bold" }}>{request.patientName || "Blood Required"}</Typo>
                    <Typo variant="caption" color={colors.textMuted}>{request.hospitalName || request.city}</Typo>
                  </View>
                  <Badge 
                    label={request.urgencyLevel} 
                    variant={request.urgencyLevel === "critical" ? "error" : "warning"} 
                  />
                </View>

                <View style={styles.cardBody}>
                  <DetailRow icon="info" label="Reason" value={request.reason} />
                  <DetailRow icon="person" label="Patient" value={`${request.patientAge || ""} ${request.patientGender || ""}`} />
                  <DetailRow icon="location-on" label="Location" value={request.hospitalLocation || request.address} />
                  <DetailRow icon="phone" label="Contact" value={request.coordinatorPhone} />
                  <DetailRow icon="schedule" label="Needed By" value={formatDate(request.neededBefore)} />
                  {request.hospitalReceipt && (
                    <TouchableOpacity onPress={() => setSelectedImage(`${api.defaults.baseURL}${request.hospitalReceipt}`)}>
                      <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}>
                        <MaterialIcons name="receipt" size={16} color={colors.tint} />
                        <Typo variant="caption" style={{ color: colors.tint, textDecorationLine: "underline", marginLeft: 6, fontWeight: "bold" }}>
                          View Hospital Receipt
                        </Typo>
                      </View>
                    </TouchableOpacity>
                  )}
                </View>

                {viewTab === "available" && (
                  <View style={styles.actionRow}>
                    <Button
                      label={isProcessing ? "Processing…" : "✓ Accept"}
                      variant="primary"
                      style={{ flex: 1 }}
                      onPress={() => handleRespond(request._id, "accepted")}
                      disabled={!!responding}
                    />
                    <Button
                      label="Decline"
                      variant="outline"
                      style={{ flex: 1, marginLeft: 12 }}
                      onPress={() => handleRespond(request._id, "declined")}
                      disabled={!!responding}
                    />
                  </View>
                )}

                {viewTab === "accepted" && (
                  <View style={[styles.actionRow, { backgroundColor: `${colors.success}10`, borderRadius: 8, padding: 8 }]}>
                    <MaterialIcons name="check-circle" size={18} color={colors.success} />
                    <Typo variant="caption" style={{ color: colors.success, fontWeight: "bold", marginLeft: 8 }}>
                      You have accepted this request
                    </Typo>
                  </View>
                )}
              </Card>
            );
          })
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Image Modal */}
      <Modal visible={!!selectedImage} transparent={true} animationType="fade" onRequestClose={() => setSelectedImage(null)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setSelectedImage(null)}>
          <TouchableOpacity style={styles.closeModalBtn} onPress={() => setSelectedImage(null)}>
            <MaterialIcons name="close" size={30} color="#FFF" />
          </TouchableOpacity>
          {selectedImage && (
            <Image source={{ uri: selectedImage }} style={styles.fullImage} resizeMode="contain" />
          )}
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  bloodChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  tabSwitcher: {
    flexDirection: "row",
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  tabButton: {
    paddingVertical: 12,
    marginRight: 24,
  },
  scrollContent: {
    padding: 20,
  },
  emptyCard: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
    borderStyle: "dashed",
  },
  requestCard: {
    marginBottom: 20,
    padding: 16,
    position: "relative",
    overflow: "hidden",
  },
  emergencyBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderBottomLeftRadius: 12,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  bloodCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: {
    marginBottom: 16,
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  detailIcon: {
    width: 20,
  },
  detailLabel: {
    width: 80,
    color: "#6B7280",
  },
  detailValue: {
    flex: 1,
    fontWeight: "500",
  },
  actionRow: {
    flexDirection: "row",
    marginTop: 8,
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeModalBtn: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  fullImage: {
    width: '90%',
    height: '80%',
  },
});
