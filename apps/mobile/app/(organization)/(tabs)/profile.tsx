import React, { useState, useRef } from "react";
import { View, StyleSheet, ScrollView, Animated, TouchableOpacity } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";

import { useThemeColor } from "@/packages/ui/hooks";
import { Typo, Input, Button, Avatar, Badge, AnimatedHeader, Select } from "@/packages/ui/components/ui";
import { useAuth } from "@/apps/mobile/src/context/AuthContext";
import { Alert } from "react-native";


export default function OrganizationProfileScreen() {
  const { theme, colors } = useThemeColor();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scrollY = useRef(new Animated.Value(0)).current;

  const { user, logout, updateProfile, requestDeleteAccount } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: user?.organizationName || "",
    location: user?.location || "",
    contact: user?.phone || "",
    website: user?.website || "",
    orgType: user?.orgType || "NGO" as any,
    registrationNumber: user?.registrationNumber || "",
  });

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err: any) {
      console.error("Logout failed:", err);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you absolutely sure? This action is permanent and cannot be undone. All your data will be removed.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: async () => {
          try {
            await requestDeleteAccount();
            router.push('/(organization)/verify-delete' as any);
          } catch (err: any) {
            Alert.alert("Error", err.message || "Failed to delete account");
          }
        }}
      ]
    );
  };


  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AnimatedHeader
        title="Organization Profile"
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
          <Typo variant="h2" style={styles.userName}>{user?.organizationName || "Organization Name"}</Typo>

          <View style={styles.userBadges}>
            <Badge label="Organization" variant="info" />
            <Typo variant="caption" color={colors.textMuted}>•</Typo>
            <Badge label="Active" variant="success" />
          </View>
        </View>

        {/* Stats Row */}
        {!isEditing && (
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
              <MaterialIcons name="event" size={24} color={colors.tint} />
              <Typo variant="h2" style={styles.statValue}>18</Typo>
              <Typo variant="caption" color={colors.textMuted}>Campaigns Organized</Typo>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
              <MaterialIcons name="group" size={24} color={colors.success} />
              <Typo variant="h2" style={styles.statValue}>3.4K</Typo>
              <Typo variant="caption" color={colors.textMuted}>Donors Reached</Typo>
            </View>
          </View>
        )}

        {/* Organization Details */}
        <View style={styles.detailsSection}>
          <Typo variant="h2" style={styles.sectionTitle}>Organization Details</Typo>

          {isEditing ? (
            <View style={{ gap: 16 }}>
              <Input
                value={formData.name}
                onChangeText={(t) => setFormData({...formData, name: t})}
                placeholder="Organization Name"
                leftIcon={<MaterialIcons name="corporate-fare" size={20} color={colors.icon} />}
              />
              <Input
                value={formData.location}
                onChangeText={(t) => setFormData({...formData, location: t})}
                placeholder="Location"
                leftIcon={<MaterialIcons name="location-on" size={20} color={colors.icon} />}
              />
              <Select
                placeholder="Organization Type"
                value={formData.orgType}
                options={["NGO", "GOVERNMENT", "PRIVATE", "OTHER"]}
                onSelect={(v: any) => setFormData({...formData, orgType: v})}
              />
              <Input
                value={formData.registrationNumber}
                onChangeText={(t) => setFormData({...formData, registrationNumber: t})}
                placeholder="Registration Number"
                leftIcon={<MaterialIcons name="badge" size={20} color={colors.icon} />}
              />
            </View>
          ) : (
            <>
              <View style={[styles.dummyInput, { backgroundColor: colors.surface }]}>
                <View>
                  <Typo variant="caption" color={colors.textMuted}>Organization Name</Typo>
                  <Typo variant="body" style={{ fontWeight: "500", marginTop: 4 }}>{user?.organizationName}</Typo>
                </View>
                <MaterialIcons name="corporate-fare" size={20} color={colors.icon} />
              </View>

              <View style={[styles.dummyInput, { backgroundColor: colors.surface }]}>
                <View>
                  <Typo variant="caption" color={colors.textMuted}>Location</Typo>
                  <Typo variant="body" style={{ fontWeight: "500", marginTop: 4 }}>{user?.location || "Not set"}</Typo>
                </View>
                <MaterialIcons name="location-on" size={20} color={colors.icon} />
              </View>

              <View style={[styles.dummyInput, { backgroundColor: colors.surface }]}>
                <View>
                  <Typo variant="caption" color={colors.textMuted}>Organization Type</Typo>
                  <Typo variant="body" style={{ fontWeight: "500", marginTop: 4 }}>{user?.orgType || "NGO"}</Typo>
                </View>
                <MaterialIcons name="category" size={20} color={colors.icon} />
              </View>

              <View style={[styles.dummyInput, { backgroundColor: colors.surface }]}>
                <View>
                  <Typo variant="caption" color={colors.textMuted}>Registration ID</Typo>
                  <Typo variant="body" style={{ fontWeight: "500", marginTop: 4 }}>{user?.registrationNumber || "N/A"}</Typo>
                </View>
                <MaterialIcons name="badge" size={20} color={colors.icon} />
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
                value={formData.contact}
                onChangeText={(t) => setFormData({...formData, contact: t})}
                placeholder="Phone"
                keyboardType="phone-pad"
                leftIcon={<MaterialIcons name="call" size={20} color={colors.icon} />}
              />
              <Input
                value={formData.website}
                onChangeText={(t) => setFormData({...formData, website: t})}
                placeholder="Website"
                leftIcon={<MaterialIcons name="language" size={20} color={colors.icon} />}
              />
            </View>
          ) : (
            <>
              <View style={[styles.dummyInput, { backgroundColor: colors.surface }]}>
                <View>
                  <Typo variant="caption" color={colors.textMuted}>Contact Number</Typo>
                  <Typo variant="body" color={colors.tint} style={{ fontWeight: "500", marginTop: 4 }}>{user?.phone}</Typo>
                </View>
                <MaterialIcons name="call" size={20} color={colors.icon} />
              </View>

              <View style={[styles.dummyInput, { backgroundColor: colors.surface }]}>
                <View>
                  <Typo variant="caption" color={colors.textMuted}>Website</Typo>
                  <Typo variant="body" color={colors.tint} style={{ fontWeight: "500", marginTop: 4 }}>{user?.website || "Not set"}</Typo>
                </View>
                <MaterialIcons name="language" size={20} color={colors.icon} />
              </View>
            </>
          )}
        </View>

        {/* Registration Info (Read-only) */}
        <View style={styles.detailsSection}>
          <View style={[styles.dummyInput, { backgroundColor: colors.surface, opacity: 0.7 }]}>
            <View>
              <Typo variant="caption" color={colors.textMuted}>Registration ID</Typo>
              <Typo variant="body" color={colors.textMuted} style={{ fontWeight: "500", marginTop: 4 }}>{user?.registrationNumber || "N/A"}</Typo>
            </View>
            <MaterialIcons name="lock" size={20} color={colors.icon} />
          </View>

          <View style={styles.rowInputs}>
            <View style={[styles.dummyInput, { flex: 1, backgroundColor: colors.surface, opacity: 0.7 }]}>
              <View>
                <Typo variant="caption" color={colors.textMuted}>Since</Typo>
                <Typo variant="body" color={colors.textMuted} style={{ fontWeight: "500", marginTop: 4 }}>
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Mar 2023"}
                </Typo>
              </View>
            </View>
          </View>

          {!isEditing && (
            <TouchableOpacity 
              style={[styles.manageBtn, { backgroundColor: colors.surface, borderLeftColor: colors.success, borderLeftWidth: 4 }]}
              onPress={() => router.push("/(organization)/(tabs)/fundraising")}
            >
              <View style={{ flex: 1 }}>
                <Typo variant="body" style={{ fontWeight: "bold" }}>Launch Fundraising</Typo>
                <Typo variant="caption" color={colors.textMuted}>Create campaigns and reach donors</Typo>
              </View>
              <MaterialIcons name="campaign" size={24} color={colors.success} />
            </TouchableOpacity>
          )}

          <View style={{ marginTop: 12 }}>
            <Button
              label="Logout"
              variant="secondary"
              style={{ backgroundColor: `${colors.error}1A`, borderColor: colors.error }}
              onPress={handleLogout}
              icon={<MaterialIcons name="logout" size={20} color={colors.error} />}
            />
          </View>
        </View>

        {!isEditing && (
          <View style={styles.detailsSection}>
             <Typo variant="caption" color={colors.error} style={{ fontWeight: "bold", marginBottom: 8, marginLeft: 4 }}>DANGER ZONE</Typo>
             <View style={[styles.dangerBox, { borderColor: `${colors.error}33`, backgroundColor: `${colors.error}08` }]}>
                <Typo variant="caption" color={colors.textMuted} style={{ marginBottom: 12 }}>
                  Permanently delete your account and all associated data. This action is irreversible.
                </Typo>
                <Button
                  label="Delete Account"
                  variant="danger"
                  onPress={handleDeleteAccount}
                  icon={<MaterialIcons name="delete-forever" size={20} />}
                />
             </View>
          </View>
        )}

        {isEditing && (
          <View style={styles.actionSection}>
            <Button
              label={isSaving ? "Saving..." : "Save Changes"}
              icon={!isSaving && <MaterialIcons name="save" size={20} />}
              iconPosition="left"
              variant="primary"
              style={styles.saveBtn}
              disabled={isSaving}
              onPress={async () => {
                setIsSaving(true);
                try {
                  await updateProfile({
                    organizationName: formData.name,
                    location: formData.location,
                    phone: formData.contact,
                    website: formData.website,
                    orgType: formData.orgType,
                    registrationNumber: formData.registrationNumber,
                  });
                  setIsEditing(false);
                  Alert.alert("Success", "Profile updated successfully!");
                } catch (err: any) {
                  Alert.alert("Error", err.message || "Failed to update profile");
                } finally {
                  setIsSaving(false);
                }
              }}
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
  manageBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 16,
    marginTop: 12,
  },
  rowInputs: {
    flexDirection: "row",
    gap: 16,
  },
  actionSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  saveBtn: {
    height: 56,
    borderRadius: 16,
  },
  dangerBox: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
  },
});
