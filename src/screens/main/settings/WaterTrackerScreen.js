// src/screens/main/settings/WaterTrackerScreen.js
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
import { useWater } from "../../../context/WaterContext";

const WaterTrackerScreen = () => {
  const navigation = useNavigation();
  const { waterGoal, setWaterGoal } = useWater();

  const [settings, setSettings] = useState({
    waterIntakeGoal: waterGoal.toString(),
    cupUnits: "mL",
    drinkReminder: true,
    repeat: "Everyday",
    reminderMode: "Static",
    ringtone: "Harmony",
    volume: 0.6,
    vibration: false,
    stopWhenComplete: false,
  });

  const [goalModalVisible, setGoalModalVisible] = useState(false);
  const [tempGoalValue, setTempGoalValue] = useState(waterGoal.toString());

  const handleSettingChange = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const showGoalPicker = () => {
    setTempGoalValue(settings.waterIntakeGoal);
    setGoalModalVisible(true);
  };

  const handleGoalSave = () => {
    const numericValue = parseInt(tempGoalValue);

    // Geçerli bir sayı olup olmadığını kontrol et
    if (isNaN(numericValue) || numericValue < 500 || numericValue > 10000) {
      Alert.alert(
        "Invalid Input",
        "Please enter a valid water goal between 500 and 10000 mL"
      );
      return;
    }

    // Ayarları güncelle
    const formattedValue = numericValue.toLocaleString() + " mL";
    handleSettingChange("waterIntakeGoal", formattedValue);

    // WaterContext'i güncelle
    setWaterGoal(numericValue);

    setGoalModalVisible(false);

    Alert.alert(
      "Goal Updated",
      `Your daily water goal has been set to ${numericValue} mL`
    );
  };

  const showUnitsPicker = () => {
    const units = ["mL", "L", "fl oz", "cups"];
    Alert.alert(
      "Select Units",
      "",
      units
        .map((unit) => ({
          text: unit,
          onPress: () => handleSettingChange("cupUnits", unit),
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

  const showReminderModePicker = () => {
    const modes = ["Static", "Smart", "Adaptive"];
    Alert.alert(
      "Reminder Mode",
      "",
      modes
        .map((mode) => ({
          text: mode,
          onPress: () => handleSettingChange("reminderMode", mode),
        }))
        .concat([
          {
            text: "Cancel",
            style: "cancel",
          },
        ])
    );
  };

  const showRingtonePicker = () => {
    const ringtones = ["Harmony", "Droplet", "Ocean", "Rain", "Classic"];
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
        trackColor={{ false: "#E5E5E5", true: "#4ECDC4" }}
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

        <Text style={styles.headerTitle}>Water Tracker</Text>

        <View style={styles.headerButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Goal Settings */}
        <View style={styles.section}>
          {renderSettingItem(
            "Water Intake Goal",
            settings.waterIntakeGoal,
            showGoalPicker
          )}
          {renderSettingItem("Cup Units", settings.cupUnits, showUnitsPicker)}
        </View>

        {/* Reminder Settings */}
        <View style={styles.section}>
          {renderSwitchItem("Drink Reminder", settings.drinkReminder, (value) =>
            handleSettingChange("drinkReminder", value)
          )}

          {settings.drinkReminder && (
            <>
              {renderSettingItem("Repeat", settings.repeat, showRepeatPicker)}
              {renderSettingItem(
                "Reminder Mode",
                settings.reminderMode,
                showReminderModePicker
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

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle" size={24} color="#4ECDC4" />
            <Text style={styles.infoTitle}>Water Intake Tips</Text>
          </View>
          <Text style={styles.infoText}>
            • Drink water regularly throughout the day
          </Text>
          <Text style={styles.infoText}>
            • Start your day with a glass of water
          </Text>
          <Text style={styles.infoText}>• Increase intake during exercise</Text>
          <Text style={styles.infoText}>
            • Monitor urine color for hydration levels
          </Text>
        </View>
      </ScrollView>

      {/* Water Goal Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={goalModalVisible}
        onRequestClose={() => setGoalModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Set Water Goal</Text>
              <TouchableOpacity
                onPress={() => setGoalModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <Text style={styles.inputLabel}>Daily Water Goal</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  value={tempGoalValue}
                  onChangeText={setTempGoalValue}
                  placeholder="Enter water amount"
                  keyboardType="numeric"
                  maxLength={5}
                />
                <Text style={styles.inputUnit}>mL</Text>
              </View>

              <Text style={styles.helperText}>
                Recommended range: 500 - 10000 mL per day
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
    backgroundColor: "#4ECDC4",
    borderRadius: 2,
  },
  volumeThumb: {
    position: "absolute",
    top: -8,
    width: 20,
    height: 20,
    backgroundColor: "#4ECDC4",
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
  infoSection: {
    backgroundColor: "#FFFFFF",
    margin: 20,
    borderRadius: 16,
    padding: 20,
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginLeft: 12,
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 8,
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
    borderColor: "#4ECDC4",
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
    backgroundColor: "#4ECDC4",
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

export default WaterTrackerScreen;
