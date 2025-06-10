// src/screens/main/settings/CalorieCounterScreen.js
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
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";

const CalorieCounterScreen = () => {
  const navigation = useNavigation();

  const [settings, setSettings] = useState({
    calorieIntakeGoal: "2.560 kcal",
    units: "kcal",
    mealLoggingReminder: true,
    repeat: "Everyday",
    reminderTime: "08:00 AM",
    ringtone: "Lollipop",
    volume: 0.7,
    vibration: false,
    stopWhenComplete: false,
  });

  const handleSettingChange = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const showGoalPicker = () => {
    Alert.alert("Calorie Intake Goal", "Enter your daily calorie goal", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Set Goal",
        onPress: () => {
          // In a real app, this would open a number picker
          handleSettingChange("calorieIntakeGoal", "2.800 kcal");
        },
      },
    ]);
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
        </View>

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

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("Home")}
        >
          <Ionicons name="home-outline" size={24} color="#999" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("Tracker")}
        >
          <Ionicons name="grid-outline" size={24} color="#999" />
          <Text style={styles.navText}>Tracker</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("Insights")}
        >
          <Ionicons name="stats-chart-outline" size={24} color="#999" />
          <Text style={styles.navText}>Insights</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("Articles")}
        >
          <Ionicons name="newspaper-outline" size={24} color="#999" />
          <Text style={styles.navText}>Articles</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.navItem, styles.activeNavItem]}>
          <Ionicons name="person" size={24} color="#63A4F4" />
          <Text style={[styles.navText, styles.activeNavText]}>Profile</Text>
        </TouchableOpacity>
      </View>
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
  bottomNav: {
    flexDirection: "row",
    height: 80,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingBottom: 20,
  },
  navItem: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  activeNavItem: {
    borderTopWidth: 2,
    borderTopColor: "#63A4F4",
  },
  navText: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
    fontWeight: "500",
  },
  activeNavText: {
    color: "#63A4F4",
  },
});

export default CalorieCounterScreen;
