// src/screens/main/settings/WeightTrackerScreen.js
import React, { useState } from "react";
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
import { useWeight } from "../../../context/WeightContext";

const WeightTrackerScreen = () => {
  const navigation = useNavigation();
  const {
    currentWeight,
    goalWeight,
    height,
    bmi,
    bmiCategory,
    updateWeight,
    updateHeight,
    updateGoalWeight,
    getBMIColor,
    getWeightChange,
    getGoalProgress,
  } = useWeight();

  const [settings, setSettings] = useState({
    weightUnits: "kg",
    heightUnits: "cm",
    bmiEnabled: true,
    weightLoggingReminder: true,
    repeat: "Everyday",
    reminderTime: "10:00",
    ringtone: "Jingle Jam",
    volume: 0.8,
    vibration: false,
    stopWhenGoalAchieved: false,
  });

  // Modal states
  const [weightModalVisible, setWeightModalVisible] = useState(false);
  const [goalModalVisible, setGoalModalVisible] = useState(false);
  const [heightModalVisible, setHeightModalVisible] = useState(false);

  const [tempWeight, setTempWeight] = useState(currentWeight.toString());
  const [tempGoal, setTempGoal] = useState(goalWeight.toString());
  const [tempHeight, setTempHeight] = useState(height.toString());

  const handleSettingChange = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Weight modal handlers
  const showWeightPicker = () => {
    setTempWeight(currentWeight.toString());
    setWeightModalVisible(true);
  };

  const saveWeight = () => {
    const weight = parseFloat(tempWeight);
    if (isNaN(weight) || weight <= 0 || weight > 500) {
      Alert.alert(
        "Invalid Input",
        "Please enter a valid weight between 1 and 500 kg"
      );
      return;
    }

    updateWeight(weight);
    setWeightModalVisible(false);
    Alert.alert("Success", `Weight updated to ${weight} kg`);
  };

  // Goal weight modal handlers
  const showGoalPicker = () => {
    setTempGoal(goalWeight.toString());
    setGoalModalVisible(true);
  };

  const saveGoal = () => {
    const goal = parseFloat(tempGoal);
    if (isNaN(goal) || goal <= 0 || goal > 500) {
      Alert.alert(
        "Invalid Input",
        "Please enter a valid goal weight between 1 and 500 kg"
      );
      return;
    }

    updateGoalWeight(goal);
    setGoalModalVisible(false);
    Alert.alert("Success", `Goal weight updated to ${goal} kg`);
  };

  // Height modal handlers
  const showHeightPicker = () => {
    setTempHeight(height.toString());
    setHeightModalVisible(true);
  };

  const saveHeight = () => {
    const heightValue = parseFloat(tempHeight);
    if (isNaN(heightValue) || heightValue <= 0 || heightValue > 300) {
      Alert.alert(
        "Invalid Input",
        "Please enter a valid height between 1 and 300 cm"
      );
      return;
    }

    updateHeight(heightValue);
    setHeightModalVisible(false);
    Alert.alert("Success", `Height updated to ${heightValue} cm`);
  };

  const showWeightUnitsPicker = () => {
    const units = ["kg", "lbs", "st"];
    Alert.alert(
      "Weight Units",
      "",
      units
        .map((unit) => ({
          text: unit,
          onPress: () => handleSettingChange("weightUnits", unit),
        }))
        .concat([
          {
            text: "Cancel",
            style: "cancel",
          },
        ])
    );
  };

  const showHeightUnitsPicker = () => {
    const units = ["cm", "ft", "in"];
    Alert.alert(
      "Height Units",
      "",
      units
        .map((unit) => ({
          text: unit,
          onPress: () => handleSettingChange("heightUnits", unit),
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
    const options = ["Everyday", "Weekly", "Bi-weekly", "Monthly"];
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
            handleSettingChange("reminderTime", "09:00");
          },
        },
      ]
    );
  };

  const showRingtonePicker = () => {
    const ringtones = [
      "Jingle Jam",
      "Scale Sound",
      "Success Bell",
      "Motivation",
      "Classic",
    ];
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
        trackColor={{ false: "#E5E5E5", true: "#FF6B6B" }}
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

  // Modal component
  const renderModal = (
    visible,
    onClose,
    title,
    value,
    setValue,
    onSave,
    unit
  ) => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.inputLabel}>{title}</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                value={value}
                onChangeText={setValue}
                placeholder={`Enter ${title.toLowerCase()}`}
                keyboardType="numeric"
                maxLength={6}
              />
              <Text style={styles.inputUnit}>{unit}</Text>
            </View>
          </View>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.saveButton]}
              onPress={onSave}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const weightChange = getWeightChange();
  const goalProgress = getGoalProgress();

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

        <Text style={styles.headerTitle}>Weight Tracker</Text>

        <View style={styles.headerButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Weight & Goal Settings */}
        <View style={styles.section}>
          {renderSettingItem(
            "Current Weight",
            `${currentWeight.toFixed(1)} kg`,
            showWeightPicker
          )}
          {renderSettingItem(
            "Goal Weight",
            `${goalWeight.toFixed(1)} kg`,
            showGoalPicker
          )}
          {renderSettingItem(
            "Height",
            `${height.toFixed(1)} cm`,
            showHeightPicker
          )}
          {renderSettingItem(
            "Weight Units",
            settings.weightUnits,
            showWeightUnitsPicker
          )}
          {renderSettingItem(
            "Height Units",
            settings.heightUnits,
            showHeightUnitsPicker
          )}
        </View>

        {/* BMI Section */}
        <View style={styles.section}>
          {renderSwitchItem(
            "Body Mass Index (BMI)",
            settings.bmiEnabled,
            (value) => handleSettingChange("bmiEnabled", value)
          )}
        </View>

        {/* Reminder Settings */}
        <View style={styles.section}>
          {renderSwitchItem(
            "Weight Logging Reminder",
            settings.weightLoggingReminder,
            (value) => handleSettingChange("weightLoggingReminder", value)
          )}

          {settings.weightLoggingReminder && (
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
                "Stop When Goal is Achieved",
                settings.stopWhenGoalAchieved,
                (value) => handleSettingChange("stopWhenGoalAchieved", value)
              )}
            </>
          )}
        </View>

        {/* Progress Info */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Ionicons name="trending-down" size={24} color="#FF6B6B" />
            <Text style={styles.progressTitle}>Weight Progress</Text>
          </View>

          <View style={styles.progressStats}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>To Goal</Text>
              <Text style={styles.statValue}>{goalProgress.remaining} kg</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>BMI</Text>
              <Text style={[styles.statValue, { color: getBMIColor(bmi) }]}>
                {bmi?.toFixed(1) || "0.0"}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Category</Text>
              <Text style={[styles.statValue, { color: getBMIColor(bmi) }]}>
                {bmiCategory.split(" ")[0]}
              </Text>
            </View>
          </View>

          <View style={styles.progressStats}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Change</Text>
              <Text
                style={[
                  styles.statValue,
                  {
                    color: weightChange.isNegative
                      ? "#10B981"
                      : weightChange.isPositive
                      ? "#EF4444"
                      : "#666",
                  },
                ]}
              >
                {weightChange.isNegative
                  ? "-"
                  : weightChange.isPositive
                  ? "+"
                  : ""}
                {weightChange.value} kg
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Progress</Text>
              <Text style={styles.statValue}>
                {goalProgress.percentage.toFixed(0)}%
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Status</Text>
              <Text
                style={[
                  styles.statValue,
                  { color: goalProgress.isAchieved ? "#10B981" : "#FF6B6B" },
                ]}
              >
                {goalProgress.isAchieved ? "Achieved!" : "In Progress"}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Modals */}
      {renderModal(
        weightModalVisible,
        () => setWeightModalVisible(false),
        "Current Weight",
        tempWeight,
        setTempWeight,
        saveWeight,
        "kg"
      )}

      {renderModal(
        goalModalVisible,
        () => setGoalModalVisible(false),
        "Goal Weight",
        tempGoal,
        setTempGoal,
        saveGoal,
        "kg"
      )}

      {renderModal(
        heightModalVisible,
        () => setHeightModalVisible(false),
        "Height",
        tempHeight,
        setTempHeight,
        saveHeight,
        "cm"
      )}

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
    marginBottom: 0,
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
    backgroundColor: "#FF6B6B",
    borderRadius: 2,
  },
  volumeThumb: {
    position: "absolute",
    top: -8,
    width: 20,
    height: 20,
    backgroundColor: "#FF6B6B",
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
  progressSection: {
    backgroundColor: "#FFFFFF",
    margin: 20,
    borderRadius: 16,
    padding: 20,
  },
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginLeft: 12,
  },
  progressStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: "#E5E5E5",
    marginHorizontal: 16,
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
    borderColor: "#FF6B6B",
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 10,
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
    backgroundColor: "#FF6B6B",
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

export default WeightTrackerScreen;
