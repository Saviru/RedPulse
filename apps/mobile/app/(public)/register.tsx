import React, { useState, useRef } from "react";
import { View, StyleSheet, Animated, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as ImagePicker from 'expo-image-picker';
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { useThemeColor } from "@/packages/ui/hooks";
import { Button, Input, Typo, Divider, Avatar, AnimatedHeader, DatePicker, Select } from "@/packages/ui/components/ui";
import { useAuth } from "../../src/context/AuthContext";
import { useToast } from "../../src/context/ToastContext";

export default function DonorRegistrationScreen() {
  const router = useRouter();
  const { theme, colors } = useThemeColor();
  const { register } = useAuth();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    nic: "",
    dob: "",
    location: "",
    email: "",
    username: "",
    password: "",
    bloodGroup: "",
    weight: "",
    phone: "",
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
      if (!formData.fullName || !formData.email || !formData.username || !formData.password || !formData.nic || !formData.phone) {
        showToast("Please fill in all required fields.", "error");
        return;
      }

      if (!validateEmail(formData.email)) {
        showToast("Please enter a valid email address.", "error");
        return;
      }

      // Age validation (18+)
      if (formData.dob) {
        const birthDate = new Date(formData.dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        
        if (age < 18) {
          showToast("You must be at least 18 years old to register as a donor.", "error");
          return;
        }
      } else {
        showToast("Date of birth is required.", "error");
        return;
      }

      setIsLoading(true);
      
      await register({
        email: formData.email,
        username: formData.username,
        password: formData.password,
        role: "USER",
        fullName: formData.fullName,
        nic: formData.nic,
        location: formData.location,
        dob: formData.dob,
        bloodGroup: formData.bloodGroup,
        weight: formData.weight,
        phone: formData.phone,
        avatarUrl: formData.avatarUrl,
      });
      setIsLoading(false);
      router.push({ pathname: '/(public)/verify-otp', params: { email: formData.email } } as any);
    } catch (err: any) {
      // Extract specific validation error messages if available
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
                <Avatar size={100} source={formData.avatarUrl ? { uri: formData.avatarUrl } : undefined} />
              </View>
              <TouchableOpacity onPress={pickImage} style={[styles.editAvatarBtn, { backgroundColor: colors.tint, borderColor: colors.background }]}>
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
              <Typo variant="caption" style={styles.inputLabel}>Phone Number</Typo>
              <Input
                placeholder="e.g. +94 77 123 4567"
                value={formData.phone}
                onChangeText={(v) => setFormData({...formData, phone: v})}
                keyboardType="phone-pad"
                leftIcon={<MaterialIcons name="call" size={20} color={colors.icon} />}
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
              <DatePicker
                placeholder="Select your birthday"
                value={formData.dob ? new Date(formData.dob) : undefined}
                onChange={(date) => setFormData({...formData, dob: date.toISOString().split('T')[0]})}
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
              <Typo variant="caption" style={styles.inputLabel}>Email Address</Typo>
              <Input
                placeholder="yourname@gmail.com"
                value={formData.email}
                onChangeText={(v) => setFormData({...formData, email: v})}
                leftIcon={<MaterialIcons name="email" size={20} color={colors.icon} />}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Typo variant="caption" style={styles.inputLabel}>Username</Typo>
              <Input
                placeholder="Create a username"
                value={formData.username}
                onChangeText={(v) => setFormData({...formData, username: v})}
                leftIcon={<MaterialIcons name="alternate-email" size={20} color={colors.icon} />}
                autoCapitalize="none"
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
                <Select
                  placeholder="Select"
                  value={formData.bloodGroup}
                  options={["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]}
                  onSelect={(v) => setFormData({...formData, bloodGroup: v})}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                <Typo variant="caption" style={styles.inputLabel}>Weight (kg)</Typo>
                <Input 
                  placeholder="e.g. 70" 
                  value={formData.weight}
                  onChangeText={(v) => setFormData({...formData, weight: v})}
                  keyboardType="numeric"
                />
              </View>
            </View>

          </View>
              <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20), borderTopColor: colors.border }]}>
                <Button
                  label={isLoading ? "Registering..." : "Complete Registration"}
                  onPress={handleRegister}
                  icon={<MaterialIcons name="arrow-forward" size={20} />}
                  iconPosition="right"
                  disabled={isLoading}
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
