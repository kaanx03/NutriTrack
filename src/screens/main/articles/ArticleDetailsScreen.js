// src/screens/main/articles/ArticleDetailsScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Share,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { getArticleById } from "../../../data/articlesData";
import { useBookmarks } from "../../../context/BookmarkContext";
import BottomNavigation from "../../../components/BottomNavigation";
import { COLORS } from "../../../theme";

const ArticleDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { articleId } = route.params;

  const article = getArticleById(articleId);
  const { isBookmarked, toggleBookmark } = useBookmarks();

  if (!article) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Article not found</Text>
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

  // Gerçek native paylaşım sayfası — sahte kişiler yerine OS'un kendi
  // paylaşım ekranı (tüm kurulu uygulamalar + kişiler) açılır.
  const handleShare = async () => {
    try {
      const title = article.title || article.shortTitle || "NutriTrack";
      const intro = article.introduction ? `\n\n${article.introduction}` : "";
      await Share.share({
        title,
        message: `${title}${intro}\n\nShared from NutriTrack`,
      });
    } catch (error) {
      // Kullanıcı iptal etti veya paylaşım başarısız — sessiz geç
    }
  };

  const handleBookmark = async () => {
    await toggleBookmark(articleId);
  };

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

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleBookmark}
          >
            <Ionicons
              name={isBookmarked(articleId) ? "bookmark" : "bookmark-outline"}
              size={24}
              color={isBookmarked(articleId) ? COLORS.primary : COLORS.textPrimary}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
            <Ionicons name="share-outline" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Article Header */}
        <View style={styles.articleHeader}>
          <View
            style={[
              styles.categoryBadge,
              { backgroundColor: article.categoryColor + "20" },
            ]}
          >
            <Text
              style={[
                styles.categoryBadgeText,
                { color: article.categoryColor },
              ]}
            >
              {article.categoryTitle}
            </Text>
          </View>

          <Text style={styles.articleTitle}>{article.shortTitle}</Text>

          <View style={styles.articleMeta}>
            <Text style={styles.publishDate}>
              Published on {article.publishDate}
            </Text>
            <View style={styles.metaDivider} />
            <Text style={styles.readTime}>{article.readTime}</Text>
          </View>

          <View
            style={[
              styles.iconContainer,
              { backgroundColor: article.categoryColor + "20" },
            ]}
          >
            <Text style={styles.articleIcon}>{article.icon}</Text>
          </View>
        </View>

        {/* Article Content */}
        <View style={styles.articleContent}>
          {/* Introduction */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Introduction:</Text>
            <Text style={styles.sectionContent}>{article.introduction}</Text>
          </View>

          {/* Article Sections */}
          {article.sections.map((section, index) => (
            <View key={index} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionContent}>{section.content}</Text>
            </View>
          ))}
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
  headerActions: {
    flexDirection: "row",
  },
  scrollView: {
    flex: 1,
  },
  articleHeader: {
    backgroundColor: COLORS.surface,
    padding: 20,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  articleTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.textPrimary,
    textAlign: "center",
    lineHeight: 32,
    marginBottom: 16,
  },
  articleMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  publishDate: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  metaDivider: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.borderStrong,
    marginHorizontal: 8,
  },
  readTime: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  articleIcon: {
    fontSize: 40,
  },
  articleContent: {
    backgroundColor: COLORS.surface,
    margin: 20,
    borderRadius: 16,
    padding: 20,
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
  sectionContent: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.textSecondary,
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

export default ArticleDetailsScreen;
