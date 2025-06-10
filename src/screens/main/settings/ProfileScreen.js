// src/screens/main/settings/ProfileScreen.js - Updated with SignUp Data
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
  Alert,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { useSignUp } from "../../../context/SignUpContext";
import BottomNavigation from "../../../components/BottomNavigation";

const ProfileScreen = () => {
  const navigation = useNavigation();
  const { formData } = useSignUp();

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => {
          navigation.reset({
            index: 0,
            routes: [{ name: "Login" }],
          });
        },
      },
    ]);
  };

  const handleRateUs = () => {
    Alert.alert(
      "Rate Us",
      "Thank you for using our app! Please rate us on the App Store.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Rate Now",
          onPress: () => {
            console.log("Opening app store rating...");
          },
        },
      ]
    );
  };

  // SignUp verilerinden kullanıcı bilgilerini oluştur
  const getUserName = () => {
    if (formData && (formData.firstName || formData.lastName)) {
      return `${formData.firstName || ""} ${formData.lastName || ""}`.trim();
    }
    return "User Name"; // Default fallback
  };

  const getUserEmail = () => {
    return formData?.email || "user@example.com"; // Default fallback
  };

  const profileOption = {
    id: "personal-info",
    title: getUserName(),
    subtitle: getUserEmail(),
    hasProfileImage: true,
    route: "PersonalInfo",
  };

  const settingsOptions = [
    {
      id: "calorie-counter",
      title: "Calorie Counter",
      icon: "🔥",
      route: "CalorieCounter",
    },
    {
      id: "water-tracker",
      title: "Water Tracker",
      icon: "💧",
      route: "WaterTracker",
    },
    {
      id: "weight-tracker",
      title: "Weight Tracker",
      icon: "⚖️",
      route: "WeightTracker",
    },
    {
      id: "help-support",
      title: "Help & Support",
      icon: "💬",
      route: "HelpSupport",
    },
    {
      id: "rate-us",
      title: "Rate Us",
      icon: "⭐",
      action: handleRateUs,
    },
    {
      id: "logout",
      title: "Logout",
      hasCustomIcon: true,
      action: handleLogout,
      isDestructive: true,
    },
  ];

  const renderOption = (option) => {
    const handlePress = () => {
      if (option.action) {
        option.action();
      } else if (option.route) {
        navigation.navigate(option.route);
      }
    };

    return (
      <TouchableOpacity
        style={styles.optionItem}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View style={styles.optionLeft}>
          {option.hasProfileImage ? (
            <View style={styles.profileImageContainer}>
              <Image
                source={{
                  uri: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
                }}
                style={styles.profileImage}
              />
            </View>
          ) : option.hasCustomIcon ? (
            <View style={styles.iconContainer}>
              <Ionicons name="log-out-outline" size={24} color="#E74C3C" />
            </View>
          ) : (
            <View style={styles.iconContainer}>
              <Text style={styles.iconEmoji}>{option.icon}</Text>
            </View>
          )}

          <View style={styles.optionContent}>
            <Text
              style={[
                styles.optionTitle,
                option.isDestructive && styles.destructiveText,
              ]}
            >
              {option.title}
            </Text>
            {option.subtitle && (
              <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
            )}
          </View>
        </View>

        {!option.isDestructive && (
          <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Account Details</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Section - Ayrı blok */}
        <View style={styles.profileSection}>{renderOption(profileOption)}</View>

        {/* User Stats Section - Yeni eklenen */}
        {formData && formData.calculatedPlan && (
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>Your Plan</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {formData.calculatedPlan.dailyCalories}
                </Text>
                <Text style={styles.statLabel}>Daily Calories</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {formData.calculatedPlan.macros.carbs}g
                </Text>
                <Text style={styles.statLabel}>Carbs</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {formData.calculatedPlan.macros.protein}g
                </Text>
                <Text style={styles.statLabel}>Protein</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {formData.calculatedPlan.macros.fat}g
                </Text>
                <Text style={styles.statLabel}>Fat</Text>
              </View>
            </View>
          </View>
        )}

        {/* Settings Section - Ayrı blok */}
        <View style={styles.settingsSection}>
          {settingsOptions.map((option, index) => (
            <View key={option.id}>
              {renderOption(option)}
              {index < settingsOptions.length - 1 && (
                <View style={styles.separator} />
              )}
            </View>
          ))}
        </View>
      </ScrollView>

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
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: "#f8f9fa",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  profileSection: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  statsSection: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
    textAlign: "center",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statItem: {
    width: "48%",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#A1CE50",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  settingsSection: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  profileImageContainer: {
    marginRight: 16,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  iconContainer: {
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  iconEmoji: {
    fontSize: 24,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 14,
    color: "#666",
  },
  destructiveText: {
    color: "#E74C3C",
  },
  separator: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginLeft: 86,
  },
});

export default ProfileScreen;
