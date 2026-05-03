import React, { useCallback, useState } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { useThemeColor } from "@/packages/ui/hooks";
import { Typo, Card, Badge, StatCard } from "@/packages/ui/components/ui";
import {
  aggregateStockByBloodType,
  bloodTypeDisplayName,
  fetchBloodUnits,
  fetchDashboard,
} from "@/apps/mobile/src/lib/bloodApi";

export default function HospitalInventoryScreen() {
  const { colors } = useThemeColor();
  const router = useRouter();

  const [totalUnits, setTotalUnits] = useState<number | null>(null);
  const [wastagePct, setWastagePct] = useState<number | null>(null);
  const [lowStockCount, setLowStockCount] = useState<number | null>(null);
  const [expiringSoon, setExpiringSoon] = useState<number | null>(null);
  const [stockPreview, setStockPreview] = useState<{ bloodType: string; count: number }[]>([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void (async () => {
        try {
          const [d, units] = await Promise.all([fetchDashboard(), fetchBloodUnits()]);
          if (!active) return;
          setTotalUnits(d.totalUnits);
          setWastagePct(d.wastagePercent);
          setLowStockCount(d.lowStockBloodTypes.length);
          setExpiringSoon(d.expiringSoonCount);
          const agg = aggregateStockByBloodType(units);
          setStockPreview(agg.slice(0, 3));
        } catch {
          if (!active) return;
          setTotalUnits(null);
          setWastagePct(null);
          setLowStockCount(null);
          setExpiringSoon(null);
          setStockPreview([]);
        }
      })();
      return () => {
        active = false;
      };
    }, [])
  );

  const fmt = (n: number | null, fallback: string) =>
    n === null ? fallback : String(n);
  const fmtPct = (n: number | null, fallback: string) =>
    n === null ? fallback : `${n}%`;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <Typo variant="h2" style={{ fontWeight: "bold" }}>Inventory</Typo>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.tint }]}
            onPress={() => router.push("/(hospital)/add-unit")}
          >
            <MaterialIcons name="add" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Highlight Stats Grid */}
        <View style={styles.gridContainer}>
          <TouchableOpacity style={styles.gridCardContainer} onPress={() => router.push("/(hospital)/unit-list" as any)}>
            <StatCard
              label="Total Units"
              value={fmt(totalUnits, "—")}
              icon={<MaterialIcons name="local-drink" size={24} color={colors.tint} />}
              accentColor={colors.tint}
              style={styles.innerStatCard}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridCardContainer} onPress={() => router.push("/(hospital)/wastage")}>
            <StatCard
              label="Wastage"
              value={fmtPct(wastagePct, "—")}
              icon={<MaterialIcons name="delete-sweep" size={24} color={colors.error} />}
              accentColor={colors.error}
              style={styles.innerStatCard}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridCardContainer} onPress={() => router.push("/(hospital)/low-stock" as any)}>
            <StatCard
              label="Low Stock"
              value={fmt(lowStockCount, "—")}
              icon={<MaterialIcons name="warning" size={24} color={colors.error} />}
              accentColor={colors.error}
              style={styles.innerStatCard}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridCardContainer} onPress={() => router.push("/(hospital)/expiry-alerts")}>
            <StatCard
              label="Expiring Soon"
              value={fmt(expiringSoon, "—")}
              icon={<MaterialIcons name="timer" size={24} color={colors.textMuted} />}
              accentColor={colors.textMuted}
              style={styles.innerStatCard}
            />
          </TouchableOpacity>
        </View>


        <View style={styles.sectionHeader}>
          <Typo variant="h2" style={styles.sectionTitle}>Stock by Blood Type</Typo>
          <TouchableOpacity onPress={() => router.push("/(hospital)/stock-list")}>
            <Typo variant="caption" color={colors.tint} style={{ fontWeight: "bold" }}>View All</Typo>
          </TouchableOpacity>
        </View>

        {/* Stock List Teaser */}
        <View style={styles.stockList}>
          {stockPreview.length === 0 ? (
            <Typo variant="caption" color={colors.textMuted}>
              Add units to see stock by blood type.
            </Typo>
          ) : (
            stockPreview.map((stock) => {
              const isCritical = stock.count <= 5;
              return (
                <Card
                  variant="elevated"
                  key={stock.bloodType}
                  style={[styles.stockItem, { borderColor: isCritical ? colors.error : colors.border }]}
                >
                  <View
                    style={[
                      styles.bloodTypeIcon,
                      { backgroundColor: isCritical ? `${colors.error}15` : `${colors.tint}15` },
                    ]}
                  >
                    <Typo
                      variant="body"
                      style={{ color: isCritical ? colors.error : colors.tint, fontWeight: "bold" }}
                    >
                      {stock.bloodType}
                    </Typo>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Typo variant="body" style={{ fontWeight: "bold" }}>
                      {bloodTypeDisplayName(stock.bloodType)}
                    </Typo>
                    <Typo variant="caption" color={colors.textMuted}>
                      {stock.count} Units Available
                    </Typo>
                  </View>
                  <Badge
                    label={isCritical ? "Critical Low" : "Normal Stock"}
                    variant={isCritical ? "danger" : "success"}
                  />
                </Card>
              );
            })
          )}
        </View>

      </ScrollView>
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
    marginBottom: 32,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 32,
  },
  gridCardContainer: {
    width: "47%",
  },
  innerStatCard: {
    width: "100%",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  gridLabel: {
    fontWeight: "bold",
    fontSize: 10,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: "bold",
  },
  stockList: {
    gap: 16,
  },
  stockItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 16,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 1,
  },
  bloodTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
});
