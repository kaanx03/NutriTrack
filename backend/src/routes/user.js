// backend/src/routes/user.js - User profile management
const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../db");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Get user profile
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;

    const result = await db.query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.phone_number,
              u.gender, u.birth_date, u.height, u.weight, u.activity_level,
              u.profile_image_url, u.created_at,
              dt.daily_calories, dt.daily_protein, dt.daily_carbs,
              dt.daily_fat, dt.water_target, dt.goal_weight
       FROM users u
       LEFT JOIN user_daily_targets dt ON u.id = dt.user_id
       WHERE u.id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const u = result.rows[0];
    res.json({
      success: true,
      data: {
        id: u.id,
        email: u.email,
        firstName: u.first_name,
        lastName: u.last_name,
        phoneNumber: u.phone_number,
        gender: u.gender,
        birthDate: u.birth_date,
        height: u.height,
        weight: u.weight,
        activityLevel: u.activity_level,
        profileImageUrl: u.profile_image_url,
        createdAt: u.created_at,
        targets: {
          dailyCalories: u.daily_calories,
          dailyProtein: u.daily_protein,
          dailyCarbs: u.daily_carbs,
          dailyFat: u.daily_fat,
          waterTarget: u.water_target,
          goalWeight: u.goal_weight,
        },
      },
    });
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ error: "Server error", details: "Failed to fetch profile" });
  }
});

// Get daily nutrition targets
router.get("/daily-targets", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;

    const result = await db.query(
      "SELECT * FROM user_daily_targets WHERE user_id = $1",
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Targets not found" });
    }

    const t = result.rows[0];
    res.json({
      success: true,
      data: {
        dailyCalories: t.daily_calories,
        dailyProtein:  t.daily_protein,
        dailyCarbs:    t.daily_carbs,
        dailyFat:      t.daily_fat,
        waterTarget:   t.water_target,
        goal_weight:   t.goal_weight,
      },
    });
  } catch (err) {
    console.error("Get daily targets error:", err);
    res.status(500).json({ error: "Server error", details: "Failed to fetch targets" });
  }
});

// Update daily nutrition targets (including goal weight)
router.put("/daily-targets", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { daily_calories, daily_protein, daily_carbs, daily_fat, water_target, goal_weight } = req.body;

    const fields = [];
    const values = [userId];
    let idx = 2;

    if (daily_calories !== undefined) { fields.push(`daily_calories = $${idx++}`); values.push(daily_calories); }
    if (daily_protein  !== undefined) { fields.push(`daily_protein  = $${idx++}`); values.push(daily_protein); }
    if (daily_carbs    !== undefined) { fields.push(`daily_carbs    = $${idx++}`); values.push(daily_carbs); }
    if (daily_fat      !== undefined) { fields.push(`daily_fat      = $${idx++}`); values.push(daily_fat); }
    if (water_target   !== undefined) { fields.push(`water_target   = $${idx++}`); values.push(water_target); }
    if (goal_weight    !== undefined) { fields.push(`goal_weight    = $${idx++}`); values.push(goal_weight); }

    if (fields.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    fields.push(`updated_at = NOW()`);

    const result = await db.query(
      `UPDATE user_daily_targets SET ${fields.join(", ")} WHERE user_id = $1 RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Targets not found for this user" });
    }

    const t = result.rows[0];
    res.json({
      success: true,
      data: {
        dailyCalories: t.daily_calories,
        dailyProtein:  t.daily_protein,
        dailyCarbs:    t.daily_carbs,
        dailyFat:      t.daily_fat,
        waterTarget:   t.water_target,
        goal_weight:   t.goal_weight,
      },
    });
  } catch (err) {
    console.error("Update daily targets error:", err);
    res.status(500).json({ error: "Server error", details: "Failed to update targets" });
  }
});

// Update user profile
router.put("/profile", authenticateToken, async (req, res) => {
  const client = await db.beginTransaction();

  try {
    const userId = req.userId;
    const {
      firstName,
      lastName,
      phoneNumber,
      gender,
      birthDate,
      height,
      weight,
      activityLevel,
      profileImageUrl,
    } = req.body;

    // Kullanıcı bilgilerini güncelle
    const updateFields = [];
    const values = [];
    let paramCount = 2; // $1 userId için ayrılmış

    if (firstName !== undefined) {
      updateFields.push(`first_name = $${paramCount++}`);
      values.push(firstName);
    }
    if (lastName !== undefined) {
      updateFields.push(`last_name = $${paramCount++}`);
      values.push(lastName);
    }
    if (phoneNumber !== undefined) {
      updateFields.push(`phone_number = $${paramCount++}`);
      values.push(phoneNumber);
    }
    if (gender !== undefined) {
      updateFields.push(`gender = $${paramCount++}`);
      values.push(gender);
    }
    if (birthDate !== undefined) {
      updateFields.push(`birth_date = $${paramCount++}`);
      values.push(birthDate);
    }
    if (height !== undefined) {
      updateFields.push(`height = $${paramCount++}`);
      values.push(height);
    }
    if (weight !== undefined) {
      updateFields.push(`weight = $${paramCount++}`);
      values.push(weight);
    }
    if (activityLevel !== undefined) {
      updateFields.push(`activity_level = $${paramCount++}`);
      values.push(activityLevel);
    }
    if (profileImageUrl !== undefined) {
      updateFields.push(`profile_image_url = $${paramCount++}`);
      values.push(profileImageUrl);
    }

    if (updateFields.length === 0) {
      await db.rollbackTransaction(client);
      return res.status(400).json({
        error: "No fields to update",
        details: "Please provide at least one field to update",
      });
    }

    updateFields.push(`updated_at = NOW()`);

    const userQuery = `
      UPDATE users 
      SET ${updateFields.join(", ")}
      WHERE id = $1 
      RETURNING *
    `;

    const userResult = await client.query(userQuery, [userId, ...values]);

    // Eğer kilo, boy, yaş veya aktivite seviyesi değiştiyse hedefleri yeniden hesapla
    if (
      height !== undefined ||
      weight !== undefined ||
      activityLevel !== undefined ||
      birthDate !== undefined
    ) {
      const user = userResult.rows[0];

      // Yaş hesaplama
      const age = user.birth_date
        ? new Date().getFullYear() - new Date(user.birth_date).getFullYear()
        : 25;

      // Yeni hedefleri hesapla
      const targets = calculateNutritionTargets(
        user.weight || 70,
        user.height || 170,
        age,
        user.gender || "male",
        user.activity_level || 3
      );

      // Hedefleri güncelle
      await client.query(
        `UPDATE user_daily_targets 
         SET daily_calories = $2, daily_protein = $3, daily_carbs = $4, daily_fat = $5, updated_at = NOW()
         WHERE user_id = $1`,
        [
          userId,
          targets.dailyCalories,
          targets.protein,
          targets.carbs,
          targets.fat,
        ]
      );

      // Kullanıcı ayarlarındaki kalori hedefini de güncelle
      await client.query(
        `UPDATE user_settings 
         SET calorie_intake_goal = $2, updated_at = NOW()
         WHERE user_id = $1`,
        [userId, targets.dailyCalories]
      );
    }

    await db.commitTransaction(client);

    // Güncel kullanıcı bilgilerini al
    const updatedUser = await db.query(
      `
      SELECT u.*, udt.daily_calories, udt.daily_protein, udt.daily_carbs, 
             udt.daily_fat, udt.water_target, udt.goal_weight
      FROM users u
      LEFT JOIN user_daily_targets udt ON u.id = udt.user_id
      WHERE u.id = $1
    `,
      [userId]
    );

    const user = updatedUser.rows[0];

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phoneNumber: user.phone_number,
        gender: user.gender,
        birthDate: user.birth_date,
        height: user.height,
        weight: user.weight,
        activityLevel: user.activity_level,
        profileImageUrl: user.profile_image_url,
        targets: {
          dailyCalories: user.daily_calories,
          dailyProtein: user.daily_protein,
          dailyCarbs: user.daily_carbs,
          dailyFat: user.daily_fat,
          waterTarget: user.water_target,
          goalWeight: user.goal_weight,
        },
      },
    });
  } catch (err) {
    await db.rollbackTransaction(client);
    console.error("Update profile error:", err);
    res.status(500).json({
      error: "Server error",
      details: "Failed to update profile",
    });
  }
});

// Şifre değiştirme
router.put("/password", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: "Missing required fields",
        details: "Both currentPassword and newPassword are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        error: "Password too short",
        details: "New password must be at least 6 characters long",
      });
    }

    // Mevcut şifreyi kontrol et
    const user = await db.query(
      "SELECT password_hash FROM users WHERE id = $1",
      [userId]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({
        error: "User not found",
        details: "User account not found",
      });
    }

    const isValidPassword = await bcrypt.compare(
      currentPassword,
      user.rows[0].password_hash
    );

    if (!isValidPassword) {
      return res.status(401).json({
        error: "Invalid current password",
        details: "The current password you entered is incorrect",
      });
    }

    // Yeni şifreyi hashle ve güncelle
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    await db.query(
      "UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2",
      [hashedNewPassword, userId]
    );

    res.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (err) {
    console.error("Update password error:", err);
    res.status(500).json({
      error: "Server error",
      details: "Failed to update password",
    });
  }
});

// Kullanıcı hesabını deaktive etme
router.put("/deactivate", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        error: "Password required",
        details: "Password confirmation is required to deactivate account",
      });
    }

    // Şifreyi doğrula
    const user = await db.query(
      "SELECT password_hash FROM users WHERE id = $1",
      [userId]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({
        error: "User not found",
        details: "User account not found",
      });
    }

    const isValidPassword = await bcrypt.compare(
      password,
      user.rows[0].password_hash
    );

    if (!isValidPassword) {
      return res.status(401).json({
        error: "Invalid password",
        details: "Password confirmation failed",
      });
    }

    // Hesabı deaktive et
    await db.query(
      "UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1",
      [userId]
    );

    res.json({
      success: true,
      message: "Account deactivated successfully",
    });
  } catch (err) {
    console.error("Deactivate account error:", err);
    res.status(500).json({
      error: "Server error",
      details: "Failed to deactivate account",
    });
  }
});

// Kullanıcı istatistikleri al
router.get("/stats", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;

    // Son 30 günün verilerini al
    const stats = await db.query(
      `
      SELECT 
        COUNT(*) as total_days_logged,
        AVG(total_calories_consumed) as avg_calories,
        AVG(total_protein_consumed) as avg_protein,
        AVG(total_carbs_consumed) as avg_carbs,
        AVG(total_fat_consumed) as avg_fat,
        AVG(water_consumed) as avg_water,
        AVG(total_calories_burned) as avg_calories_burned,
        MAX(date) as last_log_date,
        MIN(date) as first_log_date
      FROM user_daily_data 
      WHERE user_id = $1 AND date >= CURRENT_DATE - INTERVAL '30 days'
    `,
      [userId]
    );

    // Toplam yemek kayıt sayısı
    const foodStats = await db.query(
      `
      SELECT 
        COUNT(*) as total_food_entries,
        COUNT(DISTINCT DATE(created_at)) as days_with_food_logs
      FROM food_entries 
      WHERE user_id = $1 AND created_at >= CURRENT_DATE - INTERVAL '30 days'
    `,
      [userId]
    );

    // Toplam aktivite kayıt sayısı
    const activityStats = await db.query(
      `
      SELECT 
        COUNT(*) as total_activities,
        SUM(duration_minutes) as total_exercise_minutes,
        COUNT(DISTINCT DATE(created_at)) as days_with_activities
      FROM activity_logs 
      WHERE user_id = $1 AND created_at >= CURRENT_DATE - INTERVAL '30 days'
    `,
      [userId]
    );

    // Favori yemek ve aktivite sayıları
    const favoriteStats = await db.query(
      `
      SELECT 
        (SELECT COUNT(*) FROM favorite_foods WHERE user_id = $1) as favorite_foods_count,
        (SELECT COUNT(*) FROM favorite_activities WHERE user_id = $1) as favorite_activities_count,
        (SELECT COUNT(*) FROM custom_foods WHERE user_id = $1) as custom_foods_count,
        (SELECT COUNT(*) FROM custom_activities WHERE user_id = $1) as custom_activities_count
    `,
      [userId]
    );

    res.json({
      success: true,
      data: {
        period: "Last 30 days",
        nutrition: {
          totalDaysLogged: parseInt(stats.rows[0].total_days_logged),
          averageCalories: Math.round(stats.rows[0].avg_calories || 0),
          averageProtein: Math.round(stats.rows[0].avg_protein || 0),
          averageCarbs: Math.round(stats.rows[0].avg_carbs || 0),
          averageFat: Math.round(stats.rows[0].avg_fat || 0),
          averageWater: Math.round(stats.rows[0].avg_water || 0),
          lastLogDate: stats.rows[0].last_log_date,
          firstLogDate: stats.rows[0].first_log_date,
        },
        food: {
          totalFoodEntries: parseInt(foodStats.rows[0].total_food_entries),
          daysWithFoodLogs: parseInt(foodStats.rows[0].days_with_food_logs),
        },
        activity: {
          totalActivities: parseInt(activityStats.rows[0].total_activities),
          totalExerciseMinutes: parseInt(
            activityStats.rows[0].total_exercise_minutes || 0
          ),
          daysWithActivities: parseInt(
            activityStats.rows[0].days_with_activities
          ),
          averageCaloriesBurned: Math.round(
            stats.rows[0].avg_calories_burned || 0
          ),
        },
        favorites: {
          favoriteFoodsCount: parseInt(
            favoriteStats.rows[0].favorite_foods_count
          ),
          favoriteActivitiesCount: parseInt(
            favoriteStats.rows[0].favorite_activities_count
          ),
          customFoodsCount: parseInt(favoriteStats.rows[0].custom_foods_count),
          customActivitiesCount: parseInt(
            favoriteStats.rows[0].custom_activities_count
          ),
        },
      },
    });
  } catch (err) {
    console.error("Get user stats error:", err);
    res.status(500).json({
      error: "Server error",
      details: "Failed to fetch user statistics",
    });
  }
});

// ── GDPR: Data Export ─────────────────────────────────────────────────────────

router.get("/export", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;

    const [user, targets, foodEntries, waterLogs, weightLogs, activityLogs, settings] =
      await Promise.all([
        db.query(
          `SELECT id, email, first_name, last_name, phone_number, gender,
                  birth_date, height, weight, activity_level, created_at
           FROM users WHERE id = $1`,
          [userId]
        ),
        db.query("SELECT * FROM user_daily_targets WHERE user_id = $1", [userId]),
        db.query(
          "SELECT food_name, meal_type, calories, protein, carbs, fat, serving_size, logged_date FROM food_entries WHERE user_id = $1 ORDER BY logged_date DESC",
          [userId]
        ),
        db.query(
          "SELECT amount_ml, entry_date, logged_at FROM water_logs WHERE user_id = $1 ORDER BY entry_date DESC",
          [userId]
        ),
        db.query(
          "SELECT weight_kg, bmi, logged_date, notes FROM weight_logs WHERE user_id = $1 ORDER BY logged_date DESC",
          [userId]
        ),
        db.query(
          "SELECT activity_name, duration_minutes, calories_burned, logged_date FROM activity_logs WHERE user_id = $1 ORDER BY logged_date DESC",
          [userId]
        ),
        db.query(
          "SELECT calorie_intake_goal, water_intake_goal, weight_units, height_units FROM user_settings WHERE user_id = $1",
          [userId]
        ),
      ]);

    res.json({
      success: true,
      exportDate: new Date().toISOString(),
      data: {
        profile:      user.rows[0],
        targets:      targets.rows[0] || null,
        settings:     settings.rows[0] || null,
        foodEntries:  foodEntries.rows,
        waterLogs:    waterLogs.rows,
        weightLogs:   weightLogs.rows,
        activityLogs: activityLogs.rows,
      },
    });
  } catch (err) {
    console.error("Data export error:", err);
    res.status(500).json({ error: "Server error", details: "Failed to export data" });
  }
});

// ── GDPR: Account Deletion ────────────────────────────────────────────────────

router.delete("/account", authenticateToken, async (req, res) => {
  const client = await db.beginTransaction();
  try {
    const userId = req.userId;
    const { password } = req.body;

    if (!password) {
      await db.rollbackTransaction(client);
      return res.status(400).json({ error: "Password confirmation required" });
    }

    const user = await client.query(
      "SELECT password_hash FROM users WHERE id = $1",
      [userId]
    );

    if (user.rows.length === 0) {
      await db.rollbackTransaction(client);
      return res.status(404).json({ error: "User not found" });
    }

    const valid = await require("bcryptjs").compare(password, user.rows[0].password_hash);
    if (!valid) {
      await db.rollbackTransaction(client);
      return res.status(401).json({ error: "Invalid password" });
    }

    // Delete all user data in dependency order
    await client.query("DELETE FROM food_entries          WHERE user_id = $1", [userId]);
    await client.query("DELETE FROM water_logs            WHERE user_id = $1", [userId]);
    await client.query("DELETE FROM weight_logs           WHERE user_id = $1", [userId]);
    await client.query("DELETE FROM activity_logs         WHERE user_id = $1", [userId]);
    await client.query("DELETE FROM user_daily_data       WHERE user_id = $1", [userId]);
    await client.query("DELETE FROM user_daily_targets    WHERE user_id = $1", [userId]);
    await client.query("DELETE FROM user_settings         WHERE user_id = $1", [userId]);
    await client.query("DELETE FROM favorite_foods        WHERE user_id = $1", [userId]);
    await client.query("DELETE FROM favorite_activities   WHERE user_id = $1", [userId]);
    await client.query("DELETE FROM custom_foods          WHERE user_id = $1", [userId]);
    await client.query("DELETE FROM custom_activities     WHERE user_id = $1", [userId]);
    await client.query("DELETE FROM recent_foods          WHERE user_id = $1", [userId]);
    await client.query("DELETE FROM password_reset_tokens WHERE user_id = $1", [userId]);
    await client.query("DELETE FROM users                 WHERE id      = $1", [userId]);

    await db.commitTransaction(client);

    res.json({ success: true, message: "Account and all associated data permanently deleted." });
  } catch (err) {
    await db.rollbackTransaction(client);
    console.error("Account deletion error:", err);
    res.status(500).json({ error: "Server error", details: "Failed to delete account" });
  }
});

// BMR ve günlük kalori hesaplama fonksiyonu (auth.js'den kopyalanmış)
function calculateNutritionTargets(weight, height, age, gender, activityLevel) {
  let bmr;

  // Mifflin-St Jeor Equation
  if (gender === "male") {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }

  // Activity level multipliers
  const activityMultipliers = {
    1: 1.2, // Sedentary
    2: 1.375, // Light activity
    3: 1.55, // Moderate activity
    4: 1.725, // Very active
    5: 1.9, // Extra active
  };

  const dailyCalories = Math.round(
    bmr * (activityMultipliers[activityLevel] || 1.55)
  );

  // Makro besin dağılımı
  const protein = Math.round((dailyCalories * 0.25) / 4); // %25 protein
  const carbs = Math.round((dailyCalories * 0.5) / 4); // %50 karbonhidrat
  const fat = Math.round((dailyCalories * 0.25) / 9); // %25 yağ

  return {
    dailyCalories,
    protein,
    carbs,
    fat,
    bmr: Math.round(bmr),
  };
}

module.exports = router;
