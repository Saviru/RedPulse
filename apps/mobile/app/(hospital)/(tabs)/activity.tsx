import React, { useRef, useState, useEffect } from "react";
import { View, StyleSheet, Animated, TouchableOpacity, FlatList, Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";

import { useThemeColor } from "@/packages/ui/hooks";
import { Typo, Card, AnimatedHeader, Badge, Button, Input } from "@/packages/ui/components/ui";
import { useScroll } from "@/packages/ui/context/ScrollContext";
import { pointsService as points } from "@/apps/mobile/src/services/pointsService";

export default function HospitalActivityScreen() {
  const { colors, theme } = useThemeColor();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const { handleScroll } = useScroll();

  const [redemptions, setRedemptions] = useState<any[]>([]);
  const [filteredRedemptions, setFilteredRedemptions] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const fetchActivity = async () => {
    try {
      const data = await points.getHospitalRedemptions();
      setRedemptions(data);
      setFilteredRedemptions(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivity();
  }, []);

  useEffect(() => {
    const filtered = redemptions.filter(r => {
      const user = r.userId;
      return (
        user?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        user?.bloodGroup?.toLowerCase().includes(search.toLowerCase()) ||
        user?.location?.toLowerCase().includes(search.toLowerCase())
      );
    });
    setFilteredRedemptions(filtered);
  }, [search, redemptions]);

  const handleVerify = (user: any) => {
    setSelectedUser(user);
    setIsModalVisible(true);
  };

  const renderActivityCard = ({ item: redemption }: { item: any }) => {
    const user = redemption.userId;
    if (!user) return null;

    return (
      <Card variant="elevated" style={styles.activityCard}>
        <View style={styles.cardHeader}>
          <View style={[styles.avatarPlaceholder, { backgroundColor: `${colors.tint}1A` }]}>
            <MaterialIcons name="person" size={24} color={colors.tint} />
          </View>
          <View style={styles.mainInfo}>
            <Typo variant="body" style={{ fontWeight: "bold" }}>{user.fullName || user.username}</Typo>
            <Typo variant="caption" color={colors.textMuted}>{user.location || "No location set"}</Typo>
          </View>
          <Badge 
            label={user.bloodGroup || "N/A"} 
            variant="info" 
          />
        </View>

        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <MaterialIcons name="event" size={16} color={colors.textMuted} />
            <Typo variant="caption" style={{ marginLeft: 4 }}>
              Redeemed on {new Date(redemption.timestamp).toLocaleDateString()}
            </Typo>
          </View>
          <View style={[styles.detailItem, { marginLeft: 16 }]}>
            <MaterialIcons name="confirmation-number" size={16} color={colors.tint} />
            <Typo variant="caption" style={{ marginLeft: 4 }}>
              {redemption.amount} pts
            </Typo>
          </View>
        </View>

        <View style={styles.actionRow}>
          <Button 
            label="Verify Information" 
            variant="primary" 
            style={{ flex: 1 }}
            onPress={() => handleVerify(user)}
          />
        </View>
      </Card>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AnimatedHeader
        title="Redemptions"
        scrollY={scrollY}
      />

      <Animated.View style={[
        styles.searchContainer, 
        { 
          paddingTop: 80 + insets.top,
          backgroundColor: colors.background,
          transform: [{ translateY: scrollY.interpolate({
            inputRange: [0, 50],
            outputRange: [0, -20],
            extrapolate: 'clamp'
          }) }]
        }
      ]}>
        <Input 
          placeholder="Search for users..." 
          value={search}
          onChangeText={setSearch}
          leftIcon={<MaterialIcons name="search" size={20} color={colors.textMuted} />}
        />
      </Animated.View>

      <FlatList
        data={filteredRedemptions}
        renderItem={renderActivityCard}
        keyExtractor={item => item._id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 100 }
        ]}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { 
            useNativeDriver: false,
            listener: handleScroll 
          }
        )}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="history" size={64} color={colors.border} />
              <Typo variant="body" color={colors.textMuted} style={{ marginTop: 16 }}>
                No redemptions tracked yet.
              </Typo>
            </View>
          ) : null
        }
      />
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Typo variant="h2">Verify User</Typo>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.infoRow}>
                <Typo variant="caption" color={colors.textMuted}>FULL NAME</Typo>
                <Typo variant="body" style={styles.infoValue}>{selectedUser?.fullName}</Typo>
              </View>
              
              <View style={styles.infoRow}>
                <Typo variant="caption" color={colors.textMuted}>NIC / ID NUMBER</Typo>
                <Typo variant="body" style={styles.infoValue}>{selectedUser?.nic || "Not Provided"}</Typo>
              </View>

              <View style={styles.infoGrid}>
                <View style={styles.infoGridItem}>
                  <Typo variant="caption" color={colors.textMuted}>DATE OF BIRTH</Typo>
                  <Typo variant="body" style={styles.infoValue}>{selectedUser?.dob || "N/A"}</Typo>
                </View>
                <View style={styles.infoGridItem}>
                  <Typo variant="caption" color={colors.textMuted}>BLOOD TYPE</Typo>
                  <Typo variant="body" style={[styles.infoValue, { color: colors.tint, fontWeight: 'bold' }]}>{selectedUser?.bloodGroup}</Typo>
                </View>
              </View>

              <View style={styles.infoGrid}>
                <View style={styles.infoGridItem}>
                  <Typo variant="caption" color={colors.textMuted}>WEIGHT</Typo>
                  <Typo variant="body" style={styles.infoValue}>{selectedUser?.weight ? `${selectedUser.weight} kg` : "N/A"}</Typo>
                </View>
                <View style={styles.infoGridItem}>
                  <Typo variant="caption" color={colors.textMuted}>LOCATION</Typo>
                  <Typo variant="body" style={styles.infoValue}>{selectedUser?.location}</Typo>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Typo variant="caption" color={colors.textMuted}>PHONE NUMBER</Typo>
                <Typo variant="body" style={styles.infoValue}>{selectedUser?.phone || "N/A"}</Typo>
              </View>

              <Button 
                label="Close" 
                variant="secondary" 
                onPress={() => setIsModalVisible(false)}
                style={{ marginTop: 24 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    zIndex: 10,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  activityCard: {
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  mainInfo: {
    flex: 1,
    marginLeft: 12,
  },
  detailsRow: {
    flexDirection: "row",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionRow: {
    flexDirection: "row",
    marginTop: 16,
    gap: 8,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    minHeight: "60%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalBody: {
    gap: 16,
  },
  infoRow: {
    marginBottom: 12,
  },
  infoValue: {
    fontSize: 16,
    marginTop: 4,
  },
  infoGrid: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 12,
  },
  infoGridItem: {
    flex: 1,
  },
});
