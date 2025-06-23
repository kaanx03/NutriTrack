// backend/src/routes/user.js - User profile management
const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../db");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Kullanıcı profilini güncelle
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
