import React, { useState, useRef } from "react";
import { View, StyleSheet, ScrollView, Animated, TouchableOpacity } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";

import { useThemeColor } from "@/packages/ui/hooks";
import { Typo, Input, Button, Avatar, Badge, AnimatedHeader } from "@/packages/ui/components/ui";


export default function DonorProfileScreen() {
  const { theme, colors } = useThemeColor();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scrollY = useRef(new Animated.Value(0)).current;

  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    username: "alex_donor_99",
    location: "San Francisco, CA",
  });

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
          <Typo variant="h2" style={styles.userName}>Alex Donor</Typo>
          <View style={styles.userBadges}>
            <Badge label="O+ Positive" variant="info" />
            <Typo variant="caption" color={colors.textMuted}>•</Typo>
            <Typo variant="caption" color={colors.textMuted} style={{ fontWeight: "500" }}>12 Donations</Typo>
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
                value={formData.username}
                onChangeText={(t) => setFormData({...formData, username: t})}
                placeholder="Username"
                leftIcon={<MaterialIcons name="person" size={20} color={colors.icon} />}
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
                  <Typo variant="caption" color={colors.textMuted}>Username</Typo>
                  <Typo variant="body" style={{ fontWeight: "500", marginTop: 4 }}>{formData.username}</Typo>
                </View>
                <MaterialIcons name="person" size={20} color={colors.icon} />
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

        <View style={styles.detailsSection}>
          <View style={[styles.dummyInput, { backgroundColor: colors.surface, opacity: 0.7 }]}>
            <View>
              <Typo variant="caption" color={colors.textMuted}>National ID (NIC)</Typo>
              <Typo variant="body" color={colors.textMuted} style={{ fontWeight: "500", marginTop: 4 }}>952401832V</Typo>
            </View>
            <MaterialIcons name="lock" size={20} color={colors.icon} />
          </View>

          <View style={styles.rowInputs}>
             <View style={[styles.dummyInput, { flex: 1, backgroundColor: colors.surface, opacity: 0.7 }]}>
               <View>
                 <Typo variant="caption" color={colors.textMuted}>Date of Birth</Typo>
                 <Typo variant="body" color={colors.textMuted} style={{ fontWeight: "500", marginTop: 4 }}>12/04/1995</Typo>
               </View>
               <MaterialIcons name="lock" size={16} color={colors.icon} />
             </View>
             <View style={[styles.dummyInput, { width: 100, backgroundColor: colors.surface, opacity: 0.7 }]}>
               <View>
                 <Typo variant="caption" color={colors.textMuted}>Blood</Typo>
                 <Typo variant="body" color={colors.textMuted} style={{ fontWeight: "bold", marginTop: 4 }}>O+</Typo>
               </View>
             </View>
          </View>
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
});
