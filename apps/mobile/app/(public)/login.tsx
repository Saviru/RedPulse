import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";

import { Button, Input, Typo, Card } from "@/packages/ui/components/ui";
import { useThemeColor } from "@/packages/ui/hooks";
import { useAuth } from "../../src/context/AuthContext";
import { useToast } from "../../src/context/ToastContext";

export default function LoginScreen() {
  const router = useRouter();
  const { theme, colors } = useThemeColor();
  const { login } = useAuth();
  const { showToast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email: string) => {
    const re = /\S+@\S+\.\S+/;
    return re.test(email);
  };

  const handleLogin = async () => {
    try {
      if (!identifier || !password) {
        showToast("Please enter email/username and password", "error");
        return;
      }

      setIsLoading(true);
      // We pass the identifier as both email and username, 
      // the backend will find the user by either matching field.
      await login({ 
        email: identifier, 
        username: identifier, 
        password 
      });
      // Redirection is handled by the effect in _layout.tsx
    } catch (err: any) {
      showToast(err?.response?.data?.message || err.message || "Login failed", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} bounces={false} showsVerticalScrollIndicator={false}>

          <View style={styles.heroSection}>
            <LinearGradient
              colors={[colors.tint, `${colors.tint}88`, colors.background]}
              style={styles.heroImage}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
            >
              <SafeAreaView style={styles.heroSafeContent} edges={["top"]}>
                <View style={[styles.iconCircle, { backgroundColor: theme === "dark" ? colors.surface : "#FFFFFF" }]}>
                  <MaterialIcons name="bloodtype" size={48} color={colors.tint} />
                </View>
                <Typo variant="h1" style={styles.heroTitle}>RedPulse</Typo>
                <Typo variant="caption" style={[styles.heroSubtitle, { color: "#FFFFFF" }]}>Life flowing forward</Typo>
              </SafeAreaView>
            </LinearGradient>
          </View>

          <View style={styles.formSection}>
            <Card variant="elevated" style={[styles.formCard, { borderColor: colors.border }]}>
              <Typo variant="h2" style={styles.formHeading}>Welcome Back</Typo>

              <View style={styles.inputGroup}>
                <Typo variant="caption" style={styles.inputLabel}>EMAIL OR USERNAME</Typo>
                <Input
                  placeholder="Enter your email or username"
                  value={identifier}
                  onChangeText={setIdentifier}
                  leftIcon={<MaterialIcons name="person" size={20} color={colors.icon} />}
                  containerStyle={styles.input}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Typo variant="caption" style={styles.inputLabel}>PASSWORD</Typo>
                <Input
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  rightIcon={
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                      <MaterialIcons name={showPassword ? "visibility" : "visibility-off"} size={20} color={colors.icon} />
                    </TouchableOpacity>
                  }
                  containerStyle={styles.input}
                />
              </View>

              <Button
                label={isLoading ? "Logging in..." : "Log In"}
                variant="primary"
                onPress={handleLogin}
                disabled={isLoading}
                style={styles.loginButton}
              />

              <TouchableOpacity style={styles.forgotPasswordContainer}>
                <Typo variant="caption" style={styles.forgotPasswordText}>Forgot Password?</Typo>
              </TouchableOpacity>
            </Card>

            <View style={styles.footer}>
              <Typo variant="body" color={colors.textMuted} style={styles.footerText}>
                Don't have an account?{" "}
              </Typo>
              <TouchableOpacity onPress={() => router.push("/register-type")}>
                <Typo variant="body" color={colors.tint} style={styles.signUpLink}>Sign Up</Typo>
              </TouchableOpacity>
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  heroSection: {
    height: "45%",
    minHeight: 320,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: "hidden",
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
    justifyContent: "flex-end",
  },
  heroSafeContent: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: "-50%" }, { translateY: "-50%" }],
    alignItems: "center",
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: "bold",
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: "500",
  },
  formSection: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 32,
    marginTop: -40,
    zIndex: 10,
  },
  formCard: {
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
  },
  formHeading: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontWeight: "bold",
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    height: 56,
    borderRadius: 16,
  },
  loginButton: {
    height: 56,
    borderRadius: 16,
    marginTop: 8,
    marginBottom: 24,
  },
  forgotPasswordContainer: {
    alignItems: "center",
  },
  forgotPasswordText: {
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: "auto",
    paddingTop: 32,
  },
  footerText: {
    fontSize: 14,
  },
  signUpLink: {
    fontSize: 14,
    fontWeight: "bold",
  },
});
