// backend/src/routes/activity.js - Activity management (favorites, custom activities)
const express = require("express");
const db = require("../db");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// ===============================
// FAVORITE ACTIVITIES MANAGEMENT
// ===============================

// Kullanıcının favori aktivitelerini al
router.get("/favorites", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;

    const favorites = await db.query(
      `SELECT * FROM favorite_activities 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: favorites.rows,
      count: favorites.rows.length,
    });
  } catch (err) {
    console.error("Get favorite activities error:", err);
    res.status(500).json({
      error: "Server error",
      details: "Failed to fetch favorite activities",
    });
  }
});

// Aktiviteyi favorilere ekle
router.post("/favorites", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const {
      activityId,
      activityName,
      caloriesPerMinute,
      isCustomActivity = false,
    } = req.body;

    // Validasyon
    if (!activityId || !activityName) {
      return res.status(400).json({
        error: "Missing required fields",
        details: "activityId and activityName are required",
      });
    }

    // Zaten favorilerde mi kontrol et
    const existing = await db.query(
      "SELECT id FROM favorite_activities WHERE user_id = $1 AND activity_id = $2",
      [userId, activityId]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        error: "Already in favorites",
        details: "This activity is already in your favorites",
      });
    }

    // Favorilere ekle
    const result = await db.query(
      `INSERT INTO favorite_activities (user_id, activity_id, activity_name, 
       calories_per_minute, is_custom_activity)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [userId, activityId, activityName, caloriesPerMinute, isCustomActivity]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: "Activity added to favorites successfully",
    });
  } catch (err) {
    console.error("Add to favorites error:", err);
    res.status(500).json({
      error: "Server error",
      details: "Failed to add activity to favorites",
    });
  }
});

// Favorilerden çıkar
router.delete("/favorites/:activityId", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { activityId } = req.params;

    const result = await db.query(
      "DELETE FROM favorite_activities WHERE user_id = $1 AND activity_id = $2 RETURNING *",
      [userId, activityId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Not found",
        details: "Activity not found in favorites",
      });
    }

    res.json({
      success: true,
      message: "Activity removed from favorites successfully",
      removedActivity: result.rows[0],
    });
  } catch (err) {
    console.error("Remove from favorites error:", err);
    res.status(500).json({
      error: "Server error",
      details: "Failed to remove activity from favorites",
    });
  }
});

// ===============================
// CUSTOM ACTIVITIES MANAGEMENT
// ===============================

// Kullanıcının özel aktivitelerini al
router.get("/custom", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;

    const customActivities = await db.query(
      `SELECT * FROM custom_activities 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: customActivities.rows,
      count: customActivities.rows.length,
    });
  } catch (err) {
    console.error("Get custom activities error:", err);
    res.status(500).json({
      error: "Server error",
      details: "Failed to fetch custom activities",
    });
  }
});

// Yeni özel aktivite oluştur
router.post("/custom", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { activityName, caloriesPerMinute, category, description } = req.body;

    // Validasyon
    if (!activityName || !caloriesPerMinute) {
      return res.status(400).json({
        error: "Missing required fields",
        details: "activityName and caloriesPerMinute are required",
      });
    }

    if (caloriesPerMinute < 0 || caloriesPerMinute > 30) {
      return res.status(400).json({
        error: "Invalid calorie value",
        details: "Calories per minute must be between 0 and 30",
      });
    }

    // Aynı isimde aktivite var mı kontrol et
    const existing = await db.query(
      "SELECT id FROM custom_activities WHERE user_id = $1 AND LOWER(activity_name) = LOWER($2)",
      [userId, activityName]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        error: "Activity already exists",
        details: "You already have a custom activity with this name",
      });
    }

    // Özel aktivite oluştur
    const result = await db.query(
      `INSERT INTO custom_activities (user_id, activity_name, calories_per_minute, 
       category, description)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [userId, activityName, caloriesPerMinute, category, description]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: "Custom activity created successfully",
    });
  } catch (err) {
    console.error("Create custom activity error:", err);
    res.status(500).json({
      error: "Server error",
      details: "Failed to create custom activity",
    });
  }
});

// Özel aktiviteyi güncelle
router.put("/custom/:activityId", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { activityId } = req.params;
    const { activityName, caloriesPerMinute, category, description } = req.body;

    // Aktivite sahibi kontrolü
    const existing = await db.query(
      "SELECT * FROM custom_activities WHERE id = $1 AND user_id = $2",
      [activityId, userId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        error: "Custom activity not found",
        details:
          "Custom activity not found or you don't have permission to edit it",
      });
    }

    // Güncelleme alanlarını hazırla
    const updateFields = [];
    const values = [];
    let paramCount = 3; // $1: activityId, $2: userId

    if (activityName !== undefined) {
      updateFields.push(`activity_name = $${paramCount++}`);
      values.push(activityName);
    }
    if (caloriesPerMinute !== undefined) {
      updateFields.push(`calories_per_minute = $${paramCount++}`);
      values.push(caloriesPerMinute);
    }
    if (category !== undefined) {
      updateFields.push(`category = $${paramCount++}`);
      values.push(category);
    }
    if (description !== undefined) {
      updateFields.push(`description = $${paramCount++}`);
      values.push(description);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        error: "No fields to update",
        details: "Please provide at least one field to update",
      });
    }

    const query = `
      UPDATE custom_activities 
      SET ${updateFields.join(", ")}
      WHERE id = $1 AND user_id = $2 
      RETURNING *
    `;

    const result = await db.query(query, [activityId, userId, ...values]);

    res.json({
      success: true,
      data: result.rows[0],
      message: "Custom activity updated successfully",
    });
  } catch (err) {
    console.error("Update custom activity error:", err);
    res.status(500).json({
      error: "Server error",
      details: "Failed to update custom activity",
    });
  }
});

// Özel aktiviteyi sil
router.delete("/custom/:activityId", authenticateToken, async (req, res) => {
  const client = await db.beginTransaction();

  try {
    const userId = req.userId;
    const { activityId } = req.params;

    // Aktivite sahibi kontrolü
    const existing = await client.query(
      "SELECT * FROM custom_activities WHERE id = $1 AND user_id = $2",
      [activityId, userId]
    );

    if (existing.rows.length === 0) {
      await db.rollbackTransaction(client);
      return res.status(404).json({
        error: "Custom activity not found",
        details:
          "Custom activity not found or you don't have permission to delete it",
      });
    }

    const customActivity = existing.rows[0];

    // Bu aktiviteyi kullanan activity_logs varsa güncelle (opsiyonel)
    await client.query(
      "UPDATE activity_logs SET is_custom_activity = false WHERE activity_id = $1 AND user_id = $2",
      [activityId, userId]
    );

    // Favorilerden de çıkar
    await client.query(
      "DELETE FROM favorite_activities WHERE activity_id = $1 AND user_id = $2 AND is_custom_activity = true",
      [activityId, userId]
    );

    // Özel aktiviteyi sil
    await client.query(
      "DELETE FROM custom_activities WHERE id = $1 AND user_id = $2",
      [activityId, userId]
    );

    await db.commitTransaction(client);

    res.json({
      success: true,
      message: "Custom activity deleted successfully",
      deletedActivity: customActivity,
    });
  } catch (err) {
    await db.rollbackTransaction(client);
    console.error("Delete custom activity error:", err);
    res.status(500).json({
      error: "Server error",
      details: "Failed to delete custom activity",
    });
  }
});

// ===============================
// ACTIVITY SEARCH & DETAILS
// ===============================

// Birleşik aktivite arama (Sample + Custom + Favorites)
router.get("/search", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { query, category = "all", limit = 20 } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        error: "Invalid search query",
        details: "Search query must be at least 2 characters long",
      });
    }

    const searchTerm = `%${query.toLowerCase()}%`;
    const results = {
      custom: [],
      favorites: [],
      sample: [], // Sample activities frontend'te ayrıca aranacak
    };

    // Custom activities'da ara
    if (category === "all" || category === "custom") {
      const customActivities = await db.query(
        `SELECT *, 'custom' as source FROM custom_activities 
         WHERE user_id = $1 AND LOWER(activity_name) LIKE $2 
         ORDER BY activity_name LIMIT $3`,
        [userId, searchTerm, limit]
      );
      results.custom = customActivities.rows;
    }

    // Favorites'da ara
    if (category === "all" || category === "favorites") {
      const favoriteActivities = await db.query(
        `SELECT *, 'favorite' as source FROM favorite_activities 
         WHERE user_id = $1 AND LOWER(activity_name) LIKE $2 
         ORDER BY activity_name LIMIT $3`,
        [userId, searchTerm, limit]
      );
      results.favorites = favoriteActivities.rows;
    }

    res.json({
      success: true,
      query: query,
      data: results,
      totalResults: results.custom.length + results.favorites.length,
    });
  } catch (err) {
    console.error("Activity search error:", err);
    res.status(500).json({
      error: "Server error",
      details: "Failed to search activities",
    });
  }
});

// Aktivite detaylarını al (custom veya favorite)
router.get(
  "/details/:source/:activityId",
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.userId;
      const { source, activityId } = req.params;

      let result;

      if (source === "custom") {
        result = await db.query(
          "SELECT *, 'custom' as source FROM custom_activities WHERE id = $1 AND user_id = $2",
          [activityId, userId]
        );
      } else if (source === "favorite") {
        result = await db.query(
          "SELECT *, 'favorite' as source FROM favorite_activities WHERE activity_id = $1 AND user_id = $2",
          [activityId, userId]
        );
      } else {
        return res.status(400).json({
          error: "Invalid source",
          details: "Source must be either 'custom' or 'favorite'",
        });
      }

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: "Activity not found",
          details: "Activity not found in your collection",
        });
      }

      res.json({
        success: true,
        data: result.rows[0],
      });
    } catch (err) {
      console.error("Get activity details error:", err);
      res.status(500).json({
        error: "Server error",
        details: "Failed to fetch activity details",
      });
    }
  }
);

// Yakın zamanda kullanılan aktiviteleri al
router.get("/recent", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { limit = 10 } = req.query;

    const recentActivities = await db.query(
      `SELECT DISTINCT activity_id, activity_name, calories_burned, duration_minutes, 
              is_custom_activity, MAX(created_at) as last_used,
              ROUND(AVG(calories_burned::decimal / duration_minutes), 2) as avg_calories_per_minute
       FROM activity_logs 
       WHERE user_id = $1 AND created_at >= CURRENT_DATE - INTERVAL '30 days'
       GROUP BY activity_id, activity_name, calories_burned, duration_minutes, is_custom_activity
       ORDER BY last_used DESC 
       LIMIT $2`,
      [userId, limit]
    );

    res.json({
      success: true,
      data: recentActivities.rows,
      count: recentActivities.rows.length,
    });
  } catch (err) {
    console.error("Get recent activities error:", err);
    res.status(500).json({
      error: "Server error",
      details: "Failed to fetch recent activities",
    });
  }
});

// Aktivite kategorilerini al
router.get("/categories", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;

    // Kullanıcının custom aktivitelerinden kategorileri al
    const categories = await db.query(
      `SELECT DISTINCT category, COUNT(*) as activity_count
       FROM custom_activities 
       WHERE user_id = $1 AND category IS NOT NULL AND category != ''
       GROUP BY category
       ORDER BY activity_count DESC, category`,
      [userId]
    );

    // Varsayılan kategoriler
    const defaultCategories = [
      { category: "Cardio", activity_count: 0 },
      { category: "Strength Training", activity_count: 0 },
      { category: "Sports", activity_count: 0 },
      { category: "Flexibility", activity_count: 0 },
      { category: "Daily Activities", activity_count: 0 },
    ];

    // Custom kategorileri varsayılanlarla birleştir
    const allCategories = [...defaultCategories];
    categories.rows.forEach((cat) => {
      const existing = allCategories.find(
        (def) => def.category === cat.category
      );
      if (existing) {
        existing.activity_count = parseInt(cat.activity_count);
      } else {
        allCategories.push({
          category: cat.category,
          activity_count: parseInt(cat.activity_count),
        });
      }
    });

    res.json({
      success: true,
      data: allCategories,
      totalCategories: allCategories.length,
    });
  } catch (err) {
    console.error("Get activity categories error:", err);
    res.status(500).json({
      error: "Server error",
      details: "Failed to fetch activity categories",
    });
  }
});

// ===============================
// ACTIVITY STATISTICS
// ===============================

// Kullanıcının aktivite istatistiklerini al
router.get("/stats", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { period = 30 } = req.query; // Default 30 gün

    const periodDays = Math.min(Math.max(parseInt(period), 1), 365);

    // Genel istatistikler
    const generalStats = await db.query(
      `SELECT 
         COUNT(*) as total_activities,
         SUM(duration_minutes) as total_minutes,
         SUM(calories_burned) as total_calories_burned,
         AVG(calories_burned) as avg_calories_per_session,
         AVG(duration_minutes) as avg_duration_per_session,
         COUNT(DISTINCT DATE(created_at)) as active_days
       FROM activity_logs 
       WHERE user_id = $1 AND created_at >= CURRENT_DATE - INTERVAL '${periodDays} days'`,
      [userId]
    );

    // En popüler aktiviteler
    const popularActivities = await db.query(
      `SELECT activity_name, COUNT(*) as frequency, 
              SUM(duration_minutes) as total_minutes,
              SUM(calories_burned) as total_calories
       FROM activity_logs 
       WHERE user_id = $1 AND created_at >= CURRENT_DATE - INTERVAL '${periodDays} days'
       GROUP BY activity_name
       ORDER BY frequency DESC
       LIMIT 5`,
      [userId]
    );

    // Haftalık trend
    const weeklyTrend = await db.query(
      `SELECT 
         DATE_TRUNC('week', created_at) as week,
         COUNT(*) as activities_count,
         SUM(duration_minutes) as total_minutes,
         SUM(calories_burned) as total_calories
       FROM activity_logs 
       WHERE user_id = $1 AND created_at >= CURRENT_DATE - INTERVAL '${Math.min(
         periodDays,
         84
       )} days'
       GROUP BY week
       ORDER BY week DESC
       LIMIT 12`,
      [userId]
    );

    res.json({
      success: true,
      period: `Last ${periodDays} days`,
      data: {
        general: {
          totalActivities: parseInt(generalStats.rows[0].total_activities) || 0,
          totalMinutes: parseInt(generalStats.rows[0].total_minutes) || 0,
          totalCaloriesBurned:
            parseInt(generalStats.rows[0].total_calories_burned) || 0,
          avgCaloriesPerSession:
            Math.round(generalStats.rows[0].avg_calories_per_session) || 0,
          avgDurationPerSession:
            Math.round(generalStats.rows[0].avg_duration_per_session) || 0,
          activeDays: parseInt(generalStats.rows[0].active_days) || 0,
        },
        popularActivities: popularActivities.rows.map((activity) => ({
          name: activity.activity_name,
          frequency: parseInt(activity.frequency),
          totalMinutes: parseInt(activity.total_minutes),
          totalCalories: parseInt(activity.total_calories),
        })),
        weeklyTrend: weeklyTrend.rows.map((week) => ({
          week: week.week,
          activitiesCount: parseInt(week.activities_count),
          totalMinutes: parseInt(week.total_minutes),
          totalCalories: parseInt(week.total_calories),
        })),
      },
    });
  } catch (err) {
    console.error("Get activity stats error:", err);
    res.status(500).json({
      error: "Server error",
      details: "Failed to fetch activity statistics",
    });
  }
});

module.exports = router;
