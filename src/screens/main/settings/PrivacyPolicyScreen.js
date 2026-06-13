// src/screens/main/settings/PrivacyPolicyScreen.js
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView} from "react-native";
import { useNavigation } from "@react-navigation/native";
import BottomNavigation from "../../../components/BottomNavigation";
import ScreenHeader from "../../../components/ScreenHeader";
import { COLORS } from "../../../theme";

const PrivacyPolicyScreen = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Privacy Policy"
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.contentContainer}>
          <View style={styles.effectiveDate}>
            <Text style={styles.effectiveDateText}>
              Effective Date: January 20, 2025
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Introduction</Text>
            <Text style={styles.paragraph}>
              Welcome to NutriTrack! We value your privacy and are committed to
              protecting your personal data. This Privacy Policy explains how we
              collect, use, and safeguard your information when you use our app.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Information We Collect</Text>

            <View style={styles.bulletPoint}>
              <Text style={styles.bulletText}>•</Text>
              <Text style={styles.bulletContent}>
                <Text style={styles.boldText}>Personal Information:</Text> When
                you sign up for NutriTrack, we may collect your name, email
                address, gender, birthdate, height, weight, and activity level.
              </Text>
            </View>

            <View style={styles.bulletPoint}>
              <Text style={styles.bulletText}>•</Text>
              <Text style={styles.bulletContent}>
                <Text style={styles.boldText}>Usage Data:</Text> We collect data
                on how you use NutriTrack, including logged meals, water intake,
                exercise, and other activities.
              </Text>
            </View>

            <View style={styles.bulletPoint}>
              <Text style={styles.bulletText}>•</Text>
              <Text style={styles.bulletContent}>
                <Text style={styles.boldText}>Device Information:</Text> We may
                collect data about your device, such as IP address, operating
                system, and device model.
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              3. How We Use Your Information
            </Text>

            <View style={styles.bulletPoint}>
              <Text style={styles.bulletText}>•</Text>
              <Text style={styles.bulletContent}>
                <Text style={styles.boldText}>Personalization:</Text> We use
                your data to customize your experience, including creating
                tailored meal plans and fitness goals.
              </Text>
            </View>

            <View style={styles.bulletPoint}>
              <Text style={styles.bulletText}>•</Text>
              <Text style={styles.bulletContent}>
                <Text style={styles.boldText}>Improvement:</Text> Your data
                helps us enhance app features and fix bugs.
              </Text>
            </View>

            <View style={styles.bulletPoint}>
              <Text style={styles.bulletText}>•</Text>
              <Text style={styles.bulletContent}>
                <Text style={styles.boldText}>Communication:</Text> We may use
                your email to send updates, notifications, or promotional
                offers.
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. Data Protection</Text>
            <Text style={styles.paragraph}>
              We implement industry-standard security measures to protect your
              data from unauthorized access, alteration, disclosure, or
              destruction.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. Data Sharing</Text>
            <Text style={styles.paragraph}>
              We do not sell, trade, or rent your personal information to third
              parties. We may share aggregated, anonymized data for research and
              improvement purposes.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>6. Your Rights</Text>
            <Text style={styles.paragraph}>
              You have the right to access, update, or delete your personal
              information. Contact us if you wish to exercise these rights.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>7. Contact Us</Text>
            <Text style={styles.paragraph}>
              If you have questions about this Privacy Policy, please contact us
              at privacy@nutritrack.com.
            </Text>
          </View>
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
  contentContainer: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  effectiveDate: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    marginBottom: 24,
  },
  effectiveDateText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: "#555",
    textAlign: "justify",
  },
  bulletPoint: {
    flexDirection: "row",
    marginBottom: 12,
  },
  bulletText: {
    fontSize: 16,
    color: COLORS.textPrimary,
    marginRight: 8,
    marginTop: 2,
  },
  bulletContent: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: "#555",
  },
  boldText: {
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
});

export default PrivacyPolicyScreen;
