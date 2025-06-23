// backend/src/routes/nutrition.js - Daily nutrition tracking - COMPLETE VERSION
const express = require("express");
const db = require("../db");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Günlük beslenme verilerini al
router.get("/daily/:date", authenticateToken, async (req, res) => {
  try {
    const { date } = req.params;
    const userId = req.userId;

    console.log(`Getting daily data for user ${userId}, date: ${date}`);

    // Geçerli tarih formatı kontrolü (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({
        error: "Invalid date format",
        details: "Date must be in YYYY-MM-DD format",
      });
    }

    // Günlük veri var mı kontrol et
    let dailyData = await db.query(
      "SELECT * FROM user_daily_data WHERE user_id = $1 AND date = $2",
      [userId, date]
    );

    // Günlük veri yoksa oluştur
    if (dailyData.rows.length === 0) {
      console.log(`No daily data found for ${date}, creating new record...`);

      // Kullanıcının varsayılan hedeflerini al
      const userTargets = await db.query(
        "SELECT * FROM user_daily_targets WHERE user_id = $1",
        [userId]
      );

      const targets = userTargets.rows[0] || {
        daily_calories: 2000,
        daily_protein: 150,
        daily_carbs: 300,
        daily_fat: 80,
        water_target: 2500,
      };

      // Yeni günlük veri oluştur
      const insertResult = await db.query(
        `INSERT INTO user_daily_data (user_id, date, daily_calorie_goal, 
         daily_protein_goal, daily_carbs_goal, daily_fat_goal, daily_water_goal)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [
          userId,
          date,
          targets.daily_calories,
          targets.daily_protein,
          targets.daily_carbs,
          targets.daily_fat,
          targets.water_target,
        ]
      );

      dailyData.rows[0] = insertResult.rows[0];
    }

    // O günün yemek kayıtlarını al
    const foodEntries = await db.query(
      `SELECT * FROM food_entries 
       WHERE user_id = $1 AND entry_date = $2 
       ORDER BY created_at DESC`,
      [userId, date]
    );

    // O günün aktivite kayıtlarını al
    const activityEntries = await db.query(
      `SELECT * FROM activity_logs 
       WHERE user_id = $1 AND entry_date = $2 
       ORDER BY created_at DESC`,
      [userId, date]
    );

    // O günün su kayıtlarını al
    const waterLogs = await db.query(
      `SELECT * FROM water_logs 
       WHERE user_id = $1 AND entry_date = $2 
       ORDER BY logged_at DESC`,
      [userId, date]
    );

    const dailyRecord = dailyData.rows[0];

    res.json({
      success: true,
      data: {
        date: date,
        dailyData: dailyRecord,
        foodEntries: foodEntries.rows,
        activityEntries: activityEntries.rows,
        waterLogs: waterLogs.rows,
        summary: {
          consumed: {
            calories: parseFloat(dailyRecord.total_calories_consumed) || 0,
            protein: parseFloat(dailyRecord.total_protein_consumed) || 0,
            carbs: parseFloat(dailyRecord.total_carbs_consumed) || 0,
            fat: parseFloat(dailyRecord.total_fat_consumed) || 0,
          },
          burned: {
            calories: parseFloat(dailyRecord.total_calories_burned) || 0,
          },
          water: {
            consumed: parseInt(dailyRecord.water_consumed) || 0,
          },
          goals: {
            calories: parseInt(dailyRecord.daily_calorie_goal),
            protein: parseFloat(dailyRecord.daily_protein_goal),
            carbs: parseFloat(dailyRecord.daily_carbs_goal),
            fat: parseFloat(dailyRecord.daily_fat_goal),
            water: parseInt(dailyRecord.daily_water_goal),
          },
        },
      },
    });
  } catch (err) {
    console.error("Get daily nutrition error:", err);
    res.status(500).json({
      error: "Server error",
      details: "Failed to fetch daily nutrition data",
    });
  }
});

// Günlük hedefleri güncelle
router.put("/daily/:date/goals", authenticateToken, async (req, res) => {
  try {
    const { date } = req.params;
    const userId = req.userId;
    const { calories, protein, carbs, fat, water } = req.body;

    // Validasyon
    if (!calories || calories < 800 || calories > 5000) {
      return res.status(400).json({
        error: "Invalid calorie goal",
        details: "Calorie goal must be between 800 and 5000",
      });
    }

    const result = await db.query(
      `UPDATE user_daily_data 
       SET daily_calorie_goal = $3, daily_protein_goal = $4, 
           daily_carbs_goal = $5, daily_fat_goal = $6, daily_water_goal = $7,
           updated_at = NOW()
       WHERE user_id = $1 AND date = $2
       RETURNING *`,
      [userId, date, calories, protein, carbs, fat, water]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Daily data not found",
        details: "No daily data record found for this date",
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: "Daily goals updated successfully",
    });
  } catch (err) {
    console.error("Update daily goals error:", err);
    res.status(500).json({
      error: "Server error",
      details: "Failed to update daily goals",
    });
  }
});

// ===============================
// FOOD ENDPOINTS
// ===============================

// Yemek ekleme
router.post("/food", authenticateToken, async (req, res) => {
  const client = await db.beginTransaction();

  try {
    const userId = req.userId;
    const {
      mealType,
      foodName,
      foodId,
      caloriesPer100g,
      proteinPer100g,
      carbsPer100g,
      fatPer100g,
      servingSize,
      date,
    } = req.body;

    // Validasyon
    if (!mealType || !foodName || !servingSize) {
      await db.rollbackTransaction(client);
      return res.status(400).json({
        error: "Missing required fields",
        details: "mealType, foodName, and servingSize are required",
      });
    }

    const validMealTypes = ["breakfast", "lunch", "dinner", "snack"];
    if (!validMealTypes.includes(mealType)) {
      await db.rollbackTransaction(client);
      return res.status(400).json({
        error: "Invalid meal type",
        details: "mealType must be one of: breakfast, lunch, dinner, snack",
      });
    }

    const entryDate = date || new Date().toISOString().split("T")[0];

    // Toplam beslenme değerlerini hesapla
    const multiplier = servingSize / 100;
    const totalCalories = (caloriesPer100g || 0) * multiplier;
    const totalProtein = (proteinPer100g || 0) * multiplier;
    const totalCarbs = (carbsPer100g || 0) * multiplier;
    const totalFat = (fatPer100g || 0) * multiplier;

    // Yemek kaydını ekle
    const foodEntry = await client.query(
      `INSERT INTO food_entries (user_id, meal_type, food_name, food_id, 
       calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g,
       serving_size, total_calories, total_protein, total_carbs, total_fat, entry_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
      [
        userId,
        mealType,
        foodName,
        foodId,
        caloriesPer100g,
        proteinPer100g,
        carbsPer100g,
        fatPer100g,
        servingSize,
        totalCalories,
        totalProtein,
        totalCarbs,
        totalFat,
        entryDate,
      ]
    );

    // Günlük toplamları güncelle
    await updateDailyTotals(client, userId, entryDate);

    await db.commitTransaction(client);

    res.status(201).json({
      success: true,
      data: foodEntry.rows[0],
      message: "Food entry added successfully",
    });
  } catch (err) {
    await db.rollbackTransaction(client);
    console.error("Add food entry error:", err);
    res.status(500).json({
      error: "Server error",
      details: "Failed to add food entry",
    });
  }
});

// backend/src/routes/nutrition.js - FINAL FIX FOR SQL TYPE ERROR

// Yemek kaydını sil - FINAL FIXED VERSION
router.delete("/food/:entryId", authenticateToken, async (req, res) => {
  const client = await db.beginTransaction();

  try {
    const userId = req.userId;
    const { entryId } = req.params;

    console.log(`=== DELETE FOOD ENTRY START ===`);
    console.log(
      `User: ${userId}, Entry ID: ${entryId}, Type: ${typeof entryId}`
    );

    // Entry ID validation
    if (!entryId || entryId === "undefined" || entryId === "null") {
      await db.rollbackTransaction(client);
      return res.status(400).json({
        error: "Invalid entry ID",
        details: "Entry ID is required and must be valid",
      });
    }

    // Convert entryId to integer - BU ÖNEMLİ!
    const entryIdInt = parseInt(entryId, 10);

    if (isNaN(entryIdInt)) {
      await db.rollbackTransaction(client);
      return res.status(400).json({
        error: "Invalid entry ID format",
        details: "Entry ID must be a valid number",
      });
    }

    console.log(
      `Converted entry ID: ${entryIdInt} (type: ${typeof entryIdInt})`
    );

    // Yemek kaydını bul ve sahiplik kontrol et - INTEGER KULLAN
    const foodEntry = await client.query(
      "SELECT * FROM food_entries WHERE id = $1 AND user_id = $2",
      [entryIdInt, userId]
    );

    console.log(`Found ${foodEntry.rows.length} food entries`);

    if (foodEntry.rows.length === 0) {
      await db.rollbackTransaction(client);
      console.log(`Food entry not found: ${entryIdInt} for user ${userId}`);
      return res.status(404).json({
        error: "Food entry not found",
        details:
          "The food entry does not exist or you don't have permission to delete it",
      });
    }

    const entryToDelete = foodEntry.rows[0];
    const entryDate = entryToDelete.entry_date;

    console.log(`Deleting food entry:`, {
      id: entryToDelete.id,
      name: entryToDelete.food_name,
      calories: entryToDelete.total_calories,
      date: entryDate,
    });

    // Yemek kaydını sil - INTEGER KULLAN
    const deleteResult = await client.query(
      "DELETE FROM food_entries WHERE id = $1 AND user_id = $2 RETURNING *",
      [entryIdInt, userId]
    );

    console.log(`Delete result: ${deleteResult.rowCount} rows affected`);

    if (deleteResult.rowCount === 0) {
      await db.rollbackTransaction(client);
      return res.status(404).json({
        error: "Food entry not found",
        details: "Food entry could not be deleted",
      });
    }

    // Günlük toplamları güncelle
    console.log(`Updating daily totals for date: ${entryDate}`);
    await updateDailyTotals(client, userId, entryDate);

    await db.commitTransaction(client);

    console.log(`=== DELETE FOOD ENTRY COMPLETED ===`);

    res.json({
      success: true,
      message: "Food entry deleted successfully",
      deletedEntry: {
        id: entryToDelete.id,
        name: entryToDelete.food_name,
        calories: entryToDelete.total_calories,
        date: entryDate,
      },
    });
  } catch (err) {
    await db.rollbackTransaction(client);
    console.error("=== DELETE FOOD ENTRY ERROR ===", err);
    res.status(500).json({
      error: "Server error",
      details: "Failed to delete food entry",
      errorMessage: err.message,
    });
  }
});

// ===============================
// WATER ENDPOINTS
// ===============================

// Su tüketimi ekleme
router.post("/water", authenticateToken, async (req, res) => {
  const client = await db.beginTransaction();

  try {
    const userId = req.userId;
    const { amount, date } = req.body;

    if (!amount || amount <= 0 || amount > 2000) {
      await db.rollbackTransaction(client);
      return res.status(400).json({
        error: "Invalid water amount",
        details: "Water amount must be between 1 and 2000 ml",
      });
    }

    const entryDate = date || new Date().toISOString().split("T")[0];

    // Su kaydını ekle
    const waterLog = await client.query(
      "INSERT INTO water_logs (user_id, amount_ml, entry_date) VALUES ($1, $2, $3) RETURNING *",
      [userId, amount, entryDate]
    );

    // Günlük su toplamını güncelle veya oluştur
    await client.query(
      `INSERT INTO user_daily_data (user_id, date, water_consumed)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, date) 
       DO UPDATE SET 
         water_consumed = user_daily_data.water_consumed + $3,
         updated_at = NOW()`,
      [userId, entryDate, amount]
    );

    await db.commitTransaction(client);

    res.status(201).json({
      success: true,
      data: waterLog.rows[0],
      message: "Water intake logged successfully",
    });
  } catch (err) {
    await db.rollbackTransaction(client);
    console.error("Add water intake error:", err);
    res.status(500).json({
      error: "Server error",
      details: "Failed to log water intake",
    });
  }
});

// ===============================
// ACTIVITY ENDPOINTS - ENHANCED
// ===============================

// Aktivite ekleme - ENHANCED VERSION
router.post("/activity", authenticateToken, async (req, res) => {
  const client = await db.beginTransaction();

  try {
    const userId = req.userId;
    const {
      activityName,
      activityId,
      durationMinutes,
      caloriesBurned,
      intensity = "moderate",
      date,
    } = req.body;

    console.log("Received activity data:", req.body);

    // Validasyon
    if (!activityName || !durationMinutes || !caloriesBurned) {
      await db.rollbackTransaction(client);
      return res.status(400).json({
        error: "Missing required fields",
        details:
          "activityName, durationMinutes, and caloriesBurned are required",
      });
    }

    if (durationMinutes <= 0 || caloriesBurned <= 0) {
      await db.rollbackTransaction(client);
      return res.status(400).json({
        error: "Invalid values",
        details: "Duration and calories must be greater than 0",
      });
    }

    const entryDate = date || new Date().toISOString().split("T")[0];

    // Aktivite kaydını activity_logs tablosuna ekle
    const activityLog = await client.query(
      `INSERT INTO activity_logs (user_id, activity_name, activity_id, 
       duration_minutes, calories_burned, intensity, is_custom_activity, entry_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        userId,
        activityName.trim(),
        activityId || `activity_${Date.now()}`,
        parseInt(durationMinutes),
        parseFloat(caloriesBurned),
        intensity.toLowerCase(),
        false, // Frontend'den gelen aktiviteler genelde sample activities
        entryDate,
      ]
    );

    // User daily data tablosunu güncelle veya oluştur
    await client.query(
      `INSERT INTO user_daily_data (user_id, date, total_calories_burned)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, date) 
       DO UPDATE SET 
         total_calories_burned = user_daily_data.total_calories_burned + $3,
         updated_at = NOW()`,
      [userId, entryDate, parseFloat(caloriesBurned)]
    );

    await db.commitTransaction(client);

    console.log("Activity added successfully:", activityLog.rows[0]);

    res.status(201).json({
      success: true,
      data: activityLog.rows[0],
      message: "Activity logged successfully",
    });
  } catch (err) {
    await db.rollbackTransaction(client);
    console.error("Add activity error:", err);
    res.status(500).json({
      error: "Server error",
      details: "Failed to log activity",
    });
  }
});

// Aktivite güncelleme endpoint'i
router.put("/activity/:activityId", authenticateToken, async (req, res) => {
  const client = await db.beginTransaction();

  try {
    const userId = req.userId;
    const { activityId } = req.params;
    const { activityName, durationMinutes, caloriesBurned, intensity } =
      req.body;

    // Aktivite kaydının sahibi kontrolü
    const existing = await client.query(
      "SELECT * FROM activity_logs WHERE id = $1 AND user_id = $2",
      [activityId, userId]
    );

    if (existing.rows.length === 0) {
      await db.rollbackTransaction(client);
      return res.status(404).json({
        error: "Activity not found",
        details: "Activity not found or you don't have permission to edit it",
      });
    }

    const existingActivity = existing.rows[0];
    const oldCalories = parseFloat(existingActivity.calories_burned);

    // Güncelleme alanlarını hazırla
    const updateFields = [];
    const values = [activityId, userId];
    let paramCount = 3;

    if (activityName !== undefined) {
      updateFields.push(`activity_name = $${paramCount++}`);
      values.push(activityName.trim());
    }
    if (durationMinutes !== undefined) {
      if (durationMinutes <= 0) {
        await db.rollbackTransaction(client);
        return res.status(400).json({
          error: "Invalid duration",
          details: "Duration must be greater than 0",
        });
      }
      updateFields.push(`duration_minutes = $${paramCount++}`);
      values.push(parseInt(durationMinutes));
    }
    if (caloriesBurned !== undefined) {
      if (caloriesBurned <= 0) {
        await db.rollbackTransaction(client);
        return res.status(400).json({
          error: "Invalid calories",
          details: "Calories must be greater than 0",
        });
      }
      updateFields.push(`calories_burned = $${paramCount++}`);
      values.push(parseFloat(caloriesBurned));
    }
    if (intensity !== undefined) {
      updateFields.push(`intensity = $${paramCount++}`);
      values.push(intensity.toLowerCase());
    }

    if (updateFields.length === 0) {
      await db.rollbackTransaction(client);
      return res.status(400).json({
        error: "No fields to update",
        details: "Please provide at least one field to update",
      });
    }

    const query = `
      UPDATE activity_logs 
      SET ${updateFields.join(", ")}
      WHERE id = $1 AND user_id = $2 
      RETURNING *
    `;

    const result = await client.query(query, values);
    const updatedActivity = result.rows[0];
    const newCalories = parseFloat(updatedActivity.calories_burned);
    const caloriesDifference = newCalories - oldCalories;

    // User daily data tablosunu güncelle
    await client.query(
      `UPDATE user_daily_data 
       SET total_calories_burned = total_calories_burned + $3,
           updated_at = NOW()
       WHERE user_id = $1 AND date = $2`,
      [userId, existingActivity.entry_date, caloriesDifference]
    );

    await db.commitTransaction(client);

    res.json({
      success: true,
      data: updatedActivity,
      message: "Activity updated successfully",
    });
  } catch (err) {
    await db.rollbackTransaction(client);
    console.error("Update activity error:", err);
    res.status(500).json({
      error: "Server error",
      details: "Failed to update activity",
    });
  }
});

// Aktivite silme endpoint'i
router.delete("/activity/:activityId", authenticateToken, async (req, res) => {
  const client = await db.beginTransaction();

  try {
    const userId = req.userId;
    const { activityId } = req.params;

    // Aktivite kaydının sahibi kontrolü ve silme
    const result = await client.query(
      "DELETE FROM activity_logs WHERE id = $1 AND user_id = $2 RETURNING *",
      [activityId, userId]
    );

    if (result.rows.length === 0) {
      await db.rollbackTransaction(client);
      return res.status(404).json({
        error: "Activity not found",
        details: "Activity not found or you don't have permission to delete it",
      });
    }

    const deletedActivity = result.rows[0];
    const deletedCalories = parseFloat(deletedActivity.calories_burned);

    // User daily data tablosunu güncelle
    await client.query(
      `UPDATE user_daily_data 
       SET total_calories_burned = GREATEST(0, total_calories_burned - $3),
           updated_at = NOW()
       WHERE user_id = $1 AND date = $2`,
      [userId, deletedActivity.entry_date, deletedCalories]
    );

    await db.commitTransaction(client);

    res.json({
      success: true,
      message: "Activity deleted successfully",
      deletedActivity: deletedActivity,
    });
  } catch (err) {
    await db.rollbackTransaction(client);
    console.error("Delete activity error:", err);
    res.status(500).json({
      error: "Server error",
      details: "Failed to delete activity",
    });
  }
});

// ===============================
// HISTORY & ANALYTICS
// ===============================

// Beslenme geçmişi al (insights için)
router.get("/history", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { period = "7", endDate } = req.query;

    const targetEndDate = endDate || new Date().toISOString().split("T")[0];
    const periodDays = Math.min(Math.max(parseInt(period), 1), 365); // 1-365 gün arası

    const history = await db.query(
      `SELECT * FROM user_daily_data 
       WHERE user_id = $1 AND date <= $2 AND date >= ($2::date - INTERVAL '${
         periodDays - 1
       } days')
       ORDER BY date DESC`,
      [userId, targetEndDate]
    );

    res.json({
      success: true,
      data: history.rows,
      period: periodDays,
      endDate: targetEndDate,
      totalDays: history.rows.length,
    });
  } catch (err) {
    console.error("Get nutrition history error:", err);
    res.status(500).json({
      error: "Server error",
      details: "Failed to fetch nutrition history",
    });
  }
});

// ===============================
// HELPER FUNCTIONS
// ===============================

// Günlük toplamları güncelleme helper fonksiyonu
async function updateDailyTotals(client, userId, date) {
  try {
    // O günün tüm yemek kayıtlarından toplamları hesapla
    const totals = await client.query(
      `SELECT 
         COALESCE(SUM(total_calories), 0) as total_calories,
         COALESCE(SUM(total_protein), 0) as total_protein,
         COALESCE(SUM(total_carbs), 0) as total_carbs,
         COALESCE(SUM(total_fat), 0) as total_fat
       FROM food_entries 
       WHERE user_id = $1 AND entry_date = $2`,
      [userId, date]
    );

    // Günlük veri tablosunu güncelle veya oluştur
    await client.query(
      `INSERT INTO user_daily_data (user_id, date, total_calories_consumed, 
       total_protein_consumed, total_carbs_consumed, total_fat_consumed)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id, date) 
       DO UPDATE SET 
         total_calories_consumed = $3,
         total_protein_consumed = $4,
         total_carbs_consumed = $5,
         total_fat_consumed = $6,
         updated_at = NOW()`,
      [
        userId,
        date,
        totals.rows[0].total_calories,
        totals.rows[0].total_protein,
        totals.rows[0].total_carbs,
        totals.rows[0].total_fat,
      ]
    );

    console.log(`Updated daily totals for user ${userId}, date ${date}`);
  } catch (err) {
    console.error("Update daily totals error:", err);
    throw err;
  }
}

module.exports = router;
