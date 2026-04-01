import React, { useState, useRef } from "react";
import { View, StyleSheet, Animated, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { useThemeColor } from "@/packages/ui/hooks";
import { Button, Input, Typo, Divider, Avatar, AnimatedHeader } from "@/packages/ui/components/ui";

export default function OrganizationRegistrationScreen() {
  const router = useRouter();
  const { theme, colors } = useThemeColor();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    orgName: "",
    location: "",
    licenseId: "",
    contactNumber: "",
    username: "",
    password: "",
  });

  const handleRegister = () => {
    router.replace("/(organization)/(tabs)/profile" as any);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AnimatedHeader
        title="Register Organization"
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
            <Typo variant="h1" style={styles.mainTitle}>New Organization</Typo>
            <Typo variant="body" color={colors.textMuted}>Join RedPulse to manage blood donation drives effectively.</Typo>
          </View>

          {/* Logo Selection Section */}
          <View style={styles.avatarPickerSection}>
            <View style={styles.avatarWrapper}>
              <View style={[styles.avatarRing, { borderColor: `${colors.tint}33` }]}>
                <Avatar size={100} />
              </View>
              <TouchableOpacity style={[styles.editAvatarBtn, { backgroundColor: colors.tint, borderColor: colors.background }]}>
                <MaterialIcons name="photo-camera" size={14} color={colors.background} />
              </TouchableOpacity>
            </View>
            <Typo variant="caption" color={colors.tint} style={{ marginTop: 8, fontWeight: "600" }}>Upload Logo</Typo>
          </View>

          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <Typo variant="caption" style={styles.inputLabel}>Organization Name</Typo>
              <Input
                placeholder="Red Cross Chapter 42"
                value={formData.orgName}
                onChangeText={(v) => setFormData({...formData, orgName: v})}
                leftIcon={<MaterialIcons name="corporate-fare" size={20} color={colors.icon} />}
              />
            </View>

            <View style={styles.inputGroup}>
              <Typo variant="caption" style={styles.inputLabel}>Location / Address</Typo>
              <Input
                placeholder="123 Health Ave, New York"
                value={formData.location}
                onChangeText={(v) => setFormData({...formData, location: v})}
                leftIcon={<MaterialIcons name="location-on" size={20} color={colors.icon} />}
              />
            </View>

            <View style={styles.inputGroup}>
              <Typo variant="caption" style={styles.inputLabel}>License ID</Typo>
              <Input
                placeholder="LIC-12345678"
                value={formData.licenseId}
                onChangeText={(v) => setFormData({...formData, licenseId: v})}
                leftIcon={<MaterialIcons name="badge" size={20} color={colors.icon} />}
              />
            </View>

            <View style={styles.inputGroup}>
              <Typo variant="caption" style={styles.inputLabel}>Contact Number</Typo>
              <Input
                placeholder="+1 (555) 000-0000"
                keyboardType="phone-pad"
                value={formData.contactNumber}
                onChangeText={(v) => setFormData({...formData, contactNumber: v})}
                leftIcon={<MaterialIcons name="call" size={20} color={colors.icon} />}
              />
            </View>

            <Divider spacing={20} />
            <Typo variant="body" style={styles.sectionHeading}>Account Details</Typo>

            <View style={styles.inputGroup}>
              <Typo variant="caption" style={styles.inputLabel}>Username</Typo>
              <Input
                placeholder="organization_admin"
                value={formData.username}
                onChangeText={(v) => setFormData({...formData, username: v})}
                leftIcon={<MaterialIcons name="person" size={20} color={colors.icon} />}
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

            <Typo variant="caption" color={colors.textMuted} style={styles.termsTextInner}>
              By registering, you agree to our Terms of Service and Privacy Policy.
            </Typo>

              <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20), borderTopColor: colors.border }]}>
                <Button
                  label="Register Organization"
                  onPress={handleRegister}
                  icon={<MaterialIcons name="arrow-forward" size={20} />}
                  iconPosition="right"
                  style={styles.submitButton}
                />
              </View>
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
    fontSize: 32,
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
    fontWeight: "bold",
    marginBottom: 16,
    marginLeft: 4,
  },
  termsTextInner: {
    textAlign: "center",
    marginTop: 8,
    marginBottom: 16,
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
