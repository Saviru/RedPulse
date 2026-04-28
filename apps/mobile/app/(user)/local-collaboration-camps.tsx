import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { StyleSheet, View, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { Button, Divider, Typo, Card, Badge } from "@/packages/ui/components/ui";
import { useThemeColor } from "@/packages/ui/hooks";
import {
  getMyCampaignRegistrations,
  getPublishedCampaigns,
  MyCampaignRegistrationRow,
  PublicCampaign,
} from "@/apps/mobile/src/services/campaignService";
import { getApiErrorMessage } from "@/apps/mobile/src/services/apiClient";

export default function LocalCollaborationCampsScreen() {
  const router = useRouter();
  const { colors } = useThemeColor();
  const [camps, setCamps] = useState<PublicCampaign[]>([]);
  const [myRegs, setMyRegs] = useState<MyCampaignRegistrationRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      const [published, registrations] = await Promise.all([
        getPublishedCampaigns(),
        getMyCampaignRegistrations(),
      ]);
      setCamps(published);
      setMyRegs(registrations);
    } catch (error) {
      alert(`Failed to load campaigns: ${getApiErrorMessage(error)}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [loadAll]),
  );

  const regByCampaign = useMemo(() => {
    const m = new Map<string, MyCampaignRegistrationRow>();
    myRegs.forEach((r) => m.set(r.campaignId, r));
    return m;
  }, [myRegs]);

  const openRegistration = (camp: PublicCampaign, role: "donor" | "volunteer") => {
    const date = new Date(camp.date).toDateString();
    const start = new Date(camp.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const end = new Date(camp.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    router.push({
      pathname: "/(user)/campaign-registration",
      params: {
        campId: camp._id,
        role,
        title: camp.name,
        organization: camp.organizationName,
        hospital: camp.currentHospitalName,
        date,
        time: `${start} - ${end}`,
        location: camp.location,
        volunteerPoints: "100",
      },
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Typo variant="h2">Local campaigns</Typo>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Typo variant="body" style={{ color: colors.textMuted, marginBottom: 8 }}>
          These camps have an accepted hospital collaboration. You can register as a donor
          or as a volunteer—the same registration form is used for both.
        </Typo>

        {loading ? (
          <View style={styles.card}>
            <Typo variant="body" style={{ color: colors.textMuted }}>
              Loading campaigns...
            </Typo>
          </View>
        ) : (
          camps.map((camp) => {
            const row = regByCampaign.get(camp._id);
            const donorDone =
              row?.donor?.status === "REGISTERED" && row.donor.screeningDecision === "APPROVED";
            const donorId = donorDone ? row?.donor?.donorPublicId ?? null : null;
            const showDonorButton = !donorDone;

            const volDone = row?.volunteer?.status === "REGISTERED";
            const volunteerId = volDone ? row?.volunteer?.volunteerPublicId ?? null : null;
            const assignedTask = row?.volunteer?.assignedTask;
            const showVolunteerButton = !volDone;

            return (
              <Card key={camp._id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={{ flex: 1 }}>
                    <Typo variant="caption" style={{ color: colors.textMuted }}>
                      {camp.organizationName}
                    </Typo>
                    <Typo variant="h2" style={{ marginTop: 4 }}>
                      {camp.name}
                    </Typo>
                  </View>
                  <Badge label="Hospital partnered" variant="success" />
                </View>

                <Typo variant="caption" style={{ color: colors.tint, marginTop: 10, fontWeight: "600" }}>
                  {camp.currentHospitalName}
                </Typo>

                <View style={styles.row}>
                  <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
                  <Typo variant="body" style={[styles.rowText, { color: colors.textMuted }]}>
                    {new Date(camp.date).toDateString()} ·{" "}
                    {new Date(camp.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{" "}
                    {new Date(camp.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </Typo>
                </View>
                <View style={styles.row}>
                  <Ionicons name="location-outline" size={16} color={colors.textMuted} />
                  <Typo variant="body" style={[styles.rowText, { color: colors.textMuted }]}>
                    {camp.location}
                  </Typo>
                </View>
                <Typo variant="caption" style={{ color: colors.textMuted, marginTop: 8 }}>
                  Max donor capacity: {camp.maxCapacity}
                </Typo>

                {(donorId || volunteerId || assignedTask) && (
                  <>
                    <Divider spacing={16} />
                    {donorId ? (
                      <View style={styles.idBlock}>
                        <Typo variant="caption" style={{ color: colors.textMuted, fontWeight: "600" }}>
                          Donor ID
                        </Typo>
                        <Typo variant="body" style={{ color: colors.text, fontWeight: "700", marginTop: 4 }}>
                          {donorId}
                        </Typo>
                      </View>
                    ) : null}
                    {volunteerId ? (
                      <View style={[styles.idBlock, { marginTop: donorId ? 12 : 0 }]}>
                        <Typo variant="caption" style={{ color: colors.textMuted, fontWeight: "600" }}>
                          Volunteer ID
                        </Typo>
                        <Typo variant="body" style={{ color: colors.text, fontWeight: "700", marginTop: 4 }}>
                          {volunteerId}
                        </Typo>
                      </View>
                    ) : null}
                    {assignedTask ? (
                      <View style={[styles.idBlock, { marginTop: 12 }]}>
                        <Typo variant="caption" style={{ color: colors.textMuted, fontWeight: "600" }}>
                          Assigned task
                        </Typo>
                        <Typo variant="body" style={{ color: colors.text, fontWeight: "700", marginTop: 4 }}>
                          {assignedTask.title}
                        </Typo>
                        {assignedTask.description ? (
                          <Typo variant="caption" style={{ color: colors.textMuted, marginTop: 6 }}>
                            {assignedTask.description}
                          </Typo>
                        ) : null}
                        <Typo variant="caption" style={{ color: colors.tint, marginTop: 6 }}>
                          Reward: {assignedTask.points} pts
                        </Typo>
                      </View>
                    ) : null}
                  </>
                )}

                <Divider spacing={16} />

                <View style={styles.actions}>
                  {showDonorButton ? (
                    <Button
                      label="Register as donor"
                      variant="primary"
                      style={styles.actionBtn}
                      onPress={() => openRegistration(camp, "donor")}
                    />
                  ) : (
                    <View style={[styles.placeholderBtn, { borderColor: colors.border }]}>
                      <Typo variant="caption" style={{ color: colors.textMuted, textAlign: "center" }}>
                        Donor registration complete
                      </Typo>
                    </View>
                  )}
                  {showVolunteerButton ? (
                    <Button
                      label="Register as volunteer"
                      variant="secondary"
                      style={styles.actionBtn}
                      onPress={() => openRegistration(camp, "volunteer")}
                    />
                  ) : (
                    <View style={[styles.placeholderBtn, { borderColor: colors.border }]}>
                      <Typo variant="caption" style={{ color: colors.textMuted, textAlign: "center" }}>
                        Volunteer registration complete
                      </Typo>
                    </View>
                  )}
                </View>
              </Card>
            );
          })
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
  content: { paddingHorizontal: 20, paddingBottom: 32, gap: 16 },
  card: { padding: 16, marginBottom: 4 },
  cardTop: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  row: { flexDirection: "row", alignItems: "center", marginTop: 10 },
  rowText: { marginLeft: 8, flex: 1 },
  actions: { flexDirection: "row", gap: 10 },
  actionBtn: { flex: 1 },
  idBlock: {},
  placeholderBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});
