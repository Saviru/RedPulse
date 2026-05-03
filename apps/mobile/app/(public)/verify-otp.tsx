import React, { useState, useRef } from "react";
import { View, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Animated } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { useThemeColor } from "@/packages/ui/hooks";
import { Button, Input, Typo, AnimatedHeader } from "@/packages/ui/components/ui";
import { useAuth } from "../../src/context/AuthContext";
import { useToast } from "../../src/context/ToastContext";

export default function VerifyOtpScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams();
  const { theme, colors } = useThemeColor();
  const { verifyRegistration, resendOtp } = useAuth();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  
  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  const handleVerify = async () => {
    if (!otp || otp.length !== 6) {
      showToast("Please enter a valid 6-digit OTP code.", "error");
      return;
    }

    setIsVerifying(true);
    try {
      if (typeof email !== 'string') {
          throw new Error("Email parameter is missing or invalid.");
      }
      await verifyRegistration(email, otp);
      showToast("Email verified successfully!", "success");
      // The router state will automatically refresh based on AuthContext update
      // Auth route change happens in root layout
    } catch (err: any) {
      const apiError = err?.response?.data?.message || err.message || "Verification failed";
      showToast(apiError, "error");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      if (typeof email !== 'string') {
          throw new Error("Email parameter is missing or invalid.");
      }
      await resendOtp(email, "REGISTER");
      showToast("A new OTP has been sent to your email.", "success");
    } catch (err: any) {
      const apiError = err?.response?.data?.message || err.message || "Failed to resend OTP";
      showToast(apiError, "error");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AnimatedHeader
        title="Verify Email"
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
              paddingTop: 80 + insets.top,
              paddingBottom: insets.bottom + 40 
            }
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.titleSection}>
            <MaterialIcons name="mark-email-read" size={64} color={colors.tint} style={{ marginBottom: 16 }} />
            <Typo variant="h1" style={styles.mainTitle}>Enter Verification Code</Typo>
            <Typo variant="body" color={colors.textMuted}>
              We've sent a 6-digit verification code to
            </Typo>
            <Typo variant="body" style={styles.emailText}>
              {email || "your email address"}
            </Typo>
          </View>

          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <Input
                placeholder="------"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
                style={styles.otpInput}
                textAlign="center"
              />
            </View>

            <Button
              label={isVerifying ? "Verifying..." : "Verify Code"}
              onPress={handleVerify}
              disabled={isVerifying || otp.length !== 6}
              style={styles.verifyButton}
            />

            <View style={styles.resendContainer}>
              <Typo variant="caption" color={colors.textMuted}>Didn't receive the code? </Typo>
              <TouchableOpacity onPress={handleResend} disabled={isResending}>
                <Typo variant="caption" color={colors.tint} style={{ fontWeight: "bold" }}>
                  {isResending ? "Sending..." : "Resend"}
                </Typo>
              </TouchableOpacity>
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
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  titleSection: {
    marginBottom: 40,
    alignItems: "center",
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  emailText: {
    fontWeight: "600",
    marginTop: 4,
  },
  formSection: {
    gap: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  otpInput: {
    fontSize: 32,
    letterSpacing: 8,
    height: 70,
    fontWeight: "bold",
  },
  verifyButton: {
    height: 56,
    borderRadius: 16,
  },
  resendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
});
