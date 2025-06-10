// src/screens/main/activity/ActivityDetailsScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Alert,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useActivity } from "../../../context/ActivityContext"; // useMeals yerine useActivity kullanılıyor

const ActivityDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { activity } = route.params;
  const isEditing = route.params?.isEditing || false;

  // Context'ten fonksiyonları ve state'i al (ActivityContext'ten)
  const {
    toggleFavoriteActivity,
    addActivity,
    favoriteActivities,
    addToRecentActivity, // YENİ: Son görüntülenenlere eklemek için
  } = useActivity(); // useMeals yerine useActivity kullanılıyor

  // State'ler
  const [duration, setDuration] = useState(activity.mins?.toString() || "30");

  // Aktivite görüntülendiğinde son görüntülenenlere ekle
  useEffect(() => {
    if (addToRecentActivity && !isEditing) {
      addToRecentActivity(activity);
    }
  }, []);

  // Aktivitenin favori olup olmadığını kontrol et
  const isFavorite = favoriteActivities?.some(
    (item) => item.id === activity.id
  );

  // Kalori hesaplama
  const calculateCalories = () => {
    const durationMins = parseInt(duration, 10) || 30;
    const caloriesPerMinute = activity.calories / (activity.mins || 30);
    return Math.round(caloriesPerMinute * durationMins);
  };

  // Favori durumunu değiştirmek için fonksiyon
  const handleToggleFavorite = () => {
    if (toggleFavoriteActivity) {
      toggleFavoriteActivity(activity);
    }
  };

  // Aktiviteyi kaydet/ekle veya güncelle
  const handleActivityAction = () => {
    const totalCalories = calculateCalories();
    const durationMins = parseInt(duration, 10) || 30;

    // Aktivite objesi oluştur
    const activityData = {
      ...activity,
      calories: totalCalories,
      duration: durationMins,
      mins: durationMins,
    };

    // Aktiviteyi ekle veya güncelle
    addActivity(activityData);

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
            // Düzenleme modunda doğrudan ActivityLog ekranına dön
            if (isEditing) {
              navigation.navigate("ActivityLog");
            } else {
              navigation.navigate("Home");
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{activity.name}</Text>
        <View style={styles.headerRight}>
          {/* Favori butonu */}
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={handleToggleFavorite}
          >
            <Ionicons
              name={isFavorite ? "heart" : "heart-outline"}
              size={24}
              color={isFavorite ? "#ff4d4f" : "#000"}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Activity Details */}
      <View style={styles.detailsContainer}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Activity Type:</Text>
          <Text style={styles.detailValue}>{activity.type || "Cardio"}</Text>
        </View>

        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Intensity:</Text>
          <Text style={styles.detailValue}>
            {activity.intensity || "Moderate"}
          </Text>
        </View>

        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>
            Calories Burned (per {activity.mins || 30} min):
          </Text>
          <Text style={styles.detailValue}>{activity.calories} kcal</Text>
        </View>
      </View>

      {/* Duration Input */}
      <View style={styles.durationContainer}>
        <Text style={styles.durationLabel}>Set Duration (minutes):</Text>
        <View style={styles.durationInputGroup}>
          <TouchableOpacity
            style={styles.durationButton}
            onPress={() => {
              const current = parseInt(duration, 10) || 0;
              if (current >= 5) {
                setDuration((current - 5).toString());
              }
            }}
          >
            <Ionicons name="remove" size={24} color="#666" />
          </TouchableOpacity>

          <TextInput
            style={styles.durationInput}
            value={duration}
            onChangeText={setDuration}
            keyboardType="numeric"
            maxLength={3}
          />

          <TouchableOpacity
            style={styles.durationButton}
            onPress={() => {
              const current = parseInt(duration, 10) || 0;
              setDuration((current + 5).toString());
            }}
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
      </View>

      {/* Add/Update Button */}
      <TouchableOpacity style={styles.addButton} onPress={handleActivityAction}>
        <Text style={styles.addButtonText}>
          {isEditing ? "Update Activity" : "Add Activity"}
        </Text>
      </TouchableOpacity>
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
  },
  addButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});

export default ActivityDetailsScreen;
