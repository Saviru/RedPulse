import React, { useCallback, useState } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";

import { useThemeColor } from "@/packages/ui/hooks";
import { Typo, Button } from "@/packages/ui/components/ui";
import { BloodUnitResponse, deleteBloodUnit, fetchBloodUnits } from "@/apps/mobile/app/lib/bloodApi";
import { BloodUnitCard } from "./components/BloodUnitCard";

export default function UnitListScreen() {
  const { colors } = useThemeColor();
  const router = useRouter();

  const [units, setUnits] = useState<BloodUnitResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [unitToDelete, setUnitToDelete] = useState<BloodUnitResponse | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void (async () => {
        setLoading(true);
        setListError("");
        try {
          const data = await fetchBloodUnits();
          if (active) setUnits(data);
        } catch (e) {
          if (active) {
            setUnits([]);
            const msg = e instanceof Error ? e.message : "Could not load units.";
            setListError(msg);
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

  function openDelete(unit: BloodUnitResponse) {
    setUnitToDelete(unit);
    setDeleteError("");
    setDeleteOpen(true);
  }

  async function doDelete() {
    if (!unitToDelete) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await deleteBloodUnit(unitToDelete.id);
      setUnits((prev) => prev.filter((u) => u.id !== unitToDelete.id));
      setDeleteOpen(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Delete failed.";
      setDeleteError(msg);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { borderColor: colors.border }]}>
            <MaterialIcons name="arrow-back" size={24} color={colors.icon} />
          </TouchableOpacity>
          <View>
            <Typo variant="h2">Total Units</Typo>
            <Typo variant="caption" color={colors.textMuted}>
              Sorted by Expiry Date (FIFO)
            </Typo>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {listError ? (
          <View style={[styles.topError, { backgroundColor: `${colors.error}12`, borderColor: colors.error }]}>
            <Typo variant="caption" style={{ color: colors.error, fontWeight: "600" }}>
              {listError}
            </Typo>
          </View>
        ) : null}

        {loading ? (
          <ActivityIndicator color={colors.tint} style={{ marginTop: 24 }} size="large" />
        ) : units.length === 0 ? (
          <Typo variant="body" color={colors.textMuted} style={{ marginTop: 16 }}>
            No units yet. Add one from Inventory.
          </Typo>
        ) : (
          <View style={styles.listContainer}>
            {units.map((unit) => {
              return (
                <BloodUnitCard
                  key={unit.id}
                  unit={unit}
                  onPress={() => router.push({ pathname: "/(hospital)/edit-unit", params: { id: unit.id } })}
                  onDeletePress={() => openDelete(unit)}
                />
              );
            })}
          </View>
        )}
      </ScrollView>

      <Modal visible={deleteOpen} transparent animationType="fade">
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
              Delete unit
            </Typo>
            <Typo variant="caption" color={colors.textMuted} style={{ marginBottom: 16 }}>
              {unitToDelete ? `Remove ${unitToDelete.unitId}?` : "Remove this unit?"}
            </Typo>

            {deleteError ? (
              <Typo variant="caption" color={colors.error} style={{ marginBottom: 12, fontWeight: "600" }}>
                {deleteError}
              </Typo>
            ) : null}

            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Button
                  variant="secondary"
                  label="Cancel"
                  onPress={() => {
                    if (!deleting) setDeleteOpen(false);
                  }}
                  disabled={deleting}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  variant="primary"
                  label={deleting ? "Deleting…" : "Delete"}
                  onPress={() => void doDelete()}
                  disabled={deleting}
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
    alignItems: "center",
    justifyContent: "space-between",
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
  topError: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
});

