import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { StyleSheet, View, ScrollView, TouchableOpacity, Platform } from "react-native";
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
import { getApiErrorMessage } from "@/apps/mobile/src/services/apiClient";
import { registerForCampaign } from "@/apps/mobile/src/services/campaignService";

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

  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState<"MALE" | "FEMALE" | "OTHER">("MALE");
  const [phone, setPhone] = useState("");
  const [homeTown, setHomeTown] = useState("");
  const [educationalQualification, setEducationalQualification] = useState("");
  const [otherQualification, setOtherQualification] = useState("");
  const [concerns, setConcerns] = useState("");
  const [bloodType, setBloodType] = useState("");
  const [age, setAge] = useState("");
  const [monthsSinceLastDonation, setMonthsSinceLastDonation] = useState("");
  const [surgeryInLast6Months, setSurgeryInLast6Months] = useState<null | boolean>(null);
  const [travelToMalariaEndemicInLast3Years, setTravelToMalariaEndemicInLast3Years] =
    useState<null | boolean>(null);
  const [foreignTravelInLast3Months, setForeignTravelInLast3Months] =
    useState<null | boolean>(null);
  const [recentRiskFactors, setRecentRiskFactors] = useState({
    tattooIn12Months: false,
    earPiercingIn12Months: false,
    dentalExtractionIn1Week: false,
    imprisonedIn12Months: false,
    pregnantOrBreastfeedingInLast12Months: false,
  });
  const [medicalHistory, setMedicalHistory] = useState({
    heartDisease: false,
    diabetes: false,
    sexuallyTransmittedDiseases: false,
    lungDisease: false,
    allergicDisease: false,
    epilepsy: false,
    jaundice: false,
    faintingSpells: false,
    cancer: false,
    hepatitisBC: false,
    typhoidIn2Years: false,
    tuberculosisIn2Years: false,
    kidneyDisease: false,
    bleedingTendency: false,
    malariaIn12Months: false,
    dengueIn6Months: false,
    chickenpoxRubellaDiarrhoeaIn1Month: false,
  });
  const [recentMedicationsOrVaccines, setRecentMedicationsOrVaccines] = useState({
    antibioticsIn1Week: false,
    aspirinIn1Week: false,
    alcoholIn3Days: false,
    steroids: false,
    vaccinationsIn12Months: false,
  });
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
      const donorAge = Number(age);
      const donorGap = Number(monthsSinceLastDonation);

      if (!bloodType.trim()) {
        alert("Please select your blood type.");
        return;
      }
      if (Number.isNaN(donorAge) || Number.isNaN(donorGap)) {
        alert("Please enter valid numeric values for age and donation gap.");
        return;
      }
      if (surgeryInLast6Months === null) {
        alert("Please answer surgery in last 6 months.");
        return;
      }
      if (travelToMalariaEndemicInLast3Years === null || foreignTravelInLast3Months === null) {
        alert("Please complete travel history answers.");
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
              age: Number(age),
              monthsSinceLastDonation: Number(monthsSinceLastDonation),
              hasValidId: true,
              isPregnantOrBreastfeeding: false,
              hasSeriousMedicalIllness: false,
              hasRiskBehavior: false,
            }
          : undefined,
        role === "donor"
          ? {
              recentRiskFactors,
              medicalHistory,
              recentMedicationsOrVaccines,
              surgeryInLast6Months: surgeryInLast6Months ?? false,
              travelToMalariaEndemicInLast3Years:
                travelToMalariaEndemicInLast3Years ?? false,
              foreignTravelInLast3Months: foreignTravelInLast3Months ?? false,
            }
          : undefined,
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
      alert(`Registration failed: ${getApiErrorMessage(error)}`);
    } finally {
      setSubmitting(false);
    }
  };

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
                <Input label="Age" placeholder="22" value={age} onChangeText={setAge} keyboardType="number-pad" />

                <Input
                  label="Months since last donation"
                  placeholder="4"
                  value={monthsSinceLastDonation}
                  onChangeText={setMonthsSinceLastDonation}
                  keyboardType="number-pad"
                />

                <Divider spacing={12} />
                <Typo variant="h2">Recent Risk Factors</Typo>
                {[
                  ["tattooIn12Months", "Tattooing in 12 months"],
                  ["earPiercingIn12Months", "Ear piercing in 12 months"],
                  ["dentalExtractionIn1Week", "Dental extraction in 1 week"],
                  ["imprisonedIn12Months", "Imprisoned in 12 months"],
                  [
                    "pregnantOrBreastfeedingInLast12Months",
                    "Pregnant / breastfeeding in last 12 months",
                  ],
                ].map(([key, label]) => (
                  <Checkbox
                    key={key}
                    checked={recentRiskFactors[key as keyof typeof recentRiskFactors]}
                    onToggle={(value) =>
                      setRecentRiskFactors((prev) => ({
                        ...prev,
                        [key]: value,
                      }))
                    }
                    label={label}
                  />
                ))}

                <Divider spacing={12} />
                <Typo variant="h2">Medical History</Typo>
                {[
                  ["heartDisease", "Heart Disease"],
                  ["diabetes", "Diabetes"],
                  ["sexuallyTransmittedDiseases", "Sexually Transmitted Diseases"],
                  ["lungDisease", "Lung Disease"],
                  ["allergicDisease", "Allergic Disease"],
                  ["epilepsy", "Epilepsy"],
                  ["jaundice", "Jaundice"],
                  ["faintingSpells", "Fainting spells"],
                  ["cancer", "Cancer"],
                  ["hepatitisBC", "Hepatitis B/C"],
                  ["typhoidIn2Years", "Typhoid in 2 years"],
                  ["tuberculosisIn2Years", "Tuberculosis in 2 years"],
                  ["kidneyDisease", "Kidney Disease"],
                  ["bleedingTendency", "Bleeding tendency"],
                  ["malariaIn12Months", "Malaria in 12 months"],
                  ["dengueIn6Months", "Dengue in 6 months"],
                  [
                    "chickenpoxRubellaDiarrhoeaIn1Month",
                    "Chickenpox / rubella / diarrhoea in 1 month",
                  ],
                ].map(([key, label]) => (
                  <Checkbox
                    key={key}
                    checked={medicalHistory[key as keyof typeof medicalHistory]}
                    onToggle={(value) =>
                      setMedicalHistory((prev) => ({
                        ...prev,
                        [key]: value,
                      }))
                    }
                    label={label}
                  />
                ))}

                <Divider spacing={12} />
                <Typo variant="h2">Recent Medications / Vaccines</Typo>
                {[
                  ["antibioticsIn1Week", "Antibiotics in 1 week"],
                  ["aspirinIn1Week", "Aspirin in 1 week"],
                  ["alcoholIn3Days", "Alcohol in 3 days"],
                  ["steroids", "Steroids"],
                  ["vaccinationsIn12Months", "Vaccinations in 12 months"],
                ].map(([key, label]) => (
                  <Checkbox
                    key={key}
                    checked={
                      recentMedicationsOrVaccines[
                        key as keyof typeof recentMedicationsOrVaccines
                      ]
                    }
                    onToggle={(value) =>
                      setRecentMedicationsOrVaccines((prev) => ({
                        ...prev,
                        [key]: value,
                      }))
                    }
                    label={label}
                  />
                ))}

                <Divider spacing={12} />
                <Typo variant="h2">Surgery in last 6 months?</Typo>
                <View style={styles.radioRow}>
                  <Radio selected={surgeryInLast6Months === true} onSelect={() => setSurgeryInLast6Months(true)} label="Yes" />
                  <Radio selected={surgeryInLast6Months === false} onSelect={() => setSurgeryInLast6Months(false)} label="No" />
                </View>

                <Typo variant="h2" style={{ marginTop: 8 }}>
                  Travel to malaria-endemic countries in last 3 years?
                </Typo>
                <View style={styles.radioRow}>
                  <Radio
                    selected={travelToMalariaEndemicInLast3Years === true}
                    onSelect={() => setTravelToMalariaEndemicInLast3Years(true)}
                    label="Yes"
                  />
                  <Radio
                    selected={travelToMalariaEndemicInLast3Years === false}
                    onSelect={() => setTravelToMalariaEndemicInLast3Years(false)}
                    label="No"
                  />
                </View>

                <Typo variant="h2" style={{ marginTop: 8 }}>
                  Other foreign travel in last 3 months?
                </Typo>
                <View style={styles.radioRow}>
                  <Radio
                    selected={foreignTravelInLast3Months === true}
                    onSelect={() => setForeignTravelInLast3Months(true)}
                    label="Yes"
                  />
                  <Radio
                    selected={foreignTravelInLast3Months === false}
                    onSelect={() => setForeignTravelInLast3Months(false)}
                    label="No"
                  />
                </View>
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
});
