import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { StyleSheet, View, ScrollView, TouchableOpacity, ActivityIndicator, Modal, Image, Alert } from "react-native";
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, Feather } from "@expo/vector-icons";

import { Button, Divider, Typo, Card } from "@/packages/ui/components/ui";
import { useThemeColor } from "@/packages/ui/hooks";
import { getMyCampaignRegistrations, MyCampaignRegistrationRow, submitTaskWork } from "@/apps/mobile/src/lib/campaignService";
import { useUserStore } from "@/apps/mobile/src/store/UserContext";

export default function CampaignTasksScreen() {
  const router = useRouter();
  const { colors } = useThemeColor();
  const { user, refreshUser } = useUserStore();
  
  const [registrations, setRegistrations] = useState<MyCampaignRegistrationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingWork, setSubmittingWork] = useState(false);
  const [showWorkModal, setShowWorkModal] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [workImages, setWorkImages] = useState<string[]>([]);

  const pickWorkImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      const uris = result.assets.map(a => a.uri);
      setWorkImages(prev => [...prev, ...uris].slice(0, 3));
    }
  };

  const handleSubmitWork = async () => {
    if (!selectedCampaignId || workImages.length === 0) {
      Alert.alert("Error", "Please select at least one image.");
      return;
    }
    
    setSubmittingWork(true);
    try {
      await submitTaskWork(selectedCampaignId, workImages);
      Alert.alert("Success", "Work submitted successfully!");
      setShowWorkModal(false);
      setWorkImages([]);
      loadData();
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to submit work");
    } finally {
      setSubmittingWork(false);
    }
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getMyCampaignRegistrations();
      setRegistrations(data);
      await refreshUser(); // Refresh user points
    } catch (error) {
      console.error("Failed to load tasks:", error);
    } finally {
      setLoading(false);
    }
  }, [refreshUser]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  // Filter registrations to get those with assigned tasks
  const assignedTasks = registrations
    .filter(r => r.volunteer && r.volunteer.assignedTask)
    .map(r => ({
      id: r.campaignId,
      title: r.volunteer!.assignedTask!.title,
      description: r.volunteer!.assignedTask!.description,
      campaignTitle: r.campaignName,
      status: r.volunteer!.status === "REGISTERED" ? "In Progress" : "Completed",
      points: r.volunteer!.assignedTask!.points,
    }));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Typo variant="h2">My Campaign Tasks</Typo>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.pointsOverview}>
          <Typo variant="h2">Points Overview</Typo>
          <View style={styles.pointsRow}>
            <Typo variant="h1" style={{ color: colors.tint }}>{(user as any)?.points ?? 0}</Typo>
            <Typo variant="body" style={{ color: colors.textMuted, marginLeft: 10 }}>Total Points Earned</Typo>
          </View>
        </Card>

        <Divider spacing={24} />

        <Typo variant="h2" style={{ marginBottom: 15 }}>Assigned Tasks</Typo>

        {loading ? (
          <ActivityIndicator color={colors.tint} style={{ marginTop: 20 }} />
        ) : assignedTasks.length === 0 ? (
          <View style={{ alignItems: "center", marginTop: 40 }}>
            <Ionicons name="clipboard-outline" size={48} color={colors.border} />
            <Typo variant="body" style={{ color: colors.textMuted, marginTop: 12 }}>
              No tasks assigned yet.
            </Typo>
          </View>
        ) : (
          assignedTasks.map((task) => (
            <Card key={task.id} style={styles.taskCard}>
              <View style={styles.taskHeader}>
                <View style={{ flex: 1 }}>
                  <Typo variant="body" style={{ fontWeight: "700" }}>{task.title}</Typo>
                  <Typo variant="caption" style={{ color: colors.textMuted }}>{task.campaignTitle}</Typo>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: task.status === "In Progress" ? colors.tint + "15" : colors.success + "15" }]}>
                  <Typo variant="caption" style={{ fontWeight: "700", color: task.status === "In Progress" ? colors.tint : colors.success }}>{task.status}</Typo>
                </View>
              </View>
              
              {task.description ? (
                <Typo variant="caption" style={{ color: colors.textMuted, marginTop: 10 }}>
                  {task.description}
                </Typo>
              ) : null}

              <View style={styles.taskFooter}>
                <Typo variant="caption" style={{ color: colors.textMuted }}>Task reward: {task.points} pts</Typo>
                 {task.status === "In Progress" && (
                   <View style={{ flex: 1, marginLeft: 15 }}>
                    <Button 
                      label="Submit Work" 
                      onPress={() => {
                        setSelectedCampaignId(task.id);
                        setShowWorkModal(true);
                      }}
                      size="sm"
                      variant="primary"
                    />
                   </View>
                 )}
               </View>
             </Card>
           ))
         )}
       </ScrollView>

       <Modal visible={showWorkModal} transparent animationType="slide">
         <View style={styles.modalBackdrop}>
           <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
             <Typo variant="h2" style={{ marginBottom: 15 }}>Submit Task Work</Typo>
             <Typo variant="caption" style={{ color: colors.textMuted, marginBottom: 20 }}>
               Upload photos showing your completed work for this task.
             </Typo>

             <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
               {workImages.map((uri, idx) => (
                 <View key={idx} style={styles.imagePreview}>
                   <Image source={{ uri }} style={styles.thumb} />
                   <TouchableOpacity 
                     style={styles.removeBtn} 
                     onPress={() => setWorkImages(prev => prev.filter((_, i) => i !== idx))}
                   >
                     <Feather name="x" size={14} color="#FFF" />
                   </TouchableOpacity>
                 </View>
               ))}
               {workImages.length < 3 && (
                 <TouchableOpacity onPress={pickWorkImages} style={styles.addBtn}>
                   <Feather name="plus" size={24} color={colors.textMuted} />
                 </TouchableOpacity>
               )}
             </View>

             <View style={{ flexDirection: "row", gap: 10 }}>
               <Button 
                label="Cancel" 
                variant="secondary" 
                onPress={() => setShowWorkModal(false)} 
                style={{ flex: 1 }}
               />
               <Button 
                label={submittingWork ? "Submitting..." : "Submit"} 
                variant="primary" 
                onPress={handleSubmitWork} 
                style={{ flex: 1 }}
                disabled={submittingWork || workImages.length === 0}
               />
             </View>
           </View>
         </View>
       </Modal>
     </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: { marginRight: 15 },
  content: { padding: 20 },
  pointsOverview: { padding: 20, alignItems: "center" },
  pointsRow: { flexDirection: "row", alignItems: "baseline", marginTop: 10 },
  taskCard: { padding: 15, marginBottom: 12 },
  taskHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  taskFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 16 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    padding: 24,
    borderRadius: 20,
    elevation: 5,
  },
  imagePreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
  },
  thumb: {
    width: "100%",
    height: "100%",
  },
  removeBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.5)",
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtn: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
  },
});
