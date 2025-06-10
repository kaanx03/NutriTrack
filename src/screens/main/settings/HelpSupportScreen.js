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

export default HelpSupportScreen;
