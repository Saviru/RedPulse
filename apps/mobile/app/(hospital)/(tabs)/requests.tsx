import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { getApiErrorMessage } from "@/apps/mobile/src/services/apiClient";
import {
  getHospitalVerifiedDonors,
  HospitalVerifiedDonor,
} from "@/apps/mobile/src/services/organizationService";
import { Badge, Card, Input, Typo } from "@/packages/ui/components/ui";
import { useThemeColor } from "@/packages/ui/hooks";

export default function HospitalRequestsScreen() {
  const { colors } = useThemeColor();
  const router = useRouter();
  const [donors, setDonors] = useState<HospitalVerifiedDonor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredDonors = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return donors;
    return donors.filter((d) => {
      const name = (d.fullName ?? "").toLowerCase();
      const donorId = (d.donorPublicId ?? "").toLowerCase();
      return name.includes(q) || donorId.includes(q);
    });
  }, [donors, searchQuery]);

  const loadDonors = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getHospitalVerifiedDonors();
      setDonors(data);
    } catch (error) {
      alert(`Failed to load verified donors: ${getApiErrorMessage(error)}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDonors();
  }, [loadDonors]);

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      const data = await getHospitalVerifiedDonors();
      setDonors(data);
    } catch (error) {
      alert(`Failed to refresh: ${getApiErrorMessage(error)}`);
    } finally {
      setRefreshing(false);
    }
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Typo variant="h2">Verified Donors</Typo>
        <Typo variant="caption" style={{ color: colors.textMuted, marginTop: 6 }}>
          Donors automatically approved by screening appear here.
        </Typo>

        <Input
          label="Search"
          placeholder="Search by name or donor ID"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={{ marginTop: 16 }}
        />

        {loading ? (
          <Card style={styles.card}>
            <Typo variant="body" style={{ color: colors.textMuted }}>
              Loading...
            </Typo>
          </Card>
        ) : donors.length === 0 ? (
          <Card style={styles.card}>
            <Typo variant="body" style={{ color: colors.textMuted }}>
              No verified donors found yet.
            </Typo>
          </Card>
        ) : filteredDonors.length === 0 ? (
          <Card style={styles.card}>
            <Typo variant="body" style={{ color: colors.textMuted }}>
              No donors match your search.
            </Typo>
          </Card>
        ) : (
          filteredDonors.map((donor) => (
            <TouchableOpacity
              key={donor.id}
              activeOpacity={0.8}
              onPress={() =>
                router.push({
                  pathname: "/(hospital)/donor-donation-details",
                  params: { registrationId: donor.id },
                } as any)
              }
            >
              <Card style={styles.card}>
              <View style={styles.header}>
                <Typo variant="h2">{donor.fullName}</Typo>
                <Badge label="VERIFIED" variant="success" />
              </View>
              <Typo variant="caption" style={{ color: colors.textMuted, marginTop: 6 }}>
                Campaign: {donor.campaignName}
              </Typo>
              {donor.donorPublicId ? (
                <Typo variant="caption" style={{ color: colors.tint, marginTop: 6, fontWeight: "600" }}>
                  {donor.donorPublicId}
                </Typo>
              ) : null}
              <Typo variant="body" style={{ marginTop: 10 }}>
                Blood: {donor.bloodType}
              </Typo>
              <Typo variant="body" style={{ marginTop: 4 }}>
                Phone: {donor.phoneNumber || "N/A"}
              </Typo>
              <Typo variant="body" style={{ marginTop: 4 }}>
                Age/Gender: {donor.age ?? "N/A"} / {donor.gender ?? "N/A"}
              </Typo>
              <Typo variant="caption" style={{ color: colors.textMuted, marginTop: 8 }}>
                Tap to process donation workflow
              </Typo>
              </Card>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 12 },
  card: { padding: 14 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
