import React from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, TouchableOpacity, View } from "react-native";

import { Typo } from "@/packages/ui/components/ui";
import { useThemeColor } from "@/packages/ui/hooks";
import { BloodUnitResponse, isoDateToLocalYmd } from "@/apps/mobile/src/lib/bloodApi";

type BloodUnitCardProps = {
  unit: BloodUnitResponse;
  onPress?: () => void;
  onDeletePress?: () => void;
  onViewImage?: () => void;
};

function getStatusMeta(unit: BloodUnitResponse, successColor: string, errorColor: string, mutedColor: string): {
  title: string | null;
  titleColor: string;
  daysLeftLine: string | null;
} {
  const expiryDateTime = unit.expiryDateTime ? new Date(unit.expiryDateTime) : null;
  const msLeft = expiryDateTime ? expiryDateTime.getTime() - Date.now() : null;

  const HOUR_MS = 1000 * 60 * 60;
  const DAY_MS = HOUR_MS * 24;

  function remainingLabel(): string | null {
    if (!expiryDateTime || msLeft === null) return null;
    if (msLeft <= 0) return null;
    if (msLeft >= DAY_MS) {
      const days = Math.floor(msLeft / DAY_MS);
      return `${days}d left`;
    }
    const rawHours = Math.floor(msLeft / HOUR_MS);
    const hours = Math.max(1, rawHours);
    return `${hours}h left`;
  }

  if (unit.status === "Available") {
    return {
      title: "Available",
      titleColor: successColor,
      daysLeftLine: null,
    };
  }
  if (unit.status === "Expiring Soon") {
    return {
      title: "Expiring Soon",
      titleColor: errorColor,
      daysLeftLine: remainingLabel(),
    };
  }
  return { title: null, titleColor: mutedColor, daysLeftLine: null };
}

export function BloodUnitCard({ unit, onPress, onDeletePress, onViewImage }: BloodUnitCardProps) {
  const { colors } = useThemeColor();
  const { title, titleColor, daysLeftLine } = getStatusMeta(
    unit,
    colors.success ?? "#22C55E",
    colors.error ?? "#EF4444",
    colors.textMuted
  );

  const Container = onPress ? TouchableOpacity : View;
  const containerProps = onPress
    ? ({ activeOpacity: 0.9, onPress, style: styles.cardMain } as const)
    : ({ style: styles.cardMain } as const);

  return (
    <View style={[styles.card, { borderColor: colors.border }]}>
      <Container {...containerProps}>
        <View style={styles.cardTopRow}>
          <View style={styles.topLeft}>
            <View style={[styles.typeCircle, { backgroundColor: `${colors.tint}15` }]}>
              <Typo variant="body" style={{ color: colors.tint, fontWeight: "bold" }}>
                {unit.bloodType}
              </Typo>
            </View>
            <View style={styles.idBlock}>
              <Typo variant="body" style={styles.unitIdText} numberOfLines={1} ellipsizeMode="tail">
                {unit.unitId}
              </Typo>
              <Typo
                variant="caption"
                color={colors.textMuted}
                style={styles.componentText}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {unit.component}
              </Typo>
            </View>
          </View>

          {onDeletePress ? (
            <Pressable
              onPress={onDeletePress}
              style={({ pressed }) => [styles.deleteIconBtn, pressed && { opacity: 0.7 }]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialIcons name="delete-outline" size={20} color={colors.error} />
            </Pressable>
          ) : null}
        </View>

        <View style={styles.badgeRow}>
          {title ? (
            <View style={[styles.statusBadge, { backgroundColor: `${titleColor}18` }]}>
              <Typo variant="caption" style={{ color: titleColor, fontWeight: "bold", fontSize: 11 }}>
                {title}
              </Typo>
            </View>
          ) : null}
          {unit.status === "Expiring Soon" && daysLeftLine ? (
            <View style={[styles.daysLeftBadge, { backgroundColor: `${titleColor}12`, borderColor: `${titleColor}66` }]}>
              <Typo variant="caption" style={{ color: titleColor, fontWeight: "600", fontSize: 10 }}>
                {daysLeftLine}
              </Typo>
            </View>
          ) : null}
        </View>

        <View style={[styles.cardBottomRow, { borderTopColor: colors.border }]}>
          <View style={styles.dateItem}>
            <MaterialIcons name="calendar-today" size={13} color={colors.textMuted} />
            <Typo variant="caption" color={colors.textMuted} style={styles.dateText}>
              Collected: {isoDateToLocalYmd(unit.collectionDateTime)}
            </Typo>
          </View>
          <View style={styles.dateItem}>
            <MaterialIcons name="schedule" size={13} color={colors.textMuted} />
            <Typo variant="caption" color={colors.textMuted} style={styles.dateText}>
              {unit.status === "Expiring Soon"
                ? `Expires: ${isoDateToLocalYmd(unit.expiryDateTime)} ${unit.formattedExpiryTime}`
                : `Expires: ${isoDateToLocalYmd(unit.expiryDateTime)}`}
            </Typo>
          </View>
        </View>

        {unit.packetImageUri && onViewImage && (
          <TouchableOpacity onPress={onViewImage} style={[styles.imageBtn, { backgroundColor: `${colors.tint}10` }]}>
            <MaterialIcons name="image" size={16} color={colors.tint} />
            <Typo variant="caption" style={{ color: colors.tint, marginLeft: 6, fontWeight: "600" }}>
              View Packet Image
            </Typo>
          </TouchableOpacity>
        )}
      </Container>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  cardMain: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  badgeRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 6,
    marginBottom: 10,
  },
  daysLeftBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  topLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  idBlock: {
    flex: 1,
    minWidth: 0,
    paddingRight: 4,
  },
  unitIdText: {
    fontWeight: "bold",
    fontSize: 15,
  },
  componentText: {
    fontSize: 11,
    marginTop: 2,
  },
  deleteIconBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  typeCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  cardBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 10,
    flexWrap: "wrap",
  },
  dateItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  dateText: {
    fontSize: 11,
  },
  imageBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
});
