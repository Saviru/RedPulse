import React, { useCallback, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Platform,
  TouchableOpacity,
  Linking,
  Modal,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";

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

export default function HospitalAlertsScreen() {
  const { colors } = useThemeColor();
  const { user } = useUserStore();
  const [activeTab, setActiveTab] = useState<"pending" | "accepted">("pending");
  const [pendingRequests, setPendingRequests] = useState<BloodRequestResponse[]>([]);
  const [acceptedRequests, setAcceptedRequests] = useState<BloodRequestResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [responding, setResponding] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [priorityData, acceptedData] = await Promise.all([
        getPriorityBloodRequests(),
        getAcceptedBloodRequests()
      ]);
      
      const pending = priorityData.filter(r =>
        r.requesterId !== user?.username &&
        !r.responses.some(resp => resp.responderId === user?.username)
      );
      
      // Accepted requests are returned by getAcceptedBloodRequests already filtered by backend
      const accepted = acceptedData.filter(r => r.requesterId !== user?.username);

      const sortRequests = (reqs: BloodRequestResponse[]) => reqs.sort((a, b) => {
        if (a.isEmergency && !b.isEmergency) return -1;
        if (!a.isEmergency && b.isEmergency) return 1;
        return (b.priorityScore || 0) - (a.priorityScore || 0);
      });

      setPendingRequests(sortRequests(pending));
      setAcceptedRequests(sortRequests(accepted));
    } catch (e) {
      console.error("Failed to load alerts:", e);
    } finally {
      setLoading(false);
    }
  }, [user?.username]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleRespond = async (requestId: string, status: "accepted" | "declined") => {
    setResponding(requestId);
    setPendingRequests(prev => prev.filter(r => r._id !== requestId));
    try {
      await respondToBloodRequest(requestId, { status });
      const title = status === "accepted" ? "Request Accepted" : "Declined";
      const msg = status === "accepted"
        ? "You have agreed to fulfill this blood request."
        : "You have declined this request.";
      if (Platform.OS === 'web') window.alert(`${title}\n${msg}`);
      else Alert.alert(title, msg);
      await loadData();
    } catch (e) {
      await loadData();
      if (Platform.OS === 'web') window.alert("Failed to respond. Please try again.");
      else Alert.alert("Error", "Failed to respond. Please try again.");
    } finally {
      setResponding(null);
    }
  };

  const getUrgencyColor = (urgency: string, isEmergency: boolean) => {
    if (isEmergency) return colors.error;
    switch (urgency) {
      case "critical": return colors.error;
      case "high":     return "#F59E0B";
      case "medium":   return colors.tint;
      default:         return colors.icon;
    }
  };

  const getRankLabel = (index: number) => {
    if (index === 0) return "Highest Priority";
    if (index === 1) return "High Priority";
    if (index === 2) return "Medium Priority";
    return `#${index + 1}`;
  };

  const DetailRow = ({
    icon, label, value, valueColor,
  }: { icon: string; label: string; value?: string | null; valueColor?: string }) => {
    if (!value) return null;
    return (
      <View style={styles.detailRow}>
        <MaterialIcons name={icon as any} size={14} color={colors.icon} style={styles.detailIcon} />
        <Typo variant="caption" style={styles.detailLabel}>{label}</Typo>
        <Typo variant="caption" style={[styles.detailValue, { color: valueColor || colors.text }]}>{value}</Typo>
      </View>
    );
  };

  const displayedRequests = activeTab === "pending" ? pendingRequests : acceptedRequests;
  const emergencyAlerts = displayedRequests.filter(r => r.isEmergency);
  const normalAlerts = displayedRequests.filter(r => !r.isEmergency);

  const renderCard = (request: BloodRequestResponse, isEmergency: boolean, index: number) => {
    const mainColor = getUrgencyColor(request.urgencyLevel, isEmergency);
    const isProcessing = responding === request._id;
    const baseLocation = request.hospitalLocation || request.requesterLocation || request.locationText || request.city;
    const location = baseLocation 
      ? (request.hospitalName ? `${baseLocation} — ${request.hospitalName}` : baseLocation)
      : (request.hospitalName || "Unknown Location");

    return (
      <Card
        key={request._id}
        variant="elevated"
        style={[styles.alertCard, { borderColor: isEmergency ? mainColor : colors.border, borderWidth: isEmergency ? 2 : 1 }]}
      >
        {/* Emergency Banner */}
        {isEmergency && (
          <View style={[styles.emergencyBanner, { backgroundColor: mainColor }]}>
            <MaterialIcons name="warning" size={14} color="#FFF" />
            <Typo variant="caption" style={{ color: "#FFF", fontWeight: "bold", marginLeft: 4 }}>
              EMERGENCY — Immediate Response Required
            </Typo>
          </View>
        )}

        {/* === HEAD === */}
        <View style={styles.cardHead}>
          <View style={[styles.bloodTypeBadge, { backgroundColor: `${mainColor}18` }]}>
            <Typo variant="h2" style={{ color: mainColor, fontWeight: "bold", fontSize: 20 }}>
              {request.bloodGroup}
            </Typo>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Typo variant="body" style={{ fontWeight: "bold", fontSize: 15 }}>
              {request.requesterName || "Hospital Request"}
            </Typo>
            <Typo variant="caption" color={colors.textMuted} style={{ marginTop: 2 }}>
              {getRankLabel(index)}
            </Typo>
          </View>
          <View style={{ alignItems: "flex-end", gap: 4 }}>
            <View style={[styles.urgencyBadge, { backgroundColor: `${mainColor}18` }]}>
              <Typo variant="caption" style={{ color: mainColor, fontWeight: "bold", textTransform: "uppercase", fontSize: 10 }}>
                {request.urgencyLevel}
            </Typo>
            </View>
            {isEmergency && <Badge label="EMERGENCY" variant="danger" />}
            <Badge
              label={request.status.toUpperCase().replace("_", " ")}
              variant={request.status === "open" ? "success" : "default"}
            />
          </View>
        </View>

        {/* === DIVIDER === */}
        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* === REQUEST DETAILS === */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <MaterialIcons name="local-hospital" size={14} color={mainColor} />
            <Typo variant="caption" style={{ color: mainColor, fontWeight: "bold", marginLeft: 4 }}>REQUEST DETAILS</Typo>
          </View>
          <DetailRow icon="location-on"       label="Location"          value={location} />
          <DetailRow icon="phone"              label="Contact"           value={request.coordinatorPhone || request.requesterPhone} />
          <DetailRow icon="healing"            label="Reason"            value={request.reason} />
          <DetailRow icon="event"              label="Required Before"   value={(request as any).neededBefore ? new Date((request as any).neededBefore).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : null} />
          <DetailRow icon="schedule"           label="Submitted"         value={request.createdAt ? new Date(request.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : null} />
          {request.hospitalReceipt && (
            <TouchableOpacity onPress={() => setSelectedImage(`${api.defaults.baseURL}${request.hospitalReceipt}`)}>
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}>
                <MaterialIcons name="receipt" size={16} color={mainColor} />
                <Typo variant="caption" style={{ color: mainColor, textDecorationLine: "underline", marginLeft: 6, fontWeight: "bold" }}>
                  View Hospital Receipt
                </Typo>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* === RESPONSES SUMMARY === */}
        {request.responses.length > 0 && (
          <View style={[styles.section, { backgroundColor: `${colors.tint}08` }]}>
            <Typo variant="caption" color={colors.textMuted}>
              {request.responses.filter(r => r.status === "accepted").length} hospital(s) have responded
            </Typo>
          </View>
        )}

        {/* === ACTIONS === */}
        {activeTab === "pending" ? (
          <View style={styles.actionRow}>
            <Button
              label={isProcessing ? "Processing…" : "✓ Respond"}
              variant="primary"
              style={{ flex: 1, backgroundColor: mainColor }}
              onPress={() => handleRespond(request._id, "accepted")}
              disabled={isProcessing}
            />
            <Button
              label="✕ Decline"
              variant="secondary"
              style={{ flex: 1, marginLeft: 10 }}
              onPress={() => handleRespond(request._id, "declined")}
              disabled={isProcessing}
            />
          </View>
        ) : (
          <View style={[styles.actionRow, { justifyContent: "center", backgroundColor: `${colors.success}15`, padding: 12, borderRadius: 8 }]}>
            <MaterialIcons name="check-circle" size={20} color={colors.success} />
            <Typo variant="body" style={{ color: colors.success, fontWeight: "bold", marginLeft: 8 }}>
              You accepted this request
            </Typo>
          </View>
        )}
      </Card>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Typo variant="h2" style={{ fontWeight: "bold" }}>Hospital Alerts</Typo>
        <Typo variant="caption" color={colors.textMuted} style={{ marginTop: 4 }}>
          Blood requests from other hospitals in the network
        </Typo>
        
        {/* Tabs */}
        <View style={[styles.tabsContainer, { backgroundColor: colors.surface }]}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === "pending" && { backgroundColor: colors.tint }]} 
            onPress={() => setActiveTab("pending")}
          >
            <Typo variant="body" style={{ color: activeTab === "pending" ? "#FFF" : colors.text, fontWeight: "bold" }}>Pending</Typo>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === "accepted" && { backgroundColor: colors.tint }]} 
            onPress={() => setActiveTab("accepted")}
          >
            <Typo variant="body" style={{ color: activeTab === "accepted" ? "#FFF" : colors.text, fontWeight: "bold" }}>Accepted</Typo>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading ? (
          <ActivityIndicator style={{ marginTop: 48 }} color={colors.tint} size="large" />
        ) : displayedRequests.length === 0 ? (
          <Card variant="outlined" style={[styles.emptyCard, { borderColor: colors.border }]}>
            <MaterialIcons name="check-circle-outline" size={48} color={colors.icon} />
            <Typo variant="body" color={colors.textMuted} style={{ marginTop: 16, textAlign: "center" }}>
              {activeTab === "pending" 
                ? "No incoming blood requests right now.\nPull down to refresh."
                : "You haven't accepted any requests yet."}
            </Typo>
          </Card>
        ) : (
          <>
            {emergencyAlerts.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIconBg, { backgroundColor: `${colors.error}15` }]}>
                    <MaterialIcons name="local-fire-department" size={18} color={colors.error} />
                  </View>
                  <Typo variant="h2" style={{ fontWeight: "bold", color: colors.error }}>
                    Emergency Requests ({emergencyAlerts.length})
                  </Typo>
                </View>
                {emergencyAlerts.map((r, i) => renderCard(r, true, i))}
              </>
            )}

            {normalAlerts.length > 0 && (
              <>
                <View style={[styles.sectionHeader, { marginTop: emergencyAlerts.length > 0 ? 24 : 0 }]}>
                  <View style={[styles.sectionIconBg, { backgroundColor: `${colors.tint}15` }]}>
                    <MaterialIcons name="list" size={18} color={colors.tint} />
                  </View>
                  <Typo variant="h2" style={{ fontWeight: "bold" }}>
                    Other Requests ({normalAlerts.length})
                  </Typo>
                </View>
                {normalAlerts.map((r, i) => renderCard(r, false, emergencyAlerts.length + i))}
              </>
            )}
          </>
        )}
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
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  scrollContent: { padding: 16, paddingBottom: 40 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  sectionIconBg: {
    padding: 8,
    borderRadius: 10,
  },
  emptyCard: {
    padding: 40,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    marginTop: 40,
  },
  alertCard: {
    borderRadius: 16,
    marginBottom: 14,
    overflow: "hidden",
  },
  emergencyBanner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  cardHead: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    paddingBottom: 10,
  },
  bloodTypeBadge: {
    width: 52,
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  divider: {
    height: 1,
    marginHorizontal: 14,
    marginBottom: 4,
  },
  section: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginHorizontal: 8,
    marginBottom: 4,
    borderRadius: 10,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 5,
  },
  detailIcon: {
    marginTop: 1,
    width: 18,
  },
  detailLabel: {
    width: 72,
    opacity: 0.6,
    fontSize: 12,
  },
  detailValue: {
    flex: 1,
    fontSize: 12,
    fontWeight: "500",
  },
  actionRow: {
    flexDirection: "row",
    padding: 14,
    paddingTop: 8,
  },
  tabsContainer: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 4,
    marginTop: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
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
