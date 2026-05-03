import React, { useMemo, useState, useEffect } from "react";
import { StyleSheet, View, ScrollView, TouchableOpacity, Platform, Modal, ActivityIndicator } from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useThemeColor } from "@/packages/ui/hooks";
import {
  Typo,
  Card,
  Button,
  Divider,
  Badge,
  Input,
  Checkbox,
  Radio,
  Select,
} from "@/packages/ui/components/ui";
import { registerForCampaign } from "@/apps/mobile/src/lib/campaignService";
import { useUserStore } from "@/apps/mobile/src/store/UserContext";
import { getLatestEligibility } from "@/apps/mobile/src/lib/eligibilityService";
import { useLocalSearchParams, useRouter } from "expo-router";


function param(v: string | string[] | undefined): string | undefined {
  if (v === undefined) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

export default function CampaignRegistrationScreen() {
  const { colors } = useThemeColor();
  const router = useRouter();
  const params = useLocalSearchParams<{
    campId?: string;
    role?: string;
    title?: string;
    organization?: string;
    hospital?: string;
    date?: string;
    time?: string;
    location?: string;
    volunteerPoints?: string;
  }>();

  const campId = param(params.campId);
  const roleParam = (param(params.role) ?? "donor").toLowerCase();
  const role: "donor" | "volunteer" = roleParam === "volunteer" ? "volunteer" : "donor";

  const { user } = useUserStore();

  const camp = useMemo(
    () => ({
      title: param(params.title) ?? "",
      organization: param(params.organization) ?? "",
      hospital: param(params.hospital) ?? "",
      date: param(params.date) ?? "",
      time: param(params.time) ?? "",
      location: param(params.location) ?? "",
      volunteerPoints: Number(param(params.volunteerPoints) ?? "0"),
    }),
    [params],
  );

  const [checkingEligibility, setCheckingEligibility] = useState(role === "donor");
  const [eligibilityModal, setEligibilityModal] = useState<{
    visible: boolean;
    type: "NOT_FILLED" | "NOT_ELIGIBLE";
    reasons?: string[];
  }>({ visible: false, type: "NOT_FILLED" });

  useEffect(() => {
    if (user) {
      if (user.fullName || user.displayName) setFullName(user.fullName || user.displayName || "");
      if (user.phone) setPhone(user.phone);
      if (user.bloodGroup) setBloodType(user.bloodGroup);
    }
  }, [user]);

  useEffect(() => {
    const check = async () => {
      if (role === "donor") {
        try {
          setCheckingEligibility(true);
          const eligibility = await getLatestEligibility();
          console.log("Registration Screen Guard - Eligibility Result:", JSON.stringify(eligibility));

          if (!eligibility) {
            console.log("Registration Screen Guard - No eligibility found, showing modal");
            setEligibilityModal({ visible: true, type: "NOT_FILLED" });
          } else if (eligibility.isEligible !== true) {
            console.log("Registration Screen Guard - Not eligible, showing modal");
            setEligibilityModal({ 
              visible: true, 
              type: "NOT_ELIGIBLE", 
              reasons: eligibility.reasonsForIneligibility 
            });
          } else {
            console.log("Registration Screen Guard - Eligible! Allowing form.");
          }

        } catch (error) {
          console.warn("Eligibility check failed", error);
          // If check fails, we MUST assume NOT eligible to be safe
          setEligibilityModal({ visible: true, type: "NOT_FILLED" });
        } finally {
          setCheckingEligibility(false);
        }

      } else {
        setCheckingEligibility(false);
      }
    };
    check();
  }, [role]);



  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState<"MALE" | "FEMALE" | "OTHER">("MALE");
  const [phone, setPhone] = useState("");
  const [homeTown, setHomeTown] = useState("");
  const [educationalQualification, setEducationalQualification] = useState("");
  const [otherQualification, setOtherQualification] = useState("");
  const [concerns, setConcerns] = useState("");
  const [bloodType, setBloodType] = useState("");
  const [note, setNote] = useState("");


  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!campId) {
      alert("Camp not found.");
      return;
    }
    if (!fullName.trim() || !phone.trim()) {
      alert("Please enter your name and phone number.");
      return;
    }
    if (role === "volunteer") {
      if (!homeTown.trim() || !educationalQualification.trim()) {
        alert("Please fill home town and educational qualification.");
        return;
      }
    }

    if (role === "donor") {
      if (!bloodType.trim()) {
        alert("Please select your blood type.");
        return;
      }
    }


    try {
      setSubmitting(true);
      const registration = await registerForCampaign(
        campId,
        role === "donor" ? "DONOR" : "VOLUNTEER",
        role === "volunteer" ? concerns.trim() : note.trim(),
        role === "volunteer"
          ? {
              fullName: fullName.trim(),
              gender,
              homeTown: homeTown.trim(),
              phoneNumber: phone.trim(),
              educationalQualification: educationalQualification.trim(),
              otherQualification: otherQualification.trim(),
              concerns: concerns.trim(),
            }
          : undefined,
        role === "donor"
          ? {
              bloodType,
              fullName: fullName.trim(),
              gender,
              phoneNumber: phone.trim(),
              age: user?.dob ? Math.floor((new Date().getTime() - new Date(user.dob).getTime()) / (1000 * 60 * 60 * 24 * 365)) : 25,
              monthsSinceLastDonation: 4, // Default as it's already checked by eligibility
              hasValidId: true,
              isPregnantOrBreastfeeding: false,
              hasSeriousMedicalIllness: false,
              hasRiskBehavior: false,
            }
          : undefined,
        undefined, // screening is no longer collected here

      );
      const roleLabel = role === "donor" ? "donor" : "volunteer";
      const decision = (registration as { screeningDecision?: string }).screeningDecision;
      const reasons = (registration as { rejectionReasons?: string[] }).rejectionReasons ?? [];
      const donorPublicId = (registration as { donorRegistration?: { donorPublicId?: string } })
        .donorRegistration?.donorPublicId;
      const volunteerPublicId = (registration as { volunteerRegistration?: { volunteerPublicId?: string } })
        .volunteerRegistration?.volunteerPublicId;
      if (role === "donor" && decision === "REJECTED") {
        alert(`Registration rejected.\n${reasons.join("\n")}`);
      } else if (role === "donor" && decision === "APPROVED") {
        const idLine = donorPublicId ? `\n\nYour donor ID:\n${donorPublicId}` : "";
        alert(`Registration approved for "${camp.title}". Hospital has been notified.${idLine}`);
      } else {
        const idLine =
          role === "volunteer" && volunteerPublicId
            ? `\n\nYour volunteer ID:\n${volunteerPublicId}`
            : "";
        alert(`You are registered as a ${roleLabel} for "${camp.title}".${idLine}`);
      }
      router.back();
    } catch (error) {
      alert(`Registration failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (checkingEligibility) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={colors.tint} />
        <Typo variant="body" style={{ marginTop: 16 }}>Verifying eligibility...</Typo>
      </SafeAreaView>
    );
  }

  const missingCamp = !campId || !camp.title;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Typo variant="h2">Camp registration</Typo>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
      >
        <Typo variant="body" style={{ color: colors.textMuted, marginBottom: 16 }}>
          One form for everyone. Your role for this camp is set from the button you chose;
          you can still edit your details below before submitting.
        </Typo>

        {missingCamp ? (
          <Card style={styles.card}>
            <Typo variant="body" style={{ color: colors.textMuted }}>
              Open this screen from a camp: use{" "}
              <Typo variant="body" style={{ fontWeight: "700" }}>
                Find Local Campaigns
              </Typo>{" "}
              on Home, or{" "}
              <Typo variant="body" style={{ fontWeight: "700" }}>
                Register
              </Typo>{" "}
              on an available camp.
            </Typo>
            <Button
              label="Browse local campaigns"
              variant="primary"
              style={{ marginTop: 16 }}
              onPress={() => router.push("/(user)/local-collaboration-camps" as any)}
            />
          </Card>
        ) : (
          <>
            <Card style={styles.card}>
              <View style={styles.campHeader}>
                <View style={{ flex: 1 }}>
                  <Typo variant="caption" style={{ color: colors.textMuted }}>
                    {camp.organization}
                  </Typo>
                  <Typo variant="h2" style={{ marginTop: 4 }}>
                    {camp.title}
                  </Typo>
                </View>
                <Badge label="Hospital partnered" variant="success" />
              </View>
              <Typo variant="caption" style={{ color: colors.tint, marginTop: 8, fontWeight: "600" }}>
                {camp.hospital}
              </Typo>
              <Typo variant="body" style={{ color: colors.textMuted, marginTop: 10 }}>
                {camp.date} · {camp.time}
              </Typo>
              <Typo variant="body" style={{ color: colors.textMuted, marginTop: 4 }}>
                {camp.location}
              </Typo>
              {role === "volunteer" ? (
                <Typo variant="caption" style={{ color: colors.textMuted, marginTop: 8 }}>
                  Volunteers can earn up to {camp.volunteerPoints} points after the event.
                </Typo>
              ) : null}
            </Card>

            <View style={[styles.roleBanner, { backgroundColor: `${colors.tint}14` }]}>
              <Typo variant="body" style={{ fontWeight: "700", color: colors.text }}>
                Registering as:{" "}
                <Typo variant="body" style={{ fontWeight: "800", color: colors.tint }}>
                  {role === "donor" ? "Donor" : "Volunteer"}
                </Typo>
              </Typo>
            </View>

            <Typo variant="h2" style={{ marginBottom: 12, marginTop: 8 }}>
              Your details
            </Typo>

            <Input
              label="Full name"
              placeholder="Enter your full name"
              value={fullName}
              onChangeText={setFullName}
            />
            <Select
              label="Gender"
              placeholder="Select gender"
              value={gender}
              options={["MALE", "FEMALE", "OTHER"]}
              onSelect={(value) => setGender(value as "MALE" | "FEMALE" | "OTHER")}
            />
            <Input
              label="Phone number"
              placeholder="Enter your phone number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
            {role === "volunteer" ? (
              <>
                <Input
                  label="Home town"
                  placeholder="Enter your home town"
                  value={homeTown}
                  onChangeText={setHomeTown}
                />
                <Input
                  label="Educational qualification"
                  placeholder="Enter your educational qualification"
                  value={educationalQualification}
                  onChangeText={setEducationalQualification}
                />
                <Input
                  label="Other qualification"
                  placeholder="Optional"
                  value={otherQualification}
                  onChangeText={setOtherQualification}
                />
                <Input
                  label="Concerns"
                  placeholder="Any concerns before volunteering"
                  value={concerns}
                  onChangeText={setConcerns}
                  multiline
                  numberOfLines={3}
                  style={{ minHeight: 72, textAlignVertical: "top" }}
                />
              </>
            ) : null}
            {role === "donor" ? (
              <>
                <Divider spacing={12} />
                <Typo variant="h2">Basic Donor Eligibility Criteria</Typo>
                <View style={{ height: 8 }} />
                {[
                  "Aged 18-60 years (first-time donors up to 55 years).",
                  "Minimum 4 months between donations.",
                  "Haemoglobin above 12.5 g/dL.",
                  "Not pregnant; free from serious medical illnesses.",
                  "Free from risk behaviors.",
                  "Bring national identity card or valid ID.",
                ].map((item) => (
                  <Typo
                    key={item}
                    variant="caption"
                    style={{ color: colors.textMuted, marginTop: 4, marginBottom: 6 }}
                  >
                    - {item}
                  </Typo>
                ))}
                <View style={{ height: 12 }} />
                
                <Input
                  label="Blood type"
                  placeholder="e.g. A+"
                  value={bloodType}
                  onChangeText={setBloodType}
                />

              </>
            ) : null}

            {role === "donor" ? (
              <Input
                label="Notes (optional)"
                placeholder="Allergies, preferred time slot, etc."
                value={note}
                onChangeText={setNote}
                multiline
                numberOfLines={3}
                style={{ minHeight: 72, textAlignVertical: "top" }}
              />
            ) : null}

            <Divider spacing={8} />

            <Button
              label="Submit registration"
              variant="primary"
              onPress={handleSubmit}
              disabled={submitting}
            />
            <Typo variant="caption" color={colors.textMuted} style={{ marginTop: 12, textAlign: "center" }}>
              By submitting, you agree to camp guidelines and screening where applicable.
            </Typo>
          </>
        )}
      </ScrollView>

      <Modal
        visible={eligibilityModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => {}} // User must choose an action
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[styles.modalIconContainer, { backgroundColor: eligibilityModal.type === "NOT_ELIGIBLE" ? "#FEF2F2" : "#EFF6FF" }]}>
              <Ionicons 
                name={eligibilityModal.type === "NOT_ELIGIBLE" ? "warning" : "clipboard-outline"} 
                size={32} 
                color={eligibilityModal.type === "NOT_ELIGIBLE" ? "#EF4444" : "#3B82F6"} 
              />
            </View>

            <Typo variant="h2" style={styles.modalTitle}>
              {eligibilityModal.type === "NOT_ELIGIBLE" ? "Ineligible to Donate" : "Assessment Required"}
            </Typo>

            <Typo variant="body" style={styles.modalDescription}>
              {eligibilityModal.type === "NOT_ELIGIBLE" 
                ? "Based on your last medical assessment, you are not currently eligible to donate blood."
                : "You must complete a brief medical eligibility assessment before you can register as a donor."}
            </Typo>

            {eligibilityModal.type === "NOT_ELIGIBLE" && eligibilityModal.reasons && (
              <View style={styles.reasonsContainer}>
                <Typo variant="caption" style={{ fontWeight: "700", color: "#991B1B", marginBottom: 4 }}>REASONS:</Typo>
                {eligibilityModal.reasons.map((r, i) => (
                  <Typo key={i} variant="caption" style={{ color: "#7F1D1D" }}>• {r}</Typo>
                ))}
              </View>
            )}

            <View style={styles.modalActions}>
              <Button
                label={eligibilityModal.type === "NOT_ELIGIBLE" ? "Re-take Quiz" : "Take Quiz Now"}
                variant="primary"
                style={{ flex: 1 }}
                onPress={() => {
                  setEligibilityModal({ ...eligibilityModal, visible: false });
                  router.replace("/(user)/eligibility" as any);
                }}
              />
              <Button
                label="Go Back"
                variant="secondary"
                style={{ marginLeft: 8 }}
                onPress={() => {
                  setEligibilityModal({ ...eligibilityModal, visible: false });
                  router.back();
                }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>

  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: { marginRight: 12 },
  scroll: { paddingHorizontal: 20, paddingBottom: 32 },
  card: { padding: 16, marginBottom: 16 },
  campHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  roleBanner: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  radioRow: {
    gap: 12,
    marginTop: 8,
    color:'#ffffff'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    textAlign: "center",
    marginBottom: 8,
  },
  modalDescription: {
    textAlign: "center",
    color: "#6B7280",
    marginBottom: 20,
  },
  reasonsContainer: {
    width: "100%",
    backgroundColor: "#FEF2F2",
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: "row",
    width: "100%",
  },
});

