// src/screens/main/settings/TermsOfServiceScreen.js
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView} from "react-native";
import { useNavigation } from "@react-navigation/native";
import BottomNavigation from "../../../components/BottomNavigation";
import ScreenHeader from "../../../components/ScreenHeader";
import { COLORS } from "../../../theme";

const TermsOfServiceScreen = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Terms of Service"
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
            <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
            <Text style={styles.paragraph}>
              By downloading or using NutriTrack, you agree to comply with and
              be bound by these Terms of Service. If you do not agree, please do
              not use the app.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. User Accounts</Text>

            <View style={styles.bulletPoint}>
              <Text style={styles.bulletText}>•</Text>
              <Text style={styles.bulletContent}>
                <Text style={styles.boldText}>Registration:</Text> To use
                NutriTrack, you must create an account by providing accurate and
                complete information. You are responsible for maintaining the
                confidentiality of your account details.
              </Text>
            </View>

            <View style={styles.bulletPoint}>
              <Text style={styles.bulletText}>•</Text>
              <Text style={styles.bulletContent}>
                <Text style={styles.boldText}>Eligibility:</Text> You must be at
                least 13 years old to use NutriTrack. If you are under 18,
                parental consent is required.
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. Use of the App</Text>

            <View style={styles.bulletPoint}>
              <Text style={styles.bulletText}>•</Text>
              <Text style={styles.bulletContent}>
                <Text style={styles.boldText}>Personal Use:</Text> NutriTrack is
                intended for personal, non-commercial use.
              </Text>
            </View>

            <View style={styles.bulletPoint}>
              <Text style={styles.bulletText}>•</Text>
              <Text style={styles.bulletContent}>
                <Text style={styles.boldText}>Prohibited Activities:</Text> You
                agree not to misuse the app by attempting to access NutriTrack's
                systems, disrupt its operations, or engage in any unlawful
                activities.
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. Limitation of Liability</Text>
            <Text style={styles.paragraph}>
              NutriTrack is provided "as is" without warranties of any kind. We
              are not liable for any direct, indirect, or incidental damages
              arising from your use of the app.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. Changes to Terms</Text>
            <Text style={styles.paragraph}>
              NutriTrack reserves the right to modify these Terms of Service at
              any time. Updates will be communicated through the app or email.
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
    shadowColor: COLORS.shadow,
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
    color: COLORS.textSecondary,
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
    color: COLORS.textSecondary,
  },
  boldText: {
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
});

export default TermsOfServiceScreen;
