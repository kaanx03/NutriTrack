// src/screens/main/articles/ArticlesScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Dimensions,
  TextInput,
  Animated,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { articlesData, getAllArticles } from "../../../data/articlesData";
import BottomNavigation from "../../../components/BottomNavigation";

const { width } = Dimensions.get("window");

const ArticlesScreen = () => {
  const navigation = useNavigation();
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchAnimation] = useState(new Animated.Value(0));

  const allArticles = getAllArticles();

  const filteredArticles = searchQuery
    ? allArticles.filter(
        (article) =>
          article.shortTitle
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          article.introduction
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          article.categoryTitle
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
      )
    : [];

  const toggleSearch = () => {
    setSearchVisible(!searchVisible);
    Animated.timing(searchAnimation, {
      toValue: searchVisible ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();

    if (searchVisible) {
      setSearchQuery("");
    }
  };

  const renderSearchResults = () => {
    if (!searchQuery) return null;

    return (
      <View style={styles.searchResults}>
        <Text style={styles.searchResultsTitle}>
          Search Results ({filteredArticles.length})
        </Text>
        {filteredArticles.length === 0 ? (
          <View style={styles.noResultsContainer}>
            <Ionicons name="search-outline" size={48} color="#ccc" />
            <Text style={styles.noResultsText}>No articles found</Text>
            <Text style={styles.noResultsSubtext}>
              Try searching with different keywords
            </Text>
          </View>
        ) : (
          <View style={styles.searchArticlesGrid}>
            {filteredArticles.map((article) =>
              renderArticleCard(article, article.categoryColor, true)
            )}
          </View>
        )}
      </View>
    );
  };

  const renderArticleCard = (
    article,
    categoryColor,
    isSearchResult = false
  ) => (
    <TouchableOpacity
      key={article.id}
      style={[styles.articleCard, isSearchResult && styles.searchArticleCard]}
      onPress={() =>
        navigation.navigate("ArticleDetails", { articleId: article.id })
      }
      activeOpacity={0.7}
    >
      <View style={styles.articleContent}>
        <View style={styles.articleInfo}>
          {isSearchResult && (
            <View
              style={[
                styles.categoryBadge,
                { backgroundColor: categoryColor + "20" },
              ]}
            >
              <Text
                style={[styles.categoryBadgeText, { color: categoryColor }]}
              >
                {article.categoryTitle}
              </Text>
            </View>
          )}
          <Text style={styles.articleTitle} numberOfLines={2}>
            {isSearchResult ? article.shortTitle : article.title}
          </Text>
          {isSearchResult && (
            <Text style={styles.articleDescription} numberOfLines={2}>
              {article.introduction}
            </Text>
          )}
          <Text style={styles.readTime}>{article.readTime}</Text>
        </View>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: categoryColor + "20" },
          ]}
        >
          <Text style={styles.articleIcon}>{article.icon}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderCategory = (categoryKey) => {
    const category = articlesData[categoryKey];

    return (
      <View key={categoryKey} style={styles.categorySection}>
        <View style={styles.categoryHeader}>
          <Text style={styles.categoryTitle}>{category.title}</Text>
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() =>
              navigation.navigate("CategoryArticles", { categoryKey })
            }
          >
            <Text style={[styles.viewAllText, { color: category.color }]}>
              View All
            </Text>
            <Ionicons
              name="arrow-forward"
              size={16}
              color={category.color}
              style={styles.viewAllIcon}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.articlesGrid}>
          {category.articles
            .slice(0, 4)
            .map((article) => renderArticleCard(article, category.color))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Articles</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate("SavedArticles")}
          >
            <Ionicons name="bookmark-outline" size={24} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={toggleSearch}>
            <Ionicons
              name={searchVisible ? "close" : "search"}
              size={24}
              color="#333"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <Animated.View
        style={[
          styles.searchContainer,
          {
            height: searchAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 60],
            }),
            opacity: searchAnimation,
          },
        ]}
      >
        <View style={styles.searchInputContainer}>
          <Ionicons
            name="search"
            size={20}
            color="#666"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search articles..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
            autoFocus={searchVisible}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Results */}
        {searchQuery
          ? renderSearchResults()
          : /* Categories */
            Object.keys(articlesData).map((categoryKey) =>
              renderCategory(categoryKey)
            )}
      </ScrollView>

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
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333",
  },
  headerRight: {
    flexDirection: "row",
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  searchContainer: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    overflow: "hidden",
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  clearButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  searchResults: {
    paddingTop: 20,
  },
  searchResultsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  searchArticlesGrid: {
    flexDirection: "column",
  },
  searchArticleCard: {
    width: "100%",
    marginBottom: 16,
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
  categorySection: {
    marginTop: 24,
    marginBottom: 8,
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: "500",
    marginRight: 4,
  },
  viewAllIcon: {
    marginTop: 1,
  },
  articlesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  articleCard: {
    width: (width - 60) / 2,
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
    marginRight: 12,
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
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    lineHeight: 20,
    marginBottom: 8,
  },
  articleDescription: {
    fontSize: 12,
    color: "#666",
    lineHeight: 16,
    marginBottom: 8,
  },
  readTime: {
    fontSize: 12,
    color: "#666",
    fontWeight: "400",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  articleIcon: {
    fontSize: 20,
  },
});

export default ArticlesScreen;
