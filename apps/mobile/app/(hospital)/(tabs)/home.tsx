import React, { useCallback, useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

import { useThemeColor } from "@/packages/ui/hooks";
import { Typo, Card, Badge } from "@/packages/ui/components/ui";
import { useUserStore } from "@/apps/mobile/src/store/UserContext";
import { getMyBloodRequests, getVisibleBloodRequests, BloodRequestResponse } from "@/apps/mobile/src/lib/bloodRequestApi";

export default function HospitalHomeScreen() {
  const { colors } = useThemeColor();
  const router = useRouter();
  const { user, refreshUser } = useUserStore();
  const [myRequests, setMyRequests] = useState<BloodRequestResponse[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<BloodRequestResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [my, incoming] = await Promise.all([
        getMyBloodRequests(),
        getVisibleBloodRequests(),
      ]);
      setMyRequests(my);
      setIncomingRequests(incoming.filter(r => !r.responses.some(resp => resp.responderId === user?.username)));
    } catch (e) {
      console.error("Failed to load data:", e);
    } finally {
      setLoading(false);
    }
  }, [user?.username]);

  useFocusEffect(
    useCallback(() => {
      refreshUser();
      loadData();
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshUser(), loadData()]);
    setRefreshing(false);
  }, [refreshUser, loadData]);

  const acceptedCount = myRequests
    .filter(r => r.status !== "cancelled")
    .flatMap(r => r.responses.filter(resp => resp.status === "accepted")).length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        
        {/* Header Section */}
        <View style={styles.header}>
          <View>
            <Typo variant="h1" style={{ fontWeight: "bold", fontSize: 28 }}>
              {user?.hospitalName || "Hospital Portal"}
            </Typo>
            <Typo variant="body" color={colors.textMuted} style={{ marginTop: 4 }}>
              Manage blood requests and donations
            </Typo>
          </View>

        </View>

        <View style={styles.statsRow}>
          <Card variant="elevated" style={[styles.statCard, { borderColor: colors.border }]}>
            <Typo variant="h1" style={{ color: colors.tint, fontWeight: "bold" }}>
              {myRequests.filter(r => r.status !== "cancelled").length}
            </Typo>
            <Typo variant="caption" color={colors.textMuted}>My Requests</Typo>
          </Card>
          <Card variant="elevated" style={[styles.statCard, { borderColor: colors.border }]}>
            <Typo variant="h1" style={{ color: colors.success, fontWeight: "bold" }}>{acceptedCount}</Typo>
            <Typo variant="caption" color={colors.textMuted}>Accepted</Typo>
          </Card>
          <Card variant="elevated" style={[styles.statCard, { borderColor: colors.border }]}>
            <Typo variant="h1" style={{ color: colors.error, fontWeight: "bold" }}>{incomingRequests.length}</Typo>
            <Typo variant="caption" color={colors.textMuted}>Incoming</Typo>
          </Card>
        </View>

        {/* Dashboard Grid */}
        <View style={styles.dashboardGrid}>
          
          {/* Action 1: Inventory */}
          <TouchableOpacity activeOpacity={0.8} onPress={() => router.push("/(hospital)/(tabs)/inventory" as any)}>
            <Card variant="elevated" style={[styles.actionCard, { borderColor: colors.border }]}>
              <View style={[styles.iconWrapper, { backgroundColor: `${colors.tint}15` }]}>
                <MaterialIcons name="inventory" size={32} color={colors.tint} />
              </View>
              <View style={styles.cardText}>
                <Typo variant="h2" style={{ fontWeight: "bold" }}>Manage Inventory</Typo>
                <Typo variant="caption" color={colors.textMuted} style={{ marginTop: 4 }}>
                  Track blood stock levels, expiring units, and wastage.
                </Typo>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={colors.icon} />
            </Card>
          </TouchableOpacity>

          {/* Action 2: Request Blood */}
          <TouchableOpacity activeOpacity={0.8} onPress={() => router.push("/(hospital)/(tabs)/request" as any)}>
            <Card variant="elevated" style={[styles.actionCard, { borderColor: colors.border }]}>
              <View style={[styles.iconWrapper, { backgroundColor: `${colors.error}15` }]}>
                <MaterialIcons name="bloodtype" size={32} color={colors.error} />
              </View>
              <View style={styles.cardText}>
                <Typo variant="h2" style={{ fontWeight: "bold" }}>Request Blood</Typo>
                <Typo variant="caption" color={colors.textMuted} style={{ marginTop: 4 }}>
                  Request blood from other hospitals in the network.
                </Typo>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={colors.icon} />
            </Card>
          </TouchableOpacity>

          {/* Action 2: Alerts */}
          <TouchableOpacity activeOpacity={0.8} onPress={() => router.push("/(hospital)/(tabs)/alerts" as any)}>
            <Card variant="elevated" style={[styles.actionCard, { borderColor: colors.border }]}>
              <View style={[styles.iconWrapper, { backgroundColor: `${colors.tint}15` }]}>
                <MaterialIcons name="notifications-active" size={32} color={colors.tint} />
              </View>
              <View style={styles.cardText}>
                <Typo variant="h2" style={{ fontWeight: "bold" }}>Alerts</Typo>
                <Typo variant="caption" color={colors.textMuted} style={{ marginTop: 4 }}>
                  Review incoming blood requests from other hospitals.
                </Typo>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={colors.icon} />
            </Card>
          </TouchableOpacity>

          {/* Action 4: Campaign Collaboration */}
          <TouchableOpacity activeOpacity={0.8} onPress={() => router.push("/(hospital)/collaborate-campaigns" as any)}>
            <Card variant="elevated" style={[styles.actionCard, { borderColor: colors.border }]}>
              <View style={[styles.iconWrapper, { backgroundColor: `${colors.success}15` }]}>
                <MaterialIcons name="handshake" size={32} color={colors.success} />
              </View>
              <View style={styles.cardText}>
                <Typo variant="h2" style={{ fontWeight: "bold" }}>Campaign Requests</Typo>
                <Typo variant="caption" color={colors.textMuted} style={{ marginTop: 4 }}>
                  Accept collaboration requests for donation camps.
                </Typo>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={colors.icon} />
            </Card>
          </TouchableOpacity>

        </View>
        {/* Priority Requests */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Typo variant="h2" style={{ fontWeight: "bold" }}>Priority Requests</Typo>
            <TouchableOpacity onPress={() => router.push("/(hospital)/(tabs)/alerts" as any)}>
              <Typo variant="caption" style={{ color: colors.tint }}>View All →</Typo>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator color={colors.tint} />
          ) : incomingRequests.filter(r => r.isEmergency).length === 0 ? (
            <Card variant="outlined" style={[styles.emptyCard, { borderColor: colors.border }]}>
              <MaterialIcons name="done-all" size={28} color={colors.icon} />
              <Typo variant="caption" color={colors.textMuted} style={{ marginTop: 8, textAlign: "center" }}>
                No emergency alerts from other hospitals right now.
              </Typo>
            </Card>
          ) : (
            incomingRequests.filter(r => r.isEmergency).slice(0, 3).map((req) => (
              <TouchableOpacity key={req._id} onPress={() => router.push("/(hospital)/(tabs)/alerts" as any)}>
                <Card
                  variant="elevated"
                  style={[styles.requestCard, { borderColor: colors.error }]}
                >
                  <View style={styles.requestRow}>
                    <View style={[styles.bloodBadge, { backgroundColor: `${colors.error}15` }]}>
                      <Typo variant="h2" style={{ color: colors.error, fontWeight: "bold" }}>{req.bloodGroup}</Typo>
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Typo variant="body" style={{ fontWeight: "bold" }}>{req.reason || "Blood Request"}</Typo>
                      <Typo variant="caption" color={colors.textMuted}>
                        {(() => {
                          const base = req.city || req.locationText || req.hospitalLocation || req.requesterLocation;
                          const ext = req.hospitalName;
                          if (base && ext) return `${base} — ${ext}`;
                          return base || ext || "Unknown Location";
                        })()}
                      </Typo>
                    </View>
                    <Badge label="EMERGENCY" variant="danger" />
                  </View>
                </Card>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 100 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    marginTop: 16,
  },

  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
  },
  dashboardGrid: {
    gap: 16,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
  },
  iconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  cardText: {
    flex: 1,
    marginRight: 8,
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  emptyCard: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
  },
  requestCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  requestRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  bloodBadge: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
