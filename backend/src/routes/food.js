// backend/src/routes/food.js - Food management with Recent Foods Integration
const express = require("express");
const db = require("../db");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// ===============================
// RECENT FOODS MANAGEMENT - DATABASE ENTEGRASYONU
// ===============================

// Recent foods'u al - DATABASE'DEN
router.get("/recent", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { limit = 10 } = req.query;

    console.log(`Fetching recent foods for user ${userId}`);

    const recentFoods = await db.query(
      `SELECT * FROM recent_foods 
       WHERE user_id = $1 
       ORDER BY last_accessed DESC 
       LIMIT $2`,
      [userId, limit]
    );

    // Boş veya geçersiz kayıtları filtrele
    const filteredFoods = recentFoods.rows.filter(
      (food) =>
        food.food_name &&
        food.food_name.trim() !== "" &&
        food.food_id &&
        food.food_id.trim() !== "" &&
        food.calories_per_100g !== null &&
        food.calories_per_100g >= 0
    );

    console.log(
      `Found ${filteredFoods.length} recent foods for user ${userId}`
    );

    res.json({
      success: true,
      data: filteredFoods,
      count: filteredFoods.length,
    });
  } catch (err) {
    console.error("Get recent foods error:", err);
    res.status(500).json({
      error: "Server error",
      details: "Failed to fetch recent foods",
    });
  }
});

// Recent foods'a yemek ekle - UPSERT İLE
router.post("/recent", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const {
      foodId,
      foodName,
      caloriesPer100g,
      proteinPer100g,
      carbsPer100g,
      fatPer100g,
      isCustomFood = false,
    } = req.body;

    // Validasyon
    if (!foodId || !foodName) {
      return res.status(400).json({
        error: "Missing required fields",
        details: "foodId and foodName are required",
      });
    }

    console.log(`Adding food to recent foods for user ${userId}:`, foodName);

    // UPSERT: Varsa last_accessed güncelle, yoksa ekle
    const result = await db.query(
      `INSERT INTO recent_foods (user_id, food_id, food_name, calories_per_100g, 
       protein_per_100g, carbs_per_100g, fat_per_100g, is_custom_food)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       ON CONFLICT (user_id, food_id) 
       DO UPDATE SET 
         last_accessed = NOW(),
         food_name = EXCLUDED.food_name,
         calories_per_100g = EXCLUDED.calories_per_100g,
         protein_per_100g = EXCLUDED.protein_per_100g,
         carbs_per_100g = EXCLUDED.carbs_per_100g,
         fat_per_100g = EXCLUDED.fat_per_100g
       RETURNING *`,
      [
        userId,
        foodId,
        foodName,
        caloriesPer100g || 0,
        proteinPer100g || 0,
        carbsPer100g || 0,
        fatPer100g || 0,
        isCustomFood,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Food added to recent foods",
      data: result.rows[0],
    });

    console.log(`Food added to recent foods for user ${userId}`);
  } catch (err) {
    console.error("Add to recent foods error:", err);
    res.status(500).json({
      error: "Server error",
      details: "Failed to add food to recent foods",
      errorMessage: err.message,
    });
  }
});

// Recent foods'u temizle - GÜVENLİ SÜRÜM
router.delete("/recent", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;

    console.log(`Clearing recent foods for user ${userId}`);

    const result = await db.query(
      `DELETE FROM recent_foods WHERE user_id = $1`,
      [userId]
    );

    const deletedCount = result.rowCount || 0;

    res.json({
      success: true,
      message: `${deletedCount} recent foods cleared successfully`,
      deletedCount: deletedCount,
      backendCleared: true,
    });

    console.log(`Cleared ${deletedCount} recent foods for user ${userId}`);
  } catch (err) {
    console.error("Clear recent foods error:", err);
    res.status(500).json({
      error: "Server error",
      details: "Failed to clear recent foods",
      errorMessage: err.message,
    });
  }
});

// Belirli bir recent food'u sil
router.delete("/recent/:foodId", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { foodId } = req.params;

    const result = await db.query(
      "DELETE FROM recent_foods WHERE user_id = $1 AND food_id = $2 RETURNING *",
      [userId, foodId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Not found",
        details: "Food not found in recent foods",
      });
    }

    res.json({
      success: true,
      message: "Food removed from recent foods successfully",
      removedFood: result.rows[0],
    });
  } catch (err) {
    console.error("Remove from recent foods error:", err);
    res.status(500).json({
      error: "Server error",
      details: "Failed to remove food from recent foods",
    });
  }
});

// ===============================
// FAVORITE FOODS MANAGEMENT
// ===============================

// Kullanıcının favori yemeklerini al
router.get("/favorites", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;

    const favorites = await db.query(
      `SELECT * FROM favorite_foods 
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
    console.error("Get favorite foods error:", err);
    res.status(500).json({
      error: "Server error",
      details: "Failed to fetch favorite foods",
    });
  }
});

// Yemeği favorilere ekle
router.post("/favorites", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const {
      foodId,
      foodName,
      caloriesPer100g,
      proteinPer100g,
      carbsPer100g,
      fatPer100g,
      isCustomFood = false,
    } = req.body;

    if (!foodId || !foodName) {
      return res.status(400).json({
        error: "Missing required fields",
        details: "foodId and foodName are required",
      });
    }

    // Zaten favorilerde mi kontrol et
    const existing = await db.query(
      "SELECT id FROM favorite_foods WHERE user_id = $1 AND food_id = $2",
      [userId, foodId]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        error: "Already in favorites",
        details: "This food is already in your favorites",
      });
    }

    const result = await db.query(
      `INSERT INTO favorite_foods (user_id, food_id, food_name, calories_per_100g, 
       protein_per_100g, carbs_per_100g, fat_per_100g, is_custom_food)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        userId,
        foodId,
        foodName,
        caloriesPer100g,
        proteinPer100g,
        carbsPer100g,
        fatPer100g,
        isCustomFood,
      ]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: "Food added to favorites successfully",
    });
  } catch (err) {
    console.error("Add to favorites error:", err);
    res.status(500).json({
      error: "Server error",
      details: "Failed to add food to favorites",
    });
  }
});

// Favorilerden çıkar
router.delete("/favorites/:foodId", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { foodId } = req.params;

    const result = await db.query(
      "DELETE FROM favorite_foods WHERE user_id = $1 AND food_id = $2 RETURNING *",
      [userId, foodId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Not found",
        details: "Food not found in favorites",
      });
    }

    res.json({
      success: true,
      message: "Food removed from favorites successfully",
      removedFood: result.rows[0],
    });
  } catch (err) {
    console.error("Remove from favorites error:", err);
    res.status(500).json({
      error: "Server error",
      details: "Failed to remove food from favorites",
    });
  }
});

// ===============================
// CUSTOM FOODS MANAGEMENT
// ===============================

// Kullanıcının özel yemeklerini al
router.get("/custom", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;

    const customFoods = await db.query(
      `SELECT * FROM custom_foods 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: customFoods.rows,
      count: customFoods.rows.length,
    });
  } catch (err) {
    console.error("Get custom foods error:", err);
    res.status(500).json({
      error: "Server error",
      details: "Failed to fetch custom foods",
    });
  }
});

// Yeni özel yemek oluştur
router.post("/custom", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const {
      foodName,
      caloriesPer100g,
      proteinPer100g,
      carbsPer100g,
      fatPer100g,
      servingSize = 100,
      description,
    } = req.body;

    if (!foodName || !caloriesPer100g) {
      return res.status(400).json({
        error: "Missing required fields",
        details: "foodName and caloriesPer100g are required",
      });
    }

    if (caloriesPer100g < 0 || caloriesPer100g > 900) {
      return res.status(400).json({
        error: "Invalid calorie value",
        details: "Calories per 100g must be between 0 and 900",
      });
    }

    // Aynı isimde yemek var mı kontrol et
    const existing = await db.query(
      "SELECT id FROM custom_foods WHERE user_id = $1 AND LOWER(food_name) = LOWER($2)",
      [userId, foodName]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        error: "Food already exists",
        details: "You already have a custom food with this name",
      });
    }

    const result = await db.query(
      `INSERT INTO custom_foods (user_id, food_name, calories_per_100g, 
       protein_per_100g, carbs_per_100g, fat_per_100g, serving_size, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        userId,
        foodName,
        caloriesPer100g,
        proteinPer100g || 0,
        carbsPer100g || 0,
        fatPer100g || 0,
        servingSize,
        description,
      ]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: "Custom food created successfully",
    });
  } catch (err) {
    console.error("Create custom food error:", err);
    res.status(500).json({
      error: "Server error",
      details: "Failed to create custom food",
    });
  }
});

// Özel yemeği güncelle
router.put("/custom/:foodId", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { foodId } = req.params;
    const {
      foodName,
      caloriesPer100g,
      proteinPer100g,
      carbsPer100g,
      fatPer100g,
      servingSize,
      description,
    } = req.body;

    const existing = await db.query(
      "SELECT * FROM custom_foods WHERE id = $1 AND user_id = $2",
      [foodId, userId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        error: "Custom food not found",
        details:
          "Custom food not found or you don't have permission to edit it",
      });
    }

    const updateFields = [];
    const values = [];
    let paramCount = 3;

    if (foodName !== undefined) {
      updateFields.push(`food_name = $${paramCount++}`);
      values.push(foodName);
    }
    if (caloriesPer100g !== undefined) {
      updateFields.push(`calories_per_100g = $${paramCount++}`);
      values.push(caloriesPer100g);
    }
    if (proteinPer100g !== undefined) {
      updateFields.push(`protein_per_100g = $${paramCount++}`);
      values.push(proteinPer100g);
    }
    if (carbsPer100g !== undefined) {
      updateFields.push(`carbs_per_100g = $${paramCount++}`);
      values.push(carbsPer100g);
    }
    if (fatPer100g !== undefined) {
      updateFields.push(`fat_per_100g = $${paramCount++}`);
      values.push(fatPer100g);
    }
    if (servingSize !== undefined) {
      updateFields.push(`serving_size = $${paramCount++}`);
      values.push(servingSize);
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
      UPDATE custom_foods 
      SET ${updateFields.join(", ")}
      WHERE id = $1 AND user_id = $2 
      RETURNING *
    `;

    const result = await db.query(query, [foodId, userId, ...values]);

    res.json({
      success: true,
      data: result.rows[0],
      message: "Custom food updated successfully",
    });
  } catch (err) {
    console.error("Update custom food error:", err);
    res.status(500).json({
      error: "Server error",
      details: "Failed to update custom food",
    });
  }
});

// Özel yemeği sil
router.delete("/custom/:foodId", authenticateToken, async (req, res) => {
  const client = await db.beginTransaction();

  try {
    const userId = req.userId;
    const { foodId } = req.params;

    const existing = await client.query(
      "SELECT * FROM custom_foods WHERE id = $1 AND user_id = $2",
      [foodId, userId]
    );

    if (existing.rows.length === 0) {
      await db.rollbackTransaction(client);
      return res.status(404).json({
        error: "Custom food not found",
        details:
          "Custom food not found or you don't have permission to delete it",
      });
    }

    const customFood = existing.rows[0];

    // Bu yemeği kullanan food_entries varsa güncelle
    await client.query(
      "UPDATE food_entries SET is_custom_food = false WHERE food_id = $1 AND user_id = $2",
      [foodId, userId]
    );

    // Favorilerden de çıkar
    await client.query(
      "DELETE FROM favorite_foods WHERE food_id = $1 AND user_id = $2 AND is_custom_food = true",
      [foodId, userId]
    );

    // Recent foods'dan da çıkar
    await client.query(
      "DELETE FROM recent_foods WHERE food_id = $1 AND user_id = $2",
      [foodId, userId]
    );

    // Özel yemeği sil
    await client.query(
      "DELETE FROM custom_foods WHERE id = $1 AND user_id = $2",
      [foodId, userId]
    );

    await db.commitTransaction(client);

    res.json({
      success: true,
      message: "Custom food deleted successfully",
      deletedFood: customFood,
    });
  } catch (err) {
    await db.rollbackTransaction(client);
    console.error("Delete custom food error:", err);
    res.status(500).json({
      error: "Server error",
      details: "Failed to delete custom food",
    });
  }
});

// ===============================
// FOOD SEARCH & DETAILS
// ===============================

// Birleşik yemek arama (USDA + Custom + Favorites)
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
      usda: [],
    };

    if (category === "all" || category === "custom") {
      const customFoods = await db.query(
        `SELECT *, 'custom' as source FROM custom_foods 
         WHERE user_id = $1 AND LOWER(food_name) LIKE $2 
         ORDER BY food_name LIMIT $3`,
        [userId, searchTerm, limit]
      );
      results.custom = customFoods.rows;
    }

    if (category === "all" || category === "favorites") {
      const favoriteFoods = await db.query(
        `SELECT *, 'favorite' as source FROM favorite_foods 
         WHERE user_id = $1 AND LOWER(food_name) LIKE $2 
         ORDER BY food_name LIMIT $3`,
        [userId, searchTerm, limit]
      );
      results.favorites = favoriteFoods.rows;
    }

    res.json({
      success: true,
      query: query,
      data: results,
      totalResults: results.custom.length + results.favorites.length,
    });
  } catch (err) {
    console.error("Food search error:", err);
    res.status(500).json({
      error: "Server error",
      details: "Failed to search foods",
    });
  }
});

// Yemek detaylarını al (custom veya favorite)
router.get("/details/:source/:foodId", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { source, foodId } = req.params;

    let result;

    if (source === "custom") {
      result = await db.query(
        "SELECT *, 'custom' as source FROM custom_foods WHERE id = $1 AND user_id = $2",
        [foodId, userId]
      );
    } else if (source === "favorite") {
      result = await db.query(
        "SELECT *, 'favorite' as source FROM favorite_foods WHERE food_id = $1 AND user_id = $2",
        [foodId, userId]
      );
    } else {
      return res.status(400).json({
        error: "Invalid source",
        details: "Source must be either 'custom' or 'favorite'",
      });
    }

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Food not found",
        details: "Food not found in your collection",
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (err) {
    console.error("Get food details error:", err);
    res.status(500).json({
      error: "Server error",
      details: "Failed to fetch food details",
    });
  }
});

module.exports = router;
