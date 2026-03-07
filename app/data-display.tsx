import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Divider } from "@/components/ui/Divider";
import { ListItem } from "@/components/ui/ListItem";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatCard } from "@/components/ui/StatCard";
import { Typo } from "@/components/ui/Typo";

export default function DataDisplayScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Button
            label="Back"
            variant="secondary"
            icon={<Ionicons name="arrow-back" size={20} color="#1C1C1E" />}
            onPress={() => router.back()}
            style={{ width: 100, marginBottom: 16 }}
          />
          <Typo variant="h1">Data Display</Typo>
        </View>

        <View style={styles.showcase}>
          <View style={styles.section}>
            <Typo variant="h2">StatCard</Typo>
            <Typo variant="caption" color="#FF3B30">
              With accent colors
            </Typo>
            <View style={styles.row}>
              <StatCard label="Donations" value={42} accentColor="#FF3B30" />
              <StatCard label="Requests" value={18} accentColor="#007AFF" />
            </View>
            <View style={styles.row}>
              <StatCard label="Points" value="1,250" accentColor="#FF9500" />
              <StatCard label="Drives" value={8} accentColor="#34C759" />
            </View>
          </View>

          <View style={styles.section}>
            <Typo variant="h2">ProgressBar</Typo>
            <Typo variant="caption" color="#FF3B30">
              Various states
            </Typo>
            <ProgressBar progress={0.85} label="A+ Stock" color="#34C759" />
            <ProgressBar progress={0.45} label="B- Stock" color="#FF9500" />
            <ProgressBar progress={0.12} label="AB- Stock" color="#FF3B30" />
            <ProgressBar progress={1} label="O+ Stock" color="#007AFF" />
          </View>

          <View style={styles.section}>
            <Typo variant="h2">Divider</Typo>
            <Typo variant="caption" color="#FF3B30">
              Default & custom
            </Typo>
            <Typo variant="body">Content above</Typo>
            <Divider />
            <Typo variant="body">Content between</Typo>
            <Divider spacing={8} color="#FF3B30" />
            <Typo variant="body">Content below (red, tight spacing)</Typo>
          </View>

          <View style={styles.section}>
            <Typo variant="h2">ListItem</Typo>
            <Typo variant="caption" color="#FF3B30">
              With icons and actions
            </Typo>
            <Card variant="filled" padding={0}>
              <ListItem
                title="Phone"
                subtitle="+94 77 123 4567"
                leftIcon="call-outline"
              />
              <Divider spacing={0} />
              <ListItem
                title="Email"
                subtitle="donor@email.com"
                leftIcon="mail-outline"
              />
              <Divider spacing={0} />
              <ListItem
                title="Location"
                subtitle="Colombo, Sri Lanka"
                leftIcon="location-outline"
              />
            </Card>
          </View>

          <View style={styles.section}>
            <Typo variant="caption" color="#FF3B30">
              Pressable items
            </Typo>
            <Card variant="filled" padding={0}>
              <ListItem
                title="Notifications"
                subtitle="Manage alerts"
                leftIcon="notifications-outline"
                onPress={() => {}}
              />
              <Divider spacing={0} />
              <ListItem
                title="Privacy"
                subtitle="Data & permissions"
                leftIcon="shield-outline"
                onPress={() => {}}
              />
              <Divider spacing={0} />
              <ListItem
                title="Help"
                subtitle="FAQ & contact"
                leftIcon="help-circle-outline"
                leftIconColor="#007AFF"
                onPress={() => {}}
              />
            </Card>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F8F8" },
  content: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 },
  header: { marginBottom: 32 },
  showcase: { gap: 28 },
  section: { gap: 8 },
  row: { flexDirection: "row", gap: 12 },
});
