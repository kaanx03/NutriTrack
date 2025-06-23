// backend/src/routes/articles.js - Articles management (saved articles)
const express = require("express");
const db = require("../db");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// ===============================
// SAVED ARTICLES MANAGEMENT
// ===============================

// Kullanıcının kaydettiği makaleleri al
router.get("/saved", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { category, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT * FROM saved_articles 
      WHERE user_id = $1
    `;
    let params = [userId];
    let paramCount = 2;

    // Kategori filtresi
    if (category && category !== "all") {
      query += ` AND article_category = $${paramCount}`;
      params.push(category);
      paramCount++;
    }

    query += ` ORDER BY saved_at DESC LIMIT $${paramCount} OFFSET $${
      paramCount + 1
    }`;
    params.push(parseInt(limit), parseInt(offset));

    const savedArticles = await db.query(query, params);

    // Toplam sayıyı al
    let countQuery = "SELECT COUNT(*) FROM saved_articles WHERE user_id = $1";
    let countParams = [userId];

    if (category && category !== "all") {
      countQuery += " AND article_category = $2";
      countParams.push(category);
    }

    const totalCount = await db.query(countQuery, countParams);

    res.json({
      success: true,
      data: savedArticles.rows,
      pagination: {
        total: parseInt(totalCount.rows[0].count),
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore:
          parseInt(offset) + savedArticles.rows.length <
          parseInt(totalCount.rows[0].count),
      },
    });
  } catch (err) {
    console.error("Get saved articles error:", err);
    res.status(500).json({
      error: "Server error",
      details: "Failed to fetch saved articles",
    });
  }
});

// Makaleyi kaydet
router.post("/saved", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const {
      articleId,
      articleTitle,
      articleCategory,
      articleUrl,
      articleSummary,
      articleAuthor,
      articlePublishDate,
    } = req.body;

    // Validasyon
    if (!articleId || !articleTitle) {
      return res.status(400).json({
        error: "Missing required fields",
        details: "articleId and articleTitle are required",
      });
    }

    // Zaten kaydedilmiş mi kontrol et
    const existing = await db.query(
      "SELECT id FROM saved_articles WHERE user_id = $1 AND article_id = $2",
      [userId, articleId]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        error: "Article already saved",
        details: "This article is already in your saved articles",
      });
    }

    // Makaleyi kaydet
    const result = await db.query(
      `INSERT INTO saved_articles (user_id, article_id, article_title, article_category)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [userId, articleId, articleTitle, articleCategory]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: "Article saved successfully",
    });
  } catch (err) {
    console.error("Save article error:", err);
    res.status(500).json({
      error: "Server error",
      details: "Failed to save article",
    });
  }
});

// Kaydedilen makaleyi sil
router.delete("/saved/:articleId", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { articleId } = req.params;

    const result = await db.query(
      "DELETE FROM saved_articles WHERE user_id = $1 AND article_id = $2 RETURNING *",
      [userId, articleId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Article not found",
        details: "Article not found in your saved articles",
      });
    }

    res.json({
      success: true,
      message: "Article removed from saved articles successfully",
      removedArticle: result.rows[0],
    });
  } catch (err) {
    console.error("Remove saved article error:", err);
    res.status(500).json({
      error: "Server error",
      details: "Failed to remove saved article",
    });
  }
});

// Makale kaydedilmiş mi kontrol et
router.get("/saved/check/:articleId", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { articleId } = req.params;

    const result = await db.query(
      "SELECT id, saved_at FROM saved_articles WHERE user_id = $1 AND article_id = $2",
      [userId, articleId]
    );

    res.json({
      success: true,
      isSaved: result.rows.length > 0,
      savedAt: result.rows.length > 0 ? result.rows[0].saved_at : null,
    });
  } catch (err) {
    console.error("Check saved article error:", err);
    res.status(500).json({
      error: "Server error",
      details: "Failed to check article save status",
    });
  }
});

// ===============================
// ARTICLE CATEGORIES
// ===============================

// Kullanıcının kaydettiği makale kategorilerini al
router.get("/categories", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;

    const categories = await db.query(
      `SELECT article_category, COUNT(*) as article_count
       FROM saved_articles 
       WHERE user_id = $1 AND article_category IS NOT NULL AND article_category != ''
       GROUP BY article_category
       ORDER BY article_count DESC, article_category`,
      [userId]
    );

    // Varsayılan kategoriler
    const defaultCategories = [
      {
        category: "Nutrition",
        article_count: 0,
        displayName: "Nutrition & Diet",
      },
      {
        category: "Exercise",
        article_count: 0,
        displayName: "Exercise & Fitness",
      },
      {
        category: "Health",
        article_count: 0,
        displayName: "Health & Wellness",
      },
      { category: "Recipes", article_count: 0, displayName: "Healthy Recipes" },
      {
        category: "Mental Health",
        article_count: 0,
        displayName: "Mental Health",
      },
      {
        category: "Weight Loss",
        article_count: 0,
        displayName: "Weight Management",
      },
    ];

    // Custom kategorileri varsayılanlarla birleştir
    const allCategories = [...defaultCategories];
    categories.rows.forEach((cat) => {
      const existing = allCategories.find(
        (def) => def.category === cat.article_category
      );
      if (existing) {
        existing.article_count = parseInt(cat.article_count);
      } else {
        allCategories.push({
          category: cat.article_category,
          article_count: parseInt(cat.article_count),
          displayName: cat.article_category,
        });
      }
    });

    res.json({
      success: true,
      data: allCategories,
      totalCategories: allCategories.length,
    });
  } catch (err) {
    console.error("Get article categories error:", err);
    res.status(500).json({
      error: "Server error",
      details: "Failed to fetch article categories",
    });
  }
});

// ===============================
// ARTICLE SEARCH
// ===============================

// Kaydedilen makalelerde arama yap
router.get("/search", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { query, category, limit = 20 } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        error: "Invalid search query",
        details: "Search query must be at least 2 characters long",
      });
    }

    const searchTerm = `%${query.toLowerCase()}%`;
    let sqlQuery = `
      SELECT * FROM saved_articles 
      WHERE user_id = $1 AND LOWER(article_title) LIKE $2
    `;
    let params = [userId, searchTerm];
    let paramCount = 3;

    // Kategori filtresi
    if (category && category !== "all") {
      sqlQuery += ` AND article_category = $${paramCount}`;
      params.push(category);
      paramCount++;
    }

    sqlQuery += ` ORDER BY saved_at DESC LIMIT $${paramCount}`;
    params.push(parseInt(limit));

    const searchResults = await db.query(sqlQuery, params);

    res.json({
      success: true,
      query: query,
      category: category || "all",
      data: searchResults.rows,
      count: searchResults.rows.length,
    });
  } catch (err) {
    console.error("Search saved articles error:", err);
    res.status(500).json({
      error: "Server error",
      details: "Failed to search saved articles",
    });
  }
});

// ===============================
// ARTICLE STATISTICS
// ===============================

// Kullanıcının makale istatistiklerini al
router.get("/stats", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;

    // Genel istatistikler
    const generalStats = await db.query(
      `SELECT 
         COUNT(*) as total_saved_articles,
         COUNT(DISTINCT article_category) as unique_categories,
         MIN(saved_at) as first_saved_date,
         MAX(saved_at) as last_saved_date
       FROM saved_articles 
       WHERE user_id = $1`,
      [userId]
    );

    // Kategori bazında istatistikler
    const categoryStats = await db.query(
      `SELECT article_category, COUNT(*) as count
       FROM saved_articles 
       WHERE user_id = $1 AND article_category IS NOT NULL
       GROUP BY article_category
       ORDER BY count DESC
       LIMIT 10`,
      [userId]
    );

    // Aylık kaydetme trendi
    const monthlyTrend = await db.query(
      `SELECT 
         DATE_TRUNC('month', saved_at) as month,
         COUNT(*) as articles_saved
       FROM saved_articles 
       WHERE user_id = $1 AND saved_at >= CURRENT_DATE - INTERVAL '12 months'
       GROUP BY month
       ORDER BY month DESC
       LIMIT 12`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        general: {
          totalSavedArticles:
            parseInt(generalStats.rows[0].total_saved_articles) || 0,
          uniqueCategories:
            parseInt(generalStats.rows[0].unique_categories) || 0,
          firstSavedDate: generalStats.rows[0].first_saved_date,
          lastSavedDate: generalStats.rows[0].last_saved_date,
        },
        categoryStats: categoryStats.rows.map((cat) => ({
          category: cat.article_category,
          count: parseInt(cat.count),
        })),
        monthlyTrend: monthlyTrend.rows.map((month) => ({
          month: month.month,
          articlesSaved: parseInt(month.articles_saved),
        })),
      },
    });
  } catch (err) {
    console.error("Get article stats error:", err);
    res.status(500).json({
      error: "Server error",
      details: "Failed to fetch article statistics",
    });
  }
});

// ===============================
// BULK OPERATIONS
// ===============================

// Birden fazla makaleyi aynı anda kaydet
router.post("/saved/bulk", authenticateToken, async (req, res) => {
  const client = await db.beginTransaction();

  try {
    const userId = req.userId;
    const { articles } = req.body;

    if (!articles || !Array.isArray(articles) || articles.length === 0) {
      await db.rollbackTransaction(client);
      return res.status(400).json({
        error: "Invalid articles data",
        details: "articles must be a non-empty array",
      });
    }

    if (articles.length > 50) {
      await db.rollbackTransaction(client);
      return res.status(400).json({
        error: "Too many articles",
        details: "Maximum 50 articles can be saved at once",
      });
    }

    const savedArticles = [];
    const errors = [];

    for (let i = 0; i < articles.length; i++) {
      const article = articles[i];

      try {
        // Validasyon
        if (!article.articleId || !article.articleTitle) {
          errors.push({ index: i, error: "Missing articleId or articleTitle" });
          continue;
        }

        // Zaten kaydedilmiş mi kontrol et
        const existing = await client.query(
          "SELECT id FROM saved_articles WHERE user_id = $1 AND article_id = $2",
          [userId, article.articleId]
        );

        if (existing.rows.length > 0) {
          errors.push({ index: i, error: "Article already saved" });
          continue;
        }

        // Makaleyi kaydet
        const result = await client.query(
          `INSERT INTO saved_articles (user_id, article_id, article_title, article_category)
           VALUES ($1, $2, $3, $4) RETURNING *`,
          [
            userId,
            article.articleId,
            article.articleTitle,
            article.articleCategory,
          ]
        );

        savedArticles.push(result.rows[0]);
      } catch (error) {
        errors.push({ index: i, error: error.message });
      }
    }

    await db.commitTransaction(client);

    res.status(201).json({
      success: true,
      data: {
        savedArticles: savedArticles,
        savedCount: savedArticles.length,
        totalRequested: articles.length,
        errors: errors,
      },
      message: `${savedArticles.length} articles saved successfully`,
    });
  } catch (err) {
    await db.rollbackTransaction(client);
    console.error("Bulk save articles error:", err);
    res.status(500).json({
      error: "Server error",
      details: "Failed to save articles",
    });
  }
});

// Birden fazla makaleyi sil
router.delete("/saved/bulk", authenticateToken, async (req, res) => {
  const client = await db.beginTransaction();

  try {
    const userId = req.userId;
    const { articleIds } = req.body;

    if (!articleIds || !Array.isArray(articleIds) || articleIds.length === 0) {
      await db.rollbackTransaction(client);
      return res.status(400).json({
        error: "Invalid article IDs",
        details: "articleIds must be a non-empty array",
      });
    }

    // Tüm makaleleri sil
    const placeholders = articleIds
      .map((_, index) => `$${index + 2}`)
      .join(",");
    const result = await client.query(
      `DELETE FROM saved_articles 
       WHERE user_id = $1 AND article_id IN (${placeholders}) 
       RETURNING *`,
      [userId, ...articleIds]
    );

    await db.commitTransaction(client);

    res.json({
      success: true,
      data: {
        removedArticles: result.rows,
        removedCount: result.rows.length,
        requestedCount: articleIds.length,
      },
      message: `${result.rows.length} articles removed successfully`,
    });
  } catch (err) {
    await db.rollbackTransaction(client);
    console.error("Bulk delete articles error:", err);
    res.status(500).json({
      error: "Server error",
      details: "Failed to delete articles",
    });
  }
});

module.exports = router;
