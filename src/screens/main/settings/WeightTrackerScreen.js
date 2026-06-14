// src/screens/main/settings/WeightTrackerScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  TextInput,
  Modal
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import BottomNavigation from "../../../components/BottomNavigation";
import { useWeight } from "../../../context/WeightContext";
import { showToast } from "../../../components/AppToast";
import OptionPicker from "../../../components/OptionPicker";
import Button from "../../../components/Button";
import { numberInRange } from "../../../utils/validation";
import { COLORS } from "../../../theme";

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
    showToast(`Weight updated to ${weight} kg`, "success");
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
    showToast(`Goal weight updated to ${goal} kg`, "success");
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
    showToast(`Height updated to ${heightValue} cm`, "success");
  };

  // Ortalanmış tema-uyumlu seçim modalı için ortak state
  const [picker, setPicker] = useState(null); // { key, title, options }

  const showWeightUnitsPicker = () =>
    setPicker({
      key: "weightUnits",
      title: "Weight Units",
      options: ["kg", "lbs", "st"],
    });

  const showHeightUnitsPicker = () =>
    setPicker({
      key: "heightUnits",
      title: "Height Units",
      options: ["cm", "ft", "in"],
    });

  const showRepeatPicker = () =>
    setPicker({
      key: "repeat",
      title: "Repeat",
      options: ["Everyday", "Weekly", "Bi-weekly", "Monthly"],
    });

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
          <Ionicons name="chevron-forward" size={20} color={COLORS.disabledText} />
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
        trackColor={{ false: COLORS.borderStrong, true: COLORS.danger }}
        thumbColor={value ? COLORS.surface : COLORS.surface}
      />
    </View>
  );

  const renderVolumeSlider = () => (
    <View style={styles.volumeContainer}>
      <Ionicons name="volume-low" size={20} color={COLORS.textSecondary} />
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
      <Ionicons name="volume-high" size={20} color={COLORS.textSecondary} />
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
    unit,
    max = 500
  ) => {
    // Inline doğrulama: değer 1..max aralığında olmalı (boşken hata gösterme)
    const err = String(value || "").trim()
      ? numberInRange(value, 1, max, title)
      : null;
    const invalid = !String(value || "").trim() || !!err;
    return (
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
              <Ionicons name="close" size={24} color={COLORS.textSecondary} />
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
            {err ? <Text style={styles.modalError}>{err}</Text> : null}
          </View>

          <View style={styles.modalButtons}>
            <Button
              title="Cancel"
              variant="secondary"
              fullWidth={false}
              style={styles.modalBtn}
              onPress={onClose}
            />
            <Button
              title="Save"
              fullWidth={false}
              style={styles.modalBtn}
              onPress={onSave}
              disabled={invalid}
            />
          </View>
        </View>
      </View>
    </Modal>
    );
  };

  const weightChange = getWeightChange();
  const goalProgress = getGoalProgress();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
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

        {/* Progress Photos */}
        <View style={styles.section}>
          {renderSettingItem("Progress Photos", "View & add", () =>
            navigation.navigate("ProgressPhotos")
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
            <Ionicons name="trending-down" size={24} color={COLORS.danger} />
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
                      ? COLORS.success
                      : weightChange.isPositive
                      ? COLORS.danger
                      : COLORS.textSecondary,
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
                  { color: goalProgress.isAchieved ? COLORS.success : COLORS.danger },
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
        "cm",
        300
      )}

      {/* Ortalanmış seçim modalı */}
      <OptionPicker
        visible={!!picker}
        title={picker?.title}
        options={picker?.options || []}
        selected={picker ? settings[picker.key] : null}
        onSelect={(value) => handleSettingChange(picker.key, value)}
        onClose={() => setPicker(null)}
      />

      {/* Bottom Navigation */}
      <BottomNavigation activeTab="Profile" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surfaceMuted,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerButton: {
    padding: 8,
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  scrollView: {
    flex: 1,
    paddingTop: 16,
  },
  section: {
    backgroundColor: COLORS.surface,
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
    borderBottomColor: COLORS.border,
  },
  settingLabel: {
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: "500",
  },
  settingRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingValue: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginRight: 8,
  },
  volumeContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  volumeSlider: {
    flex: 1,
    marginHorizontal: 16,
  },
  volumeTrack: {
    height: 4,
    backgroundColor: COLORS.borderStrong,
    borderRadius: 2,
    position: "relative",
  },
  volumeFill: {
    height: "100%",
    backgroundColor: COLORS.danger,
    borderRadius: 2,
  },
  volumeThumb: {
    position: "absolute",
    top: -8,
    width: 20,
    height: 20,
    backgroundColor: COLORS.danger,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: COLORS.surface,
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressSection: {
    backgroundColor: COLORS.surface,
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
    color: COLORS.textPrimary,
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
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.borderStrong,
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
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    margin: 20,
    width: "85%",
    maxWidth: 400,
    shadowColor: COLORS.shadow,
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
    color: COLORS.textPrimary,
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
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.danger,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.textPrimary,
    paddingVertical: 12,
  },
  inputUnit: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginLeft: 10,
  },
  modalError: {
    fontSize: 12,
    color: COLORS.danger,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  modalButtons: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 10,
  },
  modalBtn: {
    flex: 1,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: COLORS.border,
  },
  saveButton: {
    backgroundColor: COLORS.danger,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.textSecondary,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.surface,
  },
});

export default WeightTrackerScreen;
