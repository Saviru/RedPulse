import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Modal,
  Linking
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, FontAwesome5, Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";

import { useThemeColor } from "@/packages/ui/hooks";
import { Typo, Input, Toggle, Card } from "@/packages/ui/components/ui";
import api from "@/apps/mobile/src/services/api";
import { createBloodRequest, getBloodRequest, updateBloodRequest, getMyBloodRequests, cancelBloodRequest } from "@/apps/mobile/src/lib/bloodRequestApi";
import type { BloodGroup, BloodRequestResponse } from "@/apps/mobile/src/lib/bloodRequestApi";
import { useUserStore } from "@/apps/mobile/src/store/UserContext";
import { isDuplicateRequest, recordSubmission, cleanInput } from "@/apps/mobile/src/lib/validationUtils";
import { SRI_LANKA_DISTRICTS, SRI_LANKA_CITIES } from "@/apps/mobile/src/lib/srilankaGeography";

const BLOOD_GROUPS: BloodGroup[] = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const URGENCY_LEVELS = ["critical", "high", "medium", "low"] as const;

const RARE_BLOOD_GROUPS = ["O-", "AB-", "B-", "A-"];

// Auto-calculate urgency from isEmergency and blood group rarity.
// This is a backend-facing value — not shown to the user.
function calculateUrgency(isEmergency: boolean, bloodGroup: string): "critical" | "high" | "medium" | "low" {
  if (isEmergency) return "critical";
  if (bloodGroup && RARE_BLOOD_GROUPS.includes(bloodGroup)) return "high";
  return "medium";
}

const REASONS = [
  "Accident",
  "Surgery",
  "Dengue",
  "Cancer",
  "Childbirth",
  "Other"
];

export default function HospitalRequestScreen() {
  const { colors } = useThemeColor();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!id;
  const { user } = useUserStore();

  const [viewMode, setViewMode] = useState<"list" | "form">("list");
  const [myRequests, setMyRequests] = useState<BloodRequestResponse[]>([]);

  const [bloodType, setBloodType] = useState<BloodGroup | "">("");
  const [locationText, setLocationText] = useState("");
  const [hospitalName, setHospitalName] = useState(""); // Exact Location
  const [reason, setReason] = useState("");
  const [urgencyLevel, setUrgencyLevel] = useState<"critical" | "high" | "medium" | "low">("medium");
  const [isEmergency, setIsEmergency] = useState(false);
  const [neededBefore, setNeededBefore] = useState<Date>(new Date(Date.now() + 24 * 60 * 60 * 1000));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditing);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Location Search State
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [activeLocationDropdown, setActiveLocationDropdown] = useState<"district" | "city" | null>(null);
  const [locationSearchQuery, setLocationSearchQuery] = useState("");

  // Dropdown States
  const [isReasonDropdownOpen, setIsReasonDropdownOpen] = useState(false);
  const [isUrgencyDropdownOpen, setIsUrgencyDropdownOpen] = useState(false);

  React.useEffect(() => {
    if (urgencyLevel !== "critical") {
      setIsEmergency(false);
    }
  }, [urgencyLevel]);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const reqs = await getMyBloodRequests();
      setMyRequests(reqs);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelRequest = (requestId: string) => {
    Alert.alert(
      "Cancel Request",
      "Are you sure you want to cancel this request?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            try {
              setIsLoading(true);
              await cancelBloodRequest(requestId);
              await fetchRequests();
              Alert.alert("Success", "Request cancelled successfully.");
            } catch (e) {
              const msg = e instanceof Error ? e.message : "Failed to cancel request.";
              Alert.alert("Error", msg);
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  React.useEffect(() => {
    if (id) {
      const loadRequest = async () => {
        try {
          const req = await getBloodRequest(id);
          setBloodType(req.bloodGroup);
          if ((req as any).neededBefore) {
            setNeededBefore(new Date((req as any).neededBefore));
          }
          const loadedLocation = req.locationText || "";
          if (loadedLocation && loadedLocation.includes(", ")) {
            const parts = loadedLocation.split(", ");
            setSelectedCity(parts[0]);
            setSelectedDistrict(parts[1]);
          } else {
            setSelectedDistrict(loadedLocation);
          }
          setLocationText(loadedLocation);
          setHospitalName(req.hospitalName || "");
          setReason(req.reason || "");
          setUrgencyLevel(req.urgencyLevel);
          setIsEmergency(req.isEmergency);
          setViewMode("form");
        } catch (e) {
          Alert.alert("Error", "Failed to load request details.");
          setViewMode("list");
        } finally {
          setIsLoading(false);
        }
      };
      loadRequest();
    } else {
      fetchRequests();
    }
  }, [id]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const trimmedReason = cleanInput(reason);

    // Blood group
    if (!bloodType) newErrors.bloodGroup = "Blood group is required";

    // neededBefore must be in the future
    if (neededBefore <= new Date()) {
      newErrors.neededBefore = "Required before date/time must be in the future";
    }

    // Location
    if (!selectedDistrict) newErrors.selectedDistrict = "District is required";
    if (!selectedCity) newErrors.selectedCity = "City / Town is required";

    // Reason
    if (!trimmedReason) {
      newErrors.reason = isEmergency ? "Reason is strictly required for emergency cases" : "Reason for request is required";
    } else if (trimmedReason.length < 3) {
      newErrors.reason = "Minimum 3 characters required";
    } else if (trimmedReason.length > 200) {
      newErrors.reason = "Maximum 200 characters allowed";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      Alert.alert(
        "Please Fix These Errors",
        Object.values(newErrors).join("\n\n"),
        [{ text: "OK" }]
      );
      return false;
    }

    return true;
  };

  const resetForm = () => {
    setBloodType("");
    setLocationText("");
    setSelectedDistrict("");
    setSelectedCity("");
    setHospitalName("");
    setNeededBefore(new Date(Date.now() + 24 * 60 * 60 * 1000));
    setReason("");
    setUrgencyLevel("medium");
    setIsEmergency(false);
    setErrors({});
    setLocationSearchQuery("");
    setIsReasonDropdownOpen(false);
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    // Duplicate Check
    const combinedLocation = `${selectedCity}, ${selectedDistrict}`;
    const userId = user?.username || user?.email || "anonymous";
    if (!isEditing && isDuplicateRequest(userId, bloodType, combinedLocation)) {
      Alert.alert("Duplicate Request", "Similar request exists within the last 10 minutes.");
      return;
    }

    setIsSubmitting(true);
    try {
      const requestData = {
        bloodGroup: bloodType as BloodGroup,
        locationText: combinedLocation,
        hospitalName: hospitalName.trim() || undefined,
        neededBefore: neededBefore.toISOString(),
        coordinatorPhone: user?.phone || "",
        reason: reason.trim(),
        urgencyLevel: isEmergency ? "critical" : urgencyLevel,
        isEmergency,
        role: "hospital",
      };

      if (isEditing && id) {
        await updateBloodRequest(id, requestData);
        Alert.alert("Success", "Blood request updated successfully.");
      } else {
        await createBloodRequest(requestData);
        recordSubmission(userId, bloodType, combinedLocation);
        Alert.alert("Request Sent!", "Your request has been published.");
      }
      resetForm();
      setViewMode("list");
      fetchRequests();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to send request.";
      Alert.alert("Request Failed", msg);
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView style={{ backgroundColor: colors.error }} edges={["top"]}>
        <View style={styles.header}>
          {viewMode === "form" ? (
            <TouchableOpacity onPress={() => { setViewMode("list"); resetForm(); router.setParams({ id: undefined }); }} style={styles.backBtn}>
              <MaterialIcons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 40 }} />
          )}
          <Typo variant="h2" style={{ fontWeight: "bold", color: "#FFF", flex: 1, textAlign: "center", marginRight: viewMode === "form" ? 40 : 0 }}>
            {viewMode === "form" ? (isEditing ? "Update Blood Request" : "New Blood Request") : "My Hospital Requests"}
          </Typo>
          {viewMode === "list" && (
            <TouchableOpacity onPress={() => fetchRequests()} style={styles.refreshBtn}>
              <MaterialIcons name="refresh" size={24} color="#FFF" />
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        {isLoading ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="large" color={colors.tint} />
          </View>
        ) : viewMode === "list" ? (
          <View style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.createBtn, { backgroundColor: colors.tint }]}
                onPress={() => { setViewMode("form"); resetForm(); router.setParams({ id: undefined }); }}
              >
                <MaterialIcons name="add" size={24} color="#FFF" />
                <Typo variant="body" style={{ color: "#FFF", fontWeight: "bold", marginLeft: 8 }}>Create New Request</Typo>
              </TouchableOpacity>

              {myRequests.length === 0 ? (
                <View style={styles.emptyState}>
                  <MaterialIcons name="info-outline" size={64} color={colors.textMuted} />
                  <Typo variant="body" style={{ marginTop: 16, color: colors.textMuted }}>No requests yet</Typo>
                  <Typo variant="body" style={{ marginTop: 8, color: colors.textMuted, textAlign: "center" }}>
                    Your hospital blood requests will appear here.
                  </Typo>
                </View>
              ) : (
                myRequests.map((req) => {
                  const isAccepted = req.responses?.some((res: any) => res.status === "accepted");
                  return (
                    <Card key={req._id} variant="elevated" style={styles.requestCard}>
                      <View style={styles.requestCardHeader}>
                        <View style={[styles.bloodBadge, { backgroundColor: colors.tint }]}>
                          <Typo variant="body" style={{ color: "#FFF", fontWeight: "bold" }}>{req.bloodGroup}</Typo>
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <Typo variant="body" style={{ fontWeight: "bold" }}>Hospital Request</Typo>
                          <Typo variant="caption" color={colors.textMuted}>{req.hospitalName || req.locationText}</Typo>
                        </View>
                        <View style={[styles.statusBadge, {
                          backgroundColor: req.status === "open" ? "#E3F2FD" : "#F5F5F5"
                        }]}>
                          <Typo variant="caption" style={{
                            color: req.status === "open" ? "#1976D2" : "#757575",
                            textTransform: "capitalize",
                            fontWeight: "bold"
                          }}>{req.status}</Typo>
                        </View>
                      </View>

                      <View style={styles.requestCardBody}>
                        <View style={styles.infoRow}>
                          <MaterialIcons name="event" size={16} color={colors.icon} />
                          <Typo variant="caption" style={{ marginLeft: 6 }}>
                            Needed by: {(req as any).neededBefore ? new Date((req as any).neededBefore).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : "Unknown"}
                          </Typo>
                        </View>
                        {req.hospitalReceipt && (
                          <TouchableOpacity onPress={() => setSelectedImage(`${api.defaults.baseURL}${req.hospitalReceipt}`)}>
                            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}>
                              <MaterialIcons name="receipt" size={16} color={colors.tint} />
                              <Typo variant="caption" style={{ color: colors.tint, textDecorationLine: "underline", marginLeft: 6, fontWeight: "bold" }}>
                                View Hospital Receipt
                              </Typo>
                            </View>
                          </TouchableOpacity>
                        )}
                        {isAccepted && (
                          <View style={{ marginTop: 12, backgroundColor: "#E8F5E9", padding: 10, borderRadius: 10, borderLeftWidth: 4, borderLeftColor: "#43A047" }}>
                            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                              <MaterialIcons name="check-circle" size={18} color="#43A047" />
                              <Typo variant="caption" style={{ marginLeft: 6, color: "#2E7D32", fontWeight: "bold" }}>
                                {req.responses.filter((r: any) => r.status === "accepted").length} Hospital(s) Accepted
                              </Typo>
                            </View>
                            {req.responses.filter((r: any) => r.status === "accepted").map((res: any, idx: number) => (
                              <View key={idx} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 }}>
                                <Typo variant="caption" style={{ fontWeight: "500" }}>• {res.responderName}</Typo>
                                <Typo variant="caption" color={colors.textMuted}>{res.responderPhone}</Typo>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>

                      {req.status === "open" && (
                        <View style={styles.requestCardFooter}>
                          <TouchableOpacity
                            style={[styles.actionBtn, { borderColor: colors.border }]}
                            onPress={() => {
                              router.setParams({ id: req._id });
                            }}
                          >
                            <MaterialIcons name="edit" size={18} color={colors.tint} />
                            <Typo variant="caption" style={{ marginLeft: 4, color: colors.tint, fontWeight: "bold" }}>Edit</Typo>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.actionBtn, { borderColor: colors.border }]}
                            onPress={() => handleCancelRequest(req._id)}
                          >
                            <MaterialIcons name="cancel" size={18} color={colors.error} />
                            <Typo variant="caption" style={{ marginLeft: 4, color: colors.error, fontWeight: "bold" }}>Cancel</Typo>
                          </TouchableOpacity>
                        </View>
                      )}
                    </Card>
                  );
                })
              )}
            </ScrollView>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

            {/* Info Box */}
            <View style={[styles.infoBox, { backgroundColor: `${colors.tint}12`, borderColor: `${colors.tint}30` }]}>
              <MaterialIcons name="local-hospital" size={22} color={colors.tint} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Typo variant="body" style={{ fontWeight: "bold", color: colors.tint }}>Hospital-to-Hospital Network</Typo>
                <Typo variant="caption" style={{ color: colors.tint, opacity: 0.85, marginTop: 2 }}>
                  Request blood directly from hospitals' blood banks. Faster for urgent cases.
                </Typo>
              </View>
            </View>

            <View style={styles.formContainer}>
              {/* Blood Group */}
              <View style={[
                styles.cardGroup,
                { borderColor: errors.bloodGroup ? colors.error : colors.border, backgroundColor: colors.surface }
              ]}>
                <Typo variant="body" style={[styles.inputLabel, errors.bloodGroup && { color: colors.error }]}>
                  Blood Group Needed
                </Typo>
                <View style={styles.gridContainer}>
                  {BLOOD_GROUPS.map((group) => {
                    const isSelected = bloodType === group;
                    return (
                      <TouchableOpacity
                        key={group}
                        activeOpacity={0.7}
                        style={[
                          styles.gridItem,
                          { borderColor: isSelected ? colors.tint : colors.border },
                          isSelected && { backgroundColor: `${colors.tint}10` },
                          isEditing && { opacity: 0.6 },
                        ]}
                        onPress={() => {
                          if (!isEditing) {
                            setBloodType(group);
                            if (errors.bloodGroup) setErrors(prev => ({ ...prev, bloodGroup: "" }));
                          }
                        }}
                        disabled={isEditing}
                      >
                        <FontAwesome5 name="tint" size={18} color={isSelected ? colors.tint : colors.icon} />
                        <Typo variant="h2" style={{ fontWeight: "bold", marginTop: 6, color: isSelected ? colors.tint : colors.text }}>
                          {group}
                        </Typo>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {errors.bloodGroup && (
                  <Typo variant="caption" style={{ color: colors.error, marginTop: 8 }}>{errors.bloodGroup}</Typo>
                )}
              </View>

              {/* Required Before Date & Time */}
              <View style={[styles.cardGroup, { borderColor: errors.neededBefore ? colors.error : colors.border, backgroundColor: colors.surface }]}>
                <Typo variant="body" style={[styles.inputLabel, errors.neededBefore && { color: colors.error }]}>Required Before</Typo>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <TouchableOpacity
                    style={[styles.datePickerBtn, errors.neededBefore && { borderColor: colors.error }]}
                    onPress={() => { setShowDatePicker(true); setErrors(p => ({ ...p, neededBefore: "" })); }}
                  >
                    <MaterialIcons name="event" size={18} color={errors.neededBefore ? colors.error : colors.text} />
                    <Typo variant="caption" style={{ flex: 1, marginLeft: 6 }}>{neededBefore.toLocaleDateString()}</Typo>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.datePickerBtn, errors.neededBefore && { borderColor: colors.error }]}
                    onPress={() => { setShowTimePicker(true); setErrors(p => ({ ...p, neededBefore: "" })); }}
                  >
                    <MaterialIcons name="schedule" size={18} color={errors.neededBefore ? colors.error : colors.text} />
                    <Typo variant="caption" style={{ flex: 1, marginLeft: 6 }}>{neededBefore.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Typo>
                  </TouchableOpacity>
                </View>
                {errors.neededBefore && <Typo variant="caption" style={{ color: colors.error, marginTop: 6 }}>{errors.neededBefore}</Typo>}
                {showDatePicker && (
                  <DateTimePicker
                    value={neededBefore}
                    mode="date"
                    display="default"
                    minimumDate={new Date()}
                    onChange={(event, date) => {
                      setShowDatePicker(false);
                      if (date) setNeededBefore(date);
                    }}
                  />
                )}
                {showTimePicker && (
                  <DateTimePicker
                    value={neededBefore}
                    mode="time"
                    display="default"
                    onChange={(event, date) => {
                      setShowTimePicker(false);
                      if (date) setNeededBefore(date);
                    }}
                  />
                )}
              </View>

              {/* Units, Location, Radius */}
              <View style={[styles.cardGroup, { borderColor: colors.border, backgroundColor: colors.surface }]}>

                <Typo variant="body" style={{ fontWeight: "bold", fontSize: 16, marginBottom: 12, color: colors.text }}>Patient Current Location:</Typo>

                <View style={styles.inputGroup}>
                  <Typo variant="body" style={styles.inputLabel}>District</Typo>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={[styles.dropdownBtn, errors.selectedDistrict && { borderColor: colors.error }]}
                    onPress={() => { setActiveLocationDropdown("district"); setLocationSearchQuery(""); }}
                  >
                    <Typo variant="body" style={{ color: selectedDistrict ? colors.text : colors.textMuted }}>
                      {selectedDistrict || "Select District..."}
                    </Typo>
                    <MaterialIcons name="arrow-drop-down" size={24} color={colors.icon} />
                  </TouchableOpacity>
                  {errors.selectedDistrict && <Typo variant="caption" style={{ color: colors.error, marginTop: 4 }}>{errors.selectedDistrict}</Typo>}
                </View>

                <View style={styles.inputGroup}>
                  <Typo variant="body" style={styles.inputLabel}>City / Town</Typo>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={[styles.dropdownBtn, (!selectedDistrict || errors.selectedCity) && { borderColor: errors.selectedCity ? colors.error : colors.border }]}
                    onPress={() => {
                      if (!selectedDistrict) {
                        Alert.alert("Notice", "Please select a district first.");
                        return;
                      }
                      setActiveLocationDropdown("city");
                      setLocationSearchQuery("");
                    }}
                  >
                    <Typo variant="body" style={{ color: selectedCity ? colors.text : colors.textMuted }}>
                      {selectedCity || "Select City / Town..."}
                    </Typo>
                    <MaterialIcons name="arrow-drop-down" size={24} color={colors.icon} />
                  </TouchableOpacity>
                  {errors.selectedCity && <Typo variant="caption" style={{ color: colors.error, marginTop: 4 }}>{errors.selectedCity}</Typo>}
                </View>

                <View style={styles.inputGroup}>
                  <Typo variant="body" style={styles.inputLabel}>Patient Current Location Details (Optional)</Typo>
                  <Typo variant="caption" color={colors.textMuted} style={{ marginBottom: 6 }}>
                    You can add patient hospital name or patient current location address for more info.
                  </Typo>
                  <Input
                    value={hospitalName}
                    onChangeText={setHospitalName}
                    containerStyle={styles.input}
                  />
                </View>

                <View style={[styles.inputGroup, { zIndex: 10 }]}>
                  <Typo variant="body" style={styles.inputLabel}>
                    Reason for Request
                  </Typo>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={[styles.dropdownBtn, errors.reason && { borderColor: colors.error }]}
                    onPress={() => setIsReasonDropdownOpen(!isReasonDropdownOpen)}
                  >
                    <Typo variant="body" style={{ color: reason ? colors.text : colors.textMuted }}>
                      {reason || "Select a Reason..."}
                    </Typo>
                    <MaterialIcons name={isReasonDropdownOpen ? "keyboard-arrow-up" : "keyboard-arrow-down"} size={22} color={colors.icon} />
                  </TouchableOpacity>

                  {isReasonDropdownOpen && (
                    <View style={[styles.dropdownMenu, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      <ScrollView nestedScrollEnabled style={{ maxHeight: 180 }}>
                        {REASONS.map((r, i) => (
                          <TouchableOpacity
                            key={r}
                            style={[styles.dropdownItem, i < REASONS.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
                            onPress={() => {
                              setReason(r);
                              setErrors(p => ({ ...p, reason: "" }));
                              setIsReasonDropdownOpen(false);
                            }}
                          >
                            <Typo variant="body">{r}</Typo>
                            {reason === r && <MaterialIcons name="check" size={18} color={colors.tint} />}
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                  {errors.reason && <Typo variant="caption" style={{ color: colors.error, marginTop: 4 }}>{errors.reason}</Typo>}
                </View>
              </View>

              {/* Urgency Level & Emergency */}
              <View style={[styles.cardGroup, { borderColor: colors.border, backgroundColor: colors.surface }]}>

                <View style={[styles.inputGroup, { zIndex: 10 }]}>
                  <Typo variant="body" style={styles.inputLabel}>Urgency Level</Typo>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.dropdownBtn}
                    onPress={() => setIsUrgencyDropdownOpen(!isUrgencyDropdownOpen)}
                    disabled={isEditing}
                  >
                    <Typo variant="body" style={{ color: colors.text, textTransform: "capitalize", opacity: isEditing ? 0.6 : 1 }}>
                      {urgencyLevel}
                    </Typo>
                    <MaterialIcons name={isUrgencyDropdownOpen ? "keyboard-arrow-up" : "keyboard-arrow-down"} size={22} color={colors.icon} />
                  </TouchableOpacity>
                  {isUrgencyDropdownOpen && (
                    <View style={[styles.dropdownMenu, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      <ScrollView nestedScrollEnabled style={{ maxHeight: 180 }}>
                        {URGENCY_LEVELS.map((level, i) => (
                          <TouchableOpacity
                            key={level}
                            style={[styles.dropdownItem, i < URGENCY_LEVELS.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
                            onPress={() => {
                              setUrgencyLevel(level);
                              setIsUrgencyDropdownOpen(false);
                            }}
                          >
                            <Typo variant="body" style={{ textTransform: "capitalize" }}>{level}</Typo>
                            {urgencyLevel === level && <MaterialIcons name="check" size={18} color={level === "critical" ? colors.error : colors.tint} />}
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>


                <View
                  style={[
                    styles.emergencyContainer,
                    {
                      backgroundColor: isEmergency ? `${colors.error}15` : colors.background,
                      borderColor: isEmergency ? colors.error : colors.border,
                      opacity: urgencyLevel === "critical" ? 1 : 0.5
                    }
                  ]}
                  pointerEvents={urgencyLevel === "critical" ? "auto" : "none"}
                >
                  <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
                    <Ionicons name="warning" size={24} color={isEmergency ? colors.error : colors.icon} />
                    <View style={{ marginLeft: 12 }}>
                      <Typo variant="body" style={{ fontWeight: "bold", color: isEmergency ? colors.error : colors.text }}>Is this an Emergency?</Typo>
                      <Typo variant="caption" color={colors.textMuted}>Sends instant push alerts to hospitals</Typo>
                    </View>
                  </View>
                  <Toggle value={isEmergency} onToggle={setIsEmergency} activeColor={colors.error} />
                </View>

              </View>

              {/* Submit */}
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.submitButton,
                  {
                    backgroundColor: colors.tint,
                    opacity: (isSubmitting) ? 0.6 : 1,
                  },
                ]}
                disabled={isSubmitting}
                onPress={handleSubmit}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <MaterialIcons name={isEditing ? "edit" : "local-hospital"} size={20} color="#FFF" style={{ marginRight: 8 }} />
                    <Typo variant="body" style={{ color: "#FFF", fontWeight: "bold" }}>
                      {isEditing ? "Update Request" : "Create Request & Notify Hospitals"}
                    </Typo>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
      {/* Location Search Modal */}
      <Modal visible={activeLocationDropdown !== null} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", paddingTop: 60 }}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={[styles.locationModal, { backgroundColor: colors.surface }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15 }}>
              <Typo variant="h2">Select {activeLocationDropdown === "district" ? "District" : "City / Town"}</Typo>
              <TouchableOpacity onPress={() => setActiveLocationDropdown(null)}>
                <MaterialIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <Input
              placeholder="Search..."
              value={locationSearchQuery}
              onChangeText={setLocationSearchQuery}
              containerStyle={{ marginBottom: 10, height: 48 }}
            />
            <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
              {activeLocationDropdown === "district" && (
                SRI_LANKA_DISTRICTS
                  .filter(d => d.toLowerCase().includes(locationSearchQuery.toLowerCase()))
                  .map((dist, idx) => (
                    <TouchableOpacity
                      key={`dist-${idx}`}
                      style={[styles.dropdownItem, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}
                      onPress={() => {
                        setSelectedDistrict(dist);
                        setSelectedCity(""); // Reset city when district changes
                        setErrors(p => ({ ...p, selectedDistrict: "" }));
                        setActiveLocationDropdown(null);
                      }}
                    >
                      <Typo variant="body">{dist}</Typo>
                    </TouchableOpacity>
                  ))
              )}

              {activeLocationDropdown === "city" && selectedDistrict && (
                (SRI_LANKA_CITIES[selectedDistrict] || [])
                  .filter(c => c.toLowerCase().includes(locationSearchQuery.toLowerCase()))
                  .map((city, idx) => (
                    <TouchableOpacity
                      key={`city-${idx}`}
                      style={[styles.dropdownItem, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}
                      onPress={() => {
                        setSelectedCity(city);
                        setErrors(p => ({ ...p, selectedCity: "" }));
                        setActiveLocationDropdown(null);
                      }}
                    >
                      <Typo variant="body">{city}</Typo>
                    </TouchableOpacity>
                  ))
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Image Modal */}
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
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  refreshBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  requestCard: {
    borderRadius: 16,
    marginBottom: 16,
    padding: 0,
    overflow: "hidden"
  },
  requestCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0"
  },
  bloodBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center"
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  requestCardBody: {
    padding: 16,
    backgroundColor: "#FAFAFA"
  },
  requestCardFooter: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    padding: 8,
    backgroundColor: "#FFF"
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 4,
    borderWidth: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 60,
    paddingHorizontal: 40
  },
  scrollContent: { padding: 16, paddingBottom: 40 },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  formContainer: { flex: 1 },
  cardGroup: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  uploadBtn: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderStyle: "dashed",
    borderRadius: 12,
    overflow: "hidden",
    height: 150,
    justifyContent: "center",
    alignItems: "center",
  },
  uploadPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  previewImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  inputGroup: { marginBottom: 20 },
  inputLabel: { marginBottom: 10, fontWeight: "bold" },
  input: { height: 52, borderRadius: 8 },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  gridItem: {
    width: "22%",
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emergencyContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
  },

  suggestionBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 8,
    marginBottom: 4,
  },

  applyBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginLeft: 8,
  },
  submitButton: {
    flexDirection: "row",
    height: 56,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  dropdownBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 52,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: "#ccc",
  },
  dropdownMenu: {
    marginTop: 4,
    borderRadius: 8,
    borderWidth: 1,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    zIndex: 1000,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  locationModal: {
    height: "70%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  datePickerBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: "#ccc",
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
