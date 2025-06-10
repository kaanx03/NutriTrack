// src/screens/main/activity/CreateActivityScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { useActivity } from "../../../context/ActivityContext"; // useMeals yerine useActivity kullanılıyor

const CreateActivityScreen = () => {
  const navigation = useNavigation();

  // ActivityContext'ten fonksiyonları al
  const { addPersonalActivity } = useActivity(); // useMeals yerine useActivity kullanılıyor

  // Form state
  const [activityName, setActivityName] = useState("");
  const [activityType, setActivityType] = useState("Cardio");
  const [calories, setCalories] = useState("");
  const [duration, setDuration] = useState("30");
  const [intensity, setIntensity] = useState("Moderate");

  // Activity types
  const activityTypes = [
    "Cardio",
    "Strength",
    "Flexibility",
    "Sports",
    "Other",
  ];

  // Intensity levels
  const intensityLevels = ["Low", "Moderate", "High", "Very High"];

  // Validate form
  const isFormValid = () => {
    return (
      activityName.trim() !== "" &&
      calories.trim() !== "" &&
      duration.trim() !== ""
    );
  };

  // Handle saving the activity
  const handleSave = () => {
    if (isFormValid()) {
      const newActivity = {
        id: Date.now().toString(),
        name: activityName.trim(),
        type: activityType,
        calories: parseInt(calories, 10),
        mins: parseInt(duration, 10),
        intensity: intensity,
        isPersonal: true, // Flag to identify personal activities
      };

      // Add to personal activities in the context
      addPersonalActivity(newActivity);

      // Show success message
      Alert.alert(
        "Activity Created",
        `${activityName} has been added to your personal activities.`,
        [
          {
            text: "OK",
            onPress: () =>
              navigation.navigate("ActivitySelection", {
                activeTab: "Personal",
              }),
          },
        ]
      );
    } else {
      Alert.alert("Error", "Please fill out all required fields");
    }
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
        <Text style={styles.headerTitle}>Create Activity</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Form Fields */}
        <View style={styles.formContainer}>
          {/* Activity Name */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Activity Name</Text>
            <TextInput
              style={styles.formInput}
              placeholder="e.g. Swimming, Cycling, etc."
              value={activityName}
              onChangeText={setActivityName}
            />
          </View>

          {/* Activity Type */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Activity Type</Text>
            <View style={styles.buttonGroup}>
              {activityTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.optionButton,
                    activityType === type && styles.optionButtonActive,
                  ]}
                  onPress={() => setActivityType(type)}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      activityType === type && styles.optionButtonTextActive,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Intensity */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Intensity</Text>
            <View style={styles.buttonGroup}>
              {intensityLevels.map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.optionButton,
                    intensity === level && styles.optionButtonActive,
                  ]}
                  onPress={() => setIntensity(level)}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      intensity === level && styles.optionButtonTextActive,
                    ]}
                  >
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Calories and Duration Row */}
          <View style={styles.formRow}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.formLabel}>Calories (per session)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. 300"
                keyboardType="numeric"
                value={calories}
                onChangeText={setCalories}
              />
            </View>

            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.formLabel}>Duration (minutes)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. 30"
                keyboardType="numeric"
                value={duration}
                onChangeText={setDuration}
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Add Button */}
      <TouchableOpacity
        style={[styles.addButton, !isFormValid() && styles.addButtonDisabled]}
        onPress={handleSave}
        disabled={!isFormValid()}
      >
        <Text style={styles.addButtonText}>Create Activity</Text>
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
    alignItems: "center",
    justifyContent: "space-between",
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
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
    color: "#333",
  },
  formInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  buttonGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  optionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    marginRight: 8,
    marginBottom: 8,
  },
  optionButtonActive: {
    backgroundColor: "#FDCD55",
    borderColor: "#FDCD55",
  },
  optionButtonText: {
    color: "#666",
  },
  optionButtonTextActive: {
    color: "#fff",
  },
  addButton: {
    margin: 20,
    backgroundColor: "#FDCD55",
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: "center",
  },
  addButtonDisabled: {
    backgroundColor: "#cccccc",
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default CreateActivityScreen;
