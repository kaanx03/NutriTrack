// src/screens/main/settings/HelpSupportScreen.js
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import BottomNavigation from "../../../components/BottomNavigation";
import ScreenHeader from "../../../components/ScreenHeader";
import { COLORS } from "../../../theme";

const HelpSupportScreen = () => {
  const navigation = useNavigation();

  const helpOptions = [
    {
      id: "faq",
      title: "FAQ",
      route: "FAQ",
    },
    {
      id: "contact-support",
      title: "Contact Support",
      route: "ContactSupport",
    },
    {
      id: "privacy-policy",
      title: "Privacy Policy",
      route: "PrivacyPolicy",
    },
    {
      id: "terms-of-service",
      title: "Terms of Service",
      route: "TermsOfService",
    },
    {
      id: "about-us",
      title: "About Us",
      route: "AboutUs",
    },
  ];

  const renderOption = (option, index) => (
    <TouchableOpacity
      key={option.id}
      style={[
        styles.optionItem,
        index === helpOptions.length - 1 && styles.lastOptionItem,
      ]}
      onPress={() => navigation.navigate(option.route)}
      activeOpacity={0.7}
    >
      <Text style={styles.optionTitle}>{option.title}</Text>
      <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Help & Support"
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.optionsContainer}>
          {helpOptions.map((option, index) => renderOption(option, index))}
        </View>
      </ScrollView>

      {/* Bottom Navigation - Updated to use component */}
      <BottomNavigation activeTab="Profile" />
    </View>
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
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: COLORS.surfaceMuted,
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
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 20,
  },
  optionsContainer: {
    backgroundColor: COLORS.surface,
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
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  lastOptionItem: {
    borderBottomWidth: 0,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.textPrimary,
  },
});

export default HelpSupportScreen;
