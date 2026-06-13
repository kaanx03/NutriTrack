// src/screens/main/CategoryArticlesScreen.js
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { getArticlesByCategory } from "../../../data/articlesData";
import BottomNavigation from "../../../components/BottomNavigation";
import { COLORS } from "../../../theme";

const { width } = Dimensions.get("window");

const CategoryArticlesScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { categoryKey } = route.params;

  const categoryData = getArticlesByCategory(categoryKey);

  if (!categoryData) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Category not found</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const renderArticleCard = (article) => (
    <TouchableOpacity
      key={article.id}
      style={styles.articleCard}
      onPress={() =>
        navigation.navigate("ArticleDetails", { articleId: article.id })
      }
      activeOpacity={0.7}
    >
      <View style={styles.articleContent}>
        <View style={styles.articleInfo}>
          <Text style={styles.articleTitle} numberOfLines={2}>
            {article.title}
          </Text>
          <Text style={styles.articleDescription} numberOfLines={3}>
            {article.introduction}
          </Text>
          <View style={styles.articleMeta}>
            <Text style={styles.publishDate}>{article.publishDate}</Text>
            <View style={styles.metaDivider} />
            <Text style={styles.readTime}>{article.readTime}</Text>
          </View>
        </View>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: categoryData.color + "20" },
          ]}
        >
          <Text style={styles.articleIcon}>{article.icon}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>{categoryData.title}</Text>

        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="search" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Category Info */}
      <View
        style={[
          styles.categoryInfo,
          { backgroundColor: categoryData.color + "10" },
        ]}
      >
        <Text style={styles.categoryDescription}>
          Explore all articles about {categoryData.title.toLowerCase()}
        </Text>
        <Text style={styles.articleCount}>
          {categoryData.articles.length} article
          {categoryData.articles.length !== 1 ? "s" : ""}
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.articlesContainer}>
          {categoryData.articles.map((article) => renderArticleCard(article))}
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Bottom Navigation - Updated to use component */}
      <BottomNavigation activeTab="Articles" />
    </SafeAreaView>
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
    paddingVertical: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  categoryInfo: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  categoryDescription: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  articleCount: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  articlesContainer: {
    paddingTop: 20,
  },
  articleCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  articleContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  articleInfo: {
    flex: 1,
    marginRight: 16,
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
    lineHeight: 22,
    marginBottom: 8,
  },
  articleDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  articleMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  publishDate: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  metaDivider: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.borderStrong,
    marginHorizontal: 8,
  },
  readTime: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  articleIcon: {
    fontSize: 24,
  },
  bottomSpacing: {
    height: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: COLORS.textSecondary,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: "600",
  },
});

export default CategoryArticlesScreen;
