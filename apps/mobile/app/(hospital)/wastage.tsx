import React, { useCallback, useMemo, useState } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";

import { useThemeColor } from "@/packages/ui/hooks";
import { Typo, Card } from "@/packages/ui/components/ui";
import { fetchAllBloodRecords } from "@/apps/mobile/app/lib/bloodApi";
import { useRemovedExpiredUnitIds } from "@/apps/mobile/app/lib/state/expiredUnitsView";

export default function WastageScreen() {
  const { colors } = useThemeColor();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [expiredTotal, setExpiredTotal] = useState(0);
  const [wastagePercent, setWastagePercent] = useState(0);
  const [chartData, setChartData] = useState<{ label: string; value: number }[]>([]);
  const [pageError, setPageError] = useState("");
  const removedIds = useRemovedExpiredUnitIds();

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void (async () => {
        setLoading(true);
        setPageError("");
        try {
          const units = await fetchAllBloodRecords();
          if (!active) return;
          const now = Date.now();
          const removedSet = new Set(removedIds);
          const expired = units.filter(
            (u) => new Date(u.expiryDateTime).getTime() < now && !removedSet.has(u.id)
          );
          setExpiredTotal(expired.length);
          const totalCount = units.length;
          const currentWastagePercent = totalCount > 0 ? Math.round((expired.length / totalCount) * 100) : 0;
          setWastagePercent(currentWastagePercent);
          const byType = new Map<string, number>();
          for (const u of expired) {
            byType.set(u.bloodType, (byType.get(u.bloodType) ?? 0) + 1);
          }
          const chart = Array.from(byType.entries())
            .map(([label, value]) => ({ label, value }))
            .sort((a, b) => a.label.localeCompare(b.label));
          setChartData(chart);
        } catch (e) {
          if (active) {
            setExpiredTotal(0);
            setWastagePercent(0);
            setChartData([]);
            const msg = e instanceof Error ? e.message : "Could not load wastage data.";
            setPageError(msg);
          }
        } finally {
          if (active) setLoading(false);
        }
      })();
      return () => {
        active = false;
      };
    }, [removedIds])
  );

  const maxValue = useMemo(() => {
    if (chartData.length === 0) return 1;
    return Math.max(1, ...chartData.map((d) => d.value));
  }, [chartData]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { borderColor: colors.border }]}>
            <MaterialIcons name="arrow-back" size={24} color={colors.icon} />
          </TouchableOpacity>
          <Typo variant="h2" style={{ fontWeight: "bold" }}>
            Wastage Overview
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
        ) : (
          <>
            <View style={styles.topCardsRow}>
              <TouchableOpacity
                style={{ flex: 1 }}
                activeOpacity={0.9}
                onPress={() => router.push("/(hospital)/expired-units")}
              >
                <Card variant="elevated" style={[styles.statCard, { borderColor: colors.border }]}>
                  <View style={[styles.iconCircle, { backgroundColor: `${colors.error}15` }]}>
                    <MaterialIcons name="delete" size={20} color={colors.error} />
                  </View>
                  <Typo variant="h2" style={{ fontWeight: "bold", marginTop: 12 }}>
                    {expiredTotal} Units
                  </Typo>
                  <Typo variant="caption" color={colors.textMuted}>
                    Total expired units
                  </Typo>
                  <Typo variant="caption" color={colors.textMuted} style={{ fontSize: 10 }}>
                    (includes expired units)
                  </Typo>
                </Card>
              </TouchableOpacity>

              <Card variant="elevated" style={[styles.statCard, { borderColor: colors.border }]}>
                <View style={[styles.iconCircle, { backgroundColor: `${colors.error}15` }]}>
                  <MaterialIcons name="pie-chart" size={20} color={colors.error} />
                </View>
                <Typo variant="h2" style={{ fontWeight: "bold", marginTop: 12 }}>
                  {wastagePercent}%
                </Typo>
                <Typo variant="caption" color={colors.textMuted}>
                  Wastage rate
                </Typo>
                <Typo variant="caption" color={colors.textMuted} style={{ fontSize: 10 }}>
                  Expired ÷ total units
                </Typo>
              </Card>
            </View>

            <Card variant="elevated" style={[styles.chartCard, { borderColor: colors.border }]}>
              <Typo variant="h2" style={{ fontWeight: "bold" }}>
                Wastage by Blood Type
              </Typo>
              <Typo variant="caption" color={colors.textMuted} style={{ marginBottom: 24 }}>
                Expired units per group
              </Typo>

              {chartData.length === 0 ? (
                <Typo variant="body" color={colors.textMuted}>
                  No expired units in inventory.
                </Typo>
              ) : (
                <View style={[styles.chartContainer, { borderBottomColor: colors.border }]}>
                  {chartData.map((item, index) => {
                    const heightPercent = (item.value / maxValue) * 100;
                    return (
                      <View key={index} style={styles.chartCol}>
                        <Typo variant="caption" color={colors.textMuted} style={{ fontSize: 10, marginBottom: 4 }}>
                          {item.value}
                        </Typo>
                        <View style={[styles.barBg, { backgroundColor: colors.border }]}>
                          <View style={[styles.barFill, { backgroundColor: colors.error, height: `${heightPercent}%` }]} />
                        </View>
                        <Typo variant="caption" style={{ fontWeight: "bold", marginTop: 8 }}>
                          {item.label}
                        </Typo>
                      </View>
                    );
                  })}
                </View>
              )}
            </Card>
          </>
        )}
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
  topCardsRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  chartCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 16,
  },
  chartContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 180,
    marginTop: 16,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0", // default, override inline
    flexWrap: "wrap",
  },
  chartCol: {
    alignItems: "center",
    width: 24,
    marginBottom: 8,
  },
  barBg: {
    width: 16,
    height: 120,
    borderRadius: 8,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  barFill: {
    width: "100%",
    borderRadius: 8,
  },
  topError: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
});
