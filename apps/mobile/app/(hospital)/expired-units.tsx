import React, { useCallback, useMemo, useState } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";

import { useThemeColor } from "@/packages/ui/hooks";
import { Typo, Card, Button } from "@/packages/ui/components/ui";
import { BloodUnitResponse, fetchAllBloodRecords, isoDateToLocalYmd } from "@/apps/mobile/app/lib/bloodApi";
import { hideExpiredUnitFromView, useRemovedExpiredUnitIds } from "@/apps/mobile/app/lib/state/expiredUnitsView";

export default function ExpiredUnitsScreen() {
  const { colors } = useThemeColor();
  const router = useRouter();
  const [units, setUnits] = useState<BloodUnitResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [removeOpen, setRemoveOpen] = useState(false);
  const [unitToRemove, setUnitToRemove] = useState<BloodUnitResponse | null>(null);

  const removedIds = useRemovedExpiredUnitIds();

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void (async () => {
        setLoading(true);
        setPageError("");
        try {
          const data = await fetchAllBloodRecords();
          if (active) setUnits(data);
        } catch (e) {
          if (active) {
            setUnits([]);
            const msg = e instanceof Error ? e.message : "Could not load expired units.";
            setPageError(msg);
          }
        } finally {
          if (active) setLoading(false);
        }
      })();
      return () => {
        active = false;
      };
    }, [])
  );

  const expiredUnits = useMemo(() => {
    const now = Date.now();
    const removedSet = new Set(removedIds);
    return units
      .filter((unit) => new Date(unit.expiryDateTime).getTime() < now && !removedSet.has(unit.id))
      .sort((a, b) => new Date(b.expiryDateTime).getTime() - new Date(a.expiryDateTime).getTime());
  }, [units, removedIds]);

  function openRemoveConfirm(unit: BloodUnitResponse) {
    setUnitToRemove(unit);
    setRemoveOpen(true);
  }

  function confirmRemoveFromView() {
    if (!unitToRemove) return;
    hideExpiredUnitFromView(unitToRemove.id);
    setRemoveOpen(false);
    setUnitToRemove(null);
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { borderColor: colors.border }]}>
            <MaterialIcons name="arrow-back" size={24} color={colors.icon} />
          </TouchableOpacity>
          <Typo variant="h2" style={{ fontWeight: "bold" }}>
            Expired Blood Units
          </Typo>
          <View style={{ width: 40 }} />
        </View>

        {pageError ? (
          <View style={[styles.topError, { backgroundColor: `${colors.error}12`, borderColor: colors.error }]}>
            <Typo variant="caption" style={{ color: colors.error, fontWeight: "600" }}>
              {pageError}
            </Typo>
          </View>
        ) : null}

        {loading ? (
          <ActivityIndicator color={colors.tint} style={{ marginTop: 24 }} size="large" />
        ) : expiredUnits.length === 0 ? (
          <Typo variant="body" color={colors.textMuted} style={{ marginTop: 16 }}>
            No expired units in inventory.
          </Typo>
        ) : (
          <View style={styles.listContainer}>
            {expiredUnits.map((unit) => (
              <Card
                variant="elevated"
                key={unit.id}
                style={[
                  styles.stockItem,
                  {
                    borderColor: colors.error,
                    borderWidth: 1,
                  },
                ]}
              >
                <View style={[styles.bloodTypeIcon, { backgroundColor: `${colors.error}15` }]}>
                  <Typo variant="body" style={{ color: colors.error, fontWeight: "bold" }}>
                    {unit.bloodType}
                  </Typo>
                </View>

                <View style={styles.contentRow}>
                  <View style={styles.leftInfo}>
                    <Typo variant="body" style={{ fontWeight: "bold" }}>
                      {unit.unitId}
                    </Typo>
                    <Typo variant="caption" color={colors.textMuted} style={{ marginTop: 2 }}>
                      {unit.component}
                    </Typo>
                  </View>
                  <View style={styles.rightInfo}>
                    <View style={styles.rightTopRow}>
                      <View style={[styles.badgeBase, { backgroundColor: `${colors.error}16` }]}>
                        <Typo variant="caption" style={{ fontWeight: "bold", color: colors.error }}>
                          Expired
                        </Typo>
                      </View>
                      <Pressable
                        onPress={() => openRemoveConfirm(unit)}
                        style={({ pressed }) => [styles.deleteIconBtn, pressed && { opacity: 0.7 }]}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <MaterialIcons name="delete-outline" size={20} color={colors.error} />
                      </Pressable>
                    </View>
                    <View style={styles.expiryRow}>
                      <MaterialIcons name="schedule" size={12} color={colors.textMuted} />
                      <Typo variant="caption" color={colors.textMuted} style={styles.expiryText}>
                        Expires: {isoDateToLocalYmd(unit.expiryDateTime)} {unit.formattedExpiryTime}
                      </Typo>
                    </View>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal visible={removeOpen} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 }}>
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 16,
              padding: 20,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Typo variant="h2" style={{ fontWeight: "bold", marginBottom: 8 }}>
              Remove from expired list?
            </Typo>
            <Typo variant="caption" color={colors.textMuted} style={{ marginBottom: 16 }}>
              Do you want to remove this expired unit from the expired list view?
            </Typo>

            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Button
                  variant="secondary"
                  label="Cancel"
                  onPress={() => {
                    setRemoveOpen(false);
                    setUnitToRemove(null);
                  }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  variant="primary"
                  label="Remove"
                  onPress={confirmRemoveFromView}
                  style={{ backgroundColor: colors.error, borderColor: colors.error }}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 40 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  listContainer: {
    gap: 16,
  },
  stockItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    gap: 16,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 1,
  },
  bloodTypeIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeBase: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 6,
  },
  contentRow: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minWidth: 0,
    gap: 12,
  },
  leftInfo: {
    flex: 1,
    minWidth: 0,
  },
  rightInfo: {
    alignItems: "flex-end",
    justifyContent: "center",
    flexShrink: 1,
    minWidth: 0,
  },
  rightTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
  },
  expiryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
    marginTop: 2,
  },
  expiryText: {
    textAlign: "right",
  },
  deleteIconBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  topError: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
});
