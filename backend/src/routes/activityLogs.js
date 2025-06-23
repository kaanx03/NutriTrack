// backend/src/routes/activityLogs.js - Complete Activity Logs Management
const express = require("express");
const db = require("../db");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// ===============================
// DAILY ACTIVITY LOGS MANAGEMENT
// ===============================

// Belirli bir tarih için aktivite kayıtlarını al
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { date } = req.query;

    // Tarih formatını kontrol et
    if (!date) {
      return res.status(400).json({
        error: "Missing date parameter",
        details: "Date parameter is required in YYYY-MM-DD format",
      });
    }

    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({
        error: "Invalid date format",
        details: "Date must be in YYYY-MM-DD format",
      });
    }

    // O tarih için aktivite kayıtlarını al
    const activityLogs = await db.query(
      `SELECT 
         id,
         activity_name,
         activity_id,
         duration_minutes,
         calories_burned,
         intensity,
         is_custom_activity,
         entry_date,
         created_at
       FROM activity_logs 
       WHERE user_id = $1 AND entry_date = $2
       ORDER BY created_at DESC`,
      [userId, date]
    );

    // Toplam yakılan kaloriyi hesapla
    const totalCaloriesBurned = activityLogs.rows.reduce(
      (total, log) => total + parseFloat(log.calories_burned || 0),
      0
    );

    res.json({
      success: true,
      date: date,
      data: activityLogs.rows,
      totalCaloriesBurned: Math.round(totalCaloriesBurned),
      count: activityLogs.rows.length,
    });
  } catch (err) {
    console.error("Get daily activity logs error:", err);
    res.status(500).json({
      error: "Server error",
      details: "Failed to fetch daily activity logs",
    });
  }
});

// Yeni aktivite kaydı ekle
router.post("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const {
      activityName,
      activityId,
      durationMinutes,
      caloriesBurned,
      intensity = "moderate",
      isCustomActivity = false,
      date,
    } = req.body;

    // Validasyon
    if (!activityName || !durationMinutes || !caloriesBurned) {
      return res.status(400).json({
        error: "Missing required fields",
        details:
          "activityName, durationMinutes, and caloriesBurned are required",
      });
    }

    if (durationMinutes <= 0 || caloriesBurned <= 0) {
      return res.status(400).json({
        error: "Invalid values",
        details: "Duration and calories must be greater than 0",
      });
    }

    // Tarih belirleme (eğer gönderilmemişse bugün)
    const entryDate = date || new Date().toISOString().split("T")[0];

    // Aktivite kaydını ekle
    const result = await db.query(
      `INSERT INTO activity_logs 
       (user_id, activity_name, activity_id, duration_minutes, 
        calories_burned, intensity, is_custom_activity, entry_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING *`,
      [
        userId,
        activityName,
        activityId || `activity_${Date.now()}`,
        durationMinutes,
        caloriesBurned,
        intensity,
        isCustomActivity,
        entryDate,
      ]
    );

    // User daily data tablosunu güncelle
    await updateUserDailyData(userId, entryDate);

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: "Activity log added successfully",
    });
  } catch (err) {
    console.error("Add activity log error:", err);
    res.status(500).json({
      error: "Server error",
      details: "Failed to add activity log",
    });
  }
});

// Aktivite kaydını güncelle
router.put("/:logId", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { logId } = req.params;
    const { activityName, durationMinutes, caloriesBurned, intensity } =
      req.body;

    // Aktivite kaydının sahibi kontrolü
    const existing = await db.query(
      "SELECT * FROM activity_logs WHERE id = $1 AND user_id = $2",
      [logId, userId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        error: "Activity log not found",
        details:
          "Activity log not found or you don't have permission to edit it",
      });
    }

    const existingLog = existing.rows[0];

    // Güncelleme alanlarını hazırla
    const updateFields = [];
    const values = [logId, userId];
    let paramCount = 3;

    if (activityName !== undefined) {
      updateFields.push(`activity_name = $${paramCount++}`);
      values.push(activityName);
    }
    if (durationMinutes !== undefined) {
      if (durationMinutes <= 0) {
        return res.status(400).json({
          error: "Invalid duration",
          details: "Duration must be greater than 0",
        });
      }
      updateFields.push(`duration_minutes = $${paramCount++}`);
      values.push(durationMinutes);
    }
    if (caloriesBurned !== undefined) {
      if (caloriesBurned <= 0) {
        return res.status(400).json({
          error: "Invalid calories",
          details: "Calories must be greater than 0",
        });
      }
      updateFields.push(`calories_burned = $${paramCount++}`);
      values.push(caloriesBurned);
    }
    if (intensity !== undefined) {
      updateFields.push(`intensity = $${paramCount++}`);
      values.push(intensity);
    }

    if (updateFields.length === 0) {
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

    const result = await db.query(query, values);

    // User daily data tablosunu güncelle
    await updateUserDailyData(userId, existingLog.entry_date);

    res.json({
      success: true,
      data: result.rows[0],
      message: "Activity log updated successfully",
    });
  } catch (err) {
    console.error("Update activity log error:", err);
    res.status(500).json({
      error: "Server error",
      details: "Failed to update activity log",
    });
  }
});

// Aktivite kaydını sil
router.delete("/:logId", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { logId } = req.params;

    // Aktivite kaydının sahibi kontrolü ve silme
    const result = await db.query(
      "DELETE FROM activity_logs WHERE id = $1 AND user_id = $2 RETURNING *",
      [logId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Activity log not found",
        details:
          "Activity log not found or you don't have permission to delete it",
      });
    }

    const deletedLog = result.rows[0];

    // User daily data tablosunu güncelle
    await updateUserDailyData(userId, deletedLog.entry_date);

    res.json({
      success: true,
      message: "Activity log deleted successfully",
      deletedLog: deletedLog,
    });
  } catch (err) {
    console.error("Delete activity log error:", err);
    res.status(500).json({
      error: "Server error",
      details: "Failed to delete activity log",
    });
  }
});

// Belirli bir hafta/ay için aktivite özeti al
router.get("/summary", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { startDate, endDate, period = "week" } = req.query;

    let start, end;

    if (startDate && endDate) {
      start = startDate;
      end = endDate;
    } else {
      // Varsayılan olarak bu haftayı al
      const today = new Date();
      if (period === "week") {
        const dayOfWeek = today.getDay();
        start = new Date(today.setDate(today.getDate() - dayOfWeek));
        end = new Date(today.setDate(start.getDate() + 6));
      } else if (period === "month") {
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      }

      start = start.toISOString().split("T")[0];
      end = end.toISOString().split("T")[0];
    }

    // Periodo için aktivite özetini al
    const summary = await db.query(
      `SELECT 
         COUNT(*) as total_activities,
         SUM(duration_minutes) as total_minutes,
         SUM(calories_burned) as total_calories_burned,
         AVG(calories_burned) as avg_calories_per_activity,
         COUNT(DISTINCT entry_date) as active_days
       FROM activity_logs 
       WHERE user_id = $1 AND entry_date BETWEEN $2 AND $3`,
      [userId, start, end]
    );

    // Günlük breakdown
    const dailyBreakdown = await db.query(
      `SELECT 
         entry_date,
         COUNT(*) as activities_count,
         SUM(duration_minutes) as total_minutes,
         SUM(calories_burned) as total_calories
       FROM activity_logs 
       WHERE user_id = $1 AND entry_date BETWEEN $2 AND $3
       GROUP BY entry_date
       ORDER BY entry_date`,
      [userId, start, end]
    );

    // En popüler aktiviteler
    const topActivities = await db.query(
      `SELECT 
         activity_name,
         COUNT(*) as frequency,
         SUM(duration_minutes) as total_minutes,
         SUM(calories_burned) as total_calories
       FROM activity_logs 
       WHERE user_id = $1 AND entry_date BETWEEN $2 AND $3
       GROUP BY activity_name
       ORDER BY frequency DESC, total_calories DESC
       LIMIT 5`,
      [userId, start, end]
    );

    res.json({
      success: true,
      period: {
        startDate: start,
        endDate: end,
        type: period,
      },
      summary: {
        totalActivities: parseInt(summary.rows[0].total_activities) || 0,
        totalMinutes: parseInt(summary.rows[0].total_minutes) || 0,
        totalCaloriesBurned:
          Math.round(summary.rows[0].total_calories_burned) || 0,
        avgCaloriesPerActivity:
          Math.round(summary.rows[0].avg_calories_per_activity) || 0,
        activeDays: parseInt(summary.rows[0].active_days) || 0,
      },
      dailyBreakdown: dailyBreakdown.rows.map((day) => ({
        date: day.entry_date,
        activitiesCount: parseInt(day.activities_count),
        totalMinutes: parseInt(day.total_minutes),
        totalCalories: Math.round(day.total_calories),
      })),
      topActivities: topActivities.rows.map((activity) => ({
        name: activity.activity_name,
        frequency: parseInt(activity.frequency),
        totalMinutes: parseInt(activity.total_minutes),
        totalCalories: Math.round(activity.total_calories),
      })),
    });
  } catch (err) {
    console.error("Get activity summary error:", err);
    res.status(500).json({
      error: "Server error",
      details: "Failed to fetch activity summary",
    });
  }
});

// Belirli bir aktivite türünün geçmiş verilerini al
router.get("/history/:activityName", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { activityName } = req.params;
    const { limit = 30, startDate, endDate } = req.query;

    let query = `
      SELECT 
        id,
        activity_name,
        duration_minutes,
        calories_burned,
        intensity,
        entry_date,
        created_at
      FROM activity_logs 
      WHERE user_id = $1 AND LOWER(activity_name) = LOWER($2)
    `;

    const queryParams = [userId, activityName];
    let paramCount = 3;

    // Tarih aralığı filtresi
    if (startDate && endDate) {
      query += ` AND entry_date BETWEEN $${paramCount++} AND $${paramCount++}`;
      queryParams.push(startDate, endDate);
    } else if (startDate) {
      query += ` AND entry_date >= $${paramCount++}`;
      queryParams.push(startDate);
    } else if (endDate) {
      query += ` AND entry_date <= $${paramCount++}`;
      queryParams.push(endDate);
    }

    query += ` ORDER BY entry_date DESC, created_at DESC LIMIT $${paramCount}`;
    queryParams.push(limit);

    const result = await db.query(query, queryParams);

    // İstatistikler hesapla
    const stats = {
      totalSessions: result.rows.length,
      totalMinutes: result.rows.reduce(
        (sum, row) => sum + parseInt(row.duration_minutes),
        0
      ),
      totalCalories: result.rows.reduce(
        (sum, row) => sum + parseFloat(row.calories_burned),
        0
      ),
      averageSession: 0,
      averageCaloriesPerSession: 0,
    };

    if (stats.totalSessions > 0) {
      stats.averageSession = Math.round(
        stats.totalMinutes / stats.totalSessions
      );
      stats.averageCaloriesPerSession = Math.round(
        stats.totalCalories / stats.totalSessions
      );
    }

    res.json({
      success: true,
      activityName: activityName,
      data: result.rows,
      stats: stats,
      count: result.rows.length,
    });
  } catch (err) {
    console.error("Get activity history error:", err);
    res.status(500).json({
      error: "Server error",
      details: "Failed to fetch activity history",
    });
  }
});

// Kullanıcının en aktif günlerini al
router.get("/active-days", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { period = 30 } = req.query;

    const periodDays = Math.min(Math.max(parseInt(period), 1), 365);

    const activeDays = await db.query(
      `SELECT 
         entry_date,
         COUNT(*) as activities_count,
         SUM(duration_minutes) as total_minutes,
         SUM(calories_burned) as total_calories,
         EXTRACT(DOW FROM entry_date) as day_of_week
       FROM activity_logs 
       WHERE user_id = $1 AND entry_date >= CURRENT_DATE - INTERVAL '${periodDays} days'
       GROUP BY entry_date
       ORDER BY total_calories DESC, total_minutes DESC
       LIMIT 10`,
      [userId]
    );

    // Haftanın günlerine göre aktivite dağılımı
    const weeklyDistribution = await db.query(
      `SELECT 
         EXTRACT(DOW FROM entry_date) as day_of_week,
         COUNT(*) as activities_count,
         SUM(duration_minutes) as total_minutes,
         SUM(calories_burned) as total_calories,
         AVG(calories_burned) as avg_calories
       FROM activity_logs 
       WHERE user_id = $1 AND entry_date >= CURRENT_DATE - INTERVAL '${periodDays} days'
       GROUP BY EXTRACT(DOW FROM entry_date)
       ORDER BY day_of_week`,
      [userId]
    );

    // Günlerin isimlerini ekle
    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const weeklyWithNames = weeklyDistribution.rows.map((day) => ({
      ...day,
      dayName: dayNames[parseInt(day.day_of_week)],
      activitiesCount: parseInt(day.activities_count),
      totalMinutes: parseInt(day.total_minutes),
      totalCalories: Math.round(day.total_calories),
      avgCalories: Math.round(day.avg_calories),
    }));

    res.json({
      success: true,
      period: `Last ${periodDays} days`,
      data: {
        topActiveDays: activeDays.rows.map((day) => ({
          date: day.entry_date,
          activitiesCount: parseInt(day.activities_count),
          totalMinutes: parseInt(day.total_minutes),
          totalCalories: Math.round(day.total_calories),
          dayOfWeek: dayNames[parseInt(day.day_of_week)],
        })),
        weeklyDistribution: weeklyWithNames,
      },
    });
  } catch (err) {
    console.error("Get active days error:", err);
    res.status(500).json({
      error: "Server error",
      details: "Failed to fetch active days data",
    });
  }
});

// ===============================
// HELPER FUNCTIONS
// ===============================

// User daily data tablosunu güncelle
async function updateUserDailyData(userId, date) {
  try {
    // O tarih için toplam aktivite verilerini hesapla
    const dailyStats = await db.query(
      `SELECT 
         COALESCE(SUM(calories_burned), 0) as total_calories_burned
       FROM activity_logs 
       WHERE user_id = $1 AND entry_date = $2`,
      [userId, date]
    );

    const totalCaloriesBurned =
      parseFloat(dailyStats.rows[0].total_calories_burned) || 0;

    // User daily data tablosunu güncelle veya oluştur
    await db.query(
      `INSERT INTO user_daily_data (user_id, date, total_calories_burned)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, date) 
       DO UPDATE SET 
         total_calories_burned = $3,
         updated_at = NOW()`,
      [userId, date, totalCaloriesBurned]
    );

    console.log(
      `Updated daily data for user ${userId}, date ${date}: ${totalCaloriesBurned} calories burned`
    );
  } catch (error) {
    console.error("Update user daily data error:", error);
  }
}

module.exports = router;
