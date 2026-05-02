import React, { useCallback, useState } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";

import { useThemeColor } from "@/packages/ui/hooks";
import { Typo, Card, Badge } from "@/packages/ui/components/ui";
import { aggregateStockByBloodType, bloodTypeDisplayName, fetchBloodUnits } from "@/apps/mobile/app/lib/bloodApi";

export default function LowStockScreen() {
  const { colors } = useThemeColor();
  const router = useRouter();
  const [rows, setRows] = useState<{ bloodType: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void (async () => {
        setLoading(true);
        setPageError("");
        try {
          const units = await fetchBloodUnits();
          if (active) {
            const agg = aggregateStockByBloodType(units).filter((r) => r.count <= 5);
            setRows(agg);
          }
        } catch (e) {
          if (active) {
            setRows([]);
            const msg = e instanceof Error ? e.message : "Could not load stock.";
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { borderColor: colors.border }]}>
            <MaterialIcons name="arrow-back" size={24} color={colors.icon} />
          </TouchableOpacity>
          <Typo variant="h2" style={{ fontWeight: "bold" }}>
            Low Stocks
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
        ) : rows.length === 0 ? (
          <Typo variant="body" color={colors.textMuted} style={{ marginTop: 16 }}>
            No blood types are at critical low stock (≤5 active units).
          </Typo>
        ) : (
          <View style={styles.listContainer}>
            {rows.map((stock) => {
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
            })}
          </View>
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
  topError: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
});
