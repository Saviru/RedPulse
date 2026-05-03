import React, { useCallback, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";

import { useThemeColor } from "@/packages/ui/hooks";
import { Typo, Input, Button } from "@/packages/ui/components/ui";
import {
  deleteBloodUnit,
  fetchBloodById,
  fetchHospitalUsernames,
  isoDateToLocalYmd,
  updateBloodUnit,
} from "@/apps/mobile/app/lib/bloodApi";
import {
  ALLOWED_BLOOD_TYPES,
  isAllowedBloodType,
  isAllowedComponent,
  isValidUnitId,
  isValidYmd,
  isVolumeValid,
  parseVolume,
} from "@/apps/mobile/app/lib/bloodValidation";
import { BLOOD_MSG } from "@/apps/mobile/app/lib/bloodMessages";
import ExpiryDatePickerField from "./components/ExpiryDatePickerField";

type FieldErrors = {
  unitId: string;
  username: string;
  bloodType: string;
  componentType: string;
  volume: string;
  collectionDate: string;
  expiryDate: string;
};

function emptyErrors(): FieldErrors {
  return { unitId: "", username: "", bloodType: "", componentType: "", volume: "", collectionDate: "", expiryDate: "" };
}

export default function HospitalEditUnitScreen() {
  const { colors, theme } = useThemeColor();
  const router = useRouter();
  const raw = useLocalSearchParams<{ id?: string | string[] }>().id;
  const id = Array.isArray(raw) ? raw[0] : raw;

  const [unitId, setUnitId] = useState("");
  const [username, setUsername] = useState("");
  const [bloodType, setBloodType] = useState("");
  const [componentType, setComponentType] = useState("");
  const [volume, setVolume] = useState("");
  const [collectionDate, setCollectionDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");

  const [showComponentModal, setShowComponentModal] = useState(false);
  const [showBloodTypeModal, setShowBloodTypeModal] = useState(false);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [hospitalUsernames, setHospitalUsernames] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [topError, setTopError] = useState("");
  const [errors, setErrors] = useState<FieldErrors>(emptyErrors());

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const componentOptions = ["Whole blood", "Red Blood Cells", "Plasma", "Platelets"];

  useFocusEffect(
    useCallback(() => {
      if (!id) {
        setLoading(false);
        return;
      }
      let active = true;
      void (async () => {
        setLoading(true);
        try {
          const usernames = await fetchHospitalUsernames();
          const u = await fetchBloodById(id);
          if (!active) return;
          setHospitalUsernames(usernames);
          setUnitId(u.unitId);
          setUsername(u.username ?? "");
          setBloodType(u.bloodType);
          setComponentType(u.component);
          setVolume(String(u.volume));
          setCollectionDate(isoDateToLocalYmd(u.collectionDateTime));
          setExpiryDate(isoDateToLocalYmd(u.expiryDateTime));
          setErrors(emptyErrors());
          setTopError("");
        } finally {
          if (active) setLoading(false);
        }
      })();
      return () => {
        active = false;
      };
    }, [id, router])
  );

  const computeErrors = useCallback(
    (next: {
      unitId: string;
      username: string;
      bloodType: string;
      componentType: string;
      volume: string;
      collectionDate: string;
      expiryDate: string;
    }): FieldErrors => {
      const e = emptyErrors();

      const unitEmpty = !next.unitId.trim();
      const usernameEmpty = !next.username.trim();
      const bloodEmpty = !next.bloodType.trim();
      const compEmpty = !next.componentType.trim();
      const volEmpty = !next.volume.trim();
      const collEmpty = !next.collectionDate.trim();
      const expEmpty = !next.expiryDate.trim();

      const anyEmpty = unitEmpty || usernameEmpty || bloodEmpty || compEmpty || volEmpty || collEmpty || expEmpty;
      if (anyEmpty) {
        if (unitEmpty) e.unitId = BLOOD_MSG.fillAll;
        if (usernameEmpty) e.username = BLOOD_MSG.fillAll;
        if (bloodEmpty) e.bloodType = BLOOD_MSG.fillAll;
        if (compEmpty) e.componentType = BLOOD_MSG.fillAll;
        if (volEmpty) e.volume = BLOOD_MSG.fillAll;
        if (collEmpty) e.collectionDate = BLOOD_MSG.fillAll;
        if (expEmpty) e.expiryDate = BLOOD_MSG.fillAll;
        return e;
      }

      if (!isValidUnitId(next.unitId)) e.unitId = BLOOD_MSG.invalidFormat;
      if (!isAllowedBloodType(next.bloodType)) e.bloodType = BLOOD_MSG.invalidFormat;
      if (!isAllowedComponent(next.componentType)) e.componentType = BLOOD_MSG.invalidFormat;

      const vol = parseVolume(next.volume);
      if (vol === null || !isVolumeValid(vol)) e.volume = BLOOD_MSG.invalidFormat;

      if (!isValidYmd(next.collectionDate)) e.collectionDate = BLOOD_MSG.invalidFormat;
      if (!isValidYmd(next.expiryDate)) e.expiryDate = BLOOD_MSG.invalidFormat;

      if (!e.collectionDate && !e.expiryDate) {
        const coll = new Date(
          Number(next.collectionDate.slice(0, 4)),
          Number(next.collectionDate.slice(5, 7)) - 1,
          Number(next.collectionDate.slice(8, 10))
        );
        const exp = new Date(
          Number(next.expiryDate.slice(0, 4)),
          Number(next.expiryDate.slice(5, 7)) - 1,
          Number(next.expiryDate.slice(8, 10))
        );
        if (exp <= coll) e.expiryDate = BLOOD_MSG.expiryAfterCollection;
      }

      return e;
    },
    []
  );

  const runValidationAndSetErrors = useCallback(
    (override?: Partial<{
      unitId: string;
      username: string;
      bloodType: string;
      componentType: string;
      volume: string;
      collectionDate: string;
      expiryDate: string;
    }>) => {
      if (!id) return;
      const next = {
        unitId: override?.unitId ?? unitId,
        username: override?.username ?? username,
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
    [bloodType, componentType, computeErrors, collectionDate, expiryDate, id, unitId, username, volume]
  );

  async function handleSave() {
    if (!id) return;
    const computed = computeErrors({ unitId, username, bloodType, componentType, volume, collectionDate, expiryDate });
    setErrors(computed);
    setTopError("");
    const hasErrors = Object.values(computed).some(Boolean);
    if (hasErrors) return;

    const vol = parseVolume(volume);
    if (vol === null) return;

    setSaving(true);
    try {
      await updateBloodUnit(id, {
        username: username.trim(),
        unitId: unitId.trim(),
        bloodType,
        component: componentType,
        volume: vol,
        collectionDate: collectionDate.trim(),
        expiryDate: expiryDate.trim(),
      });
      router.replace("/(hospital)/(tabs)/inventory");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Update failed.";
      if (msg === BLOOD_MSG.invalidUnitId) {
        setErrors((prev) => ({ ...prev, unitId: BLOOD_MSG.invalidUnitId }));
        return;
      }
      if (msg === BLOOD_MSG.hospitalUsernameNotFound) {
        setErrors((prev) => ({ ...prev, username: BLOOD_MSG.hospitalUsernameNotFound }));
        return;
      }
      setTopError(msg);
    } finally {
      setSaving(false);
    }
  }

  async function doDelete() {
    if (!id) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await deleteBloodUnit(id);
      setDeleteOpen(false);
      router.replace("/(hospital)/(tabs)/inventory");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Delete failed.";
      setDeleteError(msg);
    } finally {
      setDeleting(false);
    }
  }

  if (!id) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
        <Typo variant="body" style={{ padding: 24 }}>
          Missing unit id.
        </Typo>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
        <ActivityIndicator style={{ marginTop: 48 }} color={colors.tint} size="large" />
      </SafeAreaView>
    );
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
                Edit Blood Unit
              </Typo>
              <Typo variant="caption" color={colors.textMuted}>
                Update or remove from inventory
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
                HOSPITAL USERNAME
              </Typo>
              <Input
                placeholder="Enter hospital username"
                value={username}
                onChangeText={(t) => {
                  setUsername(t);
                  runValidationAndSetErrors({ username: t });
                }}
                leftIcon={<MaterialIcons name="person" size={20} color={colors.icon} />}
                containerStyle={styles.input}
              />
              <TouchableOpacity
                onPress={() => setShowUsernameModal(true)}
                style={{ alignSelf: "flex-start", marginTop: 8, marginLeft: 4 }}
              >
                <Typo variant="caption" color={colors.tint} style={{ fontWeight: "bold" }}>
                  Select from hospital users
                </Typo>
              </TouchableOpacity>
              {errors.username ? (
                <Typo variant="caption" color={colors.error} style={styles.errorText}>
                  {errors.username}
                </Typo>
              ) : null}
            </View>

            <View style={styles.inputGroup}>
              <Typo variant="caption" style={styles.inputLabel}>
                UNIT ID
              </Typo>
              <Input
                placeholder="UNIT-1001"
                value={unitId}
                onChangeText={(t) => {
                  setUnitId(t);
                  runValidationAndSetErrors({ unitId: t });
                }}
                containerStyle={styles.input}
              />
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
                placeholder="450"
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
                placeholder="2026-03-29"
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
            </View>
          </View>

          <Button
            label={saving ? "Saving…" : "Save changes"}
            variant="primary"
            onPress={() => void handleSave()}
            disabled={saving || deleting}
            style={[styles.submitButton, { backgroundColor: colors.error, borderColor: colors.error }]}
          />

          <Button
            label={deleting ? "Deleting…" : "Delete unit"}
            variant="secondary"
            onPress={() => {
              setDeleteError("");
              setDeleteOpen(true);
            }}
            disabled={saving || deleting}
            style={{ marginTop: 12, height: 56, borderRadius: 16 }}
          />

          <TouchableOpacity onPress={() => router.back()} style={{ alignItems: "center", marginTop: 16 }}>
            <Typo variant="body" style={{ color: colors.textMuted, fontWeight: "bold" }}>
              Cancel
            </Typo>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Delete confirmation modal */}
      <Modal visible={deleteOpen} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 }}>
          <View
            style={{
              backgroundColor: theme === "dark" ? colors.surface : "#FFF",
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
              This cannot be undone.
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
                  onPress={() => setDeleteOpen(false)}
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

      {/* Blood type selection modal */}
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

      {/* Hospital username selection modal */}
      <Modal visible={showUsernameModal} transparent animationType="fade">
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
              Select Hospital Username
            </Typo>
            {hospitalUsernames.length === 0 ? (
              <Typo variant="caption" color={colors.textMuted}>
                No active hospital usernames found. You can still type manually.
              </Typo>
            ) : (
              hospitalUsernames.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={{ paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}
                  onPress={() => {
                    setUsername(opt);
                    setShowUsernameModal(false);
                    runValidationAndSetErrors({ username: opt });
                  }}
                >
                  <Typo variant="body">{opt}</Typo>
                </TouchableOpacity>
              ))
            )}
            <Button variant="secondary" label="Close" onPress={() => setShowUsernameModal(false)} style={{ marginTop: 24 }} />
          </View>
        </View>
      </Modal>

      {/* Component selection modal */}
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

