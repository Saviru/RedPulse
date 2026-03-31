import React, { useState, useRef } from "react";
import { View, StyleSheet, ScrollView, Animated, TouchableOpacity } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";

import { useThemeColor } from "@/packages/ui/hooks";
import { Typo, Input, Button, Avatar, Toggle, AnimatedHeader } from "@/packages/ui/components/ui";


export default function HospitalEditProfileScreen() {
  const { theme, colors } = useThemeColor();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;

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
        title="Edit Hospital Profile"
        scrollY={scrollY}
        leftElement={
          <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
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
            <TouchableOpacity style={[styles.editAvatarBtn, { backgroundColor: colors.tint, borderColor: colors.background }]}>
              <MaterialIcons name="photo-camera" size={16} color={colors.background} />
            </TouchableOpacity>
          </View>
          <Typo variant="caption" color={colors.tint} style={{ marginTop: 12, fontWeight: "500" }}>Tap to change logo</Typo>
        </View>

        {/* Form Fields */}
        <View style={styles.detailsSection}>
          <Typo variant="h2" style={styles.sectionTitle}>General Information</Typo>
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
        </View>

        <View style={styles.detailsSection}>
          <Typo variant="h2" style={styles.sectionTitle}>Contact Details</Typo>
          <View style={{ gap: 16 }}>
            <Input
              value={formData.phone}
              onChangeText={(t) => setFormData({...formData, phone: t})}
              placeholder="Phone Number"
              keyboardType="phone-pad"
              leftIcon={<MaterialIcons name="call" size={20} color={colors.icon} />}
            />
            <Input
              value={formData.email}
              onChangeText={(t) => setFormData({...formData, email: t})}
              placeholder="Email Address"
              keyboardType="email-address"
              leftIcon={<MaterialIcons name="alternate-email" size={20} color={colors.icon} />}
            />
          </View>
        </View>

        <View style={styles.detailsSection}>
          <Typo variant="h2" style={styles.sectionTitle}>Operations</Typo>
          <View style={[styles.toggleRow, { backgroundColor: colors.surface }]}>
            <View style={{ flex: 1 }}>
              <Typo variant="body" style={{ fontWeight: "500" }}>Accepting Urgent Requests</Typo>
              <Typo variant="caption" color={colors.textMuted} style={{ marginTop: 2 }}>Allow emergency blood requests</Typo>
            </View>
            <Toggle
              value={formData.urgentRequests}
              onToggle={(val) => setFormData({...formData, urgentRequests: val})}
            />
          </View>
        </View>

        <View style={styles.actionSection}>
          <Button
            label="Save Changes"
            icon={<MaterialIcons name="save" size={20} />}
            iconPosition="left"
            variant="primary"
            style={styles.saveBtn}
            onPress={() => router.back()}
          />
        </View>

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
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 16,
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
