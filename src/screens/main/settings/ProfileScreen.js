// src/screens/main/settings/ProfileScreen.js
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
import { useSignUp } from "../../../context/SignUpContext";
import { useAuth } from "../../../context/AuthContext";
import { useMeals } from "../../../context/MealsContext";
import ScreenHeader from "../../../components/ScreenHeader";
import Card from "../../../components/Card";
import ListRow from "../../../components/ListRow";
import SectionHeader from "../../../components/SectionHeader";
import { showToast } from "../../../components/AppToast";
import PhotoStorage from "../../../services/PhotoStorage";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from "../../../theme";

const BIOMETRIC_KEY = "biometricEnabled";

const ProfileScreen = () => {
  const navigation = useNavigation();
  const { formData } = useSignUp();
  const { user } = useAuth();
  // Ana sayfayla aynı kaynak: backend ile senkronize kalori hedefleri (SSOT)
  const { calorieData } = useMeals();

  const [profilePhoto, setProfilePhoto] = useState(null);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  // Foto PersonalInfo'da değişebilir — her focus'ta tazele
  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        PhotoStorage.getProfilePhoto(user.id).then(setProfilePhoto);
      }
      AsyncStorage.getItem(BIOMETRIC_KEY).then((v) =>
        setBiometricEnabled(v === "1")
      );
    }, [user?.id])
  );

  const toggleBiometric = async (value) => {
    if (value) {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!hasHardware || !enrolled) {
        showToast("No biometrics enrolled on this device", "error");
        return;
      }
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Confirm to enable biometric login",
      });
      if (!result.success) return;
      await AsyncStorage.setItem(BIOMETRIC_KEY, "1");
      setBiometricEnabled(true);
      showToast("Biometric login enabled", "success");
    } else {
      await AsyncStorage.removeItem(BIOMETRIC_KEY);
      setBiometricEnabled(false);
      showToast("Biometric login disabled", "info");
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => {
          navigation.reset({ index: 0, routes: [{ name: "Login" }] });
        },
      },
    ]);
  };

  const handleRateUs = () => {
    Alert.alert(
      "Rate Us",
      "Thank you for using our app! Please rate us on the App Store.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Rate Now", onPress: () => {} },
      ]
    );
  };

  const getUserName = () => {
    if (formData && (formData.firstName || formData.lastName)) {
      return `${formData.firstName || ""} ${formData.lastName || ""}`.trim();
    }
    return "User Name";
  };

  const getUserEmail = () => formData?.email || "user@example.com";

  const stats = calorieData
    ? [
        { label: "Daily Calories", value: `${calorieData.calories}` },
        { label: "Carbs", value: `${calorieData.carbs}g` },
        { label: "Protein", value: `${calorieData.protein}g` },
        { label: "Fat", value: `${calorieData.fat}g` },
      ]
    : [];

  // Ayar satırları — tek tip ListRow ile
  const settingsOptions = [
    { id: "calorie-counter", title: "Calorie Counter", emoji: "🔥", route: "CalorieCounter" },
    { id: "water-tracker", title: "Water Tracker", emoji: "💧", route: "WaterTracker" },
    { id: "weight-tracker", title: "Weight Tracker", emoji: "⚖️", route: "WeightTracker" },
    { id: "biometric-login", title: "Biometric Login", emoji: "🔒", hasSwitch: true },
    { id: "help-support", title: "Help & Support", emoji: "💬", route: "HelpSupport" },
    { id: "rate-us", title: "Rate Us", emoji: "⭐", action: handleRateUs },
    { id: "logout", title: "Logout", ioniconName: "log-out-outline", action: handleLogout, destructive: true },
  ];

  return (
    <View style={styles.container}>
      <ScreenHeader title="Account Details" />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile header (avatar custom — ListRow image avatar desteklemiyor) */}
        <Card padded={false} style={styles.block}>
          <TouchableOpacity
            style={styles.profileRow}
            onPress={() => navigation.navigate("PersonalInfo")}
            activeOpacity={0.7}
          >
            <View style={styles.avatarWrap}>
              {profilePhoto ? (
                <Image
                  source={{ uri: `${profilePhoto.uri}?t=${profilePhoto.updatedAt}` }}
                  style={styles.avatarImage}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={28} color={COLORS.avatarIcon} />
                </View>
              )}
            </View>
            <View style={styles.profileText}>
              <Text style={styles.profileName}>{getUserName()}</Text>
              <Text style={styles.profileEmail}>{getUserEmail()}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.avatarIcon} />
          </TouchableOpacity>
        </Card>

        {/* Your Plan — MealsContext (ana sayfayla aynı SSOT) */}
        {calorieData && (
          <Card style={styles.block}>
            <SectionHeader title="Your Plan" center />
            <View style={styles.statsGrid}>
              {stats.map((s) => (
                <View key={s.label} style={styles.statItem}>
                  <Text style={styles.statValue}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Settings */}
        <Card padded={false} style={styles.block}>
          {settingsOptions.map((opt, index) => (
            <View key={opt.id}>
              <ListRow
                title={opt.title}
                emoji={opt.emoji}
                ioniconName={opt.ioniconName}
                destructive={opt.destructive}
                showChevron={!opt.hasSwitch}
                onPress={
                  opt.hasSwitch
                    ? undefined
                    : opt.action
                    ? opt.action
                    : () => navigation.navigate(opt.route)
                }
                right={
                  opt.hasSwitch ? (
                    <Switch
                      value={biometricEnabled}
                      onValueChange={toggleBiometric}
                      trackColor={{ false: COLORS.disabled, true: COLORS.primarySoft }}
                      thumbColor={biometricEnabled ? COLORS.primary : "#f4f3f4"}
                    />
                  ) : undefined
                }
              />
              {index < settingsOptions.length - 1 && (
                <View style={styles.separator} />
              )}
            </View>
          ))}
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surfaceMuted,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  block: {
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
  },
  avatarWrap: {
    marginRight: SPACING.lg,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.avatarBg,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  profileText: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  profileEmail: {
    ...TYPOGRAPHY.caption,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statItem: {
    width: "48%",
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.success,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    textAlign: "center",
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginLeft: SPACING.xl + 40 + SPACING.lg,
  },
});

export default ProfileScreen;
