// src/screens/main/activity/CreateActivityScreen.js - Backend Integration Update
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useActivity } from "../../../context/ActivityContext";
import { showToast } from "../../../components/AppToast";
import Button from "../../../components/Button";
import ScreenHeader from "../../../components/ScreenHeader";
import { COLORS } from "../../../theme";

const CreateActivityScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  // ActivityContext'ten fonksiyonları al
  const { addPersonalActivity, error, clearError } = useActivity();

  // Form state
  const [activityName, setActivityName] = useState("");
  const [activityType, setActivityType] = useState("Cardio");
  const [calories, setCalories] = useState("");
  const [duration, setDuration] = useState("30");
  const [intensity, setIntensity] = useState("Moderate");
  const [description, setDescription] = useState("");

  // Loading state
  const [saving, setSaving] = useState(false);

  // Activity types
  const activityTypes = [
    "Cardio",
    "Strength",
    "Flexibility",
    "Sports",
    "Daily Activities",
    "Other",
  ];

  // Intensity levels
  const intensityLevels = ["Low", "Moderate", "High", "Very High"];

  // Error handling
  useEffect(() => {
    if (error) {
      Alert.alert("Error", error, [
        { text: "OK", onPress: () => clearError() },
      ]);
    }
  }, [error]);

  // Validate form
  const isFormValid = () => {
    const nameValid = activityName.trim().length >= 2;
    const caloriesValid = parseInt(calories) > 0;
    const durationValid = parseInt(duration) > 0;

    return nameValid && caloriesValid && durationValid;
  };

  // Get validation errors
  const getValidationErrors = () => {
    const errors = [];

    if (activityName.trim().length < 2) {
      errors.push("Activity name must be at least 2 characters");
    }

    if (!calories.trim() || parseInt(calories) <= 0) {
      errors.push("Calories must be greater than 0");
    }

    if (!duration.trim() || parseInt(duration) <= 0) {
      errors.push("Duration must be greater than 0");
    }

    return errors;
  };

  // Handle saving the activity
  const handleSave = async () => {
    // Validate form
    const validationErrors = getValidationErrors();
    if (validationErrors.length > 0) {
      Alert.alert("Validation Error", validationErrors.join("\n"));
      return;
    }

    try {
      setSaving(true);

      const newActivity = {
        id: `custom_${Date.now()}`,
        name: activityName.trim(),
        type: activityType,
        calories: parseInt(calories, 10),
        mins: parseInt(duration, 10),
        duration: parseInt(duration, 10),
        intensity: intensity,
        description: description.trim(),
        isPersonal: true,
        isCustomActivity: true,
      };

      // Add to personal activities in the context (this will save to backend)
      await addPersonalActivity(newActivity);

      showToast(`${activityName} added to your personal activities`, "success");
      navigation.navigate("ActivitySelection", {
        activeTab: "Personal",
        refresh: true,
      });
    } catch (error) {
      console.error("Create activity error:", error);
      Alert.alert("Error", "Failed to create activity. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (activityName.trim() || calories.trim() || description.trim()) {
      Alert.alert(
        "Discard Changes",
        "Are you sure you want to discard your changes?",
        [
          { text: "Keep Editing", style: "cancel" },
          {
            text: "Discard",
            style: "destructive",
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  // Calculate calories per minute for preview
  const getCaloriesPerMinute = () => {
    const totalCalories = parseInt(calories) || 0;
    const totalDuration = parseInt(duration) || 30;
    return totalDuration > 0 ? (totalCalories / totalDuration).toFixed(1) : "0";
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Create Activity" onBack={handleCancel} />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Form Fields */}
        <View style={styles.formContainer}>
          {/* Activity Name */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>
              Activity Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.formInput,
                activityName.trim().length > 0 &&
                  activityName.trim().length < 2 &&
                  styles.inputError,
              ]}
              placeholder="e.g. Swimming, Cycling, etc."
              value={activityName}
              onChangeText={setActivityName}
              maxLength={50}
              editable={!saving}
            />
            {activityName.trim().length > 0 &&
              activityName.trim().length < 2 && (
                <Text style={styles.errorText}>
                  Name must be at least 2 characters
                </Text>
              )}
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
                  disabled={saving}
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
                  disabled={saving}
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
              <Text style={styles.formLabel}>
                Calories (per session) <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.formInput,
                  calories.trim() &&
                    parseInt(calories) <= 0 &&
                    styles.inputError,
                ]}
                placeholder="e.g. 300"
                keyboardType="numeric"
                value={calories}
                onChangeText={setCalories}
                maxLength={4}
                editable={!saving}
              />
              {calories.trim() && parseInt(calories) <= 0 && (
                <Text style={styles.errorText}>Must be greater than 0</Text>
              )}
            </View>

            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.formLabel}>
                Duration (minutes) <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.formInput,
                  duration.trim() &&
                    parseInt(duration) <= 0 &&
                    styles.inputError,
                ]}
                placeholder="e.g. 30"
                keyboardType="numeric"
                value={duration}
                onChangeText={setDuration}
                maxLength={3}
                editable={!saving}
              />
              {duration.trim() && parseInt(duration) <= 0 && (
                <Text style={styles.errorText}>Must be greater than 0</Text>
              )}
            </View>
          </View>

          {/* Description */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Description (Optional)</Text>
            <TextInput
              style={[styles.formInput, styles.textArea]}
              placeholder="Add notes about this activity..."
              value={description}
              onChangeText={setDescription}
              multiline={true}
              numberOfLines={3}
              maxLength={200}
              textAlignVertical="top"
              editable={!saving}
            />
            <Text style={styles.characterCount}>{description.length}/200</Text>
          </View>

          {/* Activity Preview */}
          {isFormValid() && (
            <View style={styles.previewContainer}>
              <Text style={styles.previewTitle}>Activity Preview</Text>
              <View style={styles.previewCard}>
                <Text style={styles.previewActivityName}>{activityName}</Text>
                <Text style={styles.previewDetails}>
                  {calories} kcal • {duration} mins • {activityType}
                </Text>
                <Text style={styles.previewCaloriesPerMin}>
                  {getCaloriesPerMinute()} kcal/min
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Create Button */}
      <View
        style={[
          styles.buttonContainer,
          { paddingBottom: Math.max(insets.bottom, 16) },
        ]}
      >
        <Button
          title="Create Activity"
          onPress={handleSave}
          loading={saving}
          disabled={!isFormValid()}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
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
    color: COLORS.textPrimary,
  },
  required: {
    color: COLORS.danger,
  },
  formInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: COLORS.surface,
  },
  inputError: {
    borderColor: COLORS.danger,
  },
  textArea: {
    minHeight: 80,
    maxHeight: 120,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 12,
    marginTop: 4,
  },
  characterCount: {
    fontSize: 12,
    color: COLORS.textTertiary,
    textAlign: "right",
    marginTop: 4,
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
    borderColor: COLORS.border,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: COLORS.surface,
  },
  optionButtonActive: {
    backgroundColor: COLORS.warning,
    borderColor: COLORS.warning,
  },
  optionButtonText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  optionButtonTextActive: {
    color: COLORS.surface,
    fontWeight: "500",
  },
  previewContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: 12,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    color: COLORS.textPrimary,
  },
  previewCard: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.warning,
  },
  previewActivityName: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  previewDetails: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  previewCaloriesPerMin: {
    fontSize: 12,
    color: COLORS.warning,
    fontWeight: "500",
  },
  buttonContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  createButton: {
    backgroundColor: COLORS.warning,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  createButtonDisabled: {
    backgroundColor: COLORS.borderStrong,
    shadowOpacity: 0,
    elevation: 0,
  },
  createButtonText: {
    color: COLORS.surface,
    fontSize: 18,
    fontWeight: "600",
  },
});

export default CreateActivityScreen;
