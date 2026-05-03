import React, { useCallback, useMemo, useState } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";

import { useThemeColor } from "@/packages/ui/hooks";
import { Typo, Card } from "@/packages/ui/components/ui";
import { BloodUnitResponse, fetchBloodAlerts, isoDateToLocalYmd } from "@/apps/mobile/src/lib/bloodApi";

export default function ExpiryAlertsScreen() {
  const { colors } = useThemeColor();
  const router = useRouter();
  const [units, setUnits] = useState<BloodUnitResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void (async () => {
        setLoading(true);
        setPageError("");
        try {
          const data = await fetchBloodAlerts();
          if (active) setUnits(data);
        } catch (e) {
          if (active) {
            setUnits([]);
            const msg = e instanceof Error ? e.message : "Could not load alerts.";
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

  function badgeFor(unit: BloodUnitResponse) {
    const orange = colors.error;
    const expiryDateTime = unit.expiryDateTime ? new Date(unit.expiryDateTime) : null;
    const msLeft = expiryDateTime ? expiryDateTime.getTime() - Date.now() : null;

    const HOUR_MS = 1000 * 60 * 60;
    const DAY_MS = HOUR_MS * 24;

    const remainingLabel = (): string | null => {
      if (!expiryDateTime || msLeft === null || msLeft <= 0) return null;
      if (msLeft >= DAY_MS) {
        const days = Math.floor(msLeft / DAY_MS);
        return `${days}d left`;
      }
      const rawHours = Math.floor(msLeft / HOUR_MS);
      const hours = Math.max(1, rawHours);
      return `${hours}h left`;
    };

    return {
      title: "Expiring Soon",
      titleColor: orange,
      subLabel: remainingLabel(),
      subColor: orange,
    };
  }

  const expiringSoonUnits = useMemo(() => {
    const now = Date.now();
    return units.filter((unit) => new Date(unit.expiryDateTime).getTime() > now);
  }, [units]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { borderColor: colors.border }]}>
            <MaterialIcons name="arrow-back" size={24} color={colors.icon} />
          </TouchableOpacity>
          <Typo variant="h2" style={{ fontWeight: "bold" }}>
            Expiry Alerts
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
        ) : expiringSoonUnits.length === 0 ? (
          <Typo variant="body" color={colors.textMuted} style={{ marginTop: 16 }}>
            No expiring soon units.
          </Typo>
        ) : (
          <View style={styles.listContainer}>
            {expiringSoonUnits.map((unit) => {
              const { title, titleColor, subLabel, subColor } = badgeFor(unit);

              return (
                <Card
                  variant="elevated"
                  key={unit.id}
                  style={[
                    styles.stockItem,
                    {
                      borderColor: titleColor,
                      borderWidth: 1,
                    },
                  ]}
                >
                  <View style={[styles.bloodTypeIcon, { backgroundColor: `${titleColor}15` }]}>
                    <Typo variant="body" style={{ color: titleColor, fontWeight: "bold" }}>
                      {unit.bloodType}
                    </Typo>
                  </View>

                  <View style={{ flex: 1, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <View>
                      <Typo variant="body" style={{ fontWeight: "bold" }}>
                        {unit.unitId}
                      </Typo>
                      <Typo variant="caption" color={colors.textMuted} style={{ marginTop: 2 }}>
                        {unit.component}
                      </Typo>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <View style={[styles.badgeBase, { backgroundColor: `${titleColor}16` }]}>
                        <Typo variant="caption" style={{ fontWeight: "bold", color: titleColor }}>
                          {title}
                        </Typo>
                      </View>
                      {subLabel ? (
                        <View style={[styles.badgeBase, styles.subBadge, { backgroundColor: `${subColor}10`, borderColor: `${subColor}66` }]}>
                          <Typo variant="caption" style={{ fontWeight: "bold", color: subColor }}>
                            {subLabel}
                          </Typo>
                        </View>
                      ) : null}
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
                        <MaterialIcons name="schedule" size={12} color={colors.textMuted} />
                        <Typo variant="caption" color={colors.textMuted}>
                          Expires: {isoDateToLocalYmd(unit.expiryDateTime)} {unit.formattedExpiryTime}
                        </Typo>
                      </View>
                    </View>
                  </View>
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
  badgeBase: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 6,
  },
  subBadge: {
    borderWidth: 1,
  },
  topError: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
});
