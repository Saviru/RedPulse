import React, { useState, useRef } from "react";
import { View, StyleSheet, Animated, TouchableOpacity, ScrollView, Modal, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";

import { useThemeColor } from "@/packages/ui/hooks";
import { Typo, Card, Button, Input, Select, AnimatedHeader, Divider } from "@/packages/ui/components/ui";
import { useScroll } from "@/packages/ui/context/ScrollContext";

interface Offer {
  id: string;
  title: string;
  points: string;
  description: string;
  type: string;
}

export default function ManageShopScreen() {
  const { colors } = useThemeColor();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const { handleScroll } = useScroll();

  const [offers, setOffers] = useState<Offer[]>([
    { id: "1", title: "Free CBC Checkup", points: "500", description: "Complete Blood Count for primary health monitoring.", type: "Checkup" },
    { id: "2", title: "20% Lab Discount", points: "1000", description: "Valid for all pathology tests at our main branch.", type: "Discount" },
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [formData, setFormData] = useState<Partial<Offer>>({
    title: "",
    points: "",
    description: "",
    type: "Checkup"
  });

  const handleAddEdit = () => {
    if (!formData.title || !formData.points) return;

    if (editingOffer) {
      setOffers(offers.map(o => o.id === editingOffer.id ? { ...o, ...formData } as Offer : o));
    } else {
      setOffers([...offers, { id: Date.now().toString(), ...formData } as Offer]);
    }
    closeModal();
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingOffer(null);
    setFormData({ title: "", points: "", description: "", type: "Checkup" });
  };

  const openEdit = (offer: Offer) => {
    setEditingOffer(offer);
    setFormData(offer);
    setModalVisible(true);
  };

  const confirmDelete = (id: string) => {
    Alert.alert("Delete Offer", "Are you sure you want to remove this reward?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => setOffers(offers.filter(o => o.id !== id)) }
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AnimatedHeader
        title="Manage Shop"
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
          <Typo variant="h2" style={styles.sectionTitle}>Current Offers</Typo>
          <Typo variant="caption" color={colors.textMuted} style={{ marginBottom: 20 }}>
            List of rewards available for users to redeem using their points.
          </Typo>

          {offers.map((offer) => (
            <Card key={offer.id} variant="elevated" style={styles.offerCard}>
              <View style={styles.offerHeader}>
                <View style={styles.offerInfo}>
                  <Typo variant="h2" style={{ fontSize: 18 }}>{offer.title}</Typo>
                  <Typo variant="caption" color={colors.tint} style={{ fontWeight: "bold" }}>
                    {offer.points} Points • {offer.type}
                  </Typo>
                </View>
                <View style={styles.offerActions}>
                  <TouchableOpacity onPress={() => openEdit(offer)} style={styles.actionBtn}>
                    <MaterialIcons name="edit" size={20} color={colors.text} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => confirmDelete(offer.id)} style={styles.actionBtn}>
                    <MaterialIcons name="delete-outline" size={20} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
              <Divider spacing={12} />
              <Typo variant="body" color={colors.textMuted}>{offer.description}</Typo>
            </Card>
          ))}
        </View>

        {offers.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialIcons name="inventory-2" size={48} color={colors.border} />
            <Typo variant="body" color={colors.textMuted}>No offers created yet.</Typo>
          </View>
        )}
      </Animated.ScrollView>

      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: colors.tint }]} 
        onPress={() => setModalVisible(true)}
      >
        <MaterialIcons name="add" size={28} color="#FFF" />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Typo variant="h2">{editingOffer ? "Edit Offer" : "New Offer"}</Typo>
              <TouchableOpacity onPress={closeModal}>
                <MaterialIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formContent}>
              <View style={{ gap: 16 }}>
                <Input 
                  label="Offer Title"
                  placeholder="e.g. Free Blood Test"
                  value={formData.title}
                  onChangeText={(t) => setFormData({ ...formData, title: t })}
                />
                <Input 
                  label="Points Cost"
                  placeholder="pts"
                  keyboardType="numeric"
                  value={formData.points}
                  onChangeText={(t) => setFormData({ ...formData, points: t })}
                />
                <Select 
                  label="Offer Type"
                  options={["Checkup", "Discount", "Gift", "Other"]}
                  value={formData.type || "Checkup"}
                  onSelect={(s) => setFormData({ ...formData, type: s })}
                />
                <Input 
                  label="Description"
                  placeholder="Details about the offer..."
                  multiline
                  numberOfLines={3}
                  value={formData.description}
                  onChangeText={(t) => setFormData({ ...formData, description: t })}
                />
              </View>
              
              <Button 
                label={editingOffer ? "Update Offer" : "Create Offer"}
                variant="primary"
                style={{ marginTop: 24, marginBottom: 20 }}
                onPress={handleAddEdit}
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
  offerCard: {
    padding: 20,
    marginBottom: 16,
    borderRadius: 16,
  },
  offerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  offerInfo: {
    flex: 1,
    gap: 4,
  },
  offerActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    padding: 8,
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
