// src/screens/main/activity/ActivitySelectionScreen.js - Backend Integration Update
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  TouchableWithoutFeedback,
  Keyboard,
  Modal,
  Image,
  ActivityIndicator
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";
import { useActivity } from "../../../context/ActivityContext";
import sampleActivities from "../../../data/sampleActivities";
import ScreenHeader from "../../../components/ScreenHeader";
import OfflineBanner from "../../../components/OfflineBanner";
import { COLORS } from "../../../theme";

const ActivitySelectionScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();

  // Context'ten tüm gerekli state ve fonksiyonları al
  const {
    addActivity,
    favoriteActivities,
    recentActivities,
    personalActivities,
    addToRecentActivity,
    isLoading,
    error,
    clearError,
    refreshData,
  } = useActivity();

  const [searchQuery, setSearchQuery] = useState("");
  const [localActiveTab, setLocalActiveTab] = useState(
    route.params?.activeTab || "Recent"
  );
  const [isSearching, setIsSearching] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [duration, setDuration] = useState("30");

  // Quick Log state variables
  const [showQuickLogModal, setShowQuickLogModal] = useState(false);
  const [quickLogName, setQuickLogName] = useState("");
  const [quickLogCalories, setQuickLogCalories] = useState("");
  const [quickLogDuration, setQuickLogDuration] = useState("30");

  // Sample activity items
  const [activityItems] = useState(sampleActivities);

  // Loading state for operations
  const [operationLoading, setOperationLoading] = useState(false);

  // Close keyboard when tapping outside
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      Keyboard.dismiss();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, []);

  // Reset selections when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      setLocalActiveTab(route.params?.activeTab || "Recent");
      setSearchQuery("");
      setIsSearching(false);

      // Veriyi yenile
      if (route.params?.refresh) {
        refreshData();
      }

      return () => {};
    }, [route.params?.activeTab, route.params?.refresh])
  );

  // Error handling
  useEffect(() => {
    if (error) {
      // Error'u belirli bir süre sonra temizle
      const timeout = setTimeout(() => {
        clearError();
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [error]);

  // Handle Quick Log button press
  const handleQuickLogPress = () => {
    setShowQuickLogModal(true);
  };

  // Handle Quick Log submission
  const handleQuickLogSubmit = async () => {
    // Validate inputs
    if (
      !quickLogName.trim() ||
      !quickLogCalories.trim() ||
      !quickLogDuration.trim()
    ) {
      return;
    }

    // Parse calories and duration
    const calories = parseInt(quickLogCalories, 10);
    const duration = parseInt(quickLogDuration, 10);
    if (isNaN(calories) || calories <= 0 || isNaN(duration) || duration <= 0) {
      return;
    }

    try {
      setOperationLoading(true);

      // Create new activity object
      const newActivity = {
        id: `quick_${Date.now()}`,
        name: quickLogName.trim(),
        calories: calories,
        duration: duration,
        mins: duration,
        type: "Quick Log",
        intensity: "Moderate",
      };

      // Add activity using context function
      await addActivity(newActivity);

      // Reset form and close modal
      setQuickLogName("");
      setQuickLogCalories("");
      setQuickLogDuration("30");
      setShowQuickLogModal(false);

      // Navigate back to home
      navigation.navigate("MainTabs", { screen: "Home" });
    } catch (error) {
      console.error("Quick log error:", error);
      // Error handling - context zaten error state'i set etti
    } finally {
      setOperationLoading(false);
    }
  };

  // Create Activity button handler
  const handleCreateActivityPress = () => {
    navigation.navigate("CreateActivity");
  };

  // Arama yapıldığında durumu güncelle
  const handleSearch = (text) => {
    setSearchQuery(text);
    setIsSearching(text.length > 0);
  };

  // Görüntülenecek aktiviteleri belirle (sekmeye ve arama durumuna göre)
  const getDisplayedActivityItems = () => {
    // Arama yapılıyorsa tüm aktiviteleri filtrele
    if (isSearching && searchQuery.length > 0) {
      // Tüm aktivite kaynaklarını birleştir ve filtreleme yap
      const allActivities = [
        ...activityItems,
        ...(recentActivities || []),
        ...(favoriteActivities || []),
        ...(personalActivities || []),
      ];

      // Tekrarlayan aktiviteleri önlemek için unique ID'lere göre filtrele
      const uniqueActivities = Array.from(
        new Map(allActivities.map((item) => [item.id, item])).values()
      );

      return uniqueActivities.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Arama yapılmadığında seçilen sekmeye göre göster
    switch (localActiveTab) {
      case "Recent":
        return recentActivities?.length > 0 ? recentActivities : [];
      case "Favorites":
        return favoriteActivities?.length > 0 ? favoriteActivities : [];
      case "Personal":
        return personalActivities?.length > 0 ? personalActivities : [];
      default:
        return [];
    }
  };

  // Görüntülenecek aktiviteleri hesapla
  const filteredActivityItems = getDisplayedActivityItems();

  // Select activity and set duration
  const selectActivity = (activity) => {
    setSelectedActivity(activity);

    // Aktiviteyi son görüntülenenlere ekle
    if (addToRecentActivity) {
      addToRecentActivity(activity);
    }
  };

  // Handle add button press
  const handleAddButtonPress = async () => {
    if (!selectedActivity) return;

    try {
      setOperationLoading(true);

      // Aktivitenin süresini kullanarak yakılan kaloriyi hesapla
      const durationMins = parseInt(duration, 10) || 30;
      const caloriesPerMinute =
        selectedActivity.calories / (selectedActivity.mins || 30);
      const totalCalories = Math.round(caloriesPerMinute * durationMins);

      // Context üzerinden aktivite ekle
      await addActivity({
        ...selectedActivity,
        calories: totalCalories,
        duration: durationMins,
        mins: durationMins,
      });

      // Ana ekrana dön
      navigation.navigate("MainTabs", { screen: "Home" });
    } catch (error) {
      console.error("Add activity error:", error);
      // Error handling - context zaten error state'i set etti
    } finally {
      setOperationLoading(false);
    }
  };

  const renderActivityItem = ({ item }) => {
    const isSelected = selectedActivity && selectedActivity.id === item.id;

    // İkon veya resim renderlama
    const renderActivityIcon = () => {
      if (item.icon) {
        return <Image source={item.icon} style={styles.activityIcon} />;
      } else {
        return (
          <View style={styles.activityIconPlaceholder}>
            <Text style={styles.activityIconText}>
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        );
      }
    };

    return (
      <TouchableOpacity
        style={[styles.activityItem, isSelected && styles.selectedActivityItem]}
        onPress={() => selectActivity(item)}
        disabled={operationLoading}
      >
        <View style={styles.activityItemLeft}>
          {renderActivityIcon()}
          <View style={styles.activityItemInfo}>
            <Text style={styles.activityItemName}>{item.name}</Text>
            <Text style={styles.activityItemDetails}>
              {item.calories} kcal / {item.mins || item.duration || 30} mins
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.detailsButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          onPress={() => {
            navigation.navigate("ActivityDetails", {
              activity: item,
            });
          }}
          disabled={operationLoading}
        >
          <Ionicons name="chevron-forward" size={20} color={COLORS.textTertiary} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  // Boş liste komponenti
  const EmptyListComponent = () => (
    <View style={styles.emptyListContainer}>
      {isLoading ? (
        <ActivityIndicator size="large" color={COLORS.warning} />
      ) : isSearching ? (
        <Text style={styles.emptyListText}>
          No results found for "{searchQuery}"
        </Text>
      ) : (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyListText}>
            {localActiveTab === "Recent"
              ? "Your recent activities will appear here."
              : localActiveTab === "Favorites"
              ? "Your favorite activities will appear here. Add some by tapping the heart icon on activities."
              : "Your custom activities will appear here. Tap 'Create Activity' to add a new activity."}
          </Text>

          {localActiveTab === "Personal" && (
            <TouchableOpacity
              style={styles.emptyActionButton}
              onPress={handleCreateActivityPress}
            >
              <Text style={styles.emptyActionButtonText}>Create Activity</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );

  // Çevrimdışı / sunucu hatası şeridi (tekrar dene ile). Veri yerel örneklerden
  // gelmeye devam ettiği için içeriği gizlemez.
  const ErrorComponent = () =>
    error ? <OfflineBanner onRetry={refreshData} /> : null;

  return (
    <View style={styles.safeArea}>
      <ScreenHeader
        title="Add Activity"
        onBack={() => navigation.goBack()}
        rightIcon="refresh"
        onRightPress={refreshData}
      />
      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
        <View style={styles.container}>
          {/* Error Display */}
          <ErrorComponent />

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons
              name="search"
              size={20}
              color={COLORS.textTertiary}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search activities..."
              value={searchQuery}
              onChangeText={handleSearch}
              editable={!operationLoading}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery("");
                  setIsSearching(false);
                }}
                style={styles.searchClearButton}
              >
                <Ionicons name="close-circle" size={20} color={COLORS.textTertiary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Quick Log and Create Activity Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[
                styles.quickLogButton,
                operationLoading && styles.disabledButton,
              ]}
              onPress={handleQuickLogPress}
              disabled={operationLoading}
            >
              <Ionicons name="flash" size={18} color={COLORS.textPrimary} />
              <Text style={styles.quickLogText}>Quick Log</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.createActivityButton,
                operationLoading && styles.disabledButton,
              ]}
              onPress={handleCreateActivityPress}
              disabled={operationLoading}
            >
              <Ionicons name="add-circle-outline" size={18} color={COLORS.textPrimary} />
              <Text style={styles.createActivityText}>Create Activity</Text>
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[
                styles.tab,
                localActiveTab === "Recent" && styles.activeTab,
              ]}
              onPress={() => setLocalActiveTab("Recent")}
              disabled={operationLoading}
            >
              <Text
                style={[
                  styles.tabText,
                  localActiveTab === "Recent" && styles.activeTabText,
                ]}
              >
                Recent
              </Text>
              {recentActivities?.length > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>
                    {recentActivities.length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tab,
                localActiveTab === "Favorites" && styles.activeTab,
              ]}
              onPress={() => setLocalActiveTab("Favorites")}
              disabled={operationLoading}
            >
              <Text
                style={[
                  styles.tabText,
                  localActiveTab === "Favorites" && styles.activeTabText,
                ]}
              >
                Favorites
              </Text>
              {favoriteActivities?.length > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>
                    {favoriteActivities.length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tab,
                localActiveTab === "Personal" && styles.activeTab,
              ]}
              onPress={() => setLocalActiveTab("Personal")}
              disabled={operationLoading}
            >
              <Text
                style={[
                  styles.tabText,
                  localActiveTab === "Personal" && styles.activeTabText,
                ]}
              >
                Personal
              </Text>
              {personalActivities?.length > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>
                    {personalActivities.length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Activity List */}
          <FlatList
            style={styles.activityList}
            data={filteredActivityItems}
            renderItem={renderActivityItem}
            keyExtractor={(item) =>
              item.id?.toString() || Math.random().toString()
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.activityListContent,
              filteredActivityItems.length === 0 &&
                styles.emptyListContentContainer,
            ]}
            ListEmptyComponent={EmptyListComponent}
            extraData={selectedActivity}
            refreshing={isLoading}
            onRefresh={refreshData}
          />

          {/* Selected Activity Summary & Add Button - Only shows if activity is selected */}
          {selectedActivity && (
            <View
              style={[
                styles.selectedActivitySummary,
                { paddingBottom: Math.max(insets.bottom, 16) },
              ]}
            >
              <View style={styles.durationInputContainer}>
                <Text style={styles.durationLabel}>Duration (mins):</Text>
                <TextInput
                  style={styles.durationInput}
                  keyboardType="numeric"
                  value={duration}
                  onChangeText={setDuration}
                  maxLength={3}
                  editable={!operationLoading}
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.addSelectedButton,
                  operationLoading && styles.disabledButton,
                ]}
                onPress={handleAddButtonPress}
                disabled={operationLoading}
              >
                {operationLoading ? (
                  <ActivityIndicator size="small" color={COLORS.surface} />
                ) : (
                  <Text style={styles.addSelectedButtonText}>Add</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Quick Log Modal */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={showQuickLogModal}
            onRequestClose={() => setShowQuickLogModal(false)}
          >
            <TouchableWithoutFeedback
              onPress={() => setShowQuickLogModal(false)}
            >
              <View style={styles.modalOverlay}>
                <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                  <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Quick Log Activity</Text>

                    {/* Activity Name Input */}
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Activity Name"
                      value={quickLogName}
                      onChangeText={setQuickLogName}
                      editable={!operationLoading}
                    />

                    {/* Calories Input */}
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Calories Burned"
                      keyboardType="numeric"
                      value={quickLogCalories}
                      onChangeText={setQuickLogCalories}
                      editable={!operationLoading}
                    />

                    {/* Duration Input */}
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Duration (mins)"
                      keyboardType="numeric"
                      value={quickLogDuration}
                      onChangeText={setQuickLogDuration}
                      editable={!operationLoading}
                    />

                    {/* Buttons */}
                    <View style={styles.modalButtons}>
                      <TouchableOpacity
                        style={[
                          styles.cancelButton,
                          operationLoading && styles.disabledButton,
                        ]}
                        onPress={() => setShowQuickLogModal(false)}
                        disabled={operationLoading}
                      >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.saveButton,
                          operationLoading && styles.disabledButton,
                        ]}
                        onPress={handleQuickLogSubmit}
                        disabled={operationLoading}
                      >
                        {operationLoading ? (
                          <ActivityIndicator size="small" color={COLORS.surface} />
                        ) : (
                          <Text style={styles.saveButtonText}>Save</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
    paddingTop: 8,
  },
  errorContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.danger,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 8,
  },
  errorText: {
    color: COLORS.surface,
    fontSize: 14,
    flex: 1,
  },
  errorCloseButton: {
    padding: 4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: COLORS.surface,
    marginTop: 20,
  },
  backButton: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  refreshButton: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderRadius: 10,
    marginHorizontal: 20,
    marginTop: 10,
    paddingHorizontal: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  searchClearButton: {
    padding: 4,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 20,
    marginTop: 16,
  },
  quickLogButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    width: "48%",
  },
  quickLogText: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
  },
  createActivityButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    width: "48%",
  },
  createActivityText: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  tabs: {
    flexDirection: "row",
    marginTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  activeTab: {
    backgroundColor: COLORS.warning,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  tabText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  activeTabText: {
    color: COLORS.surface,
    fontWeight: "500",
  },
  tabBadge: {
    backgroundColor: COLORS.danger,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 4,
  },
  tabBadgeText: {
    color: COLORS.surface,
    fontSize: 12,
    fontWeight: "500",
  },
  activityList: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  activityListContent: {
    padding: 16,
    paddingBottom: 90,
  },
  activityItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedActivityItem: {
    borderWidth: 2,
    borderColor: COLORS.warning,
  },
  activityItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  activityIconPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.warning,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  activityIconText: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.surface,
  },
  activityItemInfo: {
    flex: 1,
  },
  activityItemName: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  activityItemDetails: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  detailsButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedActivitySummary: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 5,
  },
  durationInputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  durationLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginRight: 10,
  },
  durationInput: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderStrong,
    width: 50,
    fontSize: 18,
    textAlign: "center",
  },
  addSelectedButton: {
    backgroundColor: COLORS.warning,
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 100,
  },
  addSelectedButtonText: {
    color: COLORS.surface,
    fontWeight: "600",
    fontSize: 16,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    minHeight: 200,
  },
  emptyStateContainer: {
    alignItems: "center",
  },
  emptyListText: {
    fontSize: 16,
    color: COLORS.textTertiary,
    textAlign: "center",
    marginBottom: 16,
  },
  emptyActionButton: {
    backgroundColor: COLORS.warning,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  emptyActionButtonText: {
    color: COLORS.surface,
    fontWeight: "500",
  },
  emptyListContentContainer: {
    flexGrow: 1,
    justifyContent: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
    color: COLORS.textPrimary,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  cancelButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: COLORS.border,
    width: "48%",
    alignItems: "center",
  },
  cancelButtonText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: "500",
  },
  saveButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: COLORS.warning,
    width: "48%",
    alignItems: "center",
  },
  saveButtonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: "500",
  },
});

export default ActivitySelectionScreen;
