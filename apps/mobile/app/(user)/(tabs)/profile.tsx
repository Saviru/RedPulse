import React, { useState, useRef } from "react";
import { View, StyleSheet, ScrollView, Animated, TouchableOpacity } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";

import { useThemeColor } from "@/packages/ui/hooks";
import { Typo, Input, Button, Avatar, Badge, AnimatedHeader } from "@/packages/ui/components/ui";
import { useAuth } from "../../../src/context/AuthContext";
import { Alert } from "react-native";


export default function DonorProfileScreen() {
  const { theme, colors } = useThemeColor();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scrollY = useRef(new Animated.Value(0)).current;

  const { user, logout, updateProfile, requestDeleteAccount, confirmDeleteAccount } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    username: user?.username || "",
    location: user?.location || "",
    fullName: user?.fullName || "",
    nic: user?.nic || "",
    dob: user?.dob || "",
    bloodGroup: user?.bloodGroup || "",
    phone: user?.phone || "",
    weight: user?.weight || "",
  });

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not set";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Logout", style: "destructive", onPress: logout }
      ]
    );
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
            router.push('/(user)/verify-delete' as any);
          } catch (err: any) {
            Alert.alert("Error", err.message || "Failed to delete account");
          }
        }}
      ]
    );
  };

  const renderTrophy = (iconName: keyof typeof MaterialIcons.glyphMap, title: string, isThemeTint: boolean, isLocked = false) => {
    const bgColor = isLocked ? colors.surface : (isThemeTint ? `${colors.tint}1A` : `${colors.success}1A`);
    const iconColor = isLocked ? colors.icon : (isThemeTint ? colors.tint : colors.success);
    
    return (
      <View style={[styles.trophyCard, isLocked && { opacity: 0.5 }]}>
        <View style={[styles.trophyIconBox, { backgroundColor: bgColor, borderColor: isLocked ? colors.border : 'transparent' }]}>
          <MaterialIcons name={iconName} size={36} color={iconColor} />
        </View>
        <Typo variant="caption" align="center" style={styles.trophyTitle}>{title}</Typo>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AnimatedHeader
        title="My Profile"
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
          <Typo variant="h2" style={styles.userName}>{user?.fullName || user?.username || "User"}</Typo>
          <View style={styles.userBadges}>
            <Badge label={user?.bloodGroup || "N/A"} variant="info" />
            <Typo variant="caption" color={colors.textMuted}>•</Typo>
            <Typo variant="caption" color={colors.textMuted} style={{ fontWeight: "500" }}>Donor</Typo>
          </View>
        </View>

        {/* Trophy Case */}
        {!isEditing && (
          <View style={styles.trophySection}>
            <View style={styles.trophyHeader}>
              <Typo variant="h2" style={styles.sectionTitle}>Trophy Case</Typo>
              <TouchableOpacity onPress={() => router.push("/(user)/(tabs)/rewards" as any)}>
                <Typo variant="caption" color={colors.tint} style={{ fontWeight: "600" }}>View All</Typo>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.trophiesScroll}>
              {renderTrophy("workspace-premium", "Super Donor", false)}
              {renderTrophy("bloodtype", "Life Saver 2023", true)}
              {renderTrophy("timer", "Fast Recovery", false)}
              {renderTrophy("lock", "15 Donations", false, true)}
            </ScrollView>
          </View>
        )}

        {/* Settings Forms */}
        <View style={styles.detailsSection}>
          <Typo variant="h2" style={styles.sectionTitle}>Personal Details</Typo>
          
          {isEditing ? (
            <View style={{ gap: 16 }}>
              <Input
                label="Full Name"
                value={formData.fullName}
                onChangeText={(t) => setFormData({...formData, fullName: t})}
                placeholder="Full Name"
                leftIcon={<MaterialIcons name="badge" size={20} color={colors.icon} />}
              />
              <Input
                label="Location"
                value={formData.location}
                onChangeText={(t) => setFormData({...formData, location: t})}
                placeholder="Location"
                leftIcon={<MaterialIcons name="location-on" size={20} color={colors.icon} />}
              />
              <Input
                label="NIC"
                value={formData.nic}
                onChangeText={(t) => setFormData({...formData, nic: t})}
                placeholder="National ID"
                leftIcon={<MaterialIcons name="lock-open" size={20} color={colors.icon} />}
              />
              <Input
                label="Phone Number"
                value={formData.phone}
                onChangeText={(t) => setFormData({...formData, phone: t})}
                placeholder="Phone Number"
                keyboardType="phone-pad"
                leftIcon={<MaterialIcons name="call" size={20} color={colors.icon} />}
              />
              <View style={styles.rowInputs}>
                <View style={{ flex: 1 }}>
                  <Input
                    label="Date of Birth"
                    value={formData.dob}
                    onChangeText={(t) => setFormData({...formData, dob: t})}
                    placeholder="YYYY-MM-DD"
                    leftIcon={<MaterialIcons name="calendar-today" size={20} color={colors.icon} />}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Input
                    label="Weight (kg)"
                    value={formData.weight}
                    onChangeText={(t) => setFormData({...formData, weight: t})}
                    placeholder="70"
                    keyboardType="numeric"
                    leftIcon={<MaterialIcons name="monitor-weight" size={20} color={colors.icon} />}
                  />
                </View>
              </View>
            </View>
          ) : (
            <>
              <View style={[styles.dummyInput, { backgroundColor: colors.surface }]}>
                <View>
                  <Typo variant="caption" color={colors.textMuted}>Full Name</Typo>
                  <Typo variant="body" style={{ fontWeight: "500", marginTop: 4 }}>{user?.fullName}</Typo>
                </View>
                <MaterialIcons name="badge" size={20} color={colors.icon} />
              </View>

              <View style={[styles.dummyInput, { backgroundColor: colors.surface }]}>
                <View>
                  <Typo variant="caption" color={colors.textMuted}>Username</Typo>
                  <Typo variant="body" style={{ fontWeight: "500", marginTop: 4 }}>{user?.username}</Typo>
                </View>
                <MaterialIcons name="person" size={20} color={colors.icon} />
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
                  <Typo variant="caption" color={colors.textMuted}>NIC Number</Typo>
                  <Typo variant="body" style={{ fontWeight: "500", marginTop: 4 }}>{user?.nic || "Not set"}</Typo>
                </View>
                <MaterialIcons name="lock" size={20} color={colors.icon} />
              </View>

              <View style={[styles.dummyInput, { backgroundColor: colors.surface }]}>
                <View>
                  <Typo variant="caption" color={colors.textMuted}>Phone Number</Typo>
                  <Typo variant="body" style={{ fontWeight: "500", marginTop: 4 }}>{user?.phone || "Not set"}</Typo>
                </View>
                <MaterialIcons name="call" size={20} color={colors.icon} />
              </View>

              <View style={[styles.dummyInput, { backgroundColor: colors.surface }]}>
                <View>
                  <Typo variant="caption" color={colors.textMuted}>Date of Birth</Typo>
                  <Typo variant="body" style={{ fontWeight: "500", marginTop: 4 }}>{user?.dob ? formatDate(user.dob) : "Not set"}</Typo>
                </View>
                <MaterialIcons name="event" size={20} color={colors.icon} />
              </View>

              <View style={[styles.dummyInput, { backgroundColor: colors.surface }]}>
                <View>
                  <Typo variant="caption" color={colors.textMuted}>Weight</Typo>
                  <Typo variant="body" style={{ fontWeight: "500", marginTop: 4 }}>{user?.weight ? `${user.weight} kg` : "Not set"}</Typo>
                </View>
                <MaterialIcons name="monitor-weight" size={20} color={colors.icon} />
              </View>

              <View style={[styles.dummyInput, { backgroundColor: colors.surface }]}>
                <View>
                  <Typo variant="caption" color={colors.textMuted}>Blood Group</Typo>
                  <Typo variant="body" style={{ fontWeight: "500", marginTop: 4 }}>{user?.bloodGroup || "Not set"}</Typo>
                </View>
                <MaterialIcons name="bloodtype" size={20} color={colors.icon} />
              </View>
            </>
          )}

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

        <View style={styles.detailsSection}>
          <Button
            label="Logout"
            variant="secondary"
            style={{ backgroundColor: `${colors.error}1A`, borderColor: colors.error }}
            onPress={handleLogout}
            icon={<MaterialIcons name="logout" size={20} color={colors.error} />}
          />
        </View>

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
                  await updateProfile(formData);
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
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 60,
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
  bloodTypeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  trophySection: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  trophyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  trophiesScroll: {
    paddingHorizontal: 4,
    gap: 16,
  },
  trophyCard: {
    width: 100,
    alignItems: "center",
    gap: 8,
  },
  trophyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  trophyTitle: {
    fontWeight: "600",
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
