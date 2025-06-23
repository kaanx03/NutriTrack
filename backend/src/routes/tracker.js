// backend/src/routes/tracker.js - Water & Weight detailed tracking
const express = require("express");
const db = require("../db"); // Assuming db.js provides beginTransaction, commitTransaction, rollbackTransaction, and query
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// ===============================
// WATER TRACKING
// ===============================

// Su kayıtlarını al (tarih aralığı ile)
router.get("/water", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { startDate, endDate, limit = 100 } = req.query;

    let query = `
      SELECT * FROM water_logs
      WHERE user_id = $1
    `;
    let params = [userId];
    let paramCount = 2;

    // Tarih filtreleri
    if (startDate) {
      query += ` AND entry_date >= $${paramCount}`;
      params.push(startDate);
      paramCount++;
    }

    if (endDate) {
      query += ` AND entry_date <= $${paramCount}`;
      params.push(endDate);
      paramCount++;
    }

    query += ` ORDER BY logged_at DESC LIMIT $${paramCount}`;
    params.push(parseInt(limit));

    const waterLogs = await db.query(query, params);

    res.json({
      success: true,
      data: waterLogs.rows,
      count: waterLogs.rows.length,
    });
  } catch (err) {
    console.error("Get water logs error:", err);
    res.status(500).json({
      error: "Server error",
      details: "Failed to fetch water logs",
    });
  }
});

// Su kaydı ekle
router.post("/water", authenticateToken, async (req, res) => {
  const client = await db.beginTransaction(); // Start a transaction

  try {
    const userId = req.userId;
    const { amount, date, time } = req.body;

    if (!amount || amount <= 0 || amount > 2000) {
      await db.rollbackTransaction(client); // Rollback on validation error
      return res.status(400).json({
        error: "Invalid water amount",
        details: "Water amount must be between 1 and 2000 ml",
      });
    }

    const entryDate = date || new Date().toISOString().split("T")[0];
    const entryTime = time || new Date().toISOString();

    // Su kaydını ekle
    const waterLog = await client.query(
      `INSERT INTO water_logs (user_id, amount_ml, entry_date, logged_at)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [userId, amount, entryDate, entryTime]
    );

    // Güncel su hedefini al
    const userTarget = await client.query(
      `SELECT water_target FROM user_daily_targets WHERE user_id = $1`,
      [userId]
    );
    const dailyWaterGoal = userTarget.rows[0]?.water_target || 2500; // Varsayılan değer

    // Günlük su toplamını güncelle veya oluştur
    // daily_water_goal'ı sadece NULL ise veya yeni bir gün başlıyorsa ayarla
    await client.query(
      `INSERT INTO user_daily_data (user_id, date, water_consumed, daily_water_goal)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, date)
       DO UPDATE SET water_consumed = user_daily_data.water_consumed + $3,
                     daily_water_goal = COALESCE(user_daily_data.daily_water_goal, $4),
                     updated_at = NOW()`,
      [userId, entryDate, amount, dailyWaterGoal] // Pass dailyWaterGoal fetched above
    );

    await db.commitTransaction(client); // Commit the transaction

    res.status(201).json({
      success: true,
      data: waterLog.rows[0],
      message: "Water intake logged successfully",
    });
  } catch (err) {
    await db.rollbackTransaction(client); // Rollback on any error
    console.error("Add water log error:", err);
    res.status(500).json({
      error: "Server error",
      details: "Failed to log water intake",
    });
  }
});

// Su kaydını sil
router.delete("/water/:logId", authenticateToken, async (req, res) => {
  const client = await db.beginTransaction(); // Start a transaction

  try {
    const userId = req.userId;
    const { logId } = req.params;

    // Su kaydını bul ve sahibi kontrolü
    const waterLog = await client.query(
      "SELECT * FROM water_logs WHERE id = $1 AND user_id = $2",
      [logId, userId]
    );

    if (waterLog.rows.length === 0) {
      await db.rollbackTransaction(client); // Rollback
      return res.status(404).json({
        error: "Water log not found",
        details:
          "Water log not found or you don't have permission to delete it",
      });
    }

    const log = waterLog.rows[0];

    // Su kaydını sil
    await client.query("DELETE FROM water_logs WHERE id = $1", [logId]);

    // Günlük toplamı güncelle (daily_water_goal'ı etkilemez)
    await client.query(
      `UPDATE user_daily_data
       SET water_consumed = GREATEST(0, water_consumed - $3), updated_at = NOW()
       WHERE user_id = $1 AND date = $2`,
      [userId, log.entry_date, log.amount_ml]
    );

    await db.commitTransaction(client); // Commit the transaction

    res.json({
      success: true,
      message: "Water log deleted successfully",
      deletedLog: log,
    });
  } catch (err) {
    await db.rollbackTransaction(client); // Rollback on any error
    console.error("Delete water log error:", err);
    res.status(500).json({
      error: "Server error",
      details: "Failed to delete water log",
    });
  }
});

// Günlük su istatistikleri
router.get("/water/daily/:date", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { date } = req.params;

    // O günün su kayıtları
    const waterLogs = await db.query(
      `SELECT * FROM water_logs
       WHERE user_id = $1 AND entry_date = $2
       ORDER BY logged_at ASC`,
      [userId, date]
    );

    // Günlük toplam ve hedef (user_daily_data'dan öncelikli)
    const dailyData = await db.query(
      `SELECT water_consumed, daily_water_goal FROM user_daily_data
       WHERE user_id = $1 AND date = $2`,
      [userId, date]
    );

    // Kullanıcının varsayılan su hedefi (eğer daily_water_goal yoksa)
    const userTarget = await db.query(
      `SELECT water_target FROM user_daily_targets WHERE user_id = $1`,
      [userId]
    );

    const totalConsumed = waterLogs.rows.reduce(
      (sum, log) => sum + log.amount_ml,
      0
    );
    // Use daily_water_goal from user_daily_data first, then user_daily_targets, then default
    const dailyGoal =
      dailyData.rows[0]?.daily_water_goal ||
      userTarget.rows[0]?.water_target ||
      2500;

    res.json({
      success: true,
      date: date,
      data: {
        logs: waterLogs.rows,
        summary: {
          totalConsumed: totalConsumed,
          dailyGoal: dailyGoal,
          percentage: Math.round((totalConsumed / dailyGoal) * 100),
          remaining: Math.max(0, dailyGoal - totalConsumed),
          logCount: waterLogs.rows.length,
        },
      },
    });
  } catch (err) {
    console.error("Get daily water stats error:", err);
    res.status(500).json({
      error: "Server error",
      details: "Failed to fetch daily water statistics",
    });
  }
});

// Su tüketim istatistikleri
router.get("/water/stats", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { period = 30 } = req.query;

    const periodDays = Math.min(Math.max(parseInt(period), 1), 365);

    // Genel istatistikler
    const generalStats = await db.query(
      `SELECT
          COUNT(*) as total_logs,
          SUM(amount_ml) as total_water_consumed,
          AVG(amount_ml) as avg_per_log,
          COUNT(DISTINCT entry_date) as active_days,
          MIN(entry_date) as first_log_date,
          MAX(entry_date) as last_log_date
        FROM water_logs
        WHERE user_id = $1 AND entry_date >= CURRENT_DATE - INTERVAL '${periodDays} days'`,
      [userId]
    );

    // Günlük ortalamalar
    const dailyStats = await db.query(
      `SELECT
          entry_date,
          SUM(amount_ml) as daily_total,
          COUNT(*) as daily_log_count
        FROM water_logs
        WHERE user_id = $1 AND entry_date >= CURRENT_DATE - INTERVAL '${periodDays} days'
        GROUP BY entry_date
        ORDER BY entry_date DESC`,
      [userId]
    );

    // Saatlik dağılım
    const hourlyDistribution = await db.query(
      `SELECT
          EXTRACT(HOUR FROM logged_at) as hour,
          COUNT(*) as log_count,
          SUM(amount_ml) as total_amount
        FROM water_logs
        WHERE user_id = $1 AND entry_date >= CURRENT_DATE - INTERVAL '${Math.min(
          periodDays,
          30
        )} days'
        GROUP BY EXTRACT(HOUR FROM logged_at)
        ORDER BY hour`,
      [userId]
    );

    const stats = generalStats.rows[0];
    const avgDailyWater =
      dailyStats.rows.length > 0
        ? dailyStats.rows.reduce(
            (sum, day) => sum + parseInt(day.daily_total),
            0
          ) / dailyStats.rows.length
        : 0;

    res.json({
      success: true,
      period: `Last ${periodDays} days`,
      data: {
        general: {
          totalLogs: parseInt(stats.total_logs) || 0,
          totalWaterConsumed: parseInt(stats.total_water_consumed) || 0,
          avgPerLog: Math.round(stats.avg_per_log) || 0,
          activeDays: parseInt(stats.active_days) || 0,
          avgDailyWater: Math.round(avgDailyWater),
          firstLogDate: stats.first_log_date,
          lastLogDate: stats.last_log_date,
        },
        dailyStats: dailyStats.rows.map((day) => ({
          date: day.entry_date,
          totalAmount: parseInt(day.daily_total),
          logCount: parseInt(day.daily_log_count),
        })),
        hourlyDistribution: hourlyDistribution.rows.map((hour) => ({
          hour: parseInt(hour.hour),
          logCount: parseInt(hour.log_count),
          totalAmount: parseInt(hour.total_amount),
        })),
      },
    });
  } catch (err) {
    console.error("Get water stats error:", err);
    res.status(500).json({
      error: "Server error",
      details: "Failed to fetch water statistics",
    });
  }
});

// ===============================
// WEIGHT TRACKING
// ===============================

// Kilo kayıtlarını al
router.get("/weight", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { startDate, endDate, limit = 100 } = req.query;

    let query = `
      SELECT * FROM weight_logs
      WHERE user_id = $1
    `;
    let params = [userId];
    let paramCount = 2;

    // Tarih filtreleri
    if (startDate) {
      query += ` AND logged_date >= $${paramCount}`;
      params.push(startDate);
      paramCount++;
    }

    if (endDate) {
      query += ` AND logged_date <= $${paramCount}`;
      params.push(endDate);
      paramCount++;
    }

    query += ` ORDER BY logged_date DESC LIMIT $${paramCount}`;
    params.push(parseInt(limit));

    const weightLogs = await db.query(query, params);

    res.json({
      success: true,
      data: weightLogs.rows,
      count: weightLogs.rows.length,
    });
  } catch (err) {
    console.error("Get weight logs error:", err);
    res.status(500).json({
      error: "Server error",
      details: "Failed to fetch weight logs",
    });
  }
});

// Kilo kaydı ekle
router.post("/weight", authenticateToken, async (req, res) => {
  const client = await db.beginTransaction(); // Start a transaction

  try {
    const userId = req.userId;
    const { weight, date, notes } = req.body;

    if (!weight || weight <= 0 || weight > 500) {
      await db.rollbackTransaction(client); // Rollback on validation error
      return res.status(400).json({
        error: "Invalid weight",
        details: "Weight must be between 1 and 500 kg",
      });
    }

    const loggedDate = date || new Date().toISOString().split("T")[0];

    // Kullanıcının boy bilgisini al BMI hesabı için
    const userInfo = await client.query(
      "SELECT height FROM users WHERE id = $1",
      [userId]
    );

    let bmi = null;
    if (userInfo.rows[0]?.height) {
      const heightInMeters = userInfo.rows[0].height / 100;
      bmi = weight / (heightInMeters * heightInMeters);
    }

    // Kilo kaydını ekle
    const weightLog = await client.query(
      `INSERT INTO weight_logs (user_id, weight_kg, bmi, logged_date, notes)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [userId, weight, bmi, loggedDate, notes]
    );

    // Kullanıcının mevcut kilosunu güncelle
    await client.query(
      "UPDATE users SET weight = $2, updated_at = NOW() WHERE id = $1",
      [userId, weight]
    );

    // Günlük veri tablosunda da kiloya yer ver
    await client.query(
      `INSERT INTO user_daily_data (user_id, date, weight_kg)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, date)
       DO UPDATE SET weight_kg = $3, updated_at = NOW()`,
      [userId, loggedDate, weight]
    );

    await db.commitTransaction(client); // Commit the transaction

    res.status(201).json({
      success: true,
      data: weightLog.rows[0],
      message: "Weight logged successfully",
    });
  } catch (err) {
    await db.rollbackTransaction(client); // Rollback on any error
    console.error("Add weight log error:", err);
    res.status(500).json({
      error: "Server error",
      details: "Failed to log weight",
    });
  }
});

// Kilo kaydını güncelle
router.put("/weight/:logId", authenticateToken, async (req, res) => {
  const client = await db.beginTransaction(); // Start a transaction

  try {
    const userId = req.userId;
    const { logId } = req.params;
    const { weight, notes } = req.body;

    // Kilo kaydını bul ve sahibi kontrolü
    const existing = await client.query(
      "SELECT * FROM weight_logs WHERE id = $1 AND user_id = $2",
      [logId, userId]
    );

    if (existing.rows.length === 0) {
      await db.rollbackTransaction(client); // Rollback
      return res.status(404).json({
        error: "Weight log not found",
        details: "Weight log not found or you don't have permission to edit it",
      });
    }

    const currentLog = existing.rows[0];

    // Yeni değerler
    const newWeight = weight || currentLog.weight_kg;
    const newNotes = notes !== undefined ? notes : currentLog.notes;

    // BMI hesapla
    const userInfo = await client.query(
      "SELECT height FROM users WHERE id = $1",
      [userId]
    );

    let bmi = null;
    if (userInfo.rows[0]?.height) {
      const heightInMeters = userInfo.rows[0].height / 100;
      bmi = newWeight / (heightInMeters * heightInMeters);
    }

    // Kilo kaydını güncelle
    const result = await client.query(
      `UPDATE weight_logs
       SET weight_kg = $3, bmi = $4, notes = $5, created_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [logId, userId, newWeight, bmi, newNotes]
    );

    // Eğer bu en son kayıtsa kullanıcının mevcut kilosunu da güncelle
    const latestLog = await client.query(
      `SELECT id FROM weight_logs
       WHERE user_id = $1
       ORDER BY logged_date DESC, created_at DESC
       LIMIT 1`,
      [userId]
    );

    if (latestLog.rows[0]?.id === parseInt(logId)) {
      await client.query(
        "UPDATE users SET weight = $2, updated_at = NOW() WHERE id = $1",
        [userId, newWeight]
      );
    }

    await db.commitTransaction(client); // Commit the transaction

    res.json({
      success: true,
      data: result.rows[0],
      message: "Weight log updated successfully",
    });
  } catch (err) {
    await db.rollbackTransaction(client); // Rollback on any error
    console.error("Update weight log error:", err);
    res.status(500).json({
      error: "Server error",
      details: "Failed to update weight log",
    });
  }
});

// Kilo kaydını sil
router.delete("/weight/:logId", authenticateToken, async (req, res) => {
  const client = await db.beginTransaction(); // Start a transaction

  try {
    const userId = req.userId;
    const { logId } = req.params;

    // Kilo kaydını bul ve sahibi kontrolü
    const weightLog = await client.query(
      "SELECT * FROM weight_logs WHERE id = $1 AND user_id = $2",
      [logId, userId]
    );

    if (weightLog.rows.length === 0) {
      await db.rollbackTransaction(client); // Rollback
      return res.status(404).json({
        error: "Weight log not found",
        details:
          "Weight log not found or you don't have permission to delete it",
      });
    }

    const log = weightLog.rows[0];

    // Kilo kaydını sil
    await client.query("DELETE FROM weight_logs WHERE id = $1", [logId]);

    // Eğer bu en son kayıtsa, bir önceki kayıtla kullanıcının kilosunu güncelle
    const latestLog = await client.query(
      `SELECT weight_kg FROM weight_logs
       WHERE user_id = $1
       ORDER BY logged_date DESC, created_at DESC
       LIMIT 1`,
      [userId]
    );

    if (latestLog.rows.length > 0) {
      await client.query(
        "UPDATE users SET weight = $2, updated_at = NOW() WHERE id = $1",
        [userId, latestLog.rows[0].weight_kg]
      );
    } else {
      // If no other weight logs exist, set user's weight to NULL or 0
      await client.query(
        "UPDATE users SET weight = NULL, updated_at = NOW() WHERE id = $1",
        [userId]
      );
    }

    await db.commitTransaction(client); // Commit the transaction

    res.json({
      success: true,
      message: "Weight log deleted successfully",
      deletedLog: log,
    });
  } catch (err) {
    await db.rollbackTransaction(client); // Rollback on any error
    console.error("Delete weight log error:", err);
    res.status(500).json({
      error: "Server error",
      details: "Failed to delete weight log",
    });
  }
});

// Kilo istatistikleri ve trend analizi
router.get("/weight/stats", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { period = 90 } = req.query; // Default 90 gün

    const periodDays = Math.min(Math.max(parseInt(period), 7), 365);

    // Kullanıcı bilgileri ve hedef kilo
    const userInfo = await db.query(
      `SELECT u.height, udt.goal_weight, u.weight as current_weight
       FROM users u
       LEFT JOIN user_daily_targets udt ON u.id = udt.user_id
       WHERE u.id = $1`,
      [userId]
    );

    // Belirtilen süredeki kilo kayıtları
    const weightLogs = await db.query(
      `SELECT weight_kg, bmi, logged_date
       FROM weight_logs
       WHERE user_id = $1 AND logged_date >= CURRENT_DATE - INTERVAL '${periodDays} days'
       ORDER BY logged_date ASC`,
      [userId]
    );

    if (weightLogs.rows.length === 0) {
      return res.json({
        success: true,
        message: "No weight data found for the specified period",
        data: {
          logs: [],
          stats: null,
          trend: null,
          goalProgress: null, // Ensure goalProgress is null if no data
        },
      });
    }

    // İstatistik hesaplamaları
    const weights = weightLogs.rows.map((log) => parseFloat(log.weight_kg));
    const firstWeight = weights[0];
    const lastWeight = weights[weights.length - 1];
    const minWeight = Math.min(...weights);
    const maxWeight = Math.max(...weights);
    const avgWeight = weights.reduce((sum, w) => sum + w, 0) / weights.length;

    // Trend hesaplama (basit lineer regresyon)
    const n = weights.length;
    const xSum = weights.reduce((sum, _, i) => sum + i, 0);
    const ySum = weights.reduce((sum, w) => sum + w, 0);
    const xySum = weights.reduce((sum, w, i) => sum + i * w, 0);
    const xSquareSum = weights.reduce((sum, _, i) => sum + i * i, 0);

    let slope = 0;
    if (n * xSquareSum - xSum * xSum !== 0) {
      // Avoid division by zero for single point or constant x values
      slope = (n * xySum - xSum * ySum) / (n * xSquareSum - xSum * xSum);
    }

    const trendDirection =
      slope > 0.01 ? "increasing" : slope < -0.01 ? "decreasing" : "stable";

    // BMI kategorisi
    let bmiCategory = "Unknown";
    const latestBMI = weightLogs.rows[weightLogs.rows.length - 1]?.bmi;
    if (latestBMI) {
      if (latestBMI < 18.5) bmiCategory = "Underweight";
      else if (latestBMI < 25) bmiCategory = "Normal";
      else if (latestBMI < 30) bmiCategory = "Overweight";
      else bmiCategory = "Obese";
    }

    // Hedefe ulaşma tahmin
    const goalWeight = userInfo.rows[0]?.goal_weight;
    let goalProgress = null;
    if (
      goalWeight !== null &&
      goalWeight !== undefined &&
      Math.abs(slope) > 0.001
    ) {
      const remainingWeight = goalWeight - lastWeight;
      const daysToGoal = remainingWeight / slope; // Can be negative if going in wrong direction

      if (
        (remainingWeight > 0 && slope > 0) || // Need to gain, weight is increasing
        (remainingWeight < 0 && slope < 0) // Need to lose, weight is decreasing
      ) {
        goalProgress = {
          remaining: Math.round(remainingWeight * 10) / 10,
          estimatedDays: Math.round(Math.abs(daysToGoal)), // Use absolute days for display
          onTrack: true, // Only true if heading in correct direction
        };
      } else {
        goalProgress = {
          remaining: Math.round(remainingWeight * 10) / 10,
          estimatedDays: null, // Cannot estimate if trend is opposite or flat
          onTrack: false,
        };
      }
    } else if (goalWeight !== null && goalWeight !== undefined) {
      // If slope is flat or no sufficient data, just show remaining
      goalProgress = {
        remaining: Math.round((goalWeight - lastWeight) * 10) / 10,
        estimatedDays: null,
        onTrack: false,
      };
    }

    res.json({
      success: true,
      period: `Last ${periodDays} days`,
      data: {
        logs: weightLogs.rows,
        stats: {
          currentWeight: lastWeight,
          goalWeight: goalWeight,
          firstWeight: firstWeight,
          lastWeight: lastWeight,
          minWeight: minWeight,
          maxWeight: maxWeight,
          avgWeight: Math.round(avgWeight * 10) / 10,
          totalChange: Math.round((lastWeight - firstWeight) * 10) / 10,
          latestBMI: latestBMI ? Math.round(latestBMI * 10) / 10 : null,
          bmiCategory: bmiCategory,
          logCount: weightLogs.rows.length,
        },
        trend: {
          direction: trendDirection,
          slope: Math.round(slope * 1000) / 1000, // kg per day
          weeklyChange: Math.round(slope * 7 * 10) / 10, // kg per week
          monthlyChange: Math.round(slope * 30 * 10) / 10, // kg per month
        },
        goalProgress: goalProgress,
      },
    });
  } catch (err) {
    console.error("Get weight stats error:", err);
    res.status(500).json({
      error: "Server error",
      details: "Failed to fetch weight statistics",
    });
  }
});

// ===============================
// COMBINED TRACKER SUMMARY
// ===============================

// Belirli bir tarih için tüm tracker verilerini al
router.get("/summary/:date", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { date } = req.params;

    // Su verileri
    const waterData = await db.query(
      `SELECT
          COALESCE(SUM(amount_ml), 0) as total_water,
          COUNT(*) as water_log_count
        FROM water_logs
        WHERE user_id = $1 AND entry_date = $2`,
      [userId, date]
    );

    // Kilo verisi (o gün kaydedilmişse)
    const weightData = await db.query(
      `SELECT weight_kg, bmi FROM weight_logs
       WHERE user_id = $1 AND logged_date = $2
       ORDER BY created_at DESC LIMIT 1`,
      [userId, date]
    );

    // Günlük hedefler (user_daily_data'dan)
    const dailyData = await db.query(
      `SELECT daily_water_goal FROM user_daily_data
       WHERE user_id = $1 AND date = $2`,
      [userId, date]
    );

    // Kullanıcı hedefleri (user_daily_targets'tan genel hedefler)
    const userTargets = await db.query(
      `SELECT water_target, goal_weight FROM user_daily_targets
       WHERE user_id = $1`,
      [userId]
    );

    const totalWater = parseInt(waterData.rows[0].total_water) || 0;
    // Prioritize daily_water_goal from user_daily_data
    const waterGoal =
      dailyData.rows[0]?.daily_water_goal ||
      userTargets.rows[0]?.water_target ||
      2500;

    res.json({
      success: true,
      date: date,
      data: {
        water: {
          consumed: totalWater,
          goal: waterGoal,
          percentage: Math.round((totalWater / waterGoal) * 100),
          remaining: Math.max(0, waterGoal - totalWater),
          logCount: parseInt(waterData.rows[0].water_log_count),
        },
        weight:
          weightData.rows.length > 0
            ? {
                weight: parseFloat(weightData.rows[0].weight_kg),
                bmi: weightData.rows[0].bmi
                  ? Math.round(parseFloat(weightData.rows[0].bmi) * 10) / 10
                  : null,
                logged: true,
              }
            : {
                logged: false,
                weight: null, // Explicitly null if not logged
                bmi: null, // Explicitly null if not logged
              },
        goals: {
          waterGoal: waterGoal,
          goalWeight: userTargets.rows[0]?.goal_weight || null,
        },
      },
    });
  } catch (err) {
    console.error("Get tracker summary error:", err);
    res.status(500).json({
      error: "Server error",
      details: "Failed to fetch tracker summary",
    });
  }
});

// Haftalık tracker özeti
router.get(
  "/summary/weekly/:startDate",
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.userId;
      const { startDate } = req.params;

      // Calculate end date for 7 days
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
      const endDateString = endDate.toISOString().split("T")[0];

      // Haftalık su verileri
      const weeklyWaterData = await db.query(
        `SELECT
          entry_date,
          SUM(amount_ml) as daily_water,
          COUNT(*) as daily_log_count
        FROM water_logs
        WHERE user_id = $1 AND entry_date >= $2 AND entry_date <= $3
        GROUP BY entry_date
        ORDER BY entry_date`,
        [userId, startDate, endDateString]
      );

      // Haftalık kilo verileri (her gün için en son kayıt)
      const weeklyWeightData = await db.query(
        `SELECT DISTINCT ON (logged_date)
          logged_date,
          weight_kg,
          bmi
        FROM weight_logs
        WHERE user_id = $1 AND logged_date >= $2 AND logged_date <= $3
        ORDER BY logged_date, created_at DESC`,
        [userId, startDate, endDateString]
      );

      // Kullanıcı hedefleri
      const userTargets = await db.query(
        `SELECT water_target, goal_weight FROM user_daily_targets
         WHERE user_id = $1`,
        [userId]
      );

      const waterTarget = userTargets.rows[0]?.water_target || 2500;
      const goalWeight = userTargets.rows[0]?.goal_weight || null;

      // Haftalık istatistikler hesapla
      const totalWaterWeek = weeklyWaterData.rows.reduce(
        (sum, day) => sum + parseInt(day.daily_water),
        0
      );
      const avgDailyWater =
        weeklyWaterData.rows.length > 0
          ? totalWaterWeek / weeklyWaterData.rows.length
          : 0; // Average based on active days, not always 7
      const waterGoalDays = weeklyWaterData.rows.filter(
        (day) => parseInt(day.daily_water) >= waterTarget
      ).length;

      let weightChange = null;
      if (weeklyWeightData.rows.length >= 2) {
        const firstWeight = parseFloat(weeklyWeightData.rows[0].weight_kg);
        const lastWeight = parseFloat(
          weeklyWeightData.rows[weeklyWeightData.rows.length - 1].weight_kg
        );
        weightChange = Math.round((lastWeight - firstWeight) * 10) / 10;
      }

      res.json({
        success: true,
        period: `${startDate} to ${endDateString}`,
        data: {
          water: {
            dailyData: weeklyWaterData.rows.map((day) => ({
              date: day.entry_date,
              amount: parseInt(day.daily_water),
              logCount: parseInt(day.daily_log_count),
              goalMet: parseInt(day.daily_water) >= waterTarget,
            })),
            summary: {
              totalWeekly: totalWaterWeek,
              avgDaily: Math.round(avgDailyWater),
              goalDays: waterGoalDays,
              consistency: Math.round((waterGoalDays / 7) * 100), // Consistency always out of 7 days
            },
          },
          weight: {
            dailyData: weeklyWeightData.rows.map((day) => ({
              date: day.logged_date,
              weight: parseFloat(day.weight_kg),
              bmi: day.bmi ? Math.round(parseFloat(day.bmi) * 10) / 10 : null,
            })),
            summary: {
              logsCount: weeklyWeightData.rows.length,
              weightChange: weightChange,
              trend:
                weightChange > 0.1
                  ? "increasing"
                  : weightChange < -0.1
                  ? "decreasing"
                  : "stable",
            },
          },
          goals: {
            waterTarget: waterTarget,
            goalWeight: goalWeight,
          },
        },
      });
    } catch (err) {
      console.error("Get weekly tracker summary error:", err);
      res.status(500).json({
        error: "Server error",
        details: "Failed to fetch weekly tracker summary",
      });
    }
  }
);

// ===============================
// BULK OPERATIONS
// ===============================

// Toplu su kaydı ekleme
router.post("/water/bulk", authenticateToken, async (req, res) => {
  const client = await db.beginTransaction(); // Start a transaction

  try {
    const userId = req.userId;
    const { entries } = req.body; // [{ amount, date, time }, ...]

    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      await db.rollbackTransaction(client); // Rollback
      return res.status(400).json({
        error: "Invalid entries data",
        details: "entries must be a non-empty array",
      });
    }

    if (entries.length > 50) {
      await db.rollbackTransaction(client); // Rollback
      return res.status(400).json({
        error: "Too many entries",
        details: "Maximum 50 entries can be added at once",
      });
    }

    const savedEntries = [];
    const errors = [];

    // Önce kullanıcının güncel su hedefini alalım
    const userTarget = await client.query(
      `SELECT water_target FROM user_daily_targets WHERE user_id = $1`,
      [userId]
    );
    const dailyWaterGoal = userTarget.rows[0]?.water_target || 2500; // Varsayılan değer

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];

      try {
        if (!entry.amount || entry.amount <= 0 || entry.amount > 2000) {
          errors.push({ index: i, error: "Invalid amount" });
          continue;
        }

        const entryDate = entry.date || new Date().toISOString().split("T")[0];
        const entryTime = entry.time || new Date().toISOString();

        // Su kaydını ekle
        const waterLog = await client.query(
          `INSERT INTO water_logs (user_id, amount_ml, entry_date, logged_at)
           VALUES ($1, $2, $3, $4) RETURNING *`,
          [userId, entry.amount, entryDate, entryTime]
        );

        savedEntries.push(waterLog.rows[0]);
      } catch (error) {
        errors.push({ index: i, error: error.message });
      }
    }

    // Günlük toplamları güncelle (tarih bazında grupla)
    const dateGroups = {};
    savedEntries.forEach((entry) => {
      const date = entry.entry_date;
      if (!dateGroups[date]) dateGroups[date] = 0;
      dateGroups[date] += entry.amount_ml;
    });

    for (const [date, totalAmount] of Object.entries(dateGroups)) {
      await client.query(
        `INSERT INTO user_daily_data (user_id, date, water_consumed, daily_water_goal)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id, date)
         DO UPDATE SET water_consumed = user_daily_data.water_consumed + $3,
                       daily_water_goal = COALESCE(user_daily_data.daily_water_goal, $4),
                       updated_at = NOW()`,
        [userId, date, totalAmount, dailyWaterGoal] // Use the goal fetched once
      );
    }

    await db.commitTransaction(client); // Commit the transaction

    res.status(201).json({
      success: true,
      data: {
        savedEntries: savedEntries,
        savedCount: savedEntries.length,
        totalRequested: entries.length,
        errors: errors,
      },
      message: `${savedEntries.length} water entries saved successfully`,
    });
  } catch (err) {
    await db.rollbackTransaction(client); // Rollback on any error
    console.error("Bulk add water logs error:", err);
    res.status(500).json({
      error: "Server error",
      details: "Failed to save water entries",
    });
  }
});

// ===============================
// TRACKER INSIGHTS & ANALYTICS
// ===============================

// Tracker insights (su ve kilo kombine analizi)
router.get("/insights", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { period = 30 } = req.query;

    const periodDays = Math.min(Math.max(parseInt(period), 7), 365);

    // Genel istatistikler
    const generalStats = await db.query(
      `SELECT
          COUNT(DISTINCT udd.date) as active_days,
          AVG(udd.water_consumed) as avg_daily_water,
          COUNT(wl.id) as total_weight_logs,
          COUNT(wtl.id) as total_water_logs
        FROM user_daily_data udd
        LEFT JOIN weight_logs wl ON udd.user_id = wl.user_id AND udd.date = wl.logged_date
        LEFT JOIN water_logs wtl ON udd.user_id = wtl.user_id AND udd.date = wtl.entry_date
        WHERE udd.user_id = $1 AND udd.date >= CURRENT_DATE - INTERVAL '${periodDays} days'`,
      [userId]
    );

    // Hedef başarı oranları
    const goalSuccess = await db.query(
      `SELECT
          COUNT(*) as total_days,
          COUNT(CASE WHEN udd.water_consumed >= udd.daily_water_goal THEN 1 END) as water_goal_days
        FROM user_daily_data udd
        WHERE user_id = $1 AND date >= CURRENT_DATE - INTERVAL '${periodDays} days'
        AND daily_water_goal IS NOT NULL`,
      [userId]
    );

    // Haftalık trendler
    const weeklyTrends = await db.query(
      `SELECT
          DATE_TRUNC('week', date) as week,
          AVG(water_consumed) as avg_water,
          COUNT(CASE WHEN water_consumed >= daily_water_goal THEN 1 END) as water_goal_success,
          COUNT(*) as total_days
        FROM user_daily_data
        WHERE user_id = $1 AND date >= CURRENT_DATE - INTERVAL '${Math.min(
          periodDays,
          84
        )} days'
        GROUP BY DATE_TRUNC('week', date) -- Corrected GROUP BY
        ORDER BY week DESC
        LIMIT 12`,
      [userId]
    );

    // En aktif günler (haftanın günleri)
    const dayOfWeekStats = await db.query(
      `SELECT
          EXTRACT(DOW FROM wtl.entry_date) as day_of_week,
          COUNT(*) as log_count,
          AVG(wtl.amount_ml) as avg_amount
        FROM water_logs wtl
        WHERE user_id = $1 AND entry_date >= CURRENT_DATE - INTERVAL '${Math.min(
          periodDays,
          30
        )} days'
        GROUP BY EXTRACT(DOW FROM wtl.entry_date)
        ORDER BY log_count DESC`,
      [userId]
    );

    const stats = generalStats.rows[0];
    const goals = goalSuccess.rows[0];

    // Haftalık su hedefi başarı oranı
    const waterSuccessRate =
      goals.total_days > 0
        ? Math.round(
            (parseInt(goals.water_goal_days) / parseInt(goals.total_days)) * 100
          )
        : 0;

    // Günlerin isimlerini getir
    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const dayStats = dayOfWeekStats.rows.map((day) => ({
      dayName: dayNames[parseInt(day.day_of_week)],
      logCount: parseInt(day.log_count),
      avgAmount: Math.round(day.avg_amount),
    }));

    res.json({
      success: true,
      period: `Last ${periodDays} days`,
      data: {
        overview: {
          activeDays: parseInt(stats.active_days) || 0,
          avgDailyWater: Math.round(stats.avg_daily_water) || 0,
          totalWeightLogs: parseInt(stats.total_weight_logs) || 0,
          totalWaterLogs: parseInt(stats.total_water_logs) || 0,
          waterGoalSuccessRate: waterSuccessRate,
        },
        trends: {
          weekly: weeklyTrends.rows.map((week) => ({
            week: week.week,
            avgWater: Math.round(week.avg_water),
            goalSuccessRate:
              parseInt(week.total_days) > 0
                ? Math.round(
                    (parseInt(week.water_goal_success) /
                      parseInt(week.total_days)) *
                      100
                  )
                : 0,
          })),
        },
        patterns: {
          mostActiveDay: dayStats.length > 0 ? dayStats[0].dayName : null,
          dayOfWeekStats: dayStats,
        },
        recommendations: generateRecommendations(
          waterSuccessRate,
          parseInt(stats.avg_daily_water),
          periodDays
        ),
      },
    });
  } catch (err) {
    console.error("Get tracker insights error:", err);
    res.status(500).json({
      error: "Server error",
      details: "Failed to fetch tracker insights",
    });
  }
});

// Öneriler oluşturma fonksiyonu
function generateRecommendations(waterSuccessRate, avgDailyWater, periodDays) {
  const recommendations = [];

  if (waterSuccessRate < 50) {
    recommendations.push({
      type: "water_goal",
      priority: "high",
      message:
        "You're meeting your water goal less than 50% of the time. Try setting reminders every 2 hours.",
      actionable: true,
    });
  }

  if (avgDailyWater < 1500) {
    recommendations.push({
      type: "hydration",
      priority: "high",
      message:
        "Your daily water intake is below recommended levels. Aim for at least 8 glasses per day.",
      actionable: true,
    });
  }

  if (waterSuccessRate >= 80) {
    recommendations.push({
      type: "achievement",
      priority: "low",
      message:
        "Excellent hydration habits! You're consistently meeting your water goals.",
      actionable: false,
    });
  }

  if (avgDailyWater > 0 && avgDailyWater < 2000) {
    recommendations.push({
      type: "improvement",
      priority: "medium",
      message:
        "Consider gradually increasing your water intake by 250ml per week to reach optimal hydration.",
      actionable: true,
    });
  }

  return recommendations;
}

module.exports = router;
