// src/screens/main/articles/ArticleDetailsScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Share,
  Alert,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { getArticleById } from "../../../data/articlesData";
import { useBookmarks } from "../../../context/BookmarkContext";
import ShareModal from "../../../components/ShareModal";
import BottomNavigation from "../../../components/BottomNavigation";

const ArticleDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { articleId } = route.params;

  const article = getArticleById(articleId);
  const [showShareModal, setShowShareModal] = useState(false);
  const { isBookmarked, toggleBookmark } = useBookmarks();

  if (!article) {
    return (
      <SafeAreaView style={styles.container}>
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

  const handleShare = () => {
    setShowShareModal(true);
  };

  const handleBookmark = async () => {
    await toggleBookmark(articleId);
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

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleBookmark}
          >
            <Ionicons
              name={isBookmarked(articleId) ? "bookmark" : "bookmark-outline"}
              size={24}
              color={isBookmarked(articleId) ? "#63A4F4" : "#333"}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
            <Ionicons name="share-outline" size={24} color="#333" />
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

      {/* Share Modal */}
      <ShareModal
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
        article={article}
      />
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
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
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
    backgroundColor: "#FFFFFF",
    padding: 20,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
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
    color: "#333",
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
    color: "#666",
  },
  metaDivider: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#ccc",
    marginHorizontal: 8,
  },
  readTime: {
    fontSize: 14,
    color: "#666",
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
    backgroundColor: "#FFFFFF",
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
    color: "#333",
    marginBottom: 12,
  },
  sectionContent: {
    fontSize: 16,
    lineHeight: 24,
    color: "#555",
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
    color: "#666",
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: "#63A4F4",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default ArticleDetailsScreen;
