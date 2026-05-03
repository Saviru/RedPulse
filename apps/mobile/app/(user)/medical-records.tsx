import React, { useState, useEffect } from "react";
import { View, ScrollView, StyleSheet, TouchableOpacity, TextInput, Modal, Alert, ActivityIndicator, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialIcons, Feather } from "@expo/vector-icons";
import * as DocumentPicker from 'expo-document-picker';
import { useThemeColor } from "@/packages/ui/hooks";
import { Typo, Button } from "@/packages/ui/components/ui";
import api from "@/apps/mobile/src/services/api";

const API_BASE_URL = "/medical";

export default function MedicalRecordsScreen() {
  const router = useRouter();
  const { colors } = useThemeColor();

  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // States for Category Modal
  const [catModalVisible, setCatModalVisible] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catNameInput, setCatNameInput] = useState("");

  // States for File Modal
  const [fileModalVisible, setFileModalVisible] = useState(false);
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [fileNameInput, setFileNameInput] = useState("");

  // Expanded Categories to show files
  const [expandedCatId, setExpandedCatId] = useState<string | null>(null);
  const [catRecords, setCatRecords] = useState<Record<string, any[]>>({});
  const [loadingRecords, setLoadingRecords] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get(`${API_BASE_URL}/categories`);
      const json = res.data;
      console.log('DEBUG Frontend: API Response:', json);
      console.log('DEBUG Frontend: Is array?', Array.isArray(json));
      console.log('DEBUG Frontend: Response type:', typeof json);
      
      // API interceptor unwraps {success: true, data: []} to just the data
      if (Array.isArray(json)) {
        setCategories(json);
      } else {
        console.log('DEBUG Frontend: Unexpected response format');
      }
    } catch (err) {
      console.log('DEBUG Frontend: Error fetching categories:', err);
      Alert.alert("Error", "Failed to fetch categories.");
    } finally {
      setLoading(false);
    }
  };

  const fetchRecords = async (categoryId: string) => {
    setLoadingRecords(true);
    try {
      console.log('DEBUG Frontend: Fetching records for category:', categoryId);
      const res = await api.get(`${API_BASE_URL}/categories/${categoryId}/records`);
      const json = res.data;
      console.log('DEBUG Frontend: Records response:', json);
      console.log('DEBUG Frontend: Is array?', Array.isArray(json));
      
      // API interceptor unwraps the response
      if (Array.isArray(json)) {
        setCatRecords((prev) => ({ ...prev, [categoryId]: json }));
      } else {
        console.log('DEBUG Frontend: Unexpected records response format');
      }
    } catch (err) {
      console.log('DEBUG Frontend: Error fetching records:', err);
    } finally {
      setLoadingRecords(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    if (expandedCatId === categoryId) {
      setExpandedCatId(null);
    } else {
      setExpandedCatId(categoryId);
      fetchRecords(categoryId);
    }
  };

  // --- Category Actions ---
  const saveCategory = async () => {
    if (!catNameInput.trim()) return;
    try {
      console.log('DEBUG Frontend: Saving category:', catNameInput);
      if (editingCatId) {
        const res = await api.put(`${API_BASE_URL}/categories/${editingCatId}`, { name: catNameInput });
        console.log('DEBUG Frontend: Update response:', res.data);
      } else {
        const res = await api.post(`${API_BASE_URL}/categories`, { name: catNameInput });
        console.log('DEBUG Frontend: Create response:', res.data);
      }
      setCatModalVisible(false);
      setCatNameInput("");
      setEditingCatId(null);
      fetchCategories();
    } catch (err) {
      console.log('DEBUG Frontend: Error saving category:', err);
      Alert.alert("Error", "Failed to save category.");
    }
  };

  const deleteCategory = async (id: string, name: string) => {
    Alert.alert("Delete Category", `Are you sure you want to delete '${name}' and all its files?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive", onPress: async () => {
          try {
            await api.delete(`${API_BASE_URL}/categories/${id}`);
            fetchCategories();
          } catch (err) {
            Alert.alert("Error", "Failed to delete.");
          }
        }
      }
    ]);
  };

  const openCatModal = (cat?: any) => {
    if (cat) {
      setEditingCatId(cat._id);
      setCatNameInput(cat.name);
    } else {
      setEditingCatId(null);
      setCatNameInput("");
    }
    setCatModalVisible(true);
  };

  // --- File Actions ---
  const saveFileRename = async () => {
    if (!fileNameInput.trim() || !editingFileId) return;
    try {
      await api.put(`${API_BASE_URL}/records/${editingFileId}`, { fileName: fileNameInput });
      setFileModalVisible(false);
      setFileNameInput("");
      setEditingFileId(null);
      if (expandedCatId) fetchRecords(expandedCatId);
    } catch (err) {
      Alert.alert("Error", "Failed to rename file.");
    }
  };

  const deleteRecord = async (id: string, fileName: string) => {
    Alert.alert("Delete File", `Are you sure you want to delete '${fileName}'?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive", onPress: async () => {
          try {
            await api.delete(`${API_BASE_URL}/records/${id}`);
            if (expandedCatId) fetchRecords(expandedCatId);
          } catch (err) {
            Alert.alert("Error", "Failed to delete.");
          }
        }
      }
    ]);
  };

  const uploadFile = async (categoryId: string) => {
    try {
      console.log('DEBUG Frontend: Starting file upload for category:', categoryId);
      const result = await DocumentPicker.getDocumentAsync({});
      if (result.canceled || !result.assets || result.assets.length === 0) return;

      const file = result.assets[0];
      console.log('DEBUG Frontend: Selected file:', file.name);
      const formData = new FormData();
      formData.append("categoryId", categoryId);

      const fileExt = file.name.split('.').pop();
      formData.append("document", {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || `application/${fileExt}`,
      } as any);

      setLoadingRecords(true);
      const res = await api.post(`${API_BASE_URL}/records`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        }
      });

      const response = res.data;
      console.log('DEBUG Frontend: Upload response:', response);
      
      // API interceptor unwraps the response, so we don't check response.success
      // If we get here without an error, the upload was successful
      
      if (expandedCatId === categoryId) {
        fetchRecords(categoryId);
      } else {
        setLoadingRecords(false);
      }
      Alert.alert("Success", "File uploaded successfully!");
    } catch (err: any) {
      console.log('DEBUG Frontend: Upload error:', err);
      setLoadingRecords(false);
      Alert.alert("Upload Error", err.message || "Failed to upload file.");
    }
  };

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Typo variant="h2" style={styles.headerTitle}>My Medical Records</Typo>
      </View>

      <View style={styles.content}>
        <View style={styles.searchRow}>
          <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Feather name="search" size={20} color={colors.text} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search categories..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.tint }]}
            onPress={() => openCatModal()}
          >
            <MaterialIcons name="add" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.tint} style={{ marginTop: 40 }} />
        ) : (
          <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
            {filteredCategories.length === 0 && (
              <View style={{ alignItems: 'center', marginTop: 40 }}>
                <Typo variant="body" style={{ color: "#9CA3AF" }}>No categories found.</Typo>
              </View>
            )}

            {filteredCategories.map((cat) => (
              <View key={cat._id} style={[styles.card, { backgroundColor: colors.surface }]}>
                <View style={styles.catHeader}>
                  <TouchableOpacity style={styles.catTitleArea} onPress={() => toggleCategory(cat._id)}>
                    <Typo variant="body" style={{ fontWeight: 'bold' }}>{cat.name}</Typo>
                    <MaterialIcons
                      name={expandedCatId === cat._id ? "keyboard-arrow-up" : "keyboard-arrow-down"}
                      size={24}
                      color={colors.text}
                      style={{ marginLeft: 8 }}
                    />
                  </TouchableOpacity>
                  <View style={styles.actions}>
                    <TouchableOpacity onPress={() => openCatModal(cat)} style={{ marginRight: 16 }}>
                      <Feather name="edit-2" size={18} color="#3B82F6" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteCategory(cat._id, cat.name)}>
                      <Feather name="trash-2" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>

                {expandedCatId === cat._id && (
                  <View style={styles.expandedContent}>
                    <View style={styles.divider} />

                    {loadingRecords ? (
                      <ActivityIndicator size="small" color={colors.tint} style={{ marginVertical: 12 }} />
                    ) : (
                      <View>
                        {(catRecords[cat._id] || []).length === 0 ? (
                          <Typo variant="caption" style={{ color: "#9CA3AF", marginVertical: 8 }}>
                            No files uploaded.
                          </Typo>
                        ) : (
                          (catRecords[cat._id] || []).map((file) => (
                            <View key={file._id} style={styles.fileRow}>
                              <Feather name="file-text" size={18} color={colors.tint} />
                              <TouchableOpacity
                                style={styles.fileName}
                                onPress={() => Linking.openURL(`${api.defaults.baseURL}${file.fileUrl}`)} //use phone's default viewer
                              >
                                <Typo variant="body" style={{ color: '#3B82F6', textDecorationLine: 'underline' }}>
                                  {file.fileName}
                                </Typo>
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={() => { setEditingFileId(file._id); setFileNameInput(file.fileName); setFileModalVisible(true); }}
                                style={{ marginRight: 12 }}
                              >
                                <Feather name="edit-2" size={16} color="#3B82F6" />
                              </TouchableOpacity>
                              <TouchableOpacity onPress={() => deleteRecord(file._id, file.fileName)}>
                                <Feather name="trash-2" size={16} color="#EF4444" />
                              </TouchableOpacity>
                            </View>
                          ))
                        )}
                        <Button
                          label="Upload File"
                          variant="secondary"
                          onPress={() => uploadFile(cat._id)}
                          style={{ marginTop: 12 }}
                        />
                      </View>
                    )}
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Category Modal */}
      <Modal visible={catModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Typo variant="body" style={{ marginBottom: 16 }}>
              {editingCatId ? "Edit Category" : "Add Category"}
            </Typo>
            <TextInput
              style={[styles.modalInput, { borderColor: colors.tint, color: colors.text }]}
              placeholder="Category Name"
              placeholderTextColor="#9CA3AF"
              value={catNameInput}
              onChangeText={setCatNameInput}
            />
            <View style={styles.modalActions}>
              <Button label="Cancel" variant="secondary" onPress={() => setCatModalVisible(false)} style={{ flex: 1, marginRight: 8 }} />
              <Button label="Save" variant="primary" onPress={saveCategory} style={{ flex: 1, marginLeft: 8 }} />
            </View>
          </View>
        </View>
      </Modal>

      {/* File Name Modal */}
      <Modal visible={fileModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Typo variant="body" style={{ marginBottom: 16 }}>Rename File</Typo>
            <TextInput
              style={[styles.modalInput, { borderColor: colors.tint, color: colors.text }]}
              placeholder="File Name"
              placeholderTextColor="#9CA3AF"
              value={fileNameInput}
              onChangeText={setFileNameInput}
            />
            <View style={styles.modalActions}>
              <Button label="Cancel" variant="secondary" onPress={() => setFileModalVisible(false)} style={{ flex: 1, marginRight: 8 }} />
              <Button label="Save" variant="primary" onPress={saveFileRename} style={{ flex: 1, marginLeft: 8 }} />
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  headerTitle: { marginBottom: 0, paddingLeft: 16 },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  searchRow: {
    flexDirection: 'row',
    marginBottom: 24,
    alignItems: 'center',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    marginRight: 12,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 16 },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  catHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catTitleArea: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expandedContent: {
    marginTop: 12,
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginBottom: 12,
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  fileName: {
    flex: 1,
    marginLeft: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    padding: 24,
    borderRadius: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
  }
});
