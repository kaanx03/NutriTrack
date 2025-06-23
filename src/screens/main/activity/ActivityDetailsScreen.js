// src/screens/main/activity/ActivityDetailsScreen.js - Backend Integration Update
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useActivity } from "../../../context/ActivityContext";

const ActivityDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { activity } = route.params;
  const isEditing = route.params?.isEditing || false;

  // Context'ten fonksiyonları ve state'i al
  const {
    toggleFavoriteActivity,
    addActivity,
    updateActivity,
    favoriteActivities,
    addToRecentActivity,
    isLoading,
    error,
    clearError,
  } = useActivity();

  // State'ler
  const [duration, setDuration] = useState(
    (activity.mins || activity.duration || 30).toString()
  );
  const [operationLoading, setOperationLoading] = useState(false);

  // Aktivite görüntülendiğinde son görüntülenenlere ekle
  useEffect(() => {
    if (addToRecentActivity && !isEditing) {
      addToRecentActivity(activity);
    }
  }, []);

  // Error handling
  useEffect(() => {
    if (error) {
      Alert.alert("Error", error, [
        { text: "OK", onPress: () => clearError() },
      ]);
    }
  }, [error]);

  // Aktivitenin favori olup olmadığını kontrol et
  const isFavorite = favoriteActivities?.some(
    (item) => item.id === activity.id
  );

  // Kalori hesaplama
  const calculateCalories = () => {
    const durationMins = parseInt(duration, 10) || 30;
    const originalDuration = activity.mins || activity.duration || 30;
    const caloriesPerMinute = activity.calories / originalDuration;
    return Math.round(caloriesPerMinute * durationMins);
  };

  // Favori durumunu değiştirmek için fonksiyon
  const handleToggleFavorite = async () => {
    try {
      setOperationLoading(true);
      await toggleFavoriteActivity(activity);
    } catch (error) {
      console.error("Toggle favorite error:", error);
      Alert.alert("Error", "Failed to update favorite status");
    } finally {
      setOperationLoading(false);
    }
  };

  // Aktiviteyi kaydet/ekle veya güncelle
  const handleActivityAction = async () => {
    try {
      setOperationLoading(true);

      const totalCalories = calculateCalories();
      const durationMins = parseInt(duration, 10) || 30;

      // Validasyon
      if (durationMins <= 0) {
        Alert.alert("Invalid Duration", "Duration must be greater than 0");
        return;
      }

      if (totalCalories <= 0) {
        Alert.alert(
          "Invalid Calories",
          "Calculated calories must be greater than 0"
        );
        return;
      }

      // Aktivite objesi oluştur
      const activityData = {
        ...activity,
        calories: totalCalories,
        duration: durationMins,
        mins: durationMins,
      };

      let result;

      if (isEditing) {
        // Güncelleme işlemi
        const updateData = {
          name: activity.name,
          activityName: activity.name,
          calories: totalCalories,
          caloriesBurned: totalCalories,
          duration: durationMins,
          durationMinutes: durationMins,
          intensity: activity.intensity || "moderate",
        };

        result = await updateActivity(
          activity.id || activity.backendId,
          updateData
        );
      } else {
        // Yeni ekleme işlemi
        result = await addActivity(activityData);
      }

      // Başarılı bir şekilde eklendiğini/güncellendiğini bildir
      const actionText = isEditing ? "Updated" : "Added";

      Alert.alert(
        `Activity ${actionText}`,
        `${
          activity.name
        } has been ${actionText.toLowerCase()} for ${duration} minutes, burning ${totalCalories} calories.`,
        [
          {
            text: "OK",
            onPress: () => {
              // Düzenleme modunda ActivityLog ekranına dön
              if (isEditing) {
                navigation.navigate("ActivityLog");
              } else {
                navigation.navigate("Home");
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error("Activity action error:", error);
      const actionText = isEditing ? "update" : "add";
      Alert.alert(
        "Error",
        `Failed to ${actionText} activity. Please try again.`
      );
    } finally {
      setOperationLoading(false);
    }
  };

  // Loading overlay component
  const LoadingOverlay = () =>
    operationLoading && (
      <View style={styles.loadingOverlay}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FDCD55" />
          <Text style={styles.loadingText}>
            {isEditing ? "Updating..." : "Adding..."}
          </Text>
        </View>
      </View>
    );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          disabled={operationLoading}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {activity.name}
        </Text>
        <View style={styles.headerRight}>
          {/* Favori butonu */}
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={handleToggleFavorite}
            disabled={operationLoading}
          >
            {operationLoading ? (
              <ActivityIndicator size="small" color="#ff4d4f" />
            ) : (
              <Ionicons
                name={isFavorite ? "heart" : "heart-outline"}
                size={24}
                color={isFavorite ? "#ff4d4f" : "#000"}
              />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Activity Details */}
      <View style={styles.detailsContainer}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Activity Type:</Text>
          <Text style={styles.detailValue}>
            {activity.type || activity.category || "Cardio"}
          </Text>
        </View>

        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Intensity:</Text>
          <Text style={styles.detailValue}>
            {activity.intensity || "Moderate"}
          </Text>
        </View>

        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>
            Calories Burned (per {activity.mins || activity.duration || 30}{" "}
            min):
          </Text>
          <Text style={styles.detailValue}>{activity.calories} kcal</Text>
        </View>

        {activity.description && (
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Description:</Text>
            <Text style={styles.detailValue}>{activity.description}</Text>
          </View>
        )}
      </View>

      {/* Duration Input */}
      <View style={styles.durationContainer}>
        <Text style={styles.durationLabel}>Set Duration (minutes):</Text>
        <View style={styles.durationInputGroup}>
          <TouchableOpacity
            style={[
              styles.durationButton,
              operationLoading && styles.disabledButton,
            ]}
            onPress={() => {
              const current = parseInt(duration, 10) || 0;
              if (current >= 5) {
                setDuration((current - 5).toString());
              }
            }}
            disabled={operationLoading}
          >
            <Ionicons name="remove" size={24} color="#666" />
          </TouchableOpacity>

          <TextInput
            style={[
              styles.durationInput,
              operationLoading && styles.disabledInput,
            ]}
            value={duration}
            onChangeText={setDuration}
            keyboardType="numeric"
            maxLength={3}
            editable={!operationLoading}
          />

          <TouchableOpacity
            style={[
              styles.durationButton,
              operationLoading && styles.disabledButton,
            ]}
            onPress={() => {
              const current = parseInt(duration, 10) || 0;
              setDuration((current + 5).toString());
            }}
            disabled={operationLoading}
          >
            <Ionicons name="add" size={24} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Calculated Calories */}
      <View style={styles.calculatedCaloriesContainer}>
        <Text style={styles.calculatedCaloriesLabel}>
          Calories You'll Burn:
        </Text>
        <Text style={styles.calculatedCaloriesValue}>
          {calculateCalories()} kcal
        </Text>
        <Text style={styles.calculatedCaloriesNote}>
          For {duration} minutes of {activity.name.toLowerCase()}
        </Text>
      </View>

      {/* Add/Update Button */}
      <TouchableOpacity
        style={[styles.addButton, operationLoading && styles.disabledButton]}
        onPress={handleActivityAction}
        disabled={operationLoading}
      >
        {operationLoading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.addButtonText}>
            {isEditing ? "Update Activity" : "Add Activity"}
          </Text>
        )}
      </TouchableOpacity>

      {/* Loading Overlay */}
      <LoadingOverlay />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    maxWidth: "60%",
    textAlign: "center",
  },
  headerRight: {
    width: 40,
    alignItems: "center",
  },
  favoriteButton: {
    padding: 8,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  detailsContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  detailItem: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 18,
    fontWeight: "500",
    color: "#333",
  },
  durationContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  durationLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 16,
    color: "#333",
  },
  durationInputGroup: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  durationButton: {
    width: 44,
    height: 44,
    backgroundColor: "#f0f0f0",
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  durationInput: {
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    width: 80,
    fontSize: 24,
    textAlign: "center",
    marginHorizontal: 20,
    color: "#333",
  },
  disabledButton: {
    opacity: 0.6,
  },
  disabledInput: {
    opacity: 0.6,
  },
  calculatedCaloriesContainer: {
    padding: 20,
    alignItems: "center",
  },
  calculatedCaloriesLabel: {
    fontSize: 16,
    color: "#666",
    marginBottom: 8,
  },
  calculatedCaloriesValue: {
    fontSize: 36,
    fontWeight: "600",
    color: "#FDCD55",
    marginBottom: 4,
  },
  calculatedCaloriesNote: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
  },
  addButton: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "#FDCD55",
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#333",
  },
});

export default ActivityDetailsScreen;
