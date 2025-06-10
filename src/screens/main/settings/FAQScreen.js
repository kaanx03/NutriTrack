// src/screens/main/settings/FAQScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import BottomNavigation from "../../../components/BottomNavigation";

const FAQScreen = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("General");
  const [expandedItems, setExpandedItems] = useState({});

  const categories = ["General", "Account", "Services", "Calorie Tr"];

  const faqData = {
    General: [
      {
        id: 1,
        question: "What is NutriTrack?",
        answer:
          "NutriTrack is a health and wellness app that helps you track calories, nutrition, water intake, steps, and more to achieve your fitness goals.",
      },
      {
        id: 2,
        question: "How does NutriTrack work?",
        answer:
          "NutriTrack allows you to log your meals, track physical activities, monitor water intake, and provides insights to help you maintain a healthy lifestyle. The app uses your data to provide personalized recommendations.",
      },
      {
        id: 3,
        question: "Is NutriTrack free to use?",
        answer:
          "NutriTrack offers both free and premium features. Basic tracking is free, while advanced features like detailed analytics and personalized meal plans require a premium subscription.",
      },
      {
        id: 4,
        question: "Is my data secure with NutriTrack?",
        answer:
          "Yes, we take data security seriously. We use industry-standard encryption and security measures to protect your personal information and health data.",
      },
      {
        id: 5,
        question: "Can I export my NutriTrack data?",
        answer:
          "Yes, you can export your data from NutriTrack. Go to Settings > Data Export to download your information in various formats.",
      },
      {
        id: 6,
        question: "Can I set personalized fitness goals in NutriTrack?",
        answer:
          "Absolutely! NutriTrack allows you to set custom goals for weight loss, muscle gain, calorie intake, water consumption, and daily activity levels.",
      },
      {
        id: 7,
        question: "Does NutriTrack provide meal suggestions?",
        answer:
          "Yes, our premium version includes personalized meal suggestions based on your dietary preferences, allergies, and fitness goals.",
      },
      {
        id: 8,
        question: "Does NutriTrack integrate with other fitness apps?",
        answer:
          "Yes, NutriTrack integrates with popular fitness apps and wearables like Apple Health, Google Fit, Fitbit, and more to sync your activity data.",
      },
    ],
    Account: [
      {
        id: 9,
        question: "How do I create an account?",
        answer:
          "Download the app and tap 'Sign Up'. Fill in your basic information like email, password, and health metrics to get started.",
      },
      {
        id: 10,
        question: "How do I reset my password?",
        answer:
          "On the login screen, tap 'Forgot Password?' and enter your email. We'll send you instructions to reset your password.",
      },
    ],
    Services: [
      {
        id: 11,
        question: "What services does NutriTrack offer?",
        answer:
          "NutriTrack offers calorie tracking, nutrition analysis, water intake monitoring, exercise logging, weight tracking, and personalized health insights.",
      },
      {
        id: 12,
        question: "How accurate is the calorie counting?",
        answer:
          "Our calorie database contains over 1 million foods with verified nutritional information. We also allow manual entry for maximum accuracy.",
      },
    ],
    "Calorie Tr": [
      {
        id: 13,
        question: "How do I log my meals?",
        answer:
          "Tap the '+' button on the home screen, select 'Food', then search for your meal or scan the barcode. You can also add custom recipes.",
      },
      {
        id: 14,
        question: "Can I track macro nutrients?",
        answer:
          "Yes! NutriTrack tracks carbohydrates, proteins, fats, fiber, sugar, and other micronutrients to give you a complete nutritional picture.",
      },
    ],
  };

  const toggleExpanded = (id) => {
    setExpandedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const filteredFAQs =
    faqData[selectedCategory]?.filter(
      (item) =>
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

  const renderFAQItem = (item) => {
    const isExpanded = expandedItems[item.id];

    return (
      <View key={item.id} style={styles.faqItem}>
        <TouchableOpacity
          style={styles.faqQuestion}
          onPress={() => toggleExpanded(item.id)}
          activeOpacity={0.7}
        >
          <Text style={styles.questionText}>{item.question}</Text>
          <Ionicons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={20}
            color="#666"
          />
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.faqAnswer}>
            <Text style={styles.answerText}>{item.answer}</Text>
          </View>
        )}
      </View>
    );
  };

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

        <Text style={styles.headerTitle}>FAQ</Text>

        <View style={styles.headerButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons
              name="search"
              size={20}
              color="#666"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search FAQ..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#999"
            />
          </View>
        </View>

        {/* Category Filters */}
        <View style={styles.categoriesContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScroll}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryButton,
                  selectedCategory === category &&
                    styles.selectedCategoryButton,
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory === category &&
                      styles.selectedCategoryText,
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* FAQ Items */}
        <View style={styles.faqContainer}>
          {filteredFAQs.length > 0 ? (
            filteredFAQs.map((item) => renderFAQItem(item))
          ) : (
            <View style={styles.noResultsContainer}>
              <Ionicons name="help-circle-outline" size={48} color="#ccc" />
              <Text style={styles.noResultsText}>No FAQs found</Text>
              <Text style={styles.noResultsSubtext}>
                Try adjusting your search or category filter
              </Text>
            </View>
          )}
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
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  categoriesContainer: {
    marginBottom: 20,
  },
  categoriesScroll: {
    paddingHorizontal: 20,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  selectedCategoryButton: {
    backgroundColor: "#A1CE50",
    borderColor: "#A1CE50",
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  selectedCategoryText: {
    color: "#FFFFFF",
  },
  faqContainer: {
    marginHorizontal: 20,
  },
  faqItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  faqQuestion: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  questionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginRight: 12,
  },
  faqAnswer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  answerText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#666",
    marginTop: 12,
  },
  noResultsContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
    marginBottom: 8,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
});

export default FAQScreen;
