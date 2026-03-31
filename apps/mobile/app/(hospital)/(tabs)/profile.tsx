import React, { useState, useRef } from "react";
import { View, StyleSheet, ScrollView, Animated, TouchableOpacity } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";

import { useThemeColor } from "@/packages/ui/hooks";
import { Typo, Input, Button, Avatar, Badge, Toggle, AnimatedHeader } from "@/packages/ui/components/ui";


export default function HospitalProfileScreen() {
  const { theme, colors } = useThemeColor();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scrollY = useRef(new Animated.Value(0)).current;

  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    name: "Saint Mary's General",
    location: "1245 Medical Center Dr, NY",
    phone: "+1 (555) 012-3456",
    email: "contact@stmarys.org",
    urgentRequests: true,
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AnimatedHeader
        title="Hospital Profile"
        scrollY={scrollY}
        leftElement={
          <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        }
        rightElement={
          <TouchableOpacity style={styles.iconButton} onPress={() => setIsEditing(!isEditing)}>
            <MaterialIcons name={isEditing ? "close" : "edit"} size={24} color={isEditing ? colors.error : colors.text} />
          </TouchableOpacity>
        }
      />

      <Animated.ScrollView
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        contentContainerStyle={[
          styles.scrollContent,
          { 
            paddingTop: 80 + insets.top, // Space for header
            paddingBottom: insets.bottom + 80 
          }
        ]}
        showsVerticalScrollIndicator={false}
      >

        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            <View style={[styles.avatarRing, { borderColor: `${colors.tint}33` }]}>
              <Avatar size={120} />
            </View>
            {isEditing && (
              <TouchableOpacity style={[styles.editAvatarBtn, { backgroundColor: colors.tint, borderColor: colors.background }]}>
                <MaterialIcons name="photo-camera" size={16} color={colors.background} />
              </TouchableOpacity>
            )}
          </View>
          <Typo variant="h2" style={styles.userName}>{formData.name}</Typo>
          <View style={styles.userBadges}>
            <Badge label="Hospital" variant="info" />
            <Typo variant="caption" color={colors.textMuted}>•</Typo>
            <Badge label="Verified" variant="success" />
          </View>
        </View>

        {/* Stats Row */}
        {!isEditing && (
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
              <MaterialIcons name="bloodtype" size={24} color={colors.tint} />
              <Typo variant="h2" style={styles.statValue}>245</Typo>
              <Typo variant="caption" color={colors.textMuted}>Units Stored</Typo>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
              <MaterialIcons name="volunteer-activism" size={24} color={colors.success} />
              <Typo variant="h2" style={styles.statValue}>1.2K</Typo>
              <Typo variant="caption" color={colors.textMuted}>Requests Fulfilled</Typo>
            </View>
          </View>
        )}

        {/* General Information */}
        <View style={styles.detailsSection}>
          <Typo variant="h2" style={styles.sectionTitle}>General Information</Typo>
          
          {isEditing ? (
            <View style={{ gap: 16 }}>
              <Input
                value={formData.name}
                onChangeText={(t) => setFormData({...formData, name: t})}
                placeholder="Hospital Name"
                leftIcon={<MaterialIcons name="local-hospital" size={20} color={colors.icon} />}
              />
              <Input
                value={formData.location}
                onChangeText={(t) => setFormData({...formData, location: t})}
                placeholder="Location"
                leftIcon={<MaterialIcons name="location-on" size={20} color={colors.icon} />}
              />
            </View>
          ) : (
            <>
              <View style={[styles.dummyInput, { backgroundColor: colors.surface }]}>
                <View>
                  <Typo variant="caption" color={colors.textMuted}>Hospital Name</Typo>
                  <Typo variant="body" style={{ fontWeight: "500", marginTop: 4 }}>{formData.name}</Typo>
                </View>
                <MaterialIcons name="local-hospital" size={20} color={colors.icon} />
              </View>

              <View style={[styles.dummyInput, { backgroundColor: colors.surface }]}>
                <View>
                  <Typo variant="caption" color={colors.textMuted}>Location</Typo>
                  <Typo variant="body" style={{ fontWeight: "500", marginTop: 4 }}>{formData.location}</Typo>
                </View>
                <MaterialIcons name="location-on" size={20} color={colors.icon} />
              </View>
            </>
          )}
        </View>

        {/* Contact Details */}
        <View style={styles.detailsSection}>
          <Typo variant="h2" style={styles.sectionTitle}>Contact Details</Typo>

          {isEditing ? (
            <View style={{ gap: 16 }}>
              <Input
                value={formData.phone}
                onChangeText={(t) => setFormData({...formData, phone: t})}
                placeholder="Phone"
                keyboardType="phone-pad"
                leftIcon={<MaterialIcons name="call" size={20} color={colors.icon} />}
              />
              <Input
                value={formData.email}
                onChangeText={(t) => setFormData({...formData, email: t})}
                placeholder="Email"
                keyboardType="email-address"
                leftIcon={<MaterialIcons name="alternate-email" size={20} color={colors.icon} />}
              />
            </View>
          ) : (
            <>
              <View style={[styles.dummyInput, { backgroundColor: colors.surface }]}>
                <View>
                  <Typo variant="caption" color={colors.textMuted}>Phone</Typo>
                  <Typo variant="body" color={colors.tint} style={{ fontWeight: "500", marginTop: 4 }}>{formData.phone}</Typo>
                </View>
                <MaterialIcons name="call" size={20} color={colors.icon} />
              </View>

              <View style={[styles.dummyInput, { backgroundColor: colors.surface }]}>
                <View>
                  <Typo variant="caption" color={colors.textMuted}>Email</Typo>
                  <Typo variant="body" style={{ fontWeight: "500", marginTop: 4 }}>{formData.email}</Typo>
                </View>
                <MaterialIcons name="alternate-email" size={20} color={colors.icon} />
              </View>
            </>
          )}
        </View>

        {/* Operations */}
        <View style={styles.detailsSection}>
          <Typo variant="h2" style={styles.sectionTitle}>Operations</Typo>

          <View style={[styles.dummyInput, { backgroundColor: colors.surface, opacity: isEditing ? 1 : 0.7 }]}>
            <View>
              <Typo variant="caption" color={colors.textMuted}>Operating Hours</Typo>
              <Typo variant="body" color={colors.textMuted} style={{ fontWeight: "500", marginTop: 4 }}>08:00 AM - 08:00 PM</Typo>
            </View>
            <MaterialIcons name="schedule" size={20} color={colors.icon} />
          </View>

          <View style={[styles.toggleRow, { backgroundColor: colors.surface }]}>
            <View style={{ flex: 1 }}>
              <Typo variant="body" style={{ fontWeight: "500" }}>Accepting Urgent Requests</Typo>
              <Typo variant="caption" color={colors.textMuted} style={{ marginTop: 2 }}>Allow emergency blood requests</Typo>
            </View>
            <Toggle
              value={formData.urgentRequests}
              onToggle={(val) => { if (isEditing) setFormData({...formData, urgentRequests: val}); }}
              disabled={!isEditing}
            />
          </View>

          {!isEditing && (
            <TouchableOpacity 
              style={[styles.manageBtn, { backgroundColor: colors.surface, borderLeftColor: colors.tint, borderLeftWidth: 4 }]}
              onPress={() => router.push("/(hospital)/(tabs)/manage-shop")}
            >
              <View style={{ flex: 1 }}>
                <Typo variant="body" style={{ fontWeight: "bold" }}>Manage Rewards Shop</Typo>
                <Typo variant="caption" color={colors.textMuted}>Create and update available offers</Typo>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={colors.tint} />
            </TouchableOpacity>
          )}
        </View>

        {isEditing && (
          <View style={styles.actionSection}>
            <Button
              label="Save Changes"
              icon={<MaterialIcons name="save" size={20} />}
              iconPosition="left"
              variant="primary"
              style={styles.saveBtn}
              onPress={() => setIsEditing(false)}
            />
          </View>
        )}

      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  scrollContent: {
    paddingBottom: 24,
  },
  avatarSection: {
    alignItems: "center",
    paddingTop: 32,
    paddingBottom: 24,
  },
  avatarWrapper: {
    position: "relative",
  },
  avatarRing: {
    width: 132,
    height: 132,
    borderRadius: 66,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  editAvatarBtn: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 16,
  },
  userBadges: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    gap: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "bold",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  detailsSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
    gap: 12,
  },
  dummyInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 16,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 16,
  },
  manageBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 16,
    marginTop: 12,
  },
  actionSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  saveBtn: {
    height: 56,
    borderRadius: 16,
  },
});
