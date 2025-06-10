// src/context/BookmarkContext.js
import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BookmarkContext = createContext();

export const useBookmarks = () => {
  const context = useContext(BookmarkContext);
  if (!context) {
    throw new Error("useBookmarks must be used within a BookmarkProvider");
  }
  return context;
};

export const BookmarkProvider = ({ children }) => {
  const [bookmarkedArticles, setBookmarkedArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load bookmarks from AsyncStorage on app start
  useEffect(() => {
    loadBookmarks();
  }, []);

  const loadBookmarks = async () => {
    try {
      const bookmarks = await AsyncStorage.getItem("bookmarkedArticles");
      if (bookmarks) {
        setBookmarkedArticles(JSON.parse(bookmarks));
      }
    } catch (error) {
      console.error("Error loading bookmarks:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveBookmarks = async (bookmarks) => {
    try {
      await AsyncStorage.setItem(
        "bookmarkedArticles",
        JSON.stringify(bookmarks)
      );
    } catch (error) {
      console.error("Error saving bookmarks:", error);
    }
  };

  const addBookmark = async (articleId) => {
    if (!bookmarkedArticles.includes(articleId)) {
      const newBookmarks = [...bookmarkedArticles, articleId];
      setBookmarkedArticles(newBookmarks);
      await saveBookmarks(newBookmarks);
    }
  };

  const removeBookmark = async (articleId) => {
    const newBookmarks = bookmarkedArticles.filter((id) => id !== articleId);
    setBookmarkedArticles(newBookmarks);
    await saveBookmarks(newBookmarks);
  };

  const isBookmarked = (articleId) => {
    return bookmarkedArticles.includes(articleId);
  };

  const toggleBookmark = async (articleId) => {
    if (isBookmarked(articleId)) {
      await removeBookmark(articleId);
    } else {
      await addBookmark(articleId);
    }
  };

  const value = {
    bookmarkedArticles,
    addBookmark,
    removeBookmark,
    isBookmarked,
    toggleBookmark,
    loading,
  };

  return (
    <BookmarkContext.Provider value={value}>
      {children}
    </BookmarkContext.Provider>
  );
};
