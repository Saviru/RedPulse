import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, Animated, TouchableOpacity, ScrollView, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";

import { useThemeColor } from "@/packages/ui/hooks";
import { Typo, Card, Button, AnimatedHeader, Divider, Badge } from "@/packages/ui/components/ui";
import { useScroll } from "@/packages/ui/context/ScrollContext";
import { useAuth } from "@/apps/mobile/src/context/AuthContext";
import { useUserStore } from "@/apps/mobile/src/store/UserContext";
import { AppNotification, getMyNotifications } from "@/apps/mobile/src/lib/organizationService";
import { getVisibleBloodRequests, BloodRequestResponse } from "@/apps/mobile/src/lib/bloodRequestApi";
import { getTransactions, PointTransaction } from "@/apps/mobile/src/lib/pointService";
import { getPublicStats, PublicStats } from "@/apps/mobile/src/lib/userService";


export default function UserHomeScreen() {
  const { colors, theme } = useThemeColor();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const { handleScroll } = useScroll();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [urgentRequests, setUrgentRequests] = useState<BloodRequestResponse[]>([]);
  const [recentActivity, setRecentActivity] = useState<PointTransaction[]>([]);
  const [publicStats, setPublicStats] = useState<PublicStats | null>(null);
  const [loading, setLoading] = useState(true);

  const { user } = useUserStore();

  // Calculate Eligibility
  const getEligibilityDays = () => {
    if (!user?.lastDonationDate) return 0;
    
    const lastDate = new Date(user.lastDonationDate);
    const nextDate = new Date(lastDate);
    nextDate.setDate(nextDate.getDate() + 90); // 90 days interval
    
    const diffTime = nextDate.getTime() - new Date().getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  };

  const eligibilityDays = getEligibilityDays();

  // Stats from real user data
  const stats = [
    { label: "Blood Group", value: user?.bloodGroup || "N/A", icon: "opacity" },
    { label: "Donations", value: String(user?.totalDonations || 0), icon: "bloodtype" },
    { label: "Lives Saved", value: String((user?.totalDonations || 0) * 3), icon: "favorite" },
    { label: "Points", value: (user?.points ?? 0).toLocaleString(), icon: "stars" },
  ];


  useEffect(() => {
    const fetchData = async () => {
      try {
        const [notifData, bloodRequests, transactions, statsData] = await Promise.all([
          getMyNotifications(),
          getVisibleBloodRequests(),
          getTransactions(),
          getPublicStats()
        ]);
        
        setNotifications((notifData || []).slice(0, 3));
        setUrgentRequests((bloodRequests || []).slice(0, 2));
        setRecentActivity((transactions || []).slice(0, 3));
        setPublicStats(statsData);

      } catch (error) {
        console.warn(`Failed to load home data: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AnimatedHeader
        title="RedPulse"
        scrollY={scrollY}
        rightElement={
          <TouchableOpacity style={styles.iconButton} onPress={() => router.push("/(user)/campaign-tasks" as any)}>
            <MaterialIcons name="assignment" size={24} color={colors.text} />
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
          { paddingTop: 80 + insets.top, paddingBottom: insets.bottom + 100 }
        ]}
      >
        {/* Hero Section */}
        <Card variant="elevated" style={[styles.heroCard, { backgroundColor: colors.tint }]}>
          <View style={styles.heroContent}>
            <View>
              <Typo variant="h2" color="#FFF">Next Donation</Typo>
              <Typo variant="body" color="rgba(255,255,255,0.8)" style={{ marginTop: 4 }}>
                {eligibilityDays > 0 
                  ? "You are eligible to donate in:" 
                  : "You are now eligible to donate!"}
              </Typo>
              <Typo variant="h1" color="#FFF" style={{ marginTop: 8 }}>
                {eligibilityDays > 0 ? `${eligibilityDays} Days` : "Eligible Now"}
              </Typo>
            </View>
            <MaterialIcons name="event-available" size={60} color="rgba(255,255,255,0.3)" />
          </View>
          <Button 
            label="Find Local Campaigns" 
            variant="secondary" 
            style={styles.heroBtn}
            onPress={() => router.push("/(user)/local-collaboration-camps" as any)}
          />
          <Button 
            label="Check Eligibility" 
            variant="secondary" 
            style={[styles.heroBtn, { marginTop: 8 }]}
            onPress={() => router.push("/(user)/eligibility" as any)}
          />
        </Card>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {stats.map((stat, i) => (
            <Card key={i} style={styles.statCard}>
              <MaterialIcons name={stat.icon as any} size={20} color={colors.tint} />
              <Typo variant="h3" style={{ marginTop: 8 }}>{stat.value}</Typo>
              <Typo variant="caption" color={colors.textMuted}>{stat.label}</Typo>
            </Card>
          ))}
        </View>

        {/* Community Impact Summary */}
        {publicStats && (
          <View style={styles.section}>
            <Typo variant="h2" style={{ marginBottom: 16 }}>Community Impact</Typo>
            <Card variant="outlined" style={styles.communityCard}>
              <View style={styles.communityRow}>
                <View style={styles.communityItem}>
                  <Typo variant="h3" color={colors.tint}>{publicStats.totalDonations}</Typo>
                  <Typo variant="caption" color={colors.textMuted}>Donations</Typo>
                </View>
                <Divider vertical spacing={16} />
                <View style={styles.communityItem}>
                  <Typo variant="h3" color={colors.success}>{publicStats.totalLivesSaved}</Typo>
                  <Typo variant="caption" color={colors.textMuted}>Lives Saved</Typo>
                </View>
                <Divider vertical spacing={16} />
                <View style={styles.communityItem}>
                  <Typo variant="h3" color={colors.info}>{publicStats.totalDonors}</Typo>
                  <Typo variant="caption" color={colors.textMuted}>Donors</Typo>
                </View>
              </View>
            </Card>
          </View>
        )}


        {/* Quick Actions */}
        <View style={styles.section}>
          <Typo variant="h2" style={{ marginBottom: 16 }}>Volunteer Center</Typo>
          <TouchableOpacity 
            style={[styles.taskActionCard, { backgroundColor: `${colors.tint}10`, borderColor: colors.tint }]}
            onPress={() => router.push("/(user)/campaign-tasks" as any)}
          >
            <View style={styles.taskActionContent}>
              <View style={[styles.taskActionIcon, { backgroundColor: colors.tint }]}>
                <MaterialIcons name="assignment" size={24} color="#FFF" />
              </View>
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Typo variant="h3">My Campaign Tasks</Typo>
                <Typo variant="caption" color={colors.textMuted}>View roles assigned by organizations</Typo>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={colors.tint} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.taskActionCard, { backgroundColor: `${colors.info}10`, borderColor: colors.info, marginTop: 12 }]}
            onPress={() => router.push("/(user)/feedback" as any)}
          >
            <View style={styles.taskActionContent}>
              <View style={[styles.taskActionIcon, { backgroundColor: colors.info }]}>
                <MaterialIcons name="feedback" size={24} color="#FFF" />
              </View>
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Typo variant="h3">Feedback & Support</Typo>
                <Typo variant="caption" color={colors.textMuted}>Share your experience or report issues</Typo>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={colors.info} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Typo variant="h2">Urgent Blood Requests</Typo>
            <TouchableOpacity onPress={() => router.push("/(user)/blood-requests" as any)}>
              <Badge label="View All" variant="info" />
            </TouchableOpacity>
          </View>
          
          {urgentRequests.length > 0 ? (
            urgentRequests.map((request) => (
              <Card key={request._id} variant="outlined" style={styles.requestCard}>
                <View style={styles.requestInfo}>
                  <View style={[styles.bloodType, { backgroundColor: `${colors.error}1A` }]}>
                    <Typo variant="h2" color={colors.error}>{request.bloodGroup}</Typo>
                  </View>
                  <View style={{ flex: 1, marginLeft: 16 }}>
                    <Typo variant="h2">
                      { (request.hospitalName && request.hospitalName !== "Unknown") 
                        ? request.hospitalName 
                        : (request.requesterName && request.requesterName !== "Unknown") 
                          ? request.requesterName 
                          : "Blood Needed" 
                      }
                    </Typo>
                    <Typo variant="caption" color={colors.textMuted}>
                      { (request.city && request.city !== "Unknown")
                        ? request.city 
                        : (request.locationText && request.locationText !== "Unknown" && request.locationText !== "Unknown Location")
                          ? request.locationText
                          : "Location Unavailable"
                      } • {request.bloodComponent || "Whole Blood"}
                    </Typo>
                  </View>
                </View>
                <Button 
                  label="Details" 
                  variant="primary" 
                  style={{ marginTop: 16 }} 
                  onPress={() => router.push(`/(user)/blood-request-details?id=${request._id}` as any)}
                />
              </Card>
            ))
          ) : (
            <Card style={styles.activityCard}>
              <Typo variant="body" color={colors.textMuted}>No urgent requests nearby.</Typo>
            </Card>
          )}
        </View>

        <View style={styles.section}>
          <Typo variant="h2" style={{ marginBottom: 16 }}>Recent Activity</Typo>
          {recentActivity.length > 0 ? (
            recentActivity.map((activity) => (
              <Card key={activity._id} style={[styles.activityCard, { marginBottom: 12 }]}>
                <View style={styles.activityItem}>
                  <View style={[styles.activityIcon, { backgroundColor: `${activity.type === 'EARN' ? colors.success : colors.tint}1A` }]}>
                    <MaterialIcons 
                      name={activity.type === 'EARN' ? "add-circle" : "card-giftcard"} 
                      size={20} 
                      color={activity.type === 'EARN' ? colors.success : colors.tint} 
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Typo variant="body" style={{ fontWeight: "600" }}>
                      {activity.type === 'EARN' ? 'Earned' : activity.type === 'REDEEM' ? 'Redeemed' : 'Points'} {activity.points || (activity as any).amount} Points
                    </Typo>
                    <Typo variant="caption" color={colors.textMuted}>{activity.description}</Typo>
                  </View>
                  <Typo variant="caption" color={colors.textMuted}>
                    {new Date(activity.createdAt || (activity as any).timestamp).toLocaleDateString()}
                  </Typo>
                </View>
              </Card>
            ))
          ) : (
            <Card style={styles.activityCard}>
              <Typo variant="body" color={colors.textMuted}>No recent activity.</Typo>
            </Card>
          )}
        </View>

        <View style={styles.section}>
          <Typo variant="h2" style={{ marginBottom: 16 }}>Notifications</Typo>
          {notifications.length === 0 ? (
            <Card style={styles.activityCard}>
              <Typo variant="body" color={colors.textMuted}>
                No notifications yet.
              </Typo>
            </Card>
          ) : (
            notifications.map((notification) => (
              <Card key={notification._id} style={styles.activityCard}>
                <Typo variant="body" style={{ fontWeight: "700" }}>
                  {notification.title}
                </Typo>
                <Typo variant="caption" color={colors.textMuted} style={{ marginTop: 6 }}>
                  {notification.message}
                </Typo>
              </Card>
            ))
          )}
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  heroCard: {
    padding: 24,
    borderRadius: 28,
    marginBottom: 24,
  },
  heroContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  heroBtn: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 0,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    padding: 16,
    alignItems: "center",
    borderRadius: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  requestCard: {
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
  },
  requestInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  bloodType: {
    width: 50,
    height: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  activityCard: {
    padding: 16,
    borderRadius: 20,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  taskActionCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  taskActionContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  taskActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  communityCard: {
    padding: 20,
    borderRadius: 24,
  },
  communityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  communityItem: {
    flex: 1,
    alignItems: "center",
  },
});

