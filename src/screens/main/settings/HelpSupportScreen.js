// src/screens/main/settings/HelpSupportScreen.js
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import BottomNavigation from "../../../components/BottomNavigation";

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
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Help & Support</Text>

        <View style={styles.headerButton} />
      </View>

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
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: "#f8f9fa",
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
  scrollContent: {
    paddingBottom: 20,
  },
  optionsContainer: {
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
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  lastOptionItem: {
    borderBottomWidth: 0,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
});

export default HelpSupportScreen;
