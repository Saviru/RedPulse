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
  Modal
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, FontAwesome5, Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";

import { useThemeColor } from "@/packages/ui/hooks";
import { Typo, Input, Card, Toggle } from "@/packages/ui/components/ui";
import { 
  createBloodRequest, 
  getBloodRequest, 
  updateBloodRequest, 
  getMyBloodRequests, 
  cancelBloodRequest,
  getAcceptedBloodRequests
} from "@/apps/mobile/app/lib/bloodRequestApi";
import type { BloodGroup, UrgencyLevel } from "@/apps/mobile/app/lib/bloodRequestApi";
import { useUserStore } from "../../store/UserContext";
import { isDuplicateRequest, recordSubmission, cleanInput } from "@/apps/mobile/app/lib/validationUtils";
import { SRI_LANKA_DISTRICTS, SRI_LANKA_CITIES } from "@/apps/mobile/app/lib/srilankaGeography";

const BLOOD_GROUPS: BloodGroup[] = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const GENDERS = ["Male", "Female", "Other"] as const;
const REASONS = [
  "Accident",
  "Surgery",
  "Dengue",
  "Cancer",
  "Childbirth",
  "Other"
];

const RELATIONSHIPS = ["Family", "Friend", "Other"];
const URGENCY_LEVELS = ["critical", "high", "medium", "low"] as const;

const RARE_BLOOD_GROUPS = ["O-", "AB-", "B-", "A-"];

// Auto-calculate urgency from isEmergency, patient age and blood group rarity.
// This is a backend-facing value — not shown to the user.
function calculateUrgency(
  isEmergency: boolean,
  patientAge: string,
  bloodGroup: string
): UrgencyLevel {
  if (isEmergency) return "critical";

  let level: UrgencyLevel = "medium";

  // Age modifier: very young or elderly patients are higher risk
  const age = parseInt(patientAge);
  if (!isNaN(age) && (age < 5 || age > 70)) {
    level = "high";
  }

  // Rare blood group: harder to source → bump up urgency
  if (bloodGroup && RARE_BLOOD_GROUPS.includes(bloodGroup)) {
    if (level === "medium") level = "high";
    else if (level === "high") level = "critical";
  }

  return level;
}

export default function UserRequestBloodScreen() {
  const { colors, theme } = useThemeColor();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [editingId, setEditingId] = useState<string | null>(id || null);
  const isEditing = !!editingId;
  const { user } = useUserStore();

  // 1. Patient Information
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientGender, setPatientGender] = useState<"Male" | "Female" | "Other" | "">("");
  const [patientDetails, setPatientDetails] = useState(""); // Condition/Diagnosis

  // 2. Blood Requirement Details
  const [bloodType, setBloodType] = useState<BloodGroup | "">("");
  
  const [neededBefore, setNeededBefore] = useState<Date>(new Date(Date.now() + 24 * 60 * 60 * 1000));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // 3. Location & Contact
  const [hospitalLocation, setHospitalLocation] = useState("");
  const [requesterLocation, setRequesterLocation] = useState("");
  const [hospitalName, setHospitalName] = useState(""); // Exact Location
  
  // Location Search State
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [activeLocationDropdown, setActiveLocationDropdown] = useState<"district" | "city" | null>(null);
  const [locationSearchQuery, setLocationSearchQuery] = useState("");

  // 4. Priority & Emergency Details
  const [urgencyLevel, setUrgencyLevel] = useState<UrgencyLevel>("medium");
  const [isEmergency, setIsEmergency] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [isReasonDropdownOpen, setIsReasonDropdownOpen] = useState(false);
  const [relationshipToPatient, setRelationshipToPatient] = useState("");
  const [isRelationshipDropdownOpen, setIsRelationshipDropdownOpen] = useState(false);
  const [isGenderDropdownOpen, setIsGenderDropdownOpen] = useState(false);
  const [isUrgencyDropdownOpen, setIsUrgencyDropdownOpen] = useState(false);
  const [doctorName, setDoctorName] = useState("");

  const [viewMode, setViewMode] = useState<"list" | "form">("list");
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Always loading initially to fetch list
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchRequests = async () => {
    try {
      const requests = await getMyBloodRequests();
      setMyRequests(requests);
    } catch (e) {
      console.error("Failed to fetch requests:", e);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    if (urgencyLevel !== "critical") {
      setIsEmergency(false);
    }
  }, [urgencyLevel]);

  React.useEffect(() => {
    if (id) {
      setEditingId(id);
      setViewMode("form");
      const loadRequest = async () => {
        setIsLoading(true);
        try {
          const req = await getBloodRequest(id);
          // Set fields from loaded data
          setPatientName(req.patientName || "");
          setPatientAge(req.patientAge?.toString() || "");
          setPatientGender((req.patientGender as any) || "");
          setPatientDetails(req.patientDetails || "");
          
          setBloodType(req.bloodGroup);
          if ((req as any).neededBefore) {
            setNeededBefore(new Date((req as any).neededBefore));
          }

          const loadedLocation = req.hospitalLocation || (req as any).locationText || req.address || req.city || "";
          if (loadedLocation && loadedLocation.includes(", ")) {
            const parts = loadedLocation.split(", ");
            setSelectedCity(parts[0]);
            setSelectedDistrict(parts[1]);
          } else {
            setSelectedDistrict(loadedLocation);
          }
          setHospitalLocation(loadedLocation);
          setHospitalName(req.hospitalName || "");
          
          setSelectedReason(req.reason || "");
          setRelationshipToPatient((req as any).relationshipToPatient || "");
          setDoctorName((req as any).doctorName || "");
          setUrgencyLevel(req.urgencyLevel || "medium");
          setIsEmergency(req.isEmergency);
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

    // Patient
    if (!cleanInput(patientName)) newErrors.patientName = "Patient Name is required";
    if (!patientGender) newErrors.patientGender = "Gender is required";

    // Age Validation
    if (patientAge.trim() === "") {
      newErrors.patientAge = "Age is required";
    } else {
      const ageNum = parseInt(patientAge.trim(), 10);
      if (isNaN(ageNum) || !Number.isInteger(ageNum)) {
        newErrors.patientAge = "Age must be a valid whole number";
      } else if (ageNum < 0) {
        newErrors.patientAge = "Age cannot be less than 0";
      } else if (ageNum > 150) {
        newErrors.patientAge = "Invalid Age";
      }
    }
    
    // Blood
    if (!bloodType) newErrors.bloodGroup = "Blood group is required";

    // Location
    if (!selectedDistrict) newErrors.selectedDistrict = "District is required";
    if (!selectedCity) newErrors.selectedCity = "City / Town is required";

    // Priority
    if (!cleanInput(selectedReason)) newErrors.reason = "Reason is required";

    // Date Validation
    const now = new Date();
    if (neededBefore < now) {
      newErrors.neededBefore = "Selected date/time has already passed";
    }

    setErrors(newErrors);
    let firstErrorMsg = "";
    if (Object.keys(newErrors).length > 0) {
      firstErrorMsg = Object.values(newErrors)[0];
      Alert.alert("Validation Error", "Please fill all required fields correctly.");
    }
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setEditingId(null);
    setPatientName("");
    setPatientAge("");
    setPatientGender("");
    setPatientDetails("");
    setBloodType("");
    setHospitalLocation("");
    setSelectedDistrict("");
    setSelectedCity("");
    setHospitalName("");
    setSelectedReason("");
    setRelationshipToPatient("");
    setDoctorName("");
    setIsEmergency(false);
    setUrgencyLevel("medium");
    setErrors({});
  };

  const handleCancelRequest = async (requestId: string) => {
    Alert.alert(
      "Cancel Request",
      "Are you sure you want to cancel this blood request?",
      [
        { text: "No", style: "cancel" },
        { 
          text: "Yes, Cancel", 
          style: "destructive",
          onPress: async () => {
            try {
              await cancelBloodRequest(requestId);
              Alert.alert("Success", "Request cancelled successfully.");
              fetchRequests();
            } catch (e: any) {
              Alert.alert("Error", e.message || "Failed to cancel request.");
            }
          }
        }
      ]
    );
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    // Duplicate Check
    const userIdentifier = user?.username || user?.email || "anonymous";
    if (!isEditing && isDuplicateRequest(userIdentifier, bloodType, hospitalLocation)) {
      Alert.alert("Duplicate Request", "You have already submitted a similar request recently.");
      return;
    }

    setIsSubmitting(true);
    try {
      const combinedLocation = `${selectedCity}, ${selectedDistrict}`;

      const requestData = {
        bloodGroup: bloodType as BloodGroup,
        neededBefore: neededBefore.toISOString(),
        
        hospitalLocation: combinedLocation,
        hospitalName: hospitalName.trim(),
        requesterLocation: requesterLocation.trim() || undefined,
        coordinatorPhone: user?.phone || "",
        
        patientName: patientName.trim(),
        patientAge: patientAge ? Number(patientAge) : undefined,
        patientGender: patientGender ? patientGender as any : undefined,
        patientDetails: patientDetails.trim(),
        
        reason: selectedReason.trim(),
        relationshipToPatient: relationshipToPatient.trim(),
        doctorName: doctorName.trim(),
        
        urgencyLevel: isEmergency ? "critical" : urgencyLevel,
        isEmergency,
        role: "user",
      };

      if (isEditing && editingId) {
        await updateBloodRequest(editingId, requestData as any);
        Alert.alert("Success", "Blood request updated successfully.");
        setViewMode("list");
        fetchRequests();
      } else {
        await createBloodRequest(requestData as any);
        recordSubmission(userIdentifier, bloodType, hospitalLocation);
        resetForm();
        setViewMode("list");
        fetchRequests();
      }
    } catch (e: any) {
      const msg = e instanceof Error ? e.message : "Failed to send request. Please try again.";
      Alert.alert("Request Failed", msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const SectionTitle = ({ title, icon }: { title: string, icon: any }) => (
    <View style={styles.sectionHeader}>
      <MaterialIcons name={icon} size={22} color={colors.tint} />
      <Typo variant="body" style={{ fontWeight: "bold", marginLeft: 8, color: colors.tint }}>{title}</Typo>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView style={{ backgroundColor: colors.tint }} edges={["top"]}>
        <View style={styles.header}>
          {viewMode === "form" ? (
            <TouchableOpacity onPress={() => { setViewMode("list"); resetForm(); }} style={styles.backBtn}>
              <MaterialIcons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 40 }} />
          )}
          <Typo variant="h2" style={{ fontWeight: "bold", color: "#FFF", flex: 1, textAlign: "center", marginRight: viewMode === "form" ? 40 : 0 }}>
            {viewMode === "form" ? (isEditing ? "Update Blood Request" : "New Blood Request") : "My Blood Requests"}
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
                  <Typo variant="h3" style={{ marginTop: 16, color: colors.textMuted }}>No requests yet</Typo>
                  <Typo variant="body" style={{ marginTop: 8, color: colors.textMuted, textAlign: "center" }}>
                    Your blood requests will appear here.
                  </Typo>
                </View>
              ) : (
                myRequests.map((req) => {
                  const isAccepted = req.responses?.some((res: any) => res.status === "accepted");
                  return (
                    <Card key={req._id} variant="elevated" style={styles.requestCard}>
                      <View style={styles.requestCardHeader}>
                        <View style={[styles.bloodBadge, { backgroundColor: colors.tint }]}>
                          <Typo variant="h3" style={{ color: "#FFF", fontWeight: "bold" }}>{req.bloodGroup}</Typo>
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <Typo variant="body" style={{ fontWeight: "bold" }}>{req.patientName}</Typo>
                          <Typo variant="caption" color={colors.textMuted}>{req.hospitalName || req.hospitalLocation}</Typo>
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
                            Needed by: {new Date(req.neededBefore).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                          </Typo>
                        </View>
                        {isAccepted && (
                          <View style={{ marginTop: 12, backgroundColor: "#E8F5E9", padding: 10, borderRadius: 10, borderLeftWidth: 4, borderLeftColor: "#43A047" }}>
                            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                              <MaterialIcons name="check-circle" size={18} color="#43A047" />
                              <Typo variant="caption" style={{ marginLeft: 6, color: "#2E7D32", fontWeight: "bold" }}>
                                {req.responses.filter((r: any) => r.status === "accepted").length} User(s) Accepted
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
                              // Pre-fill form (some fields are already handled by loadRequest if we had an id, 
                              // but here we are doing it manually for a smoother transition)
                              setPatientName(req.patientName || "");
                              setPatientAge(req.patientAge?.toString() || "");
                              setPatientGender(req.patientGender || "");
                              setPatientDetails(req.patientDetails || "");
                              setBloodType(req.bloodGroup);
                              setNeededBefore(new Date(req.neededBefore));
                              
                              const loc = req.hospitalLocation || "";
                              if (loc.includes(", ")) {
                                const parts = loc.split(", ");
                                setSelectedCity(parts[0]);
                                setSelectedDistrict(parts[1]);
                              }
                              setHospitalName(req.hospitalName || "");
                              setSelectedReason(req.reason || "");
                              setRelationshipToPatient(req.relationshipToPatient || "");
                              setDoctorName(req.doctorName || "");
                              setUrgencyLevel(req.urgencyLevel || "medium");
                              setIsEmergency(req.isEmergency || false);
                              
                              // We don't have an ID in the URL, so we need to track it manually if we want to "Update"
                              // For simplicity, let's just use router.push with ID if the user wants a full edit flow
                              router.push({ pathname: "/(user)/(tabs)/request", params: { id: req._id } } as any);
                            }}
                          >
                            <MaterialIcons name="edit" size={18} color={colors.tint} />
                            <Typo variant="caption" style={{ marginLeft: 4, color: colors.tint }}>Update</Typo>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={[styles.actionBtn, { borderColor: colors.border }]}
                            onPress={() => handleCancelRequest(req._id)}
                          >
                            <MaterialIcons name="cancel" size={18} color={colors.error} />
                            <Typo variant="caption" style={{ marginLeft: 4, color: colors.error }}>Cancel</Typo>
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

            {/* 1. Patient Information */}
            <Card variant="elevated" style={styles.cardGroup}>
              <SectionTitle title="1. Patient Information" icon="person" />
              
              <View style={styles.inputGroup}>
                <Typo variant="body" style={styles.inputLabel}>Patient Full Name</Typo>
                <Input
                  placeholder="Kasun Senevirathna"
                  value={patientName}
                  error={errors.patientName}
                  onChangeText={(val) => { setPatientName(val); setErrors(p => ({...p, patientName: ""})) }}
                  containerStyle={styles.input}
                />
              </View>

              <View style={styles.inputGroup}>
                <Typo variant="body" style={styles.inputLabel}>Age</Typo>
                <Input
                  placeholder="e.g. 35"
                  keyboardType="numeric"
                  value={patientAge}
                  error={errors.patientAge}
                  onChangeText={(val) => { setPatientAge(val); setErrors(p => ({ ...p, patientAge: "" })); }}
                  containerStyle={styles.input}
                />
              </View>
              <View style={[styles.inputGroup, { zIndex: 11 }]}>
                <Typo variant="body" style={styles.inputLabel}>Gender</Typo>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.dropdownBtn, errors.patientGender && { borderColor: colors.error }]}
                  onPress={() => setIsGenderDropdownOpen(!isGenderDropdownOpen)}
                >
                  <Typo variant="body" style={{ color: patientGender ? colors.text : colors.textMuted }}>
                    {patientGender || "Select Gender..."}
                  </Typo>
                  <MaterialIcons name={isGenderDropdownOpen ? "keyboard-arrow-up" : "keyboard-arrow-down"} size={22} color={colors.icon} />
                </TouchableOpacity>
                {isGenderDropdownOpen && (
                  <View style={[styles.dropdownMenu, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <ScrollView nestedScrollEnabled style={{ maxHeight: 160 }}>
                      {GENDERS.map((g, i) => (
                        <TouchableOpacity
                          key={g}
                          style={[styles.dropdownItem, i < GENDERS.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
                          onPress={() => {
                            setPatientGender(g);
                            setErrors(p => ({ ...p, patientGender: "" }));
                            setIsGenderDropdownOpen(false);
                          }}
                        >
                          <Typo variant="body">{g}</Typo>
                          {patientGender === g && <MaterialIcons name="check" size={18} color={colors.tint} />}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
                {errors.patientGender && <Typo variant="caption" style={{ color: colors.error, marginTop: 4 }}>{errors.patientGender}</Typo>}
              </View>
            </Card>

            {/* 2. Blood Requirement Details */}
            <Card variant="elevated" style={styles.cardGroup}>
              <SectionTitle title="2. Blood Requirement" icon="water-drop" />
              
              <View style={styles.inputGroup}>
                <Typo variant="body" style={[styles.inputLabel, errors.bloodGroup && { color: colors.error }]}>Blood Group *</Typo>
                <View style={styles.gridContainer}>
                  {BLOOD_GROUPS.map((group) => {
                    const isSelected = bloodType === group;
                    return (
                      <TouchableOpacity
                        key={group}
                        style={[
                          styles.gridItem,
                          { borderColor: isSelected ? colors.tint : colors.border },
                          isSelected && { backgroundColor: `${colors.tint}10`, borderWidth: 2 },
                        ]}
                        onPress={() => setBloodType(group)}
                      >
                        <Typo variant="h2" style={{ fontWeight: "bold", textAlign: "center", textAlignVertical: "center", color: isSelected ? colors.tint : colors.text }}>{group}</Typo>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Typo variant="body" style={styles.inputLabel}>Required Before</Typo>
                <View style={{ flexDirection: "row", gap: 8 }}>
                    <TouchableOpacity 
                      style={styles.datePickerBtn} 
                      onPress={() => setShowDatePicker(true)}
                    >
                      <MaterialIcons name="event" size={18} color={colors.text} />
                      <Typo variant="caption" style={{ flex: 1, marginLeft: 6 }}>{neededBefore.toLocaleDateString()}</Typo>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.datePickerBtn} 
                      onPress={() => setShowTimePicker(true)}
                    >
                      <MaterialIcons name="schedule" size={18} color={colors.text} />
                      <Typo variant="caption" style={{ flex: 1, marginLeft: 6 }}>{neededBefore.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Typo>
                    </TouchableOpacity>
                  </View>
                  
                  {showDatePicker && (
                    <DateTimePicker
                      value={neededBefore}
                      mode="date"
                      display="default"
                      minimumDate={new Date()}
                      onChange={(event, date) => {
                        setShowDatePicker(false);
                        if (date) {
                          setNeededBefore(date);
                          if (errors.neededBefore) setErrors(prev => ({ ...prev, neededBefore: "" }));
                        }
                      }}
                    />
                  )}
                  {errors.neededBefore && (
                    <Typo variant="caption" style={{ color: colors.error, marginTop: 4 }}>
                      {errors.neededBefore}
                    </Typo>
                  )}
                  {showTimePicker && (
                    <DateTimePicker
                      value={neededBefore}
                      mode="time"
                      display="default"
                      onChange={(event, date) => {
                        setShowTimePicker(false);
                        if (date) {
                          setNeededBefore(date);
                          if (errors.neededBefore) setErrors(prev => ({ ...prev, neededBefore: "" }));
                        }
                      }}
                    />
                  )}
              </View>
            </Card>

            {/* 3. Location & Contact Information */}
            <Card variant="elevated" style={styles.cardGroup}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15 }}>
                <SectionTitle title="3. Location & Contact" icon="location-on" />
              </View>

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
            </Card>

            {/* 4. Priority & Emergency Details */}
            <Card variant="elevated" style={styles.cardGroup}>
              <SectionTitle title="4. Priority & Emergency" icon="error-outline" />

              <View style={[styles.inputGroup, { zIndex: 10 }]}>
                <Typo variant="body" style={styles.inputLabel}>Reason for Request</Typo>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.dropdownBtn, errors.reason && { borderColor: colors.error }]}
                  onPress={() => setIsReasonDropdownOpen(!isReasonDropdownOpen)}
                >
                  <Typo variant="body" style={{ color: selectedReason ? colors.text : colors.textMuted }}>
                    {selectedReason || "Select a Reason..."}
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
                            setSelectedReason(r);
                            setErrors(p => ({...p, reason: ""}));
                            setIsReasonDropdownOpen(false);
                          }}
                        >
                          <Typo variant="body">{r}</Typo>
                          {selectedReason === r && <MaterialIcons name="check" size={18} color={colors.tint} />}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
                {errors.reason && <Typo variant="caption" style={{ color: colors.error, marginTop: 4 }}>{errors.reason}</Typo>}
              </View>

              <View style={[styles.inputGroup, { zIndex: 8 }]}>
                <Typo variant="body" style={styles.inputLabel}>Urgency Level</Typo>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.dropdownBtn}
                  onPress={() => setIsUrgencyDropdownOpen(!isUrgencyDropdownOpen)}
                >
                  <Typo variant="body" style={{ color: colors.text, textTransform: "capitalize" }}>
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
                    <Typo variant="caption" color={colors.textMuted}>Sends instant push alerts</Typo>
                  </View>
                </View>
                <Toggle value={isEmergency} onToggle={setIsEmergency} activeColor={colors.error} />
              </View>

              <View style={[styles.inputGroup, { zIndex: 9 }]}>
                <Typo variant="body" style={styles.inputLabel}>Relationship to Patient</Typo>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.dropdownBtn}
                  onPress={() => setIsRelationshipDropdownOpen(!isRelationshipDropdownOpen)}
                >
                  <Typo variant="body" style={{ color: relationshipToPatient ? colors.text : colors.textMuted }}>
                    {relationshipToPatient || "Select Relationship..."}
                  </Typo>
                  <MaterialIcons name={isRelationshipDropdownOpen ? "keyboard-arrow-up" : "keyboard-arrow-down"} size={22} color={colors.icon} />
                </TouchableOpacity>
                {isRelationshipDropdownOpen && (
                  <View style={[styles.dropdownMenu, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <ScrollView nestedScrollEnabled style={{ maxHeight: 160 }}>
                      {RELATIONSHIPS.map((rel, i) => (
                        <TouchableOpacity
                          key={rel}
                          style={[styles.dropdownItem, i < RELATIONSHIPS.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
                          onPress={() => {
                            setRelationshipToPatient(rel);
                            setIsRelationshipDropdownOpen(false);
                          }}
                        >
                          <Typo variant="body">{rel}</Typo>
                          {relationshipToPatient === rel && <MaterialIcons name="check" size={18} color={colors.tint} />}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Typo variant="body" style={styles.inputLabel}>Doctor's Name (Optional)</Typo>
                <Input placeholder="Dr. Samarawickrama" value={doctorName} onChangeText={setDoctorName} containerStyle={styles.input} />
              </View>
            </Card>

            {/* Submit Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.submitButton, { backgroundColor: colors.tint, opacity: isSubmitting ? 0.6 : 1 }]}
              disabled={isSubmitting}
              onPress={handleSubmit}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <MaterialIcons name={isEditing ? "edit" : "cell-tower"} size={22} color="#FFF" style={{ marginRight: 8 }} />
                  <Typo variant="body" style={{ color: "#FFF", fontWeight: "bold" }}>
                    {isEditing ? "Update Request" : "Request Blood"}
                  </Typo>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        )}
      </KeyboardAvoidingView>

      {/* Location Search Modal */}
      <Modal visible={activeLocationDropdown !== null} animationType="slide" transparent={true} onRequestClose={() => setActiveLocationDropdown(null)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={() => setActiveLocationDropdown(null)} />
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={[styles.locationModal, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Typo variant="h2" style={{ fontWeight: "bold" }}>Select {activeLocationDropdown === "district" ? "District" : "City / Town"}</Typo>
              <TouchableOpacity onPress={() => setActiveLocationDropdown(null)}>
                <MaterialIcons name="close" size={24} color={colors.icon} />
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
                           setErrors(p => ({...p, selectedDistrict: ""}));
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
                           setErrors(p => ({...p, selectedCity: ""}));
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
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 16 },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  refreshBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  scrollContent: { padding: 16, paddingBottom: 100 },
  
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

  cardGroup: {
    borderRadius: 16,
    padding: 16,
    paddingTop: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "transparent",
  },
  sectionHeader: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginBottom: 16, 
    paddingBottom: 10, 
    borderBottomWidth: 1, 
    borderBottomColor: "#eee" 
  },

  inputGroup: { 
    marginBottom: 16 
  },

  inputLabel: { 
    marginBottom: 6, 
    fontWeight: "600" 
  },

  input: { 
    height: 48, 
    borderRadius: 10 
  },

  gridContainer: { 
    flexDirection: "row", 
    flexWrap: "wrap", 
    gap: 8 
  },

  gridItem: { 
    width: "23%", 
    aspectRatio: 1, 
    borderRadius: 12, 
    borderWidth: 1, 
    alignItems: "center", 
    justifyContent: "center" 
  },

  chip: { 
    paddingHorizontal: 14, 
    paddingVertical: 8, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: "#ccc", 
    alignItems: "center", 
    justifyContent: "center" 
  },

  datePickerBtn: { 
    flex: 1, 
    height: 48, 
    borderRadius: 10, 
    borderWidth: 1, 
    borderColor: "#ccc", 
    flexDirection: "row", 
    alignItems: "center", 
    paddingHorizontal: 12 
  },
  
  emergencyContainer: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between", 
    padding: 16, 
    borderRadius: 12, 
    borderWidth: 1, 
    marginBottom: 16 
  },

  dropdownBtn: { 
    flexDirection: "row", 
    height: 48, 
    borderRadius: 10, 
    borderWidth: 1, 
    borderColor: "#ccc", 
    alignItems: "center", 
    justifyContent: "space-between", 
    paddingHorizontal: 12 
  },

  dropdownMenu: { 
    marginTop: 4, 
    borderRadius: 10, 
    borderWidth: 1, 
    elevation: 5, 
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.15, 
    shadowRadius: 6 
  },

  dropdownItem: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    padding: 14 
  },

  submitButton: { 
    flexDirection: "row", 
    height: 56, 
    borderRadius: 14, 
    alignItems: "center", 
    justifyContent: "center", 
    marginTop: 10, 
    shadowColor: "#000", 
    shadowOffset: {width: 0, height: 4}, 
    shadowOpacity: 0.2, 
    shadowRadius: 5, 
    zIndex: 1 
  },

  locationModal: { 
    height: "70%", 
    borderTopLeftRadius: 24, 
    borderTopRightRadius: 24, 
    padding: 20, 
    paddingTop: 24, 
    elevation: 10, 
    shadowColor: "#000", 
    shadowOffset: {width:0, height:-2}, 
    shadowOpacity: 0.1 
  },

  modalHeader: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    marginBottom: 16 
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
});