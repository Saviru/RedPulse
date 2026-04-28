import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, Animated, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { useThemeColor } from "@/packages/ui/hooks";
import { Typo, Card, Button, AnimatedHeader, Badge } from "@/packages/ui/components/ui";
import { useScroll } from "@/packages/ui/context/ScrollContext";
import { getPublishedCampaigns, PublicCampaign } from "@/apps/mobile/src/services/campaignService";
import { getApiErrorMessage } from "@/apps/mobile/src/services/apiClient";

export default function AvailableCampsScreen() {
  const { colors, theme } = useThemeColor();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const { handleScroll } = useScroll();
  const [camps, setCamps] = useState<PublicCampaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        setLoading(true);
        const data = await getPublishedCampaigns();
        setCamps(data);
      } catch (error) {
        alert(`Failed to load campaigns: ${getApiErrorMessage(error)}`);
      } finally {
        setLoading(false);
      }
    };
    loadCampaigns();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AnimatedHeader
        title="Available Camps"
        scrollY={scrollY}
        leftElement={
          <TouchableOpacity onPress={() => router.back()} accessibilityRole="button">
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        }
      />

      <Animated.ScrollView
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { 
            useNativeDriver: true,
            listener: handleScroll 
          }
        )}
        scrollEventThrottle={16}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: 80 + insets.top, paddingBottom: insets.bottom + 40 }
        ]}
      >
        <View style={styles.header}>
          <Typo variant="h2">Donation Camps Near You</Typo>
          <Typo variant="body" color={colors.textMuted} style={{ marginTop: 8 }}>
            Find a convenient location and help save lives today.
          </Typo>
        </View>

        <View style={styles.campsList}>
          {loading ? (
            <Card variant="elevated" style={styles.campCard}>
              <Typo variant="body" color={colors.textMuted}>Loading campaigns...</Typo>
            </Card>
          ) : camps.map((camp) => (
            <Card key={camp._id} variant="elevated" style={styles.campCard}>
              <View style={styles.campHeader}>
                <View style={{ flex: 1 }}>
                  <Typo variant="h2">{camp.name}</Typo>
                  <Typo variant="caption" color={colors.textMuted} style={{ marginTop: 4 }}>
                    {camp.location}
                  </Typo>
                </View>
                <Badge 
                  label="Open" 
                  variant="success" 
                />
              </View>

              <View style={styles.campDetails}>
                <View style={styles.detailRow}>
                  <MaterialIcons name="event" size={16} color={colors.textMuted} />
                  <Typo variant="body" color={colors.text} style={styles.detailText}>
                    {new Date(camp.date).toDateString()}
                  </Typo>
                </View>
                <View style={styles.detailRow}>
                  <MaterialIcons name="schedule" size={16} color={colors.textMuted} />
                  <Typo variant="body" color={colors.text} style={styles.detailText}>
                    {new Date(camp.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - {new Date(camp.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </Typo>
                </View>
              </View>

              <Button
                label="Register"
                variant="primary"
                style={styles.registerBtn}
                onPress={() =>
                  router.push({
                    pathname: "/(user)/campaign-registration",
                    params: {
                      campId: camp._id,
                      role: "donor",
                      title: camp.name,
                      organization: camp.organizationName,
                      hospital: camp.currentHospitalName,
                      date: new Date(camp.date).toDateString(),
                      time: `${new Date(camp.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - ${new Date(camp.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
                      location: camp.location,
                      volunteerPoints: "100",
                    },
                  } as any)
                }
              />
            </Card>
          ))}
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
  },
  header: {
    marginBottom: 24,
  },
  campsList: {
    gap: 16,
  },
  campCard: {
    padding: 16,
    borderRadius: 20,
  },
  campHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  campDetails: {
    backgroundColor: "rgba(0,0,0,0.02)",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailText: {
    marginLeft: 8,
    fontWeight: "500",
  },
  registerBtn: {
    width: "100%",
  },
});
