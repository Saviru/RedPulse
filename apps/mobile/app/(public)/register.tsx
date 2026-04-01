import React, { useState, useRef } from "react";
import { View, StyleSheet, Animated, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { useThemeColor } from "@/packages/ui/hooks";
import { Button, Input, Typo, Divider, Avatar, AnimatedHeader } from "@/packages/ui/components/ui";

export default function DonorRegistrationScreen() {
  const router = useRouter();
  const { theme, colors } = useThemeColor();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    nic: "",
    dob: "",
    location: "",
    username: "",
    password: "",
  });

  const handleRegister = () => {
    router.replace("/(user)/(tabs)/profile" as any);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AnimatedHeader
        title="Register as Donor"
        scrollY={scrollY}
        leftElement={
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        }
      />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
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
              paddingBottom: insets.bottom + 100 
            }
          ]}
          showsVerticalScrollIndicator={false}
        >
          
          <View style={styles.titleSection}>
            <Typo variant="h1" style={styles.mainTitle}>Create your account</Typo>
            <Typo variant="body" color={colors.textMuted}>Join the RedPulse community to save lives.</Typo>
          </View>

          {/* Avatar Selection Section */}
          <View style={styles.avatarPickerSection}>
            <View style={styles.avatarWrapper}>
              <View style={[styles.avatarRing, { borderColor: `${colors.tint}33` }]}>
                <Avatar size={100} />
              </View>
              <TouchableOpacity style={[styles.editAvatarBtn, { backgroundColor: colors.tint, borderColor: colors.background }]}>
                <MaterialIcons name="photo-camera" size={14} color={colors.background} />
              </TouchableOpacity>
            </View>
            <Typo variant="caption" color={colors.tint} style={{ marginTop: 8, fontWeight: "600" }}>Upload Photo</Typo>
          </View>

          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <Typo variant="caption" style={styles.inputLabel}>Full Name</Typo>
              <Input
                placeholder="e.g. John Doe"
                value={formData.fullName}
                onChangeText={(v) => setFormData({...formData, fullName: v})}
                leftIcon={<MaterialIcons name="person" size={20} color={colors.icon} />}
              />
            </View>

            <View style={styles.inputGroup}>
              <Typo variant="caption" style={styles.inputLabel}>National ID (NIC)</Typo>
              <Input
                placeholder="e.g. 199012345678"
                value={formData.nic}
                onChangeText={(v) => setFormData({...formData, nic: v})}
                leftIcon={<MaterialIcons name="badge" size={20} color={colors.icon} />}
              />
            </View>

            <View style={styles.inputGroup}>
              <Typo variant="caption" style={styles.inputLabel}>Date of Birth</Typo>
              <Input
                placeholder="YYYY-MM-DD"
                value={formData.dob}
                onChangeText={(v) => setFormData({...formData, dob: v})}
                leftIcon={<MaterialIcons name="calendar-today" size={20} color={colors.icon} />}
              />
            </View>

            <View style={styles.inputGroup}>
              <Typo variant="caption" style={styles.inputLabel}>Location</Typo>
              <Input
                placeholder="City, District"
                value={formData.location}
                onChangeText={(v) => setFormData({...formData, location: v})}
                leftIcon={<MaterialIcons name="location-on" size={20} color={colors.icon} />}
              />
            </View>

            <Divider spacing={20} />
            <Typo variant="caption" color={colors.textMuted} style={styles.sectionHeading}>Account Security</Typo>

            <View style={styles.inputGroup}>
              <Typo variant="caption" style={styles.inputLabel}>Username</Typo>
              <Input
                placeholder="Create a username"
                value={formData.username}
                onChangeText={(v) => setFormData({...formData, username: v})}
                leftIcon={<MaterialIcons name="alternate-email" size={20} color={colors.icon} />}
              />
            </View>

            <View style={styles.inputGroup}>
              <Typo variant="caption" style={styles.inputLabel}>Password</Typo>
              <Input
                placeholder="••••••••"
                secureTextEntry={!showPassword}
                value={formData.password}
                onChangeText={(v) => setFormData({...formData, password: v})}
                leftIcon={<MaterialIcons name="lock" size={20} color={colors.icon} />}
                rightIcon={
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <MaterialIcons name={showPassword ? "visibility" : "visibility-off"} size={20} color={colors.icon} />
                  </TouchableOpacity>
                }
              />
            </View>

            <Divider spacing={20} />
            <Typo variant="caption" color={colors.textMuted} style={styles.sectionHeading}>Medical Assessment</Typo>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Typo variant="caption" style={styles.inputLabel}>Blood Type</Typo>
                <Input placeholder="Assigned later" disabled={true} />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Typo variant="caption" style={styles.inputLabel}>Weight</Typo>
                <Input placeholder="Assigned later" disabled={true} />
              </View>
            </View>

          </View>
              <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20), borderTopColor: colors.border }]}>
                <Button
                  label="Complete Registration"
                  onPress={handleRegister}
                  icon={<MaterialIcons name="arrow-forward" size={20} />}
                  iconPosition="right"
                  style={styles.submitButton}
                />
                <Typo variant="caption" color={colors.textMuted} style={styles.termsText}>
                  By registering, you agree to our Terms & Privacy Policy
                </Typo>
              </View>
        </Animated.ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  titleSection: {
    marginBottom: 24,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  formSection: {
    gap: 4,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontWeight: "600",
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionHeading: {
    textTransform: "uppercase",
    fontWeight: "bold",
    letterSpacing: 1,
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    gap: 16,
  },
  footer: {
    paddingTop: 32,
    marginTop: 16,
    borderTopWidth: 1,
  },
  submitButton: {
    height: 56,
    borderRadius: 16,
  },
  termsText: {
    textAlign: "center",
    marginTop: 12,
    fontWeight: "500",
  },
  avatarPickerSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  avatarWrapper: {
    position: "relative",
  },
  avatarRing: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  editAvatarBtn: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
  },
});
