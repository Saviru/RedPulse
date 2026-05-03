import React, { useCallback, useMemo, useState } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Modal, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";

import { useThemeColor } from "@/packages/ui/hooks";
import { Typo, Input, Button } from "@/packages/ui/components/ui";
import { createBloodUnit, fetchNextBloodUnitId } from "@/apps/mobile/app/lib/bloodApi";
import { useUserStore } from "@/apps/mobile/app/store/UserContext";
import {
  ALLOWED_BLOOD_TYPES,
  ALLOWED_COMPONENTS,
  calculateDaysLeftFromYmd,
  todayYmdLocal,
  isAllowedBloodType,
  isAllowedComponent,
  isValidYmd,
  isVolumeValid,
  parseVolume,
} from "@/apps/mobile/app/lib/bloodValidation";
import { BLOOD_MSG } from "@/apps/mobile/app/lib/bloodMessages";
import ExpiryDatePickerField from "./components/ExpiryDatePickerField";

type FieldErrors = {
  unitId: string;
  bloodType: string;
  componentType: string;
  volume: string;
  collectionDate: string;
  expiryDate: string;
};

function emptyErrors(): FieldErrors {
  return { unitId: "", bloodType: "", componentType: "", volume: "", collectionDate: "", expiryDate: "" };
}

export default function HospitalAddUnitScreen() {
  const { colors, theme } = useThemeColor();
  const router = useRouter();
  const { user } = useUserStore();

  const componentOptions = ["Whole blood", "Red Blood Cells", "Plasma", "Platelets"];
  const todayYmd = todayYmdLocal();

  const [unitId, setUnitId] = useState("");
  const [bloodType, setBloodType] = useState("");
  const [componentType, setComponentType] = useState("");
  const [volume, setVolume] = useState("");
  const [collectionDate, setCollectionDate] = useState(todayYmd);
  const [expiryDate, setExpiryDate] = useState("");

  const [showComponentModal, setShowComponentModal] = useState(false);
  const [showBloodTypeModal, setShowBloodTypeModal] = useState(false);

  const [saving, setSaving] = useState(false);
  const [loadingUnitId, setLoadingUnitId] = useState(false);
  const [topError, setTopError] = useState("");
  const [errors, setErrors] = useState<FieldErrors>(emptyErrors());

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void (async () => {
        setCollectionDate(todayYmdLocal());
        setLoadingUnitId(true);
        try {
          const nextUnitId = await fetchNextBloodUnitId();
          if (!active) return;
          setUnitId(nextUnitId);
        } catch (e) {
          if (!active) return;
          const msg = e instanceof Error ? e.message : "Could not load next Unit ID.";
          setTopError(msg);
        } finally {
          if (active) setLoadingUnitId(false);
        }
      })();
      return () => {
        active = false;
      };
    }, [])
  );

  const expiryDaysLeft = useMemo(() => {
    if (!expiryDate.trim()) return null;
    return calculateDaysLeftFromYmd(expiryDate.trim());
  }, [expiryDate]);

  const computeErrors = useCallback(
    (next: {
      unitId: string;
      bloodType: string;
      componentType: string;
      volume: string;
      collectionDate: string;
      expiryDate: string;
    }): FieldErrors => {
      const e = emptyErrors();

      const bloodEmpty = !next.bloodType.trim();
      const compEmpty = !next.componentType.trim();
      const volEmpty = !next.volume.trim();
      const collEmpty = !next.collectionDate.trim();
      const expEmpty = !next.expiryDate.trim();

      const anyEmpty = bloodEmpty || compEmpty || volEmpty || collEmpty || expEmpty;
      if (anyEmpty) {
        if (bloodEmpty) e.bloodType = BLOOD_MSG.fillAll;
        if (compEmpty) e.componentType = BLOOD_MSG.fillAll;
        if (volEmpty) e.volume = BLOOD_MSG.fillAll;
        if (collEmpty) e.collectionDate = BLOOD_MSG.fillAll;
        if (expEmpty) e.expiryDate = BLOOD_MSG.fillAll;
        return e;
      }

      // Format checks.
      if (!isAllowedBloodType(next.bloodType)) e.bloodType = BLOOD_MSG.invalidFormat;
      if (!isAllowedComponent(next.componentType)) e.componentType = BLOOD_MSG.invalidFormat;

      const vol = parseVolume(next.volume);
      if (vol === null || !isVolumeValid(vol)) e.volume = BLOOD_MSG.invalidFormat;

      if (!isValidYmd(next.collectionDate)) e.collectionDate = BLOOD_MSG.invalidFormat;
      if (!isValidYmd(next.expiryDate)) e.expiryDate = BLOOD_MSG.invalidFormat;

      
      // Cross-field checks (only if date formats are valid).
      
      if (!e.collectionDate && !e.expiryDate) {
        const coll = next.collectionDate.trim();
        const exp = next.expiryDate.trim();
        const collDate = new Date(Number(coll.slice(0, 4)), Number(coll.slice(5, 7)) - 1, Number(coll.slice(8, 10)));
        const expDate = new Date(Number(exp.slice(0, 4)), Number(exp.slice(5, 7)) - 1, Number(exp.slice(8, 10)));
        const collMs = new Date(collDate.getFullYear(), collDate.getMonth(), collDate.getDate()).getTime();
        const expMs = new Date(expDate.getFullYear(), expDate.getMonth(), expDate.getDate()).getTime();
        if (expMs <= collMs) e.expiryDate = BLOOD_MSG.expiryAfterCollection;

        if (coll !== todayYmdLocal()) {
          // Add rule: collectionDate must always be current date.
          e.collectionDate = BLOOD_MSG.collectionMustBeToday;
        }
      }

      return e;
    },
    []
  );

  const runValidationAndSetErrors = useCallback(
    (override?: Partial<Omit<FieldErrors, never>> & Partial<{ unitId: string; bloodType: string; componentType: string; volume: string; collectionDate: string; expiryDate: string }>) => {
      const next = {
        unitId: override?.unitId ?? unitId,
        bloodType: override?.bloodType ?? bloodType,
        componentType: override?.componentType ?? componentType,
        volume: override?.volume ?? volume,
        collectionDate: override?.collectionDate ?? collectionDate,
        expiryDate: override?.expiryDate ?? expiryDate,
      };
      const computed = computeErrors(next);
      setTopError("");
      setErrors(computed);
    },
    [bloodType, componentType, computeErrors, collectionDate, expiryDate, unitId, volume]
  );

  async function handleSave() {
    const computed = computeErrors({ unitId, bloodType, componentType, volume, collectionDate, expiryDate });
    setErrors(computed);
    setTopError("");
    const hasErrors = Object.values(computed).some(Boolean);
    if (hasErrors) return;

    const vol = parseVolume(volume);
    if (vol === null) return;

    setSaving(true);
    try {
      await createBloodUnit({
        username: user?.username || "",
        bloodType,
        component: componentType,
        volume: vol,
        collectionDate: collectionDate.trim(),
        expiryDate: expiryDate.trim(),
      });
      router.replace("/(hospital)/(tabs)/inventory");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not save.";
      if (msg === BLOOD_MSG.invalidUnitId) {
        setErrors((prev) => ({ ...prev, unitId: BLOOD_MSG.invalidUnitId }));
        setTopError("");
      } else {
        setTopError(msg);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { borderColor: colors.border }]}>
              <MaterialIcons name="close" size={24} color={colors.icon} />
            </TouchableOpacity>
            <View>
              <Typo variant="h2" style={{ fontWeight: "bold" }}>
                Add Blood Unit
              </Typo>
              <Typo variant="caption" color={colors.textMuted}>
                Register new donation into inventory
              </Typo>
            </View>
            <View style={{ width: 40 }} />
          </View>

          {topError ? (
            <View style={[styles.topError, { backgroundColor: `${colors.error}12`, borderColor: colors.error }]}>
              <Typo variant="caption" style={{ color: colors.error, fontWeight: "600" }}>
                {topError}
              </Typo>
            </View>
          ) : null}

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Typo variant="caption" style={styles.inputLabel}>
                UNIT ID
              </Typo>
              <Input
                placeholder="UNIT-1"
                value={unitId}
                onChangeText={() => {}}
                containerStyle={styles.input}
                editable={false}
              />
              {loadingUnitId ? (
                <Typo variant="caption" color={colors.textMuted} style={styles.errorText}>
                  Generating next Unit ID...
                </Typo>
              ) : null}
              {errors.unitId ? (
                <Typo variant="caption" color={colors.error} style={styles.errorText}>
                  {errors.unitId}
                </Typo>
              ) : null}
            </View>



            <View style={styles.inputGroup}>
              <Typo variant="caption" style={styles.inputLabel}>
                BLOOD TYPE
              </Typo>
              <TouchableOpacity onPress={() => setShowBloodTypeModal(true)}>
                <View pointerEvents="none">
                  <Input
                    placeholder="Select blood type"
                    value={bloodType}
                    onChangeText={() => {}}
                    leftIcon={<MaterialIcons name="bloodtype" size={20} color={colors.icon} />}
                    containerStyle={styles.input}
                    editable={false}
                  />
                </View>
              </TouchableOpacity>
              {errors.bloodType ? (
                <Typo variant="caption" color={colors.error} style={styles.errorText}>
                  {errors.bloodType}
                </Typo>
              ) : null}
            </View>

            <View style={styles.inputGroup}>
              <Typo variant="caption" style={styles.inputLabel}>
                COMPONENT TYPE
              </Typo>
              <TouchableOpacity onPress={() => setShowComponentModal(true)}>
                <View pointerEvents="none">
                  <Input
                    placeholder="Select blood component"
                    value={componentType}
                    onChangeText={() => {}}
                    leftIcon={<MaterialIcons name="science" size={20} color={colors.icon} />}
                    containerStyle={styles.input}
                    editable={false}
                  />
                </View>
              </TouchableOpacity>
              {errors.componentType ? (
                <Typo variant="caption" color={colors.error} style={styles.errorText}>
                  {errors.componentType}
                </Typo>
              ) : null}
            </View>

            <View style={styles.inputGroup}>
              <Typo variant="caption" style={styles.inputLabel}>
                VOLUME (ML)
              </Typo>
              <Input
                placeholder="450-500"
                value={volume}
                onChangeText={(t) => {
                  setVolume(t);
                  runValidationAndSetErrors({ volume: t });
                }}
                leftIcon={<MaterialIcons name="water-drop" size={20} color={colors.icon} />}
                containerStyle={styles.input}
                keyboardType="numeric"
              />
              {errors.volume ? (
                <Typo variant="caption" color={colors.error} style={styles.errorText}>
                  {errors.volume}
                </Typo>
              ) : null}
            </View>

            <View style={styles.inputGroup}>
              <Typo variant="caption" style={styles.inputLabel}>
                COLLECTION DATE (YYYY-MM-DD)
              </Typo>
              <Input
                placeholder={todayYmd}
                value={collectionDate}
                onChangeText={(t) => {
                  setCollectionDate(t);
                  runValidationAndSetErrors({ collectionDate: t });
                }}
                leftIcon={<MaterialIcons name="event" size={20} color={colors.icon} />}
                containerStyle={styles.input}
              />
              {errors.collectionDate ? (
                <Typo variant="caption" color={colors.error} style={styles.errorText}>
                  {errors.collectionDate}
                </Typo>
              ) : null}
            </View>

            <View style={styles.inputGroup}>
              <Typo variant="caption" style={styles.inputLabel}>
                EXPIRY DATE (YYYY-MM-DD)
              </Typo>
              <ExpiryDatePickerField
                value={expiryDate}
                onChangeValue={(ymd) => {
                  setExpiryDate(ymd);
                  runValidationAndSetErrors({ expiryDate: ymd });
                }}
                containerStyle={styles.input}
              />
              {errors.expiryDate ? (
                <Typo variant="caption" color={colors.error} style={styles.errorText}>
                  {errors.expiryDate}
                </Typo>
              ) : null}

              {expiryDaysLeft !== null ? (
                <Typo variant="caption" color={colors.textMuted} style={{ marginTop: 8, marginLeft: 4 }}>
                  {expiryDaysLeft < 0
                    ? "Expired"
                    : expiryDaysLeft === 0
                      ? "Expires today"
                      : `${expiryDaysLeft}d left`}
                </Typo>
              ) : null}
            </View>
          </View>

          <Button
            label={saving ? "Saving…" : loadingUnitId ? "Preparing Unit ID…" : "Save Unit"}
            variant="primary"
            onPress={() => void handleSave()}
            disabled={saving || loadingUnitId}
            style={[styles.submitButton, { backgroundColor: colors.error, borderColor: colors.error }]}
          />

          {saving ? <ActivityIndicator style={{ marginTop: 12 }} color={colors.tint} /> : null}

          <TouchableOpacity onPress={() => router.back()} style={{ alignItems: "center", marginTop: 16 }}>
            <Typo variant="body" style={{ color: colors.textMuted, fontWeight: "bold" }}>
              Cancel
            </Typo>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={showBloodTypeModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View
            style={{
              backgroundColor: theme === "dark" ? colors.surface : "#FFF",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 24,
              paddingBottom: 40,
            }}
          >
            <Typo variant="h2" style={{ fontWeight: "bold", marginBottom: 16 }}>
              Select Blood Type
            </Typo>
            {ALLOWED_BLOOD_TYPES.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={{ paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}
                onPress={() => {
                  setBloodType(opt);
                  setShowBloodTypeModal(false);
                  runValidationAndSetErrors({ bloodType: opt });
                }}
              >
                <Typo variant="body">{opt}</Typo>
              </TouchableOpacity>
            ))}
            <Button variant="secondary" label="Close" onPress={() => setShowBloodTypeModal(false)} style={{ marginTop: 24 }} />
          </View>
        </View>
      </Modal>

      <Modal visible={showComponentModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View
            style={{
              backgroundColor: theme === "dark" ? colors.surface : "#FFF",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 24,
              paddingBottom: 40,
            }}
          >
            <Typo variant="h2" style={{ fontWeight: "bold", marginBottom: 16 }}>
              Select Component
            </Typo>
            {componentOptions.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={{ paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}
                onPress={() => {
                  setComponentType(opt);
                  setShowComponentModal(false);
                  runValidationAndSetErrors({ componentType: opt });
                }}
              >
                <Typo variant="body">{opt}</Typo>
              </TouchableOpacity>
            ))}
            <Button variant="secondary" label="Close" onPress={() => setShowComponentModal(false)} style={{ marginTop: 24 }} />
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
    marginBottom: 32,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  formContainer: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontWeight: "bold",
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    height: 56,
    borderRadius: 16,
  },
  submitButton: {
    height: 56,
    borderRadius: 16,
  },
  topError: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  errorText: {
    marginTop: 6,
    marginLeft: 4,
  },
});

