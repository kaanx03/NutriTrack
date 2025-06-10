// src/screens/main/settings/CalorieCounterScreen.js - Updated with SignUp Data
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Switch,
  Alert,
  TextInput,
  Modal,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import BottomNavigation from "../../../components/BottomNavigation";
import { useMeals } from "../../../context/MealsContext";
import { useSignUp } from "../../../context/SignUpContext";

const CalorieCounterScreen = () => {
  const navigation = useNavigation();
  const { calorieData, updateCalorieGoal } = useMeals();
  const { formData } = useSignUp();

  const [settings, setSettings] = useState({
    calorieIntakeGoal: "2000 kcal", // Default value
    units: "kcal",
    mealLoggingReminder: true,
    repeat: "Everyday",
    reminderTime: "08:00 AM",
    ringtone: "Lollipop",
    volume: 0.7,
    vibration: false,
    stopWhenComplete: false,
  });

  const [goalModalVisible, setGoalModalVisible] = useState(false);
  const [tempGoalValue, setTempGoalValue] = useState("2000");

  // SignUp verilerinden kalori hedefini yükle
  useEffect(() => {
    let initialCalories = 2000; // Default

    // Önce SignUp'dan hesaplanan değeri kontrol et
    if (
      formData &&
      formData.calculatedPlan &&
      formData.calculatedPlan.dailyCalories
    ) {
      initialCalories = formData.calculatedPlan.dailyCalories;
    }
    // Sonra MealsContext'ten güncel değeri kontrol et
    else if (calorieData && calorieData.calories) {
      initialCalories = calorieData.calories;
    }

    const formattedGoal = `${initialCalories.toLocaleString()} kcal`;

    setSettings((prev) => ({
      ...prev,
      calorieIntakeGoal: formattedGoal,
    }));

    setTempGoalValue(initialCalories.toString());
  }, [formData, calorieData]);

  const handleSettingChange = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const showGoalPicker = () => {
    // Modal açılırken mevcut değeri ayarla
    const currentCalories = calorieData?.calories || 2000;
    setTempGoalValue(currentCalories.toString());
    setGoalModalVisible(true);
  };

  const handleGoalSave = () => {
    const numericValue = parseInt(tempGoalValue);

    // Geçerli bir sayı olup olmadığını kontrol et
    if (isNaN(numericValue) || numericValue < 800 || numericValue > 5000) {
      Alert.alert(
        "Invalid Input",
        "Please enter a valid calorie goal between 800 and 5000 kcal"
      );
      return;
    }

    // Ayarları güncelle
    const formattedValue = `${numericValue.toLocaleString()} kcal`;
    handleSettingChange("calorieIntakeGoal", formattedValue);

    // MealsContext'i güncelle
    updateCalorieGoal(numericValue);

    setGoalModalVisible(false);

    Alert.alert(
      "Goal Updated",
      `Your daily calorie goal has been set to ${numericValue.toLocaleString()} kcal`
    );
  };

  const resetToCalculated = () => {
    if (
      formData &&
      formData.calculatedPlan &&
      formData.calculatedPlan.dailyCalories
    ) {
      const calculatedCalories = formData.calculatedPlan.dailyCalories;

      Alert.alert(
        "Reset to Calculated Goal",
        `Reset your calorie goal to the calculated value of ${calculatedCalories.toLocaleString()} kcal?`,
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Reset",
            onPress: () => {
              const formattedValue = `${calculatedCalories.toLocaleString()} kcal`;
              handleSettingChange("calorieIntakeGoal", formattedValue);
              updateCalorieGoal(calculatedCalories);
              setTempGoalValue(calculatedCalories.toString());

              Alert.alert(
                "Goal Reset",
                `Your calorie goal has been reset to ${calculatedCalories.toLocaleString()} kcal`
              );
            },
          },
        ]
      );
    } else {
      Alert.alert(
        "No Calculated Goal",
        "No calculated calorie goal found. Please complete your profile setup first."
      );
    }
  };

  const showUnitsPicker = () => {
    const units = ["kcal", "kJ"];
    Alert.alert(
      "Select Units",
      "",
      units
        .map((unit) => ({
          text: unit,
          onPress: () => handleSettingChange("units", unit),
        }))
        .concat([
          {
            text: "Cancel",
            style: "cancel",
          },
        ])
    );
  };

  const showRepeatPicker = () => {
    const options = ["Everyday", "Weekdays", "Weekends", "Custom"];
    Alert.alert(
      "Repeat",
      "",
      options
        .map((option) => ({
          text: option,
          onPress: () => handleSettingChange("repeat", option),
        }))
        .concat([
          {
            text: "Cancel",
            style: "cancel",
          },
        ])
    );
  };

  const showTimePicker = () => {
    Alert.alert(
      "Reminder Time",
      "In a real app, this would open a time picker",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Set Time",
          onPress: () => {
            handleSettingChange("reminderTime", "09:00 AM");
          },
        },
      ]
    );
  };

  const showRingtonePicker = () => {
    const ringtones = ["Lollipop", "Classic", "Bell", "Chime", "Digital"];
    Alert.alert(
      "Select Ringtone",
      "",
      ringtones
        .map((ringtone) => ({
          text: ringtone,
          onPress: () => handleSettingChange("ringtone", ringtone),
        }))
        .concat([
          {
            text: "Cancel",
            style: "cancel",
          },
        ])
    );
  };

  const renderSettingItem = (label, value, onPress, hasArrow = true) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.settingLabel}>{label}</Text>
      <View style={styles.settingRight}>
        <Text style={styles.settingValue}>{value}</Text>
        {hasArrow && onPress && (
          <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
        )}
      </View>
    </TouchableOpacity>
  );

  const renderSwitchItem = (label, value, onValueChange) => (
    <View style={styles.settingItem}>
      <Text style={styles.settingLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: "#E5E5E5", true: "#A1CE50" }}
        thumbColor={value ? "#FFFFFF" : "#FFFFFF"}
      />
    </View>
  );

  const renderVolumeSlider = () => (
    <View style={styles.volumeContainer}>
      <Ionicons name="volume-low" size={20} color="#666" />
      <View style={styles.volumeSlider}>
        <View style={styles.volumeTrack}>
          <View
            style={[styles.volumeFill, { width: `${settings.volume * 100}%` }]}
          />
          <View
            style={[
              styles.volumeThumb,
              { left: `${settings.volume * 100 - 2}%` },
            ]}
          />
        </View>
      </View>
      <Ionicons name="volume-high" size={20} color="#666" />
    </View>
  );

  const getCurrentCalories = () => {
    return calorieData?.calories || 2000;
  };

  const getCalculatedCalories = () => {
    return formData?.calculatedPlan?.dailyCalories || null;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Calorie Counter</Text>

        <View style={styles.headerButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Goal Settings */}
        <View style={styles.section}>
          {renderSettingItem(
            "Calorie Intake Goal",
            settings.calorieIntakeGoal,
            showGoalPicker
          )}
          {renderSettingItem("Units", settings.units, showUnitsPicker)}

          {/* Reset to Calculated Button */}
          {getCalculatedCalories() &&
            getCalculatedCalories() !== getCurrentCalories() && (
              <TouchableOpacity
                style={styles.resetButton}
                onPress={resetToCalculated}
              >
                <Ionicons name="refresh-outline" size={20} color="#A1CE50" />
                <Text style={styles.resetButtonText}>
                  Reset to Calculated Goal (
                  {getCalculatedCalories().toLocaleString()} kcal)
                </Text>
              </TouchableOpacity>
            )}
        </View>

        {/* Current vs Calculated Info */}
        {getCalculatedCalories() && (
          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>Calorie Goal Information</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Current Goal:</Text>
              <Text style={styles.infoValue}>
                {getCurrentCalories().toLocaleString()} kcal
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Calculated Goal:</Text>
              <Text style={[styles.infoValue, { color: "#A1CE50" }]}>
                {getCalculatedCalories().toLocaleString()} kcal
              </Text>
            </View>
            {getCurrentCalories() !== getCalculatedCalories() && (
              <Text style={styles.infoNote}>
                Your current goal differs from your calculated goal based on
                your profile.
              </Text>
            )}
          </View>
        )}

        {/* Reminder Settings */}
        <View style={styles.section}>
          {renderSwitchItem(
            "Meal Logging Reminder",
            settings.mealLoggingReminder,
            (value) => handleSettingChange("mealLoggingReminder", value)
          )}

          {settings.mealLoggingReminder && (
            <>
              {renderSettingItem("Repeat", settings.repeat, showRepeatPicker)}
              {renderSettingItem(
                "Reminder Time",
                settings.reminderTime,
                showTimePicker
              )}
              {renderSettingItem(
                "Ringtone",
                settings.ringtone,
                showRingtonePicker
              )}

              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Volume</Text>
              </View>
              {renderVolumeSlider()}

              {renderSwitchItem("Vibration", settings.vibration, (value) =>
                handleSettingChange("vibration", value)
              )}
              {renderSwitchItem(
                "Stop When 100%",
                settings.stopWhenComplete,
                (value) => handleSettingChange("stopWhenComplete", value)
              )}
            </>
          )}
        </View>
      </ScrollView>

      {/* Calorie Goal Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={goalModalVisible}
        onRequestClose={() => setGoalModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Set Calorie Goal</Text>
              <TouchableOpacity
                onPress={() => setGoalModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <Text style={styles.inputLabel}>Daily Calorie Goal</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  value={tempGoalValue}
                  onChangeText={setTempGoalValue}
                  placeholder="Enter calories"
                  keyboardType="numeric"
                  maxLength={4}
                />
                <Text style={styles.inputUnit}>kcal</Text>
              </View>

              {getCalculatedCalories() && (
                <View style={styles.suggestionContainer}>
                  <Text style={styles.suggestionLabel}>
                    Suggested (calculated):
                  </Text>
                  <TouchableOpacity
                    style={styles.suggestionButton}
                    onPress={() =>
                      setTempGoalValue(getCalculatedCalories().toString())
                    }
                  >
                    <Text style={styles.suggestionButtonText}>
                      {getCalculatedCalories().toLocaleString()} kcal
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              <Text style={styles.helperText}>
                Recommended range: 800 - 5000 kcal per day
              </Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setGoalModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleGoalSave}
              >
                <Text style={styles.saveButtonText}>Save Goal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab="Profile" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerButton: {
    padding: 8,
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: "#FFFFFF",
    margin: 20,
    borderRadius: 16,
    overflow: "hidden",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  settingLabel: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  settingRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingValue: {
    fontSize: 16,
    color: "#666",
    marginRight: 8,
  },
  resetButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#A1CE50",
  },
  resetButtonText: {
    fontSize: 14,
    color: "#A1CE50",
    fontWeight: "500",
    marginLeft: 8,
  },
  infoSection: {
    backgroundColor: "#FFFFFF",
    margin: 20,
    marginTop: 0,
    borderRadius: 16,
    padding: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
    textAlign: "center",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: "#666",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  infoNote: {
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 8,
  },
  volumeContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  volumeSlider: {
    flex: 1,
    marginHorizontal: 16,
  },
  volumeTrack: {
    height: 4,
    backgroundColor: "#E5E5E5",
    borderRadius: 2,
    position: "relative",
  },
  volumeFill: {
    height: "100%",
    backgroundColor: "#A1CE50",
    borderRadius: 2,
  },
  volumeThumb: {
    position: "absolute",
    top: -8,
    width: 20,
    height: 20,
    backgroundColor: "#A1CE50",
    borderRadius: 10,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    margin: 20,
    width: "85%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  closeButton: {
    padding: 5,
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 10,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#A1CE50",
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  textInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    paddingVertical: 12,
  },
  inputUnit: {
    fontSize: 16,
    color: "#666",
    marginLeft: 10,
  },
  suggestionContainer: {
    marginBottom: 15,
  },
  suggestionLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  suggestionButton: {
    backgroundColor: "#f0f8ff",
    borderWidth: 1,
    borderColor: "#A1CE50",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    alignItems: "center",
  },
  suggestionButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#A1CE50",
  },
  helperText: {
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
  },
  modalButtons: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f0f0f0",
  },
  saveButton: {
    backgroundColor: "#A1CE50",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#666",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});

export default CalorieCounterScreen;
