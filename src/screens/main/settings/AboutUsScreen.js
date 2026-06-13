// src/screens/main/settings/AboutUsScreen.js
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

const AboutUsScreen = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <ScreenHeader title="About Us" onBack={() => navigation.goBack()} />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.contentContainer}>
          <Text style={styles.paragraph}>
            At NutriTrack, we believe that health and wellness are not just
            goals—they're a lifestyle. Our mission is to empower individuals to
            take control of their well-being by providing an intuitive,
            data-driven platform that simplifies tracking and enhances
            self-care.
          </Text>

          <Text style={styles.paragraph}>
            We understand that every person's fitness journey is unique, and
            that's why NutriTrack is designed to adapt to your individual needs.
            Whether you're aiming to lose weight, stay active, or simply
            maintain a balanced lifestyle, our app offers the tools and insights
            to help you succeed.
          </Text>

          <Text style={styles.sectionTitle}>What We Stand For</Text>

          <View style={styles.standForItem}>
            <Text style={styles.standForTitle}>Innovation:</Text>
            <Text style={styles.standForText}>
              We harness the power of technology to create a seamless and
              personalized experience for our users.
            </Text>
          </View>

          <View style={styles.standForItem}>
            <Text style={styles.standForTitle}>Empowerment:</Text>
            <Text style={styles.standForText}>
              We aim to inspire confidence and independence on your journey to
              better health.
            </Text>
          </View>

          <View style={styles.standForItem}>
            <Text style={styles.standForTitle}>Community:</Text>
            <Text style={styles.standForText}>
              We're not just an app—we're a support system. Join a growing
              community of health enthusiasts and share your progress.
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Our Features</Text>

          <Text style={styles.paragraph}>
            From tracking calories and nutrition to monitoring your water
            intake, steps, and physical activities, NutriTrack integrates
            everything you need to achieve your health goals. Plus, we're
            constantly innovating to bring you new features and insights that
            make staying healthy easier than ever.
          </Text>

          <Text style={styles.sectionTitle}>Our Vision</Text>

          <Text style={styles.paragraph}>
            We envision a world where everyone has the tools and confidence to
            live their healthiest life. Through NutriTrack, we're making that
            vision a reality—one user at a time.
          </Text>
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
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.textSecondary,
    marginBottom: 16,
    textAlign: "justify",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginTop: 24,
    marginBottom: 16,
  },
  standForItem: {
    marginBottom: 16,
  },
  standForTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  standForText: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.textSecondary,
  },
});

export default AboutUsScreen;
