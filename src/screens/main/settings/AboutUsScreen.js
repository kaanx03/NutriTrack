// src/screens/main/settings/AboutUsScreen.js
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

const AboutUsScreen = () => {
  const navigation = useNavigation();

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

        <Text style={styles.headerTitle}>About Us</Text>

        <View style={styles.headerButton} />
      </View>

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
  contentContainer: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: "#555",
    marginBottom: 16,
    textAlign: "justify",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginTop: 24,
    marginBottom: 16,
  },
  standForItem: {
    marginBottom: 16,
  },
  standForTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  standForText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#555",
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

export default AboutUsScreen;
