// src/screens/main/SavedArticlesScreen.js
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Dimensions,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { useBookmarks } from "../../../context/BookmarkContext";
import { getArticleById } from "../../../data/articlesData";
import BottomNavigation from "../../../components/BottomNavigation";

const { width } = Dimensions.get("window");

const SavedArticlesScreen = () => {
  const navigation = useNavigation();
  const { bookmarkedArticles, removeBookmark } = useBookmarks();

  const savedArticles = bookmarkedArticles
    .map((articleId) => getArticleById(articleId))
    .filter((article) => article !== undefined);

  const handleRemoveBookmark = async (articleId) => {
    await removeBookmark(articleId);
  };

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
          <Text style={styles.articleTitle} numberOfLines={2}>
            {article.shortTitle}
          </Text>
          <Text style={styles.articleDescription} numberOfLines={2}>
            {article.introduction}
          </Text>
          <View style={styles.articleMeta}>
            <Text style={styles.publishDate}>{article.publishDate}</Text>
            <View style={styles.metaDivider} />
            <Text style={styles.readTime}>{article.readTime}</Text>
          </View>
        </View>

        <View style={styles.rightContent}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: article.categoryColor + "20" },
            ]}
          >
            <Text style={styles.articleIcon}>{article.icon}</Text>
          </View>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveBookmark(article.id)}
          >
            <Ionicons name="bookmark" size={20} color="#63A4F4" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="bookmark-outline" size={64} color="#ccc" />
      </View>
      <Text style={styles.emptyTitle}>No Saved Articles</Text>
      <Text style={styles.emptyDescription}>
        Start saving articles you want to read later by tapping the bookmark
        icon.
      </Text>
      <TouchableOpacity
        style={styles.exploreButton}
        onPress={() => navigation.navigate("Articles")}
      >
        <Text style={styles.exploreButtonText}>Explore Articles</Text>
      </TouchableOpacity>
    </View>
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

        <Text style={styles.headerTitle}>Saved Articles</Text>

        <View style={styles.headerButton} />
      </View>

      {/* Content */}
      {savedArticles.length === 0 ? (
        renderEmptyState()
      ) : (
        <>
          {/* Stats */}
          <View style={styles.statsContainer}>
            <Text style={styles.statsText}>
              {savedArticles.length} saved article
              {savedArticles.length !== 1 ? "s" : ""}
            </Text>
          </View>

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.articlesContainer}>
              {savedArticles.map((article) => renderArticleCard(article))}
            </View>

            {/* Bottom Spacing */}
            <View style={styles.bottomSpacing} />
          </ScrollView>
        </>
      )}

      {/* Bottom Navigation - Updated to use component */}
      <BottomNavigation activeTab="Articles" />
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
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  statsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  statsText: {
    fontSize: 14,
    color: "#666",
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
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
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
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    lineHeight: 22,
    marginBottom: 8,
  },
  articleDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 12,
  },
  articleMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  publishDate: {
    fontSize: 12,
    color: "#999",
  },
  metaDivider: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#ccc",
    marginHorizontal: 8,
  },
  readTime: {
    fontSize: 12,
    color: "#999",
  },
  rightContent: {
    alignItems: "center",
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  articleIcon: {
    fontSize: 24,
  },
  removeButton: {
    padding: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
    textAlign: "center",
  },
  emptyDescription: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  exploreButton: {
    backgroundColor: "#63A4F4",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  exploreButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  bottomSpacing: {
    height: 20,
  },
});

export default SavedArticlesScreen;
