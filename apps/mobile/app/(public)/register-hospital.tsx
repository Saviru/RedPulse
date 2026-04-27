import React, { useState, useRef } from "react";
import { View, StyleSheet, ScrollView, Animated, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as ImagePicker from 'expo-image-picker';
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { useThemeColor } from "@/packages/ui/hooks";
import { Button, Input, Typo, Avatar, AnimatedHeader } from "@/packages/ui/components/ui";
import { useAuth } from "../../src/context/AuthContext";
import { useToast } from "../../src/context/ToastContext";

export default function HospitalRegistrationScreen() {
  const router = useRouter();
  const { theme, colors } = useThemeColor();
  const { register } = useAuth();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;

  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    hospitalName: "",
    location: "",
    registrationId: "",
    contactNumber: "",
    email: "",
    username: "",
    password: "",
    avatarUrl: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email: string) => {
    const re = /\S+@\S+\.\S+/;
    return re.test(email);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showToast('Sorry, we need camera roll permissions to make this work!', 'error');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setFormData({ ...formData, avatarUrl: result.assets[0].uri });
    }
  };

  const handleRegister = async () => {
    try {
      if (!formData.hospitalName || !formData.email || !formData.username || !formData.password || !formData.registrationId || !formData.contactNumber) {
        showToast("Please fill in all required fields.", "error");
        return;
      }

      if (!validateEmail(formData.email)) {
        showToast("Please enter a valid email address.", "error");
        return;
      }

      if (formData.password.length < 6) {
        showToast("Password must be at least 6 characters long.", "error");
        return;
      }

      setIsLoading(true);

      await register({
        email: formData.email,
        username: formData.username,
        password: formData.password,
        role: "HOSPITAL",
        hospitalName: formData.hospitalName,
        address: formData.location,
        licenseNumber: formData.registrationId,
        phone: formData.contactNumber,
        avatarUrl: formData.avatarUrl,
      });
      setIsLoading(false);
      router.push({ pathname: '/(public)/verify-otp', params: { email: formData.email } } as any);
    } catch (err: any) {
      const apiError = err?.response?.data?.errors?.[0]?.msg ||
        err?.response?.data?.message ||
        err.message ||
        "Registration failed";
      showToast(apiError, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AnimatedHeader
        title="Register Hospital"
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
            <Typo variant="h1" style={styles.mainTitle}>
              Join <Typo variant="h1" color={colors.tint}>RedPulse</Typo>{"\n"}Partner Network
            </Typo>
          </View>

          {/* Logo Selection Section */}
          <View style={styles.avatarPickerSection}>
            <View style={styles.avatarWrapper}>
              <View style={[styles.avatarRing, { borderColor: `${colors.tint}33` }]}>
                <Avatar size={100} source={formData.avatarUrl ? { uri: formData.avatarUrl } : undefined} />
              </View>
              <TouchableOpacity onPress={pickImage} style={[styles.editAvatarBtn, { backgroundColor: colors.tint, borderColor: colors.background }]}>
                <MaterialIcons name="photo-camera" size={14} color={colors.background} />
              </TouchableOpacity>
            </View>
            <Typo variant="caption" color={colors.tint} style={{ marginTop: 8, fontWeight: "600" }}>Upload Hospital Logo</Typo>
          </View>

          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <Typo variant="caption" style={styles.inputLabel}>Hospital Name</Typo>
              <Input
                placeholder="Enter hospital name"
                value={formData.hospitalName}
                onChangeText={(v) => setFormData({ ...formData, hospitalName: v })}
                rightIcon={<MaterialIcons name="local-hospital" size={20} color={colors.icon} />}
              />
            </View>

            <View style={styles.inputGroup}>
              <Typo variant="caption" style={styles.inputLabel}>Location</Typo>
              <Input
                placeholder="City, Address or Coordinates"
                value={formData.location}
                onChangeText={(v) => setFormData({ ...formData, location: v })}
                rightIcon={<MaterialIcons name="location-on" size={20} color={colors.icon} />}
              />
            </View>

            <View style={styles.inputGroup}>
              <Typo variant="caption" style={styles.inputLabel}>Registration ID</Typo>
              <Input
                placeholder="Govt. issued ID"
                value={formData.registrationId}
                onChangeText={(v) => setFormData({ ...formData, registrationId: v })}
                rightIcon={<MaterialIcons name="badge" size={20} color={colors.icon} />}
              />
            </View>

            <View style={styles.inputGroup}>
              <Typo variant="caption" style={styles.inputLabel}>Contact Number</Typo>
              <Input
                placeholder="+1 (555) 000-0000"
                keyboardType="phone-pad"
                value={formData.contactNumber}
                onChangeText={(v) => setFormData({ ...formData, contactNumber: v })}
                rightIcon={<MaterialIcons name="call" size={20} color={colors.icon} />}
              />
            </View>

            <View style={styles.inputGroup}>
              <Typo variant="caption" style={styles.inputLabel}>Official Email</Typo>
              <Input
                placeholder="hospital@example.com"
                value={formData.email}
                onChangeText={(v) => setFormData({ ...formData, email: v })}
                rightIcon={<MaterialIcons name="email" size={20} color={colors.icon} />}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Typo variant="caption" style={styles.inputLabel}>Admin Username</Typo>
              <Input
                placeholder="Create a username"
                value={formData.username}
                onChangeText={(v) => setFormData({ ...formData, username: v })}
                rightIcon={<MaterialIcons name="person" size={20} color={colors.icon} />}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Typo variant="caption" style={styles.inputLabel}>Password</Typo>
              <Input
                placeholder="Min. 8 characters"
                secureTextEntry={!showPassword}
                value={formData.password}
                onChangeText={(v) => setFormData({ ...formData, password: v })}
                rightIcon={
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <MaterialIcons name={showPassword ? "visibility" : "visibility-off"} size={20} color={colors.icon} />
                  </TouchableOpacity>
                }
              />
            </View>

            <Typo variant="caption" color={colors.textMuted} style={styles.termsTextInner}>
              By registering, you agree to our Terms of Service & Privacy Policy.
            </Typo>

            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20), borderTopColor: colors.border }]}>
              <Button
                label={isLoading ? "Registering..." : "Register Hospital"}
                onPress={handleRegister}
                icon={<MaterialIcons name="arrow-forward" size={20} />}
                iconPosition="right"
                disabled={isLoading}
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
    paddingTop: 16,
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
  termsTextInner: {
    textAlign: "center",
    marginTop: 16,
    marginBottom: 16,
  },
  footer: {
    paddingTop: 32,
    marginTop: 16,
    borderTopWidth: 1,
  },
  submitButton: {
    height: 56,
    borderRadius: 28, // Using full pill shape based on HTML
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
