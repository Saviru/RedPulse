import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View, Modal, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";

import { Typo } from "@/packages/ui/components/ui";
import { useThemeColor } from "@/packages/ui/hooks";
import { BloodUnitResponse, fetchBloodUnits, API_BASE_URL } from "@/apps/mobile/src/lib/bloodApi";
import { BloodUnitCard } from "./components/BloodUnitCard";

export default function BloodTypeUnitsScreen() {
  const { colors } = useThemeColor();
  const router = useRouter();
  const params = useLocalSearchParams<{ bloodType?: string }>();
  const bloodType = (params.bloodType ?? "").trim();

  const [units, setUnits] = useState<BloodUnitResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void (async () => {
        setLoading(true);
        setPageError("");
        try {
          const data = await fetchBloodUnits();
          if (active) setUnits(data);
        } catch (e) {
          if (active) {
            setUnits([]);
            const msg = e instanceof Error ? e.message : "Could not load units.";
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

  const filteredUnits = useMemo(() => {
    return units
      .filter((unit) => unit.bloodType === bloodType)
      .sort((a, b) => {
        const aTime = new Date(a.expiryDateTime).getTime();
        const bTime = new Date(b.expiryDateTime).getTime();
        const safeATime = Number.isNaN(aTime) ? Number.MAX_SAFE_INTEGER : aTime;
        const safeBTime = Number.isNaN(bTime) ? Number.MAX_SAFE_INTEGER : bTime;
        return safeATime - safeBTime;
      });
  }, [units, bloodType]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { borderColor: colors.border }]}>
            <MaterialIcons name="arrow-back" size={24} color={colors.icon} />
          </TouchableOpacity>
          <View>
            <Typo variant="h2">{bloodType || "Blood Type"} Blood Units</Typo>
            <Typo variant="caption" color={colors.textMuted}>
              Sorted by Expiry Date (FIFO)
            </Typo>
          </View>
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
        ) : filteredUnits.length === 0 ? (
          <Typo variant="body" color={colors.textMuted} style={{ marginTop: 16 }}>
            No {bloodType || "selected"} blood units found.
          </Typo>
        ) : (
          <View style={styles.listContainer}>
            {filteredUnits.map((unit) => (
              <BloodUnitCard key={unit.id} unit={unit} onViewImage={() => setSelectedImage(`${API_BASE_URL}${unit.packetImageUri}`)} />
            ))}
          </View>
        )}
      </ScrollView>

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
