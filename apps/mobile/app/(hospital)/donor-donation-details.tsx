import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import {
  completeDonorDonation,
  DonorDonationDetails,
  getHospitalDonorDonationDetails,
  verifyDonorDoctor,
  verifyDonorFinal,
  verifyDonorPrecheck,
} from "@/apps/mobile/src/lib/organizationService";
import { Button, Card, Divider, Input, Radio, Typo } from "@/packages/ui/components/ui";
import { useThemeColor } from "@/packages/ui/hooks";

function firstParam(value: string | string[] | undefined) {
  if (value === undefined) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

export default function DonorDonationDetailsScreen() {
  const { colors } = useThemeColor();
  const router = useRouter();
  const params = useLocalSearchParams<{ registrationId?: string }>();
  const registrationId = firstParam(params.registrationId);

  const [details, setDetails] = useState<DonorDonationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [bodyWeightKg, setBodyWeightKg] = useState("");
  const [doctorDecision, setDoctorDecision] = useState<"ACCEPT" | "REJECT" | null>(null);
  const [doctorNotes, setDoctorNotes] = useState("");
  const [haemoglobinStatus, setHaemoglobinStatus] = useState<
    "FLOATED" | "NOT_FLOATED" | null
  >(null);
  const [submitting, setSubmitting] = useState(false);

  const loadDetails = useCallback(async () => {
    if (!registrationId) return;
    try {
      setLoading(true);
      const data = await getHospitalDonorDonationDetails(registrationId);
      setDetails(data);
      if (data.process.precheck?.bodyWeightKg) {
        setBodyWeightKg(String(data.process.precheck.bodyWeightKg));
      }
      if (data.process.doctorVerification?.decision) {
        setDoctorDecision(data.process.doctorVerification.decision);
      }
      if (data.process.doctorVerification?.notes) {
        setDoctorNotes(data.process.doctorVerification.notes);
      }
      if (data.process.finalVerification?.haemoglobinStatus) {
        setHaemoglobinStatus(data.process.finalVerification.haemoglobinStatus);
      }
    } catch (error) {
      alert(`Failed to load donor details: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  }, [registrationId]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  const onVerifyPrecheck = async () => {
    if (!registrationId) return;
    const parsedWeight = Number(bodyWeightKg);
    if (Number.isNaN(parsedWeight)) {
      alert("Body weight is required.");
      return;
    }
    try {
      setSubmitting(true);
      await verifyDonorPrecheck(registrationId, parsedWeight);
      await loadDetails();
    } catch (error) {
      alert(`Precheck failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setSubmitting(false);
    }
  };

  const onVerifyDoctor = async () => {
    if (!registrationId) return;
    if (!doctorDecision) {
      alert("Doctor decision is required.");
      return;
    }
    try {
      setSubmitting(true);
      await verifyDonorDoctor(registrationId, doctorDecision, doctorNotes.trim());
      await loadDetails();
    } catch (error) {
      alert(`Doctor verification failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setSubmitting(false);
    }
  };

  const onVerifyFinal = async () => {
    if (!registrationId) return;
    if (!haemoglobinStatus) {
      alert("Please select haemoglobin status.");
      return;
    }
    try {
      setSubmitting(true);
      await verifyDonorFinal(registrationId, haemoglobinStatus);
      await loadDetails();
    } catch (error) {
      alert(`Final verification failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setSubmitting(false);
    }
  };

  const onCompleteDonation = async () => {
    if (!registrationId) return;
    try {
      setSubmitting(true);
      await completeDonorDonation(registrationId);
      await loadDetails();
      alert("Donation marked as completed.");
    } catch (error) {
      alert(`Unable to complete donation: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (!registrationId) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.center}>
          <Typo variant="body">Missing donor registration ID.</Typo>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Typo variant="h2">Donor Donation Details</Typo>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading || !details ? (
          <Card style={styles.card}>
            <Typo variant="body" style={{ color: colors.textMuted }}>
              Loading...
            </Typo>
          </Card>
        ) : (
          <>
            <Card style={styles.card}>
              <Typo variant="h2">{details.donor.name}</Typo>
              <Typo variant="caption" style={{ color: colors.textMuted, marginTop: 6 }}>
                Campaign: {details.campaignName}
              </Typo>
              <Typo variant="body" style={{ marginTop: 10 }}>
                Blood type: {details.donor.bloodType}
              </Typo>
              <Typo variant="body" style={{ marginTop: 4 }}>
                Last donation: {details.donor.lastDonationInfo}
              </Typo>
              <Typo variant="body" style={{ marginTop: 4 }}>
                Phone: {details.donor.phoneNumber || "N/A"}
              </Typo>
              <Typo variant="caption" style={{ color: colors.tint, marginTop: 10 }}>
                Current status: {details.process.donationStatus}
              </Typo>
            </Card>

            <Card style={styles.card}>
              <Typo variant="h2">Prechecking</Typo>
              <Input
                label="Body Weight (required)"
                placeholder="Enter body weight in kg"
                value={bodyWeightKg}
                onChangeText={setBodyWeightKg}
                keyboardType="decimal-pad"
              />
              <Typo variant="caption" style={{ color: colors.textMuted, marginTop: 4 }}>
                Rule: weight should not be below 50kg.
              </Typo>
              <Button
                label="Verify Body Weight"
                variant="primary"
                style={{ marginTop: 12 }}
                onPress={onVerifyPrecheck}
                disabled={submitting || details.process.donationStatus !== "PENDING_PRECHECK"}
              />
            </Card>

            <Card style={styles.card}>
              <Typo variant="h2">Doctor Verification</Typo>
              <Typo variant="caption" style={{ color: colors.textMuted, marginTop: 4 }}>
                Decision is required. Notes are optional.
              </Typo>
              <View style={styles.radioRow}>
                <Radio
                  label="Accept"
                  selected={doctorDecision === "ACCEPT"}
                  onSelect={() => setDoctorDecision("ACCEPT")}
                />
                <Radio
                  label="Reject"
                  selected={doctorDecision === "REJECT"}
                  onSelect={() => setDoctorDecision("REJECT")}
                />
              </View>
              <Input
                label="Notes (optional)"
                placeholder="Doctor notes"
                value={doctorNotes}
                onChangeText={setDoctorNotes}
                multiline
                numberOfLines={3}
                style={{ minHeight: 70, textAlignVertical: "top" }}
              />
              <Button
                label="Submit Doctor Verification"
                variant="primary"
                style={{ marginTop: 12 }}
                onPress={onVerifyDoctor}
                disabled={
                  submitting ||
                  details.process.donationStatus !== "PENDING_DOCTOR_VERIFICATION"
                }
              />
            </Card>

            <Card style={styles.card}>
              <Typo variant="h2">Final Verification</Typo>
              <Typo variant="caption" style={{ color: colors.textMuted, marginTop: 4 }}>
                Haemoglobin status: FLOATED = verified, NOT_FLOATED = rejected.
              </Typo>
              <View style={styles.radioRow}>
                <Radio
                  label="FLOATED"
                  selected={haemoglobinStatus === "FLOATED"}
                  onSelect={() => setHaemoglobinStatus("FLOATED")}
                />
                <Radio
                  label="NOT_FLOATED"
                  selected={haemoglobinStatus === "NOT_FLOATED"}
                  onSelect={() => setHaemoglobinStatus("NOT_FLOATED")}
                />
              </View>
              <Button
                label="Submit Final Verification"
                variant="primary"
                style={{ marginTop: 12 }}
                onPress={onVerifyFinal}
                disabled={
                  submitting ||
                  details.process.donationStatus !== "PENDING_FINAL_VERIFICATION"
                }
              />
            </Card>

            <Card style={styles.card}>
              <Typo variant="h2">After Donation</Typo>
              <Divider spacing={8} />
              <Button
                label="Complete Donation"
                variant="primary"
                onPress={onCompleteDonation}
                disabled={submitting || details.process.donationStatus !== "READY_FOR_DONATION"}
              />
            </Card>
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
    paddingVertical: 14,
  },
  backButton: { marginRight: 12 },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    gap: 12,
  },
  card: { padding: 14 },
  radioRow: { gap: 10, marginTop: 10, marginBottom: 8 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});
