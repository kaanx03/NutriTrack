// src/screens/main/settings/WaterTrackerScreen.js
import React, { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  TextInput,
  Modal,
  LayoutAnimation
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import Slider from "@react-native-community/slider";
import BottomNavigation from "../../../components/BottomNavigation";
import OptionPicker from "../../../components/OptionPicker";
import { showToast } from "../../../components/AppToast";
import Button from "../../../components/Button";
import { useWater } from "../../../context/WaterContext";
import NotificationService, {
  WATER_SETTINGS_KEY,
} from "../../../services/NotificationService";
import { COLORS } from "../../../theme";

const WaterTrackerScreen = () => {
  const navigation = useNavigation();
  const { waterGoal, updateWaterGoal } = useWater();

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

  // Ayarları kalıcı yap — yoksa ekrandan çıkınca sıfırlanıyordu
  useEffect(() => {
    AsyncStorage.getItem(WATER_SETTINGS_KEY).then((raw) => {
      if (raw) {
        try {
          setSettings((prev) => ({ ...prev, ...JSON.parse(raw) }));
        } catch (e) {
          // bozuk kayıt — varsayılanlarla devam
        }
      }
    });
  }, []);

  const handleSettingChange = (key, value) => {
    // Açılır/kapanır bölümler (ör. Drink Reminder) yumuşak geçsin
    if (key === "drinkReminder") {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    const next = { ...settings, [key]: value };
    setSettings(next);
    AsyncStorage.setItem(WATER_SETTINGS_KEY, JSON.stringify(next)).catch(
      () => {}
    );

    const reminderOptions = {
      intervalHours: 2,
      ringtone: next.ringtone,
      soundEnabled: next.volume > 0,
      vibrationEnabled: next.vibration,
    };

    // Hatırlatıcıyı gerçek yerel bildirimlere bağla
    if (key === "drinkReminder") {
      if (value) {
        NotificationService.scheduleWaterReminder(reminderOptions).then(
          (result) => {
            if (result.success) {
              showToast("Water reminders enabled (every 2 hours)", "success");
            } else if (result.reason === "permission") {
              showToast("Notification permission denied", "error");
            } else {
              showToast(
                "Notifications are not supported in this environment",
                "info"
              );
            }
          }
        );
      } else {
        NotificationService.cancelWaterReminders();
        showToast("Water reminders disabled", "info");
      }
    }

    // Ses, zil sesi veya titreşim değiştiyse hatırlatıcıyı yeni ayarlarla yeniden kur
    if (
      ["volume", "ringtone", "vibration"].includes(key) &&
      next.drinkReminder
    ) {
      NotificationService.scheduleWaterReminder(reminderOptions);
    }
  };

  // Bildirimi anında test etmek için
  const handleTestNotification = async () => {
    const result = await NotificationService.sendTestNotification({
      ringtone: settings.ringtone,
      soundEnabled: settings.volume > 0,
      vibrationEnabled: settings.vibration,
    });
    if (result.success) {
      showToast("Test notification will arrive in 5 seconds", "success");
    } else if (result.reason === "permission") {
      showToast("Notification permission denied", "error");
    } else {
      showToast("Notifications are not supported in this environment", "info");
    }
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

    // WaterContext'i güncelle (backend'e de kaydeder)
    updateWaterGoal(numericValue);

    setGoalModalVisible(false);

    showToast(`Daily water goal set to ${numericValue} mL`, "success");
  };

  // Ortalanmış tema-uyumlu seçim modalı (OptionPicker) için ortak state
  const [picker, setPicker] = useState(null); // { key, title, options }

  const showUnitsPicker = () =>
    setPicker({
      key: "cupUnits",
      title: "Select Units",
      options: ["mL", "L", "fl oz", "cups"],
    });

  const showRepeatPicker = () =>
    setPicker({
      key: "repeat",
      title: "Repeat",
      options: ["Everyday", "Weekdays", "Weekends", "Custom"],
    });

  const showReminderModePicker = () =>
    setPicker({
      key: "reminderMode",
      title: "Reminder Mode",
      options: ["Static", "Smart", "Adaptive"],
    });

  const showRingtonePicker = () =>
    setPicker({
      key: "ringtone",
      title: "Select Ringtone",
      options: ["Harmony", "Droplet", "Ocean", "Rain", "Classic"],
    });

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
        thumbColor={value ? COLORS.surface : COLORS.surface}
      />
    </View>
  );

  const renderVolumeSlider = () => (
    <View style={styles.volumeContainer}>
      <Ionicons name="volume-low" size={20} color={COLORS.textSecondary} />
      <Slider
        style={styles.volumeSlider}
        minimumValue={0}
        maximumValue={1}
        value={settings.volume}
        onSlidingComplete={(value) => handleSettingChange("volume", value)}
        minimumTrackTintColor={COLORS.water}
        maximumTrackTintColor={COLORS.disabled}
        thumbTintColor={COLORS.water}
      />
      <Ionicons name="volume-high" size={20} color={COLORS.textSecondary} />
    </View>
  );

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

              {renderSettingItem(
                "Test Notification",
                "Send now",
                handleTestNotification
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
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
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
              <Button
                title="Cancel"
                variant="secondary"
                fullWidth={false}
                style={styles.modalBtn}
                onPress={() => setGoalModalVisible(false)}
              />
              <Button
                title="Save Goal"
                fullWidth={false}
                style={styles.modalBtn}
                onPress={handleGoalSave}
              />
            </View>
          </View>
        </View>
      </Modal>

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
    borderColor: COLORS.surface,
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
    backgroundColor: COLORS.surface,
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
    color: COLORS.textPrimary,
    marginLeft: 12,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.textSecondary,
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
    backgroundColor: COLORS.surface,
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
    borderColor: "#4ECDC4",
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
  helperText: {
    fontSize: 12,
    color: COLORS.textTertiary,
    fontStyle: "italic",
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
    backgroundColor: "#4ECDC4",
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

export default WaterTrackerScreen;
