import React, { useState, useRef } from "react";
import { View, StyleSheet, Animated, TouchableOpacity, ScrollView, Modal, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";

import { useThemeColor } from "@/packages/ui/hooks";
import { Typo, Card, Button, Input, AnimatedHeader, Divider, ProgressBar } from "@/packages/ui/components/ui";
import { useScroll } from "@/packages/ui/context/ScrollContext";

interface FundraisingEvent {
  id: string;
  title: string;
  description: string;
  targetLKR: string;
  currentPts: number;
}

export default function FundraisingScreen() {
  const { colors } = useThemeColor();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const { handleScroll } = useScroll();

  const [events, setEvents] = useState<FundraisingEvent[]>([
    { id: "1", title: "Emergency Blood Drive Fuel", description: "Help us transport blood to rural hospitals during the emergency.", targetLKR: "5000", currentPts: 12500 },
    { id: "2", title: "Winter Health Kits", description: "Providing basic medical kits to the homeless this winter.", targetLKR: "10000", currentPts: 45000 },
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [formData, setFormData] = useState<Partial<FundraisingEvent>>({
    title: "",
    description: "",
    targetLKR: "",
  });

  const handleCreate = () => {
    if (!formData.title || !formData.targetLKR) return;
    
    const newEvent: FundraisingEvent = {
      id: Date.now().toString(),
      title: formData.title,
      description: formData.description || "",
      targetLKR: formData.targetLKR,
      currentPts: 0
    };

    setEvents([...events, newEvent]);
    closeModal();
  };

  const closeModal = () => {
    setModalVisible(false);
    setFormData({ title: "", description: "", targetLKR: "" });
  };

  const confirmDelete = (id: string) => {
    Alert.alert("Cancel Event", "Are you sure you want to stop this fundraising campaign?", [
      { text: "No", style: "cancel" },
      { text: "Cancel Event", style: "destructive", onPress: () => setEvents(events.filter(e => e.id !== id)) }
    ]);
  };

  const calculatePointsGoal = (lkr: string) => {
    const val = parseInt(lkr);
    return isNaN(val) ? 0 : val * 10;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AnimatedHeader
        title="Fundraising"
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
          { 
            useNativeDriver: true,
            listener: handleScroll
          }
        )}
        scrollEventThrottle={16}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: 80 + insets.top, paddingBottom: insets.bottom + 100 }
        ]}
      >
        <View style={styles.section}>
          <Typo variant="h2" style={styles.sectionTitle}>Active Campaigns</Typo>
          <Typo variant="caption" color={colors.textMuted} style={{ marginBottom: 20 }}>
            Manage your fundraising events. 1 LKR is raised for every 10 points donated.
          </Typo>

          {events.map((event) => {
            const pointsGoal = calculatePointsGoal(event.targetLKR);
            const progress = pointsGoal > 0 ? event.currentPts / pointsGoal : 0;
            
            return (
              <Card key={event.id} variant="elevated" style={styles.eventCard}>
                <View style={styles.eventHeader}>
                  <View style={{ flex: 1 }}>
                    <Typo variant="h2" style={{ fontSize: 18 }}>{event.title}</Typo>
                    <Typo variant="caption" color={colors.tint} style={{ fontWeight: "bold" }}>
                      Target: LKR {event.targetLKR} ({pointsGoal.toLocaleString()} pts)
                    </Typo>
                  </View>
                  <TouchableOpacity onPress={() => confirmDelete(event.id)}>
                    <MaterialIcons name="more-vert" size={24} color={colors.text} />
                  </TouchableOpacity>
                </View>
                
                <Divider spacing={16} />
                
                <View style={styles.progressSection}>
                  <View style={styles.progressLabels}>
                    <Typo variant="caption" style={{ fontWeight: "bold" }}>
                      {event.currentPts.toLocaleString()} pts raised
                    </Typo>
                    <Typo variant="caption" color={colors.textMuted}>
                      {Math.round(progress * 100)}%
                    </Typo>
                  </View>
                  <ProgressBar progress={progress} color={colors.tint} />
                  <Typo variant="caption" color={colors.textMuted} style={{ marginTop: 8 }}>
                    LKR {(event.currentPts / 10).toLocaleString()} raised of {parseInt(event.targetLKR).toLocaleString()} Goal
                  </Typo>
                </View>

                <Typo variant="body" color={colors.textMuted} style={{ marginTop: 12 }}>
                  {event.description}
                </Typo>
              </Card>
            );
          })}
        </View>

        {events.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialIcons name="campaign" size={48} color={colors.border} />
            <Typo variant="body" color={colors.textMuted}>No active campaigns.</Typo>
          </View>
        )}
      </Animated.ScrollView>

      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: colors.tint }]} 
        onPress={() => setModalVisible(true)}
      >
        <MaterialIcons name="campaign" size={28} color="#FFF" />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Typo variant="h2">New Campaign</Typo>
              <TouchableOpacity onPress={closeModal}>
                <MaterialIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formContent}>
              <View style={{ gap: 16 }}>
                <Input 
                  label="Campaign Title"
                  placeholder="e.g. Urgent Surgery Fund"
                  value={formData.title}
                  onChangeText={(t) => setFormData({ ...formData, title: t })}
                />
                <Input 
                  label="Goal in LKR"
                  placeholder="LKR"
                  keyboardType="numeric"
                  value={formData.targetLKR}
                  onChangeText={(t) => setFormData({ ...formData, targetLKR: t })}
                  helperText={formData.targetLKR ? `Points goal: ${calculatePointsGoal(formData.targetLKR).toLocaleString()} pts` : ""}
                />
                <Input 
                  label="Description"
                  placeholder="Explain the cause and how the points will help..."
                  multiline
                  numberOfLines={4}
                  value={formData.description}
                  onChangeText={(t) => setFormData({ ...formData, description: t })}
                />
              </View>
              
              <Button 
                label="Launch Campaign"
                variant="primary"
                style={{ marginTop: 24, marginBottom: 20 }}
                onPress={handleCreate}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  eventCard: {
    padding: 24,
    marginBottom: 16,
    borderRadius: 24,
  },
  eventHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  progressSection: {
    gap: 8,
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  fab: {
    position: "absolute",
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 24,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  formContent: {
    marginBottom: 40,
  }
});
